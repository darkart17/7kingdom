/**
 * 길드 화면 - 세리아 캐릭터 시나리오
 * 이미지: assets/images/seria/seria_XX.png
 * 음성: assets/sound/store/guild_XX.ogg
 */
export const GUILD_CONFIG = {
    bg: "assets/images/seria/bg_guild.jpg",
    title: "길드",
    charScenarios: {
        /** 입장 시 */
        default: { image: "assets/images/seria/seria_01.png", bubble: "아직 살아계셨군요...", voice: "guild_default_01.ogg" },
        /** 3회 터치 시 */
        touchReaction: { image: "assets/images/seria/seria_08.png", bubble: "이게 무슨짓이죠?!", voice: "guild_touchReaction.ogg" },
        /** 나갈 때 */
        leave: { image: "assets/images/seria/seria_06.png", bubble: "무사히 돌아오세요...", voice: "guild_leave.ogg" },
        /** 토벌 보상 수령 후 (랜덤) */
        afterRewardClaim: [
            { image: "assets/images/seria/seria_02.png", bubble: "대단해요! 그래도 무리는 하지 마세요.", voice: "guild_afterReward_02.ogg" },
            { image: "assets/images/seria/seria_07.png", bubble: "다행이에요... 걱정했어요...", voice: "guild_afterReward_07.ogg" },
        ],
    },
};

if (typeof window !== "undefined") {
    window.GUILD_CONFIG = GUILD_CONFIG;
}
