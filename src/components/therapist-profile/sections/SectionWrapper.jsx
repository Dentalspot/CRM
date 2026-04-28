import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * @typedef {Object} SectionWrapperProps
 * @property {React.ReactNode} children - Contenido principal de la sección.
 * @property {string} title - Título de la sección.
 * @property {string} [description] - Descripción opcional de la sección.
 * @property {string} [className] - Clases CSS adicionales para la tarjeta.
 */

/**
 * Componente envoltorio para las secciones del perfil, proporcionando un estilo consistente
 * con título, descripción y contenido.
 *
 * @param {SectionWrapperProps} props - Propiedades del componente.
 * @returns {JSX.Element} Un elemento Card que envuelve el contenido de la sección.
 */
const SectionWrapper = ({ children, title, description, className }) => {
  return (
    <Card className={cn("overflow-hidden rounded-lg shadow-lg border-t-4 border-primary", className)}>
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-gray-100">
        <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-2 text-md text-gray-600 leading-relaxed">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 bg-white">
        {children}
      </CardContent>
    </Card>
  );
};

export default SectionWrapper;