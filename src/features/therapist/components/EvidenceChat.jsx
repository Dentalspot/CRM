import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

const SUGGESTED_QUESTIONS = [
  'Qué instrumentos de evaluación usaron?',
  'Cuáles fueron las limitaciones del estudio?',
  'Cómo puedo aplicar esto en mi práctica clínica?',
  'Qué tamaño de muestra tenía el estudio?',
  'Cuál fue la metodología utilizada?',
];

const EvidenceChat = ({ articleTitle, articleContext, evidenceContext }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (question) => {
    const q = question || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-evidence', {
        body: {
          question: q,
          article_title: articleTitle,
          article_context: articleContext,
          evidence_context: evidenceContext,
          history: messages.slice(-6),
        },
      });

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.answer || 'No se pudo generar una respuesta.' },
      ]);
    } catch (err) {
      logger.error('EvidenceChat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error al consultar. Intenta nuevamente.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-3 w-3" />
        Preguntar sobre este artículo
      </Button>
    );
  }

  return (
    <div className="mt-3 border border-blue-200 rounded-lg bg-blue-50/30 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          Chat sobre este artículo
        </span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.slice(0, 3).map((sq) => (
            <Badge
              key={sq}
              variant="outline"
              className="cursor-pointer text-[10px] hover:bg-blue-100 hover:border-blue-300 transition-colors"
              onClick={() => handleSend(sq)}
            >
              {sq}
            </Badge>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs p-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-100 text-blue-800 ml-8'
                  : 'bg-white text-slate-700 mr-4 border border-slate-100'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analizando artículo...
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Pregunta sobre este artículo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-8 text-xs"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading || !input.trim()} className="h-8 px-3 bg-blue-600 hover:bg-blue-700">
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
};

export default EvidenceChat;
