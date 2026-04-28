import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ShieldCheck, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeHTML } from '@/lib/utils/sanitize';
import { supabase } from '@/lib/supabaseClient';

/**
 * Modal bloqueante para re-aceptación de documentos legales actualizados.
 * - No se puede cerrar con X ni clic fuera (forceful UX por compliance).
 * - Usuario debe aceptar todos o cerrar sesión.
 */
const LegalReacceptModal = ({ open, pending, accepting, onAccept }) => {
  const { toast } = useToast();
  const [acknowledged, setAcknowledged] = useState(false);
  const [activeTab, setActiveTab] = useState(pending?.[0]?.slug || '');

  const handleAccept = async () => {
    if (!acknowledged) {
      toast({
        variant: 'destructive',
        title: 'Confirmación requerida',
        description: 'Marca la casilla para confirmar que leíste y aceptas los documentos.',
      });
      return;
    }
    const result = await onAccept();
    if (result?.ok === false) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar la aceptación',
        description: result.error?.message || 'Intenta de nuevo.',
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('/auth/login');
  };

  if (!pending || pending.length === 0) return null;

  // Forzar el primer tab seleccionado si no hay activeTab válido
  const currentTab = pending.find(p => p.slug === activeTab) ? activeTab : pending[0].slug;

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Sin botón de cerrar (X) en la esquina
        hideCloseButton
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle>Documentos legales actualizados</DialogTitle>
              <DialogDescription className="mt-1">
                Hemos actualizado nuestros documentos legales. Revisa{' '}
                {pending.length === 1 ? 'el documento' : `los ${pending.length} documentos`} a continuación
                y acéptalos para continuar usando DentalSpot.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {pending.length > 1 ? (
          <div className="flex-1 overflow-hidden flex flex-col px-6">
            <Tabs value={currentTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="self-start">
                {pending.map((doc) => (
                  <TabsTrigger key={doc.slug} value={doc.slug}>
                    {doc.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {pending.map((doc) => (
                <TabsContent
                  key={doc.slug}
                  value={doc.slug}
                  className="flex-1 overflow-y-auto mt-3 prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20"
                >
                  <h3 className="text-base font-semibold mb-2">
                    {doc.title} <span className="text-xs text-muted-foreground font-normal">(versión {doc.version})</span>
                  </h3>
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(doc.content || '<em>Documento sin contenido.</em>') }} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 mt-2">
            <div className="prose prose-sm max-w-none border rounded-lg p-4 bg-muted/20">
              <h3 className="text-base font-semibold mb-2">
                {pending[0].title}{' '}
                <span className="text-xs text-muted-foreground font-normal">(versión {pending[0].version})</span>
              </h3>
              <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(pending[0].content || '<em>Documento sin contenido.</em>') }} />
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t bg-muted/30">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
            />
            <span>
              He leído y acepto{' '}
              {pending.map((d, i) => (
                <span key={d.slug}>
                  <strong>{d.title}</strong>
                  {i < pending.length - 2 ? ', ' : i === pending.length - 2 ? ' y ' : ''}
                </span>
              ))}
              .
            </span>
          </label>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-row gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={accepting}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Cerrar sesión
          </Button>
          <Button onClick={handleAccept} disabled={!acknowledged || accepting}>
            {accepting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Aceptar y continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LegalReacceptModal;
