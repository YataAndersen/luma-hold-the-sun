      ctx.strokeStyle = `rgba(160, 180, 200, 1)`;
      ctx.lineCap = 'round';
      for (let r of state.world.rain) {
          ctx.globalAlpha = r.alpha * state.weather.rainIntensity;
          ctx.lineWidth = r.length * 0.08;
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.vx * 0.04, r.y - r.vy * 0.04);
          ctx.stroke();
      }
      ctx.restore();
  }
  function drawDawnGoal() {
    if (state.mode !== "gameplay" || !state.dawnGoal.active) return;
    const lineY = state.dawnGoal.thresholdY;
    const p = state.dawnGoal.visualIntensity;
    const alpha = state.dawnGoal.completed ? 1 : clamp(.22 + p * .6, 0, .9);
    ctx.save();
    ctx.setLineDash([8, 12]);
    ctx.strokeStyle = `rgba(255,244,199,${alpha * .45})`;
    ctx.lineWidth = 1 + p * 2;
    ctx.beginPath();
    ctx.moveTo(W * .1, lineY);
    ctx.lineTo(W * .9, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
    if (p > 0) {
      ctx.strokeStyle = `rgba(255,249,236,${alpha})`;
      ctx.lineWidth = 3;
      const progressW = (W * .8) * p;
      ctx.beginPath();
      ctx.moveTo(W / 2 - progressW / 2, lineY);
      ctx.lineTo(W / 2 + progressW / 2, lineY);
      ctx.stroke();
      ctx.font = "600 12px Inter";
      ctx.fillStyle = `rgba(255,249,236,${alpha})`;
      ctx.textAlign = "center";
      ctx.fillText(`✧ ${Math.floor(p * 100)}%`, W / 2, lineY - 12);
    }
    ctx.restore();
  }
  function drawAurora() {
    const a = clamp(state.sky.aurora + getVol(5) * 0.7 + getMissionReactiveAuroraBoost(), 0, 1); 
    if (a <= .01) return;
    ctx.save();
    const y = H * .24 + Math.sin(state.t * .6) * 8 + state.camera.y * .2;
    const grad = ctx.createLinearGradient(40, y, W - 40, y + 40);
    grad.addColorStop(0, `rgba(128,192,166,0)`);
    grad.addColorStop(.25, `rgba(128,192,166,${0.12*a})`); // 60% Aqua
    grad.addColorStop(.55, `rgba(192,152,206,${0.17*a})`); // 60% Lavender
    grad.addColorStop(.8, `rgba(245,200,179,${0.10*a})`);  // 70% Peach
    grad.addColorStop(1, `rgba(128,192,166,0)`);
    ctx.fillStyle = grad;
    ctx.filter = "blur(16px)";
    ctx.beginPath();
    ctx.ellipse(W / 2, y, W * .34, 38, -.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = "none";
    ctx.restore();
  }
  function drawRare() {
    for (const r of state.world.rare) {
      ctx.save();
      ctx.globalAlpha = Math.min(.9, r.life / 2.2);
      ctx.translate(r.x, r.y - state.camera.y * .8);
      
      if (r.type === 'butterfly') {
          const flap = Math.abs(Math.sin(state.t * 12 + r.phase));
          ctx.fillStyle = "rgba(255, 216, 147, 0.9)";
          ctx.shadowBlur = 10; ctx.shadowColor = "#FFC46B";
          ctx.beginPath();
          ctx.ellipse(0, -r.size * 0.8 * flap, r.size, r.size * flap, 0.2, 0, Math.PI*2);
          ctx.ellipse(0, r.size * 0.8 * flap, r.size * 0.8, r.size * flap, -0.2, 0, Math.PI*2);
          ctx.fill();
      } else if (r.type === 'angel') {
          const flap = Math.sin(state.t * 3 + r.phase);
          ctx.fillStyle = "rgba(248, 240, 226, 0.9)";
          ctx.shadowBlur = 30; ctx.shadowColor = "#FFF";
          ctx.beginPath();
          ctx.arc(0, -r.size*0.6, r.size*0.2, 0, Math.PI*2); // Halo/Cabeça
          ctx.ellipse(0, 0, r.size * (0.8 + flap*0.2), r.size*0.3, 0, 0, Math.PI*2); // Asas
          ctx.ellipse(0, r.size*0.3, r.size*0.15, r.size*0.6, 0, 0, Math.PI*2); // Corpo
          ctx.fill();
      } else if (r.isComet) {
          ctx.rotate(Math.atan2(r.vy, r.vx));
          ctx.fillStyle = "rgba(220, 240, 255, 1)";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(180, 220, 255, 0.8)";
          ctx.beginPath(); ctx.arc(0, 0, r.size, 0, Math.PI * 2); ctx.fill();
          
          ctx.shadowBlur = 0;
          const grad = ctx.createLinearGradient(0, 0, -r.size * 15, 0);
          grad.addColorStop(0, "rgba(220, 240, 255, 0.8)");
          grad.addColorStop(1, "rgba(220, 240, 255, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -r.size * 0.5);
          ctx.lineTo(-r.size * 15, 0);
          ctx.lineTo(0, r.size * 0.5);
          ctx.fill();
      } else {
          ctx.rotate(Math.atan2(r.vy, r.vx));
          ctx.fillStyle = "rgba(255,249,236,1)";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "rgba(255,244,199,1)";
          ctx.beginPath();
          ctx.arc(0, 0, r.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          const grad = ctx.createLinearGradient(0, 0, -r.size * 4, 0);
          grad.addColorStop(0, "rgba(255,244,199,0.8)");
          grad.addColorStop(1, "rgba(255,244,199,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, -r.size * 0.2);
          ctx.lineTo(-r.size * 4, 0);
          ctx.lineTo(0, r.size * 0.2);
          ctx.fill();
      }
      ctx.restore();
    }
  }
  function drawBirds() {
    for (const b of state.world.birds) {
      const x = state.sun.x + Math.cos(b.angle) * b.radius + b.ox;
      const y = state.sun.y + Math.sin(b.angle) * b.radius * .45 + b.oy;
      ctx.save();
      ctx.globalAlpha = Math.min(.8, b.life / 1.2);
      ctx.translate(x, y);
      
      if (b.type === 'photon') {
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = "#FFD893";
          ctx.shadowBlur = b.size * 2.5;
          ctx.shadowColor = "#FFC46B";
          ctx.beginPath(); ctx.arc(0, 0, b.size, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#FFF";
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.arc(0, 0, b.size * 0.4, 0, Math.PI*2); ctx.fill();
      } else {
          let birdColor = `rgba(255,244,199,${.45 + state.worldResponse.birdsLevel * .35})`; // Padrão
          if (state.biome === 'meadow') birdColor = `rgba(255,216,107,${.5 + state.worldResponse.birdsLevel * .4})`; // Amarelos
          else if (state.biome === 'forest' || state.biome === 'swamp') birdColor = `rgba(138,203,162,${.5 + state.worldResponse.birdsLevel * .4})`; // Verdes
          else if (state.biome === 'desert' || state.biome === 'canyon') birdColor = `rgba(255,196,107,${.5 + state.worldResponse.birdsLevel * .4})`; // Dourados
          else if (state.biome === 'snow' || state.biome === 'hills') birdColor = `rgba(169,201,224,${.5 + state.worldResponse.birdsLevel * .4})`; // Azuis
          else if (state.biome === 'coast' || state.biome === 'sea') birdColor = `rgba(248,240,226,${.5 + state.worldResponse.birdsLevel * .4})`; // Brancos
          else if (state.biome === 'ruins') birdColor = `rgba(180,180,180,${.5 + state.worldResponse.birdsLevel * .4})`; // Foscos/Cinzas
          
          ctx.strokeStyle = birdColor;
          ctx.lineWidth = 1.5;
          ctx.lineCap = "round";
          ctx.rotate(b.speed > 0 ? .15 : -.15);
          const flap = Math.sin(state.t * 8 + b.angle) * 3;
          ctx.beginPath();
          ctx.moveTo(-b.size / 2, -flap);
          ctx.quadraticCurveTo(0, 0, 0, b.size / 4);
          ctx.quadraticCurveTo(0, 0, b.size / 2, -flap);
          ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawPulses() {
    for (const p of state.world.pulses) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,249,236,${p.a * .25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawTrail() { return; }
  function drawLeaves() {
    if (settings.visual.particles === 'off') return;
    for (const l of state.world.leaves) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, l.life) * .75;
      const d = state.sky.dawn;
      let leafColor = mixColor([158, 188, 207], [212, 122, 90], d); // 70% Tone
      if (state.biome === 'sakura') leafColor = mixColor([200, 100, 140], [255, 180, 200], d);
      if (state.biome === 'autumn') leafColor = mixColor([160, 50, 20], [240, 120, 40], d);
      ctx.fillStyle = `rgb(${leafColor.join(',')})`;
      ctx.translate(l.x, l.y + state.camera.y * 0.5); // FX Parallax 1.5x (1.0 Outer + 0.5 Inner)
      ctx.rotate(l.angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, l.size, l.size * .45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  function drawDust() {
    if (settings.visual.particles === 'off') return;
    for (const d of state.world.dust) {
      ctx.save();
      ctx.globalAlpha = d.a;
      ctx.fillStyle = "rgba(255,238,221,.95)";
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * .3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Desenha as Faíscas Estilizadas (Estrela de 4 Pontas)
    function drawStarShape(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size*0.1, -size*0.1, size, 0);
        ctx.quadraticCurveTo(size*0.1, size*0.1, 0, size);
        ctx.quadraticCurveTo(-size*0.1, size*0.1, -size, 0);
        ctx.quadraticCurveTo(-size*0.1, -size*0.1, 0, -size);
        ctx.closePath();
        ctx.fill();
    }

    for (const s of state.world.sparks) {
      ctx.save();
      ctx.globalAlpha = s.a * Math.min(1, s.life * 2);
      ctx.globalCompositeOperation = "screen";
      
      const glowColor = s.danger ? "#C46B4E" : "#FFC46B";
      const coreColor = s.danger ? "#FFD893" : "#FFF";
      
      ctx.translate(s.x, s.y);
      ctx.rotate(state.t * 2 + s.life); // Rotação orgânica
      ctx.fillStyle = glowColor;
      ctx.shadowBlur = s.size * 3;
      ctx.shadowColor = glowColor;
      drawStarShape(ctx, s.size * 1.5);
      
      ctx.fillStyle = coreColor;
      ctx.shadowBlur = 0;
      drawStarShape(ctx, s.size * 0.8);
      ctx.restore();
    }
  }
  function drawSun() {
    const visuals = state.emotion.runtime.visuals;
    const pulse = Math.sin(state.sun.breath * Math.PI * 2) * state.sun.breathStrength * 100;
    state.sun.tapScale = lerp(state.sun.tapScale || 1, 1, .12);

    // --- Sistema de Desgaste (Wear) -> Oscilação ---
    const wearFlicker = state.sun.wear > 0.3 ? 1 - Math.max(0, (state.sun.wear - 0.3) * Math.random()) : 1;
    // ---------------------------------------------

    // VFX Sync: Piano Layer aumenta a escala do núcleo da luz
    const audioScale = 1 + getVol(1) * 0.4;
    const reactiveScale = getMissionReactiveSunScale();
    const coreR = (18 + pulse * 2) * state.sun.tapScale * wearFlicker * audioScale * reactiveScale * visuals.haloSize;
    const haloR = (48 + state.sun.haloPulse * 24 + state.sun.stability * 18) * audioScale * reactiveScale * visuals.haloSize;
    
    // --- CANSAÇO E SQUASH v2.0 ---
    let fatigueSquash = 1.0;
    if (state.sun.energy < 0.3) fatigueSquash = 0.85 + (state.sun.energy / 0.3) * 0.15;
    if (state.sun.stability < 0.4) fatigueSquash *= (0.9 + state.sun.stability * 0.25);
    
    let cCore, cMid, cEdge;
    if (state.sun.mood === "risk") {
        cCore = [196, 107, 78]; cMid = [139, 90, 74]; cEdge = [100, 58, 42]; 
    } else if (state.sun.breakthrough) {
        cCore = [255, 240, 226]; cMid = [255, 230, 179]; cEdge = [255, 216, 147]; // Pure Light
    } else {
        cCore = mixColor([255, 196, 107], [255, 230, 179], state.sun.stability); 
        cMid = mixColor([212, 175, 53], [255, 216, 147], state.sun.stability);  
        cEdge = mixColor([139, 90, 74], [255, 196, 107], state.sun.stability);    
    }

    ctx.save();
    
    // APLICA O TREMOR DE ERRO
    const errX = (Math.random() - 0.5) * 6 * state.sun.errorTremor;
    const errY = (Math.random() - 0.5) * 6 * state.sun.errorTremor;
    ctx.translate(state.sun.x + errX, state.sun.y + errY);
    
    ctx.scale(1, fatigueSquash);
    const grad = ctx.createRadialGradient(0,0,10,0,0,haloR);
    
    const haloOpacityDrop = 1 - (state.sun.glowFail * 0.4);
    grad.addColorStop(0, `rgba(${cCore.join(',')}, ${0.35 * haloOpacityDrop})`);
    grad.addColorStop(.4, `rgba(${cMid.join(',')}, 0.12)`);
    grad.addColorStop(1, `rgba(${cEdge.join(',')}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0,0,haloR,0,Math.PI*2);
    ctx.fill();

    // --- COROA SOLAR (Star Rays) v2.0 ---
    const flowBright = state.combo > 0 ? 1.0 : 0.6;
    const rayAlpha = (clamp((state.sun.stability - 0.1) * 0.15, 0, 0.15) + (state.sun.breakthrough ? 0.1 : 0)) * flowBright;
    
    if (rayAlpha > 0.001) {
      ctx.save();
      ctx.rotate(state.t * 0.08); // Rotação orgânica e lenta
      const rayCount = 12;
      
      let baseRayLen = 18;
      if (state.sun.stability > 0.7) baseRayLen *= 1.5;
      if (state.sun.stability > 0.9) baseRayLen *= 2.0;

      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const pulseRay = Math.sin(state.t * 1.5 + i) * 12;
        const rayLen = coreR + baseRayLen + pulseRay + (state.sun.breakthrough ? 30 : 0);
        
        ctx.save();
        ctx.rotate(angle);
        ctx.globalAlpha = rayAlpha;
        
        const rayGrad = ctx.createLinearGradient(0, 0, rayLen, 0);
        rayGrad.addColorStop(0, `rgba(${cCore.join(',')}, 1)`);
        rayGrad.addColorStop(1, `rgba(${cCore.join(',')}, 0)`);
        ctx.fillStyle = rayGrad;
        
        ctx.beginPath();
        ctx.moveTo(coreR * 0.5, -4);
        ctx.lineTo(rayLen, 0);
        ctx.lineTo(coreR * 0.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    const reactiveBrightness = getMissionReactiveSunBrightness();

    // --- VISUAL COMBO SYSTEM ---
    const combo = state.combo || 0;
    // O custo do shadowBlur cresce com a área borrada, então o brilho satura em combo x10.
    // Sem o teto, subir o combo máximo para 20 dobrava o raio do blur do sol a cada frame.
    const comboGlow = Math.min(40, combo * 4);
    ctx.shadowBlur = ((20 + state.sun.stability * 20) * wearFlicker + (reactiveBrightness * 20) + comboGlow) * visuals.haloIntensity;
    ctx.shadowColor = state.sun.mood === "risk" ? "#828D71" : (state.sun.breakthrough ? "#F8F0E2" : "#FFC46B");

    // Combo Rings
    if (combo >= 4) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 216, 147, ${0.4 - (combo >= 6 ? 0.1 : 0)})`;
        ctx.lineWidth = combo >= 8 ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, haloR + 10 + Math.sin(state.t * 5) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    if (combo >= 8) { // A second, faster, brighter ring for high combos
        ctx.save();
        ctx.strokeStyle = `rgba(255, 240, 226, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, haloR + 18 + Math.sin(state.t * -8) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    // --- END VISUAL COMBO SYSTEM ---

    ctx.fillStyle = "#FFF9EC";
    ctx.beginPath();
    ctx.arc(0,0,coreR,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    state.sun.haloPulse = lerp(state.sun.haloPulse, 0, .1);
  }
  function drawDangerOverlay() {
    const tension = clamp(state.emotionalState.tension + getVol(6) * 0.5 + getMissionReactiveDangerBoost(), 0, 1);
    if (tension <= .01) return;
    ctx.fillStyle = `rgba(58,70,79,${tension * 0.45})`;
    ctx.fillRect(-20, -20, W + 40, H + 40);
  }

  function drawCutscene() {
    if (settings.gameplay.feedback === 'minimal') return;
    if (!state.cutscene || !state.cutscene.active) return;
    const p = 1 - (state.cutscene.timer / state.cutscene.duration); // Vai de 0 até 1
    
    ctx.save();
    const sx = state.sun.x;
    const sy = state.sun.y + state.camera.y;

    // 1. ANEL DE CHOQUE EXPANSIVO
    if (p < 0.25) {
        const swP = p / 0.25;
        ctx.beginPath();
        ctx.arc(sx, sy, swP * Math.max(W, H), 0, Math.PI * 2);
        ctx.lineWidth = 20 * (1 - swP);
        ctx.strokeStyle = `rgba(255, 249, 236, ${1 - swP})`;
        ctx.stroke();
    }

    // 2. BRILHO TÉRMICO E RAIOS FLAMEJANTES (Versão Suave e Discreta)
    let alpha = 0;
    if (p < 0.15) alpha = p / 0.15; 
    else if (p < 0.45) alpha = 1; 
    else alpha = 1 - ((p - 0.45) / 0.55); 

    if (alpha > 0.01) {
        ctx.save();
        ctx.translate(sx, sy);
        const maxR = Math.max(W, H) * 0.8; // Menor raio da explosão
        const r = maxR * Math.pow(p * 2.5, 0.7); 
        
        const grad = ctx.createRadialGradient(0,0,0, 0,0,r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`); // Brilho central não cega mais
        grad.addColorStop(0.15, `rgba(255, 244, 199, ${alpha * 0.3})`);
        grad.addColorStop(0.4, `rgba(255, 196, 107, ${alpha * 0.15})`);
        grad.addColorStop(0.7, `rgba(232, 158, 107, ${alpha * 0.05})`);
        grad.addColorStop(1, `rgba(232, 158, 107, 0)`);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0,0,r, 0, Math.PI*2); ctx.fill();

        // Raios Solares Gigantes rodando com a câmera lenta
        ctx.rotate(state.t * 0.3);
        for(let i=0; i<16; i++) {
            ctx.rotate((Math.PI * 2) / 16);
            ctx.beginPath();
            ctx.moveTo(0, -6 * alpha); // Raios mais finos e orgânicos
            ctx.lineTo(maxR * 1.2 * alpha, 0);
            ctx.lineTo(0, 6 * alpha);
            ctx.fillStyle = `rgba(255, 244, 199, ${alpha * 0.15})`; // Mais transparentes
            ctx.fill();
        }
        ctx.restore();
    }
    
    // 3. STORYTELLING TEXT (Pairando no clímax da explosão)
    let textAlpha = 0;
    if (p > 0.2 && p < 0.9) {
        if (p < 0.3) textAlpha = (p - 0.2) / 0.1;
        else if (p > 0.75) textAlpha = 1 - ((p - 0.75) / 0.15);
        else textAlpha = 1;

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(255, 249, 236, ${textAlpha})`;
        ctx.shadowBlur = 25;
        ctx.shadowColor = `rgba(255, 196, 107, ${textAlpha})`;
        ctx.textAlign = "center";
        
        const floatY = H * 0.45 - (p * 20); // Animação de subida suave (Float Up)

        ctx.font = "300 11px var(--font-ui)";
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "4px";
        ctx.fillText("THE LIGHT REMEMBERS", W / 2, floatY);
        
        ctx.font = "300 28px var(--font-display)";
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "2px";
        const toastText = experienceState.mission && experienceState.mission.toast ? experienceState.mission.toast.toLowerCase() : "ritual complete";
        ctx.fillText(toastText, W / 2, floatY + 36);
        
        ctx.shadowBlur = 0;
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = "0px";
    }

    ctx.restore();
  }

