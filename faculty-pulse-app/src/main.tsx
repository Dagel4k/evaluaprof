import { installBackHandler } from './back-handler';
installBackHandler();
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Configure StatusBar for native devices
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  // Optional: Set initial style
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
}

function applyThemeFromSystem() {
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const html = document.documentElement;
  if (prefersDark) html.classList.add('dark'); else html.classList.remove('dark');
}

applyThemeFromSystem();

if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', applyThemeFromSystem);
}

createRoot(document.getElementById("root")!).render(<App />);
