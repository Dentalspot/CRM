
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import 'leaflet/dist/leaflet.css';

// Detect recovery/confirmation tokens in URL hash before React mounts
// Supabase redirects to Site URL with hash params — route to correct page
const hash = window.location.hash;
if (hash && hash.includes('type=recovery') && window.location.pathname === '/') {
  window.location.replace('/auth/reset-password' + hash);
}
if (hash && hash.includes('type=signup') && window.location.pathname === '/') {
  window.location.replace('/auth/confirm-email' + hash);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
);
