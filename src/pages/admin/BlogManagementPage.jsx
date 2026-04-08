import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter } from 'lucide-react';
import ArticleGrid from '@/components/blog/ArticleGrid';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Fake Data
const FAKE_ARTICLES = [
  { id: 1, title: 'Beneficios de la odontología', status: 'published', views_count: 120, created_at: new Date().toISOString(), category: { name: 'Infantil' }, excerpt: 'Descubre cómo ayuda...' },
  { id: 2, title: 'Ejercicios para casa', status: 'draft', views_count: 0, created_at: new Date().toISOString(), category: { name: 'Adultos' }, excerpt: 'Lista de ejercicios...' },
];

const BlogManagementPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [content, setContent] = useState('');

  return (
<div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Artículos</h2>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Nuevo Artículo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Crear Artículo</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  <div className="grid gap-4 py-4">
                    <Input placeholder="Título del artículo" className="text-lg font-bold" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Slug (URL amigable)" />
                      <Input placeholder="Categoría" />
                    </div>
                    <RichTextEditor 
                      content={content} 
                      onChange={setContent} 
                      className="min-h-[400px]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                  <Button>Guardar Borrador</Button>
                  <Button variant="default" className="bg-green-600 hover:bg-green-700">Publicar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar artículos..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="published">Publicados</TabsTrigger>
              <TabsTrigger value="drafts">Borradores</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <ArticleGrid articles={FAKE_ARTICLES} isAdmin />
            </TabsContent>
            <TabsContent value="published" className="mt-6">
              <ArticleGrid articles={FAKE_ARTICLES.filter(a => a.status === 'published')} isAdmin />
            </TabsContent>
            <TabsContent value="drafts" className="mt-6">
              <ArticleGrid articles={FAKE_ARTICLES.filter(a => a.status === 'draft')} isAdmin />
            </TabsContent>
          </Tabs>
    </div>
  );
};

export default BlogManagementPage;