  // --- WEB SHARE API (Redes Sociais) ---
  const poetryTemplates = {
      high: ["the sky opened to your persistence.", "you touched the stars.", "the horizon bowed to your light."],
      medium: ["the mountain witnessed your light.", "the horizon drew closer.", "every meter, a small victory."],
      low: ["a spark. a beginning.", "every light begins small.", "the first flight is special."],
      combo: ["the rhythm woke the sky.", "each pulse, a constellation.", "harmony guided your way."],
      breakthrough: ["the dawn opened. the world breathes.", "the light overcame the void."],
      fail: ["the sun faltered, but the memory remains.", "even light needs to rest."]
  };

  function generateShareData() {
      const isRecord = state.scoreMeters > state.bestMeters;
      const isEternal = state.worldLight >= 100;
      // Estas faixas eram 2000m e 1000m, escritas para a fisica anterior. Com o teto real
      // em ~387m (ver tools/sim-breath.cjs), altCat era SEMPRE 'low' e dois tercos dos
      // versos deste arquivo nunca chegavam a aparecer. Reescaladas contra a curva atual,
      // cujas metas vao de 100m a 300m.
      const altCat = state.scoreMeters > 260 ? 'high' : (state.scoreMeters > 150 ? 'medium' : 'low');
      
      let verse1 = poetryTemplates[altCat][Math.floor(Math.random() * poetryTemplates[altCat].length)];
      let verse2 = state.runStats.breakthroughs > 0 ? poetryTemplates.breakthrough[Math.floor(Math.random() * poetryTemplates.breakthrough.length)] :
                   (state.maxComboThisRun > 8 ? poetryTemplates.combo[Math.floor(Math.random() * poetryTemplates.combo.length)] : 
                   poetryTemplates.fail[Math.floor(Math.random() * poetryTemplates.fail.length)]);
                   
      const harmonyVal = Math.floor((state.runStats.totalStabilityTime / Math.max(1, state.runTime)) * 100);
      
      return {
          type: isEternal ? 'eternal' : (state.runStats.breakthroughs > 0 ? 'breakthrough' : (isRecord ? 'record' : 'normal')),
          poem: t('the sun rested on the horizon'),
          quote: `${t(verse1)} ${t(verse2)}`,
          altitude: Math.floor(state.scoreMeters),
          time: state.runTime,
          harmony: clamp(harmonyVal, 0, 100),
          // Esta frase estava em PORTUGUES FIXO num jogo que fala sete idiomas — e e o
          // texto que o jogador manda para FORA, ou seja, a frase mais publica do jogo.
          // O varredor nao pegou: ela nao vai para textContent, vai para a Web Share API.
          rawText: `${t('I reached {n}m in Sustine.').replace('{n}', Math.floor(state.scoreMeters))} ${t(verse1)} ✧ #Sustine`
      };
  }

  let cachedShareCanvas = null;
  let cachedShareText = "";

  const shareBtn = document.getElementById("shareBtn");
  if(shareBtn) {
    shareBtn.addEventListener("click", async () => {
        const modal = document.getElementById('shareModal');
        const preview = document.getElementById('sharePreview');
        
        showFloating("generating vision...", true);
        const data = generateShareData();
        cachedShareText = data.rawText;
        
        // Constrói o HTML do Card invisível
        const card = document.createElement('div');
        card.className = `share-card share-card-${data.type}`;
        card.innerHTML = `
            <div class="share-card-header"><span>☼ Sustine</span><span>${t("hold the sun").toUpperCase()}</span></div>
            <div class="share-card-sun">☼</div>
            <div class="share-card-poem">${data.poem.replace('\n', '<br>')}</div>
            <div class="share-card-stats">
                <div><span class="share-stat-label">${t("altitude")}</span><span class="share-stat-value">${data.altitude.toLocaleString()} m</span></div>
                <div><span class="share-stat-label">${t("rhythm")}</span><span class="share-stat-value">${formatTime(data.time)}</span></div>
                <div><span class="share-stat-label">${t("harmony")}</span><span class="share-stat-value">${data.harmony}%</span></div>
            </div>
            <div class="share-card-quote">"${data.quote}"</div>
            <div class="share-card-footer">
                <span class="share-tagline">✧ ${t("small gestures can light up the world")} ✧</span>
                <span class="share-hashtags">#Sustine #HoldTheSun</span>
            </div>
        `;
        document.body.appendChild(card);
        
        // Renderiza via html2canvas
        try {
            cachedShareCanvas = await html2canvas(card, { scale: 2, backgroundColor: null, logging: false });
            preview.innerHTML = '';
            preview.appendChild(cachedShareCanvas);
            modal.classList.remove('hidden');
        } catch(e) {
            showFloating("the image would not form", false);
        } finally {
            card.remove();
        }
    });
  }
  
  const closeShareModal = document.getElementById('closeShareModal');
  if (closeShareModal) {
      closeShareModal.addEventListener('click', () => document.getElementById('shareModal').classList.add('hidden'));
  }
  
  const copyTextBtn = document.getElementById('copyTextBtn');
  if (copyTextBtn) {
      copyTextBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(cachedShareText + " " + window.location.href);
          showFloating("the poem is yours", true);
      });
  }
  
  const saveImageBtn = document.getElementById('saveImageBtn');
  if (saveImageBtn) {
      saveImageBtn.addEventListener('click', () => {
          if (!cachedShareCanvas) return;
          const link = document.createElement('a');
          link.download = `Sustine_Journey_${Date.now()}.png`;
          link.href = cachedShareCanvas.toDataURL('image/png');
          link.click();
      });
  }
  
  const shareActionBtn = document.getElementById('shareActionBtn');
  if (shareActionBtn) {
      shareActionBtn.addEventListener('click', async () => {
          if (!cachedShareCanvas) return;
          try {
              const blob = await new Promise(resolve => cachedShareCanvas.toBlob(resolve, 'image/png'));
              const file = new File([blob], 'sustine_journey.png', { type: 'image/png' });
              if (navigator.share && navigator.canShare({ files: [file] })) {
                  await navigator.share({ title: 'Sustine — Hold the Sun', text: cachedShareText, files: [file] });
              } else {
                  showFloating("this device cannot share directly", false);
              }
          } catch(e) {}
      });
  }

