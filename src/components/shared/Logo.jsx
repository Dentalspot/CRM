// src/components/shared/Logo.jsx
import React from 'react';

/**
 * Logo DentalSpot — Dos corazones entrelazados formando un diente
 * Replica del logo oficial dentalspot.png
 */
const ToothHeartIcon = ({ className }) => (
  <svg
    viewBox="0 0 100 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Corazon izquierdo */}
    <path
      d="M50 95C42 82 28 72 22 58C16 44 18 30 28 22C38 14 48 16 50 28"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Corazon derecho */}
    <path
      d="M50 95C58 82 72 72 78 58C84 44 82 30 72 22C62 14 52 16 50 28"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Lazo central (interseccion) */}
    <path
      d="M50 65C44 52 36 44 32 36"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M50 65C56 52 64 44 68 36"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Logo = ({ variant = 'default', className }) => {
  const textClass = variant === 'light'
    ? 'text-white'
    : 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent';

  const iconClass = variant === 'light'
    ? 'h-8 w-8 text-white'
    : 'h-8 w-8 text-primary';

  return (
    <div className={`flex items-center space-x-2 group ${className || ''}`}>
      <ToothHeartIcon className={`${iconClass} group-hover:scale-110 transition-transform`} />
      <span className={`text-2xl font-bold ${textClass} group-hover:opacity-80 transition-opacity`}>
        Dental<span className="font-light">Spot</span>
      </span>
    </div>
  );
};

export default Logo;
