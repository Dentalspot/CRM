import React from 'react';
    import { motion } from 'framer-motion';
    import Logo from '@/components/shared/Logo';

    const Splash = () => {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-background fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Logo className="h-20 w-auto" />
          </motion.div>
        </div>
      );
    };

    export default Splash;