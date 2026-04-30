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
      
      {/* Controls Overlay - Unobtrusive Bottom Right */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-[60]">
        <div className="group flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl transition-all hover:bg-black/80">
          <button 
            onClick={() => window.open(window.location.origin, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-planet-yellow text-black rounded-xl font-heading font-black text-[10px] uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Open full app in new tab (Required for Google Sign-In)"
          >
            <span>Open Full App</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          
          <div className="flex items-center gap-1 px-2 border-l border-white/10">
            <button 
              onClick={() => window.location.href = '/'}
              className="p-2 text-white/40 hover:text-white/80 transition-all"
              title="Exit Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tiny helper badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">
            Mobile Mode Active
          </p>
        </div>
      </div>
    </div>
  );
}
