import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import logger from '@/lib/utils/logger';

// Mock templates in case DB is empty or for structure definition
const DEFAULT_TEMPLATES = [
  {
    id: 'temp_eval_001',
    name: 'Evaluación Inicial Odontológica',
    description: 'Plantilla completa para la primera sesión de evaluación.',
    category: 'evaluacion',
    fields: [
      { name: 'reason_referral', label: 'Motivo de Consulta', type: 'textarea', required: true, placeholder: 'Describa por qué asiste el paciente...' },
      { name: 'medical_history', label: 'Antecedentes Médicos Relevantes', type: 'textarea', required: false },
      { name: 'communication_skills', label: 'Habilidades Comunicativas', type: 'textarea', required: true },
      { name: 'comprehension', label: 'Comprensión del Lenguaje', type: 'select', options: ['Adecuada', 'Levemente descendida', 'Descendida', 'Severamente alterada'], required: true },
      { name: 'expression', label: 'Expresión del Lenguaje', type: 'textarea', required: true },
      { name: 'diagnosis', label: 'Hipótesis Diagnóstica', type: 'textarea', required: true },
      { name: 'recommendations', label: 'Sugerencias y Recomendaciones', type: 'textarea', required: true }
    ]
  },
  {
    id: 'temp_prog_001',
    name: 'Nota de Evolución / Sesión',
    description: 'Registro estándar para sesiones de terapia regular.',
    category: 'evolucion',
    fields: [
      { name: 'session_objective', label: 'Objetivo de la Sesión', type: 'text', required: true },
      { name: 'activities_performed', label: 'Actividades Realizadas', type: 'textarea', required: true },
      { name: 'patient_response', label: 'Respuesta del Paciente', type: 'select', options: ['Cooperador', 'Resistente', 'Fatigado', 'Muy motivado'], required: true },
      { name: 'performance', label: 'Desempeño en Actividades', type: 'textarea', required: true, placeholder: 'Detalles cualitativos del desempeño...' },
      { name: 'progress_notes', label: 'Observaciones de Progreso', type: 'textarea', required: false },
      { name: 'plan_next_session', label: 'Plan para Próxima Sesión', type: 'text', required: true }
    ]
  },
  {
    id: 'temp_dis_001',
    name: 'Informe de Alta',
    description: 'Resumen final del tratamiento y logros alcanzados.',
    category: 'alta',
    fields: [
      { name: 'treatment_summary', label: 'Resumen del Tratamiento', type: 'textarea', required: true },
      { name: 'goals_achieved', label: 'Objetivos Alcanzados', type: 'textarea', required: true },
      { name: 'reason_discharge', label: 'Motivo del Alta', type: 'select', options: ['Objetivos cumplidos', 'Abandono', 'Derivación', 'Otro'], required: true },
      { name: 'final_recommendations', label: 'Indicaciones Finales', type: 'textarea', required: true }
    ]
  }
];

export const useReportGeneration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Data State
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  
  // Selection State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form & Report State
  const [formData, setFormData] = useState({});
  const [generatedReport, setGeneratedReport] = useState(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Selection, 2: Form, 3: Preview
  const [error, setError] = useState(null);

  // --- Fetching Data ---

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      // Fetch active patients associated with the therapist
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          status,
          profiles:profile_id (
            id,
            full_name,
            email,
            birthdate,
            rut,
            phone
          )
        `)
        .eq('status', 'active');
        // RLS filtra por care_team + org membership

      if (error) throw error;

      const formattedPatients = data.map(p => ({
        id: p.id,
        profileId: p.profiles?.id,
        name: p.profiles?.full_name || 'Sin nombre',
        email: p.profiles?.email,
        birthdate: p.profiles?.birthdate,
        rut: p.profiles?.rut,
        phone: p.profiles?.phone
      }));
      
      setPatients(formattedPatients);
    } catch (err) {
      logger.error('Error fetching patients:', err);
      toast({ title: 'Error', description: 'No se pudieron cargar los pacientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const fetchAppointments = useCallback(async (patientId) => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false })
        .limit(10); // Last 10 appointments

      if (error) throw error;
      setAppointments(data);
    } catch (err) {
      logger.error('Error fetching appointments:', err);
      toast({ title: 'Error', description: 'No se pudieron cargar las citas.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // --- Logic ---

  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
    setSelectedAppointment(null); // Reset appointment when patient changes
    fetchAppointments(patientId);
  };

  const handleAppointmentSelect = (appointmentId) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    setSelectedAppointment(appointment);
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    // Initialize empty form data based on template fields
    const initialData = {};
    template?.fields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  };

  const handleFormChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateReport = () => {
    if (!selectedPatient || !selectedTemplate) {
      toast({ title: 'Faltan datos', description: 'Por favor completa la selección requerida.', variant: 'destructive' });
      return;
    }

    const report = {
      patient: selectedPatient,
      therapist: user,
      appointment: selectedAppointment,
      template: selectedTemplate,
      content: formData,
      generatedAt: new Date().toISOString(),
    };

    setGeneratedReport(report);
    setStep(3); // Go to Preview
  };

  const saveReportToDb = async () => {
    if (!generatedReport) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clinical_reports')
        .insert({
          patient_id: generatedReport.patient.id, // using the patient record ID
          therapist_id: user.id,
          report_type: generatedReport.template.name,
          status: 'validated', // Assuming immediate validation for simplified flow
          editable_json: generatedReport.content,
          encounter_id: generatedReport.appointment?.id,
          visibility_scope: 'private' // Default to private initially
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Éxito', description: 'El informe ha sido guardado correctamente.' });
      return data;
    } catch (err) {
      logger.error('Error saving report:', err);
      toast({ title: 'Error', description: 'No se pudo guardar el informe.', variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    if (!generatedReport) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.text(generatedReport.template.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Patient Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Paciente', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${generatedReport.patient.name}`, margin, yPos);
    yPos += 6;
    doc.text(`RUT: ${generatedReport.patient.rut || 'N/A'}`, margin, yPos);
    yPos += 6;
    if (generatedReport.appointment) {
        doc.text(`Fecha de Atención: ${generatedReport.appointment.date}`, margin, yPos);
        yPos += 6;
    }
    
    yPos += 10;

    // Report Content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle del Informe', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    
    generatedReport.template.fields.forEach(field => {
      // Check for page break
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const value = generatedReport.content[field.name] || 'Sin información';
      
      doc.setFont('helvetica', 'bold');
      doc.text(field.label + ':', margin, yPos);
      yPos += 5;
      
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(value, pageWidth - (margin * 2));
      doc.text(splitText, margin, yPos);
      yPos += (splitText.length * 5) + 5;
    });

    // Footer / Signature
    yPos += 20;
    if (yPos > 260) {
      doc.addPage();
      yPos = 40;
    }
    
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(user.full_name || 'Odontólogo/a', margin, yPos);
    yPos += 5;
    if (user.role === 'therapist') {
       doc.setFont('helvetica', 'italic');
       doc.text('Especialista en Odontología', margin, yPos);
    }

    doc.save(`informe_${generatedReport.patient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const resetFlow = () => {
    setStep(1);
    setGeneratedReport(null);
    setFormData({});
    setSelectedAppointment(null);
    setSelectedTemplate(null);
    // Keep selected patient for convenience
  };

  return {
    // Data
    patients,
    appointments,
    templates,
    
    // State
    selectedPatient,
    selectedAppointment,
    selectedTemplate,
    formData,
    generatedReport,
    isLoading,
    step,
    
    // Actions
    fetchPatients,
    handlePatientSelect,
    handleAppointmentSelect,
    handleTemplateSelect,
    handleFormChange,
    generateReport,
    saveReportToDb,
    generatePDF,
    setStep,
    resetFlow
  };
};