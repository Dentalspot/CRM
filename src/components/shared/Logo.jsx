// src/components/shared/Logo.jsx
import React from 'react';

const ToothLogo = ({ className }) => (
  <svg
    viewBox="0 0 200 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Diente con corazon/lazo - colores de marca DentalSpot */}
    <path
      d="M100 200C85 175 60 155 50 130C38 100 42 70 60 50C75 33 95 28 100 55C105 28 125 33 140 50C158 70 162 100 150 130C140 155 115 175 100 200Z"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M100 120C90 100 70 90 60 70C55 58 60 45 72 38"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M100 120C110 100 130 90 140 70C145 58 140 45 128 38"
      stroke="currentColor"
      strokeWidth="16"
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
      <ToothLogo className={`${iconClass} group-hover:scale-110 transition-transform`} />
      <span className={`text-2xl font-bold ${textClass} group-hover:opacity-80 transition-opacity`}>
        Dental<span className="font-light">Spot</span>
      </span>
    </div>
  );
};

export default Logo;
