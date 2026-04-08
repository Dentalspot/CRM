import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, MinusCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChatbot } from '../hooks/useChatbot';
import ChatMessage from './ChatMessage';
import QuickSuggestions from './QuickSuggestions';
import { cn } from '@/lib/utils';

const FloatingAssistant = () => {
  const {
    isOpen,
    toggleChat,
    messages,
    isLoading,
    suggestions,
    handleSendMessage,
    messagesEndRef
  } = useChatbot();

  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    handleSendMessage(inputText);
    setInputText('');
  };

  const handleSuggestionSelect = (text) => {
    handleSendMessage(text);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mb-4 pointer-events-auto origin-bottom-right"
          >
            <Card className="w-[350px] md:w-[400px] h-[500px] md:h-[600px] shadow-2xl flex flex-col overflow-hidden border-0 rounded-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shadow-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <span className="text-xl">🤖</span>
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Asistente DentalSpot</h3>
                    <p className="text-xs text-indigo-100 opacity-90">Siempre disponible 24/7</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                    onClick={toggleChat}
                  >
                    <MinusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">¡Hola! Soy tu asistente IA.</p>
                    <p className="text-xs text-slate-400 mt-1">Pregúntame sobre tus citas, documentos o progreso.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))
                )}
                
                {isLoading && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Area - Appears above input if any */}
              {!isLoading && suggestions.length > 0 && (
                <div className="bg-slate-50 px-2 pb-2">
                  <QuickSuggestions suggestions={suggestions} onSelect={handleSuggestionSelect} />
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-2 relative">
                  <Input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="pr-10 rounded-full bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!inputText.trim() || isLoading}
                    className={cn(
                      "rounded-full absolute right-1 top-1 h-8 w-8 transition-all",
                      inputText.trim() ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-200 text-slate-400 hover:bg-slate-200"
                    )}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                  </Button>
                </form>
                <div className="text-[10px] text-center text-slate-400 mt-2">
                  La IA puede cometer errores. Verifica la información importante.
                </div>
              </div>

            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto"
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 shadow-xl flex items-center justify-center transition-all duration-300",
            isOpen 
              ? "bg-slate-800 hover:bg-slate-900 text-white rotate-0" 
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                className="relative"
              >
                <MessageCircle className="h-7 w-7" />
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    </div>
  );
};

export default FloatingAssistant;