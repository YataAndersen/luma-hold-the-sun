# SUSTINE — arquitetura

## A regra que importa

**Edite `src/`. Nunca edite `index.html` na mão** — ele é gerado e qualquer alteração direta é perdida no próximo build.

```bash
node tools/build.cjs           # reconstrói index.html a partir de src/
node tools/build.cjs --check   # falha se index.html estiver fora de sincronia
```

## Por que existe um build

O jogo era um único arquivo de 6.400 linhas com CSS, HTML e 5.300 linhas de JavaScript juntos. Isso escondeu por meses sistemas inteiros desligados (ver `AUDITORIA.md`): ninguém conseguia ver que o vento nunca era aplicado ou que o tutorial apontava para elementos inexistentes.

Mas o formato de arquivo único tem duas virtudes que não podíamos perder:

- abre com **duplo clique**, sem servidor — módulos ES (`<script type="module">`) são bloqueados em `file://`;
- sobe no **itch.io** exatamente como está, sem etapa de empacotamento.

A solução é separar a *fonte* e concatenar na saída. O build é um script Node de ~40 linhas, sem dependências, sem `node_modules`, sem bundler.

**Garantia de segurança da separação:** o primeiro build reproduziu o `index.html` original **byte a byte**. A quebra em módulos é puramente organizacional — as fatias são sequenciais e a ordem original é preservada, então o JavaScript resultante é o mesmo texto de sempre, dentro do mesmo IIFE.

## Estrutura

```
SUSTINE - PROJETO PRINCIPAL/
├── index.html          ← GERADO. não editar.
├── src/
│   ├── head.html       cabeçalho e metadados
│   ├── styles.css      todo o CSS
│   ├── body.html       markup das telas
│   └── js/
│       ├── manifest.json   ordem de concatenação + descrição de cada módulo
│       └── *.js            24 módulos
├── tests/gameplay.test.cjs
├── tools/
│   ├── build.cjs           reconstrói index.html
│   ├── split-once.cjs      a quebra original (histórico; não rodar de novo)
│   ├── sweep-dead-code.cjs caça funções fantasmas e config morta
│   └── sweep-dom-refs.cjs  caça ids referenciados que não existem no HTML
├── ARQUITETURA.md
├── IDIOMAS.md          como traduzir e adicionar idiomas
├── AUDITORIA.md        código morto e quebrado
└── GAMEPLAY.md         design, balanceamento e medições
```

## Os módulos, na ordem em que rodam

A ordem importa: são fatias sequenciais de um mesmo escopo. `manifest.json` é a fonte da verdade.

| módulo | responsabilidade |
|---|---|
| `00-shell.js` | canvas e contexto |
| `01-analytics.js` | telemetria opt-in |
| `02-settings.js` | preferências, refs de UI, dimensões, helpers de matemática |
| `02b-i18n.js` | **idiomas**: dicionários, `t()` e aplicação no DOM (ver `IDIOMAS.md`) |
| `03-tuning.js` | **física, energia, vento, zonas de influência e estados emocionais** |
| `04-state.js` | estado da partida e constantes musicais |
| `05-missions.js` | graças, raridade, as 50 missões, objetivos e nós do mapa |
| `06-audio.js` | motor de áudio e efeitos sonoros |
| `07-persistence.js` | salvar, carregar, sincronizar progresso |
| `08-world-init.js` | geração do cenário |
| `09-mission-flow.js` | ciclo da missão: início, tarefas, conclusão |
| `10-run-lifecycle.js` | começar, pausar, encerrar, resultado, graças |
| `11-tutorial.js` | tutorial em três capítulos |
| `12-particles.js` | faíscas, poeira, anéis de pulso, aves |
| `13-input.js` | ponteiro, teclado e o pulso |
| `14-gameplay.js` | física do sol, entropia, resposta do mundo, HUD |
| `15-music.js` | trilha dinâmica |
| `16-render-world.js` | céu, montanhas, nuvens, cidade, vegetação |
| `17-render-entities.js` | sol, aves, partículas, aurora, cutscene |
| `18-loop.js` | utilidades, resize, laço principal |
| `19-ui-bindings.js` | botões, configurações, dados |
| `20-share.js` | cartão de compartilhamento |
| `21-splash.js` | abertura, história, consentimento |
| `22-map.js` | Journey Map |
| `23-boot.js` | sons de UI, transição, service worker |

### Onde mexer para cada tipo de tarefa

- **Texto e idiomas:** `02b-i18n.js`. O texto em inglês é a própria chave; leia `IDIOMAS.md` antes, há duas armadilhas conhecidas.
- **Balancear o jogo:** `03-tuning.js`. É a única fonte de números de física. Cuidado: já houve cópias mortas dessas constantes em dois lugares, o que fazia ajustes não surtirem efeito.
- **Missões e objetivos:** `05-missions.js`. As condições de perfeição são derivadas do texto exibido, então texto e regra não podem divergir.
- **Feel do toque:** `13-input.js` (o pulso) e `14-gameplay.js` (sustentação e física).
- **Performance de render:** `16-render-world.js` e `17-render-entities.js`. Ver a seção de performance em `GAMEPLAY.md` antes — há duas medições que contrariam a intuição.

## Testes

```bash
node --test "SUSTINE - PROJETO PRINCIPAL/tests/gameplay.test.cjs"
```

Os testes extraem declarações do `index.html` **gerado** e as executam com stubs de render, som e persistência. Rode o build antes de testar. Se renomear uma função ou constante coberta, atualize a lista `declarations` no topo do arquivo de teste.

## Limites conhecidos desta arquitetura

- Os módulos compartilham um escopo só (o IIFE), então não há fronteiras reais entre eles: qualquer módulo enxerga tudo. A separação é de *legibilidade*, não de encapsulamento. Um passo futuro seria dar a cada módulo um namespace explícito.
- A ordem é rígida. Mover um módulo de lugar pode quebrar inicializações que dependem de `const` já avaliadas (funções são içadas, `const` não).
- `split-once.cjs` tem números de linha do arquivo antigo cravados. Serve como registro histórico e **não deve ser executado novamente**.
