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
      

      if (state.tutorial.delay > 0) { state.tutorial.delay -= dt; return; }

      if (state.tutorial.chapter === 1) { // CAPÍTULO 1: INSPIRAR
          // A energia NÃO é mais fixada em 1. Fixá-la ensinava o gesto num mundo onde
          // segurar não custava nada, e o jogador saía do tutorial sem nunca ter sentido
          // o fôlego encher — que é a única coisa que o jogo pede dele.
          state.entropy = 0;
          if (state.tutorial.step === 1) {
              setTut("☼", "the sun waits. touch anywhere and hold.", true);
              if (state.input.holding) { state.tutorial.step = 2; state.tutorial.delay = 1.0; showFloating("like that. the sun responds.", true); }
          } else if (state.tutorial.step === 2) {
              setTut("≈", "hold. the sun rises, and the ring begins to fill.", false);
              if (!state.input.holding) ui.tutText.textContent = t("keep holding. the sun needs you.");
              if (state.scoreMeters > 50) {
                  state.tutorial.chapter = 2; state.tutorial.step = 1; state.tutorial.perfects = 0; state.tutorial.delay = 2.0;
                  showFloating("first flight.", true);
                  if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
              }
          }
      } else if (state.tutorial.chapter === 2) { // CAPÍTULO 2: SOLTAR NO PONTO
          state.entropy = 0;
          if (state.tutorial.step === 1) {
              // Espera o peito encher antes de pedir o gesto, para que o primeiro toque
              // do jogador aconteça exatamente no ponto e ele sinta a diferença.
              const cheio = state.sun.energy >= maxBreath() - 0.02;
              setTut(cheio ? "◉" : "◌",
                     cheio ? "the ring closed. let go now." : "hold. the ring fills with light.",
                     cheio);
              if (state.tutorial.perfects >= 2) { state.tutorial.step = 2; state.tutorial.delay = 1.5; showFloating("perfect. the rhythm begins.", true); }
          } else if (state.tutorial.step === 2) {
              setTut("∿", "let the ring close, then let go. three times.", false);
              if (state.combo >= 3) {
                  state.tutorial.chapter = 2.5; state.tutorial.step = 1; state.tutorial.delay = 2.0;
                  showFloating("the world begins to wake.", true);
                  if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
              }
          }
      } else if (state.tutorial.chapter === 2.5) { // CAPÍTULO 2.5: SEGURAR DEMAIS
          // O jogador precisa SENTIR a outra ponta do erro, não só a pressa. Este capítulo
          // só sai quando ele deixa a respiração prender uma vez e vê a luz endurecer.
          state.entropy = 0;
          setTut("◍", "hold past the close and the ring tightens. feel it.", false);
          if (state.sun.strain > 0.75) {
              state.tutorial.chapter = 3; state.tutorial.step = 1; state.tutorial.delay = 2.0;
              showFloating("that is the edge. breathe before it.", true);
              if (ui.tutContainer) ui.tutContainer.classList.add('hidden');
          }
      } else if (state.tutorial.chapter === 3) { // CHAPTER 3: CARE
          if (state.tutorial.step === 1) {
              setTut("◈", "energy sustains flight. stability holds the form.", false);
              state.tutorial.delay = 4.0; state.tutorial.step = 2;
          } else if (state.tutorial.step === 2) {
              setTut("◬", "the horizon is the limit. if the sun falls too far, the world goes dark.", false);
              if (state.sun.nearFail) { state.tutorial.step = 3; state.tutorial.delay = 0.5; }
          } else if (state.tutorial.step === 3) {
              setTut("◓", "the sun falters. release your breath to save it!", true);
              if (!state.sun.nearFail && state.sun.vy < 0) { state.tutorial.step = 4; state.tutorial.delay = 2.0; showFloating("the abyss drew back.", true); }
          } else if (state.tutorial.step === 4) {
              setTut("◒", "stay high and steady to open the dawn.", false);
              if (state.sun.breakthrough) { state.tutorial.step = 5; state.tutorial.delay = 1.0; showFloating("the dawn opens.", true); if (ui.tutContainer) ui.tutContainer.classList.add('hidden'); }
          } else if (state.tutorial.step === 5) {
              setTimeout(() => endTutorial(true), 1000);
          }
      }
  }

