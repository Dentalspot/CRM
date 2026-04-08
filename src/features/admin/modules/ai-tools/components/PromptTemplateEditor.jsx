import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * Editor for creating and testing prompt templates.
 */
const PromptTemplateEditor = ({ template, onSave }) => {
  return (
    <div className="space-y-4">
      <Textarea placeholder="Escribe tu prompt aquí... usa {{variable}}" />
      <Button onClick={onSave}>Guardar Template</Button>
    </div>
  );
};

export default PromptTemplateEditor;