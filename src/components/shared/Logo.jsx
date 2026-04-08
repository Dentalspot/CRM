// src/components/shared/Logo.jsx
import React from 'react';

const ToothIcon = ({ className }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M32 4C24 4 18 8 16 14C14 20 12 28 14 36C16 44 18 52 22 58C24 60 26 60 28 56C30 52 30 46 32 46C34 46 34 52 36 56C38 60 40 60 42 58C46 52 48 44 50 36C52 28 50 20 48 14C46 8 40 4 32 4Z"
      fill="currentColor"
      opacity="0.15"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M24 20C26 18 30 17 32 17C34 17 38 18 40 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.5"
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
      <ToothIcon className={`${iconClass} group-hover:scale-110 transition-transform`} />
      <span className={`text-2xl font-bold ${textClass} group-hover:opacity-80 transition-opacity`}>
        Dental<span className="font-light">Spot</span>
      </span>
    </div>
  );
};

export default Logo;
