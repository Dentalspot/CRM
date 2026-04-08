
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Code, Quote, Heading1, Heading2, 
  Undo, Redo, Eye, Edit3
} from 'lucide-react';
import { sanitizeHTML } from '@/lib/utils/sanitize';

/* 
 * NOTE: Due to environment restrictions on installing new packages (like Tiptap),
 * this component implements a robust ContentEditable editor with basic formatting capabilities.
 */

const ToolbarButton = ({ onClick, icon: Icon, active, title, disabled }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "h-8 w-8 p-0 hover:bg-muted",
      active && "bg-muted text-primary"
    )}
    title={title}
  >
    <Icon className="h-4 w-4" />
  </Button>
);

const RichTextEditor = ({ content, onChange, className, placeholder = "Escribe aquí..." }) => {
  const editorRef = useRef(null);
  const [activeTab, setActiveTab] = useState('write');
  const [charCount, setCharacterCount] = useState(0);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      if (!editorRef.current.classList.contains('focused')) {
        editorRef.current.innerHTML = content || '';
      }
    }
    setCharacterCount(content ? content.replace(/<[^>]*>/g, '').length : 0);
  }, [content]);

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);
    setCharacterCount(e.currentTarget.textContent.length);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFocus = () => {
    if (editorRef.current) editorRef.current.classList.add('focused');
  };

  const handleBlur = () => {
    if (editorRef.current) editorRef.current.classList.remove('focused');
  };

  return (
    <div className={cn("border rounded-md bg-background shadow-sm flex flex-col", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b px-2 py-1 bg-muted/20">
          <div className="flex items-center gap-1 flex-wrap">
            {activeTab === 'write' && (
              <>
                <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Negrita (Ctrl+B)" />
                <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Cursiva (Ctrl+I)" />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} icon={Heading1} title="Título 1" />
                <ToolbarButton onClick={() => execCommand('formatBlock', 'H3')} icon={Heading2} title="Título 2" />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Lista" />
                <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Lista numerada" />
                <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Cita" />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton onClick={() => {
                  const url = prompt('URL del enlace:');
                  if (url) execCommand('createLink', url);
                }} icon={LinkIcon} title="Enlace" />
                <ToolbarButton onClick={() => {
                  const url = prompt('URL de la imagen:');
                  if (url) execCommand('insertImage', url);
                }} icon={ImageIcon} title="Imagen" />
              </>
            )}
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="write" className="text-xs h-7 px-3">
              <Edit3 className="w-3 h-3 mr-1.5" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-7 px-3">
              <Eye className="w-3 h-3 mr-1.5" />
              Vista Previa
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 relative min-h-[300px]">
          <TabsContent value="write" className="mt-0 h-full">
            <div
              ref={editorRef}
              className="prose max-w-none p-4 h-full min-h-[300px] outline-none focus:ring-0 overflow-auto"
              contentEditable
              onInput={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
              data-placeholder={placeholder}
            />
            {(!content || content === '<br>') && (
              <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
                {placeholder}
              </div>
            )}
          </TabsContent>
          <TabsContent value="preview" className="mt-0 h-full">
            <div 
              className="prose max-w-none p-4 h-full overflow-auto bg-muted/10"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }} 
            />
          </TabsContent>
        </div>
      </Tabs>
      <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex justify-end bg-muted/20">
        {charCount} caracteres
      </div>
    </div>
  );
};

export default RichTextEditor;
