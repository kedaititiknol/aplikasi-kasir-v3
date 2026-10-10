// src/main.jsx atau src/index.js

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// --- PERBAIKAN DI src/main.jsx ---
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      // Sesuaikan path dengan base path GitHub Pages
      navigator.serviceWorker.register('/aplikasi-kasir-v3/sw.js')
        .then((reg) => console.log('PWA Service Worker Terdaftar:', reg.scope))
        .catch((err) => console.error('PWA Service Worker Gagal:', err));
    });
  } else {
    // Jika dalam mode DEVELOPMENT (localhost), hapus Service Worker agar tidak memblokir Vite HMR
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Development mode: Service Worker di-unregister');
      }
    });
  }
}