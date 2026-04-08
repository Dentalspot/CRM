
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { useBlogPermissions } from '../hooks/useBlogPermissions';
import { useBlogSearch } from '../hooks/useBlogSearch';
import { blogApi } from '../api/blogApi';
import { useToast } from '@/components/ui/use-toast';
import BlogTable from '../components/BlogTable';
import BlogFilters from '../components/BlogFilters';
import BlogDeleteModal from '../components/BlogDeleteModal';

const BlogListPage = () => {
  const { 
    query: searchTerm, 
    setQuery: setSearchTerm, 
    debouncedQuery 
  } = useBlogSearch();
  
  const { 
    posts, 
    loading, 
    refetch, 
    filters, 
    updateFilters,
    totalCount 
  } = useBlogPosts({ search: debouncedQuery });
  
  const { canCreatePost, canEditPost, canDeletePost } = useBlogPermissions();
  const { toast } = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await blogApi.deletePost(postToDelete.id);
      toast({ title: "Artículo eliminado", description: "El artículo ha sido eliminado correctamente." });
      refetch();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el artículo." });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const handlePublish = async (post) => {
    try {
      await blogApi.publishPost(post.id);
      toast({ title: "Artículo publicado", description: `"${post.title}" ahora está en el blog público.` });
      refetch();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo publicar el artículo." });
    }
  };

  const handleArchive = async () => {
     if (!postToDelete) return;
     setIsDeleting(true);
     try {
       await blogApi.archivePost(postToDelete.id);
       toast({ title: "Artículo archivado", description: "El artículo ha sido movido al archivo." });
       refetch();
     } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "No se pudo archivar el artículo." });
     } finally {
       setIsDeleting(false);
       setDeleteModalOpen(false);
       setPostToDelete(null);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground">Gestiona los artículos y noticias de la plataforma.</p>
        </div>
        {canCreatePost && (
          <Button asChild>
            <Link to="/admin/blog/new">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Artículo
            </Link>
          </Button>
        )}
      </div>

      <BlogFilters 
        filters={filters} 
        onFilterChange={updateFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <BlogTable
        posts={posts}
        isLoading={loading}
        onDelete={handleDeleteClick}
        onPublish={handlePublish}
        canEdit={canEditPost}
        canDelete={canDeletePost}
      />
      
      {/* Simple Pagination Controls */}
      <div className="flex justify-end gap-2">
         <Button 
           variant="outline" 
           disabled={filters.page === 0 || loading}
           onClick={() => updateFilters({ page: filters.page - 1 })}
         >
           Anterior
         </Button>
         <Button 
           variant="outline" 
           disabled={(filters.page + 1) * filters.limit >= totalCount || loading}
           onClick={() => updateFilters({ page: filters.page + 1 })}
         >
           Siguiente
         </Button>
      </div>

      <BlogDeleteModal 
        open={deleteModalOpen} 
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onArchive={handleArchive}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default BlogListPage;
