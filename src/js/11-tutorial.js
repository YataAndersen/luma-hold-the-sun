  // --- TUTORIAL v1.0 SYSTEM ---
  function startTutorial() { 
      state.tutorial.active = true; 
      state.tutorial.chapter = 1; 
      state.tutorial.step = 1; 
      state.tutorial.delay = 1.0;
  }
  
  function endTutorial(completed) {
      state.tutorial.active = false;
      settings.tutorialDone = true;
      saveProgress();
      if (ui.tutContainer) ui.tutContainer.classList.add("hidden");
      
      if (completed) {
          // Sem a tela, o modo 'tutorial_complete' vira um beco sem saída: nada a mostrar e
          // nada que devolva o jogador ao menu. Antes isso lançava exceção com o modo já trocado.
          const sc = document.getElementById('tutorialCompleteScreen');
          if (sc) {
              state.mode = 'tutorial_complete';
              sc.classList.remove('hidden');
          } else {
              backToMenu();
          }
          playDawnAwakened();
      } else {
          showFloating("ritual skipped. the sky is yours.", true);
      }
  }

  function setTut(icon, text, showHand) {
      if (ui.tutIcon) ui.tutIcon.textContent = icon;
      if (ui.tutText) ui.tutText.textContent = t(text);
      if (ui.tutHand) ui.tutHand.style.display = showHand ? 'flex' : 'none';
      if (ui.tutContainer) ui.tutContainer.classList.remove('hidden');
  }

  function updateTutorialLogic(dt) {
      if (!state.tutorial.active || state.mode !== "gameplay") return;
      
      const sunScreenY = state.sun.y + state.camera.y;
      const dist = Math.hypot(state.input.x - state.sun.x, state.input.y - sunScreenY);
      const isNear = dist < tune.influenceRadius * 1.2;

      if (state.tutorial.delay > 0) { state.tutorial.delay -= dt; return; }

      if (state.tutorial.chapter === 1) { // CHAPTER 1: SUSTAIN
          state.entropy = 0; state.sun.energy = 1; 
          if (state.tutorial.step === 1) {
              setTut("☼", "the sun waits. touch near it to hold it up.", true);
              if (state.input.holding && isNear) { state.tutorial.step = 2; state.tutorial.delay = 1.0; showFloating("like that. the sun responds.", true); }
          } else if (state.tutorial.step === 2) {
              setTut("≈", "hold the sun. it rises with your touch.", false);
              if (!state.input.holding) ui.tutText.textContent = t("keep holding. the sun needs you.");
              if (state.scoreMeters > 50) {
                  state.tutorial.chapter = 2; state.tutorial.step = 1; state.tutorial.perfects = 0; state.tutorial.delay = 2.0;
                  showFloating("first flight.", true);
                  if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
              }
          }
      } else if (state.tutorial.chapter === 2) { // CHAPTER 2: RHYTHM
          state.entropy = 0;
          if (state.tutorial.step === 1) {
              setTut("⌖", "tap the core to pulse.", true);
              if (state.tutorial.perfects >= 3) { state.tutorial.step = 2; state.tutorial.delay = 1.5; showFloating("perfect. the rhythm begins.", true); }
          } else if (state.tutorial.step === 2) {
              setTut("∿", "pulses in sequence build rhythm. reach combo x3.", false);
              if (state.combo >= 3) {
                  state.tutorial.chapter = 3; state.tutorial.step = 1; state.tutorial.delay = 2.0;
                  showFloating("the world begins to wake.", true);
                  if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
              }
          }
      } else if (state.tutorial.chapter === 3) { // CHAPTER 3: CARE
          if (state.tutorial.step === 1) {
              setTut("◈", "energy sustains flight. stability holds the form.", false);
              state.tutorial.delay = 4.0; state.tutorial.step = 2;
          } else if (state.tutorial.step === 2) {
              setTut("◬", "the horizon is the limit. if the sun falls too far, the world goes dark.", false);
              if (state.sun.nearFail) { state.tutorial.step = 3; state.tutorial.delay = 0.5; }
          } else if (state.tutorial.step === 3) {
              setTut("◓", "the sun falters. one last pulse can save it!", true);
              if (!state.sun.nearFail && state.sun.vy < 0) { state.tutorial.step = 4; state.tutorial.delay = 2.0; showFloating("the abyss drew back.", true); }
          } else if (state.tutorial.step === 4) {
              setTut("◒", "stay high and steady to open the dawn.", false);
              if (state.sun.breakthrough) { state.tutorial.step = 5; state.tutorial.delay = 1.0; showFloating("the dawn opens.", true); if (ui.tutContainer) ui.tutContainer.classList.add('hidden'); }
          } else if (state.tutorial.step === 5) {
              setTimeout(() => endTutorial(true), 1000);
          }
      }
  }

