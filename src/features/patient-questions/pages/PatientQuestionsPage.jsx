
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Plus, Search, Loader2 } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import { usePatientQuestions } from '../hooks/usePatientQuestions';

const PatientQuestionsPage = () => {
  const { questions, loading, createQuestion, deleteQuestion, answerQuestion } = usePatientQuestions();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim() || formData.title.trim().length < 10) return;
    
    setIsSubmitting(true);
    await createQuestion(formData);
    setIsSubmitting(false);
    
    setFormData({ title: '', body: '' });
    setShowForm(false);
  };

  const filteredQuestions = questions.filter(q =>
    (q.title && q.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (q.body && q.body.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <Helmet>
        <title>Mis Preguntas | DentalSpot</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Mis Preguntas</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Pregunta
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar en mis preguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-slate-900 bg-white border-slate-200"
          />
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
              <CardTitle className="text-blue-900">Redactar Nueva Pregunta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-700">Titulo o tema principal</label>
                  <Input
                    id="title"
                    placeholder="Ej. ¿Es normal el dolor despues de una limpieza?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    minLength={10}
                    className="text-slate-900"
                  />
                  {formData.title.length > 0 && formData.title.length < 10 && (
                    <p className="text-xs text-amber-600">El titulo debe tener al menos 10 caracteres ({formData.title.length}/10)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="body" className="text-sm font-medium text-slate-700">Detalle de tu consulta</label>
                  <Textarea
                    id="body"
                    placeholder="Describe tu duda para que un dentista pueda ayudarte..."
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    className="min-h-[120px] text-slate-900 resize-y"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                      'Enviar Pregunta'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p>Cargando tus preguntas...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600 mb-1">No se encontraron preguntas</p>
                <p className="text-slate-500 max-w-sm">
                  {searchTerm 
                    ? "No hay resultados que coincidan con tu búsqueda."
                    : "Aún no has realizado ninguna pregunta. Usa el botón superior para empezar."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                onDelete={deleteQuestion}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientQuestionsPage;
