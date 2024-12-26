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
import './css/pages/Subscribe.css'
import './css/pages/authReq/Sponsors.css';
import './css/pages/authReq/Profile.css';
import './css/pages/authReq/Admin.css';
import './css/pages/authReq/NavMenu.css'

//Pages
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangePassword from './pages/ChangePassword';

// Authed Pages
import Review from './pages/Review';
import Sponsors from './pages/authReq/Sponsors';
import Profile from './pages/authReq/Profile';
import Admin from './pages/authReq/Admin';
import PaymentSuccess from './pages/authReq/PaymentSuccess';
import Purchase from './pages/authReq/Purchase';

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

function App() {
  const [userAuth, setUserAuth] = useState(false);
  const [user, setUser] = useState({
    email: "",
    isAdmin: false,
    purchased: false,
    stripeCustomerId: "",
  });

  const [dbInfo, setDbInfo] = useState({
    sponsors: 0,
    newsletters: 0,
    lastUpdated: ""
  });

  const getDbInfo = async () => {
    // Get database info
    const dbInfo = await axios.get(`${config.backendUrl}sponsors/db-info`, {
      headers: {
        'x-auth-token': localStorage.getItem('token')
      }
    });

    console.log(dbInfo.data);

    setDbInfo(dbInfo.data);
  }

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
    const fetchData = async (num: number) => {
      if (num === 1) {
        await getUserInfo();
      }
      else if (num === 2) {
        await getDbInfo();
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      setUserAuth(true);

      if (user.email === "") {
        fetchData(1);
      }
    }
    if (dbInfo.sponsors === 0 && !window.location.href.includes('localhost')) {
      fetchData(2);
    }
  }, [])

  const Root = () => {
    //TODO: Change to !userAuth
    if (!userAuth) { // Default Navbar (should always be on home page)
      return <><Header />
        <ScrollToTop />
        <Outlet />
        <Footer auth={userAuth} />
      </>;

    }
    else { // Authed NavMenu (aligns on left side of screen vertically)
      return <div className="authed-app">
        <NavMenu isAdmin={user.isAdmin} purchased={user.purchased} />
        <ScrollToTop />
        <div className="authed-app__content">
          <Outlet />
          <Footer auth={userAuth} />
        </div>
      </div>
    }
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} purchased={user.purchased} email={user.email} sponsorCount={dbInfo.sponsors} />} />
        <Route path="/*" element={<Home lastUpdated={dbInfo.lastUpdated} newsletterCount={dbInfo.newsletters} purchased={user.purchased} email={user.email} sponsorCount={dbInfo.sponsors} />} />
        <Route path="/login/" element={<Login userAuth={userAuth} purchased={user.purchased} />} />
        <Route path="/signup/" element={<Signup userAuth={userAuth} purchased={user.purchased} />} />
        <Route path="/change-password/" element={<ChangePassword />} />
        <Route path="/change-password-final" element={<ChangePasswordFinal />} />
        <Route path="/feedback/" element={<Review email={user.email} />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
        {/* Authed Routes */}
        {userAuth && <Route path="/checkout/" element={<Purchase purchased={user.purchased} sponsorCount={dbInfo.sponsors} />} />}
        {userAuth && <Route path="/profile/" element={<Profile
          purchased={user.purchased}
          userEmail={user.email}
        />} />}
        {userAuth && <Route path="/payment-success/" element={<PaymentSuccess />} />}
        {/* Subscriber Routes userAuth && user.isSubscribed &&  */}
        {user.purchased && <Route path="/sponsors/" element={<Sponsors sponsors={dbInfo.sponsors} newsletters={dbInfo.newsletters} lastUpdated={dbInfo.lastUpdated} />} />}
        {/* If users arnt subscribed, implement this route for sponsors */<Route path="/sponsors/" element={<Purchase purchased={user.purchased} sponsorCount={dbInfo.sponsors} />} />}
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