// React
import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet, Link
} from 'react-router-dom';

import { useEffect, useState, useCallback } from 'react';

// Types
import { User } from './types/User';

// CSS
import './css/App.css';
import './css/Header.css';
import './css/Footer.css';
import './css/pages/Home.css';
import './css/pages/Newsletter.css';
import './css/pages/Login.css';
import './css/pages/ChangePassword.css';
import './css/pages/Review.css';
import './css/pages/PrivacyPolicy.css';
import './css/pages/TOS.css';
import './css/pages/Subscribe.css'
import './css/pages/authReq/Sponsors.css';
import './css/pages/authReq/Profile.css';
import './css/pages/authReq/Admin.css';
import './css/pages/authReq/NavMenu.css'
import './css/pages/authReq/PaymentSuccess.css'
import './css/pages/authReq/AuthedLayout.css'
import './css/pages/Blog.css'
import './css/pages/BlogPost.css'
import './css/pages/NewsletterPage.css'
import './css/Analytics.css'

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ScrollToTop from './components/ScrollToTop';
import AuthHeader from './components/common/AuthHeader';

// Other
import axios from 'axios';
import config from './config';
import tokenManager from './utils/tokenManager';
import apiClient from './utils/axiosInterceptor';
import ChangePasswordFinal from './pages/ChangePasswordFinal';
import NavMenu from './components/common/NavMenu';

//Pages
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscribe from './pages/Subscribe';
import SignupFlow from './components/SignupFlow';
import ChangePassword from './pages/ChangePassword';
import AuthCallback from './pages/AuthCallback';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import NewsletterPage from './pages/NewsletterPage';
import NewsletterOnboarding from './components/NewsletterOnboarding';

// Authed Pages
import Review from './pages/Review';
import Sponsors from './pages/authReq/Sponsors';
import Profile from './pages/authReq/Profile';
import Admin from './pages/authReq/Admin';
import PaymentSuccess from './pages/authReq/PaymentSuccess';
import Purchase from './pages/authReq/Purchase';
import Analytics from './components/Analytics';

// Utility function to check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't parse the token, consider it expired
  }
};

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

function App() {
  // Check if we're in local development
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check if user has explicitly logged out in dev mode
  const isDevLogout = localStorage.getItem('dev_logout') === 'true';
  
  // Initialize loading state
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Log development mode status
  useEffect(() => {
    if (isLocalDev && !isDevLogout) {
      console.log('🚀 Development Mode Active - You can now access all authenticated pages!');
      console.log('📊 Mock data provided: 150 sponsors, 25 newsletters');
      console.log('🔑 Auto-authenticated as admin with full access');
      console.log('💡 To test signup flow, go to Profile and click "Sign Out"');
      // Set a mock token for development mode
      localStorage.setItem('token', 'dev_token_for_localhost');
    }
  }, [isLocalDev, isDevLogout]);
  
  const [userAuth, setUserAuth] = useState(isLocalDev && !isDevLogout); // Auto-authenticate in local dev unless logged out
  const [user, setUser] = useState<User>({
    email: (isLocalDev && !isDevLogout) ? "dev@localhost.com" : "",
    isAdmin: (isLocalDev && !isDevLogout) ? true : false,
    subscription: (isLocalDev && !isDevLogout) ? "premium" : null,
    stripeCustomerId: (isLocalDev && !isDevLogout) ? "dev_customer_id" : "",
    billing: (isLocalDev && !isDevLogout) ? {
      status: 'active',
      monthlyCharge: 20,
      currency: 'usd',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } : null,
    newsletterInfo: (isLocalDev && !isDevLogout) ? (() => {
      const stored = localStorage.getItem('dev_newsletter_info');
      return stored ? JSON.parse(stored) : null;
    })() : null,
  });

  const [dbInfo, setDbInfo] = useState({
    sponsors: isLocalDev ? 150 : 0,
    newsletters: isLocalDev ? 25 : 0,
    lastUpdated: isLocalDev ? new Date().toISOString() : ""
  });

  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Helper function to determine if user is subscribed
  const isSubscribed = Boolean(user.subscription && user.subscription !== 'none');

  const getDbInfo = async () => {
    try {
      // Get database info (public route, no auth required)
      const dbInfo = await axios.get(`${config.backendUrl}sponsors/db-info`);
      setDbInfo(dbInfo.data);
    } catch (error) {
      console.error('Error fetching database info:', error);
      // Set fallback values if the request fails
      setDbInfo({
        sponsors: 0,
        newsletters: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  const getUserInfo = useCallback(async () => {
    // In development mode, check for stored newsletter info
    if (isLocalDev) {
      const storedNewsletterInfo = localStorage.getItem('dev_newsletter_info');
      setUser(prev => ({
        ...prev,
        newsletterInfo: storedNewsletterInfo ? JSON.parse(storedNewsletterInfo) : prev.newsletterInfo
      }));
      return;
    }

    // Get user profile information using the new token manager
    const accessToken = await tokenManager.getValidAccessToken();
    if (!accessToken) {
      console.log('No valid access token available, clearing authentication');
      tokenManager.clearTokens();
      setUserAuth(false);
      setUser({
        email: "",
        isAdmin: false,
        subscription: null,
        stripeCustomerId: "",
        billing: null,
        newsletterInfo: null,
      });
      return;
    }

    try {
      const res = await apiClient.get(`${config.backendUrl}users/me`);
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user info:', err);
      // If we get a 401/403, the token might be invalid
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        console.log('Token invalid, clearing authentication');
        tokenManager.clearTokens();
        setUserAuth(false);
        setUser({
          email: "",
          isAdmin: false,
          subscription: null,
          stripeCustomerId: "",
          billing: null,
          newsletterInfo: null,
        });
      }
    }
  }, [isLocalDev]);

  // Consolidated initialization effect
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
        // In local development, we don't need to fetch from backend
        if (isLocalDev) {
          setIsInitializing(false);
          return;
        }

        // Always fetch database info first (public route, no auth required)
        await getDbInfo();

        // Check authentication using token manager
        const accessToken = await tokenManager.getValidAccessToken();
        if (accessToken) {
          setUserAuth(true);
          await getUserInfo();
        } else {
          console.log('No valid access token, clearing authentication');
          tokenManager.clearTokens();
          setUserAuth(false);
          setUser({
            email: "",
            isAdmin: false,
            subscription: null,
            stripeCustomerId: "",
            billing: null,
            newsletterInfo: null,
          });
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Set fallback values if initialization fails
        setDbInfo({
          sponsors: 0,
          newsletters: 0,
          lastUpdated: new Date().toISOString()
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [isLocalDev, getUserInfo]);

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    if (!isLocalDev && userAuth) {
      const interval = setInterval(async () => {
        const accessToken = await tokenManager.getValidAccessToken();
        if (!accessToken) {
          console.log('No valid access token during periodic check, clearing authentication');
          tokenManager.clearTokens();
          setUserAuth(false);
          setUser({
            email: "",
            isAdmin: false,
            subscription: null,
            stripeCustomerId: "",
            billing: null,
            newsletterInfo: null,
          });
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [userAuth, isLocalDev]);

  const Root = () => {
    // Show loading state during initialization
    if (isInitializing) {
      return (
        <div className="web-page">
          <div className="web-section web-section-dark mt-0">
            <div className="web-section__container web-section-content">
              <div className="text-center" style={{ padding: '100px 20px' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="sr-only">Loading...</span>
                </div>
                <h3 className="mt-3">Loading SponsorDB...</h3>
                <p className="text-muted">Please wait while we load your data</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!userAuth) { // Default Navbar (should always be on home page)
      return <><Header />
        <ScrollToTop />
        <Outlet />
        <Footer auth={userAuth} />
      </>;
    }
    else { // Authed Layout
      if (isMobile) {
        // Mobile layout with AuthHeader
        return <>
          <AuthHeader isAdmin={user.isAdmin} isSubscribed={user.subscription} isLocalDev={isLocalDev}  />
          <ScrollToTop />
          <div className="authed-app__content">
            <Outlet />
            <Footer auth={userAuth} />
          </div>
        </>;
      } else {
        // Desktop layout with NavMenu
        return <div className="authed-app">
          <NavMenu isAdmin={user.isAdmin} isSubscribed={isSubscribed} isLocalDev={isLocalDev} />
          <ScrollToTop />
          <div className="authed-app__content">
            <Outlet />
            <Footer auth={userAuth} />
          </div>
        </div>;
      }
    }
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} isSubscribed={isSubscribed} email={user.email} sponsorCount={dbInfo.sponsors} user={user} />} />
        <Route path="/*" element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} isSubscribed={isSubscribed} email={user.email} sponsorCount={dbInfo.sponsors} user={user} />} />
        {/* <Route path="/newsletter/" element={<Newsletter />} /> */}
        <Route path="/login/" element={<Login userAuth={userAuth} isSubscribed={isSubscribed} />} />
        <Route path="/signup/" element={<Signup userAuth={userAuth} isSubscribed={isSubscribed} sponsorCount={dbInfo.sponsors} newsletterCount={dbInfo.newsletters} onAuthChange={setUserAuth} onUserUpdate={getUserInfo} />} />
        <Route path="/onboarding" element={<div className="web-page"><div className="newsletter-onboarding-container"><NewsletterOnboarding onComplete={async (newsletterInfo) => { 
          // Refresh user data to get updated newsletter info
          await getUserInfo();
          if (userAuth && !isSubscribed) { 
            window.location.href = '/subscribe'; 
          } else { 
            window.location.href = '/sponsors'; 
          } 
        }} onSkip={() => { if (!userAuth) { setUserAuth(true); } if (!isSubscribed) { window.location.href = '/subscribe'; } else { window.location.href = '/sponsors'; } }} existingData={user.newsletterInfo ? {
            ...user.newsletterInfo,
            name: user.newsletterInfo.name || '',
            topic: user.newsletterInfo.topic || '',
            audience_size: user.newsletterInfo.audience_size || 0,
            engagement_rate: user.newsletterInfo.engagement_rate || 0,
            publishing_frequency: user.newsletterInfo.publishing_frequency || 'weekly',
            audience_demographics: {
                age_range: user.newsletterInfo.audience_demographics?.age_range || '26-35',
                income_range: user.newsletterInfo.audience_demographics?.income_range || '50-100K',
                location: user.newsletterInfo.audience_demographics?.location || 'US',
                interests: user.newsletterInfo.audience_demographics?.interests || [],
                job_titles: user.newsletterInfo.audience_demographics?.job_titles || []
            },
            sponsorship_history: {
                previous_sponsors: user.newsletterInfo.sponsorship_history?.previous_sponsors || [],
                typical_rates: {
                    newsletter_mention: user.newsletterInfo.sponsorship_history?.typical_rates?.newsletter_mention || 0,
                    dedicated_email: user.newsletterInfo.sponsorship_history?.typical_rates?.dedicated_email || 0,
                    banner_ad: user.newsletterInfo.sponsorship_history?.typical_rates?.banner_ad || 0
                }
            },
            outreach_preferences: {
                style: user.newsletterInfo.outreach_preferences?.style || 'professional',
                follow_up_frequency: user.newsletterInfo.outreach_preferences?.follow_up_frequency || 'once',
                minimum_deal_size: user.newsletterInfo.outreach_preferences?.minimum_deal_size || 0
            },
            sponsor_match_profile: {
                ideal_sponsor_categories: user.newsletterInfo.sponsor_match_profile?.ideal_sponsor_categories || [],
                predicted_response_rate: user.newsletterInfo.sponsor_match_profile?.predicted_response_rate || 0,
                recommended_outreach_times: user.newsletterInfo.sponsor_match_profile?.recommended_outreach_times || [],
                personalization_data_points: user.newsletterInfo.sponsor_match_profile?.personalization_data_points || []
            },
            outreach_stats: {
                emails_sent: user.newsletterInfo.outreach_stats?.emails_sent || 0,
                responses_received: user.newsletterInfo.outreach_stats?.responses_received || 0,
                deals_closed: user.newsletterInfo.outreach_stats?.deals_closed || 0,
                total_revenue: user.newsletterInfo.outreach_stats?.total_revenue || 0,
                average_response_rate: user.newsletterInfo.outreach_stats?.average_response_rate || 0
            }
        } : undefined} /></div></div>} />
        <Route path="/subscribe/" element={<Subscribe userAuth={userAuth} isSubscribed={isSubscribed} subscription={user.subscription || undefined} />} />
        <Route path="/signup-flow/" element={<SignupFlow userAuth={userAuth} isSubscribed={isSubscribed} subscription={user.subscription} sponsorCount={dbInfo.sponsors} newsletterCount={dbInfo.newsletters} onAuthChange={setUserAuth} onUserUpdate={getUserInfo} />} />
        <Route path="/change-password/" element={<ChangePassword />} />
        <Route path="/change-password-final" element={<ChangePasswordFinal />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/feedback/" element={<Review email={user.email} />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
        <Route path="/blog/" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/newsletter/" element={<NewsletterPage user={user} userAuth={userAuth} />} />
        {/* Authed Routes */}
        {userAuth && <Route path="/checkout/" element={<Purchase isSubscribed={isSubscribed} sponsorCount={dbInfo.sponsors} />} />}
        {userAuth && <Route path="/profile/" element={<Profile
          isSubscribed={isSubscribed}
          userEmail={user.email}
          user={user}
        />} />}
        {userAuth && <Route path="/payment-success/" element={<PaymentSuccess />} />}
        {/* Subscriber Routes - Protected by authentication AND subscription */}
        {userAuth && isSubscribed && <Route path="/sponsors/" element={<Sponsors isSubscribed={user.subscription} sponsors={dbInfo.sponsors} newsletters={dbInfo.newsletters} lastUpdated={dbInfo.lastUpdated} user={user} />} />}
        {userAuth && !isSubscribed && <Route path="/sponsors/" element={<div className="web-page"><div className="subscription-required"><h2>Subscription Required</h2><p>Please subscribe to access our sponsor database.</p><Link to="/subscribe" className="btn btn-primary">Subscribe Now</Link></div></div>} />}
        {userAuth && <Route path="/analytics/" element={<Analytics isSubscribed={isSubscribed} user={user} />} />}
        {/* Admin Routes */}
        {userAuth && user.isAdmin && <Route path="/admin/" element={<Admin />} />}
      </Route>
    )
  )

  return (
    <div className="web-container">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
