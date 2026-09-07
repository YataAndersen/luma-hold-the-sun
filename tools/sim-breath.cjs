'use strict';

// Simula a física do LUMA para medir o ritmo de subida em tempo de respiração.
// Uso: node tools/sim-breath.cjs
//
// Existe porque "parece calmo" e "as missões são alcançáveis" são perguntas diferentes,
// e a segunda é aritmética. Lê as constantes do index.html gerado, então mede o jogo que
// está publicado, não um número copiado à mão para cá.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function bloco(inicio, fim) {
  const de = source.indexOf(inicio);
  if (de === -1) throw new Error(`não achei: ${inicio}`);
  const ate = source.indexOf(fim, de + inicio.length);
  return source.slice(de, ate + fim.length);
}

const ctx = {};
vm.runInNewContext([
  bloco('  const tune = {', '\n  };'),
  bloco('  const gravityConfig = {', '\n  };'),
  bloco('  const sustainConfig = {', '\n  };'),
  bloco('  const pulseEnergyCost =', '\n'),
  bloco('  const breathConfig = {', '\n  };'),
  bloco('  const EMOTION_STATES = {', '\n  };'),
  'globalThis.C = { tune, gravityConfig, sustainConfig, pulseEnergyCost, breathConfig, EMOTION_STATES };',
].join('\n'), ctx);
const { tune, gravityConfig, sustainConfig, pulseEnergyCost, breathConfig, EMOTION_STATES } = ctx.C;

const METERS_PER_PIXEL = Number(/const METERS_PER_PIXEL = ([\d.]+)/.exec(source)[1]);

// Um ciclo: inspira segurando até encher, solta no ponto, e fica um instante SEM segurar
// antes de recomeçar. `atraso` = segundos segurando além do cheio, para medir o custo de
// prender a respiração.
//
// Duas coisas faltavam aqui e faziam esta função mentir por 2,4x — ela prometia 443m em
// 60s onde o jogo mede 182m:
//
// 1. A entropia estava fixa em 0,12, o valor do primeiro instante da corrida. No jogo ela
//    cresce 0,06/s subindo e 0,12/s caindo e SATURA em 1 nos primeiros ~15 segundos: a
//    gravidade real de quase toda corrida é 231, não 196. Com sustentação 260, a margem
//    cai de 64 para 29 — menos da metade da subida por respiração.
// 2. Não havia folga entre soltar e voltar a segurar. O gesto saía e a inspiração seguinte
//    começava no mesmo quadro, como se o dedo nunca deixasse a tela. Um segundo de queda
//    por ciclo, doze vezes por minuto, é a diferença que faltava.
//
// A lição é a mesma que já custou caro duas vezes neste projeto: um instrumento de medida
// também precisa ser medido. Os números abaixo foram conferidos contra o jogo rodando.
function simular({ segundos, atraso = 0, folga = 0.9, estado = 'flow' }) {
  const dt = 1 / 60;
  // O estado emocional multiplica gravidade, sustentação e a própria entropia, e a margem
  // entre segurar e cair é estreita o bastante para que isso decida a corrida: em `flow`
  // sobram 50 px/s² a favor, em `near_fail` sobram 22. Ignorar estes três números era o
  // terceiro motivo de esta função discordar do jogo.
  const fis = EMOTION_STATES[estado].physics;
  const encher = 1 / sustainConfig.energyRecovery; // ate o peito CHEIO, nao ate ficar pagavel

  let y = 0, vy = 0, energia = 1, strain = 0, t = 0, gestos = 0, pico = 0;
  let faseT = 0, expirando = 0, entropia = 0.12;

  while (t < segundos) {
    // Motor de entropia, igual ao de 14-gameplay.js: sobe sempre, mais depressa caindo.
    entropia = Math.min(1, entropia + (vy < 0 ? 0.06 : 0.12) * fis.entropyMul * dt);
    const gravidade = Math.min(
      gravityConfig.base * Math.pow(gravityConfig.progression, 0) + entropia * gravityConfig.entropy,
      gravityConfig.max) * fis.gravityMul;

    const segurando = expirando <= 0;

    if (segurando) {
      const cheio = energia >= 0.999;
      if (cheio) strain = Math.min(1, strain + dt / breathConfig.strainTime);
      else energia = Math.min(1, energia + sustainConfig.energyRecovery * dt);
      // Segurando: a sustentação morre conforme a respiração fica presa.
      const lift = sustainConfig.liftForce * fis.assistMul * (1 - strain * 0.6);
      vy += (gravidade - lift) * dt;
      faseT += dt;
      if (faseT >= encher + atraso && energia >= breathConfig.minBreath) {
        const fullness = Math.min(1, energia / 1);
        vy -= tune.clickImpulsePerfect * fis.assistMul * fullness * fullness * (1 - strain * breathConfig.strainImpulsePenalty);
        energia = 0;
        strain = 0;
        faseT = 0;
        gestos++;
        expirando = folga;   // o dedo sai da tela: nada sustenta durante a expiração
      }
    } else {
      // Expirando: sem sustentação. A tensão cede sozinha, como no jogo.
      strain = Math.max(0, strain - dt / breathConfig.strainRelease);
      vy += gravidade * dt;
      expirando -= dt;
    }

    vy = Math.min(vy, tune.maxFall);
    vy *= Math.pow(tune.damping, dt * 60);
    y -= vy * dt;
    pico = Math.max(pico, y);
    t += dt;
  }
  return { pixels: pico, metros: pico * METERS_PER_PIXEL, gestos, porGesto: pico / Math.max(1, gestos) };
}

// O tempo de cada missão, por faixa de dez. Fonte única: quem quiser saber quanto tempo
// uma missão dá tem que perguntar aqui, e não recalcular à mão.
function duracaoDaMissao(id) {
  const n = Number(String(id).slice(1));
  return 60 + Math.floor((n - 1) / 10) * 15;
}

// O teto realista de uma corrida bem respirada: `flow` é o estado em que um jogador que
// acerta o ritmo passa a maior parte da corrida. Medido no navegador, uma corrida de 60s
// chegou a 182m; esta função diz 178m. É o número contra o qual as metas de altitude devem
// ser escritas — nunca contra a soma dos impulsos, que ignora a gravidade e a expiração.
function tetoRealista(segundos) { return simular({ segundos }).metros; }

module.exports = { simular, tetoRealista, duracaoDaMissao,
  constantes: { tune, gravityConfig, sustainConfig, breathConfig, EMOTION_STATES, METERS_PER_PIXEL } };

if (require.main === module) {
  const encher = 1 / sustainConfig.energyRecovery; // ate o peito CHEIO, nao ate ficar pagavel
  console.log(`inspiração completa: ${encher.toFixed(1)}s`);
  console.log(`janela antes da tensão máxima: ${breathConfig.strainTime.toFixed(1)}s`);
  console.log(`ciclo do gesto: ~${(encher + breathConfig.strainTime / 2).toFixed(1)}s  (${(60 / (encher + breathConfig.strainTime / 2)).toFixed(0)} por minuto)`);
  console.log(`queda livre terminal: ${(Math.min(gravityConfig.base + 0.12 * gravityConfig.entropy, gravityConfig.max) / 0.9).toFixed(0)} px/s (teto ${tune.maxFall})`);
  console.log(`METERS_PER_PIXEL: ${METERS_PER_PIXEL}\n`);

  for (const segundos of [60, 90, 120]) {
    const bom = simular({ segundos });
    const apertado = simular({ segundos, estado: 'near_fail' });
    const preso = simular({ segundos, atraso: breathConfig.strainTime });
    console.log(`${segundos}s de jogo`);
    console.log(`   no ponto (flow):      ${bom.metros.toFixed(0)}m  (${bom.gestos} gestos, ${bom.porGesto.toFixed(0)}px cada)`);
    console.log(`   no ponto (near_fail): ${apertado.metros.toFixed(0)}m  — o piso a usar para dizer que uma missão é alcançável`);
    console.log(`   preso:                ${preso.metros.toFixed(0)}m  — ${(100 - preso.metros / bom.metros * 100).toFixed(0)}% a menos`);
  }
}
