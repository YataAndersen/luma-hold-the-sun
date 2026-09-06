  // --- SPLASH SCREEN LOGIC ---
  const splashScreen = document.getElementById("splashScreen");
  const storyScreen = document.getElementById("storyScreen");
  const isReturning = window.location.search.includes('node=');
  
  let splashTimeouts = [];
  const skipPresentation = () => {
      splashTimeouts.forEach(t => clearTimeout(t));
      splashScreen.classList.add("hidden");
      storyScreen.classList.add("hidden");
      splashScreen.style.display = "none";
      storyScreen.style.display = "none";
      splashScreen.removeEventListener('pointerdown', skipPresentation);
      storyScreen.removeEventListener('pointerdown', skipPresentation);
      checkConsentOnLoad();
  };

  splashScreen.addEventListener('pointerdown', skipPresentation);
  storyScreen.addEventListener('pointerdown', skipPresentation);

  let hasSplashed = false;
  try { hasSplashed = sessionStorage.getItem("luma_splashed"); } catch(e) {}

  if (isReturning || hasSplashed) {
    splashScreen.style.display = "none";
    storyScreen.style.display = "none";
    checkConsentOnLoad();
  } else {
    try { sessionStorage.setItem("luma_splashed", "true"); } catch(e) {}
    splashTimeouts.push(setTimeout(() => { 
        splashScreen.classList.add("hidden"); 
        storyScreen.classList.remove("hidden");
        
        splashTimeouts.push(setTimeout(() => document.getElementById("story1").classList.add("show"), 1000));
        splashTimeouts.push(setTimeout(() => document.getElementById("story2").classList.add("show"), 4000));
        
        splashTimeouts.push(setTimeout(() => {
            storyScreen.classList.add("hidden");
            checkConsentOnLoad();
        }, 8500));
    }, 4500));
  }
  
  function checkConsentOnLoad() {
      if (settings.analyticsConsent === null) {
          const modal = document.getElementById('consentModal');
          if(modal) modal.classList.remove('hidden');
      } else if (settings.analyticsConsent) {
          analytics.start();
          analytics.track(EVENT_TYPES.SESSION_START, { timestamp: Date.now() });
      }
  }
  
  const consentYesBtn = document.getElementById('consentYes');
  if (consentYesBtn) consentYesBtn.addEventListener('click', () => {
      settings.analyticsConsent = true; saveProgress(); document.getElementById('consentModal').classList.add('hidden');
      applySettingsToDOM(); analytics.start();
      analytics.track(EVENT_TYPES.ANALYTICS_CONSENT, { consent: true }); analytics.track(EVENT_TYPES.SESSION_START, { timestamp: Date.now() });
  });
  
  const consentNoBtn = document.getElementById('consentNo');
  if(consentNoBtn) consentNoBtn.addEventListener('click', () => {
      settings.analyticsConsent = false; saveProgress(); document.getElementById('consentModal').classList.add('hidden'); applySettingsToDOM();
  });

