import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const CONSENT_KEY = 'dentalspot_cookie_consent';
const CONSENT_VERSION = '1.0';

const DEFAULT_CONSENT = {
  essential: true,    // Always true, can't be disabled
  analytics: false,
  marketing: false,
};

/**
 * Apply consent: enable/disable tracking based on user choices.
 * NOTE: Meta Pixel base tracking (PageView) now loads unconditionally via MetaPixelProvider.
 * Marketing consent controls personalized/custom event tracking with PII data.
 */
function applyConsent(consent) {
  // Store marketing consent flag for useMetaTracking hook to check
  if (typeof window !== 'undefined') {
    window.__dentalspot_marketing_consent = consent.marketing;
  }
  // Future: analytics (Google Analytics, etc.)
}

/**
 * Get real IP address
 */
async function getClientIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

/**
 * Save consent to Supabase for traceability (works for anonymous + logged in users)
 */
async function saveConsentToDb(consent) {
  try {
    const ip = await getClientIP();
    let userId = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch {}

    const record = {
      user_id: userId,
      consent_version: CONSENT_VERSION,
      essential: consent.essential,
      analytics: consent.analytics,
      marketing: consent.marketing,
      user_agent: navigator.userAgent,
      ip_address: ip,
      page_url: window.location.href,
    };

    await supabase.from('cookie_consents').insert(record).catch(() => {});
  } catch {
    // Silent fail
  }
}

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Esenciales',
    icon: Shield,
    description: 'Necesarias para el funcionamiento del sitio. Autenticación, seguridad y preferencias básicas.',
    required: true,
  },
  {
    id: 'analytics',
    label: 'Analíticas',
    icon: BarChart3,
    description: 'Nos ayudan a entender cómo usas la plataforma para mejorar la experiencia.',
    required: false,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    description: 'Permiten mostrar contenido relevante en redes sociales (Meta Pixel).',
    required: false,
  },
];

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          applyConsent(parsed.consent);
          return; // Already consented, don't show banner
        }
      } catch {}
    }
    // Show banner after a short delay
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const saveConsent = (selectedConsent) => {
    const record = {
      version: CONSENT_VERSION,
      consent: selectedConsent,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    applyConsent(selectedConsent);
    saveConsentToDb(selectedConsent);
    setVisible(false);
  };

  const acceptAll = () => {
    const all = { essential: true, analytics: true, marketing: true };
    setConsent(all);
    saveConsent(all);
  };

  const acceptSelected = () => {
    saveConsent(consent);
  };

  const rejectOptional = () => {
    const minimal = { essential: true, analytics: false, marketing: false };
    setConsent(minimal);
    saveConsent(minimal);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 flex-shrink-0">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Configuración de Cookies</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Usamos cookies para mejorar tu experiencia. Puedes elegir qué categorías aceptar.
                Consulta nuestra{' '}
                <a href="/legal/politica-cookies" className="text-teal-600 underline hover:text-teal-700">
                  política de cookies
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Expandable categories */}
        {expanded && (
          <div className="px-5 pb-2 space-y-2 border-t border-gray-100 pt-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={consent[cat.id]}
                  disabled={cat.required}
                  onChange={(e) => setConsent(prev => ({ ...prev, [cat.id]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <cat.icon className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                    {cat.required && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Requerida</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 pt-2 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mr-auto"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            {expanded ? 'Menos opciones' : 'Personalizar'}
          </button>
          <Button variant="ghost" size="sm" onClick={rejectOptional} className="text-xs h-8">
            Solo esenciales
          </Button>
          {expanded && (
            <Button variant="outline" size="sm" onClick={acceptSelected} className="text-xs h-8">
              Guardar selección
            </Button>
          )}
          <Button size="sm" onClick={acceptAll} className="text-xs h-8 bg-teal-600 hover:bg-teal-700">
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
