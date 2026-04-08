import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Archive, Download, Loader2, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import { useBulkActions } from '../hooks/useBulkActions';
import { useToast } from '@/components/ui/use-toast';

const PatientBulkActionsPage = () => {
  const { patients, loading, refetch } = usePatients();
  const { selectedIds, toggleSelection, selectAll, clearSelection, performAction, isProcessing } = useBulkActions();
  const { toast } = useToast();

  const handleArchive = async () => {
    if (!selectedIds.length) {
      toast({ title: 'Selecciona pacientes', description: 'Debes seleccionar al menos un paciente.', variant: 'destructive' });
      return;
    }
    await performAction('archive', () => {
      toast({ title: 'Archivados', description: `${selectedIds.length} pacientes archivados correctamente.` });
      refetch();
    });
  };

  const handleExport = () => {
    const toExport = selectedIds.length ? patients.filter(p => selectedIds.includes(p.id)) : patients;
    const csv = [
      ['Nombre', 'Email', 'RUT', 'Estado', 'Fecha Ingreso'].join(','),
      ...toExport.map(p => [
        p.profile?.full_name || '',
        p.profile?.email || '',
        p.profile?.rut || '',
        p.status || '',
        p.created_at ? new Date(p.created_at).toLocaleDateString() : ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exportado', description: `${toExport.length} pacientes exportados a CSV.` });
  };

  const allSelected = patients.length > 0 && selectedIds.length === patients.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Acciones Masivas</h1>
          <p className="text-muted-foreground">
            {selectedIds.length > 0 ? `${selectedIds.length} pacientes seleccionados` : 'Selecciona pacientes para aplicar acciones'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar {selectedIds.length > 0 ? `(${selectedIds.length})` : 'Todos'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleArchive}
            disabled={!selectedIds.length || isProcessing}
          >
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
            Archivar ({selectedIds.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={() => selectAll(patients.map(p => p.id))}>
                      {allSelected ? <CheckSquare className="h-4 w-4 text-teal-600" /> : <Square className="h-4 w-4 text-gray-400" />}
                    </button>
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ingreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No hay pacientes</TableCell>
                  </TableRow>
                ) : (
                  patients.map(p => (
                    <TableRow key={p.id} className={selectedIds.includes(p.id) ? 'bg-teal-50' : ''}>
                      <TableCell>
                        <button onClick={() => toggleSelection(p.id)}>
                          {selectedIds.includes(p.id)
                            ? <CheckSquare className="h-4 w-4 text-teal-600" />
                            : <Square className="h-4 w-4 text-gray-400" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{p.profile?.full_name || 'Sin nombre'}</TableCell>
                      <TableCell className="text-sm text-gray-500">{p.profile?.email || ''}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientBulkActionsPage;
