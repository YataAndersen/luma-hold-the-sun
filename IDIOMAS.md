# LUMA — idiomas

## Como funciona

**A chave de tradução é o próprio texto em inglês.** Não há chaves abstratas do tipo `menu.start`.

```js
t('hold the sun')   // en → "hold the sun"   |   pt-BR → "segure o sol"
```

Três consequências que motivaram essa escolha:

1. O **inglês não depende de dicionário** — o idioma base é o próprio código, então é impossível "esquecer" de traduzir para inglês.
2. Uma tradução faltando **cai no inglês**, nunca mostra chave crua (`menu.start`) na tela do jogador.
3. O código continua legível: dá para ler o que aparece na tela sem consultar um dicionário.

## Adicionar um idioma

Tudo vive em `src/js/02b-i18n.js`.

1. Adicione o nome em `LOCALE_NAMES`: `fr: 'français'`.
2. Copie o bloco `'pt-BR': { ... }` inteiro, troque a chave e traduza **apenas os valores** — as chaves em inglês não mudam.
3. `node tools/build.cjs`.
4. `node --test tests/locales.test.cjs` — acusa chave faltando, chave órfã e `{n}` perdido.
5. `node tools/sweep-i18n.cjs` — acusa texto que vai para a tela sem passar por `t()`.

O seletor no menu de configurações se popula sozinho a partir de `LOCALES`; não há mais nada a ligar.

Antes de anunciar um idioma, **abra o jogo e troque para ele com o mapa na tela**. Os testes leem o dicionário, não a tela: uma vez o painel do mapa continuou em português enquanto o resto do jogo já estava em russo, e nenhum teste viu isso.

## Padrões com números

Os 50 objetivos variam só no número ("Reach 200m.", "Reach 400m."). Em vez de 50 entradas, `t()` faz uma segunda tentativa trocando os números por `{n}`:

```js
'Reach {n}m.': 'Alcance {n}m.',
'{n}% Precision for {n}s.': '{n}% de Precisão por {n}s.',
```

Os `{n}` são preenchidos na ordem em que aparecem no original.

## O que NÃO é traduzido, de propósito

- **Nomes das missões** ("Still Night", "Autumn Winds", "Cygnus"): são nomes próprios do mundo, como topônimos. Traduzir enfraquece a identidade e cria inconsistência com as constelações reais. `tools/sweep-i18n.cjs` lê essa lista direto do campo `title` de `05-missions.js` e não acusa nenhum deles como pendência.
- **"playing for a better world"**: assinatura do coletivo, não texto de jogo.
- **Comentários do código**: são para quem desenvolve.

A fronteira é estreita e vale enunciar: o **nome** do nó fica em inglês, mas o **toast** de conclusão ("Fog clears", "Stars aligned") e o **rótulo de categoria e bioma** ("Ritual · Forest") são frases e descritores — esses traduzem. Ficaram em inglês por muito tempo justamente porque moravam no mesmo arquivo dos nomes próprios.

## Três armadilhas do sistema

**Telas desenhadas por JS não se retraduzem sozinhas.** `applyLocaleToDOM()` só alcança elementos com `[data-i18n]`. O painel do mapa e o resumo do menu são escritos por `syncMapPanel()` e `updateMenuMeta()`, que só rodam quando o jogador troca de nó ou volta de uma corrida — então trocar de idioma no mapa deixava o painel no idioma anterior enquanto o resto já tinha mudado. Por isso `setLocale()` chama `refreshTranslatedScreens()`, que reexecuta esses dois renderizadores dentro de `try/catch`. **Ao criar uma tela nova desenhada por JS, acrescente o renderizador nessa lista.** O HUD de partida é a exceção: ele se reescreve a cada quadro e se corrige sozinho.

**Elementos escritos por JS não podem levar `data-i18n`.** O passe de tradução do DOM (`applyLocaleToDOM`) sobrescreve `textContent` pelo texto original traduzido. Se o JS também escreve nesse elemento — como o "on/off" dos toggles — trocar de idioma reverteria o valor que o jogador escolheu. Nesses casos, traduza no ponto onde o JS escreve, com `t()`, e **não** marque o elemento.

Por isso o seletor de idioma chama `applySettingsToDOM()` e não apenas `setLocale()`: é o que reescreve os rótulos que o passe pelo `[data-i18n]` não alcança.

**Tradução automática por script quebra strings.** Uma substituição inseriu `world's` dentro de uma string delimitada por aspas simples e derrubou o jogo inteiro por erro de sintaxe. O `tools/build.cjs` agora valida a sintaxe antes de gerar o arquivo, mas prefira aspas duplas ou evite apóstrofos no texto de origem.

## Verificação

Duas ferramentas, com propósitos diferentes:

```bash
node tools/sweep-i18n.cjs
```

Cruza o que o jogo mostra com o que os dicionários sabem, e responde três perguntas:

1. **Sem tradução** — textos pedidos em código que nenhum dicionário conhece. Saem em inglês.
2. **Órfãs** — chaves traduzidas que ninguém pede. Peso morto, *ou* chaves alcançadas por `t(variavel)` a partir de listas que a varredura não lê — confira antes de apagar.
3. **Fora do `t()`** — literais que vão para a tela crus e nunca traduzem em idioma nenhum. Foi assim que apareceram um `'ativado'/'desativado'` em português no meio da interface em inglês e um `"CURRENT RITUAL"` fixo que sobrescrevia o `t(node.state)` correto logo acima.

```bash
node --test tests/locales.test.cjs
```

Trava o que a varredura não pega: todo idioma responde por todas as chaves do `pt-BR`, sem chaves órfãs, com o mesmo número de `{n}` em cada padrão, e presente no seletor. Um dicionário colado pela metade falha aqui.

## Estado atual

| idioma | cobertura |
|---|---|
| `en` | base (o próprio código) |
| `pt-BR` | completo — 262 chaves |
| `es` | completo — 262 chaves |
| `de` | completo — 262 chaves |
| `fr` | completo — 262 chaves |
| `ru` | completo — 262 chaves |
| `it` | completo — 262 chaves |

Cobrem interface, tutorial, 20 graças, objetivos, resultado, memórias, compartilhamento, os toasts de conclusão das 50 missões e os rótulos de categoria + bioma do mapa.

Na primeira visita o jogo segue o idioma do aparelho (`detectLocale`); a escolha explícita do jogador é salva em `settings.locale` e tem prioridade.

**Custo:** os cinco idiomas novos somaram ~54 KB ao `index.html` (363 → 417 KB, sem compressão). São literais de objeto, analisados uma vez no boot; não tocam o laço de jogo.

## Próximos idiomas: o corte é a fonte

Latim e cirílico saem **de graça**: o `head.html` já carrega Inter e Nunito pelo Google Fonts, que serve automaticamente os subconjuntos `latin-ext` e `cyrillic`. Foi por isso que russo entrou junto com italiano — o russo não custou uma linha de CSS. Turco e polonês entram pelo mesmo caminho quando quiser.

**Chinês, japonês e coreano são outra categoria de trabalho**, e não por causa da tradução:

- Nenhuma das duas fontes tem glifos CJK. Sem carregar Noto Sans SC/JP/KR, o texto cai na fonte do sistema e a tipografia do jogo — que é metade da identidade visual — se perde.
- O CSS usa `text-transform: lowercase` e `letter-spacing: .3em` em praticamente todo rótulo. Nenhum dos dois faz sentido em CJK: o primeiro é inócuo, o segundo espalha ideogramas e fica feio.
- A fonte precisa ser carregada **sob demanda**, só quando o idioma estiver ativo — uma Noto CJK completa pesa mais que o jogo inteiro. Carregar sempre contraria o pilar de performance.

Ou seja: CJK exige carregamento condicional de fonte + um bloco de CSS que desliga `text-transform`/`letter-spacing` para esses idiomas. É um ciclo próprio, não um dicionário a mais.

## Sobre a qualidade das traduções

Os seis idiomas foram escritos com atenção ao registro poético — "the abyss drew back" virou "der Abgrund wich zurück", não uma tradução literal. Ainda assim, **as linhas poéticas merecem uma revisão de falante nativo** antes de virarem argumento de divulgação: um dicionário completo garante que nada aparece em inglês por engano, não que cada verso soa bem no idioma. As linhas funcionais (menus, objetivos, ajustes) estão seguras.
