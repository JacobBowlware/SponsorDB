// React
import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';

import { useEffect, useState } from 'react';

// CSS
import './css/App.css';
import './css/Header.css';
import './css/Footer.css';
import './css/pages/Home.css';
import './css/pages/Login.css';
import './css/pages/ChangePassword.css';
import './css/pages/Review.css';
import './css/pages/PrivacyPolicy.css';
import './css/pages/TOS.css';
import './css/pages/authReq/Sponsors.css';
import './css/pages/authReq/Profile.css';
import './css/pages/authReq/Admin.css';
import './css/pages/Subscribe.css'

//Pages
import Home from './pages/Home';
import Review from './pages/Review';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangePassword from './pages/ChangePassword';

// Authed Pages
import Sponsors from './pages/authReq/Sponsors';
import Profile from './pages/authReq/Profile';
import Admin from './pages/authReq/Admin';
import PaymentSuccess from './pages/authReq/PaymentSuccess';
import Subscribe from './pages/authReq/Subscribe';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ScrollToTop from './components/ScrollToTop';
import AuthHeader from './components/common/AuthHeader';

// Other
import axios from 'axios';
import config from './config';

function App() {
  const [userAuth, setUserAuth] = useState(false);
  const [user, setUser] = useState({
    email: "",
    isAdmin: false,
    isSubscribed: false,
    subscriptionPlan: "",
    currentPeriodEnd: 0,
    stripeCustomerId: "",
    cancelAtPeriodEnd: false
  });

  const getUserInfo = async () => {
    // Get user profile information
    await axios.get(`${config.backendUrl}users/me`, {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    }).then((res) => {
      setUser(res.data);
      console.log(res.data);
    }).catch((err) => {
      console.log(err);
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      if (user.email === "") {
        await getUserInfo();
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      setUserAuth(true);

      if (user.email === "") {
        fetchData();
      }
    }
  }, [])

  const Root = () => {
    return <>
      {!userAuth ? <Header /> : <AuthHeader isAdmin={user.isAdmin} />}
      <ScrollToTop />
      <Outlet />
      <Footer auth={userAuth} />
    </>
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home isSubscribed={user.isSubscribed} email={user.email} />} />
        <Route path="/*" element={<Home isSubscribed={user.isSubscribed} email={user.email} />} />
        <Route path="/login/" element={<Login userAuth={userAuth} isSubscribed={user.isSubscribed} />} />
        <Route path="/signup/" element={<Signup userAuth={userAuth} isSubscribed={user.isSubscribed} />} />
        <Route path="/change-password/" element={<ChangePassword />} />
        <Route path="/review/" element={<Review />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
        {/* Authed Routes */}
        {userAuth && <Route path="/profile/" element={<Profile
          userSubscribed={user.isSubscribed}
          userEmail={user.email}
          subscriptionPlan={user.subscriptionPlan}
          currentPeriodEnd={user.currentPeriodEnd}
          cancelAtPeriodEnd={user.cancelAtPeriodEnd}
        />} />}
        {userAuth && <Route path="/subscribe/" element={<Subscribe isSubscribed={user.isSubscribed} />} />}
        {userAuth && <Route path="/payment-success/" element={<PaymentSuccess />} />}
        {/* Subscriber Routes */}
        {userAuth && user.isSubscribed && <Route path="/sponsors/" element={<Sponsors />} />}
        {/* Admin Routes */}
        {user.isAdmin && <Route path="/admin/" element={<Admin />} />}
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