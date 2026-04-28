import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Eye, Trash2, ClipboardCheck } from 'lucide-react';
import { fetchEvaluations, deleteEvaluation } from '../api/odontogramEvalApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  borrador: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  completada: { label: 'Completada', className: 'bg-green-100 text-green-700 border-green-200' },
};

const TYPE_CONFIG = {
  inicial: { label: 'Inicial', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  tratamiento: { label: 'Tratamiento', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const OdontogramListPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user?.id) loadEvaluations();
  }, [user?.id]);

  const loadEvaluations = async () => {
    setLoading(true);
    const { data } = await fetchEvaluations(user.id);
    setEvaluations(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta evaluación? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    const { error } = await deleteEvaluation(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Evaluación eliminada' });
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
    }
    setDeleting(null);
  };

  const filtered = filter === 'all' ? evaluations : evaluations.filter((e) => e.status === filter);

  return (
    <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-primary">
      <CardHeader className="bg-gradient-to-r from-primary to-purple-50 p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              Evaluaciones Odontológicas
            </CardTitle>
            <CardDescription className="mt-2 text-md text-gray-600">
              Odontogramas iniciales y de tratamiento de tus pacientes
            </CardDescription>
          </div>
          <Button onClick={() => navigate('/dashboard/therapist/odontograma/nueva')} className="bg-primary hover:bg-primary">
            <Plus className="h-4 w-4 mr-2" /> Nueva Evaluación
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-white">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'borrador', label: 'Borradores' },
            { key: 'completada', label: 'Completadas' },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? 'bg-primary hover:bg-primary' : ''}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No hay evaluaciones</p>
            <p className="text-sm mt-1">Crea tu primera evaluación odontológica</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ev.patient_name}</p>
                          {ev.patient_rut && <p className="text-xs text-muted-foreground">RUT: {ev.patient_rut}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TYPE_CONFIG[ev.evaluation_type]?.className}>
                          {TYPE_CONFIG[ev.evaluation_type]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ev.evaluation_date ? format(new Date(ev.evaluation_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CONFIG[ev.status]?.className}>
                          {STATUS_CONFIG[ev.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${(ev.budget_total || 0).toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/therapist/odontograma/${ev.id}`)}>
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(ev.id)}
                            disabled={deleting === ev.id}
                          >
                            {deleting === ev.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((ev) => (
                <div key={ev.id} className="rounded-xl border p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{ev.patient_name}</p>
                    <Badge variant="outline" className={TYPE_CONFIG[ev.evaluation_type]?.className + ' text-[10px]'}>
                      {TYPE_CONFIG[ev.evaluation_type]?.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center border-t pt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Fecha</p>
                      <p className="text-xs font-medium">
                        {ev.evaluation_date ? format(new Date(ev.evaluation_date + 'T12:00:00'), 'dd/MM/yy') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Estado</p>
                      <Badge variant="outline" className={STATUS_CONFIG[ev.status]?.className + ' text-[10px]'}>
                        {STATUS_CONFIG[ev.status]?.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Presupuesto</p>
                      <p className="text-xs font-semibold">${(ev.budget_total || 0).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary" onClick={() => navigate(`/dashboard/therapist/odontograma/${ev.id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDelete(ev.id)} disabled={deleting === ev.id}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OdontogramListPage;
