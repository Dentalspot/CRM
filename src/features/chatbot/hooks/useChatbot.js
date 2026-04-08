import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sendChatMessage } from '../api/chatbotApi';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const INITIAL_SUGGESTIONS = [
  "¿Cuáles son mis próximas citas?",
  "¿Qué ejercicios tengo pendientes?",
  "¿Cómo contacto a mi dentista?",
  "Ver mis documentos"
];

export const useChatbot = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (messages.length === 0 && (user || profile)) {
      const firstName = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || '';
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `¡Hola${firstName ? ` ${firstName}` : ''}! 👋 Soy tu asistente virtual de DentalSpot. ¿En qué puedo ayudarte hoy?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [user, profile, messages.length]);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleSendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setSuggestions([]);

    try {
      const patientContext = {
        id: user?.id,
        name: profile?.full_name || user?.full_name,
        role: profile?.role || user?.role,
        email: user?.email
      };

      const response = await sendChatMessage(text, patientContext, messages);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply || response.message || response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.suggestions && Array.isArray(response.suggestions)) {
        setSuggestions(response.suggestions);
      } else {
        setSuggestions(INITIAL_SUGGESTIONS);
      }

    } catch (error) {
      logger.error('Chat API error, using fallback:', error);

      const fallback = generateLocalResponse(text.trim(), profile);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      setSuggestions(fallback.suggestions || INITIAL_SUGGESTIONS);

    } finally {
      setIsLoading(false);
    }
  }, [user, profile, messages, isLoading]);

  return {
    isOpen,
    toggleChat,
    messages,
    isLoading,
    suggestions,
    handleSendMessage,
    messagesEndRef
  };
};

function generateLocalResponse(question, profile) {
  const q = question.toLowerCase();
  const firstName = profile?.full_name?.split(' ')[0] || '';

  if (q.includes('cita') || q.includes('sesion') || q.includes('sesión') || q.includes('agenda')) {
    return {
      message: "Puedes ver todas tus citas en la sección **Mis Próximas Sesiones** de tu panel principal, o ir al **Calendario** desde el menú lateral.",
      suggestions: ["Contactar a mi dentista", "Ver mis ejercicios", "Ver mis documentos"]
    };
  }

  if (q.includes('ejercicio') || q.includes('actividad') || q.includes('tarea') || q.includes('pendiente')) {
    return {
      message: "Tus ejercicios pendientes están en **Mis Ejercicios Pendientes** del panel. 💪 Completarlos es clave para tu progreso.",
      suggestions: ["Ver mis citas", "Contactar a mi dentista"]
    };
  }

  if (q.includes('dentista') || q.includes('contactar') || q.includes('odontologo') || q.includes('odontólogo')) {
    return {
      message: "La información de tu dentista está en la tarjeta **Mi Dentista** de tu panel. Ahí tienes teléfono, email y acceso a su perfil.",
      suggestions: ["Ver mis citas", "Ver mis ejercicios"]
    };
  }

  if (q.includes('documento') || q.includes('informe') || q.includes('certificado')) {
    return {
      message: "Tus documentos están en **Mis Documentos**. Puedes descargarlos haciendo clic en el ícono de descarga. 📄",
      suggestions: ["Ver mis citas", "Contactar a mi dentista"]
    };
  }

  if (q.includes('pago') || q.includes('deuda') || q.includes('precio')) {
    return {
      message: "Los pagos pendientes aparecen en tu panel. Para detalles de precios, contacta a tu dentista.",
      suggestions: ["Contactar a mi dentista", "Ver mis citas"]
    };
  }

  if (q.includes('hola') || q.includes('buenos') || q.includes('buenas')) {
    return {
      message: `¡Hola${firstName ? ` ${firstName}` : ''}! 😊 ¿En qué puedo ayudarte?`,
      suggestions: INITIAL_SUGGESTIONS
    };
  }

  if (q.includes('gracias')) {
    return {
      message: "¡De nada! 😊 ¿Algo más en lo que pueda ayudarte?",
      suggestions: INITIAL_SUGGESTIONS
    };
  }

  if (q.includes('ayuda') || q.includes('que puedes')) {
    return {
      message: "Puedo ayudarte con:\n• 📅 Citas\n• 📝 Ejercicios\n• 📄 Documentos\n• 👨‍⚕️ Contacto dentista\n• 💰 Pagos\n\n¿Qué necesitas?",
      suggestions: INITIAL_SUGGESTIONS
    };
  }

  return {
    message: "Te recomiendo revisar tu panel principal o contactar a tu dentista. ¿Algo más en lo que pueda ayudarte?",
    suggestions: INITIAL_SUGGESTIONS
  };
}

export default useChatbot;