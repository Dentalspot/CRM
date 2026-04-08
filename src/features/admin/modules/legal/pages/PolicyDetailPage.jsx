import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Shield, Calendar, User, Printer } from 'lucide-react';

const STATUS_MAP = {
  draft: { label: 'Borrador', class: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'Activa', class: 'bg-green-100 text-green-700' },
  review: { label: 'En Revisión', class: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Archivada', class: 'bg-gray-100 text-gray-700' },
};

const CATEGORY_MAP = {
  security: 'Seguridad',
  privacy: 'Privacidad',
  data_retention: 'Retención de Datos',
  access_control: 'Control de Acceso',
  incident: 'Gestión de Incidentes',
  general: 'General',
};

const PolicyDetailPage = () => {
  const { id } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_policies')
        .select('*')
        .eq('id', id)
        .single();
      if (!error) setPolicy(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handlePrint = () => {
    if (!policy) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>${policy.title}</title>
      <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#333;line-height:1.8}
      h1{font-size:24px;border-bottom:2px solid #333;padding-bottom:10px}
      .meta{color:#666;font-size:14px;margin-bottom:30px}.content{white-space:pre-wrap;font-size:15px}
      .footer{margin-top:40px;border-top:1px solid #ccc;padding-top:10px;font-size:12px;color:#999}</style></head>
      <body><h1>${policy.title}</h1>
      <div class="meta">Categoría: ${CATEGORY_MAP[policy.category] || policy.category} | Responsable: ${policy.responsible || 'No asignado'} | Estado: ${STATUS_MAP[policy.status]?.label || policy.status}</div>
      <div class="content">${policy.content || ''}</div>
      <div class="footer">Política interna DentalSpot — dentalspot.cl<br/>Impreso: ${new Date().toLocaleDateString('es-CL')}</div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-500">Cargando...</div>;
  if (!policy) return <div className="flex justify-center py-20 text-gray-500">Política no encontrada</div>;

  const status = STATUS_MAP[policy.status] || STATUS_MAP.draft;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/legal/policies"><ArrowLeft className="h-4 w-4 mr-2" /> Políticas</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
          <Button size="sm" asChild>
            <Link to={`/admin/legal/policies/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Editar</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" /> {policy.title}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span>{CATEGORY_MAP[policy.category] || policy.category}</span>
                {policy.responsible && <span className="flex items-center gap-1"><User className="h-4 w-4" /> {policy.responsible}</span>}
                {policy.review_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Próxima revisión: {new Date(policy.review_date).toLocaleDateString('es-CL')}</span>}
              </div>
            </div>
            <Badge className={status.class}>{status.label}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Contenido</CardTitle></CardHeader>
        <CardContent>
          <div className="prose max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {policy.content || 'Sin contenido'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-gray-500">
          Creado: {new Date(policy.created_at).toLocaleDateString('es-CL')} |
          Actualizado: {new Date(policy.updated_at).toLocaleDateString('es-CL')}
        </CardContent>
      </Card>
    </div>
  );
};

export default PolicyDetailPage;
