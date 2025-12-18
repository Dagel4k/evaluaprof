export const Native = {
  async hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const map: Record<string, any> = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
      await Haptics.impact({ style: map[style] || ImpactStyle.Light });
    } catch {}
  },
  async hapticSelect() {
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionChanged();
    } catch {
      // fallback to very light impact
      await Native.hapticImpact('light');
    }
  },
  async toast(message: string, duration: 'short' | 'long' = 'short') {
    try {
      const { Toast } = await import('@capacitor/toast');
      await Toast.show({ text: message, duration });
    } catch {
      console.log('[Toast]', message);
    }
  },
  async keyboardSetResize(mode: 'body' | 'native' | 'none' = 'native') {
    try {
      const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
      const map: Record<string, any> = { native: KeyboardResize.Native, body: KeyboardResize.Body, none: KeyboardResize.None };
      await Keyboard.setResizeMode({ mode: map[mode] || KeyboardResize.Native });
    } catch {}
  },
  async keyboardHide() {
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch {}
  },
  async statusBarSetStyle(style: 'light' | 'dark' = 'light') {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: style === 'light' ? Style.Light : Style.Dark });
    } catch {}
  },
  async splashHide() {
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch {}
  }
}; 