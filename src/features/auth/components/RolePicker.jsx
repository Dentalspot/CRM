/**
 * @file src/features/auth/components/RolePicker.jsx
 *
 * Selector de rol previo al formulario de auth.
 * Muestra cards para que el usuario elija cómo ingresar/registrarse.
 *
 * NO afecta la seguridad del auth — Supabase sigue autenticando por
 * email+password. La selección solo aporta UX context + para registro
 * setea `profile.role`. En login, si el rol elegido no coincide con
 * el real del usuario en DB, el post-login routing usa el real.
 *
 * Diseño: fondo blanco con 4 blobs aurora teal/accent flotando suave
 * (animación CSS keyframes `float`, ya definida en tailwind.config).
 * Cards translucent con backdrop-blur encima → efecto "vidrio sobre aurora".
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getPublicRoles } from '@/constants/roles';

export default function RolePicker({ isLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roles = getPublicRoles(isLogin ? 'login' : 'register');

  const handlePick = (roleValue) => {
    // Preserva otros query params, agrega ?role=X
    const params = new URLSearchParams(searchParams);
    params.set('role', roleValue);
    const basePath = isLogin ? '/auth/login' : '/auth/register';
    navigate(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white p-4 overflow-hidden">
      {/* ── Aurora blobs — fondo decorativo animado ───────────────────── */}
      {/* 4 círculos borroseados que flotan con animación float (ver
          tailwind.config.js keyframes). Velocidad ~2x más rápida vs primer
          iteración para sensación de mayor dinamismo. Delays distintos
          mantienen organicidad (no se mueven en sync). */}
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

      {/* ── Logo arriba (fuera de la card) ─────────────────────────────── */}
      {/* Tamaño grande para que sea el elemento dominante del hero de auth.
          ~3x el tamaño original (h-16 sm:h-20 → h-48 sm:h-60). */}
      <a href="/" className="relative z-10 mb-8 inline-block hover:opacity-90 transition-opacity">
        <img
          src="/logo-dentalspot-full.png"
          alt="DentalSpot"
          className="h-48 sm:h-60 w-auto"
        />
      </a>

      {/* ── Container principal ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? '¿Cómo quieres ingresar?' : '¿Qué tipo de cuenta quieres crear?'}
          </h1>
          <p className="text-sm text-gray-600">
            Elige el tipo que mejor te describe
          </p>
        </div>

        {/* Grid de cards translucent con backdrop-blur — efecto vidrio sobre aurora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => handlePick(role.value)}
              className="group text-left bg-white/85 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-teal-100/60 hover:border-teal-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl flex-shrink-0" aria-hidden="true">
                  {role.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                      {role.label}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer link */}
        <div className="text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              ¿No tienes cuenta?{' '}
              <a href="/auth/register" className="font-semibold text-teal-600 hover:text-teal-700 underline">
                Regístrate gratis
              </a>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <a href="/auth/login" className="font-semibold text-teal-600 hover:text-teal-700 underline">
                Iniciar sesión
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
