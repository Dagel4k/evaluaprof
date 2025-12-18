import { App as CapApp } from '@capacitor/app';

// Guard multiple installs (StrictMode)
let installed = false;
if (!installed) {
  installed = true;
  // Debug listener commented out for production
  /*
  CapApp.addListener('backButton', ({ canGoBack }) => {
    // Debug logic here
  });
  */
} 