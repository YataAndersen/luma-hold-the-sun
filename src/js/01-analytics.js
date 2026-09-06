  // --- LUMA ANALYTICS SYSTEM v1.0 ---
  const EVENT_TYPES = {
      SESSION_START: 'session_start', SESSION_END: 'session_end',
      RUN_START: 'run_start', RUN_END: 'run_end', RUN_COMPLETE: 'run_complete',
      TAP: 'tap', PERFECT_TAP: 'perfect_tap', SUSTAIN: 'sustain', NEAR_FAIL: 'near_fail', BREAKTHROUGH: 'breakthrough', FAIL: 'fail',
      MISSION_COMPLETE: 'mission_complete', SEAL_UNLOCK: 'seal_unlock', BIOME_UNLOCK: 'biome_unlock', WORLD_LIGHT_UPDATE: 'world_light_update',
      SCREEN_VIEW: 'screen_view', BUTTON_CLICK: 'button_click', TUTORIAL_STEP: 'tutorial_step',
      SETTINGS_CHANGE: 'settings_change', ANALYTICS_CONSENT: 'analytics_consent'
  };

  class SessionData {
      constructor() {
          this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          this.startTime = Date.now();
          this.deviceInfo = {
              screenWidth: window.screen.width, screenHeight: window.screen.height,
              pixelRatio: window.devicePixelRatio, language: navigator.language, platform: navigator.platform,
              isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
              reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          };
      }
  }

  class AnalyticsTracker {
      constructor() {
          this.enabled = false;
          this.queue = [];
          this.flushInterval = null;
          this.endpoint = 'https://api.luma.game/analytics'; // Fallback simulado
          this.debug = window.location.search.includes('debug=true');
          this.session = new SessionData();
      }
      start() {
          this.enabled = true;
          if (this.flushInterval) clearInterval(this.flushInterval);
          this.flushInterval = setInterval(() => this.flush(), 5000);
          window.addEventListener('beforeunload', () => this.flush(true));
          if (this.debug) console.log('Analytics started');
      }
      stop() { this.enabled = false; if (this.flushInterval) clearInterval(this.flushInterval); this.flush(true); }
      track(eventType, data = {}) {
          if (!this.enabled) return;
          const event = { eventType, ...data, sessionId: this.session.sessionId, timestamp: Date.now(), appVersion: '1.0.0' };
          this.queue.push(event);
          if (this.debug && window.debugDash) window.debugDash.addEvent(event);
          if (this.queue.length >= 50) this.flush();
      }
      async flush(sync = false) {
          if (this.queue.length === 0) return;
          const events = [...this.queue];
          this.queue = [];
          if (sync && navigator.sendBeacon) {
              navigator.sendBeacon(this.endpoint, new Blob([JSON.stringify({ events, sentAt: Date.now() })], { type: 'application/json' }));
          } else {
              try {
                  const res = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events, sentAt: Date.now() }) });
                  if (!res.ok) throw new Error("Network response was not ok");
              } catch (err) {
                  if (this.debug) console.log('Analytics simulated dispatch (API not real):', events.length, 'events');
                  // Simulação: em ambiente real o re-queue aconteceria aqui se falhasse
              }
          }
      }
  }

  class AnalyticsDebugDashboard {
      constructor() { this.events = []; this.container = null; }
      init() {
          if (!window.location.search.includes('debug=true')) return;
          this.container = document.createElement('div');
          this.container.className = 'analytics-debug';
          this.container.innerHTML = `<div class="debug-header"><span class="debug-title">📊 ANALYTICS DEBUG</span><button class="debug-close" id="dbgClose">✕</button></div><div class="debug-stats"><div>eventos: <span id="dbgCount">0</span></div><div>session: <span id="dbgSess">...</span></div></div><div class="debug-events" id="dbgEvents"></div>`;
          document.body.appendChild(this.container);
          document.getElementById('dbgClose').onclick = () => this.container.remove();
      }
      addEvent(event) {
          this.events.unshift(event);
          if (this.events.length > 50) this.events.pop();
          if (this.container) {
              document.getElementById('dbgCount').textContent = this.events.length;
              document.getElementById('dbgSess').textContent = event.sessionId.substring(0, 8);
              document.getElementById('dbgEvents').innerHTML = this.events.map(e => `<div class="debug-event"><span class="event-time">${new Date(e.timestamp).toLocaleTimeString()}</span><span class="event-type">${e.eventType}</span><div class="event-data">${JSON.stringify(e).substring(0, 100)}</div></div>`).join('');
          }
      }
  }
  
  const analytics = new AnalyticsTracker();
  window.debugDash = new AnalyticsDebugDashboard();
  window.debugDash.init();
