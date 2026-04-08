import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { legalApi } from '../api/legalApi';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';

const PolicyEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: 'general', content: '', status: 'draft', responsible: '', review_date: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      legalApi.fetchPolicyById(id).then(data => {
        if (data) setForm({
          title: data.title || '',
          category: data.category || 'general',
          content: data.content || '',
          status: data.status || 'draft',
          responsible: data.responsible || '',
          review_date: data.review_date || '',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id) {
        await legalApi.updatePolicy(id, form);
      } else {
        await legalApi.createPolicy(form);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/admin/legal/policies'); }, 1500);
    } catch (err) {
      logger.error('Error saving policy:', err);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <PermissionGuard module="legal" action="write">
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/legal/policies')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a políticas
        </Button>

        <h1 className="text-2xl font-bold">{id ? 'Editar Política' : 'Nueva Política'}</h1>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre de la política" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="security">Seguridad</SelectItem>
                    <SelectItem value="privacy">Privacidad</SelectItem>
                    <SelectItem value="data_retention">Retención de Datos</SelectItem>
                    <SelectItem value="access_control">Control de Acceso</SelectItem>
                    <SelectItem value="incident">Incidentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Estado</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="review">En revisión</SelectItem>
                    <SelectItem value="archived">Archivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Responsable</label>
                <Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Ej: CTO, Legal" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Próxima revisión</label>
                <Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Contenido</label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={12} placeholder="Contenido de la política..." />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saved ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default PolicyEditorPage;
