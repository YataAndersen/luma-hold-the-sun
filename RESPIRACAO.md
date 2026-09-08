# SUSTINE — a respiração como mecânica

Este documento existe porque as constantes de `03-tuning.js` parecem arbitrárias sem ele, e não são. Elas codificam uma decisão de design que veio de um playtest do Yata em 06/09/2026.

## A intenção

O SUSTINE nasceu como **o avesso do Flappy Bird**. O Flappy fazia as pessoas sofrerem; o SUSTINE precisa desafiar sem estressar. O alvo é que o jogador entre em concentração pela respiração — a sincronia cardiorrespiratória é fisicamente agradável, e uma experiência agradável é o que faz alguém voltar.

A perícia pedida é a de **julgar duração**: como contar de zero a trinta de cabeça e terminar perto do que o relógio diria. Não é a de tocar rápido.

## O diagnóstico

O jogo estava rodando na frequência errada, e isso era medível, não opinável:

| | antes | agora |
|---|---|---|
| ciclo do gesto | ~3s, com pico de martelada | **5,8s** |
| gestos por minuto | ~114 (1,9/s sustentáveis) | **10** |
| queda livre | 710 px/s | 223 px/s |
| cooldown do toque | 0,14s | 0,35s |

1,9 toques por segundo é a ordem de grandeza do Flappy Bird. Respiração coerente fica entre 6 e 12 ciclos por minuto. **O SUSTINE era mecanicamente o jogo que queria inverter, com uma roupa calma por cima.** A frustração relatada — "acelerei mais e o sol não respondeu, como fazer meia embreagem" — era o corpo do jogo discordando da alma dele.

## Por que não existia ritmo

A energia era **monotônica**: segurar sempre somava até travar no teto, e segurar demais nunca era pior que segurar o certo.

Ritmo exige um ponto ótimo que se possa **passar**. Sem penalidade nas duas pontas, a estratégia degenera em "encher tudo, esvaziar o mais rápido possível" — e foi exatamente o que o playtest produziu. É também o que separava a mecânica da metáfora: prender a respiração cedo demais é ruim, e prender demais também é. O desconforto nas duas pontas é o compasso.

## O ciclo, hoje

**Inspirar (segurar)** — o fôlego enche em 4,5s. Segurar vence a gravidade com folga, então o sol sobe devagar e o pânico sempre tem saída.

**O ponto** — com o peito cheio, a força do gesto é máxima.

**A tensão (segurar além)** — passando do cheio, `state.sun.strain` cresce ao longo de 2,6s. Ela **mata a sustentação** (`lift × (1 − strain × 0,6)`), rouba estabilidade e enfraquece o gesto. Sem isso, segurar para sempre seria ótimo e o ciclo não fecharia.

**Expirar (soltar)** — esvazia o peito, tenha ele enchido ou não.

## A decisão que virou o jogo do avesso

A primeira versão usava um **portão duro**: só pulsava com a barra cheia. Medido no navegador, martelando rendeu **98m** contra **53m** de quem respirava.

O portão premiava a pressa. Quem toca sem parar dispara no instante em que fica disponível, e nunca deixa a tensão acumular — o portão fazia a mira por ele.

A correção foi trocar o portão por uma **curva de qualidade**:

```js
const fullness = clamp(state.sun.energy / maxBreath(), 0, 1);
const breathQuality = fullness * fullness * (1 - strainAoSoltar * 0.55);
```

Soltar cedo é **permitido** e desperdiça o fôlego inteiro. Como a curva é quadrática, meio fôlego rende um quarto do impulso. Depois disso: martelando **98m → 26m**, respirando **53m → 51m**. A pressa passou a se punir sozinha, sem o jogo precisar recusar nada.

**A lição:** proibir a estratégia errada a torna atraente de tentar. Fazer com que ela renda pouco a torna desinteressante — e não exige nenhuma mensagem de erro.

## As recusas mudas

Três regras recusavam o toque **em silêncio**: distância, cooldown e falta de fôlego. O jogador tocava e nada acontecia, sem saber qual regra havia quebrado. O raio de influência, que governa todo toque, **nunca era desenhado**.

Cada recusa ganhou resposta física, sem texto. **Duas delas depois deixaram de existir**
quando o toque passou a valer em qualquer lugar da tela: a recusa por distância saiu junto
com o raio de influência, e o anti-spam ficou inalcançável. Sobrou uma:

- **sem fôlego** → tremor e som abafado (`error_muffle`, que já existia e não era usado)

## O texto saiu de cima do sol

A câmera mantém o sol em ~45% da altura. As três mensagens mais frequentes moravam em 43%, 49% e 58% — **em cima dele**, interrompendo a concentração no meio do gesto. Foram para o terço inferior (71%, 80%, 88%). A faixa entre 35% e 62% é do sol.

## O tutorial

O capítulo 1 executava `state.sun.energy = 1` a cada quadro. **Energia infinita**: o jogador aprendia a segurar num mundo onde segurar não custava nada, e o capítulo 3 depois *contava* que energia existia, numa frase que sumia em 4 segundos.

Agora o capítulo 1 usa a economia real, e o capítulo 2 vira um metrônomo que alterna conforme o fôlego:

> *hold. the ring fills with light.* ⟷ *the ring closed. let go now.*

O capítulo 2.5 é novo e ensina a **outra ponta do erro**: só termina quando o jogador deixa a respiração prender uma vez e vê a luz endurecer. Sentir os dois limites é o que ensina o meio.

## A curva das missões foi refeita

Os 18 alvos de altitude iam de 200m a 3000m, desenhados para a física antiga. Ao desacelerar o jogo, **17 dos 18 ficaram impossíveis**. A curva foi reescalada para 210m → 690m.

O piso usado é conservador de propósito: conta **só** o impulso dos gestos e ignora a sustentação. Na prática o jogador sobe mais, e a diferença vira margem. `tests/gameplay.test.cjs` trava isso — foi a ausência desse teste que deixou 17 missões impossíveis sem ninguém notar.

## Como verificar ao mexer

```bash
node tools/sim-breath.cjs
```

Lê as constantes do `index.html` gerado e imprime o ciclo, os gestos por minuto e quanto se sobe em 60/90/120s, comparando o gesto no ponto com a respiração presa. **O ciclo tem que ficar entre 5 e 10 gestos por minuto.** Fora disso o jogo deixa de acalmar, por mais divertido que fique.

```bash
node --test tests/gameplay.test.cjs
```

Trava: um fôlego compra um gesto só; soltar cedo é permitido e rende menos de um terço; prender nega o combo; o gesto cabe na faixa respiratória de 3 a 7s; e toda missão de altitude é alcançável.

**Nenhum dos dois substitui jogar.** Todos os números deste documento vieram de medição no navegador, e as quatro primeiras medições que fiz foram **inválidas** — a corrida morria em 3,5s e reiniciava no meio da amostra, e eu estava comparando ruído. Só percebi ao registrar se a tela de resultado tinha aparecido. Ao medir, verifique sempre que a corrida sobreviveu à janela inteira.

## Pendências conhecidas

- ~~As demais famílias de missão não foram reescaladas.~~ **Feito:** combo, estabilidade e linha do amanhecer foram checadas contra o ciclo de 5,8s e cabem. Aves precisaram de correção — ver o fluxo, abaixo.
- O combo ainda é o mesmo número de antes, mas agora significa outra coisa — consistência de ritmo, não velocidade. Os textos que falam dele podem estar prometendo a leitura antiga.
- A decisão "respiração livre × guiada" ficou em **guiada no tutorial, livre depois**. Um metrônomo opcional no jogo inteiro é uma escolha em aberto.

---

# O que mudou depois da primeira versão deste documento

Tudo acima continua valendo. O que segue são as correções que vieram de jogar — quase todas apontadas pelo Yata antes de mim.

## O gesto estava invertido

O impulso saía no **pointerDown**. Ou seja: o tutorial dizia *"a luz está cheia, solte agora"*, o jogador soltava, e **nada acontecia** — o sol simplesmente caía. Todo o design deste documento diz que encostar é inspirar e soltar é expirar; a camada de entrada dizia o contrário.

Agora o gesto sai em `pointerUp` e em `keyup`. Encostar só segura.

## Duas coisas matavam a corrida em segundos

- **`pointerleave` derrubava o sustain.** Deslizar o dedo até a borda encerrava a respiração no meio, sem explicação. Só soltar de verdade termina agora.
- **A entropia ficou desproporcional.** A gravidade base caiu de 850 para 190, mas o termo de entropia só de 240 para 90 — de 28% para 47% da gravidade. Saturada, empatava **exatamente** com a sustentação: o sol pairava, sem subir e sem morrer. Restaurada à proporção original (50).

## Tocar em qualquer lugar

Ideia do Yata, e melhor que o que existia. **Mirar é uma perícia espacial sem relação com respirar** — e o sol deriva com o vento, então exigir proximidade obrigava a perseguir um alvo móvel com o dedo, o oposto de relaxar. A zona "perfeita" tinha raio de 21px, menor que a ponta de um dedo.

A influência agora é sempre plena. **Só o tempo separa um gesto bom de um ruim.**

Consequências que isso teve, e que não eram óbvias:

- Todo o ramo de "toque impreciso" em `tryClickImpulse` virou inalcançável e foi removido.
- O **anti-spam morreu**: a janela é 0,5s e o intervalo mínimo real entre gestos é 3,9s. Junto com ele saiu a graça *Quickened Rhythm*, que reduzia essa penalidade — uma recompensa que não fazia nada, oferecida ao jogador. Foi substituída por *Long Measure*, que amplia a janela antes da tensão em 60%: age sobre a perícia que de fato existe.
- **"Estar em fluxo" media posição** (`influence > .74`), e passou a subir sozinho: 2 a 4 aves a cada 1,4s e um aviso na tela na mesma cadência. As missões de aves viraram trâmite e a tela virou ruído. Fluxo agora mede respirar sem prender, e uma revoada custa um ciclo inteiro.

## O anel: a mecânica central era invisível

O furo mais grave, e levou o Yata dizendo **"eu não sei o que deveria encher"** para eu enxergar. O jogo inteiro gira em torno de juntar o fôlego e soltar no ponto — e **nada na tela enchia**. A mecânica existia na física e nas palavras, em mais nada.

Agora um anel cerca o sol: trilho apagado sempre visível, arco fechando no sentido horário conforme o fôlego enche, pulso ao fechar. Fica **no sol e não numa barra de HUD** porque o olho e o dedo já estão ali; um medidor na borda puxaria a atenção para longe do único lugar que o jogo pede para olhar.

Prender além do fecho **esfria e apaga** o anel. A primeira versão avermelhava — cor de alarme está errada num jogo cujo propósito é acalmar; o erro tem que ler como luz se recolhendo.

E a cópia passou a **nomear o anel**. Copy que nomeia algo visível ensina; copy que nomeia uma quantidade invisível só pede fé.

## Regra de ouro que ficou

Toda vez que uma mudança de mecânica passou, ela deixou para trás: texto que descrevia a regra antiga, código que não podia mais rodar, e recompensas que não recompensavam nada. Ao mexer no núcleo, varra também:

```bash
node tools/sweep-i18n.cjs        # texto que vai para a tela sem tradução ou fora do t()
node tools/check-color-script.cjs # o arco cromático ainda tem quebras?
node tools/sim-breath.cjs         # o ciclo ainda está na faixa respiratória?
node --test tests/gameplay.test.cjs tests/locales.test.cjs
```

E depois **abra o jogo e jogue**. Nenhuma dessas ferramentas pegou o gesto invertido, o anel ausente ou o card em cima do sol. Quem pegou foi o Yata, jogando.

## O fôlego enchia sozinho — e por isso ninguém via nada encher

O anel entrou, e mesmo assim o Yata disse **"não vejo nada enchendo"**. Ele estava certo, e a
causa não era o anel: **já estava cheio antes de o dedo tocar a tela.**

Sobrara da economia antiga um gotejamento passivo:

```js
state.sun.energy = clamp(state.sun.energy + .05 * dt, 0, maxEnergy);
```

Era uma válvula de segurança sensata quando pulsar custava 0,08 — ninguém ficava preso sem
saída. Com a respiração, ela virou o oposto: **1,6s parado enchiam o peito inteiro.** A
partir daí, encostar começava a `strain` no mesmo instante, a sustentação caía de 260 para
~110 contra uma gravidade de ~200, e **o sol descia enquanto o jogador segurava**. O jogo
inteiro parecia quebrado, e a única evidência na tela era um anel que nunca se movia.

Três coisas saíram junto:

- O gotejamento passou a ter teto em `breathConfig.minBreath * 2` — devolve o mínimo para sair
  do zero, e nada além disso. **Encher é do gesto.**
- Havia uma **segunda** fonte de energia infinita no capítulo 1 do tutorial, dentro de
  `14-gameplay.js`, sobrevivendo à remoção já feita em `11-tutorial.js`. O tutorial continuava
  ensinando o gesto num mundo onde segurar não custava nada.
- A corrida começava com `energy = .92`: o primeiro gesto saía pronto, sem ter sido respirado.
  Agora começa em `.25`.

Medido no navegador depois:

```
antes: e=0.25 st=0    y=532  vy=164
   2s: e=0.69 st=0    y=585  vy=-47     ← segurar já está vencendo a queda
   4s: e=1    st=0.237 y=451
   5s: e=1    st=0.628                  ← a tensão aparece só depois do cheio
apos soltar: e=0.04 st=0    y=358
```

Cinco ciclos de respiração levaram a 121m.

**A lição, de novo:** mudança de mecânica deixa entulho. O gotejamento não era um bug — era
uma decisão correta de uma economia que não existe mais. Três testes novos travam isso agora
(`tests/gameplay.test.cjs`), incluindo uma varredura que falha se **qualquer** linha do jogo
voltar a fixar o fôlego no cheio.

## As 18 missões de altitude eram impossíveis — e o teste que devia pegar isso concordava com o erro

Depois de consertar o fôlego, joguei uma corrida inteira no navegador pela primeira vez.
Ela chegou a **182m em 60 segundos**, respirando no ponto, sem prender uma vez. A missão 1
pedia **210m em 60 segundos**. As 18 metas de altitude, de 210m a 690m, estavam **todas
acima do que a física entrega** — e a progressão inteira não podia ser concluída.

O `tools/sim-breath.cjs` prometia 443m nesses mesmos 60s, e `tests/gameplay.test.cjs`
passava usando a mesma conta. **Ferramenta e teste não eram duas verificações: eram a mesma
suposição, escrita duas vezes.** Faltavam três coisas nela:

1. **A entropia.** Ela estava fixa em 0,12, o valor do primeiro instante da corrida. No jogo
   cresce 0,06/s subindo e 0,12/s caindo e **satura em 1 nos primeiros ~15 segundos de
   qualquer corrida**: a gravidade real de quase toda a corrida é 231, não 196. Com
   sustentação 260, a margem cai de 64 para 29 — menos da metade da subida por respiração.
2. **A expiração.** Não havia folga entre soltar e voltar a segurar: o gesto saía e a
   inspiração seguinte começava no mesmo quadro, como se o dedo nunca deixasse a tela. Um
   segundo de queda por ciclo, doze vezes por minuto.
3. **O estado emocional.** `gravityMul` e `assistMul` mudam a margem em ~15%, e quando a
   margem é de 29 px/s² isso decide a corrida. Em `flow` sobram 50; em `near_fail`, 22.

Com os três dentro, o simulador diz **178m** onde o navegador mediu **182m** — 2% de erro.
Aí ele passou a ser um instrumento.

A curva foi reescrita contra esse teto, entre 55% e 78% dele, para sobrar espaço a quem não
respira como um metrônomo:

| missões | tempo | teto real | metas |
|---|---|---|---|
| m1–m10 | 60s | 178m | 100 → 135m |
| m13–m19 | 75s | 226m | 140 → 165m |
| m22–m28 | 90s | 279m | 175 → 205m |
| m31–m40 | 105s | 332m | 210 → 250m |
| m43–m50 | 120s | 387m | 265 → 300m |

Três testes travam a curva agora: **alcançável** (contra o mesmo simulador, não contra uma
conta paralela), **com folga** (nenhuma meta acima de 80% do teto) e **monótona** (a curva
não anda para trás — a primeira tentativa deixou m31 pedindo menos que m28).

**A lição:** um instrumento de medida também precisa ser medido. Esta é a terceira vez neste
projeto que uma medição inválida escondeu um problema real — as primeiras corridas de
benchmark, o teste de histograma, e agora esta. O critério que ficou: **um número só vale
depois de bater com o jogo rodando.**

## O topo da tela: três informações disputando o mesmo espaço

O Yata jogou e disse: *"muita informação truncada, sobreposta, misturada... no topo da tela
uma confusão"*. Medindo, era literal.

**O painel de objetivos passava por cima do anel do tempo.** Ele tinha largura fixa de 183px
e borda direita em 207px. O anel é centrado: começa em 184px numa tela de 420 e em 154px
numa de 360. Invasão de **23px no desktop e 53px no celular** — onde o painel cobria o
mostrador inteiro. E como o painel tem `z-index: 45` contra 40 do anel, quem sumia era o
anel. O teto agora é geométrico: `max-width: calc(50vw - 62px)`, que é meia tela menos o
recuo, menos o meio-anel, menos 20px de folga. Não alcança o anel em largura nenhuma, e o
texto **quebra linha em vez de ser cortado** — informação truncada é pior que informação alta.

**O painel vivia meio apagado.** Ele desvanecia por combo e parava em 0,1 ou 0,15: legível o
bastante para puxar o olho, ilegível o bastante para não ser lido. E o gatilho era o combo,
que depois da mudança respiratória passou a medir outra coisa. Agora ele é um **aviso**:
acende inteiro na abertura da corrida e toda vez que um objetivo muda de estado, e apaga por
completo depois. Ou está lá para ser lido, ou não está.

**Quatro linhas piscando fora de fase.** Havia uma animação `taskWave` fazendo cada item
pulsar escala e cor num ciclo de 4s, com atrasos de 0s, 1s, 2s e 3s — movimento periférico
contínuo num jogo cujo propósito é concentração. Removida.

**`.hidden` não escondia nada.** A classe zera a opacidade pelo CSS, mas o ramo de gameplay
escreve `style.opacity` inline, e inline vence classe. Bastava a partida ter começado uma vez
para o painel continuar aceso por cima do tutorial e atrás da tela de resultado, com a classe
dizendo o contrário. Quem esconde agora zera o mesmo canal que quem mostra escreve.

**Na pausa, o aviso atravessava o painel.** "o céu vai esperar" cruzava a linha "perfeito:
zero quase-quedas". Uma tela cheia é dona da tela: o aviso é da partida, e só dela.

## E dois números que mentiam na tela de resultado

**`Max Combo: x2.95992000000000007`.** O combo decai continuamente quando o jogador sai do
ritmo, então somar 1 a um valor já corroído produzia fração. Era pior que feio: como o
decaimento comia frações entre um gesto e outro, seis gestos no ritmo certo podiam somar 5,2
e uma missão de "combo x6" exigia sete gestos sem dizer. Arredondando para baixo **antes** de
somar, n gestos valem exatamente n.

**Três rótulos em inglês no meio do português.** `Altitude:`, `Dawns Awakened:` e
`Max Combo:` estavam escritos direto no código, sem `t()`. "Dawns Awakened" até já estava
traduzido nos seis dicionários — só nunca era pedido. E o separador " | " deixava a barra
pendurada sozinha quando o português quebrava a linha; agora é uma linha por número.

Quatro testes novos travam isso: o painel não alcança o anel em nenhuma largura de 320 a
1440; o aviso não tem opacidade fantasma; esconder e mostrar escrevem o mesmo canal; e o
combo é sempre inteiro. **O varredor de i18n não pegou os rótulos** porque ele procura chaves
pedidas a `t()` e ausentes do dicionário — texto que nunca passa por `t()` é invisível para
ele. Vale ampliar.

## Os objetivos viraram marcas: o modelo do Tiny Thief

O painel de objetivos foi tentado duas vezes e nas duas ficou apertado. Primeiro com 183px
fixos, passando por cima do anel do tempo. Depois estreito e com o texto quebrando em três
linhas — honesto, e ainda assim **um bloco de leitura no canto do olho**, num jogo cuja
perícia é julgar duração sem se distrair. O Yata apontou a saída, e é melhor do que as duas:

> *detalhe antes do gameplay, forma compacta durante, informação só quando concluída, e no
> fim da partida tudo reaparece com status.*

**Durante a partida** os três objetivos são três glifos de 13px: `∿` ritmo, `☴` aves,
`✧` perfeição. Apagados quando pendentes, dourados quando conquistados, `×` quando perdidos.
Ocupam ~52px contra os 118px do painel anterior — o problema de geometria deixa de existir
por construção, não por um teto calculado. **O teto continua no CSS assim mesmo**, como cinto
de segurança: se alguém voltar a exibir texto ali, ele ainda não alcança o anel.

**No instante da conquista** a marca pulsa **uma vez**. Um laço vira ruído; o que acontece
uma vez vira notícia.

**No fim**, a lista volta por extenso na tela de resultado, com o estado de cada objetivo.
Antes o jogador via três estrelas e não sabia qual delas faltou.

### Duas coisas que só apareceram ao jogar

**Uma condição que já nasce verdadeira comemorava sozinha.** "zero quase-quedas" é verdade
no primeiro quadro — ninguém caiu ainda —, então a partida abria anunciando uma conquista que
o jogador não fez, e a frase mais frequente do jogo virava a menos significativa. As marcas
agora são *semeadas* no primeiro quadro sem pulsar; só transições posteriores contam.

**Um evento estava produzindo três mensagens.** Ao cumprir uma tarefa o jogo mostrava, ao
mesmo tempo: um toast nomeando a tarefa (25% da altura), um `showFloating("task complete")`
genérico (80%) e — depois da minha mudança — uma frase no canto superior esquerdo. Três
alturas para uma notícia só. **Eu tinha acrescentado a terceira sem procurar se a primeira já
existia.** Ficou o toast, que nomeia; o HUD faz a parte periférica, acendendo a marca. Um
teste trava isso agora, e ele precisou ser corrigido uma vez porque lia o próprio comentário
que explicava a remoção como se fosse a regressão.

### E a medição enganou de novo

Ao verificar, o sol não subia: 0m depois de cinco respirações. Antes de mexer na física,
medi o quadro por segundo: **1,1 fps**. O painel do navegador estava estrangulado, e como o
laço limita `realDt` a 33ms, o jogo rodava a ~3% da velocidade real. Não havia regressão
nenhuma — era a **quarta vez** neste projeto que um instrumento mentiu. A verificação do HUD
foi feita então de forma determinística, forçando a condição de um objetivo em vez de esperar
o relógio. **Regra que fica: antes de acreditar numa medida de física no navegador, medir o
fps.**
