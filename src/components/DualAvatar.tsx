import React from 'react';
import { PawPrint, UserRound } from 'lucide-react';

interface DualAvatarProps {
  leftImage?: string;
  rightImage?: string;
  className?: string;
}

export default function DualAvatar({ leftImage, rightImage, className = '' }: DualAvatarProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {leftImage ? (
        <img 
          src={leftImage} 
          alt="Parent" 
          className="w-[60%] h-[60%] absolute top-0 left-0 rounded-full border-2 border-white object-cover shadow-md z-10"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-[60%] h-[60%] absolute top-0 left-0 rounded-full border border-white/20 bg-[#244734] text-white/75 shadow-md z-10 flex items-center justify-center" aria-hidden="true">
          <UserRound size={18} />
        </div>
      )}
      
      {rightImage ? (
        <img 
          src={rightImage} 
          alt="Pet" 
          className="w-[70%] h-[70%] absolute bottom-0 right-0 rounded-full border-2 border-white object-cover shadow-md z-20"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-[70%] h-[70%] absolute bottom-0 right-0 rounded-full border border-[#fec708]/30 bg-[#183626] text-[#fec708] shadow-md z-20 flex items-center justify-center" aria-hidden="true">
          <PawPrint size={21} />
        </div>
      )}
    </div>
  );
}
