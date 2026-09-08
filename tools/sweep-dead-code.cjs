'use strict';
// Varredura de funções fantasmas, stubs e parâmetros mortos no index.html do SUSTINE.
const fs = require('fs');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Só a parte de script (ignora CSS/HTML para não contar nomes em markup)
const scripts = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function countIdent(hay, name) {
  const re = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
  return (hay.match(re) || []).length;
}

// --- 1. Funções declaradas ---
const funcs = [];
for (const m of scripts.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/gm)) {
  funcs.push({ name: m[1], args: m[2], index: m.index });
}
// const nome = (args) => ... / function
for (const m of scripts.matchAll(/^\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\(|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/gm)) {
  funcs.push({ name: m[1], args: '', index: m.index, arrow: true });
}

// corpo aproximado por chaves balanceadas
function bodyOf(startIndex) {
  const open = scripts.indexOf('{', startIndex);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < scripts.length; i++) {
    const ch = scripts[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return scripts.slice(open + 1, i); }
  }
  return '';
}

const ghosts = [], stubs = [];
for (const f of funcs) {
  const uses = countIdent(scripts, f.name);
  const body = bodyOf(f.index);
  const meaningful = body
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  // stub: corpo vazio ou só um return sem valor
  if (/^(return\s*;?)?$/.test(meaningful)) stubs.push({ name: f.name, uses: uses - 1, body: meaningful || '(vazio)' });
  // fantasma: declarada e nunca referenciada em outro lugar
  if (uses <= 1) ghosts.push({ name: f.name, args: f.args.trim() });
}

// --- 2. Chaves de configuração declaradas e nunca lidas ---
// procura objetos de config conhecidos e testa cada chave
const deadKeys = [];
function scanObject(label, re) {
  const m = scripts.match(re);
  if (!m) return;
  const inner = m[1];
  for (const km of inner.matchAll(/(?:^|[\s,{])([A-Za-z_$][\w$]*)\s*:/g)) {
    const key = km[1];
    const uses = countIdent(scripts, key);
    // 1 = a própria declaração; objetos repetidos (estados) contam várias declarações
    const declared = (inner.match(new RegExp('\\b' + key + '\\s*:', 'g')) || []).length;
    if (uses <= declared) deadKeys.push({ obj: label, key, uses, declared });
  }
}
scanObject('tune', /const tune = \{([\s\S]*?)\n\s*\};/);
scanObject('sustainConfig', /const sustainConfig = \{([\s\S]*?)\n\s*\};/);
scanObject('gravityConfig', /const gravityConfig = \{([\s\S]*?)\n\s*\};/);
scanObject('influenceZones', /const influenceZones = \{([\s\S]*?)\n\s*\};/);

// --- 3. Chamadas para funções inexistentes ---
const declaredNames = new Set(funcs.map(f => f.name));
const called = new Map();
for (const m of scripts.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) called.set(m[1], (called.get(m[1]) || 0) + 1);
const builtins = new Set(['if','for','while','switch','catch','function','return','typeof','new','do','else','await','super','Math','Number','String','Array','Object','JSON','Date','parseInt','parseFloat','isNaN','setTimeout','setInterval','clearInterval','clearTimeout','requestAnimationFrame','cancelAnimationFrame','addEventListener','console','alert','fetch','Promise','Set','Map','Error','RegExp','Boolean','Symbol','BigInt','encodeURIComponent','decodeURIComponent','structuredClone','queueMicrotask','localStorage','navigator','document','window','performance']);
const missing = [];
for (const [name, n] of called) {
  if (builtins.has(name) || declaredNames.has(name)) continue;
  // ignora métodos (precedidos de ponto) e globais conhecidos
  const asMethod = new RegExp('\\.\\s*' + name + '\\s*\\(').test(scripts);
  if (asMethod) continue;
  const declaredAnywhere = new RegExp('(?:const|let|var|class)\\s+' + name + '\\b').test(scripts);
  if (declaredAnywhere) continue;
  missing.push({ name, calls: n });
}

const out = { stubs, ghosts, deadKeys, missing };
console.log(JSON.stringify(out, null, 1));
