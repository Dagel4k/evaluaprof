import { App as CapApp } from '@capacitor/app';

let installed = false;
let lastBack = 0;

export function installBackHandler() {
  if (installed) return; installed = true;

  const isRoot = (p: string) => p === '/' || p === '/startup' || p === '/home';

  CapApp.addListener('backButton', ({ canGoBack }) => {
    const path = location.pathname;

    // 1) En raíz: doble back para salir (prioritario)
    if (isRoot(path)) {
      const now = Date.now();
      if (now - lastBack < 1500) {
        CapApp.exitApp();
      } else {
        lastBack = now;
        // Optional toast here
      }
      return;
    }

    // 2) En perfil -> volver a listado usando pop real
    if (path.startsWith('/profesores/') && path.split('/').length === 3) {
      if (history.length > 1 || canGoBack) {
        history.back();
      } else {
        // Fallback, ir a listado sin agregar bucle
        location.replace('/profesores');
      }
      return;
    }

    // 3) Pop normal si hay historial
    if (canGoBack || history.length > 1) {
      history.back();
      return;
    }

    // 4) Sin historial y no raíz: no hagas nada (bloquea cierre accidental)
  });
} 