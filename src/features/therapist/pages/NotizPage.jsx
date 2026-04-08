import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Mic, Square, Loader2, Save, Play, Pause, FileText, 
  Brain, CheckCircle2, RotateCcw, Activity, User, Clock,
  ArrowRight, Wand2
} from 'lucide-react';
import { processNotizSession, updateNotizSession, saveNotizToClinicalHistory, getNotizSessions } from '../api/notizApi';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

// --- RECORDING COMPONENT ---
const NotizRecorder = ({ onRecordingComplete, patients }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    return () => {
      stopCleanup();
    };
  }, []);

  const stopCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    try {
      // Request mic with simple constraints for max Safari compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setAudioStream(stream);

      // Detect best MIME type FIRST (Safari = mp4, Chrome = webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
      const isSafari = mimeType.includes('mp4') || !MediaRecorder.isTypeSupported('audio/webm');

      // Setup Recorder FIRST (before AudioContext to avoid Safari stream conflicts)
      const recorderOptions = mimeType ? { mimeType } : {};
      mediaRecorderRef.current = new MediaRecorder(stream, recorderOptions);
      chunksRef.current = [];
      const actualMime = mediaRecorderRef.current.mimeType || 'audio/webm';
      console.log('MediaRecorder using:', actualMime, isSafari ? '(Safari)' : '(Chrome)');

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime });
        stopCleanup();
        if (blob.size < 1000) {
          alert('La grabación no capturó audio. Verifica que tu micrófono funcione e intenta de nuevo.');
          return;
        }
        onRecordingComplete(blob, selectedPatientId);
      };

      mediaRecorderRef.current.onerror = (e) => {
        logger.error('MediaRecorder error:', e);
        stopCleanup();
        setIsRecording(false);
        alert('Error de grabación: el micrófono dejó de funcionar. Intenta de nuevo.');
      };

      // Listen for track ending (Safari capture failure)
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          logger.warn('Audio track ended unexpectedly');
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        };
      });

      // Start recording immediately
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);

      // Setup Visualizer AFTER recorder starts, using a CLONED stream
      // Safari kills the original stream if AudioContext interferes
      try {
        const vizStream = isSafari ? stream.clone() : stream;
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        sourceRef.current = audioContextRef.current.createMediaStreamSource(vizStream);
        sourceRef.current.connect(analyserRef.current);
        drawVisualizer();
      } catch (vizErr) {
        // Visualizer is non-critical, recording continues without it
        logger.warn('Visualizer setup failed (non-critical):', vizErr);
      }

      // Timer
      setDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      logger.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(249, 250, 251)'; // Background color (gray-50)
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`; // Purple-ish
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-teal-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-teal-800 flex items-center justify-center gap-2">
          <Mic className="h-6 w-6" />
          Nueva Sesión Notiz
        </CardTitle>
        <CardDescription className="text-center">
          Graba tu sesión y deja que la IA tome las notas por ti.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <Label>Paciente (Opcional)</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={isRecording}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar paciente..." />
            </SelectTrigger>
            <SelectContent>
              {patients.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 py-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-5xl font-mono font-bold text-gray-700 tabular-nums">
            {formatTime(duration)}
          </div>
          
          <div className="h-24 w-full flex items-center justify-center overflow-hidden px-4">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={100} 
              className="w-full h-full rounded bg-gray-50"
            />
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            {!isRecording ? (
              <Button
                size="lg"
                className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition-all hover:scale-105 flex flex-col items-center justify-center gap-1"
                onClick={startRecording}
              >
                <Mic className="h-8 w-8 text-white" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 shadow-lg transition-all hover:scale-105 ring-4 ring-red-200 animate-pulse flex flex-col items-center justify-center gap-1"
                onClick={stopRecording}
              >
                <Square className="h-7 w-7 text-white" />
              </Button>
            )}
            <span className="text-sm font-medium text-gray-500">
              {isRecording ? 'Toca para detener y procesar' : 'Toca para grabar'}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 animate-pulse">
            {isRecording ? "Grabando..." : "Listo para grabar"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// --- REVIEW COMPONENT ---
const NotizReviewer = ({ session, onSave, onBack, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editableData, setEditableData] = useState(null);

  useEffect(() => {
    if (session) {
      const soap = session.extracted_data?.soap || session.soap || {};
      setEditableData({
        summary: session.summary,
        subjective: soap.subjective || '',
        objective: soap.objective || '',
        analysis: soap.analysis || '',
        plan: soap.plan || '',
        smart_objective: session.extracted_data?.smart_objective || session.smart_objective || '',
        diagnosis: session.extracted_data?.diagnosis_observations || '',
        symptoms: (session.extracted_data?.symptoms_observed || []).join('\n'),
        progress: session.extracted_data?.patient_progress || '',
        recommendations: (session.extracted_data?.recommendations || []).join('\n'),
        transcription: session.transcription
      });
    }
  }, [session]);

  if (!session || !editableData) return null;

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    try {
      // Re-construct the data object with current edits
      const updatedSession = {
        ...session,
        summary: editableData.summary,
        transcription: editableData.transcription,
        extracted_data: {
          ...session.extracted_data,
          soap: {
            subjective: editableData.subjective,
            objective: editableData.objective,
            analysis: editableData.analysis,
            plan: editableData.plan,
          },
          smart_objective: editableData.smart_objective,
          diagnosis_observations: editableData.diagnosis,
          symptoms_observed: editableData.symptoms.split('\n').filter(s => s.trim()),
          patient_progress: editableData.progress,
          recommendations: editableData.recommendations.split('\n').filter(s => s.trim())
        }
      };

      await onSave(updatedSession);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-teal-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-teal-600" />
            Revisión de Sesión IA
          </h2>
          <p className="text-gray-500">Revisa y edita la información antes de guardar en la ficha clínica.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Nueva Grabación
          </Button>
          <Button onClick={handleSaveToHistory} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar en Historial
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SOAP Format */}
      <div className="space-y-4">
        {/* Summary */}
        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Resumen Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editableData.summary}
              onChange={(e) => setEditableData(prev => ({ ...prev, summary: e.target.value }))}
              className="min-h-[60px] bg-white"
            />
          </CardContent>
        </Card>

        {/* SOAP Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 font-bold text-xs">S</Badge>
                Subjetivo
              </CardTitle>
              <CardDescription className="text-xs">Lo que reporta el paciente, familia o cuidador</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableData.subjective}
                onChange={(e) => setEditableData(prev => ({ ...prev, subjective: e.target.value }))}
                className="min-h-[100px]"
                placeholder="Ej: Madre refiere que el niño pidió agua verbalmente en 3 ocasiones..."
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 font-bold text-xs">O</Badge>
                Objetivo
              </CardTitle>
              <CardDescription className="text-xs">Lo que observas, evalúas o mides en sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableData.objective}
                onChange={(e) => setEditableData(prev => ({ ...prev, objective: e.target.value }))}
                className="min-h-[100px]"
                placeholder="Ej: Produjo estructuras CV en 7/10 oportunidades con apoyo visual..."
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 font-bold text-xs">A</Badge>
                Análisis
              </CardTitle>
              <CardDescription className="text-xs">Tu juicio clínico — interpreta qué significa lo observado</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableData.analysis}
                onChange={(e) => setEditableData(prev => ({ ...prev, analysis: e.target.value }))}
                className="min-h-[100px]"
                placeholder="Ej: Se observa progreso en intención comunicativa, aún requiere apoyos..."
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 font-bold text-xs">P</Badge>
                Plan
              </CardTitle>
              <CardDescription className="text-xs">Siguiente foco terapéutico, indicaciones, tareas para casa</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editableData.plan}
                onChange={(e) => setEditableData(prev => ({ ...prev, plan: e.target.value }))}
                className="min-h-[100px]"
                placeholder="Ej: En próxima sesión se reforzará expansión de vocabulario funcional..."
              />
            </CardContent>
          </Card>
        </div>

        {/* SMART Objective */}
        <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50/50 to-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-teal-600" />
              Objetivo SMART
            </CardTitle>
            <CardDescription className="text-xs">Específico, Medible, Alcanzable, Relevante, con Tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editableData.smart_objective}
              onChange={(e) => setEditableData(prev => ({ ...prev, smart_objective: e.target.value }))}
              className="min-h-[60px]"
              placeholder="Ej: En 4 semanas, el niño realizará al menos 5 peticiones espontáneas por sesión con apoyo gestual mínimo en el 80% de las oportunidades."
            />
          </CardContent>
        </Card>

        {/* Transcription + Details (collapsible) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                Transcripción Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-gray-50">
                <Textarea
                  value={editableData.transcription}
                  onChange={(e) => setEditableData(prev => ({ ...prev, transcription: e.target.value }))}
                  className="min-h-[180px] border-none shadow-none focus-visible:ring-0 bg-transparent resize-none p-0 text-sm"
                />
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
                Detalles Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-gray-500">Síntomas Observados</Label>
                <Textarea
                  value={editableData.symptoms}
                  onChange={(e) => setEditableData(prev => ({ ...prev, symptoms: e.target.value }))}
                  className="min-h-[50px] text-sm"
                  placeholder="Uno por línea"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500">Recomendaciones</Label>
                <Textarea
                  value={editableData.recommendations}
                  onChange={(e) => setEditableData(prev => ({ ...prev, recommendations: e.target.value }))}
                  className="min-h-[50px] text-sm"
                  placeholder="Uno por línea"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const NotizPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState('record'); // record, review, history

  useEffect(() => {
    loadPatients();
    loadHistory();
  }, [user]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, full_name:profiles!profile_id(full_name)')
      .eq('therapist_id', user.id)
      .eq('status', 'active');
    
    // Flatten structure safely
    const formattedPatients = (data || []).map(p => ({
      id: p.id,
      full_name: p.full_name?.full_name || 'Paciente'
    }));
    setPatients(formattedPatients);
  };

  const loadHistory = async () => {
    try {
      const data = await getNotizSessions(user.id);
      setHistory(data || []);
    } catch (error) {
      logger.error(error);
    }
  };

  const [processingStatus, setProcessingStatus] = useState('');

  const handleRecordingComplete = async (audioBlob, patientId) => {
    setIsProcessing(true);
    setViewMode('processing');
    setProcessingStatus('Preparando audio...');

    try {
      const patient = patients.find(p => p.id === patientId);
      const context = patient ? `El paciente es ${patient.full_name}.` : '';
      const isLong = audioBlob.size > 5 * 1024 * 1024;
      if (isLong) {
        setProcessingStatus('Audio largo detectado. Subiendo...');
      }

      const session = await processNotizSession(
        audioBlob, user.id, patientId || null, context,
        (status) => setProcessingStatus(status)
      );
      
      setCurrentSession(session);
      setViewMode('review');
      toast({ title: "¡Análisis completado!", description: "La IA ha procesado tu sesión exitosamente." });
    } catch (error) {
      logger.error(error);
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: error.message || "Hubo un problema con la transcripción o análisis. Intenta nuevamente."
      });
      setViewMode('record');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSession = async (updatedSessionData) => {
    try {
      await saveNotizToClinicalHistory(updatedSessionData);
      toast({ title: "Guardado exitoso", description: "La nota se ha añadido al historial clínico del paciente." });
      setViewMode('history');
      loadHistory(); // Refresh list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mic className="h-8 w-8 text-teal-600" />
            Notiz AI
          </h1>
          <p className="text-muted-foreground">Tu asistente inteligente para documentación clínica automática.</p>
        </div>
        
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record" disabled={isProcessing}>Grabar</TabsTrigger>
            <TabsTrigger value="history" disabled={isProcessing}>Historial</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'processing' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-teal-200 rounded-full blur-xl animate-pulse opacity-50"></div>
            <Brain className="h-20 w-20 text-teal-600 relative z-10 animate-bounce" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Procesando audio...</h3>
            <p className="text-gray-500 max-w-md">
              {processingStatus || 'Estamos transcribiendo y analizando la sesión con IA. Esto puede tomar unos segundos.'}
            </p>
            <p className="text-xs text-gray-400">
              Sesiones largas (30-45 min) pueden demorar 1-2 minutos.
            </p>
          </div>
        </div>
      )}

      {viewMode === 'record' && (
        <NotizRecorder 
          onRecordingComplete={handleRecordingComplete} 
          patients={patients} 
        />
      )}

      {viewMode === 'review' && (
        <NotizReviewer 
          session={currentSession} 
          onSave={handleSaveSession}
          onBack={() => setViewMode('record')}
        />
      )}

      {viewMode === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Sesiones Notiz</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay sesiones guardadas aún.
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'saved' ? 'default' : 'secondary'} className={item.status === 'saved' ? 'bg-green-600' : ''}>
                          {item.status === 'saved' ? 'Guardado en Ficha' : 'Borrador'}
                        </Badge>
                        <span className="font-medium text-gray-900">
                          {format(new Date(item.created_at), "PPP p", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {item.patient?.full_name || 'Paciente no asignado'} - {item.summary || 'Sin resumen'}
                      </p>
                    </div>
                    
                    {item.status !== 'saved' && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setCurrentSession(item);
                        setViewMode('review');
                      }}>
                        Continuar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotizPage;