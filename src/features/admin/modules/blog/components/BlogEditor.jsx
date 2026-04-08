
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Card, CardContent } from '@/components/ui/card';
import { sanitizeHTML } from '@/lib/utils/sanitize';

const BlogEditor = ({ value, onChange, isSaving }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contenido</h3>
        {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Guardando...</span>}
      </div>
      
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-4">
          <RichTextEditor
            value={value}
            onChange={onChange}
            className="min-h-[400px]"
            placeholder="Escribe el contenido de tu artículo aquí..."
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="prose dark:prose-invert max-w-none pt-6 min-h-[400px]">
              {value ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(value) }} />
              ) : (
                <p className="text-muted-foreground italic">Nada que previsualizar aún.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogEditor;
