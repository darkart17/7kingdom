/** 모바일 게임 디자인 기준 해상도 (세로) */
const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
/** 대사창 줄바꿈용: #ui-layer 가로(1080+80)=1160, 패딩 65×2 → 1030. #dialogue-text 패딩 30×2 제외 → 970 */
const DESIGN_UI_LAYER_INNER_WIDTH = 1030;
const DESIGN_DIALOGUE_TEXT_HORIZ_PADDING = 60;
const DESIGN_DIALOGUE_MAX_WIDTH = DESIGN_UI_LAYER_INNER_WIDTH - DESIGN_DIALOGUE_TEXT_HORIZ_PADDING - 4;
/** 대사창 폰트: PC/모바일 동일 줄바꿈을 위해 측정 시 고정 사용 (px) */
const DESIGN_DIALOGUE_FONT_SIZE_PX = 42;

export class GameEngine {
    constructor() {
        this.data = null;
        this.currentIndex = -1;
        this.isTyping = false;
        this.isTouchMode = false;
        this.touchCount = 0;
        this.currentFullText = "";
        this.typingCharIndex = 0;
        this.typeTimeout = null;
        this.isFastTyping = false;
        this.currentSceneType = "";
        /** 대사창 연속 클릭/터치 방지: 이 시간까지 next() 무시 */
        this._dialogueClickCooldownUntil = 0;
        
        this.audioCtx = null;
        /** 효과음(MP3) 풀: GC 방지·채널 재사용 (모바일 WebView 끊김 방지) */
        this._effectSoundCache = {};

        this.uiName = document.getElementById('name-tag');
        this.uiText = document.getElementById('dialogue-text');
        this.uiNextIndicator = document.getElementById('dialogue-next-indicator');
        this.uiImg = document.getElementById('character-image');
        this.uiImgNext = document.getElementById('character-image-next');
        this.uiLayer = document.getElementById('ui-layer');
        this.bgLayer = document.getElementById('bg-layer');
        this.floatingWrapper = document.getElementById('floating-wrapper');
        this.episodeLayer = document.getElementById('episode-layer');
        this.episodeTitle = document.getElementById('episode-title');
        this._episodeClickHandler = null;
        this.uiWhite = document.getElementById('white-out');
        this.backBtn = document.getElementById('back-btn');
        this.touchBtn = document.getElementById('touch-mode-btn');
        this.talkBubble = document.getElementById('talk-bubble');
        this.sceneItemImage = document.getElementById('scene-item-image');
        
        this.modal = document.getElementById('game-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalBtn = document.getElementById('modal-btn');
        this.endingOverlay = document.getElementById('ending-overlay');
        this.endingTextDisplay = document.getElementById('ending-text-display');
        this.guardsWrap = document.getElementById('gold-dungeon-guards');
        this.guardLeft = document.getElementById('guard-left');
        this.guardRight = document.getElementById('guard-right');

        // 현재 표시 중인 캐릭터 이미지 정보
        this.currentImageKey = "";
        this.isMonsterScene = false; // mon_* 계열(몬스터/적) 장면 여부

        // 마우스 오른쪽 버튼 메뉴 비활성화
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 배틀 연동용 요소
        this.battleOverlay = document.getElementById('battle-overlay');
        this.battleFrame = document.getElementById('battle-frame');
        this.isInBattle = false;
        this.currentBattleStageId = null;

        // 퍼즐 RPG (배틀)에서 보내는 결과 메시지 수신
        window.addEventListener('message', (event) => {
            const data = event.data;
            console.log("메시지 수신:", data, "from:", event.origin);
            
            if (!data || typeof data !== 'object') return;
            
            if (data.type === 'battleResult') {
                if (!this.isInBattle) {
                    console.warn("배틀 중이 아닌데 결과 메시지 수신");
                    return;
                }
                console.log("배틀 결과 처리 시작");
                this.handleBattleResult(data);
            } else if (data.type === 'resultScreenShown') {
                if (this.isInBattle) this.clearToBlackForResult();
            } else if (data.type === 'battleLoaded') {
                console.log("배틀 페이지 로드 완료:", data.stageId);
                if (this.battleOverlay && this.isInBattle) {
                    this.battleOverlay.classList.add('show');
                }
            } else if (data.type === 'requestViewportDimensions') {
                this.notifyBattleViewport();
            } else if (data.type === 'requestQuitConfirm') {
                if (this.isInBattle && this.battleFrame) this.showQuitConfirmModal();
            }
        });

        this.quitConfirmModal = document.getElementById('quit-confirm-modal');
        this.quitConfirmCancel = document.getElementById('quit-confirm-cancel');
        this.quitConfirmOk = document.getElementById('quit-confirm-ok');
        if (this.quitConfirmCancel) this.quitConfirmCancel.onclick = () => this.hideQuitConfirmModal('cancel');
        if (this.quitConfirmOk) this.quitConfirmOk.onclick = () => this.hideQuitConfirmModal('ok');

        // choice/주인공 대사 지원
        this.injectQueue = [];
        this.flags = {};

        // 초기 UI 상태 설정
        this.updateTopUIVisibility();
        
        // 배틀 모드와 동일한 화면 대응 (resize) + 폴더블 대응
        this.container = document.getElementById('game-container');
        this.currentScale = 1;
        this.resize();
        let resizeScheduled = false;
        const onViewportChange = () => {
            this.resize();
            this.notifyBattleViewport();
            this.syncQuitModalViewport();
        };
        const runResizeSequence = () => {
            onViewportChange();
            if (resizeScheduled) return;
            resizeScheduled = true;
            requestAnimationFrame(() => { onViewportChange(); resizeScheduled = false; });
        };
        const throttleMs = 200;
        let lastResize = 0;
        const onViewportChangeThrottled = () => {
            const now = Date.now();
            if (now - lastResize >= throttleMs) { lastResize = now; onViewportChange(); }
        };
        window.addEventListener('resize', runResizeSequence);
        window.addEventListener('orientationchange', runResizeSequence);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', runResizeSequence);
            window.visualViewport.addEventListener('scroll', onViewportChangeThrottled);
        }
        window.addEventListener('load', () => runResizeSequence());
    }
    
    resize() {
        if (!this.container) return;
        const vp = window.visualViewport;
        const w = (vp ? vp.width : window.innerWidth) || document.documentElement.clientWidth || DESIGN_WIDTH;
        const h = (vp ? vp.height : window.innerHeight) || document.documentElement.clientHeight || DESIGN_HEIGHT;
        document.documentElement.style.setProperty('--vp-width', w + 'px');
        document.documentElement.style.setProperty('--vp-height', h + 'px');
        const targetRatio = DESIGN_WIDTH / DESIGN_HEIGHT;
        const windowRatio = w / h;
        this.currentScale = windowRatio < targetRatio ? w / DESIGN_WIDTH : h / DESIGN_HEIGHT;
        this.container.style.transform = `translate(-50%, -50%) scale(${this.currentScale})`;
        this.container.style.transformOrigin = 'center center';
    }

    notifyBattleViewport() {
        if (!this.isInBattle || !this.battleFrame || !this.battleOverlay) return;
        try {
            const vp = window.visualViewport;
            const w = Math.floor((vp ? vp.width : window.innerWidth) || document.documentElement.clientWidth || DESIGN_WIDTH);
            const h = Math.floor((vp ? vp.height : window.innerHeight) || document.documentElement.clientHeight || DESIGN_HEIGHT);
            if (w > 0 && h > 0) {
                this.battleFrame.style.width = w + 'px';
                this.battleFrame.style.height = h + 'px';
                const win = this.battleFrame.contentWindow;
                if (win) {
                    win.postMessage({ type: 'viewportDimensions', width: w, height: h }, '*');
                }
            }
        } catch (e) {}
    }

    showQuitConfirmModal() {
        if (this.quitConfirmModal) {
            this.syncQuitModalViewport();
            this.quitConfirmModal.classList.remove('hidden');
        }
    }
    syncQuitModalViewport() {
        const overlay = this.quitConfirmModal;
        if (!overlay) return;
        const vp = window.visualViewport;
        const w = (vp ? vp.width : window.innerWidth) || document.documentElement.clientWidth || DESIGN_WIDTH;
        const h = (vp ? vp.height : window.innerHeight) || document.documentElement.clientHeight || DESIGN_HEIGHT;
        if (w <= 0 || h <= 0) return;
        const targetRatio = DESIGN_WIDTH / DESIGN_HEIGHT;
        const windowRatio = w / h;
        const scale = windowRatio < targetRatio ? w / DESIGN_WIDTH : h / DESIGN_HEIGHT;
        overlay.style.width = w + 'px';
        overlay.style.height = h + 'px';
        overlay.style.left = '0';
        overlay.style.top = '0';
        document.documentElement.style.setProperty('--quit-scale', String(scale));
    }
    hideQuitConfirmModal(choice) {
        if (this.quitConfirmModal) this.quitConfirmModal.classList.add('hidden');
        try {
            const win = this.battleFrame?.contentWindow;
            if (win) win.postMessage({ type: choice === 'ok' ? 'quitConfirmOk' : 'quitConfirmCancel' }, '*');
        } catch (e) {}
    }

    // 상단 버튼 표시/숨김 관리
    updateTopUIVisibility() {
        const hasCharacter = this.uiImg && (
            (this.uiImg.style.opacity > 0 && this.uiImg.src) ||
            (this.uiImgNext && this.uiImgNext.style.opacity > 0 && this.uiImgNext.src)
        );
        const isEpisodeShowing = this.episodeLayer && this.episodeLayer.classList.contains('show');
        const baseVisible = hasCharacter && !isEpisodeShowing && this.data;

        if (this.backBtn) {
            this.backBtn.style.display = baseVisible ? "block" : "none";
        }
        if (this.touchBtn) {
            // 몬스터(mon_*) 장면, 프롤로그(memory), 골드 던전 인트로, 업그레이드 상점 인트로, 비밀 상점 인트로에서는 터치모드 버튼 숨김
            const isGoldDungeonIntro = this.data?.id === "gold_dungeon_intro" || this.data?.goldDungeonReturnToMain;
            const isShopIntro = this.data?.shopReturnToShop;
            const isGoldShopIntro = this.data?.goldShopReturnToShop;
            const isGuildIntro = this.data?.guildReturnToGuild;
            const shouldShowTouch = baseVisible && !this.isMonsterScene && this.data?.id !== "memory" && this.data?.id !== "lily_goddess_gift" && !isGoldDungeonIntro && !isShopIntro && !isGoldShopIntro && !isGuildIntro;
            this.touchBtn.style.display = shouldShowTouch ? "block" : "none";
        }
    }

    // 시스템 사운드. 버튼/터치는 경비대장 타자기(dialogue_npc) 톤 사용. 그 외 MP3 또는 톤
    playSound(type) {
        if (type === 'dialogue_npc' && this.data?.id === 'memory') type = 'dialogue';
        const paths = window.SOUND_PATHS || {};
        const effectTypes = ['heart', 'shop_purchase', 'gold_shop_purchase'];
        const url = effectTypes.includes(type) && paths[type];
        if (url) {
            try {
                let a = this._effectSoundCache[type];
                if (!a) {
                    a = new Audio(url);
                    a.volume = 0.8;
                    this._effectSoundCache[type] = a;
                }
                a.currentTime = 0;
                a.play().catch(() => {});
            } catch (e) {}
            return;
        }

        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        let freq = 523;
        let duration = 0.06;
        let vol = 0.25;
        osc.type = 'triangle';

        switch(type) {
            case 'narration': freq = 440; duration = 0.07; break;
            case 'dialogue': freq = 659; duration = 0.05; break;
            case 'dialogue_npc': freq = 520; duration = 0.055; osc.type = 'sine'; break;
            case 'click':
            case 'touch': freq = 520; duration = 0.055; osc.type = 'sine'; break;
            case 'heart': freq = 523; duration = 0.25; osc.frequency.exponentialRampToValueAtTime(1047, this.audioCtx.currentTime + 0.25); osc.type = 'sine'; break;
        }

        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    // events 배열에서 type:"episode" 씬 정보 추출
    getEpisodeList(data) {
        if (!data?.events) return [];
        const events = data.events;
        return events
            .map((s, i) => {
                if (s.type !== "episode") return null;
                let bg = null;
                for (let j = i + 1; j < events.length; j++) {
                    if (events[j].type === "episode") break;
                    if (events[j].type === "bg" && events[j].bg) {
                        bg = events[j].bg.startsWith("/") || events[j].bg.includes("://") ? events[j].bg : `./${events[j].bg}`;
                        break;
                    }
                }
                return { index: i, title: (s.title || "").trim(), image: bg };
            })
            .filter(Boolean);
    }

    getClearedEpisodes(charId) {
        try {
            const raw = localStorage.getItem(`episodeClear_${charId}`);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch { return []; }
    }

    markEpisodeCleared(charId, episodeIndex) {
        const cleared = this.getClearedEpisodes(charId);
        if (cleared.includes(episodeIndex)) return;
        cleared.push(episodeIndex);
        try { localStorage.setItem(`episodeClear_${charId}`, JSON.stringify(cleared)); } catch (e) {}
    }

    resetGameState(opts = {}) {
        if (this.typeTimeout) clearTimeout(this.typeTimeout);
        this.typeTimeout = null;
        if (this._episodeEndTimeout) clearTimeout(this._episodeEndTimeout);
        this._episodeEndTimeout = null;
        this.data = null; // 나가기 확인 시 버블된 클릭이 next() 호출하지 않도록

        this.injectQueue = [];
        this.flags = {};
        this._episodeStartBgTransition = false;
        this._memoryParticlesSpawned = false;
        this._postBattleBgTransition = false;
        this.isTyping = false;
        this.isTransitioning = false;
        this.currentFullText = "";
        this.currentImageKey = "";
        this.isMonsterScene = false;

        if (this._episodeClickHandler && this.episodeLayer) {
            this.episodeLayer.removeEventListener("click", this._episodeClickHandler);
            this._episodeClickHandler = null;
        }
        if (this._episodeEndHandler && this.episodeLayer) {
            this.episodeLayer.removeEventListener("click", this._episodeEndHandler);
            this._episodeEndHandler = null;
        }
        if (this.episodeLayer) this.episodeLayer.classList.remove("show");
        if (this.uiWhite && !opts.keepWhite) {
            this.uiWhite.classList.remove("black-out");
            this.uiWhite.style.opacity = "0";
            this.uiWhite.style.transition = "";
        }
        if (this.modal) this.modal.classList.remove("show-modal");
        if (this.endingOverlay) this.endingOverlay.classList.add("hidden");
        if (this.endingTextDisplay) this.endingTextDisplay.style.opacity = "0";

        if (this.isInBattle) this.closeBattleOverlay();
        this.isInBattle = false;
        this.isDungeonBattle = false;
        this.currentBattleStageId = null;
        if (this.container) {
            delete this.container.dataset.memory;
            delete this.container.dataset.goldDungeonIntro;
            delete this.container.dataset.guildIntro;
        }

        if (this.floatingWrapper) {
            this.floatingWrapper.dataset.pos = "center";
        }
        if (this.uiImg) {
            this.uiImg.src = "";
            this.uiImg.style.opacity = "0";
            this.uiImg.style.transition = "";
        }
        if (this.uiImgNext) {
            this.uiImgNext.src = "";
            this.uiImgNext.style.opacity = "0";
            this.uiImgNext.style.transition = "";
        }
        if (this.sceneItemImage) {
            this.sceneItemImage.classList.add('hidden');
            const imgEl = this.sceneItemImage.querySelector('img');
            if (imgEl) imgEl.src = '';
        }
        if (this.guardsWrap) {
            this.guardsWrap.classList.add('hidden');
            if (this.guardLeft) this.guardLeft.src = '';
            if (this.guardRight) this.guardRight.src = '';
        }
        if (this.bgLayer) {
            this.bgLayer.style.backgroundImage = "";
            this.bgLayer.style.opacity = "0";
            this.bgLayer.style.transition = "";
        }

        if (this.uiName) this.uiName.style.display = "none";
        if (this.uiText) this.uiText.innerText = "";
        if (this.uiNextIndicator) this.uiNextIndicator.classList.add("hidden");
        if (this.uiLayer) this.uiLayer.style.opacity = "1";

        this.setDialogueUIVisible(false);
        this.hideNextIndicator();
    }

    init(characterData, startEventIndex = -1) {
        this.resetGameState();
        this.data = characterData;
        if (this.container) {
            if (characterData?.id === 'memory' || characterData?.id === 'lily_goddess_gift') this.container.dataset.memory = '1';
            else delete this.container.dataset.memory;
            if (characterData?.goldDungeonReturnToDungeon || characterData?.goldDungeonReturnToMain) this.container.dataset.goldDungeonIntro = '1';
            else delete this.container.dataset.goldDungeonIntro;
            if (characterData?.guildReturnToGuild) this.container.dataset.guildIntro = '1';
            else delete this.container.dataset.guildIntro;
        }
        this.startEventIndex = startEventIndex;
        this.currentIndex = startEventIndex < 0 ? -1 : startEventIndex - 1;
        this.episodeList = this.getEpisodeList(characterData);
        this.isTouchMode = false;
        this.touchCount = 0;
        const gc = this.container || document.getElementById('game-container');
        if (gc) gc.classList.remove('menu-visible');
        // 길드 메인 등에서 pointer-events: none 했던 시나리오 레이어 복원
        ['character-layer', 'ui-layer', 'bg-layer', 'episode-layer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.pointerEvents = '';
        });
        this.setDialogueUIVisible(true);
        this.touchBtn.innerText = "터치하기";
        this.next();
    }

    goToEpisodeSelectScreen() {
        this.resetGameState();
        if (window._goddessGiftReturnChar && typeof window.showEpisodeSelect === 'function') {
            const char = window._goddessGiftReturnChar;
            window._goddessGiftReturnChar = null;
            window.showEpisodeSelect(char);
            return;
        }
        if (typeof window.showEpisodeSelectFromGame === 'function') {
            window.showEpisodeSelectFromGame();
        }
    }

    showEpisodeEndTransition(episodeNum) {
        if (!this.episodeLayer || !this.episodeTitle || !this.bgLayer) {
            this.goToEpisodeSelectScreen();
            return;
        }
        if (this.backBtn) this.backBtn.style.display = 'none';
        if (this.touchBtn) this.touchBtn.style.display = 'none';

        const isLastEp = this.episodeList && episodeNum === this.episodeList.length - 1;
        const epLabel = isLastEp ? 'Epilogue' : `Episode ${episodeNum + 1}`;
        this.episodeTitle.innerText = `- ${epLabel} 끝 -`;
        this.episodeTitle.style.opacity = '0';
        this.episodeTitle.style.transform = 'translateY(19px)';

        if (this._episodeEndHandler) {
            this.episodeLayer.removeEventListener('click', this._episodeEndHandler);
            this._episodeEndHandler = null;
        }

        // 1. 대사창 슬라이드 다운 → 2. 페이드 아웃 → 3. "에피소드 끝" 표시
        this.setDialogueUIVisible(false);
        setTimeout(() => {
            this.bgLayer.style.transition = 'opacity 0.8s ease';
            this.bgLayer.style.opacity = '0';
            setTimeout(() => {
                this.episodeLayer.classList.add('show');
                this.episodeTitle.style.transition = 'opacity 0.6s ease 0.2s, transform 0.5s ease 0.2s';
                this.episodeTitle.style.opacity = '1';
                this.episodeTitle.style.transform = 'translateY(0)';
            }, 800);
        }, 520);

        const goToSelect = (fromClick = false) => {
            if (this._episodeEndTimeout) clearTimeout(this._episodeEndTimeout);
            this._episodeEndTimeout = null;
            this.episodeLayer.removeEventListener('click', this._episodeEndHandler);
            this._episodeEndHandler = null;
            if (fromClick) this.playSound('click');
            this.episodeLayer.style.transition = 'opacity 2s ease-out';
            this.episodeLayer.classList.remove('show');
            setTimeout(() => this.goToEpisodeSelectScreen(), 2200);
        };

        this._episodeEndHandler = () => goToSelect(true);
        setTimeout(() => this.episodeLayer.addEventListener('click', this._episodeEndHandler), 1800);
        this._episodeEndTimeout = setTimeout(() => goToSelect(false), 4500);
    }

    formatText(text) {
        if (!text) return "";
        return text.trim();
    }

    /**
     * 대사/나레이션 줄바꿈 규칙 (던전 보고서 스타일)
     * - 줄바꿈은 다음 세 가지에서만: (1) 마침표/느낌표/물음표 뒤  (2) 스크립트 \n  (3) 말줄임표 5자 이상 뒤
     * - 한 문장이 오른쪽 끝을 넘으면, 위 규칙에 해당하는 위치 중 가장 마지막에서 줄바꿈하고 다음 줄에 이어서 출력
     * - 해당 위치가 없으면 오른쪽 끝에서 끊어서 다음 줄에 이어감
     * @param {string} text - 원문
     * @param {HTMLElement} [optTextEl] - 측정용 스타일/너비 기준이 되는 텍스트 요소 (배틀 인트로용, 생략 시 this.uiText)
     * @param {HTMLElement} [optLayerEl] - 패딩/너비 기준 레이어 (생략 시 this.uiLayer)
     */
    insertLineBreaksForWrap(text, optTextEl, optLayerEl) {
        const textEl = optTextEl || this.uiText;
        const layerEl = optLayerEl || this.uiLayer;
        if (!textEl || !layerEl || !text) return text;
        /* 1080×1920 디자인 기준 고정 너비 + 고정 폰트 크기로 측정 → PC/모바일 동일 줄바꿈 (텍스트 크기 차이 무관) */
        const maxWidth = Math.max(200, DESIGN_DIALOGUE_MAX_WIDTH);
        const fontFamily = (textEl && getComputedStyle(textEl).fontFamily) || "'Nanum Square Round', 'Apple SD Gothic Neo', Malgun Gothic, sans-serif";
        const measure = document.createElement('span');
        measure.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;pointer-events:none;` +
            `font:${DESIGN_DIALOGUE_FONT_SIZE_PX}px ${fontFamily};font-weight:normal;font-style:normal;letter-spacing:normal;`;
        layerEl.appendChild(measure);

        /** 줄바꿈 허용 위치: 마침표(.。) / 느낌표(!) / 물음표(?) / 쉼표(,) / 공백 / 말줄임표 5자 이상 뒤. 가장 마지막 위치 반환. */
        function findLastPreferredBreak(chunk) {
            let best = -1;
            for (let i = 0; i < chunk.length; i++) {
                const ch = chunk[i];
                if (ch === '.' || ch === '!' || ch === '?' || ch === '\u3002' || ch === ',' || ch === '\uFF0C' || ch === ' ') best = i + 1; // 。 전각쉼표 공백
            }
            const ellipsisRun = /[.\u2026]{5,}/g;
            let m;
            while ((m = ellipsisRun.exec(chunk)) !== null) {
                if (m.index + m[0].length > best) best = m.index + m[0].length;
            }
            return best;
        }

        /** 한 단락을 오른쪽 끝까지 채우고, 넘치면 허용 위치에서만 줄바꿈. 허용 위치 없으면 단어 통째로 다음 줄로. */
        const wrapSingle = (line) => {
            const out = [];
            let chunk = '';
            for (let i = 0; i < line.length; i++) {
                const c = line[i];
                measure.textContent = chunk + c;
                if (measure.offsetWidth > maxWidth && chunk.length > 0) {
                    const preferred = findLastPreferredBreak(chunk);
                    const breakAt = preferred > 0 ? preferred : chunk.length;
                    if (preferred > 0) {
                        out.push(chunk.substring(0, breakAt));
                        chunk = chunk.substring(breakAt) + c;
                    } else {
                        /* 허용 위치 없음: 단어 중간 끊기 방지. 이어 붙여서 다음에 쉼표/공백 등에서 끊기 */
                        chunk = chunk + c;
                    }
                } else {
                    chunk += c;
                }
            }
            if (chunk) out.push(chunk);
            return out.join('\n');
        };

        const paragraphs = text.split(/\r?\n/);
        const wrapped = paragraphs.map(wrapSingle);
        measure.remove();
        return wrapped.join('\r');
    }

async changeImage(newImageName) {
    if (!newImageName || !this.uiImg || !this.uiImgNext) return;

    this.currentImageKey = newImageName;
    // 파일명에 mon_ 이 포함되면 몬스터/적 장면으로 간주
    this.isMonsterScene = /(^mon[_\d])|\/mon_/.test(newImageName);

    const path = newImageName.includes("/") ? newImageName : `assets/images/${this.data.id}/${newImageName}.png`;
    const fullPath = path.includes("://") ? path : (path.startsWith("/") ? path : `./${path}`);

    // 이미지가 이미 같은 경우, opacity만 조정
    const currentImg = this.uiImg.style.opacity > 0 ? this.uiImg : this.uiImgNext;
    if (currentImg.src && currentImg.src.includes(path)) {
        if (currentImg === this.uiImgNext) {
            // next가 보이고 있으면 교체
            this.uiImg.style.opacity = 0;
            this.uiImgNext.style.opacity = 1;
            [this.uiImg, this.uiImgNext] = [this.uiImgNext, this.uiImg];
        } else {
            currentImg.style.opacity = 1;
        }
        return;
    }

    // 현재 보이는 이미지와 교체할 이미지 결정
    const currentVisible = this.uiImg.style.opacity > 0 ? this.uiImg : this.uiImgNext;
    const nextImage = currentVisible === this.uiImg ? this.uiImgNext : this.uiImg;

    // 여신(godness)은 천천히 페이드 인
    const isGoddess = /godness/i.test(newImageName);
    const fadeDuration = isGoddess ? "1.8s" : "0.4s";
    const fadeMs = isGoddess ? 1850 : 400;

    // 새 이미지 로드 (로드 완료 후 크로스페이드 → 좌우 튐 방지)
    nextImage.style.opacity = 0;
    nextImage.style.transition = `opacity ${fadeDuration} ease-in-out`;
    nextImage.style.zIndex = "3";
    nextImage.src = fullPath;
    await new Promise((resolve) => {
        if (nextImage.complete && nextImage.naturalWidth) return resolve();
        nextImage.onload = resolve;
        nextImage.onerror = resolve;
        setTimeout(resolve, 1500); // 로드 실패 시 폴백 (여신 등 이미지 404 시 멈춤 방지)
    });

    // 현재 이미지 페이드 아웃
    currentVisible.style.transition = `opacity ${fadeDuration} ease-in-out`;
    currentVisible.style.zIndex = "2";

    // 크로스페이드 시작
    await new Promise(resolve => setTimeout(resolve, 25));
    nextImage.style.opacity = 1;
    currentVisible.style.opacity = 0;

    // 교체 완료 후 상태 정리
    await new Promise(resolve => setTimeout(resolve, fadeMs));
    currentVisible.style.zIndex = "1";

    this.updateTopUIVisibility();
}

    fadeOutCharacter() {
        if (!this.uiImg || !this.uiImgNext) return Promise.resolve();
        const visible = this.uiImg.style.opacity > 0 ? this.uiImg : this.uiImgNext;
        if (parseFloat(visible.style.opacity || 0) <= 0) return Promise.resolve();
        const isMemory = this.data?.id === "memory";
        const duration = isMemory ? "1.5s" : "0.35s";
        const ms = isMemory ? 1550 : 380;
        visible.style.transition = `opacity ${duration} ease-out`;
        visible.style.opacity = 0;
        return new Promise(r => setTimeout(r, ms));
    }

changeBackground(bgUrl, transition = "fade") {
    if (!this.bgLayer || !bgUrl) return Promise.resolve();

    // 상대 경로 해석: ./ 없으면 추가, 절대 URL로 변환 (서브경로/다양한 배포 환경 대응)
    let resolved = bgUrl;
    if (!bgUrl.startsWith("/") && !bgUrl.includes("://")) {
        const withBase = bgUrl.startsWith("./") ? bgUrl : `./${bgUrl}`;
        try {
            resolved = new URL(withBase, window.location.href).href;
        } catch (e) {
            resolved = withBase;
        }
    }

    const setBg = () => {
        this.bgLayer.style.backgroundImage = `url('${resolved}')`;
    };

    if (transition === "fade") {
        // 배경이 이미 검은색(opacity 0)인 경우 바로 새 배경으로 변경
        if (this.bgLayer.style.opacity === "0") {
            setBg();
            // 프롤로그 첫 배경은 천천히 페이드 인
            const isMemoryFirstBg = this.data?.id === "memory";
            const fadeDuration = isMemoryFirstBg ? "1.8s" : "0.45s";
            const fadeMs = isMemoryFirstBg ? 1900 : 500;
            this.bgLayer.style.transition = `opacity ${fadeDuration} ease`;
            setTimeout(() => {
                this.bgLayer.style.opacity = "1";
            }, 50);
            return new Promise(r => setTimeout(r, fadeMs));
        } else {
            // 기존 배경이 보이는 경우 페이드 아웃 후 변경 (프롤로그 bg 교차는 천천히)
            const isMemoryBgCross = this.data?.id === "memory";
            const fadeDuration = isMemoryBgCross ? "1.5s" : "0.45s";
            const fadeMs = isMemoryBgCross ? 1500 : 450;
            const totalMs = isMemoryBgCross ? 3000 : 900;
            this.bgLayer.style.transition = `opacity ${fadeDuration} ease`;
            this.bgLayer.style.opacity = "0";
            setTimeout(() => {
                setBg();
                this.bgLayer.style.transition = `opacity ${fadeDuration} ease`;
                this.bgLayer.style.opacity = "1";
            }, fadeMs);
            return new Promise(r => setTimeout(r, totalMs));
        }
    } else {
        setBg();
        this.bgLayer.style.opacity = "1";
        return Promise.resolve();
    }
}

setDialogueUIVisible(isVisible) {
    if (!this.uiLayer) return;
    this.uiLayer.classList.toggle("ui-hidden", !isVisible);
    this.uiLayer.classList.toggle("ui-shown", isVisible);
    // 프롤로그 등: UI 숨긴 뒤에도 터치/클릭으로 다음으로 진행되도록
    if (!this.container) return;
    if (isVisible) {
        if (this._advanceWhenUiHidden) {
            this.container.removeEventListener("click", this._advanceWhenUiHidden);
            this.container.removeEventListener("touchstart", this._advanceWhenUiHidden);
            this._advanceWhenUiHidden = null;
        }
    } else {
        if (!this._advanceWhenUiHidden) {
            const advance = () => {
                if (this.uiLayer && this.uiLayer.classList.contains("ui-hidden") && this.data) {
                    this.next();
                }
            };
            this._advanceWhenUiHidden = (e) => { e.preventDefault(); advance(); };
            this.container.addEventListener("click", this._advanceWhenUiHidden);
            this.container.addEventListener("touchstart", this._advanceWhenUiHidden, { passive: false });
        }
    }
}

async handleActor(scene) {
    const action = scene.action || "change";

    if (action === "hide") {
        if (this.uiImg) this.uiImg.style.opacity = 0;
        if (this.uiImgNext) this.uiImgNext.style.opacity = 0;
        this.updateTopUIVisibility();
        return;
    }

    const pos = scene.pos || "center";
    if (this.floatingWrapper) {
        this.floatingWrapper.dataset.pos = pos;
    }

    // show / change (교차 교체만)
    if (scene.image) {
        await this.changeImage(scene.image);
        const visibleImg = this.uiImg.style.opacity > 0 ? this.uiImg : this.uiImgNext;
        if (visibleImg) visibleImg.style.opacity = 1;
    }

    this.updateTopUIVisibility();
}

async handleGuardsEnter(scene) {
    if (!this.guardsWrap || !this.guardLeft || !this.guardRight) return;
    const leftSrc = scene.left ? (scene.left.startsWith('/') || scene.left.includes('://') ? scene.left : `./${scene.left}`) : '';
    const rightSrc = scene.right ? (scene.right.startsWith('/') || scene.right.includes('://') ? scene.right : `./${scene.right}`) : '';
    this.guardLeft.src = leftSrc;
    this.guardRight.src = rightSrc;
    this.guardLeft.style.opacity = '0';
    this.guardRight.style.opacity = '0';
    this.guardLeft.style.transform = 'translateX(-100%)';
    this.guardRight.style.transform = 'translateX(100%)';
    this.guardsWrap.classList.remove('hidden');
    this.guardsWrap.classList.remove('guards-aside');
    this.guardsWrap.classList.add('guards-enter');
    await new Promise(r => setTimeout(r, 100));
    this.guardLeft.style.transition = 'opacity 0.6s ease, transform 0.8s ease-out';
    this.guardRight.style.transition = 'opacity 0.6s ease, transform 0.8s ease-out';
    this.guardLeft.style.opacity = '1';
    this.guardRight.style.opacity = '1';
    this.guardLeft.style.transform = 'translateX(0)';
    this.guardRight.style.transform = 'translateX(0)';
    await new Promise(r => setTimeout(r, 1000));
}

async handleGuardsStepAside(scene) {
    if (!this.guardsWrap || !this.guardLeft || !this.guardRight) return;
    this.guardsWrap.classList.remove('guards-enter');
    this.guardsWrap.classList.add('guards-aside');
    this.guardLeft.style.transition = 'transform 0.6s ease-out';
    this.guardRight.style.transition = 'transform 0.6s ease-out';
    this.guardLeft.style.transform = 'translateX(-100%)';
    this.guardRight.style.transform = 'translateX(100%)';
    await new Promise(r => setTimeout(r, 700));
}

showEpisode(scene, eventIndex) {
    if (!this.episodeLayer || !this.episodeTitle) {
        this.next();
        return;
    }

    // 현재 에피소드 번호 (0, 1, 2 ...)
    const epIdx = this.episodeList.findIndex((ep) => ep.index === eventIndex);
    const isLastEpisode = epIdx >= 0 && epIdx === this.episodeList.length - 1;

    // 에피소드 표시 전에 배경을 검은색으로 페이드 아웃
    if (this.bgLayer) {
        this.bgLayer.style.transition = "opacity 0.3s ease";
        this.bgLayer.style.opacity = "0";
    }

    this.episodeTitle.innerText = this.formatText(scene.title || "");
    this.episodeLayer.classList.toggle("memory-prologue", this.data?.id === "memory");
    this.setDialogueUIVisible(false);
    this.updateTopUIVisibility(); // 에피소드 표시 시 버튼 숨김

    if (this._episodeClickHandler) {
        this.episodeLayer.removeEventListener("click", this._episodeClickHandler);
        this._episodeClickHandler = null;
    }

    // 배경이 완전히 검게 된 후 에피소드 표시
    setTimeout(() => {
        this.episodeLayer.classList.add("show");
    }, 300);

    this._episodeClickHandler = () => {
        this.playSound('click');
        this.episodeLayer.classList.remove("show");
        this.episodeLayer.removeEventListener("click", this._episodeClickHandler);
        this._episodeClickHandler = null;

        // 이전 에피소드 클리어 기록 (에피소드 2를 볼 때 = 에피소드 1 클리어)
        if (epIdx > 0 && this.data?.id) {
            this.markEpisodeCleared(this.data.id, epIdx - 1);
        }

        // 배경을 검은색으로 유지한 채로 다음 씬으로 진행
        setTimeout(() => {
            this.updateTopUIVisibility(); // 에피소드 종료 후 버튼 다시 표시
            this._episodeStartBgTransition = true;
            this.next();
        }, 600);
    };

    this.episodeLayer.addEventListener("click", this._episodeClickHandler);
}

    toggleTouchMode() {
        if (!this.data) return;
        this.playSound('click');
        this.isTouchMode = !this.isTouchMode;
        if (this.isTouchMode) {
            // 터치모드: 대사창을 아래로 슬라이드
            this.uiLayer.style.transition = "transform 0.5s ease-in-out, opacity 0.3s ease-in-out";
            this.uiLayer.classList.add('hidden');
            this.uiLayer.classList.remove('ui-shown');
            this.touchBtn.innerText = "이벤트 복귀";
        } else {
            // 이벤트 모드: 대사창을 위로 슬라이드
            this.uiLayer.style.transition = "transform 0.5s ease-in-out, opacity 0.3s ease-in-out";
            this.setDialogueUIVisible(true);
            this.touchBtn.innerText = "터치하기";
        }
    }

    handleTouchInteraction(e) {
        if (!this.isTouchMode || !this.data) return;
        e.preventDefault();
        this.playSound('touch');
        const touch = e.touches ? e.touches[0] : e;
        const container = this.container || document.getElementById('game-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const scale = this.currentScale || 1;
        // `#game-container`는 translate/scale(transform)로 화면 대응을 하므로
        // client 좌표를 컨테이너 내부 좌표(1080x1920 기준)로 변환해야 정확히 찍힙니다.
        const x = (touch.clientX - rect.left) / scale;
        const y = (touch.clientY - rect.top) / scale;

        // 파티클 생성
        for (let i = 0; i < 7; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.innerText = '♥';
            const angle = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 120;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist - 30;
            const tr = -60 + Math.random() * 120;
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.setProperty('--tw-x', `${tx}px`);
            particle.style.setProperty('--tw-y', `${ty}px`);
            particle.style.setProperty('--tw-r', `${tr}deg`);
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 1200);
        }

        // 쉐이크 (floating과 분리되어 있어 정지되지 않음)
        const visibleImg = (this.uiImg && this.uiImg.style.opacity > 0) ? this.uiImg : this.uiImgNext;
        if (visibleImg) {
            visibleImg.classList.remove('shake-anim');
            // 강제로 리플로우하여 애니메이션 재시작
            void visibleImg.offsetWidth;
            visibleImg.classList.add('shake-anim');
        }

        this.touchCount++;
        if (this.touchCount % 5 === 0) {
            this.playSound('heart');
            this.talkBubble.classList.add('active');
            setTimeout(() => this.talkBubble.classList.remove('active'), 1500);
        }
    }
next(skipCooldown = false) {
    if (!this.data) return;
    if (this.isTouchMode || this.modal.classList.contains('show-modal')) return;
    if (this.isTransitioning) return;
    const now = Date.now();
    if (!skipCooldown && now < this._dialogueClickCooldownUntil) return;
    const COOLDOWN_MS = 380;
    if (this.isTyping) { if (!skipCooldown) this._dialogueClickCooldownUntil = now + COOLDOWN_MS; this.skipTyping(); return; }

    // ✅ choice 결과 등 "끼워넣기" 씬이 있으면 먼저 재생 (인덱스 증가 없음)
    if (this.injectQueue && this.injectQueue.length > 0) {
        if (!skipCooldown) this._dialogueClickCooldownUntil = now + COOLDOWN_MS;
        const injected = this.injectQueue.shift();
        this.render(injected);
        return;
    }

    if (!skipCooldown) this._dialogueClickCooldownUntil = now + COOLDOWN_MS;
    this.currentIndex++;
    const scene = this.data.events[this.currentIndex];
    if (!scene) { this.triggerEndingSequence(); return; }

        if (scene.type === "episode") {
            if (this.startEventIndex >= 0 && this.currentIndex !== this.startEventIndex) {
                const epIdx = this.episodeList.findIndex((ep) => ep.index === this.currentIndex);
                if (epIdx > 0 && this.data?.id) {
                    this.markEpisodeCleared(this.data.id, epIdx - 1);
                }
                this.showEpisodeEndTransition(epIdx - 1);  // 방금 끝난 에피소드 = 다음 헤더의 이전
                return;
            }
            this.showEpisode(scene, this.currentIndex);
            return;
        }


    // ✅ 연출 커맨드 씬: 자동 진행 (클릭 소모 없음)
    if (scene.type === "bg") {
        if (this.uiText) this.uiText.innerText = "";
        this.setDialogueUIVisible(false);

        const nextScene = this.data.events[this.currentIndex + 1];
        const imageToShow = scene.image || (nextScene && (nextScene.type === "dialogue" || nextScene.type === "narration" || nextScene.type === "actor") && nextScene.image);
        const hasNextImage = !!imageToShow;
        const hasCurrentChar = this.uiImg && this.uiImgNext && (parseFloat(this.uiImg.style.opacity || 0) > 0 || parseFloat(this.uiImgNext.style.opacity || 0) > 0);

        const runTransition = () => {
            this.isTransitioning = true;
            let p = Promise.resolve();
            const isPostBattle = this._postBattleBgTransition;

            if (isPostBattle) {
                this.closeBattleOverlay();
                if (this.uiImg) {
                    this.uiImg.style.transition = 'none';
                    this.uiImg.style.opacity = 0;
                }
                if (this.uiImgNext) {
                    this.uiImgNext.style.transition = 'none';
                    this.uiImgNext.style.opacity = 0;
                }
            }
            if (hasCurrentChar && !isPostBattle) {
                p = p.then(() => this.fadeOutCharacter());
            }
            if (hasNextImage) {
                p = p.then(() => Promise.all([
                    this.changeBackground(scene.bg, isPostBattle ? "instant" : scene.transition),
                    this.changeImage(imageToShow)
                ]));
            } else {
                p = p.then(() => this.changeBackground(scene.bg, isPostBattle ? "instant" : scene.transition));
            }

            p.then(() => {
                if (isPostBattle) this.setDialogueUIVisible(true);
                this.isTransitioning = false;
                this.closeBattleOverlay();
                this._episodeStartBgTransition = false;
                this.next();
            }).catch(() => {
                this.isTransitioning = false;
            });
        };
        runTransition();
        return;
    }
    if (scene.type === "ui") {
        const isShow = scene.action === "show";
        if (isShow && this.uiText) this.uiText.innerText = "";
        this.setDialogueUIVisible(isShow);
        if (isShow) {
            this.closeBattleOverlay();
            setTimeout(() => this.next(), 520);
        } else {
            // 대사창 숨김 애니(0.5s) 끝난 뒤 여신 등장
            setTimeout(() => this.next(true), 520);
        }
        return;
    }
    if (scene.type === "actor") {
        this.isTransitioning = true;
        this.handleActor(scene).then(() => {
            this.isTransitioning = false;
            this.next();
        }).catch(() => {
            this.isTransitioning = false;
            this.next();
        });
        return;
    }
    if (scene.type === "guards_enter") {
        this.isTransitioning = true;
        this.handleGuardsEnter(scene).then(() => {
            this.isTransitioning = false;
            this.next();
        }).catch(() => {
            this.isTransitioning = false;
            this.next();
        });
        return;
    }
    if (scene.type === "guards_step_aside") {
        this.isTransitioning = true;
        this.handleGuardsStepAside(scene).then(() => {
            this.isTransitioning = false;
            this.next();
        }).catch(() => {
            this.isTransitioning = false;
            this.next();
        });
        return;
    }

    if (scene.type === "battle") {
        this.playSound('click');
        this.modalBtn.style.display = "";
        this.showBattleModal(scene);
    } else if (scene.type === "choice") {
        this.playSound('click');
        this.showChoiceModal(scene);
    } else {
        this.render(scene);
    }
}



    // 현재 씬/이미지에 맞는 이름 태그 텍스트 결정
    getSpeakerName(scene) {
        // 1) narration 은 이름 숨김
        if (scene.type === "narration") return null;

        // 2) mon_* 이미지면 stages.js 의 보스 이름 사용 시도
        const imgKey = scene.image || this.currentImageKey || "";
        if (imgKey && typeof window !== "undefined" && window.BATTLE_STAGES) {
            // mon_01, mon_1 등에서 숫자 부분을 뽑아 스테이지 번호로 사용
            const m = imgKey.match(/mon_(\d+)/);
            if (m) {
                const rawId = m[1];           // "01" 또는 "1"
                const numId = parseInt(rawId, 10);
                const key = String(isNaN(numId) ? rawId : numId); // "1", "2", ...
                const stageCfg = window.BATTLE_STAGES[key];
                if (stageCfg && stageCfg.boss && stageCfg.boss.name) {
                    return stageCfg.boss.name;
                }
            }
        }

        // 3) 그 외에는 씬에 speaker 지정이 있으면 사용, 없으면 캐릭터 기본 이름
        return scene.speaker || (this.data && this.data.name) || "";
    }

    isMonsterSpeaker(scene) {
        const imgKey = scene?.image || this.currentImageKey || "";
        return /(^mon[_\d])|\/mon_/.test(imgKey);
    }

    async render(scene) {
        if (scene.type === "narration" && !this._memoryParticlesSpawned) {
            const shouldSpawn = (this.data?.id === "memory") || (scene.spawnGoddessParticles === true);
            if (shouldSpawn) {
                this._memoryParticlesSpawned = true;
                if (typeof window.spawnMemoryGoddessParticles === "function") window.spawnMemoryGoddessParticles();
            }
        }
        if (this.sceneItemImage) {
            const imgEl = this.sceneItemImage.querySelector('img');
            if (scene.itemImage && imgEl) {
                const path = scene.itemImage.startsWith('./') ? scene.itemImage : `./${scene.itemImage}`;
                imgEl.src = path;
                this.sceneItemImage.classList.remove('hidden');
            } else {
                this.sceneItemImage.classList.add('hidden');
                if (imgEl) imgEl.src = '';
            }
        }
        this.closeBattleOverlay();
        if (this.uiText) this.uiText.innerText = "";
        const uiWasHidden = this.uiLayer && this.uiLayer.classList.contains("ui-hidden");
        this.setDialogueUIVisible(true);

        if (scene.image) {
            this.isTransitioning = true;
            try {
                await this.changeImage(scene.image);
            } finally {
                this.isTransitioning = false;
            }
        }

        const prevType = this.currentSceneType;
        this.currentSceneType = scene.type;
        const isTextType = (t) => t === "narration" || t === "dialogue";
        const typeSwitched = prevType && isTextType(prevType) && isTextType(scene.type) && prevType !== scene.type;

        const speakerName = this.getSpeakerName(scene);
        const isMainChar = speakerName === (this.data?.name || "");
        const isProtagonist = speakerName === "주인공";
        const isMonster = this.isMonsterSpeaker(scene);
        this.currentVoiceType = (isProtagonist || isMonster || !isMainChar) && speakerName !== null ? "npc" : "main";

        if (speakerName === null) {
            this.uiName.style.display = "none";
            this.uiText.style.color = "#cc9900";
            this.uiText.style.fontStyle = "italic";
        } else {
            this.uiName.style.display = "inline-block";
            this.uiName.innerText = speakerName;
            this.uiText.style.color = "#fff";
            this.uiText.style.fontStyle = "normal";
        }

        this.hideNextIndicator();
        const rawText = this.formatText(scene.text);
        const baseDelay = uiWasHidden ? 550 : 0;
        const switchDelay = typeSwitched ? 120 : 0;
        const runTyping = () => {
            const wrappedText = this.insertLineBreaksForWrap(rawText);
            if (typeSwitched) this.uiText.innerText = "";
            setTimeout(() => this.startTyping(wrappedText), baseDelay + switchDelay);
        };
        requestAnimationFrame(() => { requestAnimationFrame(runTyping); });
        this.updateTopUIVisibility();
    }

    showNextIndicator() {
        if (!this.uiNextIndicator) return;
        if (this.currentSceneType !== "dialogue" && this.currentSceneType !== "narration") return;
        this.uiNextIndicator.classList.remove("hidden");
    }

    hideNextIndicator() {
        if (!this.uiNextIndicator) return;
        this.uiNextIndicator.classList.add("hidden");
    }

    startTyping(text) {
        if (this.typeTimeout) clearTimeout(this.typeTimeout);
        this.isTyping = true;
        this.isFastTyping = false;
        this.currentFullText = text;
        this.typingCharIndex = 0;
        this.uiText.innerText = "";
        
        let i = 0;
        const type = () => {
            if (i < text.length) {
                const char = text.charAt(i++);
                this.typingCharIndex = i;
                const nextChar = text.charAt(i);
                this.uiText.innerText += (char === '\r' ? '\n' : char);
                
                // 문장 부호 및 줄바꿈 딜레이 규칙 (원래 속도 유지)
                let delay = 75; 
                let skipSound = false;

                if (char === '\r' || char === '\n') {
                    const prevChar = i >= 2 ? text.charAt(i - 2) : '';
                    const pauseAtBreak = /[.?!,…]/.test(prevChar);
                    delay = pauseAtBreak ? 500 : 50;
                    skipSound = true;
                } else if (nextChar === '\r' || nextChar === '\n') { skipSound = true; }
                else if (char === ',') { delay = 300; skipSound = true; }
                else if (char === '.' && nextChar !== '.') { delay = 400; skipSound = true; }
                else if (char === '?' || char === '!') { delay = 400; skipSound = true; }

                if (!skipSound) {
                    if (this.currentSceneType === 'narration') this.playSound('narration');
                    else this.playSound(this.currentVoiceType === 'npc' ? 'dialogue_npc' : 'dialogue');
                }

                this.typeTimeout = setTimeout(type, delay); 
            } else {
                this.isTyping = false;
                this.showNextIndicator();
            }
        };
        type();
    }

    skipTyping() {
        clearTimeout(this.typeTimeout);
        this.typeTimeout = null;
        const text = this.currentFullText;
        const endOfParagraph = text.indexOf('\r', this.typingCharIndex);
        const endIdx = endOfParagraph === -1 ? text.length : endOfParagraph + 1;
        if (this.typingCharIndex >= endIdx) {
            this.typingCharIndex = endIdx;
            if (this.typingCharIndex >= text.length) {
                this.isTyping = false;
                this.showNextIndicator();
            }
            return;
        }
        this.fastTypeTo(endIdx);
    }

    fastTypeTo(endIdx) {
        this.isFastTyping = true;
        const text = this.currentFullText;
        const type = () => {
            if (this.typingCharIndex >= endIdx) {
                this.isFastTyping = false;
                if (this.typingCharIndex >= text.length) {
                    this.isTyping = false;
                    this.showNextIndicator();
                } else {
                    this.continueTyping();
                }
                return;
            }
            const char = text.charAt(this.typingCharIndex++);
            this.uiText.innerText += (char === '\r' ? '\n' : char);
            this.typeTimeout = setTimeout(type, 18);
        };
        type();
    }

    continueTyping() {
        const text = this.currentFullText;
        const type = () => {
            if (this.typingCharIndex >= text.length) {
                this.isTyping = false;
                this.showNextIndicator();
                return;
            }
            const char = text.charAt(this.typingCharIndex++);
            const nextChar = text.charAt(this.typingCharIndex);
            this.uiText.innerText += (char === '\r' ? '\n' : char);
            let delay = 75;
            let skipSound = false;
            if (char === '\r' || char === '\n') {
                const prevChar = this.typingCharIndex >= 2 ? text.charAt(this.typingCharIndex - 2) : '';
                delay = /[.?!,…]/.test(prevChar) ? 500 : 50;
                skipSound = true;
            } else if (nextChar === '\r' || nextChar === '\n') { skipSound = true; }
            else if (char === ',') { delay = 300; skipSound = true; }
            else if (char === '.' && nextChar !== '.') { delay = 400; skipSound = true; }
            else if (char === '?' || char === '!') { delay = 400; skipSound = true; }
            if (!skipSound) {
                if (this.currentSceneType === 'narration') this.playSound('narration');
                else this.playSound(this.currentVoiceType === 'npc' ? 'dialogue_npc' : 'dialogue');
            }
            this.typeTimeout = setTimeout(type, delay);
        };
        type();
    }

showChoiceModal(scene) {
    // scene: { type:"choice", title, body, choices:[{label?, text?, inject?}, ...] }
    this.hideNextIndicator();
    this.modalTitle.innerText = scene.title || "선택";
    this.modalBody.innerHTML = "";

    const p = document.createElement("div");
    p.style.whiteSpace = "pre-line";
    p.innerText = this.formatText(scene.body || "");
    this.modalBody.appendChild(p);

    const btnWrap = document.createElement("div");
    btnWrap.style.display = "flex";
    btnWrap.style.flexDirection = "column";
    btnWrap.style.gap = "10px";
    btnWrap.style.marginTop = "14px";

    const makeBtn = (label) => {
        const b = document.createElement("button");
        b.className = "modal-btn";
        b.innerText = label;
        return b;
    };

    const choices = Array.isArray(scene.choices) ? scene.choices : [];
    const safeChoices = choices.slice(0, 2);

    const onPick = (choiceObj) => {
        this.playSound('click');
        this.modal.classList.remove('show-modal');

        // modal 기본 버튼 복원
        this.modalBtn.style.display = "";

        // ✅ 분기 없음: 선택에 따른 "삽입 씬"만 다르게 재생하고, 이후는 동일 흐름
        const inject = Array.isArray(choiceObj?.inject) ? choiceObj.inject : null;

        if (inject && inject.length > 0) {
            // 선택 결과를 기록하고 싶으면 flags 사용 가능
            if (scene.flagKey) this.flags[scene.flagKey] = choiceObj.key ?? choiceObj.text ?? choiceObj.label ?? "choice";
            this.injectQueue.push(...inject);
            this.next();
            return;
        }

        // inject가 없으면, 선택 문구를 주인공 1줄로만 출력
        const line = choiceObj?.text || choiceObj?.label || "…";
        this.injectQueue.push({ type: "dialogue", speaker: "주인공", text: line });
        this.next();
    };

    safeChoices.forEach((c) => {
        const label = c.label || c.text || "…";
        const btn = makeBtn(label);
        btn.onclick = () => onPick(c);
        btnWrap.appendChild(btn);
    });

    this.modalBody.appendChild(btnWrap);

    // choice에서는 단일 버튼 숨김 (전투 모달은 그대로 사용)
    this.modalBtn.style.display = "none";

    this.modal.classList.add('show-modal');
}

    showBattleModal(scene) {
        this.hideNextIndicator();
        this.modalTitle.innerText = scene.title;
        this.modalBody.innerText = scene.body;
        this.modalBtn.onclick = () => {
            this.playSound('click');
            this.modal.classList.remove('show-modal');
            this.launchBattle(scene);
        };
        this.modal.classList.add('show-modal');
    }

    // 퍼즐 RPG 배틀 페이지를 iframe으로 띄우기
    launchBattle(scene) {
        const stageId = scene.stage || 1;  // lily 시나리오에서 stage 지정 가능 (없으면 1)
        if (!this.battleOverlay || !this.battleFrame) {
            // 안전장치: 배틀 오버레이가 없으면 그냥 스킵
            console.error("배틀 오버레이 요소를 찾을 수 없습니다.");
            this.next();
            return;
        }

        this.isInBattle = true;
        this.currentBattleStageId = stageId;

        this.battleOverlay.style.display = 'block';
        if (this.uiLayer) this.uiLayer.style.display = 'none';
        if (this.backBtn) this.backBtn.style.display = 'none';
        if (this.touchBtn) this.touchBtn.style.display = 'none';

        // 배틀 URL 계산: 상대 경로 사용으로 로컬/NAS 배포 모두 대응
        const currentPath = window.location.pathname;
        let basePath = currentPath.replace(/\/[^\/]+\.html$/, '').replace(/\/+$/, '');
        const battlePath = (basePath && basePath !== '/') ? `${basePath}/src/battle/index.html` : './src/battle/index.html';
        const url = `${battlePath}?stage=${encodeURIComponent(stageId)}&mode=scenario`;

        this.battleFrame.src = url;
        this.battleFrame.style.width = '100%';
        this.battleFrame.style.height = '100%';
        this.battleFrame.style.border = 'none';
        
        this.battleFrame.onload = () => {
            if (!this.isInBattle || this.battleFrame.src === "about:blank" || this.battleFrame.src.startsWith("about:")) return;
            if (this.battleOverlay) this.battleOverlay.style.display = 'block';
            const notifyAndResize = () => {
                this.notifyBattleViewport();
                try {
                    const iframeWindow = this.battleFrame.contentWindow;
                    if (iframeWindow && typeof iframeWindow.resize === 'function') {
                        iframeWindow.resize();
                        iframeWindow.dispatchEvent(new Event('resize'));
                    }
                } catch (e) {}
            };
            notifyAndResize();
            requestAnimationFrame(() => requestAnimationFrame(() => notifyAndResize()));
            setTimeout(notifyAndResize, 50);
            setTimeout(notifyAndResize, 150);
            setTimeout(notifyAndResize, 500);
        };
        this.battleFrame.onerror = () => {
            this.handleBattleResult({ win: false, stageId: stageId, error: true });
        };
    }

    launchDungeonBattle(dungeonId) {
        if (!this.battleOverlay || !this.battleFrame) return;
        this.isInBattle = true;
        this.isDungeonBattle = true;
        this.currentBattleStageId = dungeonId;
        this.battleOverlay.style.display = 'block';
        if (this.uiLayer) this.uiLayer.style.display = 'none';
        if (this.backBtn) this.backBtn.style.display = 'none';
        if (this.touchBtn) this.touchBtn.style.display = 'none';

        const currentPath = window.location.pathname;
        let basePath = currentPath.replace(/\/[^\/]+\.html$/, '').replace(/\/+$/, '');
        const battlePath = (basePath && basePath !== '/') ? `${basePath}/src/battle/index.html` : './src/battle/index.html';
        const url = `${battlePath}?stage=${encodeURIComponent(dungeonId)}&mode=dungeon`;

        this.battleFrame.src = url;
        this.battleFrame.style.width = '100%';
        this.battleFrame.style.height = '100%';
        this.battleFrame.style.border = 'none';

        this.battleFrame.onload = () => {
            if (!this.isInBattle || this.battleFrame.src === "about:blank" || this.battleFrame.src.startsWith("about:")) return;
            if (this.battleOverlay) this.battleOverlay.style.display = 'block';
            this.notifyBattleViewport();
        };
        this.battleFrame.onerror = () => {
            this.handleBattleResult({ win: false, stageId: dungeonId, error: true });
        };
    }

    handleBattleResult(data) {
        if (data.action === 'close') {
            this.closeBattleOverlay();
            return;
        }
        if (data.action === 'goToMenu') {
            this.flags.lastBattleWin = !!data.win;
            this.flags.lastBattleStageId = data.stageId ?? this.currentBattleStageId;
            if (data.goldEarned != null) {
                this.flags.lastGoldEarned = data.goldEarned;
                if (typeof window.addGoldDirect === 'function') window.addGoldDirect(data.goldEarned);
                else if (typeof window.gameStorage?.addGoldEarned === 'function') window.gameStorage.addGoldEarned(data.goldEarned);
            }
            const overlay = document.getElementById('fade-out-overlay');
            if (overlay) {
                overlay.classList.add('active');
                overlay.style.pointerEvents = 'auto';
                setTimeout(() => location.reload(), 550);
            } else {
                this.closeBattleOverlay();
                setTimeout(() => location.reload(), 300);
            }
            return;
        }
        if (data.action === 'goToDungeonList') {
            this.flags.lastBattleWin = !!data.win;
            this.flags.lastBattleStageId = data.stageId ?? this.currentBattleStageId;
            if (data.goldEarned != null) {
                this.flags.lastGoldEarned = data.goldEarned;
                if (typeof window.addGoldDirect === 'function') window.addGoldDirect(data.goldEarned);
                else if (typeof window.gameStorage?.addGoldEarned === 'function') window.gameStorage.addGoldEarned(data.goldEarned);
            }
            if (data.win && data.stageId && !data.winBySurvival && typeof window.setGuildBossDefeated === 'function') {
                window.setGuildBossDefeated(data.stageId);
            }
            this.closeBattleOverlay();
            if (typeof window.showDungeonAfterBattle === 'function') {
                window.showDungeonAfterBattle();
            } else {
                setTimeout(() => location.reload(), 300);
            }
            return;
        }
        if (data.action === 'goToEpisodeSelect') {
            this.flags.lastBattleWin = !!data.win;
            this.flags.lastBattleStageId = data.stageId ?? this.currentBattleStageId;
            this.closeBattleOverlay();
            if (typeof window.showEpisodeSelectFromGame === 'function') {
                window.showEpisodeSelectFromGame();
            } else {
                setTimeout(() => location.reload(), 300);
            }
            return;
        }
        this.flags.lastBattleWin = !!data.win;
        this.flags.lastBattleStageId = data.stageId ?? this.currentBattleStageId;
        if (data.goldEarned != null) {
            this.flags.lastGoldEarned = data.goldEarned;
            if (typeof window.addGoldDirect === 'function') window.addGoldDirect(data.goldEarned);
            else if (typeof window.gameStorage?.addGoldEarned === 'function') window.gameStorage.addGoldEarned(data.goldEarned);
        }
        if (data.win && data.stageId && !data.winBySurvival && this.isDungeonBattle && typeof window.setGuildBossDefeated === 'function') {
            window.setGuildBossDefeated(data.stageId);
        }
        if (this.isDungeonBattle) {
            this.closeBattleOverlay();
            if (typeof window.showDungeonAfterBattle === 'function') {
                window.showDungeonAfterBattle();
            } else {
                setTimeout(() => location.reload(), 300);
            }
            return;
        }
        this._postBattleBgTransition = true;
        if (this.uiLayer && this.data) {
            this.uiLayer.style.display = 'block';
            this.setDialogueUIVisible(false);
        }
        this.next();
    }

    clearToBlackForResult() {
        const nextScene = this.data?.events?.[this.currentIndex + 1];
        const willChangeBg = nextScene && nextScene.type === 'bg';

        if (willChangeBg && this.bgLayer) {
            this.bgLayer.style.backgroundImage = 'none';
            this.bgLayer.style.backgroundColor = '#000';
            this.bgLayer.style.opacity = '1';
        }
        if (willChangeBg) {
            if (this.uiImg) { this.uiImg.style.transition = 'none'; this.uiImg.style.opacity = 0; }
            if (this.uiImgNext) { this.uiImgNext.style.transition = 'none'; this.uiImgNext.style.opacity = 0; }
        }
        this.setDialogueUIVisible(false);
    }

    closeBattleOverlay() {
        this.isInBattle = false;
        this.isDungeonBattle = false;
        this._postBattleBgTransition = false;
        if (this.battleOverlay) this.battleOverlay.style.display = 'none';
        if (this.battleFrame) this.battleFrame.src = 'about:blank';
        if (this.uiLayer && this.data) this.uiLayer.style.display = 'block';
        this.updateTopUIVisibility();
    }

    triggerEndingSequence() {
        this.hideNextIndicator();
        if (this.data?.shopReturnToShop && typeof window.showShopDirect === 'function') {
            this.hideNextIndicator();
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.classList.add('black-out');
                this.uiWhite.style.transition = 'opacity 0.6s ease';
                this.uiWhite.style.opacity = '1';
            }
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                if (this.uiLayer) this.uiLayer.style.opacity = '0';
                if (this.backBtn) this.backBtn.style.display = 'none';
                if (this.touchBtn) this.touchBtn.style.display = 'none';
                window.showShopDirect();
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 0.5s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                    setTimeout(() => { this.uiWhite.classList.remove('black-out'); this.uiWhite.style.transition = ''; }, 600);
                }
            }, 800);
            return;
        }
        if (this.data?.goldShopReturnToShop && typeof window.showGoldShopDirect === 'function') {
            this.hideNextIndicator();
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.classList.add('black-out');
                this.uiWhite.style.transition = 'opacity 0.6s ease';
                this.uiWhite.style.opacity = '1';
            }
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                if (this.uiLayer) this.uiLayer.style.opacity = '0';
                if (this.backBtn) this.backBtn.style.display = 'none';
                if (this.touchBtn) this.touchBtn.style.display = 'none';
                window.showGoldShopDirect();
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 0.5s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                    setTimeout(() => { this.uiWhite.classList.remove('black-out'); this.uiWhite.style.transition = ''; }, 600);
                }
            }, 800);
            return;
        }
        if (this.data?.guildReturnToGuild && typeof window.showGuildDirect === 'function') {
            this.hideNextIndicator();
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.classList.add('black-out');
                this.uiWhite.style.transition = 'opacity 0.6s ease';
                this.uiWhite.style.opacity = '1';
            }
            if (typeof window.markGuildIntroSeen === 'function') window.markGuildIntroSeen();
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                if (this.uiLayer) this.uiLayer.style.opacity = '0';
                if (this.backBtn) this.backBtn.style.display = 'none';
                if (this.touchBtn) this.touchBtn.style.display = 'none';
                window.showGuildDirect();
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 0.5s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                    setTimeout(() => { this.uiWhite.classList.remove('black-out'); this.uiWhite.style.transition = ''; }, 600);
                }
            }, 800);
            return;
        }
        if (this.data?.goldDungeonReturnToMain && typeof window.showMainMenu === 'function') {
            this.hideNextIndicator();
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.classList.add('black-out');
                this.uiWhite.style.transition = 'opacity 0.6s ease';
                this.uiWhite.style.opacity = '1';
            }
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                if (this.uiLayer) this.uiLayer.style.opacity = '0';
                if (this.backBtn) this.backBtn.style.display = 'none';
                if (this.touchBtn) this.touchBtn.style.display = 'none';
                window.showMainMenu();
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 0.5s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                    setTimeout(() => { this.uiWhite.classList.remove('black-out'); this.uiWhite.style.transition = ''; }, 600);
                }
            }, 800);
            return;
        }
        if (this.data?.goldDungeonReturnToDungeon && typeof window.showDungeonList === 'function') {
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (!this.container) return;
            this.container.classList.add('dungeon-intro-transition');
            setTimeout(() => {
                this.container.classList.add('dungeon-intro-zoom');
                setTimeout(() => {
                    if (this.uiWhite) {
                        this.uiWhite.classList.add('black-out');
                        this.uiWhite.style.transition = 'opacity 1.4s ease-out';
                        this.uiWhite.style.opacity = '1';
                    }
                }, 600);
                setTimeout(() => {
                    this.resetGameState({ keepWhite: true });
                    if (this.uiLayer) this.uiLayer.style.opacity = '0';
                    this.container.classList.remove('dungeon-intro-transition', 'dungeon-intro-zoom');
                    window.showDungeonList();
                    if (this.uiWhite) {
                        this.uiWhite.style.transition = 'opacity 0.6s ease-out';
                        requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                        setTimeout(() => { this.uiWhite.classList.remove('black-out'); this.uiWhite.style.transition = ''; }, 700);
                    }
                }, 2500);
            }, 500);
            return;
        }
        if (this.data?.memoryReturnToCharList && typeof window.showCharacterSelectFromMemory === 'function') {
            this.hideNextIndicator();
            if (this.data?.id === 'memory' && typeof window.clearMemoryGoddessParticles === 'function') {
                window.clearMemoryGoddessParticles();
            }
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.style.transition = 'opacity 1.2s ease';
                this.uiWhite.style.opacity = '1';
            }
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                window.showCharacterSelectFromMemory();
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 2.2s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                }
            }, 1200);
            return;
        }
        // returnToChar (여신의 선물 등): 화이트아웃 후 에피소드 선택 화면으로 복귀
        if (this.data?.returnToChar && window._goddessGiftReturnChar && typeof window.showEpisodeSelect === 'function') {
            this.hideNextIndicator();
            if (this.uiLayer) this.uiLayer.style.opacity = 0;
            if (this.touchBtn) this.touchBtn.style.display = 'none';
            if (this.uiWhite) {
                this.uiWhite.style.transition = 'opacity 1.2s ease';
                this.uiWhite.style.opacity = '1';
            }
            const char = window._goddessGiftReturnChar;
            window._goddessGiftReturnChar = null;
            setTimeout(() => {
                this.resetGameState({ keepWhite: true });
                window.showEpisodeSelect(char);
                if (this.uiWhite) {
                    this.uiWhite.style.transition = 'opacity 2.2s ease';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { this.uiWhite.style.opacity = '0'; }); });
                }
            }, 1200);
            return;
        }
        if (this.data?.id && this.episodeList?.length > 0) {
            this.markEpisodeCleared(this.data.id, this.episodeList.length - 1);
        }
        this.uiLayer.style.opacity = 0;
        if (this.uiWhite) {
            this.uiWhite.style.transition = 'opacity 2s ease';
            this.uiWhite.style.opacity = '1';
        }
        if (this.touchBtn) this.touchBtn.style.display = 'none';
        setTimeout(() => {
            if (this.uiWhite) {
                this.uiWhite.style.transition = 'opacity 1s ease';
                this.uiWhite.style.opacity = '0';
            }
            if (this.endingOverlay && this.endingTextDisplay) {
                this.endingTextDisplay.innerText = this.data?.ending || '';
                this.endingTextDisplay.style.opacity = '0';
                this.endingOverlay.classList.remove('hidden');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.endingTextDisplay.style.opacity = '1';
                    });
                });
                let endingTapped = false;
                const onEndingTap = (e) => {
                    if (endingTapped) return;
                    endingTapped = true;
                    if (e && e.type === 'touchstart') e.preventDefault();
                    this.endingOverlay.removeEventListener('click', onEndingTap);
                    this.endingOverlay.removeEventListener('touchstart', onEndingTap, { capture: true });
                    this.playSound('click');
                    if (this.uiWhite) {
                        this.uiWhite.style.transition = 'opacity 1s ease';
                        this.uiWhite.style.opacity = '1';
                        setTimeout(() => this.goToEpisodeSelectScreen(), 1100);
                    } else {
                        this.goToEpisodeSelectScreen();
                    }
                };
                this.endingOverlay.addEventListener('click', onEndingTap);
                this.endingOverlay.addEventListener('touchstart', onEndingTap, { capture: true, passive: false });
            }
        }, 2500);
    }

    returnToMenu() {
        this.playSound('click');
        if (this.typeTimeout) clearTimeout(this.typeTimeout);
        this.typeTimeout = null;
        this.isTyping = false;
        const isShopIntro = this.data?.shopReturnToShop;
        const isGoldShopIntro = this.data?.goldShopReturnToShop;
        const isGuildIntro = this.data?.guildReturnToGuild;
        const isGoldDungeon = this.data?.goldDungeonReturnToDungeon;
        const isGoldDungeonNoGuild = this.data?.goldDungeonReturnToMain;
        const isMemory = this.data?.id === 'memory' || this.data?.memoryReturnToCharList;
        const msg = isShopIntro ? "상점으로 돌아가기" : (isGoldShopIntro ? "비밀 상점으로 돌아가기" : (isGuildIntro ? "길드로 돌아가기" : (isGoldDungeon ? "던전 리스트로 돌아가기" : (isGoldDungeonNoGuild ? "메인 화면으로 돌아가기" : (isMemory ? "인연의 기억으로 돌아가기" : "에피소드 선택창으로 돌아가기")))));
        const dest = isShopIntro ? "상점" : (isGoldShopIntro ? "비밀 상점" : (isGuildIntro ? "길드" : (isGoldDungeon ? "던전 리스트" : (isGoldDungeonNoGuild ? "메인 화면" : (isMemory ? "인연의 기억" : "에피소드 선택창")))));
        this.showConfirmModal(
            msg,
            "진행 중인 이벤트를 종료하고\n" + dest + "로 돌아가시겠습니까?",
            () => {
                this.playSound('click');
                if (isShopIntro && typeof window.showShopDirect === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showShopDirect();
                } else if (isGoldShopIntro && typeof window.showGoldShopDirect === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showGoldShopDirect();
                } else if (isGuildIntro && typeof window.showGuildDirect === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showGuildDirect();
                } else if (isGoldDungeon && typeof window.showDungeonList === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showDungeonList();
                } else if (isGoldDungeonNoGuild && typeof window.showMainMenu === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showMainMenu();
                } else if (isMemory && typeof window.showCharacterSelectFromMemory === 'function') {
                    this.resetGameState();
                    document.getElementById('back-btn').style.display = 'none';
                    document.getElementById('touch-mode-btn').style.display = 'none';
                    window.showCharacterSelectFromMemory();
                } else {
                    this.goToEpisodeSelectScreen();
                }
            }
        );
    }

    showAlertModal(title, body, onConfirm) {
        this.modalTitle.innerText = title || "";
        this.modalBody.innerHTML = "";
        const p = document.createElement("div");
        p.style.whiteSpace = "pre-line";
        p.innerText = body || "";
        this.modalBody.appendChild(p);
        this.modalBtn.style.display = "";
        this.modalBtn.innerText = "확인";
        this.modalBtn.onclick = () => {
            this.playSound("click");
            if (typeof onConfirm === "function") onConfirm();
            this.modal.classList.remove("show-modal");
        };
        this.modal.classList.add("show-modal");
    }

    showConfirmModal(title, body, onConfirm, options = {}) {
        this.hideNextIndicator();
        this.modalTitle.innerText = title || "확인";
        this.modalBody.innerHTML = "";
        
        if (options.iconUrl) {
            const iconWrap = document.createElement("div");
            iconWrap.style.display = "flex";
            iconWrap.style.justifyContent = "center";
            iconWrap.style.marginBottom = "16px";
            const img = document.createElement("img");
            img.src = options.iconUrl;
            img.alt = "";
            img.style.width = "auto";
            img.style.height = "auto";
            img.style.maxWidth = "150px";
            img.style.maxHeight = "150px";
            img.style.objectFit = "contain";
            iconWrap.appendChild(img);
            this.modalBody.appendChild(iconWrap);
        }
        
        const p = document.createElement("div");
        p.style.whiteSpace = "pre-line";
        p.innerText = body || "";
        this.modalBody.appendChild(p);

        const btnWrap = document.createElement("div");
        btnWrap.className = "modal-btns-wrap";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "modal-btn modal-btn--pair";
        cancelBtn.innerText = "취소";
        cancelBtn.onclick = () => {
            this.playSound('click');
            this.modal.classList.remove('show-modal');
        };

        const confirmBtn = document.createElement("button");
        confirmBtn.className = "modal-btn modal-btn--pair modal-btn--primary";
        confirmBtn.innerText = "확인";
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            this.modal.classList.remove('show-modal');
        };

        btnWrap.appendChild(cancelBtn);
        btnWrap.appendChild(confirmBtn);
        this.modalBody.appendChild(btnWrap);

        this.modalBtn.style.display = "none";
        this.modal.classList.add('show-modal');
    }

    /** 비밀 상점 교환 확인 모달: 체력→골드 교환 내용 표시 */
    showSecretShopExchangeModal(price, goldMin, goldMax, onConfirm) {
        this.hideNextIndicator();
        this.modalTitle.innerText = "비밀 상품";
        this.modalBody.innerHTML = "";

        const intro = document.createElement("div");
        intro.className = "secret-shop-modal-intro";
        intro.textContent = "비밀 상품은 체력을 골드로 교환합니다.";
        this.modalBody.appendChild(intro);

        const cost = document.createElement("div");
        cost.className = "secret-shop-modal-cost";
        cost.textContent = `체력 ${price} 영구감소`;
        cost.style.color = "#e74c3c";
        cost.style.fontWeight = "bold";
        this.modalBody.appendChild(cost);

        const reward = document.createElement("div");
        reward.className = "secret-shop-modal-reward";
        const gMin = goldMin ?? 0;
        const gMax = goldMax ?? 0;
        reward.textContent = gMin === gMax ? `${gMin}G획득` : `${gMin}G~${gMax}G획득`;
        reward.style.color = "#ffd700";
        reward.style.fontWeight = "bold";
        this.modalBody.appendChild(reward);

        const question = document.createElement("div");
        question.className = "secret-shop-modal-question";
        question.textContent = "교환 하시겠습니까?";
        question.style.marginTop = "24px";
        this.modalBody.appendChild(question);

        const btnWrap = document.createElement("div");
        btnWrap.className = "modal-btns-wrap";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "modal-btn modal-btn--pair";
        cancelBtn.innerText = "취소";
        cancelBtn.onclick = () => {
            this.playSound('click');
            this.modal.classList.remove('show-modal');
        };

        const confirmBtn = document.createElement("button");
        confirmBtn.className = "modal-btn modal-btn--pair modal-btn--primary";
        confirmBtn.innerText = "교환";
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            this.modal.classList.remove('show-modal');
        };

        btnWrap.appendChild(cancelBtn);
        btnWrap.appendChild(confirmBtn);
        this.modalBody.appendChild(btnWrap);

        this.modalBtn.style.display = "none";
        this.modal.classList.add('show-modal');
    }
}