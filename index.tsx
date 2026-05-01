
/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to update
    if (confirm('Ứng dụng có phiên bản mới. Làm mới ngay?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Ứng dụng đã sẵn sàng hoạt động ngoại tuyến');
  },
})

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
