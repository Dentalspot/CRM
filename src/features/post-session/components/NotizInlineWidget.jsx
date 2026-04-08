import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Square, 
  Loader2, 
  Wand2, 
  Keyboard, 
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const NotizInlineWidget = ({ 
  patientId, 
  therapistId, 
  patientContext = '',
  onResult 
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState(null); // null | 'audio' | 'text'
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Text state
  const [freeText, setFreeText] = useState('');

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  // ========== AUDIO RECORDING ==========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect best MIME type (Safari doesn't support webm)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
      const recorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      const actualMime = recorder.mimeType || 'audio/webm';
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Handle track ending (Safari capture failure / mic disconnect)
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          logger.warn('Audio track ended unexpectedly (capture failure or mic disconnect)');
          if (recorder.state === 'recording') {
            setProcessing(true);
            recorder.stop();
          }
          stopRecordingCleanup();
        };
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Clean up stream tracks now that recording data is captured
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const blob = new Blob(chunksRef.current, { type: actualMime });
        if (blob.size < 1000) {
          toast({ variant: 'destructive', title: 'Audio vacío', description: 'La grabación no capturó audio. Verifica tu micrófono.' });
          setProcessing(false);
          return;
        }
        processAudio(blob);
      };

      recorder.onerror = (e) => {
        logger.error('MediaRecorder error:', e);
        toast({ variant: 'destructive', title: 'Error de grabación', description: 'El micrófono dejó de funcionar. Intenta de nuevo.' });
        stopRecordingCleanup();
      };

      recorder.start(1000); // Collect data every 1s for Safari compat
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo acceder al micrófono.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setProcessing(true);
      mediaRecorderRef.current.stop(); // triggers onstop → processAudio
      // Cleanup timer and UI immediately, but keep stream alive until onstop fires
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      // Stream tracks are stopped after onstop processes the audio
      setTimeout(() => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      }, 500);
    }
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ========== PROCESS AUDIO ==========
  const processAudio = async (blob) => {
    setProcessing(true);
    try {
      const formData = new FormData();
      const mimeType = blob.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const audioFile = new File([blob], `session_recording.${ext}`, { type: mimeType });
      formData.append('file', audioFile);
      if (patientContext) formData.append('patientContext', patientContext);
      if (therapistId) formData.append('therapist_id', therapistId);
      if (patientId) formData.append('patient_id', patientId);
      formData.append('title', `Sesión ${new Date().toLocaleDateString('es-CL')}`);
      formData.append('duration', String(duration || 0));

      const { data, error } = await supabase.functions.invoke('process-notiz', {
        body: formData,
      });

      if (error) throw error;

      deliverResult(data);
    } catch (err) {
      logger.error('Notiz audio error:', err);
      toast({ variant: 'destructive', title: 'Error al procesar audio', description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // ========== PROCESS TEXT ==========
  const processText = async () => {
    if (!freeText.trim()) {
      toast({ variant: 'destructive', title: 'Escribe algo primero.' });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-notiz-text', {
        body: { 
          text: freeText, 
          patientContext,
          patientId: patientId || null 
        },
      });

      if (error) {
        // Fallback: si no existe la edge function, estructurar localmente
        logger.warn('Edge function not available, using local structuring');
        deliverResult({
          transcription: freeText,
          analysis: {
            summary: freeText,
            key_points: [],
            next_steps: [],
            diagnosis_observations: '',
            symptoms_observed: [],
            exercises_performed: [],
            patient_progress: '',
            recommendations: [],
          }
        });
        return;
      }

      deliverResult(data);
    } catch (err) {
      logger.error('Notiz text error:', err);
      // Fallback graceful: devolver el texto tal cual
      deliverResult({
        transcription: freeText,
        analysis: {
          summary: freeText,
          key_points: [],
          next_steps: [],
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  // ========== DELIVER TO PARENT ==========
  const deliverResult = (data) => {
    const { transcription, analysis } = data;

    const sessionNotes = analysis.summary || transcription || '';
    const objectives = [
      ...(analysis.exercises_performed || []),
      ...(analysis.symptoms_observed || []),
    ].join(', ');
    const nextSteps = [
      ...(analysis.next_steps || []),
      ...(analysis.recommendations || []),
    ].join('. ');

    onResult?.({
      sessionNotes,
      objectives,
      nextSteps,
      fullAnalysis: analysis,
      transcription,
    });

    setProcessed(true);
  };

  // ========== RESET ==========
  const handleReset = () => {
    setMode(null);
    setProcessed(false);
    setFreeText('');
    setDuration(0);
  };

  // ========== YA PROCESADO ==========
  if (processed) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Nota generada con IA
          </span>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px]">
            Notiz
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-green-600">
          <RotateCcw className="h-3 w-3 mr-1" />
          Rehacer
        </Button>
      </div>
    );
  }

  // ========== PROCESANDO ==========
  if (processing) {
    return (
      <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-violet-50 border border-violet-200">
        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
        <span className="text-sm font-medium text-violet-800">
          La IA está estructurando tu nota...
        </span>
      </div>
    );
  }

  // ========== GRABANDO ==========
  if (mode === 'audio' && isRecording) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-800">
            Grabando... {formatTime(duration)}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={stopRecording}
        >
          <Square className="h-3.5 w-3.5 mr-1" />
          Detener
        </Button>
      </div>
    );
  }

  // ========== MODO TEXTO ==========
  if (mode === 'text') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            Escribe libre — la IA lo estructura
          </span>
          <Button variant="ghost" size="sm" className="text-xs text-gray-400 h-6" onClick={() => setMode(null)}>
            Cambiar modo
          </Button>
        </div>
        <Textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Ej: Paciente mejoró articulación de /r/ en posición inicial, trabajamos ejercicios de soplo y respiración diafragmática. Para la próxima reforzar en posición final..."
          rows={4}
          className="resize-none text-sm"
          autoFocus
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={processText}
            disabled={!freeText.trim()}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            Estructurar con IA
          </Button>
        </div>
      </div>
    );
  }

  // ========== MODO AUDIO (pre-grabar) ==========
  if (mode === 'audio') {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-sm text-gray-600">Presiona para empezar a dictar tu nota</p>
        <Button
          size="lg"
          className="bg-red-500 hover:bg-red-600 text-white rounded-full h-14 w-14 p-0"
          onClick={startRecording}
        >
          <Mic className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => setMode(null)}>
          Cambiar modo
        </Button>
      </div>
    );
  }

  // ========== SELECTOR DE MODO ==========
  return (
    <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/30 p-3">
      <p className="text-xs font-medium text-violet-700 mb-2 flex items-center gap-1.5">
        <Wand2 className="h-3.5 w-3.5" />
        Notiz — Genera tu nota con IA
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-100 text-xs"
          onClick={() => setMode('audio')}
        >
          <Mic className="h-3.5 w-3.5 mr-1.5" />
          Dictar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-100 text-xs"
          onClick={() => setMode('text')}
        >
          <Keyboard className="h-3.5 w-3.5 mr-1.5" />
          Escribir libre
        </Button>
      </div>
    </div>
  );
};

export default NotizInlineWidget;