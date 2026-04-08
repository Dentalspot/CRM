import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Prefijo de rutas privadas (dashboard tiene layout propio)
const DASHBOARD_PREFIX = '/dashboard';

const Layout = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith(DASHBOARD_PREFIX);

  // 🔐 El dashboard usa su propio layout (DashboardLayout)
  if (isDashboard) {
    return <Outlet />;
  }

  // 🌍 Layout público (landing, blog, planes, auth, etc.)
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-grow"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Layout;