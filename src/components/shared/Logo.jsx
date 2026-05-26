// src/components/shared/Logo.jsx
import React from 'react';

/**
 * Logo de DentalSpot — imagen única horizontal (icono + texto "DentalSpot").
 *
 * El archivo `/logo-dentalspot-full.png` contiene ambos elementos juntos como
 * imagen única, así que no renderizamos texto al lado por separado.
 *
 * El componente NO incluye un anchor — los call sites (Header, Footer, etc.)
 * envuelven en <Link to="/"> según su propia lógica de routing.
 *
 * Props:
 * - variant: 'default' | 'light' — actualmente la misma imagen sirve para
 *   ambos fondos (color teal con buen contraste). Si en el futuro hace falta
 *   versión blanca para fondos oscuros, agregar `logo-dentalspot-full-light.png`.
 * - className: clases adicionales para el wrapper.
 */
const Logo = ({ variant = 'default', className }) => {
  return (
    <div className={`inline-flex items-center group ${className || ''}`}>
      <img
        src="/logo-dentalspot-full.png"
        alt="DentalSpot"
        className="h-10 w-auto group-hover:scale-105 transition-transform"
      />
    </div>
  );
};

export default Logo;
