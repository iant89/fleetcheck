const CACHE='fleetcheck-shell-v2';
const BASE=new URL('./',self.registration.scope).pathname;
const APP_SHELL=[BASE,`${BASE}manifest.webmanifest`,`${BASE}fleetcheck.svg`];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(APP_SHELL);
  const response=await fetch(BASE);
  const html=await response.text();
  const assets=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match=>match[1]);
  await Promise.all(assets.map(async asset=>{try{await cache.add(asset)}catch{}}));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
 self.clients.claim();
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
  return response;
 }).catch(async()=>{
  const cached=await caches.match(event.request);
  if(cached)return cached;
  if(event.request.mode==='navigate')return caches.match(BASE);
  return Response.error();
 }));
});
