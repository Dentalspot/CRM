
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const PieSessionsTab = ({ patientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    attended: 'true',
    student_performance: 'Adecuado',
    notes: '',
    objectives_worked: ''
  });

  const fetchSessions = async () => {
    if (!user?.id || !patientId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('pie_sessions')
      .select('*')
      .eq('student_id', patientId)
      .eq('therapist_id', user.id)
      .order('session_date', { ascending: false })
      .limit(20);

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [patientId, user?.id]);

  const handleOpenModal = () => {
    setFormData({
      session_date: new Date().toISOString().split('T')[0],
      attended: 'true',
      student_performance: 'Adecuado',
      notes: '',
      objectives_worked: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.session_date) {
      toast({ variant: "destructive", title: "Error", description: "La fecha es obligatoria" });
      return;
    }

    setSaving(true);
    
    const objectivesArray = formData.objectives_worked
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    const payload = {
      student_id: patientId,
      therapist_id: user.id,
      session_date: formData.session_date,
      attended: formData.attended === 'true',
      student_performance: formData.student_performance,
      notes: formData.notes,
      objectives_worked: objectivesArray
    };

    const { error } = await supabase
      .from('pie_sessions')
      .insert(payload);

    setSaving(false);

    if (error) {
      logger.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo registrar la sesión." });
    } else {
      toast({ title: "Éxito", description: "Sesión registrada correctamente." });
      setIsModalOpen(false);
      fetchSessions();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">Registro de Sesiones PIE</h2>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Sesión
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
          No hay sesiones registradas.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead className="w-[100px] text-center">Asistencia</TableHead>
                <TableHead>Desempeño</TableHead>
                <TableHead>Objetivos Trabajados</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      {format(new Date(session.session_date), 'dd MMM yyyy', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {session.attended ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {session.student_performance || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {session.objectives_worked && session.objectives_worked.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-1">
                        {session.objectives_worked.map((obj, i) => (
                          <li key={i} className="text-gray-600 line-clamp-1" title={obj}>{obj}</li>
                        ))}
                      </ul>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={session.notes}>
                    {session.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Sesión PIE</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_date">Fecha</Label>
                <Input 
                  id="session_date" 
                  type="date" 
                  value={formData.session_date}
                  onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attended">Asistencia</Label>
                <Select value={formData.attended} onValueChange={(val) => setFormData({...formData, attended: val})}>
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Presente</SelectItem>
                    <SelectItem value="false">Ausente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.attended === 'true' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="student_performance">Desempeño</Label>
                  <Select value={formData.student_performance} onValueChange={(val) => setFormData({...formData, student_performance: val})}>
                    <SelectTrigger className="text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excelente">Excelente</SelectItem>
                      <SelectItem value="Adecuado">Adecuado</SelectItem>
                      <SelectItem value="En Desarrollo">En Desarrollo</SelectItem>
                      <SelectItem value="Requiere Apoyo">Requiere Apoyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objectives_worked">Objetivos Trabajados (separados por coma)</Label>
                  <Input 
                    id="objectives_worked" 
                    placeholder="Ej: Conciencia fonológica, Vocabulario"
                    value={formData.objectives_worked}
                    onChange={(e) => setFormData({...formData, objectives_worked: e.target.value})}
                    className="text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas / Observaciones</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Comportamiento, avances, dificultades..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="text-gray-900 resize-none h-24"
                  />
                </div>
              </>
            )}
            
            {formData.attended === 'false' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Motivo de inasistencia (opcional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Justificativo..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="text-gray-900 resize-none h-24"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PieSessionsTab;
