# Como verificar o SUSTINE — e por que não confiar na primeira medida

Este documento existe porque **quatro vezes, neste projeto, um instrumento de medida escondeu exatamente o problema que devia mostrar**. Em três delas eu declarei algo verificado que não estava; na quarta, quase "consertei" uma física que não tinha defeito nenhum.

Se você (ou eu, numa sessão futura) só for ler uma linha daqui, leia esta:

> **Um número só vale depois de bater com o jogo rodando. Antes disso, ele é uma hipótese com aparência de fato.**

---

## O ritual mínimo

```bash
node tools/verificar.cjs
```

Um comando só, porque **ritual documentado que ninguém roda não protege ninguém** — e a
verificação que faltava rodar era sempre a que teria pego o problema. Ele encadeia build em
sincronia, testes, varredura de tradução, arco cromático e ritmo respiratório, e falha
inteiro se qualquer um falhar.

As ferramentas individuais continuam disponíveis quando você quiser o relatório completo:

```bash
node tools/build.cjs                                   # gera index.html a partir de src/
node --test tests/gameplay.test.cjs tests/locales.test.cjs
node tools/sweep-i18n.cjs                              # sai 0 quando está limpo
node tools/sim-breath.cjs                              # o ciclo ainda está na faixa respiratória?
node tools/check-color-script.cjs                      # o arco cromático tem quebras?
```

E depois **abra o jogo e jogue**. Nenhuma dessas ferramentas pegou o gesto invertido, o anel ausente, o card em cima do sol ou o painel colidindo com o anel do tempo. Quem pegou foi o Yata, jogando.

---

## As quatro vezes que o instrumento mentiu

### 1. Benchmarks de subida medindo ruído

A corrida morria em 3,5s e reiniciava no meio da janela de amostragem. Eu comparava duas amostras que continham partes de corridas diferentes e concluía sobre balanceamento a partir disso.

**O que ficou:** ao medir, **registrar se a corrida sobreviveu à janela inteira**. Se a tela de resultado apareceu no meio, a amostra é lixo.

### 2. O teste de histograma de valores

Eu queria saber se a composição tinha hierarquia de valores legível e medi o **histograma** do quadro. Um céu em degradê espalha o histograma em qualquer pintura, boa ou ruim — o teste passava sempre.

**O que ficou:** o instrumento tem que responder **a pergunta que você fez**. A pergunta certa era se o quadro **posterizado em 3–5 valores** continua legível (teste de Notan), não se o histograma é largo.

### 3. `visibilityState: hidden` estrangulando o `requestAnimationFrame`

Uma sessão inteira de medições instáveis — a altitude lia 0m — porque a aba do navegador estava em segundo plano e o `rAF` roda a ~1fps ali.

### 4. O painel do navegador a 1,1 fps

Mesma família, sintoma diferente: o painel estava *visível* mas sem foco, e rodava a 1,1 fps. Como o laço limita `realDt` a 33ms, o jogo avançava **~3% da velocidade real**. O sol "não subia" depois de cinco respirações — e não havia regressão nenhuma.

**O que ficou, e é a regra prática mais útil deste documento:**

```js
// Antes de acreditar em QUALQUER medida de física no navegador:
let n = 0; const t0 = performance.now();
await new Promise(r => { const f = () => { n++;
  if (performance.now() - t0 < 1500) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
console.log('fps', n / ((performance.now() - t0) / 1000));
```

**Abaixo de ~30 fps, a medida não vale.** Nesse caso, verifique de forma **determinística** — forçando a condição que quer observar — em vez de esperar o relógio.

---

## O erro que dobra: ferramenta e teste que erram junto

As 18 missões de altitude ficaram **todas impossíveis** e o teste de alcançabilidade **passava**. Porque o teste e a ferramenta faziam a mesma conta errada:

- ignoravam a **entropia**, que satura em 1 nos primeiros ~15s de qualquer corrida e leva a gravidade de 190 a 240;
- ignoravam a **expiração**, o intervalo em que nada sustenta o sol;
- ignoravam os **multiplicadores do estado emocional**, que valem ~15% da margem — e a margem é de 29 px/s².

`sim-breath.cjs` prometia 443m em 60s onde o navegador entrega 182m. **Ferramenta e teste que erram pelo mesmo motivo não são duas verificações: são uma suposição escrita duas vezes.**

**O que ficou:**
- `tools/sim-breath.cjs` virou **módulo**, e `tests/gameplay.test.cjs` importa dele. Um modelo só.
- O modelo foi **calibrado contra o navegador**: prevê 178m onde a medição deu 182m (2% de erro). Antes errava 240%.
- Se você mexer na física, **recalibre**: jogue uma corrida inteira, anote o resultado, compare com `tetoRealista(60)`.

---

## Detector precisa de auto-teste

`tools/sweep-i18n.cjs` viveu com **7 falsos positivos** e saía com código 1 *sempre*. Um portão que reprova tudo é um portão que ninguém lê — e enquanto ele reprovava por engano, deixou passar de verdade os rótulos em inglês da tela de resultado.

Hoje ele tem uma função `autoTeste()` com sete casos: três que ele **deve** achar (frase direto no DOM, frase montada numa variável, frase acumulada com `+=`) e quatro que **não deve** acusar (número com interpolação, glifos num ternário, markup com nome de classe, texto que já passa por `t()`). Se o detector quebrar, ele **avisa** em vez de dar tudo certo em silêncio.

**Regra:** toda ferramenta que decide "está limpo" precisa provar que ainda sabe reprovar.

---

## Cuidado com as listas de "peso morto"

A seção **ÓRFÃS** do varredor lista chaves traduzidas que ninguém pede. Ela tem um furo estrutural: chaves alcançadas por variável (`t(lines[i])`, `t(node.perf)`) parecem mortas.

Cinco frases da tela de resultado apareciam ali. **Quem confiasse no rótulo apagaria a tradução da tela final em seis idiomas.**

**Regra: nunca apague uma chave da lista de órfãs sem procurar o texto no código antes.**

---

## O que os testes não alcançam

Os testes leem **declarações** do `index.html` gerado: constantes, tabelas de missão, fontes de função, regras de CSS. Eles não abrem o jogo. Por construção, eles nunca vão pegar:

- gesto invertido (o impulso saía no toque enquanto o texto dizia "solte agora");
- um mostrador que não existe (a mecânica central era invisível — nada enchia na tela);
- sobreposição visual (o painel cobrindo o anel do tempo, o card em cima do sol);
- ritmo ruim, feio, ou irritante.

Para o que **dá** para travar, trave. Hoje estão travados: a economia do fôlego (nenhuma linha pode fixar o fôlego no cheio), a alcançabilidade das metas **e** das condições de perfeição, a monotonia da curva, o combo inteiro, a geometria do topo da tela em larguras de 320 a 1440, e a regra de uma mensagem por evento.

---

## Entulho: o que mudar mecânica sempre deixa para trás

Ver `RESPIRACAO.md` para os casos completos. Em resumo, toda mudança de núcleo deixou:

| tipo de entulho | exemplo real |
|---|---|
| texto da regra antiga | o tutorial mandava "tocar perto do sol" depois do toque valer em qualquer lugar |
| código que não roda mais | o ramo de "toque impreciso", inalcançável |
| recompensa que não recompensa | a graça *Quickened Rhythm*, que reduzia uma penalidade que deixara de existir |
| número calibrado para a física velha | 17 de 18 missões impossíveis; depois, 10 condições de perfeição pedindo altitudes antigas |
| tradução de texto removido | dezenas de chaves órfãs no dicionário |
| canal de feedback duplicado | **um evento produzindo três mensagens** — eu acrescentei a terceira sem procurar se a primeira existia |

**O entulho não parece bug. Parece decisão antiga correta.** Por isso passa em revisão e só aparece jogando.

**Antes de adicionar um canal de feedback novo, procure se já existe um.**

---

## Quinta vez: o teste provava o incremento e nunca o decaimento

Medido no navegador **a 60fps** (a regra do fps funcionando, pela primeira vez a favor):
sete respirações no ponto rendiam **combo máximo x1**.

O decaimento do combo era condicionado a `state.sun.flowTimer <= 0` — e o `flowTimer`
**zera sozinho a cada 3,6s**, porque é ele que dispara a revoada. Resultado: o combo caía
0,8/s durante boa parte de todo ciclo, mesmo jogando perfeitamente. **~4 pontos perdidos por
ciclo contra +1 por gesto.**

O que isso tornava impossível, sem ninguém ver:

- a secundária **"flow state (combo x3)"** — uma das duas estrelas de quase toda missão;
- as **8 missões de `COMBO_TARGET`** (alvos de 5 a 14);
- **toda** condição de perfeição `max combo xN`.

E existia um teste de combo. Ele chamava `tryClickImpulse` catorze vezes **sem rodar a
física**: provava que o incremento funciona e nunca que o decaimento permite chegar lá.

**O que ficou:** quando uma grandeza tem duas forças em cima dela, testar uma só não diz
nada. O teste novo verifica que o decaimento **não** depende de um timer que se reinicia
sozinho, e que a janela de tolerância é maior que o ciclo do gesto — as duas coisas que
faziam a conta fechar negativa.

**E o padrão, de novo:** o decaimento de 0,8/s era correto quando um gesto saía a cada 0,5s.
Ele não virou bug; virou entulho quando o ciclo passou a ser 5,8s. Ninguém o "quebrou".
