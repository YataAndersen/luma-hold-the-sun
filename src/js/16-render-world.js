  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(state.camera.shake.x, state.camera.shake.y);

    state.world.breath += state.dt * 0.1;
    const breathOffset = Math.sin(state.world.breath) * 4;

    drawSky();
    drawStars();
    drawConstellation();
    drawMoon();
    drawAurora();
    drawClouds('back');
    ctx.save();
    ctx.translate(0, breathOffset * 0.5);
    drawMountains();
    drawClouds('front');
    drawAmbientDust();
    ctx.restore();
    
    ctx.save();
    ctx.translate(0, state.camera.y * 0.8); // Midground Unified (0.8x Parallax)
    drawSkyline();
    drawTrees();
    
    const d = state.sky.dawn;
    let mgColorArr = mixColor([18, 32, 52], [100, 58, 42], d); // MG Tone (30%)
    if (state.biome === 'snow') mgColorArr = mixColor([30, 45, 65], [140, 170, 190], d);
    if (state.biome === 'sea') mgColorArr = mixColor([10, 20, 40], [30, 80, 120], d);
    if (state.biome === 'volcano') mgColorArr = mixColor([20, 10, 15], [90, 20, 15], d);
    if (state.biome === 'aether') mgColorArr = mixColor([20, 15, 40], [120, 70, 160], d);
    if (state.biome === 'cosmos') mgColorArr = mixColor([5, 8, 15], [10, 20, 35], d);
    if (state.biome === 'desert') mgColorArr = mixColor([40, 20, 15], [180, 100, 60], d);
    if (state.biome === 'crystal') mgColorArr = mixColor([15, 5, 30], [80, 40, 120], d);
    if (state.biome === 'city') mgColorArr = mixColor([25, 15, 35], [80, 50, 90], d); // Night City tones
    if (state.biome === 'autumn') mgColorArr = mixColor([30, 15, 10], [160, 70, 30], d);
    if (state.biome === 'swamp') mgColorArr = mixColor([10, 20, 15], [40, 80, 50], d);
    if (state.biome === 'sakura') mgColorArr = mixColor([30, 15, 25], [180, 100, 140], d);
    if (state.biome === 'canyon') mgColorArr = mixColor([35, 15, 10], [140, 60, 30], d);
    if (state.biome === 'ruins') mgColorArr = mixColor([15, 25, 20], [60, 120, 100], d);
    if (state.biome === 'abyss') mgColorArr = mixColor([2, 5, 10], [10, 20, 40], d);
    if (state.biome === 'shattered') mgColorArr = mixColor([15, 15, 15], [80, 20, 30], d);
    if (state.biome === 'nebula') mgColorArr = mixColor([20, 5, 30], [100, 30, 140], d);
    if (state.biome === 'cyber') mgColorArr = mixColor([10, 5, 20], [40, 10, 80], d);
    if (state.biome === 'zenith') mgColorArr = mixColor([40, 40, 50], [220, 210, 240], d);
    if (['ursa', 'orion', 'aries'].includes(state.biome)) mgColorArr = mixColor([2, 5, 10], [5, 15, 25], d);

    ctx.fillStyle = `rgb(${mgColorArr.join(',')})`;
    
    // Chão Ondulado Orgânico (Onde as árvores são plantadas)
    if (state.biome !== 'sea') {
        ctx.beginPath();
        ctx.moveTo(-W, HORIZON_Y);
        for(let x = -W; x <= W*2; x += 30) { ctx.lineTo(x, HORIZON_Y - 10 + Math.sin(x * 0.03)*8 + Math.cos(x * 0.02)*12); }
        ctx.lineTo(W*2, H*2); ctx.lineTo(-W, H*2); ctx.fill();
    }
    
    // O Resgate da Névoa (30% base -> 0% topo, limites estendidos para evitar "quadrados")
    let horizonColor = mixColor([68, 103, 192], [245, 215, 179], d);
    if (state.biome === 'snow') horizonColor = mixColor([60, 90, 140], [220, 240, 255], d);
    if (state.biome === 'sea') horizonColor = mixColor([30, 80, 130], [80, 180, 210], d);
    if (state.biome === 'volcano') horizonColor = mixColor([140, 30, 20], [255, 100, 40], d);
    if (state.biome === 'aether') horizonColor = mixColor([120, 60, 160], [255, 180, 200], d);
    if (state.biome === 'cosmos') horizonColor = mixColor([20, 30, 50], [40, 60, 90], d);
    if (state.biome === 'desert') horizonColor = mixColor([180, 80, 40], [255, 200, 120], d);
    if (state.biome === 'crystal') horizonColor = mixColor([80, 20, 120], [160, 80, 200], d);
    if (state.biome === 'city') horizonColor = mixColor([40, 30, 60], [200, 120, 160], d); // Neon Dusk
    if (state.biome === 'autumn') horizonColor = mixColor([120, 60, 40], [240, 140, 80], d);
    if (state.biome === 'swamp') horizonColor = mixColor([20, 40, 30], [80, 140, 100], d);
    if (state.biome === 'sakura') horizonColor = mixColor([120, 70, 90], [255, 180, 210], d);
    if (state.biome === 'canyon') horizonColor = mixColor([80, 40, 30], [200, 120, 80], d);
    if (state.biome === 'ruins') horizonColor = mixColor([30, 70, 60], [100, 180, 160], d);
    if (state.biome === 'abyss') horizonColor = mixColor([10, 15, 25], [20, 40, 60], d);
    if (state.biome === 'shattered') horizonColor = mixColor([40, 20, 20], [140, 60, 60], d);
    if (state.biome === 'nebula') horizonColor = mixColor([60, 20, 80], [160, 80, 200], d);
    if (state.biome === 'cyber') horizonColor = mixColor([20, 10, 40], [0, 120, 160], d);
    if (state.biome === 'zenith') horizonColor = mixColor([220, 220, 230], [255, 255, 255], d);
    if (['ursa', 'orion', 'aries'].includes(state.biome)) horizonColor = mixColor([10, 20, 40], [20, 40, 70], d);

    const midFogGrad = ctx.createLinearGradient(0, HORIZON_Y - 120, 0, HORIZON_Y + 20);
    midFogGrad.addColorStop(0, `rgba(${horizonColor.join(',')}, 0)`);
    midFogGrad.addColorStop(1, `rgba(${horizonColor.join(',')}, 0.3)`); // 30% Opacidade na base
    ctx.fillStyle = midFogGrad;
    ctx.fillRect(-W, HORIZON_Y - 120, W * 4, H * 2);
    ctx.restore();
    
    ctx.save();
    drawRare();
    ctx.restore();
    ctx.save();
    ctx.translate(0, state.camera.y);
    drawLeaves();
    // drawBirds(); // Desativado para performance extrema
    // drawPulses(); // Desativado para performance extrema
    // drawTrail(); // Removido
    drawSun();
    // drawDust(); // Desativado para performance extrema
      drawForeground(); // Desenhado por último. Se o sol cair, ele esconde ATRÁS do mato rasteiro!
    ctx.restore();
    drawRain();
    drawDawnGoal();
    drawDangerOverlay();
    
    if (state.screenFlash.alpha > 0.001) {
        ctx.fillStyle = state.screenFlash.color;
        ctx.globalAlpha = state.screenFlash.alpha;
        ctx.fillRect(0,0,W,H);
        ctx.globalAlpha = 1;
    }
    
    drawCutscene();
    
    ctx.restore();
  }

  function drawSky() {
    const d = state.sky.dawn;
    const w = state.worldResponse.warmthLevel;
    const l = state.worldResponse.lightLevel;
    let topA = [10, 26, 42],    
        topB = [26, 47, 68];   
    let midA = [26, 47, 68],   
        midB = [196, 107, 78]; 
    let botA = [58, 122, 217],
        botB = [245, 215, 179];
        
    if (state.biome === 'meadow') { topB = [42, 95, 122]; midB = [123, 165, 192]; botB = [245, 215, 179]; }
    else if (state.biome === 'hills') { topB = [26, 47, 68]; midB = [98, 133, 159]; botB = [245, 215, 179]; }
    else if (state.biome === 'coast') { topB = [10, 26, 42]; midB = [42, 95, 122]; botB = [138, 203, 162]; }
    else if (state.biome === 'snow') { topB = [26, 50, 75]; midB = [120, 150, 180]; botB = [220, 240, 255]; } 
    else if (state.biome === 'sea') { topB = [10, 25, 50]; midB = [30, 80, 130]; botB = [80, 180, 210]; } 
    else if (state.biome === 'volcano') { topB = [30, 10, 20]; midB = [140, 30, 20]; botB = [255, 100, 40]; } 
    else if (state.biome === 'aether') { topB = [20, 10, 40]; midB = [120, 60, 160]; botB = [255, 180, 200]; }
    else if (state.biome === 'cosmos') { topB = [2, 4, 10]; midB = [5, 10, 20]; botB = [15, 25, 45]; }
    else if (state.biome === 'desert') { topB = [20, 15, 30]; midB = [180, 80, 40]; botB = [255, 180, 100]; }
    else if (state.biome === 'crystal') { topB = [5, 2, 15]; midB = [60, 15, 80]; botB = [40, 160, 200]; } // Cyan horizon
    else if (state.biome === 'city') { topB = [15, 20, 35]; midB = [45, 30, 60]; botB = [120, 70, 110]; } 
    else if (state.biome === 'autumn') { topB = [20,30,40]; midB = [160,70,30]; botB = [255,140,60]; }
    else if (state.biome === 'swamp') { topB = [10,20,15]; midB = [40,80,50]; botB = [100,160,120]; }
    else if (state.biome === 'sakura') { topB = [30,15,25]; midB = [180,100,140]; botB = [255,200,220]; }
    else if (state.biome === 'canyon') { topB = [20,10,10]; midB = [140,60,30]; botB = [220,120,60]; }
    else if (state.biome === 'ruins') { topB = [5,15,15]; midB = [40,100,90]; botB = [120,200,180]; }
    else if (state.biome === 'abyss') { topB = [2,2,5]; midB = [5,10,20]; botB = [10,20,40]; }
    else if (state.biome === 'shattered') { topB = [10,10,10]; midB = [60,20,20]; botB = [180,50,50]; }
    else if (state.biome === 'nebula') { topB = [15,5,25]; midB = [90,30,120]; botB = [200,100,255]; }
    else if (state.biome === 'cyber') { topB = [5,2,10]; midB = [40,10,80]; botB = [0,255,255]; }
    else if (state.biome === 'zenith') { topB = [180,180,200]; midB = [240,230,250]; botB = [255,255,255]; }
    else if (['ursa', 'orion', 'aries'].includes(state.biome)) { topB = [2, 5, 15]; midB = [10, 20, 40]; botB = [20, 40, 70]; }
    else if (state.biome === 'storm') { 
        const ri = state.weather.rainIntensity;
        topB = mixColor(topB, [20, 25, 30], ri); 
        midB = mixColor(midB, [40, 45, 50], ri); 
        botB = mixColor(botB, [50, 55, 60], ri); 
    }

    if (state.sky.zone === "wind_realm") {
      midB = mixColor(midB, [192, 152, 206], 0.5); // Blend lavender
    }
    if (state.sun.nearFail) {
      topA = [6, 13, 37]; topB = [6, 13, 37];     // 10% Cold
      midA = [26, 45, 96]; midB = [26, 45, 96];   // 30% Cold
      botA = [100, 58, 42]; botB = [100, 58, 42]; // 30% Warm (Tensão, drenada)
    }
    if (state.sky.zone === "dawn_sea") {
      topB = [82, 118, 145];
      midB = [242, 180, 130];
      botB = [255, 244, 199];
    }
    const top = mixColor(topA, topB, clamp(d * .7 + w * .3, 0, 1));
    const mid = mixColor(midA, midB, clamp(d * .55 + w * .45, 0, 1));
    const bot = mixColor(botA, botB, clamp(d * .35 + l * .65, 0, 1));
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(top));
    g.addColorStop(.56, rgb(mid));
    g.addColorStop(1, rgb(bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (state.sky.silentSky > .01) {
      ctx.fillStyle = `rgba(255,249,236,${state.sky.silentSky * .06})`;
      ctx.fillRect(0, 0, W, H);
    }
    const bloom = ctx.createLinearGradient(0, HORIZON_Y - 80, 0, HORIZON_Y + 110);
    const op = drawMissionEnhancedHorizonBloom(clamp(.08 + state.worldResponse.horizonBloomIntensity * .26 + (getVol(2) * 0.5), 0, .6)); // VFX Sync
    bloom.addColorStop(0, `rgba(245,215,179,0)`); // 90% Terracota base
    bloom.addColorStop(.5, `rgba(245,215,179,${op})`);
    bloom.addColorStop(1, `rgba(245,215,179,0)`);
    ctx.fillStyle = bloom;
    ctx.fillRect(0, HORIZON_Y - 80, W, 180);
  }
  function drawStars() {
    const d = state.sky.dawn;
    const spaceModifier = state.biome === 'cosmos' ? 0 : d; // No espaço a luz do dia não apaga as estrelas!
    ctx.save();
    for (const s of state.world.stars) {
      const a = (0.25 + 0.25 * Math.sin(state.t * .9 + s.tw)) * (1 - spaceModifier);
      if (a <= .01) continue;
      ctx.globalAlpha = a;
      ctx.beginPath();
      let sy = (s.y + state.camera.y * 0.1) % H;
      if (sy < 0) sy += H;
      ctx.arc(s.x, sy, s.size * .15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,249,236,.9)";
      ctx.fill();
    }
    
    for (const s of state.world.horizonStars) {
      const a = (0.1 + 0.3 * Math.sin(state.t * .5 + s.tw)) * Math.max(0, 1 - spaceModifier * 1.5);
      if (a <= .01) continue;
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.beginPath();
      ctx.arc(s.x, s.y + state.camera.y * .05, s.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,249,236,.6)";
      ctx.fill();
    }
    ctx.restore();
  }
  
  function drawConstellation() {
      if (!state.world.constellation) return;
      ctx.save();
      ctx.translate(0, state.camera.y * 0.05); // Ligeiro parallax estelar
      const { points, lines } = state.world.constellation;
      
      ctx.strokeStyle = "rgba(255, 249, 236, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -state.t * 5;
      ctx.beginPath();
      lines.forEach(([i, j]) => {
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      
      points.forEach(p => {
          const a = 0.5 + 0.5 * Math.sin(state.t * 1.5 + p.tw);
          ctx.shadowBlur = 15; ctx.shadowColor = "rgba(255, 249, 236, 0.8)";
          ctx.fillStyle = `rgba(255, 249, 236, ${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
          
          ctx.fillStyle = `rgba(255, 249, 236, ${a * 0.5})`;
          ctx.fillRect(p.x - p.size*2, p.y - 0.5, p.size*4, 1);
          ctx.fillRect(p.x - 0.5, p.y - p.size*2, 1, p.size*4);
      });
      ctx.restore();
  }
  
  function drawMoon() {
      if (state.biome !== 'cosmos') return;
      ctx.save();
      const parallaxY = state.camera.y * 0.05; 
      const my = H * 0.28 + parallaxY;
      const mx = W * 0.72;
      
      ctx.shadowBlur = 60;
      ctx.shadowColor = "rgba(220, 230, 255, 0.4)";
      ctx.fillStyle = "rgba(240, 248, 255, 1)";
      ctx.beginPath(); ctx.arc(mx, my, 70, 0, Math.PI*2); ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(180, 200, 220, 0.25)";
      ctx.beginPath(); ctx.arc(mx - 20, my - 15, 18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 25, my + 10, 12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx - 5, my + 25, 22, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 10, my - 30, 8, 0, Math.PI*2); ctx.fill();
      ctx.restore();
  }

  function drawMountains() {
    ctx.save();
    const glow = state.worldResponse.mountainGlowIntensity;
    const d = state.sky.dawn;
    const l = state.worldResponse.lightLevel;
    const w = state.worldResponse.warmthLevel;
    
    let horizonAtmosphereColor = mixColor([68, 103, 192], [245, 215, 179], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'snow') horizonAtmosphereColor = mixColor([60, 90, 140], [220, 240, 255], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'sea') horizonAtmosphereColor = mixColor([30, 80, 130], [80, 180, 210], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'volcano') horizonAtmosphereColor = mixColor([140, 30, 20], [255, 100, 40], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'aether') horizonAtmosphereColor = mixColor([120, 60, 160], [255, 180, 200], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'cosmos') horizonAtmosphereColor = mixColor([20, 30, 50], [40, 60, 90], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'desert') horizonAtmosphereColor = mixColor([180, 80, 40], [255, 200, 120], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'crystal') horizonAtmosphereColor = mixColor([80, 20, 120], [160, 80, 200], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'city') horizonAtmosphereColor = mixColor([40, 30, 60], [200, 120, 160], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'autumn') horizonAtmosphereColor = mixColor([120, 60, 40], [240, 140, 80], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'swamp') horizonAtmosphereColor = mixColor([20, 40, 30], [80, 140, 100], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'sakura') horizonAtmosphereColor = mixColor([120, 70, 90], [255, 180, 210], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'canyon') horizonAtmosphereColor = mixColor([80, 40, 30], [200, 120, 80], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'ruins') horizonAtmosphereColor = mixColor([30, 70, 60], [100, 180, 160], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'abyss') horizonAtmosphereColor = mixColor([10, 15, 25], [20, 40, 60], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'shattered') horizonAtmosphereColor = mixColor([40, 20, 20], [140, 60, 60], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'nebula') horizonAtmosphereColor = mixColor([60, 20, 80], [160, 80, 200], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'cyber') horizonAtmosphereColor = mixColor([20, 10, 40], [0, 120, 160], clamp(d * .35 + l * .65, 0, 1));
    if (state.biome === 'zenith') horizonAtmosphereColor = mixColor([220, 220, 230], [255, 255, 255], clamp(d * .35 + l * .65, 0, 1));
    
    if (state.biome === 'storm') {
        const ri = state.weather.rainIntensity;
        horizonAtmosphereColor = mixColor(horizonAtmosphereColor, [50, 55, 60], ri);
    }

    const drawLayer = (layerName, colorArr, parallaxY, fogHeight) => {
      const mountains = state.world.mountains.filter(m => m.layer === layerName);
      if (mountains.length === 0) return;
      ctx.save();
      ctx.translate(0, parallaxY);
      
      // Desenha as montanhas individualmente fechando o polígono de forma perfeita e limpa
      ctx.beginPath();
      mountains.forEach((m) => {
        const h = m.h + Math.sin(state.t * .14 + m.wobble) * 3;
        const hw = m.w / 2;
        const px = m.x + hw * m.peak;
        const st = m.steep;
        ctx.moveTo(m.x - hw, HORIZON_Y + 50);
        ctx.lineTo(m.x - hw, HORIZON_Y);
        if (state.biome === 'crystal' || state.biome === 'shattered') {
            ctx.lineTo(px, HORIZON_Y - h * 1.2); // Pontiagudas
        } else if (state.biome === 'canyon') {
            ctx.lineTo(m.x - hw + hw * st, HORIZON_Y - h); // Mesas achatadas
            ctx.lineTo(m.x + hw - hw * st, HORIZON_Y - h);
        } else if (state.biome === 'ruins') {
            ctx.moveTo(m.x - hw * 0.3, HORIZON_Y - h); // Blocos Flutuantes
            ctx.lineTo(m.x + hw * 0.3, HORIZON_Y - h);
            ctx.lineTo(m.x + hw * 0.3, HORIZON_Y - h * 0.6);
            ctx.lineTo(m.x - hw * 0.3, HORIZON_Y - h * 0.6);
        } else {
            ctx.bezierCurveTo(m.x - hw + hw * st, HORIZON_Y, px - hw * st, HORIZON_Y - h, px, HORIZON_Y - h);
            ctx.bezierCurveTo(px + hw * st, HORIZON_Y - h, m.x + hw - hw * st, HORIZON_Y, m.x + hw, HORIZON_Y);
        }
        ctx.lineTo(m.x + hw, HORIZON_Y + 50);
        ctx.closePath();
      });
      ctx.rect(-W, HORIZON_Y, W * 4, H * 2); // Anexa o chão base à máscara
      
      ctx.fillStyle = `rgb(${colorArr.join(',')})`;
      ctx.fill(); 
      
      // O Resgate do Sistema Cinematográfico: Névoa de 30% na base para 0% no topo, sem clip (fim do bug do quadrado)
      const blendedFog = mixColor(colorArr, horizonAtmosphereColor, 0.3);
      const grad = ctx.createLinearGradient(0, HORIZON_Y - fogHeight, 0, HORIZON_Y + 50);
      grad.addColorStop(0, `rgba(${blendedFog.join(',')}, 0)`);
      grad.addColorStop(1, `rgba(${blendedFog.join(',')}, 0.3)`); // Base 30% alpha
      ctx.fillStyle = grad;
      ctx.fillRect(-W, HORIZON_Y - fogHeight, W * 4, fogHeight + H * 2);
      
      ctx.restore();
    };

    // CINEMATOGRAPHIC DEPTH v4.0 (Flawless Atmospheric Perspective)
    let backColor3 = mixColor([42, 95, 122], [232, 158, 107], d * 0.7 + w * 0.3);
    let backColor2 = mixColor([26, 47, 68], [196, 107, 78], d * 0.65 + w * 0.35); 
    let backColor1 = mixColor([10, 26, 42], [139, 90, 74], d * 0.6 + w * 0.4);
    
    if (state.biome === 'meadow') {
        backColor3 = mixColor([106, 143, 106], [196, 107, 78], d*0.7+w*0.3); backColor2 = mixColor([90, 122, 79], [196, 107, 78], d*0.65+w*0.35); backColor1 = mixColor([74, 106, 63], [139, 90, 74], d*0.6+w*0.4);
    } else if (state.biome === 'hills') {
        backColor3 = mixColor([122, 143, 143], [196, 107, 78], d*0.7+w*0.3); backColor2 = mixColor([106, 127, 127], [196, 107, 78], d*0.65+w*0.35); backColor1 = mixColor([90, 111, 111], [139, 90, 74], d*0.6+w*0.4);
    } else if (state.biome === 'coast') {
        backColor3 = mixColor([35, 92, 227], [196, 107, 78], d*0.7+w*0.3); backColor2 = mixColor([58, 122, 217], [196, 107, 78], d*0.65+w*0.35); backColor1 = mixColor([138, 203, 162], [139, 90, 74], d*0.6+w*0.4);
    } else if (state.biome === 'snow') {
        backColor3 = mixColor([40, 60, 80], [180, 200, 220], d * 0.7 + w * 0.3);
        backColor2 = mixColor([30, 45, 65], [140, 170, 190], d * 0.65 + w * 0.35);
        backColor1 = mixColor([20, 30, 50], [100, 130, 160], d * 0.6 + w * 0.4);
    } else if (state.biome === 'sea') {
        backColor3 = mixColor([15, 30, 50], [40, 100, 140], d * 0.7 + w * 0.3);
        backColor2 = mixColor([10, 20, 40], [30, 80, 120], d * 0.65 + w * 0.35);
        backColor1 = mixColor([5, 15, 30], [20, 60, 90], d * 0.6 + w * 0.4);
    } else if (state.biome === 'volcano') {
        backColor3 = mixColor([30, 15, 20], [120, 40, 30], d * 0.7 + w * 0.3);
        backColor2 = mixColor([20, 10, 15], [90, 20, 15], d * 0.65 + w * 0.35);
        backColor1 = mixColor([10, 5, 8], [50, 10, 5], d * 0.6 + w * 0.4);
    } else if (state.biome === 'aether') {
        backColor3 = mixColor([30, 20, 50], [160, 100, 200], d * 0.7 + w * 0.3);
        backColor2 = mixColor([20, 15, 40], [120, 70, 160], d * 0.65 + w * 0.35);
        backColor1 = mixColor([15, 10, 30], [80, 40, 120], d * 0.6 + w * 0.4);
    } else if (state.biome === 'cosmos') {
        backColor3 = mixColor([10, 15, 25], [30, 40, 60], d * 0.7 + w * 0.3);
        backColor2 = mixColor([5, 10, 15], [20, 30, 50], d * 0.65 + w * 0.35);
        backColor1 = mixColor([0, 5, 10], [10, 20, 35], d * 0.6 + w * 0.4);
    } else if (state.biome === 'desert') {
        backColor3 = mixColor([60, 30, 20], [200, 120, 70], d * 0.7 + w * 0.3);
        backColor2 = mixColor([40, 20, 15], [160, 90, 50], d * 0.65 + w * 0.35);
        backColor1 = mixColor([30, 15, 10], [120, 60, 40], d * 0.6 + w * 0.4);
    } else if (state.biome === 'crystal') {
        backColor3 = mixColor([25, 10, 45], [80, 40, 140], d * 0.7 + w * 0.3);
        backColor2 = mixColor([15, 5, 30], [60, 25, 100], d * 0.65 + w * 0.35);
        backColor1 = mixColor([10, 2, 20], [40, 15, 70], d * 0.6 + w * 0.4);
    } else if (state.biome === 'city') {
        backColor3 = mixColor([30, 20, 45], [100, 50, 80], d * 0.7 + w * 0.3);
        backColor2 = mixColor([20, 15, 35], [70, 30, 60], d * 0.65 + w * 0.35);
        backColor1 = mixColor([10, 8, 20], [40, 15, 40], d * 0.6 + w * 0.4);
    } else if (state.biome === 'autumn') {
        backColor3 = mixColor([80, 40, 30], [180, 100, 60], d*0.7+w*0.3);
        backColor2 = mixColor([60, 30, 20], [140, 80, 40], d*0.65+w*0.35);
        backColor1 = mixColor([40, 20, 15], [100, 60, 30], d*0.6+w*0.4);
    } else if (state.biome === 'swamp') {
        backColor3 = mixColor([20, 40, 30], [80, 140, 100], d*0.7+w*0.3);
        backColor2 = mixColor([15, 30, 25], [60, 100, 80], d*0.65+w*0.35);
        backColor1 = mixColor([10, 20, 15], [40, 80, 60], d*0.6+w*0.4);
    } else if (state.biome === 'sakura') {
        backColor3 = mixColor([40, 20, 30], [200, 120, 160], d*0.7+w*0.3);
        backColor2 = mixColor([30, 15, 25], [160, 100, 140], d*0.65+w*0.35);
        backColor1 = mixColor([20, 10, 15], [120, 80, 100], d*0.6+w*0.4);
    } else if (state.biome === 'canyon') {
        backColor3 = mixColor([50, 25, 20], [160, 80, 40], d*0.7+w*0.3);
        backColor2 = mixColor([40, 20, 15], [120, 60, 30], d*0.65+w*0.35);
        backColor1 = mixColor([30, 15, 10], [100, 50, 25], d*0.6+w*0.4);
    } else if (state.biome === 'ruins') {
        backColor3 = mixColor([20, 40, 35], [80, 160, 140], d*0.7+w*0.3);
        backColor2 = mixColor([15, 30, 25], [60, 120, 100], d*0.65+w*0.35);
        backColor1 = mixColor([10, 20, 15], [40, 80, 70], d*0.6+w*0.4);
    } else if (state.biome === 'abyss') {
        backColor3 = mixColor([8, 12, 20], [15, 25, 45], d*0.7+w*0.3);
        backColor2 = mixColor([5, 8, 15], [10, 15, 30], d*0.65+w*0.35);
        backColor1 = mixColor([2, 5, 10], [5, 10, 20], d*0.6+w*0.4);
    } else if (state.biome === 'shattered') {
        backColor3 = mixColor([25, 15, 15], [100, 40, 40], d*0.7+w*0.3);
        backColor2 = mixColor([15, 10, 10], [70, 25, 25], d*0.65+w*0.35);
        backColor1 = mixColor([10, 5, 5], [40, 15, 15], d*0.6+w*0.4);
    } else if (state.biome === 'nebula') {
        backColor3 = mixColor([30, 10, 45], [140, 50, 180], d*0.7+w*0.3);
        backColor2 = mixColor([20, 5, 30], [100, 30, 140], d*0.65+w*0.35);
        backColor1 = mixColor([10, 2, 20], [60, 15, 100], d*0.6+w*0.4);
    } else if (state.biome === 'cyber') {
        backColor3 = mixColor([15, 10, 30], [60, 20, 120], d*0.7+w*0.3);
        backColor2 = mixColor([10, 5, 20], [40, 10, 80], d*0.65+w*0.35);
        backColor1 = mixColor([5, 2, 15], [20, 5, 50], d*0.6+w*0.4);
    } else if (state.biome === 'zenith') {
        backColor3 = mixColor([150, 150, 160], [255, 240, 250], d*0.7+w*0.3);
        backColor2 = mixColor([120, 120, 130], [255, 255, 255], d*0.65+w*0.35);
        backColor1 = mixColor([90, 90, 100], [240, 240, 255], d*0.6+w*0.4);
    } else if (['ursa', 'orion', 'aries'].includes(state.biome)) {
        backColor3 = mixColor([5, 10, 20], [15, 25, 45], d * 0.7 + w * 0.3);
        backColor2 = mixColor([2, 5, 15], [10, 15, 30], d * 0.65 + w * 0.35);
        backColor1 = mixColor([0, 2, 8], [5, 10, 20], d * 0.6 + w * 0.4);
    }
    
    if (state.biome === 'storm') {
        const ri = state.weather.rainIntensity;
        backColor3 = mixColor(backColor3, [40, 45, 50], ri);
        backColor2 = mixColor(backColor2, [30, 35, 40], ri);
        backColor1 = mixColor(backColor1, [20, 25, 30], ri);
    }
    
    // A serra de bruma vai antes de tudo e quase nao se move: parallax lento e o que o
    // olho le como "muito longe". A cor puxa para a atmosfera do horizonte, nao para a
    // rocha, porque a esta distancia o ar pesa mais do que a materia.
    const brumaLonge = mixColor(backColor3, horizonAtmosphereColor, 0.62);
    drawLayer('bg4', brumaLonge, state.camera.y * 0.07, 260);
    drawLayer('bg3', backColor3, state.camera.y * 0.15, 220); 
    drawLayer('bg2', backColor2, state.camera.y * 0.3, 160); 
    drawLayer('bg1', backColor1, state.camera.y * 0.5, 100); 

    const riverGlow = state.worldResponse.lightLevel * 0.2;
    if (riverGlow > 0.01) {
        ctx.save();
        ctx.globalAlpha = riverGlow;
        ctx.strokeStyle = `rgba(189, 231, 247, ${0.1 + riverGlow * 0.2})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(189, 231, 247, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, HORIZON_Y - 5);
        ctx.bezierCurveTo(W * 0.3, HORIZON_Y - 15, W * 0.6, HORIZON_Y + 5, W, HORIZON_Y);
        ctx.stroke();
        ctx.restore();
    }

    if (glow > .02) {
      ctx.strokeStyle = `rgba(255,217,122,${glow * .26})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255,217,122,.25)";
      ctx.beginPath();
      ctx.moveTo(0, HORIZON_Y);
      ctx.lineTo(W, HORIZON_Y);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawClouds(layer) {
      const isBack = layer === 'back';
      // Sem .filter(): alocava um array por camada por frame só para varrer a mesma lista.
      let hasAny = false;
      for (const c of state.world.clouds) { if (c.layer === layer) { hasAny = true; break; } }
      if (!hasAny) return;
      ctx.save();
      const d = state.sky.dawn;
      const parallax = isBack ? 0.3 : 0.6; // Parallax dinâmico vertical forte
      ctx.translate(0, state.camera.y * parallax);

      const solidColor = isBack ? mixColor([68, 103, 192], [196, 107, 78], d) : mixColor([104, 134, 208], [232, 158, 107], d);
      const alpha = isBack ? 0.4 : 0.7;
      
      let finalColor = solidColor;
      if (state.biome === 'storm') finalColor = mixColor(finalColor, [40, 45, 50], state.weather.rainIntensity);
      ctx.fillStyle = `rgba(${finalColor.join(',')}, ${alpha})`;
      
      // Aplica o desfoque para deixar as nuvens macias e criar profundidade de campo
      ctx.filter = isBack ? 'blur(12px)' : 'blur(6px)';

      // Um único path para a camada inteira. Cada fill() sob ctx.filter custa uma passada de
      // blur numa superfície temporária, então um fill por nuvem eram N blurs por frame.
      // O moveTo antes de cada arc evita que os arcos se liguem por linhas.
      const puff = (x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); };
      ctx.beginPath();
      for (const c of state.world.clouds) {
          if (c.layer !== layer) continue;
          const s = c.size;
          if (c.type === 0) {
              puff(c.x, c.y, s * 0.6);
              puff(c.x + s * 0.6, c.y + s * 0.1, s * 0.45);
              puff(c.x - s * 0.5, c.y + s * 0.15, s * 0.4);
              ctx.rect(c.x - s * 0.7, c.y + s * 0.1, s * 1.5, s * 0.45);
          } else if (c.type === 1) {
              puff(c.x, c.y, s * 0.7);
              puff(c.x + s * 0.7, c.y + s * 0.2, s * 0.4);
              puff(c.x - s * 0.7, c.y + s * 0.2, s * 0.5);
              puff(c.x + s * 1.2, c.y + s * 0.3, s * 0.25);
              ctx.rect(c.x - s * 0.9, c.y + s * 0.2, s * 2.2, s * 0.5);
          } else {
              puff(c.x, c.y, s * 0.5);
              puff(c.x + s * 0.5, c.y + s * 0.1, s * 0.4);
              puff(c.x - s * 0.4, c.y + s * 0.1, s * 0.35);
              ctx.rect(c.x - s * 0.6, c.y + s * 0.1, s * 1.3, s * 0.35);
          }
      }
      ctx.fill();
      ctx.restore();
  }
  function drawAmbientDust() {
      if (settings.visual.particles === 'off') return;
      const biome = state.biome;

      // O bioma não muda entre partículas: cor, escala e forma são resolvidas uma vez por frame
      // em vez de 60. getMissionReactiveSunBrightness() também era recalculada por partícula.
      const isFirefly = biome === 'forest' || biome === 'swamp';
      const isSand = biome === 'desert' || biome === 'canyon';
      const isDrop = biome === 'zenith' || biome === 'aether';
      const sunBrightness = getMissionReactiveSunBrightness() * 0.5;

      let dustColor = "#FFF9EC", sizeMul = 1, alphaMul = 1;
      if (isFirefly) { dustColor = "#A9D4C5"; sizeMul = 1.5; }
      else if (isSand) { dustColor = "#E89E6B"; sizeMul = 0.8; }
      else if (biome === 'snow' || biome === 'hills') dustColor = "#F8F0E2";
      else if (biome === 'meadow') dustColor = "#FFE6B3";
      else if (biome === 'zenith') { dustColor = "#FFE6B3"; sizeMul = 1.2; }
      else if (biome === 'crystal') dustColor = "#C7B3D9";
      else if (biome === 'storm') { dustColor = "#6A6C6D"; sizeMul = 2; alphaMul = 0.5; }
      else if (biome === 'volcano') dustColor = "#FF8844";
      else if (biome === 'aether') dustColor = "#EEDDFF";
      else if (biome === 'abyss') dustColor = "#00FFFF";

      const rainFade = biome === 'storm' ? (1 - state.weather.rainIntensity) : 1;
      const density = state.emotion.runtime.visuals.particleDensity;
      const fade = rainFade * density;

      ctx.save();
      ctx.translate(0, state.camera.y * 0.4);
      ctx.fillStyle = dustColor;

      for (const d of state.world.ambientDust) {
          const baseAlpha = isFirefly
            ? d.a * (0.2 + 0.8 * Math.sin(state.t * 4 + d.phase)) // Vagalumes: pulso rápido
            : (d.a * (0.4 + 0.6 * Math.sin(state.t * 1.2 + d.phase)) + sunBrightness) * alphaMul;
          const renderSize = d.size * sizeMul;

          ctx.globalAlpha = clamp(baseAlpha * fade, 0, 1);
          ctx.beginPath();
          if (isSand) ctx.ellipse(d.x, d.y, renderSize * 2, renderSize * 0.5, 0, 0, Math.PI*2); // Traço de areia
          else if (isDrop) ctx.ellipse(d.x, d.y, renderSize * 0.6, renderSize * 1.5, 0, 0, Math.PI*2); // Gota de luz
          else ctx.arc(d.x, d.y, renderSize, 0, Math.PI*2);
          ctx.fill();

          if (isFirefly && baseAlpha > 0.4) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = dustColor;
              ctx.fill();
              ctx.shadowBlur = 0;
          }
      }
      ctx.restore();
  }
  function drawSkyline() {
    if (state.biome !== 'city' && state.biome !== 'storm' && state.biome !== 'cyber') return;
    const show = clamp(remap(state.totalMeters, 1800, 4800, 0, 1), 0, 1);
    if (show <= .01) return;
    ctx.save();
    const riseOffset = (1 - show) * 80; // Arquitetura emerge suavemente do chão
    const d = state.sky.dawn;
    const bColor = mixColor([18, 32, 52], [100, 58, 42], d); // MG Base
    for (const b of state.world.skyline) {
      ctx.fillStyle = `rgb(${bColor.join(',')})`;
      
      for (const t of b.tiers) {
          ctx.fillRect(t.x, HORIZON_Y + riseOffset - t.y - t.h, t.w, t.h + 30); // Raízes fundas
      }

      if (b.antenna > 0) {
          const topTier = b.tiers[b.tiers.length - 1];
          const ax = topTier.x + topTier.w / 2;
          ctx.fillRect(ax - 0.5, HORIZON_Y + riseOffset - topTier.y - topTier.h - b.antenna, 1, b.antenna);
      }

      const memoryWindows = clamp(state.totalRunMemory.totalWindows / 50, 0, 0.5); 
      const lit = clamp(state.worldResponse.awakeningLevel + memoryWindows, 0, 1);
      for (const t of b.tiers) {
        for (let yy = 3; yy < t.h - 3; yy += 4) {
          for (let xx = 2; xx < t.w - 2; xx += 3.5) {
            const seed = xx * 12.98 + yy * 78.23 + t.x * 0.1;
            const type = Math.abs(Math.sin(seed));
            if (type < 0.15) continue; // Ausência de janela
            
            const litRand = Math.abs(Math.cos(seed * 1.5));
            if ((xx + yy + t.x) % 2 < 1 && litRand < lit * .7) {
              const windowAlpha = .25 + lit * .75;
              ctx.fillStyle = state.biome === 'cyber' ? `rgba(0,255,255,${windowAlpha})` : `rgba(255,249,236,${windowAlpha})`;
              ctx.fillRect(t.x + xx, HORIZON_Y + riseOffset - t.y - t.h + yy, 1.2, 2.0);
            } else if (type > 0.4) {
              const unlitColor = mixColor([5, 8, 14], [30, 15, 10], d);
              ctx.fillStyle = `rgb(${unlitColor.join(',')})`; // Cor sólida e densa
              ctx.fillRect(t.x + xx, HORIZON_Y + riseOffset - t.y - t.h + yy, 1.2, 2.0);
            }
          }
        }
      }
    }
    ctx.restore();
  }
  function drawTrees() {
    const validBiomes = ['forest', 'snow', 'autumn', 'sakura', 'swamp', 'meadow', 'hills'];
    if (!validBiomes.includes(state.biome)) return; 
    const flora = clamp(state.worldResponse.floraLevel + state.totalRunMemory.totalForests / 50, 0, 1);
    if (flora <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, flora * 1.5);
    const d = state.sky.dawn;
    
    let tColor = mixColor([18, 32, 52], [100, 58, 42], d); 
    if (state.biome === 'snow') tColor = mixColor([40, 50, 70], [200, 220, 240], d); 
    if (state.biome === 'aether') tColor = mixColor([30, 20, 50], [150, 100, 180], d); 
    if (state.biome === 'autumn') tColor = mixColor([60, 20, 10], [220, 90, 40], d);
    if (state.biome === 'sakura') tColor = mixColor([50, 20, 30], [255, 160, 180], d);
    if (state.biome === 'swamp') tColor = mixColor([10, 25, 15], [50, 120, 80], d);
    if (state.biome === 'meadow') tColor = mixColor([58, 90, 47], [139, 179, 122], d);
    if (state.biome === 'hills') tColor = mixColor([58, 79, 79], [122, 159, 143], d);
    
    if (state.biome === 'storm') tColor = mixColor(tColor, [20, 30, 25], state.weather.rainIntensity);
    
    const trunkColor = mixColor([10, 20, 36], [68, 42, 30], d); 
    for (const t of state.world.trees) {
      const tx = t.x;
      const ty = HORIZON_Y - 5;
      const th = t.h + Math.sin(state.t * 0.5 + t.wobble) * 2;
      const tw = t.w;
      
      const wind = Math.sin(state.t * 0.8 + tx) * 4 + Math.sin(state.t * 2.2) * 2;

      ctx.strokeStyle = `rgb(${trunkColor.join(',')})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty + 25); // Raízes da árvore plantadas no fundo da colina
      ctx.quadraticCurveTo(tx + 2 + wind, ty - th/2, tx + wind * 1.5, ty - th);
      ctx.stroke();

      const r = tw * 0.5;
      const cx = tx + wind * 1.5;
      const cy = ty - th;
      
      ctx.fillStyle = `rgb(${tColor.join(',')})`;

      // Quatro silhuetas em vez de uma. Uma copa e lida pela borda, nao pelo volume:
      // e a linha de cima que diz "pinheiro" ou "carvalho" a cem metros de distancia.
      ctx.beginPath();
      if (t.kind === 'conifera') {
        // Triangulos empilhados, cada andar mais estreito: recorte serrilhado.
        for (let a = 0; a < 3; a++) {
          const p = a / 3;
          const larg = r * (1.15 - p * 0.55);
          const base = cy + r * 0.55 - a * r * 0.62;
          ctx.moveTo(cx - larg, base);
          ctx.lineTo(cx, base - r * 0.95);
          ctx.lineTo(cx + larg, base);
          ctx.closePath();
        }
      } else if (t.kind === 'esguia') {
        // Alta e estreita, copa oval: verticaliza e quebra a horizontal da mata.
        ctx.ellipse(cx, cy - r * 0.15, r * 0.45, r * 1.15, 0, 0, Math.PI * 2);
      } else if (t.kind === 'aberta') {
        // Copa larga e baixa, guarda-chuva: e a que da respiro entre as verticais.
        ctx.ellipse(cx, cy + r * 0.1, r * 1.25, r * 0.55, 0, 0, Math.PI * 2);
        ctx.moveTo(cx + r * 0.5, cy - r * 0.15);
        ctx.arc(cx - r * 0.45, cy - r * 0.2, r * 0.5, 0, Math.PI * 2);
      } else {
        ctx.arc(cx - r*0.4, cy + r*0.2, r*0.7, 0, Math.PI*2);
        ctx.arc(cx + r*0.4, cy + r*0.2, r*0.7, 0, Math.PI*2);
        ctx.arc(cx, cy - r*0.3, r*0.8, 0, Math.PI*2);
      }
      ctx.fill();
    }

    for (const b of state.world.bushes) {
       const bx = b.x;
       const by = HORIZON_Y + 8; // Arbusto afundado
       const bh = b.h + Math.sin(state.t * 0.6 + b.wobble) * 1.5;
       const bw = b.w;
       const r = bw * 0.5;
       const wind = Math.sin(state.t * 1.1 + bx) * 2;
       ctx.fillStyle = `rgb(${tColor.join(',')})`;
       ctx.beginPath();
       ctx.arc(bx - r*0.3 + wind, by - bh*0.4, r*0.6, 0, Math.PI*2);
       ctx.arc(bx + r*0.3 + wind, by - bh*0.4, r*0.6, 0, Math.PI*2);
       ctx.arc(bx + wind, by - bh*0.6, r*0.7, 0, Math.PI*2);
       ctx.fill();
    }
    ctx.restore();
  }
  function drawForeground() {
      ctx.save();
      const d = state.sky.dawn;
      const parallaxY = state.camera.y * 0.2 + Math.sin(state.world.breath) * 6; // Parallax FG 1.2x (1.0x Outer + 0.2x Inner)
      ctx.translate(0, parallaxY);

      let fgColorArr = mixColor([5, 10, 18], [68, 42, 30], d); 
      let fgBaseArr = mixColor([2, 5, 8], [30, 20, 15], d); 
      
      if (state.biome === 'meadow') {
          fgColorArr = mixColor([58, 90, 47], [139, 179, 122], d);
          fgBaseArr = mixColor([38, 70, 27], [119, 159, 102], d);
      } else if (state.biome === 'hills') {
          fgColorArr = mixColor([58, 79, 79], [122, 159, 143], d);
          fgBaseArr = mixColor([38, 59, 59], [102, 139, 123], d);
      } else if (state.biome === 'snow') {
          fgColorArr = mixColor([15, 25, 40], [180, 200, 230], d);
          fgBaseArr = mixColor([10, 15, 25], [120, 140, 170], d);
      } else if (state.biome === 'sea') {
          fgColorArr = mixColor([5, 15, 30], [20, 80, 140], d);
          fgBaseArr = mixColor([2, 8, 15], [10, 40, 80], d);
      } else if (state.biome === 'volcano') {
          fgColorArr = mixColor([15, 5, 5], [60, 20, 15], d);
          fgBaseArr = mixColor([8, 2, 2], [30, 10, 8], d);
      } else if (state.biome === 'aether') {
          fgColorArr = mixColor([20, 10, 30], [140, 80, 180], d);
          fgBaseArr = mixColor([10, 5, 20], [80, 40, 100], d);
      } else if (state.biome === 'cosmos') {
          fgColorArr = mixColor([0, 2, 5], [10, 15, 25], d);
          fgBaseArr = mixColor([0, 0, 2], [5, 8, 15], d);
      } else if (state.biome === 'desert') {
          fgColorArr = mixColor([30, 15, 10], [100, 50, 30], d);
          fgBaseArr = mixColor([15, 8, 5], [60, 30, 15], d);
      } else if (state.biome === 'crystal') {
          fgColorArr = mixColor([10, 5, 20], [30, 15, 60], d);
          fgBaseArr = mixColor([5, 2, 10], [15, 5, 30], d);
      } else if (state.biome === 'city') {
          fgColorArr = mixColor([10, 8, 15], [30, 15, 30], d);
          fgBaseArr = mixColor([5, 4, 10], [15, 8, 15], d);
      } else if (state.biome === 'autumn') {
          fgColorArr = mixColor([30, 15, 10], [100, 50, 20], d);
          fgBaseArr = mixColor([15, 8, 5], [60, 30, 10], d);
      } else if (state.biome === 'swamp') {
          fgColorArr = mixColor([10, 15, 12], [40, 60, 50], d);
          fgBaseArr = mixColor([5, 8, 6], [20, 30, 25], d);
      } else if (state.biome === 'sakura') {
          fgColorArr = mixColor([20, 10, 15], [120, 60, 80], d);
          fgBaseArr = mixColor([10, 5, 8], [80, 40, 50], d);
      } else if (state.biome === 'canyon') {
          fgColorArr = mixColor([25, 10, 8], [80, 30, 20], d);
          fgBaseArr = mixColor([15, 5, 4], [40, 15, 10], d);
      } else if (state.biome === 'ruins') {
          fgColorArr = mixColor([10, 20, 18], [40, 80, 70], d);
          fgBaseArr = mixColor([5, 10, 9], [20, 40, 35], d);
      } else if (state.biome === 'abyss') {
          fgColorArr = mixColor([2, 3, 5], [8, 12, 20], d);
          fgBaseArr = mixColor([1, 1, 2], [4, 6, 10], d);
      } else if (state.biome === 'shattered') {
          fgColorArr = mixColor([10, 5, 5], [40, 20, 20], d);
          fgBaseArr = mixColor([5, 2, 2], [20, 10, 10], d);
      } else if (state.biome === 'nebula') {
          fgColorArr = mixColor([15, 5, 20], [60, 20, 80], d);
          fgBaseArr = mixColor([8, 2, 10], [30, 10, 40], d);
      } else if (state.biome === 'cyber') {
          fgColorArr = mixColor([5, 2, 10], [20, 10, 40], d);
          fgBaseArr = mixColor([2, 1, 5], [10, 5, 20], d);
      } else if (state.biome === 'zenith') {
          fgColorArr = mixColor([100, 100, 110], [200, 200, 220], d);
          fgBaseArr = mixColor([80, 80, 90], [160, 160, 180], d);
      } else if (['ursa', 'orion', 'aries'].includes(state.biome)) {
          fgColorArr = mixColor([0, 1, 3], [5, 10, 20], d);
          fgBaseArr = mixColor([0, 0, 1], [2, 4, 10], d);
      }
      
      if (state.biome === 'storm') {
          const ri = state.weather.rainIntensity;
          fgColorArr = mixColor(fgColorArr, [15, 20, 25], ri);
          fgBaseArr = mixColor(fgBaseArr, [5, 10, 15], ri);
      }
      
      const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, HORIZON_Y + 150);
      grad.addColorStop(0, `rgb(${fgColorArr.join(',')})`);
      grad.addColorStop(1, `rgb(${fgBaseArr.join(',')})`);
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      let prevX = -50;
      let prevY = HORIZON_Y + 15;
      ctx.moveTo(prevX, prevY);
      
      if (state.biome === 'sea') {
          for (let x = -20; x <= W + 50; x += 45) {
              const y = HORIZON_Y + 20 + Math.sin(x * 0.03 + state.t * 2) * 6; // Flat animated waves
              ctx.lineTo(x, y);
          }
      } else if (state.biome === 'desert') {
          for (let x = -20; x <= W + 50; x += 45) {
              const y = HORIZON_Y + 15 + Math.sin(x * 0.02) * 12 + Math.cos(x * 0.01) * 18; // Dunas imensas e suaves
              ctx.lineTo(x, y);
          }
      } else if (state.biome === 'crystal') {
          for (let x = -20; x <= W + 50; x += 30) {
              const y = HORIZON_Y + 10 + Math.abs(Math.sin(x * 0.1) * 15) + (x%2===0?10:0); // Chão irregular cristalino
              ctx.lineTo(x, y);
          }
      } else if (state.biome === 'cyber') {
          for (let x = -20; x <= W + 50; x += 45) {
              ctx.lineTo(x, HORIZON_Y + 15); // Digital flat ground
          }
      } else if (state.biome === 'volcano') {
          for (let x = -20; x <= W + 50; x += 45) {
              const y = HORIZON_Y + 15 + Math.sin(x * 0.1) * 15 + Math.cos(x * 0.05) * 10; // Jagged rocks
              ctx.lineTo(x, y);
          }
      } else {
          for (let x = -20; x <= W + 50; x += 45) {
              const y = HORIZON_Y + 15 + Math.sin(x * 0.05) * 10 + Math.cos(x * 0.02) * 8;
              ctx.quadraticCurveTo(prevX + 20, prevY - 15, x, y);
              prevX = x; prevY = y;
          }
      }
      ctx.lineTo(W + 50, H * 2);
      ctx.lineTo(-50, H * 2);
      ctx.fill();
      
      if (state.biome === 'cyber') {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.1 + d * 0.4})`;
          for (let x = -20; x <= W + 50; x += 40) { ctx.beginPath(); ctx.moveTo(x, HORIZON_Y + 15); ctx.lineTo(x + (x - W / 2) * 0.5, H * 2); ctx.stroke(); }
          for (let y = HORIZON_Y + 20; y < H * 2; y += (y - HORIZON_Y) * 0.4 + 10) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.stroke(); }
      }

      const validLines = ['forest', 'snow', 'autumn', 'sakura', 'swamp', 'meadow', 'hills'];
      if (validLines.includes(state.biome)) {
          ctx.lineWidth = 1.5;
          for (let x = 10; x < W; x += 30) {
              const h = 15 + Math.sin(x) * 10;
              const y = HORIZON_Y + 25 + Math.sin(x * 0.05) * 10;
              ctx.strokeStyle = `rgba(${fgColorArr.join(',')}, 0.9)`;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.quadraticCurveTo(x + Math.sin(x)*10, y - h/2, x + Math.cos(x)*15, y - h);
              ctx.stroke();
          }
      }
      
      // Resgate do Fog Foreground
      const l = state.worldResponse.lightLevel;
      let horizonAtmosphereColor = mixColor([68, 103, 192], [245, 215, 179], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'snow') horizonAtmosphereColor = mixColor([60, 90, 140], [220, 240, 255], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'sea') horizonAtmosphereColor = mixColor([30, 80, 130], [80, 180, 210], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'volcano') horizonAtmosphereColor = mixColor([140, 30, 20], [255, 100, 40], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'aether') horizonAtmosphereColor = mixColor([120, 60, 160], [255, 180, 200], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'cosmos') horizonAtmosphereColor = mixColor([20, 30, 50], [40, 60, 90], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'desert') horizonAtmosphereColor = mixColor([180, 80, 40], [255, 200, 120], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'crystal') horizonAtmosphereColor = mixColor([80, 20, 120], [160, 80, 200], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'city') horizonAtmosphereColor = mixColor([40, 30, 60], [200, 120, 160], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'autumn') horizonAtmosphereColor = mixColor([120, 60, 40], [240, 140, 80], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'swamp') horizonAtmosphereColor = mixColor([20, 40, 30], [80, 140, 100], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'sakura') horizonAtmosphereColor = mixColor([120, 70, 90], [255, 180, 210], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'canyon') horizonAtmosphereColor = mixColor([80, 40, 30], [200, 120, 80], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'ruins') horizonAtmosphereColor = mixColor([30, 70, 60], [100, 180, 160], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'abyss') horizonAtmosphereColor = mixColor([10, 15, 25], [20, 40, 60], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'shattered') horizonAtmosphereColor = mixColor([40, 20, 20], [140, 60, 60], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'nebula') horizonAtmosphereColor = mixColor([60, 20, 80], [160, 80, 200], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'cyber') horizonAtmosphereColor = mixColor([20, 10, 40], [0, 120, 160], clamp(d * .35 + l * .65, 0, 1));
      if (state.biome === 'zenith') horizonAtmosphereColor = mixColor([220, 220, 230], [255, 255, 255], clamp(d * .35 + l * .65, 0, 1));
      if (['ursa', 'orion', 'aries'].includes(state.biome)) horizonAtmosphereColor = mixColor([10, 20, 40], [20, 40, 70], clamp(d * .35 + l * .65, 0, 1));
      
      if (state.biome === 'storm') {
          horizonAtmosphereColor = mixColor(horizonAtmosphereColor, [50, 55, 60], state.weather.rainIntensity);
      }

      const blendedFgFog = mixColor(fgColorArr, horizonAtmosphereColor, 0.3);
      const fgFogGrad = ctx.createLinearGradient(0, HORIZON_Y - 50, 0, HORIZON_Y + 50);
      fgFogGrad.addColorStop(0, `rgba(${blendedFgFog.join(',')}, 0)`);
      fgFogGrad.addColorStop(1, `rgba(${blendedFgFog.join(',')}, 0.3)`); // 30% alpha base
      ctx.fillStyle = fgFogGrad;
      ctx.fillRect(-W, HORIZON_Y - 50, W * 4, H * 2);

      ctx.restore();
  }
  function drawRain() {
      if (state.biome !== 'storm' || state.weather.rainIntensity <= 0.01) return;
      ctx.save();
