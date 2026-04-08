import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_LABELS = {
  terms: 'Términos',
  privacy: 'Privacidad',
  contract: 'Contrato',
  disclaimer: 'Disclaimer',
  cookies: 'Cookies',
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-amber-100 text-amber-700',
};

const DocumentsTable = ({ documents = [] }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Versión</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Actualización</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">No hay documentos</TableCell>
          </TableRow>
        ) : (
          documents.map(doc => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{TYPE_LABELS[doc.type] || doc.type}</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">v{doc.version}</TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[doc.status] || STATUS_COLORS.draft}>
                  {doc.status === 'published' ? 'Publicado' : doc.status === 'archived' ? 'Archivado' : 'Borrador'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {doc.updated_at ? format(new Date(doc.updated_at), 'd MMM yyyy', { locale: es }) : '—'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/legal/documents/${doc.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/legal/documents/${doc.id}/edit`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                  {doc.status === 'published' && doc.slug && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/legal/${doc.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default DocumentsTable;
