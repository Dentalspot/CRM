import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileCheck } from 'lucide-react';
import { useLegalSignatures } from '../hooks/useLegalSignatures';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const SignaturesPage = () => {
  const { signatures, totalCount, loading } = useLegalSignatures();

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-teal-500" /> Aceptaciones de Documentos
          </h1>
          <p className="text-muted-foreground">
            Registro de consentimiento informado — {totalCount} aceptaciones totales
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Fecha Aceptación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                      <FileCheck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No hay aceptaciones registradas</p>
                      <p className="text-xs mt-1">Las aceptaciones se registran cuando los usuarios aceptan términos al registrarse</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  signatures.map(sig => (
                    <TableRow key={sig.id}>
                      <TableCell className="font-medium">{sig.user?.full_name || 'Usuario'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{sig.user?.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sig.document?.title || 'Documento'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">v{sig.document_version}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {sig.accepted_at ? format(new Date(sig.accepted_at), "d MMM yyyy, HH:mm", { locale: es }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default SignaturesPage;
