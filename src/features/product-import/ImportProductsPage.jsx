import React from 'react';
import useProductImport from './hooks/useProductImport';
import StepIndicator from '@/features/patient-import/components/StepIndicator';
import MappingStep from '@/features/patient-import/components/MappingStep';
import ImportingStep from '@/features/patient-import/components/ImportingStep';
import { DentalSpot_PRODUCT_FIELDS, SOURCE_HINTS, TEMPLATE_CSV } from './constants/fieldConfig';

// Local UploadStep adapted for products
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, ArrowLeft, ArrowRight, Users, Zap, Package } from 'lucide-react';
import { useCallback } from 'react';

const ProductUploadStep = ({ source, setSource, onFile }) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  }, [onFile]);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_productos_dentalspot.csv'; a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-teal-600" />
          Sube tu catálogo de productos
        </CardTitle>
        <CardDescription>Importa desde WooCommerce, Shopify o cualquier CSV/Excel</CardDescription>
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
          onClick={() => document.getElementById('product-file-input').click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Arrastra tu archivo aquí</p>
          <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
          <p className="text-xs text-gray-300 mt-3">CSV, XLSX, XLS</p>
          <input
            id="product-file-input"
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

const ProductPreviewStep = ({ previewData, validRows, columnMap, onImport, onBack }) => {
  const activeFields = DentalSpot_PRODUCT_FIELDS.filter(f => f.key !== 'skip' && Object.values(columnMap).includes(f.key));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vista previa de productos</CardTitle>
        <CardDescription>
          Primeros 10 de <strong>{validRows.length}</strong> productos válidos. Los productos quedan pendientes de aprobación.
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
            <Package className="h-3 w-3 mr-1" /> {validRows.length} productos a importar
          </Badge>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Mapear</Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={onImport}>
            <Zap className="h-4 w-4 mr-1" /> Importar {validRows.length} productos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ImportProductsPage = () => {
  const {
    step, setStep, fileName, rawData, headers, columnMap, setColumnMap,
    importing, importProgress, importResults, source, setSource,
    hasRequiredFields, validRows, previewData,
    handleFile, handleImport, reset,
  } = useProductImport();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Productos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube tu catálogo desde WooCommerce, Shopify o cualquier plataforma. Los productos quedan pendientes de aprobación.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 0 && <ProductUploadStep source={source} setSource={setSource} onFile={handleFile} />}
      {step === 1 && (
        <MappingStep
          headers={headers}
          rawData={rawData}
          columnMap={columnMap}
          setColumnMap={setColumnMap}
          hasRequired={hasRequiredFields}
          fileName={fileName}
          onNext={() => setStep(2)}
          onBack={reset}
          fieldsConfig={DentalSpot_PRODUCT_FIELDS}
        />
      )}
      {step === 2 && <ProductPreviewStep previewData={previewData} validRows={validRows} columnMap={columnMap} onImport={handleImport} onBack={() => setStep(1)} />}
      {step === 3 && <ImportingStep importing={importing} progress={importProgress} results={importResults} onReset={reset} />}
    </div>
  );
};

export default ImportProductsPage;