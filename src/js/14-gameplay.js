  function updateDawnGoal(dt) {
    if (!state.dawnGoal.active) return;
    state.dawnGoal.justTriggered = false;
    const sunScreenY = state.sun.y + state.camera.y;
    const aboveLine = sunScreenY <= state.dawnGoal.thresholdY && !state.sun.nearFail;
    if (aboveLine) state.dawnGoal.holdProgress += dt;
    else state.dawnGoal.holdProgress = Math.max(0, state.dawnGoal.holdProgress - dt * .75);
    state.dawnGoal.visualIntensity = clamp(state.dawnGoal.holdProgress / state.dawnGoal.holdDuration, 0, 1);
    if (state.dawnGoal.holdProgress >= state.dawnGoal.holdDuration && !state.dawnGoal.completed) {
      state.dawnGoal.completed = true; state.dawnGoal.justTriggered = true; state.feedbackLoops.breathingWindow = Math.max(state.feedbackLoops.breathingWindow, 2.8);
      state.runStats.forestsAwakened += 1; state.runDawns += 1; state.dawnsAwakened += 1;
      showReward("dawn awakened"); showFloating("the world wakes", true); spawnBirdRing(); playDawnAwakened();
    }
    if (sunScreenY > state.dawnGoal.thresholdY + 60) state.dawnGoal.completed = false;
  }

  function updateWorldResponse(dt) {
    const altitude01 = clamp(state.scoreMeters / 1800, 0, 1);
    const combo01 = clamp(state.combo / 5, 0, 1);
    const dawn01 = state.dawnGoal.visualIntensity;
    const memoryBoost = clamp(state.totalMeters / 10000, 0, 0.2);
    
    const targetLight = memoryBoost + altitude01 * .55 + dawn01 * .45;
    const targetWarmth = memoryBoost + altitude01 * .4 + combo01 * .25 + dawn01 * .35;
    const targetAwakening = memoryBoost + altitude01 * .35 + combo01 * .25 + dawn01 * .4;
    const targetBirds = clamp((state.scoreMeters - 300) / 900, 0, 1) * clamp(combo01 / .8, 0, 1);
    const targetAurora = dawn01 > .6 ? clamp((dawn01 - .6) / .4, 0, 1) : 0;
    const targetFlora = altitude01 * .4 + combo01 * .1 + dawn01 * .5;

    state.worldResponse.lightLevel = lerp(state.worldResponse.lightLevel, targetLight, dt * 1.5);
    state.worldResponse.warmthLevel = lerp(state.worldResponse.warmthLevel, targetWarmth, dt * 1.4);
    state.worldResponse.awakeningLevel = lerp(state.worldResponse.awakeningLevel, targetAwakening, dt * 1.25);
    state.worldResponse.birdsLevel = lerp(state.worldResponse.birdsLevel, targetBirds, dt * 1.2);
    state.worldResponse.floraLevel = lerp(state.worldResponse.floraLevel, targetFlora, dt * 1.1);
    state.worldResponse.auroraLevel = lerp(state.worldResponse.auroraLevel, targetAurora, dt * .8);
    state.worldResponse.horizonBloomIntensity = lerp(state.worldResponse.horizonBloomIntensity, clamp(targetWarmth * 1.2, 0, 1), dt * 1.8);
    state.worldResponse.mountainGlowIntensity = lerp(state.worldResponse.mountainGlowIntensity, targetWarmth * .8, dt * 1.2);

    if (state.worldResponse.awakeningLevel > 0.5) {
      state.runStats.windowsLit += dt * 2;
    }
    if (state.worldResponse.floraLevel > 0.4) {
      state.runStats.forestsAwakened += dt;
    }
    
    if (state.sun.nearFail) {
      state.worldResponse.warmthLevel *= .995;
      state.worldResponse.auroraLevel *= .985;
      state.worldResponse.horizonBloomIntensity *= .99;
    }
  }

  function updateReactiveVisuals(dt) {
    const altitude01 = Math.max(0, Math.min(1, state.scoreMeters / 1800));
    const combo01 = Math.max(0, Math.min(1, state.combo / 6));
    const progress01 = experienceState.missionProgress;
    const danger01 = state.sun.nearFail ? Math.max(.45, state.entropy) : state.entropy * 0.45;
    const breakthrough01 = state.sun.breakthrough ? 1 : 0;

    experienceState.reactive.piano += ((0.18 + state.sun.stability * 0.42) - experienceState.reactive.piano) * dt * 5.0;
    experienceState.reactive.harmony += ((0.08 + altitude01 * 0.52 + progress01 * 0.20) - experienceState.reactive.harmony) * dt * 3.4;
    experienceState.reactive.melody += ((0.06 + progress01 * 0.46 + combo01 * 0.24) - experienceState.reactive.melody) * dt * 3.2;
    experienceState.reactive.sparkle += ((0.08 + combo01 * 0.64) - experienceState.reactive.sparkle) * dt * 6.0;
    experienceState.reactive.choir += (((breakthrough01 * 0.64) + (experienceState.missionCompleted ? 0.18 : 0)) - experienceState.reactive.choir) * dt * 2.5;
    experienceState.reactive.tension += ((danger01 * 0.85) - experienceState.reactive.tension) * dt * 6.5;

    experienceState.reactive.haloScale = 1 + experienceState.reactive.piano * 0.10;
    experienceState.reactive.haloBrightness = 0.20 + experienceState.reactive.piano * 0.38 + experienceState.reactive.sparkle * 0.10;
    experienceState.reactive.horizonBloom = 0.05 + experienceState.reactive.harmony * 0.44 + experienceState.reactive.choir * 0.16;
    experienceState.reactive.particleBoost = experienceState.reactive.sparkle * 0.80;
    experienceState.reactive.auroraBoost = experienceState.reactive.choir * 0.46 + experienceState.reactive.melody * 0.10;
    experienceState.reactive.dangerVignette = experienceState.reactive.tension * 0.38;
    experienceState.reactive.saturationDrop = experienceState.reactive.tension * 0.18;
  }

  function updateGameplay(dt) {
    const signals = getSignals();
    state.emotion.update(signals, dt);
    updateActiveGraceUI(dt);

    // Blindagem Matemática Absoluta (Impede NaN crashe de corromper a física)
    if (isNaN(state.sun.vy)) state.sun.vy = 0;
    if (isNaN(state.sun.vx)) state.sun.vx = 0;
    if (isNaN(state.sun.y)) state.sun.y = H * 0.38;
    
    state.runTime += dt;
    updateTutorialLogic(dt);
    state.feedbackLoops.breathingWindow = Math.max(0, state.feedbackLoops.breathingWindow - dt);
    state.feedbackLoops.recoveryAssist = lerp(state.feedbackLoops.recoveryAssist, 1, dt * 3);
    state.sun.impulseEfficiency = lerp(state.sun.impulseEfficiency, 1, dt * 5);

    state.sun.errorTremor = lerp(state.sun.errorTremor, 0, dt * 15);
    state.sun.glowFail = lerp(state.sun.glowFail, 0, dt * 12);

    // --- SISTEMA BIOLÓGICO: RESPIRAÇÃO v2.0 ---
    // A pulsação do sol é o metrônomo da respiração do jogador, então ela DESACELERA
    // conforme ele acerta: 1,26 rad/s ≈ 5s por ciclo, o tempo de um gesto inteiro.
    // Antes acelerava com o combo, o que premiava o acerto fazendo respirar mais rápido —
    // o oposto do efeito que o jogo busca.
    let breathFreq = 1.5;
    let breathAmp = 0.04;
    if (state.sun.stability > 0.7) { breathAmp *= 1.5; breathFreq *= 0.9; }
    if (state.combo > 0) { breathFreq *= 0.84; }
    // Prender a respiração aperta e acelera: a tensão é visível antes de ser explicada.
    if (state.sun.strain > 0) {
      breathFreq *= 1 + state.sun.strain * 1.6;
      breathAmp *= 1 - state.sun.strain * 0.6;
    }

    state.sun.breath += dt * breathFreq;
    state.sun.breathStrength = breathAmp;

    let maxEnergy = maxBreath();

    let newPhase = 1,
        phaseName = "Phase I: Awakening";
    state.difficulty = clamp((state.scoreMeters - 120) / (1800 - 120), 0, 1);
    if (state.difficulty > .8) {
      newPhase = 4;
      phaseName = "Phase IV: Eternity";
    } else if (state.difficulty > .5) {
      newPhase = 3;
      phaseName = "Phase III: Harmony";
    } else if (state.difficulty > .2) {
      newPhase = 2;
      phaseName = "Phase II: Ascent";
    }
    if (newPhase > state.phase) {
      state.phase = newPhase;
      triggerScreenFlash('rgba(255,249,236,0.7)'); 
      triggerCameraShake(1.8); 
    }
    
    let targetCamY = (H * .45) - state.sun.y;
    targetCamY = Math.max(0, targetCamY);
    state.camera.y += (targetCamY - state.camera.y) * dt * 2.5;

    // O teclado não mira: enquanto a tecla estiver pressionada, o ponto de contato acompanha o sol.
    if (state.input.keyboardHold) {
      state.input.x = state.sun.x;
      state.input.y = state.sun.y + state.camera.y;
    }

    let holdIntensity = 0;
    if (state.input.holding && state.input.inside) {
      {
        // TOQUE EM QUALQUER LUGAR DA TELA.
        // Mirar é uma perícia espacial sem relação com respirar, e o sol deriva com o
        // vento: exigir proximidade obrigava o jogador a PERSEGUIR um alvo móvel com o
        // dedo, que é o oposto de relaxar. Além disso a zona "perfeita" tinha raio de
        // 21px, menor que a ponta de um dedo. A perícia do LUMA é julgar duração; o
        // espaço só disputava atenção com ela.
        const influence = 1;
        // A tensão mata a sustentação. Sem isto, segurar para sempre seria a estratégia
        // ótima e o ciclo não fecharia: o jogo precisa que soltar seja necessário, não
        // apenas recomendado. É o que transforma o gesto numa duração com fim.
        const lift = sustainConfig.liftForce * state.mods.liftMult * influence
                   * state.emotion.runtime.physics.assistMul * (1 - state.sun.strain * 0.6);
        state.sun.vy -= lift * dt;
        state.sun.stability = clamp(state.sun.stability + sustainConfig.stabilityGain * state.mods.stabGainMult * influence * dt, 0, 1);
        state.sun.energy = clamp(state.sun.energy + sustainConfig.energyRecovery * state.mods.energyRecMult * influence * dt, 0, maxEnergy);
        holdIntensity = influence;

        // Inspirou até encher e continuou segurando: a partir daqui tensiona, não acumula.
        // É o que dá ao gesto um fim — e é o que transforma "segurar" numa duração a julgar
        // em vez de um botão a manter apertado.
        if (state.sun.energy >= maxEnergy - 0.001) {
          state.sun.strain = Math.min(1, state.sun.strain + dt / (breathConfig.strainTime * state.mods.janelaMult));
          state.sun.stability = clamp(
            state.sun.stability - breathConfig.strainStabilityDrain * state.sun.strain * dt, 0, 1);
        }
        // "Estar em fluxo" media POSICAO: exigia influence > .74, ou seja, o dedo perto do
        // nucleo. Com o toque valendo em qualquer lugar a influencia e sempre 1, entao o
        // contador passou a subir sozinho — 2 a 4 aves a cada 1,4s e um aviso na tela na
        // mesma cadencia. As missoes de aves viraram tramite e a tela virou barulho.
        // Fluxo agora mede o que de fato sobrou de pericia: respirar sem prender.
        if (state.sun.strain < 0.25) state.sun.stableTimer += dt;
        else state.sun.stableTimer = Math.max(0, state.sun.stableTimer - dt * 1.4);
        
        state.draft.sustainTimer += dt;
        if (state.draft.sustainTimer >= 5) {
            addRadiance(1);
            state.draft.sustainTimer -= 5;
        }
        
        if (Math.random() < .16) spawnDust(state.sun.x, state.sun.y, 1);
      }
    } else {
      state.sun.stability = clamp(state.sun.stability - .08 * dt, 0, 1);
      state.sun.stableTimer = Math.max(0, state.sun.stableTimer - dt * 1.3);
    }

    // Fora do ponto cheio — soltando, ou ainda enchendo — a tensão cede sozinha.
    if (!(state.input.holding && state.input.inside && state.sun.energy >= maxEnergy - 0.001)) {
      state.sun.strain = Math.max(0, state.sun.strain - dt / breathConfig.strainRelease);
    }

    if (state.sun.stableTimer > 2.2) {
      state.sun.flowTimer += dt;
      // Uma revoada por respiracao, nao a cada 1,4s: o premio tem que custar um ciclo
      // inteiro para significar alguma coisa.
      if (state.sun.flowTimer > 3.6) {
        state.sun.flowTimer = 0;
        spawnBirdRing();
        // O aviso so aparece ao ENTRAR em fluxo. Repeti-lo a cada revoada transformava
        // uma recompensa em ruido, e ruido no centro da tela e o oposto do que o jogo quer.
        if (!state.sun.emFluxo) { state.sun.emFluxo = true; showReward("THE SKY RESPONDS"); }
      }
    } else {
      state.sun.flowTimer = Math.max(0, state.sun.flowTimer - dt * 2);
      if (state.sun.stableTimer < 0.8) state.sun.emFluxo = false;
    }

    // --- MOTOR DE ENTROPIA v2.0 ---
    if (!state.tutorial.active || state.tutorial.chapter >= 3) {
        const isRising = state.sun.vy < 0;
        let diffMod = settings.gameplay.difficulty === 'easy' ? 0.8 : (settings.gameplay.difficulty === 'hard' ? 1.3 : 1);
        let entropyGrowth = (isRising ? 0.06 : 0.12) * state.emotion.runtime.physics.entropyMul * diffMod;
        entropyGrowth *= state.mods.entropyGrowthMult;
        if (holdIntensity > 0) entropyGrowth *= state.mods.entropyDrainMult; // Raízes de luz reduz entropia enquanto segura
        
        state.entropy += entropyGrowth * dt;
        if (state.sun.breakthrough) state.entropy *= 0.3; // Breakthrough limpa o cansaço
        state.entropy = clamp(state.entropy, 0, 1);
    }

    setHoldAudio(holdIntensity, state.sun.stability, state.sun.breakthrough);

    let diffMod = settings.gameplay.difficulty === 'easy' ? 0.8 : (settings.gameplay.difficulty === 'hard' ? 1.15 : 1);
    const currentGravity = getCurrentGravity(state.difficulty, state.entropy) * state.emotion.runtime.physics.gravityMul * state.mods.gravityFactor * diffMod;
    let gravityMod = state.feedbackLoops.breathingWindow > 0 ? .84 : 1;
    if (state.tutorial.active && state.tutorial.chapter === 1) gravityMod *= 0.5; // Gravidade lunar para aprender a sustentar
    
    state.sun.vy += (currentGravity * gravityMod) * dt;
    state.sun.vy = Math.min(state.sun.vy, tune.maxFall);
    state.sun.vy *= Math.pow(tune.damping, dt * 60);
    state.sun.y += state.sun.vy * dt;

    // O vento já estava escrito em cada estado emocional (windMul) e nunca era aplicado.
    // Ele é lento e ondulado de propósito: dá para antecipar, então sustentar vira rastrear
    // o sol em vez de repousar o dedo sobre ele. O tutorial inicial fica abrigado.
    if (!state.tutorial.active || state.tutorial.chapter >= 3) {
      const gust = (Math.sin(state.t * 0.37) + 0.5 * Math.sin(state.t * 0.83 + 1.7)) / 1.5;
      state.sun.vx += gust * tune.windForce * state.emotion.runtime.physics.windMul * dt;
    }

    state.sun.x += state.sun.vx * dt;
    state.sun.vx *= Math.pow(.9, dt * 60);

    // --- DESGASTE TÉRMICO (WEAR) APLICADO À FÍSICA v2.0 ---
    if (state.sun.wear > 0.3) {
      const wearEffect = state.sun.wear * 15; // Tremor violento
      state.sun.vx += (Math.random() - 0.5) * wearEffect * dt;
      state.sun.vy += (Math.random() - 0.5) * wearEffect * dt;
    }

    state.sun.x = clamp(state.sun.x, W * .1, W * .9);

    // --- CÁLCULO CORRETO DE ALTITUDE (BASEADO NA SUBIDA DA CÂMERA E DO SOL) ---
    const startY = H * 0.38;
    const pixelsAboveStart = Math.max(0, startY - state.sun.y);
    const METERS_PER_PIXEL = 0.07; // Reescalado junto com o tempo respiratório: ver tools/sim-breath.cjs
    state.scoreMeters = Math.max(state.scoreMeters, Math.floor(pixelsAboveStart * METERS_PER_PIXEL));
    
    const altNorm = clamp(state.scoreMeters / 3000, 0, 1);

    const isHighPerformance = state.sun.stability > 0.8 && state.sun.energy > 0.7;
    if (altNorm > 0.7 && isHighPerformance) {
      state.sun.wear = clamp(state.sun.wear + (dt * 0.05), 0, 1.0); // Wear growth
    } else {
      state.sun.wear *= 0.95; // Decai lentamente
    }
    maxEnergy = maxBreath();

    // DYNAMIC WEATHER: Frente fria se o sol cair
    let targetRain = 0;
    if (state.biome === 'storm') {
        const sunScreenY = state.sun.y + state.camera.y;
        targetRain = clamp((sunScreenY - (state.dawnGoal.thresholdY - 30)) / 60, 0, 1);
    }
    state.weather.rainIntensity = lerp(state.weather.rainIntensity || 0, targetRain, dt * 1.5);

    const sunScreenY = state.sun.y + state.camera.y;
    if (sunScreenY <= state.dawnGoal.thresholdY && !state.sun.nearFail) {
        state.sun.continuousTimeAboveLine += dt;
        state.runStats.maxTimeAboveLine = Math.max(state.runStats.maxTimeAboveLine, state.sun.continuousTimeAboveLine);
    } else {
        // Decai em vez de zerar, como o stableTimer e a métrica de precisão. Com o vento
        // empurrando o sol, exigir 50s ininterruptos acima da linha era inalcançável.
        state.sun.continuousTimeAboveLine = Math.max(0, state.sun.continuousTimeAboveLine - dt * 1.4);
    }

    // Precisão é contato: tempo contínuo com o dedo dentro da zona forte do sol, fora de perigo.
    // Antes media state.sun.stability, que todo toque recarrega em +0.09 — bastava tocar muito.
    if (holdIntensity > 0.74 && !state.sun.nearFail) {
        state.sun.continuousStabilityTime += dt;
        state.runStats.totalStabilityTime += dt;
        state.runStats.maxStabilityTime = Math.max(state.runStats.maxStabilityTime || 0, state.sun.continuousStabilityTime);
    } else {
        // Decai em vez de zerar, como o stableTimer já faz: um escorregão não apaga a corrida inteira.
        state.sun.continuousStabilityTime = Math.max(0, state.sun.continuousStabilityTime - dt * 1.4);
    }

    // Radiance by Altitude
    if (state.scoreMeters - state.draft.lastAltitudeMilestone >= 100) {
        addRadiance(1);
        state.draft.lastAltitudeMilestone += 100;
    }

    const prevZone = state.sky.zone;
    if (state.scoreMeters < 300) state.sky.zone = "night";
    else if (state.scoreMeters < 700) state.sky.zone = "first_glow";
    else if (state.scoreMeters < 1200) state.sky.zone = "living_sky";
    else if (state.scoreMeters < 1500) state.sky.zone = "wind_realm";
    else state.sky.zone = "dawn_sea";
    if (prevZone !== state.sky.zone && state.runTime > 2) {
      const label = state.sky.zone === "first_glow" ? "FIRST GLOW" : state.sky.zone === "living_sky" ? "LIVING SKY" : state.sky.zone === "wind_realm" ? "WIND REALM" : "DAWN SEA";
      showReward(label);
    }

    // PACTO DE ENGENHARIA: Histerese Absoluta. Trava o estado para o sol não "piscar" na beirada e enlouquecer os filtros do áudio.
    if (!state.sun.nearFail) {
      if (state.sun.y > HORIZON_Y - tune.nearFailBand) state.sun.nearFail = true;
    } else {
      if (state.sun.y < HORIZON_Y - tune.nearFailBand - 25) state.sun.nearFail = false;
    }
    
    const wasBreakthrough = state.sun.breakthrough;
    state.sun.breakthrough = state.scoreMeters > 400 && state.sun.stability > .85 && state.entropy < .20;
    if (!wasBreakthrough && state.sun.breakthrough) { 
        state.runStats.breakthroughs++; 
        addRadiance(5); // Recompensa massiva
        if (state.mods.cycleActive) state.sun.energy = clamp(state.sun.energy + 0.5, 0, 1);
        emitAudioEvent('breakthrough'); 
        
        // --- GERAÇÃO DE ONDA DE CHOQUE (BREAKTHROUGH BURST) ---
        spawnBirdRing();
        analytics.track(EVENT_TYPES.BREAKTHROUGH, { altitude: state.scoreMeters, combo: state.combo });
    }

    if (state.sun.nearFail && state.nearFailCooldown <= 0) {
      // Mantle of Warmth (Shield Intercept)
      if (state.mods.shield > 0) {
          state.mods.shield--;
          state.sun.nearFail = false;
          state.sun.vy = -400; // Impulso massivo pra cima
          spawnSpark(state.sun.x, state.sun.y, false, 20);
          showFloating("the shelter broke", true);
      } else {
          let baseGrace = settings.gameplay.difficulty === 'easy' ? 0.30 : (settings.gameplay.difficulty === 'hard' ? 0.18 : 0.22);
          state.graceTime = baseGrace + state.mods.graceTimeBonus;
          state.nearFailCooldown = 9.0;
          state.feedbackLoops.lastNearFailTime = state.t;
          state.feedbackLoops.recoveryAssist = 1.08;
          state.runStats.nearFails++;
          triggerCameraShake(0.4);
          if (navigator.vibrate && settings.haptics) navigator.vibrate([20, 30, 20]); 
          analytics.track(EVENT_TYPES.NEAR_FAIL, { survived: true, altitude: state.scoreMeters, graceTime: state.graceTime });
      }
    } else if (state.sun.nearFail) {
      triggerCameraShake(0.15);
    }
    state.nearFailCooldown = Math.max(0, state.nearFailCooldown - dt);
    state.graceTime = Math.max(0, state.graceTime - dt);

    updateDawnGoal(dt);
    updateWorldResponse(dt);
    updateMissionLogic(dt, {
      sunScreenY: sunScreenY,
      dawnLineY: state.dawnGoal.thresholdY,
      nearFail: state.sun.nearFail,
      scoreMeters: state.scoreMeters,
      runTime: state.runTime,
      combo: state.combo,
      stability: state.sun.stability
    });
    updateReactiveVisuals(dt);

    if (state.sun.nearFail) {
      if (!state.mods.lunarActive) state.sun.stability = clamp(state.sun.stability - .18 * dt, 0, 1);
      state.sun.mood = "risk";
    } else {
      if (state.sun.stability > .72) {
        state.sun.mood = "thriving";
      } else if (state.sun.energy < 0.48) state.sun.mood = "tired";
      else {
        state.sun.mood = "serene";
      }
    }

    if (state.tutorial.active && state.tutorial.chapter === 1) {
        state.sun.energy = 1.0;
    } else {
        state.sun.energy = clamp(state.sun.energy + .05 * dt, 0, maxEnergy);
    }

    const altitude01 = clamp(state.scoreMeters / 1800, 0, 1);
    const combo01 = clamp(state.combo / 5, 0, 1);
    const breath01 = state.feedbackLoops.breathingWindow > 0 ? 1 : 0;
    const danger01 = clamp(remap(state.sun.y, HORIZON_Y - tune.nearFailBand, HORIZON_Y + 10, 0, 1), 0, 1);
    state.emotionalState.calm = clamp(.7 * breath01 + .3 * (1 - danger01), 0, 1);
    state.emotionalState.tension = clamp(danger01 + (state.difficulty > .6 ? .3 : 0), 0, 1);
    state.emotionalState.wonder = clamp(altitude01 * .5 + combo01 * .5, 0, 1);
    state.emotionalState.hope = clamp(altitude01 * .6 + breath01 * .4 + (state.dawnGoal.completed ? .4 : 0), 0, 1);

    const timeProgress = experienceState.missionDuration > 0 ? experienceState.missionTimeLeft / experienceState.missionDuration : 1;
    const timeDarken = (1 - timeProgress) * 0.15; // Escurece até 15% no final do timer
    state.sky.dawn = lerp(state.sky.dawn, clamp(.45 * altNorm + .55 * state.worldResponse.lightLevel - timeDarken, 0, 1), dt * 1.3);
    state.sky.aurora = lerp(state.sky.aurora, Math.max(state.worldResponse.auroraLevel * .46, state.dawnGoal.completed ? .42 : (state.emotionalState.wonder > .5 ? .15 : 0)), dt * 1.6);
    state.sky.silentSky = lerp(state.sky.silentSky, (state.feedbackLoops.breathingWindow > 0 && !state.sun.nearFail) ? .18 : 0, dt * .8);

    if (state.combo > 0 && state.sun.flowTimer <= 0) state.combo = Math.max(0, state.combo - dt * .8);

    if (state.rewardTimer > 0) {
      state.rewardTimer -= dt;
      if (state.rewardTimer <= 0) ui.reward.classList.remove("show");
    }

    for (const d of state.world.ambientDust) {
        // --- COMPORTAMENTOS FÍSICOS BIOMA-ESPECÍFICOS ---
        if (state.biome === 'snow' || state.biome === 'hills') {
            d.y += (Math.abs(d.vy) * 0.8 + 2.0) * dt; // Flocos caindo
            d.x += Math.sin(state.t * 1.5 + d.phase) * 20 * dt; // Balanço suave
        } else if (state.biome === 'desert' || state.biome === 'canyon') {
            d.x += (Math.abs(d.vy) * 8 + 60) * dt; // Areia horizontal rápida
            d.y += d.vy * 0.2 * dt;
        } else if (state.biome === 'forest' || state.biome === 'swamp') {
            d.x += Math.cos(state.t * 2 + d.phase) * 25 * dt; // Vagalumes erráticos
            d.y += Math.sin(state.t * 1.8 + d.phase) * 25 * dt - 10 * dt;
        } else if (state.biome === 'meadow') {
            d.y -= (Math.abs(d.vy) * 0.5 + 8) * dt; // Pólen ascendente lento
            d.x += Math.sin(state.t * 1.2 + d.phase) * 12 * dt;
        } else if (state.biome === 'zenith' || state.biome === 'crystal' || state.biome === 'aether') {
            d.y -= (Math.abs(d.vy) * 2.5 + 25) * dt; // Luz ascendente
            d.x += Math.sin(state.t * 2 + d.phase) * 6 * dt;
        } else {
            d.x += d.vx * dt + Math.sin(state.t * 0.4 + d.phase) * 4 * dt;
            d.y += d.vy * dt;
        }
        
        const camY = state.camera.y * 0.4;
        if (d.y + camY < -50) d.y = H - camY + 50;
        else if (d.y + camY > H + 50) d.y = -camY - 50;
        if (d.x < -50) d.x = W + 50;
        else if (d.x > W + 50) d.x = -50;
    }
    
    for (const c of state.world.clouds) {
        c.x += c.speed * dt;
        if (c.x > W + 150) c.x = -150;
        else if (c.x < -150) c.x = W + 150;
        
        // Envolve as nuvens verticalmente em parallax contínuo com a altitude
        const parallax = c.layer === 'back' ? 0.3 : 0.6;
        const screenY = c.y + state.camera.y * parallax;
        if (screenY > H + 150) {
            c.y -= (H + 300) / parallax;
            c.x = rand(-50, W + 50);
        } else if (screenY < -150) {
            c.y += (H + 300) / parallax;
            c.x = rand(-50, W + 50);
        }
    }

    if (state.biome === 'storm') {
        for (let r of state.world.rain) {
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            if (r.y > H + 50) {
                r.y = rand(-100, -50);
                r.x = rand(-50, W + 50);
            }
        }
    }

    updateParticles(dt);
    updateBirds(dt);
    updateRare(dt);
    maybeSpawnRare();
    
    // Relâmpagos Visuais (Storm)
    if (state.biome === 'storm' && Math.random() < 0.005 * dt * 60) {
        triggerScreenFlash('rgba(255, 249, 236, 0.4)'); // Clarão repentino
    }
    
    // Chuva de Comets para Cosmos e Nebulosas
    if ((state.biome === 'cosmos' || state.biome === 'nebula') && Math.random() < 0.015) {
        state.world.rare.push({
            x: rand(-100, W), 
            y: rand(-H*0.5, H*0.5) - state.camera.y * 0.8, 
            vx: rand(400, 800), 
            vy: rand(150, 400), 
            size: rand(1.5, 3.5), 
            life: rand(1.5, 3), 
            isComet: true 
        });
    }
    
    // --- Progression Tracking (Exclusive per Biome) ---
    if (state.biome === 'city' || state.biome === 'storm' || state.biome === 'cyber') {
        if (state.worldResponse.awakeningLevel > 0.5) state.runStats.windowsLit += dt * 2;
    } else if (['forest', 'snow', 'autumn', 'sakura', 'swamp'].includes(state.biome)) {
        if (state.worldResponse.floraLevel > 0.4) state.runStats.forestsAwakened += dt;
    }

    let leafChance = (state.biome === 'sakura' || state.biome === 'autumn') ? 0.15 : (['forest', 'meadow'].includes(state.biome) ? 0.05 : 0.01);
    if (state.sky.zone !== "night" && state.sun.stability > .65 && Math.random() < leafChance) state.world.leaves.push({
      x: rand(-20, W + 20),
      y: H + 50 + state.camera.y * 1.2,
      vx: rand(-12, 12),
      vy: rand(-45, -75),
      size: rand(2.5, 4.5),
      angle: rand(0, Math.PI * 2),
      spin: rand(-2, 2),
      life: 1
    });

    if (state.sun.y >= HORIZON_Y + 6) {
      if (state.graceTime > 0) {
        state.sun.vy = -180;
        state.sun.y = HORIZON_Y - 5;
        state.graceTime = 0;
        showFloating("resilience", true);
      } else if (state.mods.phoenixRes) {
        state.mods.phoenixRes = false;
        state.sun.energy = 0.3;
        state.sun.vy = -600;
        showFloating("phoenix reborn", true);
      } else if (state.mods.eternityRes) {
        state.mods.eternityRes = false;
        state.sun.energy = 0.2;
        state.sun.stability = 0.5;
        state.sun.vy = -800;
        showFloating("eternity holds you", true);
      } else {
        state.sun.y = HORIZON_Y + 6;
        endRun(false);
      }
    }

    updateHUD();
  }

  function updateParticles(dt) {
    for (let i = state.world.leaves.length - 1; i >= 0; i--) {
      const l = state.world.leaves[i];
      l.x += l.vx * dt + Math.sin(state.t * 1.5 + l.life) * 15 * dt;
      l.y += l.vy * dt;
      l.angle += l.spin * dt;
      if (l.y + state.camera.y * 0.5 < -50) state.world.leaves.splice(i, 1);
    }
    for (let i = state.world.pulses.length - 1; i >= 0; i--) {
      const p = state.world.pulses[i];
      p.r = lerp(p.r, p.max, dt * 8);
      p.a *= Math.pow(.01, dt); // Fade ultra rápido para ser apenas feedback tátil
      if (p.a < .01) state.world.pulses.splice(i, 1);
    }
    for (let i = state.world.sparks.length - 1; i >= 0; i--) {
      const s = state.world.sparks[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 32 * dt;
      s.a *= Math.pow(.2, dt);
      if (s.life <= 0) state.world.sparks.splice(i, 1);
    }
    for (let i = state.world.dust.length - 1; i >= 0; i--) {
      const d = state.world.dust[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.a *= Math.pow(.35, dt);
      if (d.life <= 0) state.world.dust.splice(i, 1);
    }
  }
  function updateBirds(dt) {
    for (let i = state.world.birds.length - 1; i >= 0; i--) {
      const b = state.world.birds[i];
      
      let decay = 1;
      if (state.sun.vy > 250 || state.sun.nearFail) decay = 4; // Dispersão de emergência na queda rápida
      
      b.life -= dt * decay;
      b.angle += b.speed * dt;
      if (b.life <= 0) state.world.birds.splice(i, 1);
    }
  }
  function updateRare(dt) {
    for (let i = state.world.rare.length - 1; i >= 0; i--) {
      const r = state.world.rare[i];
      
      if (r.type === 'butterfly') {
          r.x += r.vx * dt;
          r.y += Math.sin(state.t * 4 + r.phase) * 30 * dt; // Voo ondulado
      } else if (r.type === 'angel') {
          r.x += r.vx * dt;
          r.y += r.vy * dt + Math.sin(state.t * 2 + r.phase) * 10 * dt; // Ascension divina
      } else {
          r.x += r.vx * dt;
          r.y += r.vy * dt;
      }
      
      r.life -= dt;
      if (r.life <= 0 || r.x > W + 60) state.world.rare.splice(i, 1);
    }
  }

  function updateHUD() {
    const altitude = document.getElementById('altitudeDisplay');
    if (altitude) {
      altitude.textContent = `${Math.floor(state.scoreMeters)}m`;
    }

    let hideAll = false;
    if (state.cutscene && state.cutscene.active) {
        const p = 1 - (state.cutscene.timer / state.cutscene.duration);
        if (p > 0.05 && p < 0.8) hideAll = true;
    }
    
    const iconsOpacity = state.emotion.runtime.ui.iconsOpacity;

    const topActions = document.getElementById('topActions');
    if (topActions) topActions.style.opacity = hideAll ? "0" : iconsOpacity;

    // FOCUS MODE: Fades out UI when player reaches Flow State
    let focusAlpha = 1.0;
    if (state.sun.breakthrough) focusAlpha = 0.0;
    else if (state.sun.nearFail) focusAlpha = 0.1;
    else if (state.combo >= 6) focusAlpha = 0.15;
    else if (state.combo >= 3) focusAlpha = 1.0 - ((state.combo - 3) / 3) * 0.85;

    // PENDING DRAFT UI UPDATE
    const pendingBtn = document.getElementById("pendingDraftBtn");
    const pendingBadge = document.getElementById("pendingDraftBadge");
    if (pendingBtn && pendingBadge) {
        if (state.draft && state.draft.pending > 0 && (state.mode === 'gameplay' || state.mode === 'paused')) {
            pendingBtn.classList.remove('hidden-ui');
            pendingBtn.style.opacity = hideAll ? '0' : focusAlpha.toString();
            pendingBadge.textContent = state.draft.pending;
        } else {
            pendingBtn.classList.add('hidden-ui');
        }
    }

    // Update Live Mission Tracker
    if (ui.tracker && state.mode !== 'map' && state.mode !== 'menu') {
        // Durante o tutorial o painel de ensino ocupa esse mesmo canto, e os objetivos da
        // missão são ruído para quem ainda está aprendendo os verbos do jogo.
        if (isTutorialActive()) {
            ui.tracker.classList.add('hidden');
        } else if (state.mode === 'gameplay' || state.mode === 'paused') {
            ui.tracker.classList.remove('hidden');
            ui.tracker.style.opacity = hideAll ? '0' : focusAlpha.toString();

            const m = experienceState.mission;
            const node = experienceState.node; // resolvido na troca de missão, não a cada frame
            if (node) {
                ui.tTitle.textContent = t(node.title).toLowerCase();
                
                // O objetivo principal vive fixo no topo, que nunca desvanece. Aqui o tracker
                // mostra o que dá as estrelas: as duas tarefas secundárias e a perfeição.
                ui.tItemMain.style.display = ui.topGoal ? 'none' : '';
                ui.tTextMain.textContent = t(node.main).toLowerCase();
                ui.tTextSub1.textContent = t(node.subs[0]).toLowerCase();
                ui.tTextSub2.textContent = t(node.subs[1]).toLowerCase();
                ui.tTextPerf.textContent = `${t("perfect")}: ${t(node.perf).toLowerCase()}`;

                // O Tracker deve refletir APENAS a jogada atual para não confundir o jogador
                const mainDone = experienceState.missionCompleted || evaluateLiveCondition(node.req.main);
                const sub1Done = evaluateLiveCondition(node.req.subs[0]);
                const sub2Done = evaluateLiveCondition(node.req.subs[1]);

                // A mesma condição que o mapa credita. Antes era nearFails > 0 aqui, o que
                // discordava das missões cuja perfeição é altitude ou combo.
                const perfDone = evaluateLiveCondition(node.req.perf);
                const perfFailed = node.req.perf[0] === 'nearFails' && state.runStats.nearFails > 0;
                
                const updateItem = (item, iconEl, done, failed = false, defaultIcon = '∘') => {
                    item.classList.toggle('done', done);
                    item.classList.toggle('failed', failed);
                    iconEl.textContent = failed ? '×' : (done ? '✦' : defaultIcon);
                };
                
                updateItem(ui.tItemMain, ui.tIconMain, mainDone);
                updateItem(ui.tItemSub1, ui.tIconSub1, sub1Done);
                updateItem(ui.tItemSub2, ui.tIconSub2, sub2Done);
                updateItem(ui.tItemPerf, ui.tIconPerf, perfDone, perfFailed, '✧');
            }
        } else {
            ui.tracker.classList.add('hidden');
        }
    }

    // A visibilidade do celestial HUD é decidida no laço principal, que roda em todos os modos.
    // Aqui cuidamos apenas do desvanecer por foco, que só faz sentido durante a partida.
    if (ui.celestialHUD) ui.celestialHUD.style.opacity = hideAll ? '0' : '1';
  }

  const evaluateLiveCondition = (cond) => {
    if (!cond) return false;
    const [key, val, op] = cond;
    let runVal = 0;
    if (key === 'score') runVal = state.scoreMeters;
    else if (key === 'runTime') runVal = state.runTime;
    else if (key === 'combo') runVal = state.maxComboThisRun;
    else if (key === 'nearFails') runVal = state.runStats.nearFails;
    else if (key === 'birds') runVal = state.runStats.birdsReturned;
    else if (key === 'maxTimeAboveLine') runVal = state.runStats.maxTimeAboveLine;
    else if (key === 'stabilityTime') runVal = state.runStats.maxStabilityTime;
    
    if (op === '<=') return runVal <= val;
    if (op === '==') return runVal === val;
    return runVal >= val;
  };
  
  function updateCamera(dt) {
    if (state.camera.shake.intensity > 0) {
        state.camera.shake.x = (Math.random() - 0.5) * 2 * state.camera.shake.intensity * 8;
        state.camera.shake.y = (Math.random() - 0.5) * 2 * state.camera.shake.intensity * 8;
        state.camera.shake.intensity = lerp(state.camera.shake.intensity, 0, dt * 5);
    } else {
        state.camera.shake.x = 0;
        state.camera.shake.y = 0;
    }
    
    if (state.screenFlash.alpha > 0) {
        state.screenFlash.alpha = lerp(state.screenFlash.alpha, 0, dt * 8);
    }
  }

