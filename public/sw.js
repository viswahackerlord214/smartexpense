// Service Worker for Push Notifications and PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'SpendWise Transaction',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'SpendWise: New Transaction';
  const options = {
    body: data.body || 'A new transaction was detected. Tap to categorize.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      transactionId: data.transactionId,
      amount: data.amount,
      merchant: data.merchant,
    },
    actions: [
      { action: 'categorize', title: 'Categorize Now' },
      { action: 'dismiss', title: 'Later' }
    ],
    tag: data.transactionId ? `txn-${data.transactionId}` : 'spendwise-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  let targetUrl = clickData.url || '/';

  if (clickData.transactionId) {
    targetUrl = `/?categorize=${clickData.transactionId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

