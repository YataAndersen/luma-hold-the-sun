  function mixColor(a,b,t){return [Math.round(lerp(a[0],b[0],t)),Math.round(lerp(a[1],b[1],t)),Math.round(lerp(a[2],b[2],t))]}
  function rgb(arr){return `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`}
  function formatTime(sec){const m=Math.floor(sec/60), s=Math.floor(sec%60); return `${m}:${String(s).padStart(2,"0")}`}

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const oldW = W;
    const oldH = H;
    canvas.width = rect.width;
    canvas.height = rect.height;
    W = canvas.width;
    H = canvas.height;
    HORIZON_Y = H * .865;
    if (oldW > 0 && oldH > 0) {
      state.sun.x = (state.sun.x / oldW) * W;
      state.input.x = (state.input.x / oldW) * W;
      state.sun.y = (state.sun.y / oldH) * H;
      state.camera.y = (state.camera.y / oldH) * H;
      state.input.y = (state.input.y / oldH) * H;
    } else {
        state.sun.x = W * .5;
        initWorldDecor(); // Só desenha o mundo na primeira vez! Impede embaralhar ao subir e descer URL bars de celular.
    }
    state.dawnGoal.thresholdY = H * .35;
  }

  let last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!last) last = ts;
    const realDt = Math.min(.033, (ts - last) / 1000);
    last = ts;
    
    let timeScale = 1.0;
    if (state.mode === "gameplay" && state.cutscene && state.cutscene.active) {
        const p = 1 - (state.cutscene.timer / state.cutscene.duration);
        if (p < 0.25) timeScale = 0.15; // Efeito Câmera Lenta (Bullet Time)
        else timeScale = lerp(0.15, 1.0, (p - 0.25) / 0.75); // Tempo normalizando
        state.cutscene.timer -= realDt; // Timer real não é afetado pelo slow mo
        if (state.cutscene.timer <= 0) {
            state.cutscene.active = false;
            if (experienceState.missionCompleted && state.mode === "gameplay") completeMissionAndAdvance();
        }
    }
    
    state.dt = realDt * timeScale;
    state.t += state.dt;

    // O objetivo fixo pertence à partida. Fica aqui, e não em updateHUD, porque updateHUD só
    // roda em gameplay — e então o objetivo vazava para o menu, o mapa e a tela de memórias.
    {
      const emPartida = state.mode === 'gameplay' || state.mode === 'paused';
      const missaoViva = emPartida && !experienceState.missionCompleted;
      if (ui.topGoal) ui.topGoal.classList.toggle('hidden', !missaoViva || isTutorialActive());
      // O anel de tempo e a altitude não significam nada no menu, no mapa ou nas memórias.
      if (ui.celestialHUD) ui.celestialHUD.classList.toggle('hidden', !missaoViva);
    }
    
    if (state.mode === "map") {
        updateMap(state.dt);
        drawMap();
    } else {
        if (state.mode === "menu") {
            const t = state.t;
            const scale = 1 + Math.sin(t * 1.1) * 0.1 + Math.sin(t * 2.5) * 0.05;
            const blur = 20 + Math.sin(t * 0.9) * 5;
            const spread = 15 + Math.sin(t * 1.3) * 5;
            ui.menuOrb.style.transform = `translate(var(--mx,0px),var(--my,0px)) scale(${scale})`;
            ui.menuOrb.style.boxShadow = `0 0 ${blur}px ${spread/2}px rgba(255,249,236,0.15), 0 0 ${blur*2}px ${spread}px rgba(255,196,107,0.1)`;
        }
        if (state.mode === "gameplay") updateGameplay(state.dt);
        updateMusicSystem(state.dt);
        updateCamera(state.dt);
        draw();
    }
  }

  canvas.addEventListener("pointerdown", pointerDown, { passive:false });
  canvas.addEventListener("pointermove", pointerMove, { passive:false });
  window.addEventListener("pointerup", pointerUp, { passive:false });
  window.addEventListener("resize", () => {
      resizeCanvas();
      if (state.mode === "map") resizeMapCanvas();
  });
  canvas.addEventListener("pointerleave", () => {
    state.input.inside = false;
    state.input.holding = false;
    silenceHoldAudio();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      if (state.mode === "gameplay") pauseGame();
      else if (state.mode === "paused") resumeGame();
    }
    if (state.mode === "menu" && (e.code === "Space" || e.code === "Enter")) startGame();
    else if (state.mode === "paused" && (e.code === "Space" || e.code === "Enter")) resumeGame();
    else if (state.mode === "result" && (e.code === "Space" || e.code === "Enter")) startGame();
    else if (state.mode === "gameplay" && (e.code === "Space" || e.code === "Enter")) {
      state.input.x = state.sun.x;
      state.input.y = state.sun.y + state.camera.y;
      state.input.holding = true;
      state.input.inside = true;
      state.input.keyboardHold = true;
      // O auto-repeat do sistema mantém o sustain, mas não dispara pulsos: o gesto tem que ser deliberado.
      if (e.repeat) return;
      state.input.lastPress = state.t;
      tryClickImpulse();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      state.input.holding = false;
      state.input.keyboardHold = false;
      silenceHoldAudio();
    }
  });

