import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Clock, User, Calendar, FileText, Printer } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';

const STATUS_MAP = {
  draft: { label: 'Borrador', class: 'bg-yellow-100 text-yellow-700' },
  published: { label: 'Publicado', class: 'bg-green-100 text-green-700' },
  archived: { label: 'Archivado', class: 'bg-gray-100 text-gray-700' },
};

const TYPE_MAP = {
  terms: 'Términos',
  privacy: 'Privacidad',
  contract: 'Contrato',
  disclaimer: 'Disclaimer',
  cookies: 'Cookies',
  consent: 'Consentimiento',
};

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [signatures, setSignatures] = useState([]);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDoc(data);

      // Fetch versions
      const { data: vers } = await supabase
        .from('legal_document_versions')
        .select('*')
        .eq('document_id', id)
        .order('version', { ascending: false });
      setVersions(vers || []);

      // Fetch signature count
      const { count } = await supabase
        .from('legal_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('document_id', id);
      setSignatures(count || 0);

    } catch (err) {
      logger.error('Error loading document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>${doc.title}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.8; }
        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 30px; }
        .content { white-space: pre-wrap; font-size: 15px; }
        .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #999; }
      </style></head>
      <body>
        <h1>${doc.title}</h1>
        <div class="meta">
          Tipo: ${TYPE_MAP[doc.type] || doc.type} | Versión: ${doc.version} |
          Vigente desde: ${doc.effective_date || 'No especificado'}
        </div>
        <div class="content">${doc.content || ''}</div>
        <div class="footer">
          Documento generado por DentalSpot — dentalspot.cl<br/>
          Fecha de impresión: ${new Date().toLocaleDateString('es-CL')}
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-500">Cargando documento...</div>;
  if (!doc) return <div className="flex justify-center py-20 text-gray-500">Documento no encontrado</div>;

  const status = STATUS_MAP[doc.status] || STATUS_MAP.draft;

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/legal/documents"><ArrowLeft className="h-4 w-4 mr-2" /> Documentos</Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
            <Button size="sm" asChild>
              <Link to={`/admin/legal/documents/${id}/edit`}><Edit className="h-4 w-4 mr-2" /> Editar</Link>
            </Button>
          </div>
        </div>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{doc.title}</CardTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> {TYPE_MAP[doc.type] || doc.type}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> v{doc.version}</span>
                  {doc.effective_date && (
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Vigente desde {new Date(doc.effective_date).toLocaleDateString('es-CL')}</span>
                  )}
                </div>
              </div>
              <Badge className={status.class}>{status.label}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Contenido</CardTitle></CardHeader>
          <CardContent>
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
              {doc.content || 'Sin contenido'}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <User className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{signatures}</p>
              <p className="text-sm text-gray-500">Firmas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{versions.length || 1}</p>
              <p className="text-sm text-gray-500">Versiones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-semibold">{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('es-CL') : '—'}</p>
              <p className="text-sm text-gray-500">Última actualización</p>
            </CardContent>
          </Card>
        </div>

        {/* Versions History */}
        {versions.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Historial de Versiones</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {versions.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">Versión {v.version}</span>
                      <p className="text-sm text-gray-500">{v.change_summary || 'Sin descripción'}</p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Slug info */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">
              URL pública: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">dentalspot.cl/legal/{doc.slug}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default DocumentDetailPage;
