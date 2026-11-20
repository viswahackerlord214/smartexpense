// SpendWise Service Worker for Push Notifications and PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. PUSH EVENT: Receive incoming push from SpendWise backend
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

  const title = data.title || 'SpendWise • New Expense Detected';
  const options = {
    body: data.body || 'A new bank transaction was detected. Tap to categorize.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    data: {
      url: data.url || '/',
      transactionId: data.transactionId,
      amount: data.amount,
      merchant: data.merchant,
    },
    tag: data.transactionId ? `txn-${data.transactionId}` : 'spendwise-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. NOTIFICATION CLICK: Open PWA and deep link to categorization modal
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};
  let targetPath = clickData.url || '/';

  if (clickData.transactionId) {
    targetPath = `/?categorize=${clickData.transactionId}`;
  }

  // Generate absolute URL for iOS WebKit clients.openWindow compatibility
  const fullUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If PWA window is already open, focus it and navigate to deep-link
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(fullUrl);
          }
          return client.focus();
        }
      }
      // If PWA is closed, launch and open directly to the categorization screen
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
