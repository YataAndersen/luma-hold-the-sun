# LUMA — Hold the Sun

> Pequenos gestos podem iluminar o mundo.

Um arcade contemplativo em retrato. Você sustenta um sol frágil contra a gravidade, o vento e a entropia — e o mundo responde com calor, vida e memória.

A fantasia não é controlar um astro. É: **sou pequeno, mas minha persistência muda o amanhecer.**

**[Jogar](#)** · HTML5, um arquivo só, sem instalação.

---

## O jogo em uma frase de regras

O sol sempre cai. **Segurar** perto dele o sustenta e recarrega energia; **pulsar** gasta essa energia e o impulsiona para cima. Você não pode fazer as duas coisas o tempo todo — é aí que mora o jogo.

- **Segurar** → recupera energia, estabiliza, mas não vence a gravidade sozinho
- **Pulsar** → ganha altitude, custa energia, e é recusado quando falta fôlego
- **O vento** empurra o sol de lado: sustentar é rastrear, não repousar o dedo
- **Ritmo** vale mais que velocidade — martelar o toque não constrói combo

50 missões numa jornada de constelações, com três estrelas por missão: o objetivo principal, duas tarefas secundárias e a perfeição.

## Rodar

Abra `index.html` no navegador. Não precisa de servidor, build ou instalação.

## Desenvolver

**O `index.html` é gerado. Edite `src/` e rode o build.**

```bash
node tools/build.cjs           # reconstrói index.html a partir de src/
node tools/build.cjs --check   # falha se index.html estiver fora de sincronia
node --test tests/gameplay.test.cjs
```

Sem dependências, sem `node_modules`, sem bundler — só Node.

| documento | conteúdo |
|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | como o projeto é montado e onde mexer para cada tarefa |
| [GAMEPLAY.md](GAMEPLAY.md) | decisões de design, balanceamento e medições feitas no jogo |
| [AUDITORIA.md](AUDITORIA.md) | código morto e quebrado encontrado, e o que foi feito |
| [IDIOMAS.md](IDIOMAS.md) | como o sistema de tradução funciona e como adicionar idiomas |

### Ferramentas

```bash
node tools/check-reachability.cjs   # verifica se as 50 missões são vencíveis
node tools/sweep-dead-code.cjs index.html
node tools/sweep-dom-refs.cjs index.html
```

A verificação de alcançabilidade existe porque a jornada é linear: **uma missão impossível trava o jogo inteiro**. Já aconteceu três vezes durante o desenvolvimento.

## Idiomas

Inglês e português. A chave de tradução é o próprio texto em inglês, então uma tradução faltando cai no original em vez de mostrar chave crua. Ver [IDIOMAS.md](IDIOMAS.md).

## Dependências externas

O jogo funciona offline, mas busca da internet quando disponível: fontes do Google Fonts e `html2canvas` (para o cartão de compartilhamento). O áudio é sintetizado em tempo real via Web Audio — não há arquivos de som.

## Licença

Ainda não definida.
