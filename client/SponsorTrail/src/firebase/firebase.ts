// firebase.ts
import { initializeApp } from 'firebase/app';

// Add type declaration for gtag
declare global {
  interface Window {
    gtag: (command: string, action: string, params?: any) => void;
    dataLayer: any[];
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3PZFjppdvpc65UF1JsnS1gf4oUQoKBw4",
  authDomain: "sponsor-trail.firebaseapp.com",
  projectId: "sponsor-trail",
  storageBucket: "sponsor-trail.appspot.com",
  messagingSenderId: "939217999818",
  appId: "1:939217999818:web:65370dad789f42dd646133",
  measurementId: "G-0FQTX0C0FT" // Must match your Google Tag ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Create a mock analytics object that satisfies the Analytics interface
export const analytics: any = {
  app: app,
  name: 'SponsorTrail',
  automaticDataCollectionEnabled: true
};

// Simple mock implementation for logEvent
export const logEvent = (name: string, params?: Record<string, any>): void => {
  // Just log to console - actual tracking is handled by Google Tag Manager
  console.log(`[Event] ${name}`, params);
  
  // If window.gtag exists (from Google Tag Manager), use it
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', name, params);
    } catch (e) {
      // Silently handle errors
    }
  }
};

// Helper for components that expect to call logEvent with analytics as first param
export const logEventHelper = (name: string, params?: Record<string, any>): void => {
  logEvent(name, params);
};

export default app;
