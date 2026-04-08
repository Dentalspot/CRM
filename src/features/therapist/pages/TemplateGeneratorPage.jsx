import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Sparkles, Save, Upload, Loader2, FileText, History, ArrowRight, AlertCircle,
  BookOpen, ExternalLink, FlaskConical, CheckCircle2, Target, Clock, Activity,
  ChevronDown, ChevronUp, Users, ShieldAlert, TrendingUp, GraduationCap, Brain,
  Pencil, RotateCcw, Trash2, Plus, Download, FolderPlus, Store
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  saveGeneratedTemplate, getGeneratedTemplates, publishTemplateToMarketplace,
  deleteGeneratedTemplate, updateGeneratedTemplate, saveAsTherapyTemplate
} from '../api/templateGeneratorApi';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import EvidenceChat from '@/features/therapist/components/EvidenceChat';

const TemplateGeneratorPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingObjectives, setGeneratingObjectives] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [evidenceSynthesis, setEvidenceSynthesis] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [modelUsed, setModelUsed] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('generator');
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showFamilyRecs, setShowFamilyRecs] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [currentSavedId, setCurrentSavedId] = useState(null); // ID of the saved record for updates

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAction, setSaveAction] = useState('new'); // 'new' or 'replace'

  // Publish dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishPrice, setPublishPrice] = useState('0');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    templateType: 'Plan de Tratamiento',
    patientAge: '',
    diagnosis: '',
    duration: '4 semanas',
    difficulty: 'Intermedio'
  });

  // Objectives state
  const [objectives, setObjectives] = useState([]);
  const [objectivesGenerated, setObjectivesGenerated] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newObjective, setNewObjective] = useState('');

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const data = await getGeneratedTemplates();
      setHistory(data || []);
    } catch (error) {
      logger.error('Error loading history:', error);
    }
  };

  // ═══ STEP 1: Generate objectives ═══
  const handleGenerateObjectives = async () => {
    if (!formData.diagnosis) {
      toast({ variant: 'destructive', title: 'Falta el diagnóstico' });
      return;
    }
    setGeneratingObjectives(true);
    setObjectives([]);
    setObjectivesGenerated(false);
    try {
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: {
          action: 'generate_objectives',
          template_type: formData.templateType,
          diagnosis: formData.diagnosis,
          age: formData.patientAge,
          difficulty: formData.difficulty,
        },
      });
      if (error) throw error;
      setObjectives(data.objectives || []);
      setObjectivesGenerated(true);
      if (data.evidence?.length) setEvidence(data.evidence);
      toast({ title: `${(data.objectives || []).length} objetivos generados` });
    } catch (error) {
      logger.error('Error generating objectives:', error);
      toast({ variant: 'destructive', title: 'Error al generar objetivos' });
    } finally {
      setGeneratingObjectives(false);
    }
  };

  // ═══ STEP 2: Generate full plan ═══
  const handleGeneratePlan = async () => {
    if (!formData.diagnosis || objectives.length === 0) return;
    setGenerating(true);
    setGeneratedContent(null);
    setEvidenceSynthesis('');
    setCurrentSavedId(null);
    setGeneratingStep('pubmed');
    try {
      setTimeout(() => setGeneratingStep('analyzing'), 3000);
      setTimeout(() => setGeneratingStep('planning'), 8000);
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: {
          action: 'generate_plan',
          template_type: formData.templateType,
          diagnosis: formData.diagnosis,
          age: formData.patientAge,
          difficulty: formData.difficulty,
          duration: formData.duration,
          objectives: objectives.join('; '),
        },
      });
      if (error) throw error;
      setGeneratedContent(data.content || null);
      setEvidenceSynthesis(data.evidence_synthesis || '');
      setEvidence(data.evidence || []);
      setModelUsed(data.model || '');
      toast({ title: 'Planificación generada con evidencia PubMed' });
      loadHistory();
    } catch (error) {
      logger.error('Error generating plan:', error);
      toast({ variant: 'destructive', title: 'Error al generar planificación' });
    } finally {
      setGenerating(false);
      setGeneratingStep('');
    }
  };

  // ═══ SAVE with dialog ═══
  const openSaveDialog = () => {
    setSaveName(generatedContent?.titulo || `${formData.templateType} para ${formData.diagnosis}`);
    setSaveAction(currentSavedId ? 'replace' : 'new');
    setSaveDialogOpen(true);
  };

  const handleSave = async () => {
    if (!generatedContent || !saveName.trim()) return;
    setLoading(true);
    setSaveDialogOpen(false);
    try {
      if (saveAction === 'replace' && currentSavedId) {
        await updateGeneratedTemplate(currentSavedId, {
          title: saveName.trim(),
          generated_content: generatedContent,
          patient_info: { age: formData.patientAge, diagnosis: formData.diagnosis, objectives: objectives.join('; '), difficulty: formData.difficulty },
        });
        toast({ title: 'Plan actualizado' });
      } else {
        const saved = await saveGeneratedTemplate({
          template_type: formData.templateType,
          title: saveName.trim(),
          patient_info: { age: formData.patientAge, diagnosis: formData.diagnosis, objectives: objectives.join('; '), difficulty: formData.difficulty },
          generated_content: generatedContent,
          status: 'draft'
        });
        setCurrentSavedId(saved.id);
        toast({ title: 'Plan guardado en historial' });
      }
      loadHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar' });
    } finally {
      setLoading(false);
    }
  };

  // ═══ SAVE AS THERAPY TEMPLATE ═══
  const handleSaveAsTemplate = async () => {
    if (!generatedContent) return;
    setLoading(true);
    try {
      await saveAsTherapyTemplate(generatedContent, formData);
      toast({ title: 'Guardado en Mis Plantillas', description: 'Disponible en Ficha del Paciente → Planificar → Mis Plantillas' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al guardar en plantillas' });
    } finally {
      setLoading(false);
    }
  };

  // ═══ PUBLISH dialog ═══
  const openPublishDialog = () => {
    setPublishPrice('0');
    setPublishDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!generatedContent) return;
    setLoading(true);
    setPublishDialogOpen(false);
    try {
      // First ensure it's saved
      let savedRecord = currentSavedId ? { id: currentSavedId } : null;
      if (!savedRecord) {
        savedRecord = await saveGeneratedTemplate({
          template_type: formData.templateType,
          title: generatedContent.titulo || `${formData.templateType} para ${formData.diagnosis}`,
          patient_info: { age: formData.patientAge, diagnosis: formData.diagnosis, objectives: objectives.join('; ') },
          generated_content: generatedContent,
          status: 'draft'
        });
        setCurrentSavedId(savedRecord.id);
      }
      await publishTemplateToMarketplace({
        ...savedRecord,
        template_type: formData.templateType,
        title: generatedContent.titulo || `${formData.templateType} para ${formData.diagnosis}`,
        patient_info: { diagnosis: formData.diagnosis, age: formData.patientAge },
        generated_content: generatedContent,
      }, parseInt(publishPrice) || 0);
      toast({ title: 'Publicado en Marketplace', description: 'Disponible como borrador en la tienda.' });
      loadHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al publicar' });
    } finally {
      setLoading(false);
    }
  };

  // ═══ DELETE from history ═══
  const handleDelete = async (id) => {
    try {
      await deleteGeneratedTemplate(id);
      setDeleteConfirm(null);
      toast({ title: 'Plan eliminado' });
      loadHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  // ═══ LOAD from history ═══
  const handleLoadFromHistory = (item) => {
    let content = item.generated_content;
    // Parse if stored as string
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch { content = null; }
    }
    setGeneratedContent(content);
    setCurrentSavedId(item.id);
    setEvidence([]);
    setEvidenceSynthesis('');
    const savedObjectives = item.patient_info?.objectives;
    setObjectives(savedObjectives ? savedObjectives.split('; ').filter(Boolean) : (content?.objetivos_especificos || []));
    setObjectivesGenerated(true);
    setFormData({
      templateType: item.template_type || 'Plan de Tratamiento',
      patientAge: item.patient_info?.age || '',
      diagnosis: item.patient_info?.diagnosis || '',
      duration: '',
      difficulty: item.patient_info?.difficulty || 'Intermedio'
    });
    setActiveTab('generator');
  };

  // ═══ EXPORT TO PDF ═══
  const handleExportPDF = () => {
    if (!generatedContent) return;
    const c = generatedContent;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addPage = () => { doc.addPage(); y = 20; };
    const checkPage = (needed = 25) => { if (y + needed > 270) addPage(); };

    // Header bar
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DentalSpot', margin, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Plan generado con IA basado en evidencia PubMed', margin, 25);
    y = 45;

    // Title
    doc.setTextColor(88, 28, 135);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(c.titulo || 'Plan de Tratamiento', maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 5;

    // Patient info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Diagnostico: ${formData.diagnosis} | Edad: ${formData.patientAge || 'N/E'} | Dificultad: ${formData.difficulty}`, margin, y);
    y += 10;

    // General objective
    if (c.objetivo_general) {
      checkPage(20);
      doc.setFillColor(243, 232, 255);
      doc.roundedRect(margin, y - 3, maxWidth, 18, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(88, 28, 135);
      doc.text('Objetivo General', margin + 4, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const objLines = doc.splitTextToSize(c.objetivo_general, maxWidth - 8);
      doc.text(objLines, margin + 4, y + 11);
      y += 18 + objLines.length * 4;
    }

    // Specific objectives
    if (c.objetivos_especificos?.length) {
      checkPage(15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('Objetivos Especificos', margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      c.objetivos_especificos.forEach((obj, i) => {
        checkPage(10);
        const lines = doc.splitTextToSize(`${i + 1}. ${obj}`, maxWidth - 5);
        doc.text(lines, margin + 3, y);
        y += lines.length * 4.5 + 2;
      });
      y += 3;
    }

    // Plan por sesiones
    const sesiones = c.plan_sesiones || [];
    if (sesiones.length) {
      sesiones.forEach((sesion, si) => {
        checkPage(20);
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(margin, y - 3, maxWidth, 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(`Sesion ${sesion.sesion || si + 1}: ${sesion.objetivo_sesion || ''}`, margin + 4, y + 3);
        y += 12;

        (sesion.actividades || []).forEach((act, ai) => {
          checkPage(30);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 58, 138);
          doc.text(`${si + 1}.${ai + 1} ${act.nombre}`, margin + 3, y);
          if (act.duracion_minutos) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`${act.duracion_minutos} min`, pageWidth - margin - 15, y);
          }
          y += 6;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99);
          const steps = act.descripcion_paso_a_paso || (act.descripcion ? [act.descripcion] : []);
          steps.forEach((paso) => {
            checkPage(8);
            const pLines = doc.splitTextToSize(`  - ${paso.replace(/^Paso \d+:\s*/i, '')}`, maxWidth - 10);
            doc.text(pLines, margin + 6, y);
            y += pLines.length * 4 + 1;
          });

          if (act.materiales?.length) {
            checkPage(8);
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(8);
            doc.text(`Materiales: ${act.materiales.join(', ')}`, margin + 6, y);
            y += 5;
          }
          if (act.criterio_logro) {
            checkPage(8);
            doc.setTextColor(5, 150, 105);
            doc.setFontSize(8);
            const cLines = doc.splitTextToSize(`Criterio: ${act.criterio_logro}`, maxWidth - 10);
            doc.text(cLines, margin + 6, y);
            y += cLines.length * 4 + 1;
          }
          if (act.fundamentacion_evidencia) {
            checkPage(8);
            doc.setTextColor(29, 78, 216);
            doc.setFontSize(8);
            const eLines = doc.splitTextToSize(`Evidencia: ${act.fundamentacion_evidencia}`, maxWidth - 10);
            doc.text(eLines, margin + 6, y);
            y += eLines.length * 4 + 1;
          }
          y += 4;
        });
        y += 3;
      });
    }

    // Legacy activities
    if (!sesiones.length && c.actividades?.length) {
      c.actividades.forEach((act, i) => {
        checkPage(20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(`#${i + 1} ${act.nombre}`, margin + 3, y);
        y += 6;
        if (act.descripcion) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(75, 85, 99);
          const dLines = doc.splitTextToSize(act.descripcion, maxWidth - 10);
          doc.text(dLines, margin + 6, y);
          y += dLines.length * 4 + 4;
        }
      });
    }

    // Frequency & duration
    if (c.frecuencia_recomendada || c.duracion_total_plan) {
      checkPage(15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      if (c.frecuencia_recomendada || c.frecuencia) doc.text(`Frecuencia: ${c.frecuencia_recomendada || c.frecuencia}`, margin, y);
      y += 5;
      if (c.duracion_total_plan || c.duracion_plan) doc.text(`Duracion: ${c.duracion_total_plan || c.duracion_plan}`, margin, y);
      y += 8;
    }

    // Evidence base
    if (c.evidencia_base?.length) {
      checkPage(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('Base de Evidencia', margin, y);
      y += 7;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      c.evidencia_base.forEach((ev) => {
        checkPage(12);
        doc.setTextColor(55, 65, 81);
        const eLine = doc.splitTextToSize(`${ev.hallazgo} ${ev.referencia || ''} [${ev.nivel_evidencia || ''}]`, maxWidth - 5);
        doc.text(eLine, margin + 3, y);
        y += eLine.length * 3.5 + 3;
      });
      y += 3;
    }

    // Recommendations for family
    if (c.recomendaciones_para_familia?.length) {
      checkPage(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(194, 65, 12);
      doc.text('Recomendaciones para la Familia', margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      c.recomendaciones_para_familia.forEach((rec) => {
        checkPage(8);
        const rLines = doc.splitTextToSize(`- ${rec}`, maxWidth - 5);
        doc.text(rLines, margin + 3, y);
        y += rLines.length * 4 + 2;
      });
    }

    // Precautions
    if (c.precauciones?.length) {
      checkPage(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('Precauciones', margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      c.precauciones.forEach((p) => {
        checkPage(8);
        const pLines = doc.splitTextToSize(`- ${p}`, maxWidth - 5);
        doc.text(pLines, margin + 3, y);
        y += pLines.length * 4 + 2;
      });
    }

    // Discharge criteria
    if (c.criterios_alta) {
      checkPage(15);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('Criterios de Alta', margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const caLines = doc.splitTextToSize(c.criterios_alta, maxWidth - 5);
      doc.text(caLines, margin + 3, y);
    }

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text('Generado por DentalSpot IA con evidencia PubMed — Revisar antes de usar con pacientes', margin, 287);
      doc.text(`Pagina ${p}/${totalPages}`, pageWidth - margin - 20, 287);
    }

    const fileName = (c.titulo || 'plan-tratamiento').replace(/[^a-zA-Z0-9áéíóúñ ]/g, '').replace(/\s+/g, '-').toLowerCase();
    doc.save(`${fileName}.pdf`);
    toast({ title: 'PDF descargado' });
  };

  // Objective editing helpers
  const startEdit = (idx) => { setEditingObjective(idx); setEditValue(objectives[idx]); };
  const saveEdit = () => {
    if (editValue.trim() && editingObjective !== null) {
      const u = [...objectives]; u[editingObjective] = editValue.trim(); setObjectives(u);
    }
    setEditingObjective(null); setEditValue('');
  };
  const removeObjective = (idx) => setObjectives(objectives.filter((_, i) => i !== idx));
  const addObjective = () => { if (newObjective.trim()) { setObjectives([...objectives, newObjective.trim()]); setNewObjective(''); } };
  const handleReset = () => { setObjectives([]); setObjectivesGenerated(false); setGeneratedContent(null); setEvidence([]); setEvidenceSynthesis(''); setModelUsed(''); setCurrentSavedId(null); };

  const canGenerateObjectives = formData.diagnosis.trim().length > 0;

  const stepMessages = {
    pubmed: { text: 'Buscando evidencia en PubMed...', sub: 'Consultando artículos científicos' },
    analyzing: { text: 'Analizando evidencia con IA...', sub: 'Sintetizando hallazgos clínicos' },
    planning: { text: 'Generando planificación...', sub: 'Creando plan basado en evidencia' },
  };

  // ═══ RENDER ═══
  const renderContent = () => {
    if (!generatedContent) return null;
    if (typeof generatedContent === 'string' || generatedContent.raw_response) {
      return <div className="whitespace-pre-line text-sm text-gray-700">{generatedContent.raw_response || generatedContent}</div>;
    }
    const c = generatedContent;
    return (
      <div className="space-y-6">
        {c.titulo && <h2 className="text-xl font-bold text-purple-900">{c.titulo}</h2>}
        {c.objetivo_general && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 flex items-center gap-2 mb-2"><Target className="h-4 w-4" /> Objetivo General</h3>
            <p className="text-sm text-gray-700">{c.objetivo_general}</p>
          </div>
        )}
        {c.objetivos_especificos?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Objetivos Específicos</h3>
            <ul className="space-y-1.5">
              {c.objetivos_especificos.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="bg-green-100 text-green-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>{obj}
                </li>
              ))}
            </ul>
          </div>
        )}
        {c.plan_sesiones?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" /> Plan por Sesiones</h3>
            <div className="space-y-5">
              {c.plan_sesiones.map((sesion, si) => (
                <div key={si} className="border-l-4 border-blue-400 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600 text-white text-xs">Sesión {sesion.sesion || si + 1}</Badge>
                    {sesion.objetivo_sesion && <span className="text-sm text-gray-600 italic">{sesion.objetivo_sesion}</span>}
                  </div>
                  <div className="space-y-3">
                    {sesion.actividades?.map((act, ai) => (
                      <div key={ai} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm text-blue-900"><span className="bg-blue-100 text-blue-700 text-xs font-bold rounded px-1.5 py-0.5 mr-2">{si + 1}.{ai + 1}</span>{act.nombre}</h4>
                          {(act.duracion_minutos || act.duracion) && <Badge variant="outline" className="text-[10px] shrink-0"><Clock className="h-2.5 w-2.5 mr-1" />{act.duracion_minutos ? `${act.duracion_minutos} min` : act.duracion}</Badge>}
                        </div>
                        {act.descripcion_paso_a_paso?.length > 0 ? (
                          <ol className="space-y-1 mb-2">{act.descripcion_paso_a_paso.map((p, pi) => (
                            <li key={pi} className="text-xs text-gray-600 flex items-start gap-1.5"><span className="bg-gray-200 text-gray-600 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">{pi + 1}</span>{p.replace(/^Paso \d+:\s*/i, '')}</li>
                          ))}</ol>
                        ) : act.descripcion ? <p className="text-xs text-gray-600 mb-2">{act.descripcion}</p> : null}
                        {act.materiales?.length > 0 && <div className="flex flex-wrap gap-1 mb-1.5">{act.materiales.map((m, j) => <Badge key={j} variant="secondary" className="text-[10px]">{m}</Badge>)}</div>}
                        {act.criterio_logro && <p className="text-[11px] text-green-700 bg-green-50 rounded px-2 py-1 mb-1.5"><CheckCircle2 className="h-3 w-3 inline mr-1" />Criterio: {act.criterio_logro}</p>}
                        {act.fundamentacion_evidencia && <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-2 py-1"><FlaskConical className="h-3 w-3 inline mr-1" />{act.fundamentacion_evidencia}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!c.plan_sesiones && c.actividades?.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" /> Actividades</h3>
            <div className="space-y-4">{c.actividades.map((act, i) => (
              <div key={i} className="border rounded-lg p-4 bg-white">
                <h4 className="font-medium text-sm text-blue-900 mb-2"><span className="bg-blue-100 text-blue-700 text-xs font-bold rounded px-1.5 py-0.5 mr-2">#{i + 1}</span>{act.nombre}</h4>
                {act.descripcion && <p className="text-xs text-gray-600 mb-2">{act.descripcion}</p>}
                {act.materiales?.length > 0 && <div className="flex flex-wrap gap-1 mb-1.5">{act.materiales.map((m, j) => <Badge key={j} variant="secondary" className="text-[10px]">{m}</Badge>)}</div>}
                {act.criterio_logro && <p className="text-[11px] text-green-700 bg-green-50 rounded px-2 py-1"><CheckCircle2 className="h-3 w-3 inline mr-1" />Criterio: {act.criterio_logro}</p>}
              </div>
            ))}</div>
          </div>
        )}
        {(c.frecuencia_recomendada || c.frecuencia || c.duracion_total_plan || c.duracion_plan) && (
          <div className="grid grid-cols-2 gap-3">
            {(c.frecuencia_recomendada || c.frecuencia) && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-medium text-gray-500 mb-1">Frecuencia</p><p className="text-sm font-medium">{c.frecuencia_recomendada || c.frecuencia}</p></div>}
            {(c.duracion_total_plan || c.duracion_plan) && <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs font-medium text-gray-500 mb-1">Duración</p><p className="text-sm font-medium">{c.duracion_total_plan || c.duracion_plan}</p></div>}
          </div>
        )}
        {c.indicadores_progreso?.length > 0 && (
          <div><h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-indigo-600" /> Indicadores de Progreso</h3>
            <ul className="space-y-1.5">{c.indicadores_progreso.map((ind, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><TrendingUp className="h-3.5 w-3.5 text-indigo-500 mt-1 shrink-0" />{ind}</li>)}</ul>
          </div>
        )}
        {c.evidencia_base?.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-3"><FlaskConical className="h-4 w-4" /> Base de Evidencia</h3>
            <div className="space-y-2">{c.evidencia_base.map((ev, i) => (
              <div key={i} className="bg-white/60 rounded p-2.5"><p className="text-xs text-blue-900 mb-1">{ev.hallazgo}</p>
                <div className="flex gap-2">{ev.referencia && <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-700">{ev.referencia}</Badge>}{ev.nivel_evidencia && <Badge className="text-[9px] bg-blue-100 text-blue-800">{ev.nivel_evidencia}</Badge>}</div>
              </div>
            ))}</div>
          </div>
        )}
        {!c.evidencia_base && c.evidencia_cientifica?.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4"><h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-2"><FlaskConical className="h-4 w-4" /> Fundamentación</h3>
            <ul className="space-y-1.5">{c.evidencia_cientifica.map((ev, i) => <li key={i} className="text-xs text-blue-900">{ev}</li>)}</ul>
          </div>
        )}
        {c.recomendaciones_para_familia?.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <button onClick={() => setShowFamilyRecs(!showFamilyRecs)} className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 transition-colors">
              <h3 className="font-semibold text-orange-800 flex items-center gap-2"><Users className="h-4 w-4" /> Recomendaciones para la Familia</h3>
              {showFamilyRecs ? <ChevronUp className="h-4 w-4 text-orange-600" /> : <ChevronDown className="h-4 w-4 text-orange-600" />}
            </button>
            {showFamilyRecs && <div className="p-3 space-y-1.5">{c.recomendaciones_para_familia.map((rec, i) => <p key={i} className="text-sm text-gray-700"><span className="text-orange-500">•</span> {rec}</p>)}</div>}
          </div>
        )}
        {c.recomendaciones?.length > 0 && <div><h3 className="font-semibold text-gray-800 mb-2">Recomendaciones</h3><ul className="space-y-1">{c.recomendaciones.map((r, i) => <li key={i} className="text-sm text-gray-700"><span className="text-purple-500">•</span> {r}</li>)}</ul></div>}
        {c.precauciones?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"><h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-2"><ShieldAlert className="h-4 w-4" /> Precauciones</h3>
            <ul className="space-y-1">{c.precauciones.map((p, i) => <li key={i} className="text-xs text-amber-900 flex items-start gap-2"><AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />{p}</li>)}</ul>
          </div>
        )}
        {c.criterios_alta && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"><h3 className="font-semibold text-emerald-800 flex items-center gap-2 mb-2"><GraduationCap className="h-4 w-4" /> Criterios de Alta</h3><p className="text-sm text-emerald-900">{c.criterios_alta}</p></div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Sparkles className="h-8 w-8 text-purple-600" /> Generador IA</h1>
          <p className="text-muted-foreground">Genera objetivos y planificaciones terapéuticas basadas en evidencia PubMed.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="generator" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"><Sparkles className="h-4 w-4 mr-2" /> Generador</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-gray-100"><History className="h-4 w-4 mr-2" /> Historial ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Column */}
            <Card className="lg:col-span-1 shadow-md border-purple-100">
              <CardHeader className="bg-purple-50/50 border-b border-purple-100">
                <CardTitle className="text-lg text-purple-900">Configuración</CardTitle>
                <CardDescription>Paso 1: objetivos IA. Paso 2: planificación.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Recurso</Label>
                  <Select value={formData.templateType} onValueChange={(v) => setFormData(p => ({ ...p, templateType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Plan de Tratamiento">Plan de Tratamiento</SelectItem><SelectItem value="Ejercicio Terapéutico">Ejercicio Terapéutico</SelectItem><SelectItem value="Protocolo de Evaluación">Protocolo de Evaluación</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Diagnóstico / Condición *</Label><Input placeholder="Ej: Trastorno Específico del Lenguaje" value={formData.diagnosis} onChange={(e) => setFormData(p => ({ ...p, diagnosis: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Edad</Label><Input placeholder="Ej: 5" type="number" value={formData.patientAge} onChange={(e) => setFormData(p => ({ ...p, patientAge: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Dificultad</Label><Select value={formData.difficulty} onValueChange={(v) => setFormData(p => ({ ...p, difficulty: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Básico">Básico</SelectItem><SelectItem value="Intermedio">Intermedio</SelectItem><SelectItem value="Avanzado">Avanzado</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Duración</Label><Input placeholder="Ej: 4 semanas, sesión 45 min" value={formData.duration} onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))} /></div>

                {/* Step 1 */}
                <div className="border-t pt-4">
                  <Button onClick={handleGenerateObjectives} disabled={generatingObjectives || !canGenerateObjectives} variant={objectivesGenerated ? 'outline' : 'default'} className={`w-full ${!objectivesGenerated ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : ''}`}>
                    {generatingObjectives ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : objectivesGenerated ? <><RotateCcw className="mr-2 h-4 w-4" /> Regenerar Objetivos</> : <><Brain className="mr-2 h-4 w-4" /> Paso 1: Generar Objetivos</>}
                  </Button>
                </div>

                {/* Objectives list */}
                {objectives.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between"><h4 className="text-sm font-semibold text-green-800 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Objetivos ({objectives.length})</h4><Badge variant="outline" className="text-[9px] text-green-600 border-green-300">Editables</Badge></div>
                    <div className="space-y-1.5">
                      {objectives.map((obj, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 group">
                          <span className="bg-green-200 text-green-800 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-1">{idx + 1}</span>
                          {editingObjective === idx ? (
                            <div className="flex-1 flex gap-1"><Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus /><Button size="sm" variant="ghost" className="h-7 px-2" onClick={saveEdit}><CheckCircle2 className="h-3 w-3" /></Button></div>
                          ) : (
                            <><p className="text-xs text-gray-700 flex-1 leading-snug">{obj}</p><div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(idx)} className="p-0.5 hover:bg-green-200 rounded"><Pencil className="h-3 w-3 text-green-700" /></button><button onClick={() => removeObjective(idx)} className="p-0.5 hover:bg-red-100 rounded"><Trash2 className="h-3 w-3 text-red-500" /></button></div></>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-1"><Input placeholder="Agregar objetivo..." value={newObjective} onChange={(e) => setNewObjective(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === 'Enter' && addObjective()} /><Button size="sm" variant="ghost" className="h-7 px-2" onClick={addObjective} disabled={!newObjective.trim()}><Plus className="h-3 w-3" /></Button></div>
                  </div>
                )}

                {/* Step 2 */}
                {objectives.length > 0 && (
                  <Button onClick={handleGeneratePlan} disabled={generating} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                    {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Paso 2: Generar Planificación</>}
                  </Button>
                )}

                {/* Pipeline */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-purple-700 flex items-center gap-1"><Brain className="h-3 w-3" /> Pipeline IA</p>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${objectivesGenerated ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>1. Objetivos</span><ArrowRight className="h-2.5 w-2.5" />
                    <span className={`px-1.5 py-0.5 rounded font-medium ${generatedContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>2. Evidencia</span><ArrowRight className="h-2.5 w-2.5" />
                    <span className={`px-1.5 py-0.5 rounded font-medium ${generatedContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>3. Plan</span>
                  </div>
                </div>
                {(objectivesGenerated || generatedContent) && <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={handleReset}><RotateCcw className="h-3 w-3 mr-1" /> Empezar de nuevo</Button>}
              </CardContent>
            </Card>

            {/* Output Column */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-md flex flex-col" style={{ minHeight: '600px' }}>
                <CardHeader className="border-b flex flex-row justify-between items-center bg-gray-50/50">
                  <div>
                    <CardTitle>Resultado</CardTitle>
                    <CardDescription>
                      {generatedContent ? <>Generado con <span className="font-medium">{modelUsed || 'IA'}</span> · {evidence.length} artículo{evidence.length !== 1 ? 's' : ''} PubMed</> : objectives.length > 0 ? `${objectives.length} objetivos listos` : 'Completa los datos para comenzar'}
                    </CardDescription>
                  </div>
                  {generatedContent && (
                    <div className="flex gap-1.5 flex-wrap">
                      <Button variant="outline" size="sm" onClick={handleExportPDF} title="Exportar PDF"><Download className="h-4 w-4 mr-1" /> PDF</Button>
                      <Button variant="outline" size="sm" onClick={openSaveDialog} disabled={loading} title="Guardar en historial"><Save className="h-4 w-4 mr-1" /> Guardar</Button>
                      <Button variant="outline" size="sm" onClick={handleSaveAsTemplate} disabled={loading} className="text-purple-700 border-purple-200 hover:bg-purple-50" title="Guardar en Mis Plantillas"><FolderPlus className="h-4 w-4 mr-1" /> Plantilla</Button>
                      <Button size="sm" onClick={openPublishDialog} disabled={loading} className="bg-green-600 hover:bg-green-700" title="Publicar en Marketplace"><Store className="h-4 w-4 mr-1" /> Publicar</Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative bg-white">
                  {generating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                      <div className="relative"><div className="h-16 w-16 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin"></div><Sparkles className="h-6 w-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
                      <p className="mt-4 text-purple-700 font-medium animate-pulse">{stepMessages[generatingStep]?.text || 'Generando...'}</p>
                      <p className="text-sm text-gray-500 mt-1">{stepMessages[generatingStep]?.sub || ''}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${generatingStep === 'pubmed' ? 'bg-blue-500 animate-pulse' : ['analyzing', 'planning'].includes(generatingStep) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full ${generatingStep === 'analyzing' ? 'bg-indigo-500 animate-pulse' : generatingStep === 'planning' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className={`w-2.5 h-2.5 rounded-full ${generatingStep === 'planning' ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'}`} />
                      </div>
                    </div>
                  ) : !generatedContent ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[400px]">
                      {objectives.length > 0 ? <><CheckCircle2 className="h-16 w-16 mb-4 text-green-300" /><p className="font-medium text-green-600">{objectives.length} objetivos listos</p><p className="text-sm mt-1">Presiona <b>"Generar Planificación"</b></p></> : <><FileText className="h-16 w-16 mb-4 opacity-20" /><p className="font-medium">Ingresa diagnóstico y datos del paciente</p><p className="text-sm mt-1">Presiona <b>"Generar Objetivos"</b> para comenzar</p></>}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <ScrollArea className="flex-1 p-6">{renderContent()}</ScrollArea>
                      <div className="p-3 border-t bg-gray-50/50 text-xs text-center text-muted-foreground"><AlertCircle className="h-3 w-3 inline mr-1" />Contenido generado por IA. Revisa antes de usar con pacientes.</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evidence panels — structured */}
              {evidenceSynthesis && (() => {
                // Parse structured evidence (JSON or raw text)
                let ev = null;
                try {
                  ev = typeof evidenceSynthesis === 'string' ? JSON.parse(evidenceSynthesis) : evidenceSynthesis;
                } catch { ev = null; }

                if (ev && ev.hallazgos_principales) {
                  return (
                    <div className="space-y-3">
                      {/* 1. Hallazgos principales */}
                      <Card className="shadow-md border-indigo-100">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 py-3">
                          <CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-indigo-600" /> Hallazgos Principales</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4"><p className="text-xs text-gray-700 leading-relaxed">{ev.hallazgos_principales}</p></CardContent>
                      </Card>

                      {/* 2. Instrumentos y población */}
                      {ev.instrumentos_poblacion && (
                        <Card className="shadow-sm border-blue-100">
                          <CardHeader className="py-2 px-4"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-blue-600" /> Instrumentos y Población</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-3 pt-0"><p className="text-xs text-gray-700">{ev.instrumentos_poblacion}</p></CardContent>
                        </Card>
                      )}

                      {/* 3. Nivel de evidencia */}
                      {ev.nivel_evidencia && (
                        <Card className="shadow-sm border-emerald-100">
                          <CardHeader className="py-2 px-4"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Nivel de Evidencia y Consenso</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-3 pt-0"><p className="text-xs text-gray-700">{ev.nivel_evidencia}</p></CardContent>
                        </Card>
                      )}

                      {/* 4. Ideas prácticas + botón Crear Plantilla */}
                      {ev.ideas_practicas?.length > 0 && (
                        <Card className="shadow-md border-violet-200 bg-violet-50/30">
                          <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-600" /> Ideas para tu Práctica Clínica</CardTitle></CardHeader>
                          <CardContent className="px-4 pb-3 pt-0 space-y-2">
                            {ev.ideas_practicas.map((idea, i) => (
                              <div key={i} className="flex items-start gap-2 bg-white rounded-lg border border-violet-100 p-2.5">
                                <span className="text-violet-500 font-bold text-xs shrink-0">{i + 1}.</span>
                                <p className="text-xs text-gray-700 flex-1">{idea}</p>
                                <Button variant="outline" size="sm" className="shrink-0 h-7 text-[10px] text-violet-600 border-violet-200 hover:bg-violet-100"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, objectives: idea }));
                                    handleGeneratePlan();
                                  }}>
                                  <Sparkles className="h-3 w-3 mr-0.5" /> Crear Plantilla
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                }

                // Fallback: raw text display
                return (
                  <Card className="shadow-md border-indigo-100">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 pb-3">
                      <button onClick={() => setShowSynthesis(!showSynthesis)} className="w-full flex items-center justify-between">
                        <div><CardTitle className="text-base flex items-center gap-2"><Brain className="h-5 w-5 text-indigo-600" /> Síntesis de Evidencia</CardTitle></div>
                        {showSynthesis ? <ChevronUp className="h-5 w-5 text-indigo-400" /> : <ChevronDown className="h-5 w-5 text-indigo-400" />}
                      </button>
                    </CardHeader>
                    {showSynthesis && <CardContent className="p-4"><div className="whitespace-pre-line text-xs text-gray-700 leading-relaxed bg-white rounded-lg p-4 border">{evidenceSynthesis}</div></CardContent>}
                  </Card>
                );
              })()}

              {/* PubMed Articles + Chat */}
              {evidence.length > 0 && (
                <Card className="shadow-md border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /> Artículos PubMed ({evidence.length})</CardTitle></CardHeader>
                  <CardContent className="p-4 space-y-3">{evidence.map((a, idx) => (
                    <div key={a.url || idx} className="border rounded-lg p-3 hover:bg-blue-50/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0"><h4 className="font-medium text-xs leading-snug mb-1"><span className="text-blue-600 font-bold mr-1">[{idx + 1}]</span>{a.title}</h4><p className="text-[10px] text-muted-foreground">{a.authors} · <span className="font-medium">{a.journal}</span> ({a.year})</p></div>
                        {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="gap-1 h-7 text-xs"><ExternalLink className="h-3 w-3" /> PubMed</Button></a>}
                      </div>
                      <EvidenceChat
                        articleTitle={a.title}
                        articleContext={`${a.title}. ${a.authors} (${a.year}). ${a.journal}. ${a.abstract || ''}`}
                        evidenceContext={typeof evidenceSynthesis === 'string' ? evidenceSynthesis : JSON.stringify(evidenceSynthesis)}
                      />
                    </div>
                  ))}</CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══ HISTORY TAB ═══ */}
        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="mb-2 bg-purple-50 text-purple-700 border-purple-200">{item.template_type}</Badge>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}</span>
                      <button onClick={() => setDeleteConfirm(item.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500 pb-3">
                  <span className="line-clamp-2">{item.patient_info?.diagnosis}</span>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 w-fit px-2 py-0.5 rounded">{item.status === 'published' ? 'Publicado' : 'Borrador'}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t">
                  <Button variant="ghost" className="w-full justify-between group" onClick={() => handleLoadFromHistory(item)}>Cargar contenido<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button>
                </CardFooter>
              </Card>
            ))}
            {history.length === 0 && <div className="col-span-full text-center py-12 text-gray-400">No hay planes en el historial.</div>}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ SAVE DIALOG ═══ */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Guardar Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nombre del plan</Label><Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Nombre descriptivo..." /></div>
            {currentSavedId && (
              <div className="space-y-2">
                <Label>Acción</Label>
                <Select value={saveAction} onValueChange={setSaveAction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="replace">Reemplazar existente</SelectItem><SelectItem value="new">Guardar como nuevo</SelectItem></SelectContent></Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!saveName.trim()} className="bg-purple-600 hover:bg-purple-700">{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{saveAction === 'replace' ? 'Actualizar' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ PUBLISH DIALOG ═══ */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Publicar en Marketplace</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">El plan se guardará en Mis Plantillas y se publicará como borrador en la tienda.</p>
            <div className="space-y-2"><Label>Precio (CLP)</Label><Input type="number" min="0" value={publishPrice} onChange={(e) => setPublishPrice(e.target.value)} placeholder="0 = Gratis" /><p className="text-xs text-muted-foreground">Usa 0 para publicar gratis.</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Store className="h-4 w-4 mr-2" />}Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar plan</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Estás seguro? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}><Trash2 className="h-4 w-4 mr-2" /> Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateGeneratorPage;
