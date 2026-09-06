'use strict';

// Varredura de tradução: cruza o que o jogo mostra com o que os dicionários sabem.
// Uso: node tools/sweep-i18n.cjs
//
// Responde três perguntas que os testes não respondem sozinhos:
//   1. quais textos passam por t() mas nenhum dicionário conhece  -> aparecem em inglês
//   2. quais chaves os dicionários carregam sem ninguém usar      -> peso morto
//   3. quais textos vão para a tela sem passar por t()            -> nunca traduzem
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const jsDir = path.join(raiz, 'src', 'js');
const arquivos = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

const fonte = new Map();
for (const f of arquivos) fonte.set(f, fs.readFileSync(path.join(jsDir, f), 'utf8').replace(/\r\n/g, '\n'));
const body = fs.readFileSync(path.join(raiz, 'src', 'body.html'), 'utf8').replace(/\r\n/g, '\n');

// --- dicionários -----------------------------------------------------------
const i18n = fonte.get('02b-i18n.js');
const dicts = (() => {
  const de = i18n.indexOf('const LOCALES = {');
  const ate = i18n.indexOf('\n  };', de);
  const bloco = i18n.slice(de, ate + 4);
  const ctx = {};
  new (require('node:vm').Script)(bloco + '\nglobalThis.__d = LOCALES;').runInNewContext(ctx);
  return ctx.__d;
})();
const referencia = new Set(Object.keys(dicts['pt-BR']));

// --- 1. chaves pedidas em código ------------------------------------------
// Só literais: t(variavel) é resolvido em runtime e checado à parte.
const usadas = new Set();
const dinamicas = [];
for (const [f, s] of fonte) {
  if (f === '02b-i18n.js') continue;
  for (const m of s.matchAll(/\bt\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*\)/g)) {
    usadas.add(m[2].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  for (const m of s.matchAll(/\bt\(\s*([A-Za-z_$][\w.$\[\]]*)\s*\)/g)) {
    const linha = s.slice(0, m.index).split('\n').length;
    dinamicas.push(`${f}:${linha}  t(${m[1]})`);
  }
}
// O DOM entrega textContent já decodificado, então a chave real é "&", não "&amp;".
const decodificar = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
for (const m of body.matchAll(/data-i18n(?:-title)?[^>]*>([^<]+)</g)) {
  const texto = decodificar(m[1].trim());
  if (texto) usadas.add(texto);
}

// t(node.title), t(grace.desc) e afins: os textos moram nas tabelas de dados.
// Sem isso o relatório acusa de órfã toda chave alcançada por variável.
const dados = new Set();
for (const nome of ['05-missions.js']) {
  const s = fonte.get(nome);
  if (!s) continue;
  for (const m of s.matchAll(/\b(title|subtitle|toast|main|perf|desc|flavor|nodeMeta)\s*:\s*(['"])((?:(?!\2)[^\\]|\\.)*)\2/g)) {
    dados.add(m[3].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  for (const m of s.matchAll(/\bsubs\s*:\s*\[([^\]]*)\]/g)) {
    for (const item of m[1].matchAll(/(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) dados.add(item[2]);
  }
}
// Rótulos de estado do mapa: t(node.state) recebe um destes quatro.
for (const estado of ['current', 'completed', 'available', 'locked']) dados.add(estado);


// --- 2. literais que vão para a tela sem t() ------------------------------
const cru = [];
for (const [f, s] of fonte) {
  if (f === '01-analytics.js') continue; // painel de debug, não é UI de jogador
  s.split('\n').forEach((linha, i) => {
    const alvo = /\.(textContent|innerText|innerHTML)\s*=\s*(.+)$/.exec(linha);
    if (!alvo) return;
    const valor = alvo[2];
    if (/\bt\(/.test(valor)) return;                       // já traduzido
    const temFrase = /(['"`])[^'"`]*[A-Za-z]{3}[^'"`]*\1/.test(valor);
    if (!temFrase) return;
    if (/^\s*(['"`])<(span|div)\b/.test(valor)) return;    // markup de ícone
    cru.push(`${f}:${i + 1}  ${linha.trim().slice(0, 96)}`);
  });
}

// --- relatório -------------------------------------------------------------
// Decisão de localização registrada em 02b-i18n.js: os nomes das missões ficam em inglês
// em todos os idiomas, como topônimos do mundo ("Still Night", "Lyra"). Os toasts e os
// rótulos de bioma NÃO entram aqui — são frases e descritores, e devem traduzir.
const nomesProprios = new Set();
{
  const s = fonte.get('05-missions.js') || '';
  for (const m of s.matchAll(/\btitle\s*:\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) nomesProprios.add(m[2]);
}

// Padrões numéricos: "Reach 350m." é atendido pela chave "Reach {n}m.".
const temPadrao = chave => referencia.has(String(chave).replace(/\d+/g, '{n}'));
const alcancaveis = new Set([...usadas, ...dados]);
const faltando = [...alcancaveis]
  .filter(k => !referencia.has(k) && !temPadrao(k) && !nomesProprios.has(k))
  .sort();
const orfas = [...referencia].filter(k => !alcancaveis.has(k) && !k.includes('{n}')).sort();

const secao = (titulo, itens, nota) => {
  console.log(`\n${titulo}: ${itens.length}`);
  if (nota && itens.length) console.log(`  ${nota}`);
  for (const i of itens) console.log('  ' + i);
};

console.log(`dicionários: ${Object.keys(dicts).filter(c => dicts[c]).length} idiomas, ${referencia.size} chaves de referência`);
console.log(`${nomesProprios.size} nomes de missão ficam em inglês por decisão de design`);
secao('SEM TRADUÇÃO (pedidas em código, ausentes do dicionário)', faltando, 'estas saem em inglês em todos os idiomas');
secao('ÓRFÃS (traduzidas, nunca pedidas)', orfas, 'peso morto no bundle, ou chave usada via variável');
secao('FORA DO t() (vão para a tela cruas)', cru, 'nunca traduzem, em nenhum idioma');
secao('CHAVES DINÂMICAS (t(variavel) — confira o conteúdo à mão)', dinamicas);

const falhou = faltando.length || cru.length;
console.log(`\n${falhou ? 'PENDÊNCIAS ENCONTRADAS' : 'tudo coberto'}`);
process.exitCode = falhou ? 1 : 0;
