// window.BATTLE_STAGES[스테이지번호] 형태로 관리합니다.
//
// 시나리오별 몬스터/사운드: 해당 캐릭터 폴더 사용
//   이미지: ../../assets/images/{캐릭터}/ (전투용 몬스터=mon_XX.png, 승패 결과 등)
//   사운드: ../../assets/sound/{캐릭터}/ (보스 피격음 등)
// 배경(background): ../../assets/images/{캐릭터}/bg_XXX.jpg
// battle.bossDamageSound: ../../assets/sound/{캐릭터}/mon_XX_dem.ogg (false/null이면 무음)

const LILY_IMG = '../../assets/images/lily';
const LILY_SOUND = '../../assets/sound/lily';

window.BATTLE_STAGES = {
    "1": {
        id: 1,
        name: "Stage 1 - 주점 난동꾼",
        boss: {
            name: "주점 난동꾼",
            maxHp: 40,
            image: LILY_IMG + "/mon_01.png",
            background: LILY_IMG + "/bg_001.jpg",
            scale: 2.4,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: {
                dialogue: "꺼져! 다음에 보면 죽일 거다!",
                image: LILY_IMG + "/mon_01.png"
            },
            resultWin: {
                dialogue: "고.. 고맙습니다.",
                image: LILY_IMG + "/lily_00.png"
            }
        },
        battle: {
            movesPerAttack: 3,
            bossDamageMin: 3,
            bossDamageMax: 7,
            bossDamageSound: LILY_SOUND + "/mon_01_dem.ogg",
            skill: {
                chargeMax: 20,
                damageBase: 10,
                damageDesperation: 20,
                hpThresholdDesperation: 6,
                rangeBase: 0,
                rangeDesperation: 1
            }
        }
    },

    "2": {
        id: 2,
        name: "Stage 2 - 고블린 전사",
        boss: {
            name: "고블린 전사",
            maxHp: 80,
            image: LILY_IMG + "/mon_02.png",
            background: LILY_IMG + "/bg_009.jpg",
            scale: 2.4,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: {
                dialogue: "키에에! 약해! 청명석은 우리 거다!",
                image: LILY_IMG + "/mon_02.png"
            },
            resultWin: {
                dialogue: "절 위해서 이렇게 까지..",
                image: LILY_IMG + "/lily_02.png"
            }
        },
        battle: {
            movesPerAttack: 3,
            bossDamageMin: 5,
            bossDamageMax: 11,
            bossDamageSound: LILY_SOUND + "/mon_02_dem.ogg",
            skill: {
                chargeMax: 25,
                damageBase: 11,
                damageDesperation: 24,
                hpThresholdDesperation: 8,
                rangeBase: 0,
                rangeDesperation: 1
            }
        }
    },

    "3": {
        id: 3,
        name: "Stage 3 - 레드 고블린",
        boss: {
            name: "레드 고블린",
            maxHp: 100,
            image: LILY_IMG + "/mon_03.png",
            background: LILY_IMG + "/bg_006.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: {
                dialogue: "킥킥... 청명석과... 그 계집... 다 내 거다...",
                image: LILY_IMG + "/mon_03.png"
            },
            resultWin: {
                dialogue: "무사하셔서 다행이에요.",
                image: LILY_IMG + "/lily_06.png"
            }
        },
        battle: {
            movesPerAttack: 3,
            bossDamageMin: 7,
            bossDamageMax: 16,
            bossDamageSound: LILY_SOUND + "/mon_03_dem.ogg",
            skill: {
                chargeMax: 30,
                damageBase: 9,
                damageDesperation: 26,
                hpThresholdDesperation: 8,
                rangeBase: 0,
                rangeDesperation: 1
            }
        }
    }

};

// 필요 시, 나중에 이 파일만 수정/추가해서 보스/스테이지를 관리하면 됩니다.

