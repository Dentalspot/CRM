import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';


/**
 * Componente unificado para secciones del perfil del terapeuta
 * Combina funcionalidad de SectionWrapper y ProfileSectionCard
 * 
 * @param {string} id - ID único para navegación y scroll
 * @param {string} title - Título de la sección
 * @param {string} description - Descripción opcional
 * @param {React.ReactNode} children - Contenido de la sección
 * @param {string} className - Clases CSS adicionales
 * @param {boolean} withSeparator - Mostrar separador después del header
 * @param {boolean} animated - Habilitar animación de entrada
 */
const ProfileSectionCard = ({
  id,
  title,
  description,
  children,
  className = '',
  withSeparator = false,
  animated = true
}) => {
  const cardContent = (
    <Card
      id={id}
      className={`overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 mb-8 scroll-mt-20 ${className}`}
    >
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-2xl font-semibold text-primary">{title}</CardTitle>
        {description && <CardDescription className="text-md">{description}</CardDescription>}
      </CardHeader>

      {withSeparator && <Separator />}

      <CardContent className="p-6 space-y-6">
        {children}
      </CardContent>
    </Card>
  );

  if (!animated) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {cardContent}
    </motion.div>
  );
};

export default ProfileSectionCard;