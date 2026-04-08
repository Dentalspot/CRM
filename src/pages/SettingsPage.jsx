import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AccountSecuritySettings from '@/features/settings/components/AccountSecuritySettings';
import ReminderSettingsPanel from '@/features/reminders/components/ReminderSettingsPanel';
import BankTransferInfoForm from '@/features/settings/components/BankTransferInfoForm';
import { Bell, Shield, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'account';
  const { user } = useAuth();

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const isTherapist = user?.role === USER_ROLES.THERAPIST || user?.role === USER_ROLES.CLINIC;

  return (
    <div className="container mx-auto py-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Configuración</h1>
      <p className="text-gray-500 mb-8">Administra tu cuenta, seguridad y preferencias.</p>
      
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white p-1 shadow-sm border inline-flex w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="account" className="flex items-center gap-2 min-w-[140px]">
            <Shield className="h-4 w-4" /> Cuenta y Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 min-w-[140px]">
            <Bell className="h-4 w-4" /> Recordatorios
          </TabsTrigger>
          {isTherapist && (
            <TabsTrigger value="billing" className="flex items-center gap-2 min-w-[140px]">
              <CreditCard className="h-4 w-4" /> Datos de Pago
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="account">
            <AccountSecuritySettings />
          </TabsContent>

          <TabsContent value="notifications">
            <ReminderSettingsPanel />
          </TabsContent>

          {isTherapist && (
            <TabsContent value="billing">
              <div className="max-w-3xl">
                <BankTransferInfoForm />
              </div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;