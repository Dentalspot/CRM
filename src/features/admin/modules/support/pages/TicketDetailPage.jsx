import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketDetail } from '../hooks/useTicketDetail';
import { supportApi } from '../api/supportApi';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Clock, User, Mail, Tag, AlertTriangle,
  CheckCircle2, MessageSquare, Send, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En progreso', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700' },
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ticket, loading, refetch } = useTicketDetail(id);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (status) => {
    setSaving(true);
    try {
      await supportApi.updateTicket(id, {
        status,
        ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      });
      refetch();
    } catch (e) {
      logger.error('Error updating status:', e);
    }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await supportApi.addNote({ ticket_id: id, content: note, author_id: user.id });
      setNote('');
      refetch();
    } catch (e) {
      logger.error('Error adding note:', e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket no encontrado</p>
        <Button variant="outline" onClick={() => navigate('/admin/support/tickets')} className="mt-4">
          Volver a tickets
        </Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
  const meta = ticket.metadata || {};

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/admin/support/tickets')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a tickets
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: es })}
            </span>
            <Badge className={status.color}>{status.label}</Badge>
            <Badge className={priority.color}>{priority.label}</Badge>
            {ticket.category && (
              <Badge variant="outline" className="capitalize">
                <Tag className="h-3 w-3 mr-1" /> {ticket.category}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Notas internas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.notes?.length > 0 ? (
                ticket.notes.map((n, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-700">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {n.author?.full_name || 'Sistema'} — {format(new Date(n.created_at), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">Sin notas</p>
              )}

              <div className="flex gap-2 mt-4">
                <Textarea
                  placeholder="Agregar nota interna..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!note.trim() || saving}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{ticket.user?.full_name || meta.user_name || 'Sin nombre'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{ticket.user?.email || meta.user_email || 'Sin email'}</span>
              </div>
              {(ticket.user?.role || meta.user_role) && (
                <Badge variant="outline" className="capitalize">
                  {ticket.user?.role || meta.user_role}
                </Badge>
              )}
              {meta.url && (
                <p className="text-xs text-gray-400 break-all mt-2">URL: {meta.url}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={ticket.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Cambiar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>

              {ticket.status !== 'resolved' && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                  onClick={() => handleStatusChange('resolved')}
                  disabled={saving}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar resuelto
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
