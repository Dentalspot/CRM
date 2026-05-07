/**
 * @file src/components/search/SearchResultsMap.jsx
 * 
 * Mapa interactivo de resultados de búsqueda.
 * Muestra marcadores para clínicas y terapeutas con información detallada.
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
// CSS de leaflet acá (no en main.jsx) para no bloquear el render inicial
// del resto de la app — solo se carga cuando alguien usa el mapa.
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import logger from '@/lib/utils/logger';

// Fix para iconos de Leaflet con Vite/Webpack
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado morado
const customPurpleIcon = new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#7c3aed"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `)}`,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

// Componente para auto-ajustar el zoom del mapa
const MapBoundsAdjuster = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (!markers || markers.length === 0) return;

    // Pequeño delay para asegurar que el mapa está listo
    const timer = setTimeout(() => {
      try {
        const bounds = new LatLngBounds(markers.map(m => [m.lat, m.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { 
            padding: [50, 50], 
            maxZoom: 15,
            animate: true 
          });
        }
      } catch (error) {
        logger.warn('Error ajustando bounds del mapa:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [markers, map]);

  return null;
};

const SearchResultsMap = ({ therapists = [], loading = false }) => {
  const mapRef = useRef(null);

  // Extraer y normalizar marcadores
  const markers = useMemo(() => {
    if (!Array.isArray(therapists)) return [];
    
    const result = [];
    const processedIds = new Set(); // Para evitar duplicados exactos si los hubiera

    therapists.forEach(therapist => {
      const therapistBase = {
        id: therapist.id || therapist.therapist_id,
        name: therapist.full_name || therapist.name || 'Profesional',
        slug: therapist.public_slug || therapist.slug || therapist.custom_url,
        title: therapist.professional_title,
        avatar_url: therapist.avatar_url,
      };

      // 1. Extraer de clínicas (Prioridad)
      const clinics = Array.isArray(therapist.clinics) ? therapist.clinics : [];
      let hasClinicMarkers = false;

      clinics.forEach(clinic => {
        if (
          clinic &&
          typeof clinic.latitude === 'number' &&
          typeof clinic.longitude === 'number' &&
          clinic.latitude !== 0 && 
          clinic.longitude !== 0
        ) {
          const markerId = `${therapistBase.id}-c-${clinic.id}`;
          if (!processedIds.has(markerId)) {
            result.push({
              id: markerId,
              lat: clinic.latitude,
              lng: clinic.longitude,
              type: 'clinic',
              therapist: therapistBase,
              clinic: {
                name: clinic.name,
                address: clinic.address,
                modality: clinic.modality,
              },
            });
            processedIds.add(markerId);
            hasClinicMarkers = true;
          }
        }
      });

      // 2. Extraer de ubicación directa del terapeuta (si no tiene clínicas o como fallback)
      // Solo agregamos si no se agregaron clínicas, para no saturar el mapa con la misma info
      if (!hasClinicMarkers && 
          typeof therapist.latitude === 'number' && 
          typeof therapist.longitude === 'number' &&
          therapist.latitude !== 0 &&
          therapist.longitude !== 0
      ) {
        const markerId = `${therapistBase.id}-direct`;
        if (!processedIds.has(markerId)) {
          result.push({
            id: markerId,
            lat: therapist.latitude,
            lng: therapist.longitude,
            type: 'therapist',
            therapist: therapistBase,
            clinic: null,
          });
          processedIds.add(markerId);
        }
      }
    });

    return result;
  }, [therapists]);

  // UI: Estado de Carga
  if (loading) {
    return (
      <div className="h-full w-full bg-gray-50 rounded-xl border flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  // UI: Estado Vacío (Sin marcadores)
  if (markers.length === 0) {
    return (
      <div className="h-full w-full bg-gray-50 rounded-xl border flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="bg-purple-100 p-4 rounded-full mb-4">
          <MapPin className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1">Mapa no disponible</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          {therapists.length === 0
            ? 'No hay profesionales para mostrar. Intenta ajustar tus filtros.'
            : 'Los profesionales encontrados no tienen ubicación geográfica registrada.'}
        </p>
      </div>
    );
  }

  // Centro por defecto (Santiago, Chile) - Solo usado si el ajuste automático falla
  const defaultCenter = [-33.4489, -70.6693]; 

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border shadow-sm relative z-0">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full min-h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsAdjuster markers={markers} />

        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={customPurpleIcon}
            title={marker.therapist.name}
            alt={`Ubicación de ${marker.therapist.name}`}
          >
            <Popup maxWidth={280} className="purple-popup">
              <div className="font-sans">
                {/* Header del Popup */}
                <div className="flex items-center gap-3 mb-3 border-b pb-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {marker.therapist.avatar_url ? (
                      <img
                        src={marker.therapist.avatar_url}
                        alt={`Foto de ${marker.therapist.full_name || 'profesional'}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-purple-100 text-purple-600 text-xs font-bold">
                        {marker.therapist.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 leading-tight">
                      {marker.therapist.name}
                    </h4>
                    {marker.therapist.title && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {marker.therapist.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info de la Clínica */}
                {marker.clinic ? (
                  <div className="bg-gray-50 p-2.5 rounded-lg mb-3 border border-gray-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-xs text-gray-800">
                        {marker.clinic.name}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          marker.clinic.modality === 'online' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {marker.clinic.modality === 'online' ? 'Online' : 'Presencial'}
                      </Badge>
                    </div>
                    {marker.clinic.address && (
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500 leading-snug">
                          {marker.clinic.address}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-2 rounded-lg mb-3">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ubicación aproximada
                    </p>
                  </div>
                )}

                {/* Footer / CTA */}
                {marker.therapist.slug ? (
                  <Link
                    to={`/${marker.therapist.slug}`}
                    className="block w-full text-center text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                  >
                    Ver Perfil Completo
                  </Link>
                ) : (
                  <button disabled className="block w-full text-center text-xs text-gray-400 bg-gray-100 rounded-md py-2 cursor-not-allowed">
                    Perfil no disponible
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default SearchResultsMap;