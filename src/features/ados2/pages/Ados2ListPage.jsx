import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, Plus, Eye, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchEvaluations, deleteEvaluation } from '@/features/ados2/api/ados2Api';
import { RANGO_CONFIG, RANGO_CONFIG_T } from '@/features/ados2/constants/ados2Items';

const ADOS2_BASE_PATH = '/dashboard/therapist/ados2';

const STATUS_CONFIG = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  completada: { label: 'Completada', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  revisada: { label: 'Revisada', color: 'bg-green-100 text-green-700 border-green-300' },
};

const FILTERS = ['Todos', 'Borrador', 'Completada', 'Revisada'];

export default function Ados2ListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (user?.id) loadEvaluations();
  }, [user?.id]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const data = await fetchEvaluations(user.id);
      setEvaluations(data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al cargar evaluaciones', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta evaluación? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await deleteEvaluation(id);
      setEvaluations(prev => prev.filter(e => e.id !== id));
      toast({ title: '🗑️ Evaluación eliminada' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error al eliminar', description: e.message });
    } finally {
      setDeleting(null);
    }
  };

  // Helper: obtener config de rango según módulo
  const getRangoConfig = (rango, mod) => {
    if (!rango) return null;
    if (mod === 'T') return RANGO_CONFIG_T[rango] || null;
    return RANGO_CONFIG[rango] || null;
  };

  const filtered = filter === 'Todos'
    ? evaluations
    : evaluations.filter(e => e.status === filter.toLowerCase());

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluaciones ADOS-2</h1>
            <p className="text-sm text-gray-500">Escala de Observación para el Diagnóstico del Autismo</p>
          </div>
        </div>
        <Button onClick={() => navigate(`${ADOS2_BASE_PATH}/new`)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" /> Nueva Evaluación
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === f
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Brain className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 font-medium">No hay evaluaciones{filter !== 'Todos' ? ` con estado "${filter}"` : ''}</p>
              <Button variant="outline" onClick={() => navigate(`${ADOS2_BASE_PATH}/new`)}>
                <Plus className="h-4 w-4 mr-2" /> Crear primera evaluación
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Rango</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ev => {
                  const statusCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.borrador;
                  const rangoCfg = getRangoConfig(ev.rango_preocupacion, ev.module);
                  return (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium">
                        {ev.patient?.full_name || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Módulo {ev.module}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {ev.fecha_evaluacion
                          ? format(new Date(ev.fecha_evaluacion), 'dd MMM yyyy', { locale: es })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rangoCfg ? (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${rangoCfg.color}`}>
                            {rangoCfg.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`${ADOS2_BASE_PATH}/${ev.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDelete(ev.id)}
                            disabled={deleting === ev.id}
                          >
                            {deleting === ev.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </div>
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
}