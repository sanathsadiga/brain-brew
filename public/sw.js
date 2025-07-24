const CACHE_NAME = 'devnotes-v1';
const API_CACHE = 'devnotes-api-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Supabase API requests
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
      .catch(() => {
        // If offline and no cache, return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Handle API requests with cache-first strategy for GET, network-only for others
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // For GET requests, try cache first
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (error) {
        // Network failed, return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        // If no cache, return a proper error response
        return new Response(JSON.stringify({ error: 'Network unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // For non-GET requests, try network
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Store failed requests for later sync
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      storeFailedRequest(request);
    }
    
    // Return a proper error response instead of throwing
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Store failed requests for background sync
function storeFailedRequest(request) {
  // This would typically use IndexedDB, but for simplicity using postMessage
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FAILED_REQUEST',
        request: {
          url: request.url,
          method: request.method,
          headers: [...request.headers.entries()],
        }
      });
    });
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests() {
  // This would retry failed requests stored in IndexedDB
  console.log('Syncing failed requests...');
}