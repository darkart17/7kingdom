/**
 * 골드·블록 보관함 (localStorage 기반)
 * - goldEarned: 던전에서 획득한 총 골드
 * - goldUsed: 상점에서 사용한 총 골드
 * - blockLevels: SWORD, POTION, SHIELD, MAGIC 레벨 (1~5)
 */
(function() {
    const STORAGE_KEY = '3x3_vault';
    const DEFAULT = {
        goldEarned: 0, /* 테스트용 시작 골드 - 배포 시 0으로 복원 */
        goldUsed: 0,
        blockLevels: { SWORD: 1, POTION: 1, SHIELD: 1, MAGIC: 1 },
        playerMaxHp: 10,
        heartPurchaseCount: 0,
    };

    function load() {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (!s) return Object.assign({}, DEFAULT);
            const parsed = JSON.parse(s);
            return {
                goldEarned: Number(parsed.goldEarned) || 0,
                goldUsed: Number(parsed.goldUsed) || 0,
                blockLevels: Object.assign({}, DEFAULT.blockLevels, parsed.blockLevels),
                playerMaxHp: Math.max(5, Number(parsed.playerMaxHp) || 10),
                heartPurchaseCount: Number(parsed.heartPurchaseCount) || 0,
            };
        } catch (e) {
            return Object.assign({}, DEFAULT);
        }
    }

    function save(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    window.gameStorage = {
    getState() {
        return load();
    },
    getGoldBalance() {
        const s = load();
        return Math.max(0, s.goldEarned - s.goldUsed);
    },
    addGoldEarned(amount) {
        const s = load();
        s.goldEarned += Number(amount) || 0;
        save(s);
        return s;
    },
    addGoldUsed(amount) {
        const s = load();
        s.goldUsed += Number(amount) || 0;
        save(s);
        return s;
    },
    getBlockLevel(id) {
        const s = load();
        return s.blockLevels[id] ?? 1;
    },
    setBlockLevel(id, level) {
        const s = load();
        s.blockLevels[id] = Math.max(1, Math.min(5, level));
        save(s);
        return s;
    },
    getPlayerMaxHp() {
        return Math.max(5, Number(load().playerMaxHp) || 10);
    },
    addPlayerMaxHp(amount) {
        const s = load();
        s.playerMaxHp = Math.max(5, (Number(s.playerMaxHp) || 10) + (Number(amount) || 0));
        save(s);
        return s.playerMaxHp;
    },
    /** 비밀 상점용: 체력 영구 감소 (최소 5) */
    subtractPlayerMaxHp(amount) {
        const s = load();
        const cur = Math.max(5, Number(s.playerMaxHp) || 10);
        s.playerMaxHp = Math.max(5, cur - (Number(amount) || 0));
        save(s);
        return s.playerMaxHp;
    },
    /** 비밀 상점용: 체력 차감 + 골드 획득을 한 번에 처리 */
    secretShopPurchase(hpCost, goldReward) {
        const s = load();
        const cur = Math.max(5, Number(s.playerMaxHp) || 10);
        s.playerMaxHp = Math.max(5, cur - (Number(hpCost) || 0));
        s.goldEarned = (Number(s.goldEarned) || 0) + (Number(goldReward) || 0);
        save(s);
        return s;
    },
    getHeartPurchaseCount() {
        return Number(load().heartPurchaseCount) || 0;
    },
    addHeartPurchaseCount() {
        const s = load();
        s.heartPurchaseCount = (Number(s.heartPurchaseCount) || 0) + 1;
        save(s);
        return s.heartPurchaseCount;
    }
};
})();
