  // --- WEB SHARE API (Redes Sociais) ---
  const poetryTemplates = {
      high: ["the sky opened to your persistence.", "you touched the stars.", "the horizon bowed to your light."],
      medium: ["the mountain witnessed your light.", "the horizon drew closer.", "cada metro, uma conquista."],
      low: ["a spark. a beginning.", "every light begins small.", "the first flight is special."],
      combo: ["the rhythm woke the sky.", "each pulse, a constellation.", "harmony guided your way."],
      breakthrough: ["the dawn opened. the world breathes.", "the light overcame the void."],
      fail: ["the sun faltered, but the memory remains.", "even light needs to rest."]
  };

  function generateShareData() {
      const isRecord = state.scoreMeters > state.bestMeters;
      const isEternal = state.worldLight >= 100;
      const altCat = state.scoreMeters > 2000 ? 'high' : (state.scoreMeters > 1000 ? 'medium' : 'low');
      
      let verse1 = poetryTemplates[altCat][Math.floor(Math.random() * poetryTemplates[altCat].length)];
      let verse2 = state.runStats.breakthroughs > 0 ? poetryTemplates.breakthrough[Math.floor(Math.random() * poetryTemplates.breakthrough.length)] :
                   (state.maxComboThisRun > 8 ? poetryTemplates.combo[Math.floor(Math.random() * poetryTemplates.combo.length)] : 
                   poetryTemplates.fail[Math.floor(Math.random() * poetryTemplates.fail.length)]);
                   
      const harmonyVal = Math.floor((state.runStats.totalStabilityTime / Math.max(1, state.runTime)) * 100);
      
      return {
          type: isEternal ? 'eternal' : (state.runStats.breakthroughs > 0 ? 'breakthrough' : (isRecord ? 'record' : 'normal')),
          poem: `o sol descansou\nno horizonte`,
          quote: `${verse1} ${verse2}`,
          altitude: Math.floor(state.scoreMeters),
          time: state.runTime,
          harmony: clamp(harmonyVal, 0, 100),
          rawText: `Alcancei ${Math.floor(state.scoreMeters)}m em LUMA — Hold the Sun. ${verse1} ✧ #LUMA`
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
            <div class="share-card-header"><span>☼ LUMA</span><span>HOLD THE SUN</span></div>
            <div class="share-card-sun">☼</div>
            <div class="share-card-poem">${data.poem.replace('\n', '<br>')}</div>
            <div class="share-card-stats">
                <div><span class="share-stat-label">altitude</span><span class="share-stat-value">${data.altitude.toLocaleString()} m</span></div>
                <div><span class="share-stat-label">ritmo</span><span class="share-stat-value">${formatTime(data.time)}</span></div>
                <div><span class="share-stat-label">harmonia</span><span class="share-stat-value">${data.harmony}%</span></div>
            </div>
            <div class="share-card-quote">"${data.quote}"</div>
            <div class="share-card-footer">
                <span class="share-tagline">✧ pequenos gestos podem iluminar o mundo ✧</span>
                <span class="share-hashtags">#LUMA #HoldTheSun</span>
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
            showFloating("erro ao gerar imagem", false);
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
          showFloating("poesia copiada", true);
      });
  }
  
  const saveImageBtn = document.getElementById('saveImageBtn');
  if (saveImageBtn) {
      saveImageBtn.addEventListener('click', () => {
          if (!cachedShareCanvas) return;
          const link = document.createElement('a');
          link.download = `Luma_Journey_${Date.now()}.png`;
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
              const file = new File([blob], 'luma_journey.png', { type: 'image/png' });
              if (navigator.share && navigator.canShare({ files: [file] })) {
                  await navigator.share({ title: 'LUMA — Hold the Sun', text: cachedShareText, files: [file] });
              } else {
                  showFloating("this device cannot share directly", false);
              }
          } catch(e) {}
      });
  }

