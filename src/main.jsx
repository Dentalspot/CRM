
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import 'leaflet/dist/leaflet.css';

// Detect auth tokens in URL before React mounts
// With PKCE flow, Supabase uses ?code= in query params (not hash)
// Also handle legacy hash-based tokens
const params = new URLSearchParams(window.location.search);
const hash = window.location.hash;

if (window.location.pathname === '/') {
  // PKCE flow: Supabase redirects with ?code= after processing the email link
  // We need to let Supabase client exchange the code, then check the event
  if (params.get('code')) {
    // Don't redirect — let AuthContext handle the PASSWORD_RECOVERY event
    // But store a flag so we know to redirect after auth resolves
    sessionStorage.setItem('dentalspot_pending_recovery', 'true');
  }
  // Legacy hash-based flow
  if (hash && hash.includes('type=recovery')) {
    window.location.replace('/auth/reset-password' + hash);
  }
  if (hash && hash.includes('type=signup')) {
    window.location.replace('/auth/confirm-email' + hash);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <App />
  </BrowserRouter>
);
