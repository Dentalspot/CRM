import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpecialtyAdminMatchView from '@/features/admin/components/specialties/SpecialtyAdminMatchView';
import KeywordsAdminView from '@/features/admin/components/specialties/KeywordsAdminView';
import SuggestedCoursesAdminView from '@/features/admin/components/specialties/SuggestedCoursesAdminView';
import SpecialtyAdminDashboardView from '@/features/admin/components/specialties/SpecialtyAdminDashboardView';
import { Sparkles, Tag, GraduationCap, BarChart3 } from 'lucide-react';

const SpecialtyAdminPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Helmet>
        <title>Gestión de Especialidades | Admin DentalSpot</title>
        <meta name="description" content="Administración de especialidades, palabras clave y cursos sugeridos." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Gestor de Especialidades</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Configura la inteligencia de especialidades, administra palabras clave y sugiere cursos para gamification.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[800px] bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="matching" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="mr-2 h-4 w-4" /> Matching IA
          </TabsTrigger>
          <TabsTrigger value="keywords" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="mr-2 h-4 w-4" /> Palabras Clave
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="mr-2 h-4 w-4" /> Cursos (Gamification)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="focus-visible:outline-none focus-visible:ring-0">
          <SpecialtyAdminDashboardView />
        </TabsContent>

        <TabsContent value="matching" className="focus-visible:outline-none focus-visible:ring-0">
          <SpecialtyAdminMatchView />
        </TabsContent>

        <TabsContent value="keywords" className="focus-visible:outline-none focus-visible:ring-0">
          <KeywordsAdminView />
        </TabsContent>

        <TabsContent value="courses" className="focus-visible:outline-none focus-visible:ring-0">
          <SuggestedCoursesAdminView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpecialtyAdminPage;