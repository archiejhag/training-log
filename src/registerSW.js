/* Register the service worker — production builds only. In dev the SW would
   sit in front of Vite's module server and serve stale code, so we skip it
   (import.meta.env.PROD is false under `vite dev`). */

export function registerSW() {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
