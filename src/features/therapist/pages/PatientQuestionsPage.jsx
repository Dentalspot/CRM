
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { 
  MessageCircle, 
  Search, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  MessageSquare,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const fetchQuestions = async () => {
  try {
    const { data, error } = await supabase
      .from('patient_questions')
      .select(`id, title, body, status, created_at, patient_id, patient:profiles!patient_questions_patient_id_fkey(full_name)`)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching patient questions:', error);
      return [];
    }

    return (data || []).map(pq => {
      const patientName = pq.patient?.full_name || 'Paciente Desconocido';
      return {
        id: pq.id,
        title: pq.title,
        content: pq.body,
        status: pq.status,
        date: pq.created_at ? new Date(pq.created_at) : new Date(),
        patientName,
        patient_id: pq.patient_id,
        patientInitials: patientName.substring(0, 2).toUpperCase(),
        avatarUrl: null
      };
    });
  } catch (err) {
    logger.error('Unexpected error fetching questions:', err);
    return [];
  }
};

const PatientQuestionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleReply = (questionId) => {
    navigate(`/dashboard/therapist/blog/new?questionId=${questionId}`);
  };

  const filteredQuestions = questions.filter(q => {
    if (!q) return false;
    const matchesSearch = (q.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (q.patientName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && q.status === 'pending';
    if (activeTab === 'published') return matchesSearch && (q.status === 'published' || q.status === 'answered');
    
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge style={{ backgroundColor: '#FBBF24', color: '#fff', border: 'none' }} className="flex gap-1 items-center"><Clock className="w-3 h-3" /> Pendiente</Badge>;
      case 'answered':
        return <Badge style={{ backgroundColor: '#3B82F6', color: '#fff', border: 'none' }} className="flex gap-1 items-center"><CheckCircle className="w-3 h-3" /> Respondida</Badge>;
      case 'published':
        return <Badge style={{ backgroundColor: '#10B981', color: '#fff', border: 'none' }} className="flex gap-1 items-center"><CheckCircle className="w-3 h-3" /> Publicada</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Preguntas de Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y responde las consultas enviadas por tus pacientes.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/therapist/blog/new')}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Nueva Respuesta General
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="published">Publicadas</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título o paciente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((question) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-slate-50/50 pb-3 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={question.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {question.patientInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          {question.patientName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <CalendarDays className="h-3 w-3" />
                          {format(question.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    <div>{getStatusBadge(question.status)}</div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 pb-2">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{question.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {question.content}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-2 pb-4 flex justify-end gap-2 border-t mt-2 bg-slate-50/30">
                  <Button
                    size="sm"
                    onClick={() => handleReply(question.id)}
                    className={question.status === 'pending' ? '' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                  >
                    {question.status === 'pending' ? 'Responder' : 'Editar Respuesta'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay preguntas encontradas</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? 'Intenta ajustar tus términos de búsqueda o filtros.' 
                : 'Aún no has recibido preguntas de tus pacientes.'}
            </p>
            {searchTerm && (
              <Button variant="link" onClick={() => {setSearchTerm(''); setActiveTab('all');}} className="mt-2">
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientQuestionsPage;
