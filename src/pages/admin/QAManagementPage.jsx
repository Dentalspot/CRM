
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageCircle, FileText, Loader2 } from 'lucide-react';
import QuestionList from '@/components/qa/QuestionList';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const QAManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('patient_questions')
        .select('id, title, body, status, created_at, patient_id, specialty_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedData = (data || []).map(q => ({
        ...q,
        category: { name: 'General' }
      }));

      setQuestions(formattedData);
    } catch (error) {
      logger.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchQuestions, 400);
    return () => clearTimeout(timeoutId);
  }, [fetchQuestions]);

  const handleRespond = async (questionId) => {
    // Create a blog post draft from this question
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title: `Respuesta a: ${question.title}`,
          content: `<p>Pregunta del paciente: "${question.body}"</p><hr/><p>Respuesta:</p>`,
          question_id: questionId,
          status: 'draft',
          slug: `respuesta-${questionId.slice(0, 8)}-${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Update question status
      await supabase
        .from('patient_questions')
        .update({ status: 'answered' })
        .eq('id', questionId);

      toast({ title: 'Artículo creado como borrador' });
      navigate(`/admin/blog/${post.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const pendingCount = questions.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preguntas de la Comunidad</h2>
          <p className="text-sm text-muted-foreground mt-1">Responde preguntas de pacientes como artículos del blog</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/blog/moderation')}>
          <MessageCircle className="w-4 h-4 mr-2" /> Ver Moderación Pendiente
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar preguntas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="answered">Respondidas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>{statusFilter === 'pending' ? 'No hay preguntas pendientes' : 'No se encontraron preguntas.'}</p>
          </div>
        ) : (
          <div className="divide-y">
            {questions.map(q => (
              <div key={q.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{q.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{q.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(q.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <Badge variant={q.status === 'pending' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {q.status === 'pending' ? 'Pendiente' : q.status === 'answered' ? 'Respondida' : q.status}
                      </Badge>
                    </div>
                  </div>
                  {q.status === 'pending' && (
                    <Button size="sm" onClick={() => handleRespond(q.id)} className="shrink-0">
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Responder como artículo
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QAManagementPage;
