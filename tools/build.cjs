'use strict';
// Reconstrói index.html a partir de src/. O jogo continua sendo UM arquivo só:
// abre com duplo clique, sem servidor, e sobe no itch.io como está.
//
//   node tools/build.cjs           reconstrói index.html
//   node tools/build.cjs --check   falha se index.html estiver fora de sincronia
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

const read = p => fs.readFileSync(p, 'utf8').replace(/\n$/, '');

const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'js', 'manifest.json'), 'utf8'));
const js = manifest.map(m => read(path.join(SRC, 'js', m.file))).join('\n');

// O jogo é um arquivo só: um erro de sintaxe derruba o IIFE inteiro e a tela fica congelada
// sem nada no console além de "Unexpected identifier". Melhor falhar aqui do que publicar.
// (Já aconteceu: uma tradução inseriu world's dentro de uma string com aspas simples.)
try {
  new Function(js);
} catch (err) {
  console.error('ERRO DE SINTAXE no JavaScript montado — index.html NAO foi gerado.');
  console.error(' ', err.message);
  const m = /line (\d+)/i.exec(err.stack || '');
  if (m) {
    const lines = js.split('\n');
    const n = Number(m[1]);
    for (let i = Math.max(0, n - 3); i < Math.min(lines.length, n + 2); i++) {
      console.error('  ' + (i + 1) + (i + 1 === n ? ' > ' : '   ') + lines[i].slice(0, 120));
    }
  }
  process.exit(1);
}

const html = [
  read(path.join(SRC, 'head.html')),
  '  <style>',
  read(path.join(SRC, 'styles.css')),
  '  </style>',
  '</head>',
  '<body>',
  read(path.join(SRC, 'body.html')),
  '<script>',
  '(() => {',
  js,
  '})();',
  '</script>',
  '</body>',
  '</html>',
].join('\n') + '\n';

if (process.argv.includes('--check')) {
  const current = fs.readFileSync(OUT, 'utf8');
  if (current === html) { console.log('index.html está em sincronia com src/'); process.exit(0); }
  console.error('index.html DIVERGE de src/. Rode: node tools/build.cjs');
  process.exit(1);
}

fs.writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
console.log(`index.html reconstruído a partir de ${manifest.length} módulos (${kb} KB)`);
