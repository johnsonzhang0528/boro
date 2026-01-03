// Enhanced Service Worker for BoroJeet Blog with optimized caching
const CACHE_NAME = 'borojeet-blog-v8';
const STATIC_ASSETS = [
  '/assets/style.css',
  '/assets/universal-performance.js',
  '/assets/borojeet-affiliate-logo-bd.webp',
  '/blog/',
  '/' // Cache homepage
];

// Critical images to cache immediately
const CRITICAL_IMAGES = [
  '/assets/borojeet-affiliate-logo-bd.webp',
];

// Cache names
const IMAGE_CACHE = 'images-v2';
const DYNAMIC_CACHE = 'dynamic-v1';

// Install event - cache static assets with better error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('Some static assets failed to cache:', err);
          return Promise.allSettled(
            STATIC_ASSETS.map(asset => cache.add(asset))
          );
        });
      }),
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.addAll(CRITICAL_IMAGES).catch(err => {
          console.warn('Some images failed to cache:', err);
          return Promise.allSettled(
            CRITICAL_IMAGES.map(img => cache.add(img))
          );
        });
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== IMAGE_CACHE &&
              cacheName !== DYNAMIC_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Enhanced fetch event with improved caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // Do not handle the redirect URL
  if (url.pathname === '/go/borojeet') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different types of requests with optimized strategies
  if (url.pathname.endsWith('.avif') ||
      url.pathname.endsWith('.webp') || 
      url.pathname.endsWith('.jpg') || 
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg')) {
    // Cache-first strategy for images
    event.respondWith(handleImageRequest(event.request));
  } else if (url.pathname.endsWith('.css') || 
             url.pathname.endsWith('.js')) {
    // Stale-while-revalidate for assets
    event.respondWith(handleAssetRequest(event.request));
  } else if (url.pathname.startsWith('/blog/') || url.pathname.startsWith('/promotions/') || url.pathname === '/') {
    // Network-first for content pages
    event.respondWith(handleContentRequest(event.request));
  } else {
    // Default cache-first for other resources
    event.respondWith(handleDefaultRequest(event.request));
  }
});

// Image caching strategy - Stale-while-revalidate
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(async () => {
    // If fetch fails, return cached response or a fallback
    const fallback = await cache.match('/assets/borojeet-affiliate-logo-bd.webp');
    return cached || fallback || new Response('Image not available', { status: 404 });
  });

  // Return cached version immediately if available
  return cached || fetchPromise;
}

// Asset caching strategy - Stale while revalidate
async function handleAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  // Return cached version immediately if available
  return cached || fetchPromise;
}

// Content caching strategy - Network first with fallback
async function handleContentRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback for navigation requests
    if (request.mode === 'navigate') {
      return new Response(`
        <!DOCTYPE html>
        <html lang="bn-BD">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Offline - BoroJeet (বড় জিত)</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 2rem;
              background: #0b0f14;
              color: #e9f2ff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { color: #9db1c9; margin-bottom: 2rem; }
            .btn {
              background: #10b981;
              color: #041b11;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>You're Offline / সংযোগ নেই</h1>
          <p>Please check your internet connection to access BoroJeet (বড় জিত).</p>
          <a href="/" class="btn" onclick="window.location.reload(); return false;">Try Again / আবার চেষ্টা করুন</a>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Default caching strategy
async function handleDefaultRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}