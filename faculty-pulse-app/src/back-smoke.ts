import { App as CapApp } from '@capacitor/app';

// Guard multiple installs (StrictMode)
let installed = false;
if (!installed) {
  installed = true;
  // eslint-disable-next-line no-console
  console.log('[SMOKE] back-smoke loaded');
  CapApp.addListener('backButton', ({ canGoBack }) => {
    // eslint-disable-next-line no-alert
    alert(`backButton canGoBack=${canGoBack} path=${location.pathname} hlen=${history.length}`);
    // eslint-disable-next-line no-console
    console.log('[SMOKE] backButton', { canGoBack, path: location.pathname, hlen: history.length });
  });
} 