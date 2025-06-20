const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 모듈 임포트
const { handleCommands, loadCreateChannels } = require('./modules/commandHandler');
const { handleVoiceStateUpdate, handleButtonInteraction, handleModalSubmit } = require('./modules/voiceHandler');
const { initializeBot, setupEventListeners } = require('./modules/botSetup');

// Discord 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 봇이 준비되었을 때
client.once('ready', async () => {
    loadCreateChannels(); // 저장된 생성 채널 데이터 로드
    await initializeBot(client);
});

// 상호작용 처리 (슬래시 명령어, 버튼, 모달)
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleCommands(interaction);
    } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
    }
});

// 음성 상태 업데이트 처리
client.on('voiceStateUpdate', async (oldState, newState) => {
    await handleVoiceStateUpdate(oldState, newState);
});

// 이벤트 리스너 설정
setupEventListeners(client);

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);