<div align="center">

# 🎤 Discord 임시 음성채널 봇

**Discord에서 임시 음성채널을 자동으로 생성하고 관리하는 봇**

[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.0+-blue.svg)](https://discord.js.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[기능 소개](#-기능) • [설치 가이드](#-설치-및-설정) • [사용법](#-사용법) • [문제 해결](#-문제-해결)

</div>

---

## 📋 목차

- [기능](#-기능)
- [미리보기](#-미리보기)
- [설치 및 설정](#-설치-및-설정)
- [사용법](#-사용법)
- [슬래시 명령어](#-슬래시-명령어)
- [채널 설정 기능](#-채널-설정-기능)
- [프로젝트 구조](#-프로젝트-구조)
- [문제 해결](#-문제-해결)
- [기여하기](#-기여하기)
- [라이센스](#-라이센스)

## ✨ 기능

### 🎯 핵심 기능
- **🔧 간편한 설정**: 슬래시 명령어로 간단하게 트리거 채널 설정
- **⚡ 자동 생성**: 설정된 채널 입장 시 개인 음성방 즉시 생성
- **🗑️ 자동 정리**: 빈 임시 채널 자동 삭제로 서버 정리
- **👑 권한 관리**: 채널 생성자에게 전체 관리 권한 부여
- **🔒 고급 설정**: 이름 변경, 인원 제한, 공개/비공개, 잠금 기능
- **🔄 복구 기능**: 봇 재시작 시 기존 임시 채널 자동 복구
- **🌐 멀티 서버**: 서버별 독립적인 설정 관리

### 🛡️ 보안 및 안정성
- **✅ 권한 확인**: 관리자만 설정 변경 가능
- **💾 데이터 저장**: 서버별 설정 자동 저장/복구
- **🚫 오류 방지**: 잘못된 설정 방지 및 사용자 가이드

## 🖼️ 미리보기

### 설정 명령어
```
/음성방생성채널등록 등록:#음성채널-만들기
✅ #음성채널-만들기 채널이 임시 음성방 생성 채널로 등록되었습니다!
이제 이 채널에 입장하면 개인 음성방이 자동으로 생성됩니다.
```

### 채널 설정 UI
```
🎤 임시 음성채널 설정
현재 이름은: 홍길동님의 방 입니다

통화방 설정을 변경하고싶으시면 아래 버튼을 눌러 변경하시기 바랍니다

📍 현재 설정
이름: 홍길동님의 방
인원제한: 무제한명
상태: 🔓 열림
접근: 🌐 공개

[✏️ 방이름변경] [👥 인원제한변경] [🌐 채널잠김] [🔒 잠금]
```

## 🚀 설치 및 설정

### 📋 요구사항
- **Node.js**: 18.0 이상
- **Discord Bot**: 개발자 포털에서 생성된 봇
- **서버 권한**: 채널 관리, 멤버 이동 권한

### ⚡ 빠른 시작

1. **저장소 클론**
   ```bash
   git clone https://github.com/yourusername/discord-voice-bot.git
   cd discord-voice-bot
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열어 봇 토큰 입력
   ```

4. **봇 실행**
   ```bash
   npm start
   ```

### 🔑 Discord 봇 설정

#### 1. 봇 생성
1. [Discord Developer Portal](https://discord.com/developers/applications) 접속
2. **"New Application"** → 애플리케이션 이름 입력
3. **"Bot"** 탭 → **"Add Bot"** 클릭
4. **Token** 복사 → `.env` 파일의 `DISCORD_TOKEN`에 입력

#### 2. 권한 설정
**Privileged Gateway Intents**에서 활성화:
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

#### 3. 봇 초대
**OAuth2 → URL Generator**에서 다음 권한 선택:
- ✅ `bot` (Scopes)
- ✅ `Manage Channels` (채널 관리)
- ✅ `Move Members` (멤버 이동)
- ✅ `Connect` (연결)
- ✅ `View Channels` (채널 보기)
- ✅ `Use Slash Commands` (슬래시 명령어 사용)

### ⚙️ 환경변수 설정

```env
# Discord Bot Token (필수)
DISCORD_TOKEN=your_bot_token_here

# Guild ID (선택사항 - 개발용)
GUILD_ID=your_guild_id_here
```

## 📖 사용법

### 1️⃣ 기본 설정
```bash
# 봇 실행
npm start

# Discord에서 설정
/음성방생성채널등록 등록:#원하는-음성채널
```

### 2️⃣ 임시 채널 사용
1. **입장**: 설정된 채널에 입장
2. **생성**: `[사용자명]님의 방` 자동 생성 및 이동
3. **설정**: 채널 설정 UI로 커스터마이징
4. **정리**: 채널이 비면 자동 삭제

### 3️⃣ 고급 설정
- **이름 변경**: 원하는 방 이름으로 변경
- **인원 제한**: 최대 참가 인원 설정 (0 = 무제한)
- **접근 제어**: 공개/비공개 전환
- **잠금**: 모든 설정 변경 비활성화

## 💬 슬래시 명령어

| 명령어 | 설명 | 권한 |
|--------|------|------|
| `/음성방생성채널등록` | 임시 음성방 생성 트리거 채널 등록 | 채널 관리 |
| `/음성방생성채널해제` | 등록된 생성 채널 해제 | 채널 관리 |
| `/음성방생성채널확인` | 현재 등록된 생성 채널 확인 | 모든 사용자 |

### 상세 사용법

#### 📝 채널 등록
```
/음성방생성채널등록 등록:[음성채널]
```
- **매개변수**: `등록` - 트리거로 사용할 음성 채널
- **권한**: 채널 관리 권한 필요
- **결과**: 해당 채널이 임시 방 생성 트리거로 설정

#### 🗑️ 채널 해제
```
/음성방생성채널해제
```
- **권한**: 채널 관리 권한 필요
- **결과**: 현재 등록된 트리거 채널 해제

#### 📋 설정 확인
```
/음성방생성채널확인
```
- **권한**: 모든 사용자
- **결과**: 현재 등록된 트리거 채널 정보 표시

## 🎮 채널 설정 기능

### ✏️ 방 이름 변경
- **기능**: 채널 이름을 원하는 대로 변경
- **예시**: "게임방", "공부방", "잡담방"
- **제한**: 1-100자, Discord 채널명 규칙 준수

### 👥 인원 제한 변경
- **기능**: 채널 최대 참가 인원 설정
- **범위**: 0-99명 (0 = 무제한)
- **효과**: 설정 인원 초과 시 입장 불가

### 🔐 공개/비공개 전환
- **공개 (🌐)**: 서버의 모든 멤버가 참가 가능
- **비공개 (🔐)**: 현재 채널에 있는 멤버만 참가 가능
- **용도**: 프라이빗 회의, 소규모 모임

### 🔒 채널 잠금
- **효과**: 모든 설정 변경 비활성화
- **주의**: 잠금 후 해제 불가능
- **용도**: 설정 완료 후 실수 방지

## 🏗️ 프로젝트 구조

```
discord-voice-bot/
├── 📄 package.json                    # 프로젝트 설정 및 의존성
├── 🚀 index.js                       # 메인 봇 파일
├── 🔧 .env.example                   # 환경변수 템플릿
├── 📚 README.md                      # 프로젝트 문서
├── 🚫 .gitignore                     # Git 제외 파일
└── 📁 modules/                       # 기능 모듈
    ├── 💬 commands.js                # 슬래시 명령어 정의
    ├── ⚙️ commandHandler.js          # 명령어 처리 로직
    ├── 🎤 voiceHandler.js            # 음성 상태 및 채널 관리
    ├── 🔧 botSetup.js                # 봇 초기화 및 설정
    └── 💾 createChannels.json        # 서버별 설정 저장
```

### 📦 모듈 설명

#### 🎤 [`voiceHandler.js`](modules/voiceHandler.js)
- 음성 상태 변화 감지 및 처리
- 임시 채널 생성/삭제 로직
- 채널 설정 UI 및 상호작용 처리

#### ⚙️ [`commandHandler.js`](modules/commandHandler.js)
- 슬래시 명령어 처리
- 권한 확인 및 데이터 관리
- 서버별 설정 저장/로드

#### 💬 [`commands.js`](modules/commands.js)
- Discord API용 슬래시 명령어 정의
- 매개변수 및 옵션 설정

#### 🔧 [`botSetup.js`](modules/botSetup.js)
- 봇 초기화 및 명령어 등록
- 기존 임시 채널 복구
- 이벤트 리스너 설정

## 🔧 문제 해결

### ❌ 일반적인 문제

#### 봇이 시작되지 않는 경우
```bash
# 1. 환경변수 확인
cat .env

# 2. 토큰 유효성 검사
# Discord Developer Portal에서 토큰 재생성

# 3. 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 채널이 생성되지 않는 경우
1. **봇 권한 확인**
   - 채널 관리 권한 ✅
   - 멤버 이동 권한 ✅
   - 연결 권한 ✅

2. **설정 상태 확인**
   ```
   /음성방생성채널확인
   ```

3. **채널 위치 확인**
   - 트리거 채널이 음성 채널인지 확인
   - 봇이 해당 채널을 볼 수 있는지 확인

#### 채널이 삭제되지 않는 경우
1. **권한 재확인**: 봇의 채널 관리 권한
2. **로그 확인**: 콘솔에서 오류 메시지 확인
3. **수동 정리**: 봇 재시작으로 자동 정리 실행

### 🐛 디버깅

#### 로그 활성화
```javascript
// index.js에 추가
client.on('debug', console.log);
```

#### 자세한 오류 정보
```bash
# 개발 모드로 실행
NODE_ENV=development npm start
```

### 📞 지원

문제가 지속되는 경우:
1. **Issue 생성**: [GitHub Issues](https://github.com/yourusername/discord-voice-bot/issues)
2. **로그 첨부**: 오류 메시지 및 상황 설명
3. **환경 정보**: Node.js 버전, OS 정보

## 🤝 기여하기

### 🔄 개발 워크플로우

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/discord-voice-bot.git
   cd discord-voice-bot
   ```

2. **브랜치 생성**
   ```bash
   git checkout -b feature/새로운-기능
   ```

3. **개발 & 테스트**
   ```bash
   npm run dev
   ```

4. **커밋 & 푸시**
   ```bash
   git commit -m "feat: 새로운 기능 추가"
   git push origin feature/새로운-기능
   ```

5. **Pull Request 생성**

### 📝 기여 가이드라인

- **코딩 스타일**: ESLint 규칙 준수
- **커밋 메시지**: [Conventional Commits](https://conventionalcommits.org/) 형식
- **테스트**: 새로운 기능에 대한 테스트 코드 작성
- **문서**: README 및 코드 주석 업데이트

### 💡 기여 아이디어

- 🌍 다국어 지원
- 📊 사용 통계 기능
- 🎨 커스텀 템플릿
- 🔔 알림 기능
- 📱 모바일 최적화

## 📄 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE) 하에 배포됩니다.

```
MIT License

Copyright (c) 2025 KucoSang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 별표를 눌러주세요!**

[🐛 버그 신고](https://github.com/yourusername/discord-voice-bot/issues) • [💡 기능 제안](https://github.com/yourusername/discord-voice-bot/issues) • [📖 문서](https://github.com/yourusername/discord-voice-bot/wiki)

</div>
