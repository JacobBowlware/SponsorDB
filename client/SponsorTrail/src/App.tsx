// React
import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';

import { useEffect, useState, useCallback } from 'react';

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
import './css/Analytics.css'


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
import NewsletterOnboarding from './components/NewsletterOnboarding';

// Authed Pages
import Review from './pages/Review';
import Sponsors from './pages/authReq/Sponsors';
import Profile from './pages/authReq/Profile';
import Admin from './pages/authReq/Admin';
import PaymentSuccess from './pages/authReq/PaymentSuccess';
import Purchase from './pages/authReq/Purchase';
import Analytics from './components/Analytics';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ScrollToTop from './components/ScrollToTop';
import AuthHeader from './components/common/AuthHeader';

// Other
import axios from 'axios';
import config from './config';
import ChangePasswordFinal from './pages/ChangePasswordFinal';
import NavMenu from './components/common/NavMenu';

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
  const [user, setUser] = useState({
    email: (isLocalDev && !isDevLogout) ? "dev@localhost.com" : "",
    isAdmin: (isLocalDev && !isDevLogout) ? true : false,
    subscription: (isLocalDev && !isDevLogout) ? "pro" : null,
    stripeCustomerId: (isLocalDev && !isDevLogout) ? "dev_customer_id" : "",
    billing: (isLocalDev && !isDevLogout) ? {
      status: 'active',
      monthlyCharge: 79,
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
    // Get database info
    const dbInfo = await axios.get(`${config.backendUrl}sponsors/db-info`, {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    });

    setDbInfo(dbInfo.data);
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

    // Get user profile information
    await axios.get(`${config.backendUrl}users/me`, {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    }).then((res) => {
      setUser(res.data);
    }).catch((err) => {
    })
  }, [isLocalDev]);

  // Handle auth and data fetching
  useEffect(() => {
    const fetchData = async (num: number) => {
      if (num === 1) {
        await getUserInfo();
      }
      else if (num === 2) {
        await getDbInfo();
      }
    }

    // In local development, we don't need to fetch from backend
    if (isLocalDev) {
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      setUserAuth(true);

      if (user.email === "") {
        fetchData(1);
      }
    }
    if (dbInfo.sponsors === 0) {
      fetchData(2);
    }
  }, [user.email, dbInfo.sponsors, isLocalDev, getUserInfo]);

  // Additional effect to handle authentication state changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !userAuth) {
      setUserAuth(true);
      getUserInfo();
    } else if (!token && userAuth) {
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
  }, [userAuth, getUserInfo]);

  const Root = () => {
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
        <Route index element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} isSubscribed={isSubscribed} email={user.email} sponsorCount={dbInfo.sponsors} />} />
        <Route path="/*" element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} isSubscribed={isSubscribed} email={user.email} sponsorCount={dbInfo.sponsors} />} />
        {/* <Route path="/newsletter/" element={<Newsletter />} /> */}
        <Route path="/login/" element={<Login userAuth={userAuth} isSubscribed={isSubscribed} />} />
        <Route path="/signup/" element={<Signup userAuth={userAuth} isSubscribed={isSubscribed} sponsorCount={dbInfo.sponsors} newsletterCount={dbInfo.newsletters} onAuthChange={setUserAuth} onUserUpdate={getUserInfo} />} />
        <Route path="/onboarding" element={<div className="web-page"><div className="newsletter-onboarding-container"><NewsletterOnboarding onComplete={() => { if (userAuth && !isSubscribed) { window.location.href = '/subscribe'; } else { window.location.href = '/sponsors'; } }} onSkip={() => { if (!userAuth) { setUserAuth(true); } if (!isSubscribed) { window.location.href = '/subscribe'; } else { window.location.href = '/sponsors'; } }} /></div></div>} />
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
        {/* Authed Routes */}
        {userAuth && <Route path="/checkout/" element={<Purchase isSubscribed={isSubscribed} sponsorCount={dbInfo.sponsors} />} />}
        {userAuth && <Route path="/profile/" element={<Profile
          isSubscribed={isSubscribed}
          userEmail={user.email}
          user={user}
        />} />}
        {userAuth && <Route path="/payment-success/" element={<PaymentSuccess />} />}
        {/* Subscriber Routes - Protected by authentication */}
        {userAuth && <Route path="/sponsors/" element={<Sponsors isSubscribed={user.subscription} sponsors={dbInfo.sponsors} newsletters={dbInfo.newsletters} lastUpdated={dbInfo.lastUpdated} />} />}
        {userAuth && <Route path="/analytics/" element={<Analytics />} />}
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
