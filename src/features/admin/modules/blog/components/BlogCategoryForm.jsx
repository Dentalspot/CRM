import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";

const BlogCategoryForm = ({ defaultValues, onSubmit, isLoading, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: defaultValues || { name: '', slug: '', description: '' }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input 
          id="name" 
          {...register('name', { required: 'El nombre es obligatorio' })} 
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL amigable)</Label>
        <Input 
          id="slug" 
          {...register('slug', { required: 'El slug es obligatorio' })} 
        />
        {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea 
          id="description" 
          {...register('description')} 
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Categoría'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default BlogCategoryForm;