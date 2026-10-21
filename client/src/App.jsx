import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { SiteProvider } from './lib/site.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Listing from './pages/Listing.jsx';
import Detail from './pages/Detail.jsx';
import NotFound from './pages/NotFound.jsx';
import { About, Brands, Gallery, Contact, Terms } from './pages/Pages.jsx';

const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-screen bg-foam" />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          element={
            <SiteProvider>
              <Layout />
            </SiteProvider>
          }
        >
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="products" element={<Listing kind="product" />} />
          <Route path="services" element={<Listing kind="service" />} />
          <Route path="solutions/:slug" element={<Detail />} />
          <Route path="brands" element={<Brands />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </MotionConfig>
  );
}
