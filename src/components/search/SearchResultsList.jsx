import React from 'react';
import ProfessionalCard from './ProfessionalCard';
import { Skeleton } from '@/components/ui/skeleton';

const SearchResultsList = ({ results = [], loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-56 flex">
            <Skeleton className="w-48 h-full" />
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Intenta ajustar tus filtros de búsqueda. Prueba con otra ciudad o especialidad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((professional) => (
        <ProfessionalCard key={professional.id} professional={professional} />
      ))}
    </div>
  );
};

export default SearchResultsList;