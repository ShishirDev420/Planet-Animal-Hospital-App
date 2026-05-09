import React from 'react';
import planetLogo from '../assets/planet-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-16 sm:w-20',
    md: 'w-24 sm:w-32',
    lg: 'w-32 sm:w-40',
  };

  return (
    <img
      src={planetLogo}
      alt="Planet Animal Hospital Logo"
      className={`${sizeClasses[size]} h-auto object-contain drop-shadow-[0_0_20px_rgba(254,199,8,0.8)] ${className}`}
    />
  );
}
