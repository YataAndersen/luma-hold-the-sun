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
    between('  const breathConfig = {', '\n  };'),
    functionSource('maxBreath'),
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

// Uma respiração inteira: encher o fôlego e soltar no ponto. É a unidade de jogo agora,
// e é o que estes testes usam no lugar de "mais um toque".
function breatheOnce(game) {
  game.state.t += game.run('1 / sustainConfig.energyRecovery');
  game.run('state.sun.energy = 1; state.sun.strain = 0');
  game.context.tryClickImpulse();
}

test('14 well-judged breaths reach the late mission combo target', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  for (let i = 0; i < 14; i++) breatheOnce(game);
  assert.equal(game.state.combo, 14);
  assert.equal(game.state.maxComboThisRun, 14);
  assert.equal(game.effects.pulses, 14);
  assert.equal(game.run('evaluateLiveCondition(getReqForMission(missions.find(m => m.id === "m47")))'), true);
});

test('one breath buys exactly one gesture: the game runs at breathing tempo', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.run('state.sun.energy = 1');
  // Dez tentativas seguidas, com folga de cooldown entre elas: o fôlego, não o dedo,
  // é quem limita. Se algum dia um fôlego cheio comprar dois gestos, o jogo voltou
  // para a frequência do Flappy Bird e este teste avisa.
  for (let i = 0; i < 10; i++) {
    game.state.t += 0.5;
    game.context.tryClickImpulse();
  }
  assert.equal(game.effects.pulses, 1, 'A full breath must buy one gesture, not a burst');
});

test('holding past full weakens the gesture and denies the combo', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;

  // Fôlego cheio, solto no ponto: impulso inteiro e combo creditado.
  game.run('state.sun.energy = 1; state.sun.strain = 0; state.sun.vy = 0');
  game.state.t += 5;
  game.context.tryClickImpulse();
  const noPonto = -game.state.sun.vy;
  assert.equal(game.state.combo, 1, 'A well-judged breath builds rhythm');

  // Mesmo fôlego, mas preso até o limite: impulso menor e sem combo.
  game.run('state.sun.energy = 1; state.sun.strain = 1; state.sun.vy = 0');
  game.state.t += 5;
  game.context.tryClickImpulse();
  const preso = -game.state.sun.vy;

  assert.ok(preso < noPonto, `Prender a respiração deve custar impulso: ${preso} deveria ser menor que ${noPonto}`);
  assert.equal(game.state.combo, 1, 'Um gesto com a respiração presa não constrói ritmo');
});

test('a sun with no breath left refuses the gesture instead of faking one', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.run('state.sun.energy = breathConfig.minBreath - 0.01');
  game.state.t = 5;
  game.context.tryClickImpulse();
  assert.equal(game.effects.pulses, 0, 'With no air there is nothing to release');
  assert.equal(game.state.combo, 0, 'A refused gesture must not build rhythm');
  assert.equal(game.run('state.sun.energy'), game.run('breathConfig.minBreath - 0.01'), 'A refused gesture costs nothing');
});

test('releasing early is allowed and wastes the breath: haste punishes itself', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;

  // Meio fôlego: o gesto sai, mas rende bem menos que a metade — a curva é quadrática.
  game.run('state.sun.energy = 0.5 * maxBreath(); state.sun.strain = 0; state.sun.vy = 0');
  game.state.t += 5;
  game.context.tryClickImpulse();
  const meio = -game.state.sun.vy;
  assert.equal(game.effects.pulses, 1, 'Releasing early must be allowed, not blocked');
  assert.equal(game.run('state.sun.energy'), 0, 'Releasing early still empties the chest');

  game.run('state.sun.energy = maxBreath(); state.sun.strain = 0; state.sun.vy = 0');
  game.state.t += 5;
  game.context.tryClickImpulse();
  const cheio = -game.state.sun.vy;

  assert.ok(meio < cheio * 0.35,
    `Meio fôlego deveria render bem menos de um terço: ${meio.toFixed(0)} contra ${cheio.toFixed(0)}`);
});

test('sustaining is the only thing that pays for the next gesture', () => {
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;
  game.run('state.sun.energy = 1');
  game.state.t += 5;
  game.context.tryClickImpulse();
  assert.equal(game.effects.pulses, 1);

  // Sem sustentar, nenhum tempo de espera devolve o gesto.
  game.state.t += 30;
  game.context.tryClickImpulse();
  assert.equal(game.effects.pulses, 1, 'Waiting must never refill the breath by itself');

  // Uma inspiração inteira devolve, e só ela.
  breatheOnce(game);
  assert.equal(game.effects.pulses, 2);
});

test('a breath takes about as long as a calm inhale', () => {
  const game = makeHarness();
  const segundos = game.run('pulseEnergyCost / sustainConfig.energyRecovery');
  // A âncora do projeto: o gesto tem que caber num ritmo respiratório (~12/min), não
  // na frequência do dedo. Fora desta faixa o jogo deixa de acalmar.
  assert.ok(segundos >= 3 && segundos <= 7,
    `Um gesto leva ${segundos.toFixed(1)}s; fora da faixa respiratória de 3 a 7s`);
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
  test(`${code} inhales while held and only releases the gesture on key up`, () => {
    const game = makeHarness({ keyboard: true });

    // Pressionar é inspirar: segura, e NÃO gasta o fôlego.
    game.key('keydown', code);
    assert.equal(game.effects.pulses, 0, 'Pressing must inhale, not exhale');
    assert.equal(game.state.input.holding, true);

    // O auto-repeat do sistema mantém o sustain e não vira gesto nenhum.
    for (let i = 0; i < 5; i++) {
      game.state.t += 0.5;
      game.key('keydown', code, true);
    }
    assert.equal(game.effects.pulses, 0, 'Auto-repeat must never fire a gesture');
    assert.equal(game.state.input.holding, true);

    // Soltar é o gesto. Esta é a regra que o tutorial promete ao jogador.
    game.run('state.sun.energy = 1');
    game.key('keyup', code);
    assert.equal(game.effects.pulses, 1, 'Releasing is the gesture');
    assert.equal(game.state.input.holding, false);

    // Soltar sem estar segurando não inventa gesto.
    game.key('keyup', code);
    assert.equal(game.effects.pulses, 1, 'A release with nothing held does nothing');
  });
}

test('touch and keyboard release the gesture the same way', () => {
  // O tutorial diz "the light is full, release it now" — se o pulso saísse ao encostar,
  // soltar não faria nada e o jogo estaria mentindo para o jogador. Já esteve.
  const disparaAoSoltar = /function pointerUp[\s\S]{0,240}?tryClickImpulse\(\)/.test(source);
  const naoDisparaAoEncostar = !/function pointerDown\(e\) \{[\s\S]*?tryClickImpulse\(\)[\s\S]*?\n  \}/.test(
    source.slice(source.indexOf('function pointerDown'), source.indexOf('function pointerMove')));
  assert.ok(disparaAoSoltar, 'pointerUp deve disparar o gesto');
  assert.ok(naoDisparaAoEncostar, 'pointerDown não pode disparar o gesto: encostar é inspirar');
});

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

test('every altitude mission is reachable at the pace the physics actually allows', () => {
  // Este teste passava com as 18 missões impossíveis. Ele somava os impulsos dos gestos e
  // ignorava três coisas: a entropia, que leva a gravidade de 190 a 240 nos primeiros
  // quinze segundos de QUALQUER corrida; a expiração, em que nada sustenta o sol; e os
  // multiplicadores do estado emocional. Prometia 443m em 60s onde o jogo entrega 182m.
  //
  // Agora ele chama o mesmo simulador da ferramenta, que foi conferido contra o navegador
  // (178m previstos, 182m medidos). Um teste e uma ferramenta que discordam do jogo pelo
  // mesmo motivo não são duas verificações: são a mesma suposição, escrita duas vezes.
  const sim = require('../tools/sim-breath.cjs');
  const game = makeHarness();

  const alvos = Array.from(game.run(`missions
    .filter(m => m.kind === MissionKind.REACH_ALTITUDE)
    .map(m => m.id + ':' + m.target)`));

  const impossiveis = alvos
    .map(linha => linha.split(':'))
    .map(([id, target]) => [id, Number(target), sim.duracaoDaMissao(id)])
    .filter(([, target, tempo]) => target > sim.tetoRealista(tempo))
    .map(([id, target, tempo]) => `${id} pede ${target}m em ${tempo}s (teto real: ${Math.round(sim.tetoRealista(tempo))}m)`)
    .join(' | ');

  assert.equal(impossiveis, '',
    `Missões de altitude acima do que a física entrega: ${impossiveis}`);
});

test('the altitude curve leaves room for a player who is not a metronome', () => {
  // Alcançável não basta: uma meta em 98% do teto exige respirar como um relógio por dois
  // minutos inteiros. O alvo é ficar abaixo de 80% do que a corrida perfeita entrega.
  const sim = require('../tools/sim-breath.cjs');
  const game = makeHarness();
  const apertadas = Array.from(game.run(`missions
    .filter(m => m.kind === MissionKind.REACH_ALTITUDE)
    .map(m => m.id + ':' + m.target)`))
    .map(l => l.split(':'))
    .map(([id, target]) => [id, Number(target), sim.tetoRealista(sim.duracaoDaMissao(id))])
    .filter(([, target, teto]) => target > teto * 0.8)
    .map(([id, target, teto]) => `${id}: ${target}m é ${Math.round(target / teto * 100)}% do teto`)
    .join(' | ');
  assert.equal(apertadas, '', `Metas sem folga para erro humano: ${apertadas}`);
});

test('the altitude curve only ever goes up', () => {
  const game = makeHarness();
  const seq = Array.from(game.run(`missions
    .filter(m => m.kind === MissionKind.REACH_ALTITUDE)
    .map(m => m.id + ':' + m.target)`)).map(l => l.split(':'));
  const quedas = seq
    .filter((par, i) => i > 0 && Number(par[1]) <= Number(seq[i - 1][1]))
    .map((par, i) => `${par[0]} pede ${par[1]}m`)
    .join(' | ');
  assert.equal(quedas, '', `A curva de altitude anda para trás: ${quedas}`);
});

// --- O fôlego só pode encher pelo gesto -------------------------------------
// Estes três testes existem porque a mesma regressão apareceu duas vezes: uma fonte de
// energia que não era o jogador segurando. Quando isso acontece o anel já nasce cheio, a
// tensão começa no instante do toque, e o jogador vê o sol descer enquanto segura — sem
// nada na tela explicando. Nenhum teste anterior pegava isso.

test('the passive trickle only lifts the breath off zero, never fills it', () => {
  const trecho = between('const respiroDeCortesia', '\n        }');
  const teto = /clamp\(state\.sun\.energy \+ [\d.]+ \* dt, 0, ([A-Za-z]+)\)/.exec(trecho);
  assert.notEqual(teto, null, 'O gotejamento passivo mudou de forma; reveja o teto dele.');
  assert.equal(teto[1], 'respiroDeCortesia',
    'O gotejamento passivo voltou a encher até o topo: o anel nasce cheio e ninguém vê nada encher.');

  const game = makeHarness();
  const cortesia = game.run('breathConfig.minBreath * 2');
  assert.ok(cortesia < 0.35,
    `O respiro de cortesia (${cortesia}) chegou perto do cheio; o gesto deixa de ser necessário.`);
});

test('nothing outside the gesture pins the breath at full', () => {
  const cheios = source.split('\n')
    .map((linha, i) => [i + 1, linha])
    .filter(([, linha]) => /state\.sun\.energy\s*=\s*(1(\.0+)?|maxEnergy|maxBreath\(\))\s*;/.test(linha))
    .map(([n, linha]) => `${n}: ${linha.trim()}`)
    .join(' | ');
  assert.equal(cheios, '',
    `Alguém voltou a fixar o fôlego no cheio — energia infinita: ${cheios}`);
});

test('a run starts with an empty enough chest that the first breath is breathed', () => {
  const inicial = /state\.sun\.energy = ([\d.]+); state\.sun\.wear/.exec(source);
  assert.notEqual(inicial, null, 'Não achei a energia inicial em resetRun.');
  assert.ok(Number(inicial[1]) <= 0.35,
    `A corrida começa com ${inicial[1]} de fôlego: o jogador solta um gesto pronto sem ter respirado.`);
});

test('the combo the player sees is always a whole number of breaths', () => {
  // A tela de resultado chegou a mostrar "Max Combo: x2.95992000000000007". O combo decai
  // continuamente quando o jogador sai do ritmo (14-gameplay.js), e somar 1 a um valor já
  // corroído produzia fração — que vazava para o texto E para as metas, onde "combo x6"
  // passava a exigir sete gestos sem avisar.
  const game = makeHarness();
  game.state.input.x = game.state.sun.x;
  game.state.input.y = game.state.sun.y + game.state.camera.y;

  const respirar = () => {
    game.run('state.sun.energy = 1; state.sun.strain = 0; state.sun.vy = 0');
    game.state.t += 5;
    game.context.tryClickImpulse();
  };

  // Cinco respirações no ritmo: sem decaimento, valem exatamente cinco.
  for (let i = 0; i < 5; i++) respirar();
  assert.equal(game.state.combo, 5,
    `Cinco gestos no ritmo valem cinco de combo, não ${game.state.combo}`);

  // Agora o jogador sai do ritmo e o combo se desgasta para um valor quebrado — como
  // acontece no jogo. O gesto seguinte tem que devolver um inteiro assim mesmo.
  game.run('state.combo = 4.37');
  respirar();
  assert.ok(Number.isInteger(game.state.combo),
    `O combo virou fração depois de decair: ${game.state.combo}`);
  assert.ok(Number.isInteger(game.state.maxComboThisRun),
    `O combo máximo guardado virou fração: ${game.state.maxComboThisRun}`);
});

// --- O topo da tela não pode se sobrepor -------------------------------------
// O painel de objetivos tinha largura fixa de 183px e o anel do tempo é centrado. Numa tela
// de 420px o painel invadia o anel em 23px; numa de 360px, em 53px — cobrindo o mostrador
// inteiro. E como o painel tem z-index 45 contra 40 do anel, quem sumia era o anel.
// Nenhum teste pegou isso: o Yata pegou, jogando. Este faz a conta que faltava.

function regraCSS(seletor) {
  const de = source.indexOf(seletor + ' {');
  assert.notEqual(de, -1, `Regra CSS ausente: ${seletor}`);
  return source.slice(de, source.indexOf('}', de));
}

// Resolve um valor CSS simples — px, vw, e calc() com somas e subtrações — numa largura dada.
function emPixels(valor, largura) {
  const expr = valor.trim().replace(/^calc\(/, '(');
  const contas = expr.replace(/([\d.]+)vw/g, (_, n) => `(${n} * ${largura} / 100)`)
                     .replace(/([\d.]+)px/g, '$1');
  assert.match(contas, /^[-+*/()\d.\s]+$/, `Não sei resolver este valor CSS: ${valor}`);
  return Function(`"use strict"; return (${contas});`)();
}

test('the objectives panel can never reach the timer ring, at any screen width', () => {
  const tracker = regraCSS('.live-mission-tracker');
  const esquerda = /left:\s*max\(([\d.]+)px/.exec(tracker);
  const teto = /max-width:\s*([^;]+);/.exec(tracker);
  assert.notEqual(esquerda, null, 'O tracker perdeu o recuo da esquerda.');
  assert.notEqual(teto, null,
    'O tracker perdeu o max-width — sem ele a largura volta a ser livre e ele invade o anel.');

  const anel = regraCSS('.ring-svg');
  const larguraAnel = Number(/width:\s*([\d.]+)px/.exec(anel)[1]);

  const apertadas = [320, 360, 390, 414, 420, 480, 768, 1024, 1440]
    .map(largura => {
      // O anel é centrado: .celestial-hud usa left:50% com translateX(-50%).
      const bordaDireitaDoPainel = Number(esquerda[1]) + emPixels(teto[1], largura);
      const bordaEsquerdaDoAnel = largura / 2 - larguraAnel / 2;
      return [largura, Math.round(bordaEsquerdaDoAnel - bordaDireitaDoPainel)];
    })
    .filter(([, folga]) => folga < 8)
    .map(([largura, folga]) => `${largura}px: folga de ${folga}px`)
    .join(' | ');

  assert.equal(apertadas, '',
    `O painel de objetivos encosta ou invade o anel do tempo: ${apertadas}`);
});

test('during play the objectives are marks, never a block of text', () => {
  // O painel de texto foi tentado duas vezes e nas duas ficou apertado: primeiro invadindo
  // o anel do tempo, depois estreito e quebrando em três linhas. O modelo agora é o do Tiny
  // Thief — detalhe antes de jogar, marcas durante, frase só na conquista, detalhe de novo
  // no fim. Ler é atividade de antes e de depois; durante, o olho só precisa de um relance.
  assert.match(source, /\.live-mission-tracker \.tracker-title,\s*\n\s*\.live-mission-tracker \.tracker-item \{ display: none; \}/,
    'Os itens de texto voltaram a aparecer no HUD durante a partida.');

  const hud = functionSource('updateHUD');
  assert.match(hud, /tMarkSub1/, 'As marcas sumiram do HUD.');
  assert.doesNotMatch(hud, /ui\.tTextSub1\.textContent/,
    'O HUD voltou a escrever texto de objetivo durante a partida.');
});

// Linhas de código, sem comentários: um comentário que EXPLICA a remoção de uma chamada não
// pode fazer o teste acusar que a chamada voltou. Foi o que aconteceu na primeira versão
// deste teste — ele leu a própria justificativa da correção como se fosse a regressão.
function codigoSemComentarios() {
  return source
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');
}

test('one event produces one message, not three', () => {
  // O instante em que uma tarefa é cumprida chegou a disparar três coisas ao mesmo tempo:
  // um toast nomeando a tarefa (25% da altura), um showFloating genérico "task complete"
  // (80%) e uma frase no canto superior esquerdo. Três alturas, uma notícia só.
  // Ficou o toast, que nomeia; o HUD faz a parte periférica, acendendo a marca.
  const codigo = codigoSemComentarios();
  assert.doesNotMatch(codigo, /showFloating\("task complete"/,
    'Voltou a mensagem genérica junto do toast que já nomeia a tarefa.');
  assert.doesNotMatch(codigo, /trackerReveal/,
    'Voltou a terceira mensagem para o mesmo evento.');

  const hud = functionSource('updateHUD');
  const opacidades = Array.from(hud.matchAll(/ui\.tracker\.style\.opacity = ([^;]+);/g)).map(m => m[1]);
  assert.ok(opacidades.length > 0, 'Ninguém mais controla a opacidade do tracker.');
  for (const expr of opacidades) {
    assert.ok(!/0\.\d/.test(expr), `O tracker voltou a ter opacidade fantasma: ${expr}`);
  }
});

test('a condition that is already true at the start does not celebrate itself', () => {
  // "zero quase-quedas" é verdade no primeiro quadro: ninguém caiu ainda. Sem a semeadura,
  // a partida abria comemorando uma conquista que o jogador não fez.
  const hud = functionSource('updateHUD');
  assert.match(hud, /state\.hud\.marcasSemeadas/,
    'A guarda contra comemorar o que já nascia verdadeiro sumiu.');
  assert.match(hud, /feito && !antes && state\.hud\.marcasSemeadas/,
    'O pulso da marca voltou a disparar no primeiro quadro.');
});

test('a mark lights once when won, instead of pulsing forever', () => {
  // A versão anterior animava as quatro linhas num laço de 4s, fora de fase, o tempo todo.
  // Movimento periférico contínuo é o oposto do que um jogo de respiração quer.
  assert.doesNotMatch(source, /animation:\s*taskWave/, 'Voltou a animação em laço das tarefas.');
  const marca = regraCSS('.t-mark.acabou-de-acender');
  assert.match(marca, /animation:\s*marcaAcesa/);
  assert.doesNotMatch(marca, /infinite/, 'O pulso da conquista virou laço.');
});

test('the result screen brings the objectives back in full, with their state', () => {
  // Três estrelas sem lista deixavam o jogador sem saber QUAL objetivo faltou.
  const mostrar = functionSource('showResult');
  assert.match(mostrar, /resultObjectives/,
    'A tela de resultado parou de listar os objetivos.');
  assert.match(mostrar, /estadoDosObjetivos/,
    'A lista do resultado voltou a calcular o estado por conta própria, em vez de ler a fonte única.');
});

test('whatever hides the objectives panel writes the same channel that shows it', () => {
  // .hidden zera a opacidade pelo CSS, mas o ramo de gameplay escreve style.opacity inline —
  // e inline vence classe. Bastava a partida ter começado uma vez para o painel continuar
  // aceso por cima do tutorial e atrás da tela de resultado.
  const hud = functionSource('updateHUD');
  const definicao = /const esconderTracker = \(\) => \{[^}]*\};/.exec(hud);
  assert.notEqual(definicao, null, 'O caminho único de esconder o tracker sumiu.');
  assert.match(definicao[0], /classList\.add\('hidden'\)/);
  assert.match(definicao[0], /style\.opacity = '0'/,
    'Esconder voltou a mexer só na classe, que a opacidade inline anula.');

  // Fora dessa definição, ninguém mais pode esconder o tracker pela classe.
  const resto = hud.replace(definicao[0], '');
  const soltas = Array.from(resto.matchAll(/ui\.tracker\.classList\.add\('hidden'\)/g));
  assert.equal(soltas.length, 0,
    'Alguém voltou a esconder o tracker só pela classe, por fora de esconderTracker().');
});

test('the third star is hard but reachable, in altitude and in combo', () => {
  // A curva principal foi reescalada e as condições de PERFEIÇÃO ficaram para trás: dez
  // delas ainda pediam altitudes de antes ("Reach 690m" numa corrida cujo teto é 387m).
  // A terceira estrela de dez missões era inalcançável, e o teste de alcançabilidade não
  // olhava para lá — ele só media o objetivo principal. Quem achou foi o varredor de i18n,
  // por acidente, ao listar esses textos como traduções faltando.
  const sim = require('../tools/sim-breath.cjs');
  const game = makeHarness();

  const perfs = Array.from(game.run(`MAP_NODES.map(n => n.id + '|' + n.perf + '|' + n.req.perf.join(','))`))
    .map(l => l.split('|'));

  const problemas = [];
  for (const [id, texto, req] of perfs) {
    const [campo, alvo] = req.split(',');
    const tempo = sim.duracaoDaMissao(id);
    if (campo === 'score') {
      const teto = sim.tetoRealista(tempo);
      if (Number(alvo) > teto * 0.9) {
        problemas.push(`${id} pede "${texto}" em ${tempo}s (teto real: ${Math.round(teto)}m)`);
      }
    }
    if (campo === 'combo' && Number(alvo) > 20) {
      problemas.push(`${id} pede "${texto}", acima do teto de combo do jogo`);
    }
  }
  assert.equal(problemas.join(' | '), '',
    `Condições de perfeição fora do alcance: ${problemas.join(' | ')}`);
});

test('every perfection condition says exactly what it measures', () => {
  // "Clean run" e "Flawless run" não descrevem nada verificável. getPerfObjective() já as
  // traduzia para nearFails==0, mas o texto na tabela seguia vago — e quem lesse a tabela
  // acreditaria numa regra que não existe. O campo agora diz a condição.
  const game = makeHarness();
  const vagas = Array.from(game.run(`missions
    .map(m => m.id + '|' + m.perfectText)
    .filter(l => !/\\|(zero near-fails|reach \\d+m|max combo x\\d+)$/.test(l))`)).join(' | ');
  assert.equal(vagas, '', `Perfeição descrita de forma não verificável: ${vagas}`);
});
