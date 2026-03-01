# 에셋 경로 체크리스트

배틀/시나리오가 참조하는 경로와 필요한 파일 목록입니다.  
(배틀 iframe 기준: `src/battle/index.html` → 상대 경로 `assets/` = `src/battle/assets/`, `../../` = 프로젝트 루트)

**주의**: `src/battle/blocks/` 폴더가 있어도, **코드는 `src/battle/assets/blocks/`만 참조**합니다. 블록 이미지는 반드시 `src/battle/assets/blocks/` 아래에 두세요.

---

## 1. 배틀 전용 (src/battle/assets/)

| 경로 | 용도 | 필수 |
|------|------|------|
| `assets/blocks/` (실제: `src/battle/assets/blocks/`) | 블록 아이콘 전부 (배틀 그리드 + **메인 보관함·상점** 동일 경로 사용) | ✅ |
| `assets/blocks/sword_1.png` ~ `sword_5.png` | 검 블록 | ✅ |
| `assets/blocks/shield_1.png` ~ `shield_5.png` | 방패 블록 | ✅ |
| `assets/blocks/magic_1.png` ~ `magic_5.png` | 마법 블록 | ✅ |
| `assets/blocks/potion_1.png` ~ `potion_5.png` | 물약 블록 | ✅ |
| `assets/blocks/sword_special.png` | 스킬 아이콘 | ✅ |
| `assets/sound/bgm.mp3` | BGM | ✅ |
| `assets/sound/bs_boss_start.mp3` | 보스 등장 | ✅ |
| `assets/sound/block_down.mp3`, `block_sw.mp3`, `block_mg.mp3`, `block_po.mp3`, `block_sd.mp3`, `block_cr.mp3`, `block_sd_ok.mp3` | 블록 효과음 | ✅ |
| `assets/sound/ch_dem.mp3` | 캐릭터 피격 | ✅ |
| `assets/sound/skill.mp3`, `come_asura.mp3`, `bs_asura.mp3` | 스킬 | ✅ |
| `assets/sound/boss_wr.mp3`, `boss_att.mp3`, `bs_boss_last.mp3` | 보스 | ✅ |
| `assets/sound/bs_ch_att_01.mp3`, `bs_ch_dem_01.mp3`, `bs_boss_dem_01.mp3` | 히어로/보스 기본 | ✅ |
| `assets/game_bg.jpg` | 기본 배경 | 선택 |
| `assets/default_boss.png` | 기본 보스 (스테이지 미지정) | 선택 |
| `assets/success.png`, `assets/fail.png` | 기본 승/패 결과 이미지 | 선택 |

---

## 2. 배틀 결과음 (src/battle/assets/sound/)

| 경로 | 용도 |
|------|------|
| `assets/sound/result_win.mp3` | 승리 시 |
| `assets/sound/result_lose.mp3` | 패배 시 |

(배틀 iframe 기준이므로 실제 경로 = `src/battle/assets/sound/`)

## 2-2. 몬스터별 스킬/효과음 (해당 몬스터 폴더)

| 경로 | 용도 |
|------|------|
| `assets/sound/gold_dungeon/d8/spirit_bomb.mp3` | 황금의 무녀(d8) — 스피릿 밤 |

---

## 3. 시나리오 – Lily (assets/images/lily, assets/sound/lily)

| 경로 | 용도 |
|------|------|
| `assets/images/lily/mon_01.png`, `mon_02.png`, `mon_03.png` | 전투 보스 이미지 |
| `assets/images/lily/bg_001.jpg`, `bg_006.jpg`, `bg_009.jpg` | 배경 |
| `assets/images/lily/lily_00.png`, `lily_02.png`, `lily_06.png` | 승리 결과 캐릭터 |
| `assets/sound/lily/mon_01_dem.mp3`, `mon_02_dem.mp3`, `mon_03_dem.mp3` | 보스 피격음 |

---

## 4. 골드 던전 (dungeonStages.js)

**규칙**: 해당 몬스터 관련 사운드(피격음, 스킬 효과음 등)는 **그 몬스터 폴더**에 둡니다. (d1/, d2/, d3/ …)

| 경로 | 용도 |
|------|------|
| `assets/images/gold_dungeon/bg_main.jpg` | 던전 선택 배경 |
| `assets/images/gold_dungeon/d1/` ~ `d9/`: `bg.jpg`, `monster.png`, `intro.png` 등 | 던전별 이미지 |
| `assets/sound/gold_dungeon/coin.mp3` | 코인 사운드 (공용) |
| `assets/sound/gold_dungeon/d1/dem.mp3` ~ `d9/dem.mp3` | 던전별 보스 피격음 (몬스터 폴더) |
| `assets/sound/gold_dungeon/d3/shield_adsorb.mp3` | d3 몬스터 스킬: 방패 흡수 |
| `assets/sound/gold_dungeon/d8/spirit_bomb.mp3` | d8 황금의 무녀 — 스피릿 밤 |

---

## 5. 기타 (메인/배틀 공용)

| 경로 | 용도 |
|------|------|
| `assets/images/main/coin.png` | 골드 던전 골드 아이콘 |

---

코드에서 위 경로를 그대로 참조합니다. 실제 파일이 이 경로에 있는지만 확인하면 됩니다.
