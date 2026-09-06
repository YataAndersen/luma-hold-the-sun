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

O seletor no menu de configurações se popula sozinho a partir de `LOCALES`; não há mais nada a ligar.

## Padrões com números

Os 50 objetivos variam só no número ("Reach 200m.", "Reach 400m."). Em vez de 50 entradas, `t()` faz uma segunda tentativa trocando os números por `{n}`:

```js
'Reach {n}m.': 'Alcance {n}m.',
'{n}% Precision for {n}s.': '{n}% de Precisão por {n}s.',
```

Os `{n}` são preenchidos na ordem em que aparecem no original.

## O que NÃO é traduzido, de propósito

- **Nomes das missões** ("Still Night", "Autumn Winds", "Cygnus"): são nomes próprios do mundo, como topônimos. Traduzir enfraquece a identidade e cria inconsistência com as constelações reais.
- **Comentários do código**: são para quem desenvolve.

## Duas armadilhas do sistema

**Elementos escritos por JS não podem levar `data-i18n`.** O passe de tradução do DOM (`applyLocaleToDOM`) sobrescreve `textContent` pelo texto original traduzido. Se o JS também escreve nesse elemento — como o "on/off" dos toggles — trocar de idioma reverteria o valor que o jogador escolheu. Nesses casos, traduza no ponto onde o JS escreve, com `t()`, e **não** marque o elemento.

Por isso o seletor de idioma chama `applySettingsToDOM()` e não apenas `setLocale()`: é o que reescreve os rótulos que o passe pelo `[data-i18n]` não alcança.

**Tradução automática por script quebra strings.** Uma substituição inseriu `world's` dentro de uma string delimitada por aspas simples e derrubou o jogo inteiro por erro de sintaxe. O `tools/build.cjs` agora valida a sintaxe antes de gerar o arquivo, mas prefira aspas duplas ou evite apóstrofos no texto de origem.

## Estado atual

| idioma | cobertura |
|---|---|
| `en` | base (o próprio código) |
| `pt-BR` | interface, tutorial, 20 graças, objetivos, resultado, memórias, compartilhamento |

Na primeira visita o jogo segue o idioma do aparelho (`detectLocale`); a escolha explícita do jogador é salva em `settings.locale` e tem prioridade.

## Sugestão de próximos idiomas

Para um jogo contemplativo em itch.io e mobile, na ordem de retorno por esforço: **espanhol** (maior alcance por esforço), **chinês simplificado** (maior mercado mobile; jogos minimalistas viajam bem), **alemão** e **japonês** (público forte para jogos artísticos). Russo e coreano ficam num segundo escalão.

O texto do jogo é curto e poético — cerca de 200 strings. **Não use tradução automática**: a máquina destrói exatamente o que dá identidade a frases como "the abyss drew back" ou "dawn renews your strength". O volume é perfeitamente tratável por um tradutor humano.
