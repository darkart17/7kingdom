# 배틀 전용 에셋 (캐릭터 무관)

캐릭터/시나리오와 관계없이 **순수 배틀**에서만 쓰는 리소스만 둡니다.

## 폴더 구조

```
src/battle/assets/
├── blocks/          # 블록 아이콘 (sword, shield, magic, potion 1~5단계 + special)
├── sound/           # BGM, 블록/보스/히어로 공용 효과음
├── game_bg.jpg      # (선택) 기본 배경
├── default_boss.png # (선택) 스테이지 미지정 시 기본 보스 이미지
├── success.png      # (선택) 기본 승리 결과 이미지
├── fail.png         # (선택) 기본 패배 결과 이미지
└── README.md        # 이 파일
```

## blocks/

- 파일명: `sword_1.png` ~ `sword_5.png`, `shield_1.png` ~ `shield_5.png`,  
  `magic_1.png` ~ `magic_5.png`, `potion_1.png` ~ `potion_5.png`, `sword_special.png`
- **이동**: 프로젝트 루트 `assets/images/blocks/` 에 있던 파일들을 이 폴더로 옮기면 됩니다.

## sound/

배틀 공용 사운드만 둡니다. 아래 파일들을 이 폴더로 옮깁니다.

| 파일명 | 용도 |
|--------|------|
| bgm.mp3 | 배틀 BGM |
| bs_boss_start.mp3 | 보스 등장 |
| block_down.mp3, block_sw.mp3, block_mg.mp3, block_po.mp3, block_sd.mp3, block_cr.mp3, block_sd_ok.mp3 | 블록 매칭/드롭 |
| ch_dem.mp3 | 캐릭터 피격 |
| skill.mp3, come_asura.mp3, bs_asura.mp3 | 스킬 |
| boss_wr.mp3, boss_att.mp3, bs_boss_last.mp3 | 보스 경고/공격/처치 |
| bs_ch_att_01.mp3, bs_ch_dem_01.mp3, bs_boss_dem_01.mp3 | 히어로 공격/피격, 보스 피격(기본) |
| result_win.mp3, result_lose.mp3 | 배틀 결과 (이 폴더) |
| (spirit_bomb는 황금의 무녀 몬스터 폴더: assets/sound/gold_dungeon/d8/) |

---

## 시나리오별 몬스터/사운드 (여기 아님)

**시나리오 전용** 몬스터 이미지·효과음은 **캐릭터 폴더**에 둡니다.

- **이미지**: `assets/images/{캐릭터명}/`  
  예: `assets/images/lily/mon_01.png`, `bg_001.jpg`, `lily_00.png` 등
- **사운드**: `assets/sound/{캐릭터명}/`  
  예: `assets/sound/lily/mon_01_dem.mp3`, `mon_02_dem.mp3`, `mon_03_dem.mp3`

스테이지 설정은 `stages.js`에서 위 경로를 참조합니다.

골드 던전은 `assets/images/gold_dungeon/`, `assets/sound/gold_dungeon/` 사용.  
**각 몬스터 관련 사운드**(피격음, 스킬 효과음 등)는 **해당 몬스터 폴더**에 둡니다.  
예: d3 방패 흡수 → `assets/sound/gold_dungeon/d3/shield_adsorb.mp3`, d1 피격 → `d1/dem.mp3`
