# LUMA — auditoria de código morto e quebrado

Varredura de 06/09/2026 sobre `index.html`: funções fantasmas (declaradas e nunca chamadas), stubs (corpo vazio), configuração que nada lê e referências de DOM quebradas.

**Padrão dominante do projeto:** há muito sistema *inteiro, bem escrito e desligado*. Não é código pela metade — é código pronto que ninguém ligou no resto do jogo. **Antes de escrever um comportamento que parece faltar, verifique se ele já existe implementado e apenas desconectado.**

Estado atual da varredura automatizada: **0 funções fantasmas, 0 chaves de configuração mortas.**

## Corrigido

| item | o que era | resolução |
|---|---|---|
| `windMul` | Definido nos 7 estados emocionais, **nunca lido**. O vento não existia. | Ligado via `tune.windForce` |
| `spawnSpark` / `spawnDust` | Stubs `{ return; }`. O pulso perfeito não tinha retorno visual. | Restaurados com teto (`MAX_SPARKS` 90, `MAX_DUST` 60) |
| `spawnPulse` | Stub. Update e draw do anel de toque existiam completos. | Restaurado com teto de 12 |
| `particles: 'reduced'` | A opção "reduzidas" existia no menu; só `'off'` era verificado. | `particleBudget()` honra os três níveis |
| `rollRarity()` | Sistema completo de raridade de graças, **nunca chamado**. Toda graça tinha a mesma chance e o campo `rarity` era decorativo. | Ligado em `enterDraft`, com viés por altitude e número do draft |
| `triggerMiniTaskExplosion()` | Feedback curto de tarefa cumprida, escrito e **nunca chamado**. | Ligado à conclusão de tarefa secundária |
| `sub1Completed` / `sub2Completed` | Declarados e resetados, **nunca marcados como true**. O jogo não registrava o instante da conclusão. | Marcados em `updateMissionLogic`, disparando toast + feedback |
| Chaves mortas de `tune` | `gravityBase`, `gravityMax`, `holdLift`, `strongRadius` duplicavam `gravityConfig`/`sustainConfig`/`influenceZones` e **nada as lia** — armadilha de balanceamento. | Removidas |
| Tutorial quebrado | Ver abaixo. | Corrigido |

## O bug do tutorial (era exceção em runtime)

`ts1`, `ts2` e `ts3` **não existem no HTML** — nem os elementos, nem a classe CSS `progress-step`. O indicador de progresso do tutorial foi removido do markup e o JS continuou apontando para ele.

Três linhas o desreferenciavam sem proteção (as linhas vizinhas *tinham* guarda, então alguém corrigiu parte e não viu o resto). Ao concluir cada capítulo do tutorial o jogo lançava `TypeError: Cannot set properties of null`, e como o `ui.tutContainer.classList.add('hidden')` estava **na mesma linha, depois da chamada que estourava**, o painel do tutorial nunca era escondido.

Corrigido: referências mortas removidas e todos os `ui.tutContainer` protegidos. Verificado: **zero erros de runtime** numa partida completa.

## Telas sem markup (pré-existente, não é regressão)

Confirmado que já faltavam no backup original `index.pre-ciclo1.backup.html`. O JS existe, o HTML não.

### Reconstruídos

**Tutorial** — `tutorialContainer`, `tutIcon`, `tutText`, `tutHand`. O tutorial rodava **invisível**: a máquina de estados avançava e nenhuma instrução aparecia, porque `setTut()` é protegido e falhava em silêncio. Um jogador novo não recebia nenhum ensinamento — o achado mais grave para o lançamento.

O CSS `.tutorial-panel` havia sobrevivido inteiro, então o markup foi reconstruído fiel ao design original; só o estilo da mão de dica precisou ser reescrito. Verificado: o tutorial agora aparece e progride pelos capítulos ("o sol espera…" → "sustente o sol…" → "toque no núcleo…").

Enquanto o tutorial está ativo, o tracker de missão e o objetivo fixo saem de cena — o jogador aprende um verbo por vez.

**Objetivo fixo** — `topPersistentGoal` (item de alta prioridade do backlog). O CSS existia e havia código que só o *escondia*; nada nunca o preenchia. Agora mostra o objetivo principal da missão, ancorado na base da tela.

Como o tracker lateral já listava o objetivo principal, ele passou a mostrar apenas o que dá as três estrelas — duas tarefas secundárias e a perfeição. Divisão de responsabilidade: o topo some com o foco, a base nunca some.

**Tela "memories"** — `altarLightValue`, `altarLightFill`, `altarLightSphere`, `altarStat*`, `sealsGrid`, `biomesGrid`. A casca da tela existia com um `<!-- Content will be populated by JS -->` vazio, mas `showMemories()` retornava na primeira guarda e o `classList.remove("hidden")` está no **fim** da função — ou seja, clicar em "memories" no menu não fazia absolutamente nada.

Conteúdo reconstruído: esfera da luz do mundo, barra de progresso, três estatísticas (selos/aves/metros), grade de selos com estrelas e grade de biomas com bloqueio por porcentagem. Parte do CSS de altar havia sobrevivido; o resto foi escrito na linguagem visual do jogo.

### Classe de bug relacionada: HUD que vaza de modo

`updateHUD()` só roda quando `state.mode === 'gameplay'`, mas continha a lógica que decide esconder elementos **fora** do gameplay. Como a função nunca roda nesses modos, a decisão nunca era tomada e o HUD ficava congelado na última classe: o anel de tempo e a altitude apareciam sobre o menu e sobre a tela de memórias, mostrando "--" e "0m".

Corrigido movendo a decisão de visibilidade para o laço principal, que roda em todos os modos. `updateHUD` cuida só do desvanecer por foco. De quebra, `document.getElementById('celestialHUD')` saiu de dentro do laço de frame para o objeto `ui`.

### Ainda faltam

**Fim e pulo do tutorial** — `tutorialCompleteScreen`, `completeProceedBtn`, `skipTutorialBtn`. Aqui havia um segundo beco sem saída: `endTutorial(true)` fazia `state.mode = 'tutorial_complete'` e **logo depois** desreferenciava a tela inexistente. Quem *concluía* o tutorial ficava preso num modo sem tela e sem botão — pior do que quem falhava.

Reconstruídos a tela de conclusão (reaproveitando `.screen`/`.panel`) e o botão discreto de pular dentro do painel do tutorial. O `endTutorial` agora cai no menu se a tela não existir, em vez de estourar com o modo já trocado.

Detalhe de CSS: `.tutorial-panel` é `pointer-events:none` para não roubar o toque do jogo, então o botão de pular reativa o ponteiro só para si.

### Ainda faltam

| id ausente | consequência |
|---|---|
| `brightnessOverlay` | Ajuste de brilho das configurações não tem onde aplicar. |

### Consentimento de analytics — decisão de não construir

`consentModal`, `consentYes` e `consentNo` também não existem, mas aqui a recomendação é **não** reconstruir por enquanto.

O sistema falha de forma segura: `track()` retorna cedo quando `enabled` é falso, e `enabled` só vira verdadeiro em `analytics.start()`, chamado apenas com consentimento explícito. Sem o modal, `analyticsConsent` fica `null` para sempre — **nada é coletado e nada é enviado**. Além disso, o endpoint é um placeholder declarado no próprio código como "fallback simulado" (`https://api.luma.game/analytics`).

Construir o modal hoje só serviria para pedir permissão de enviar dados a uma API que não existe. O certo é decidir primeiro se haverá telemetria de verdade; se não houver, remover o código órfão de analytics inteiro.

## Regra de perfeição: três cópias, três lugares

A condição de perfeição chegou a existir triplicada, e duas cópias discordavam da missão:

1. `checkMapUnlocks` — usa `node.req.perf`. **Correta.**
2. `showResult` — usava `state.runStats.nearFails === 0`. Corrigida.
3. `updateHUD` (tracker) — usava `state.runStats.nearFails > 0`. Corrigida.

As duas cópias erradas só coincidiam com a regra real nas missões cuja perfeição é "zero near-fails"; nas de altitude ou combo, a tela dizia uma coisa e o mapa creditava outra. Hoje as três leem `node.req.perf`. **Se precisar dessa condição em um quarto lugar, leia `node.req.perf` — não reescreva o teste.**

## Stubs restantes

| função | estado | leitura |
|---|---|---|
| `playCollapseSound()` | corpo vazio | A queda não tem som próprio. Candidato a restaurar via `playNote`, que funciona. |
| `drawTrail()` | `{ return; }` | **Proposital.** A chamada em `drawWorld` está comentada com "Removido" e `state.world.trail` nunca é preenchido. Deixar como está ou remover de vez. |
| `setHoldAudio()` / `silenceHoldAudio()` | corpo só com comentário | **Propositais.** O comentário diz que o áudio de sustentação é tratado pelo sistema orgânico geral. Não mexer. |

## O splash que travava o jogo inteiro

Durante a tradução, uma string virou `'Perfect pulses clear the world's entropy.'` — apóstrofo dentro de aspas simples. Isso é **erro de sintaxe**, e num jogo de arquivo único derruba o IIFE inteiro: nada rodava, o splash ficava para sempre por cima com `opacity: 1` e `z-index: 999`, e nenhum clique chegava a lugar nenhum. O console dizia apenas `Unexpected identifier 's'`.

Duas lições registradas no código:

1. `tools/build.cjs` agora **valida a sintaxe** com `new Function(js)` antes de escrever o arquivo, e imprime as linhas ao redor do erro. Um `index.html` quebrado não é mais gerado.
2. Testes que acionam a interface com `elemento.click()` **não detectam sobreposição**, porque o clique sintético ignora hit-testing. Um jogador real teria todos os botões mortos e os testes continuariam verdes. Para verificar se um elemento está realmente clicável, use `document.elementFromPoint(x, y)` e confirme que o elemento no topo é o esperado.

## Notas de método (armadilhas já pagas)

1. **Falso positivo de "corpo vazio":** funções com parâmetro de valor padrão em objeto (`function playNote(freq, duration, opts = {})`) enganam um casador de chaves ingênuo, que lê o `{}` do parâmetro como corpo. `playNote` tem implementação real e funciona. Sempre confirmar lendo o arquivo antes de agir.
2. **Ids criados dinamicamente** por `innerHTML` não aparecem no markup estático; a varredura de DOM precisa considerá-los antes de declarar um id como inexistente.

## Como repetir a varredura

Os scripts ficam em `tools/`:

```bash
node "LUMA - PROJETO PRINCIPAL/tools/sweep-dead-code.cjs" "LUMA - PROJETO PRINCIPAL/index.html"
node "LUMA - PROJETO PRINCIPAL/tools/sweep-dom-refs.cjs" "LUMA - PROJETO PRINCIPAL/index.html"
