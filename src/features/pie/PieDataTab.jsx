
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PieDataTab = ({ patientId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);

  const [formData, setFormData] = useState({
    course: '',
    teacher_name: '',
    nee_type: 'transitoria',
    diagnosis: '',
    academic_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    const fetchPieData = async () => {
      if (!user?.id || !patientId) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pie_student_data')
        .select('*')
        .eq('patient_id', patientId)
        .eq('therapist_id', user.id)
        .maybeSingle(); // EVITA CRASH SI NO HAY DATOS

      if (error) {
        logger.error('Error cargando datos PIE:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos PIE.' });
      } else if (data) {
        setRecordId(data.id);
        setFormData({
          course: data.course || '',
          teacher_name: data.teacher_name || '',
          nee_type: data.nee_type || 'transitoria',
          diagnosis: data.diagnosis || '',
          academic_year: data.academic_year?.toString() || new Date().getFullYear().toString(),
        });
      }
      setLoading(false);
    };

    fetchPieData();
  }, [patientId, user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const payload = {
      patient_id: patientId,
      therapist_id: user.id,
      course: formData.course,
      teacher_name: formData.teacher_name,
      nee_type: formData.nee_type,
      diagnosis: formData.diagnosis,
      academic_year: parseInt(formData.academic_year, 10),
      active: true
    };

    let error;

    if (recordId) {
      const { error: updateError } = await supabase
        .from('pie_student_data')
        .update(payload)
        .eq('id', recordId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('pie_student_data')
        .insert(payload)
        .select()
        .maybeSingle();
      error = insertError;
      if (data) setRecordId(data.id);
    }

    setSaving(false);

    if (error) {
      logger.error(error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron actualizar los datos PIE."
      });
    } else {
      toast({
        title: "Datos guardados",
        description: "Los datos PIE han sido actualizados exitosamente."
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-4">Datos Programa de Integración Escolar (PIE)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="academic_year">Año Académico</Label>
          <Input 
            id="academic_year" 
            name="academic_year" 
            type="number" 
            value={formData.academic_year} 
            onChange={handleChange} 
            className="text-gray-900"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="course">Curso</Label>
          <Input 
            id="course" 
            name="course" 
            placeholder="Ej: 3° Básico A" 
            value={formData.course} 
            onChange={handleChange}
            className="text-gray-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teacher_name">Profesor/a Jefe</Label>
          <Input 
            id="teacher_name" 
            name="teacher_name" 
            placeholder="Nombre del docente" 
            value={formData.teacher_name} 
            onChange={handleChange}
            className="text-gray-900"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nee_type">Tipo de NEE</Label>
          <Select value={formData.nee_type} onValueChange={(val) => setFormData(p => ({...p, nee_type: val}))}>
            <SelectTrigger className="text-gray-900">
              <SelectValue placeholder="Seleccione tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transitoria">Transitoria (NEET)</SelectItem>
              <SelectItem value="permanente">Permanente (NEEP)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="diagnosis">Diagnóstico PIE</Label>
          <Input 
            id="diagnosis" 
            name="diagnosis" 
            placeholder="Ej: Trastorno Específico del Lenguaje (TEL) Expresivo" 
            value={formData.diagnosis} 
            onChange={handleChange}
            className="text-gray-900"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar Datos PIE
        </Button>
      </div>
    </div>
  );
};

export default PieDataTab;
