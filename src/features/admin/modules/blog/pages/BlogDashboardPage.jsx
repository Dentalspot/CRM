
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  Edit3, 
  MessageCircle, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { blogApi } from '../api/blogApi';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import logger from '@/lib/utils/logger';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const BlogDashboardPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({ published: 0, pending: 0, drafts: 0, questions: 0 });
  const [recentPosts, setRecentPosts] = useState([]);
  const [recentQuestions, setRecentQuestions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch KPIs & Data using Promise.all
        const [
          pubRes, 
          penRes, 
          drfRes, 
          qRes,
          postsRes,
          questionsDataRes
        ] = await Promise.all([
          blogApi.fetchPosts({ status: 'published', limit: 1 }),
          blogApi.fetchPosts({ status: 'pending_review', limit: 1 }),
          blogApi.fetchPosts({ status: 'draft', limit: 1 }),
          supabase.from('patient_questions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          blogApi.fetchPosts({ status: 'pending_review', limit: 5 }),
          supabase.from('patient_questions')
            .select('*, patient:profiles!patient_id(full_name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setKpis({
          published: pubRes.count || 0,
          pending: penRes.count || 0,
          drafts: drfRes.count || 0,
          questions: qRes.count || 0
        });

        setRecentPosts(postsRes.data || []);
        setRecentQuestions(questionsDataRes.data || []);

      } catch (err) {
        logger.error('Error fetching blog dashboard data:', err);
        setError('No se pudo cargar la información del panel.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const kpiCards = [
    {
      title: 'Publicados',
      value: kpis.published,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      color: 'border-emerald-200 bg-emerald-50'
    },
    {
      title: 'En Revisión',
      value: kpis.pending,
      icon: kpis.pending > 0 ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <Clock className="w-5 h-5 text-amber-500" />,
      color: 'border-amber-200 bg-amber-50',
      actionRequired: kpis.pending > 0
    },
    {
      title: 'Borradores',
      value: kpis.drafts,
      icon: <Edit3 className="w-5 h-5 text-slate-500" />,
      color: 'border-slate-200 bg-slate-50'
    },
    {
      title: 'Preguntas Pendientes',
      value: kpis.questions,
      icon: <MessageCircle className="w-5 h-5 text-blue-500" />,
      color: 'border-blue-200 bg-blue-50'
    }
  ];

  return (
    <PermissionGuard module="blog" action="read">
      <div className="py-8 px-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="p-2 bg-slate-100 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Blog & Contenido</h1>
            <p className="text-slate-500 mt-1">Resumen general de publicaciones y actividad.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Cargando panel de control...</p>
          </div>
        ) : (
          <>
            {/* KPIs Grid 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiCards.map((kpi, idx) => (
                <Card key={idx} className="shadow-sm border transition-all">
                  <CardContent className="p-6 flex flex-col justify-center relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                        <div className="text-3xl font-bold text-slate-800">
                          {kpi.value}
                        </div>
                      </div>
                      <div className={`p-3 rounded-full ${kpi.color}`}>
                        {kpi.icon}
                      </div>
                    </div>
                    {kpi.actionRequired && (
                      <Badge variant="destructive" className="mt-4 w-fit">
                        Requiere acción
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Artículos en revisión */}
              <Card className="lg:col-span-2 shadow-sm border-slate-200 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    Artículos en revisión
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" onClick={() => navigate('/admin/blog/moderation')}>
                    Ir a moderación <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {recentPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center px-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                      <p>No hay artículos pendientes de revisión.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead>Título</TableHead>
                          <TableHead>Autor</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPosts.map((post) => (
                          <TableRow key={post.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[200px]" title={post.title}>{post.title}</span>
                                {post.question_id && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 shrink-0">
                                    Respuesta
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">{post.author?.full_name || 'Desconocido'}</TableCell>
                            <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                              {formatDate(post.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Preguntas recientes */}
              <Card className="shadow-sm border-slate-200 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-slate-500" />
                    Preguntas recientes
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 px-2" onClick={() => navigate('/admin/qa')}>
                    Ver todas
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  {recentQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-center px-4">
                      <MessageCircle className="w-12 h-12 text-slate-300 mb-3" />
                      <p>No hay preguntas pendientes.</p>
                    </div>
                  ) : (
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {recentQuestions.map((q) => (
                        <div key={q.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-900 font-medium line-clamp-2 leading-relaxed" title={q.title || q.body}>
                            "{q.title || q.body}"
                          </p>
                          <div className="flex justify-between items-center mt-3 text-xs">
                            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                              {q.patient?.full_name || 'Paciente anónimo'}
                            </span>
                            <span className="text-slate-400">{formatDate(q.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Accesos rápidos */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 px-1">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                  onClick={() => navigate('/admin/blog/list')}
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-slate-700">Todos los artículos</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                  onClick={() => navigate('/admin/blog/moderation')}
                >
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-slate-700">Moderar artículos</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-6 flex flex-col items-center gap-3 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                  onClick={() => navigate('/admin/blog/categories')}
                >
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-slate-700">Categorías</span>
                </Button>

                <Button 
                  className="h-auto py-6 flex flex-col items-center gap-3 shadow-sm"
                  onClick={() => navigate('/admin/blog/new')}
                >
                  <div className="p-3 bg-white/20 text-white rounded-full">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <span className="font-semibold">Nuevo artículo</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default BlogDashboardPage;
