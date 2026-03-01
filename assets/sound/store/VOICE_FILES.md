# 상점 음성 파일 목록

`sound/store/` 폴더에 아래 파일명으로 mp3를 넣어주세요.

## 업그레이드 상점 (미오)

| 파일명 | 말풍선 텍스트 | 재생 시점 |
|--------|---------------|-----------|
| `shop_default.mp3` | 어서오세요~ 무엇이 필요하신가요? | 입장 시 |
| `shop_leaveNoPurchase.mp3` | 구경만 하고 가는고야? | 구매 없이 나갈 때 |
| `shop_leaveAfterPurchase.mp3` | 다음에 또 오세요~ | 구매 후 나갈 때 |
| `shop_afterPurchase_1.mp3` | 아앙~ 멋져~ | 구매 완료 시 (랜덤 1) |
| `shop_afterPurchase_2.mp3` | 좋은 선택이야~ | 구매 완료 시 (랜덤 2) |
| `shop_touchReaction.mp3` | 자꾸 야한짓 하면 맞는다~!! | 3회 터치 시 |
| `shop_insufficientGold.mp3` | 어? 설마 돈이 없는거야? | 골드 부족 팝업 확인 시 |

## 비밀 상점 (마야)

| 파일명 | 말풍선 텍스트 | 재생 시점 |
|--------|---------------|-----------|
| `gold_default.mp3` | 어머? 애들은 오면 안되는데.. | 입장 시 |
| `gold_touchReaction.mp3` | 안돼..♡ 자꾸 그러면..♡ | 3회 터치 시 |
| `gold_afterPurchase.mp3` | 으흥~♡ 체력은 소중히 해야해~ | 구매 완료 시 |
| `gold_leaveAfterPurchase.mp3` | 우리... 자주 보게 될것 같네? | 구매 후 나갈 때 |
| `gold_leaveNoPurchase.mp3` | 체력을 더 길러와요~ | 구매 없이 나갈 때 |
| `gold_insufficientHp.mp3` | 어머... 그렇게 체력이 약해서야... | 체력 부족 팝업 확인 시 |

---

## 폴더 구조

```
sound/
└── store/
    ├── VOICE_FILES.md
    ├── shop_default.mp3
    ├── shop_leaveNoPurchase.mp3
    ├── shop_leaveAfterPurchase.mp3
    ├── shop_afterPurchase_1.mp3
    ├── shop_afterPurchase_2.mp3
    ├── shop_touchReaction.mp3
    ├── shop_insufficientGold.mp3
    ├── gold_default.mp3
    ├── gold_touchReaction.mp3
    ├── gold_afterPurchase.mp3
    ├── gold_leaveAfterPurchase.mp3
    ├── gold_leaveNoPurchase.mp3
    └── gold_insufficientHp.mp3
```
