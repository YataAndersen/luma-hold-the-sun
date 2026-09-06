'use strict';

// Run: node --test "LUMA - PROJETO PRINCIPAL/tests/gameplay.test.cjs"
// These are behavior tests of declarations extracted from the shipped HTML.
// Rendering, sound and persistence are explicit stubs; gameplay code is not copied.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const source = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');

function between(start, end, includeEnd = true) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `Missing production declaration: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `Missing end of production declaration: ${start}`);
  return source.slice(from, to + (includeEnd ? end.length : 0));
}

function functionSource(name) {
  const start = `  function ${name}(`;
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `Missing production function: ${name}`);
  const firstLine = source.slice(from, source.indexOf('\n', from));
  // Existing inline helpers have a complete declaration on one line.
  if (firstLine.trimEnd().endsWith('}')) return firstLine;
  return between(start, '\n  }');
}

function makeHarness({ keyboard = false } = {}) {
  const effects = { results: [], events: [], storage: new Map(), pulses: 0 };
  const listeners = new Map();
  const noOp = () => {};
  const domElement = () => ({
    textContent: '', style: { setProperty: noOp },
    classList: { add: noOp, remove: noOp, toggle: noOp },
    setAttribute: noOp,
  });
  const context = vm.createContext({
    console, W: 400, H: 800,
    settings: { gameplay: { sensitivity: 50 }, haptics: false },
    navigator: {}, document: { getElementById: () => domElement() },
    window: { addEventListener: (name, callback) => listeners.set(name, callback) },
    ui: { tutContainer: domElement(), topGoal: domElement() },
    mapUI: { totalDawns: domElement() },
    missionUI: { toast: domElement() },
    experienceState: {
      mission: null, missionCompleted: false, missionDuration: 60,
      missionTimeLeft: 60, missionProgress: 0, missionToastTimer: 0,
    },
    activeGameKey: null, activePointerId: null,
    analytics: { track: (...args) => effects.events.push(args) },
    EVENT_TYPES: { PERFECT_TAP: 'perfect_tap', TAP: 'tap', RUN_END: 'run_end' },
    localStorage: {
      setItem: (key, value) => effects.storage.set(key, value),
      getItem: key => effects.storage.get(key) ?? null,
    },
    SAVE_KEY: 'test_core', JOURNEY_SAVE_KEY: 'test_map',
    // No browser timers are run: transient visual effects do not alter assertions.
    setTimeout: noOp, clearTimeout: noOp,
    playCollapseSound: noOp, silenceHoldAudio: noOp,
    emitAudioEvent: noOp, triggerScreenFlash: noOp, triggerCameraShake: noOp,
    spawnSpark: noOp, spawnDust: noOp, spawnBirdRing: noOp,
    spawnPulse: () => effects.pulses++,
    addRadiance: noOp, showReward: noOp, showFloating: noOp,
    updateMenuMeta: noOp, showMapToast: noOp,
    showResult: (record, success) => effects.results.push({ record, success }),
    // Input cleanup is outside the progress unit; keyboard handlers use real code.
    resetInput: noOp, startGame: noOp, resumeGame: noOp, pauseGame: noOp,
    // Translation is presentation: identity here, like the render and sound stubs.
    t: text => text,
  });

  const declarations = [
    between('  const clamp =', '\n', false),
    between('  const tune = {', '\n  };'),
    between('  const influenceZones = {', '\n  };'),
    between('  const sustainConfig = {', '\n  };'),
    between('  const pulseEnergyCost =', '\n', false),
    between('  const EMOTION_STATES = {', '\n  };'),
    functionSource('EmotionRuntime'),
    between('  const state = {', '\n  };'),
    between('  const MissionKind =', '\n', false),
    between('  const HOLD_THE_SUN_MISSIONS = [', '\n  ];'),
    between('  let mapProgress =', '\n', false),
    functionSource('getReqForMission'),
    functionSource('getPerfObjective'),
    between('  const SUB_OBJECTIVE_POOL = [', '\n  ];'),
    functionSource('getSubObjectives'),
    between('  const MAP_RAW_NODES =', '\n  const missionUI', false),
    between('  const evaluateCondition =', '\n  };'),
    between('  const evaluateLiveCondition =', '\n  };'),
    ...['getInteractionStrength', 'tryClickImpulse', 'saveProgress',
      'saveMapProgress', 'checkMapUnlocks', 'syncJourneyMap', 'endRun',
      'markMissionComplete', 'updateMissionLogic'].map(functionSource),
    'globalThis.gameState = state; globalThis.journey = mapProgress;',
    'globalThis.missions = HOLD_THE_SUN_MISSIONS;',
    'experienceState.mission = HOLD_THE_SUN_MISSIONS[0];',
  ];

  if (keyboard) {
    if (source.includes('  function handleKeyDown(')) {
      if (source.includes('  function isGameplayKey(')) declarations.push(functionSource('isGameplayKey'));
      else if (source.includes('  const isGameplayKey =')) declarations.push(between('  const isGameplayKey =', '\n', false));
      declarations.push(functionSource('handleKeyDown'), functionSource('handleKeyUp'));
      declarations.push('window.addEventListener("keydown", handleKeyDown); window.addEventListener("keyup", handleKeyUp);');
    } else {
      declarations.push(between('  window.addEventListener("keydown",', '\n  });'));
      declarations.push(between('  window.addEventListener("keyup",', '\n  });'));
    }
  }

  vm.runInContext(declarations.join('\n'), context, { filename: htmlPath });
  context.gameState.mode = 'gameplay';
  context.gameState.tutorial = { active: false, chapter: 0, perfects: 0 };
  return {
    context, state: context.gameState, journey: context.journey, effects,
    run: code => vm.runInContext(code, context, { filename: 'test-scenario.js' }),
    key: (type, code, repeat = false) => {
      const handler = listeners.get(type);
      assert.ok(handler, `Production listener missing: ${type}`);
      handler({ code, repeat, preventDefault: noOp, target: { tagName: 'CANVAS' } });
    },
  };
}

test('14 deliberate perfect pulses reach the late mission combo target', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  for (let i = 0; i < 14; i++) {
    game.state.t += 0.5;
    // Sustaining is what pays for the next pulse: half a second of contact at full influence.
    game.run('state.sun.energy = Math.min(1, state.sun.energy + sustainConfig.energyRecovery * 0.5)');
    game.context.tryClickImpulse();
  }
  assert.equal(game.state.combo, 14);
  assert.equal(game.state.maxComboThisRun, 14);
  assert.equal(game.effects.pulses, 14);
  assert.equal(game.run('evaluateLiveCondition(getReqForMission(missions.find(m => m.id === "m47")))'), true);
});

test('an exhausted sun refuses the pulse instead of spending what it does not have', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.run('state.sun.energy = pulseEnergyCost - 0.01');
  game.state.t = 5;
  game.context.tryClickImpulse();
  assert.equal(game.effects.pulses, 0, 'No pulse may leave the sun below zero energy');
  assert.equal(game.state.combo, 0, 'A refused pulse must not build mastery');
  assert.equal(game.run('state.sun.energy'), game.run('pulseEnergyCost - 0.01'), 'A refused pulse costs nothing');
});

test('a full bar buys a burst of pulses, then sustaining is the only way to keep climbing', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.run('state.sun.energy = 1');
  const affordable = Math.floor(1 / game.run('pulseEnergyCost'));
  for (let i = 0; i < affordable + 3; i++) {
    game.state.t += 0.5;
    game.context.tryClickImpulse();
  }
  assert.equal(game.effects.pulses, affordable, 'Spending stops exactly when the bar runs out');
  // One second of contact at full influence buys the next pulse back.
  game.run('state.sun.energy += sustainConfig.energyRecovery');
  game.state.t += 0.5;
  game.context.tryClickImpulse();
  assert.equal(game.effects.pulses, affordable + 1);
});

test('a fall after achieving the altitude goal saves the record without completing the mission', () => {
  const game = makeHarness();
  game.state.scoreMeters = game.context.missions[0].target + 25;
  game.state.runTime = 25;
  game.context.endRun(false);
  assert.equal(game.state.bestMeters, game.state.scoreMeters, 'Failed runs may still keep records');
  assert.equal(game.journey.completedNodes.includes('m1'), false);
  assert.equal(game.journey.currentNodeId, 'm1');
  assert.equal(game.journey.nodeStats.m1?.main ?? false, false);
  assert.equal(game.journey.perfectNodes.includes('m1'), false);
  assert.equal(game.effects.results[0].success, false);
});

test('the goal remains pending before the timer expires; a successful finish unlocks the next mission', () => {
  const game = makeHarness();
  game.state.scoreMeters = game.context.missions[0].target + 25;
  game.state.runTime = 59;
  game.context.experienceState.missionTimeLeft = 1;
  game.context.updateMissionLogic(0.5, {});
  assert.equal(game.context.experienceState.missionCompleted, false);
  assert.equal(game.journey.completedNodes.length, 0);
  game.state.runTime = 60;
  game.context.updateMissionLogic(0.5, {});
  assert.equal(game.context.experienceState.missionCompleted, true);
  // The browser's victory animation calls endRun(true) after this condition.
  game.context.endRun(true);
  assert.equal(game.journey.completedNodes.includes('m1'), true);
  assert.equal(game.journey.currentNodeId, 'm2');
  assert.equal(game.effects.results[0].success, true);
});

for (const code of ['Space', 'Enter']) {
  test(`${code} auto-repeat sustains a single press without producing extra pulses`, () => {
    const game = makeHarness({ keyboard: true });
    game.key('keydown', code);
    assert.equal(game.effects.pulses, 1);
    for (let i = 0; i < 5; i++) {
      // Advance beyond cooldown so only the keyboard rule can reject repeats.
      game.state.t += 0.5;
      game.key('keydown', code, true);
    }
    assert.equal(game.effects.pulses, 1);
    assert.equal(game.state.input.holding, true);
    game.key('keyup', code);
    assert.equal(game.state.input.holding, false);
    game.state.t += 0.5;
    game.key('keydown', code);
    assert.equal(game.effects.pulses, 2, 'A fresh press after release must work');
  });
}

test('rapid pulses inside the anti-spam window do not grow the perfect combo', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.state.t = 1;
  game.context.tryClickImpulse();
  assert.equal(game.state.combo, 1);
  // Select the middle of the actual cooldown and anti-spam thresholds.
  const fastInterval = game.run('(tune.clickCooldown + tune.antiSpamWindow) / 2');
  game.state.t += fastInterval;
  game.context.tryClickImpulse();
  assert.ok(game.state.combo <= 1);
  assert.equal(game.state.maxComboThisRun, 1);
});

test('every mission is measured by the objective it displays', () => {
  const game = makeHarness();
  const nodes = game.run('MAP_RAW_NODES.map(n => ({ id: n.id, perf: n.perf, req: n.req }))');
  assert.equal(nodes.length, 50);
  for (const node of nodes) {
    const [field, value] = node.req.perf;
    const shown = node.perf;
    if (field === 'nearFails') {
      assert.match(shown, /near-fail/i, `${node.id} promises "${shown}" but is judged on near-fails`);
    } else {
      assert.ok(shown.includes(String(value)),
        `${node.id} promises "${shown}" but is judged on ${field} >= ${value}`);
    }
  }
});

test('no star is free: secondary goals never measure the main objective', () => {
  const game = makeHarness();
  const nodes = game.run('MAP_RAW_NODES.map(n => ({ id: n.id, req: n.req, subs: n.subs }))');
  for (const node of nodes) {
    const mainField = node.req.main[0];
    assert.equal(node.req.subs.length, 2, `${node.id} must offer two secondary stars`);
    assert.equal(node.subs.length, 2, `${node.id} must label two secondary stars`);
    for (const sub of node.req.subs) {
      assert.notEqual(sub[0], mainField,
        `${node.id} would hand out a star for ${sub[0]}, which its main goal already requires`);
    }
  }
});

test('precision targets stay inside what continuous contact can actually reach', () => {
  const game = makeHarness();
  // continuousStabilityTime grows at 1x in the strong zone and decays at 1.4x outside it,
  // so it only accumulates above ~58% contact. Past ~40s a 60s mission would demand
  // near-perfect contact for the whole run.
  const tooHigh = game.run(`missions
    .filter(m => m.kind === MissionKind.STABILITY_TIME)
    .filter(m => m.target > 40)
    .map(m => m.id)
    .join(', ')`);
  assert.equal(tooHigh, '', `Precision targets beyond reach: ${tooHigh}`);
});

test('every timed objective fits inside the time its own mission gives', () => {
  const game = makeHarness();
  // Precisão e dawn line são timers contínuos: crescem 1x dentro da condição e decaem 1.4x
  // fora dela, então acumulam acima de ~58% de permanência. Um jogador muito bom (85%)
  // acumula 2.4*0.85 - 1.4 = 0.64s por segundo de missão. A duração vem de
  // resetMissionRunState: 60s nas dez primeiras, +15s a cada dezena.
  const impossible = game.run(`missions
    .filter(m => m.kind === MissionKind.STABILITY_TIME || m.kind === MissionKind.ABOVE_DAWN_LINE)
    .filter(m => {
      const n = parseInt(m.id.replace('m', ''), 10);
      const duration = 60 + Math.floor((n - 1) / 10) * 15;
      return m.target > duration * (2.4 * 0.85 - 1.4);
    })
    .map(m => m.id + ' asks ' + m.target + 's')
    .join(', ')`);
  assert.equal(impossible, '', `Objectives that outlast their own mission: ${impossible}`);
});

test('mission text and mission target never drift apart', () => {
  const game = makeHarness();
  const mismatched = game.run(`missions
    .filter(m => /\\b(\\d+)\\s*(m|s)\\b/.test(m.subtitle) || /x(\\d+)/.test(m.subtitle))
    .filter(m => {
      const shown = (m.subtitle.match(/x(\\d+)/) || m.subtitle.match(/(\\d+)\\s*(?:m|s)\\b/) || [])[1];
      return shown !== undefined && Number(shown) !== m.target;
    })
    .map(m => m.id + ' says "' + m.subtitle + '" but targets ' + m.target)
    .join(' | ')`);
  assert.equal(mismatched, '', `Mission text disagrees with its target: ${mismatched}`);
});

test('the late combo missions are reachable at all', () => {
  const game = makeHarness();
  const impossible = game.run(`missions
    .filter(m => m.kind === MissionKind.COMBO_TARGET)
    .filter(m => m.target > 20)
    .map(m => m.id)
    .join(', ')`);
  assert.equal(impossible, '', `Missions ask for more combo than the game can reach: ${impossible}`);
});
