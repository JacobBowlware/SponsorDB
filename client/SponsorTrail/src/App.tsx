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
import './css/pages/Signup.css';
import './css/pages/Review.css';
import './css/pages/PrivacyPolicy.css';
import './css/pages/TOS.css';
import './css/pages/authReq/Sponsors.css';
import './css/pages/authReq/Profile.css';

//Pages
import Home from './pages/Home';
import Review from './pages/Review';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Authed Pages
import Sponsors from './pages/authReq/Sponsors';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ScrollToTop from './components/ScrollToTop';
import AuthHeader from './components/common/AuthHeader';
import Profile from './pages/authReq/Profile';

/*
TODO:
- APIS's:
- - Login
- - Signup
- - Logout
- - Auth

*/
function App() {
  const [userAuth, setUserAuth] = useState(false);

  useEffect(() => {
    // Check token in local storage
    const token = localStorage.getItem('token');
    if (token) {
      setUserAuth(true);
    }
  }, [])

  const Root = () => {
    return <>
      {!userAuth ? <Header /> : <AuthHeader />}
      <ScrollToTop />
      <Outlet />
      <Footer auth={userAuth} />
    </>
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home />} />
        <Route path="/*" element={<Home />} />
        <Route path="/login/" element={<Login setUserAuth={setUserAuth} />} />
        <Route path="/signup/" element={<Signup />} />
        <Route path="/review/" element={<Review />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
        {/* Authed Routes */}
        {userAuth && <Route path="/sponsors/" element={<Sponsors />} />}
        {userAuth && <Route path="/profile/" element={<Profile />} />}
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