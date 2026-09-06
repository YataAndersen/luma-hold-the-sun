  // --- JOURNEY MAP SYSTEM ---
  const mapCanvas = document.getElementById('mapCanvas');
  const mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;
  let mapW, mapH;
  const mapUI = {
    title: document.getElementById('nodeTitle'),
    subtitle: document.getElementById('nodeSubtitle'),
    state: document.getElementById('nodeState'),
    btnPlay: document.getElementById('btnPlayNode'),
    btnHome: document.getElementById('btnHomeFromMap'),
    toast: document.getElementById('mapToast'),
    totalDawns: document.getElementById('totalDawnsMap'),
    panel: document.getElementById('mapPanel'),
    mVerb: document.getElementById('mVerb'),
    mMain: document.getElementById('mMain'),
    mSubs: document.getElementById('mSubs'),
    mPerf: document.getElementById('mPerfContainer')
  };

  let selectedNodeId = "m1";
  let mapT = 0;
  let mapToastTimer = 0;
  let mapBgParticles = [];
  let mapLastW = 0, mapLastH = 0;
  let isMapFirstLoad = true;

  function loadMapProgress() {
    try {
      const raw = localStorage.getItem(JOURNEY_SAVE_KEY);
      if (raw) mapProgress = { ...mapProgress, ...JSON.parse(raw) };
    } catch(e) {}
    selectedNodeId = mapProgress.currentNodeId;
  }

  function saveMapProgress() {
    try {
        localStorage.setItem(JOURNEY_SAVE_KEY, JSON.stringify(mapProgress));
    } catch(e) {}
    if (mapUI.totalDawns) mapUI.totalDawns.textContent = mapProgress.totalDawns;
  }

  const evaluateCondition = (cond, run) => {
    if (!cond) return false;
    const [key, val, op] = cond;
    const runVal = run[key] || 0;
    if (op === '<=') return runVal <= val;
    if (op === '==') return runVal === val;
    return runVal >= val;
  };

  function checkMapUnlocks() {
    if (!mapProgress.lastRun || mapProgress.lastRunProcessed) return;
    const run = mapProgress.lastRun;
    if (!mapProgress.nodeStats) mapProgress.nodeStats = {};
    
    const nodeId = run.nodeId;
    if (!nodeId) return;
    
    const node = MAP_NODES.find(n => n.id === nodeId);
    if (!node) return;
    
    if (!mapProgress.nodeStats[node.id]) mapProgress.nodeStats[node.id] = { main: false, subs: [false, false], perf: false };
    const stats = mapProgress.nodeStats[node.id];

    // Uma corrida que terminou em queda não credita nada: os números sozinhos não valem missão.
    if (!run.success) {
      mapProgress.lastRunProcessed = true;
      saveMapProgress();
      return;
    }

    let mainDone = stats.main || evaluateCondition(node.req.main, run);
    let subsDone = [
      stats.subs[0] || evaluateCondition(node.req.subs[0], run),
      stats.subs[1] || evaluateCondition(node.req.subs[1], run)
    ];
    let perfDone = stats.perf || evaluateCondition(node.req.perf, run);
    
    stats.main = mainDone; stats.subs = subsDone; stats.perf = perfDone;

    if (mainDone) {
       if (!mapProgress.completedNodes.includes(node.id)) {
           mapProgress.completedNodes.push(node.id);
           if (node.id === mapProgress.currentNodeId) {
               const idx = MAP_NODES.findIndex(n => n.id === node.id);
               if (idx >= 0 && idx < MAP_NODES.length - 1) mapProgress.currentNodeId = MAP_NODES[idx + 1].id;
               setTimeout(() => showMapToast(`✨ ${t('new ritual unlocked')}: ${t(MAP_NODES[idx + 1].title)}`), 800);
           }
       }
       if (perfDone && !mapProgress.perfectNodes.includes(node.id)) mapProgress.perfectNodes.push(node.id);
    }
    mapProgress.lastRunProcessed = true;
    saveMapProgress();
  }

  function resolveNodes() {
    const SAFE_TOP = 250;
    const SAFE_BOTTOM = 480; // Dá 480 pixels de espaço no final do mapa para o Card flutuante
    const drawableH = mapH - SAFE_TOP - SAFE_BOTTOM;
    
    return MAP_NODES.map(node => {
      const px = node.x * mapW;
      const py = SAFE_TOP + (node.y * drawableH);
      
      let state = 'locked';
      if (mapProgress.perfectNodes.includes(node.id)) state = 'perfect';
      else if (mapProgress.completedNodes.includes(node.id)) state = 'completed';
      else if (node.id === mapProgress.currentNodeId) state = 'current';
      else if (mapProgress.completedNodes.includes(MAP_NODES[Math.max(0, MAP_NODES.findIndex(n=>n.id===node.id)-1)].id)) state = 'available';

      return { ...node, px, py, state };
    });
  }

  function getMapNodeById(id) {
    return resolveNodes().find(n => n.id === id);
  }

  function initMapBg() {
    mapBgParticles = [];
    const numStrands = 24;
    for(let i=0; i<numStrands; i++) {
      let cx = Math.random() * mapW;
      let cy = Math.random() * mapH;
      let length = Math.floor(Math.random() * 4) + 4;
      let freq = Math.random() * 1.5 + 0.8;
      let amp = Math.random() * mapW * 0.6 + mapW * 0.2;
      let vStep = Math.random() * 60 + 40;
      
      for(let j=0; j<length; j++) {
        mapBgParticles.push({
          x: cx + Math.sin(j * freq) * amp,
          y: cy - (j * vStep),
          s: Math.random() * 2 + 0.5,
          a: Math.random() * Math.PI * 2,
          v: Math.random() * 0.15 + 0.05,
          strand: i
        });
      }
    }
  }

  function resizeMapCanvas() {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    const rect = appElement.getBoundingClientRect();
    if (mapLastW === rect.width && Math.abs(mapLastH - rect.height) < 150) return;
    mapLastW = rect.width; mapLastH = rect.height;
    mapW = mapCanvas.width = rect.width;
    mapH = mapCanvas.height = Math.max(5500, rect.height * 8); // Aumenta o espaço entre cada bolinha
    mapCanvas.style.height = `${mapH}px`;
    initMapBg();
    if (isMapFirstLoad) {
        setTimeout(() => scrollToNode(selectedNodeId, 'auto'), 50);
        isMapFirstLoad = false;
    }
  }

  function scrollToNode(id, behavior = 'smooth') {
    const node = resolveNodes().find(n => n.id === id);
    if (!node) return;
    const scrollArea = document.getElementById('scrollArea');
    const rect = document.getElementById('app').getBoundingClientRect();
    // Centralizar na metade da tela deixava o nó atual atrás do card. A área realmente visível
    // do mapa é o que sobra acima dele, então é nela que o nó precisa ficar centrado.
    const panel = document.querySelector('.map-bottom-panel');
    const panelH = panel ? panel.getBoundingClientRect().height + 28 : 0;
    const visibleH = Math.max(160, rect.height - panelH);
    const targetScroll = node.py - (visibleH / 2);
    if(scrollArea) scrollArea.scrollTo({ top: Math.max(0, targetScroll), behavior });
  }

  function drawMapBackground() {
    mapCtx.fillStyle = "rgba(255,249,236,0.03)";
    mapBgParticles.forEach(p => {
      p.y -= p.v;
      p.x += Math.sin(mapT + p.a) * 0.2;
      if (p.y < 0) p.y = mapH;
      mapCtx.beginPath(); mapCtx.arc(p.x, p.y, p.s, 0, Math.PI*2); mapCtx.fill();
    });

    mapCtx.lineWidth = 0.5;
    mapCtx.strokeStyle = "rgba(255,249,236,0.03)";
    mapCtx.beginPath();
    for(let i=0; i<mapBgParticles.length - 1; i++) {
       if (mapBgParticles[i].strand === mapBgParticles[i+1].strand) {
           if (Math.abs(mapBgParticles[i].y - mapBgParticles[i+1].y) < mapH * 0.5) {
               mapCtx.moveTo(mapBgParticles[i].x, mapBgParticles[i].y);
               mapCtx.lineTo(mapBgParticles[i+1].x, mapBgParticles[i+1].y);
           }
       }
    }
    mapCtx.stroke();
  }

  function drawMapEdges(nodes) {
    mapCtx.lineCap = "round";
    MAP_EDGES.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return;

      const isUnlocked = from.state !== 'locked' && to.state !== 'locked';
      const isNext = from.state === 'completed' && to.state === 'current';
      
      mapCtx.beginPath();
      mapCtx.moveTo(from.px, from.py);
      mapCtx.lineTo(to.px, to.py);

      mapCtx.lineWidth = isUnlocked ? 1.5 : 1;
      mapCtx.strokeStyle = isUnlocked ? `rgba(255,249,236, ${isNext ? 0.7 : 0.2})` : 'rgba(255,255,255,0.05)';
      
      if (isNext) {
        mapCtx.setLineDash([4, 6]);
        mapCtx.lineDashOffset = -mapT * 10;
      }
      mapCtx.stroke();
      mapCtx.setLineDash([]);
      
      if (isUnlocked && !isNext) {
        mapCtx.lineWidth = 6;
        mapCtx.strokeStyle = `rgba(244,201,93, 0.05)`;
        mapCtx.stroke();
      }
    });
  }

  function drawMapNode(node) {
    const isSelected = node.id === selectedNodeId;
    const pulse = 1 + Math.sin(mapT * 2.4 + node.px * 0.01) * 0.04;
    
    const stats = (mapProgress.nodeStats && mapProgress.nodeStats[node.id]) 
        ? mapProgress.nodeStats[node.id] 
        : { main: mapProgress.completedNodes.includes(node.id), subs: [false, false], perf: mapProgress.perfectNodes.includes(node.id) };
        
    let starsAchieved = 0;
    if (stats.main) {
        starsAchieved = 1;
        if (stats.subs && stats.subs[0] && stats.subs[1]) starsAchieved = 2;
        if (starsAchieved === 2 && stats.perf) starsAchieved = 3;
    }

    let radius = 14;
    let fill = '#F8F0E2'; // Branca (1 ou 2 estrelas)
    let glow = 'rgba(248,240,226,.4)';
    let ring = false;
    let isCurrent = node.state === 'current';

    if (node.state === 'locked') {
      fill = 'rgba(255,249,236,0.4)'; glow = 'transparent'; radius = 12;
    } else if (starsAchieved === 3) {
      fill = '#FFD893'; glow = 'rgba(255,216,147,.5)'; ring = true; // Dourada (3 estrelas completas)
    } else {
      fill = '#F8F0E2'; glow = 'rgba(248,240,226,.4)'; ring = true; // Branca (Disponível/Incompleta)
    }

    const r = radius * pulse * (isSelected ? 1.3 : 1);

    if (isCurrent) {
      mapCtx.textAlign = "center";
      mapCtx.save();
      const pulse1 = (mapT * 0.8) % 1;
      const pulse2 = (mapT * 0.8 + 0.5) % 1;
      const pulseColor = starsAchieved === 3 ? '255, 216, 147' : '255, 249, 236';

      mapCtx.lineWidth = 1.5;
      mapCtx.strokeStyle = `rgba(${pulseColor}, ${(1 - pulse1) * 0.5})`;
      mapCtx.beginPath(); mapCtx.arc(node.px, node.py, r + pulse1 * 60, 0, Math.PI * 2); mapCtx.stroke();
      mapCtx.strokeStyle = `rgba(${pulseColor}, ${(1 - pulse2) * 0.5})`;
      mapCtx.beginPath(); mapCtx.arc(node.px, node.py, r + pulse2 * 60, 0, Math.PI * 2); mapCtx.stroke();
      mapCtx.restore();

      const textY = node.py - 42 - Math.sin(mapT * 2) * 5;
      mapCtx.shadowBlur = 15;
      mapCtx.shadowColor = `rgba(${pulseColor}, 0.4)`;
      mapCtx.fillStyle = "rgba(10, 26, 42, 0.85)"; 
      mapCtx.strokeStyle = `rgba(${pulseColor}, 0.5)`;
      mapCtx.lineWidth = 1;
      mapCtx.beginPath();
      if (mapCtx.roundRect) mapCtx.roundRect(node.px - 46, textY - 11, 92, 16, 8);
      else mapCtx.rect(node.px - 46, textY - 11, 92, 16);
      mapCtx.fill(); mapCtx.stroke();

      mapCtx.shadowBlur = 10;
      mapCtx.shadowColor = `rgba(${pulseColor}, 0.8)`;
      mapCtx.fillStyle = "rgba(255, 249, 236, 1)";
      mapCtx.font = "600 9px var(--font-ui)";
      mapCtx.fillText("YOU ARE HERE", node.px, textY + 0.5);

      mapCtx.save();
      mapCtx.translate(node.px, node.py);
      mapCtx.rotate(mapT * 0.4);
      mapCtx.fillStyle = `rgba(${pulseColor}, 0.8)`;
      mapCtx.beginPath(); mapCtx.moveTo(0, -32); mapCtx.lineTo(1.5, 0); mapCtx.lineTo(0, 32); mapCtx.lineTo(-1.5, 0); mapCtx.fill();
      mapCtx.beginPath(); mapCtx.moveTo(-32, 0); mapCtx.lineTo(0, 1.5); mapCtx.lineTo(32, 0); mapCtx.lineTo(0, -1.5); mapCtx.fill();
      mapCtx.restore();
    }

    mapCtx.save();
    mapCtx.shadowBlur = isSelected ? 30 : 15;
    mapCtx.shadowColor = glow;
    mapCtx.fillStyle = fill;
    mapCtx.beginPath(); mapCtx.arc(node.px, node.py, r, 0, Math.PI * 2); mapCtx.fill();
    mapCtx.restore();

    if (node.state === 'locked') {
      mapCtx.save();
      mapCtx.translate(node.px, node.py);
      mapCtx.fillStyle = `rgba(255,249,236,${0.15 + Math.sin(mapT*3 + node.py)*0.1})`;
      mapCtx.font = "12px sans-serif"; mapCtx.textAlign = "center"; mapCtx.textBaseline = "middle";
      mapCtx.fillText("✦", -18, -14);
      mapCtx.fillText("✦", 18, 14);
      mapCtx.font = "8px sans-serif";
      mapCtx.fillText("✦", 14, -12);

      mapCtx.strokeStyle = "rgba(10, 26, 42, 0.6)"; // Cadeado escuro para dar contraste na bolinha opaca
      mapCtx.lineWidth = 1.5;
      mapCtx.beginPath(); mapCtx.arc(0, -3, 4, Math.PI, 0); mapCtx.stroke();

      mapCtx.fillStyle = "rgba(10, 26, 42, 0.6)";
      mapCtx.beginPath();
      if (mapCtx.roundRect) mapCtx.roundRect(-6, -1, 12, 9, 2);
      else mapCtx.rect(-6, -1, 12, 9);
      mapCtx.fill();

      mapCtx.fillStyle = "rgba(255, 249, 236, 0.8)";
      mapCtx.fillRect(-1, 2, 2, 3);
      mapCtx.restore();
    }

    if (ring) {
      mapCtx.strokeStyle = `rgba(255,249,236,${isSelected ? 0 : .2})`;
      mapCtx.lineWidth = 1;
      mapCtx.beginPath();
      if (isCurrent) mapCtx.setLineDash([2, 4]);
      mapCtx.arc(node.px, node.py, r + 8 + Math.sin(mapT * 3 + node.py) * 2, 0, Math.PI * 2);
      mapCtx.stroke();
      mapCtx.setLineDash([]);
    }

    if (isSelected) {
      mapCtx.save();
      mapCtx.translate(node.px, node.py);
      mapCtx.rotate(mapT * 0.5);
      mapCtx.strokeStyle = "rgba(255, 249, 236, 0.9)";
      mapCtx.lineWidth = 1.5;
      mapCtx.setLineDash([6, 6]);
      mapCtx.beginPath();
      mapCtx.arc(0, 0, r + 12 + Math.sin(mapT * 4) * 2, 0, Math.PI * 2);
      mapCtx.stroke();
      mapCtx.restore();
    }

    // --- SISTEMA DE ESTRELAS E NOMES (Estilo Clash of Clans) ---
    mapCtx.save();
    
    let textAlpha = 0.8;
    if (node.state === 'locked') textAlpha = 0.3;
    else if (node.state === 'available') textAlpha = 0.6;
    else if (node.state === 'current') textAlpha = 1.0;
    
    // Alterna o lado do texto para nunca vazar para fora da tela nas bordas do zigue-zague
    const isRightSide = node.x > 0.5;
    mapCtx.textAlign = isRightSide ? "right" : "left";
    mapCtx.textBaseline = "middle";
    const xOffset = isRightSide ? -28 : 28;
    
    // 1. Título da Missão
    mapCtx.font = "600 13px var(--font-display)";
    mapCtx.fillStyle = `rgba(255, 249, 236, ${textAlpha})`;
    if (node.state === 'current') {
        mapCtx.shadowBlur = 10;
        mapCtx.shadowColor = "rgba(255, 216, 147, 0.5)";
    }
    mapCtx.fillText(node.title.toLowerCase(), node.px + xOffset, node.py - 6);
    
    // 2. Estrelas (Vazadas / Preenchidas)
    mapCtx.shadowBlur = 0;
    mapCtx.font = "14px Arial, sans-serif"; // Fonte segura para garantir as formas ✩ e ★ nativas
    
    let starStr = "";
    for (let i = 0; i < 3; i++) {
        starStr += (i < starsAchieved) ? "★" : "☆";
        if (i < 2) starStr += " "; // Espaçamento
    }
    
    mapCtx.fillStyle = `rgba(255, 216, 147, ${textAlpha === 0.3 ? 0.3 : 0.9})`;
    mapCtx.fillText(starStr, node.px + xOffset, node.py + 10);
    
    mapCtx.restore();
  }

  function drawMap() {
    const nodes = resolveNodes();
    mapCtx.clearRect(0, 0, mapW, mapH);
    drawMapBackground();
    drawMapEdges(nodes);
    nodes.forEach(drawMapNode);
  }

  function syncMapPanel() {
    const node = getMapNodeById(selectedNodeId);
    if (!node) return;
    
    if (mapUI.title) mapUI.title.textContent = t(node.title);
    // O subtitulo repetia o objetivo, que ja aparece no bloco abaixo. Agora traz o contexto
    // do bioma, e o verbo saiu por ser redundante com o proprio texto do objetivo.
    if (mapUI.subtitle) mapUI.subtitle.textContent = t(node.meta || '').toLowerCase();
    if (mapUI.state) mapUI.state.textContent = t(node.state);
    
    const stats = mapProgress.nodeStats && mapProgress.nodeStats[node.id] 
        ? mapProgress.nodeStats[node.id] 
        : { main: mapProgress.completedNodes.includes(node.id), subs: [false, false], perf: mapProgress.perfectNodes.includes(node.id) };

    const iconCheck = `<span style="color:rgba(255,249,236,0.8); font-weight:300; font-size:14px; margin-right:6px;">✦</span>`;
    const iconDot = `<span style="color:rgba(255,249,236,0.2); font-weight:300; font-size:14px; margin-right:6px;">∘</span>`;
    
    if (mapUI.mMain) mapUI.mMain.innerHTML = `${stats.main ? iconCheck : iconDot} <span>${t(node.main)}</span>`;
    if (mapUI.mSubs) mapUI.mSubs.innerHTML = node.subs.map((s, i) => `<div class="map-m-sub-item">${stats.subs[i] ? iconCheck : iconDot} ${t(s)}</div>`).join('');
    
    const perfIcon = stats.perf ? `<span style="color:rgba(255,249,236,0.8); font-weight:300; font-size:14px; margin-right:6px;">✧</span>` : `<span style="color:rgba(255,249,236,0.2); font-size:14px; margin-right:6px;">∘</span>`;
    if (mapUI.mPerf) mapUI.mPerf.innerHTML = `${perfIcon}<div id="mPerf">${t("perfect")}: ${t(node.perf)}</div>`;

    if (node.state === 'current') {
        if (mapUI.state) {
            // O texto do selo já foi escrito com t(node.state) acima; aqui só a cor muda.
            mapUI.state.style.color = "var(--sun-core)";
            mapUI.state.style.border = "1px solid rgba(255, 216, 147, 0.4)";
            mapUI.state.style.background = "rgba(255, 216, 147, 0.1)";
        }
        if (mapUI.btnPlay) {
            mapUI.btnPlay.style.opacity = "1";
            mapUI.btnPlay.style.pointerEvents = "auto";
        }
    } else if (node.state === 'locked') {
        if (mapUI.state) {
            mapUI.state.style.color = "rgba(255,255,255,0.4)";
            mapUI.state.style.border = "1px solid rgba(255,255,255,0.05)";
            mapUI.state.style.background = "transparent";
        }
        if (mapUI.btnPlay) {
            mapUI.btnPlay.style.opacity = "0.4";
            mapUI.btnPlay.style.pointerEvents = "none";
        }
    } else {
        if (mapUI.state) {
            mapUI.state.style.color = "rgba(255,249,236,0.85)";
            mapUI.state.style.border = "1px solid rgba(255,249,236,0.2)";
            mapUI.state.style.background = "transparent";
        }
        if (mapUI.btnPlay) {
            mapUI.btnPlay.style.opacity = "1";
            mapUI.btnPlay.style.pointerEvents = "auto";
        }
    }
  }

  function showMapToast(msg) {
    if (mapUI.toast) {
        mapUI.toast.textContent = msg;
        mapUI.toast.classList.add('show');
        mapToastTimer = 2.5;
    }
  }

  function updateMap(dt) {
      mapT += dt;
      if (mapToastTimer > 0) {
          mapToastTimer -= dt;
          if (mapToastTimer <= 0 && mapUI.toast) mapUI.toast.classList.remove('show');
      }
  }

  const scrollArea = document.getElementById('scrollArea');
  let isMapDragging = false, mapStartY = 0, mapScrollTop = 0, mapHasDragged = false;

  if (scrollArea) {
      scrollArea.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return; 
        isMapDragging = true; mapHasDragged = false;
        mapStartY = e.pageY; mapScrollTop = scrollArea.scrollTop;
        scrollArea.style.cursor = 'grabbing';
      });
      window.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'mouse') return;
        isMapDragging = false;
        if(scrollArea) scrollArea.style.cursor = 'default';
      });
      scrollArea.addEventListener('pointermove', (e) => {
        if (!isMapDragging || e.pointerType !== 'mouse') return;
        e.preventDefault();
        const y = e.pageY;
        const walk = (y - mapStartY) * 1.5; 
        if (Math.abs(walk) > 5) {
           mapHasDragged = true;
           scrollArea.scrollTop = mapScrollTop - walk;
        }
      });
      
      const chapterButtons = document.querySelectorAll('.chapter-btn');
      const chapterNodeIndices = [0, 10, 20, 30, 40];
      
      chapterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const chapter = parseInt(btn.dataset.chapter);
          const nodeIndex = chapterNodeIndices[chapter - 1];
          if (nodeIndex < MAP_RAW_NODES.length) {
            const nodeId = MAP_RAW_NODES[nodeIndex].id;
            scrollToNode(nodeId, 'smooth');
          }
        });
      });

      scrollArea.addEventListener('scroll', () => {
          const scrollFraction = scrollArea.scrollTop / Math.max(1, scrollArea.scrollHeight - scrollArea.clientHeight);
          const invertedFraction = Math.max(0, Math.min(1, 1 - scrollFraction)); // Topo da div = fim do jogo
          const currentNodeIndex = Math.floor(invertedFraction * (MAP_NODES.length - 1));
          const currentChapter = Math.floor(currentNodeIndex / 10) + 1;

          chapterButtons.forEach(btn => {
              if (parseInt(btn.dataset.chapter) === currentChapter) {
                  btn.classList.add('active');
              } else {
                  btn.classList.remove('active');
              }
          });
      });
  }

  if (mapCanvas) {
      mapCanvas.addEventListener('click', (e) => {
        if (mapHasDragged) return; 
        const rect = mapCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (mapW / rect.width);
    const y = (e.clientY - rect.top) * (mapH / rect.height);
    const nodes = resolveNodes();

    for (const node of nodes) {
      const d = Math.hypot(x - node.px, y - node.py);
      if (d < 40) {
        selectedNodeId = node.id;
        syncMapPanel();
        scrollToNode(node.id, 'smooth');
        break;
      }
      }
    });
  }

  if (mapUI.btnPlay) {
      mapUI.btnPlay.addEventListener('click', () => {
        showMapToast(`${t('entering')} ${t(getMapNodeById(selectedNodeId).title)}...`);
        const fade = document.getElementById('fade');
        if (fade) fade.classList.add('active');
        setTimeout(() => { 
            document.getElementById("mapScreen").classList.add("hidden");
            experienceState.mission = HOLD_THE_SUN_MISSIONS.find(m => m.id === selectedNodeId) || HOLD_THE_SUN_MISSIONS[0];
            
            initAudio();
            resetRun();
            state.mode = "gameplay";
            ui.menu.classList.add("hidden");
            ui.pause.classList.add("hidden");
            if(ui.result) ui.result.classList.add("hidden");
            ui.draft.classList.add("hidden");
            startTutorial();
            
            if (fade) fade.classList.remove('active');
        }, 1200);
      });
  }

  if (mapUI.btnHome) {
      mapUI.btnHome.addEventListener('click', () => {
        const fade = document.getElementById('fade');
        if (fade) fade.classList.add('active');
        setTimeout(() => { 
            document.getElementById("mapScreen").classList.add("hidden");
            backToMenu();
            if (fade) fade.classList.remove('active');
        }, 1200);
      });
  }

  loadProgress();
  loadMapProgress();
  checkMapUnlocks();
  syncMapPanel();
  initMissionSystem();
  resizeCanvas();
  initWorldDecor();
  resetRun();
  updateMenuMeta();
  
