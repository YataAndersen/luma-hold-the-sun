'use strict';

// Imprime o color script dos 50 rituais lido do index.html gerado.
// Uso: node tools/check-color-script.cjs
//
// Um color script se revisa OLHANDO a progressao inteira, nunca cena a cena. Esta
// ferramenta existe porque "a cor ficou bonita nesta missao" e uma pergunta diferente de
// "a jornada tem arco", e so a segunda importa para direcao de arte.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const bloco = (ini, fim) => {
  const de = source.indexOf(ini);
  if (de === -1) throw new Error('nao achei: ' + ini);
  const ate = source.indexOf(fim, de + ini.length);
  return source.slice(de, ate + fim.length);
};

const ctx = {};
vm.runInNewContext([
  'const clamp = (v, a, b) => Math.max(a, Math.min(b, v));',
  bloco('  function scriptCromatico(', '\n  }'),
  bloco('  function aplicarScript(', '\n  }'),
  'globalThis.S = scriptCromatico; globalThis.A = aplicarScript;',
].join('\n'), ctx);

const biomas = [...source.matchAll(/id: '(m\d+)'[^\n]*?biome: '(\w+)'/g)].map(m => m[2]);

const barra = (v, max, largura = 22) => {
  const n = Math.round(clampN(v / max, 0, 1) * largura);
  return '#'.repeat(n) + '.'.repeat(largura - n);
};
function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }

console.log('ritual  bioma        calor                   croma                   valor');
let anterior = null;
const saltos = [];
for (let n = 1; n <= 50; n++) {
  const s = ctx.S('m' + n);
  if (anterior && Math.abs(s.calor - anterior.calor) > 0.15) saltos.push(n);
  anterior = s;
  console.log(
    String(n).padStart(4) + '  ' + (biomas[n - 1] || '?').padEnd(11) +
    ' ' + barra(s.calor, 1) + '  ' + barra(s.croma, 1.2) + '  ' + barra(s.valor, 1.7));
}

console.log('\nquebras de temperatura entre vizinhos:', saltos.join(', ') || 'nenhuma');
console.log('faixa de calor:', ctx.S('m1').calor.toFixed(2), '->', ctx.S('m50').calor.toFixed(2));
console.log('faixa de valor:', ctx.S('m1').valor.toFixed(2), '->', ctx.S('m50').valor.toFixed(2));

// Um arco sem quebra e um degrade, nao um script.
if (!saltos.length) {
  console.log('\nAVISO: nenhuma quebra de temperatura. Uma rampa monotona nao e color script.');
  process.exitCode = 1;
}
