  function showFloating(text, good = true) {
    text = t(text);
    ui.float.textContent = text;
    ui.float.style.color = good ? "rgba(255,249,236,.96)" : "rgba(255,187,160,.96)";
    ui.float.classList.remove("show"); void ui.float.offsetWidth; ui.float.classList.add("show");
  }
  function showReward(text) {
    text = t(text); ui.reward.textContent = text; ui.reward.classList.add("show"); state.rewardTimer = 1.15; playReward(); }

  // PACTO DE ENGENHARIA: Partículas e pássaros em volta do sol desativados para isolar a queda de FPS que corrompe o áudio.
  // Anel de toque: update e draw já existiam completos, só o spawner estava desligado.
  // É o retorno tátil imediato do pulso, some em ~0,3s e custa um stroke por frame.
  function spawnPulse(x, y) {
    if (settings.visual.particles === 'off') return;
    if (state.world.pulses.length >= 12) return;
    state.world.pulses.push({ x, y, r: 18, max: 74, a: 1 });
  }
  // Teto rígido: o custo por frame não pode crescer com a intensidade da jogada, e o pico
  // acontece justamente no combo alto, quando o jogador menos pode perder frames.
  const MAX_SPARKS = 90, MAX_DUST = 60;

  // A opção "reduzidas" existia no menu sem nenhum código honrando — só 'off' era verificado.
  function particleBudget(count) {
    const mode = settings.visual.particles;
    if (mode === 'off') return 0;
    if (mode === 'reduced') return Math.ceil(count * 0.5);
    return count;
  }

  function spawnSpark(x, y, danger = false, count = 5, isTrail = false) {
    const room = Math.min(particleBudget(count), MAX_SPARKS - state.world.sparks.length);
    for (let i = 0; i < room; i++) {
      const ang = rand(0, Math.PI * 2);
      const spd = isTrail ? rand(8, 34) : rand(45, 165);
      state.world.sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (isTrail ? 0 : 25),
        a: 1, life: rand(.35, .8), size: rand(1.6, 3.4), danger
      });
    }
  }

  function spawnDust(x, y, count = 3) {
    const room = Math.min(particleBudget(count), MAX_DUST - state.world.dust.length);
    for (let i = 0; i < room; i++) {
      state.world.dust.push({
        x: x + rand(-14, 14), y: y + rand(-14, 14),
        vx: rand(-18, 18), vy: rand(-38, -10),
        a: rand(.35, .7), life: rand(.5, 1.1), size: rand(1.2, 2.6)
      });
    }
  }
  function spawnBirdRing() {
    const count = 2 + Math.floor(rand(0, 3));
    state.runStats.birdsReturned += count;
    experienceState.missionBirdsThisRun += count; emitAudioEvent('birds_return');
  }
  function maybeSpawnRare() {
    if (state.runTime < 24) return;
    if (state.sun.stability > .74 && Math.random() < .002) {
      if (state.biome === 'meadow') {
          state.world.rare.push({ type: 'butterfly', x: -30, y: rand(H*.2, H*.6) - state.camera.y*.8, vx: rand(40, 80), vy: 0, size: rand(5, 8), life: 10, phase: Math.random()*Math.PI*2 });
      } else if (state.biome === 'zenith' || state.biome === 'cosmos') {
          state.world.rare.push({ type: 'angel', x: -30, y: rand(H*.1, H*.4) - state.camera.y*.8, vx: rand(30, 60), vy: -15, size: rand(15, 25), life: 12, phase: Math.random()*Math.PI*2 });
      } else {
          state.world.rare.push({ type: 'comet', x: -30, y: rand(H*.16, H*.46) - state.camera.y*.8, vx: rand(90, 135), vy: rand(-8, 8), size: rand(4, 8), life: 8, isComet: true });
      }
      if (Math.random() < 0.3) showFloating("the sky answers", true);
    }
  }

