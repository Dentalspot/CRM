import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  Calendar, 
  Edit, 
  Trash2, 
  Globe, 
  FileEdit,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

// Fetch real articles from Supabase
const fetchMyArticles = async (userId) => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching articles:', error);
    return [];
  }

  return (data || []).map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    status: post.status === 'published' ? 'published' : post.status === 'archived' ? 'archived' : 'draft',
    views: post.views || 0,
    publishedAt: post.published_at ? new Date(post.published_at) : null,
    createdAt: new Date(post.created_at),
    coverImage: post.cover_url,
  }));
};

const ArticleCardSkeleton = () => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-3/4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-4 w-24 mr-4" />
      <Skeleton className="h-4 w-24" />
    </CardFooter>
  </Card>
);

const MyBlogArticlesPage = ({ statusFilter }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Map 'published' route param to tab value, default to 'all'
  const initialTab = statusFilter === 'published' ? 'published' : 'all';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMyArticles(user?.id);
        setArticles(data);
      } catch (error) {
        logger.error("Error loading articles:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar tus artículos.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Update active tab if prop changes (e.g. navigation)
  useEffect(() => {
    if (statusFilter) {
      setActiveTab(statusFilter === 'published' ? 'published' : 'all');
    }
  }, [statusFilter]);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'draft') return matchesSearch && article.status === 'draft';
    if (activeTab === 'published') return matchesSearch && article.status === 'published';
    
    return matchesSearch;
  });

  const handleDelete = (id) => {
    toast({
      title: "Artículo eliminado",
      description: "El artículo ha sido movido a la papelera.",
    });
    setArticles(articles.filter(a => a.id !== id));
  };

  const handleStatusChange = (id, newStatus) => {
    const statusLabel = newStatus === 'published' ? 'publicado' : 'borrador';
    setArticles(articles.map(a => 
      a.id === id ? { ...a, status: newStatus, publishedAt: newStatus === 'published' ? new Date() : a.publishedAt } : a
    ));
    toast({
      title: `Estado actualizado`,
      description: `El artículo ahora está como ${statusLabel}.`,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"><Globe className="w-3 h-3 mr-1" /> Publicado</Badge>;
      case 'draft':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"><FileEdit className="w-3 h-3 mr-1" /> Borrador</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-500 border-gray-300">Archivado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Artículos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el contenido de tu blog, comparte conocimientos y atrae más pacientes.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/therapist/blog/new')} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Crear Nuevo Artículo
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="draft">Borradores</TabsTrigger>
            <TabsTrigger value="published">Publicados</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por título..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          <>
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(article.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.publishedAt 
                            ? format(article.publishedAt, "d 'de' MMMM, yyyy", { locale: es })
                            : `Creado el ${format(article.createdAt, "d 'de' MMMM", { locale: es })}`
                          }
                        </span>
                      </div>
                      <CardTitle className="text-xl font-semibold leading-tight hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/therapist/blog/${article.id}/edit`)}>
                        {article.title}
                      </CardTitle>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/therapist/blog/${article.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/blog/${article.slug}`, '_blank')}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Publicación
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {article.status === 'published' ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(article.id, 'draft')}>
                            <FileEdit className="mr-2 h-4 w-4" /> Convertir a Borrador
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(article.id, 'published')}>
                            <Globe className="mr-2 h-4 w-4" /> Publicar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(article.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                </CardContent>
                
                <CardFooter className="pt-0 flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground gap-4">
                    <div className="flex items-center gap-1" title="Vistas totales">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{article.views} vistas</span>
                    </div>
                    {/* Placeholder for comments count if available */}
                    {/* <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>0 comentarios</span>
                    </div> */}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/therapist/blog/${article.id}/edit`)}>
                      Editar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No se encontraron artículos</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              {searchTerm 
                ? 'No hay resultados para tu búsqueda. Intenta con otros términos o cambia el filtro.' 
                : activeTab !== 'all' 
                  ? `No tienes artículos en estado "${activeTab === 'draft' ? 'Borrador' : 'Publicado'}".`
                  : 'Aún no has escrito ningún artículo. ¡Comparte tu conocimiento con la comunidad!'}
            </p>
            {(searchTerm || activeTab !== 'all') ? (
              <Button variant="link" onClick={() => {setSearchTerm(''); setActiveTab('all');}} className="mt-4">
                Limpiar filtros
              </Button>
            ) : (
              <Button onClick={() => navigate('/dashboard/therapist/blog/new')} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Escribir mi primer artículo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBlogArticlesPage;