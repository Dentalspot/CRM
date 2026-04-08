import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Calendar, Clock, MapPin, Users, AlertTriangle, FileText, Activity, Target,
  Edit2, Trash2, Mic, Search, UserPlus, ExternalLink, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import ReactMarkdown from 'react-markdown';
import NotizInlineWidget from '@/features/post-session/components/NotizInlineWidget';
import { createReferral } from '@/features/referrals/api/referralsApi';

const REFERRAL_TYPES = [
  { value: 'fonoaudiologo', label: 'Odontólogo/a' },
  { value: 'psicologo', label: 'Psicólogo/a' },
  { value: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
  { value: 'neurologo', label: 'Neurólogo/a' },
  { value: 'psiquiatra', label: 'Psiquiatra' },
  { value: 'pediatra', label: 'Pediatra' },
  { value: 'educador_diferencial', label: 'Educador/a Diferencial' },
  { value: 'kinesiologo', label: 'Kinesiólogo/a' },
  { value: 'otro', label: 'Otro profesional' },
];

const ViewClinicalEntryModal = ({ isOpen, onClose, entry, entryConfig, onEdit, onDelete, patientId, therapistId }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Mode: 'view' or 'evolve'
  const [mode, setMode] = useState('view');
  const [saving, setSaving] = useState(false);

  // Evolution fields
  const [sessionNotes, setSessionNotes] = useState('');
  const [objectives, setObjectives] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Referral fields
  const [showReferral, setShowReferral] = useState(false);
  const [referralType, setReferralType] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  // Reset on open
  useEffect(() => {
    if (isOpen && entry) {
      setMode('view');
      setSessionNotes(entry.session_notes || entry.details?.notes || '');
      setObjectives(entry.details?.objectives || '');
      setNextSteps(entry.details?.next_steps || '');
      setShowReferral(false);
      setReferralType('');
      setReferralReason('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedProfessional(null);
    }
  }, [isOpen, entry]);

  // Search professionals in DentalSpot
  const handleSearchProfessionals = useCallback(async (term) => {
    setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, therapist_branding(avatar_url)')
        .eq('role', 'therapist')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(6);
      setSearchResults((data || []).map(d => ({
        therapist_id: d.id,
        full_name: d.full_name,
        email: d.email,
        avatar_url: d.therapist_branding?.[0]?.avatar_url || d.therapist_branding?.avatar_url || null,
      })));
    } catch (e) { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  if (!entry) return null;

  const formatDate = (dateString) => {
    try { return format(parseISO(dateString), "d 'de' MMMM, yyyy", { locale: es }); }
    catch (e) { return 'Fecha inválida'; }
  };
  const formatTime = (dateString) => {
    try { return format(parseISO(dateString), "HH:mm", { locale: es }); }
    catch (e) { return '--:--'; }
  };

  const statusStyles = {
    completed: "bg-green-100 text-green-700 border-green-200",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    no_show: "bg-orange-100 text-orange-700 border-orange-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };
  const statusLabels = {
    completed: "Completada", scheduled: "Programada", cancelled: "Cancelada",
    no_show: "No asistió", pending: "Pendiente",
  };
  const normalizedStatus = (entry.session_state || entry.status || 'completed').toLowerCase();

  // Notiz handler
  const handleNotizResult = ({ sessionNotes: notes, objectives: obj, nextSteps: steps }) => {
    if (notes) setSessionNotes(notes);
    if (obj) setObjectives(obj);
    if (steps) setNextSteps(steps);
  };

  // Save evolution — updates the EXISTING session entry, never creates a new one
  const handleSaveEvolution = async () => {
    if (!sessionNotes.trim()) {
      toast({ variant: 'destructive', title: 'Escribe al menos las notas de sesión.' });
      return;
    }
    setSaving(true);
    try {
      // Preserve existing details (SOAP, extracted_data, etc.) — only add evolution fields
      const existingDetails = entry.details || {};

      const updatedDetails = {
        ...existingDetails,
        objectives,
        next_steps: nextSteps,
        evolved_at: new Date().toISOString(),
        evolved_by: user?.id,
      };

      // Embed referral data directly in the session details (not as separate event)
      if (showReferral && referralType && referralReason) {
        updatedDetails.referral = {
          type: referralType,
          type_label: REFERRAL_TYPES.find(r => r.value === referralType)?.label || referralType,
          reason: referralReason,
          professional_id: selectedProfessional?.therapist_id || null,
          professional_name: selectedProfessional?.full_name || null,
          created_at: new Date().toISOString(),
          status: 'pending',
        };
      }

      // Update summary to reflect evolution was done
      const summary = sessionNotes.slice(0, 200);

      const { error } = await supabase
        .from('clinical_history')
        .update({
          session_notes: sessionNotes,
          summary,
          details: updatedDetails,
        })
        .eq('id', entry.id);
      if (error) throw error;

      // Also create referral via RPC for notifications (but linked to this entry, same date)
      if (showReferral && referralType && referralReason) {
        try {
          await createReferral({
            patientId: patientId || entry.patient_id,
            therapistId: therapistId || user?.id,
            referralType,
            referralReason,
            selectedProfessional,
            sourceEntryId: entry.id,
          });
          toast({ title: 'Evolución y derivación guardadas correctamente' });
        } catch (refErr) {
          // Referral notification failed but data is saved in session details
          console.warn('[Referral] RPC failed, data saved in session details:', refErr);
          toast({ title: 'Evolución y derivación guardadas correctamente' });
        }
      } else {
        toast({ title: 'Evolución guardada correctamente' });
      }
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${entryConfig?.color || 'bg-gray-100'} shadow-sm`}>
              {entryConfig?.icon ? <entryConfig.icon className="h-5 w-5 text-white" /> : <FileText className="h-5 w-5 text-gray-500" />}
            </div>
            <div>
              <DialogTitle className="text-lg">
                {mode === 'evolve' ? 'Evolucionar Sesión' : (entryConfig?.label || 'Detalle de Entrada')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span className="capitalize">{formatDate(entry.entry_date)}</span>
                <span className="text-gray-300">|</span>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(entry.entry_date)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {/* ═══ VIEW MODE ═══ */}
          {mode === 'view' && (
            <div className="space-y-5">
              <h3 className="text-xl font-semibold text-gray-900">{entry.summary || 'Sin resumen'}</h3>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Duración</span>
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {entry.duration_minutes || 0} minutos
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Estado</span>
                  <Badge variant="outline" className={statusStyles[normalizedStatus] || "bg-gray-100"}>
                    {statusLabels[normalizedStatus] || normalizedStatus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Contexto</span>
                  <div className="flex items-center gap-2 capitalize font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {entry.care_context || 'No especificado'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Plan Asociado</span>
                  <div className="flex items-center gap-2 font-medium text-gray-700">
                    <Target className="h-4 w-4 text-gray-400" />
                    <span className="line-clamp-1">{entry.assigned_plan?.name || 'Ninguno'}</span>
                  </div>
                </div>
              </div>

              {(entry.caregiver_present || entry.risk_flag) && (
                <div className="flex flex-wrap gap-2">
                  {entry.caregiver_present && <Badge variant="secondary" className="gap-1.5 bg-blue-50 text-blue-700"><Users className="h-3.5 w-3.5" /> Cuidador Presente</Badge>}
                  {entry.risk_flag && <Badge variant="destructive" className="gap-1.5 bg-red-50 text-red-700 hover:bg-red-50"><AlertTriangle className="h-3.5 w-3.5" /> Riesgo / Alerta</Badge>}
                </div>
              )}

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> Notas de la sesión</h4>
                <div className="bg-white p-4 rounded-md text-sm text-gray-700 leading-relaxed border min-h-[80px] prose prose-sm max-w-none">
                  {entry.session_notes || entry.details?.notes ? (
                    <ReactMarkdown>{entry.session_notes || entry.details?.notes}</ReactMarkdown>
                  ) : (
                    <span className="text-gray-400 italic">No hay notas registradas.</span>
                  )}
                </div>
              </div>

              {/* Objectives & Next Steps if present */}
              {entry.details?.objectives && (
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900 text-sm">Objetivos trabajados</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{entry.details.objectives}</p>
                </div>
              )}
              {entry.details?.next_steps && (
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900 text-sm">Próximos pasos</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border">{entry.details.next_steps}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ EVOLVE MODE ═══ */}
          {mode === 'evolve' && (
            <div className="space-y-4">
              {/* Session Notes — pre-filled with original */}
              <div>
                <Label className="text-sm font-medium">Notas de sesión *</Label>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Descripción de lo trabajado, observaciones, progreso..."
                  rows={5}
                  className="mt-1 resize-none"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Objetivos trabajados</Label>
                <Input value={objectives} onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Ej: Articulación /r/, comprensión de instrucciones" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm font-medium">Próximos pasos</Label>
                <Input value={nextSteps} onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Ej: Reforzar en casa con ejercicios de soplo" className="mt-1" />
              </div>

              {/* Notiz Widget */}
              <NotizInlineWidget
                patientId={patientId || entry.patient_id}
                therapistId={therapistId || user?.id}
                patientContext={entry.summary || 'Sesión clínica'}
                onResult={handleNotizResult}
              />

              <Separator />

              {/* ── Referral / Derivación ── */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowReferral(!showReferral)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm text-purple-800">Derivar a otro profesional</span>
                  </div>
                  {showReferral ? <ChevronUp className="h-4 w-4 text-purple-500" /> : <ChevronDown className="h-4 w-4 text-purple-500" />}
                </button>

                {showReferral && (
                  <div className="p-4 space-y-3 bg-white border-t">
                    <div>
                      <Label className="text-sm font-medium">Tipo de profesional</Label>
                      <Select value={referralType} onValueChange={setReferralType}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {REFERRAL_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Motivo de derivación</Label>
                      <Textarea
                        value={referralReason}
                        onChange={(e) => setReferralReason(e.target.value)}
                        placeholder="Ej: Se requiere evaluación cognitiva mediante WISC para determinar perfil..."
                        rows={2}
                        className="mt-1 resize-none"
                      />
                    </div>

                    {/* Search DentalSpot professionals */}
                    <div>
                      <Label className="text-sm font-medium">Buscar profesional en DentalSpot</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={searchTerm}
                          onChange={(e) => handleSearchProfessionals(e.target.value)}
                          placeholder="Nombre del profesional..."
                          className="pl-9"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                      </div>

                      {/* Results */}
                      {searchResults.length > 0 && (
                        <div className="mt-2 border rounded-lg divide-y max-h-[180px] overflow-y-auto">
                          {searchResults.map(pro => (
                            <button
                              key={pro.therapist_id}
                              type="button"
                              onClick={() => { setSelectedProfessional(pro); setSearchTerm(pro.full_name); setSearchResults([]); }}
                              className={`w-full flex items-center gap-3 p-2.5 text-left hover:bg-teal-50 transition-colors ${selectedProfessional?.therapist_id === pro.id ? 'bg-teal-50' : ''}`}
                            >
                              {pro.avatar_url ? (
                                <img src={pro.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold">
                                  {(pro.full_name || '?')[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{pro.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{''}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Selected professional */}
                      {selectedProfessional && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
                          <UserPlus className="h-4 w-4 text-teal-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-teal-800 truncate">{selectedProfessional.full_name}</span>
                          <a
                            href={`/profesionales/${selectedProfessional.therapist_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-teal-500" />
                          </a>
                          <button type="button" onClick={() => { setSelectedProfessional(null); setSearchTerm(''); }} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50/50 flex justify-between sm:justify-between">
          {mode === 'view' ? (
            <>
              <div className="flex gap-2">
                {!entry.is_external && entry.therapist_id === user?.id && !entry.details?.is_cloned && entry.source_system !== 'referral_clone' && (
                  <Button onClick={() => setMode('evolve')} className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Edit2 className="h-4 w-4 mr-2" /> Evolucionar
                  </Button>
                )}
                {onDelete && !entry.is_external && entry.therapist_id === user?.id && !entry.details?.is_cloned && entry.source_system !== 'referral_clone' && (
                  <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { if (confirm('¿Eliminar esta entrada clínica?')) { onClose(); onDelete(entry.id); } }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                )}
              </div>
              <Button onClick={onClose} variant="outline">Cerrar</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setMode('view')}>Cancelar</Button>
              <Button onClick={handleSaveEvolution} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Guardar evolución
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewClinicalEntryModal;
