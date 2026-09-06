  // ============================================================================
  // 🎵 LUMA AUDIO ENGINE V2.0 - EXTREME PERFORMANCE REFACTOR
  // Blindagem de CPU, Limite de Polifonia, Rate Limiting e Try/Catch global
  // ============================================================================

  // --- [1] AUDIO SYSTEM STATE & CONFIG ---
  const audio = {
    ctx: null, enabled: true, master: null, reverb: null, reverbGain: null, dryGain: null, lowpass: null,
    layerGains: [], droneOscs: [], droneGains: [], padOscs: [], padGains: [], tensOsc: null, tensGain: null,
    noiseFilter: null, noiseGain: null,
    melodyTimer: 0, melodyPhrase: 0, melodyNote: 0, chordIndex: 0, chordTimer: 0, updateThrottle: 0,
    isMuted: false,
    chordProgression: ['Dmaj7','Bm7','Gmaj7','Asus2'],
    musicState: "menu", bpm: 78, audioLogoPlayed: false,
    activeVoices: 0, MAX_VOICES: 12 // PAREDE DE CONCRETO: Limite absoluto de sons simultâneos
  };

  function createReverbIR(actx, duration, decay) {
    const len = actx.sampleRate * duration;
    const buf = actx.createBuffer(2, len, actx.sampleRate);
    for (let ch=0; ch<2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i=0; i<len; i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
    }
    return buf;
  }

  // --- [2] SYSTEM INITIALIZATION (INIT) ---
  // --- CÁLCULO DA LUZ DO MUNDO (META-PROGRESSÃO) ---
  function calculateWorldLight() {
      let light = 0;
      let totalSeals = 0;
      let gold = 0, silver = 0, bronze = 0;
      
      if (mapProgress && mapProgress.nodeStats) {
          for (const nodeId in mapProgress.nodeStats) {
              const stats = mapProgress.nodeStats[nodeId];
              if (stats.main) {
                  totalSeals++;
                  let stars = 1; // Bronze
                  if (stats.subs && stats.subs[0] && stats.subs[1]) stars = 2; // Prata
                  if (stars === 2 && stats.perf) stars = 3; // Ouro
                  
                  if (stars === 3) { light += 2; gold++; }
                  else if (stars === 2) { light += 1; silver++; }
                  else { light += 0.5; bronze++; }
              }
          }
      }
      
      // Pássaros (Máx 500 = Até 100% cap)
      const birds = state.totalRunMemory.totalBirds || 0;
      light += Math.min(500, birds) * 0.5;
      
      // Metros (Máx 100k = Até 100% cap)
      const meters = state.totalMeters || 0;
      light += Math.min(100000, meters) * 0.001;
      
      return {
          percentage: Math.min(100, light),
          totalSeals, gold, silver, bronze,
          birds, meters
      };
  }

  function initAudio() {
    if (audio.ctx) return;
    try {
      const AC = new (window.AudioContext || window.webkitAudioContext)();
      
      const compressor = AC.createDynamicsCompressor();
      // Ajuste de Compressão: Mais musical, menos agressivo, permitindo volume maior em mobile.
      compressor.threshold.value = -3;
      compressor.knee.value = 5;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.1;
      compressor.connect(AC.destination);
      
      const master = AC.createGain();
      master.gain.value = 0.8; // Boost massivo de ganho global
      master.connect(compressor);

      const lowpass = AC.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 14000;
      lowpass.connect(master);

      const reverbNode = AC.createConvolver();
      // Otimização Extrema: Reverb reduzido de 3.0s para 1.5s corta o processamento matemático pela metade
      reverbNode.buffer = createReverbIR(AC, 1.5, 3.0);
      const reverbGain = AC.createGain();
      reverbGain.gain.value = 0.25;
      reverbGain.connect(lowpass);
      reverbNode.connect(reverbGain);

      const dryGain = AC.createGain();
      dryGain.gain.value = 0.85;
      dryGain.connect(lowpass);

      const layerGains = [];
      for(let i=0; i<7; i++) {
          const g = AC.createGain();
          g.gain.value = 0;
          g.connect(dryGain);
          // PACTO DE ENGENHARIA: Isola o ruído do vento (0) e a tensão (6) do Reverb.
          // O Convolver estoura e acumula som em loop infinito se receber ruído branco e subgrave contínuo.
          if (i >= 1 && i <= 5) g.connect(reverbNode);
          layerGains.push(g);
      }

      const padOscs = [], padGains = [];
      CHORDS['Dmaj7'].forEach(note => {
          const osc = AC.createOscillator(); osc.type = 'sine'; osc.frequency.value = NOTE_HZ[note] || 293.66; osc.start();
          const g = AC.createGain(); g.gain.value = 0.015; osc.connect(g).connect(layerGains[2]);
          padOscs.push(osc); padGains.push(g);
      });

      // --- WIND & AMBIENT NOISE GENERATOR ---
      const bufferSize = AC.sampleRate * 2;
      const noiseBuffer = AC.createBuffer(1, bufferSize, AC.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      const noiseSource = AC.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      const noiseFilter = AC.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 400;
      const noiseGain = AC.createGain();
      noiseGain.gain.value = 0;
      noiseSource.connect(noiseFilter).connect(noiseGain).connect(layerGains[0]);
      noiseSource.start();

      Object.assign(audio, {
          ctx: AC, master, reverb: reverbNode, reverbGain, dryGain, lowpass, layerGains,
          droneOscs: [], droneGains: [], padOscs, padGains, tensOsc: null, tensGain: null, noiseFilter, noiseGain
      });

      if (!audio.audioLogoPlayed) {
        audio.audioLogoPlayed = true;
        AUDIO_LOGO.forEach((note, i) => {
            playNote(NOTE_HZ[note], 0.2 * (i===4?3:1), { type: 'sine', volume: 0.11, attack: 0.012, release: 0.15, cutoff: 2600, delay: i * 0.22, layer: 3 });
            if (i < 4) playNote(NOTE_HZ[note]*2, 0.05, { type: 'sine', volume: 0.02, attack: 0.005, release: 0.1, cutoff: 4000, delay: i*0.22, layer: 4 });
        });
      }
    } catch (e) {}
  }

  // --- [3] CORE ENGINE (NOTE GENERATOR) ---
  function playNote(freq, duration, opts = {}) {
    if (!audio.enabled || !audio.ctx) return;
    // PACTO DE ENGENHARIA: Trava de RAM. Aborta o som imediatamente se o processador estiver ocupado com mais de 12 notas ativas.
    if (audio.activeVoices >= audio.MAX_VOICES) return;

    try {
      const ac = audio.ctx;
      const t = ac.currentTime + (opts.delay || 0);
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = opts.type || 'sine'; // Transforma todos os toques em sinos de vidro e remove o som de 8-bit
      osc.frequency.setValueAtTime(freq, t);

      // Otimização: A criação de "BiquadFilter" por nota foi completamente removida. Ocultava a CPU.

      const isSfx = opts.layer === 1 || opts.layer === 4;
      const volMult = (isSfx ? (settings.audio.sfx / 100) : (settings.audio.music / 100)) * (settings.audio.master / 100);
      const vol = (opts.volume || 0.08) * volMult;
      
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.02));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + (opts.release || duration * 0.6));
      
      if (opts.targetFreq) osc.frequency.exponentialRampToValueAtTime(opts.targetFreq, t + duration);

      osc.connect(gain);
      
      if (opts.layer !== undefined && audio.layerGains[opts.layer]) {
          gain.connect(audio.layerGains[opts.layer]);
      } else {
          gain.connect(audio.dryGain);
          if (opts.reverb !== false && audio.reverb) gain.connect(audio.reverb);
      }

      audio.activeVoices++;
      osc.onended = () => { audio.activeVoices = Math.max(0, audio.activeVoices - 1); };

      osc.start(t);
      osc.stop(t + duration + (opts.release || duration * 0.6) + 0.1);
    } catch (e) {
      // Fallback silencioso (protege o jogo caso o navegador cancele a thread de áudio por estresse)
    }
  }

  // --- [4] SPECIFIC SOUND EFFECTS (SFX) ---
  let lastTapAudioTime = 0;
  function playTap(perfect = false, distanceN = 0, combo = 0) {
    if (!audio.ctx) return;
    const now = audio.ctx.currentTime;
    if (now - lastTapAudioTime < 0.08) return;
    let spamMuffle = 1;
    if (now - lastTapAudioTime < 0.25) spamMuffle = 0.3; 
    lastTapAudioTime = now;
    const volDist = (0.4 + (1 - distanceN) * 0.6) * spamMuffle;
    
    if (perfect) {
      const notes = ['D4', 'F#4', 'A4', 'C#5'];
      const vol = Math.min(0.08 + combo * 0.01, 0.15);
      notes.forEach((n, i) => {
          playNote(NOTE_HZ[n], 0.3, { type: 'sine', volume: vol * 0.5, delay: i * 0.03, layer: 4 });
      });
      playNote(NOTE_HZ['F#4'], 0.2, { type: 'sine', volume: vol, attack: 0.01, release: 0.25, layer: 1 });
    } else {
      const vars = ['D5', 'F#5', 'A5'];
      const v = vars[Math.floor(Math.random() * vars.length)];
      playNote(NOTE_HZ[v], 0.12, { type: 'sine', volume: 0.06 * volDist, attack: 0.005, release: 0.1, layer: 1 });
      playNote(NOTE_HZ[v] / 2, 0.15, { type: 'sine', volume: 0.04 * volDist, attack: 0.01, release: 0.12, layer: 1 });
    }
  }

  function playGraceGained() {
    playNote(NOTE_HZ['D5'], 0.4, { type: 'sine', volume: 0.05, attack: 0.01, release: 0.3, layer: 4 });
    playNote(NOTE_HZ['F#5'], 0.6, { type: 'sine', volume: 0.03, attack: 0.1, release: 0.4, delay: 0.1, layer: 4 });
  }
  
  function playErrorMuffle() {
    playNote(NOTE_HZ['D3'], 0.3, { type: 'triangle', targetFreq: 110.00, volume: 0.04, attack: 0.02, release: 0.2, cutoff: 800, layer: 6 });
  }

  function playReward() {
    playNote(NOTE_HZ['A4'], 0.4, { type: 'sine', volume: 0.06, attack: 0.02, release: 0.2, layer: 4 });
    playNote(NOTE_HZ['D5'], 0.6, { type: 'sine', volume: 0.04, attack: 0.01, release: 0.4, delay: 0.1, layer: 4 });
  }

  function playCollapseSound() {
  }

  function playDawnAwakened() {
    ['D3','F#3','A3','C#4'].forEach(n => playNote(NOTE_HZ[n], 1.2, { type: 'sine', volume: 0.04, attack: 0.4, release: 0.6, layer: 3 }));
    setTimeout(() => {
        ['G3','B3','D4','F#4'].forEach(n => playNote(NOTE_HZ[n], 1.5, { type: 'sine', volume: 0.04, attack: 0.3, release: 0.8, layer: 3 }));
        playNote(NOTE_HZ['D5'], 2.0, { type: 'sine', targetFreq: NOTE_HZ['D6'] || 1174.66, volume: 0.05, attack: 0.1, release: 1.5, layer: 4 });
    }, 400);
  }

  function playBirdsReturn() {
    playNote(NOTE_HZ['D4'], 0.4, { type: 'sine', targetFreq: NOTE_HZ['A5'], volume: 0.03, attack: 0.02, release: 0.3, layer: 4 });
    for(let i=0; i<4; i++) playNote(NOTE_HZ['A5'], 0.05, { type: 'sine', volume: 0.015, delay: i*0.08, layer: 4 });
  }

  function playUIHover() { playNote(NOTE_HZ['D5'], 0.06, { type: 'sine', targetFreq: NOTE_HZ['F#5'], volume: 0.015, attack: 0.01, release: 0.05, layer: 4, reverb: false }); }
  function playUIConfirm() { ['D4','F#4','A4'].forEach((n,i) => playNote(NOTE_HZ[n], 0.2, { type: 'sine', volume: 0.03, delay: i*0.04, attack: 0.01, release: 0.15, layer: 4, reverb: false })); }
  function playUIBack() { ['A4','G4','F#4'].forEach((n,i) => playNote(NOTE_HZ[n], 0.15, { type: 'sine', volume: 0.03, delay: i*0.04, attack: 0.01, release: 0.1, layer: 4, reverb: false })); }

  function setHoldAudio(intensity, stability, breakthrough) {
     // Hold Audio é tratado pelo sistema orgânico geral
  }
  function silenceHoldAudio() {
     // Hold Audio é tratado pelo sistema orgânico geral
  }

