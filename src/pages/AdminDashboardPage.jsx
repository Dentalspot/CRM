import React, { useEffect } from 'react';// Panel admin con overview, membresías y analíticas
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Users, Tag, CreditCard, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import MembershipRevenueChart from '@/features/admin/components/MembershipRevenueChart';

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
      <Helmet>
        <title>Panel de Administrador | FonoKit</title>
        <meta name="description" content="Panel de administración para gestionar la plataforma FonoKit." />
      </Helmet>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
          <p className="text-gray-500 mt-1">Gestión completa de la plataforma.</p>
        </div>
        <div className="text-sm text-gray-400">
          Última actualización: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="memberships" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Membresías</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Analíticas</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <MembershipRevenueChart />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/admin/patients" className="block group">
              <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">Pacientes</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">Gestión</div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    Ver base de datos <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/coupons" className="block group">
              <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-green-500 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">Cupones</CardTitle>
                  <Tag className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">Descuentos</div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    Administrar códigos <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/plans" className="block group">
              <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-500 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 group-hover:text-purple-600 transition-colors">Planes</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">Suscripciones</div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center">
                    Configurar precios <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships" className="mt-6">
          <MembershipRevenueChart />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes y Analíticas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">Las métricas detalladas de uso y retención se mostrarán aquí a medida que se recopilen datos.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;