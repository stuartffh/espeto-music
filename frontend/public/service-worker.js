// Service Worker para PWA - Espeto Music
const CACHE_NAME = 'espeto-music-v1';
const OFFLINE_VERSION = 1;
const OFFLINE_URL = '/offline.html';

// Recursos essenciais para cache inicial
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Fazendo cache dos recursos essenciais');
      await cache.addAll(urlsToCache.filter(url => !url.includes('undefined')));

      // Criar página offline
      const offlineResponse = new Response(
        `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Espeto Music - Offline</title>
          <style>
            body {
              background: #1a1a1a;
              color: #fff;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            h1 {
              color: #ff6b6b;
              font-size: 2.5rem;
              margin-bottom: 1rem;
            }
            p {
              font-size: 1.2rem;
              color: #888;
              margin-bottom: 2rem;
            }
            .icon {
              width: 100px;
              height: 100px;
              margin-bottom: 2rem;
              opacity: 0.5;
            }
            button {
              background: #ff6b6b;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 1rem;
              border-radius: 8px;
              cursor: pointer;
              transition: background 0.3s;
            }
            button:hover {
              background: #ff5252;
            }
          </style>
        </head>
        <body>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
          </svg>
          <h1>Você está offline</h1>
          <p>Verifique sua conexão com a internet para continuar usando o Espeto Music</p>
          <button onclick="window.location.reload()">Tentar Novamente</button>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
      await cache.put(OFFLINE_URL, offlineResponse);
    })()
  );

  self.skipWaiting();
});

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');

  event.waitUntil(
    (async () => {
      // Limpar caches antigos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );

      // Permite que o SW controle a página imediatamente
      await self.clients.claim();
    })()
  );
});

// Estratégia de cache: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Parse da URL
  const url = new URL(event.request.url);

  // IMPORTANTE: Excluir rota /tv completamente do service worker
  // A TV precisa sempre estar online para funcionar corretamente
  if (url.pathname.startsWith('/tv') || url.pathname === '/tv') {
    // Deixar a requisição passar normalmente sem cache
    return;
  }

  // Também excluir Socket.IO do cache
  if (url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Para API requests, sempre tentar network primeiro
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone a resposta antes de armazená-la no cache
          const responseToCache = response.clone();

          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Se falhar, tentar o cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para recursos estáticos, usar cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }

          return fetch(event.request).then(response => {
            // Não cachear respostas não-200
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return response;
          });
        })
    );
    return;
  }

  // Para navegação (páginas HTML), network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              // Se não houver cache e estivermos offline, mostrar página offline
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }

  // Default: Network first com cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone a resposta
        const responseToCache = response.clone();

        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-songs') {
    console.log('[Service Worker] Sincronizando músicas...');
    event.waitUntil(syncSongs());
  }
});

async function syncSongs() {
  try {
    // Aqui você pode adicionar lógica para sincronizar dados quando voltar online
    const response = await fetch('/api/sync');
    if (response.ok) {
      console.log('[Service Worker] Sincronização concluída');
    }
  } catch (error) {
    console.error('[Service Worker] Erro na sincronização:', error);
  }
}

// Notificações Push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Espeto Music',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Espeto Music', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});