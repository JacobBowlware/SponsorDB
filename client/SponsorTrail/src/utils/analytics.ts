import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase/firebase";

// Page view tracking
export const trackPageView = (pageName: string, pageTitle?: string) => {
    try {
        logEvent(analytics, 'page_view', {
            page_name: pageName,
            page_title: pageTitle || pageName,
            page_location: window.location.href
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// User engagement tracking
export const trackButtonClick = (buttonName: string, pageName: string, additionalParams?: Record<string, any>) => {
    try {
        logEvent(analytics, 'button_click', {
            button_name: buttonName,
            page_name: pageName,
            ...additionalParams
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

export const trackFormSubmission = (formName: string, pageName: string, success: boolean, additionalParams?: Record<string, any>) => {
    try {
        logEvent(analytics, 'form_submit', {
            form_name: formName,
            page_name: pageName,
            success: success,
            ...additionalParams
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Navigation tracking
export const trackNavigation = (fromPage: string, toPage: string, navigationType: string) => {
    try {
        logEvent(analytics, 'navigation', {
            from_page: fromPage,
            to_page: toPage,
            navigation_type: navigationType
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Content interaction tracking
export const trackContentInteraction = (contentType: string, contentName: string, action: string, pageName: string) => {
    try {
        logEvent(analytics, 'content_interaction', {
            content_type: contentType,
            content_name: contentName,
            action: action,
            page_name: pageName
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Slideshow tracking
export const trackSlideshowInteraction = (slideNumber: number, action: string, slideTitle: string) => {
    try {
        logEvent(analytics, 'slideshow_interaction', {
            slide_number: slideNumber,
            action: action,
            slide_title: slideTitle
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// User journey tracking
export const trackUserJourney = (step: string, stepNumber: number, additionalParams?: Record<string, any>) => {
    try {
        logEvent(analytics, 'user_journey', {
            step: step,
            step_number: stepNumber,
            ...additionalParams
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Error tracking
export const trackError = (errorType: string, errorMessage: string, pageName: string) => {
    try {
        logEvent(analytics, 'error', {
            error_type: errorType,
            error_message: errorMessage,
            page_name: pageName
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Conversion tracking
export const trackConversion = (conversionType: string, value?: number, currency?: string) => {
    try {
        logEvent(analytics, 'conversion', {
            conversion_type: conversionType,
            value: value,
            currency: currency || 'USD'
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Search tracking
export const trackSearch = (searchTerm: string, resultsCount: number, pageName: string) => {
    try {
        logEvent(analytics, 'search', {
            search_term: searchTerm,
            results_count: resultsCount,
            page_name: pageName
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
};

// Time on page tracking
export const trackTimeOnPage = (pageName: string, timeSpent: number) => {
    try {
        logEvent(analytics, 'time_on_page', {
            page_name: pageName,
            time_spent_seconds: timeSpent
        });
    } catch (error) {
        console.error("Analytics error (non-fatal):", error);
    }
}; 