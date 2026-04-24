import React from 'react';

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
        <div className="w-[60%] h-[60%] absolute top-0 left-0 rounded-full border-2 border-white bg-slate-200 shadow-md z-10 flex items-center justify-center">
          <span className="text-xs text-slate-500">M</span>
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
        <div className="w-[70%] h-[70%] absolute bottom-0 right-0 rounded-full border-2 border-white bg-slate-200 shadow-md z-20 flex items-center justify-center">
          <span className="text-xs text-slate-500">P</span>
        </div>
      )}
    </div>
  );
}
