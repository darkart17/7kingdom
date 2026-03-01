# UI 버튼 효과음

`assets/sound/ui/` 폴더에 아래 파일을 넣어주세요.

## 파일 목록

| 파일명 | 용도 |
|--------|------|
| click.mp3 | 버튼 클릭 (메인, 에피소드, 상점, 던전, 배틀 등 모든 버튼) |
| touch.mp3 | 터치하기 버튼 (캐릭터 터치 반응) |
| heart.mp3 | 하트 버튼 (캐릭터 5회 터치 시) |

## 폴더 구조

```
assets/sound/
├── ui/
│   ├── README.md
│   ├── click.mp3      ← 버튼 클릭
│   ├── touch.mp3      ← 터치하기
│   └── heart.mp3      ← 하트 반응
├── store/
│   ├── shop_purchase.mp3        ← 업그레이드 상점 구매
│   ├── gold_shop_purchase.mp3   ← 비밀 상점 구매
│   └── (음성 파일들)
└── gold_dungeon/
    └── ...
```

## 설정

경로는 `data/config/paths.js`의 `window.SOUND_PATHS`에 정의되어 있습니다.
파일이 없으면 기존처럼 톤(오실레이터)으로 재생됩니다.
