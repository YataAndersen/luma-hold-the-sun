  function initMissionSystem() {
    try {
      const rawMap = localStorage.getItem("luma_journey_progress_v1");
      const jProg = rawMap ? JSON.parse(rawMap) : null;
      const nodeId = jProg ? jProg.currentNodeId : 'm1';
      experienceState.mission = HOLD_THE_SUN_MISSIONS.find(m => m.id === nodeId) || HOLD_THE_SUN_MISSIONS[0];
    } catch(e){}
    state.biome = experienceState.mission.biome || 'forest';
    resetMissionRunState();
  }

  function resetMissionRunState() {
    experienceState.missionProgress = 0;
    experienceState.missionCompleted = false;
    experienceState.missionToastTimer = 0;
    experienceState.missionPerfectFailed = false;
    experienceState.missionBirdsThisRun = 0;
    experienceState.sub1Completed = false;
    experienceState.sub2Completed = false;
    experienceState.perfCompleted = false;
    // Resolvido uma vez por missão: procurar o nó a cada frame varreria as 50 missões.
    experienceState.node = experienceState.mission
      ? MAP_NODES.find(n => n.id === experienceState.mission.id) || null
      : null;

    // Objetivo principal fixo no topo: o jogador precisa saber o que persegue sem ler a lista
    // lateral, que desvanece com o foco. Durante o tutorial ele fica fora do caminho.
    if (ui.topGoal) {
      const mission = experienceState.mission;
      ui.topGoal.textContent = mission ? t(mission.subtitle).replace(/\.$/, '').toLowerCase() : '';
      ui.topGoal.classList.toggle('hidden', !mission || isTutorialActive());
    }

    let mIdNum = experienceState.mission ? parseInt(experienceState.mission.id.replace('m', '')) || 1 : 1;
    experienceState.missionDuration = 60 + Math.floor((mIdNum - 1) / 10) * 15; // Missões 1-10: 60s. Missões 11-20: 75s...
    experienceState.missionTimeLeft = experienceState.missionDuration;
  }

  function markMissionComplete() {
    if (experienceState.missionCompleted) return;
    experienceState.missionCompleted = true;
    experienceState.missionProgress = 1;
    experienceState.missionToastTimer = 3.0; // Tempo do Toast na tela aumentado
    
    // CONSERTO: Dispara o Toast de Conclusão na Tela!
    if (missionUI.toast && experienceState.mission) {
        missionUI.toast.textContent = t(experienceState.mission.toast).toLowerCase();
        missionUI.toast.classList.add('show');
    }
    
    emitAudioEvent('mission_victory'); // Toca a fanfarra do sucesso!
    
    // --- CUTSCENE DE CLÍMAX VISUAL ---
    if (state.cutscene) {
       state.cutscene.active = true;
       state.cutscene.timer = state.cutscene.duration;
       triggerCameraShake(2.5); // Tremor de impacto massivo
       
       // 1. ONDA DE CHOQUE VENTO/POEIRA (Thermal Shockwave)
       state.world.ambientDust.forEach(d => {
           const dx = d.x - state.sun.x;
           const dy = d.y - (state.sun.y + state.camera.y);
           const dist = Math.hypot(dx, dy) || 1;
           d.vx += (dx / dist) * 45; // Empurra com força extrema
           d.vy += (dy / dist) * 45;
       });
       
       // 2. PÁSSAROS E FAÍSCAS DIVINAS EXPELIDAS DO NÚCLEO
       spawnBirdRing();
       spawnBirdRing();

       if (ui.topGoal) ui.topGoal.classList.add('hidden');

    }

  }

  function triggerMiniTaskExplosion() {
      state.sun.haloPulse = 1.5;
      state.sun.tapScale = 1.3;
      triggerScreenFlash('rgba(255, 249, 236, 0.25)');
      emitAudioEvent('grace_gained');
      // Saiu daqui um showFloating("task complete"): o toast logo abaixo ja diz QUAL tarefa
      // foi concluida, e as duas mensagens apareciam juntas, em alturas diferentes, para o
      // mesmo evento. Uma generica somada a uma especifica nao informa o dobro; atrapalha.
  }

  // O instante em que uma tarefa é cumprida não tinha retorno nenhum: os flags existiam,
  // nunca eram marcados, e o feedback curto já estava escrito sem ninguém chamar.
  function announceTaskDone(label) {
      experienceState.missionToastTimer = 2.2;
      if (missionUI.toast) {
          missionUI.toast.textContent = t(String(label)).toLowerCase();
          missionUI.toast.classList.add('show');
      }
      triggerMiniTaskExplosion();
  }

  function updateMissionLogic(dt, runtimeData) {
    if (!experienceState.mission) return;
    
    if (experienceState.missionCompleted) {
        experienceState.missionProgress = 1;
        if (experienceState.missionToastTimer > 0) { experienceState.missionToastTimer -= dt; if (experienceState.missionToastTimer <= 0) missionUI.toast.classList.remove('show'); }
        return;
    }

    const m = experienceState.mission;

    // PACTO DE DESIGN: Missão guiada EXCLUSIVAMENTE pelo tempo (Timer Ring)
    const previousTimeLeft = experienceState.missionTimeLeft;
    experienceState.missionTimeLeft = Math.max(0, experienceState.missionTimeLeft - dt);
    experienceState.missionProgress = 1 - (experienceState.missionTimeLeft / experienceState.missionDuration);
    
    const ringFill = document.getElementById('missionRingFill');
    const ringText = document.getElementById('missionRingText');
    const ringHUD = document.getElementById('missionRingHUD');
    if (ringFill && ringText) {
        const circ = 188.49; 
        ringFill.style.strokeDasharray = circ;
        ringFill.style.strokeDashoffset = experienceState.missionProgress * circ; // Agora ele ESVAZIA perfeitamente!
        ringText.textContent = Math.ceil(experienceState.missionTimeLeft) + 's';
    }
    
    // Tarefas secundárias cumpridas durante a corrida ganham um retorno no instante em que acontecem.
    const node = experienceState.node;
    if (node) {
        if (!experienceState.sub1Completed && evaluateLiveCondition(node.req.subs[0])) {
            experienceState.sub1Completed = true;
            announceTaskDone(node.subs[0]);
        } else if (!experienceState.sub2Completed && evaluateLiveCondition(node.req.subs[1])) {
            experienceState.sub2Completed = true;
            announceTaskDone(node.subs[1]);
        }
    }

    // Aviso de "Tic-Tac" Vermelho de Fim de Missão
    const prevSec = Math.ceil(previousTimeLeft);
    const currSec = Math.ceil(experienceState.missionTimeLeft);
    if (currSec < prevSec && currSec <= 5 && currSec > 0) {
        emitAudioEvent('timer_tick');
        if (ringHUD) {
            ringHUD.style.transform = 'translateX(-50%) scale(1.15)';
            ringHUD.style.borderColor = 'rgba(255, 100, 100, 0.6)';
            ringText.style.color = '#FF8888';
            setTimeout(() => {
                ringHUD.style.transform = 'translateX(-50%) scale(1)';
                ringHUD.style.borderColor = 'rgba(255,255,255,0.15)';
                ringText.style.color = 'var(--sun-pure)';
            }, 150);
        }
    }

    if (experienceState.missionTimeLeft <= 0 && !experienceState.missionCompleted) {
        const mainReq = getReqForMission(m);
        const mainDone = evaluateLiveCondition(mainReq);
        
        if (mainDone) {
            experienceState.missionProgress = 1;
            markMissionComplete();
        } else {
            endRun(false); // Acabou o tempo e não atingiu a meta primária
            showFloating("the light faded", false);
        }
    }


    if (experienceState.missionToastTimer > 0) { experienceState.missionToastTimer -= dt; if (experienceState.missionToastTimer <= 0) missionUI.toast.classList.remove('show'); }
  }

