# LUMA — a respiração como mecânica

Este documento existe porque as constantes de `03-tuning.js` parecem arbitrárias sem ele, e não são. Elas codificam uma decisão de design que veio de um playtest do Yata em 06/09/2026.

## A intenção

O LUMA nasceu como **o avesso do Flappy Bird**. O Flappy fazia as pessoas sofrerem; o LUMA precisa desafiar sem estressar. O alvo é que o jogador entre em concentração pela respiração — a sincronia cardiorrespiratória é fisicamente agradável, e uma experiência agradável é o que faz alguém voltar.

A perícia pedida é a de **julgar duração**: como contar de zero a trinta de cabeça e terminar perto do que o relógio diria. Não é a de tocar rápido.

## O diagnóstico

O jogo estava rodando na frequência errada, e isso era medível, não opinável:

| | antes | agora |
|---|---|---|
| ciclo do gesto | ~3s, com pico de martelada | **5,8s** |
| gestos por minuto | ~114 (1,9/s sustentáveis) | **10** |
| queda livre | 710 px/s | 223 px/s |
| cooldown do toque | 0,14s | 0,35s |

1,9 toques por segundo é a ordem de grandeza do Flappy Bird. Respiração coerente fica entre 6 e 12 ciclos por minuto. **O LUMA era mecanicamente o jogo que queria inverter, com uma roupa calma por cima.** A frustração relatada — "acelerei mais e o sol não respondeu, como fazer meia embreagem" — era o corpo do jogo discordando da alma dele.

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

Cada recusa agora tem resposta física, sem texto:

- **longe demais** → o anel de alcance acende e um arco mais forte aponta o lado do dedo
- **rápido demais** → o sol engasga, um micro-recuo
- **sem fôlego** → tremor e som abafado (`error_muffle`, que já existia e não era usado)

## O texto saiu de cima do sol

A câmera mantém o sol em ~45% da altura. As três mensagens mais frequentes moravam em 43%, 49% e 58% — **em cima dele**, interrompendo a concentração no meio do gesto. Foram para o terço inferior (71%, 80%, 88%). A faixa entre 35% e 62% é do sol.

## O tutorial

O capítulo 1 executava `state.sun.energy = 1` a cada quadro. **Energia infinita**: o jogador aprendia a segurar num mundo onde segurar não custava nada, e o capítulo 3 depois *contava* que energia existia, numa frase que sumia em 4 segundos.

Agora o capítulo 1 usa a economia real, e o capítulo 2 vira um metrônomo que alterna conforme o fôlego:

> *hold. let the light gather.* ⟷ *the light is full. release it now.*

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

- As demais famílias de missão (combo, estabilidade, aves) **não** foram reescaladas para o novo tempo. Só a de altitude tinha teste de alcançabilidade; as outras precisam do mesmo tratamento.
- O combo ainda é o mesmo número de antes, mas agora significa outra coisa — consistência de ritmo, não velocidade. Os textos que falam dele podem estar prometendo a leitura antiga.
- A decisão "respiração livre × guiada" ficou em **guiada no tutorial, livre depois**. Um metrônomo opcional no jogo inteiro é uma escolha em aberto.
