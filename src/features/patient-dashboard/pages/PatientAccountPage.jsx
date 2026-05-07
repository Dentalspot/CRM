/**
 * Página dedicada de cuenta + privacidad para PACIENTES.
 *
 * Antes el sidebar del paciente llevaba a /dashboard/profile
 * (TherapistProfileDashboardPage), que tiene tabs irrelevantes
 * (Formación, DentalLevel, Marketplace, Plantillas, etc).
 *
 * Esta página separada da al paciente solo lo que le aplica:
 *   - Cuenta y Seguridad (cambio password, MFA futuro)
 *   - Privacidad y Datos (ARCO Ley 21.719: descargar datos,
 *     historial de accesos, eliminar cuenta)
 */

import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, ShieldCheck } from 'lucide-react';

const AccountSecuritySettings = lazy(() => import('@/features/settings/components/AccountSecuritySettings'));
const PrivacySection = lazy(() => import('@/features/account/components/PrivacySection'));

const Loading = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const PatientAccountPage = () => {
  return (
    <>
      <Helmet>
        <title>Mi Cuenta | DentalSpot</title>
      </Helmet>

      <div className="container mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestioná tu seguridad y los datos personales que tenemos sobre vos.
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="security" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span>Privacidad y Datos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security">
            <Suspense fallback={<Loading />}>
              <AccountSecuritySettings />
            </Suspense>
          </TabsContent>

          <TabsContent value="privacy">
            <Suspense fallback={<Loading />}>
              <PrivacySection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default PatientAccountPage;
