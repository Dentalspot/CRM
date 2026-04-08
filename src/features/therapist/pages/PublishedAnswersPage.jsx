import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Eye, 
  Calendar, 
  ArrowRight, 
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

// Mock data service
const fetchPublishedAnswers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          questionTitle: '¿Es normal que mi hijo de 3 años tartamudee?',
          answerTitle: 'Tartamudez evolutiva: cuándo preocuparse',
          excerpt: 'La disfluencia en la etapa preescolar es común y a menudo transitoria. Sin embargo, existen señales de alerta que los padres deben conocer para buscar ayuda profesional a tiempo.',
          slug: 'tartamudez-evolutiva-ninos',
          views: 1250,
          publishedAt: new Date(2025, 10, 15),
          category: 'Lenguaje Infantil'
        },
        {
          id: '2',
          questionTitle: 'Ejercicios para mejorar la dicción en adultos',
          answerTitle: '5 Técnicas efectivas para potenciar tu dicción',
          excerpt: 'Una guía práctica con ejercicios de articulación y respiración que puedes realizar diariamente para mejorar la claridad de tu habla en presentaciones y reuniones.',
          slug: 'tecnicas-diccion-adultos',
          views: 890,
          publishedAt: new Date(2025, 10, 10),
          category: 'Habla Adultos'
        },
        {
          id: '3',
          questionTitle: 'Dificultades para tragar después de un ACV',
          answerTitle: 'Disfagia post-ACV: Estrategias de manejo en casa',
          excerpt: 'La rehabilitación de la deglución es fundamental para la recuperación segura. Exploramos las adaptaciones de dieta y posturas seguras recomendadas.',
          slug: 'disfagia-post-acv',
          views: 2100,
          publishedAt: new Date(2025, 9, 28),
          category: 'Neurorehabilitación'
        },
        {
          id: '4',
          questionTitle: 'Mi hijo no pronuncia la R',
          answerTitle: 'El rotacismo: ¿Cuándo y cómo intervenir?',
          excerpt: 'La "R" es uno de los últimos fonemas en adquirirse. Te explico los tiempos esperados de desarrollo y cuándo es necesario iniciar terapia odontológica.',
          slug: 'rotacismo-intervencion',
          views: 3400,
          publishedAt: new Date(2025, 8, 15),
          category: 'Habla Infantil'
        }
      ]);
    }, 800);
  });
};

const AnswerCardSkeleton = () => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-3/4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="py-2">
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter className="pt-4">
      <Skeleton className="h-9 w-32 ml-auto" />
    </CardFooter>
  </Card>
);

const PublishedAnswersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchPublishedAnswers();
        setAnswers(data);
      } catch (error) {
        logger.error("Error loading published answers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las respuestas publicadas.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const getFilteredAndSortedAnswers = () => {
    let result = answers.filter(answer => 
      answer.answerTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.questionTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (activeTab) {
      case 'recent':
        return result.sort((a, b) => b.publishedAt - a.publishedAt);
      case 'popular':
        return result.sort((a, b) => b.views - a.views);
      case 'all':
      default:
        // Default sort typically by date for 'all'
        return result.sort((a, b) => b.publishedAt - a.publishedAt);
    }
  };

  const filteredAnswers = getFilteredAndSortedAnswers();

  const handleViewAnswer = (slug) => {
    // In a real app, this might open a preview modal or navigate to the public blog page
    window.open(`/blog/${slug}`, '_blank');
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Respuestas Publicadas</h1>
          <p className="text-muted-foreground mt-1">
            Biblioteca de tus respuestas a preguntas de pacientes convertidas en artículos.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Todas
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recientes
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Más Vistas
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título o pregunta..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6">
        {loading ? (
          <>
            <AnswerCardSkeleton />
            <AnswerCardSkeleton />
            <AnswerCardSkeleton />
          </>
        ) : filteredAnswers.length > 0 ? (
          filteredAnswers.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-3 w-full">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-md border w-fit">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-slate-700">Pregunta:</span> 
                        <span className="italic">"{item.questionTitle}"</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                            {item.category}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-none">
                            Publicado
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                          {item.answerTitle}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <p className="text-gray-600 leading-relaxed">
                    {item.excerpt}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-3 border-t bg-slate-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Fecha de publicación">
                      <Calendar className="w-4 h-4" />
                      {format(item.publishedAt, "d MMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center gap-1.5" title="Total de vistas">
                      <Eye className="w-4 h-4" />
                      {item.views.toLocaleString()}
                    </div>
                  </div>
                  
                  <Button onClick={() => handleViewAnswer(item.slug)} size="sm" className="group-hover:bg-primary group-hover:text-white transition-colors">
                    Ver Respuesta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No se encontraron respuestas</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              {searchTerm 
                ? 'No hay resultados para tu búsqueda. Intenta con otros términos.' 
                : 'Aún no has publicado respuestas. ¡Responde preguntas de pacientes para crear contenido!'}
            </p>
            {searchTerm && (
              <Button variant="link" onClick={() => {setSearchTerm(''); setActiveTab('all');}} className="mt-4">
                Limpiar búsqueda
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishedAnswersPage;