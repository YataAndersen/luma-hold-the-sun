  // --- [5] DYNAMIC BGM SYSTEM ---
  function updateMusicSystem(dt) {
    if (!audio.ctx || !audio.enabled) return;
    const t = audio.ctx.currentTime;

    const BIOME_BPM = {
        meadow: 78, hills: 80, coast: 76, canyon: 82, desert: 84, forest: 78, snow: 72, storm: 88, ruins: 75, crystal: 82, nebula: 74, cosmos: 86, aurora: 84, zenith: 90
    };
    
    // --- SUSTINE DYNAMIC MUSIC MOOD SYSTEM ---
    let mood = { intensity: 0, warmth: 0, tension: 0, space: 0 };
    
    if (state.mode === "menu") {
        mood = { intensity: 0.1, warmth: 0.5, tension: 0, space: 0.8 };
    } else if (state.mode === "result") {
        mood = { intensity: 0.2, warmth: 0.7, tension: 0, space: 0.9 };
    } else {
        const altNorm = clamp(state.scoreMeters / 1800, 0, 1);
        const comboNorm = clamp(state.combo / 9, 0, 1);
        mood.intensity = state.sun.breakthrough ? 1.0 : clamp(altNorm * 0.6 + comboNorm * 0.4, 0, 1);
        mood.warmth = state.sun.breakthrough ? 1.0 : state.worldResponse.warmthLevel;
        mood.tension = state.sun.nearFail ? 1.0 : state.emotionalState.tension;
        mood.space = clamp(0.4 + altNorm * 0.6, 0, 1);
    }

    const baseBpm = BIOME_BPM[state.biome] || 78;
    const targetBpm = baseBpm - 8 + (mood.intensity * 20);
    audio.bpm = lerp(audio.bpm, targetBpm, dt * 0.5);

    if (['storm', 'thunder', 'dunes'].includes(state.biome)) {
        audio.chordProgression = ['Dm7', 'Bbmaj7', 'Fmaj7', 'Gm7']; // D Minor para tempestade e tensão
    } else {
        audio.chordProgression = ['Dmaj7', 'Bm7', 'Gmaj7', 'Asus2']; // D Major Canônico
    }

    const targets = [
        mood.space,                                        // Layer 0: Atmos (Space)
        0.3 + mood.intensity * 0.4,                        // Layer 1: Piano (Core Identity)
        mood.intensity * 0.5 + mood.space * 0.3,           // Layer 2: Harmony/Pads
        mood.intensity > 0.25 ? mood.intensity * 0.8 : 0,  // Layer 3: Melody
        mood.warmth * 0.7,                                 // Layer 4: Sparkle/Bells
        mood.intensity > 0.7 ? mood.intensity * 0.6 : 0,   // Layer 5: Choir
        mood.tension * 0.6                                 // Layer 6: Tension
    ];

    // PACTO DE ENGENHARIA: Mutagem Absoluta na Queda
    const isSilent = state.sun.nearFail || state.mode === "result";
    const proc = {
        lp: isSilent ? 400 : (12000 + mood.intensity * 6000),
        rev: 0.2 + mood.space * 0.2,
        master: isSilent ? 0.0 : (0.8 + mood.intensity * 0.2)
    };

    // PACTO DE ENGENHARIA: THROTTLE ENGINE
    // A API de Áudio entra em pânico se tentar recalcular 10 parâmetros complexos 60 vezes por segundo.
    // Agora a automação acontece estritamente a cada 100 milissegundos, mantendo a engine leve e sem 'zipper noise'.
    audio.updateThrottle += dt;
    if (audio.updateThrottle > 0.1) {
        const nowTime = audio.ctx.currentTime;
        audio.layerGains.forEach((g, i) => {
            g.gain.setTargetAtTime(targets[i] * 0.6, nowTime, 0.15);
        });
        audio.lowpass.frequency.setTargetAtTime(proc.lp, nowTime, 0.15);
        audio.reverbGain.gain.setTargetAtTime(proc.rev, nowTime, 0.15);
        const finalMasterVol = audio.isMuted ? 0 : (proc.master * 0.8 * (settings.audio.master / 100) * (settings.audio.music / 100));
        audio.master.gain.setTargetAtTime(finalMasterVol, nowTime, 0.15);

        if (audio.noiseGain) {
            let targetNoiseVol = 0.01;
            let targetNoiseFreq = 400;
            if (['desert', 'storm', 'zenith', 'canyon'].includes(state.biome)) {
                targetNoiseVol = 0.08 + (state.weather.rainIntensity * 0.1);
                targetNoiseFreq = 1200 + (state.weather.rainIntensity * 800);
            } else if (['meadow', 'hills', 'coast', 'snow'].includes(state.biome)) {
                targetNoiseVol = 0.03; targetNoiseFreq = 600;
            }
            if (isSilent) { targetNoiseVol = 0.0; targetNoiseFreq = 100; } 
            const finalNoiseVol = targetNoiseVol * (settings.audio.ambient / 100) * (settings.audio.master / 100);
            audio.noiseGain.gain.setTargetAtTime(finalNoiseVol, nowTime, 0.15);
            audio.noiseFilter.frequency.setTargetAtTime(targetNoiseFreq, nowTime, 0.15);
        }
        audio.updateThrottle = 0;
    }

    audio.chordTimer += dt;
    const chordInterval = (60 / audio.bpm) * 6;
    if (audio.chordTimer >= chordInterval) {
        audio.chordTimer = 0;
        audio.chordIndex = (audio.chordIndex + 1) % audio.chordProgression.length;
        const chordName = audio.chordProgression[audio.chordIndex];
        const notes = CHORDS[chordName];
        if (notes) {
            audio.padOscs.forEach((osc, i) => {
                if (notes[i] && NOTE_HZ[notes[i]]) osc.frequency.linearRampToValueAtTime(NOTE_HZ[notes[i]], t + 1.0);
            });
        }
    }

    audio.melodyTimer += dt;
    const melodyInterval = (60 / audio.bpm) * 1.5;
    if (audio.melodyTimer >= melodyInterval && targets[3] > 0.1 && state.mode === "gameplay") {
        audio.melodyTimer = 0;
        if (Math.random() < 0.7) {
            const phrase = state.sun.breakthrough ? PHRASE_DAWN_BLOOM : PHRASE_SKY_ASCENT;
            const note = phrase[audio.melodyNote % phrase.length];
            const freq = NOTE_HZ[note];
            if (freq) {
                const dur = (60 / audio.bpm) * 0.8;
                playNote(freq, dur, { type: 'sine', volume: 0.08, attack: 0.02, release: dur*0.4, layer: 3 });
                if (audio.melodyNote % 3 === 0) playNote(freq*2, dur*0.3, { type: 'sine', volume: 0.015, attack: 0.01, release: 0.1, layer: 4 });
            }
            audio.melodyNote++;
            if (audio.melodyNote >= phrase.length) {
                audio.melodyNote = 0;
            }
        }
    }
  }

  // Função utilitária para capturar o volume atual das camadas de áudio (VFX Sync)
  const getVol = (layerIndex) => (audio.layerGains && audio.layerGains[layerIndex]) ? audio.layerGains[layerIndex].gain.value : 0;

