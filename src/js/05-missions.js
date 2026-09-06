  // --- LUMA EXPERIENCE SYSTEM v1.0 (Mission & VFX State) ---
  const MissionKind = { ABOVE_DAWN_LINE: 'above_dawn_line', REACH_ALTITUDE: 'reach_altitude', BIRDS_THIS_RUN: 'birds_this_run', SURVIVE_TIME: 'survive_time', COMBO_TARGET: 'combo_target', AVOID_NEAR_FAIL: 'avoid_near_fail', STABILITY_TIME: 'stability_time' };
  
  // --- SISTEMA DE RARIDADE ---
  const RARITY_POOL = {
    common: { chance: 0.50, color: '#F8F0E2' },
    uncommon: { chance: 0.30, color: '#7BA5C0' },
    rare: { chance: 0.15, color: '#FFC46B' },
    epic: { chance: 0.05, color: '#FF8933' }
  };

  function rollRarity(altitude, draftNumber) {
    const altBonus = Math.min(altitude / 4000, 0.2);
    const draftBonus = draftNumber * 0.05;
    const roll = Math.random();
    const adjEpic = RARITY_POOL.epic.chance + (altBonus + draftBonus) * 0.5;
    const adjRare = RARITY_POOL.rare.chance + (altBonus + draftBonus) * 0.5;
    
    if (roll < adjEpic) return 'epic';
    if (roll < adjEpic + adjRare) return 'rare';
    if (roll < adjEpic + adjRare + RARITY_POOL.uncommon.chance) return 'uncommon';
    return 'common';
  }

  const ALL_GRACES = [
    // SUSTENTAÇÃO (Warmth)
    { id: 'g_cuidado', title: 'Grace of Care', icon: '∿', rarity: 'common', desc: 'Sustain gains +25% strength.', flavor: 'your touch becomes more present', apply: (s) => s.mods.liftMult += 0.25 },
    { id: 'g_respiracao', title: 'Deep Breath', icon: '☴', rarity: 'common', desc: 'Sustain recovers +50% energy.', flavor: 'the sun breathes with you', apply: (s) => s.mods.energyRecMult += 0.50 },
    
    // NOVA GRAÇA TEMPORÁRIA DE EXEMPLO (Ephemeral Flame - 20s de força bruta)
    { id: 'g_chama', title: 'Ephemeral Flame', icon: '🔥', rarity: 'uncommon', desc: 'Sustain gains +60% strength for 20 seconds.', flavor: 'a bright, brief burn', duration: 20, apply: (s) => s.mods.liftMult += 0.60, onRemove: (s) => s.mods.liftMult -= 0.60 },
    
    { id: 'g_acolhimento', title: 'Shelter', icon: '♡', rarity: 'uncommon', desc: 'Sustain raises stability by +50%.', flavor: 'your presence calms the light', apply: (s) => s.mods.stabGainMult += 0.50 },
    { id: 'g_raizes', title: 'Roots of Light', icon: '↟', rarity: 'uncommon', desc: 'Sustain reduces entropy by 20%.', flavor: 'your light anchors the world', apply: (s) => s.mods.entropyDrainMult -= 0.20 },
    { id: 'g_manto', title: 'Mantle of Warmth', icon: '⛨', rarity: 'rare', desc: 'Sustain creates a shield that absorbs one fall.', flavor: 'the warmth protects you', apply: (s) => s.mods.shield += 1 },
    { id: 'g_coracao', title: 'Heart of the Sun', icon: '♡', rarity: 'epic', desc: 'Your radius of care doubles in size.', flavor: 'your care expands', apply: (s) => s.mods.areaSustain = true },
    
    // IMPULSO (Brilliance)
    { id: 'g_esforco', title: 'Grace of Effort', icon: '☼', rarity: 'common', desc: 'Pulses gain +25% impulse.', flavor: 'your touch gains strength', apply: (s) => s.mods.pulseMult += 0.25 },
    { id: 'g_ritmo', title: 'Quickened Rhythm', icon: '♩', rarity: 'common', desc: 'Rapid-tap penalty reduced by 30%.', flavor: 'your rhythm intensifies', apply: (s) => s.mods.antiSpamReduc += 0.30 },
    { id: 'g_fagulhas', title: 'Embers', icon: '✧', rarity: 'uncommon', desc: 'Perfect pulses give double light and radiance.', flavor: 'sparks multiply', apply: (s) => s.mods.sparkMult += 1 },
    { id: 'g_ascensao', title: 'Ascension', icon: '⇡', rarity: 'uncommon', desc: 'Each perfect pulse lifts slightly higher.', flavor: 'you rise with every gesture', apply: (s) => s.mods.ascendBonus += 5 },
    { id: 'g_cometa', title: 'Comet', icon: '⤑', rarity: 'rare', desc: 'Consecutive perfect pulses build strength.', flavor: 'your light accelerates', apply: (s) => s.mods.cometStacks = 1 },
    { id: 'g_transcendencia', title: 'Transcendence', icon: '∾', rarity: 'epic', desc: 'Perfect pulses clear the entropy of the world.', flavor: 'your light purifies the void', apply: (s) => s.mods.transcendActive = true },
    
    // RESILIÊNCIA (Serenity)
    { id: 'g_calma', title: 'Grace of Calm', icon: '☾', rarity: 'common', desc: 'Entropy grows 20% slower.', flavor: 'the void respects your presence', apply: (s) => s.mods.entropyGrowthMult -= 0.20 },
    { id: 'g_suspiro', title: 'Last Breath', icon: '⧖', rarity: 'common', desc: 'The rescue window when falling grows longer.', flavor: 'the abyss waits one moment longer', apply: (s) => s.mods.graceTimeBonus += 0.15 },
    { id: 'g_fenix', title: 'Phoenix', icon: '⋛', rarity: 'uncommon', desc: 'The first near-fall costs nothing and restores energy.', flavor: 'from ashes, the light is reborn', apply: (s) => s.mods.phoenixRes = true },
    { id: 'g_ciclo', title: 'Cycle', icon: '⟳', rarity: 'uncommon', desc: 'After a breakthrough, energy is restored.', flavor: 'dawn renews your strength', apply: (s) => s.mods.cycleActive = true },
    { id: 'g_luar', title: 'Moonlight', icon: '◯', rarity: 'rare', desc: 'Falling no longer destroys your stability.', flavor: 'in darkness, you hold steady', apply: (s) => s.mods.lunarActive = true },
    { id: 'g_eternidade', title: 'Eternity', icon: '∞', rarity: 'epic', desc: 'Survive one fatal fall and return to the line.', flavor: 'your light does not go out', apply: (s) => s.mods.eternityRes = true }
  ];

  const HOLD_THE_SUN_MISSIONS = [
    { id: 'm1', title: 'Still Night', subtitle: 'Reach 210m.', kind: MissionKind.REACH_ALTITUDE, target: 210, perfectText: 'zero near-fails', toast: 'The sky waits', nodeMeta: 'Ritual · Forest', biome: 'forest' },
    { id: 'm2', title: 'Neon Dusk', subtitle: 'Hold Dawn Line for 15s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 15, perfectText: 'zero near-fails', toast: 'City hums', nodeMeta: 'Ritual · City', biome: 'city' },
    { id: 'm3', title: 'Autumn Winds', subtitle: 'Reach Combo x5.', kind: MissionKind.COMBO_TARGET, target: 5, perfectText: 'score 220m', toast: 'Leaves dance', nodeMeta: 'Ritual · Autumn', biome: 'autumn' },
    { id: 'm4', title: 'Fragile Balance', subtitle: 'Reach 220m.', kind: MissionKind.REACH_ALTITUDE, target: 220, perfectText: 'combo x6', toast: 'Balance found', nodeMeta: 'Ritual · Snow', biome: 'snow' },
    { id: 'm5', title: 'Sakura Fall', subtitle: '80% Precision for 8s.', kind: MissionKind.STABILITY_TIME, target: 8, perfectText: 'zero near-fails', toast: 'Petals drift', nodeMeta: 'Ritual · Blossom', biome: 'sakura' },
    { id: 'm6', title: 'Rising Sky', subtitle: 'Reach 230m.', kind: MissionKind.REACH_ALTITUDE, target: 230, perfectText: 'zero near-fails', toast: 'The sky answered', nodeMeta: 'Ritual · Sea', biome: 'sea' },
    { id: 'm7', title: 'Whispering Mire', subtitle: 'Awaken 3 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 3, perfectText: 'Max Combo x5', toast: 'Fog clears', nodeMeta: 'Ritual · Swamp', biome: 'swamp' },
    { id: 'm8', title: 'Scorched Sands', subtitle: 'Reach 240m.', kind: MissionKind.REACH_ALTITUDE, target: 240, perfectText: 'reach 240m', toast: 'Heat endured', nodeMeta: 'Ritual · Desert', biome: 'desert' },
    { id: 'm9', title: 'Crimson Divide', subtitle: 'Hold Dawn Line for 20s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 20, perfectText: 'Max Combo x6', toast: 'Canyons glow', nodeMeta: 'Ritual · Canyon', biome: 'canyon' },
    { id: 'm10', title: 'Storm Front', subtitle: 'Reach 250m.', kind: MissionKind.REACH_ALTITUDE, target: 250, perfectText: 'Max Combo x6', toast: 'Clouds pierced', nodeMeta: 'Ritual · Storm', biome: 'storm' },
    { id: 'm11', title: 'Ancient Echoes', subtitle: 'Reach Combo x7.', kind: MissionKind.COMBO_TARGET, target: 7, perfectText: 'Zero near-fails', toast: 'Ruins awaken', nodeMeta: 'Ritual · Ruins', biome: 'ruins' },
    { id: 'm12', title: 'First Dawn', subtitle: '80% Precision for 12s.', kind: MissionKind.STABILITY_TIME, target: 12, perfectText: 'Clean run', toast: 'Dawn remembered', nodeMeta: 'Ritual · Volcano', biome: 'volcano' },
    { id: 'm13', title: 'Midnight Depths', subtitle: 'Reach 310m.', kind: MissionKind.REACH_ALTITUDE, target: 310, perfectText: 'Max Combo x8', toast: 'Abyss illuminated', nodeMeta: 'Ritual · Abyss', biome: 'abyss' },
    { id: 'm14', title: 'Luminous Flow', subtitle: 'Awaken 5 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 5, perfectText: 'Flawless run', toast: 'Care becomes rhythm', nodeMeta: 'Ritual · Aether', biome: 'aether' },
    { id: 'm15', title: 'Neon Grid', subtitle: 'Hold Dawn Line for 25s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 25, perfectText: 'Reach 320m', toast: 'Grid overridden', nodeMeta: 'Ritual · Cyber', biome: 'cyber' },
    { id: 'm16', title: 'Crystal Echoes', subtitle: 'Reach 320m.', kind: MissionKind.REACH_ALTITUDE, target: 320, perfectText: 'Max Combo x9', toast: 'Light fractured', nodeMeta: 'Ritual · Crystal', biome: 'crystal' },
    { id: 'm17', title: 'Fractured Realm', subtitle: 'Reach Combo x8.', kind: MissionKind.COMBO_TARGET, target: 8, perfectText: 'Zero near-fails', toast: 'Reality mended', nodeMeta: 'Ritual · Shattered', biome: 'shattered' },
    { id: 'm18', title: 'Stellar Nursery', subtitle: '80% Precision for 16s.', kind: MissionKind.STABILITY_TIME, target: 16, perfectText: 'Reach 330m', toast: 'Stars born', nodeMeta: 'Ritual · Nebula', biome: 'nebula' },
    { id: 'm19', title: 'Cosmic Echo', subtitle: 'Reach 330m.', kind: MissionKind.REACH_ALTITUDE, target: 330, perfectText: 'reach 370m', toast: 'The void embraced', nodeMeta: 'Endurance · Cosmos', biome: 'cosmos' },
    { id: 'm20', title: 'Emerald Canopy', subtitle: 'Awaken 7 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 7, perfectText: 'Zero near-fails', toast: 'Stars aligned', nodeMeta: 'Ritual · Forest', biome: 'forest' },
    { id: 'm21', title: 'Concrete Horizon', subtitle: 'Hold Dawn Line for 30s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 30, perfectText: 'Clean run', toast: 'City hums', nodeMeta: 'Ritual · City', biome: 'city' },
    { id: 'm22', title: 'Amber Leaves', subtitle: 'Reach 410m.', kind: MissionKind.REACH_ALTITUDE, target: 410, perfectText: 'Reach 420m', toast: 'Leaves dance', nodeMeta: 'Ritual · Autumn', biome: 'autumn' },
    { id: 'm23', title: 'Frostbound Peak', subtitle: 'Reach Combo x9.', kind: MissionKind.COMBO_TARGET, target: 9, perfectText: 'Flawless run', toast: 'Balance found', nodeMeta: 'Ritual · Snow', biome: 'snow' },
    { id: 'm24', title: 'Petal Dance', subtitle: '80% Precision for 20s.', kind: MissionKind.STABILITY_TIME, target: 20, perfectText: 'Clean run', toast: 'Petals drift', nodeMeta: 'Ritual · Sakura', biome: 'sakura' },
    { id: 'm25', title: 'Ocean Mirror', subtitle: 'Reach 420m.', kind: MissionKind.REACH_ALTITUDE, target: 420, perfectText: 'Flawless run', toast: 'The sky answered', nodeMeta: 'Ritual · Sea', biome: 'sea' },
    { id: 'm26', title: 'Tangled Roots', subtitle: 'Awaken 9 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 9, perfectText: 'Max Combo x9', toast: 'Fog clears', nodeMeta: 'Ritual · Swamp', biome: 'swamp' },
    { id: 'm27', title: 'Sunbaked Dunes', subtitle: 'Hold Dawn Line for 35s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 35, perfectText: 'Reach 420m', toast: 'Heat endured', nodeMeta: 'Ritual · Desert', biome: 'desert' },
    { id: 'm28', title: 'Echoing Gorge', subtitle: 'Reach 430m.', kind: MissionKind.REACH_ALTITUDE, target: 430, perfectText: 'Max Combo x10', toast: 'Canyons glow', nodeMeta: 'Ritual · Canyon', biome: 'canyon' },
    { id: 'm29', title: 'Thunders Roar', subtitle: 'Reach Combo x10.', kind: MissionKind.COMBO_TARGET, target: 10, perfectText: 'Zero near-fails', toast: 'Clouds pierced', nodeMeta: 'Ritual · Storm', biome: 'storm' },
    { id: 'm30', title: 'Forgotten Temple', subtitle: '80% Precision for 24s.', kind: MissionKind.STABILITY_TIME, target: 24, perfectText: 'Clean run', toast: 'Ruins awaken', nodeMeta: 'Ritual · Ruins', biome: 'ruins' },
    { id: 'm31', title: 'Magma Core', subtitle: 'Reach 520m.', kind: MissionKind.REACH_ALTITUDE, target: 520, perfectText: 'Max Combo x11', toast: 'Dawn remembered', nodeMeta: 'Ritual · Volcano', biome: 'volcano' },
    { id: 'm32', title: 'Silent Trench', subtitle: 'Awaken 12 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 12, perfectText: 'Zero near-fails', toast: 'Abyss illuminated', nodeMeta: 'Ritual · Abyss', biome: 'abyss' },
    { id: 'm33', title: 'Astral Stream', subtitle: 'Hold Dawn Line for 40s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 40, perfectText: 'Reach 530m', toast: 'Care becomes rhythm', nodeMeta: 'Ritual · Aether', biome: 'aether' },
    { id: 'm34', title: 'Digital Dream', subtitle: 'Reach 530m.', kind: MissionKind.REACH_ALTITUDE, target: 530, perfectText: 'Flawless run', toast: 'Grid overridden', nodeMeta: 'Ritual · Cyber', biome: 'cyber' },
    { id: 'm35', title: 'Prism Cavern', subtitle: 'Reach Combo x11.', kind: MissionKind.COMBO_TARGET, target: 11, perfectText: 'Zero near-fails', toast: 'Light fractured', nodeMeta: 'Ritual · Crystal', biome: 'crystal' },
    { id: 'm36', title: 'Mirror Dimension', subtitle: '80% Precision for 28s.', kind: MissionKind.STABILITY_TIME, target: 28, perfectText: 'Clean run', toast: 'Reality mended', nodeMeta: 'Ritual · Shattered', biome: 'shattered' },
    { id: 'm37', title: 'Purple Dust', subtitle: 'Reach 550m.', kind: MissionKind.REACH_ALTITUDE, target: 550, perfectText: 'Max Combo x12', toast: 'Stars born', nodeMeta: 'Ritual · Nebula', biome: 'nebula' },
    { id: 'm38', title: 'Voids Edge', subtitle: 'Awaken 15 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 15, perfectText: 'Flawless run', toast: 'The void embraced', nodeMeta: 'Endurance · Cosmos', biome: 'cosmos' },
    { id: 'm39', title: 'Cassiopeia', subtitle: 'Hold Dawn Line for 45s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 45, perfectText: 'Reach 560m', toast: 'Stars aligned', nodeMeta: 'Constellation · Ursa', biome: 'ursa' },
    { id: 'm40', title: 'Cygnus', subtitle: 'Reach 560m.', kind: MissionKind.REACH_ALTITUDE, target: 560, perfectText: 'Zero near-fails', toast: 'Hunter awakened', nodeMeta: 'Constellation · Orion', biome: 'orion' },
    { id: 'm41', title: 'Lyra', subtitle: 'Reach Combo x12.', kind: MissionKind.COMBO_TARGET, target: 12, perfectText: 'Clean run', toast: 'Golden fleece', nodeMeta: 'Constellation · Aries', biome: 'aries' },
    { id: 'm42', title: 'Draco', subtitle: '80% Precision for 34s.', kind: MissionKind.STABILITY_TIME, target: 34, perfectText: 'Reach 660m', toast: 'Stars aligned', nodeMeta: 'Constellation · Ursa', biome: 'ursa' },
    { id: 'm43', title: 'Pegasus', subtitle: 'Reach 660m.', kind: MissionKind.REACH_ALTITUDE, target: 660, perfectText: 'Max Combo x12', toast: 'Hunter awakened', nodeMeta: 'Constellation · Orion', biome: 'orion' },
    { id: 'm44', title: 'Phoenix', subtitle: 'Awaken 18 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 18, perfectText: 'Zero near-fails', toast: 'Golden fleece', nodeMeta: 'Constellation · Aries', biome: 'aries' },
    { id: 'm45', title: 'Andromeda', subtitle: 'Hold Dawn Line for 50s.', kind: MissionKind.ABOVE_DAWN_LINE, target: 50, perfectText: 'Reach 670m', toast: 'Stars aligned', nodeMeta: 'Constellation · Ursa', biome: 'ursa' },
    { id: 'm46', title: 'Perseus', subtitle: 'Reach 670m.', kind: MissionKind.REACH_ALTITUDE, target: 670, perfectText: 'Flawless run', toast: 'Hunter awakened', nodeMeta: 'Constellation · Orion', biome: 'orion' },
    { id: 'm47', title: 'Hercules', subtitle: 'Reach Combo x14.', kind: MissionKind.COMBO_TARGET, target: 14, perfectText: 'Zero near-fails', toast: 'Golden fleece', nodeMeta: 'Constellation · Aries', biome: 'aries' },
    { id: 'm48', title: 'Galactic Core', subtitle: '80% Precision for 40s.', kind: MissionKind.STABILITY_TIME, target: 40, perfectText: 'Clean run', toast: 'The void embraced', nodeMeta: 'Endurance · Cosmos', biome: 'cosmos' },
    { id: 'm49', title: 'Eternity Gate', subtitle: 'Awaken 20 birds.', kind: MissionKind.BIRDS_THIS_RUN, target: 20, perfectText: 'Reach 690m', toast: 'Stars born', nodeMeta: 'Ritual · Nebula', biome: 'nebula' },
    { id: 'm50', title: 'The Zenith', subtitle: 'Reach 690m into pure light.', kind: MissionKind.REACH_ALTITUDE, target: 690, perfectText: 'Flawless run', toast: 'Transcendence', nodeMeta: 'Apex · Zenith', biome: 'zenith' }
  ];

  const JOURNEY_SAVE_KEY = "luma_journey_progress_v3";
  let mapProgress = { totalDawns: 0, bestScore: 0, completedNodes: [], perfectNodes: [], nodeStats: {}, currentNodeId: "m1", lastRun: null, lastRunProcessed: true };

  function getReqForMission(m) {
    if (m.kind === MissionKind.REACH_ALTITUDE) return ['score', m.target, '>='];
    if (m.kind === MissionKind.ABOVE_DAWN_LINE) return ['maxTimeAboveLine', m.target, '>='];
    if (m.kind === MissionKind.BIRDS_THIS_RUN) return ['birds', m.target, '>='];
    if (m.kind === MissionKind.STABILITY_TIME) return ['stabilityTime', m.target, '>='];
    if (m.kind === MissionKind.COMBO_TARGET) return ['combo', m.target, '>='];
    return ['score', m.target, '>='];
  }

  // O texto de perfeição de cada missão é a fonte da regra: o que está escrito é o que é medido.
  // "Clean run"/"Flawless run" não descrevem nada verificável, então caem no padrão e o texto é reescrito.
  function getPerfObjective(perfectText) {
    const text = String(perfectText || '');
    const meters = text.match(/(\d+)\s*m\b/i);
    if (meters) return { text: `reach ${meters[1]}m`, req: ['score', Number(meters[1]), '>='] };
    const combo = text.match(/combo\s*x?\s*(\d+)/i);
    if (combo) return { text: `max combo x${combo[1]}`, req: ['combo', Number(combo[1]), '>='] };
    return { text: 'zero near-fails', req: ['nearFails', 0, '=='] };
  }

  // As duas estrelas secundárias medem os dois lados do loop — pulsar (combo) e sustentar (aves/precisão) —
  // sempre numa dimensão diferente da meta principal, para que nenhuma estrela venha de graça.
  // Limiares calibrados contra duas corridas de referência: dedo parado rende 7 aves e combo 1;
  // rastreando o sol rende 137 aves e combo 20. Uma estrela que toda corrida ganha não é uma estrela.
  const SUB_OBJECTIVE_POOL = [
    { field: 'combo', text: 'Flow State (Combo x3)', req: ['combo', 3, '>='] },
    { field: 'birds', text: 'Awaken 12 birds', req: ['birds', 12, '>='] },
    { field: 'stabilityTime', text: '80% Precision for 10s', req: ['stabilityTime', 10, '>='] }
  ];

  function getSubObjectives(m) {
    const mainField = getReqForMission(m)[0];
    return SUB_OBJECTIVE_POOL.filter(s => s.field !== mainField).slice(0, 2);
  }

  // Gera os caminhos do Mapa de Jornada a partir das Missões de forma automática
  const MAP_RAW_NODES = HOLD_THE_SUN_MISSIONS.map((m, i) => {
    const subs = getSubObjectives(m);
    const perf = getPerfObjective(m.perfectText);
    return {
      id: m.id,
      title: m.title,
      subtitle: m.subtitle,
      meta: m.nodeMeta,
      verb: m.kind.includes('REACH') ? 'ASCEND' : (m.kind.includes('ABOVE') ? 'SUSTAIN' : 'AWAKEN'),
      main: m.subtitle,
      subs: subs.map(s => s.text),
      perf: perf.text,
      x: 0.5 + Math.sin(i * 1.3) * 0.25, // Caminho em zigue-zague estrelar
      y: 1 - (i / Math.max(1, HOLD_THE_SUN_MISSIONS.length - 1)), // Invertido: Começa em baixo (1) e sobe até o topo (0)
      req: {
          main: getReqForMission(m),
          subs: subs.map(s => s.req),
          perf: perf.req
      }
    };
  });
  const MAP_NODES = MAP_RAW_NODES;
  const MAP_EDGES = MAP_NODES.slice(0, -1).map((n, i) => ({ from: n.id, to: MAP_NODES[i+1].id }));

  const missionUI = {
    toast: document.getElementById('missionToast')
  };

  const experienceState = {
    missionIndex: 0, mission: null, missionProgress: 0, missionCompleted: false,
    missionToastTimer: 0, missionPerfectFailed: false, missionBirdsThisRun: 0,
    missionDuration: 60, missionTimeLeft: 60, sub1Completed: false, sub2Completed: false, perfCompleted: false,
    reactive: { piano: 0, harmony: 0, melody: 0, sparkle: 0, choir: 0, tension: 0, haloScale: 1, haloBrightness: 0, horizonBloom: 0, particleBoost: 0, auroraBoost: 0, dangerVignette: 0, saturationDrop: 0 }
  };
  
  // Audio Hook Manager
  function emitAudioEvent(name, val1, val2) {
    if (!audioInitialized) { initAudio(); audioInitialized = true; }
    if (name === 'node_unlock') return playReward();
    if (name === 'tap_good') return playTap(false, val1, val2);
    if (name === 'tap_perfect') return playTap(true, val1, val2);
    if (name === 'birds_return') return playBirdsReturn();
    if (name === 'breakthrough') return playDawnAwakened();
    if (name === 'grace_gained') return playGraceGained();
    if (name === 'error_muffle') return playErrorMuffle();
  }
  
  // Visual Sync Hooks
  function drawMissionEnhancedHorizonBloom(baseOpacity) { return Math.min(1, baseOpacity + experienceState.reactive.horizonBloom * 0.22); }
  function getMissionReactiveSunScale() { return experienceState.reactive.haloScale; }
  function getMissionReactiveSunBrightness() { return experienceState.reactive.haloBrightness; }
  function getMissionReactiveAuroraBoost() { return experienceState.reactive.auroraBoost; }
  function getMissionReactiveDangerBoost() { return experienceState.reactive.dangerVignette; }
  // -------------------------------------------------------------

