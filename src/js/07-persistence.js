  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      // Sem save, um "return" aqui pulava o applySettingsToDOM() do fim da função e o jogador
      // novo ficava sem idioma, sem brilho e sem as classes de acessibilidade aplicados.
      if (!raw) throw new Error('sem save');
      const data = JSON.parse(raw);
      state.totalMeters = data.totalMeters || 0;
      state.worldLight = data.worldLight || 0;
      state.bestMeters = data.bestMeters || 0;
      state.dawnsAwakened = data.dawnsAwakened || 0;
      state.totalRunMemory = {
          totalForests: (data.totalRunMemory && data.totalRunMemory.totalForests) || 0, 
          totalBirds: (data.totalRunMemory && data.totalRunMemory.totalBirds) || 0, 
          totalWindows: (data.totalRunMemory && data.totalRunMemory.totalWindows) || 0
      };
      if (data.settings) {
          if (typeof data.settings.music === 'number') { // Mapeia Saves Antigos para a v1.0
              settings.audio.music = Math.round(data.settings.music * 100);
              settings.audio.sfx = Math.round(data.settings.sfx * 100);
              settings.gameplay.haptics = data.settings.haptics;
          } else {
              settings = { ...settings, ...data.settings };
          }
      }
    } catch(e) {}
    applySettingsToDOM();
  }
  
  function applySettingsToDOM() {
      setLocale(settings.locale || detectLocale());
      const langSel = document.getElementById('setLang');
      if (langSel) {
          if (!langSel.options.length) {
              Object.keys(LOCALES).forEach(code => {
                  const o = document.createElement('option');
                  o.value = code; o.textContent = LOCALE_NAMES[code] || code;
                  langSel.appendChild(o);
              });
              langSel.addEventListener('change', () => {
                  settings.locale = langSel.value;
                  // applySettingsToDOM (e não só setLocale) porque há rótulos escritos por JS,
                  // como o "on/off" dos toggles, que o passe pelo [data-i18n] não alcança.
                  applySettingsToDOM();
                  saveProgress();
              });
          }
          langSel.value = currentLocale;
      }

      // Aplica classes de Acessibilidade
      document.body.className = '';
      if (settings.accessibility.highContrast) document.body.classList.add('high-contrast');
      if (settings.visual.reduceMotion) document.body.classList.add('reduce-motion');
      if (settings.accessibility.textSize !== 'medium') document.body.classList.add(`text-${settings.accessibility.textSize}`);
      if (settings.accessibility.colorBlind !== 'off') document.body.classList.add(settings.accessibility.colorBlind);
      
      // Brilho
      let bOver = document.getElementById('brightnessOverlay');
      if (!bOver) { bOver = document.createElement('div'); bOver.id = 'brightnessOverlay'; bOver.style.cssText = "position:fixed;inset:0;background:black;pointer-events:none;z-index:9999;"; document.body.appendChild(bOver); }
      bOver.style.opacity = 1 - (settings.visual.brightness / 100);
      
      // Valores UI (Sincroniza os Sliders e Menus com a Memória)
      if (document.getElementById('setMus')) document.getElementById('setMus').value = settings.audio.music;
      if (document.getElementById('valMus')) document.getElementById('valMus').textContent = settings.audio.music + '%';
      if (document.getElementById('setSfx')) document.getElementById('setSfx').value = settings.audio.sfx;
      if (document.getElementById('valSfx')) document.getElementById('valSfx').textContent = settings.audio.sfx + '%';
      if (document.getElementById('setAmb')) document.getElementById('setAmb').value = settings.audio.ambient;
      if (document.getElementById('valAmb')) document.getElementById('valAmb').textContent = settings.audio.ambient + '%';
      if (document.getElementById('setMas')) document.getElementById('setMas').value = settings.audio.master;
      if (document.getElementById('valMas')) document.getElementById('valMas').textContent = settings.audio.master + '%';
      
      if (document.getElementById('setDiff')) document.getElementById('setDiff').value = settings.gameplay.difficulty;
      if (document.getElementById('setSens')) document.getElementById('setSens').value = settings.gameplay.sensitivity;
      if (document.getElementById('valSens')) document.getElementById('valSens').textContent = settings.gameplay.sensitivity + '%';
      if (document.getElementById('setHap')) document.getElementById('setHap').checked = settings.gameplay.haptics;
      if (document.getElementById('valHap')) document.getElementById('valHap').textContent = t(settings.gameplay.haptics ? 'on' : 'off');
      if (document.getElementById('setVisFb')) document.getElementById('setVisFb').value = settings.gameplay.feedback;
      
      if (document.getElementById('setBri')) document.getElementById('setBri').value = settings.visual.brightness;
      if (document.getElementById('valBri')) document.getElementById('valBri').textContent = settings.visual.brightness + '%';
      if (document.getElementById('setPart')) document.getElementById('setPart').value = settings.visual.particles;
      if (document.getElementById('setRedMot')) document.getElementById('setRedMot').checked = settings.visual.reduceMotion;
      if (document.getElementById('valRedMot')) document.getElementById('valRedMot').textContent = t(settings.visual.reduceMotion ? 'on' : 'off');
      
      if (document.getElementById('setHighCont')) document.getElementById('setHighCont').checked = settings.accessibility.highContrast;
      if (document.getElementById('valHighCont')) document.getElementById('valHighCont').textContent = t(settings.accessibility.highContrast ? 'on' : 'off');
      if (document.getElementById('setTextSz')) document.getElementById('setTextSz').value = settings.accessibility.textSize;
      if (document.getElementById('setColorBl')) document.getElementById('setColorBl').value = settings.accessibility.colorBlind;
      if (document.getElementById('setAnalytics')) document.getElementById('setAnalytics').checked = settings.analyticsConsent === true;
      if (document.getElementById('valAnalytics')) document.getElementById('valAnalytics').textContent = t(settings.analyticsConsent ? 'on' : 'off');
  }
  
  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        totalMeters: state.totalMeters,
        bestMeters: state.bestMeters,
        dawnsAwakened: state.dawnsAwakened,
        totalRunMemory: state.totalRunMemory,
        settings: settings
      }));
    } catch(e) {}
  }

  function syncJourneyMap(isSuccess = false) {
    mapProgress.totalDawns += state.runDawns;
    mapProgress.bestScore = Math.max(mapProgress.bestScore, state.scoreMeters);

    mapProgress.lastRun = {
       success: !!isSuccess,
       nodeId: experienceState.mission ? experienceState.mission.id : "m1",
       score: state.scoreMeters,
       dawns: state.runDawns,
       birds: state.runStats.birdsReturned,
       combo: state.maxComboThisRun || state.combo,
       nearFails: state.runStats.nearFails || 0,
       breakthroughs: state.runStats.breakthroughs || 0,
       maxTimeAboveLine: state.runStats.maxTimeAboveLine || 0,
       stabilityTime: state.runStats.maxStabilityTime || 0,
       runTime: state.runTime
    };
    mapProgress.lastRunProcessed = false;
    checkMapUnlocks();
  }

