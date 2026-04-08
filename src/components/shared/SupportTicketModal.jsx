import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logger from '@/lib/utils/logger';
import { AlertCircle, CheckCircle2, Send, Bug, HelpCircle, Lightbulb, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { value: 'technical', label: 'Error / Bug', icon: Bug, color: 'text-red-500' },
  { value: 'general', label: 'Consulta general', icon: HelpCircle, color: 'text-blue-500' },
  { value: 'billing', label: 'Problema de pago', icon: AlertTriangle, color: 'text-orange-500' },
  { value: 'account', label: 'Problema de cuenta', icon: AlertCircle, color: 'text-purple-500' },
  { value: 'other', label: 'Otro / Sugerencia', icon: Lightbulb, color: 'text-amber-500' },
];

const SupportTicketModal = ({ open, onOpenChange }) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.category) return;

    setSending(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        status: 'open',
        metadata: {
          user_email: user.email,
          user_name: profile?.full_name || '',
          user_role: profile?.role || '',
          url: window.location.href,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      });

    setSending(false);

    if (insertError) {
      logger.error('Error creating ticket:', insertError);
      setError('No se pudo enviar tu reporte. Intenta de nuevo.');
    } else {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setForm({ title: '', description: '', category: '', priority: 'medium' });
        onOpenChange(false);
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-teal-500" />
            Reportar un problema
          </DialogTitle>
          <DialogDescription>
            Describe tu problema y nuestro equipo lo revisará lo antes posible.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium text-green-700">Reporte enviado</p>
            <p className="text-sm text-gray-500 text-center">
              Nuestro equipo revisará tu caso y te contactará si necesita más información.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Categoría</label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <cat.icon className={`h-4 w-4 ${cat.color}`} />
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Título</label>
              <Input
                placeholder="Ej: No puedo agendar una cita"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción</label>
              <Textarea
                placeholder="Describe el problema con el mayor detalle posible. ¿Qué estabas haciendo? ¿Qué esperabas que pasara?"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Prioridad</label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja — puedo seguir trabajando</SelectItem>
                  <SelectItem value="medium">Media — me dificulta el trabajo</SelectItem>
                  <SelectItem value="high">Alta — no puedo continuar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={sending || !form.title.trim() || !form.description.trim() || !form.category}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {sending ? 'Enviando...' : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar reporte
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketModal;
