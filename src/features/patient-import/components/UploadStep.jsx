import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import { SOURCE_HINTS, TEMPLATE_CSV } from '../constants/fieldConfig';

const UploadStep = ({ source, setSource, onFile }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  }, [onFile]);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_dentalspot.csv'; a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sube tu archivo de pacientes</CardTitle>
        <CardDescription>Aceptamos CSV (.csv) y Excel (.xlsx, .xls)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(SOURCE_HINTS).map(s => (
            <Button
              key={s}
              variant={source === s ? 'default' : 'outline'}
              size="sm"
              className={source === s ? 'bg-teal-600 hover:bg-teal-700' : ''}
              onClick={() => setSource(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        {source && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            {SOURCE_HINTS[source]}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-teal-400 hover:bg-teal-50/30 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input').click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Arrastra tu archivo aquí</p>
          <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
          <p className="text-xs text-gray-300 mt-3">CSV, XLSX, XLS · Máximo 10.000 filas</p>
          <input
            id="file-input"
            type="file"
            accept=".csv,.tsv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => onFile(e.target.files[0])}
          />
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Download className="h-3.5 w-3.5 text-gray-400" />
          <button onClick={downloadTemplate} className="text-xs text-teal-600 hover:underline">
            Descargar plantilla CSV de ejemplo
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadStep;