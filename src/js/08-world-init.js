  function initWorldDecor() {
    state.world.stars.length = 0; state.world.horizonStars.length = 0; state.world.mountains.length = 0; state.world.skyline.length = 0; state.world.ambientDust.length = 0; state.world.clouds.length = 0;
    state.world.trees.length = 0; state.world.bushes.length = 0;
    
    for (let i = 0; i < 45; i++) state.world.stars.push({ x: Math.random() * W, y: Math.random() * H * 0.68, size: rand(5, 10), tw: Math.random() * Math.PI * 2 });
    for (let i = 0; i < 80; i++) state.world.horizonStars.push({ x: Math.random() * W, y: HORIZON_Y - rand(10, 180), size: rand(1.2, 2.8), tw: Math.random() * Math.PI * 2 });
    
    for (let i = 0; i < 60; i++) {
      state.world.ambientDust.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-2, 2), vy: rand(-3, -1),
        size: rand(0.5, 1.8), a: rand(0.04, 0.2), phase: rand(0, Math.PI * 2)
      });
    }

    for (let i = 0; i < 40; i++) {
      state.world.clouds.push({
        x: rand(-100, W + 100),
        y: rand(-H * 1.5, H * 1.5),
        size: rand(20, 100),
        speed: rand(0.5, 3.5) * (Math.random() < 0.5 ? 1 : -1),
        layer: Math.random() < 0.4 ? 'back' : 'front',
        type: Math.floor(rand(0, 3))
      });
    }
    
    state.world.rain.length = 0;
    for (let i = 0; i < 150; i++) {
        state.world.rain.push({
            x: rand(-50, W + 50), y: rand(-100, H + 100),
            vx: rand(-60, -20), vy: rand(800, 1400),
            length: rand(15, 35), alpha: rand(0.15, 0.4)
        });
    }

    // LAYER CAKE MOUNTAINS: Sistema de 3 Planos Distantes
    let xBg3 = -100;
    while (xBg3 < W + 100) {
      let type = Math.random();
      let h, w;
      if (type < 0.7) { h = rand(140, 240); w = rand(220, 340); } // 70% Big
      else if (type < 0.9) { h = rand(90, 140); w = rand(150, 220); } // 20% Medium
      else { h = rand(60, 90); w = rand(100, 150); } // 10% Small
      state.world.mountains.push({ x: xBg3 + w/2, w: w, h: h, wobble: Math.random() * Math.PI * 2, layer: 'bg3', peak: rand(-0.4, 0.4), steep: rand(0.15, 0.6) });
      xBg3 += w * rand(0.4, 0.6); 
    }
    let xBg2 = -100;
    while (xBg2 < W + 100) {
      let type = Math.random();
      let h, w;
      if (type < 0.7) { h = rand(100, 160); w = rand(180, 260); }
      else if (type < 0.9) { h = rand(70, 100); w = rand(120, 180); }
      else { h = rand(40, 70); w = rand(80, 120); }
      state.world.mountains.push({ x: xBg2 + w/2, w: w, h: h, wobble: Math.random() * Math.PI * 2, layer: 'bg2', peak: rand(-0.4, 0.4), steep: rand(0.15, 0.6) });
      xBg2 += w * rand(0.4, 0.6);
    }
    let xBg1 = -100;
    while (xBg1 < W + 100) {
      let type = Math.random();
      let h, w;
      if (type < 0.7) { h = rand(70, 120); w = rand(120, 180); }
      else if (type < 0.9) { h = rand(40, 70); w = rand(80, 120); }
      else { h = rand(20, 40); w = rand(50, 80); }
      state.world.mountains.push({ x: xBg1 + w/2, w: w, h: h, wobble: Math.random() * Math.PI * 2, layer: 'bg1', peak: rand(-0.4, 0.4), steep: rand(0.15, 0.6) });
      xBg1 += w * rand(0.4, 0.6);
    }

    // --- GERAÇÃO EXCLUSIVA DE AMBIENTE ---
    if (state.biome === 'city' || state.biome === 'storm') {
        let xCity = -W * 0.2;
        while (xCity < W * 1.2) {
          let type = Math.random();
          let baseW, totalH;
          let tiers = [];
          let numTiers = 1;
          let align = Math.random(); 
    
          if (type < 0.25) { 
              baseW = rand(35, 55); totalH = rand(80, 135);
              numTiers = Math.random() < 0.6 ? 3 : 2;
          } else if (type < 0.65) { 
              baseW = rand(22, 35); totalH = rand(45, 75);
              numTiers = Math.random() < 0.5 ? 2 : 1;
          } else { 
              baseW = rand(15, 25); totalH = rand(20, 40);
              numTiers = 1;
          }
    
          let currentY = 0; let currentW = baseW; let currentX = xCity;
          for(let j=0; j<numTiers; j++) {
              let tierH = (j === numTiers - 1) ? (totalH - currentY) : rand(totalH * 0.3, totalH * 0.5);
              if (currentY + tierH > totalH) tierH = totalH - currentY;
              
              tiers.push({ x: currentX, y: currentY, w: currentW, h: tierH });
              currentY += tierH;
              
              if (j < numTiers - 1) {
                  let shrink = rand(4, 12); currentW -= shrink; if (currentW < 8) currentW = 8;
                  if (align >= 0.33 && align < 0.66) currentX += shrink / 2; 
                  else if (align >= 0.66) currentX += shrink; 
              }
          }
    
          state.world.skyline.push({
            x: xCity, w: baseW, h: totalH, tiers: tiers,
            antenna: Math.random() < 0.35 ? rand(8, 25) : 0
          });
          xCity += baseW + rand(2, 6);
        }
    } else if (['forest', 'snow', 'autumn', 'sakura', 'swamp', 'meadow', 'hills'].includes(state.biome)) {
        for (let i = 0; i < 28; i++) {
            let tType = Math.random(); let th, tw;
            if (tType < 0.7) { th = rand(35, 55); tw = rand(40, 60); } else if (tType < 0.9) { th = rand(20, 35); tw = rand(25, 40); } else { th = rand(12, 20); tw = rand(15, 25); }
            if (['meadow', 'hills'].includes(state.biome) && Math.random() < 0.5) continue; // Biomas abertos tem menos árvores
            state.world.trees.push({ x: rand(-20, W + 50), h: th, w: tw, wobble: Math.random() * Math.PI * 2 });
        }
        for (let i = 0; i < 35; i++) {
            if (state.biome === 'hills' && Math.random() < 0.3) continue;
            state.world.bushes.push({ x: rand(-20, W + 50), h: rand(8, 18), w: rand(15, 32), wobble: Math.random() * Math.PI * 2 });
        }
    }
    
    state.world.constellation = null;
    if (['ursa', 'orion', 'aries'].includes(state.biome)) {
        const cx = W * 0.5; const cy = H * 0.30;
        let points = [], lines = [];
        if (state.biome === 'ursa') {
            points = [
                {x: cx - W*0.25, y: cy - H*0.02}, {x: cx - W*0.1, y: cy - H*0.01}, {x: cx, y: cy},
                {x: cx + W*0.1, y: cy + H*0.04}, {x: cx + W*0.25, y: cy + H*0.05}, {x: cx + W*0.28, y: cy + H*0.1}, {x: cx + W*0.06, y: cy + H*0.09}
            ];
            lines = [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,3]];
        } else if (state.biome === 'orion') {
            points = [
                {x: cx - W*0.15, y: cy - H*0.08}, {x: cx + W*0.15, y: cy - H*0.07},
                {x: cx - W*0.05, y: cy}, {x: cx, y: cy + H*0.01}, {x: cx + W*0.05, y: cy + H*0.02},
                {x: cx - W*0.1, y: cy + H*0.1}, {x: cx + W*0.2, y: cy + H*0.09}
            ];
            lines = [[0,2], [1,4], [2,3], [3,4], [2,5], [4,6]];
        } else if (state.biome === 'aries') {
            points = [{x: cx + W*0.2, y: cy - H*0.05}, {x: cx + W*0.05, y: cy - H*0.01}, {x: cx - W*0.1, y: cy}, {x: cx - W*0.25, y: cy + H*0.03}];
            lines = [[0,1], [1,2], [2,3]];
        }
        points.forEach(p => { p.tw = Math.random() * Math.PI * 2; p.size = rand(3.5, 6.5); });
        state.world.constellation = { points, lines };
    }
  }

