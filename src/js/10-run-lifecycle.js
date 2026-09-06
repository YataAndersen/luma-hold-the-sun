  function resetRun() {
    state.runTime = 0; state.scoreMeters = 0; state.runDawns = 0;
    state.combo = 0; state.comboTimer = 0; state.maxComboThisRun = 0; state.rewardTimer = 0; state.messageTimer = 0; state.themeStep = 0;
    state.biome = (experienceState.mission && experienceState.mission.biome) ? experienceState.mission.biome : "forest";
    state.cutscene = { active: false, timer: 0, duration: 4.0 };
    state.radiance = 0; state.nextDraftRadiance = 100; state.phase = 1; state.difficulty = 0;
    state.graceTime = 0; state.nearFailCooldown = 0; state.uiSilenced = false; 
    state.camera.y = 0; state.camera.shake.intensity = 0;
    state.runStats = { forestsAwakened: 0, birdsReturned: 0, windowsLit: 0, nearFails: 0, breakthroughs: 0, maxTimeAboveLine: 0, maxStabilityTime: 0, totalStabilityTime: 0 };
    state.feedbackLoops = { breathingWindow: 0, recoveryAssist: 1, lastNearFailTime: -999, lastRewardTime: -999 };
    state.worldResponse = { lightLevel: 0, warmthLevel: 0, awakeningLevel: 0, birdsLevel: 0, floraLevel: 0, auroraLevel: 0, memoryGain: 0, horizonBloomIntensity: 0, mountainGlowIntensity: 0 };
    state.emotionalState = { calm: 0, tension: 0, wonder: 0, hope: 0 };
    state.weather = { rainIntensity: 0 };
    state.dawnGoal = { active: true, thresholdY: H * 0.35, holdDuration: 3.2, holdProgress: 0, completed: false, justTriggered: false, visualIntensity: 0 };

    state.tutorial = { active: false, chapter: 1, step: 1, perfects: 0, delay: 0 };

    state.mods = { 
      liftMult: 1, energyRecMult: 1, stabGainMult: 1, entropyDrainMult: 1, shield: 0, areaSustain: false,
      pulseMult: 1, antiSpamReduc: 0, sparkMult: 1, ascendBonus: 0, cometStacks: 0, transcendActive: false,
      entropyGrowthMult: 1, graceTimeBonus: 0, phoenixRes: false, cycleActive: false, lunarActive: false, eternityRes: false,
      consecutivePulses: 0, gravityFactor: 1
    };
    state.draft = { radiance: 0, count: 0, pending: 0, thresholds: [10, 25, 45, 70], max: 4, lastAltitudeMilestone: 0, sustainTimer: 0 };
    
    state.input.lastClick = -999; state.input.lastPress = -999; state.input.lastEmptyPulse = -999; state.input.keyboardHold = false; state.input.holding = false; state.input.inside = false; state.input.x = W * .5; state.input.y = H * .42;
    state.entropy = .12;
    state.sun.x = W * .5; state.sun.y = H * .38; state.sun.vx = 0; state.sun.vy = 0; state.sun.stability = .22; state.sun.energy = .92; state.sun.wear = 0;
    state.sun.breath = 0;
    state.sun.breathStrength = .18;
    state.sun.errorTremor = 0;
    state.sun.glowFail = 0;
    state.sun.haloPulse = 0;
    state.sun.nearFail = false;
    state.sun.breakthrough = false;
    state.sun.mood = "serene";
    state.sun.stableTimer = 0;
    state.sun.flowTimer = 0;
    state.sun.impulseEfficiency = 1;
    state.sun.tapScale = 1;
    state.sun.continuousTimeAboveLine = 0;
    state.sun.continuousStabilityTime = 0;
    state.sky.dawn = .08;
    state.sky.aurora = 0;
    state.sky.silentSky = 0;
    state.sky.zone = "night";
    state.world.birds.length = 0;
    state.world.rare.length = 0;
    state.world.dust.length = 0;
    state.world.sparks.length = 0;
    state.world.pulses.length = 0;
    state.world.trail.length = 0;
    state.world.leaves.length = 0;
    if (ui.reward) ui.reward.classList.remove("show");
    if (ui.tutContainer) ui.tutContainer.classList.add("hidden");
    silenceHoldAudio();
    resetMissionRunState();
  }

  function updateMenuMeta() {
    state.worldLight = calculateWorldLight().percentage;
    if(ui.menuWorldLightFill) ui.menuWorldLightFill.style.width = `${state.worldLight}%`;
    const txt = document.getElementById("menuWorldLightText");
    if (txt) txt.textContent = `${Math.floor(state.worldLight)}% ${t('restored')}`;
    
    const sWl = document.getElementById("settingsWorldLightText");
    if (sWl) sWl.textContent = `${Math.floor(state.worldLight)}%`;

    const m = experienceState.mission;
    if (m) {
        const node = MAP_NODES.find(n => n.id === m.id);
        const eyebrow = document.querySelector('#menuScreen .eyebrow');
        if (eyebrow && node) {
            eyebrow.textContent = `${t('journey')}: ${t(node.title).toLowerCase()}`;
        }
    }
  }

  function addRadiance(amount) {
      if (state.draft.count + (state.draft.pending || 0) >= state.draft.max) return;
      state.draft.radiance += amount;
      
      let nextThreshold = state.draft.thresholds[state.draft.count + (state.draft.pending || 0)];
      
      while (nextThreshold && state.draft.radiance >= nextThreshold) {
          state.draft.radiance -= nextThreshold;
          state.draft.pending = (state.draft.pending || 0) + 1;
          
          // MICROINTERAÇÃO: Brilho épico mas contido e som
          const pendingBtn = document.getElementById("pendingDraftBtn");
          const pendingBadge = document.getElementById("pendingDraftBadge");
          if (pendingBtn) {
              pendingBtn.classList.remove('gain-glow'); void pendingBtn.offsetWidth; pendingBtn.classList.add('gain-glow');
          }
          if (pendingBadge) {
              pendingBadge.classList.remove('pop'); void pendingBadge.offsetWidth; pendingBadge.classList.add('pop');
          }
          emitAudioEvent('grace_gained');
          
          showFloating("a grace awaits", true);
          nextThreshold = state.draft.thresholds[state.draft.count + state.draft.pending];
      }

      const radFill = document.querySelector('.radiance-fill');
      if (radFill) {
          radFill.style.width = nextThreshold ? `${Math.min(100, (state.draft.radiance / nextThreshold) * 100)}%` : '100%';
      }
  }

  function startGame() {
    const fade = document.getElementById("fade");
    if(fade) fade.classList.add("active");

    setTimeout(() => {
      try {
        initAudio();
        resetRun();
        state.mode = "gameplay";
        ui.menu.classList.add("hidden");
        ui.pause.classList.add("hidden");
        if(ui.result) ui.result.classList.add("hidden");
        ui.draft.classList.add("hidden");
        
        if (!settings.tutorialDone) {
            startTutorial();
        } else {
            state.tutorial.active = false;
            if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
            const compScreen = document.getElementById('tutorialCompleteScreen');
            if (compScreen) compScreen.classList.add('hidden');
        }
      } catch(e) {
        console.error("Luma engine error:", e);
      } finally {
        if(fade) fade.classList.remove("active");
      }
    }, 1200);
  }
  function pauseGame() { if (state.mode !== "gameplay") return; state.mode = "paused"; ui.pause.classList.remove("hidden"); silenceHoldAudio(); }
  function resumeGame() { if (state.mode !== "paused") return; state.mode = "gameplay"; ui.pause.classList.add("hidden"); }
  function backToMenu() { 
    state.mode = "menu"; 
    ui.menu.classList.remove("hidden"); 
    ui.pause.classList.add("hidden"); 
    ui.harmony.classList.add("hidden");
    ui.memoriesScreen.classList.add("hidden");
    if(ui.result) ui.result.classList.add("hidden");
    ui.draft.classList.add("hidden"); 
    resetRun(); 
    updateMenuMeta(); 
  }

  function showMemories() {
    const wl = calculateWorldLight();
    
    // Estatísticas Principais
    const val = document.getElementById('altarLightValue');
    if (!val) return; // Segurança caso a UI carregue incompleta
    val.textContent = `${Math.floor(wl.percentage)}%`;
    document.getElementById('altarLightFill').style.width = `${wl.percentage}%`;
    document.getElementById('altarLightSphere').style.setProperty('--light-percent', wl.percentage);
    
    document.getElementById('altarStatSeals').innerHTML = `${wl.totalSeals}<span class="stat-max">/50</span>`;
    document.getElementById('altarStatBirds').innerHTML = `${wl.birds}<span class="stat-max">/500</span>`;
    const metersK = (wl.meters / 1000).toFixed(1);
    document.getElementById('altarStatMeters').innerHTML = `${metersK}k<span class="stat-max">/100k</span>`;

    // Selos
    const sealsGrid = document.getElementById('sealsGrid');
    sealsGrid.innerHTML = '';
    MAP_RAW_NODES.forEach(node => {
        const stats = mapProgress.nodeStats && mapProgress.nodeStats[node.id];
        if (stats && stats.main) {
            let stars = 1;
            if (stats.subs && stats.subs[0] && stats.subs[1]) stars = 2;
            if (stars === 2 && stats.perf) stars = 3;
            const starStr = stars === 3 ? '★★★' : stars === 2 ? '★★' : '★';
            const rareClass = stars === 3 ? 'rare' : '';
            sealsGrid.innerHTML += `
                <div class="seal-item ${rareClass}">
                    <div class="seal-icon">✧</div>
                    <div style="font-size:12px; color:var(--sun-core); margin-bottom:4px;">${starStr}</div>
                    <div class="seal-name">${node.title}</div>
                </div>
            `;
        }
    });
    if (sealsGrid.innerHTML === '') sealsGrid.innerHTML = `<div style="grid-column: 1 / -1; color: var(--ui-tertiary); font-size: 13px;">${t('no seals yet.')}</div>`;

    // Biomas
    const BIOMES = [
        { name: 'Meadow', t: 0, icon: '↟' }, { name: 'Hills', t: 0, icon: '◬' }, { name: 'Coast', t: 0, icon: '∿' },
        { name: 'Canyon', t: 10, icon: '◮' }, { name: 'Desert', t: 20, icon: '⏚' }, { name: 'Forest', t: 30, icon: '↟' },
        { name: 'Snow', t: 40, icon: '❅' }, { name: 'Storm', t: 50, icon: '☈' }, { name: 'Ruins', t: 60, icon: '⌂' },
        { name: 'Crystal', t: 70, icon: '⬡' }, { name: 'Nebula', t: 75, icon: '∾' }, { name: 'Cosmos', t: 80, icon: '✧' },
        { name: 'Aurora', t: 85, icon: '⤑' }, { name: 'Zenith', t: 90, icon: '☼' }
    ];
    const biomesGrid = document.getElementById('biomesGrid');
    biomesGrid.innerHTML = '';
    BIOMES.forEach(b => {
        const unlocked = wl.percentage >= b.t;
        const cls = unlocked ? 'unlocked' : 'locked';
        const check = unlocked ? '✓' : '·';
        biomesGrid.innerHTML += `
            <div class="biome-item ${cls}">
                <div class="biome-icon">${b.icon}</div>
                <div style="font-size:10px; margin-bottom:4px;">${check}</div>
                <div class="biome-name">${b.name}</div>
            </div>
        `;
    });

    ui.memoriesScreen.classList.remove("hidden");
  }

  function showResult(isNewRecord, isSuccess = false) {
    const result = document.getElementById("result");
    const text = document.getElementById("resultText");
    const statsText = document.getElementById("resultStats");
    const title = document.getElementById("resultTitle");
    const starsContainer = document.getElementById("resultStars");

    if (!result || !text || !statsText) return;

    result.classList.remove("hidden");
    text.innerText = "";
    statsText.innerText = "";
    if (starsContainer) starsContainer.innerHTML = "";

    // Avançar só é oferecido quando a missão foi de fato concluída.
    const nextBtn = document.getElementById("nextNodeBtn");
    if (nextBtn) nextBtn.classList.toggle("hidden", !isSuccess);

    // A derrota é dita com clareza, no tom do jogo: o jogador precisa saber que caiu e o que faltou.
    const lines = isSuccess ? [
        "the objective is complete",
        "the light remembers your path",
        "and the journey continues"
    ] : [
        "the sun slipped past the horizon",
        experienceState.mission ? `${t("the ritual asked")}: ${t(experienceState.mission.subtitle).toLowerCase()}` : t("the ritual is unfinished"),
        "hold longer, pulse with intention"
    ];

    if (title) title.innerText = isSuccess ? t("ritual completed") : t("the light fell");

    let i = 0;
    function reveal() {
        if (i < lines.length) {
        text.innerText += t(lines[i]) + "\n";
        i++;
        setTimeout(reveal, 1200);
        } else {
            // Preenche os dados da corrida quando a poesia terminar
            let statsString = `Altitude: ${Math.floor(state.scoreMeters)}m\nDawns Awakened: ${state.runDawns} | Max Combo: x${state.maxComboThisRun}`;
            if (isNewRecord) statsString = "✨ NEW RECORD ✨\n" + statsString;
            statsText.innerText = statsString;
            
            // Animação de Estrelas de Conclusão
            if (isSuccess && starsContainer && experienceState.mission) {
                const node = MAP_NODES.find(n => n.id === experienceState.mission.id);
                if (node) {
                    let stars = 1;
                    const sub1Done = evaluateLiveCondition(node.req.subs[0]);
                    const sub2Done = evaluateLiveCondition(node.req.subs[1]);
                    if (sub1Done && sub2Done) stars = 2;
                    // A mesma condição que o mapa credita, para que resultado e jornada nunca discordem.
                    if (stars === 2 && evaluateLiveCondition(node.req.perf)) stars = 3;
                    
                    let html = "";
                    for(let s=0; s<3; s++) {
                        const icon = s < stars ? "★" : "☆";
                        html += `<div class="result-star" id="star-${s}">${icon}</div>`;
                    }
                    starsContainer.innerHTML = html;
                    
                    // Efeito Cascata de Apresentação (Pop)
                    for(let s=0; s<3; s++) {
                        setTimeout(() => {
                            const st = document.getElementById(`star-${s}`);
                            if(st) { st.classList.add('show'); emitAudioEvent('grace_gained'); }
                        }, s * 400 + 200);
                    }
                }
            }

            setTimeout(() => {
                if (ui.resultActions) {
                    ui.resultActions.style.opacity = "1";
                    ui.resultActions.style.pointerEvents = "auto";
                }
            }, isSuccess ? 1800 : 800);
        }
    }
    setTimeout(reveal, 500);
  }

  function endRun(isSuccess = false) {
    state.mode = "result";
    if (!isSuccess) playCollapseSound();
    
    const isNewRecord = state.scoreMeters > state.bestMeters; // Verifica o recorde ANTES de sobrescrever
    state.totalMeters += Math.floor(state.scoreMeters); // Contribuição exata
    state.bestMeters = Math.max(state.bestMeters, state.scoreMeters);
    state.totalRunMemory.totalForests += state.runStats.forestsAwakened;
    state.totalRunMemory.totalBirds += state.runStats.birdsReturned;
    state.totalRunMemory.totalWindows += state.runStats.windowsLit;
    syncJourneyMap(isSuccess);
    updateMenuMeta(); // Já recalcula a Luz do Mundo por dentro
    saveProgress(); 

    analytics.track(EVENT_TYPES.RUN_END, {
        duration: state.runTime, altitude: state.scoreMeters, maxCombo: state.maxComboThisRun,
        birdsAwakened: state.runStats.birdsReturned, nearFails: state.runStats.nearFails, breakthroughs: state.runStats.breakthroughs
    });

    showResult(isNewRecord, isSuccess);

    if (ui.tutContainer) ui.tutContainer.classList.add("hidden"); silenceHoldAudio();
  }

  function completeMissionAndAdvance() {
    state.mode = "transition"; // Trava os inputs
    const fade = document.getElementById("fade");
    if (fade) {
        fade.style.background = "#FFF"; // Fade para o brilho puro em vez do preto normal
        fade.style.transition = "opacity 0.8s ease";
        fade.classList.add("active");
    }
    setTimeout(() => {
        endRun(true); // Termina com Sucesso, mudando a poesia para Vitória
        if (fade) {
            fade.classList.remove("active");
            setTimeout(() => { fade.style.background = "#000"; fade.style.transition = "opacity 1.2s ease"; }, 800);
        }
    }, 1000);
  }

  function enterDraft() {
    if (state.mode !== "gameplay") return;
    state.mode = "draft";
    
    const availableGraces = ALL_GRACES.filter(grace => {
      if (grace.type === 'one-shot') return !state.mods[grace.id];
      return !state.activeGraces.some(ag => ag.id === grace.id);
    });

    // rollRarity existia pronta e nunca era chamada: todas as graças tinham a mesma chance e
    // o campo `rarity` era decorativo. Agora subir mais alto e avançar nos drafts inclina o sorteio.
    const pool = [...availableGraces];
    const selectedGraces = [];
    while (selectedGraces.length < 3 && pool.length) {
      const wanted = rollRarity(state.scoreMeters, state.draft.count);
      let idx = pool.findIndex(g => g.rarity === wanted);
      if (idx === -1) idx = Math.floor(Math.random() * pool.length);
      selectedGraces.push(pool.splice(idx, 1)[0]);
    }


    for (let i = 0; i < 3; i++) {
      const card = document.getElementById(`draft-card-${i+1}`);
      if (selectedGraces[i]) {
        const grace = selectedGraces[i];
        card.style.display = 'block';
        card.querySelector('.draft-icon').textContent = grace.icon;
        card.querySelector('.draft-title').textContent = t(grace.title);
        card.querySelector('.draft-desc').textContent = t(grace.desc);
        card.querySelector('.draft-flavor').textContent = t(grace.flavor);
        card.dataset.graceId = grace.id;
      } else {
        card.style.display = 'none';
      }
    }
    
    ui.draft.classList.remove("hidden");
    silenceHoldAudio();
    playReward();
  }

  function selectUpgrade(graceId) {
    const grace = ALL_GRACES.find(g => g.id === graceId);
    if (!grace) return;

    grace.apply(state);
    state.activeGraces.push({ 
        id: grace.id, icon: grace.icon, title: grace.title, 
        duration: grace.duration || null, timeActive: 0,
        onRemove: grace.onRemove || null
    });
    
    state.draft.pending = Math.max(0, (state.draft.pending || 0) - 1);
    state.draft.count++;
    
    const nextThreshold = state.draft.thresholds[state.draft.count + state.draft.pending];
    const radFill = document.querySelector('.radiance-fill');
    if (radFill) {
        radFill.style.width = nextThreshold ? `${Math.min(100, (state.draft.radiance / nextThreshold) * 100)}%` : '100%';
    }

    state.mode = "gameplay";
    ui.draft.classList.add("hidden");
    
    showFloating(`${grace.title} adquirida`, true);
  }

  function updateActiveGraceUI(dt) {
    const container = document.getElementById('active-graces-ui');
    if (!container) return;
    
    let content = '';
    // Conta de trás pra frente para podermos remover itens expirados sem quebrar o loop
    for (let i = state.activeGraces.length - 1; i >= 0; i--) {
      const grace = state.activeGraces[i];
      let ringSVG = '';
      
      if (grace.duration) {
          grace.timeActive += dt;
          const pct = Math.max(0, 1 - (grace.timeActive / grace.duration));
          const dash = 113; // Circunferência para raio 18
          const offset = dash - (pct * dash);
          
          ringSVG = `
          <svg class="grace-timer" viewBox="0 0 42 42">
              <circle class="grace-timer-path" cx="21" cy="21" r="18" style="stroke-dasharray: ${dash}; stroke-dashoffset: ${offset};"></circle>
          </svg>`;
          
          if (grace.timeActive >= grace.duration) {
              if (grace.onRemove) grace.onRemove(state);
              state.activeGraces.splice(i, 1);
              continue; // Pula a renderização deste que acabou
          }
      }

      content += `
        <div class="grace-icon-active" title="${grace.title}">
          ${ringSVG}
          ${grace.icon}
        </div>
      `;
    }
    container.innerHTML = content;
  }

