import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Trash2, Loader2, ClipboardList } from 'lucide-react';
import { fetchEvaluations, deleteEvaluation } from '../api/sensorialApi';
import { CLASSIFICATION } from '../constants/sensorialItems';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_MAP = {
  borrador: { label: 'Borrador', variant: 'outline' },
  completada: { label: 'Completada', variant: 'default' },
  revisada: { label: 'Revisada', variant: 'secondary' },
};

const CLASSIFICATION_MAP = {
  tipico: { label: 'Típico', variant: 'outline' },
  leve: { label: 'Diferencia Leve', variant: 'secondary' },
  moderado: { label: 'Diferencia Moderada', variant: 'default' },
  significativo: { label: 'Diferencia Significativa', variant: 'destructive' },
};

const SensorialListPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  useEffect(() => {
    if (user?.id) loadEvaluations();
  }, [user?.id]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const data = await fetchEvaluations(user.id);
      setEvaluations(data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluaciones' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta evaluación? No se puede deshacer.')) return;
    try {
      await deleteEvaluation(id);
      setEvaluations(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Evaluación eliminada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  const filtered = filter === 'Todos'
    ? evaluations
    : evaluations.filter(e => e.status === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Perfil Sensorial</h1>
          <p className="text-muted-foreground">Evaluaciones de procesamiento sensorial (Dunn)</p>
        </div>
        <Button onClick={() => navigate('/dashboard/therapist/sensorial/new')}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Evaluación
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="Todos">Todos</TabsTrigger>
          <TabsTrigger value="Borrador">Borrador</TabsTrigger>
          <TabsTrigger value="Completada">Completada</TabsTrigger>
          <TabsTrigger value="Revisada">Revisada</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay evaluaciones registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Informante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ev => {
                  const statusCfg = STATUS_MAP[ev.status] || STATUS_MAP.borrador;
                  const classCfg = CLASSIFICATION_MAP[ev.overall_classification];
                  return (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium">
                        {ev.patient?.profile?.full_name || 'Sin paciente'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ev.informant_name || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ev.fecha_evaluacion ? format(new Date(ev.fecha_evaluacion), 'dd MMM yyyy', { locale: es }) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {classCfg ? <Badge variant={classCfg.variant}>{classCfg.label}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/therapist/sensorial/${ev.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(ev.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorialListPage;
