import React from 'react';
import { cn } from '../lib/utils';

interface DualAvatarProps {
  leftImage: string;
  rightImage: string;
  className?: string;
}

export default function DualAvatar({ leftImage, rightImage, className }: DualAvatarProps) {
  return (
    <div className={cn("relative drop-shadow-xl", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <path id="heart-path" d="M50,90 C50,90 5,60 5,30 C5,10 30,0 50,20 C70,0 95,10 95,30 C95,60 50,90 50,90 Z" />
          <clipPath id="heart-clip">
            <use href="#heart-path" />
          </clipPath>
        </defs>
        <g clipPath="url(#heart-clip)">
          <image href={leftImage} x="0" y="0" width="50" height="100" preserveAspectRatio="xMidYMid slice" />
          <image href={rightImage} x="50" y="0" width="50" height="100" preserveAspectRatio="xMidYMid slice" />
          {/* Center divider line */}
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        </g>
        {/* Glassmorphic border effect */}
        <use href="#heart-path" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="4" className="drop-shadow-md" />
        <use href="#heart-path" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
}
