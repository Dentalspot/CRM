import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const AiUsageLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('notiz_sessions')
        .select('id, title, created_at, therapist_id, duration_seconds')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6 text-cyan-500" /> Logs de Uso IA</h1>
        <p className="text-muted-foreground">Registro de sesiones de Notiz (transcripción IA)</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesión</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-12 text-gray-500">Sin registros de uso</TableCell></TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-sm">{log.title || 'Sesión sin título'}</TableCell>
                      <TableCell><Badge variant="outline">{log.duration_seconds ? `${Math.round(log.duration_seconds / 60)}min` : '—'}</Badge></TableCell>
                      <TableCell className="text-sm text-gray-500">{format(new Date(log.created_at), 'd MMM yyyy, HH:mm', { locale: es })}</TableCell>
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

export default AiUsageLogsPage;
