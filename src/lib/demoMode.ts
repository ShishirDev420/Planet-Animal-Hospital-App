export function isPreviewDemoMode(search = window.location.search, pathname = window.location.pathname): boolean {
  const params = new URLSearchParams(search);
  if (params.get('demo_mode') !== 'true') return false;

  return pathname === '/preview' || params.get('preview_frame') === 'true';
}

export function assertLiveCareAccess(): void {
  if (isPreviewDemoMode()) throw new Error('Visual previews cannot access live care records. Sign in through the main app.');
}
