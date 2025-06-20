const { ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 서버별 생성 채널을 저장하는 Map
const createChannels = new Map();

// 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'createChannels.json');

// 데이터 로드
function loadCreateChannels() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            Object.entries(data).forEach(([guildId, channelId]) => {
                createChannels.set(guildId, channelId);
            });
            console.log('생성 채널 데이터를 로드했습니다.');
        }
    } catch (error) {
        console.error('생성 채널 데이터 로드 중 오류:', error);
    }
}

// 데이터 저장
function saveCreateChannels() {
    try {
        const data = Object.fromEntries(createChannels);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('생성 채널 데이터 저장 중 오류:', error);
    }
}

/**
 * 슬래시 명령어 처리 핸들러
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleCommands(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === '음성방생성채널등록') {
        await handleRegisterChannel(interaction);
    }
    else if (commandName === '음성방생성채널해제') {
        await handleUnregisterChannel(interaction);
    }
    else if (commandName === '음성방생성채널확인') {
        await handleCheckChannel(interaction);
    }
}

/**
 * 음성방 생성 채널 등록 처리
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleRegisterChannel(interaction) {
    // 관리자 권한 확인
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: '❌ 이 명령어를 사용하려면 **채널 관리** 권한이 필요합니다.',
            ephemeral: true
        });
    }

    const channel = interaction.options.getChannel('등록');
    
    if (channel.type !== ChannelType.GuildVoice) {
        return interaction.reply({
            content: '❌ 음성 채널만 등록할 수 있습니다.',
            ephemeral: true
        });
    }

    createChannels.set(interaction.guild.id, channel.id);
    saveCreateChannels(); // 데이터 저장
    
    await interaction.reply({
        content: `✅ **${channel.name}** 채널이 임시 음성방 생성 채널로 등록되었습니다!\n이제 이 채널에 입장하면 개인 음성방이 자동으로 생성됩니다.`,
        ephemeral: false
    });
    
    console.log(`음성방 생성 채널 등록: ${channel.name} (서버: ${interaction.guild.name})`);
}

/**
 * 음성방 생성 채널 해제 처리
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleUnregisterChannel(interaction) {
    // 관리자 권한 확인
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({
            content: '❌ 이 명령어를 사용하려면 **채널 관리** 권한이 필요합니다.',
            ephemeral: true
        });
    }

    if (createChannels.has(interaction.guild.id)) {
        createChannels.delete(interaction.guild.id);
        saveCreateChannels(); // 데이터 저장
        await interaction.reply({
            content: '✅ 임시 음성방 생성 채널이 해제되었습니다.',
            ephemeral: false
        });
        console.log(`음성방 생성 채널 해제 (서버: ${interaction.guild.name})`);
    } else {
        await interaction.reply({
            content: '❌ 등록된 임시 음성방 생성 채널이 없습니다.',
            ephemeral: true
        });
    }
}

/**
 * 음성방 생성 채널 확인 처리
 * @param {Interaction} interaction - Discord 상호작용 객체
 */
async function handleCheckChannel(interaction) {
    const channelId = createChannels.get(interaction.guild.id);
    
    if (channelId) {
        const channel = interaction.guild.channels.cache.get(channelId);
        if (channel) {
            await interaction.reply({
                content: `📋 현재 등록된 임시 음성방 생성 채널: **${channel.name}**`,
                ephemeral: true
            });
        } else {
            createChannels.delete(interaction.guild.id);
            await interaction.reply({
                content: '❌ 등록된 채널이 삭제되었습니다. 다시 등록해주세요.',
                ephemeral: true
            });
        }
    } else {
        await interaction.reply({
            content: '❌ 등록된 임시 음성방 생성 채널이 없습니다.\n`/음성방생성채널등록` 명령어를 사용하여 채널을 등록해주세요.',
            ephemeral: true
        });
    }
}

/**
 * 등록된 생성 채널 ID 가져오기
 * @param {string} guildId - 서버 ID
 * @returns {string|undefined} 채널 ID
 */
function getCreateChannelId(guildId) {
    return createChannels.get(guildId);
}

module.exports = {
    handleCommands,
    getCreateChannelId,
    loadCreateChannels
};