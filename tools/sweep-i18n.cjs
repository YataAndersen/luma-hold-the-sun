'use strict';

// Varredura de tradução: cruza o que o jogo mostra com o que os dicionários sabem.
// Uso: node tools/sweep-i18n.cjs
//
// Responde quatro perguntas que os testes não respondem sozinhos:
//   1. quais textos passam por t() mas nenhum dicionário conhece  -> aparecem em inglês
//   2. quais chaves os dicionários carregam sem ninguém usar      -> peso morto
//   3. quais textos vão para a tela sem passar por t()            -> nunca traduzem
//   4. quais são MONTADOS numa variável antes de ir para a tela   -> idem, e mais difíceis de ver
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const jsDir = path.join(raiz, 'src', 'js');
const arquivos = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

const fonte = new Map();
for (const f of arquivos) fonte.set(f, fs.readFileSync(path.join(jsDir, f), 'utf8').replace(/\r\n/g, '\n'));
const body = fs.readFileSync(path.join(raiz, 'src', 'body.html'), 'utf8').replace(/\r\n/g, '\n');

// --- o que conta como frase de jogador -------------------------------------
// Esta função é o coração dos detectores 3 e 4, e antes ela não existia: o detector 3
// perguntava só "há três letras seguidas entre aspas nesta linha?". Isso dava sete falsos
// positivos — `${Math.floor(state.scoreMeters)}m` acusava por causa de "Math"/"floor", e
// `failed ? '×' : (done ? '✦' : icone)` acusava porque o trecho ENTRE duas aspas contém
// "done". Com sete acusações permanentes, o código de saída da ferramenta vivia em 1 e não
// servia de portão para nada.
function literaisDe(texto) {
  return [...texto.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map(m => m[2]);
}
function ehProsa(bruto) {
  // Interpolações são CÓDIGO, não texto: `${Math.floor(x)}m` não tem uma palavra sequer.
  // As TAGS também são código, mas o que está DENTRO delas é texto de jogador: tirar só as
  // tags deixa `<span class="stat-max">/100k</span>` virar "/100k" (não é frase) e
  // `<span>hold the sun</span>` virar "hold the sun" (é, e tem que ser pega).
  const limpo = bruto
    .replace(/\$\{[^}]*\}/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\n/g, ' ')
    .trim();
  if (!limpo) return false;
  if (!/[A-Za-z]{3}/.test(limpo)) return false;               // glifo, número, pontuação
  // Sem espaço e com pontuação de identificador: classe, id, seletor, chave.
  if (!/\s/.test(limpo) && /[-_.#/]/.test(limpo)) return false;
  return true;
}
const temProsa = texto => literaisDe(texto).some(ehProsa);

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
  for (const m of s.matchAll(/\bt\(\s*([A-Za-z_$][\w.$[\]]*)\s*\)/g)) {
    const linha = s.slice(0, m.index).split('\n').length;
    dinamicas.push(`${f}:${linha}  t(${m[1]})`);
  }
  // Funções que traduzem o que recebem: o literal fica no ponto de chamada, e sem isto
  // ele não aparece em lugar nenhum do relatório. Foi assim que as falas do tutorial
  // passaram despercebidas — elas chegam ao t() por dentro de setTut().
  for (const m of s.matchAll(/\b(setTut|showFloating|showReward|showMapToast)\(([^)]*)\)/g)) {
    for (const arg of m[2].matchAll(/(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
      const texto = arg[2].replace(/\\'/g, "'").replace(/\\"/g, '"');
      // Ícones são glifos soltos, não texto de jogador.
      if (/[A-Za-z]{3}/.test(texto)) usadas.add(texto);
    }
  }
}
// O DOM entrega textContent já decodificado, então a chave real é "&", não "&amp;".
const decodificar = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
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
  // `perfectText` NÃO entra cru. Ele passa por getPerfObjective(), que normaliza tudo para
  // três formas — "reach {n}m", "max combo x{n}" e "zero near-fails" — e é a saída dela que
  // chega ao t(). Harvestar o campo cru fazia a varredura acusar 20 traduções faltando que
  // na verdade existem ("Clean run", "Flawless run", "Max Combo x5"...), porque essas
  // palavras nunca chegam à tela. O espelho abaixo tem que acompanhar 05-missions.js.
  for (const m of s.matchAll(/\bperfectText\s*:\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) {
    const texto = m[2];
    const metros = texto.match(/(\d+)\s*m\b/i);
    const combo = texto.match(/combo\s*x?\s*(\d+)/i);
    if (metros) dados.add(`reach ${metros[1]}m`);
    else if (combo) dados.add(`max combo x${combo[1]}`);
    else dados.add('zero near-fails');
  }
  for (const m of s.matchAll(/\b(title|subtitle|toast|main|perf|desc|flavor|nodeMeta)\s*:\s*(['"])((?:(?!\2)[^\\]|\\.)*)\2/g)) {
    dados.add(m[3].replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  for (const m of s.matchAll(/\bsubs\s*:\s*\[([^\]]*)\]/g)) {
    for (const item of m[1].matchAll(/(['"])((?:(?!\1)[^\\]|\\.)*)\1/g)) dados.add(item[2]);
  }
}
// Os versos do cartão de compartilhamento moram numa tabela e chegam ao t() como
// `t(verse1)`, depois de duas indireções (`poetryTemplates[altCat][aleatorio]`). O
// seguidor de variável local não alcança isso, então os quinze versos apareciam como
// órfãos — prontos para alguém "limpar" e apagar a tradução do cartão em seis idiomas.
{
  const s = fonte.get('20-share.js') || '';
  const de = s.indexOf('const poetryTemplates');
  if (de !== -1) {
    for (const lit of literaisDe(trechoBalanceado(s.split('\n'), s.slice(0, de).split('\n').length - 1, 30))) {
      if (ehProsa(lit)) dados.add(lit);
    }
  }
}

// Rótulos de estado do mapa: t(node.state) recebe um destes quatro.
for (const estado of ['current', 'completed', 'available', 'locked']) dados.add(estado);

// --- 2b. literais que chegam ao t() por dentro de uma variável local -------
// Espelho exato do detector 4, e o mesmo furo com o sinal trocado: a tela de resultado faz
//     const lines = isSuccess ? ["the objective is complete", ...] : [...];
//     text.innerText += t(lines[i]) + "\n";
// O literal está a poucas linhas do t(), mas nunca aparece dentro dele — então as cinco
// frases da tela de resultado eram listadas como ÓRFÃS, isto é, como peso morto a remover.
// Quem confiasse nesse rótulo apagaria a tradução da tela final em seis idiomas.
for (const [f, s] of fonte) {
  if (f === '02b-i18n.js') continue;
  const linhas = s.split('\n');
  linhas.forEach((linha, i) => {
    for (const m of linha.matchAll(/\bt\(\s*([A-Za-z_$][\w$]*)[.[]/g)) {
      const ident = m[1];
      const declara = new RegExp(`(?:const|let|var)\\s+${ident}\\b`);
      for (let k = i - 1; k >= Math.max(0, i - 40); k--) {
        if (!declara.test(linhas[k])) continue;
        for (const lit of literaisDe(trechoBalanceado(linhas, k))) {
          if (ehProsa(lit)) dados.add(lit.replace(/\\'/g, "'").replace(/\\"/g, '"'));
        }
        break;
      }
    }
  });
}

// --- 3. literais que vão direto para a tela sem t() ------------------------
function varrerDireto(f, s) {
  const achados = [];
  s.split('\n').forEach((linha, i) => {
    const alvo = /\.(textContent|innerText|innerHTML)\s*=\s*(.+)$/.exec(linha);
    if (!alvo) return;
    const valor = alvo[2];
    if (/\bt\(/.test(valor)) return;                      // já traduzido
    if (!temProsa(valor)) return;
    achados.push(`${f}:${i + 1}  ${linha.trim().slice(0, 96)}`);
  });
  return achados;
}

// --- 4. o texto é montado numa variável e só depois vai para a tela --------
// O detector 3 só olha a própria linha da atribuição. Os rótulos da tela de resultado
// ("Altitude:", "Dawns Awakened:", "Max Combo:") escaparam por aqui: a frase era montada em
// `statsString` e a linha que ia para o DOM continha só o nome da variável — uma linha
// limpa apontando para prosa em inglês duas linhas acima. Quando o valor é um identificador,
// agora seguimos quem escreveu nele.
function trechoBalanceado(linhas, k, teto = 24) {
  let saldo = 0;
  const out = [];
  for (let i = k; i < Math.min(linhas.length, k + teto); i++) {
    out.push(linhas[i]);
    for (const c of linhas[i]) {
      if ('([{'.includes(c)) saldo++;
      else if (')]}'.includes(c)) saldo--;
    }
    if (saldo <= 0) break;
  }
  return out.join('\n');
}

function varrerIndireto(f, s) {
  const achados = [];
  const linhas = s.split('\n');
  linhas.forEach((linha, i) => {
    const alvo = /\.(?:textContent|innerText|innerHTML)\s*=\s*([A-Za-z_$][\w.$]*)\s*;?\s*$/.exec(linha);
    if (!alvo) return;
    const ident = alvo[1].split('.')[0];
    const escreve = new RegExp(
      `(?:const|let|var)\\s+${ident}\\b` +
      `|(?:^|[^.\\w])${ident}\\s*(?:=[^=]|\\+=)` +
      `|\\b${ident}\\.(?:push|unshift|concat)\\(`);
    for (let k = i - 1; k >= Math.max(0, i - 40); k--) {
      if (!escreve.test(linhas[k])) continue;
      const trecho = trechoBalanceado(linhas, k);
      if (/\bt\(/.test(trecho)) continue;                 // já passa pelo dicionário
      if (!temProsa(trecho)) continue;
      achados.push(`${f}:${k + 1} (vai para a tela em :${i + 1})  ${linhas[k].trim().slice(0, 88)}`);
    }
  });
  return achados;
}

// --- o detector também precisa ser medido ----------------------------------
// Três vezes neste projeto um instrumento de medida escondeu justamente o problema que
// devia mostrar. Um varredor que para de varrer em silêncio é pior que nenhum: dá a
// garantia sem fazer o exame. Os casos abaixo são o bug real que passou (frase montada
// numa variável) e os falsos positivos que faziam a ferramenta acusar sempre.
function autoTeste() {
  const deveAchar = {
    'frase montada numa variável': [
      'let stats = `Altitude: ${m}m`;',
      'statsText.innerText = stats;',
    ],
    'frase direto no DOM': ["  el.textContent = 'the light fell';"],
    'frase acumulada com +=': [
      "let aviso = '';",
      "aviso += 'hold longer, pulse with intention';",
      '  el.innerText = aviso;',
    ],
    'frase dentro de markup': ['  el.innerHTML = `<span>the light fell</span>`;'],
  };
  const naoDeveAchar = {
    'número com interpolação': ['  altitude.textContent = `${Math.floor(state.scoreMeters)}m`;'],
    'glifos num ternário': ["  iconEl.textContent = failed ? '×' : (done ? '✦' : icone);"],
    'markup com nome de classe': ['  el.innerHTML = `${n}<span class="stat-max">/5</span>`;'],
    'markup começando por interpolação': ['  el.innerHTML = `${k}k<span class="stat-max">/100k</span>`;'],
    'já passa por t()': ['  const linha = `${t("Altitude")}: ${m}m`;', '  el.innerText = linha;'],
  };
  const falhas = [];
  for (const [nome, linhas] of Object.entries(deveAchar)) {
    const s = linhas.join('\n');
    if (!varrerDireto('x.js', s).length && !varrerIndireto('x.js', s).length) {
      falhas.push(`deixou passar: ${nome}`);
    }
  }
  for (const [nome, linhas] of Object.entries(naoDeveAchar)) {
    const s = linhas.join('\n');
    if (varrerDireto('x.js', s).length || varrerIndireto('x.js', s).length) {
      falhas.push(`acusou sem motivo: ${nome}`);
    }
  }
  return falhas;
}

const cru = [];
const cruIndireto = [];
for (const [f, s] of fonte) {
  if (f === '01-analytics.js') continue;   // painel de debug, não é UI de jogador
  cru.push(...varrerDireto(f, s));
  cruIndireto.push(...varrerIndireto(f, s));
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

const falhasDoDetector = autoTeste();

console.log(`dicionários: ${Object.keys(dicts).filter(c => dicts[c]).length} idiomas, ${referencia.size} chaves de referência`);
console.log(`${nomesProprios.size} nomes de missão ficam em inglês por decisão de design`);
console.log(falhasDoDetector.length
  ? `\nATENÇÃO: o próprio detector está quebrado (${falhasDoDetector.length})`
  : 'auto-teste do detector: ok');
for (const f of falhasDoDetector) console.log('  ' + f);
secao('SEM TRADUÇÃO (pedidas em código, ausentes do dicionário)', faltando, 'estas saem em inglês em todos os idiomas');
secao('ÓRFÃS (traduzidas, nunca pedidas)', orfas, 'peso morto no bundle, ou chave usada via variável');
secao('FORA DO t() (vão para a tela cruas)', cru, 'nunca traduzem, em nenhum idioma');
secao('FORA DO t() POR VARIÁVEL (montadas antes de ir para a tela)', cruIndireto, 'a linha do DOM parece limpa; a frase está acima');
secao('CHAVES DINÂMICAS (t(variavel) — confira o conteúdo à mão)', dinamicas);

const falhou = faltando.length || cru.length || cruIndireto.length || falhasDoDetector.length;
console.log(`\n${falhou ? 'PENDÊNCIAS ENCONTRADAS' : 'tudo coberto'}`);
process.exitCode = falhou ? 1 : 0;
