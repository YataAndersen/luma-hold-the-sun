# SUSTINE — gameplay: estado e direção

> ## ⚠ Registro histórico, não descrição do jogo atual
>
> **Quase tudo abaixo desta linha descreve a economia que existia até 06/09/2026** — energia
> como combustível, pulso com custo fixo, janela de anti-spam, sustentar e pulsar como duas
> ações separadas. **Essa economia não existe mais.**
>
> Em 07/09/2026 o núcleo virou respiração: encostar é inspirar, soltar é expirar, e é ao
> soltar que o gesto acontece. A perícia deixou de ser "quando pulsar" e passou a ser
> **julgar duração**. Um ciclo leva ~5,8s — dez gestos por minuto.
>
> **Para o jogo de hoje, leia [RESPIRACAO.md](RESPIRACAO.md).**
> Para verificar qualquer coisa, [VERIFICACAO.md](VERIFICACAO.md).
>
> Este arquivo fica porque o raciocínio do Ciclo 1 continua útil — vários problemas
> descritos aqui (objetivo que promete uma coisa e mede outra, métrica grátis, missão
> impossível) **voltaram a acontecer depois**, de outra forma. Mas nenhum número daqui
> vale hoje.

## Objetivo do usuário

Elevar gameplay, core loop, game feel, mecânicas e level design. Lançamentos futuros previstos: itch.io, Android e iPhone. O desenvolvimento acontece nesta pasta principal.

## O ciclo do jogo — versão atual

**Inspirar segurando → sentir o fôlego encher → soltar no ponto → o mundo responde.**

Segurar além do cheio tensiona: mata a sustentação e enfraquece o gesto. É o que dá ao
gesto uma duração com fim, em vez de um botão a manter apertado.

*(O ciclo descrito no restante deste documento — "sustentar → escolher quando pulsar" — é o
anterior.)*

---

# Ciclo 1 — implementado em 06/09/2026

Estas mudanças estão no código e cobertas por `tests/gameplay.test.cjs` (11 testes). Backup do estado anterior: `index.pre-ciclo1.backup.html`.

## 1. A energia virou o recurso central

**Antes:** sustentar recuperava 12 de energia por segundo numa escala 0–1 — a barra enchia em 0,08s. Um pulso custava 0,08 com cooldown de 0,14s, um teto de gasto de 0,57/s. A recarga superava o gasto em ~21x e as duas ações rodavam ao mesmo tempo, então spammar era sempre a estratégia ótima e a decisão central do jogo não existia.

**Agora:**

- `sustainConfig.energyRecovery`: 12 → **0,42/s** (mais o trickle passivo de 0,05/s que já existia).
- `pulseEnergyCost`: **0,22** por pulso, extraído para constante nomeada.
- O pulso é **recusado** quando falta energia, antes de gastar ou creditar combo, com um feedback discreto de "sem fôlego".

**Ritmo que isso produz:** uma barra cheia paga ~4,5 pulsos. Sustentar no ponto perfeito compra um pulso a cada ~0,5s. Pulsar mais rápido do que isso é possível e às vezes necessário, mas esvazia a barra e força um período de recuperação. Esse é o trade-off que o jogo não tinha.

Isso reativou sistemas que já existiam e estavam inertes: `wear` (reduz o teto da barra), o humor "tired" abaixo de 0,48, a deformação visual do sol abaixo de 0,3, o impulso que enfraquece com energia baixa e a graça `g_respiracao` (+50% de recuperação).

## 2. Combo virou mestria, não velocidade

- Teto de combo: 9 → **20**. As missões m29, m35, m41 e m47 pediam combo 10, 11, 12 e 14 e eram **literalmente impossíveis**.
- Pulsos dentro da janela de anti-spam (0,22s) continuam saindo, mas **não constroem combo**. Antes, martelar o botão subia o combo igual a um gesto deliberado.

## 3. Falhar não destrava mais nada

- `mapProgress.lastRun` agora registra `success`, propagado de `endRun(isSuccess)`.
- `checkMapUnlocks` exige `run.success`: uma corrida que terminou em queda não credita objetivo, estrela nem avanço de nó.

**Antes:** `evaluateCondition` só comparava números e nunca olhava o resultado. Bater a meta numérica e depois cair marcava a missão como concluída e avançava o mapa, enquanto a tela mostrava fracasso.

**Regra da missão:** o tempo da missão é a partida inteira. Cair = falha, zero crédito. Ao fim do tempo avalia objetivo principal + 2 secundários + perfeição.

## 4. Os objetivos medem o que prometem

**Antes:** `req.perf` era idêntico nas 50 missões — `['nearFails', 0, '==']` — enquanto o texto exibido prometia "score 350m", "combo x6", "reach 900m". Os dois secundários também eram iguais nas 50: sobreviver 30s e combo x3.

Havia ainda uma terceira métrica mentindo: **"80% Precision" media `state.sun.stability`, que cada toque recarrega em +0,09** — bastava tocar muito. O bot de dedo parado marcava 57s de "precisão" sem precisão nenhuma. Agora mede contato real (tempo dentro da zona forte do sol, fora de perigo), com decaimento de 1,4x em vez de zerar a cada escorregão. Isso faz o tempo de precisão acumular acima de ~58% de contato bom.

Como a métrica antiga era grátis, os alvos das 8 missões de precisão tinham sido escritos contra ela e ficaram impossíveis: 55s exigiria 97% de contato perfeito. A escada foi reescalonada de 12→55s para **8→40s**, mantendo a progressão e cabendo no que é alcançável. Há teste cobrindo isso.

**Agora:**

- `getPerfObjective()` deriva a condição **do próprio texto** da missão, então texto e regra não podem divergir. "Clean run"/"Flawless run" não descreviam nada verificável: caem no padrão de zero near-fails e o texto é reescrito para dizer isso.
- `getSubObjectives()` escolhe dois secundários de dimensões **diferentes da meta principal**, para que nenhuma estrela venha de graça. As duas estrelas medem os dois lados do loop: pulsar (combo) e sustentar (aves/precisão).
- "Survive 30s" foi removido dos secundários: com a regra de sobreviver até o fim, era uma estrela grátis em toda corrida vencida.

## 5. Resultado e mapa concordam

- A tela de resultado calculava perfeição com uma regra própria (`nearFails === 0`) em vez da condição da missão. Agora usa a mesma que o mapa credita.
- A derrota dizia "you held the light" e oferecia **next node** — o jogador era parabenizado e convidado a avançar depois de cair. Agora diz "the light fell", lembra o que a missão pedia, e só oferece avançar quando houve sucesso.

## 6. O vento existe (ciclo 2)

`windMul` estava escrito nos 7 estados emocionais desde sempre — de 0,35 em `deep_night` a 1,18 em `near_fail` — e **nunca era lido por nada**. Mesmo padrão da energia: sistema inteiro authored e inerte.

Agora o vento empurra o sol lateralmente (`tune.windForce = 300`, modulado por `windMul`). É uma onda lenta e legível (soma de dois senos), não um tremor aleatório: dá para antecipar e corrigir. O tutorial inicial fica abrigado até o capítulo 3.

**Por que este foi o ajuste escolhido:** a câmera mantém o sol perto de uma posição fixa na tela, então segurar o dedo parado bastava — daí as 39 aves e 57s de precisão sem nenhuma habilidade. O vento transforma sustentar em **rastrear**, que era a metade do loop sem exigência. O custo do pulso não precisava mudar; o que faltava era dificuldade no contato.

Efeito colateral desejado: os biomas e estados emocionais ganham identidade mecânica, e nomes como "Autumn Winds", "Storm Front" e a zona "Wind Realm" passam a significar algo. `near_fail` tem o vento mais forte, mas o autor já havia compensado com `assistMul` 1,12 no mesmo estado — pressão e ajuda juntas.

## 7. Performance (auditoria de 06/09/2026)

Performance é pilar do projeto, e o alvo é celular. Estado medido: **60 FPS travados, p95 de 16,8ms, zero frames acima de 33ms** durante gameplay no desktop. As mudanças abaixo importam porque o orçamento do celular é bem menor.

**Nuvens — 3x mais rápidas (18% → 6% do frame).** `drawClouds` fazia um `fill()` por nuvem com `ctx.filter = blur()` ativo. Cada `fill()` sob filtro custa uma passada de blur numa superfície temporária, então 40 nuvens eram **40 passadas de blur por frame**. Agora a camada inteira vai num único path e um único `fill()` (3,0ms → 1,0ms medidos). Também removido o `clouds.filter(...)`, que alocava um array por camada por frame.

Consequência para o backlog: o custo deixou de crescer com a quantidade de nuvens — é uma passada de blur por camada, com 10 ou 100 nuvens. O item "nuvens constantes em parallax" ficou barato.

**Poeira ambiente.** A cadeia de `if/else` de bioma rodava 60 vezes por frame (uma por partícula) produzindo sempre o mesmo resultado, junto com 60 chamadas de `getMissionReactiveSunBrightness()`. Tudo isso foi içado para fora do loop.

**Brilho do combo limitado.** `comboGlow = combo * 4` alimenta o `shadowBlur` do sol. Subir o teto de combo de 9 para 20 dobrava o raio do blur do maior objeto da tela, custando +0,5ms por frame exatamente quando o jogador vai bem. Agora satura em combo x10.

**Duas medições que contrariaram a intuição — não repetir os erros:**

1. Trocar o `shadowBlur` dos vagalumes por sprite pré-renderizado com `drawImage` seria **15x mais lento** (0,3ms → 4,6ms). O custo do blur escala com a *área borrada*: é caro em formas grandes (nuvens) e barato em partículas de 2px. Os vagalumes ficam como estão.
2. Benchmark de canvas sem forçar flush mede só a submissão de comandos em JS, não a rasterização — e inverte o resultado. É preciso um `getImageData` por iteração para medir de verdade.

**Achado pendente:** `spawnSpark` e `spawnDust` são stubs que retornam imediatamente (`function spawnSpark(...) { return; }`). As partículas de faísca nunca são criadas, então o pulso perfeito perdeu seu retorno visual — é uma perda de game feel no momento mais importante do jogo, não um problema de performance. Reativar exige orçar o custo e pôr teto na contagem.

## 8. Onboarding e HUD (ciclo 3)

**O jogo não ensinava a jogar.** Todo o markup do painel de tutorial havia sumido do arquivo, então a máquina de estados do tutorial rodava invisível: nenhuma instrução chegava ao jogador novo. Além disso, três linhas do tutorial lançavam exceção ao concluir cada capítulo, o que impedia até o painel de ser escondido. Detalhes em `AUDITORIA.md`.

Reconstruído e verificado: o tutorial aparece e progride pelos três capítulos, ensinando sustentar → pulsar → cuidar.

**Feedback de tarefa cumprida.** Os flags `sub1Completed`/`sub2Completed` existiam e nunca eram marcados — o instante em que uma tarefa secundária é concluída passava sem retorno nenhum. Agora dispara um toast com o nome da tarefa e o `triggerMiniTaskExplosion`, que já estava escrito e nunca era chamado. É exatamente o que o backlog pede: feedback discreto nas tarefas comuns, guardando o épico para os momentos grandes.

**Dois becos sem saída no tutorial.** Quem *falhava* o tutorial via exceção a cada troca de capítulo; quem *concluía* ficava preso num modo sem tela nenhuma, porque `endTutorial(true)` trocava o modo e só depois desreferenciava uma tela inexistente. Ambos corrigidos, com a tela de conclusão reconstruída e um botão discreto de pular dentro do painel — ninguém é mais obrigado a repetir o ritual.

**Tela "memories" reconstruída.** Tinha botão no menu e não fazia absolutamente nada: a função retornava na primeira guarda e o `remove('hidden')` estava no fim. Agora mostra a luz do mundo, selos com estrelas e biomas desbloqueados — a motivação de longo prazo do jogo, que estava invisível.

**Divisão de responsabilidade no HUD:**

| elemento | mostra | comportamento |
|---|---|---|
| base da tela | objetivo principal | fixo, nunca desvanece |
| topo esquerdo | as três estrelas (2 tarefas + perfeição) | desvanece com o foco |
| topo centro | anel do tempo + altitude | desvanece com o foco |

Durante o tutorial os dois primeiros somem: um verbo por vez.

**Partículas de volta.** `spawnSpark`, `spawnDust` e `spawnPulse` eram stubs vazios — o pulso perfeito, o momento mais importante do jogo, não tinha retorno visual. Restaurados com teto rígido de contagem (90 faíscas, 60 poeiras, 12 anéis) e respeitando os três níveis da opção "partículas", que antes só reconhecia "desligadas". Medido: 60 FPS mantidos mesmo pulsando a cada 200ms.

**Raridade das graças.** `rollRarity` calculava chance de comum/incomum/rara/épica com bônus por altitude e por número do draft, e **nunca era chamada**: o sorteio ignorava raridade e o campo era decorativo. Agora está ligada, então subir mais alto melhora o que aparece.

## 9. Idioma e layout do mapa (ciclo 4)

**Tudo em inglês.** O jogo misturava os dois idiomas: a interface e as missões em inglês, mas o tutorial, as configurações, as 20 graças e a poesia de compartilhamento em português. Foram traduzidas 160 strings (62 no markup, 98 no JS) e o `<html lang>` passou de `pt-BR` para `en`. Os comentários de código seguem em português — são para quem desenvolve.

**Layout do Journey Map.** O card da missão ocupava **54% da tela** e escondia os nós; pior, o override de CSS para telas pequenas *aumentava* o padding em vez de reduzir. Correções:

- teto de altura de 85% para 42%, com paddings e espaçamentos compactados (e o override mobile agora acompanha, em vez de contrariar);
- o subtítulo repetia exatamente o objetivo que já aparecia logo abaixo; passou a mostrar o bioma ("ritual · blossom"), e a linha do verbo saiu por ser redundante com o próprio texto do objetivo;
- `scrollToNode` centralizava o nó na metade da tela, o que o jogava para trás do card. Agora centraliza na área realmente visível — o que sobra acima do card.

Resultado: o nó atual aparece com o marcador "you are here" em área livre, com o caminho à frente e atrás legíveis.

Observação: o scroll do mapa **não** estava quebrado, ao contrário do que o backlog registrava — a área rola os 6.496px inteiros. O que dava a impressão de mapa travado era o card cobrindo metade da tela.

## 10. Alcançabilidade das 50 missões (ciclo 5)

Como a jornada é linear, **uma missão impossível trava o jogo inteiro**. Isso já aconteceu duas vezes: o combo pedia 14 com teto de 9, e a precisão pedia 55s numa métrica que zerava a cada escorregão.

O padrão se repetia numa terceira métrica. `continuousTimeAboveLine` — o "segure a linha do amanhecer" — também **zerava** fora da condição, exigindo 50s ininterruptos acima da linha, agora com vento empurrando o sol. Recebeu o mesmo decaimento de 1,4x já usado no `stableTimer` e na precisão.

**O modelo dos timers contínuos:** crescem 1x dentro da condição e decaem 1,4x fora, então só acumulam acima de ~58% de permanência. Um jogador muito bom (85% de permanência) acumula `2,4 × 0,85 − 1,4 = 0,64s` por segundo de missão.

Cruzando isso com a duração de cada missão (60s nas dez primeiras, +15s a cada dezena), **as 50 missões passaram a ser alcançáveis** — a mais exigente, m45, pede 50s dentro de um teto de 76,8s.

**Validação medida no jogo**, com o bot rastreador (jogador competente) na missão 1:

| métrica | antes do decaimento | depois |
|---|---|---|
| tempo acima da dawn line | 37,6s | **60,3s** |
| tempo em precisão | 2,5s | **42,1s** |
| resultado | — | ritual completo, 671m, combo 20, zero near-fails |

O modelo previa um teto de 38,4s numa missão de 60s; a medição deu 60,3s. **O modelo é conservador**, que é a direção certa para uma garantia de alcançabilidade — ele nunca vai aprovar um objetivo que na prática é impossível.

**O gradiente de habilidade ficou nítido:** na mesma missão, o bot de dedo parado agora cai aos 15s com 1,1s acima da linha, enquanto o rastreador completa com 60,3s. Antes do vento, o dedo parado sobrevivia os 60s inteiros.

Duas travas para não regredir:

- `tools/check-reachability.cjs` lista objetivo por objetivo com o teto de cada missão;
- um teste na suíte falha se qualquer objetivo cronometrado passar do que a própria missão comporta.

## 11. A luz do mundo satura em duas partidas (pendente)

Descoberto ao montar saves para as capturas de imprensa. `calculateWorldLight()` soma:

| fonte | peso | quanto para 100% sozinho |
|---|---|---|
| aves | `birds × 0,5` | **200 aves** |
| metros | `metros × 0,001` | 100.000 m |
| selos | 0,5 a 2 por missão | 50 missões perfeitas |

O bot rastreador fez **137 aves numa única corrida**. Ou seja, duas partidas boas zeram a meta-progressão inteira — a barra que deveria representar a jornada completa de 50 missões enche antes da terceira.

Os pesos foram calibrados quando as aves eram raras. Depois que sustentar passou a gerar aves com frequência, a escala ficou obsoleta. Uma correção plausível: aves valendo `0,05` (2.000 aves para 100%) e o peso dos selos subindo, para que a luz do mundo represente de fato o avanço pela jornada. Precisa de decisão de design antes de mexer.

## 12. Paridade de input

- O `keydown` disparava um pulso a cada evento de auto-repeat do sistema: segurar Espaço jogava sozinho. Agora o auto-repeat sustenta, mas só uma tecla realmente pressionada pulsa.
- O sustain por teclado passou a acompanhar o sol a cada frame (`input.keyboardHold`) em vez de depender dos eventos de repeat para reposicionar o toque.

---

# Pendente

## Balanceamento — números são ponto de partida, não conclusão

0,42/s e 0,22 por pulso vieram de análise, não de playtest com jogadores. Os valores a observar: quantos pulsos uma barra cheia deve pagar, e se ~0,5s é o intervalo certo entre pulsos sustentáveis.

**Corrida de referência medida em 06/09/2026** (script segurando o tempo todo e pulsando a cada 0,55s, mira fixa e imprecisa, missão m1 de 60s):

| medida | valor |
|---|---|
| altitude | 317m (meta 200m) |
| aves despertadas | 39 |
| tempo em precisão | 57s de 62s |
| combo máximo | **1** |
| near-fails | 0 |

Leitura: sustentar de forma constante era fácil e muito generoso — aves e precisão vinham de graça. Foi isso que motivou o vento (seção 6).

**Depois do vento e da métrica de precisão corrigida**, o mesmo bot foi medido em duas versões: dedo parado no centro contra rastreando o sol.

| medida | dedo parado | rastreando |
|---|---|---|
| estrelas | ★☆☆ | **★★★** |
| altitude | 319m | **650m** |
| aves | 7 | **137** |
| combo máximo | 1 | **20 (teto)** |
| tempo acima da dawn line | 7,0s | **37,6s** |

Mesma economia de energia, mesma cadência de pulso — a única diferença é rastrear o sol. A habilidade passou a valer, que era o objetivo do ciclo 2. Os limiares dos secundários foram calibrados contra esses dois extremos: 12 aves e combo x3 separam os dois perfis, 2 aves e "sobreviver 30s" não separavam nada.

Ponto de atenção: a corrida de dedo parado só conseguiu 6,9s acima da dawn line, e as missões dessa família pedem de 15s (m2) a 50s (m45). O bot rastreador chegou a 37,6s, então até m39 (45s) e m45 (50s) seguem duvidosas — verificar.

## Level design (próximo ciclo)

As 50 missões ainda alternam sobretudo metas numéricas. Falta definir: quantos biomas, características de cada um, curva de dificuldade, e como as missões evoluem em mecânica e ritmo em vez de repetir a mesma tarefa com números maiores. A recomendação anterior continua válida: desenhar três missões com funções distintas — ensinar, testar e combinar — e expandir a partir delas.

`getSubObjectives` tem um pool fixo de três candidatos; o ciclo de level design deve dar objetivos próprios a cada missão.

## Backlog de UI/UX

Em `../txt/ajustes.txt`: anel central de tempo, toasts de progresso, inventário de graças que não interrompe o flow, nuvens em parallax, tela de resultado com score e bônus, e as correções de scroll/clique do Journey Map.

## Publicação

itch.io aceita HTML5 ([documentação](https://itch.io/docs/creators/html5)). O registro do service worker falha em `file://` e em http local — verificar em https antes de publicar. Empacotamento para Android/iPhone é etapa própria; os alvos futuros não significam que a versão atual esteja validada nessas plataformas.

## Critérios de aceite ainda não verificados com jogadores

- Um jogador novo entende como sustentar e pulsar nos primeiros 10–15 segundos.
- Consegue explicar por que caiu ou venceu e o que faria diferente.
- Jogar com intenção oferece vantagem perceptível sobre repetição cega.
- Testar controle, desempenho e interrupções em aparelhos reais.

## Como rodar os testes

```bash
node --test "SUSTINE - PROJETO PRINCIPAL/tests/gameplay.test.cjs"
```

Eles extraem as declarações do HTML de produção e exercitam a lógica com stubs de render, som e persistência. Ao renomear uma função ou constante coberta, atualize a lista `declarations` no topo do arquivo de teste.
