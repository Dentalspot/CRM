import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react';
import { sendChatMessage } from '../api/chatbotApi';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'bot',
  content: '¡Hola! Soy el asistente virtual de DentalSpot. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre tratamientos, horarios, o funcionamiento de la plataforma.',
  timestamp: new Date()
};

const ChatbotPage = () => {
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessageText = inputText.trim();
    setInputText('');

    // Add user message
    const newMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Simulate network delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 600));

      // Build chat history from previous messages
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const response = await sendChatMessage(userMessageText, {}, chatHistory);

      let botResponseText;
      if (response) {
        // Edge function returns "reply" field (not "answer")
        botResponseText = response.reply || response.answer || response.text;
      }
      if (!botResponseText) {
        botResponseText = "Lo siento, no tengo información sobre eso en este momento. Por favor, contacta directamente con tu dentista para obtener ayuda personalizada.";
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: botResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "Hubo un error al procesar tu mensaje. Por favor intenta nuevamente.",
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl h-[calc(100vh-100px)]">
      <Helmet>
        <title>Asistente Virtual | DentalSpot</title>
        <meta name="description" content="Chatbot de ayuda para resolver dudas frecuentes." />
      </Helmet>

      <Card className="h-full flex flex-col shadow-xl border-primary/10">
        <CardHeader className="border-b bg-primary/5 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Asistente DentalSpot</CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En línea
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleReset} title="Reiniciar conversación">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50 relative">
          <ScrollArea className="h-full px-4 py-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={`h-8 w-8 mt-1 border ${msg.role === 'bot' ? 'bg-primary/10 border-primary/20' : 'bg-secondary border-secondary'}`}>
                      <AvatarFallback className={msg.role === 'bot' ? 'text-primary' : 'text-secondary-foreground'}>
                        {msg.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                      </AvatarFallback>
                    </Avatar>

                    <div 
                      className={`
                        max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm
                        ${msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                        }
                        ${msg.isError ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                      `}
                    >
                      {msg.content}
                      <div className={`text-[10px] mt-1 opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3"
                >
                  <Avatar className="h-8 w-8 mt-1 bg-primary/10 border border-primary/20">
                    <AvatarFallback className="text-primary"><Bot size={16} /></AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex w-full gap-3 items-center">
            <Input 
              placeholder="Escribe tu pregunta aquí..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1"
              disabled={isLoading}
              autoFocus
            />
            <Button type="submit" disabled={!inputText.trim() || isLoading} className="shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatbotPage;