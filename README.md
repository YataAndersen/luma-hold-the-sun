# LUMA — Hold the Sun

> Pequenos gestos podem iluminar o mundo.

Um arcade contemplativo em retrato. Você sustenta um sol frágil contra a gravidade, o vento e a entropia — e o mundo responde com calor, vida e memória.

A fantasia não é controlar um astro. É: **sou pequeno, mas minha persistência muda o amanhecer.**

**[Jogar no itch.io](https://yata-andersen.itch.io/luma-hold-the-sun)** · HTML5, um arquivo só, sem instalação.

---

## O jogo em uma frase de regras

O sol sempre cai. **Encostar na tela é inspirar; soltar é expirar** — e é ao soltar que o gesto acontece, com a força do fôlego acumulado. O LUMA nasceu como o avesso do Flappy Bird: a perícia pedida é **julgar duração**, como contar de zero a trinta de cabeça e terminar perto do que o relógio diria. Não é tocar rápido.

- **Segurar** → o fôlego enche em 4,5s e a sustentação vence a gravidade com folga; o pânico sempre tem saída
- **Soltar no ponto** → impulso máximo. A curva é quadrática: meio fôlego rende **um quarto** do impulso
- **Segurar demais** → a tensão cresce, **mata a sustentação** e enfraquece o gesto. Soltar é necessário, não recomendado
- **Toque em qualquer lugar da tela** — mirar é perícia espacial e não tem relação com respirar
- Um ciclo inteiro leva ~5,8s: **10 gestos por minuto**, dentro da faixa da respiração coerente

50 missões numa jornada de constelações, com três estrelas por missão: o objetivo principal, duas tarefas secundárias e a perfeição.

> Esta seção já descreveu a mecânica anterior — "segurar *perto* do sol", "pulsar gasta energia" — por várias versões depois de ela deixar de existir. É o padrão descrito em [VERIFICACAO.md](VERIFICACAO.md): **mudança de mecânica deixa entulho, e o entulho não parece bug, parece decisão antiga correta.**

## Rodar

Abra `index.html` no navegador. Não precisa de servidor, build ou instalação.

## Desenvolver

**O `index.html` é gerado. Edite `src/` e rode o build.**

```bash
node tools/build.cjs           # reconstrói index.html a partir de src/
node tools/verificar.cjs       # o ritual inteiro: build, testes, tradução, cor, ritmo
```

**Antes de publicar, rode `node tools/verificar.cjs`.** Ele junta as cinco verificações que
viviam espalhadas — e a que faltava rodar era sempre a que teria pego o problema. Ele também
lembra do que não sabe fazer: **abrir o jogo e jogar**.

Sem dependências, sem `node_modules`, sem bundler — só Node.

| documento | conteúdo |
|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | como o projeto é montado e onde mexer para cada tarefa |
| [GAMEPLAY.md](GAMEPLAY.md) | registro histórico do Ciclo 1 — a economia descrita ali **não existe mais**; ver RESPIRACAO.md |
| [AUDITORIA.md](AUDITORIA.md) | código morto e quebrado encontrado, e o que foi feito |
| [IDIOMAS.md](IDIOMAS.md) | como o sistema de tradução funciona e como adicionar idiomas |
| [RESPIRACAO.md](RESPIRACAO.md) | por que as constantes de `03-tuning.js` são o que são, e todos os erros que levaram até elas |
| **[VERIFICACAO.md](VERIFICACAO.md)** | **como verificar qualquer coisa aqui — e as quatro vezes que um instrumento mentiu. Leia antes de medir.** |

### Ferramentas

```bash
node tools/sim-breath.cjs           # o ciclo do gesto ainda está na faixa respiratória?
node tools/sweep-i18n.cjs           # texto que vai para a tela sem tradução (sai 0 quando limpo)
node tools/check-color-script.cjs   # o arco cromático das 50 missões tem quebras?
node tools/check-reachability.cjs   # verifica se as 50 missões são vencíveis
node tools/sweep-dead-code.cjs index.html
node tools/sweep-dom-refs.cjs index.html
```

A verificação de alcançabilidade existe porque a jornada é linear: **uma missão impossível trava o jogo inteiro**. Já aconteceu **quatro** vezes durante o desenvolvimento — e na terceira, o próprio teste de alcançabilidade passava, porque errava a mesma conta que a ferramenta. Por isso `sim-breath.cjs` hoje é um módulo que o teste importa: **um modelo só**, calibrado contra o jogo rodando. Ver [VERIFICACAO.md](VERIFICACAO.md).

## Idiomas

Sete: inglês, português, espanhol, alemão, francês, russo e italiano. A chave de tradução é o próprio texto em inglês, então uma tradução faltando cai no original em vez de mostrar chave crua. Ver [IDIOMAS.md](IDIOMAS.md).

## Dependências externas

O jogo funciona offline, mas busca da internet quando disponível: fontes do Google Fonts e `html2canvas` (para o cartão de compartilhamento). O áudio é sintetizado em tempo real via Web Audio — não há arquivos de som.

## Licença

Ainda não definida.
