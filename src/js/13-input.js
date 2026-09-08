  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width, sy = H / rect.height;
    let x = e.clientX, y = e.clientY;
    if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
    return { x: (x - rect.left) * sx, y: (y - rect.top) * sy };
  }

  let audioInitialized = false;
  function pointerDown(e) {
    e.preventDefault();
    if (!audioInitialized) { initAudio(); audioInitialized = true; }
    const p = getPos(e);
    state.input.x = p.x; state.input.y = p.y; state.input.holding = true; state.input.inside = true; state.input.lastPress = state.t;
    if (state.mode === "menu") { startGame(); return; }
    // Encostar é INSPIRAR. O gesto não sai daqui: sai ao soltar, em pointerUp.
    // Enquanto o pulso saía no toque, o jogo dizia "a luz está cheia, solte agora" e
    // soltar não fazia nada — o gesto estava invertido em relação ao próprio design.
  }
  function pointerMove(e) {
    const p = getPos(e);
    state.input.x = p.x; state.input.y = p.y; state.input.inside = true;
    if (state.mode === "menu") {
      const dx = (p.x - W / 2) / (W / 2); const dy = (p.y - H / 2) / (H / 2);
      ui.menuOrb.style.setProperty('--mx', `${dx * 18}px`); ui.menuOrb.style.setProperty('--my', `${dy * 18}px`);
    }
  }
  // Soltar é EXPIRAR: é aqui que o gesto acontece, com a força do fôlego acumulado.
  function pointerUp(e) {
    e.preventDefault();
    if (state.mode === "gameplay" && state.input.holding) tryClickImpulse();
    state.input.holding = false;
    silenceHoldAudio();
  }

  function triggerScreenFlash(color = 'rgba(255,249,236,0.1)') {
    state.screenFlash.alpha = 0.1;
    state.screenFlash.color = color;
  }
  
  function triggerCameraShake(intensity = 0.5) {
      state.camera.shake.intensity = Math.max(state.camera.shake.intensity, intensity);
  }

  function tryClickImpulse() {
    const now = state.t;

    // O gesto vale de qualquer ponto da tela: ver o comentário em 14-gameplay.js. Não há
    // mais recusa por distância, e por isso não há mais o que "acertar" — só quando soltar.
    // Com isso o gesto e SEMPRE "perfeito" no eixo espacial, e todo o ramo que tratava do
    // toque impreciso virou inalcancavel. Ele saiu: um else que nao pode rodar e ruido que
    // a proxima pessoa vai ler como se fosse comportamento real.

    // FIX: Fallback seguro caso o mod.cooldown seja undefined (evita NaN e rate-limit quebrado)
    if (now - state.input.lastClick < tune.clickCooldown * (state.mods.cooldown || 1)) {
      // Rápido demais: o sol engasga — um recuo curto, legível como "ainda não".
      state.sun.tapScale = Math.min(state.sun.tapScale, 0.94);
      return;
    }

    // Sem fôlego nenhum: recusa. Acima disso o gesto SEMPRE sai — o que muda é a força.
    // Um portão duro ("só pulsa com a barra cheia") premiava quem martelava, porque
    // disparava sozinho no instante em que ficava disponível e nunca deixava a tensão
    // acumular: medido, martelar rendia 98m contra 53m de quem respirava. Agora soltar
    // cedo é permitido e desperdiça o fôlego, então a pressa se pune sozinha.
    if (state.sun.energy < breathConfig.minBreath) {
      if (now - state.input.lastEmptyPulse > 0.4) {
        state.input.lastEmptyPulse = now;
        state.sun.errorTremor = Math.max(state.sun.errorTremor, 0.55);
        state.sun.tapScale = 0.92;
        emitAudioEvent('error_muffle', 1, 0);
      }
      return;
    }

    // O anti-spam media toques em rajada. Com o gesto custando quase todo o folego, o
    // intervalo minimo real entre dois gestos e ~3,9s contra uma janela de 0,5s: ela nao
    // tinha como disparar. Saiu junto com a graca que a reduzia, que era uma recompensa
    // que nao fazia nada.

    const baseImpulse = tune.clickImpulsePerfect;

    let dynamicPulseMult = state.mods.pulseMult;
    if (state.mods.cometStacks > 0) dynamicPulseMult += Math.min(0.5, state.mods.consecutivePulses * 0.1);

    // A força do gesto é a qualidade da respiração, e a curva tem um pico nítido:
    // ao quadrado, meio fôlego rende só um quarto do impulso. É o que separa julgar a
    // duração de apertar depressa — e é a única "dificuldade" que o SUSTINE quer ter.
    const fullness = clamp(state.sun.energy / maxBreath(), 0, 1);
    // Guardado antes de zerar abaixo: a qualidade do gesto é a do instante em que soltou.
    const strainAoSoltar = state.sun.strain;
    const breathQuality = fullness * fullness * (1 - strainAoSoltar * breathConfig.strainImpulsePenalty);

    const impulse = baseImpulse * dynamicPulseMult * state.sun.impulseEfficiency * state.feedbackLoops.recoveryAssist * state.emotion.runtime.physics.assistMul * breathQuality;

    state.sun.vy -= impulse;
    // Expirar esvazia o peito, tenha ele enchido ou não: soltar cedo custa o fôlego inteiro.
    state.sun.energy = 0;
    state.sun.strain = 0;

    state.sun.stability = clamp(state.sun.stability + .09, 0, 1);
    state.sun.haloPulse = 1; state.sun.tapScale = 1.08; state.input.lastClick = now;

    triggerScreenFlash('rgba(255,249,236,0.12)');

    {
      const oldCombo = state.combo;
      // Combo mede consistência de ritmo, não velocidade: só conta o gesto solto perto do
      // ponto cheio. Com o pulso custando quase todo o fôlego, a janela do anti-spam nunca
      // dispara sozinha — quem separa um bom gesto de um gesto apressado é a tensão.
      if (fullness > 0.9 && strainAoSoltar < 0.3) {
        // O combo DECAI continuamente (14-gameplay.js: `state.combo - dt * .8`), então
        // somar 1 a ele produzia número quebrado: a tela de resultado chegou a mostrar
        // "Max Combo: x2.95992000000000007". E era pior que feio — como o decaimento comia
        // frações entre um gesto e outro, seis gestos no ritmo certo podiam somar 5,2 e uma
        // missão de "combo x6" pedia sete gestos sem dizer.
        // Arredondando para baixo ANTES de somar, n gestos no ritmo valem exatamente n, e o
        // decaimento volta a ser o que devia ser: o que se perde ao parar de respirar.
        state.combo = Math.min(20, Math.floor(state.combo) + 1);
        state.maxComboThisRun = Math.max(state.maxComboThisRun, state.combo);
        state.mods.consecutivePulses++;
      }

      spawnSpark(state.sun.x, state.sun.y, false, 12 * state.mods.sparkMult);
      addRadiance(1 * state.mods.sparkMult);
      
      if (state.mods.ascendBonus > 0) { state.sun.vy -= 150; }
      if (state.mods.transcendActive) { state.entropy = Math.max(0, state.entropy - 0.10); }
      
      emitAudioEvent('tap_perfect', 0, state.combo);
      triggerCameraShake(0.8);
      if (navigator.vibrate && settings.haptics) navigator.vibrate(15); 
      if (state.tutorial.active && state.tutorial.chapter === 2) state.tutorial.perfects++;
      
      const comboThreshold1 = Math.max(1, 3 - Math.floor(state.totalRunMemory.totalBirds / 10));
      const comboThreshold2 = Math.max(comboThreshold1 + 1, 6 - Math.floor(state.totalRunMemory.totalBirds / 5));
      analytics.track(EVENT_TYPES.PERFECT_TAP, { combo: state.combo, altitude: state.scoreMeters, fullness: +fullness.toFixed(2) });

      if (oldCombo < comboThreshold1 && state.combo >= comboThreshold1) { spawnBirdRing(); showReward("flow state"); }
      if (oldCombo < comboThreshold2 && state.combo >= comboThreshold2) { spawnBirdRing(); showReward("luminous rhythm"); }
    }

    spawnPulse(state.sun.x, state.sun.y);
    spawnDust(state.sun.x, state.sun.y, 6);
  }

