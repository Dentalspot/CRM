import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useMetaTracking } from '@/hooks/useMetaTracking';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { trackEvent } = useMetaTracking();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    trackEvent('Contact', { content_name: 'Contact Form' });
    toast({
      title: "Mensaje Enviado",
      description: "Gracias por contactarnos. Te responderemos pronto.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  return (
    <div className="py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Contáctanos
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-lg text-muted-foreground">
          ¿Tienes preguntas o necesitas soporte? Estamos aquí para ayudarte.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="h-full glassmorphism">
            <CardHeader>
              <CardTitle className="text-2xl">Envíanos un Mensaje</CardTitle>
              <CardDescription>Completa el formulario y nuestro equipo se pondrá en contacto contigo.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" placeholder="Tu nombre" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input id="subject" placeholder="Asunto de tu mensaje" value={formData.subject} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea id="message" placeholder="Escribe tu mensaje aquí..." rows={5} value={formData.message} onChange={handleChange} required />
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity" disabled={loading}>
                  {loading ? 'Enviando...' : <><Send className="mr-2 h-4 w-4" /> Enviar Mensaje</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-8"
        >
          <h2 className="text-3xl font-semibold text-foreground">Información de Contacto</h2>
          <p className="text-muted-foreground">
            También puedes contactarnos a través de los siguientes canales o visitarnos en nuestra oficina.
          </p>
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 hover:shadow-md transition-shadow">
              <Mail className="h-8 w-8 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-medium">Correo Electrónico</h3>
                <a href="mailto:contacto@dentalspot.cl" className="text-primary hover:underline">contacto@dentalspot.cl</a>
                <p className="text-sm text-muted-foreground">Respondemos en 24 horas hábiles.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 hover:shadow-md transition-shadow">
              <Phone className="h-8 w-8 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-medium">Teléfono</h3>
                <a href="tel:+56912345678" className="text-primary hover:underline">+56 9 1234 5678</a>
                <p className="text-sm text-muted-foreground">Lunes a Viernes, 9am - 6pm.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 hover:shadow-md transition-shadow">
              <MapPin className="h-8 w-8 text-primary mt-1" />
              <div>
                <h3 className="text-lg font-medium">Oficina Central</h3>
                <p className="text-primary">Av. Providencia 123, Santiago, Chile</p>
                <p className="text-sm text-muted-foreground">Visitas con cita previa.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactPage;