/**
 * @file MetaPixelProvider.jsx
 * @description Initializes Meta Pixel on app load and tracks PageView on every route change.
 * Loads unconditionally (anonymous aggregated data — compliant with Chilean law 19.628).
 * Cookie consent still controls personalized tracking (custom events with PII).
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '1464610018368997';

/**
 * Load Meta Pixel script once
 */
function loadPixelScript() {
  if (window.fbq) return; // Already loaded

  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

/**
 * Provider component — mount once in App.jsx.
 * Tracks PageView on every client-side route change.
 */
export default function MetaPixelProvider({ children }) {
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Load pixel on mount
  useEffect(() => {
    loadPixelScript();
  }, []);

  // Track PageView on route changes (skip the first one — already tracked on init)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname]);

  return children || null;
}
