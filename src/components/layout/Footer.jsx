
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/shared/Logo';
import { Mail, Phone, MapPin, Heart, Facebook, Instagram, Linkedin, Twitter, Cookie } from 'lucide-react';
import { openCookieBanner } from '@/components/shared/CookieBanner';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    plataforma: [
      { label: 'Planes y Precios', href: '/planes', scrollTop: true },
      { label: 'Buscar Dentistas', href: '/dentistas' },
      { label: 'Blog para Familias', href: '/blog' },
      { label: 'Preguntas Frecuentes', href: '/#faq' },
      { label: 'Soy Profesional', href: '/auth/register' },
    ],
    recursos: [
      { label: 'Centro de Ayuda', href: '/contacto' },
      { label: 'Términos y Condiciones', href: '/legal/terminos-condiciones' },
      { label: 'Política de Privacidad', href: '/legal/politica-privacidad' },
      { label: 'Política de Cookies', href: '/legal/politica-cookies' },
      { label: 'Ejercer derechos ARCO', href: '/legal/procedimiento-arco' },
      { label: 'Disclaimer Clínico', href: '/legal/disclaimer-clinico' },
    ]
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Logo variant="light" className="mb-6" />
            <p className="max-w-sm text-slate-400 mb-6 leading-relaxed">
              DentalSpot es la red de odontología más confiable de Chile.
              Ayudamos a familias a encontrar el especialista ideal mediante
              un sistema de reputación clínica transparente.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>contacto@dentalspot.cl</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Santiago, Chile</span>
              </div>
            </div>
          </div>

          <div>
            <span className="block font-bold text-white mb-4 uppercase tracking-wider text-sm">Plataforma</span>
            <ul className="space-y-2">
              {footerLinks.plataforma.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => { if (link.scrollTop) window.scrollTo(0, 0); }}
                    className="text-slate-400 hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="block font-bold text-white mb-4 uppercase tracking-wider text-sm">Legal</span>
            <ul className="space-y-2">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-slate-400 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* Botón de revocación de consent (Ley 21.719: derecho a revocar
                  el consentimiento debe ser tan accesible como otorgarlo). */}
              <li>
                <button
                  type="button"
                  onClick={openCookieBanner}
                  className="text-slate-400 hover:text-primary transition-colors text-sm flex items-center gap-1.5"
                >
                  <Cookie className="w-3.5 h-3.5" />
                  Gestionar cookies
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} DentalSpot. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            Hecho con <Heart className="w-3 h-3 text-red-500 fill-current" /> para la comunidad odontológica.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
