import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { sendChatMessage } from '../api/chatbotApi';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

// ── Suggestions by context ──────────────────────────────────
const SUGGESTIONS_VISITOR = [
  "¿Cuáles son los precios de los planes?",
  "¿Cómo me registro como dentista?",
  "¿Qué incluye DentalSpot?",
  "¿Cómo funciona la IA dental?"
];

const SUGGESTIONS_PATIENT = [
  "¿Cuáles son mis próximas citas?",
  "¿Cómo contacto a mi dentista?",
  "¿Cómo va mi tratamiento?",
  "Ver mis documentos"
];

const SUGGESTIONS_THERAPIST = [
  "Ver mis pacientes de hoy",
  "¿Cómo uso las herramientas IA?",
  "Gestionar mi agenda",
  "Generar informe clínico"
];

// ── Determine context ───────────────────────────────────────
function getChatContext(user, profile, pathname) {
  if (!user) return 'visitor';
  const role = profile?.role || user?.role;
  if (role === 'therapist' || role === 'admin' || role === 'clinic') return 'therapist';
  return 'patient';
}

function getSuggestionsFor(context) {
  if (context === 'therapist') return SUGGESTIONS_THERAPIST;
  if (context === 'patient') return SUGGESTIONS_PATIENT;
  return SUGGESTIONS_VISITOR;
}

// ── Hook ────────────────────────────────────────────────────
export const useChatbot = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { pathname } = useLocation();

  const chatContext = useMemo(
    () => getChatContext(user, profile, pathname),
    [user, profile, pathname]
  );

  const defaultSuggestions = useMemo(
    () => getSuggestionsFor(chatContext),
    [chatContext]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultSuggestions);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Update suggestions when context changes (e.g. login/logout)
  useEffect(() => {
    setSuggestions(defaultSuggestions);
  }, [defaultSuggestions]);

  // Welcome message based on context
  useEffect(() => {
    if (messages.length > 0) return;

    let content;
    if (chatContext === 'therapist') {
      const name = profile?.full_name?.split(' ')[0] || '';
      content = `¡Hola${name ? ` ${name}` : ''}! 👋 Soy tu asistente clínico de DentalSpot. Puedo ayudarte con tus pacientes, agenda y herramientas IA.`;
    } else if (chatContext === 'patient') {
      const name = profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || '';
      content = `¡Hola${name ? ` ${name}` : ''}! 👋 Soy tu asistente virtual de DentalSpot. ¿En qué puedo ayudarte hoy?`;
    } else {
      content = '¡Hola! 👋 Soy el asistente de DentalSpot. Puedo ayudarte con información sobre nuestros planes, precios y cómo funciona la plataforma.';
    }

    setMessages([{
      id: 'welcome-msg',
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    }]);
  }, [chatContext, user, profile, messages.length]);

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

      const response = await sendChatMessage(text, patientContext, messages, chatContext === 'visitor');

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
        setSuggestions(defaultSuggestions);
      }

    } catch (error) {
      logger.error('Chat API error, using fallback:', error);

      const fallback = generateLocalResponse(text.trim(), profile, chatContext);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallback.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      setSuggestions(fallback.suggestions || defaultSuggestions);

    } finally {
      setIsLoading(false);
    }
  }, [user, profile, messages, isLoading, chatContext, defaultSuggestions]);

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

// ── Local fallback responses ────────────────────────────────
function generateLocalResponse(question, profile, context) {
  const q = question.toLowerCase();
  const firstName = profile?.full_name?.split(' ')[0] || '';

  // ── Visitor-specific responses ──
  if (context === 'visitor') {
    if (q.includes('precio') || q.includes('plan') || q.includes('costo') || q.includes('valor') || q.includes('cuanto') || q.includes('cuánto')) {
      return {
        message: "DentalSpot ofrece distintos planes adaptados a tus necesidades. Puedes ver todos los detalles y precios en nuestra sección de **Planes**. Tenemos opciones desde consultorios individuales hasta clínicas grandes.",
        suggestions: ["¿Cómo me registro?", "¿Qué incluye cada plan?", "¿Tiene prueba gratis?"]
      };
    }
    if (q.includes('registr') || q.includes('crear cuenta') || q.includes('inscribir') || q.includes('unirme')) {
      return {
        message: "Registrarte es muy fácil:\n1. Haz clic en **Registrarse** arriba\n2. Completa tus datos profesionales\n3. Elige tu plan\n4. ¡Listo! Ya puedes empezar a gestionar tus pacientes con IA.",
        suggestions: ["¿Cuáles son los precios?", "¿Qué incluye DentalSpot?", "¿Es seguro?"]
      };
    }
    if (q.includes('incluye') || q.includes('funcionalidad') || q.includes('caracteristic') || q.includes('que ofrece') || q.includes('qué ofrece')) {
      return {
        message: "DentalSpot incluye:\n• 🦷 Gestión de pacientes y fichas clínicas\n• 📅 Agenda inteligente con recordatorios\n• 🤖 Herramientas de IA (análisis, informes)\n• 📄 Documentos y odontogramas digitales\n• 📊 Reportes y métricas\n• 💬 Chat con pacientes",
        suggestions: ["¿Cuáles son los precios?", "¿Cómo me registro?", "¿Cómo funciona la IA?"]
      };
    }
    if (q.includes('ia') || q.includes('inteligencia') || q.includes('funciona') || q.includes('como es') || q.includes('cómo es')) {
      return {
        message: "Nuestra IA dental te ayuda con:\n• **Análisis clínico** asistido por IA\n• **Generación de informes** automáticos\n• **Asistente virtual** para tus pacientes\n• **Transcripción** de notas de sesión\n\nTodo diseñado para que te enfoques en lo que importa: tus pacientes.",
        suggestions: ["¿Cuáles son los precios?", "¿Cómo me registro?", "¿Es seguro?"]
      };
    }
    if (q.includes('segur') || q.includes('dato') || q.includes('privacidad') || q.includes('proteg')) {
      return {
        message: "Tus datos están protegidos con **encriptación de nivel bancario**. Cumplimos con todas las normativas de protección de datos de salud. Nunca compartimos información de pacientes con terceros.",
        suggestions: ["¿Cuáles son los precios?", "¿Cómo me registro?"]
      };
    }
    if (q.includes('prueba') || q.includes('gratis') || q.includes('free') || q.includes('trial') || q.includes('demo')) {
      return {
        message: "¡Puedes probar DentalSpot! Regístrate y explora la plataforma. Visita nuestra sección de **Planes** para ver las opciones disponibles.",
        suggestions: ["¿Cómo me registro?", "¿Cuáles son los precios?"]
      };
    }
    if (q.includes('hola') || q.includes('buenos') || q.includes('buenas')) {
      return {
        message: "¡Hola! 😊 Soy el asistente de DentalSpot. ¿En qué puedo ayudarte? Puedo contarte sobre nuestros planes, precios, funcionalidades o cómo registrarte.",
        suggestions: SUGGESTIONS_VISITOR
      };
    }
    if (q.includes('gracias')) {
      return {
        message: "¡De nada! 😊 Si tienes más dudas sobre DentalSpot, no dudes en preguntar.",
        suggestions: SUGGESTIONS_VISITOR
      };
    }
    return {
      message: "Puedo ayudarte con información sobre DentalSpot: planes, precios, funcionalidades y registro. ¿Qué te gustaría saber?",
      suggestions: SUGGESTIONS_VISITOR
    };
  }

  // ── Therapist-specific responses ──
  if (context === 'therapist') {
    if (q.includes('paciente') || q.includes('hoy') || q.includes('agenda')) {
      return {
        message: "Puedes ver tus pacientes y citas del día en tu **Panel Principal** o en la sección **Agenda** del menú lateral.",
        suggestions: ["Generar informe", "Herramientas IA", "Ver documentos"]
      };
    }
    if (q.includes('ia') || q.includes('herramienta') || q.includes('inteligencia')) {
      return {
        message: "Tus herramientas IA están en el menú lateral:\n• **Notiz** - Transcripción de sesiones\n• **Plantillas IA** - Generación de planes de tratamiento\n• **Asistente clínico** - Consultas sobre tus pacientes",
        suggestions: ["Ver mi agenda", "Gestionar pacientes"]
      };
    }
    if (q.includes('informe') || q.includes('reporte') || q.includes('documento')) {
      return {
        message: "Puedes generar informes desde la ficha de cada paciente o usar las **Plantillas IA** para crear planes de tratamiento basados en evidencia.",
        suggestions: ["Ver mi agenda", "Herramientas IA"]
      };
    }
  }

  // ── Patient-specific responses (default for logged-in) ──
  if (q.includes('cita') || q.includes('sesion') || q.includes('sesión') || q.includes('agenda')) {
    return {
      message: "Puedes ver todas tus citas en la sección **Mis Próximas Sesiones** de tu panel principal, o ir al **Calendario** desde el menú lateral.",
      suggestions: ["Contactar a mi dentista", "Ver mis documentos"]
    };
  }

  if (q.includes('dentista') || q.includes('contactar') || q.includes('odontologo') || q.includes('odontólogo')) {
    return {
      message: "La información de tu dentista está en la tarjeta **Mi Dentista** de tu panel. Ahí tienes teléfono, email y acceso a su perfil.",
      suggestions: ["Ver mis citas", "Ver mis documentos"]
    };
  }

  if (q.includes('documento') || q.includes('informe') || q.includes('certificado')) {
    return {
      message: "Tus documentos están en **Mis Documentos**. Puedes descargarlos haciendo clic en el ícono de descarga.",
      suggestions: ["Ver mis citas", "Contactar a mi dentista"]
    };
  }

  if (q.includes('dolor') || q.includes('muela') || q.includes('urgencia') || q.includes('hinch')) {
    return {
      message: "Si tienes dolor dental urgente, contacta directamente a tu dentista. Si es fuera de horario, acude a urgencias dentales. **No tomes medicamentos sin consultar primero.**",
      suggestions: ["Contactar a mi dentista", "Ver mis citas"]
    };
  }

  if (q.includes('tratamiento') || q.includes('procedimiento') || q.includes('ortodoncia') || q.includes('implante')) {
    return {
      message: "Para información detallada sobre tu tratamiento, consulta con tu dentista. En tu panel puedes ver el estado actual de tu tratamiento y documentos clínicos.",
      suggestions: ["Ver mis documentos", "Contactar a mi dentista", "Ver mis citas"]
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
      suggestions: SUGGESTIONS_PATIENT
    };
  }

  if (q.includes('gracias')) {
    return {
      message: "¡De nada! 😊 ¿Algo más en lo que pueda ayudarte?",
      suggestions: SUGGESTIONS_PATIENT
    };
  }

  if (q.includes('ayuda') || q.includes('que puedes')) {
    return {
      message: "Puedo ayudarte con:\n• 📅 Citas y agenda\n• 🦷 Tratamientos\n• 📄 Documentos clínicos\n• 👨‍⚕️ Contacto con tu dentista\n• 💰 Pagos\n• 🚨 Urgencias dentales\n\n¿Qué necesitas?",
      suggestions: SUGGESTIONS_PATIENT
    };
  }

  return {
    message: "Te recomiendo revisar tu panel principal o contactar a tu dentista. ¿Algo más en lo que pueda ayudarte?",
    suggestions: SUGGESTIONS_PATIENT
  };
}

export default useChatbot;
