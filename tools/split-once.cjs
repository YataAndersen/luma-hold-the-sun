'use strict';
// Executado UMA vez para quebrar o index.html monolítico em src/.
// Os cortes são fatias sequenciais: a ordem original é preservada byte a byte,
// então o build reconstrói exatamente o mesmo arquivo.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const lines = src.split('\n'); // 0-indexed; linha N do editor = lines[N-1]

const slice = (from, to) => lines.slice(from - 1, to).join('\n'); // inclusivo

// Limites verificados no arquivo atual
const STYLE_OPEN = 11, STYLE_CLOSE = 671;   // <style> ... </style>
const BODY_OPEN = 673, BODY_CLOSE = 1060;   // <body> ... antes de <script>
const JS_OPEN = 1062, JS_CLOSE = 6400;      // (() => {  ...  })();

if (!lines[STYLE_OPEN - 1].includes('<style>')) throw new Error('style abre em outro lugar');
if (!lines[STYLE_CLOSE - 1].includes('</style>')) throw new Error('style fecha em outro lugar');
if (!lines[JS_OPEN - 1].includes('(() => {')) throw new Error('IIFE abre em outro lugar');
if (!lines[JS_CLOSE - 1].includes('})();')) throw new Error('IIFE fecha em outro lugar');

const MODULES = [
  ['00-shell.js',          1063, 1074, 'canvas, contexto e o pacto de engenharia'],
  ['01-analytics.js',      1075, 1163, 'telemetria opt-in'],
  ['02-settings.js',       1164, 1226, 'preferências, refs de UI, dimensões e helpers de matemática'],
  ['03-tuning.js',         1227, 1391, 'constantes de física, energia, vento, zonas e estados emocionais'],
  ['04-state.js',          1392, 1534, 'estado da partida e constantes musicais'],
  ['05-missions.js',       1535, 1734, 'graças, raridade, as 50 missões e os nós do mapa'],
  ['06-audio.js',          1735, 1996, 'motor de áudio e efeitos sonoros'],
  ['07-persistence.js',    1997, 2100, 'salvar, carregar e sincronizar progresso'],
  ['08-world-init.js',     2101, 2248, 'geração do cenário e decoração do mundo'],
  ['09-mission-flow.js',   2249, 2408, 'ciclo da missão: início, tarefas, conclusão'],
  ['10-run-lifecycle.js',  2409, 2851, 'começar, pausar, encerrar corrida, resultado e graças'],
  ['11-tutorial.js',       2852, 2936, 'tutorial em três capítulos'],
  ['12-particles.js',      2937, 3006, 'faíscas, poeira, anéis de pulso e aves'],
  ['13-input.js',          3007, 3134, 'ponteiro, teclado e o pulso'],
  ['14-gameplay.js',       3135, 3820, 'física do sol, entropia, resposta do mundo e HUD'],
  ['15-music.js',          3821, 3942, 'trilha dinâmica por estado emocional'],
  ['16-render-world.js',   3943, 4818, 'céu, montanhas, nuvens, cidade e vegetação'],
  ['17-render-entities.js',4819, 5275, 'sol, aves, partículas, aurora e cutscene'],
  ['18-loop.js',           5276, 5384, 'utilidades, resize e o laço principal'],
  ['19-ui-bindings.js',    5385, 5576, 'botões, configurações e gerenciamento de dados'],
  ['20-share.js',          5577, 5696, 'cartão de compartilhamento'],
  ['21-splash.js',         5697, 5761, 'abertura, história e consentimento'],
  ['22-map.js',            5762, 6350, 'Journey Map: nós, estrelas, scroll e painel'],
  ['23-boot.js',           6351, 6399, 'sons de UI, transição de entrada e service worker'],
];

// valida cobertura contínua e sem buracos
let cursor = 1063;
for (const [name, from, to] of MODULES) {
  if (from !== cursor) throw new Error(`${name}: esperava começar em ${cursor}, começa em ${from}`);
  if (to < from) throw new Error(`${name}: intervalo inválido`);
  cursor = to + 1;
}
if (cursor !== JS_CLOSE) throw new Error(`cobertura termina em ${cursor}, esperado ${JS_CLOSE}`);

const jsDir = path.join(ROOT, 'src', 'js');
fs.mkdirSync(jsDir, { recursive: true });

fs.writeFileSync(path.join(ROOT, 'src', 'styles.css'), slice(STYLE_OPEN + 1, STYLE_CLOSE - 1) + '\n');
fs.writeFileSync(path.join(ROOT, 'src', 'body.html'), slice(BODY_OPEN + 1, BODY_CLOSE) + '\n');
fs.writeFileSync(path.join(ROOT, 'src', 'head.html'), slice(1, STYLE_OPEN - 1) + '\n');

const manifest = [];
for (const [name, from, to, desc] of MODULES) {
  fs.writeFileSync(path.join(jsDir, name), slice(from, to) + '\n');
  manifest.push({ file: name, desc, linhas: to - from + 1 });
}
fs.writeFileSync(path.join(ROOT, 'src', 'js', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('separado em', MODULES.length, 'módulos');
for (const m of manifest) console.log(String(m.linhas).padStart(5), m.file, '—', m.desc);
