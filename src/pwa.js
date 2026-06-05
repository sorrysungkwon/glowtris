const LS_INSTALLED    = 'pwa-installed';
const LS_SNOOZE_UNTIL = 'pwa-snooze-until';
const SNOOZE_DAYS     = 3;
const VAPID_PUBLIC_KEY = 'BI_rkhrMPW6oSlsvTpIBySBEECvvvkiPtxzmF5DOmtTim3fIDSxXU7P_Bn3TWMi3Vh_hapjlOZ1KyiexF8T0V4s';

function _urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...atob(base64)].map(c => c.charCodeAt(0)));
}

async function _registerPushSub() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
    await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON(), tzOffset: new Date().getTimezoneOffset() }) });
  } catch (e) { console.warn('[pwa] push sub failed', e); }
}

// ── Centralized toast ─────────────────────────────────────────────────────────
export function showToast(msg, { icon = '', duration = 3000 } = {}) {
  let el = document.getElementById('pwa-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pwa-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = icon
    ? `<span class="material-icons-round" style="font-size:14px">${icon}</span>${msg}`
    : msg;
  el.classList.add('visible');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visible'), duration);
}

// ── SW update toast ───────────────────────────────────────────────────────────
window._pwaShowUpdateToast = function() {
  let el = document.getElementById('pwa-update-bar');
  if (el) return;
  el = document.createElement('div');
  el.id = 'pwa-update-bar';
  el.innerHTML = `<span class="material-icons-round" style="font-size:14px">system_update</span>New version available<button class="pwa-update-refresh" onclick="window.location.reload()">REFRESH</button>`;
  if (document.getElementById('offline-bar')) el.classList.add('below-offline');
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
};

let _deferred    = null;
let _gameActive  = false;
let _bannerTimer = null;

function _installed() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true ||
    !!localStorage.getItem(LS_INSTALLED);
}

function _iOS() {
  // iPadOS 13+ reports as "Macintosh" — use maxTouchPoints to distinguish
  return (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function _isDesktop() {
  return !_iOS() && !!_deferred && !('ontouchstart' in window) && window.innerWidth >= 600;
}

function _installLabel() {
  return _isDesktop() ? '💻 INSTALL APP' : '📲 ADD TO HOME SCREEN';
}

function _bannerSubtext() {
  return _isDesktop() ? 'Launch from desktop · no browser bar' : 'Play offline · no browser bar';
}

function _snoozed() {
  const until = parseInt(localStorage.getItem(LS_SNOOZE_UNTIL) || '0', 10);
  return Date.now() < until;
}

export function initPWA() {
  _initOfflineIndicator();

  if (_installed()) {
    setTimeout(_askNotif, 1500); // Ask for push notifs when launched from home screen
    return;
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferred = e;
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(LS_INSTALLED, '1');
    _deferred = null;
    hidePWABanner();
  });

  if (!_snoozed()) {
    clearTimeout(_bannerTimer);
    _bannerTimer = setTimeout(_showBanner, 500);
  }
}

function _initOfflineIndicator() {
  window.addEventListener('offline', _showOffline);
  window.addEventListener('online',  _hideOffline);
  if (!navigator.onLine) _showOffline();
}

function _showOffline() {
  if (document.getElementById('offline-bar')) return;
  const el = document.createElement('div');
  el.id = 'offline-bar';
  el.innerHTML = `<span class="material-icons-round" style="font-size:14px">wifi_off</span> No internet connection`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));

  // push update-bar below if it's showing
  document.getElementById('pwa-update-bar')?.classList.add('below-offline');

  // swipe up to dismiss for this session
  let startY = 0;
  el.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (startY - e.changedTouches[0].clientY > 30) {
      sessionStorage.setItem('offline-bar-swiped', '1');
      el.classList.add('swiped');
      setTimeout(() => el.remove(), 300);
    }
  }, { passive: true });
}

export function offlineBarGameStart() {
  _gameActive = true;
  clearTimeout(_bannerTimer);
  document.getElementById('offline-bar')?.classList.add('game-active');
  document.getElementById('pwa-banner')?.classList.add('game-active');
  document.getElementById('pwa-banner')?.classList.remove('visible');
}

export function offlineBarGameEnd() {
  _gameActive = false;
  if (!sessionStorage.getItem('offline-bar-swiped')) {
    document.getElementById('offline-bar')?.classList.remove('game-active');
  }
}

function _hideOffline() {
  const el = document.getElementById('offline-bar');
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 300);
  // restore update-bar position
  document.getElementById('pwa-update-bar')?.classList.remove('below-offline');
}

export function onPWAGameOver() {
  if (_installed() || _snoozed()) return;
  _gameActive = false;
  clearTimeout(_bannerTimer);
  _bannerTimer = setTimeout(_showBanner, 500);
}

export function pwaInstallBtnHTML(p) {
  if (_installed()) return '';
  if (!_deferred && !_iOS()) return '';
  return `<button class="toggle-btn pwa-install-btn" id="${p}-pwa-btn" onclick="window._pwaInstall()" style="touch-action:manipulation">${_installLabel()}</button>`;
}

function _showBanner() {
  if (_installed() || _snoozed()) return;
  if (sessionStorage.getItem('pwa-closed')) return;
  if (!_deferred && !_iOS()) return;
  if (_gameActive) return;

  let el = document.getElementById('pwa-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'pwa-banner';
    el.innerHTML = `
      <div class="pwa-banner-inner">
        <div class="pwa-banner-top">
          <span class="pwa-banner-icon">${_isDesktop() ? '💻' : '📲'}</span>
          <div class="pwa-banner-text">
            <div class="pwa-banner-title">${_isDesktop() ? 'INSTALL APP' : 'ADD TO HOME SCREEN'}</div>
            <div class="pwa-banner-sub">${_bannerSubtext()}</div>
          </div>
          <button class="pwa-banner-close" onclick="window._pwaDismiss()" aria-label="Dismiss">✕</button>
        </div>
        <div class="pwa-banner-btns">
          <button class="pwa-banner-add" onclick="window._pwaInstall()">ADD</button>
          <button class="pwa-banner-snooze" onclick="window._pwaSnooze()">Don't show for ${SNOOZE_DAYS} days</button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }
  
  el.offsetHeight; // force reflow for transition
  if (!_gameActive) el.classList.add('visible');
}

export function hidePWABanner() {
  clearTimeout(_bannerTimer);
  const el = document.getElementById('pwa-banner');
  if (el) el.classList.remove('visible');
}

window._pwaDismiss = function() {
  sessionStorage.setItem('pwa-closed', '1');
  hidePWABanner();
};

window._pwaSnooze = function() {
  const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(LS_SNOOZE_UNTIL, String(until));
  hidePWABanner();
};

window._pwaInstall = function() {
  hidePWABanner();
  if (_deferred) {
    _deferred.prompt();
    _deferred.userChoice.then(r => {
      _deferred = null;
      if (r.outcome === 'accepted') {
        localStorage.setItem(LS_INSTALLED, '1');
        setTimeout(_askNotif, 800);
      }
    });
  } else if (_iOS()) {
    _showIOSModal();
  }
};

function _showIOSModal() {
  _removeModal();
  const el = document.createElement('div');
  el.id = 'pwa-modal';
  el.innerHTML = `
    <div class="pwa-modal-box">
      <div class="pwa-modal-title">ADD TO HOME SCREEN</div>
      <ol class="pwa-modal-steps">
        <li>Tap the <strong>Share</strong> button
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:3px;color:rgba(0,200,255,0.8)"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          at the bottom of Safari
        </li>
        <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>Add</strong> to confirm</li>
      </ol>
      <button class="action-btn full-width" onclick="window._pwaIOSDone()">GOT IT</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
}

window._pwaIOSDone = function() {
  _removeModal();
  setTimeout(_askNotif, 400);
};

function _askNotif() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;
  if (localStorage.getItem('pwa-notif-snooze')) return; // Snoozed or disabled
  _removeModal();

  const el = document.createElement('div');
  el.id = 'pwa-modal';
  el.innerHTML = `
    <div class="pwa-modal-box">
      <div class="pwa-modal-icon">🔔</div>
      <div class="pwa-modal-title">ENABLE NOTIFICATIONS?</div>
      <div class="pwa-modal-body">Get notified about daily challenges.<br><span style="opacity:0.7;font-size:10px">You can change this later in Settings.</span></div>
      <button class="action-btn full-width" onclick="window._pwaNotifAllow()">ALLOW</button>
      <button class="action-btn ghost full-width" style="margin-top:8px" onclick="window._pwaNotifDeny()">NOT NOW</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
}

function _removeModal() {
  const el = document.getElementById('pwa-modal');
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 350);
}

window._pwaNotifAllow = function() {
  _removeModal();
  Notification.requestPermission().then(p => {
    localStorage.setItem('pwa-notif', p);
    if (p === 'granted') _registerPushSub();
  });
};

window._pwaNotifDeny = function() {
  _removeModal();
  localStorage.setItem('pwa-notif-snooze', 'forever'); // Don't ask again automatically
};

window._pwaNotifToggle = function() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported on this browser.', { icon: 'notifications_off' });
    return;
  }
  if (Notification.permission === 'granted') {
    showToast('To turn off notifications, go to your browser/device settings.', { icon: 'notifications', duration: 4000 });
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('Notifications are blocked. Enable them in device settings.', { icon: 'notifications_off', duration: 4000 });
    return;
  }
  Notification.requestPermission().then(p => {
    localStorage.setItem('pwa-notif', p);
    if (p === 'granted') {
      _registerPushSub();
      showToast('Notifications enabled!', { icon: 'notifications_active' });
    }
  });
};
