import { useState } from 'react';
import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';

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
import './css/blogs/AllBlogs.css';

//Pages
import Home from './pages/Home';
import AllBlogs from './pages/AllBlogs';
import Review from './pages/Review';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ScrollToTop from './components/ScrollToTop';

// Blogs
import ReachingOut from './pages/blogs/ReachingOut';
import RoleOfPodcastSponsor from './pages/blogs/RoleOfPodcastSponsor';
import RoleOfData from './pages/blogs/RoleOfData';

function App() {
  const [sponsorCount, setSponsorCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [emailCount, setEmailCount] = useState(0);

  const Root = () => {
    return <>
      <Header />
      <ScrollToTop />
      <Outlet />
      <Footer />
    </>
  }

  const getSponsorData = async () => {
    // Get # of sponsors, companies, and emails from API. (https://sponsortrail.com/api/sponsors/count)

  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home companyCount={companyCount} emailCount={emailCount} sponsorCount={sponsorCount} />} />
        <Route path="/*" element={<Home companyCount={companyCount} emailCount={emailCount} sponsorCount={sponsorCount} />} />
        <Route path="/login/" element={<Login />} />
        <Route path="/signup/" element={<Signup />} />
        <Route path="/review/" element={<Review />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
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