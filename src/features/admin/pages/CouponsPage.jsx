import React from 'react';
import { Helmet } from 'react-helmet-async';
import CouponManagement from '@/features/admin/components/CouponManagement';

const CouponsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Helmet>
        <title>Gestión de Cupones | Admin DentalSpot</title>
        <meta name="description" content="Administra cupones de descuento y promociones." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cupones de Descuento</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Crea, edita y monitorea el rendimiento de tus códigos promocionales.
        </p>
      </div>

      <CouponManagement />
    </div>
  );
};

export default CouponsPage;