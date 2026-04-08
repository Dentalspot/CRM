/**
 * @file MetaPixelProvider.jsx
 * @description Initializes Meta Pixels based on user role and tracks PageView on route changes.
 *
 * Two pixels:
 *  - PATIENTS pixel: tracks patient-facing pages and anonymous visitors
 *  - PROFESSIONALS pixel: tracks dentist, clinic, and lab dashboard activity
 *
 * Both pixels are initialized for anonymous visitors (landing, auth pages).
 * Once logged in, only the relevant pixel fires events.
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';

// Pixel IDs by audience
export const PIXEL_PATIENTS = import.meta.env.VITE_META_PIXEL_PATIENTS || '1437133438008806';
export const PIXEL_PROFESSIONALS = import.meta.env.VITE_META_PIXEL_PROFESSIONALS || '800230703093106';

// Dataset IDs (same as pixel IDs for Conversions API)
export const DATASET_PATIENTS = PIXEL_PATIENTS;
export const DATASET_PROFESSIONALS = PIXEL_PROFESSIONALS;

/**
 * Returns the appropriate pixel ID based on user role.
 * Returns null for anonymous (both pixels fire).
 */
export function getPixelForRole(role) {
  if (!role) return null; // anonymous — both pixels
  switch (role) {
    case USER_ROLES.PATIENT:
      return PIXEL_PATIENTS;
    case USER_ROLES.THERAPIST: // dentist
    case USER_ROLES.CLINIC:
    case USER_ROLES.LAB:
    case USER_ROLES.ADMIN:
      return PIXEL_PROFESSIONALS;
    default:
      return PIXEL_PATIENTS;
  }
}

/**
 * Returns the dataset ID for CAPI based on user role.
 */
export function getDatasetForRole(role) {
  const pixelId = getPixelForRole(role);
  if (!pixelId) return DATASET_PATIENTS; // default for anonymous
  return pixelId === PIXEL_PATIENTS ? DATASET_PATIENTS : DATASET_PROFESSIONALS;
}

let pixelLoaded = false;

/**
 * Load Meta Pixel script and initialize both pixels.
 */
function loadPixelScript() {
  if (pixelLoaded || window.fbq) return;

  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  // Initialize both pixels — events are routed via trackSingle
  window.fbq('init', PIXEL_PATIENTS);
  window.fbq('init', PIXEL_PROFESSIONALS);
  window.fbq('track', 'PageView'); // fires to both on first load

  pixelLoaded = true;
}

/**
 * Provider component — mount once in App.jsx.
 * Tracks PageView on every client-side route change,
 * routing to the correct pixel based on user role.
 */
export default function MetaPixelProvider({ children }) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const isFirstRender = useRef(true);

  // Load pixel on mount
  useEffect(() => {
    loadPixelScript();
  }, []);

  // Track PageView on route changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!window.fbq) return;

    const role = profile?.role;
    const pixelId = getPixelForRole(role);

    if (pixelId) {
      // Logged in: fire to specific pixel only
      window.fbq('trackSingle', pixelId, 'PageView');
    } else {
      // Anonymous: fire to both
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, profile?.role]);

  return children || null;
}
