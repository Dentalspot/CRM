import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, CheckCircle2, Globe } from 'lucide-react';
import { legalApi } from '../api/legalApi';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';

const DocumentEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', slug: '', type: 'terms', content: '', status: 'draft', effective_date: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      legalApi.fetchDocumentById(id).then(data => {
        if (data) setForm({
          title: data.title || '',
          slug: data.slug || '',
          type: data.type || 'terms',
          content: data.content || '',
          status: data.status || 'draft',
          effective_date: data.effective_date || '',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const generateSlug = (title) => {
    return title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title) => {
    setForm(f => ({ ...f, title, slug: f.slug || generateSlug(title) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await legalApi.updateDocument(id, form);
      } else {
        await legalApi.createDocument(form);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logger.error('Error saving document:', err);
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      await legalApi.publishDocument(id);
      setForm(f => ({ ...f, status: 'published' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      logger.error('Error publishing:', err);
    }
    setPublishing(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <PermissionGuard module="legal" action="write">
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/legal/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a documentos
          </Button>
          <div className="flex gap-2">
            {id && form.status !== 'published' && (
              <Button variant="outline" onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
                Publicar
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saved ? 'Guardado' : 'Guardar'}
            </Button>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{id ? 'Editar Documento' : 'Nuevo Documento'}</h1>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Ej: Términos y Condiciones" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Slug (URL)</label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="terminos-condiciones" />
                {form.slug && <p className="text-xs text-gray-400 mt-1">/legal/{form.slug}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terms">Términos y Condiciones</SelectItem>
                    <SelectItem value="privacy">Política de Privacidad</SelectItem>
                    <SelectItem value="cookies">Política de Cookies</SelectItem>
                    <SelectItem value="disclaimer">Disclaimer</SelectItem>
                    <SelectItem value="contract">Contrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha de vigencia</label>
                <Input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Contenido</label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={20} placeholder="Redacta el contenido del documento legal..." className="font-mono text-sm" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default DocumentEditorPage;
