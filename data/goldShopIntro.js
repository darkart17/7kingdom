/**
 * 비밀 상점 마야 인트로
 * - 배경: GOLD_SHOP_CONFIG.bg (assets/images/maya/bg_shop.jpg)
 * - 마야 이미지: maya_01, maya_02만 사용 (maya_03, maya_04 미사용)
 */

const MAYA_IMG = 'assets/images/maya';
const GOLD_SHOP_BG = 'assets/images/maya/bg_shop.jpg';

export const goldShopIntroData = {
  id: 'maya_gold_shop_intro',
  name: '마야',
  goldShopReturnToShop: true,

  events: [
    { type: 'bg', bg: GOLD_SHOP_BG, transition: 'fade' },
    { type: 'ui', action: 'show' },
    { type: 'narration', text: '뒷골목의 으슥한 곳, 붉은빛이 희미하게 새어 나오는 낡은 문.\n문을 열고 들어서자, 이성이 마비될 듯한 달콤하고 짙은 향기가 코끝을 스친다.' },
    { type: 'actor', action: 'show', image: `${MAYA_IMG}/maya_01.png`, motion: 'fade_in', pos: 'center' },
    { type: 'dialogue', speaker: '???', text: '어머... \n꽤나 싱싱한 생명력을 가진 손님이 찾아왔네.', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'narration', text: '짙은 어둠 속에서, 속이 훤히 비치는 검은 란제리와 얇은 가운만 걸친 금발의 엘프가 요염한 미소를 지으며 다가왔다.', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'dialogue', speaker: '마야', text: '환영해. \n여긴 욕망에 솔직한 어른들만 발을 들일 수 있는 \'비밀 상점\'이란다.\n내 이름은 마야. 이 은밀한 공간의 주인이자... 너희들의 욕망을 사들이는 사람이지.', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'narration', text: '마야의 보랏빛 눈동자는 마치 내 영혼의 밑바닥까지 꿰뚫어 보는 듯했다.\n그녀는 나른한 걸음으로 다가와, 얇고 긴 손가락으로 내 가슴팍을 부드럽게 쓰다듬었다.', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'dialogue', speaker: '마야', text: '가엾게도... \n세상의 무게를 짊어지느라 주머니가 많이 가벼워 보이네?\n지독한 현실을 이겨낼 \'금화\'가 필요하니?', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'narration', text: '나의 얕은 숨결이 닿을 만큼 가까이 다가온 그녀가, 귓가에 나직하게 속삭였다.', image: `${MAYA_IMG}/maya_01.png` },
    { type: 'dialogue', speaker: '마야', text: '대가는 아주 간단해.\n네 심장 속에서 펄떡이는 그 뜨거운 \'생명력\'을 아주 조금만 내게 덜어주면 돼.', image: `${MAYA_IMG}/maya_02.png` },
    { type: 'dialogue', speaker: '마야', text: '그럼 내가 그것을... \n아주 달콤하고 반짝이는 황금으로 바꿔줄게.\n단, 한 번 내게 바친 생명력은 두 번 다시 되돌려받을 수 없어. \n영원히 말이야.', image: `${MAYA_IMG}/maya_02.png` },
    { type: 'dialogue', speaker: '마야', text: '아, 그리고 명심해.\n내어주는 황금의 양은 전적으로 내 변덕과... \n그날그날 맛보는 네 생명력의 \'농도\'에 따라 달라진단다. \n후훗.', image: `${MAYA_IMG}/maya_02.png` },
    { type: 'narration', text: '그녀의 미소는 치명적인 독처럼 달콤했다.\n이성으로는 이 거래가 위험하다고 경고하고 있었지만, 코끝을 맴도는 아찔한 향기와 눈앞의 유혹을 뿌리치기란 쉽지 않았다.', image: `${MAYA_IMG}/maya_02.png` },
    { type: 'dialogue', speaker: '마야', text: '자, 어떡할래? \n너의 그 뜨거운 수명을 깎아, 나와 달콤한 거래를 해보지 않을래?', image: `${MAYA_IMG}/maya_02.png` },
    { type: 'actor', action: 'hide' },
    { type: 'narration', text: '[ 시스템 : 어른들의 \'비밀 상점\'이 개방되었습니다! ]\n[ 시스템 : 영구적인 체력을 지불하여 랜덤한 액수의 골드를 획득할 수 있습니다. 과도한 거래는 목숨을 앗아갈 수 있으니 주의하세요. ]' },
  ],
};
