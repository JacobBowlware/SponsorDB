import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const WebVitals: React.FC = () => {
  useEffect(() => {
    // Track Core Web Vitals
    getCLS((metric) => {
      // CLS metric logged
      // You can send this to your analytics service
    });

    getFID((metric) => {
      // FID metric logged
      // You can send this to your analytics service
    });

    getFCP((metric) => {
      // FCP metric logged
      // You can send this to your analytics service
    });

    getLCP((metric) => {
      // LCP metric logged
      // You can send this to your analytics service
    });

    getTTFB((metric) => {
      // TTFB metric logged
      // You can send this to your analytics service
    });
  }, []);

  return null; // This component doesn't render anything
};

export default WebVitals;
