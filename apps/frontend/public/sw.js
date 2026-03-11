// public/sw.js — Service Worker for Push Notifications
// Place this file in: frontend/public/sw.js

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        data = { title: '🧠 Mental Health Reminder', body: event.data.text() };
    }

    const options = {
        body:    data.body    || 'Time to check in with yourself.',
        icon:    data.icon    || '/icon-192.png',
        badge:   data.badge   || '/badge.png',
        tag:     data.tag     || 'mental-health-reminder',
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        actions: [
            { action: 'open',    title: '📝 Log Mood' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🧠 Check In', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));