# 골드 던전 이미지

## 메인 선택 화면

| 파일명 | 용도 |
|--------|------|
| `bg_main.jpg` | 골드 던전 선택 화면 배경 |

## 던전별 이미지 (d1 ~ d9)

각 던전 폴더(d1~d9)에 아래 파일을 넣어주세요.

| 파일명 | 용도 |
|--------|------|
| `bg.jpg` | 전투 배경, 인트로 배경, 던전 목록 썸네일 |
| `monster.png` | 보스 몬스터 이미지 (전투/승패 화면) |
| `intro.png` | 인트로 대사 시 캐릭터 이미지 |

## 폴더 구조

```
assets/images/gold_dungeon/
├── README.md
├── bg_main.jpg          ← 골드 던전 메인 배경
├── d1/                  ← 골드 슬라임
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d2/                  ← 웨어 울프
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d3/                  ← 스켈레톤 전사
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d4/                  ← 아라크네
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d5/                  ← 고대의 수호자
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d6/                  ← 리미아
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d7/                  ← 미노타우르스
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
├── d8/                  ← 황금의 무녀
│   ├── bg.jpg
│   ├── monster.png
│   └── intro.png
└── d9/                  ← 골드 드래곤 - 엘도라
    ├── bg.jpg
    ├── monster.png
    └── intro.png
```

## 권장 크기

- bg.jpg, bg_main.jpg: 1080×1920 또는 16:9 비율
- monster.png: 보스 크기 (scale로 조정, 336px 기준)
- intro.png: 대사 시 캐릭터 (하단 정렬)
