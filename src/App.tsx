import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';

// CSS
import './css/App.css';
import './css/Home.css';
import './css/Header.css';
import './css/Footer.css';
import './css/Review.css';
import './css/PrivacyPolicy.css';
import './css/TOS.css';
import './css/blogs/AllBlogs.css';

// Pages
import Home from './pages/Home';
import AllBlogs from './pages/AllBlogs';
import Review from './pages/Review';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TOS from './pages/TOS';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';

// Blogs
import ReachingOut from './pages/blogs/ReachingOut';
import RoleOfPodcastSponsor from './pages/blogs/RoleOfPodcastSponsor';
import RoleOfData from './pages/blogs/RoleOfData';

/**
 * TODO: 
 * - Add Footer -> DONE
 * - Add Pages:
 * - - Home - DONE
 * - - Blog Page (Minimum 3 Posts) - DONE
 * - Build the bot, show some example data - 
 */

function App() {
  const Root = () => {
    return <>
      <Header />
      <Outlet />
      <Footer />
    </>
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route index element={<Home />} />
        <Route path="/*" element={<Home />} />
        <Route path="/review/" element={<Review />} />
        <Route path="/privacy-policy/" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service/" element={<TOS />} />
        <Route path="/blogs/" element={<AllBlogs />} />
        <Route path="/blogs/5-tips-reaching-out/" element={<ReachingOut />} />
        <Route path="/blogs/the-role-of-podcast-sponsors/" element={<RoleOfPodcastSponsor />} />
        <Route path="/blogs/data-driven-approach" element={<RoleOfData />} />
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