  const tune = {
    maxFall: 710,
    clickImpulseBase: 300,
    clickImpulsePerfect: 350,
    damping: 0.985,
    influenceRadius: 145,
    clickCooldown: 0.14,
    antiSpamWindow: 0.22,
    antiSpamMult: 0.78,
    nearFailBand: 115,
    windForce: 300
  };

  const gravityConfig = {
    base: 850,
    max: 1140,
    progression: 1.08,
    entropy: 240
  };

  function getCurrentGravity(difficulty, entropy) {
    let gravity = gravityConfig.base * Math.pow(gravityConfig.progression, difficulty);
    gravity += entropy * gravityConfig.entropy;
    return Math.min(gravity, gravityConfig.max);
  }

  const sustainConfig = {
    liftForce: 790,
    // Sustentar é a única fonte real de energia: ~2,1s no ponto perfeito enchem a barra vazia.
    energyRecovery: 0.42,
    stabilityGain: 0.08
  };

  // Um pulso é racionado pela energia. Barra cheia paga ~4,5 pulsos.
  const pulseEnergyCost = 0.22;

  const influenceZones = {
    perfect: 0.15,
    strong: 0.35,
    medium: 0.65,
    weak: 1.0
  };

  function getInteractionStrength(distance, sunRadius) {
    const ratio = distance / sunRadius;
    if (ratio <= influenceZones.perfect) return 1.0;
    if (ratio <= influenceZones.strong) return 0.85;
    if (ratio <= influenceZones.medium) return 0.6;
    if (ratio <= influenceZones.weak) return 0.35;
    return 0;
  }

  const EMOTION_STATES = {
    deep_night: {
      physics: { gravityMul: 0.92, windMul: 0.35, entropyMul: 0.75, assistMul: 1.05 },
      visuals: { skyLerp: 0.08, saturation: 0.55, contrast: 0.82, fogDensity: 0.28, haloIntensity: 0.35, haloSize: 0.9, particleDensity: 0.2, aurora: 0.0, worldGlow: 0.12 },
      audio: { drone: 0.65, piano: 0.08, sparkle: 0.0, choir: 0.0, tension: 0.0, lowpass: 0.72 },
      ui: { hudOpacity: 0.18, ritualTextOpacity: 0.0, iconsOpacity: 0.28 },
      camera: { shake: 0.0, drift: 0.08, zoom: 1.0 }
    },
    first_glow: {
      physics: { gravityMul: 1.0, windMul: 0.5, entropyMul: 0.92, assistMul: 1.0 },
      visuals: { skyLerp: 0.24, saturation: 0.68, contrast: 0.9, fogDensity: 0.22, haloIntensity: 0.52, haloSize: 1.0, particleDensity: 0.36, aurora: 0.0, worldGlow: 0.2 },
      audio: { drone: 0.58, piano: 0.18, sparkle: 0.06, choir: 0.0, tension: 0.0, lowpass: 0.84 },
      ui: { hudOpacity: 0.16, ritualTextOpacity: 0.24, iconsOpacity: 0.26 },
      camera: { shake: 0.0, drift: 0.06, zoom: 1.0 }
    },
    flow: {
      physics: { gravityMul: 0.96, windMul: 0.82, entropyMul: 0.88, assistMul: 1.08 },
      visuals: { skyLerp: 0.46, saturation: 0.82, contrast: 1.0, fogDensity: 0.16, haloIntensity: 0.78, haloSize: 1.08, particleDensity: 0.68, aurora: 0.12, worldGlow: 0.38 },
      audio: { drone: 0.46, piano: 0.34, sparkle: 0.22, choir: 0.08, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.1, ritualTextOpacity: 0.32, iconsOpacity: 0.22 },
      camera: { shake: 0.02, drift: 0.04, zoom: 1.01 }
    },
    near_fail: {
      physics: { gravityMul: 1.12, windMul: 1.18, entropyMul: 1.2, assistMul: 1.12 },
      visuals: { skyLerp: 0.18, saturation: 0.34, contrast: 1.08, fogDensity: 0.3, haloIntensity: 0.22, haloSize: 0.9, particleDensity: 0.18, aurora: 0.0, worldGlow: 0.06 },
      audio: { drone: 0.7, piano: 0.02, sparkle: 0.0, choir: 0.0, tension: 0.34, lowpass: 0.52 },
      ui: { hudOpacity: 0.06, ritualTextOpacity: 0.0, iconsOpacity: 0.18 },
      camera: { shake: 0.22, drift: 0.02, zoom: 1.02 }
    },
    rising_sky: {
      physics: { gravityMul: 1.02, windMul: 0.9, entropyMul: 0.96, assistMul: 1.02 },
      visuals: { skyLerp: 0.66, saturation: 0.9, contrast: 1.02, fogDensity: 0.12, haloIntensity: 0.92, haloSize: 1.14, particleDensity: 0.82, aurora: 0.24, worldGlow: 0.54 },
      audio: { drone: 0.34, piano: 0.42, sparkle: 0.3, choir: 0.16, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.08, ritualTextOpacity: 0.4, iconsOpacity: 0.2 },
      camera: { shake: 0.01, drift: 0.05, zoom: 1.015 }
    },
    breakthrough: {
      physics: { gravityMul: 0.9, windMul: 0.72, entropyMul: 0.72, assistMul: 1.14 },
      visuals: { skyLerp: 0.92, saturation: 1.0, contrast: 1.08, fogDensity: 0.08, haloIntensity: 1.0, haloSize: 1.22, particleDensity: 1.0, aurora: 0.46, worldGlow: 0.82 },
      audio: { drone: 0.26, piano: 0.5, sparkle: 0.42, choir: 0.28, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.04, ritualTextOpacity: 0.54, iconsOpacity: 0.18 },
      camera: { shake: 0.0, drift: 0.06, zoom: 1.03 }
    },
    pause_breath: {
      physics: { gravityMul: 0.0, windMul: 0.0, entropyMul: 0.0, assistMul: 0.0 },
      visuals: { skyLerp: 0.5, saturation: 0.7, contrast: 0.92, fogDensity: 0.18, haloIntensity: 0.48, haloSize: 1.0, particleDensity: 0.22, aurora: 0.0, worldGlow: 0.16 },
      audio: { drone: 0.22, piano: 0.06, sparkle: 0.0, choir: 0.0, tension: 0.0, lowpass: 0.68 },
      ui: { hudOpacity: 0.0, ritualTextOpacity: 0.0, iconsOpacity: 0.36 },
      camera: { shake: 0.0, drift: 0.0, zoom: 1.0 }
    }
  };

  function detectEmotion(s) {
    if (s.paused) return "pause_breath";
    if (s.nearFailN > 0.8) return "near_fail";
    if (s.altitudeN > 0.8 && s.recentSuccessN > 0.7) return "breakthrough";
    if (s.altitudeN > 0.62 && s.stabilityN > 0.58) return "rising_sky";
    if (s.comboN > 0.5 && s.stabilityN > 0.5) return "flow";
    if (s.altitudeN > 0.2) return "first_glow";
    return "deep_night";
  }

  function blend(current, target, speed, dt) {
    return current + (target - current) * Math.min(1, dt * speed);
  }

  function blendProfile(runtime, target, dt) {
    for (let group in target) {
      if (!runtime[group]) runtime[group] = {};
      for (let key in target[group]) {
        runtime[group][key] = blend(
          runtime[group][key] || 0,
          target[group][key],
          2.2,
          dt
        );
      }
    }
  }

  function EmotionRuntime() {
    this.currentName = "deep_night";
    this.targetName = "deep_night";
    this.runtime = JSON.parse(JSON.stringify(EMOTION_STATES.deep_night));

    this.update = function(signals, dt) {
      const next = detectEmotion(signals);
      if (this.targetName !== next) {
        this.targetName = next;
      }
      const targetProfile = EMOTION_STATES[this.targetName];
      blendProfile(this.runtime, targetProfile, dt);
    }
  }

  function getSignals() {
    const s = state;
    const altitudeN = clamp(s.scoreMeters / 1800, 0, 1);
    const comboN = clamp(s.combo / 10, 0, 1);
    const stabilityN = s.sun.stability;
    const energyN = s.sun.energy;
    const nearFailN = s.sun.nearFail ? 1 : 0;
    const recentSuccessN = s.rewardTimer > 0 ? 1 : 0;
    
    return {
      paused: s.mode === 'paused',
      altitudeN, comboN, stabilityN, energyN, nearFailN, 
      worldLightN: clamp(s.worldLight / 100, 0, 1),
      dawnHoldN: s.dawnGoal.visualIntensity,
      recentSuccessN
    };
  }

