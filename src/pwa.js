const LS_INSTALLED   = 'pwa-installed';
const LS_SNOOZE_UNTIL = 'pwa-snooze-until';
const SNOOZE_DAYS    = 3;

let _deferred    = null;
let _bannerShown = false;

function _installed() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true ||
    !!localStorage.getItem(LS_INSTALLED);
}

function _iOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function _snoozed() {
  const until = parseInt(localStorage.getItem(LS_SNOOZE_UNTIL) || '0', 10);
  return Date.now() < until;
}

export function initPWA() {
  if (_installed()) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferred = e;
  });

  window.addEventListener('appinstalled', () => {
    localStorage.setItem(LS_INSTALLED, '1');
    _deferred = null;
    _hideBanner();
  });

  if (!_snoozed()) {
    setTimeout(() => { if (!_bannerShown) _showBanner(); }, 2000);
  }
}

export function onPWAGameOver() {
  if (_installed() || _bannerShown || _snoozed()) return;
  setTimeout(_showBanner, 1200);
}

export function pwaInstallBtnHTML(p) {
  if (_installed()) return '';
  if (!_deferred && !_iOS()) return '';
  return `<button class="toggle-btn pwa-install-btn" id="${p}-pwa-btn" onclick="window._pwaInstall()" style="touch-action:manipulation">📲 ADD TO HOME SCREEN</button>`;
}

function _showBanner() {
  if (_bannerShown || _installed() || _snoozed()) return;
  if (sessionStorage.getItem('pwa-closed')) return;
  if (!_deferred && !_iOS()) return;
  _bannerShown = true;

  const el = document.createElement('div');
  el.id = 'pwa-banner';
  el.innerHTML = `
    <div class="pwa-banner-inner">
      <span class="pwa-banner-icon">📲</span>
      <div class="pwa-banner-text">
        <div class="pwa-banner-title">ADD TO HOME SCREEN</div>
        <div class="pwa-banner-sub">Play offline · no browser bar</div>
      </div>
      <div class="pwa-banner-actions">
        <button class="pwa-banner-add" onclick="window._pwaInstall()">ADD</button>
        <button class="pwa-banner-snooze" onclick="window._pwaSnooze()">Don't show for ${SNOOZE_DAYS} days</button>
      </div>
      <button class="pwa-banner-close" onclick="window._pwaDismiss()" aria-label="Dismiss">✕</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
}

function _hideBanner() {
  const el = document.getElementById('pwa-banner');
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.remove(), 350);
}

window._pwaDismiss = function() {
  sessionStorage.setItem('pwa-closed', '1');
  _hideBanner();
};

window._pwaSnooze = function() {
  const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(LS_SNOOZE_UNTIL, String(until));
  _hideBanner();
};

window._pwaInstall = function() {
  _hideBanner();
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
  _removeModal();

  const el = document.createElement('div');
  el.id = 'pwa-modal';
  el.innerHTML = `
    <div class="pwa-modal-box">
      <div class="pwa-modal-icon">🔔</div>
      <div class="pwa-modal-title">ENABLE NOTIFICATIONS?</div>
      <div class="pwa-modal-body">Get notified about daily challenges and updates.</div>
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
  });
};

window._pwaNotifDeny = function() {
  _removeModal();
};
