import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const QuestionFormModal = ({ isOpen, onClose, onSubmit, questionToEdit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (questionToEdit) {
      setTitle(questionToEdit.title);
      setBody(questionToEdit.body);
    } else {
      setTitle('');
      setBody('');
    }
  }, [questionToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 10) {
      toast({
        variant: "destructive",
        title: "Título muy corto",
        description: "El título debe tener al menos 10 caracteres.",
      });
      return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit({ title, body });
    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };
  
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{questionToEdit ? 'Editar Pregunta' : 'Enviar Nueva Pregunta'}</DialogTitle>
            <DialogDescription>
              {questionToEdit ? 'Modifica los detalles de tu pregunta.' : 'Describe tu duda para que un profesional pueda ayudarte.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título de la pregunta *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: ¿Cómo puedo mejorar la pronunciación de la /r/?"
                required
              />
               <p className="text-xs text-muted-foreground">Mínimo 10 caracteres.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="body">Describe tu duda (opcional)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Añade más detalles, contexto o ejemplos de tu pregunta."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || title.length < 10}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {questionToEdit ? 'Guardando...' : 'Enviando...'}
                </>
              ) : (
                questionToEdit ? 'Guardar Cambios' : 'Enviar Pregunta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionFormModal;