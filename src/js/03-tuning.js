  // --- A CONSTANTE DE TEMPO DO JOGO ---
  // O LUMA é o avesso do Flappy Bird: desafiar sem estressar. Isso é uma decisão de
  // FREQUÊNCIA, não de dificuldade. Os números antigos — queda a 710px/s, cooldown de
  // 0,14s, ~1,9 pulsos por segundo sustentáveis — rodavam na frequência do dedo, a mesma
  // ordem de grandeza do Flappy Bird. Estes rodam na frequência da respiração: um gesto a
  // cada ~5s, ~12 por minuto, que é a faixa onde a sincronia cardiorrespiratória acontece.
  // Mexa nisto como conjunto: queda, impulso e custo do pulso formam um ciclo só.
  const tune = {
    maxFall: 240,
    clickImpulseBase: 170,
    clickImpulsePerfect: 210,
    damping: 0.985,
    influenceRadius: 145,
    // Um gesto por respiração: o custo do pulso já impede repetir antes de ~4s. O cooldown
    // sobrou só para matar o toque duplo acidental.
    clickCooldown: 0.35,
    antiSpamWindow: 0.5,
    antiSpamMult: 0.78,
    nearFailBand: 115,
    windForce: 110
  };

  const gravityConfig = {
    base: 190,
    max: 250,
    // A entropia tem que manter a MESMA proporção da base (~28%) que tinha antes:
    // 240 sobre 850. Deixá-la em 90 sobre 190 a levava a 47% e, saturada, a gravidade
    // empatava com a sustentação — o sol pairava sem subir e a corrida virava um limbo.
    progression: 1.08,
    entropy: 50
  };

  function getCurrentGravity(difficulty, entropy) {
    let gravity = gravityConfig.base * Math.pow(gravityConfig.progression, difficulty);
    gravity += entropy * gravityConfig.entropy;
    return Math.min(gravity, gravityConfig.max);
  }

  const sustainConfig = {
    // Segurar tem que VENCER a gravidade com folga, inclusive no estado near_fail, onde
    // gravityMul chega a 1,12. Com 215 a margem era de 7% no estado calmo e negativa em
    // pânico: o sol afundava justamente quando o jogador tentava salvá-lo, e a corrida
    // morria em ~3,5s. Num jogo que quer acalmar, o pânico precisa ter saída.
    liftForce: 260,
    // Inspirar: a barra vazia enche em ~4,5s. Esse é o tempo do gesto.
    energyRecovery: 0.22,
    stabilityGain: 0.08
  };

  // Um gesto é uma expiração inteira: esvazia o peito, tenha enchido ou não. Encher de
  // novo leva ~4,5s, e é isso — não uma trava de cooldown — que dá o compasso ao jogo.
  // Mantido como constante porque a economia de fôlego e as graças se referem a ele.
  const pulseEnergyCost = 0.85;

  // Teto de fôlego, descontado o desgaste acumulado na corrida.
  function maxBreath() { return 1 - state.sun.wear * 0.5; }

  // --- O PONTO ÓTIMO QUE SE PODE PASSAR ---
  // Antes, segurar era monotônico: somava energia até travar no teto, e segurar demais
  // nunca era pior que segurar o certo. Sem penalidade nas duas pontas não existe compasso,
  // e a estratégia degenerava em "encher tudo, esvaziar o mais rápido possível".
  // Agora, passar do ponto cheio é prender a respiração: tensiona em vez de acumular.
  const breathConfig = {
    // Abaixo disto não há ar para soltar: é a única recusa que sobrou.
    minBreath: 0.12,
    // Segundos segurando além do cheio até a tensão chegar ao máximo.
    strainTime: 2.6,
    // Soltar alivia mais rápido do que tensionar, para o erro não virar castigo.
    strainRelease: 1.1,
    // Quanto a tensão máxima rouba do impulso do pulso e da estabilidade.
    strainImpulsePenalty: 0.55,
    strainStabilityDrain: 0.22
  };

  const influenceZones = {
    perfect: 0.15,
    strong: 0.35,
    medium: 0.65,
    weak: 1.0
  };

  function getInteractionStrength(distance, sunRadius) {
    const ratio = distance / sunRadius;
    if (ratio <= influenceZones.perfect) return 1.0;
    if (ratio <= influenceZones.strong) return 0.85;
    if (ratio <= influenceZones.medium) return 0.6;
    if (ratio <= influenceZones.weak) return 0.35;
    return 0;
  }

  const EMOTION_STATES = {
    deep_night: {
      physics: { gravityMul: 0.92, windMul: 0.35, entropyMul: 0.75, assistMul: 1.05 },
      visuals: { skyLerp: 0.08, saturation: 0.55, contrast: 0.82, fogDensity: 0.28, haloIntensity: 0.35, haloSize: 0.9, particleDensity: 0.2, aurora: 0.0, worldGlow: 0.12 },
      audio: { drone: 0.65, piano: 0.08, sparkle: 0.0, choir: 0.0, tension: 0.0, lowpass: 0.72 },
      ui: { hudOpacity: 0.18, ritualTextOpacity: 0.0, iconsOpacity: 0.28 },
      camera: { shake: 0.0, drift: 0.08, zoom: 1.0 }
    },
    first_glow: {
      physics: { gravityMul: 1.0, windMul: 0.5, entropyMul: 0.92, assistMul: 1.0 },
      visuals: { skyLerp: 0.24, saturation: 0.68, contrast: 0.9, fogDensity: 0.22, haloIntensity: 0.52, haloSize: 1.0, particleDensity: 0.36, aurora: 0.0, worldGlow: 0.2 },
      audio: { drone: 0.58, piano: 0.18, sparkle: 0.06, choir: 0.0, tension: 0.0, lowpass: 0.84 },
      ui: { hudOpacity: 0.16, ritualTextOpacity: 0.24, iconsOpacity: 0.26 },
      camera: { shake: 0.0, drift: 0.06, zoom: 1.0 }
    },
    flow: {
      physics: { gravityMul: 0.96, windMul: 0.82, entropyMul: 0.88, assistMul: 1.08 },
      visuals: { skyLerp: 0.46, saturation: 0.82, contrast: 1.0, fogDensity: 0.16, haloIntensity: 0.78, haloSize: 1.08, particleDensity: 0.68, aurora: 0.12, worldGlow: 0.38 },
      audio: { drone: 0.46, piano: 0.34, sparkle: 0.22, choir: 0.08, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.1, ritualTextOpacity: 0.32, iconsOpacity: 0.22 },
      camera: { shake: 0.02, drift: 0.04, zoom: 1.01 }
    },
    near_fail: {
      physics: { gravityMul: 1.12, windMul: 1.18, entropyMul: 1.2, assistMul: 1.12 },
      visuals: { skyLerp: 0.18, saturation: 0.34, contrast: 1.08, fogDensity: 0.3, haloIntensity: 0.22, haloSize: 0.9, particleDensity: 0.18, aurora: 0.0, worldGlow: 0.06 },
      audio: { drone: 0.7, piano: 0.02, sparkle: 0.0, choir: 0.0, tension: 0.34, lowpass: 0.52 },
      ui: { hudOpacity: 0.06, ritualTextOpacity: 0.0, iconsOpacity: 0.18 },
      camera: { shake: 0.22, drift: 0.02, zoom: 1.02 }
    },
    rising_sky: {
      physics: { gravityMul: 1.02, windMul: 0.9, entropyMul: 0.96, assistMul: 1.02 },
      visuals: { skyLerp: 0.66, saturation: 0.9, contrast: 1.02, fogDensity: 0.12, haloIntensity: 0.92, haloSize: 1.14, particleDensity: 0.82, aurora: 0.24, worldGlow: 0.54 },
      audio: { drone: 0.34, piano: 0.42, sparkle: 0.3, choir: 0.16, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.08, ritualTextOpacity: 0.4, iconsOpacity: 0.2 },
      camera: { shake: 0.01, drift: 0.05, zoom: 1.015 }
    },
    breakthrough: {
      physics: { gravityMul: 0.9, windMul: 0.72, entropyMul: 0.72, assistMul: 1.14 },
      visuals: { skyLerp: 0.92, saturation: 1.0, contrast: 1.08, fogDensity: 0.08, haloIntensity: 1.0, haloSize: 1.22, particleDensity: 1.0, aurora: 0.46, worldGlow: 0.82 },
      audio: { drone: 0.26, piano: 0.5, sparkle: 0.42, choir: 0.28, tension: 0.0, lowpass: 1.0 },
      ui: { hudOpacity: 0.04, ritualTextOpacity: 0.54, iconsOpacity: 0.18 },
      camera: { shake: 0.0, drift: 0.06, zoom: 1.03 }
    },
    pause_breath: {
      physics: { gravityMul: 0.0, windMul: 0.0, entropyMul: 0.0, assistMul: 0.0 },
      visuals: { skyLerp: 0.5, saturation: 0.7, contrast: 0.92, fogDensity: 0.18, haloIntensity: 0.48, haloSize: 1.0, particleDensity: 0.22, aurora: 0.0, worldGlow: 0.16 },
      audio: { drone: 0.22, piano: 0.06, sparkle: 0.0, choir: 0.0, tension: 0.0, lowpass: 0.68 },
      ui: { hudOpacity: 0.0, ritualTextOpacity: 0.0, iconsOpacity: 0.36 },
      camera: { shake: 0.0, drift: 0.0, zoom: 1.0 }
    }
  };

  function detectEmotion(s) {
    if (s.paused) return "pause_breath";
    if (s.nearFailN > 0.8) return "near_fail";
    if (s.altitudeN > 0.8 && s.recentSuccessN > 0.7) return "breakthrough";
    if (s.altitudeN > 0.62 && s.stabilityN > 0.58) return "rising_sky";
    if (s.comboN > 0.5 && s.stabilityN > 0.5) return "flow";
    if (s.altitudeN > 0.2) return "first_glow";
    return "deep_night";
  }

  function blend(current, target, speed, dt) {
    return current + (target - current) * Math.min(1, dt * speed);
  }

  function blendProfile(runtime, target, dt) {
    for (let group in target) {
      if (!runtime[group]) runtime[group] = {};
      for (let key in target[group]) {
        runtime[group][key] = blend(
          runtime[group][key] || 0,
          target[group][key],
          2.2,
          dt
        );
      }
    }
  }

  function EmotionRuntime() {
    this.currentName = "deep_night";
    this.targetName = "deep_night";
    this.runtime = JSON.parse(JSON.stringify(EMOTION_STATES.deep_night));

    this.update = function(signals, dt) {
      const next = detectEmotion(signals);
      if (this.targetName !== next) {
        this.targetName = next;
      }
      const targetProfile = EMOTION_STATES[this.targetName];
      blendProfile(this.runtime, targetProfile, dt);
    }
  }

  function getSignals() {
    const s = state;
    const altitudeN = clamp(s.scoreMeters / 1800, 0, 1);
    const comboN = clamp(s.combo / 10, 0, 1);
    const stabilityN = s.sun.stability;
    const energyN = s.sun.energy;
    const nearFailN = s.sun.nearFail ? 1 : 0;
    const recentSuccessN = s.rewardTimer > 0 ? 1 : 0;
    
    return {
      paused: s.mode === 'paused',
      altitudeN, comboN, stabilityN, energyN, nearFailN, 
      worldLightN: clamp(s.worldLight / 100, 0, 1),
      dawnHoldN: s.dawnGoal.visualIntensity,
      recentSuccessN
    };
  }


  // --- COLOR SCRIPT ---
  // Um color script nao e escolher uma paleta bonita por cena: e organizar a progressao
  // emocional cromatica da experiencia inteira. O LUMA nao tinha nenhum. Pior: a ordem dos
  // biomas repete literalmente — as missoes 1 a 19 e 20 a 38 percorrem a MESMA sequencia,
  // e as tres constelacoes se alternam tres vezes. A jornada dava a volta e recomecava.
  //
  // Em vez de reordenar os biomas (eles carregam o nome e a identidade de cada ritual), o
  // script modula por cima. E a repeticao vira o argumento: o jogo e sobre devolver a luz
  // ao mundo, entao a SEGUNDA passagem pelos mesmos lugares tem que estar mais quente,
  // mais saturada e mais alta em valor que a primeira. O mesmo lugar, acordado.
  //
  //   Ato I   (1-19)   o mundo apagado. Frio, dessaturado, baixo.
  //   Ato II  (20-38)  os mesmos lugares despertando. Calor e croma entram.
  //   Ato III (39-47)  as constelacoes. Frio de novo, mas ALTO — fino, limpo, cosmico.
  //                    E a queda de temperatura antes do pagamento, como Nava descreve:
  //                    esfriar de proposito para a chegada valer.
  //   Ato IV  (48-50)  o zenite. Calor cheio, croma cheio, o ponto mais claro da jornada.
  function scriptCromatico(missionId) {
    const n = parseInt(String(missionId || 'm1').slice(1), 10) || 1;
    const entre = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

    if (n <= 19) {
      const t = (n - 1) / 18;
      return { calor: entre(0.00, 0.18, t), croma: entre(0.55, 0.72, t), valor: entre(0.82, 0.95, t) };
    }
    if (n <= 38) {
      const t = (n - 20) / 18;
      return { calor: entre(0.30, 0.62, t), croma: entre(0.85, 1.05, t), valor: entre(1.02, 1.18, t) };
    }
    if (n <= 47) {
      const t = (n - 39) / 8;
      // A quebra: o calor cai de 0,62 para 0,10 de uma missao para a outra. E o contraste
      // entre vizinhos que faz o arco existir — uma rampa monotona nao e script, e degrade.
      return { calor: entre(0.10, 0.04, t), croma: entre(0.5, 0.38, t), valor: entre(1.22, 1.38, t) };
    }
    const t = (n - 48) / 2;
    return { calor: entre(0.55, 0.92, t), croma: entre(0.9, 1.15, t), valor: entre(1.35, 1.6, t) };
  }

  // Aplica calor e croma preservando a identidade do bioma: o lugar continua sendo ele,
  // muda o momento da jornada em que voce o encontra.
  function aplicarScript(cor, s) {
    const cinza = 0.2126 * cor[0] + 0.7152 * cor[1] + 0.0722 * cor[2];
    const comCroma = cor.map(c => cinza + (c - cinza) * s.croma);
    const quente = [255, 186, 122];
    return comCroma.map((c, i) => c + (quente[i] - c) * s.calor * 0.34);
  }
