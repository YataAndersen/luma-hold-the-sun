'use strict';
// Caça referências de DOM quebradas: ids usados no JS que não existem no HTML,
// e marca as que são desreferenciadas sem proteção (risco de exceção em runtime).
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n');

const scripts = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const markup = src.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');

const existingIds = new Set([...markup.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));
// ids criados dinamicamente pelo próprio JS (innerHTML/template strings)
for (const m of scripts.matchAll(/\bid=["'\\]*([A-Za-z][\w-]*)["'\\]*/g)) existingIds.add(m[1]);
for (const m of scripts.matchAll(/\bid\s*=\s*`([^`$]+)`/g)) existingIds.add(m[1]);

const lines = src.split('\n');
const findings = [];
const seen = new Set();
for (const m of scripts.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)(\s*\.\s*[A-Za-z_$][\w$]*)?/g)) {
  const id = m[1];
  if (existingIds.has(id)) continue;
  const deref = !!m[2];
  const key = id + (deref ? '!' : '');
  if (seen.has(key)) continue;
  seen.add(key);
  // localiza a linha no arquivo original
  let lineNo = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`getElementById('${id}')`) || lines[i].includes(`getElementById("${id}")`)) { lineNo = i + 1; break; }
  }
  findings.push({ id, desreferenciadoDireto: deref, linha: lineNo, trecho: lineNo > 0 ? lines[lineNo-1].trim().slice(0, 110) : '' });
}

// mesmo para querySelector de id
for (const m of scripts.matchAll(/querySelector\(\s*["']#([\w-]+)["']\s*\)/g)) {
  if (!existingIds.has(m[1]) && !seen.has(m[1])) { seen.add(m[1]); findings.push({ id: m[1], via: 'querySelector', linha: -1 }); }
}

console.log(JSON.stringify({ total: findings.length, findings }, null, 1));
