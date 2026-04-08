import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_LABELS = {
  security: 'Seguridad',
  privacy: 'Privacidad',
  data_retention: 'Retención',
  access_control: 'Acceso',
  incident: 'Incidentes',
  general: 'General',
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  review: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-100 text-slate-600',
};

const PoliciesTable = ({ policies = [] }) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Responsable</TableHead>
          <TableHead>Próxima Revisión</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {policies.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">No hay políticas</TableCell>
          </TableRow>
        ) : (
          policies.map(pol => (
            <TableRow key={pol.id}>
              <TableCell className="font-medium">{pol.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{CATEGORY_LABELS[pol.category] || pol.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[pol.status] || STATUS_COLORS.draft}>
                  {pol.status === 'active' ? 'Activa' : pol.status === 'review' ? 'En revisión' : pol.status === 'archived' ? 'Archivada' : 'Borrador'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500">{pol.responsible || '—'}</TableCell>
              <TableCell className="text-sm text-gray-500">
                {pol.review_date ? format(new Date(pol.review_date), 'd MMM yyyy', { locale: es }) : '—'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/legal/policies/${pol.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/legal/policies/${pol.id}/edit`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default PoliciesTable;
