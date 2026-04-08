import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, RefreshCw, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';

const TYPE_LABELS = { complaint: 'Reclamo', claim: 'Demanda', inquiry: 'Consulta', incident: 'Incidente' };
const STATUS_COLORS = {
  open: 'bg-red-100 text-red-600',
  investigating: 'bg-amber-100 text-amber-600',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  escalated: 'bg-purple-100 text-purple-600',
};
const STATUS_LABELS = { open: 'Abierto', investigating: 'Investigando', resolved: 'Resuelto', closed: 'Cerrado', escalated: 'Escalado' };
const PRIORITY_COLORS = { low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-600', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };

const DisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legal_disputes')
      .select('*, reporter:profiles!legal_disputes_reported_by_fkey(full_name, email)')
      .order('created_at', { ascending: false });
    if (!error) setDisputes(data || []);
    else {
      logger.warn('Disputes fetch:', error);
      setDisputes([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    resolved: disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length,
  };

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6 text-purple-500" /> Disputas y Reclamos
            </h1>
            <p className="text-muted-foreground">Gestión de reclamos, demandas e incidentes legales</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDisputes}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Abiertos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.investigating}</p>
            <p className="text-xs text-gray-500">Investigando</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500">Resueltos</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <Scale className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No hay disputas registradas</p>
                      <p className="text-xs mt-1">Las disputas se crean cuando hay reclamos o incidentes legales</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{d.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{d.description}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline">{TYPE_LABELS[d.type] || d.type}</Badge></TableCell>
                      <TableCell><Badge className={PRIORITY_COLORS[d.priority]}>{d.priority}</Badge></TableCell>
                      <TableCell><Badge className={STATUS_COLORS[d.status]}>{STATUS_LABELS[d.status] || d.status}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{d.assigned_to || '—'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {d.created_at ? format(new Date(d.created_at), 'd MMM yyyy', { locale: es }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default DisputesPage;
