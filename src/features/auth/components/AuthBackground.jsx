/**
 * @file src/features/auth/components/AuthBackground.jsx
 *
 * Wrapper reusable que renderiza el fondo Aurora (4 blobs teal flotando)
 * + logo horizontal DentalSpot arriba, usado en TODAS las páginas del flujo
 * de auth (RolePicker, AuthForm, ResetPassword, ConfirmEmail, PendingApproval).
 *
 * Diseño: fondo blanco con blobs translucent que flotan con animación `float`
 * (definida en tailwind.config.js). Logo h-48 sm:h-60.
 *
 * Props:
 * - children — contenido del centro de la página (form, cards, etc.)
 * - logoSize — opcional, default 'large' (h-48 sm:h-60). 'medium' = h-32 sm:h-40
 *   para casos donde el form es muy alto y necesita más espacio.
 * - showLogo — opcional, default true. False si la página no necesita logo
 *   (raro, pero para mantener flexibilidad).
 */
import React from 'react';

// Logo sizes — usan max-w + max-h + h-auto + w-full + object-contain.
// La imagen se contiene preservando aspect ratio SIN desbordar el container.
// 'large' es ligeramente más chico que la Opción A del comparison
// (A era h-20 sm:h-28 = 80-112px). Acá h-16 sm:h-24 = 64-96px.
const LOGO_SIZES = {
  large: 'max-w-md max-h-16 sm:max-h-24 h-auto w-full',
  medium: 'max-w-sm max-h-14 sm:max-h-20 h-auto w-full',
  small: 'max-w-xs max-h-12 sm:max-h-16 h-auto w-full',
};

const AuthBackground = ({ children, logoSize = 'large', showLogo = true }) => {
  return (
    // justify-start + pt-{N} → logo queda levemente más abajo del top
    // (no centrado verticalmente). Más natural para landing-style auth.
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-20 sm:pt-28 pb-12 bg-white p-4 overflow-hidden">
      {/* ── Aurora blobs ─────────────────────────────────────────────── */}
      <div
        className="absolute top-[-150px] left-[-100px] w-[500px] h-[500px] rounded-full bg-primary/40 blur-[100px] pointer-events-none"
        style={{ animation: 'float 9s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full bg-accent/35 blur-[110px] pointer-events-none"
        style={{ animation: 'float 11s ease-in-out infinite reverse', animationDelay: '1s' }}
      />
      <div
        className="absolute top-[25%] right-[15%] w-[400px] h-[400px] rounded-full bg-teal-500/25 blur-[90px] pointer-events-none hidden md:block"
        style={{ animation: 'float-slow 13s ease-in-out infinite', animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-[15%] left-[20%] w-[350px] h-[350px] rounded-full bg-teal-200/40 blur-[90px] pointer-events-none hidden md:block"
        style={{ animation: 'float 10s ease-in-out infinite reverse', animationDelay: '0.5s' }}
      />

      {/* ── Logo arriba ──────────────────────────────────────────────── */}
      {showLogo && (
        <a href="/" className="relative z-10 mb-8 inline-flex justify-center hover:opacity-90 transition-opacity px-4">
          <img
            src="/logo-dentalspot-full.png"
            alt="DentalSpot"
            className={`${LOGO_SIZES[logoSize] || LOGO_SIZES.large} object-contain`}
          />
        </a>
      )}

      {/* ── Contenido principal ─────────────────────────────────────── */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  );
};

export default AuthBackground;
