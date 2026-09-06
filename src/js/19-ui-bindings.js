  const audioToggle = document.getElementById("audioToggle");
  if(audioToggle) {
      audioToggle.addEventListener("click", () => {
          audio.isMuted = !audio.isMuted;
          audioToggle.style.opacity = audio.isMuted ? '0.4' : '1';
          if (audio.isMuted) {
              audioToggle.style.color = 'var(--danger-warn)';
          } else {
              audioToggle.style.color = 'rgba(255,249,236,0.7)';
          }
      });
  }

  document.getElementById("startBtn").addEventListener("click", startGame);
  const restartBtn = document.getElementById("restartBtn");
  if(restartBtn) restartBtn.addEventListener("click", startGame);
  document.getElementById("resumeBtn").addEventListener("click", resumeGame);
  document.getElementById("pauseRestartBtn").addEventListener("click", startGame);
  ui.pauseBtn.addEventListener("click", () => {
    if (state.mode === "gameplay") pauseGame();
    else if (state.mode === "paused") resumeGame();
  });
  
  ui.openHarmonyBtn.addEventListener("click", () => { ui.menu.classList.add("hidden"); ui.harmony.classList.remove("hidden"); });
  const pauseHarmonyBtn = document.getElementById("pauseHarmonyBtn");
  if (pauseHarmonyBtn) pauseHarmonyBtn.addEventListener("click", () => { ui.pause.classList.add("hidden"); ui.harmony.classList.remove("hidden"); });
  
  ui.closeHarmonyBtn.addEventListener("click", () => { 
      ui.harmony.classList.add("hidden"); 
      if (state.mode === "paused") ui.pause.classList.remove("hidden");
      else ui.menu.classList.remove("hidden");
      saveProgress(); 
  });
  
  // --- BIND SETTINGS UI ---
  const bindSlider = (id, obj, key, valId) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', e => {
          obj[key] = parseInt(e.target.value);
          if(valId) document.getElementById(valId).textContent = e.target.value + '%';
          applySettingsToDOM(); saveProgress();
      });
  };
  const bindSelect = (id, obj, key) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('change', e => {
          obj[key] = e.target.value;
          applySettingsToDOM(); saveProgress();
      });
  };
  const bindToggle = (id, obj, key, statusId, trueStr, falseStr) => {
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('change', e => {
          obj[key] = e.target.checked;
          if(statusId) document.getElementById(statusId).textContent = t(e.target.checked ? trueStr : falseStr);
          applySettingsToDOM(); saveProgress();
          if(key === 'haptics' && e.target.checked && navigator.vibrate) navigator.vibrate(10);
      });
  };
  
  bindSlider('setMus', settings.audio, 'music', 'valMus');
  bindSlider('setSfx', settings.audio, 'sfx', 'valSfx');
  bindSlider('setAmb', settings.audio, 'ambient', 'valAmb');
  bindSlider('setMas', settings.audio, 'master', 'valMas');
  bindSelect('setDiff', settings.gameplay, 'difficulty');
  bindSlider('setSens', settings.gameplay, 'sensitivity', 'valSens');
  bindToggle('setHap', settings.gameplay, 'haptics', 'valHap', 'on', 'off');
  bindSelect('setVisFb', settings.gameplay, 'feedback');
  bindSlider('setBri', settings.visual, 'brightness', 'valBri');
  bindSelect('setPart', settings.visual, 'particles');
  bindToggle('setRedMot', settings.visual, 'reduceMotion', 'valRedMot', 'on', 'off');
  bindToggle('setHighCont', settings.accessibility, 'highContrast', 'valHighCont', 'on', 'off');
  bindSelect('setTextSz', settings.accessibility, 'textSize');
  bindSelect('setColorBl', settings.accessibility, 'colorBlind');
  
  const setAnalyticsEl = document.getElementById('setAnalytics');
  if (setAnalyticsEl) setAnalyticsEl.addEventListener('change', e => {
      settings.analyticsConsent = e.target.checked;
      document.getElementById('valAnalytics').textContent = e.target.checked ? 'ativado' : 'desativado';
      applySettingsToDOM(); saveProgress();
      if (settings.analyticsConsent) analytics.start(); else analytics.stop();
      analytics.track(EVENT_TYPES.ANALYTICS_CONSENT, { consent: settings.analyticsConsent });
  });
  
  // --- DATA MANAGEMENT ---
  const btnResetProg = document.getElementById('btnResetProg');
  if (btnResetProg) btnResetProg.addEventListener('click', () => {
      if (confirm("toda sua luz será apagada. selos, pássaros, metros — tudo se perderá. esta ação não pode ser desfeita. continuar?")) {
          localStorage.removeItem(SAVE_KEY);
          localStorage.removeItem(JOURNEY_SAVE_KEY);
          window.location.reload();
      }
  });
  
  const btnExportSave = document.getElementById('btnExportSave');
  if (btnExportSave) btnExportSave.addEventListener('click', () => {
      const data = JSON.stringify({ luma_core: localStorage.getItem(SAVE_KEY), luma_map: localStorage.getItem(JOURNEY_SAVE_KEY) });
      const blob = new Blob([data], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `luma_save_${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(a.href);
  });
  
  const btnImportSave = document.getElementById('btnImportSave');
  const fileImportSave = document.getElementById('fileImportSave');
  if (btnImportSave && fileImportSave) {
      btnImportSave.addEventListener('click', () => fileImportSave.click());
      fileImportSave.addEventListener('change', e => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => { try { const d = JSON.parse(ev.target.result); if(d.luma_core) localStorage.setItem(SAVE_KEY, d.luma_core); if(d.luma_map) localStorage.setItem(JOURNEY_SAVE_KEY, d.luma_map); window.location.reload(); } catch(err) { alert('corrupted light file.'); } };
          reader.readAsText(file);
      });
  }
  
  const skipBtn = document.getElementById("skipTutorialBtn");
  if (skipBtn) skipBtn.addEventListener("click", () => endTutorial(false));
  
  const completeBtn = document.getElementById("completeProceedBtn");
  if (completeBtn) completeBtn.addEventListener("click", () => {
      const sc = document.getElementById('tutorialCompleteScreen');
      if (sc) sc.classList.add('hidden');
      state.mode = 'menu';
      backToMenu();
  });
  
  const replayBtn = document.getElementById("replayTutorialBtn");
  if (replayBtn) replayBtn.addEventListener("click", () => {
      settings.tutorialDone = false;
      saveProgress();
      ui.harmony.classList.add("hidden");
      ui.menu.classList.add("hidden");
      startGame();
  });

  ui.openMemoriesBtn.addEventListener("click", showMemories);
  ui.closeMemoriesBtn.addEventListener("click", () => ui.memoriesScreen.classList.add("hidden"));
  
  document.querySelectorAll('.draft-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const cardElement = e.currentTarget;
      if (cardElement.dataset.graceId) {
        selectUpgrade(cardElement.dataset.graceId);
      }
    });
  });

  const pendingDraftBtn = document.getElementById("pendingDraftBtn");
  if (pendingDraftBtn) {
      pendingDraftBtn.addEventListener("pointerdown", (e) => e.stopPropagation()); // Evita que o toque passe para o canvas
      pendingDraftBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (state.mode === "gameplay" && state.draft.pending > 0) enterDraft();
      });
  }

  const nextNodeBtn = document.getElementById("nextNodeBtn");
  if(nextNodeBtn) nextNodeBtn.addEventListener("click", () => {
      const m = HOLD_THE_SUN_MISSIONS.find(mission => mission.id === mapProgress.currentNodeId);
      if (m) {
          experienceState.mission = m;
          startGame();
      }
  });

  const returnToMap = () => { 
    const fade = document.getElementById("fade");
    if (fade) fade.classList.add("active");
    setTimeout(() => {
      state.mode = "map";
      ui.menu.classList.add("hidden");
      ui.pause.classList.add("hidden");
      if(ui.result) ui.result.classList.add("hidden");
      ui.harmony.classList.add("hidden");
      ui.memoriesScreen.classList.add("hidden");
      document.getElementById("mapScreen").classList.remove("hidden");
      resizeMapCanvas();
      setTimeout(() => scrollToNode(selectedNodeId, 'instant'), 20); // FORÇA SCROLL IMEDIATO
      if (fade) fade.classList.remove("active");
    }, 1200);
  };
  if(ui.returnMapMenuBtn) ui.returnMapMenuBtn.addEventListener("click", returnToMap);
  if(ui.returnMapPauseBtn) ui.returnMapPauseBtn.addEventListener("click", returnToMap);
  if(ui.returnMapResultBtn) ui.returnMapResultBtn.addEventListener("click", returnToMap);
  const altarTravelBtn = document.getElementById("altarTravelToMap");
  if(altarTravelBtn) altarTravelBtn.addEventListener("click", returnToMap);
  if(ui.homePauseBtn) ui.homePauseBtn.addEventListener("click", backToMenu);
  if(ui.homeResultBtn) ui.homeResultBtn.addEventListener("click", backToMenu);

