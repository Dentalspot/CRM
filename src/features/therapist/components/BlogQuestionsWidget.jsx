import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, FileEdit, FileCheck2, ArrowRight, PenTool, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getBlogStats } from '../api/therapistBlogApi';
import logger from '@/lib/utils/logger';
import { getOpenQuestionsCount } from '../api/therapistQuestionsApi';

const BlogQuestionsWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    questionsCount: 0,
    pendingArticles: 0,
    publishedArticles: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [blogStats, questionsCount] = await Promise.all([
          getBlogStats(user.id),
          getOpenQuestionsCount()
        ]);

        setStats({
          questionsCount,
          pendingArticles: blogStats.pending,
          publishedArticles: blogStats.published
        });
      } catch (error) {
        logger.error("Error loading widget stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return (
    <Card className="h-full border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <PenTool className="h-5 w-5 text-purple-600" />
            Blog y Comunidad
          </CardTitle>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Visibilidad
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {/* Statistic 1: Questions */}
              <div className="flex flex-col items-center justify-center p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors">
                <div className="relative">
                  <MessageCircle className="h-6 w-6 text-orange-600 mb-1" />
                  {stats.questionsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                    </span>
                  )}
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.questionsCount}</span>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
                  Preguntas Nuevas
                </span>
              </div>

              {/* Statistic 2: Pending Review */}
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                <FileEdit className="h-6 w-6 text-blue-600 mb-1" />
                <span className="text-2xl font-bold text-gray-800">{stats.pendingArticles}</span>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
                  En Revisión
                </span>
              </div>

              {/* Statistic 3: Published */}
              <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                <FileCheck2 className="h-6 w-6 text-green-600 mb-1" />
                <span className="text-2xl font-bold text-gray-800">{stats.publishedArticles}</span>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">
                  Publicados
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full justify-between group text-sm h-9 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => navigate('/dashboard/therapist/questions')}
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Responder Preguntas
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between group text-sm h-9 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => navigate('/dashboard/therapist/blog')}
              >
                <span className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Mis Artículos
                </span>
                <ArrowRight className="h-3 w-3 text-gray-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        )}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Sparkles className="h-6 w-6 mb-2 opacity-80" />
              <p className="text-sm font-semibold italic">"Tu dedicación transforma vidas"</p>
              <p className="text-xs opacity-90 mt-1">Cada sesión es un paso hacia el bienestar de tus pacientes.</p>
            </div>
      </CardContent>
    </Card>
  );
};

export default BlogQuestionsWidget;