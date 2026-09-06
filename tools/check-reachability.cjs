'use strict';
// Verifica se cada uma das 50 missões é alcançável dentro do tempo que ela própria tem.
// Um objetivo impossível trava a jornada inteira, porque a progressão é linear.
//
//   node tools/check-reachability.cjs
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function block(startMark, endMark) {
  const a = src.indexOf(startMark);
  if (a === -1) throw new Error('não achei: ' + startMark);
  const b = src.indexOf(endMark, a + startMark.length);
  return src.slice(a, b + endMark.length);
}

const MissionKind = eval('(' + block('{ ABOVE_DAWN_LINE', '};').replace(/;$/, '') + ')');
const missions = eval(
  block('const HOLD_THE_SUN_MISSIONS = [', '\n  ];')
    .replace('const HOLD_THE_SUN_MISSIONS = ', '')
    .replace(/MissionKind\.(\w+)/g, (_, k) => JSON.stringify(MissionKind[k]))
    .replace(/;$/, '')
);

// Duração da missão, replicando resetMissionRunState
const durationOf = id => 60 + Math.floor((parseInt(id.replace('m', ''), 10) - 1) / 10) * 15;

// Tetos medidos/derivados. Os timers contínuos (precisão e dawn line) crescem 1x dentro da
// condição e decaem 1.4x fora, então acumulam acima de ~58% de permanência. Assumimos um
// jogador muito bom em 85% de permanência: taxa líquida de 2.4*0.85 - 1.4 = 0.64/s.
const NET_RATE_GOOD_PLAYER = 2.4 * 0.85 - 1.4;
const COMBO_CAP = 20;

const limits = {
  // combo: teto absoluto do jogo
  combo_target: () => COMBO_CAP,
  // timers contínuos: o que a taxa líquida acumula na duração da missão
  stability_time: id => durationOf(id) * NET_RATE_GOOD_PLAYER,
  above_dawn_line: id => durationOf(id) * NET_RATE_GOOD_PLAYER,
  // altitude e aves não têm teto rígido: escalam com o tempo de voo
  reach_altitude: () => Infinity,
  birds_this_run: () => Infinity,
  survive_time: id => durationOf(id),
  avoid_near_fail: () => Infinity,
};

const rows = [];
for (const m of missions) {
  const cap = (limits[m.kind] || (() => Infinity))(m.id);
  const dur = durationOf(m.id);
  const ok = m.target <= cap;
  rows.push({ id: m.id, kind: m.kind, target: m.target, dur, cap: cap === Infinity ? '—' : cap.toFixed(1), ok });
}

const bad = rows.filter(r => !r.ok);
const timed = rows.filter(r => r.kind === 'stability_time' || r.kind === 'above_dawn_line');

console.log('duração por missão: m1-10 60s · m11-20 75s · m21-30 90s · m31-40 105s · m41-50 120s');
console.log('teto assumido para timers contínuos: ' + NET_RATE_GOOD_PLAYER.toFixed(2) + 's por segundo de missão (permanência de 85%)\n');
console.log('objetivos com teto (precisão e dawn line):');
for (const r of timed) {
  console.log('  ' + (r.ok ? 'ok  ' : 'FALHA') + ' ' + r.id.padEnd(4) + r.kind.padEnd(17) +
    'pede ' + String(r.target).padStart(3) + 's   em missão de ' + r.dur + 's   teto ' + r.cap + 's');
}

if (bad.length) {
  console.log('\n' + bad.length + ' MISSÃO(ÕES) INALCANÇÁVEL(EIS): ' + bad.map(r => r.id).join(', '));
  process.exit(1);
}
console.log('\nTodas as 50 missões são alcançáveis.');
