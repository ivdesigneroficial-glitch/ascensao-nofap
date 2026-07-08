/* ASCENSÃO — service worker (cache offline + notificações) */
const CACHE = 'ascensao-v7';
const CORE = [
  'index.html', 'style.css', 'app.js', 'niveis.js', 'manifest.json',
  'assets/icon-192.png', 'assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// network-first: sempre tenta a versao mais nova; cache so como reserva offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'reload' }).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

// dispara notificação vinda do app
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'notify') {
    self.registration.showNotification(d.title || 'ASCENSÃO', {
      body: d.body || '',
      icon: 'assets/icon-192.png',
      badge: 'assets/icon-192.png',
      tag: 'ascensao-diario',
      renotify: true
    });
  }
});

// notificacao automatica diaria em segundo plano (best-effort; Chrome/Android)
const FRASES_SW = [
  'Mais um dia de foco. Mantenha sua sequência viva! 🔥',
  'A urge dura minutos, o orgulho dura pra sempre. Segue firme!',
  'Disciplina hoje, orgulho amanhã. Bora pro próximo nível!',
  'Guerreiro não recua. Confirme mais um dia de vitória.',
  'Você contra você — e você está ganhando. Continue!'
];
self.addEventListener('periodicsync', e => {
  if (e.tag === 'lembrete-diario') {
    const body = FRASES_SW[Math.floor(Math.random() * FRASES_SW.length)];
    e.waitUntil(self.registration.showNotification('🔥 ASCENSÃO', {
      body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png',
      tag: 'ascensao-diario', renotify: true
    }));
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cl => {
    for (const c of cl) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('index.html');
  }));
});
