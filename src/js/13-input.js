  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width, sy = H / rect.height;
    let x = e.clientX, y = e.clientY;
    if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    return { x: (x - rect.left) * sx, y: (y - rect.top) * sy };
  }

  let audioInitialized = false;
  function pointerDown(e) {
    e.preventDefault();
    if (!audioInitialized) { initAudio(); audioInitialized = true; }
    const p = getPos(e);
    state.input.x = p.x; state.input.y = p.y; state.input.holding = true; state.input.inside = true; state.input.lastPress = state.t;
    if (state.mode === "menu") { startGame(); return; }
    if (state.mode !== "gameplay") return;
    tryClickImpulse();
  }
  function pointerMove(e) {
    const p = getPos(e);
    state.input.x = p.x; state.input.y = p.y; state.input.inside = true;
    if (state.mode === "menu") {
      const dx = (p.x - W / 2) / (W / 2); const dy = (p.y - H / 2) / (H / 2);
      ui.menuOrb.style.setProperty('--mx', `${dx * 18}px`); ui.menuOrb.style.setProperty('--my', `${dy * 18}px`);
    }
  }
  function pointerUp(e) { e.preventDefault(); state.input.holding = false; silenceHoldAudio(); }

  function triggerScreenFlash(color = 'rgba(255,249,236,0.1)') {
    state.screenFlash.alpha = 0.1;
    state.screenFlash.color = color;
  }
  
  function triggerCameraShake(intensity = 0.5) {
      state.camera.shake.intensity = Math.max(state.camera.shake.intensity, intensity);
  }

  function tryClickImpulse() {
    const now = state.t;
    const sunScreenY = state.sun.y + state.camera.y;
    
    const sensMult = 0.5 + (settings.gameplay.sensitivity / 100);
    const currentInfluenceRadius = tune.influenceRadius * (state.mods.areaSustain ? 1.8 : 1) * sensMult;
    
    const dx = state.input.x - state.sun.x, dy = state.input.y - sunScreenY, dist = Math.hypot(dx, dy);
    if (dist > currentInfluenceRadius) return;
    // FIX: Fallback seguro caso o mod.cooldown seja undefined (evita NaN e rate-limit quebrado)
    if (now - state.input.lastClick < tune.clickCooldown * (state.mods.cooldown || 1)) return;

    // Sem fôlego: o pulso é recusado antes de gastar energia ou creditar combo.
    if (state.sun.energy < pulseEnergyCost) {
      if (now - state.input.lastEmptyPulse > 0.4) {
        state.input.lastEmptyPulse = now;
        triggerScreenFlash('rgba(120,140,170,0.06)');
        state.sun.tapScale = 0.96;
      }
      return;
    }

    const distanceRatio = clamp(dist / currentInfluenceRadius, 0, 1);
    
    let antiSpam = 1; 
    const dynamicSpamWindow = tune.antiSpamWindow * (1 - state.mods.antiSpamReduc);
    if (now - state.input.lastClick < dynamicSpamWindow) antiSpam = tune.antiSpamMult;
    
    const influence = getInteractionStrength(dist, currentInfluenceRadius);
    const perfect = (dist / currentInfluenceRadius) <= influenceZones.perfect;
    const baseImpulse = perfect ? tune.clickImpulsePerfect : tune.clickImpulseBase;
    
    let dynamicPulseMult = state.mods.pulseMult;
    if (perfect && state.mods.cometStacks > 0) dynamicPulseMult += Math.min(0.5, state.mods.consecutivePulses * 0.1);

    const impulse = baseImpulse * dynamicPulseMult * influence * antiSpam * state.sun.impulseEfficiency * state.feedbackLoops.recoveryAssist * (1 - (1 - state.sun.energy) * .25) * state.emotion.runtime.physics.assistMul;

    state.sun.vy -= impulse;
    state.sun.energy = clamp(state.sun.energy - pulseEnergyCost, 0, 1);

    state.sun.stability = clamp(state.sun.stability + (perfect ? .09 : .05), 0, 1);
    state.sun.haloPulse = 1; state.sun.tapScale = 1.08; state.input.lastClick = now;

    triggerScreenFlash(perfect ? 'rgba(255,249,236,0.12)' : 'rgba(255,249,236,0.05)');
    
    if (perfect) {
      const oldCombo = state.combo;
      // Combo é mestria, não velocidade: pulsos dentro da janela de anti-spam não constroem combo.
      if (antiSpam === 1) {
        state.combo = Math.min(20, state.combo + 1);
        state.maxComboThisRun = Math.max(state.maxComboThisRun, state.combo);
        state.mods.consecutivePulses++;
      }

      spawnSpark(state.sun.x, state.sun.y, false, 12 * state.mods.sparkMult);
      addRadiance(1 * state.mods.sparkMult);
      
      if (state.mods.ascendBonus > 0) { state.sun.vy -= 150; }
      if (state.mods.transcendActive) { state.entropy = Math.max(0, state.entropy - 0.10); }
      
      emitAudioEvent('tap_perfect', distanceRatio, state.combo);
      triggerCameraShake(0.8);
      if (navigator.vibrate && settings.haptics) navigator.vibrate(15); 
      if (state.tutorial.active && state.tutorial.chapter === 2) state.tutorial.perfects++;
      
      const comboThreshold1 = Math.max(1, 3 - Math.floor(state.totalRunMemory.totalBirds / 10));
      const comboThreshold2 = Math.max(comboThreshold1 + 1, 6 - Math.floor(state.totalRunMemory.totalBirds / 5));
      analytics.track(EVENT_TYPES.PERFECT_TAP, { distanceToCore: distanceRatio, combo: state.combo, altitude: state.scoreMeters });

      if (oldCombo < comboThreshold1 && state.combo >= comboThreshold1) { spawnBirdRing(); showReward("flow state"); }
      if (oldCombo < comboThreshold2 && state.combo >= comboThreshold2) { spawnBirdRing(); showReward("luminous rhythm"); }
    } else {
      state.mods.consecutivePulses = 0;
      showFloating("light rises", true);
      spawnSpark(state.sun.x, state.sun.y, false, 6);
      emitAudioEvent('tap_good', distanceRatio, state.combo);
      if (navigator.vibrate && settings.haptics) navigator.vibrate(5);
      triggerCameraShake(0.3);
      
      // MICROINTERAÇÃO: Erro leve / Hesitação
      state.sun.errorTremor = 1.0; 
      state.sun.glowFail = 1.0;
      emitAudioEvent('error_muffle');
      
      analytics.track(EVENT_TYPES.TAP, { distanceToCore: distanceRatio, combo: state.combo, altitude: state.scoreMeters });
    }

    spawnPulse(state.sun.x, state.sun.y);
    spawnDust(state.sun.x, state.sun.y, perfect ? 6 : 4);
  }

