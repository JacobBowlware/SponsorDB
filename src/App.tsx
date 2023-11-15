import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';

// CSS
import './css/App.css';
import './css/Home.css';
import './css/Header.css';
import './css/Footer.css';
import './css/blogs/AllBlogs.css';

// Pages
import Home from './pages/Home';
import AllBlogs from './pages/AllBlogs';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';
import ReachingOut from './pages/blogs/ReachingOut';

/**
 * TODO: 
 * - Add Footer -> DONE
 * - Add Pages:
 * - - Home - DONE
 * - - Blog Page (Minimum 3 Posts) -
 */

/*
  BUGS:
  - On page refresh, we get firebase 404 error ->FIXED
  - Blog Page grows too wide on desktop -> FIXED
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
        <Route path="/blogs" element={<AllBlogs />} />
        <Route path="/blogs/5-tips-reaching-out" element={<ReachingOut />} />
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