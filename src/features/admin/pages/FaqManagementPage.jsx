import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Pencil, Trash2, Search, Loader2, MessageSquare } from 'lucide-react';
import { fetchAllFaqs, createFaq, updateFaq, deleteFaq } from '../../chatbot/api/chatbotApi';

const FaqManagementPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState(null); // For edit/delete
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General', link: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const result = await fetchAllFaqs();
      setFaqs(result?.data || result || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las FAQs" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setFormData({ question: faq.question, answer: faq.answer, category: faq.category || 'General', link: faq.link || '' });
      setCurrentFaq(faq);
    } else {
      setFormData({ question: '', answer: '', category: 'General', link: '' });
      setCurrentFaq(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentFaq) {
        await updateFaq(currentFaq.id, formData);
        toast({ title: "FAQ actualizada", description: "La pregunta frecuente ha sido actualizada." });
      } else {
        await createFaq(formData);
        toast({ title: "FAQ creada", description: "La nueva pregunta frecuente ha sido agregada." });
      }
      setIsModalOpen(false);
      loadFaqs();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la FAQ." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFaq) return;
    try {
      await deleteFaq(currentFaq.id);
      toast({ title: "FAQ eliminada", description: "El registro ha sido eliminado." });
      setIsDeleteAlertOpen(false);
      loadFaqs();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar." });
    }
  };

  const filteredFaqs = (faqs || []).filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (faq.category && faq.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>Gestión de FAQs | Admin DentalSpot</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Gestión de Chatbot FAQ
          </h1>
          <p className="text-muted-foreground">Administra las preguntas y respuestas automáticas del asistente virtual.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva Pregunta
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en preguntas o respuestas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes ({filteredFaqs.length})</CardTitle>
          <CardDescription>Base de conocimiento del chatbot.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron resultados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Pregunta</TableHead>
                  <TableHead className="w-[35%]">Respuesta</TableHead>
                  <TableHead className="w-[15%]">Link</TableHead>
                  <TableHead className="w-[12%]">Categoría</TableHead>
                  <TableHead className="w-[13%] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</TableCell>
                    <TableCell className="text-sm">
                      {faq.link ? (
                        <a href={faq.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]" title={faq.link}>
                          {faq.link.replace(/^https?:\/\/(www\.)?dentalspot\.cl\/?/, '/')}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        {faq.category || 'General'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(faq)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setCurrentFaq(faq); setIsDeleteAlertOpen(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentFaq ? 'Editar FAQ' : 'Nueva FAQ'}</DialogTitle>
            <DialogDescription>
              Define la pregunta que hará el usuario y la respuesta que dará el bot.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pregunta</Label>
              <Input 
                value={formData.question} 
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                placeholder="Ej: ¿Cómo agendo una hora?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Respuesta</Label>
              <Textarea 
                value={formData.answer} 
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                placeholder="La respuesta detallada..."
                rows={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Link (opcional)</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({...formData, link: e.target.value})}
                placeholder="Ej: https://dentalspot.cl/calendario o /calendario"
                type="url"
              />
              <p className="text-xs text-muted-foreground">URL donde el usuario puede encontrar más información. El bot la incluirá en su respuesta.</p>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Citas">Citas y Horarios</SelectItem>
                  <SelectItem value="Pagos">Pagos y Facturación</SelectItem>
                  <SelectItem value="Terapia">Terapia y Sesiones</SelectItem>
                  <SelectItem value="Técnico">Soporte Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente la pregunta frecuente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAlertOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaqManagementPage;