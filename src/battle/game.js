    // --- [디자인 해상도: 1080×1920 기준] ---
    const DESIGN_WIDTH = 1080;
    const DESIGN_HEIGHT = 1920;

    // --- [배틀 전용 에셋 경로] ---
    // 캐릭터 무관 순수 배틀 리소스: src/battle/assets/ (blocks, sound)
    // 시나리오별 몬스터/사운드는 각 캐릭터 폴더: ../../assets/images/{캐릭터}/, ../../assets/sound/{캐릭터}/
    const BATTLE_ASSETS = 'assets';
    const BATTLE_SOUND = BATTLE_ASSETS + '/sound';

    // --- [스테이지 설정] ---
    let currentStageId = 1;
    let currentStage = null;
    const urlParams = new URLSearchParams(window.location.search);
    const isDungeonMode = urlParams.get('mode') === 'dungeon';
    const isScenarioMode = urlParams.get('mode') === 'scenario';

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        /** 블록 효과음 URL (모바일 WebView 채널 한계 대응: 단일 Audio로만 재생) */
        const BLOCK_SFX_URLS = {
                block_down: BATTLE_SOUND + '/block_down.ogg',
                block_sw: BATTLE_SOUND + '/block_sw.ogg',
                block_mg: BATTLE_SOUND + '/block_mg.ogg',
                block_po: BATTLE_SOUND + '/block_po.ogg',
                block_sd: BATTLE_SOUND + '/block_sd.ogg',
                block_cr: BATTLE_SOUND + '/block_cr.ogg',
                block_sd_ok: BATTLE_SOUND + '/block_sd_ok.ogg'
        };
        const Sound = {
            files: {
                bgm: new Audio(BATTLE_SOUND + '/bgm.ogg'),
                ch_dem: new Audio(BATTLE_SOUND + '/ch_dem.ogg'),
                skill: new Audio(BATTLE_SOUND + '/skill.ogg'),
                come_asura: new Audio(BATTLE_SOUND + '/come_asura.ogg'),
                boss_wr: new Audio(BATTLE_SOUND + '/boss_wr.ogg'),
                boss_att: new Audio(BATTLE_SOUND + '/boss_att.ogg'),
                skill_fury: new Audio('../../assets/sound/gold_dungeon/d2/skill_fury.ogg'),  // d2 광폭화 발동 시 1회 재생
                result_win: new Audio(BATTLE_SOUND + '/result_win.ogg'),
                result_lose: new Audio(BATTLE_SOUND + '/result_lose.ogg'),
                spirit_bomb: new Audio('../../assets/sound/gold_dungeon/d8/spirit_bomb.ogg')
            },
            /** 모바일: 블록 소리 전용 채널 4개 (스킬 사운드와 동시 재생 가능, 블록 동시 터짐 4개까지) */
            _blockSfxPool: null,
            ctx: null,
            init: function() {
                try {
                    if (!this.ctx) this.ctx = new AudioContext();
                    if (this.ctx.state === 'suspended') this.ctx.resume();
                    if (!this._blockSfxPool || this._blockSfxPool.length === 0) {
                        this._blockSfxPool = [ new Audio(), new Audio(), new Audio(), new Audio() ];
                    }
                    const bgm = this.files.bgm;
                    if (bgm) {
                        bgm.loop = true;
                        bgm.volume = 0.2;
                        bgm.preload = 'auto';
                        if (!bgm._loopBound) {
                            bgm._loopBound = true;
                            bgm.addEventListener('ended', function onEnded() {
                                var t = bgm._playStartedAt;
                                if (bgm.volume > 0 && (!t || (Date.now() - t > 2500))) {
                                    bgm._playStartedAt = Date.now();
                                    bgm.currentTime = 0;
                                    bgm.play().catch(function(){});
                                }
                            });
                        }
                    }
                } catch (e) {}
            },
            playBGM: function() {
                this.init();
                const bgm = this.files.bgm;
                if (!bgm) return;
                if (!bgm.paused && bgm.currentTime > 1) return;
                bgm._playStartedAt = Date.now();
                bgm.currentTime = 0;
                try { bgm.load(); } catch (e) {}
                bgm.play().catch(function(){});
            },
            stopBGM: function() { const bgm = this.files.bgm; if (bgm) { bgm.pause(); bgm.currentTime = 0; } },
            stopAll: function() { this.stopBGM(); },
            /** 블록 효과음 전용 채널 4개 중 비어 있는 것 사용 (스킬 사운드와 별도, 블록 동시 터짐 맛) */
            playBlockSfx: function(key) {
                var url = BLOCK_SFX_URLS[key];
                if (!url || !this._blockSfxPool || this._blockSfxPool.length === 0) return;
                this.init();
                var pool = this._blockSfxPool;
                var el = pool[0];
                for (var i = 0; i < pool.length; i++) {
                    if (pool[i].paused) { el = pool[i]; break; }
                }
                try {
                    el.src = url;
                    el.volume = 1;
                    el.currentTime = 0;
                    el.play().catch(function() {});
                } catch (e) {}
            },
            play: function(key) {
                if (BLOCK_SFX_URLS[key]) {
                    this.playBlockSfx(key);
                    return;
                }
                var src = this.files[key];
                if (!src) return;
                this.init();
                try {
                    if (src instanceof HTMLAudioElement) {
                        src.currentTime = 0;
                        src.volume = (src.volume !== undefined) ? src.volume : 1;
                        src.play().catch(function() {});
                    } else {
                        var audio = new Audio(src.src || src);
                        audio.volume = (src.volume !== undefined) ? src.volume : 1;
                        audio.currentTime = 0;
                        audio.play().catch(function() {});
                    }
                } catch (e) {
                    if (src && src.play) { src.currentTime = 0; src.play().catch(function(){}); }
                }
            },
            playRandom: function(key) { const arr = this.files[key]; if(arr && arr.length > 0) { const audio = arr[Math.floor(Math.random() * arr.length)]; audio.currentTime = 0; audio.play().catch(()=>{}); } },
            playTone: function(freq, type, duration, vol=0.1) {
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(vol, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(); osc.stop(this.ctx.currentTime + duration);
            },
            playClick: function() {
                this.playTone(520, 'sine', 0.055, 0.25);
            },
            playIntro: function() {},
            playFail: function() {
                this.init();
                const a = this.files.result_lose;
                if (a) { a.currentTime = 0; a.play().catch(() => { this.playTone(200, 'sawtooth', 0.3); }); }
                else this.playTone(200, 'sawtooth', 0.3);
            },
            playSuccess: function() {
                this.init();
                const a = this.files.result_win;
                if (a) { a.currentTime = 0; a.play().catch(() => { this.playTone(880, 'sine', 0.25); }); }
                else this.playTone(880, 'sine', 0.25);
            },
            playDrop: function() { this.play('block_down'); },
            playMatch: function(type) {
                switch(type) {
                    case 'SWORD': this.play('block_sw'); break;
                    case 'MAGIC': this.play('block_mg'); break;
                    case 'POTION': this.play('block_po'); break;
                    case 'SHIELD': this.play('block_sd'); break;
                    case 'CRITICAL': this.play('block_cr'); break;
                }
            },
            playSkillCharged: function() { this.play('come_asura'); },
            playSkillBtnClick: function() { /* 버튼음 제외 */ },
            playSkillUse: function() { this.play('skill'); },
            playHeroAttack: function() {},
            playHeroDamage: function() {},
            playHeroHitSFX: function() { this.play('ch_dem'); },
            playBossWarn: function() { this.play('boss_wr'); },
            playBossAttack: function() { this.play('boss_att'); },
            playSkillFury: function() { this.play('skill_fury'); },  // gold_dungeon/d2/skill_fury.ogg
            _pool: [],
            /** URL별 Audio 캐시 (모바일 WebView 끊김 방지) */
            _urlCache: {},
            _getCachedAudio: function(path, volume) {
                var a = this._urlCache[path];
                if (!a) {
                    a = new Audio(path);
                    a.volume = volume != null ? volume : 1;
                    this._urlCache[path] = a;
                }
                return a;
            },
            _getPooledAudio: function() {
                for (var i = 0; i < this._pool.length; i++) {
                    if (this._pool[i].paused || this._pool[i].ended) return this._pool[i];
                }
                if (this._pool.length < 3) {
                    var a = new Audio();
                    this._pool.push(a);
                    return a;
                }
                return this._pool[0];
            },
            playBossDamage: function() {
                const cfg = currentStage && currentStage.battle;
                if (cfg && (cfg.bossDamageSound === false || cfg.bossDamageSound === null)) return;
                const raw = cfg && cfg.bossDamageSound;
                if (!raw) return;
                this.init();
                const path = resolveAssetUrl(raw.startsWith('/') || raw.includes('://') ? raw : './' + raw);
                try {
                    var a = this._getCachedAudio(path, 1);
                    a.currentTime = 0;
                    a.play().catch(function() {});
                } catch (e) {}
            },
            playBossDeath: function() {},
            playBlockSuccess: function() { this.play('block_sd_ok'); },
            playShieldAbsorb: function() {
                const cfg = currentStage && currentStage.battle;
                const customPath = cfg && cfg.shieldAbsorbSound;
                const paths = typeof window.SOUND_PATHS !== 'undefined' ? window.SOUND_PATHS : null;
                const url = customPath || (paths && paths.shield_absorb);
                const self = this;
                if (url) {
                    const base = (url.startsWith('/') || url.includes('://') || url.startsWith('../')) ? '' : '../../';
                    const fullPath = resolveAssetUrl(base + url);
                    if (fullPath) {
                        try {
                            this.init();
                            var a = this._getCachedAudio(fullPath, 0.7);
                            a.currentTime = 0;
                            a.play().catch(function() { self.play('block_sd'); });
                        } catch (e) { this.play('block_sd'); }
                        return;
                    }
                }
                this.play('block_sd');
            },
            playSpiritBomb: function() {
                const sb = this.files.spirit_bomb;
                if (sb) {
                    this.init();
                    sb.currentTime = 0;
                    sb.volume = 0.8;
                    sb.play().catch(() => { this.play('block_cr'); });
                    return;
                }
                const paths = typeof window.SOUND_PATHS !== 'undefined' ? window.SOUND_PATHS : null;
                const url = paths && paths.spirit_bomb;
                const self = this;
                if (url) {
                    const base = (url.startsWith('/') || url.includes('://') || url.startsWith('../')) ? '' : '../../';
                    const fullPath = resolveAssetUrl(base + url);
                    if (fullPath) {
                        try {
                            this.init();
                            var a = this._getCachedAudio(fullPath, 0.8);
                            a.currentTime = 0;
                            a.play().catch(function() { self.play('block_cr'); });
                        } catch (e) { self.play('block_cr'); }
                        return;
                    }
                }
                this.play('block_cr');
            },
            playCoinClink: function() {
                const cfg = typeof window.DUNGEON_CONFIG !== 'undefined' ? window.DUNGEON_CONFIG : null;
                const coinPath = cfg && cfg.coinSound ? resolveAssetUrl(cfg.coinSound.startsWith('/') || cfg.coinSound.includes('://') ? cfg.coinSound : './' + cfg.coinSound) : null;
                if (coinPath) {
                    try {
                        this.init();
                        var a = this._getCachedAudio(coinPath, 0.8);
                        a.currentTime = 0;
                        a.play().catch(function() {});
                    } catch (e) {}
                    return;
                }
                if (!this.ctx) this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime);
                osc.stop(this.ctx.currentTime + 0.1);
            },
            playTypingSound: function(type) {
                if (!this.ctx) this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                let freq = 523, duration = 0.06;
                osc.type = type === 'narration' ? 'triangle' : (type === 'dialogue_npc' ? 'sine' : 'triangle');
                if (type === 'narration') { freq = 440; duration = 0.07; }
                else if (type === 'dialogue_npc') { freq = 520; duration = 0.055; }
                else { freq = 659; duration = 0.05; }
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.start(); osc.stop(this.ctx.currentTime + duration);
            }
        };

        // APK/Android: 첫 터치·클릭 시 오디오 잠금 해제
        (function soundUnlockOnce() {
            var done = function() {
                Sound.init();
                document.removeEventListener('touchstart', done, true);
                document.removeEventListener('touchend', done, true);
                document.removeEventListener('click', done, true);
            };
            document.addEventListener('touchstart', done, { passive: true, capture: true });
            document.addEventListener('touchend', done, { passive: true, capture: true });
            document.addEventListener('click', done, true);
        })();

        // --- [CLICK SOUND ADDED] ---
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                Sound.playClick();
            }
        });

        const GRID_SIZE = 6;
        const CELL_SIZE = 160; 
        const BLOCK_IMG_BASE = BATTLE_ASSETS + '/blocks/';
        const BLOCKS = {
            SWORD:  { color: 'type-sword',  effect: 'dmg', textColor: '#e67e22', imgPrefix: 'sword' },
            SHIELD: { color: 'type-shield', effect: 'def', textColor: '#3498db', imgPrefix: 'shield' },
            MAGIC:  { color: 'type-magic',  effect: 'charge', textColor: '#9b59b6', imgPrefix: 'magic' },
            POTION: { color: 'type-potion', effect: 'heal', textColor: '#2ecc71', imgPrefix: 'potion' }
        };
        function getBlockImgUrl(type, level) {
            const lv = Math.max(1, Math.min(5, level || 1));
            return BLOCK_IMG_BASE + BLOCKS[type].imgPrefix + '_' + lv + '.png';
        }
        const TYPES_KEYS = Object.keys(BLOCKS);

        let state = {
            grid: [],
            bossHp: 200, maxBossHp: 200,
            playerHp: 30, maxPlayerHp: 30,
            playerShield: 0,
            skillCharge: 0, maxSkillCharge: 30,
            movesLeft: 3,
            gameActive: false, isLocked: false, isTargeting: false, isSkillReady: false,
            turnCount: 0, startTime: 0, elapsedTime: 0,
            lastSwap: null, isBossDead: false,
            resultSent: false,
            turnsLeft: 20, turnLimit: 20, totalDamageDealt: 0,
            healReverseTurns: 0, skillSealTurns: 0, damageReflectTurns: 0, shieldSealTurns: 0,
            blockedTiles: new Set(),
            blockArea: null,
            tileBlockArea: null,
            skillFuryEffectOn: false,
            absoluteDefenseTurns: 0
        };
        let dragStart = null, currentScale = 1;
        let floatTextStack = 0, floatTextStackBoss = 0, floatTextTimer = null, floatTextTimerBoss = null, gameTimerInterval = null;

        function resolveAssetUrl(p) {
            if (!p || typeof p !== 'string') return '';
            if (p.startsWith('data:') || p.includes('://')) return p;
            try {
                return new URL(p, window.location.href).href;
            } catch (e) { return p; }
        }

        const container = document.getElementById('game-container');
        const gridEl = document.getElementById('grid');
        const skillBtn = document.getElementById('skill-btn');
        const targetGuide = document.getElementById('target-guide');
        const transitionLayer = document.getElementById('transition-layer');
        const countdownDisplay = document.getElementById('countdown-display');

        // --- [스테이지 설정 적용 함수] ---
        function loadStageConfig(stageId) {
            if (isDungeonMode && window.DUNGEON_STAGES) {
                const id = typeof stageId === 'string' ? stageId : String(stageId || 'd1');
                const picked = window.DUNGEON_STAGES[id] || window.DUNGEON_STAGES['d1'];
                currentStageId = picked?.id ?? id;
                currentStage = picked || null;
                return;
            }
            const id = typeof stageId === 'string' ? parseInt(stageId, 10) : (stageId || 1);
            const allStages = window.BATTLE_STAGES || {};
            const fallback = allStages[1] || null;
            const picked = allStages[id] || allStages[String(id)] || fallback;
            if (!picked) {
                // stages.js 가 없거나 비어 있을 때를 위한 완전 기본값
                currentStageId = 1;
                currentStage = {
                    id: 1,
                    boss: { maxHp: 200, image: BATTLE_ASSETS + "/default_boss.png" },
                    player: { maxHp: 30 },
                    battle: {
                        movesPerAttack: 3,
                        bossDamageMin: 5,
                        bossDamageMax: 20
                    }
                };
            } else {
                currentStageId = picked.id != null ? picked.id : (id || 1);
                currentStage = picked;
            }
        }

        function getStoredPlayerMaxHp() {
            try {
                const s = localStorage.getItem('3x3_vault');
                if (!s) return 10;
                const p = JSON.parse(s);
                return Math.max(5, Number(p.playerMaxHp) || 10);
            } catch (e) { return 10; }
        }

        function getStoredBlockLevels() {
            try {
                const s = localStorage.getItem('3x3_vault');
                if (!s) return { SWORD: 1, POTION: 1, SHIELD: 1, MAGIC: 1 };
                const p = JSON.parse(s);
                const def = { SWORD: 1, POTION: 1, SHIELD: 1, MAGIC: 1 };
                return Object.assign({}, def, p.blockLevels);
            } catch (e) { return { SWORD: 1, POTION: 1, SHIELD: 1, MAGIC: 1 }; }
        }

        function applyStageStatsToState() {
            const bossCfg = (currentStage && currentStage.boss) || {};
            const battleCfg = (currentStage && currentStage.battle) || {};
            const skillCfg = (battleCfg.skill || {});

            state.maxBossHp = bossCfg.maxHp || 200;
            state.bossHp = state.maxBossHp;
            state.totalDamageDealt = 0;
            state.healReverseTurns = 0;
            state.skillSealTurns = 0;
            state.damageReflectTurns = 0;
            state.shieldSealTurns = 0;
            state.blockedTiles = state.blockedTiles || new Set();
            state.blockedTiles.clear();
            state.blockArea = null;
            state.tileBlockArea = null;
            if (isDungeonMode && currentStage && typeof currentStage.turnLimit === 'number') {
                state.turnLimit = currentStage.turnLimit;
                state.turnsLeft = currentStage.turnLimit;
            } else {
                state.turnLimit = 0;
                state.turnsLeft = 0;
            }

            state.maxPlayerHp = getStoredPlayerMaxHp();
            state.playerHp = state.maxPlayerHp;

            state.blockLevels = getStoredBlockLevels();

            state.movesLeft = battleCfg.movesPerAttack || 3;
            state.attackLabel = battleCfg.attackLabel || '공격';

            state.maxSkillCharge = skillCfg.chargeMax ?? 30;
            state.skillDamageBase = skillCfg.damageBase ?? 10;
            state.skillDamageDesperation = skillCfg.damageDesperation ?? 30;
            state.skillHpThresholdDesperation = skillCfg.hpThresholdDesperation ?? 10;
            state.skillRangeBase = skillCfg.rangeBase ?? 0;
            state.skillRangeDesperation = skillCfg.rangeDesperation ?? 1;
        }

        function applyStageVisuals() {
            const bossCfg = (currentStage && currentStage.boss) || {};
            const bossImgEl = document.getElementById('boss-img');
            const bossWrapper = document.getElementById('boss-wrapper');
            const topAreaEl = document.getElementById('top-area');
            const gridAreaEl = document.getElementById('grid-area');
            // 그리드는 원래 위치 유지. 체력바만 그리드 위 10px에 오도록: top-area = OVERLAY + bar + 10, grid-area는 margin-top -40으로 보정
            const BAR_BLOCK_HEIGHT = 60;
            const GAP_BAR_TO_GRID = 10;
            const OVERLAY_HEIGHT = 510;
            const GRID_AREA_TOP_PADDING = 40;
            const GRID_AREA_OFFSET_DOWN = 20;
            if (bossImgEl) {
                if (bossCfg.image) {
                    bossImgEl.src = bossCfg.image;
                }
                const scale = bossCfg.scale != null ? bossCfg.scale : 1;
                const battlePos = bossCfg.battleCharPos || {};
                const hasBattlePos = Object.keys(battlePos).length > 0;

                if (hasBattlePos) {
                    // 던전 배틀: 원본 이미지 크기로 표시, scale=배율(1.0=100%), 상단 정렬 후 오버레이 아래 잘림
                    bossImgEl.style.setProperty('--boss-scale', String(scale));
                    bossImgEl.style.height = '';
                    bossImgEl.style.width = 'auto';
                    bossImgEl.style.maxHeight = '';
                    bossImgEl.style.maxWidth = 'none';
                    bossImgEl.style.transformOrigin = 'top center';
                } else {
                    // 비던전: 기존 고정 높이 방식
                    const baseHeight = 336;
                    const height = bossCfg.height || Math.round(baseHeight * scale);
                    bossImgEl.style.removeProperty('--boss-scale');
                    bossImgEl.style.height = height + 'px';
                    bossImgEl.style.width = 'auto';
                    bossImgEl.style.maxHeight = height + 'px';
                    bossImgEl.style.maxWidth = 'none';
                    bossImgEl.style.transformOrigin = '';
                }

                // battleCharPos: 전투 화면 몬스터 위치 (던전). 상단 정렬 기준 left/right/top/transform
                if (hasBattlePos) {
                    bossImgEl.style.position = 'absolute';
                    if (battlePos.left !== undefined) bossImgEl.style.left = battlePos.left;
                    if (battlePos.right !== undefined) bossImgEl.style.right = battlePos.right;
                    if (battlePos.bottom !== undefined) { bossImgEl.style.bottom = battlePos.bottom; bossImgEl.style.top = ''; }
                    if (battlePos.top !== undefined) { bossImgEl.style.top = battlePos.top; bossImgEl.style.bottom = ''; }
                    const baseTransform = (battlePos.transform || '').trim() || 'translateX(-50%)';
                    if (battlePos.noFloat) {
                        bossImgEl.style.animation = 'none';
                        bossImgEl.style.transform = baseTransform + ' scale(' + scale + ')';
                    } else {
                        const tx = baseTransform.includes('translateX(-50%)') ? 'float-idle-centered' : 'float-idle';
                        bossImgEl.style.animation = tx + ' 3s ease-in-out infinite';
                        bossImgEl.style.transform = '';
                    }
                    if (bossWrapper) {
                        bossWrapper.classList.add('dungeon-overlay');
                        bossWrapper.style.position = 'relative';
                        bossWrapper.style.flex = '0 0 auto';
                        bossWrapper.style.minHeight = '0';
                        bossWrapper.style.height = OVERLAY_HEIGHT + 'px';
                        bossWrapper.style.width = '100%';
                        bossWrapper.style.overflow = 'hidden';
                    }
                    if (topAreaEl) {
                        topAreaEl.style.flex = 'none';
                        topAreaEl.style.height = (OVERLAY_HEIGHT + BAR_BLOCK_HEIGHT + GAP_BAR_TO_GRID) + 'px';
                    }
                    if (gridAreaEl) {
                        gridAreaEl.style.marginTop = (-GRID_AREA_TOP_PADDING + GRID_AREA_OFFSET_DOWN) + 'px';
                    }
                    const bossCharWrap = bossWrapper && bossWrapper.querySelector('.boss-char-wrap');
                    if (bossCharWrap) {
                        bossCharWrap.style.minHeight = '0';
                        bossCharWrap.style.width = '100%';
                    }
                } else {
                    bossImgEl.style.removeProperty('--boss-scale');
                    bossImgEl.style.transformOrigin = '';
                    bossImgEl.style.position = '';
                    bossImgEl.style.left = ''; bossImgEl.style.right = '';
                    bossImgEl.style.bottom = ''; bossImgEl.style.top = '';
                    bossImgEl.style.transform = '';
                    bossImgEl.style.animation = '';
                    if (bossWrapper) {
                        bossWrapper.classList.remove('dungeon-overlay');
                        bossWrapper.style.flex = '';
                        bossWrapper.style.minHeight = '';
                        bossWrapper.style.height = '';
                        bossWrapper.style.overflow = '';
                        bossWrapper.style.width = '';
                    }
                    if (topAreaEl) {
                        topAreaEl.style.flex = '';
                        topAreaEl.style.height = '';
                    }
                    if (gridAreaEl) {
                        gridAreaEl.style.marginTop = '';
                    }
                    const bossCharWrap = bossWrapper && bossWrapper.querySelector('.boss-char-wrap');
                    if (bossCharWrap) {
                        bossCharWrap.style.minHeight = '';
                        bossCharWrap.style.width = '';
                    }
                }
            }

            const bossNameEl = document.getElementById('boss-name');
            if (bossNameEl && bossCfg.name) {
                bossNameEl.innerText = bossCfg.name;
            }
            const turnsLabelEl = document.getElementById('stat-turns-label');
            if (turnsLabelEl) {
                turnsLabelEl.textContent = isDungeonMode ? '남은 턴: ' : 'TURNS: ';
            }

            // 배경 이미지: boss 설정에서 제어 (stages.js)
            const bgCfg = (currentStage && currentStage.boss && currentStage.boss.background);
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                if (bgCfg && typeof bgCfg === 'string') {
                    const raw = (bgCfg.startsWith(BATTLE_ASSETS + '/') || bgCfg.startsWith('assets/') || bgCfg.startsWith('../')) ? bgCfg : '../' + bgCfg;
                    const bgUrl = resolveAssetUrl(raw);
                    gameContainer.style.backgroundImage = `url('${bgUrl}')`;
                    gameContainer.style.backgroundSize = "cover";
                    gameContainer.style.backgroundPosition = "center center";
                } else {
                    // 설정이 없으면 기본 배경 사용
                    gameContainer.style.backgroundImage = "url('" + BATTLE_ASSETS + "/game_bg.jpg')";
                    gameContainer.style.backgroundSize = "cover";
                    gameContainer.style.backgroundPosition = "center center";
                }
            }

            const bottomArea = document.getElementById('bottom-area');
            const goldWidget = document.getElementById('gold-dungeon-widget');
            const artifactWidget = document.getElementById('artifact-slot-widget');
            if (bottomArea) {
                bottomArea.classList.toggle('dungeon-mode', isDungeonMode);
                bottomArea.classList.toggle('scenario-mode', isScenarioMode);
            }
            if (goldWidget) goldWidget.classList.toggle('hidden', !isDungeonMode);
            if (artifactWidget) artifactWidget.classList.toggle('hidden', !isScenarioMode);

            const shieldIcon = document.getElementById('shield-icon');
            if (shieldIcon) {
                const shieldLv = (state.blockLevels && state.blockLevels.SHIELD) || 1;
                shieldIcon.src = getBlockImgUrl('SHIELD', shieldLv);
            }

            const quitBtn = document.getElementById('battle-quit-btn');
            if (quitBtn) quitBtn.classList.toggle('hidden', !isDungeonMode);
        }

        // 타이틀 화면을 건너뛰고 전투를 시작하기 위한 플래그
        let hasGameStarted = false;

        function beginGame(fromDungeonIntro) {
            if (hasGameStarted) return;
            hasGameStarted = true;

            Sound.init();

            const isScenarioInIframe = !isDungeonMode && new URLSearchParams(window.location.search).get('mode') === 'scenario' && window.parent && window.parent !== window;
            if (fromDungeonIntro || isScenarioInIframe) {
                const titleScreen = document.getElementById('title-screen');
                if (titleScreen) {
                    titleScreen.classList.add('hidden');
                    titleScreen.style.display = 'none';
                    titleScreen.classList.remove('show-buttons');
                    titleScreen.classList.remove('show-logo');
                }
                startGameSetup();
                const contentWrapper = document.getElementById('content-wrapper');
                if (contentWrapper) {
                    contentWrapper.classList.remove('title-hidden', 'dungeon-intro-hidden');
                    contentWrapper.classList.add('dungeon-battle-fade-in');
                }
                /* 검은색 페이드아웃 → 배틀 페이드인 */
                transitionLayer.classList.remove('fade-out');
                transitionLayer.classList.add('active');
                setTimeout(() => {
                    transitionLayer.classList.remove('active');
                    transitionLayer.classList.add('fade-out');
                    if (contentWrapper) requestAnimationFrame(() => contentWrapper.classList.add('visible'));
                    Sound.playBGM();
                }, 350);
                return;
            }

            startGameSetup();
        }

        let parentViewport = null;
        window.addEventListener('message', (e) => {
            const d = e.data;
            if (d && d.type === 'viewportDimensions' && d.width > 0 && d.height > 0) {
                parentViewport = { w: d.width, h: d.height };
                resize();
            }
        });

        function resize() {
            let w, h;
            if (parentViewport && parentViewport.w > 0 && parentViewport.h > 0) {
                w = parentViewport.w;
                h = parentViewport.h;
            } else {
                const vp = window.visualViewport;
                const rawW = (vp ? vp.width : window.innerWidth) || document.documentElement.clientWidth || DESIGN_WIDTH;
                const rawH = (vp ? vp.height : window.innerHeight) || document.documentElement.clientHeight || DESIGN_HEIGHT;
                w = rawW;
                h = Math.min(rawH, document.documentElement.clientHeight || rawH);
            }
            /* 1080×1920 디자인 기준 고정. 텍스트/UI 크기가 기기별로 달라지지 않도록 */
            document.documentElement.style.setProperty('--vp-width', DESIGN_WIDTH + 'px');
            document.documentElement.style.setProperty('--vp-height', DESIGN_HEIGHT + 'px');
            const scaleByW = w / DESIGN_WIDTH, scaleByH = h / DESIGN_HEIGHT;
            currentScale = Math.min(scaleByW, scaleByH) * 0.998;
            if (container) {
                container.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
                container.style.transformOrigin = 'center center';
            }
            // 결과창이 표시 중이면 스케일 업데이트
            const resultScreen = document.getElementById('result-screen');
            if (resultScreen && !resultScreen.classList.contains('hidden')) {
                resultScreen.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
                resultScreen.style.transformOrigin = 'center center';
            }
        }
        let resizeScheduled = false;
        function runResizeSequence() {
            resize();
            if (resizeScheduled) return;
            resizeScheduled = true;
            requestAnimationFrame(() => { resize(); resizeScheduled = false; });
        }
        const resizeThrottleMs = 200;
        let lastResize = 0;
        function resizeThrottled() {
            const now = Date.now();
            if (now - lastResize >= resizeThrottleMs) { lastResize = now; resize(); }
        }
        window.addEventListener('resize', runResizeSequence);
        window.addEventListener('orientationchange', () => runResizeSequence());
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', runResizeSequence);
            window.visualViewport.addEventListener('scroll', resizeThrottled);
        }
        window.addEventListener('load', () => runResizeSequence());
        // 초기 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resize);
        } else {
            resize();
        }

        function startGameWithStage(initialStage) {
            const scenarioOrDungeon = new URLSearchParams(window.location.search).get('mode') === 'scenario' || isDungeonMode;
            if (scenarioOrDungeon && window.parent && window.parent !== window) {
                try {
                    window.parent.postMessage({ type: 'battleLoaded', stageId: initialStage }, '*');
                    window.parent.postMessage({ type: 'requestViewportDimensions' }, '*');
                } catch (e) {}
            }
            loadStageConfig(initialStage);
            applyStageStatsToState();
            applyStageVisuals();
            if (isDungeonMode && currentStage && Array.isArray(currentStage.intro) && currentStage.intro.length > 0) {
                runDungeonIntro(currentStage, beginGame);
            } else {
                beginGame();
            }
        }

        function runDungeonIntro(stage, onComplete) {
            const escapeHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
            if (typeof resize === 'function') resize();
            if (window.parent && window.parent !== window) {
                try { window.parent.postMessage({ type: 'requestViewportDimensions' }, '*'); } catch (e) {}
            }
            requestAnimationFrame(() => { if (typeof resize === 'function') resize(); });
            const introArr = stage.intro || [];
            const overlay = document.getElementById('dungeon-intro-overlay');
            const introUi = document.getElementById('dungeon-intro-ui');
            const bgEl = document.getElementById('dungeon-intro-bg');
            const charImg = document.getElementById('dungeon-intro-char-img');
            const charImgNext = document.getElementById('dungeon-intro-char-img-next');
            const nameTag = document.getElementById('dungeon-intro-name-tag');
            const textEl = document.getElementById('dungeon-intro-text');
            const nextInd = document.getElementById('dungeon-intro-next');
            if (!overlay || !textEl) { if (onComplete) onComplete(); return; }
            try { Sound.init(); } catch (e) {}
            const contentWrapper = document.getElementById('content-wrapper');
            if (contentWrapper) { contentWrapper.classList.add('dungeon-intro-hidden'); }
            overlay.style.opacity = '0';
            overlay.classList.remove('hidden');
            /* transition layer: 검은 화면이 overlay 페이드인과 함께 부드럽게 사라짐 */
            if (transitionLayer) {
                transitionLayer.classList.add('fade-out');
                transitionLayer.classList.remove('active');
            }
            const introPos = stage.introCharPos || {};
            [charImg, charImgNext].forEach(el => {
                if (!el) return;
                if (introPos.left !== undefined) el.style.left = introPos.left;
                if (introPos.right !== undefined) el.style.right = introPos.right;
                if (introPos.bottom !== undefined) el.style.bottom = introPos.bottom;
                if (introPos.top !== undefined) el.style.top = introPos.top;
                if (introPos.transform !== undefined) el.style.transform = introPos.transform;
                if (introPos.noFloat) el.style.animation = 'none';
            });
            let lastBg = stage.introBackground || '';
            let lastImg = '';
            let typeTimeout = null;
            let isTyping = false;
            let fullText = '';
            let typingIdx = 0;
            let currentTypingType = '';
            function resolvePath(p) {
                if (!p) return '';
                const raw = (p.startsWith('/') || p.startsWith('../') || p.includes('://')) ? p : './' + p;
                return resolveAssetUrl(raw);
            }
            if (bgEl && lastBg) {
                bgEl.style.backgroundImage = `url('${resolvePath(lastBg)}')`;
                bgEl.style.opacity = '0';
            }
            if (nextInd) nextInd.classList.add('hidden');
            let idx = 0;
            function showNextIndicator() { if (nextInd) nextInd.classList.remove('hidden'); }
            function hideNextIndicator() { if (nextInd) nextInd.classList.add('hidden'); }
            function startTyping(text, itemType, soundType) {
                if (typeTimeout) clearTimeout(typeTimeout);
                fullText = text || '';
                typingIdx = 0;
                currentTypingType = itemType || 'dialogue';
                const typingSoundType = soundType || (currentTypingType === 'narration' || currentTypingType === 'ability_label' || currentTypingType === 'abilities' ? 'narration' : 'dialogue_npc');
                textEl.textContent = '';
                textEl.classList.remove('narration', 'ability-label', 'abilities-block');
                textEl.classList.toggle('narration', currentTypingType === 'narration');
                textEl.classList.toggle('ability-label', currentTypingType === 'ability_label');
                textEl.classList.toggle('abilities-block', currentTypingType === 'abilities');
                hideNextIndicator();
                if (!fullText) { isTyping = false; showNextIndicator(); return; }
                isTyping = true;
                const type = () => {
                    if (typingIdx >= fullText.length) { isTyping = false; showNextIndicator(); return; }
                    const char = fullText.charAt(typingIdx++);
                    textEl.textContent += (char === '\r' ? '\n' : char);
                    let delay = 75;
                    let skipSound = false;
                    const nextChar = fullText.charAt(typingIdx);
                    if (char === '\r' || char === '\n') { delay = /[.?!,…]/.test(fullText.charAt(typingIdx - 2)) ? 500 : 50; skipSound = true; }
                    else if (nextChar === '\r' || nextChar === '\n') { skipSound = true; }
                    else if (char === ',') { delay = 300; skipSound = true; }
                    else if ((char === '.' && nextChar !== '.') || char === '?' || char === '!') { delay = 400; skipSound = true; }
                    if (!skipSound && typeof Sound.playTypingSound === 'function') {
                        try { Sound.playTypingSound(typingSoundType); } catch (e) {}
                    }
                    typeTimeout = setTimeout(type, delay);
                };
                type();
            }
            function skipTyping() {
                if (!isTyping) return;
                if (typeTimeout) clearTimeout(typeTimeout);
                typeTimeout = null;
                isTyping = false;
                if (currentTypingType === 'abilities' && typeof fullAbilitiesHTML === 'string') {
                    textEl.innerHTML = fullAbilitiesHTML;
                } else {
                    textEl.textContent = fullText.replace(/\r/g, '\n');
                }
                showNextIndicator();
            }
            let fullAbilitiesHTML = '';
            function startAbilitiesTyping(abilities) {
                if (typeTimeout) clearTimeout(typeTimeout);
                textEl.classList.remove('narration', 'ability-label');
                textEl.classList.add('abilities-block');
                hideNextIndicator();
                const segments = [];
                let fullText = '';
                abilities.forEach((a, i) => {
                    const label = '특수능력 ' + (i + 1) + ' : ' + (a.label || '');
                    segments.push({ type: 'label', text: label });
                    fullText += label + '\n';
                    if (a.desc) {
                        segments.push({ type: 'desc', text: a.desc });
                        fullText += a.desc + '\n';
                    }
                });
                fullText = fullText.replace(/\n$/, '');
                fullAbilitiesHTML = abilities.flatMap((a, i) => {
                    const arr = ['<span class="intro-ability-label">특수능력 ' + (i + 1) + ' : ' + escapeHtml(a.label || '') + '</span>'];
                    if (a.desc) arr.push('<span class="intro-ability-desc">' + escapeHtml(a.desc) + '</span>');
                    return arr;
                }).join('<br>');
                if (!fullText) { isTyping = false; showNextIndicator(); return; }
                let typingIdx = 0;
                let pos = 0;
                const segBounds = [];
                segments.forEach((s) => {
                    segBounds.push({ type: s.type, start: pos, end: pos + s.text.length - 1 });
                    pos += s.text.length + 1;
                });
                isTyping = true;
                currentTypingType = 'abilities';
                const type = () => {
                    if (typingIdx >= fullText.length) {
                        isTyping = false;
                        textEl.innerHTML = fullAbilitiesHTML;
                        showNextIndicator();
                        return;
                    }
                    const char = fullText.charAt(typingIdx);
                    typingIdx++;
                    let html = '';
                    let lastEnd = -1;
                    segBounds.forEach((seg, i) => {
                        if (typingIdx <= seg.start) return;
                        const segEnd = Math.min(seg.end, typingIdx - 1);
                        const segText = escapeHtml(fullText.substring(seg.start, segEnd + 1));
                        if (lastEnd >= 0 && seg.start > lastEnd + 1) html += '<br>';
                        const cls = seg.type === 'label' ? 'intro-ability-label' : 'intro-ability-desc';
                        html += '<span class="' + cls + '">' + segText + '</span>';
                        lastEnd = segEnd;
                    });
                    textEl.innerHTML = html || '';
                    if (!char.match(/[\r\n]/) && typeof Sound.playTypingSound === 'function') {
                        try { Sound.playTypingSound('narration'); } catch (e) {}
                    }
                    let delay = 75;
                    const nextChar = fullText.charAt(typingIdx);
                    if (char === '\n') delay = 50;
                    else if (nextChar === '\n') delay = 50;
                    else if (char === ',') delay = 300;
                    else if ((char === '.' && nextChar !== '.') || char === '?' || char === '!') delay = 400;
                    typeTimeout = setTimeout(type, delay);
                };
                type();
            }
            function showItem() {
                if (idx >= introArr.length) {
                    finishDungeonIntro();
                    return;
                }
                const item = introArr[idx];
                const bg = item.background !== undefined ? item.background : lastBg;
                if (bg !== undefined && bgEl) { lastBg = bg; bgEl.style.backgroundImage = bg ? `url('${resolvePath(bg)}')` : 'none'; }
                let imgPath = item.image ? resolvePath(item.image) : '';
                if (!imgPath && (item.type === 'narration' || item.type === 'ability_label' || item.type === 'abilities') && stage.introImage) imgPath = resolvePath(stage.introImage);
                const imgSame = imgPath && lastImg && (imgPath === lastImg || imgPath.split('/').pop() === lastImg.split('/').pop());
                if (imgPath && charImg && charImgNext && !imgSame) {
                    const curVis = parseFloat(charImg.style.opacity || 0) > 0 ? charImg : charImgNext;
                    const nextEl = curVis === charImg ? charImgNext : charImg;
                    nextEl.src = imgPath;
                    nextEl.style.opacity = '1';
                    curVis.style.opacity = '0';
                    lastImg = imgPath;
                } else if (imgSame) {
                    /* 이미지 동일, 교체 불필요 */
                } else if (!imgPath && lastImg && charImg && charImgNext) {
                    charImg.style.opacity = '0';
                    charImg.src = '';
                    charImgNext.style.opacity = '0';
                    charImgNext.src = '';
                    lastImg = '';
                }
                if (item.type === 'narration' || item.type === 'ability_label' || item.type === 'abilities') {
                    if (nameTag) nameTag.textContent = '';
                } else if (item.type === 'dialogue') {
                    if (nameTag) nameTag.textContent = item.speaker ? '「' + item.speaker + '」' : '';
                } else {
                    if (nameTag) nameTag.textContent = '';
                }
                if (item.type === 'abilities' && Array.isArray(item.abilities)) {
                    startAbilitiesTyping(item.abilities);
                } else {
                    textEl.classList.remove('abilities-block');
                    textEl.classList.toggle('narration', item.type === 'narration' || item.type === 'ability_label' || item.type === 'abilities');
                    textEl.classList.toggle('ability-label', item.type === 'ability_label');
                    let textToType = (item.text || '').trim();
                    if (textToType && window.parent && window.parent.gameEngine && typeof window.parent.gameEngine.insertLineBreaksForWrap === 'function') {
                        try {
                            textToType = window.parent.gameEngine.insertLineBreaksForWrap(textToType, textEl, introUi);
                        } catch (e) {}
                    }
                    const soundType = (item.type === 'narration' || item.type === 'ability_label') ? 'narration' : 'dialogue_npc';
                    startTyping(textToType, item.type, soundType);
                }
                idx++;
            }
            function doAdvance() {
                if (isTyping) { skipTyping(); return; }
                try { Sound.playClick(); } catch (e) {}
                showItem();
            }
            let touchHandled = false;
            const advance = () => {
                if (touchHandled) { touchHandled = false; return; }
                doAdvance();
            };
            function finishDungeonIntro() {
                /* 보스 대사 끝 >> 대사창·보스 그대로 >> 검은색 페이드아웃 >> 대사창·보스 사라짐 >> 배틀 페이드인 */
                if (!transitionLayer) { if (onComplete) onComplete(true); return; }
                transitionLayer.classList.remove('fade-out');
                transitionLayer.classList.add('active');
                transitionLayer.addEventListener('transitionend', function onEnd() {
                    transitionLayer.removeEventListener('transitionend', onEnd);
                    overlay.classList.add('hidden');
                    if (bgEl) { bgEl.style.opacity = '0'; bgEl.style.backgroundImage = 'none'; }
                    [charImg, charImgNext].forEach(el => { if (el) { el.src = ''; el.style.opacity = '0'; } });
                    if (introUi) introUi.classList.remove('dungeon-intro-ui-shown');
                    if (onComplete) onComplete(true);
                }, { once: true });
            }
            /* 터치/클릭은 대사창(introUi)에만 적용. 대사창 뜨기 전에는 pointer-events:none으로 무시 */
            if (introUi) {
                introUi.onclick = (e) => {
                    if (!introUi.classList.contains('dungeon-intro-ui-shown')) return;
                    e.preventDefault();
                    advance();
                };
                introUi.addEventListener('touchstart', (e) => {
                    if (!introUi.classList.contains('dungeon-intro-ui-shown')) return;
                    e.preventDefault();
                    touchHandled = true;
                    doAdvance();
                }, { passive: false });
                introUi.addEventListener('touchend', (e) => { e.preventDefault(); }, { passive: false });
            }

            /* 인트로 순서: 페이드인(overlay+배경 동시) → 캐릭터 → 대사창 → 대사 */
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                if (bgEl) bgEl.style.opacity = '1'; /* 페이드인과 배경 동시(1회만) */
            });
            setTimeout(() => {
                const firstItem = introArr[0];
                let imgPath = firstItem?.image ? resolvePath(firstItem.image) : '';
                if (!imgPath && (firstItem?.type === 'narration' || firstItem?.type === 'ability_label' || firstItem?.type === 'abilities') && stage.introImage) imgPath = resolvePath(stage.introImage);
                if (imgPath && charImg) {
                    charImg.src = imgPath;
                    charImg.style.opacity = '1';
                    lastImg = imgPath;
                }
            }, 1200); /* 2. 캐릭터 출력 (페이드인 1.2s 후) */
            setTimeout(() => {
                if (introUi) introUi.classList.add('dungeon-intro-ui-shown'); /* 3. 대사창 올라옴 */
            }, 1600);
            setTimeout(() => {
                requestAnimationFrame(() => showItem()); /* 4. 대사 나옴 */
            }, 2100);
        }

        window.addEventListener('load', () => {
            const params = new URLSearchParams(window.location.search);
            let initialStage;
            if (isDungeonMode) {
                initialStage = params.get('stage') || 'd1';
            } else {
                const stageParam = parseInt(params.get('stage') || '1', 10);
                initialStage = isNaN(stageParam) ? 1 : stageParam;
            }

            if (isDungeonMode && window.DUNGEON_STAGES && Object.keys(window.DUNGEON_STAGES).length > 0) {
                startGameWithStage(initialStage);
                return;
            }
            if (window.BATTLE_STAGES && Object.keys(window.BATTLE_STAGES).length > 0) {
                startGameWithStage(initialStage);
                return;
            }
            var s = document.createElement('script');
            s.src = 'stages.js';
            s.onload = function() { startGameWithStage(initialStage); };
            s.onerror = function() {
                window.BATTLE_STAGES = window.BATTLE_STAGES || { 1: { id: 1, boss: { name: '보스', maxHp: 200, image: BATTLE_ASSETS + '/default_boss.png' }, player: { maxHp: 30 }, battle: { movesPerAttack: 3, bossDamageMin: 5, bossDamageMax: 20 } } };
                startGameWithStage(initialStage);
            };
            (document.head || document.documentElement).appendChild(s);
        });

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            // 혹시 직접 배틀 페이지를 여는 경우에도 안전하게 동작하도록 유지
            startBtn.addEventListener('click', () => {
                Sound.playClick();
                beginGame();
            });
        }

        // --- [RECORD BTN 제거: 버튼이 없어도 에러 안 나게 보호] ---
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                Sound.playClick();
                /* 랭킹 기능 비활성화 */
            });
        }

        // --- 골드 던전 나가기 버튼 & 확인 모달 ---
        const battleQuitBtn = document.getElementById('battle-quit-btn');
        const quitModal = document.getElementById('quit-confirm-modal');
        const quitConfirmCancel = document.getElementById('quit-confirm-cancel');
        const quitConfirmOk = document.getElementById('quit-confirm-ok');
        const isInIframe = window.parent && window.parent !== window;
        const doQuitCancel = () => { if (quitModal) quitModal.classList.add('hidden'); state.isLocked = false; };
        const doQuitOk = () => { if (quitModal) quitModal.classList.add('hidden'); state.quitByUser = true; endGame(false); };
        if (battleQuitBtn) {
            battleQuitBtn.addEventListener('click', () => {
                if (state.isLocked || !state.gameActive) return;
                Sound.playClick();
                state.isLocked = true;
                if (isInIframe) {
                    window.parent.postMessage({ type: 'requestQuitConfirm' }, '*');
                } else if (quitModal) {
                    quitModal.classList.remove('hidden');
                }
            });
        }
        if (quitConfirmCancel) quitConfirmCancel.addEventListener('click', () => { Sound.playClick(); doQuitCancel(); });
        if (quitConfirmOk) quitConfirmOk.addEventListener('click', () => {
            Sound.playClick();
            quitConfirmOk.classList.add('pressed');
            setTimeout(() => {
                quitConfirmOk.classList.remove('pressed');
                doQuitOk();
            }, 150);
        });
        window.addEventListener('message', (e) => {
            const d = e.data;
            if (d && d.type === 'quitConfirmCancel') { doQuitCancel(); }
            else if (d && d.type === 'quitConfirmOk') { doQuitOk(); }
        });

        window.toggleRecordModal = function(show) {
            if (!show) Sound.playClick();
            const el = document.getElementById('record-modal');
            if (el) el.classList.toggle('hidden', !show);
        };

        function returnToTitle() {
            Sound.playClick();
            
            // 시나리오 모드에서는 부모 창에 종료 메시지 전송
            const params = new URLSearchParams(window.location.search);
            const isScenarioMode = params.get('mode') === 'scenario';
            
            if (isScenarioMode && window.parent && window.parent !== window) {
                // 시나리오 모드: 부모 창에 배틀 종료 메시지 전송 (실패로 처리)
                try {
                    const msg = {
                        type: 'battleResult',
                        win: false,
                        stageId: currentStageId || null,
                        action: 'cancel'
                    };
                    if (isDungeonMode) msg.goldEarned = state.totalDamageDealt || 0;
                    window.parent.postMessage(msg, '*');
                } catch (e) {}
                return;
            }
            
            // 일반 모드: 기존대로 리로드
            transitionLayer.classList.remove('fade-out');
            transitionLayer.classList.add('active');
            setTimeout(() => {
                location.reload();
            }, 1000);
        }

        skillBtn.addEventListener('click', () => {
            if (!state.gameActive || state.skillCharge < (state.maxSkillCharge ?? 30) || state.isLocked) return;
            state.isTargeting = !state.isTargeting;
            if (state.isTargeting) {
                gridEl.classList.add('targeting');
                
                if (state.playerHp <= 10) skillBtn.classList.add('btn-pulse-red');
                else skillBtn.classList.add('active');
                
                targetGuide.classList.add('active'); 
                Sound.playSkillBtnClick(); 
            } else {
                gridEl.classList.remove('targeting');
                skillBtn.classList.remove('active', 'btn-pulse-red');
                targetGuide.classList.remove('active'); 
            }
        });

        function startGameSetup() {
            state.turnCount = 0; state.elapsedTime = 0;
            state.lostByTimeOut = false;
            state.playerShield = 0;
            state.skillCharge = 0;
            applyStageStatsToState();
            applyStageVisuals();
            state.lastSwap = null; state.isSkillReady = false; state.isBossDead = false;
            initGridWithRain();
            updateUI(); updateStatsUI();
            startCountdown();
        }

        function initGridWithRain() {
            state.blockArea = null;
            state.tileBlockArea = null;
            const overlayEl = document.getElementById('block-area-overlay');
            if (overlayEl) overlayEl.remove();
            const tileBlockEl = document.getElementById('tile-block-overlay');
            if (tileBlockEl) tileBlockEl.remove();
            gridEl.innerHTML = ''; state.grid = [];
            for(let r=0; r<GRID_SIZE; r++) {
                let row = [];
                for(let c=0; c<GRID_SIZE; c++) row.push(createBlock(r, c, true)); 
                state.grid.push(row);
            }
            resolveInitialMatches();
            setTimeout(() => {
                for(let r=0; r<GRID_SIZE; r++) {
                    for(let c=0; c<GRID_SIZE; c++) {
                        const b = state.grid[r][c];
                        b.el.style.transitionDelay = `${c * 0.1 + r * 0.05}s`;
                        b.el.style.top = (r * CELL_SIZE + 5) + 'px';
                    }
                }
            }, 100);
        }

        function startCountdown() {
            state.isLocked = true; state.gameActive = false;
            let count = 3;
            setTimeout(() => {
                const interval = setInterval(() => {
                    if (count > 0) {
                        countdownDisplay.innerText = count;
                        Sound.playTone(440, 'sine', 0.1); 
                    }
                    countdownDisplay.classList.remove('pop');
                    void countdownDisplay.offsetWidth; 
                    countdownDisplay.classList.add('pop');
                    
                    if (count === 0) {
                        clearInterval(interval);
                        countdownDisplay.innerText = "전투시작!!";
                        countdownDisplay.classList.remove('pop','fight-enter','fight-hold','fight-exit');
                        void countdownDisplay.offsetWidth;
                        countdownDisplay.classList.add('fight-enter');
                        Sound.playTone(880, 'square', 0.3);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('fight-enter');
                            countdownDisplay.classList.add('fight-hold');
                        }, 250);
                        setTimeout(() => {
                            state.gameActive = true; 
                            state.isLocked = false;
                            state.startTime = Date.now();
                            if (gameTimerInterval) clearInterval(gameTimerInterval);
                            gameTimerInterval = setInterval(updateTimer, 1000);
                        }, 500);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('fight-hold');
                            countdownDisplay.classList.add('fight-exit');
                        }, 750);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('fight-exit');
                            countdownDisplay.style.opacity = '0';
                        }, 1100);
                    }
                    count--;
                }, 1000);
            }, 500);
        }

        function updateTimer() {
            if (!state.gameActive) return;
            state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
            updateStatsUI();
        }

        function formatTime(seconds) {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        function updateStatsUI() {
            const turnsEl = document.getElementById('stat-turns');
            if (turnsEl) {
                turnsEl.innerText = isDungeonMode && state.turnLimit > 0 ? state.turnsLeft : state.turnCount;
            }
        }

        function createBlock(r, c, rain=false) {
            const type = TYPES_KEYS[Math.floor(Math.random()*TYPES_KEYS.length)];
            const div = document.createElement('div');
            div.className = `block ${BLOCKS[type].color}`;
            const lv = (state.blockLevels && state.blockLevels[type]) || 1;
            const img = document.createElement('img');
            img.className = 'block-icon-img';
            img.src = getBlockImgUrl(type, lv);
            img.alt = type;
            div.appendChild(img);
            if(rain) div.style.top = `-${(GRID_SIZE * CELL_SIZE) + 200}px`;
            else div.style.top = `-${CELL_SIZE * 2}px`;
            div.style.left = (c * CELL_SIZE + 5) + 'px';
            const block = { r, c, type, el: div, isFrozen: false, isSpecial: false, specialDmg: 0 }; 
            div.onpointerdown = (e) => onInputDown(e, block);
            gridEl.appendChild(div);
            return block;
        }

        function renderBlock(b) {
            if (b.el.classList.contains('matched')) return;
            b.el.style.transitionDelay = '0s'; 
            b.el.style.left = (b.c * CELL_SIZE + 5) + 'px';
            b.el.style.top = (b.r * CELL_SIZE + 5) + 'px';
            if(b.isFrozen) b.el.classList.add('frozen'); else b.el.classList.remove('frozen');
            if (state.blockedTiles && state.blockedTiles.has(`${b.r},${b.c}`) && !isInTileBlockArea(b.r, b.c)) b.el.classList.add('tile-blocked');
            else b.el.classList.remove('tile-blocked');
            if(b.isSpecial) {
                b.el.className = `block type-sword-special ${b.isFrozen?'frozen':''}`;
                b.el.innerHTML = `<img class="special-icon-img" src="${BLOCK_IMG_BASE}sword_special.png" alt="special"><span class="special-dmg">${b.specialDmg}</span>`;
            } else {
                const isPotionContaminated = b.type === 'POTION' && state.healReverseTurns > 0;
                const isSwordReflect = b.type === 'SWORD' && state.damageReflectTurns > 0;
                const spiritBombClass = b.isSpiritBomb ? ' spirit-bomb' : '';
                b.el.className = `block ${BLOCKS[b.type].color} ${b.isFrozen?'frozen':''} ${isPotionContaminated ? 'potion-contaminated' : ''} ${isSwordReflect ? 'sword-reflect' : ''}${spiritBombClass}`;
                const lv = (state.blockLevels && state.blockLevels[b.type]) || 1;
                let imgEl = b.el.querySelector('.block-icon-img');
                if (imgEl) {
                    imgEl.src = getBlockImgUrl(b.type, lv);
                } else {
                    imgEl = document.createElement('img');
                    imgEl.className = 'block-icon-img';
                    imgEl.src = getBlockImgUrl(b.type, lv);
                    imgEl.alt = b.type;
                    b.el.innerHTML = '';
                    b.el.appendChild(imgEl);
                }
                let particlesWrap = b.el.querySelector('.potion-contam-particles');
                if (isPotionContaminated) {
                    if (!particlesWrap) {
                        particlesWrap = document.createElement('div');
                        particlesWrap.className = 'potion-contam-particles';
                        for (let i = 0; i < 10; i++) {
                            const p = document.createElement('div');
                            p.className = 'potion-contam-particle';
                            const size = 12 + Math.random() * 18;
                            const left = 15 + Math.random() * 70;
                            const delay = Math.random() * 1.5;
                            const dur = 1.8 + Math.random() * 1.2;
                            const drift = (Math.random() - 0.5) * 8;
                            p.style.cssText = `left:${left}%; bottom:${5 + Math.random() * 15}%; width:${size}px; height:${size}px; margin-left:-${size/2}px; animation-delay:${delay}s; animation-duration:${dur}s; --drift:${drift}px;`;
                            particlesWrap.appendChild(p);
                        }
                        b.el.appendChild(particlesWrap);
                    }
                } else if (particlesWrap) {
                    particlesWrap.remove();
                }
                let spiritBadge = b.el.querySelector('.spirit-bomb-badge');
                if (b.isSpiritBomb) {
                    const turns = b.spiritBombTurnsLeft ?? 0;
                    if (!spiritBadge) {
                        spiritBadge = document.createElement('span');
                        spiritBadge.className = 'spirit-bomb-badge';
                        b.el.appendChild(spiritBadge);
                    }
                    spiritBadge.textContent = turns;
                    spiritBadge.style.display = 'block';
                } else if (spiritBadge) {
                    spiritBadge.remove();
                }
            }
        }
        function renderAll() { state.grid.forEach(row => row.forEach(b => renderBlock(b))); }

        function isInBlockArea(r, c) {
            const ba = state.blockArea;
            if (!ba || ba.turnsLeft <= 0) return false;
            return r >= ba.r && r < ba.r + 2 && c >= ba.c && c < ba.c + 2;
        }

        function isInTileBlockArea(r, c) {
            const ta = state.tileBlockArea;
            if (!ta) return false;
            const size = ta.size || 3;
            return r >= ta.r && r < ta.r + size && c >= ta.c && c < ta.c + size;
        }

        function updateTileBlockOverlay() {
            let el = document.getElementById('tile-block-overlay');
            const ta = state.tileBlockArea;
            const tileBlockImage = (currentStage && currentStage.battle && currentStage.battle.tileBlockImage) || null;
            if (!ta || !tileBlockImage) {
                if (el) el.remove();
                return;
            }
            const size = ta.size || 3;
            if (el) el.remove();
            el = document.createElement('div');
            el.id = 'tile-block-overlay';
            el.className = 'tile-block-overlay';
            const img = document.createElement('img');
            img.className = 'tile-block-overlay-img';
            img.draggable = false;
            img.src = resolveAssetUrl(tileBlockImage);
            img.alt = '';
            el.appendChild(img);
            gridEl.appendChild(el);
            const pad = 5;
            const left = ta.c * CELL_SIZE + pad;
            const top = ta.r * CELL_SIZE + pad;
            const totalSize = CELL_SIZE * size - pad * 2;
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.width = totalSize + 'px';
            el.style.height = totalSize + 'px';
            el.style.display = 'block';
            el.style.transformOrigin = 'center center';
            el.style.transform = 'scale(0.3)';
            el.style.opacity = '0';
            const imgEl = el.querySelector('.tile-block-overlay-img');
            imgEl.style.width = '100%';
            imgEl.style.height = '100%';
            imgEl.style.objectFit = 'cover';
            const isArachne = (currentStage && (currentStage.id === 'd4' || currentStage.name === '아라크네'));
            if (isArachne) {
                imgEl.classList.add('tile-block-overlay-img--arachne');
                imgEl.style.transformOrigin = 'center center';
                imgEl.style.animation = 'none';
            } else {
                imgEl.classList.remove('tile-block-overlay-img--arachne');
            }
            requestAnimationFrame(() => {
                el.animate([
                    { transform: 'scale(0.3)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1 }
                ], { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' });
                if (isArachne) {
                    setTimeout(() => {
                        if (!el.isConnected) return;
                        imgEl.animate([
                            { transform: 'scale(1)' },
                            { transform: 'scale(1.05)' },
                            { transform: 'scale(1)' }
                        ], { duration: 2000, easing: 'ease-in-out', iterations: Infinity });
                    }, 550);
                }
            });
        }

        function updateBlockAreaOverlay() {
            let el = document.getElementById('block-area-overlay');
            const ba = state.blockArea;
            if (!ba || ba.turnsLeft <= 0) {
                if (el) el.remove();
                return;
            }
            if (!el) {
                el = document.createElement('div');
                el.id = 'block-area-overlay';
                el.className = 'block-area-overlay';
                gridEl.appendChild(el);
            }
            const left = ba.c * CELL_SIZE + 5;
            const top = ba.r * CELL_SIZE + 5;
            const size = CELL_SIZE * 2 - 10;
            el.style.left = left + 'px';
            el.style.top = top + 'px';
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.display = 'block';
        }

        function onInputDown(e, block) {
            if(state.isLocked || !state.gameActive) return;
            if (state.isTargeting) { executeUltimate(block.r, block.c); return; }
            if (block.isFrozen) { return; }
            if (state.blockedTiles && state.blockedTiles.has(`${block.r},${block.c}`)) { return; }
            if (isInBlockArea(block.r, block.c)) { return; }
            if (isInTileBlockArea(block.r, block.c)) { return; } 
            dragStart = { r: block.r, c: block.c, x: e.clientX, y: e.clientY };
            block.el.classList.add('selected');
            document.addEventListener('pointermove', onInputMove);
            document.addEventListener('pointerup', onInputUp);
        }
        function onInputMove(e) { e.preventDefault(); }
        function onInputUp(e) {
            if(!dragStart) return;
            const b = state.grid[dragStart.r][dragStart.c];
            b.el.classList.remove('selected');
            const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
            document.removeEventListener('pointermove', onInputMove);
            document.removeEventListener('pointerup', onInputUp);
            dragStart = null;
            if(Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
            let tr = b.r, tc = b.c;
            if(Math.abs(dx) > Math.abs(dy)) tc += (dx > 0 ? 1 : -1); else tr += (dy > 0 ? 1 : -1);
            if(tr >= 0 && tr < GRID_SIZE && tc >= 0 && tc < GRID_SIZE) {
                const targetBlock = state.grid[tr][tc];
                const srcBlocked = state.blockedTiles && state.blockedTiles.has(`${b.r},${b.c}`);
                const dstBlocked = state.blockedTiles && state.blockedTiles.has(`${tr},${tc}`);
                const srcInBlockArea = isInBlockArea(b.r, b.c);
                const dstInBlockArea = isInBlockArea(tr, tc);
                const srcInTileBlock = isInTileBlockArea(b.r, b.c);
                const dstInTileBlock = isInTileBlockArea(tr, tc);
                if (!targetBlock.isFrozen && !srcBlocked && !dstBlocked && !srcInBlockArea && !dstInBlockArea && !srcInTileBlock && !dstInTileBlock) swapBlocks(b.r, b.c, tr, tc);
            }
        }

        async function executeUltimate(targetR, targetC) {
            state.isTargeting = false; state.skillCharge = 0; state.isLocked = true; state.isSkillReady = false;
            skillBtn.classList.remove('active', 'ready', 'btn-pulse-red'); 
            targetGuide.classList.remove('active'); 
            gridEl.classList.remove('targeting');
            const threshold = state.skillHpThresholdDesperation ?? 10;
            const isDesperation = state.playerHp <= threshold;
            let damage = isDesperation ? (state.skillDamageDesperation ?? 30) : (state.skillDamageBase ?? 10);
            damage *= (state.blockLevels?.SWORD || 1);
            const range = isDesperation ? (state.skillRangeDesperation ?? 1) : (state.skillRangeBase ?? 0);
            if (state.tileBlockArea) {
                let hitTileBlock = false;
                for (let r = targetR - range; r <= targetR + range && !hitTileBlock; r++) {
                    if (r < 0 || r >= GRID_SIZE) continue;
                    for (let c = 0; c < GRID_SIZE && !hitTileBlock; c++) { if (isInTileBlockArea(r, c)) hitTileBlock = true; }
                }
                for (let c = targetC - range; c <= targetC + range && !hitTileBlock; c++) {
                    if (c < 0 || c >= GRID_SIZE) continue;
                    for (let r = 0; r < GRID_SIZE && !hitTileBlock; r++) { if (isInTileBlockArea(r, c)) hitTileBlock = true; }
                }
                if (hitTileBlock) {
                    const tileBlockEl = document.getElementById('tile-block-overlay');
                    if (tileBlockEl) {
                        tileBlockEl.classList.add('tile-block-scale-out');
                        tileBlockEl.style.pointerEvents = 'none';
                        state.tileBlockArea = null;
                        setTimeout(() => tileBlockEl.remove(), 350);
                    } else {
                        state.tileBlockArea = null;
                    }
                }
            } 

            Sound.playSkillUse(); 

            const beamH = document.getElementById('beam-h'), beamV = document.getElementById('beam-v');
            const targetBlock = state.grid[targetR][targetC];
            const rect = targetBlock.el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const relTop = (rect.top - containerRect.top) / currentScale + (150/2) - (140/2);
            const relLeft = (rect.left - containerRect.left) / currentScale + (150/2) - (140/2);
            beamH.style.top = relTop + 'px'; beamV.style.left = relLeft + 'px';
            
            if(isDesperation) {
                beamH.classList.add('triple-h'); beamV.classList.add('triple-v');
            } else {
                beamH.classList.remove('triple-h'); beamV.classList.remove('triple-v');
            }

            beamH.classList.remove('anim-beam-h'); beamV.classList.remove('anim-beam-v');
            void beamH.offsetWidth; 
            beamH.classList.add('anim-beam-h'); beamV.classList.add('anim-beam-v');
            
            await wait(300);
            
            let matchedBlocks = new Set();
            for (let r = targetR - range; r <= targetR + range; r++) {
                if (r < 0 || r >= GRID_SIZE) continue;
                for (let i = 0; i < GRID_SIZE; i++) matchedBlocks.add(state.grid[r][i]);
            }
            for (let c = targetC - range; c <= targetC + range; c++) {
                if (c < 0 || c >= GRID_SIZE) continue;
                for (let i = 0; i < GRID_SIZE; i++) matchedBlocks.add(state.grid[i][c]);
            }

            await processEffects(Array.from(matchedBlocks), true, damage);
            updateUI();
            state.isLocked = false;
        }

        async function processSpiritBombsOnPlayerMove() {
            const battleCfg = (currentStage && currentStage.battle) || {};
            if (!battleCfg.spiritBomb) return;
            const spiritBombDamage = battleCfg.spiritBombDamage ?? 10;
            const toExplode = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const b = state.grid[r][c];
                    if (b && b.isSpiritBomb) {
                        b.spiritBombTurnsLeft = (b.spiritBombTurnsLeft ?? 0) - 1;
                        if (b.spiritBombTurnsLeft <= 0) toExplode.push(b);
                        else renderBlock(b);
                    }
                }
            }
            if (toExplode.length > 0) {
                const totalDmg = toExplode.length * spiritBombDamage;
                const toDestroySet = new Set();
                toExplode.forEach(b => {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = b.r + dr, nc = b.c + dc;
                            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                                const nb = state.grid[nr][nc];
                                if (nb) toDestroySet.add(nb);
                            }
                        }
                    }
                });
                toDestroySet.forEach(b => b.el.classList.add('matched'));
                Sound.playSpiritBomb();
                showFloatText(540, 540, `-${totalDmg}`, "#e74c3c");
                triggerSpiritBombExplosionVfx(toExplode);
                await wait(400);
                toDestroySet.forEach(b => {
                    b.el.remove();
                    state.grid[b.r][b.c] = null;
                });
                applyGravity();
                await wait(300);
                fillEmptyBlocks();
                await wait(300);
                let remain = totalDmg;
                if (state.playerShield > 0) {
                    if (state.playerShield >= remain) { state.playerShield -= remain; remain = 0; }
                    else { remain -= state.playerShield; state.playerShield = 0; }
                }
                if (remain > 0) {
                    state.playerHp = Math.max(0, state.playerHp - remain);
                    Sound.playHeroHitSFX();
                    showFloatText(1680, 540, `정령폭탄 -${remain}`, "#e74c3c");
                    const wrapper = document.getElementById('content-wrapper');
                    const flash = document.getElementById('red-flash');
                    if (wrapper) { wrapper.classList.remove('anim-shake'); void wrapper.offsetWidth; wrapper.classList.add('anim-shake'); }
                    if (flash) { flash.classList.remove('anim-flash'); void flash.offsetWidth; flash.classList.add('anim-flash'); }
                }
                updateUI();
                checkEnd();
                await wait(400);
            }
        }

        async function swapBlocks(r1, c1, r2, c2) {
            state.isLocked = true;
            let b1 = state.grid[r1][c1], b2 = state.grid[r2][c2];
            state.lastSwap = [{r:r1, c:c1}, {r:r2, c:c2}];
            state.grid[r1][c1] = b2; b2.r = r1; b2.c = c1;
            state.grid[r2][c2] = b1; b1.r = r2; b1.c = c2;
            renderBlock(b1); renderBlock(b2);
            await wait(250);
            const matches = findMatches();
            if(matches.length > 0) {
                state.turnCount++; state.movesLeft--;
                if (isDungeonMode && state.turnLimit > 0) {
                    state.turnsLeft--;
                    updateStatsUI();
                    if (state.turnsLeft <= 0) state.lostByTimeOut = true;
                }
                updateUI(); updateStatsUI();
                const currentMatches = findMatches();
                if (currentMatches.length > 0) {
                    await processRound(currentMatches);
                    if (!state.gameActive) return;
                    await processSpiritBombsOnPlayerMove();
                } else {
                    state.lastSwap = null;
                    if (isDungeonMode && state.turnLimit > 0 && state.turnsLeft <= 0) {
                        state.gameActive = false;
                        setTimeout(() => endGame(state.playerHp > 0), 500);
                    } else if (state.bossHp > 0 && state.movesLeft <= 0) setTimeout(bossTurn, 500);
                    else if (!state.isBossDead) {
                        state.isLocked = false;
                        checkAndResolveDeadlock();
                    }
                }
            } else {
                state.grid[r1][c1] = b1; b1.r = r1; b1.c = c1;
                state.grid[r2][c2] = b2; b2.r = r2; b2.c = c2;
                renderBlock(b1); renderBlock(b2); await wait(250); state.isLocked = false;
                state.lastSwap = null;
            }
        }

        async function processRound(matches) {
            if (!state.gameActive) return;
            handleSpecialCardCreation(matches);
            while(matches.length > 0) {
                if (!state.gameActive) break;
                await processEffects(matches, false);
                matches = state.gameActive ? findMatches() : [];
                if(matches.length > 0) {
                    handleSpecialCardCreation(matches);
                    await wait(200);
                }
            }
            state.lastSwap = null; 
            if (isDungeonMode && state.turnLimit > 0 && state.turnsLeft <= 0) {
                state.gameActive = false;
                setTimeout(() => endGame(state.playerHp > 0), 500);
            } else if(state.bossHp > 0 && state.movesLeft <= 0) setTimeout(bossTurn, 500); 
            else if (!state.isBossDead) {
                state.isLocked = false;
                checkAndResolveDeadlock();
            }
        }
        
        function hasPossibleMoves() {
            const isBlocked = (br, bc) => state.blockedTiles && state.blockedTiles.has(`${br},${bc}`);
            for(let r=0; r<GRID_SIZE; r++) {
                for(let c=0; c<GRID_SIZE-1; c++) {
                    const b1 = state.grid[r][c], b2 = state.grid[r][c+1];
                    if (b1.isFrozen || b2.isFrozen) continue;
                    if (isBlocked(r,c) || isBlocked(r,c+1)) continue;
                    if (isInBlockArea(r,c) || isInBlockArea(r,c+1)) continue;
                    if (isInTileBlockArea(r,c) || isInTileBlockArea(r,c+1)) continue;
                    let temp = b1.type; b1.type = b2.type; b2.type = temp;
                    let matches = findMatches();
                    temp = b1.type; b1.type = b2.type; b2.type = temp;
                    if(matches.length > 0) return true;
                }
            }
            for(let r=0; r<GRID_SIZE-1; r++) {
                for(let c=0; c<GRID_SIZE; c++) {
                    const b1 = state.grid[r][c], b2 = state.grid[r+1][c];
                    if (b1.isFrozen || b2.isFrozen) continue;
                    if (isBlocked(r,c) || isBlocked(r+1,c)) continue;
                    if (isInBlockArea(r,c) || isInBlockArea(r+1,c)) continue;
                    if (isInTileBlockArea(r,c) || isInTileBlockArea(r+1,c)) continue;
                    let temp = b1.type; b1.type = b2.type; b2.type = temp;
                    let matches = findMatches();
                    temp = b1.type; b1.type = b2.type; b2.type = temp;
                    if(matches.length > 0) return true;
                }
            }
            return false;
        }

        function checkAndResolveDeadlock() {
            if (!state.gameActive || state.isLocked || state.isBossDead) return;
            if (!hasPossibleMoves()) {
                let frozenCount = 0;
                for(let r=0; r<GRID_SIZE; r++) for(let c=0; c<GRID_SIZE; c++) if (state.grid[r][c].isFrozen) { state.grid[r][c].isFrozen = false; renderBlock(state.grid[r][c]); frozenCount++; }
                if (frozenCount > 0) {
                    showFloatText(540, 540, "이동 불가!", "#f1c40f");
                    const healAmount = frozenCount * 5;
                    state.bossHp = Math.min(state.maxBossHp, state.bossHp + healAmount);
                    setTimeout(() => showFloatText(540, 640, `보스 회복 +${healAmount}`, "#2ecc71"), 500);
                    updateUI();
                } else {
                    initGridWithRain(); showFloatText(540, 540, "섞기!", "#fff");
                }
            }
        }

        function handleSpecialCardCreation(currentMatches) {
            const swords = currentMatches.filter(b => b.type === 'SWORD' && !b.isSpecial && !b.willBecomeSpecial);
            if (swords.length < 4) return;
            const visited = new Set(); const clusters = [];
            for (let b of swords) {
                if (visited.has(b)) continue;
                const cluster = []; const queue = [b]; visited.add(b);
                while (queue.length > 0) {
                    const curr = queue.shift(); cluster.push(curr);
                    const neighbors = [ state.grid[curr.r-1]?.[curr.c], state.grid[curr.r+1]?.[curr.c], state.grid[curr.r]?.[curr.c-1], state.grid[curr.r]?.[curr.c+1] ];
                    for (let n of neighbors) {
                        if (n && swords.includes(n) && !visited.has(n)) { visited.add(n); queue.push(n); }
                    }
                }
                if (cluster.length >= 4) clusters.push(cluster);
            }
            for (let group of clusters) {
                let target = group[group.length - 1]; 
                if (state.lastSwap) {
                    const swappedBlock = group.find(b => state.lastSwap.some(s => s.r === b.r && s.c === b.c));
                    if (swappedBlock) target = swappedBlock;
                }
                target.willBecomeSpecial = true; target.specialDamageValue = group.length; 
            }
        }

        async function processEffects(matches, isSkill = false, skillDamage = 0) {
            if (!state.gameActive) return;
            let dmg=0, heal=0, def=0, charge=0; let hasSword=false;
            let realDestroy = []; let iceBrokenSound = false;
            let typesFound = new Set(); let isCritical = false;

            matches.forEach(b => {
                if (!isSkill && b.isFrozen) {
                    b.isFrozen = false; iceBrokenSound = true;
                }
                if (b.willBecomeSpecial) {
                    b.willBecomeSpecial = false; b.isSpecial = true; b.isFrozen = false;
                    b.specialDmg = b.specialDamageValue; 
                    applyEffects(b.specialDmg, 0, 0, 0, false); renderBlock(b); return; 
                } 
                b.el.classList.add('matched');
                realDestroy.push(b);
                
                if (b.isSpecial && !b.willBecomeSpecial) {
                    dmg += b.specialDmg; hasSword = true; isCritical = true;
                    showTextAtElement(b.el, `치명타 +${b.specialDmg}`, "#ff0000");
                } else if (b.type === 'SWORD' && !b.isSpecial) { 
                    dmg += 1; hasSword = true; typesFound.add('SWORD');
                } else {
                    typesFound.add(b.type);
                    const info = BLOCKS[b.type];
                    if(info.effect === 'heal') heal++;
                    if(info.effect === 'def') def++;
                    if(info.effect === 'charge') charge++;
                }
            });

            const lv = state.blockLevels || { SWORD: 1, POTION: 1, SHIELD: 1, MAGIC: 1 };
            dmg *= (lv.SWORD || 1);
            heal *= (lv.POTION || 1);
            def *= (lv.SHIELD || 1);
            charge *= (lv.MAGIC || 1);
            if (isSkill && skillDamage > 0) dmg += skillDamage;

            if (isCritical) Sound.playMatch('CRITICAL');
            else typesFound.forEach(t => Sound.playMatch(t));
            
            if (hasSword) { 
                triggerVfx('slash'); 
            }
            if (charge > 0) {
                const magicBlocks = matches.filter(b => b.type === 'MAGIC');
                triggerMagicChargeVfx(magicBlocks);
            }
            if (iceBrokenSound) { } 

            applyEffects(dmg, heal, def, charge);
            if (realDestroy.length > 0) {
                await wait(450); 
                realDestroy.forEach(b => { b.el.remove(); state.grid[b.r][b.c] = null; });
                applyGravity(); await wait(300); fillEmptyBlocks(); await wait(300);
                
                if(isSkill) {
                    const newMatches = findMatches();
                    if(newMatches.length > 0) await processRound(newMatches);
                }
            }
        }

        function applyGravity() {
            for(let c=0; c<GRID_SIZE; c++) {
                let activeBlocks = [];
                for(let r=0; r<GRID_SIZE; r++) { if(state.grid[r][c] !== null) activeBlocks.push(state.grid[r][c]); }
                for(let r=0; r<GRID_SIZE; r++) state.grid[r][c] = null;
                let targetR = GRID_SIZE - 1;
                for(let i = activeBlocks.length - 1; i >= 0; i--) {
                    let b = activeBlocks[i]; b.r = targetR; state.grid[targetR][c] = b; renderBlock(b); targetR--;
                }
            }
        }

        function fillEmptyBlocks() {
            let filled = false;
            for(let c=0; c<GRID_SIZE; c++) for(let r=0; r<GRID_SIZE; r++) if(state.grid[r][c] === null) {
                state.grid[r][c] = createBlock(r, c); 
                state.grid[r][c].el.offsetHeight;
                renderBlock(state.grid[r][c]);
                filled = true;
            }
            if(filled && state.gameActive) Sound.playDrop(); 
        }

        function resolveInitialMatches() {
            let matches = findMatches();
            while(matches.length > 0) {
                matches.forEach(b => {
                    b.type = TYPES_KEYS[Math.floor(Math.random()*TYPES_KEYS.length)];
                    b.el.className = `block ${BLOCKS[b.type].color}`;
                    const lv = (state.blockLevels && state.blockLevels[b.type]) || 1;
                    const imgEl = b.el.querySelector('.block-icon-img');
                    if (imgEl) imgEl.src = getBlockImgUrl(b.type, lv); else { b.el.innerHTML = ''; const img = document.createElement('img'); img.className = 'block-icon-img'; img.src = getBlockImgUrl(b.type, lv); img.alt = b.type; b.el.appendChild(img); }
                }); matches = findMatches();
            }
        }

        function findMatches() {
            let set = new Set();
            for(let r=0; r<GRID_SIZE; r++) for(let c=0; c<GRID_SIZE-2; c++) {
                let t = state.grid[r][c].type;
                if(t === state.grid[r][c+1].type && t === state.grid[r][c+2].type) {
                    set.add(state.grid[r][c]); set.add(state.grid[r][c+1]); set.add(state.grid[r][c+2]);
                }
            }
            for(let c=0; c<GRID_SIZE; c++) for(let r=0; r<GRID_SIZE-2; r++) {
                let t = state.grid[r][c].type;
                if(t === state.grid[r+1][c].type && t === state.grid[r+2][c].type) {
                    set.add(state.grid[r][c]); set.add(state.grid[r+1][c]); set.add(state.grid[r+2][c]);
                }
            }
            return Array.from(set);
        }

        function triggerVfx(type) {
            const wrapper = document.getElementById('boss-wrapper');
            const vfx = document.createElement('div'); vfx.className = 'vfx-slash';
            vfx.style.setProperty('--slash-angle', (Math.random() * 90 - 45) + 'deg');
            if (container && wrapper) {
                const wr = wrapper.getBoundingClientRect();
                const cr = container.getBoundingClientRect();
                if (cr.width > 0 && cr.height > 0) {
                    const centerX = (wr.left + wr.width / 2 - cr.left) / cr.width * 1080;
                    const centerY = (wr.top + wr.height / 2 - cr.top) / cr.height * 1920;
                    vfx.style.left = centerX + 'px';
                    vfx.style.top = centerY + 'px';
                }
                container.appendChild(vfx);
            } else if (wrapper) {
                wrapper.appendChild(vfx);
            }
            setTimeout(() => vfx.remove(), 600);
        }

        function triggerSpiritBombSummonVfx(targetBlocks, spiritBombTurnsVal) {
            if (!targetBlocks || targetBlocks.length === 0 || !container) return Promise.resolve();
            const bossImg = document.getElementById('boss-img');
            if (!bossImg) return Promise.resolve();
            const gameRect = container.getBoundingClientRect();
            if (gameRect.width <= 0 || gameRect.height <= 0) return Promise.resolve();
            const toGameX = (v) => (v - gameRect.left) * (DESIGN_WIDTH / gameRect.width);
            const toGameY = (v) => (v - gameRect.top) * (DESIGN_HEIGHT / gameRect.height);
            const bossRect = bossImg.getBoundingClientRect();
            const sx = toGameX(bossRect.left + bossRect.width / 2);
            const sy = toGameY(bossRect.top + bossRect.height * 0.4);
            let vfxLayer = document.getElementById('vfx-magic-layer');
            if (!vfxLayer) {
                vfxLayer = document.createElement('div');
                vfxLayer.id = 'vfx-magic-layer';
                vfxLayer.className = 'vfx-magic-layer';
                container.appendChild(vfxLayer);
            }
            const flyDuration = 450;
            const staggerDelay = 120;
            const scaleDuration = 1280;
            const promises = targetBlocks.map((b, i) => {
                const rect = b.el.getBoundingClientRect();
                const tx = toGameX(rect.left + rect.width / 2);
                const ty = toGameY(rect.top + rect.height / 2);
                const dx = tx - sx, dy = ty - sy;
                const ball = document.createElement('div');
                ball.className = 'vfx-spirit-bomb-ball';
                ball.style.left = sx + 'px';
                ball.style.top = sy + 'px';
                vfxLayer.appendChild(ball);
                return new Promise(resolve => {
                    requestAnimationFrame(() => {
                        ball.animate([
                            { transform: 'translate(-50%,-50%) translate(0,0)', opacity: 1 },
                            { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px)`, opacity: 0.95 }
                        ], { duration: flyDuration, delay: i * staggerDelay, easing: 'ease-in', fill: 'forwards'                         }).finished.then(() => {
                            ball.style.left = tx + 'px';
                            ball.style.top = ty + 'px';
                            ball.style.transformOrigin = '50% 50%';
                            ball.style.transform = 'scale(1.5)';
                            ball.animate([
                                { transform: 'scale(1.5)', opacity: 1 },
                                { transform: 'scale(2.1)', opacity: 0.9 },
                                { transform: 'scale(1.65)', opacity: 0 }
                            ], { duration: scaleDuration, easing: 'ease-out', fill: 'forwards' }).finished.then(() => {
                                b.isSpiritBomb = true;
                                b.spiritBombTurnsLeft = spiritBombTurnsVal;
                                renderBlock(b);
                                ball.remove();
                                resolve();
                            });
                        });
                    });
                });
            });
            return Promise.all(promises);
        }

        function triggerSpiritBombExplosionVfx(explodedBlocks) {
            if (!explodedBlocks || explodedBlocks.length === 0 || !container) return;
            const gameRect = container.getBoundingClientRect();
            if (gameRect.width <= 0 || gameRect.height <= 0) return;
            const toGameX = (v) => (v - gameRect.left) * (DESIGN_WIDTH / gameRect.width);
            const toGameY = (v) => (v - gameRect.top) * (DESIGN_HEIGHT / gameRect.height);
            let vfxLayer = document.getElementById('vfx-magic-layer');
            if (!vfxLayer) {
                vfxLayer = document.createElement('div');
                vfxLayer.id = 'vfx-magic-layer';
                vfxLayer.className = 'vfx-magic-layer';
                container.appendChild(vfxLayer);
            }
            const RING_SIZE = 130, PARTICLE_SIZE = 36;
            explodedBlocks.forEach(b => {
                const rect = b.el.getBoundingClientRect();
                const cx = toGameX(rect.left + rect.width / 2);
                const cy = toGameY(rect.top + rect.height / 2);
                const ringCount = 3;
                for (let i = 0; i < ringCount; i++) {
                    const ring = document.createElement('div');
                    ring.className = 'vfx-spirit-bomb-ring vfx-spirit-bomb-ring-' + i;
                    ring.style.left = (cx - RING_SIZE / 2) + 'px';
                    ring.style.top = (cy - RING_SIZE / 2) + 'px';
                    ring.style.margin = '0';
                    ring.style.transformOrigin = '50% 50%';
                    vfxLayer.appendChild(ring);
                    const ringScaleEnd = (CELL_SIZE * 3) / 100;
                    ring.animate([
                        { transform: 'scale(0.2)', opacity: 0.9 },
                        { transform: `scale(${ringScaleEnd})`, opacity: 0 }
                    ], { duration: 500, delay: i * 80, easing: 'ease-out', fill: 'forwards' }).finished.then(() => ring.remove());
                }
                const particleCount = 16;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
                    const dist = 80 + Math.random() * 60;
                    const dx = Math.cos(angle) * dist;
                    const dy = Math.sin(angle) * dist;
                    const p = document.createElement('div');
                    p.className = 'vfx-spirit-bomb-particle';
                    p.style.left = (cx - PARTICLE_SIZE / 2) + 'px';
                    p.style.top = (cy - PARTICLE_SIZE / 2) + 'px';
                    p.style.margin = '0';
                    p.style.transformOrigin = '50% 50%';
                    vfxLayer.appendChild(p);
                    p.animate([
                        { transform: 'translate(0,0) scale(1)', opacity: 1 },
                        { transform: `translate(${dx}px,${dy}px) scale(0.3)`, opacity: 0 }
                    ], { duration: 450, delay: Math.random() * 80, easing: 'ease-out', fill: 'forwards' }).finished.then(() => p.remove());
                }
            });
        }

        function triggerMagicChargeVfx(magicBlocks) {
            if (!magicBlocks || magicBlocks.length === 0 || !skillBtn || !container) return;
            const gameRect = container.getBoundingClientRect();
            if (gameRect.width <= 0 || gameRect.height <= 0) return;
            const toGameX = (v) => (v - gameRect.left) * (DESIGN_WIDTH / gameRect.width);
            const toGameY = (v) => (v - gameRect.top) * (DESIGN_HEIGHT / gameRect.height);
            const skillRect = skillBtn.getBoundingClientRect();
            const tx = toGameX(skillRect.left + skillRect.width / 2);
            const ty = toGameY(skillRect.top + skillRect.height / 2);
            let vfxLayer = document.getElementById('vfx-magic-layer');
            if (!vfxLayer) {
                vfxLayer = document.createElement('div');
                vfxLayer.id = 'vfx-magic-layer';
                vfxLayer.className = 'vfx-magic-layer';
                container.appendChild(vfxLayer);
            }
            const particleCount = Math.min(magicBlocks.length * 3, 12);
            let shakeFired = false;
            const doShake = () => {
                if (shakeFired) return;
                shakeFired = true;
                skillBtn.classList.remove('skill-charge-shake');
                void skillBtn.offsetWidth;
                skillBtn.classList.add('skill-charge-shake');
                setTimeout(() => skillBtn.classList.remove('skill-charge-shake'), 400);
            };
            for (let i = 0; i < particleCount; i++) {
                const b = magicBlocks[i % magicBlocks.length];
                const rect = b.el.getBoundingClientRect();
                const sx = toGameX(rect.left + rect.width / 2);
                const sy = toGameY(rect.top + rect.height / 2);
                const dx = tx - sx, dy = ty - sy;
                const p = document.createElement('div');
                p.className = 'vfx-magic-particle';
                p.style.left = sx + 'px';
                p.style.top = sy + 'px';
                vfxLayer.appendChild(p);
                const isLast = (i === particleCount - 1);
                requestAnimationFrame(() => {
                    p.animate([
                        { transform: 'translate(0,0) scale(1)', opacity: 1 },
                        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 }
                    ], { duration: 500, delay: i * 25, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
                        p.remove();
                        if (isLast) doShake();
                    });
                });
            }
        }

        function triggerArachneTileBlockVfx(ta) {
            const bossImg = document.getElementById('boss-img');
            if (!bossImg || !gridEl || !container) return Promise.resolve();
            const gameRect = container.getBoundingClientRect();
            if (gameRect.width <= 0 || gameRect.height <= 0) return Promise.resolve();
            const toGameX = (v) => (v - gameRect.left) * (DESIGN_WIDTH / gameRect.width);
            const toGameY = (v) => (v - gameRect.top) * (DESIGN_HEIGHT / gameRect.height);
            const bossRect = bossImg.getBoundingClientRect();
            const sx = toGameX(bossRect.left + bossRect.width / 2);
            const sy = toGameY(bossRect.top + bossRect.height * 0.5);
            const gridRect = gridEl.getBoundingClientRect();
            const centerX = (ta.c + 1.5) * CELL_SIZE;
            const centerY = (ta.r + 1.5) * CELL_SIZE;
            const scaleX = gridRect.width / (GRID_SIZE * CELL_SIZE);
            const scaleY = gridRect.height / (GRID_SIZE * CELL_SIZE);
            const tx = toGameX(gridRect.left + centerX * scaleX);
            const ty = toGameY(gridRect.top + centerY * scaleY);
            let vfxLayer = document.getElementById('vfx-magic-layer');
            if (!vfxLayer) {
                vfxLayer = document.createElement('div');
                vfxLayer.id = 'vfx-magic-layer';
                vfxLayer.className = 'vfx-magic-layer';
                container.appendChild(vfxLayer);
            }
            const ball = document.createElement('div');
            ball.className = 'vfx-arachne-ball';
            ball.style.left = sx + 'px';
            ball.style.top = sy + 'px';
            vfxLayer.appendChild(ball);
            const flyDuration = 480;
            const dx = tx - sx, dy = ty - sy;
            return new Promise(resolve => {
                requestAnimationFrame(() => {
                    ball.animate([
                        { transform: 'translate(-50%,-50%) translate(0,0)', opacity: 1 },
                        { transform: `translate(-50%,-50%) translate(${dx}px,${dy}px)`, opacity: 1 }
                    ], { duration: flyDuration, easing: 'cubic-bezier(0.05, 0.85, 0.25, 1)', fill: 'forwards' }).finished.then(() => {
                        ball.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-out', fill: 'forwards' }).finished.then(() => ball.remove());
                        setTimeout(() => resolve(), 80);
                    });
                });
            });
        }

        function triggerShieldAbsorbVfx(absorbed) {
            const shieldDisplay = document.getElementById('shield-display');
            const bossWrapper = document.getElementById('boss-wrapper');
            if (!shieldDisplay || !bossWrapper || !container) return;
            const gameRect = container.getBoundingClientRect();
            if (gameRect.width <= 0 || gameRect.height <= 0) return;
            const toGameX = (v) => (v - gameRect.left) * (DESIGN_WIDTH / gameRect.width);
            const toGameY = (v) => (v - gameRect.top) * (DESIGN_HEIGHT / gameRect.height);
            const shieldRect = shieldDisplay.getBoundingClientRect();
            const bossRect = bossWrapper.getBoundingClientRect();
            const sx = toGameX(shieldRect.left + shieldRect.width / 2);
            const sy = toGameY(shieldRect.top + shieldRect.height / 2);
            const tx = toGameX(bossRect.left + bossRect.width / 2);
            const ty = toGameY(bossRect.top + bossRect.height / 2);
            const dx = tx - sx, dy = ty - sy;
            let vfxLayer = document.getElementById('vfx-magic-layer');
            if (!vfxLayer) {
                vfxLayer = document.createElement('div');
                vfxLayer.id = 'vfx-magic-layer';
                vfxLayer.className = 'vfx-magic-layer';
                container.appendChild(vfxLayer);
            }
            const particleCount = Math.min(Math.ceil(absorbed / 4) + 4, 18);
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const perpX = (-dy / len) * 120, perpY = (dx / len) * 120;
            for (let i = 0; i < particleCount; i++) {
                const p = document.createElement('div');
                p.className = 'vfx-shield-absorb-particle';
                p.style.left = sx + (Math.random() - 0.5) * 60 + 'px';
                p.style.top = sy + (Math.random() - 0.5) * 60 + 'px';
                vfxLayer.appendChild(p);
                const arcDir = Math.random() > 0.5 ? 1 : -1;
                const arcStrength = 0.4 + Math.random() * 0.8;
                const midX = dx * 0.5 + perpX * arcDir * arcStrength + (Math.random() - 0.5) * 80;
                const midY = dy * 0.5 + perpY * arcDir * arcStrength + (Math.random() - 0.5) * 80;
                const endOff = (Math.random() - 0.5) * 100;
                const endX = dx + (Math.random() - 0.5) * endOff;
                const endY = dy + (Math.random() - 0.5) * endOff;
                const delay = Math.random() * 80;
                requestAnimationFrame(() => {
                    p.animate([
                        { transform: 'translate(0,0) scale(1)', opacity: 1 },
                        { transform: `translate(${midX}px,${midY}px) scale(1.1)`, opacity: 0.9 },
                        { transform: `translate(${endX}px,${endY}px) scale(0.6)`, opacity: 0.5 }
                    ], { duration: 650, delay, easing: 'ease-in-out', fill: 'forwards' }).finished.then(() => p.remove());
                });
            }
        }

        function applyEffects(dmg, heal, def, charge, showText=true) {
            if(dmg > 0) {
                const battleCfg = (currentStage && currentStage.battle) || {};
                const absoluteDefense = !!battleCfg.absoluteDefense;
                if (absoluteDefense && state.absoluteDefenseTurns > 0) {
                    if (showText) showFloatText(280, 540, '무효', '#9b59b6', 'boss');
                } else {
                state.bossHp = Math.max(0, state.bossHp - dmg); // 음수 방지
                if (isDungeonMode) state.totalDamageDealt += dmg;
                if(showText) {
                    if (isDungeonMode) showGoldDropEffect(280, 540, dmg);
                    else showFloatText(280, 540, `-${dmg}`, '#e74c3c', 'boss-damage');
                    Sound.playBossDamage(); 
                    const bossImg = document.getElementById('boss-img');
                    const battlePos = (currentStage && currentStage.boss && currentStage.boss.battleCharPos) || {};
                    const useCenteredHit = (battlePos.transform || '').includes('translateX(-50%)');
                    const hitClass = useCenteredHit ? 'anim-boss-hit-centered' : 'anim-boss-hit';
                    bossImg.classList.remove('anim-boss-hit', 'anim-boss-hit-centered'); void bossImg.offsetWidth; bossImg.classList.add(hitClass);
                    setTimeout(() => { bossImg.classList.remove(hitClass); }, 500); 
                }
                if (battleCfg.damageReflect && battleCfg.damageReflectPercent > 0 && state.damageReflectTurns > 0) {
                    state.damageReflectTurns--;
                    const reflected = Math.floor(dmg * (battleCfg.damageReflectPercent / 100));
                    if (reflected > 0) {
                        let remain = reflected;
                        if (state.playerShield > 0) {
                            if (state.playerShield >= remain) {
                                state.playerShield -= remain;
                                remain = 0;
                            } else {
                                remain -= state.playerShield;
                                state.playerShield = 0;
                            }
                        }
                        if (remain > 0) {
                            state.playerHp = Math.max(0, state.playerHp - remain);
                            Sound.playHeroHitSFX();
                            showFloatText(1680, 540, `반사 -${remain}`, "#e74c3c");
                            const wrapper = document.getElementById('content-wrapper');
                            const flash = document.getElementById('red-flash');
                            wrapper.classList.remove('anim-shake');
                            flash.classList.remove('anim-flash');
                            void wrapper.offsetWidth;
                            void flash.offsetWidth;
                            wrapper.classList.add('anim-shake');
                            flash.classList.add('anim-flash');
                        }
                    }
                }
                }
            }
            if(heal > 0) {
                if (state.healReverseTurns > 0) {
                    state.playerHp = Math.max(0, state.playerHp - heal);
                    showFloatText(1680, 540, `물약중독! -${heal}`, "#e74c3c");
                    state.healReverseTurns--;
                    renderAll();
                } else {
                    state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + heal);
                    showFloatText(1680, 540, `HP +${heal}`, BLOCKS.POTION.textColor, 'player-damage');
                }
            }
            if (def > 0) {
                if (state.shieldSealTurns > 0) {
                    showFloatText(1680, 540, "방패 회복 방해!", "#3498db");
                    state.shieldSealTurns--;
                } else {
                    state.playerShield += def;
                    showShieldGainFloat(1680, 540, def);
                }
            }
            if(charge > 0) {
                if (state.skillSealTurns > 0) {
                    showFloatText(1680, 540, "스킬 흡수 방해!", "#9b59b6");
                    state.skillSealTurns--;
                } else {
                    state.skillCharge = Math.min(state.maxSkillCharge, state.skillCharge + charge);
                }
            }
            updateUI(); 
            checkEnd();
        }

        function applyBossDamage(finalDmg, ignoreShield) {
            if (finalDmg <= 0) return;
            if (!ignoreShield && state.playerShield > 0) {
                if (state.playerShield >= finalDmg) {
                    const blockedAmt = finalDmg;
                    state.playerShield -= finalDmg;
                    finalDmg = 0;
                    const wrapper = document.getElementById('content-wrapper');
                    if (wrapper) {
                        wrapper.classList.remove('anim-shake-short');
                        wrapper.offsetHeight;
                        requestAnimationFrame(function () {
                            wrapper.classList.add('anim-shake-short');
                            setTimeout(function () { wrapper.classList.remove('anim-shake-short'); }, 320);
                        });
                    }
                    showShieldBlockFloat(1680, 540, blockedAmt);
                    Sound.playBlockSuccess();
                } else {
                    const shieldAmt = state.playerShield;
                    const hpAmt = finalDmg - state.playerShield;
                    state.playerShield = 0;
                    state.playerHp -= hpAmt;
                    Sound.playBlockSuccess();
                    Sound.playHeroHitSFX();
                    showShieldBlockFloat(1680, 540, shieldAmt);
                    showFloatText(1770, 540, `-${hpAmt}`, "red", "player-damage");
                    const wrapper = document.getElementById('content-wrapper');
                    const flash = document.getElementById('red-flash');
                    if (wrapper) {
                        wrapper.classList.remove('anim-shake');
                        wrapper.offsetHeight;
                        requestAnimationFrame(() => {
                            wrapper.classList.add('anim-shake');
                            setTimeout(() => wrapper.classList.remove('anim-shake'), 500);
                        });
                    }
                    if (flash) {
                        flash.classList.remove('anim-flash');
                        void flash.offsetWidth;
                        flash.classList.add('anim-flash');
                    }
                    finalDmg = 0;
                }
            }
            if (finalDmg > 0) {
                Sound.playHeroHitSFX();
                state.playerHp -= finalDmg;
                showFloatText(1680, 540, `-${finalDmg}`, "red", "player-damage");
                const wrapper = document.getElementById('content-wrapper');
                const flash = document.getElementById('red-flash');
                if (wrapper) {
                    wrapper.classList.remove('anim-shake');
                    wrapper.offsetHeight;
                    requestAnimationFrame(() => {
                        wrapper.classList.add('anim-shake');
                        setTimeout(() => wrapper.classList.remove('anim-shake'), 500);
                    });
                }
                if (flash) {
                    flash.classList.remove('anim-flash');
                    void flash.offsetWidth;
                    flash.classList.add('anim-flash');
                }
            }
        }

        function bossTurn() {
            if (!state.gameActive) return;
            const battleCfg = (currentStage && currentStage.battle) || {};
            state.isLocked = true;
            state.blockedTiles.clear();
            if (!battleCfg.blockArea2x2) state.blockArea = null;
            if (!battleCfg.tileBlock) {
                state.tileBlockArea = null;
                const tileBlockEl = document.getElementById('tile-block-overlay');
                if (tileBlockEl) tileBlockEl.remove();
            }
            document.getElementById('grid-overlay').classList.add('active');
            const minD = (typeof battleCfg.bossDamageMin === 'number') ? battleCfg.bossDamageMin : 5;
            const maxD = (typeof battleCfg.bossDamageMax === 'number') ? battleCfg.bossDamageMax : 20;
            const dmgRange = Math.max(0, maxD - minD);
            const ignoreShield = !!battleCfg.ignoreShield;
            const skillChargeReset = !!battleCfg.skillChargeReset;
            const doubleAttack = !!battleCfg.doubleAttack;
            const healReverse = !!battleCfg.healReverse;
            const healReverseTurns = battleCfg.healReverseTurns ?? 1;
            const skillSeal = !!battleCfg.skillSeal;
            const skillSealTurns = battleCfg.skillSealTurns ?? 2;
            const damageReflect = !!battleCfg.damageReflect;
            const damageReflectTurns = battleCfg.damageReflectTurns ?? 1;
            const tileBlock = !!battleCfg.tileBlock;
            const tileBlockSize = Math.min(GRID_SIZE, Math.max(1, battleCfg.tileBlockSize ?? 3));
            const blockArea2x2 = !!battleCfg.blockArea2x2;
            const blockAreaTurns = battleCfg.blockAreaTurns ?? 2;
            const vanishMostBlock = !!battleCfg.vanishMostBlock;

            showFloatText(300, 540, "공격!", "#ff0033", 'boss');
            Sound.playBossWarn();

            const absoluteDefense = !!battleCfg.absoluteDefense;
            if (absoluteDefense && state.absoluteDefenseTurns > 0) state.absoluteDefenseTurns--;

            const shieldAbsorb = !!battleCfg.shieldAbsorb;
            const shieldDestroy = !!battleCfg.shieldDestroy;
            const shieldDestroyTurns = Math.max(1, battleCfg.shieldDestroyTurns ?? 1);
            const spiritBomb = !!battleCfg.spiritBomb;
            const spiritBombCount = Math.min(9, Math.max(1, battleCfg.spiritBombCount ?? 2));
            const spiritBombTurns = battleCfg.spiritBombTurns ?? 2;

            async function addSpiritBombsToRandomBlocks(count) {
                const spiritBombTurnsVal = spiritBombTurns;
                const candidates = [];
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        const b = state.grid[r][c];
                        if (b && !b.isFrozen && !b.isSpiritBomb) candidates.push(b);
                    }
                }
                for (let i = candidates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
                }
                const targets = candidates.slice(0, Math.min(count, candidates.length));
                if (targets.length > 0) {
                    await triggerSpiritBombSummonVfx(targets, spiritBombTurnsVal);
                }
            }

            async function doShieldAbsorb() {
                if (!shieldAbsorb || state.playerShield <= 0) return;
                Sound.playShieldAbsorb();
                const absorbed = state.playerShield;
                state.playerShield = 0;
                state.bossHp = Math.min(state.maxBossHp, state.bossHp + absorbed);
                const bossImgEl = document.getElementById('boss-img');
                const battlePos = (currentStage && currentStage.boss && currentStage.boss.battleCharPos) || {};
                const hasBattlePos = Object.keys(battlePos).length > 0;
                const tx = (battlePos.transform || '').includes('translateX(-50%)') ? 'float-idle-centered' : 'float-idle';
                if (bossImgEl) {
                    bossImgEl.classList.add('boss-shield-absorb');
                    if (battlePos.noFloat) {
                        bossImgEl.style.animation = 'boss-shield-absorb-glow 1.2s ease-in-out infinite';
                    } else {
                        bossImgEl.style.animation = tx + ' 3s ease-in-out infinite, boss-shield-absorb-glow 1.2s ease-in-out infinite';
                    }
                }
                triggerShieldAbsorbVfx(absorbed);
                showFloatText(280, 540, `흡수 +${absorbed}`, "#3498db", 'boss-blue');
                updateUI();
                await new Promise(r => setTimeout(r, 800));
                if (bossImgEl) {
                    bossImgEl.classList.remove('boss-shield-absorb');
                    if (hasBattlePos) {
                        bossImgEl.style.animation = battlePos.noFloat ? 'none' : (tx + ' 3s ease-in-out infinite');
                    } else {
                        bossImgEl.style.animation = '';
                    }
                }
            }

            const skillFury = !!battleCfg.skillFury;
            const SKILL_FURY_THRESHOLD = 0.7;
            const isSkillFuryActive = skillFury && state.skillCharge >= Math.ceil(state.maxSkillCharge * SKILL_FURY_THRESHOLD);
            function runAttackSequence(onComplete) {
                if (isSkillFuryActive) {
                    // 스킬 70% 초과 시: 본래 공격력으로 3회 연속 공격 (공격 시 첫 타격에만 skill_fury.ogg 1회 재생)
                    function doHit(n, next) {
                        setTimeout(() => {
                            const dmg = minD + Math.floor(Math.random() * (dmgRange + 1));
                            if (n === 1) Sound.playSkillFury();
                            applyBossDamage(dmg, ignoreShield);
                            if (n < 3) doHit(n + 1, next);
                            else next();
                        }, n === 1 ? 500 : 400);
                    }
                    doHit(1, onComplete);
                } else {
                    setTimeout(() => {
                        let dmg = minD + Math.floor(Math.random() * (dmgRange + 1));
                        Sound.playBossAttack();
                        applyBossDamage(dmg, ignoreShield);
                        if (doubleAttack) {
                            setTimeout(() => {
                                let dmg2 = minD + Math.floor(Math.random() * (dmgRange + 1));
                                applyBossDamage(dmg2, ignoreShield);
                                onComplete();
                            }, 400);
                        } else {
                            onComplete();
                        }
                    }, 500);
                }
            }

            async function doShieldDestroy() {
                if (!shieldDestroy) return;
                if (state.playerShield > 0) {
                    state.playerShield = 0;
                    showFloatText(1680, 540, "방패 파괴!", "#e74c3c");
                    updateUI();
                    await new Promise(r => setTimeout(r, 400));
                }
                state.shieldSealTurns = shieldDestroyTurns;
            }

            (async () => {
                await doShieldAbsorb();
                await doShieldDestroy();
                runAttackSequence(async () => {
                if (skillChargeReset) {
                    state.skillCharge = 0;
                    state.isSkillReady = false;
                }
                if (healReverse) state.healReverseTurns = healReverseTurns;
                if (skillSeal) state.skillSealTurns = skillSealTurns;
                if (damageReflect) state.damageReflectTurns = damageReflectTurns;
                if (absoluteDefense) {
                    state.absoluteDefenseTurns = (state.bossHp <= state.maxBossHp * 0.3) ? 2 : 1;
                }
                if (healReverse || damageReflect || absoluteDefense) renderAll();

                const petrifyBlockType = battleCfg.petrifyBlockType || battleCfg.freezeBlockType || null;
                if (petrifyBlockType) {
                    petrifyAllBlocksOfType(petrifyBlockType);
                }
                const banishBlocks = !!battleCfg.banishBlocks;
                if (banishBlocks) {
                    let banishCount = 1;
                    const banishCfg = battleCfg.banishThresholds;
                    if (Array.isArray(banishCfg) && banishCfg.length > 0) {
                        banishCfg.forEach(phase => {
                            if (typeof phase.hpLessOrEqual === 'number' && typeof phase.banishCount === 'number') {
                                if (state.bossHp <= phase.hpLessOrEqual) banishCount = phase.banishCount;
                            }
                        });
                    }
                    for (let k = 0; k < banishCount; k++) banishRandomBlocks();
                }

                if (tileBlock) {
                    const maxR = Math.max(0, GRID_SIZE - tileBlockSize);
                    const maxC = Math.max(0, GRID_SIZE - tileBlockSize);
                    const r = Math.floor(Math.random() * (maxR + 1));
                    const c = Math.floor(Math.random() * (maxC + 1));
                    state.tileBlockArea = { r, c, size: tileBlockSize };
                    const isArachne = (currentStage && (currentStage.id === 'd4' || currentStage.name === '아라크네'));
                    if (isArachne) {
                        await triggerArachneTileBlockVfx({ r, c, size: tileBlockSize });
                    }
                    updateTileBlockOverlay();
                }
                if (blockArea2x2) {
                    if (state.blockArea && state.blockArea.turnsLeft > 0) {
                        state.blockArea.turnsLeft--;
                        if (state.blockArea.turnsLeft <= 0) state.blockArea = null;
                    }
                    if (!state.blockArea || state.blockArea.turnsLeft <= 0) {
                        const maxR = Math.max(0, GRID_SIZE - 2);
                        const maxC = Math.max(0, GRID_SIZE - 2);
                        const r = Math.floor(Math.random() * (maxR + 1));
                        const c = Math.floor(Math.random() * (maxC + 1));
                        state.blockArea = { r, c, turnsLeft: blockAreaTurns };
                    }
                    updateBlockAreaOverlay();
                }
                if (vanishMostBlock) await vanishMostCommonBlocks();

                const movesPerAttack = battleCfg.movesPerAttack || 3;
                state.movesLeft = movesPerAttack;
                updateUI();
                checkEnd();

                if (state.gameActive) {
                    state.isLocked = false;
                    document.getElementById('grid-overlay').classList.remove('active');
                    if (spiritBomb) await addSpiritBombsToRandomBlocks(spiritBombCount);
                    checkAndResolveDeadlock();
                } else {
                    document.getElementById('grid-overlay').classList.remove('active');
                }
            });
            })();
        }

        function petrifyAllBlocksOfType(blockType) {
            let count = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const b = state.grid[r][c];
                    if (b && !b.isFrozen && b.type === blockType) {
                        b.isFrozen = true;
                        renderBlock(b);
                        count++;
                    }
                }
            }
            if (count > 0) {
                const first = state.grid.flat().find(b => b && b.isFrozen);
                if (first) showTextAtElement(first.el, "석화!", "#7f8c8d", 'rock');
            }
        }

        function banishRandomBlocks() {
            let candidates = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const b = state.grid[r][c];
                    if (b && !b.isFrozen) candidates.push(b);
                }
            }
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            if (candidates.length > 0) {
                candidates[0].isFrozen = true;
                renderBlock(candidates[0]);
                showTextAtElement(candidates[0].el, "추방!", "#7f8c8d", 'rock');
            }
        }

        async function vanishMostCommonBlocks() {
            const countByType = {};
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const b = state.grid[r][c];
                    if (b && !b.isFrozen) {
                        countByType[b.type] = (countByType[b.type] || 0) + 1;
                    }
                }
            }
            let maxCount = 0;
            let vanishType = null;
            for (const type of TYPES_KEYS) {
                const n = countByType[type] || 0;
                if (n > maxCount) { maxCount = n; vanishType = type; }
            }
            if (vanishType == null || maxCount === 0) return;
            const toRemove = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const b = state.grid[r][c];
                    if (b && !b.isFrozen && b.type === vanishType) toRemove.push(b);
                }
            }
            if (toRemove.length === 0) return;
            toRemove.forEach(b => { state.grid[b.r][b.c] = null; });
            const vanishDuration = 320;
            const promises = toRemove.map(b => {
                const el = b.el;
                el.style.pointerEvents = 'none';
                el.style.zIndex = '50';
                return el.animate([
                    { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
                    { transform: 'scale(0.4)', opacity: 0, filter: 'brightness(2)' }
                ], { duration: vanishDuration, easing: 'ease-in', fill: 'forwards' }).finished.then(() => { el.remove(); });
            });
            showFloatText(540, 540, "소멸!", "#e74c3c");
            await Promise.all(promises);
            applyGravity();
            await wait(300);
            fillEmptyBlocks();
            await wait(300);
        }

        function checkEnd() { 
            // 게임이 활성화되어 있을 때만 체크
            if (!state.gameActive) return;
            
            // 보스 HP가 0 이하이고 게임이 진행 중일 때만 승리 처리
            if (state.bossHp <= 0 && state.bossHp !== null) {
                console.log("보스 HP:", state.bossHp, "승리 처리");
                endGame(true); 
            } 
            // 플레이어 HP가 0 이하일 때 패배 처리
            else if (state.playerHp <= 0 && state.playerHp !== null) {
                console.log("플레이어 HP:", state.playerHp, "패배 처리");
                endGame(false); 
            }
        }
        
        // --- [수정된 endGame 함수: 시나리오 연동용 메시지 추가] ---
      function endGame(win) {
            state.gameActive = false; state.isLocked = true;
            state.winBySurvival = !!(win && state.turnLimit > 0 && state.turnsLeft <= 0 && state.playerHp > 0);
            clearInterval(gameTimerInterval);
            Sound.stopAll(); 

            // 시나리오 모드 확인
            const params = new URLSearchParams(window.location.search);
            const isScenarioMode = params.get('mode') === 'scenario';

            // 시나리오 모드: 결과창까지 띄운 뒤, 확인 누르면 부모에 전달 (showEndingScreen에서 처리)
            // 일반 모드와 동일하게 결과 화면 표시
            if(win) {
                if(!state.isBossDead) {
                    state.isBossDead = true;
                    if (countdownDisplay) {
                        countdownDisplay.innerText = "전투종료!!";
                        countdownDisplay.style.opacity = '';
                        countdownDisplay.classList.remove('pop','fight-enter','fight-hold','fight-exit','finish-enter','finish-hold','finish-exit');
                        void countdownDisplay.offsetWidth;
                        countdownDisplay.classList.add('finish-enter');
                        Sound.playTone(880, 'square', 0.3);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('finish-enter');
                            countdownDisplay.classList.add('finish-hold');
                        }, 250);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('finish-hold');
                            countdownDisplay.classList.add('finish-exit');
                        }, 1250);
                        setTimeout(() => {
                            countdownDisplay.classList.remove('finish-exit');
                            countdownDisplay.style.opacity = '0';
                        }, 1600);
                    }
                    setTimeout(() => showEndingScreen(true), 2000); // 배틀 종료 2초 후 결과창
                }
            } else {
                const delay = state.quitByUser ? 0 : 2000;
                setTimeout(() => showEndingScreen(false), delay);
            }
        }

        // --- [수정된 showEndingScreen 함수: 신기록 메시지 출력] ---
   // ============================================================
        // [수정됨] 결과 화면 및 점수 전송 로직 (v57)
        // ============================================================
        function showEndingScreen(win) {
            const transitionLayer = document.getElementById('transition-layer');
            const screen = document.getElementById('result-screen');
            const params = new URLSearchParams(window.location.search);
            const isScenarioMode = params.get('mode') === 'scenario';
            
            // 1단계: 게임 화면 그대로 두고 검은 레이어만 페이드 인
            document.getElementById('grid-overlay').classList.remove('active');
            transitionLayer.classList.remove('fade-out');
            if (state.quitByUser) transitionLayer.style.transition = 'opacity 0.5s ease-in-out';
            transitionLayer.classList.add('active');

            // 2단계: (나가기 시 0.55초 후 페이드인 완료, 일반 패배 시 1초 후) 게임 UI 숨김, 결과창 표시
            const contentDelay = state.quitByUser ? 550 : 1000;
            setTimeout(() => {
                if (state.quitByUser && transitionLayer.style.transition) transitionLayer.style.transition = '';
                if (isScenarioMode && window.parent && window.parent !== window) {
                    try { window.parent.postMessage({ type: 'resultScreenShown', win }, '*'); } catch (e) {}
                }
                document.getElementById('content-wrapper').style.display = 'none';
                
                // 결과창: 1080x1920 기준, 게임 컨테이너와 동일한 스케일
                const scale = currentScale || 1;
                screen.classList.remove('hidden');
                screen.style.cssText = 
                    'visibility:visible; pointer-events:auto; ' +
                    'opacity:0; transition:opacity 0.5s ease-in-out; ' +
                    `transform: translate(-50%, -50%) scale(${scale}); transform-origin: center center;`;
                
                const endingText = document.getElementById('ending-text');
                const resultBubble = document.getElementById('result-bubble');
                const resultImg = document.getElementById('result-char-img');
                const retryBtn = document.getElementById('retry-btn');
                const exitBtn = document.getElementById('result-exit-btn');
                
                endingText.style.display = 'block';
                if (document.getElementById('result-stats')) document.getElementById('result-stats').style.display = 'none';

                const battleCfgGold = (currentStage && currentStage.battle) || {};
                const goldReduce = Math.max(0, Math.min(1, battleCfgGold.goldReduce ?? 0));
                const fixedReward = (currentStage && currentStage.goldReward && currentStage.goldReward.min === currentStage.goldReward.max)
                    ? currentStage.goldReward.min
                    : null;
                // 던전: 승리 시(생존/보스처치) 항상 데미지준 금화 = totalDamageDealt
                const effectiveGold = (win && isDungeonMode)
                    ? Math.floor((state.totalDamageDealt || 0) * (1 - goldReduce))
                    : (fixedReward != null ? fixedReward : Math.floor((state.totalDamageDealt || 0) * (1 - goldReduce)));
                const goldEl = document.getElementById('result-gold-earned');
                if (goldEl) {
                    const showGold = isDungeonMode && !state.quitByUser && win && effectiveGold > 0;
                    if (showGold) {
                        const coinSrc = resolveAssetUrl('../../assets/images/main/coin.png');
                        goldEl.innerHTML = `<img class="result-gold-icon" src="${coinSrc}" alt=""><span class="result-gold-val">+${effectiveGold}</span>`;
                        goldEl.classList.remove('hidden');
                        goldEl.style.display = 'flex';
                    } else {
                        goldEl.innerHTML = '';
                        goldEl.classList.add('hidden');
                        goldEl.style.display = 'none';
                    }
                }
                const goldWidget = document.getElementById('gold-dungeon-widget');
                if (goldWidget && isDungeonMode && !win) {
                    goldWidget.classList.add('hidden');
                    goldWidget.style.display = 'none';
                }

                const bossCfg = (currentStage && currentStage.boss) || {};
                const resultLose = bossCfg.resultLose || {};
                const resultWin = bossCfg.resultWin || {};

                // resultCharPos: 승리/패배 화면 몬스터 위치 조정 (던전 스테이지)
                const resultPos = bossCfg.resultCharPos || {};
                if (resultImg && Object.keys(resultPos).length > 0) {
                    resultImg.style.position = 'absolute';
                    if (resultPos.left !== undefined) resultImg.style.left = resultPos.left;
                    if (resultPos.right !== undefined) resultImg.style.right = resultPos.right;
                    if (resultPos.bottom !== undefined) { resultImg.style.bottom = resultPos.bottom; resultImg.style.top = ''; }
                    if (resultPos.top !== undefined) { resultImg.style.top = resultPos.top; resultImg.style.bottom = ''; }
                    // translateX(-50%) 사용 시 result-idle 애니메이션과 호환 (애니가 transform 덮어쓰므로)
                    const tx = (resultPos.transform || '').includes('translateX(-50%)');
                    if (tx) {
                        resultImg.style.transform = '';
                        resultImg.style.animation = 'result-idle-centered 2.5s ease-in-out infinite';
                    } else {
                        if (resultPos.transform !== undefined) resultImg.style.transform = resultPos.transform;
                        resultImg.style.animation = 'result-idle 2.5s ease-in-out infinite';
                    }
                } else if (resultImg) {
                    resultImg.style.position = '';
                    resultImg.style.left = ''; resultImg.style.right = '';
                    resultImg.style.bottom = ''; resultImg.style.top = '';
                    resultImg.style.transform = '';
                    resultImg.style.animation = '';
                }

                if (win) { 
                    endingText.innerHTML = isDungeonMode
                        ? (state.winBySurvival ? "던전에서 생환했습니다." : "보스를 쓰러뜨렸습니다!")
                        : "전투에 승리했습니다.";
                    endingText.style.color = "#3498db"; 
                    resultBubble.style.display = 'block';
                    resultBubble.className = 'win';
                    resultBubble.textContent = resultWin.dialogue || "승리했어요!";
                    resultImg.src = resultWin.image || bossCfg.successImage || (BATTLE_ASSETS + "/success.png"); 
                    resultImg.style.display = 'block';
                    Sound.playSuccess();
                    
                    if (exitBtn) exitBtn.style.display = 'none';
                    if (retryBtn) {
                        retryBtn.style.display = 'block';
                        retryBtn.textContent = '확인';
                        retryBtn.onclick = (isScenarioMode || isDungeonMode) ? () => {
                            Sound.playClick();
                            if (state.resultSent) return;
                            state.resultSent = true;
                            screen.style.transition = 'opacity 0.6s ease-out';
                            screen.style.opacity = '0';
                            setTimeout(() => {
                                try {
                                    if (window.parent && window.parent !== window) {
                                        const winMsg = { type: 'battleResult', win: true, stageId: currentStageId || null };
                                        if (isDungeonMode) {
                                            winMsg.goldEarned = effectiveGold;
                                            winMsg.winBySurvival = !!state.winBySurvival;
                                        }
                                        window.parent.postMessage(winMsg, '*');
                                    }
                                } catch (e) {}
                                transitionLayer.classList.remove('active');
                                transitionLayer.classList.add('fade-out');
                                screen.classList.add('hidden');
                            }, 650);
                        } : returnToTitle;
                    }
                } else { 
                    endingText.innerHTML = isDungeonMode ? "돌아오지 못했습니다." : (state.lostByTimeOut ? "턴 종료! 전투가 끝났습니다." : "전투에 패배했습니다.");
                    endingText.style.color = "#e74c3c"; 
                    resultBubble.style.display = 'block';
                    resultBubble.className = 'lose';
                    resultBubble.textContent = resultLose.dialogue || "다음엔 반드시...!";
                    resultImg.src = resultLose.image || bossCfg.failImage || (BATTLE_ASSETS + "/fail.png"); 
                    resultImg.style.display = 'block';
                    Sound.playFail();
                    
                    if (retryBtn) {
                        retryBtn.style.display = 'block';
                        retryBtn.textContent = '다시 도전';
                        retryBtn.onclick = () => {
                            Sound.playClick();
                            screen.style.transition = 'opacity 0.6s ease-out';
                            screen.style.opacity = '0';
                            setTimeout(() => {
                                transitionLayer.classList.remove('active'); transitionLayer.classList.add('fade-out'); screen.classList.add('hidden'); location.reload();
                            }, 650);
                        };
                    }
                    if (exitBtn) {
                        exitBtn.style.display = 'block';
                        exitBtn.textContent = isDungeonMode ? '나가기' : '포기하기';
                        exitBtn.onclick = (isScenarioMode || isDungeonMode) ? () => {
                            Sound.playClick();
                            if (state.resultSent) return;
                            state.resultSent = true;
                            screen.style.transition = 'opacity 0.6s ease-out';
                            screen.style.opacity = '0';
                            setTimeout(() => {
                                try {
                                    if (window.parent && window.parent !== window) {
                                        const loseGold = state.quitByUser ? 0 : (fixedReward != null ? 0 : effectiveGold);
                                        const loseMsg = { type: 'battleResult', win: false, stageId: currentStageId || null, action: isDungeonMode ? 'goToDungeonList' : 'goToEpisodeSelect' };
                                        if (isDungeonMode) loseMsg.goldEarned = loseGold;
                                        window.parent.postMessage(loseMsg, '*');
                                    }
                                } catch (e) {}
                                transitionLayer.classList.remove('active');
                                transitionLayer.classList.add('fade-out');
                                screen.classList.add('hidden');
                            }, 650);
                        } : returnToTitle;
                    }
                }
                
                requestAnimationFrame(() => { screen.style.opacity = '1'; });
            }, contentDelay);
        }

        // 랭킹/이름 입력 관련 코드는 스테이지형 게임에서 사용하지 않으므로 제거/비활성화

        function updateUI() {
            // 보스 HP가 음수가 되지 않도록 보정
            state.bossHp = Math.max(0, state.bossHp);
            state.playerHp = Math.max(0, state.playerHp);
            
            const bP = (state.bossHp/state.maxBossHp)*100;
            const bossBar = document.getElementById('boss-hp-bar');
            const bossHpText = document.getElementById('boss-hp-text');
            if (bossBar) bossBar.style.width = Math.max(0, bP)+'%';
            if (bossHpText) bossHpText.innerText = Math.max(0, state.bossHp);
            if (bP > 75) bossBar.style.background = "linear-gradient(90deg, #27ae60, #2ecc71)";
            else if (bP > 50) bossBar.style.background = "linear-gradient(90deg, #2980b9, #3498db)";
            else if (bP > 25) bossBar.style.background = "linear-gradient(90deg, #f39c12, #f1c40f)";
            else bossBar.style.background = "linear-gradient(90deg, #c0392b, #e74c3c)";

            const pP = (state.playerHp/state.maxPlayerHp)*100;
            const playerBar = document.getElementById('player-hp-bar');
            const playerHpText = document.getElementById('player-hp-text');
            if (playerBar) playerBar.style.width = Math.max(0, pP)+'%';
            if (playerHpText) playerHpText.innerText = Math.max(0, state.playerHp);
            if (state.playerHp <= 10) playerBar.style.background = "linear-gradient(90deg, #c0392b, #e74c3c)";
            else playerBar.style.background = "linear-gradient(90deg, #27ae60, #2ecc71)";

            const shieldValueEl = document.getElementById('shield-value');
            if (shieldValueEl) shieldValueEl.innerText = state.playerShield;
            const damageReflectShield = document.getElementById('boss-damage-reflect-shield');
            const battleCfgReflect = (currentStage && currentStage.battle) || {};
            if (damageReflectShield && battleCfgReflect.damageReflect) {
                if (state.damageReflectTurns > 0) {
                    damageReflectShield.classList.remove('hidden');
                } else {
                    damageReflectShield.classList.add('hidden');
                }
            } else if (damageReflectShield) {
                damageReflectShield.classList.add('hidden');
            }
            const absoluteDefenseShield = document.getElementById('boss-absolute-defense-shield');
            const battleCfgAbs = (currentStage && currentStage.battle) || {};
            if (absoluteDefenseShield && battleCfgAbs.absoluteDefense) {
                if (state.absoluteDefenseTurns > 0) {
                    absoluteDefenseShield.classList.remove('hidden');
                } else {
                    absoluteDefenseShield.classList.add('hidden');
                }
            } else if (absoluteDefenseShield) {
                absoluteDefenseShield.classList.add('hidden');
            }
            const bossImgEl = document.getElementById('boss-img');
            const battleCfgFury = (currentStage && currentStage.battle) || {};
            if (bossImgEl && battleCfgFury.skillFury) {
                const battlePos = (currentStage && currentStage.boss && currentStage.boss.battleCharPos) || {};
                const hasBattlePos = Object.keys(battlePos).length > 0;
                const tx = (battlePos.transform || '').includes('translateX(-50%)') ? 'float-idle-centered' : 'float-idle';
                if (state.skillCharge >= Math.ceil(state.maxSkillCharge * 0.7)) {
                    if (!state.skillFuryEffectOn) {
                        state.skillFuryEffectOn = true;
                        Sound.playSkillFury();
                    }
                    bossImgEl.classList.add('boss-skill-fury');
                    if (battlePos.noFloat) {
                        bossImgEl.style.animation = 'boss-skill-fury-glow 1.4s ease-in-out infinite';
                    } else {
                        bossImgEl.style.animation = tx + ' 3s ease-in-out infinite, boss-skill-fury-glow 1.4s ease-in-out infinite';
                    }
                } else {
                    state.skillFuryEffectOn = false;
                    bossImgEl.classList.remove('boss-skill-fury');
                    if (hasBattlePos) {
                        bossImgEl.style.animation = battlePos.noFloat ? 'none' : (tx + ' 3s ease-in-out infinite');
                    } else {
                        bossImgEl.style.animation = '';
                    }
                }
            }
            const movesLeftEl = document.getElementById('moves-left');
            const turnAbilityEl = document.getElementById('turn-info-ability');
            const turnExtrasEl = document.getElementById('turn-info-extras');
            if (movesLeftEl) movesLeftEl.innerText = state.movesLeft;
            if (turnExtrasEl) {
                const battleCfg = (currentStage && currentStage.battle) || {};
                const extras = [];
                if (battleCfg.skillFury) extras.push('스킬 광폭화(70%·3연타)');
                if (battleCfg.shieldAbsorb) extras.push('방패 흡수');
                if (battleCfg.shieldDestroy) extras.push('방패파괴');
                if (battleCfg.ignoreShield) extras.push('방패 무시');
                if (battleCfg.skillChargeReset) extras.push('스킬 0화');
                if (battleCfg.doubleAttack) extras.push('2연타');
                if (battleCfg.spiritBomb) extras.push('정령 폭탄');
                if (battleCfg.healReverse) {
                    const n = battleCfg.healReverseTurns ?? 1;
                    extras.push(n === 1 ? '물약중독' : `${n}회 물약중독`);
                }
                if (battleCfg.damageReflect) {
                    const pct = battleCfg.damageReflectPercent ?? 50;
                    const n = battleCfg.damageReflectTurns ?? 1;
                    extras.push(n === 1 ? `데미지 반사 ${pct}%` : `${n}회 데미지 반사 ${pct}%`);
                }
                if (battleCfg.absoluteDefense) extras.push('절대 방어');
                if (battleCfg.skillSeal) extras.push('스킬 흡수 방해');
                if (battleCfg.vanishMostBlock) extras.push('소멸');
                if (battleCfg.tileBlock) extras.push('타일 막힘');
                if (battleCfg.blockArea2x2) extras.push('이동 불가 타일');
                if (battleCfg.goldReduce) extras.push('골드 감소');
                const petrifyType = battleCfg.petrifyBlockType || battleCfg.freezeBlockType;
                if (petrifyType === 'POTION') extras.push('물약 석화');
                else if (petrifyType === 'SHIELD') extras.push('방패 석화');
                else if (petrifyType === 'MAGIC') extras.push('마법 석화');
                if (battleCfg.banishBlocks) extras.push('랜덤 블럭 추방');
                const escapeHtml = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                turnExtrasEl.innerHTML = extras.map(t => {
                    const safe = escapeHtml(t);
                    const withLineBreak = safe.replace(/\(/g, '<br>(');
                    return `<span class="turn-extra-line"><span class="turn-extra-text">+${withLineBreak}</span></span>`;
                }).join('');
                if (turnAbilityEl) turnAbilityEl.innerText = extras.length > 0 ? '공격' : (state.attackLabel || '공격');
            } else if (turnAbilityEl) {
                turnAbilityEl.innerText = state.attackLabel || '공격';
            }
            const sP = (state.skillCharge / state.maxSkillCharge) * 100;
            const skillBar = document.getElementById('skill-bar');
            const skillBarText = document.getElementById('skill-bar-text');
            const skillFill = document.getElementById('skill-btn-fill');
            if (skillBar) skillBar.style.width = sP + '%';
            if (skillFill) skillFill.style.height = sP + '%';
            const maxCharge = state.maxSkillCharge ?? 30;
            if (skillBarText) skillBarText.innerText = `${state.skillCharge}/${maxCharge}`;
            
            if (state.skillCharge >= maxCharge) {
                skillBtn.classList.add('ready');
                if (!state.isSkillReady) {
                    Sound.playSkillCharged();
                    state.isSkillReady = true;
                }
                
                const desperationThreshold = state.skillHpThresholdDesperation ?? 10;
                if (state.playerHp <= desperationThreshold) {
                    skillBtn.classList.add('btn-pulse-red');
                } else {
                    skillBtn.classList.remove('btn-pulse-red');
                }

            } else {
                skillBtn.classList.remove('ready', 'active', 'btn-pulse-red');
                state.isSkillReady = false;
            }

            const goldCountEl = document.getElementById('gold-count');
            if (goldCountEl && isDungeonMode) goldCountEl.innerText = state.totalDamageDealt ?? 0;
        }

        function showTextAtElement(element, text, color, type='normal') {
            const rect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const relTop = (rect.top - containerRect.top) / currentScale;
            const relLeft = (rect.left - containerRect.left) / currentScale + (150/2); 
            showFloatText(relTop, relLeft, text, color, type);
        }

        function showGoldDropEffect(top, left, amount) {
            Sound.playCoinClink();
            const amt = Math.max(1, amount || 1);
            const particleCount = Math.min(4 + Math.floor(amt / 2), 12);

            const wrap = document.createElement('div');
            wrap.className = 'gold-burst-wrap';
            wrap.style.top = top + 'px';
            wrap.style.left = left + 'px';
            const flash = document.createElement('div');
            flash.className = 'gold-burst-flash';
            wrap.appendChild(flash);
            const center = document.createElement('div');
            center.className = 'gold-burst-amount';
            center.textContent = '-' + amount;
            wrap.appendChild(center);
            const durations = [0.55, 0.65, 0.5, 0.7, 0.6, 0.75, 0.58, 0.68, 0.52, 0.72];
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * 360 + Math.random() * 36;
                const rad = (angle * Math.PI) / 180;
                const burstX = Math.cos(rad) * 180;
                const burstY = Math.sin(rad) * 140;
                const rotX = (Math.random() - 0.5) * 720;
                const rotY = (Math.random() - 0.5) * 720;
                const p = document.createElement('img');
                p.className = 'gold-burst-particle';
                p.src = resolveAssetUrl('../../assets/images/main/coin.png');
                p.alt = '';
                p.style.setProperty('--bx', burstX + 'px');
                p.style.setProperty('--by', burstY + 'px');
                p.style.setProperty('--rot-x', rotX + 'deg');
                p.style.setProperty('--rot-y', rotY + 'deg');
                p.style.setProperty('--delay', (i * 0.01) + 's');
                p.style.setProperty('--duration', durations[i % durations.length] + 's');
                wrap.appendChild(p);
            }
            container.appendChild(wrap);
            setTimeout(() => wrap.remove(), 2400);
        }

        function showShieldBlockFloat(top, left, amount) {
            floatTextStack++;
            const offset = (floatTextStack - 1) * 65;
            if (floatTextTimer) clearTimeout(floatTextTimer);
            floatTextTimer = setTimeout(() => { floatTextStack = 0; }, 1200);
            const el = document.createElement('div');
            el.className = 'floater floater-shield-block floater-shield-block--block';
            el.style.top = (top - offset) + 'px';
            el.style.left = left + 'px';
            const shieldLv = (state.blockLevels && state.blockLevels.SHIELD) || 1;
            const shieldSrc = resolveAssetUrl(getBlockImgUrl('SHIELD', shieldLv));
            el.innerHTML = `<img class="floater-shield-icon" src="${shieldSrc}" alt=""><span class="floater-shield-val">-${amount}</span>`;
            container.appendChild(el);
            setTimeout(() => el.remove(), 3800);
        }

        function showShieldGainFloat(top, left, amount) {
            floatTextStack++;
            const offset = (floatTextStack - 1) * 65;
            if (floatTextTimer) clearTimeout(floatTextTimer);
            floatTextTimer = setTimeout(() => { floatTextStack = 0; }, 1200);
            const el = document.createElement('div');
            el.className = 'floater floater-shield-block';
            el.style.top = (top - offset) + 'px';
            el.style.left = left + 'px';
            const shieldLv = (state.blockLevels && state.blockLevels.SHIELD) || 1;
            const shieldSrc = resolveAssetUrl(getBlockImgUrl('SHIELD', shieldLv));
            el.innerHTML = `<img class="floater-shield-icon" src="${shieldSrc}" alt=""><span class="floater-shield-val">+${amount}</span>`;
            container.appendChild(el);
            setTimeout(() => el.remove(), 3800);
        }

        function showFloatText(top, left, text, color, type = 'normal') {
            let offset = 0;
            if (type === 'boss' || type === 'boss-blue') {
                floatTextStackBoss++;
                offset = (floatTextStackBoss - 1) * 65;
                if (floatTextTimerBoss) clearTimeout(floatTextTimerBoss);
                floatTextTimerBoss = setTimeout(() => { floatTextStackBoss = 0; }, 1200);
            } else if (type === 'normal' || type === 'boss-damage') {
                floatTextStack++;
                offset = (floatTextStack - 1) * 65;
                if (floatTextTimer) clearTimeout(floatTextTimer);
                floatTextTimer = setTimeout(() => { floatTextStack = 0; }, 1200);
            }
            const el = document.createElement('div'); 
            if(type === 'rock') el.className = 'floater-rock';
            else el.className = 'floater';
            if(type === 'boss') el.classList.add('floater-boss');
            if(type === 'boss-blue') el.classList.add('floater-boss-blue');
            if(type === 'player-damage') el.classList.add('floater-player-damage');
            if(type === 'boss-damage') el.classList.add('floater-boss-damage');
            el.innerText = text; el.style.color = color;
            el.style.top = (top - offset) + 'px'; el.style.left = left + 'px'; 
            container.appendChild(el); 
            setTimeout(() => el.remove(), 3800); 
        }
        function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

        const titleAsmoWrapper = document.getElementById('title-asmo-wrapper');
        const titleScreen = document.getElementById('title-screen');
        if (titleAsmoWrapper && titleScreen) {
            titleAsmoWrapper.addEventListener('animationend', (event) => {
                if (event.animationName === 'asmoEnter') {
                    titleScreen.classList.add('show-logo');
                    setTimeout(() => {
                        titleScreen.classList.add('show-buttons');
                    }, 800);
                }
            });
        }

        // --- [시나리오에서 스테이지 전투 호출용 전역 API] ---
        // 예) 다른 스크립트에서 window.startBattleStage(2) 호출하면
        // 2번 스테이지 설정으로 타이틀을 건너뛰고 바로 전투를 시작합니다.
        window.startBattleStage = function(stageId) {
            const id = stageId || 1;
            loadStageConfig(id);
            applyStageStatsToState();
            applyStageVisuals();

            const titleScreenEl = document.getElementById('title-screen');
            const contentWrapperEl = document.getElementById('content-wrapper');
            if (titleScreenEl) { titleScreenEl.classList.add('hidden'); titleScreenEl.style.display = 'none'; }
            if (contentWrapperEl) { contentWrapperEl.classList.remove('title-hidden'); contentWrapperEl.classList.add('visible'); }

            // 사운드 초기화 및 전환 연출
            Sound.init();
            transitionLayer.classList.remove('fade-out');
            transitionLayer.classList.add('active');

            setTimeout(() => {
                startGameSetup();
                setTimeout(() => {
                    transitionLayer.classList.remove('active');
                    transitionLayer.classList.add('fade-out');
                    Sound.playBGM();
                }, 167);
            }, 167);
        };
