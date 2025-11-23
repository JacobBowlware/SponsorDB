// Funnel Event Tracking for SponsorDB
// Uses GA4 gtag directly

// Type declaration for gtag
declare global {
  interface Window {
    gtag: (command: string, action: string, params?: any) => void;
    dataLayer: any[];
  }
}

// Utility function to safely log events
function logEventSafe(eventName: string, params: Record<string, any> = {}) {
  try {
    // Check if GA4 is loaded
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
      console.log(`GA4 Event Logged: ${eventName}`, params);
    } else {
      console.warn('GA4 not loaded, skipping SponsorDB funnel tracking.');
    }
  } catch (e) {
    console.error('Error logging GA4 event:', e);
  }
}

// Track home page viewed
export const trackHomePageViewed = () => {
  logEventSafe('home_page_viewed');
};

// Track sponsors tab viewed
export const trackSponsorsTabViewed = () => {
  logEventSafe('sponsors_tab_viewed');
};

// Track newsletter signup screen viewed
export const trackSignupScreenViewed = () => {
  logEventSafe('signup_screen_viewed');
};

// Track newsletter signup started
export const trackSignupStarted = () => {
  logEventSafe('signup_started');
};

// Track subscription screen viewed
export const trackSubscriptionScreenViewed = () => {
  logEventSafe('subscription_screen_viewed');
};

// Track sponsor card clicked
export const trackSponsorCardClicked = (sponsorName: string) => {
  logEventSafe('sponsor_card_clicked', { sponsor: sponsorName || 'unknown' });
};

