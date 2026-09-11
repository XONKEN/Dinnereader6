const CACHE='dinner-reminder-static-v9';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png','./firebase-messaging-sw.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});
self.addEventListener('push', event => {
  if (!event.data) return;
  event.waitUntil((async () => {
    let p; try { p = event.data.json(); } catch { p = { data: { body: event.data.text() } }; }
    const d = p?.data || p || {};
    const title = d.title || '家庭通知';
    const body = d.body || '';
    const isFamily = !!d.notificationId || d.kind === 'family';
    await self.registration.showNotification(title, {
      body, icon:'./icon-192.png', badge:'./icon-192.png',
      tag: d.notificationId ? `family-${d.notificationId}` : (isFamily ? 'family-notification' : 'dinner-reminder'),
      renotify:true, requireInteraction:true,
      data:{time:d.time||'',notificationId:d.notificationId||'',kind:d.kind||'family'},
      actions:isFamily?[{action:'home',title:'是'},{action:'away',title:'否'}]:[{action:'home',title:'回家吃飯'},{action:'away',title:'今天不回家'}]
    });
  })());
});
self.addEventListener('notificationclick',e=>{const action=e.action;if(action!=='home'&&action!=='away'){e.notification.close();return;}e.notification.close();const time=e.notification.data?.time||'',notificationId=e.notification.data?.notificationId||'';e.waitUntil((async()=>{const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});const target=list.find(c=>c.url.startsWith(self.registration.scope));if(target){target.postMessage({type:'quick-reply',choice:action,time,notificationId});await target.focus();return;}const url=new URL('./index.html',self.registration.scope);url.searchParams.set('reply',action);if(time)url.searchParams.set('time',time);if(notificationId)url.searchParams.set('notificationId',notificationId);await self.clients.openWindow(url.toString());})());});
