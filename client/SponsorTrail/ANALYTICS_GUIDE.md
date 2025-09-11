# Analytics Tracking Guide

## Overview

This guide explains the comprehensive analytics tracking implemented throughout SponsorDB to help you understand user behavior and optimize conversions.

## What's Being Tracked

### 1. Page Views

- **Event**: `page_view`
- **Parameters**: `page_name`, `page_title`, `page_location`
- **Pages Tracked**: All major pages (Home, Signup, Login, Sponsors, etc.)

### 2. User Engagement

- **Event**: `button_click`
- **Parameters**: `button_name`, `page_name`, additional custom parameters
- **Examples**: Signup button, Google login, navigation links

### 3. Form Submissions

- **Event**: `form_submit`
- **Parameters**: `form_name`, `page_name`, `success`, error details
- **Forms Tracked**: Signup, Login, Contact forms

### 4. Navigation

- **Event**: `navigation`
- **Parameters**: `from_page`, `to_page`, `navigation_type`
- **Examples**: User moving from signup to sponsors page

### 5. Slideshow Interactions

- **Event**: `slideshow_interaction`
- **Parameters**: `slide_number`, `action`, `slide_title`
- **Actions**: `auto_advance`, `manual_next`, `manual_prev`

### 6. User Journey

- **Event**: `user_journey`
- **Parameters**: `step`, `step_number`, additional context
- **Steps**: Page views, form submissions, conversions

### 7. Conversions

- **Event**: `conversion`
- **Parameters**: `conversion_type`, `value`, `currency`
- **Types**: Signup, Purchase, etc.

### 8. Errors

- **Event**: `error`
- **Parameters**: `error_type`, `error_message`, `page_name`
- **Examples**: Form validation errors, API errors

### 9. Search

- **Event**: `search`
- **Parameters**: `search_term`, `results_count`, `page_name`
- **Used**: Sponsor search functionality

### 10. Time on Page

- **Event**: `time_on_page`
- **Parameters**: `page_name`, `time_spent_seconds`
- **Purpose**: Understand user engagement

## How to View in Google Analytics

### 1. Access Events

1. Go to Google Analytics
2. Navigate to **Reports** → **Engagement** → **Events**
3. You'll see all custom events listed

### 2. Create Custom Reports

1. Go to **Explore** in GA4
2. Create custom reports for specific user journeys
3. Filter by event names to analyze specific behaviors

### 3. Key Metrics to Monitor

#### Conversion Funnel

- `page_view` (Signup page) → `form_submit` (success) → `conversion` (signup)
- Track drop-off rates at each step

#### User Engagement

- `slideshow_interaction` - Which slides get most attention
- `button_click` - Most clicked buttons
- `time_on_page` - Pages with highest engagement

#### Error Tracking

- `error` events to identify and fix issues
- `form_submit` with `success: false` to improve forms

## Implementation Status

### ✅ Completed

- Signup page tracking
- Slideshow interaction tracking
- Basic analytics utility functions

### 🔄 Next Steps

1. **Add tracking to other pages**:

   - Home page (button clicks, form submissions)
   - Login page
   - Sponsors page (search, filters)
   - Purchase/Checkout page

2. **Enhanced tracking**:

   - Time on page tracking
   - Scroll depth tracking
   - Exit intent tracking

3. **Conversion optimization**:
   - A/B test tracking
   - Funnel analysis
   - Revenue tracking

## Adding Tracking to New Pages

### 1. Import Analytics Functions

```typescript
import {
  trackPageView,
  trackButtonClick,
  trackFormSubmission,
} from "../utils/analytics";
```

### 2. Track Page View

```typescript
useEffect(() => {
  trackPageView("PageName", "Page Title");
}, []);
```

### 3. Track Button Clicks

```typescript
const handleButtonClick = () => {
  trackButtonClick("button_name", "page_name");
  // Your button logic
};
```

### 4. Track Form Submissions

```typescript
const handleSubmit = async (formData) => {
  try {
    // Submit form
    trackFormSubmission("form_name", "page_name", true);
  } catch (error) {
    trackFormSubmission("form_name", "page_name", false, {
      error: error.message,
    });
  }
};
```

## Key Insights to Look For

### 1. Conversion Rate Optimization

- Which pages have highest bounce rates?
- Where do users drop off in the signup process?
- Which buttons get clicked most?

### 2. Content Performance

- Which slideshow slides engage users most?
- What content drives the most conversions?
- Which pages have highest time on page?

### 3. User Journey Analysis

- Most common user paths
- Points of friction in the user experience
- Opportunities for optimization

### 4. Error Monitoring

- Common form validation errors
- API error patterns
- Technical issues affecting conversions

## Best Practices

1. **Don't over-track**: Focus on meaningful events that drive business decisions
2. **Test tracking**: Verify events are firing correctly in development
3. **Respect privacy**: Don't track personally identifiable information
4. **Regular review**: Check analytics weekly to identify trends
5. **Actionable insights**: Use data to make specific improvements

## Troubleshooting

### Events Not Showing Up

1. Check browser console for errors
2. Verify Firebase Analytics is properly configured
3. Ensure events are being called correctly
4. Check Google Analytics real-time reports

### Missing Data

1. Check if analytics functions are being called
2. Verify Firebase configuration
3. Check for ad blockers affecting tracking
4. Ensure proper error handling in analytics functions
