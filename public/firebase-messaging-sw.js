
// Scripts for firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBs6ovkuJ0xtrkCaaBC4nTNkfsR68ttztA",
    authDomain: "giahanconverter-ggauth.firebaseapp.com",
    projectId: "giahanconverter-ggauth",
    storageBucket: "giahanconverter-ggauth.firebasestorage.app",
    messagingSenderId: "440586917766",
    appId: "1:440586917766:web:d96de99d7161e0141c7e07",
    measurementId: "G-48RTD3T2KH"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
