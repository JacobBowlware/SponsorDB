import {
  createBrowserRouter, createRoutesFromElements,
  RouterProvider, Route, Outlet
} from 'react-router-dom';
import { useEffect, useState } from 'react';

// CSS
import './css/App.css';
import './css/Home.css';
import './css/Header.css';
import './css/Footer.css';

// Pages
import Home from './pages/Home';

// Components
import Header from './components/common/Header'
import Footer from './components/common/Footer';

/**
 * TODO: 
 * - Finish Home Page.
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
        <Route path="*" element={<Home />} />
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
