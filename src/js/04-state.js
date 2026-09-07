  const state = {
    mode: "menu",
    emotion: new EmotionRuntime(),
    t: 0,
    dt: 0,
    runTime: 0,
    cutscene: { active: false, timer: 0, duration: 4.0 },
    biome: "forest",
    totalMeters: 0,
    worldLight: 0,
    bestMeters: 0,
    scoreMeters: 0,
    dawnsAwakened: 0,
    runDawns: 0,
    combo: 0,
    comboTimer: 0,
    maxComboThisRun: 0,
    rewardTimer: 0,
    messageTimer: 0,
    themeStep: 0,
    uiSilenced: false,
    camera: { y: 0, shake: { x: 0, y: 0, intensity: 0 } },
    screenFlash: { alpha: 0, color: 'white' },
    weather: { rainIntensity: 0 },

    entropy: 0.12,
    draft: {
      radiance: 0,
      count: 0,
      pending: 0,
      thresholds: [30, 75, 135, 210],
      max: 4,
      lastAltitudeMilestone: 180,
      sustainTimer: 0
    },
    activeGraces: [],
    phase: 1,
    difficulty: 0,
    graceTime: 0,
    nearFailCooldown: 0,
    runStats: { forestsAwakened: 0, birdsReturned: 0, windowsLit: 0, nearFails: 0, breakthroughs: 0, maxTimeAboveLine: 0, maxStabilityTime: 0, totalStabilityTime: 0 },
    totalRunMemory: { totalForests: 0, totalBirds: 0, totalWindows: 0 },

    emotionalState: { calm: 0, tension: 0, wonder: 0, hope: 0 },
    feedbackLoops: {
      breathingWindow: 0,
      recoveryAssist: 1,
      lastNearFailTime: -999,
      lastRewardTime: -999
    },

    dawnGoal: {
      active: true,
      thresholdY: H * 0.35,
      holdDuration: 3.2,
      holdProgress: 0,
      completed: false,
      justTriggered: false,
      visualIntensity: 0
    },

    worldResponse: {
      lightLevel: 0,
      warmthLevel: 0,
      awakeningLevel: 0,
      birdsLevel: 0,
      floraLevel: 0,
      auroraLevel: 0,
      memoryGain: 0,
      horizonBloomIntensity: 0,
      mountainGlowIntensity: 0
    },

    // Aviso de objetivos: quanto tempo ainda fica na tela, e a assinatura do último estado
    // mostrado — é a mudança dela que reacende o aviso.
    hud: { trackerTimer: 0, trackerSig: '' },

    tutorialStep: 0,
    tutorialDone: false,
    tutorialHoldAccum: 0,
    tutorialPerfectCount: 0,
    tutorialStepTimer: 0,

    mods: { 
      liftMult: 1, energyRecMult: 1, stabGainMult: 1, entropyDrainMult: 1, shield: 0, areaSustain: false,
      pulseMult: 1, janelaMult: 1, sparkMult: 1, ascendBonus: 0, cometStacks: 0, transcendActive: false,
      entropyGrowthMult: 1, graceTimeBonus: 0, phoenixRes: false, cycleActive: false, lunarActive: false, eternityRes: false,
      consecutivePulses: 0, gravityFactor: 1
    },
    activeGraces: [],

    input: {
      x: W * 0.5,
      y: H * 0.42,
      holding: false,
      inside: false,
      lastPress: -999,
      lastClick: -999,
      lastEmptyPulse: -999,
      keyboardHold: false
    },

    sun: {
      x: W * 0.5,
      y: H * 0.38,
      errorTremor: 0,
      glowFail: 0,
      vx: 0,
      vy: 0,
      stability: 0.22, 
      energy: 0.92, 
      wear: 0, 
      breath: 0,
      breathStrength: 0.18,
      // Respiração presa: 0 = fôlego no ponto, 1 = segurou muito além do cheio.
      strain: 0,
      haloPulse: 0,
      nearFail: false,
      breakthrough: false,
      mood: "serene",
      stableTimer: 0,
      flowTimer: 0,
      emFluxo: false,
      impulseEfficiency: 1,
      tapScale: 1,
      continuousTimeAboveLine: 0,
      continuousStabilityTime: 0
    },

    sky: {
      dawn: 0.08,
      aurora: 0,
      silentSky: 0,
      zone: "night"
    },

    world: {
      stars: [], horizonStars: [], mountains: [], skyline: [], birds: [], rare: [], ambientDust: [], clouds: [], rain: [],
      dust: [], sparks: [], pulses: [], trail: [], leaves: [], trees: [], bushes: [], fgProps: [], constellation: null,
      breath: 0
    }
  };

  const NOTE_HZ = { 'D3': 146.83, 'E3': 164.81, 'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94, 'C#4': 277.18, 'D4': 293.66, 'E4': 329.63, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'D6': 1174.66 };
  const CHORDS = { 'Dmaj7': ['D3','F#3','A3','C#4','D4'], 'Bm7': ['B3','D4','F#4','A4'], 'Gmaj7': ['G3','B3','D4','F#4'], 'Asus2': ['A3','B3','E4','A4'], 'Dm7': ['D3','F3','A3','C4','E4'], 'Bbmaj7': ['Bb2','D3','F3','A3'], 'Fmaj7': ['F3','A3','C4','E4'], 'Gm7': ['G2','Bb2','D3','F3'] };
  const PHRASE_SKY_ASCENT = ['D4','F#4','A4','B4','A4','G4','E4','D4'];
  const PHRASE_DAWN_BLOOM = ['D4','F#4','A4','B4','A4','G4','F#4','E4','D4'];
  const AUDIO_LOGO = ['D4','F#4','A4','E4','D4'];
  const HOPE_CELL = ['D4','F#4','A4'];

  // state.tutorial só passa a existir dentro de resetRun(). Qualquer leitura feita antes da
  // primeira corrida — como a preparação da missão, que roda no boot — precisa tolerar isso.
  function isTutorialActive() { return !!(state.tutorial && state.tutorial.active); }

