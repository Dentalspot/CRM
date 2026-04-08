
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogApi } from '../api/blogApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Globe, Trash2, Archive, Calendar, User, Eye, MessageSquare, Share2 } from 'lucide-react';
import { useBlogPermissions } from '../hooks/useBlogPermissions';
import BlogStatusBadge from '../components/BlogStatusBadge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/utils/logger';
import { sanitizeHTML } from '@/lib/utils/sanitize';

const BlogDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { canEditPost, canDeletePost, canViewAnalytics } = useBlogPermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postData = await blogApi.fetchPostById(id);
        setPost(postData);
        // Analytics table may not exist yet — ignore errors
        try {
          const analyticsData = await blogApi.fetchPostAnalytics(id);
          setAnalytics(analyticsData);
        } catch (_) {}
      } catch (err) {
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!post) return <div>No encontrado</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/admin/blog')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex gap-2">
           {canEditPost && (
             <Button variant="outline" asChild>
               <Link to={`/admin/blog/${id}`}>
                 <Edit className="mr-2 h-4 w-4" /> Editar
               </Link>
             </Button>
           )}
           {post.status === 'published' && (
             <Button variant="outline" asChild>
               <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
                 <Globe className="mr-2 h-4 w-4" /> Ver en vivo
               </a>
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
             <div className="flex gap-2 mb-4">
               <BlogStatusBadge status={post.status} />
               {post.category && <span className="bg-muted px-2 py-0.5 rounded text-sm text-muted-foreground">{post.category}</span>}
             </div>
             <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
             <div className="flex items-center text-muted-foreground gap-4 text-sm">
               <span className="flex items-center"><User className="h-3 w-3 mr-1" /> {post.author?.full_name}</span>
               <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {format(new Date(post.created_at), 'dd/MM/yyyy')}</span>
             </div>
          </div>

          {post.featured_image && (
            <img src={post.featured_image} alt={post.title} className="w-full h-[400px] object-cover rounded-xl shadow-sm" />
          )}

          <div 
            className="prose dark:prose-invert max-w-none p-6 border rounded-xl bg-card"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content) }}
          />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {canViewAnalytics && analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendimiento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="flex items-center text-sm"><Eye className="h-4 w-4 mr-2" /> Vistas</span>
                  <span className="font-bold">{analytics.views}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="flex items-center text-sm"><MessageSquare className="h-4 w-4 mr-2" /> Comentarios</span>
                  <span className="font-bold">{analytics.comments_count}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="flex items-center text-sm"><Share2 className="h-4 w-4 mr-2" /> Compartidos</span>
                  <span className="font-bold">{analytics.shares_count}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
               <CardTitle className="text-lg">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="block text-muted-foreground">ID del Post</span>
                <code className="bg-muted p-1 rounded text-xs">{post.id}</code>
              </div>
              <div>
                <span className="block text-muted-foreground">URL Slug</span>
                <span>{post.slug}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Última actualización</span>
                <span>{format(new Date(post.updated_at || post.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
