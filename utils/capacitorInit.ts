/**
 * Initialize Capacitor plugins and handle platform-specific setup
 */

export async function initCapacitor() {
  if (typeof window === 'undefined') return;

  try {
    // Initialize App plugin
    const { App } = await import('@capacitor/app');
    
    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App resumed');
      } else {
        console.log('App paused');
      }
    });

    // Handle back button (Android)
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    // Initialize Status Bar
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: 'dark' });
    await StatusBar.setBackgroundColor({ color: '#0a0a0c' });

    // Initialize Splash Screen
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();

    // Initialize Keyboard
    const { Keyboard } = await import('@capacitor/keyboard');
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });

    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.warn('Capacitor initialization error (running in browser?):', error);
  }
}

