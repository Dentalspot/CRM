import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TYPE_MAP = {
  access: { label: 'Acceso', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  rectification: { label: 'Rectificación', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-700' },
  cancellation: { label: 'Cancelación', icon: XCircle, color: 'bg-red-100 text-red-700' },
  opposition: { label: 'Oposición', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  portability: { label: 'Portabilidad', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
};

const STATUS_MAP = {
  pending: { label: 'Pendiente', class: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'En Proceso', class: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completada', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazada', class: 'bg-red-100 text-red-700' },
};

const ArcoRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('arco_requests')
      .select('*, profiles:user_id(full_name, email)')
      .order('requested_at', { ascending: false });

    if (filter !== 'all') query = query.eq('status', filter);

    const { data, error } = await query;
    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleUpdateStatus = async (id, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'completed' || newStatus === 'rejected') {
      const { data: { user } } = await supabase.auth.getUser();
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.id;
      if (response) updates.response = response;
    }

    const { error } = await supabase
      .from('arco_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Actualizado', description: `Solicitud marcada como ${STATUS_MAP[newStatus].label}` });
      setSelectedRequest(null);
      setResponse('');
      fetchRequests();
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" /> Derechos ARCO
          </h1>
          <p className="text-muted-foreground">Solicitudes de Acceso, Rectificación, Cancelación y Oposición (Ley 19.628)</p>
        </div>
        <Button variant="outline" onClick={fetchRequests}>Actualizar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-600' },
          { label: 'En Proceso', value: stats.in_progress, color: 'text-blue-600' },
          { label: 'Completadas', value: stats.completed, color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'in_progress', 'completed', 'rejected'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todas' : STATUS_MAP[f]?.label || f}
          </Button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No hay solicitudes ARCO</p>
            <p className="text-sm">Las solicitudes de los usuarios aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const typeInfo = TYPE_MAP[req.request_type] || TYPE_MAP.access;
            const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.pending;
            const isSelected = selectedRequest?.id === req.id;

            return (
              <Card key={req.id} className={isSelected ? 'ring-2 ring-purple-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                        <typeInfo.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{typeInfo.label}</span>
                          <Badge className={statusInfo.class}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{req.description || 'Sin descripción'}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-400">
                          <span>{req.profiles?.full_name || 'Usuario'}</span>
                          <span>{req.profiles?.email}</span>
                          <span>{new Date(req.requested_at).toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {req.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, 'in_progress')}>
                          Iniciar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(isSelected ? null : req)}>
                        {isSelected ? 'Cerrar' : 'Gestionar'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <label className="text-sm font-medium">Respuesta al usuario:</label>
                        <textarea
                          className="w-full mt-1 p-3 border rounded-lg text-sm"
                          rows={3}
                          value={response || req.response || ''}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Describe las acciones realizadas..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(req.id, 'completed')}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Completar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(req.id, 'rejected')}>
                          <XCircle className="h-4 w-4 mr-1" /> Rechazar
                        </Button>
                      </div>
                      {req.response && (
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <span className="font-medium">Respuesta anterior:</span> {req.response}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArcoRequestsPage;
