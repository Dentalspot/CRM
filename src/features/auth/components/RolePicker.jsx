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
 * Fondo Aurora + logo grande encapsulados en <AuthBackground>.
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getPublicRoles } from '@/constants/roles';
import AuthBackground from './AuthBackground';

export default function RolePicker({ isLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roles = getPublicRoles(isLogin ? 'login' : 'register');

  const handlePick = (roleValue) => {
    const params = new URLSearchParams(searchParams);
    params.set('role', roleValue);
    const basePath = isLogin ? '/auth/login' : '/auth/register';
    navigate(`${basePath}?${params.toString()}`);
  };

  return (
    <AuthBackground>
      <div className="w-full max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? '¿Cómo quieres ingresar?' : '¿Qué tipo de cuenta quieres crear?'}
          </h1>
          <p className="text-sm text-gray-600">
            Elige el tipo que mejor te describe
          </p>
        </div>

        {/* Grid de cards translucent */}
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
    </AuthBackground>
  );
}
