/**
 * 골드 던전 인트로 시나리오
 *
 * 필요한 이미지 (assets/images/gold_dungeon/):
 * - bg_gold_dungeon_ent.jpg  : 골드 던전 입구 배경
 * - guard_spear_left.png     : 좌측 창 든 경비병
 * - guard_spear_right.png    : 우측 창 든 경비병
 * - guard_captain.png        : 경비대장
 */

const DUNGEON_IMG = 'assets/images/gold_dungeon';

export const goldDungeonFirstIntro = {
  id: 'gold_dungeon_intro',
  name: '골드 던전',
  goldDungeonReturnToDungeon: true,

  events: [
    { type: 'bg', bg: `${DUNGEON_IMG}/bg_gold_dungeon_ent.jpg`, transition: 'fade' },
    { type: 'guards_enter', left: `${DUNGEON_IMG}/guard_spear_left.png`, right: `${DUNGEON_IMG}/guard_spear_right.png` },
    { type: 'ui', action: 'show' },
    { type: 'narration', text: '왕도 외곽에 자리한 거대한 암벽. \n그곳에 입을 벌리고 있는 거대한 동굴이 이른바 \'골드 던전\'이라 불리는 장소다.' },
    { type: 'narration', text: '입구에는 은빛 갑옷을 입고 장창을 든 두 명의 병사가 굳건히 서 있었고, 그 사이로 푸른제복에 대검을 찬 경비대장이 걸어 나왔다.' },
    { type: 'actor', action: 'show', image: `${DUNGEON_IMG}/guard_captain.png`, motion: 'fade_in', pos: 'center' },
    { type: 'narration', text: '남자들이 모두 마왕 토벌전으로 차출된 베리디안 왕국.\n하지만 이 여성 경비대장과 병사들의 날 선 눈빛은, 왕국의 치안이 왜 이토록 굳건히 유지되는지 증명하고 있었다.' },
    { type: 'dialogue', speaker: '경비대장', text: '정지. \n이곳은 왕국이 직접 관리하는 통제 구역이다.\n소속과 목적을 밝혀라.' },
    { type: 'narration', text: '나는 다가가 모험가 길드 \'STAY\'에서 발급받은 던전 출입 승인증을 내밀었다.' },
    { type: 'dialogue', speaker: '경비대장', text: '길드 소속 모험가... \n확인하지.' },
    { type: 'narration', text: '서류와 마법 각인을 대조하는 동안, 그녀는 특유의 위압적이면서도 차분한 목소리로 입을 열었다.' },
    { type: 'dialogue', speaker: '경비대장', text: '이방인인가?. \n간단한 주의사항만 알려주겠다.' },
    { type: 'dialogue', speaker: '경비대장', text: '이 던전의 주인인 \'골드 드래곤\'은 대규모 인원이 진입할 경우, 자신의 영역에 대한 침범으로 간주해 폭주할 위험이 크다.' },
    { type: 'dialogue', speaker: '경비대장', text: '그래서 왕국 차원에서 군대나 대규모 파티의 출입을 엄격히 통제하고, 길드의 승인을 받은 정예 모험가만 들여보내고 있지.' },
    { type: 'dialogue', speaker: '경비대장', text: '신원 및 승인증 확인되었다. \n출입을 허가한다.' },
    { type: 'narration', text: '경비대장이 승인증을 돌려주며, 차갑고 사무적인 눈빛으로 덧붙였다.' },
    { type: 'dialogue', speaker: '경비대장', text: '명심해라. \n내부에서 일어나는 모든 사고에 대해 왕국은 책임지지 않는다. \n생사는 온전히 네 몫이야.' },
    { type: 'dialogue', speaker: '경비대장', text: '또한, 지금 이 시간부로 진입 후 2일(48시간) 이내에 귀환하지 않을 경우, 규정에 따라 \'사망자\'로 자동 처리된다.\n무운을 빈다.' },
    { type: 'actor', action: 'hide' },
    { type: 'narration', text: '서늘한 경고를 뒤로한 채, 나는 황금빛 광물이 희미하게 빛나는 던전의 어둠 속으로 발걸음을 옮겼다.' },
    { type: 'guards_step_aside' },
    { type: 'narration', text: '[ 시스템 : 던전 시스템이 개방되었습니다. ]' },
  ],
};

/** 길드 미등록 시 경비대장이 쫓아내는 인트로 */
export const goldDungeonNoGuildIntro = {
  id: 'gold_dungeon_no_guild',
  name: '골드 던전',
  goldDungeonReturnToMain: true,

  events: [
    { type: 'bg', bg: `${DUNGEON_IMG}/bg_gold_dungeon_ent.jpg`, transition: 'fade' },
    { type: 'guards_enter', left: `${DUNGEON_IMG}/guard_spear_left.png`, right: `${DUNGEON_IMG}/guard_spear_right.png` },
    { type: 'ui', action: 'show' },
    { type: 'narration', text: '왕도 외곽에 자리한 거대한 암벽. \n그곳에 입을 벌리고 있는 거대한 동굴이 이른바 \'골드 던전\'이라 불리는 장소다.' },
    { type: 'narration', text: '입구에는 은빛 갑옷을 입고 장창을 든 두 명의 병사가 굳건히 서 있었고, 그 사이로 푸른 제복에 대검을 찬 경비대장이 걸어 나왔다.' },
    { type: 'actor', action: 'show', image: `${DUNGEON_IMG}/guard_captain.png`, motion: 'fade_in', pos: 'center' },
    { type: 'dialogue', speaker: '경비대장', text: '정지. \n이곳은 왕국이 직접 관리하는 통제 구역이다.\n소속과 목적을 밝혀라.' },
    { type: 'narration', text: '나는 던전에 들어가려 했지만... 모험가 길드에 등록조차 하지 않은 상태였다.\n승인증이 있을 리 없었다.' },
    { type: 'dialogue', speaker: '경비대장', text: '...길드 등록도 안 한 놈이 던전에 입장하려고? \n미친 놈인가.' },
    { type: 'dialogue', speaker: '경비대장', text: '당장 길드에 가서 등록부터 하고 와라. \n그 전엔 한 발짝도 들여보내지 않는다.' },
    { type: 'narration', text: '경비대장의 차가운 한소리에, 나는 할 수 없이 입구에서 물러날 수밖에 없었다.' },
    { type: 'actor', action: 'hide' },
    { type: 'narration', text: '[ 길드에 먼저 등록해야 던전에 입장할 수 있습니다. ]' },
  ],
};
