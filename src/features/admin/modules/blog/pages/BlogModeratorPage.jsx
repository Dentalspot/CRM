import React from 'react';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { blogApi } from '../api/blogApi';
import BlogModerationCard from '../components/BlogModerationCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const BlogModeratorPage = () => {
  const { posts, loading, refetch } = useBlogPosts({ status: 'pending_review' });
  const { toast } = useToast();

  const handleApprove = async (id) => {
    try {
      await blogApi.publishPost(id);
      toast({ title: "Artículo aprobado y publicado" });
      refetch();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo aprobar el artículo" });
    }
  };

  const handleReject = async (id, feedback) => {
    try {
      // In a real app, you would send the feedback to the user via email or notification
      await blogApi.updatePost(id, { status: 'draft' }); 
      toast({ title: "Artículo rechazado", description: "Se ha devuelto a borrador." });
      refetch();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo rechazar el artículo" });
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderación</h1>
        <p className="text-muted-foreground">Revisión de artículos pendientes de publicación.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground text-lg">No hay artículos pendientes de revisión. ¡Todo al día!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <BlogModerationCard 
              key={post.id} 
              post={post} 
              onApprove={handleApprove} 
              onReject={handleReject} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogModeratorPage;