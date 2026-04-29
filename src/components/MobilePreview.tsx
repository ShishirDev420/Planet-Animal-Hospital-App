import React from 'react';

export default function MobilePreview() {
  // Use the origin to point to the root of the app
  const url = window.location.origin + '/?preview_frame=true';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
      <div className="relative scale-90 sm:scale-100">
        {/* Phone Frame SVG/Div */}
        <div className="relative mx-auto border-[#1a1a1a] bg-[#1a1a1a] border-[12px] rounded-[3rem] h-[720px] w-[360px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-t-[14px] border-b-[14px]">
          {/* Speaker/Camera Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
          
          {/* Side Buttons */}
          <div className="h-[40px] w-[3px] bg-[#1a1a1a] absolute -left-[15px] top-[100px] rounded-l-lg"></div>
          <div className="h-[60px] w-[3px] bg-[#1a1a1a] absolute -left-[15px] top-[160px] rounded-l-lg"></div>
          <div className="h-[60px] w-[3px] bg-[#1a1a1a] absolute -left-[15px] top-[230px] rounded-l-lg"></div>
          <div className="h-[80px] w-[3px] bg-[#1a1a1a] absolute -right-[15px] top-[180px] rounded-r-lg"></div>

          {/* Screen Content */}
          <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-slate-950 border-[2px] border-white/5">
            <iframe 
              src={url} 
              className="w-full h-full border-none select-none"
              title="Planet Animal App Preview"
              id="preview-iframe"
            />
          </div>
        </div>
        
        {/* Reflection/Glow Effect */}
        <div className="absolute -inset-10 bg-planet-yellow/5 blur-[100px] rounded-full -z-10 animate-pulse"></div>
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="px-6 py-3 glass rounded-full flex items-center gap-4 border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-white/70 uppercase tracking-widest">Mobile Preview Active</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-xs font-bold text-planet-yellow hover:text-white transition-colors"
          >
            EXIT PREVIEW
          </button>
        </div>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Designed by Planet Animal AI Team</p>
      </div>
    </div>
  );
}
