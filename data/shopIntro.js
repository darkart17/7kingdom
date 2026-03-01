/**
 * 업그레이드 상점 미오 인트로
 * - 배경: SHOP_CONFIG.bg (assets/images/mio/bg_shop.jpg)
 * - 미오 이미지: mio_02~mio_07 상황별 교체 (추가 이미지 없음)
 */

const MIO_IMG = 'assets/images/mio';
const SHOP_BG = 'assets/images/mio/bg_shop.jpg';

export const shopIntroData = {
  id: 'mio_shop_intro',
  name: '미오',
  shopReturnToShop: true,

  events: [
    { type: 'bg', bg: SHOP_BG, transition: 'fade' },
    { type: 'ui', action: 'show' },
    { type: 'narration', text: '문을 열고 들어서자, 화려하게 진열된 무구들과 알록달록한 물약들이 한눈에 들어오는 깔끔한 상점 내부가 보였다.' },
    { type: 'actor', action: 'show', image: `${MIO_IMG}/mio_02.png`, motion: 'fade_in', pos: 'center' },
    { type: 'dialogue', speaker: '미오', text: '어서 와! \n화끈한 장비가 필요해서 온... \n어라?', image: `${MIO_IMG}/mio_02.png` },
    { type: 'narration', text: '은빛 머리카락에 까무잡잡한 피부, 커다란 고양이 귀를 쫑긋거리던 수인족 소녀의 표정이 나를 보자마자 팍 식었다.', image: `${MIO_IMG}/mio_03.png` },
    { type: 'dialogue', speaker: '미오', text: '뭐야, 소문으로 듣던 그 \'이방인\'이네? \n난 또 엄청 거대한 오크나 핏줄 선 라이칸인 줄 알았지.', image: `${MIO_IMG}/mio_03.png` },
    { type: 'narration', text: '미오는 꼬리를 탁탁 치며 대놓고 실망한 기색을 내비쳤다.', image: `${MIO_IMG}/mio_05.png` },
    { type: 'dialogue', speaker: '미오', text: '인간 수컷들은 너무 밋밋해서 매력이 없어. \n우락부락한 흉터도 없고, 거친 짐승의 냄새도 안 나잖아?\n그런 가녀린 몸으로 대체 무슨 모험을 하겠다는 건지.', image: `${MIO_IMG}/mio_05.png` },
    { type: 'narration', text: '대놓고 종족을 무시하며 마초 취향을 늘어놓는 상인이라니.\n나는 짧은 한숨을 쉬며, 허리춤에서 묵직한 \'골드 주머니\'를 꺼내 테이블 위에 툭 올려두었다.' },
    { type: 'narration', text: '짤그랑-! \n둔탁하고 아름다운 금화 부딪히는 소리가 상점 안에 울려 퍼진 순간.' },
    { type: 'dialogue', speaker: '미오', text: '힉...?! \n이, 이 영롱한 금빛과 묵직한 마찰음은...!!', image: `${MIO_IMG}/mio_06.png` },
    { type: 'narration', text: '방금 전까지 인간을 벌레 보듯 하던 고양이 수인의 눈동자가 순식간에 동전 모양으로 번쩍였다.\n그녀의 두 귀가 쫑긋 서더니, 태도가 180도 돌변했다.', image: `${MIO_IMG}/mio_06.png` },
    { type: 'dialogue', speaker: '미오', text: '크흠, 흠! \n다시 보니까 우리 이방인 손님, 아주 눈빛이 살아있고 지갑이... \n아니, 잠재력이 두둑하네!\n진정한 강함은 근육의 크기가 아니라 재력에서 나오는 법이지, 암!', image: `${MIO_IMG}/mio_06.png` },
    { type: 'dialogue', speaker: '미오', text: '잘 찾아왔어. \n내 상점에서는 시끄럽게 망치질하며 기다릴 필요 없어!\n최고급 완성품 장비부터, 마시면 체력을 영구적으로 팍팍 늘려주는 비약까지 전부 완제품으로 팔고 있거든!', image: `${MIO_IMG}/mio_06.png` },
    { type: 'dialogue', speaker: '미오', text: '재료 따윈 필요 없어, 오직 \'골드\'면 충분해!\n두둑한 골드만 지불한다면, 당신도 드래곤을 때려잡는 상남자로 만들어 줄 테니까! \n자, 뭘 살래?', image: `${MIO_IMG}/mio_07.png` },
    { type: 'narration', text: '그녀는 눈에 보이지도 않는 속도로 골드 주머니를 슬쩍 자신의 앞으로 끌어당기며 환하게 웃었다.\n지독한 수전노 고양이에게 걸린 것 같지만, 진열된 물건들의 품질만큼은 확실해 보인다.', image: `${MIO_IMG}/mio_07.png` },
    { type: 'actor', action: 'hide' },
    { type: 'narration', text: '[ 시스템 : 업그레이드 상점이 개방되었습니다! ]\n[ 시스템 : 오직 \'골드\'만을 사용하여 장비구매 및 영구 체력 증가를 진행할 수 있습니다. ]' },
  ],
};
