// src/components/shared/Logo.jsx
import React from 'react';

const Logo = ({ variant = 'default', className }) => {
  const textClass = variant === 'light'
    ? 'text-white'
    : 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent';

  return (
    <div className={`flex items-center space-x-2 group ${className || ''}`}>
      <img
        src="/logo-dentalspot.png"
        alt="DentalSpot"
        className="h-10 w-10 group-hover:scale-110 transition-transform"
      />
      <span className={`text-2xl font-bold ${textClass} group-hover:opacity-80 transition-opacity`}>
        Dental<span className="font-light">Spot</span>
      </span>
    </div>
  );
};

export default Logo;
