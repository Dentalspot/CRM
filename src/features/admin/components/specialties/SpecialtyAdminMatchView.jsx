import React, { useState, useEffect } from 'react';
import { specialtiesAdminApi } from '@/features/admin/api/specialtiesAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit
} from 'lucide-react';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const TherapistRow = ({ therapist, onAssign }) => {
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [assigned, setAssigned] = useState([]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await specialtiesAdminApi.getSuggestionsForTherapist(therapist.id);
      setSuggestions(data);
    } catch (error) {
      logger.error(error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !suggestions) {
      loadSuggestions();
    }
  };

  const handleAssign = async (specialtyId, specialtyName) => {
    try {
      await onAssign(therapist.id, specialtyId);
      setAssigned(prev => [...prev, specialtyId]);
    } catch (error) {
      logger.error(error);
    }
  };

  return (
    <>
      <TableRow className={expanded ? "bg-slate-50" : ""}>
        <TableCell className="font-medium">{therapist.full_name}</TableCell>
        <TableCell>{therapist.email}</TableCell>
        <TableCell>{therapist.therapist_details?.professional_title}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="sm" onClick={handleExpand}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-slate-50">
          <TableCell colSpan={4} className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold mb-2">Formación Detectada</h4>
                <div className="text-sm text-slate-500">
                  {loadingSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : suggestions?.length === 0 ? (
                    <p className="italic">No hay sugerencias automáticas claras.</p>
                  ) : (
                    suggestions?.map((sugg) => (
                      <div key={sugg.out_specialty_id} className="flex items-center justify-between p-2 mb-2 bg-white rounded border border-indigo-100 shadow-sm">
                        <div>
                          <p className="font-bold text-indigo-700">{sugg.out_specialty}</p>
                          <p className="text-xs text-slate-500">Score: {sugg.out_suggested_score}</p>
                          <p className="text-xs text-slate-400 mt-1">{sugg.out_reason}</p>
                        </div>
                        {assigned.includes(sugg.out_specialty_id) ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Asignado
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleAssign(sugg.out_specialty_id, sugg.out_specialty)}
                          >
                            Aprobar
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Contexto</h4>
                <p className="text-xs text-slate-600 mb-1">
                  <strong>Universidad:</strong> {therapist.therapist_details?.university || 'N/A'}
                </p>
                <p className="text-xs text-slate-600">
                  <strong>Años Exp:</strong> {therapist.therapist_details?.years_experience || 0}
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default function SpecialtyAdminMatchView() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTherapists();
  }, [searchTerm]); // Simple debounce could be added here

  const fetchTherapists = async () => {
    setLoading(true);
    try {
      const { data } = await specialtiesAdminApi.getTherapists(0, 50, searchTerm);
      setTherapists(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los dentistas' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSpecialty = async (therapistId, specialtyId) => {
    try {
      await specialtiesAdminApi.assignSpecialty(therapistId, specialtyId);
      toast({ title: 'Éxito', description: 'Especialidad asignada correctamente' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo asignar la especialidad' });
      throw error; // Re-throw for row component to handle state
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Coincidencias Inteligentes</h2>
          <p className="text-muted-foreground">Detecta y asigna especialidades basadas en la formación.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar terapeuta..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : therapists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No se encontraron terapeutas.
                  </TableCell>
                </TableRow>
              ) : (
                therapists.map((therapist) => (
                  <TherapistRow 
                    key={therapist.id} 
                    therapist={therapist} 
                    onAssign={handleAssignSpecialty}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}