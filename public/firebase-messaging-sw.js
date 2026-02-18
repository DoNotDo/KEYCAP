/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAf-nRUR_RLfhAJgPXud7H-vHu4HHAGNcw',
  authDomain: 'management-9f7d8.firebaseapp.com',
  projectId: 'management-9f7d8',
  storageBucket: 'management-9f7d8.firebasestorage.app',
  messagingSenderId: '981753652672',
  appId: '1:981753652672:web:9038dadd699022179cd425',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '새 알림';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
  });
});
