'use strict';

// O ritual inteiro num comando só.
// Uso: node tools/verificar.cjs
//
// Existe porque ritual documentado que ninguém roda não protege ninguém. As verificações
// deste projeto viviam espalhadas em cinco comandos, e a que faltava rodar era sempre a que
// teria pego o problema. Aqui elas rodam juntas, em ordem, e o veredito é um só.
//
// O que este script NÃO consegue fazer, e continua sendo seu trabalho: abrir o jogo e jogar.
// Nenhuma ferramenta daqui pegou o gesto invertido, o anel ausente, o card em cima do sol
// ou o painel colidindo com o anel do tempo. Ver VERIFICACAO.md.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.join(__dirname, '..');

const etapas = [
  {
    nome: 'build em sincronia',
    porque: 'index.html é gerado; editar src/ e esquecer o build publica a versão velha',
    cmd: ['tools/build.cjs', '--check'],
  },
  {
    nome: 'testes',
    porque: 'economia do fôlego, alcançabilidade das metas E das perfeições, geometria do HUD',
    cmd: ['--test', 'tests/gameplay.test.cjs', 'tests/locales.test.cjs'],
  },
  {
    nome: 'varredura de tradução',
    porque: 'texto que chega à tela sem passar por t(), inclusive montado em variável',
    cmd: ['tools/sweep-i18n.cjs'],
  },
  {
    nome: 'arco cromático',
    porque: 'o script de cor das 50 missões não pode ter quebras bruscas entre vizinhas',
    cmd: ['tools/check-color-script.cjs'],
    tolerante: true,   // relatório, não portão
  },
];

let falhas = 0;
for (const etapa of etapas) {
  process.stdout.write(`\n── ${etapa.nome} ${'─'.repeat(Math.max(0, 52 - etapa.nome.length))}\n`);
  try {
    const saida = execFileSync(process.execPath, etapa.cmd, { cwd: raiz, encoding: 'utf8' });
    const linhas = saida.trim().split('\n');
    // Relatórios longos: só o essencial. Quem quiser o detalhe roda a ferramenta sozinha.
    console.log(linhas.length > 8 ? linhas.slice(-6).join('\n') : saida.trim());
    console.log(`   ok — ${etapa.porque}`);
  } catch (e) {
    const saida = ((e.stdout || '') + (e.stderr || '')).trim();
    console.log(saida.split('\n').slice(-25).join('\n'));
    if (etapa.tolerante) {
      console.log(`   aviso (não bloqueia) — ${etapa.porque}`);
    } else {
      console.log(`   FALHOU — ${etapa.porque}`);
      falhas++;
    }
  }
}

// As ferramentas em Python (logo, capa, receptor de canvas) nunca eram executadas por
// nada automático — e `gerar-capa.py` ficou COMITADO com erro de sintaxe por duas sessões,
// sem ninguém perceber, porque só se descobre ao rodar. Um `py_compile` custa milissegundos.
console.log(`\n── ferramentas python ${'─'.repeat(33)}`);
{
  const py = fs.readdirSync(path.join(raiz, 'tools')).filter(f => f.endsWith('.py'));
  const quebradas = [];
  for (const f of py) {
    try {
      execFileSync('python', ['-m', 'py_compile', path.join('tools', f)], { cwd: raiz, encoding: 'utf8' });
    } catch (e) {
      const saida = ((e.stderr || '') + (e.stdout || '')).trim().split('\n');
      quebradas.push(`${f}: ${saida[saida.length - 1]}`);
    }
  }
  if (quebradas.length) {
    for (const q of quebradas) console.log('   ' + q);
    console.log(`   FALHOU — ${quebradas.length} de ${py.length} não compilam`);
    falhas++;
  } else {
    console.log(`   ok — ${py.length} ferramentas compilam`);
  }
}

// O ciclo respiratório é uma faixa de design, não um teste binário: fora dela o jogo deixa
// de acalmar, por mais divertido que fique. Por isso ele é lido e julgado aqui.
console.log(`\n── ritmo respiratório ${'─'.repeat(33)}`);
try {
  const sim = require('./sim-breath.cjs');
  const { sustainConfig, breathConfig } = sim.constantes;
  const ciclo = (1 / sustainConfig.energyRecovery) + breathConfig.strainTime / 2;
  const porMinuto = 60 / ciclo;
  console.log(`   ciclo do gesto: ${ciclo.toFixed(1)}s  (${porMinuto.toFixed(0)} por minuto)`);
  console.log(`   teto realista: 60s=${Math.round(sim.tetoRealista(60))}m  120s=${Math.round(sim.tetoRealista(120))}m`);
  if (porMinuto < 5 || porMinuto > 12) {
    console.log('   FALHOU — fora da faixa de respiração coerente (5 a 12 por minuto)');
    falhas++;
  } else {
    console.log('   ok — dentro da faixa de respiração coerente (5 a 12 por minuto)');
  }
} catch (e) {
  console.log('   FALHOU — não consegui ler o modelo:', e.message);
  falhas++;
}

console.log('\n' + '═'.repeat(56));
if (falhas) {
  console.log(`${falhas} verificação(ões) falharam.`);
} else {
  console.log('Tudo verificado pelo que dá para automatizar.');
  console.log('');
  console.log('Falta o que nenhuma ferramenta aqui faz: ABRA O JOGO E JOGUE.');
  console.log('E se for medir física no navegador, meça o fps primeiro —');
  console.log('abaixo de ~30 a medida não vale. Ver VERIFICACAO.md.');
}
process.exitCode = falhas ? 1 : 0;
