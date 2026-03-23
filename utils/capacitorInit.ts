/**
 * Initialize Capacitor plugins and handle platform-specific setup
 */

/** After OAuth / Play Store / account UI, Android WebView sometimes leaves a grey unpainted band; nudge compositing. */
function nudgeWebViewRepaint() {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
    const html = document.documentElement;
    const prev = html.style.getPropertyValue('opacity');
    html.style.opacity = '0.9999';
    void html.offsetHeight;
    requestAnimationFrame(() => {
      html.style.opacity = prev || '';
    });
  });
}

export async function initCapacitor() {
  if (typeof window === 'undefined') return;

  try {
    const { App } = await import('@capacitor/app');

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        nudgeWebViewRepaint();
      }
    });

    const { notifyAndroidBack } = await import('./androidBackHandler');
    App.addListener('backButton', async () => {
      if (!notifyAndroidBack()) {
        await App.exitApp();
      }
    });
  } catch (error) {
    console.warn('Capacitor App plugin init failed (browser?):', error);
  }
}
