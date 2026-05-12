import { useEffect, useMemo, useState } from 'react';

export default function MobilePreview() {
  const requestedPath = new URLSearchParams(window.location.search).get('path') || '/agents';
  const requestedDevice = new URLSearchParams(window.location.search).get('device') || 'iphone-16-pro-max';
  const isDemoMode = new URLSearchParams(window.location.search).get('demo_mode') === 'true';
  const isSamsungUltra = requestedDevice.toLowerCase().includes('samsung');
  const normalizedPath = requestedPath.startsWith('/') ? requestedPath : `/${requestedPath}`;
  const frameUrl = new URL(normalizedPath, window.location.origin);
  frameUrl.searchParams.set('preview_frame', 'true');
  if (isDemoMode) frameUrl.searchParams.set('demo_mode', 'true');
  const url = frameUrl.toString();
  const frame = isSamsungUltra ? { width: 432, height: 952 } : { width: 440, height: 956 };
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const syncViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  const previewScale = useMemo(() => {
    const widthScale = (viewport.width - 32) / frame.width;
    const heightScale = (viewport.height - 32) / frame.height;
    return Math.max(0.42, Math.min(widthScale, heightScale, 0.82));
  }, [frame.height, frame.width, viewport.height, viewport.width]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(254,199,8,0.15),transparent_34%),#050505] p-4">
      <div
        className="relative origin-center"
        style={{ transform: `scale(${previewScale})` }}
      >
        <div className="absolute -inset-10 rounded-[5rem] bg-planet-yellow/10 blur-[90px]" />
        {isSamsungUltra ? <SamsungUltraFrame url={url} /> : <IphoneFrame url={url} />}
      </div>
      
      <div className="fixed right-4 top-4 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:top-6">
        <div className="group flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl transition-all hover:bg-black/80">
          <button 
            onClick={() => window.open(url, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-planet-yellow text-black rounded-xl font-heading font-black text-[10px] uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Open full app in a new tab"
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
        
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">
            {isSamsungUltra ? 'Samsung S26 Ultra Preview' : 'iPhone 16 Pro Max Preview'}
          </p>
        </div>
      </div>
    </div>
  );
}

function IphoneFrame({ url }: { url: string }) {
  return (
    <>
      <div className="absolute -inset-4 rounded-[4.2rem] bg-gradient-to-br from-white/18 via-white/4 to-black/60 p-px shadow-[0_60px_160px_rgba(0,0,0,0.9)]">
        <div className="h-full w-full rounded-[4.15rem] bg-[#111]" />
      </div>

      <div className="relative mx-auto h-[956px] w-[440px] rounded-[4rem] border-[10px] border-[#1a1a1a] bg-[#101010] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08),0_40px_120px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-[5px] rounded-[3.45rem] border border-white/10 pointer-events-none z-30" />
        <div className="absolute left-1/2 top-4 z-40 flex h-9 w-[132px] -translate-x-1/2 items-center justify-center rounded-full bg-black shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
          <div className="mr-3 h-2.5 w-2.5 rounded-full bg-slate-800 shadow-[inset_0_0_4px_rgba(255,255,255,0.22)]" />
          <div className="h-1.5 w-12 rounded-full bg-slate-900" />
        </div>

        <div className="absolute -left-[14px] top-[146px] h-[44px] w-[4px] rounded-l-lg bg-[#2a2a2a]" />
        <div className="absolute -left-[14px] top-[220px] h-[78px] w-[4px] rounded-l-lg bg-[#2a2a2a]" />
        <div className="absolute -left-[14px] top-[318px] h-[78px] w-[4px] rounded-l-lg bg-[#2a2a2a]" />
        <div className="absolute -right-[14px] top-[252px] h-[112px] w-[4px] rounded-r-lg bg-[#2a2a2a]" />

        <div className="h-full w-full overflow-hidden rounded-[3.28rem] border-[2px] border-white/5 bg-slate-950">
          <iframe
            src={url}
            allow="publickey-credentials-get *; identity-credentials-get *"
            className="w-full h-full border-none select-none"
            title="Planet Animal App Preview in iPhone 16 Pro Max"
            id="preview-iframe"
          />
        </div>
      </div>
    </>
  );
}

function SamsungUltraFrame({ url }: { url: string }) {
  return (
    <>
      <div className="absolute -inset-5 rounded-[3.6rem] bg-gradient-to-br from-white/20 via-slate-500/8 to-black/70 p-px shadow-[0_60px_170px_rgba(0,0,0,0.92)]">
        <div className="h-full w-full rounded-[3.55rem] bg-[#0f1115]" />
      </div>

      <div className="relative mx-auto h-[952px] w-[432px] rounded-[3.35rem] border-[8px] border-[#171a20] bg-[#080a0f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_42px_130px_rgba(0,0,0,0.78)]">
        <div className="absolute inset-[4px] rounded-[2.9rem] border border-white/10 pointer-events-none z-30" />
        <div className="absolute left-1/2 top-[18px] z-40 h-[17px] w-[17px] -translate-x-1/2 rounded-full border-[3px] border-black bg-[#05070b] shadow-[0_0_0_1px_rgba(255,255,255,0.08),inset_0_0_4px_rgba(255,255,255,0.2)]" />

        <div className="absolute -left-[11px] top-[164px] h-[88px] w-[3px] rounded-l-lg bg-[#2b3038]" />
        <div className="absolute -right-[11px] top-[142px] h-[56px] w-[3px] rounded-r-lg bg-[#2b3038]" />
        <div className="absolute -right-[11px] top-[228px] h-[116px] w-[3px] rounded-r-lg bg-[#2b3038]" />

        <div className="h-full w-full overflow-hidden rounded-[2.75rem] border-[1px] border-white/5 bg-slate-950">
          <iframe
            src={url}
            allow="publickey-credentials-get *; identity-credentials-get *"
            className="w-full h-full border-none select-none"
            title="Planet Animal App Preview in Samsung S26 Ultra"
            id="preview-iframe"
          />
        </div>
      </div>
    </>
  );
}
