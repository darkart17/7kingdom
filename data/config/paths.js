/**
 * 프로젝트 경로 통합 설정
 * - assets/images: 캐릭터, 배경, 시나리오별 몬스터 이미지 (캐릭터별 폴더: lily/, mio/, gold_dungeon/ 등)
 * - assets/sound: UI/상점/결과음 + 시나리오별 배틀 효과음 (캐릭터별 폴더: lily/, gold_dungeon/ 등)
 * - src/battle/assets: 배틀 전용만 (blocks/, sound/ — BGM·블록·공용 효과음)
 */
(function() {
    window.PATHS = {
        images: 'assets/images',
        sound: 'assets/sound',
        battle: 'src/battle'
    };
    window.SOUND_PATHS = {
        heart: 'assets/sound/ui/heart.ogg',
        shop_purchase: 'assets/sound/store/shop_purchase.ogg',
        gold_shop_purchase: 'assets/sound/store/gold_shop_purchase.ogg',
        shield_absorb: 'assets/sound/gold_dungeon/d3/shield_adsorb.ogg'
    };
})();
