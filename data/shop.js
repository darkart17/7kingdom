/**
 * 업그레이드 상점 설정
 * - 하트: 1회 구매시 +5 HP, 가격 2배씩 상승
 * - 블록: 1회 구매시 +1레벨 (max 5), 가격 2배씩 상승
 * - basePrice: 최초 가격, 구매 시마다 2배
 */
export const shopItems = [
    { id: "HEART", name: "체력+5", icon: "❤️", effect: "hp", basePrice:150, perPurchase: 5, maxHp: 99 },
    { id: "SWORD", name: "검+1", icon: "🗡️", effect: "dmg", basePrice:1000, maxLevel: 5, icons: ["🗡️", "⚔️", "⚔️", "⚔️", "⚔️"] },
    { id: "POTION", name: "물약+1", icon: "🧪", effect: "heal", basePrice: 1000, maxLevel: 5, icons: ["🧪", "🧪", "🧪", "🧪", "🧪"] },
    { id: "SHIELD", name: "방패+1", icon: "🛡️", effect: "def", basePrice: 1000, maxLevel: 5, icons: ["🛡️", "🛡️", "🛡️", "🛡️", "🛡️"] },
    { id: "MAGIC", name: "스킬혼+1", icon: "🔮", effect: "charge", basePrice: 1000, maxLevel: 5, icons: ["🔮", "🔮", "🔮", "🔮", "🔮"] },
];

/** 비밀 상점 - 체력으로 결제 (영구 감소, 최소 5), 구매 시 골드 랜덤 획득 (100단위) */
export const goldShopItems = [
    { id: "SECRET_5", name: "비밀 상품", icon: "🎁", price: 5, goldRewardMin: 500, goldRewardMax: 1000 },
    { id: "SECRET_20", name: "비밀 상품", icon: "🎁", price: 20, goldRewardMin: 1000, goldRewardMax: 3000 },
    { id: "SECRET_30", name: "비밀 상품", icon: "🎁", price: 30, goldRewardMin: 3000, goldRewardMax: 5000 },
];

const STORE_VOICE = "assets/sound/store/";

export const GOLD_SHOP_CONFIG = {
    bg: "assets/images/maya/bg_shop.jpg",
    title: "비밀 상점",
    /** 비밀 상점 전용 캐릭터 시나리오 (마야) */
    charScenarios: {
        default: { image: "assets/images/maya/maya_01.png", bubble: "어머? 애들은 오면 안되는데..", voice: "gold_default.ogg" },
        touchReaction: { image: "assets/images/maya/maya_03.png", bubble: "안돼..♡ 자꾸 그러면..♡", voice: "gold_touchReaction.ogg" },
        afterPurchase: { image: "assets/images/maya/maya_02.png", bubble: "으흥~♡ 체력은 소중히 해야해~", voice: "gold_afterPurchase.ogg" },
        leaveAfterPurchase: { image: "assets/images/maya/maya_02.png", bubble: "우리... 자주 보게 될것 같네?", voice: "gold_leaveAfterPurchase.ogg" },
        insufficientHp: { image: "assets/images/maya/maya_04.png", bubble: "어머... 그렇게 체력이 약해서야...", voice: "gold_insufficientHp.ogg" },
        leaveNoPurchase: { image: "assets/images/maya/maya_04.png", bubble: "체력을 더 길러와요~", voice: "gold_leaveNoPurchase.ogg" },
    },        
};

export const SHOP_CONFIG = {
    bg: "assets/images/mio/bg_shop.jpg",
    /** 상점 캐릭터 시나리오 (이미지 + 말풍선 + 음성) */
    charScenarios: {
        default: { image: "assets/images/mio/mio_02.png", bubble: "어서오세요~\n무엇이 필요하신가요?", voice: "shop_default.ogg" },
        leaveNoPurchase: { image: "assets/images/mio/mio_05.png", bubble: "구경만 하고 가는고야?", voice: "shop_leaveNoPurchase.ogg" },
        leaveAfterPurchase: { image: "assets/images/mio/mio_06.png", bubble: "다음에 또 오세요~", voice: "shop_leaveAfterPurchase.ogg" },
        afterPurchase: [
            { image: "assets/images/mio/mio_06.png", bubble: "아앙~ 멋져~", voice: "shop_afterPurchase_1.ogg" },
            { image: "assets/images/mio/mio_07.png", bubble: "좋은 선택이야~", voice: "shop_afterPurchase_2.ogg" },
        ],
        touchReaction: { image: "assets/images/mio/mio_04.png", bubble: "자꾸 야한짓 하면 맞는다~!!", voice: "shop_touchReaction.ogg" },
        insufficientGold: { image: "assets/images/mio/mio_03.png", bubble: "어? 설마 돈이 없는거야?", voice: "shop_insufficientGold.ogg" },
    },
};

if (typeof window !== "undefined") {
    window.SHOP_ITEMS = shopItems;
    window.SHOP_CONFIG = SHOP_CONFIG;
    window.GOLD_SHOP_ITEMS = goldShopItems;
    window.GOLD_SHOP_CONFIG = GOLD_SHOP_CONFIG;
    window.STORE_VOICE_PATH = STORE_VOICE;
}
