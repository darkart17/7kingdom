# 프로젝트 폴더 구조

## 현재 구조 (리팩토링 후)

```
d:\3x3\
├── index.html              # 메인 (타이틀, 메뉴, 시나리오)
├── style.css
├── engine.js
│
├── src/
│   └── battle/             # 퍼즐 배틀 (기존 3x3)
│       ├── index.html
│       ├── style.css
│       ├── game.js
│       ├── stages.js
│       ├── dungeonStages.js
│       └── assets/         # 배틀 전용 (boss, BGM, SFX)
│
├── assets/                 # 리소스 통합
│   ├── images/             # 캐릭터, 배경 (기존 image/)
│   │   ├── lily/
│   │   ├── mio/
│   │   ├── maya/
│   │   └── main/
│   └── sound/
│       └── store/          # 상점 음성
│
├── data/
│   ├── config/
│   │   └── paths.js        # 경로 설정
│   ├── characters.js
│   ├── shop.js
│   ├── gameStorage.js
│   └── lily.js, mio.js ... # 캐릭터별 시나리오
│
└── docs/
    └── (VOICE_FILES.md 등)
```

## 경로 규칙

- **메인(index.html 기준)**: `assets/images/`, `assets/sound/`
- **배틀(src/battle/ 기준)**  
  - **배틀 전용(캐릭터 무관)**: `src/battle/assets/`  
    - `assets/blocks/`: 블록 아이콘  
    - `assets/sound/`: BGM, 블록/보스/히어로 공용 효과음  
  - **시나리오별 몬스터/사운드**: `../../assets/images/{캐릭터}/`, `../../assets/sound/{캐릭터}/`  
    - 예: Lily 시나리오 → `assets/images/lily/`, `assets/sound/lily/`

## 캐릭터/스테이지 추가 시

- 캐릭터: `data/캐릭터.js` 추가 후 `data/characters.js`에 등록
- 스테이지: `src/battle/stages.js` 또는 `dungeonStages.js` 수정
- 이미지: `assets/images/캐릭터명/` 하위에 배치
