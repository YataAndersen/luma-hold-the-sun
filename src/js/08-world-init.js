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

    // --- SILHUETA E RITMO DA SERRA ---
    // Regra de environment design: cada plano de profundidade precisa de uma LINGUAGEM DE
    // FORMA propria, nao apenas de uma escala propria. Antes os tres planos usavam o mesmo
    // gerador, a mesma distribuicao (70/20/10) e a mesma assimetria, mudando so o tamanho:
    // a paisagem era a mesma serra repetida tres vezes, e o olho le isso como repeticao,
    // nao como profundidade.
    //
    //   bg3 (fundo)  - massas largas, baixas e macias. E atmosfera, nao recorte.
    //   bg2 (meio)   - o plano de CARATER: maior variacao de altura e o pico dominante.
    //   bg1 (frente) - colinas menores, mais frequentes e mais angulosas; textura na base.
    //
    // O ritmo tambem mudou. Espacamento constante apaga a silhueta; o que da cadencia e
    // GRUPO-VAO-GRUPO — picos encostados formando uma massa, depois um respiro de ceu.
    const gerarSerra = (layer, cfg) => {
      let x = -120;
      while (x < W + 120) {
        const noGrupo = Math.round(rand(cfg.grupo[0], cfg.grupo[1]));
        for (let i = 0; i < noGrupo && x < W + 120; i++) {
          const sorte = Math.random();
          const faixa = sorte < cfg.mix[0] ? cfg.alto : (sorte < cfg.mix[1] ? cfg.medio : cfg.baixo);
          const h = rand(faixa[0], faixa[1]);
          const w = rand(faixa[2], faixa[3]);
          state.world.mountains.push({
            x: x + w / 2, w: w, h: h,
            wobble: Math.random() * Math.PI * 2,
            layer: layer,
            peak: rand(-cfg.assimetria, cfg.assimetria),
            steep: rand(cfg.steep[0], cfg.steep[1])
          });
          x += w * rand(0.32, 0.5); // dentro do grupo os picos se encostam
        }
        x += rand(cfg.vao[0], cfg.vao[1]); // o vao que separa um grupo do proximo
      }
    };

    // faixas: [alturaMin, alturaMax, larguraMin, larguraMax]
    // bg4 e a serra mais distante: baixa, larguissima e quase sem contraste, vista pelos
    // vaos das outras. Existe so para a bruma ter em que se agarrar — e o que transforma
    // "tres camadas" em "distancia". Sem ela o horizonte termina abruptamente na bg3.
    gerarSerra('bg4', {
      mix: [0.8, 1.0], grupo: [4, 7], vao: [10, 40], assimetria: 0.1, steep: [0.5, 0.75],
      alto:  [95, 140, 320, 460], medio: [70, 95, 250, 320], baixo: [55, 70, 200, 250]
    });

    gerarSerra('bg3', {
      mix: [0.75, 0.95], grupo: [3, 5], vao: [30, 90], assimetria: 0.18, steep: [0.4, 0.65],
      alto:  [150, 240, 260, 380], medio: [110, 150, 200, 260], baixo: [80, 110, 150, 200]
    });
    gerarSerra('bg2', {
      mix: [0.5, 0.85], grupo: [2, 4], vao: [50, 130], assimetria: 0.42, steep: [0.2, 0.55],
      alto:  [120, 185, 170, 250], medio: [75, 120, 120, 175], baixo: [40, 75, 80, 125]
    });
    gerarSerra('bg1', {
      mix: [0.4, 0.75], grupo: [3, 6], vao: [40, 110], assimetria: 0.5, steep: [0.12, 0.38],
      alto:  [70, 120, 110, 165], medio: [45, 70, 75, 115], baixo: [22, 45, 45, 80]
    });

    // PONTO FOCAL. Uma silhueta dominante e o que faz uma paisagem ser lembrada em vez de
    // apenas vista. Fica sempre num terco da largura, nunca no centro: um pico central
    // divide o quadro em duas metades iguais e mata a composicao.
    state.world.mountains.push({
      x: W * (Math.random() < 0.5 ? 0.34 : 0.66),
      w: rand(200, 260), h: rand(215, 275),
      wobble: Math.random() * Math.PI * 2,
      layer: 'bg2',
      peak: rand(-0.3, 0.3),
      steep: rand(0.18, 0.3) // mais ingreme que a media do plano: le como "o pico"
    });

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
        // Vegetacao tambem obedece a grupo-vao-grupo: mata fecha, clareira abre. Espalhar
        // com rand() puro no eixo x distribui as arvores por igual, e distribuicao por
        // igual e exatamente o que nao acontece na natureza nem em cenario desenhado.
        //
        // Cada arvore ganha uma silhueta ('kind') puxada pelo bioma. Antes todas eram o
        // mesmo aglomerado de tres circulos, mudando so de tamanho — uma floresta inteira
        // com uma unica forma nao le como floresta, le como padrao.
        const silhuetaDoBioma = {
            snow:   [['conifera', 0.85], ['esguia', 1.0]],
            forest: [['conifera', 0.5], ['redonda', 0.85], ['esguia', 1.0]],
            autumn: [['redonda', 0.6], ['aberta', 1.0]],
            sakura: [['aberta', 0.75], ['redonda', 1.0]],
            swamp:  [['esguia', 0.6], ['aberta', 1.0]],
            meadow: [['redonda', 0.7], ['aberta', 1.0]],
            hills:  [['redonda', 0.6], ['esguia', 1.0]]
        }[state.biome] || [['redonda', 1.0]];
        const sortearSilhueta = () => {
            const r = Math.random();
            for (const [nome, teto] of silhuetaDoBioma) if (r <= teto) return nome;
            return 'redonda';
        };
        const aberto = ['meadow', 'hills'].includes(state.biome);
        let tx = rand(-40, 20);
        while (tx < W + 50) {
            const naMata = Math.round(rand(2, aberto ? 3 : 6)); // clareiras maiores em bioma aberto
            for (let i = 0; i < naMata && tx < W + 50; i++) {
                const sorte = Math.random(); let th, tw;
                if (sorte < 0.6) { th = rand(35, 55); tw = rand(40, 60); }
                else if (sorte < 0.88) { th = rand(20, 35); tw = rand(25, 40); }
                else { th = rand(12, 20); tw = rand(15, 25); }
                state.world.trees.push({
                    x: tx, h: th, w: tw,
                    wobble: Math.random() * Math.PI * 2,
                    kind: sortearSilhueta()
                });
                tx += rand(14, 30); // dentro da mata as copas quase se tocam
            }
            tx += rand(aberto ? 90 : 45, aberto ? 190 : 120); // a clareira
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

