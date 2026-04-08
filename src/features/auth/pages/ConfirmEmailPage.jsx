/**
 * @file ConfirmEmailPage.jsx
 * @description Pagina post-registro que guia al usuario a confirmar su email.
 * Incluye instrucciones para sacar de spam y agregar a contactos.
 */
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Mail, Inbox, AlertTriangle, CheckCircle2, RefreshCw,
  ArrowRight, Star, Shield, Loader2
} from 'lucide-react';

const BRAND = {
  primary: '#00BCB5',
  accent: '#ff74c3',
  softer: '#d2f2f0',
  bg: '#f6fbfb',
};

const EMAIL_PROVIDERS = [
  { name: 'Gmail', url: 'https://mail.google.com', icon: '📧', spamPath: 'Spam o Correo no deseado → Busca "DentalSpot" → Marcar como "No es spam"' },
  { name: 'Outlook', url: 'https://outlook.live.com', icon: '📬', spamPath: 'Correo no deseado → Busca "DentalSpot" → Click derecho → "No es correo no deseado"' },
  { name: 'Yahoo', url: 'https://mail.yahoo.com', icon: '📮', spamPath: 'Spam → Busca "DentalSpot" → "No es spam"' },
];

export default function ConfirmEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setResent(true);
      toast({ title: 'Email reenviado', description: `Revisa ${email}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setResending(false);
    }
  };

  // Detect email provider
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const detectedProvider = domain.includes('gmail') ? EMAIL_PROVIDERS[0]
    : domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live') ? EMAIL_PROVIDERS[1]
    : domain.includes('yahoo') ? EMAIL_PROVIDERS[2]
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.bg }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-extrabold" style={{ color: BRAND.primary }}>
            DentalSpot
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Top banner */}
          <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, #009E99)` }}>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Confirma tu correo</h1>
            <p className="text-white/80 mt-2 text-sm">
              Enviamos un email de confirmacion a
            </p>
            {email && (
              <p className="text-white font-semibold mt-1">{email}</p>
            )}
          </div>

          {/* Steps */}
          <div className="p-6 space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: BRAND.primary }}>
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Abre tu correo</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Busca un email de <strong className="text-gray-700">DentalSpot &lt;no-reply@dentalspot.cl&gt;</strong>
                </p>
                {detectedProvider && (
                  <a
                    href={detectedProvider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    {detectedProvider.icon} Abrir {detectedProvider.name} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Step 2 — CRITICAL: Anti-spam */}
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: BRAND.accent }}>
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Revisa tu carpeta de Spam
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Si no lo ves en la bandeja principal, <strong className="text-gray-700">es probable que este en Spam</strong>.
                </p>
                {detectedProvider && (
                  <div className="mt-2 p-3 rounded-lg text-xs text-gray-600" style={{ backgroundColor: BRAND.softer }}>
                    <strong>{detectedProvider.name}:</strong> {detectedProvider.spamPath}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: BRAND.primary }}>
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400" />
                  Agrega a contactos
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Para recibir nuestros emails siempre en la bandeja principal, agrega <strong className="text-gray-700">no-reply@dentalspot.cl</strong> a tus contactos.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: BRAND.primary }}>
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Haz click en el enlace de confirmacion
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Se abrira DentalSpot y tu cuenta quedara activa.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleResend}
                  disabled={resending || resent}
                  variant="outline"
                  className="flex-1"
                >
                  {resending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : resent ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {resent ? 'Email reenviado' : 'Reenviar email'}
                </Button>
                <Button
                  onClick={() => navigate('/auth/login')}
                  className="flex-1 text-white"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  Ya confirme, ir a login <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="h-3.5 w-3.5" />
          <span>Confirmamos tu email para proteger tu cuenta y asegurar la entrega de notificaciones.</span>
        </div>
      </div>
    </div>
  );
}
