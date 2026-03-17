// Simple analytics utility
// Can be extended to integrate with Google Analytics, Firebase, etc.

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class Analytics {
  private enabled: boolean = true;

  init() {
    // Check if user has opted out
    const optOut = localStorage.getItem('analytics_opt_out') === 'true';
    this.enabled = !optOut;
  }

  trackEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event);
      }

      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value
        });
      }

      // Store locally for offline analytics
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push({
        ...event,
        timestamp: Date.now()
      });
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  trackPageView(path: string) {
    if (!this.enabled) return;
    
    this.trackEvent({
      action: 'page_view',
      category: 'navigation',
      label: path
    });
  }

  trackReadingStart(bookId: string, chapter: number) {
    this.trackEvent({
      action: 'reading_start',
      category: 'reading',
      label: `${bookId}_${chapter}`
    });
  }

  trackReadingComplete(bookId: string, chapter: number) {
    this.trackEvent({
      action: 'reading_complete',
      category: 'reading',
      label: `${bookId}_${chapter}`
    });
  }

  trackMemhirQuery() {
    this.trackEvent({
      action: 'memhir_query',
      category: 'ai_interaction'
    });
  }

  setOptOut(optOut: boolean) {
    this.enabled = !optOut;
    localStorage.setItem('analytics_opt_out', String(optOut));
  }
}

export const analytics = new Analytics();

// Initialize on module load
if (typeof window !== 'undefined') {
  analytics.init();
}

