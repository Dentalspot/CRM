import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, Terminal, Mic, MessageSquare, Sparkles, Clock, Copy, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const TOOLS = [
  { id: 'chat-with-ai', name: 'Asistente Virtual', icon: MessageSquare, desc: 'Chatbot de odontología', color: 'text-blue-600 bg-blue-100', examples: ['¿Qué ejercicios puedo hacer en casa para estimular el lenguaje de mi hijo de 3 años?', '¿Cuándo debería consultar a un odontólogo?', 'Mi hijo tartamudea, ¿es normal a los 4 años?'] },
  { id: 'generate-template', name: 'Generador de Plantillas', icon: Sparkles, desc: 'Crea planes terapéuticos', color: 'text-teal-600 bg-teal-100', examples: ['Genera un plan de tratamiento para un niño de 5 años con trastorno fonológico', 'Plan terapéutico para disfagia en adulto mayor post-ACV', 'Planificación semanal para estimulación de lenguaje expresivo'] },
  { id: 'process-notiz', name: 'Notiz (Resumen)', icon: Mic, desc: 'Resume notas de sesión', color: 'text-purple-600 bg-purple-100', examples: ['Paciente de 4 años, se trabajó conciencia fonológica con actividades de rimas y segmentación silábica. Logró identificar sílaba inicial en 7 de 10 palabras. Se observa mejor atención sostenida. Próxima sesión: trabajar discriminación auditiva.'] },
];

const AiPlaygroundPage = () => {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke(selectedTool.id, {
        body: { message: prompt, text: prompt }
      });
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      const result = error ? `Error: ${error.message}` : (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      setResponse(result);
      setHistory(prev => [{ tool: selectedTool.name, prompt: prompt.slice(0, 80), duration, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PermissionGuard module="ai_tools" action="write">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Terminal className="h-6 w-6 text-blue-500" /> Playground IA</h1>
          <p className="text-muted-foreground">Prueba las herramientas de IA en tiempo real. Selecciona una herramienta, escribe un prompt y ejecuta.</p>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setSelectedTool(tool); setPrompt(''); setResponse(''); }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${selectedTool.id === tool.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded ${tool.color}`}><tool.icon className="h-4 w-4" /></div>
                <span className="font-semibold text-sm">{tool.name}</span>
              </div>
              <p className="text-xs text-gray-500">{tool.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Input — {selectedTool.name}</CardTitle>
              <CardDescription>Escribe tu prompt o usa un ejemplo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={8} placeholder="Escribe tu prompt aquí..." className="font-mono text-sm" />

              <div>
                <p className="text-xs text-gray-500 mb-2">Ejemplos:</p>
                <div className="space-y-1">
                  {selectedTool.examples.map((ex, i) => (
                    <button key={i} onClick={() => setPrompt(ex)} className="block w-full text-left text-xs p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 truncate">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleRun} disabled={loading || !prompt.trim()} className="w-full bg-teal-600 hover:bg-teal-700">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Ejecutar
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Response</CardTitle>
                {response && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-auto min-h-[250px] max-h-[400px] whitespace-pre-wrap">
                {loading ? 'Procesando...' : response || 'La respuesta aparecerá aquí...'}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Historial de pruebas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{h.tool}</Badge>
                      <span className="text-gray-600 truncate max-w-xs">{h.prompt}...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{h.duration}s</span>
                      <span>{h.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
};

export default AiPlaygroundPage;
