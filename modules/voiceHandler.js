const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getCreateChannelId } = require('./commandHandler');

// 임시 채널을 추적하기 위한 Map
const tempChannels = new Map();

/**
 * 음성 상태 업데이트 처리 핸들러
 * @param {VoiceState} oldState - 이전 음성 상태
 * @param {VoiceState} newState - 새로운 음성 상태
 */
async function handleVoiceStateUpdate(oldState, newState) {
    // 사용자가 새로운 채널에 참가했을 때
    if (newState.channel) {
        await handleUserJoinChannel(newState);
    }

    // 사용자가 이전 채널을 떠났을 때
    if (oldState.channel) {
        await handleUserLeaveChannel(oldState);
    }
}

/**
 * 사용자가 채널에 참가했을 때 처리
 * @param {VoiceState} newState - 새로운 음성 상태
 */
async function handleUserJoinChannel(newState) {
    const createChannelId = getCreateChannelId(newState.guild.id);
    
    // 등록된 생성 채널에 참가했을 때
    if (newState.channel.id === createChannelId) {
        await createTempChannel(newState);
    }
}

/**
 * 사용자가 채널을 떠났을 때 처리
 * @param {VoiceState} oldState - 이전 음성 상태
 */
async function handleUserLeaveChannel(oldState) {
    // 임시 채널인지 확인 (Map에 있거나 이름 패턴으로 확인)
    const isTempChannel = tempChannels.has(oldState.channel.id) ||
                         oldState.channel.name.includes('님의 방');
    
    if (isTempChannel && oldState.channel.members.size === 0) {
        await deleteTempChannel(oldState.channel);
    }
}

/**
 * 임시 음성 채널 생성
 * @param {VoiceState} voiceState - 음성 상태
 */
async function createTempChannel(voiceState) {
    try {
        // 사용자의 임시 채널 생성
        const tempChannel = await voiceState.guild.channels.create({
            name: `${voiceState.member.displayName}님의 방`,
            type: ChannelType.GuildVoice,
            parent: voiceState.channel.parent,
            permissionOverwrites: [
                {
                    id: voiceState.guild.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
                },
                {
                    id: voiceState.member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.Connect,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.MoveMembers,
                        PermissionFlagsBits.MuteMembers,
                        PermissionFlagsBits.DeafenMembers
                    ],
                },
            ],
        });

        // 사용자를 새로 생성된 채널로 이동
        await voiceState.member.voice.setChannel(tempChannel);
        
        // 임시 채널을 Map에 저장 (소유자 정보)
        tempChannels.set(tempChannel.id, {
            ownerId: voiceState.member.id,
            channelId: tempChannel.id,
            isLocked: false,
            isPrivate: false
        });

        // 채널 설정 UI를 음성 채널 채팅에 전송
        await sendChannelControlUI(tempChannel, voiceState.member);

        console.log(`임시 채널 생성: ${tempChannel.name} (소유자: ${voiceState.member.displayName})`);
    } catch (error) {
        console.error('임시 채널 생성 중 오류:', error);
    }
}

/**
 * 임시 음성 채널 삭제
 * @param {VoiceChannel} channel - 삭제할 채널
 */
async function deleteTempChannel(channel) {
    try {
        await channel.delete();
        tempChannels.delete(channel.id);
        console.log(`임시 채널 삭제: ${channel.name}`);
    } catch (error) {
        console.error('임시 채널 삭제 중 오류:', error);
    }
}

/**
 * 기존 임시 채널들을 복구하고 빈 채널들을 정리
 * @param {Client} client - Discord 클라이언트
 */
async function cleanupEmptyTempChannels(client) {
    for (const guild of client.guilds.cache.values()) {
        const tempChannelsInGuild = guild.channels.cache.filter(channel =>
            channel.type === ChannelType.GuildVoice &&
            channel.name.includes('님의 방')
        );
        
        for (const channel of tempChannelsInGuild.values()) {
            try {
                if (channel.members.size === 0) {
                    // 빈 채널은 삭제
                    await channel.delete();
                    console.log(`기존 빈 임시 채널 정리: ${channel.name}`);
                } else {
                    // 사람이 있는 채널은 tempChannels Map에 복구
                    await restoreTempChannel(channel);
                }
            } catch (error) {
                console.error('채널 정리/복구 중 오류:', error);
            }
        }
    }
}

/**
 * 기존 임시 채널을 tempChannels Map에 복구
 * @param {VoiceChannel} channel - 복구할 채널
 */
async function restoreTempChannel(channel) {
    try {
        // 채널 권한을 분석하여 소유자 찾기
        const ownerOverwrite = channel.permissionOverwrites.cache.find(overwrite =>
            overwrite.type === 1 && // 사용자 타입
            overwrite.allow.has(PermissionFlagsBits.ManageChannels)
        );
        
        if (ownerOverwrite) {
            const ownerId = ownerOverwrite.id;
            
            // 채널 권한을 통해 비공개 상태 확인
            const everyoneOverwrite = channel.permissionOverwrites.cache.find(overwrite =>
                overwrite.id === channel.guild.id
            );
            const isPrivate = everyoneOverwrite && everyoneOverwrite.deny.has(PermissionFlagsBits.Connect);
            
            // tempChannels Map에 복구
            tempChannels.set(channel.id, {
                ownerId: ownerId,
                channelId: channel.id,
                isLocked: false, // 재시작 후에는 잠금 해제 상태로 복구
                isPrivate: isPrivate || false
            });
            
            console.log(`임시 채널 복구: ${channel.name} (소유자 ID: ${ownerId})`);
            
            // 채널에 현재 설정 UI 전송
            const owner = await channel.guild.members.fetch(ownerId).catch(() => null);
            if (owner) {
                await sendChannelControlUI(channel, owner);
            }
        }
    } catch (error) {
        console.error('임시 채널 복구 중 오류:', error);
    }
}

/**
 * 채널 설정 UI 전송
 * @param {VoiceChannel} voiceChannel - 음성 채널
 * @param {GuildMember} owner - 채널 소유자
 */
async function sendChannelControlUI(voiceChannel, owner) {
    const tempChannelData = tempChannels.get(voiceChannel.id);
    const isLocked = tempChannelData ? tempChannelData.isLocked : false;
    const isPrivate = tempChannelData ? tempChannelData.isPrivate : false;

    const embed = new EmbedBuilder()
        .setTitle('🎤 임시 음성채널 설정')
        .setDescription(`현재 이름은: **${voiceChannel.name}** 입니다\n\n통화방 설정을 변경하고싶으시면 아래 버튼을 눌러 변경하시기 바랍니다`)
        .setColor(isLocked ? 0xFF0000 : 0x5865F2)
        .addFields(
            { name: '📍 현재 설정', value: `**이름**: ${voiceChannel.name}\n**인원제한**: ${voiceChannel.userLimit || '무제한'}명\n**상태**: ${isLocked ? '🔒 잠김' : '🔓 열림'}\n**접근**: ${isPrivate ? '🔐 비공개' : '🌐 공개'}`, inline: false }
        )
        .setFooter({ text: `채널 소유자: ${owner.displayName}`, iconURL: owner.user.displayAvatarURL() })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`change_name_${voiceChannel.id}`)
                .setLabel('방이름변경')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✏️')
                .setDisabled(isLocked),
            new ButtonBuilder()
                .setCustomId(`change_limit_${voiceChannel.id}`)
                .setLabel('인원제한변경')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👥')
                .setDisabled(isLocked),
            new ButtonBuilder()
                .setCustomId(`toggle_privacy_${voiceChannel.id}`)
                .setLabel('채널잠김')
                .setStyle(isPrivate ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(isPrivate ? '🔐' : '🌐')
                .setDisabled(isLocked)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`lock_channel_${voiceChannel.id}`)
                .setLabel('잠금')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
                .setDisabled(isLocked)
        );

    await voiceChannel.send({ embeds: [embed], components: [row1, row2] });
}

/**
 * 버튼 상호작용 처리
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 */
async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    
    // 채널 ID 추출
    const channelId = customId.split('_').pop();
    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    
    if (!voiceChannel) {
        return await interaction.reply({ content: '❌ 음성 채널을 찾을 수 없습니다.', ephemeral: true });
    }

    const tempChannelData = tempChannels.get(channelId);
    if (!tempChannelData) {
        return await interaction.reply({ content: '❌ 채널 정보를 찾을 수 없습니다.', ephemeral: true });
    }

    // 잠금 관련 기능은 소유자만 사용 가능
    if (customId.startsWith('lock_channel_') || customId.startsWith('confirm_lock_') || customId.startsWith('cancel_lock_')) {
        if (tempChannelData.ownerId !== interaction.user.id) {
            return await interaction.reply({ content: '❌ 채널 소유자만 잠금 기능을 사용할 수 있습니다.', ephemeral: true });
        }
    }

    if (customId.startsWith('change_name_')) {
        await showNameChangeModal(interaction, channelId);
    } else if (customId.startsWith('change_limit_')) {
        await showLimitChangeModal(interaction, channelId);
    } else if (customId.startsWith('toggle_privacy_')) {
        await toggleChannelPrivacy(interaction, channelId);
    } else if (customId.startsWith('lock_channel_')) {
        await showLockConfirmation(interaction, channelId);
    } else if (customId.startsWith('confirm_lock_')) {
        await confirmChannelLock(interaction, channelId);
    } else if (customId.startsWith('cancel_lock_')) {
        await interaction.update({ content: '❌ 잠금이 취소되었습니다.', embeds: [], components: [] });
    }
}

/**
 * 이름 변경 모달 표시
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 * @param {string} channelId - 채널 ID
 */
async function showNameChangeModal(interaction, channelId) {
    const modal = new ModalBuilder()
        .setCustomId(`name_modal_${channelId}`)
        .setTitle('방 이름 변경');

    const nameInput = new TextInputBuilder()
        .setCustomId('new_name')
        .setLabel('새로운 방 이름을 입력하세요')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(100)
        .setPlaceholder('예: 게임방, 공부방, 잡담방 등...')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

/**
 * 인원제한 변경 모달 표시
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 * @param {string} channelId - 채널 ID
 */
async function showLimitChangeModal(interaction, channelId) {
    const modal = new ModalBuilder()
        .setCustomId(`limit_modal_${channelId}`)
        .setTitle('인원 제한 변경');

    const limitInput = new TextInputBuilder()
        .setCustomId('new_limit')
        .setLabel('인원 제한을 입력하세요 (1-99, 0은 무제한)')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder('예: 5, 10, 0 (무제한)')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(limitInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

/**
 * 채널 잠금 확인 메시지 표시
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 * @param {string} channelId - 채널 ID
 */
async function showLockConfirmation(interaction, channelId) {
    const embed = new EmbedBuilder()
        .setTitle('⚠️ 채널 잠금 경고')
        .setDescription('채널을 잠그면 **모든 설정 변경이 불가능**합니다.\n\n정말로 채널을 잠그시겠습니까?')
        .setColor(0xFF6B6B)
        .addFields(
            { name: '🔒 잠금 후 제한사항', value: '• 방 이름 변경 불가\n• 인원 제한 변경 불가\n• 채널잠김 변경 불가\n• 잠금 해제 불가', inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`confirm_lock_${channelId}`)
                .setLabel('예, 잠그겠습니다')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒'),
            new ButtonBuilder()
                .setCustomId(`cancel_lock_${channelId}`)
                .setLabel('취소')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌')
        );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

/**
 * 채널 공개/비공개 전환
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 * @param {string} channelId - 채널 ID
 */
async function toggleChannelPrivacy(interaction, channelId) {
    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    
    if (!voiceChannel) {
        return await interaction.reply({ content: '❌ 음성 채널을 찾을 수 없습니다.', ephemeral: true });
    }

    const tempChannelData = tempChannels.get(channelId);
    if (!tempChannelData) {
        return await interaction.reply({ content: '❌ 채널 정보를 찾을 수 없습니다.', ephemeral: true });
    }

    // 잠금 상태 확인
    if (tempChannelData.isLocked) {
        return await interaction.reply({ content: '🔒 채널이 잠겨있어 설정을 변경할 수 없습니다.', ephemeral: true });
    }

    try {
        const newPrivateState = !tempChannelData.isPrivate;
        
        if (newPrivateState) {
            // 비공개로 전환 - @everyone의 Connect 권한 제거
            await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.id, {
                Connect: false
            });
            await interaction.reply({ content: '🔐 채널이 **비공개**로 전환되었습니다.\n이제 이방인원만 이 통화방을 사용할 수 있습니다!', ephemeral: false });
        } else {
            // 공개로 전환 - @everyone의 Connect 권한 허용
            await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.id, {
                Connect: true
            });
            await interaction.reply({ content: '🌐 채널이 **공개**로 전환되었습니다.\n이제 누구나 채널에 참가할 수 있습니다.', ephemeral: false });
        }

        // 상태 업데이트
        tempChannelData.isPrivate = newPrivateState;
        tempChannels.set(channelId, tempChannelData);

        // UI 업데이트 - 실제 소유자 정보로 업데이트
        const owner = await interaction.guild.members.fetch(tempChannelData.ownerId);
        await updateChannelControlUI(voiceChannel, owner);

    } catch (error) {
        console.error('채널 공개/비공개 전환 중 오류:', error);
        await interaction.reply({ content: '❌ 설정 변경 중 오류가 발생했습니다.', ephemeral: true });
    }
}

/**
 * 채널 잠금 확인 처리
 * @param {ButtonInteraction} interaction - 버튼 상호작용
 * @param {string} channelId - 채널 ID
 */
async function confirmChannelLock(interaction, channelId) {
    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    
    if (!voiceChannel) {
        return await interaction.update({ content: '❌ 음성 채널을 찾을 수 없습니다.', embeds: [], components: [] });
    }

    const tempChannelData = tempChannels.get(channelId);
    if (!tempChannelData || tempChannelData.ownerId !== interaction.user.id) {
        return await interaction.update({ content: '❌ 채널 소유자만 잠금할 수 있습니다.', embeds: [], components: [] });
    }

    // 채널 잠금 상태 업데이트
    tempChannelData.isLocked = true;
    tempChannels.set(channelId, tempChannelData);

    await interaction.update({ content: '🔒 채널이 성공적으로 잠겼습니다.\n모든 설정 변경이 비활성화되었습니다.', embeds: [], components: [] });

    // UI 업데이트 - 실제 소유자 정보로 업데이트
    const owner = await interaction.guild.members.fetch(tempChannelData.ownerId);
    await updateChannelControlUI(voiceChannel, owner);
}

/**
 * 모달 제출 처리
 * @param {ModalSubmitInteraction} interaction - 모달 제출 상호작용
 */
async function handleModalSubmit(interaction) {
    const customId = interaction.customId;
    const channelId = customId.split('_').pop();
    const voiceChannel = interaction.guild.channels.cache.get(channelId);
    
    if (!voiceChannel) {
        return await interaction.reply({ content: '❌ 음성 채널을 찾을 수 없습니다.', ephemeral: true });
    }

    const tempChannelData = tempChannels.get(channelId);
    if (!tempChannelData) {
        return await interaction.reply({ content: '❌ 채널 정보를 찾을 수 없습니다.', ephemeral: true });
    }

    // 잠금 상태 확인
    if (tempChannelData.isLocked) {
        return await interaction.reply({ content: '🔒 채널이 잠겨있어 설정을 변경할 수 없습니다.', ephemeral: true });
    }

    try {
        if (customId.startsWith('name_modal_')) {
            const newName = interaction.fields.getTextInputValue('new_name');
            await voiceChannel.setName(newName);
            
            await interaction.reply({ content: `✅ 방 이름이 **${newName}**으로 변경되었습니다!`, ephemeral: false });
            
            // UI 업데이트 - 실제 소유자 정보로 업데이트
            const owner = await interaction.guild.members.fetch(tempChannelData.ownerId);
            await updateChannelControlUI(voiceChannel, owner);
            
        } else if (customId.startsWith('limit_modal_')) {
            const newLimitStr = interaction.fields.getTextInputValue('new_limit');
            const newLimit = parseInt(newLimitStr);
            
            if (isNaN(newLimit) || newLimit < 0 || newLimit > 99) {
                return await interaction.reply({ content: '❌ 올바른 숫자를 입력해주세요. (0-99, 0은 무제한)', ephemeral: true });
            }
            
            await voiceChannel.setUserLimit(newLimit);
            const limitText = newLimit === 0 ? '무제한' : `${newLimit}명`;
            await interaction.reply({ content: `✅ 인원 제한이 **${limitText}**으로 변경되었습니다!`, ephemeral: false });
            
            // UI 업데이트 - 실제 소유자 정보로 업데이트
            const owner = await interaction.guild.members.fetch(tempChannelData.ownerId);
            await updateChannelControlUI(voiceChannel, owner);
        }
    } catch (error) {
        console.error('채널 설정 변경 중 오류:', error);
        await interaction.reply({ content: '❌ 설정 변경 중 오류가 발생했습니다.', ephemeral: true });
    }
}

/**
 * 채널 설정 UI 업데이트
 * @param {VoiceChannel} voiceChannel - 음성 채널
 * @param {GuildMember} owner - 채널 소유자
 */
async function updateChannelControlUI(voiceChannel, owner) {
    const tempChannelData = tempChannels.get(voiceChannel.id);
    const isLocked = tempChannelData ? tempChannelData.isLocked : false;
    const isPrivate = tempChannelData ? tempChannelData.isPrivate : false;

    const embed = new EmbedBuilder()
        .setTitle('🎤 임시 음성채널 설정')
        .setDescription(`현재 이름은: **${voiceChannel.name}** 입니다\n\n통화방 설정을 변경하고싶으시면 아래 버튼을 눌러 변경하시기 바랍니다`)
        .setColor(isLocked ? 0xFF0000 : 0x5865F2)
        .addFields(
            { name: '📍 현재 설정', value: `**이름**: ${voiceChannel.name}\n**인원제한**: ${voiceChannel.userLimit || '무제한'}명\n**상태**: ${isLocked ? '🔒 잠김' : '🔓 열림'}\n**접근**: ${isPrivate ? '🔐 비공개' : '🌐 공개'}`, inline: false }
        )
        .setFooter({ text: `채널 소유자: ${owner.displayName}`, iconURL: owner.user.displayAvatarURL() })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`change_name_${voiceChannel.id}`)
                .setLabel('방이름변경')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✏️')
                .setDisabled(isLocked),
            new ButtonBuilder()
                .setCustomId(`change_limit_${voiceChannel.id}`)
                .setLabel('인원제한변경')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👥')
                .setDisabled(isLocked),
            new ButtonBuilder()
                .setCustomId(`toggle_privacy_${voiceChannel.id}`)
                .setLabel('채널잠김')
                .setStyle(isPrivate ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(isPrivate ? '🔐' : '🌐')
                .setDisabled(isLocked)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`lock_channel_${voiceChannel.id}`)
                .setLabel('잠금')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒')
                .setDisabled(isLocked)
        );

    // 기존 메시지들 중 최신 설정 메시지 찾기
    const messages = await voiceChannel.messages.fetch({ limit: 50 });
    const settingMessage = messages.find(msg =>
        msg.author.bot &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title === '🎤 임시 음성채널 설정'
    );

    if (settingMessage) {
        await settingMessage.edit({ embeds: [embed], components: [row1, row2] });
    }
}

module.exports = {
    handleVoiceStateUpdate,
    cleanupEmptyTempChannels,
    handleButtonInteraction,
    handleModalSubmit,
    restoreTempChannel
};