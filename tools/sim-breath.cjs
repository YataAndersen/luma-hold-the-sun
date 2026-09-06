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
  'globalThis.C = { tune, gravityConfig, sustainConfig, pulseEnergyCost, breathConfig };',
].join('\n'), ctx);
const { tune, gravityConfig, sustainConfig, pulseEnergyCost, breathConfig } = ctx.C;

const METERS_PER_PIXEL = Number(/const METERS_PER_PIXEL = ([\d.]+)/.exec(source)[1]);

// Um ciclo: inspira segurando até encher, solta no ponto. `atraso` = segundos segurando
// além do cheio, para medir o custo de prender a respiração.
function simular({ segundos, atraso = 0, entropia = 0.12 }) {
  const dt = 1 / 60;
  const gravidade = Math.min(
    gravityConfig.base * Math.pow(gravityConfig.progression, 0) + entropia * gravityConfig.entropy,
    gravityConfig.max);
  const encher = 1 / sustainConfig.energyRecovery; // ate o peito CHEIO, nao ate ficar pagavel

  let y = 0, vy = 0, energia = 1, strain = 0, t = 0, gestos = 0, pico = 0;
  let faseT = 0;

  while (t < segundos) {
    const cheio = energia >= 0.999;
    if (cheio) strain = Math.min(1, strain + dt / breathConfig.strainTime);
    else energia = Math.min(1, energia + sustainConfig.energyRecovery * dt);

    // Segurando: a sustentação morre conforme a respiração fica presa.
    const lift = sustainConfig.liftForce * (1 - strain * 0.6);
    vy += (gravidade - lift) * dt;

    faseT += dt;
    if (faseT >= encher + atraso && energia >= breathConfig.minBreath) {
      const fullness = Math.min(1, energia / 1);
      vy -= tune.clickImpulsePerfect * fullness * fullness * (1 - strain * breathConfig.strainImpulsePenalty);
      energia = 0;
      strain = 0;
      faseT = 0;
      gestos++;
    }

    vy = Math.min(vy, tune.maxFall);
    vy *= Math.pow(tune.damping, dt * 60);
    y -= vy * dt;
    pico = Math.max(pico, y);
    t += dt;
  }
  return { pixels: pico, metros: pico * METERS_PER_PIXEL, gestos, porGesto: pico / Math.max(1, gestos) };
}

const encher = 1 / sustainConfig.energyRecovery; // ate o peito CHEIO, nao ate ficar pagavel
console.log(`inspiração completa: ${encher.toFixed(1)}s`);
console.log(`janela antes da tensão máxima: ${breathConfig.strainTime.toFixed(1)}s`);
console.log(`ciclo do gesto: ~${(encher + breathConfig.strainTime / 2).toFixed(1)}s  (${(60 / (encher + breathConfig.strainTime / 2)).toFixed(0)} por minuto)`);
console.log(`queda livre terminal: ${(Math.min(gravityConfig.base + 0.12 * gravityConfig.entropy, gravityConfig.max) / 0.9).toFixed(0)} px/s (teto ${tune.maxFall})`);
console.log(`METERS_PER_PIXEL: ${METERS_PER_PIXEL}\n`);

for (const segundos of [60, 90, 120]) {
  const bom = simular({ segundos });
  const preso = simular({ segundos, atraso: breathConfig.strainTime });
  console.log(`${segundos}s de jogo`);
  console.log(`   no ponto:   ${bom.metros.toFixed(0)}m  (${bom.gestos} gestos, ${bom.porGesto.toFixed(0)}px cada)`);
  console.log(`   preso:      ${preso.metros.toFixed(0)}m  — ${(100 - preso.metros / bom.metros * 100).toFixed(0)}% a menos`);
}
