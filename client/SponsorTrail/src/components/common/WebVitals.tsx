import { useEffect } from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const WebVitals: React.FC = () => {
  useEffect(() => {
    // Track Core Web Vitals
    getCLS((metric) => {
      console.log('CLS:', metric);
      // You can send this to your analytics service
    });

    getFID((metric) => {
      console.log('FID:', metric);
      // You can send this to your analytics service
    });

    getFCP((metric) => {
      console.log('FCP:', metric);
      // You can send this to your analytics service
    });

    getLCP((metric) => {
      console.log('LCP:', metric);
      // You can send this to your analytics service
    });

    getTTFB((metric) => {
      console.log('TTFB:', metric);
      // You can send this to your analytics service
    });
  }, []);

  return null; // This component doesn't render anything
};

export default WebVitals;
