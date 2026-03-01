// 골드 던전 스테이지 설정
// window.DUNGEON_STAGES[던전ID] 형태로 관리합니다.
//
// 이미지 루트: assets/images/gold_dungeon/
// - 메인 선택 화면: gold_dungeon/bg_main.jpg
// - 각 던전: gold_dungeon/d1~d9/bg.jpg, intro.png (배틀도 intro.png 사용, 상단 정렬 후 체력바에서 클립)
//
// introCharPos: 인트로 몬스터 위치 조정 (선택)
//   left, right, bottom, top: "50%", "0", "100px" 등
//   transform: "translateX(-50%)" 등 (기본: translateX(-50%))
//   noFloat: true 시 위아래 떠다니는 애니메이션 비활성화
//
// boss.scale: 배틀 보스 이미지 배율. 원본 이미지 크기 기준(1.0=100%). 상단 정렬 후 오버레이(상단~체력바 중간) 밖은 잘림.
// boss.battleCharPos: 전투 화면 몬스터 위치 (선택). 상단 정렬 기준 left/right/top, transform으로 위치·스케일 제어
//   left, right, bottom, top, transform - introCharPos와 동일 형식. top "0" 권장
//   noFloat: true 시 떠다니는 애니메이션 비활성화
//
// boss.listScale, boss.listCharPos: 던전 리스트 버튼에만 적용. 배틀과 별도로 맞출 때 사용
//   listScale: 버튼 안 보스 이미지 배율 (1.0=100%)
//   listCharPos: left, right, top, bottom, transform - 버튼 영역 기준
//
// boss.resultCharPos: 승리/패배 화면 몬스터 위치 (선택). 이미지 정렬 기준 상단 → top 사용 권장
//   left, right, bottom, top, transform - introCharPos와 동일 형식
//
// battle.shieldDestroy: true 시 방패파괴 (공격 시 방패 0 + shieldDestroyTurns턴간 방패 회복 방해)
//   shieldDestroyTurns: 1 (기본 1)

// 경로: ../../ = 배틀(iframe) 기준, 메인 화면은 resolveAssetUrl이 ../../assets/ → assets/ 변환
const GD = '../../assets/images/gold_dungeon';
const GS = '../../assets/sound/gold_dungeon';

window.DUNGEON_CONFIG = {
    bgMain: GD + '/bg_main.jpg',
    coinSound: GS + '/coin.ogg'
};

window.DUNGEON_STAGES = {
    "d1": {
        id: "d1",
        name: "골드 슬라임",
        image: GD + "/d1/bg.jpg",
        turnLimit: 20,
        goldReward: { min: 1000, max: 1000 },
        introBackground: GD + "/d1/bg.jpg",
        introCharPos: { left: "50%", bottom: "200px", transform: "translateX(-50%)" },
        introImage: GD + "/d1/intro.png",
        intro: [
            { type: "narration", text: "탐욕스러운 황금빛 액체가 금화를 삼키며 기괴한 형상으로 꿈틀거립니다." },
            { type: "abilities", abilities: [{ label: "물약중독", desc: "회복량만큼 데미지를 받는 오염된 물약 블록을 생성한다." }] },
            { type: "dialogue", speaker: "골드 슬라임", text: "퐁... 퐁퐁... (금화... 달콤해...)", image: GD + "/d1/intro.png" },
        ],
        boss: {
            name: "골드 슬라임",
            maxHp: 1000,
            image: GD + "/d1/intro.png",
            background: GD + "/d1/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.45,
            listCharPos: { left: "60%", top: "-10%", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "퐁퐁... (너도... 금화가 되어라...)", image: GD + "/d1/intro.png" },
            resultWin: { dialogue: "...퐁 (금화 뱉음)", image: GD + "/d1/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "물약중독",
            healReverse: true,
            healReverseTurns: 1,
            bossDamageMin: 5,
            bossDamageMax: 12,
            bossDamageSound: GS + "/d1/dem.ogg",
            skill: { chargeMax: 28, damageBase: 14, damageDesperation: 24, hpThresholdDesperation: 9, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d2": {
        id: "d2",
        name: "웨어 울프",
        image: GD + "/d2/bg.jpg",
        turnLimit: 20,
        goldReward: { min: 2000, max: 2000 },
        introBackground: GD + "/d2/bg.jpg",
        introCharPos: { left: "60%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d2/intro.png",
        intro: [
            { type: "narration", text: "차가운 달빛 아래, 금화 더미를 깔고 앉은 야수의 포효가 던전에 울려 퍼집니다." },
            { type: "abilities", abilities: [{ label: "스킬 광폭화", desc: "플레이어의 스킬 게이지가 70% 이상일 때 3연속 공격을 한다." }] },
            { type: "dialogue", speaker: "웨어 울프", text: "크르르... 내 보물에 손대려는 자, 뼈도 못 추릴 줄 알아라!", image: GD + "/d2/intro.png" },
        ],
        boss: {
            name: "웨어 울프",
            maxHp: 950,
            image: GD + "/d2/intro.png",
            background: GD + "/d2/bg.jpg",
            scale: 2,
            battleCharPos: { left: "55%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "70%", top: "-30%", transform: "translateX(-50%)" },
            resultCharPos: { left: "60%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "으르렁! 약해빠진 녀석이 감히 어디를!", image: GD + "/d2/intro.png" },
            resultWin: { dialogue: "...강하군. 가져가라.", image: GD + "/d2/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "스킬 광폭화",
            skillFury: true,
            bossDamageMin: 5,
            bossDamageMax: 12,
            bossDamageSound: GS + "/d2/dem.ogg",
            skill: { chargeMax: 28, damageBase: 14, damageDesperation: 24, hpThresholdDesperation: 9, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d3": {
        id: "d3",
        name: "스켈레톤 전사",
        image: GD + "/d3/bg.jpg",
        turnLimit: 25,
        goldReward: { min: 3000, max: 3000 },
        introBackground: GD + "/d3/bg.jpg",
        introCharPos: { left: "45%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d3/intro.png",
        intro: [
            { type: "narration", text: "해묵은 뼈 갑옷을 걸친 망자가 영원한 안식을 방해받자 천천히 검을 뽑아 듭니다." },
            { type: "abilities", abilities: [{ label: "방패 흡수", desc: "공격 시 플레이어의 방패 수치를 흡수하여 자신의 체력을 회복한다." }] },
            { type: "dialogue", speaker: "스켈레톤 전사", text: "살아있는 자여...\n너의 생기는 이 금고를 지킬 밑거름이 될 뿐이다.", image: GD + "/d3/intro.png" },
        ],
        boss: {
            name: "스켈레톤 전사",
            maxHp: 1100,
            image: GD + "/d3/intro.png",
            background: GD + "/d3/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.7,
            listCharPos: { left: "55%", top: "-20%", transform: "translateX(-50%)" },
            resultCharPos: { left: "45%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "...다음은 없다. 영원한 안식에 들어라.", image: GD + "/d3/intro.png" },
            resultWin: { dialogue: "...가져가라. 승자에게 영광을.", image: GD + "/d3/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "방패 흡수",
            shieldAbsorb: true,
            shieldAbsorbSound: GS + "/d3/shield_adsorb.ogg",
            bossDamageMin: 6,
            bossDamageMax: 14,
            bossDamageSound: GS + "/d3/dem.ogg",
            skill: { chargeMax: 30, damageBase: 16, damageDesperation: 28, hpThresholdDesperation: 10, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d4": {
        id: "d4",
        name: "아라크네",
        image: GD + "/d4/bg.jpg",
        turnLimit: 25,
        goldReward: { min: 4000, max: 4000 },
        introBackground: GD + "/d4/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d4/intro.png",
        intro: [
            { type: "narration", text: "천장에 매달린 거미 여왕이 황금 실로 침입자를 옭아매기 위해 서서히 내려옵니다." },
            { type: "abilities", abilities: [
                { label: "이동 불가 타일", desc: "거미줄을 뿌려 블록이 이동할 수 없는 영역을 만든다." },
                { label: "스킬 0화", desc: "공격 시 플레이어 스킬게이지를 0으로 초기화시킨다." }
            ] },
            { type: "dialogue", speaker: "아라크네", text: "호호호... 내 실에 묶여 영원히 이 보물창고의 장식품이 되어보렴.", image: GD + "/d4/intro.png" },
        ],
        boss: {
            name: "아라크네",
            maxHp: 1150,
            image: GD + "/d4/intro.png",
            background: GD + "/d4/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "60%", top: "-25%", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "깔깔깔! 아주 훌륭한 고치(보물)가 되겠구나.", image: GD + "/d4/intro.png" },
            resultWin: { dialogue: "크윽... 내 실이 끊기다니... 가져가!", image: GD + "/d4/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "이동 불가 타일 + 스킬 0화",
            tileBlock: true,
            tileBlockSize: 3,
            tileBlockImage: GD + "/d4/skill.png",
            skillChargeReset: true,
            bossDamageMin: 6,
            bossDamageMax: 15,
            bossDamageSound: GS + "/d4/dem.ogg",
            skill: { chargeMax: 30, damageBase: 16, damageDesperation: 28, hpThresholdDesperation: 10, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d5": {
        id: "d5",
        name: "고대의 수호자",
        image: GD + "/d5/bg.jpg",
        turnLimit: 25,
        goldReward: { min: 5000, max: 5000 },
        introBackground: GD + "/d5/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d5/intro.png",
        intro: [
            { type: "narration", text: "수천 년간 잠들어 있던 거대한 황금 거신이 대지를 울리며 눈을 뜹니다." },
            { type: "abilities", abilities: [{ label: "철벽의 반동", desc: "플레이어가 가한 데미지의 100%를 반사하는 방어막을 생성한다." }] },
            { type: "dialogue", speaker: "고대의 수호자", text: "...허가되지 않은 생명체 식별...\n즉시... 제거 절차를 시작한다...", image: GD + "/d5/intro.png" },
        ],
        boss: {
            name: "고대의 수호자",
            maxHp: 1200,
            image: GD + "/d5/intro.png",
            background: GD + "/d5/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.6,
            listCharPos: { left: "65%", top: "0", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "...침입자 제거 완료. 경계 태세로 복귀한다.", image: GD + "/d5/intro.png" },
            resultWin: { dialogue: "...보물...가져가... 가동... 중단...", image: GD + "/d5/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "철벽의 반동",
            damageReflect: true,
            damageReflectPercent: 100,
            damageReflectTurns: 1,
            bossDamageMin: 7,
            bossDamageMax: 15,
            bossDamageSound: GS + "/d5/dem.ogg",
            skill: { chargeMax: 30, damageBase: 16, damageDesperation: 28, hpThresholdDesperation: 10, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d6": {
        id: "d6",
        name: "리미아",
        image: GD + "/d6/bg.jpg",
        turnLimit: 30,
        goldReward: { min: 6000, max: 6000 },
        introBackground: GD + "/d6/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d6/intro.png",
        intro: [
            { type: "narration", text: "핏빛 눈동자를 빛내는 리미아가 매혹적인 미소 뒤에 치명적인 독을 감추고 다가옵니다." },
            { type: "abilities", abilities: [{ label: "정적의 석화", desc: "화면의 모든 물약 블록을 석화상태로 만든다.석화블록은 석화블록만 매칭할 수 있다." }] },
            { type: "dialogue", speaker: "리미아", text: "어머, 무모한 분이 또 오셨네? \n이곳의 보물은 보는 것만으로 만족해야 할 텐데.", image: GD + "/d6/intro.png" },
        ],
        boss: {
            name: "리미아",
            maxHp: 1250,
            image: GD + "/d6/intro.png",
            background: GD + "/d6/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "65%", top: "-10%", transform: "translateX(-50%)" },
            resultCharPos: { left: "55%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "아쉬워라...\n당신도 결국 돌덩이가 되어버렸네?", image: GD + "/d6/intro.png" },
            resultWin: { dialogue: "훌륭해요. 이걸 받으세요.\n당신은 자격이 있네요.", image: GD + "/d6/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "정적의 석화",
            petrifyBlockType: "POTION",
            bossDamageMin: 7,
            bossDamageMax: 16,
            bossDamageSound: GS + "/d6/dem.ogg",
            skill: { chargeMax: 32, damageBase: 18, damageDesperation: 32, hpThresholdDesperation: 12, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d7": {
        id: "d7",
        name: "미노타우르스",
        image: GD + "/d7/bg.jpg",
        turnLimit: 30,
        goldReward: { min: 7000, max: 7000 },
        introBackground: GD + "/d7/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d7/intro.png",
        intro: [
            { type: "narration", text: "미로의 지배자가 대지를 가르며 압도적인 위압감을 드러냅니다." },
            { type: "abilities", abilities: [{ label: "방패파괴", desc: "공격 시 방패를 파괴하여 수치를 0으로 만들고 1턴간 방패 회복을 방해한다." }] },
            { type: "dialogue", speaker: "미노타우르스", text: "음모오오!\n비겁하게 방패 뒤에 숨지 마라!\n내 도끼가 네 심장을 가를 것이다!", image: GD + "/d7/intro.png" },
        ],
        boss: {
            name: "미노타우르스",
            maxHp: 1300,
            image: GD + "/d7/intro.png",
            background: GD + "/d7/bg.jpg",
            scale: 2.4,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "60%", top: "-30%", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "무우우! 내 도끼 맛이 어떠냐! 꺼져라!", image: GD + "/d7/intro.png" },
            resultWin: { dialogue: "...강하구나... 승자에게... 보물을...", image: GD + "/d7/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "방패파괴",
            shieldDestroy: true,
            shieldDestroyTurns: 1,
            bossDamageMin: 7,
            bossDamageMax: 16,
            bossDamageSound: GS + "/d7/dem.ogg",
            skill: { chargeMax: 32, damageBase: 18, damageDesperation: 32, hpThresholdDesperation: 12, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d8": {
        id: "d8",
        name: "황금의 무녀",
        image: GD + "/d8/bg.jpg",
        turnLimit: 35,
        goldReward: { min: 8000, max: 8000 },
        introBackground: GD + "/d8/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d8/intro.png",
        intro: [
            { type: "narration", text: "찬란한 빛의 세례와 함께, 신전의 수호자가 정령들의 힘을 소환합니다." },
            { type: "abilities", abilities: [
                { label: "2연타", desc: "2회 연속으로 공격한다." },
                { label: "정령 폭탄", desc: "랜덤 블록 2개가 정령폭탄으로 바뀌고 2턴 후 폭발하여 강한 화염 데미지를 입힌다." }
            ] },
            { type: "dialogue", speaker: "황금의 무녀", text: "욕망에 눈먼 자여, 신성한 불꽃이 그대의 영혼을 정화할 것입니다.", image: GD + "/d8/intro.png" },
        ],
        boss: {
            name: "황금의 무녀",
            maxHp: 1400,
            image: GD + "/d8/intro.png",
            background: GD + "/d8/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "60%", top: "-20%", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "신성한 곳을 더럽힌 대가입니다.\n여기서 참회하십시오.", image: GD + "/d8/intro.png" },
            resultWin: { dialogue: "...승인하겠다. 가져가거라.\n신의 가호가 있기를.", image: GD + "/d8/intro.png" }
        },
        battle: {
            attackLabel: "2연타 + 정령 폭탄",
            doubleAttack: true,
            spiritBomb: true,
            spiritBombCount: 2,
            spiritBombTurns: 2,
            spiritBombDamage: 10,
            movesPerAttack: 4,
            bossDamageMin: 8,
            bossDamageMax: 18,
            bossDamageSound: GS + "/d8/dem.ogg",
            skill: { chargeMax: 32, damageBase: 18, damageDesperation: 32, hpThresholdDesperation: 12, rangeBase: 0, rangeDesperation: 1 }
        }
    },

    "d9": {
        id: "d9",
        name: "골드 드래곤 - 엘도라",
        image: GD + "/d9/bg.jpg",
        turnLimit: 35,
        goldReward: { min: 9000, max: 9000 },
        introBackground: GD + "/d9/bg.jpg",
        introCharPos: { left: "50%", bottom: "0", transform: "translateX(-50%)" },
        introImage: GD + "/d9/intro.png",
        intro: [
            { type: "narration", text: "산처럼 쌓인 금화 위에서 군림하는 용 '엘도라'가 거대한 날개를 펴며 던전 전체를 압도하고 있습니다." },
            { type: "abilities", abilities: [
                { label: "2연타", desc: "2회 연속으로 공격한다." },
                { label: "소멸", desc: "가장 많이 있는 블록 1종류를 모두 제거한다." },
                { label: "절대 방어", desc: "1턴간 데미지를 무효화하는 방어막을 생성한다.\n보스 체력이 30% 이하 시 2턴 지속된다." }
            ] },
            { type: "dialogue", speaker: "골드 드래곤 - 엘도라", text: "가소롭구나!\n신조차 탐내는 나의 황금을 감히 네놈이 노리다니!", image: GD + "/d9/intro.png" },
        ],
        boss: {
            name: "골드 드래곤 - 엘도라",
            maxHp: 1800,
            image: GD + "/d9/intro.png",
            background: GD + "/d9/bg.jpg",
            scale: 2,
            battleCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            listScale: 0.5,
            listCharPos: { left: "60%", top: "-30%", transform: "translateX(-50%)" },
            resultCharPos: { left: "50%", top: "0", transform: "translateX(-50%)" },
            resultLose: { dialogue: "하하하! 한 줌의 재가 되어라!\n보물은 영원히 나의 것이다!", image: GD + "/d9/intro.png" },
            resultWin: { dialogue: "크오오오! 강하다...\n보물... 네게 맡기마...", image: GD + "/d9/intro.png" }
        },
        battle: {
            movesPerAttack: 3,
            attackLabel: "2연타 + 소멸 + 절대 방어",
            doubleAttack: true,
            vanishMostBlock: true,
            absoluteDefense: true,
            bossDamageMin: 10,
            bossDamageMax: 22,
            bossDamageSound: GS + "/d9/dem.ogg",
            skill: { chargeMax: 35, damageBase: 22, damageDesperation: 40, hpThresholdDesperation: 15, rangeBase: 0, rangeDesperation: 1 }
        }
    }
};
