  // ============================================================================
  // IDIOMAS
  // A chave de tradução é o próprio texto em inglês. Assim o inglês nunca depende de
  // dicionário, e uma tradução faltando cai no original em vez de mostrar chave crua.
  // Para adicionar um idioma: copie o bloco de um existente e traduza os valores.
  // ============================================================================

  const LOCALE_NAMES = { en: 'english', 'pt-BR': 'português' };

  const LOCALES = {
    en: null, // identidade: o texto do código já está em inglês

    'pt-BR': {
      // --- menu e telas ---
      'hold the sun': 'segure o sol',
      'a light waiting to rise': 'uma luz esperando para nascer',
      'awaken': 'despertar',
      'journey': 'jornada',
      'harmony': 'harmonia',
      'memories': 'memórias',
      'developed with care': 'desenvolvido com cuidado',
      'the world almost lost its light.': 'o mundo quase perdeu sua luz.',
      'you are the hand that keeps dawn alive.': 'você é a mão que mantém o amanhecer vivo.',
      'home': 'início',
      'return': 'voltar',
      'rise again': 'erguer-se de novo',
      'start': 'começar',
      'next node': 'próximo nó',
      'share': 'compartilhar',
      'paused': 'pausado',
      'breathe. the light remains.': 'respire. a luz permanece.',
      'the sky will wait': 'o céu vai esperar',

      // --- configurações ---
      'settings': 'configurações',
      'calibrate your experience': 'calibre sua experiência',
      'audio': 'áudio',
      'music': 'música',
      'sound effects': 'efeitos sonoros',
      'ambience & wind': 'ambiente & vento',
      'master volume': 'volume master',
      'gameplay': 'jogabilidade',
      'difficulty': 'dificuldade',
      'gentle': 'suave',
      'standard': 'padrão',
      'challenge': 'desafio',
      'touch sensitivity': 'sensibilidade do toque',
      'haptics (vibration)': 'vibração',
      'on': 'ativado',
      'off': 'desativado',
      'visual feedback': 'feedback visual',
      'full': 'completo',
      'reduced': 'reduzido',
      'minimal': 'mínimo',
      'replay the first ritual': 'refazer o ritual inicial',
      'visual': 'visual',
      'brightness': 'brilho',
      'particles': 'partículas',
      'reduced motion': 'redução de movimento',
      'accessibility': 'acessibilidade',
      'high contrast': 'contraste alto',
      'text size': 'tamanho do texto',
      'small': 'pequeno',
      'medium': 'médio',
      'large': 'grande',
      'color blind mode': 'modo daltônico',
      'deuteranopia (green-red)': 'deuteranopia (verde-vermelho)',
      'protanopia (red-green)': 'protanopia (vermelho-verde)',
      'tritanopia (blue-yellow)': 'tritanopia (azul-amarelo)',
      'data': 'dados',
      'reset progress': 'resetar progresso',
      'export save': 'exportar save',
      'import save': 'importar save',
      'version': 'versão',
      'world light': 'luz do mundo',
      'save & return': 'salvar & voltar',
      'language': 'idioma',

      // --- tutorial ---
      'skip ritual': 'pular ritual',
      'First Dawn': 'Primeiro Amanhecer',
      'you learned to hold': 'você aprendeu a sustentar',
      'the gesture is yours now. the sky waits for the rest.': 'o gesto agora é seu. o céu espera o resto.',
      'begin the journey': 'começar a jornada',
      'ritual skipped. the sky is yours.': 'ritual pulado. o céu é seu.',
      'the sun waits. touch near it to hold it up.': 'o sol espera. toque perto dele para sustentá-lo.',
      'like that. the sun responds.': 'assim. o sol responde.',
      'hold the sun. it rises with your touch.': 'sustente o sol. ele sobe com seu toque.',
      'keep holding. the sun needs you.': 'continue sustentando. o sol precisa de você.',
      'first flight.': 'primeiro voo.',
      'tap the core to pulse.': 'toque no núcleo para dar impulso.',
      'perfect. the rhythm begins.': 'perfeito. o ritmo começa.',
      'pulses in sequence build rhythm. reach combo x3.': 'pulsos em sequência criam ritmo. alcance combo x3.',
      'the world begins to wake.': 'o mundo começa a acordar.',
      'energy sustains flight. stability holds the form.': 'energia sustenta o voo. estabilidade mantém a forma.',
      'the horizon is the limit. if the sun falls too far, the world goes dark.': 'o horizonte é o limite. se o sol cair muito, o mundo escurece.',
      'the sun falters. one last pulse can save it!': 'o sol vacila. um último pulso pode salvá-lo!',
      'the abyss drew back.': 'o abismo recuou.',
      'stay high and steady to open the dawn.': 'mantenha-se alto e estável para abrir o amanhecer.',
      'the dawn opens.': 'o amanhecer se abre.',

      // --- resultado e feedback ---
      'ritual completed': 'ritual completo',
      'the light fell': 'a luz caiu',
      'the objective is complete': 'o objetivo foi cumprido',
      'the light remembers your path': 'a luz lembra do seu caminho',
      'and the journey continues': 'e a jornada continua',
      'the sun slipped past the horizon': 'o sol escorregou além do horizonte',
      'hold longer, pulse with intention': 'sustente mais, pulse com intenção',
      'the light faded': 'a luz desvaneceu',
      'task complete': 'tarefa cumprida',
      'a grace awaits': 'uma graça aguarda',
      'phoenix reborn': 'fênix renasce',
      'the world wakes': 'o mundo desperta',
      'dawn awakened': 'amanhecer desperto',
      'corrupted light file.': 'arquivo de luz corrompido.',

      // --- graças ---
      'Grace of Care': 'Graça do Cuidado',
      'Sustain gains +25% strength.': 'Sustentar ganha +25% de força.',
      'your touch becomes more present': 'seu toque se torna mais presente',
      'Deep Breath': 'Respiração Profunda',
      'Sustain recovers +50% energy.': 'Sustentar recupera +50% de energia.',
      'the sun breathes with you': 'o sol respira com você',
      'Ephemeral Flame': 'Chama Efêmera',
      'Sustain gains +60% strength for 20 seconds.': 'Sustentar ganha +60% de força por 20 segundos.',
      'a bright, brief burn': 'uma queima brilhante e rápida',
      'Shelter': 'Acolhimento',
      'Sustain raises stability by +50%.': 'Sustentar aumenta a estabilidade em +50%.',
      'your presence calms the light': 'sua presença acalma a luz',
      'Roots of Light': 'Raízes de Luz',
      'Sustain reduces entropy by 20%.': 'Sustentar reduz a entropia em 20%.',
      'your light anchors the world': 'sua luz ancora o mundo',
      'Mantle of Warmth': 'Manto de Calor',
      'Sustain creates a shield that absorbs one fall.': 'Sustentar cria um escudo que absorve uma queda.',
      'the warmth protects you': 'o calor te protege',
      'Heart of the Sun': 'Coração do Sol',
      'Your radius of care doubles in size.': 'Seu raio de cuidado dobra de tamanho.',
      'your care expands': 'seu cuidado se expande',
      'Grace of Effort': 'Graça do Esforço',
      'Pulses gain +25% impulse.': 'Pulsos ganham +25% de impulso.',
      'your touch gains strength': 'seu toque ganha força',
      'Quickened Rhythm': 'Ritmo Acelerado',
      'Rapid-tap penalty reduced by 30%.': 'Penalidade de toques rápidos reduzida em 30%.',
      'your rhythm intensifies': 'seu ritmo se intensifica',
      'Embers': 'Fagulhas',
      'Perfect pulses give double light and radiance.': 'Pulsos perfeitos geram o dobro de luz e radiância.',
      'sparks multiply': 'faíscas se multiplicam',
      'Ascension': 'Ascensão',
      'Each perfect pulse lifts slightly higher.': 'Cada pulso perfeito eleva um pouco mais.',
      'you rise with every gesture': 'você sobe com cada gesto',
      'Comet': 'Cometa',
      'Consecutive perfect pulses build strength.': 'Pulsos perfeitos consecutivos acumulam força.',
      'your light accelerates': 'sua luz acelera',
      'Transcendence': 'Transcendência',
      'Perfect pulses clear the entropy of the world.': 'Pulsos perfeitos limpam a entropia do mundo.',
      'your light purifies the void': 'sua luz purifica o vazio',
      'Grace of Calm': 'Graça da Calma',
      'Entropy grows 20% slower.': 'A entropia cresce 20% mais devagar.',
      'the void respects your presence': 'o vazio respeita sua presença',
      'Last Breath': 'Último Suspiro',
      'The rescue window when falling grows longer.': 'A janela de resgate na queda fica maior.',
      'the abyss waits one moment longer': 'o abismo espera um instante a mais',
      'Phoenix': 'Fênix',
      'The first near-fall costs nothing and restores energy.': 'A primeira quase-queda não penaliza e devolve energia.',
      'from ashes, the light is reborn': 'das cinzas, a luz renasce',
      'Cycle': 'Ciclo',
      'After a breakthrough, energy is restored.': 'Após um avanço, a energia é restaurada.',
      'dawn renews your strength': 'o amanhecer renova suas forças',
      'Moonlight': 'Luar',
      'Falling no longer destroys your stability.': 'A queda não destrói mais sua estabilidade.',
      'in darkness, you hold steady': 'na escuridão, você se mantém firme',
      'Eternity': 'Eternidade',
      'Survive one fatal fall and return to the line.': 'Sobreviva a uma queda fatal e volte para a linha.',
      'your light does not go out': 'sua luz não se apaga',

      // --- compartilhamento ---
      'share the light': 'compartilhar luz',
      'your journey in verse': 'sua jornada em poesia',
      'share card': 'compartilhar card',
      'save image': 'salvar imagem',
      'copy text': 'copiar texto',
      'close': 'fechar',
      'generating vision...': 'gerando visão...',
      'this device cannot share directly': 'este dispositivo não suporta envio direto',
      'the sky opened to your persistence.': 'o céu se abriu para sua persistência.',
      'you touched the stars.': 'você tocou as estrelas.',
      'the horizon bowed to your light.': 'o horizonte se curvou à sua luz.',
      'the mountain witnessed your light.': 'a montanha testemunhou sua luz.',
      'the horizon drew closer.': 'o horizonte se aproximou.',
      'a spark. a beginning.': 'uma faísca. um começo.',
      'every light begins small.': 'toda luz começa pequena.',
      'the first flight is special.': 'o primeiro voo é especial.',
      'the rhythm woke the sky.': 'o ritmo despertou o céu.',
      'each pulse, a constellation.': 'cada pulso, uma constelação.',
      'harmony guided your way.': 'a harmonia guiou seu caminho.',
      'the dawn opened. the world breathes.': 'o amanhecer se abriu. o mundo respira.',
      'the light overcame the void.': 'a luz venceu o vazio.',
      'the sun faltered, but the memory remains.': 'o sol vacilou, mas a memória fica.',
      'even light needs to rest.': 'até a luz precisa descansar.',

      // --- memórias / altar ---
      'Dawn Archive': 'Arquivo do Amanhecer',
      'Memories of Light': 'Memórias de Luz',
      'fragments of past suns and recovered worlds.': 'fragmentos de sóis passados e mundos recuperados.',
      'seals': 'selos',
      'birds': 'aves',
      'meters': 'metros',
      'biomes': 'biomas',
      'no seals yet.': 'nenhum selo ainda.',

      // --- objetivos das missões (padrões: {n} recebe o número do original) ---
      // Os nomes das missões ("Still Night", "Autumn Winds") ficam em inglês de propósito:
      // são nomes próprios do mundo, como topônimos.
      'Reach {n}m.': 'Alcance {n}m.',
      'Reach {n}m into pure light.': 'Alcance {n}m rumo à luz pura.',
      'Hold Dawn Line for {n}s.': 'Segure a Linha do Amanhecer por {n}s.',
      'Reach Combo x{n}.': 'Alcance Combo x{n}.',
      '{n}% Precision for {n}s.': '{n}% de Precisão por {n}s.',
      'Awaken {n} birds.': 'Desperte {n} aves.',
      'Flow State (Combo x{n})': 'Estado de Fluxo (Combo x{n})',
      'Awaken {n} birds': 'Desperte {n} aves',
      '{n}% Precision for {n}s': '{n}% de Precisão por {n}s',
      'reach {n}m': 'alcance {n}m',
      'max combo x{n}': 'combo máximo x{n}',
      'zero near-fails': 'zero quase-quedas',
      'perfect': 'perfeito',
      'the ritual asked': 'o ritual pedia',
      'the ritual is unfinished': 'o ritual ficou inacabado',
      'current': 'atual',
      'completed': 'concluída',
      'perfect ': 'perfeita',
      'available': 'disponível',
      'locked': 'bloqueada',

      // --- mapa ---
      'Luma Constellation': 'Constelação Luma',
      'Journey Map': 'Mapa da Jornada',
      'Dawns Awakened': 'Amanheceres Despertos',
      'you are here': 'você está aqui',
      'A GRACE IS OFFERED': 'UMA GRAÇA É OFERECIDA',
      'Choose a Blessing': 'Escolha uma Bênção',
      'It will shape the light until this journey ends.': 'Ela irá moldar a luz até que esta jornada termine.'
    }
  };

  let currentLocale = 'en';

  // Tradução de um texto. Sem entrada no dicionário, devolve o próprio inglês.
  // Objetivos como "Reach 200m." variam só no número, então além da busca literal existe
  // uma segunda tentativa por padrão: os números viram {n} e são recolocados na ordem.
  // Isso cobre as 50 missões com meia dúzia de entradas em vez de 50.
  function t(text) {
    if (text == null) return text;
    const dict = LOCALES[currentLocale];
    if (!dict) return text;
    if (dict[text]) return dict[text];
    const nums = [];
    const pattern = String(text).replace(/\d+/g, n => { nums.push(n); return '{n}'; });
    const tpl = dict[pattern];
    if (tpl) { let i = 0; return tpl.replace(/\{n\}/g, () => nums[i++]); }
    return text;
  }

  // Elementos marcados com data-i18n guardam o texto original em data-i18nSrc na primeira
  // passada, para que trocar de idioma várias vezes não traduza uma tradução.
  function applyLocaleToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.i18nSrc === undefined) el.dataset.i18nSrc = el.textContent.trim();
      el.textContent = t(el.dataset.i18nSrc);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      if (el.dataset.i18nTitleSrc === undefined) el.dataset.i18nTitleSrc = el.getAttribute('title') || '';
      el.setAttribute('title', t(el.dataset.i18nTitleSrc));
    });
    document.documentElement.lang = currentLocale;
  }

  function setLocale(code) {
    currentLocale = LOCALES[code] !== undefined ? code : 'en';
    applyLocaleToDOM();
  }

  // Idioma do aparelho na primeira visita; a escolha explícita do jogador vem do save.
  function detectLocale() {
    const nav = (navigator.language || 'en');
    if (LOCALES[nav] !== undefined) return nav;
    const base = nav.split('-')[0];
    const match = Object.keys(LOCALES).find(k => k.split('-')[0] === base);
    return match || 'en';
  }
