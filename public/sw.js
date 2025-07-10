// public/sw.js

self.addEventListener('push', event => {
  let data = { title: 'Notificación', body: 'Mensaje', url: '/' };
  console.log("cabezon")
  if (event.data) {
    data = event.data.json();
  }

  console.log('[SW] Notificación recibida:', data);

  const options = {
    body: data.body,
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    icon: '/icon.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notificación clickeada:', event.notification.data);
  event.notification.close();
  const notificationUrl = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === notificationUrl && 'focus' in client) {
          console.log('[SW] Foco en pestaña existente:', client.url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        console.log('[SW] Abriendo nueva ventana:', notificationUrl);
        return clients.openWindow(notificationUrl);
      }
    })
  );
});
