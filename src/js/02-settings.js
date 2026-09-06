
  let settings = {
      audio: { master: 100, music: 100, sfx: 100, ambient: 100 },
      gameplay: { difficulty: 'normal', sensitivity: 50, haptics: true, feedback: 'full' },
      locale: null, // null = seguir o idioma do aparelho na primeira visita
      visual: { brightness: 100, particles: 'full', reduceMotion: false },
      accessibility: { highContrast: false, textSize: 'medium', colorBlind: 'off' },
      tutorialDone: false,
      analyticsConsent: null
  };

  const ui = {
    menu: document.getElementById("menuScreen"),
    pause: document.getElementById("pauseScreen"),
    result: document.getElementById("result"),
    draft: document.getElementById("draftScreen"),
    harmony: document.getElementById("harmonyScreen"),
    memoriesScreen: document.getElementById("memoriesScreen"),
    float: document.getElementById("floatingMessage"),
    reward: document.getElementById("rewardBadge"),
    resultActions: document.getElementById("resultActions"),
    tutContainer: document.getElementById("tutorialContainer"),
    tutIcon: document.getElementById("tutIcon"),
    tutText: document.getElementById("tutText"),
    tutHand: document.getElementById("tutHand"),
    menuWorldLightFill: document.getElementById("menuWorldLightFill"),
    memoriesContent: document.getElementById("memoriesContent"),
    pauseBtn: document.getElementById("pauseBtn"),
    menuOrb: document.getElementById("menuOrb"),
    upgWarmth: document.getElementById("upgWarmth"),
    upgSerenity: document.getElementById("upgSerenity"),
    upgBrilliance: document.getElementById("upgBrilliance"),
    returnMapMenuBtn: document.getElementById("returnMapMenuBtn"),
    returnMapPauseBtn: document.getElementById("returnMapPauseBtn"),
    returnMapResultBtn: document.getElementById("returnMapResultBtn"),
    homePauseBtn: document.getElementById("homePauseBtn"),
    homeResultBtn: document.getElementById("homeResultBtn"),
    openHarmonyBtn: document.getElementById("openHarmonyBtn"),
    closeHarmonyBtn: document.getElementById("closeHarmonyBtn"),
    openMemoriesBtn: document.getElementById("openMemoriesBtn"),
    closeMemoriesBtn: document.getElementById("closeMemoriesBtn"),
    tracker: document.getElementById('liveMissionTracker'),
    topGoal: document.getElementById('topPersistentGoal'),
    celestialHUD: document.getElementById('celestialHUD'),
    tTitle: document.getElementById('tTitle'),
    tItemMain: document.getElementById('tItemMain'), tIconMain: document.getElementById('tIconMain'), tTextMain: document.getElementById('tTextMain'),
    tItemSub1: document.getElementById('tItemSub1'), tIconSub1: document.getElementById('tIconSub1'), tTextSub1: document.getElementById('tTextSub1'),
    tItemSub2: document.getElementById('tItemSub2'), tIconSub2: document.getElementById('tIconSub2'), tTextSub2: document.getElementById('tTextSub2'),
    tItemPerf: document.getElementById('tItemPerf'), tIconPerf: document.getElementById('tIconPerf'), tTextPerf: document.getElementById('tTextPerf')
  };

  let W = canvas.width;
  let H = canvas.height;
  let HORIZON_Y = H * 0.865;
  const SAVE_KEY = "luma_hold_the_sun_merged_v3";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => a === b ? 0 : (v - a) / (b - a);
  const rand = (a, b) => Math.random() * (b - a) + a;
  const remap = (v, a1, b1, a2, b2) => a2 + (b2 - a2) * clamp(invLerp(a1, b1, v), 0, 1);

  // Armadilha removida: gravityBase, gravityMax, holdLift e strongRadius viviam aqui sem
  // ninguém ler. A gravidade real está em gravityConfig, a sustentação em sustainConfig e
  // as zonas em influenceZones — mexer nas cópias mortas não produzia efeito nenhum.
