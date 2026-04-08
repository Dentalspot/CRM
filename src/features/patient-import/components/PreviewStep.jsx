import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Zap } from 'lucide-react';
import { DentalSpot_FIELDS } from '../constants/fieldConfig';

const PreviewStep = ({ previewData, validRows, duplicateEmails, columnMap, onImport, onBack }) => {
  const activeFields = DentalSpot_FIELDS.filter(f => f.key !== 'skip' && Object.values(columnMap).includes(f.key));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vista previa</CardTitle>
        <CardDescription>
          Primeros 10 de <strong>{validRows.length}</strong> pacientes válidos.
          {duplicateEmails > 0 && <span className="text-amber-600 ml-1">({duplicateEmails} emails duplicados)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {activeFields.map(f => (
                  <TableHead key={f.key} className="text-xs whitespace-nowrap">{f.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, i) => (
                <TableRow key={i}>
                  {activeFields.map(f => (
                    <TableCell key={f.key} className="text-xs max-w-[200px] truncate">
                      {row[f.key] || <span className="text-gray-300">—</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
            <Users className="h-3 w-3 mr-1" /> {validRows.length} pacientes a importar
          </Badge>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Mapear</Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={onImport}>
            <Zap className="h-4 w-4 mr-1" /> Importar {validRows.length} pacientes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviewStep;