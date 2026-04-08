import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-background to-muted/30"
    >
      <AlertTriangle className="h-24 w-24 text-destructive mb-8 animate-pulse" />
      <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
        404
      </h1>
      <h2 className="text-3xl font-semibold text-foreground mb-3">
        ¡Ups! Página no encontrada.
      </h2>
      <p className="text-lg text-muted-foreground max-w-md mb-10">
        Parece que te has perdido en el ciberespacio. La página que buscas no existe o ha sido movida.
      </p>
      <div className="flex space-x-4">
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Volver al Inicio
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/contact">Contactar Soporte</Link>
        </Button>
      </div>
      <div className="mt-16">
        <img  className="max-w-xs md:max-w-sm opacity-80" alt="Ilustración de una persona perdida mirando un mapa" src="https://images.unsplash.com/photo-1535642147056-37b87c7e3042" />
      </div>
    </motion.div>
  );
};

export default NotFoundPage;