const { SlashCommandBuilder, ChannelType } = require('discord.js');

// 슬래시 명령어 정의
const commands = [
    new SlashCommandBuilder()
        .setName('음성방생성채널등록')
        .setDescription('임시 음성방을 생성할 트리거 채널을 등록합니다')
        .addChannelOption(option =>
            option.setName('등록')
                .setDescription('임시 음성방 생성 트리거로 사용할 음성 채널')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
        ),
    new SlashCommandBuilder()
        .setName('음성방생성채널해제')
        .setDescription('등록된 임시 음성방 생성 채널을 해제합니다'),
    new SlashCommandBuilder()
        .setName('음성방생성채널확인')
        .setDescription('현재 등록된 임시 음성방 생성 채널을 확인합니다')
];

module.exports = commands;