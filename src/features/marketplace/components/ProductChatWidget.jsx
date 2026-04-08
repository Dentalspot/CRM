import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const ProductChatWidget = ({ productId, productTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    '¿Para qué edades es recomendado?',
    '¿Qué incluye este producto?',
    '¿Cómo se usa en terapia?',
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const { data, error } = await supabase.functions.invoke('marketplace-product-chat', {
        body: {
          productId,
          userMessage: text.trim(),
          chatHistory: messages.slice(-6),
        },
      });

      if (error) throw error;

      const reply = data?.reply || 'Lo siento, no pude procesar tu consulta.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (data?.suggestions?.length) setSuggestions(data.suggestions);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Hubo un error al procesar tu consulta. Intenta nuevamente.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-all hover:scale-105 flex items-center justify-center"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border-slate-200">
      {/* Header */}
      <div className="bg-teal-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Asistente de producto</p>
            <p className="text-[10px] text-teal-200 truncate max-w-[200px]">{productTitle}</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 rounded-full p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-teal-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">¿Tienes dudas sobre este producto?</p>
            <p className="text-xs text-slate-400 mt-1">Pregunta lo que necesites</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-teal-600" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-teal-600 text-white rounded-tr-sm'
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-teal-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 rounded-tl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto shrink-0">
          {suggestions.map((s, i) => (
            <Badge
              key={i}
              variant="outline"
              className="cursor-pointer text-[10px] py-1 px-2 bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 whitespace-nowrap shrink-0"
              onClick={() => sendMessage(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="text-sm h-9"
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            className="bg-teal-600 hover:bg-teal-700 h-9 w-9 p-0 shrink-0"
            disabled={!input.trim() || loading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ProductChatWidget;
