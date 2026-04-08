import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { parseFile, autoMapColumns } from '@/features/patient-import/utils/fileParser';
import { WOOCOMMERCE_AUTO_MAP } from '../constants/fieldConfig';
import { importProducts } from '../utils/importEngine';

// Override autoMap to use product-specific mappings
const autoMapProductColumns = (headers) => {
  const map = {};
  headers.forEach(col => {
    const normalized = col.toLowerCase().trim().replace(/[_\-\.]/g, ' ');
    if (WOOCOMMERCE_AUTO_MAP[normalized]) map[col] = WOOCOMMERCE_AUTO_MAP[normalized];
  });
  return map;
};

const useProductImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [source, setSource] = useState('');

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    try {
      const { headers: h, rows } = await parseFile(file);
      setFileName(file.name);
      setHeaders(h);
      setRawData(rows);
      setColumnMap(autoMapProductColumns(h));
      setStep(1);
    } catch (err) {
      toast({ variant: 'destructive', title: err.message });
    }
  }, [toast]);

  const hasRequiredFields = useMemo(() => {
    const mapped = Object.values(columnMap);
    return mapped.includes('title');
  }, [columnMap]);

  const validRows = useMemo(() => {
    const titleCol = Object.entries(columnMap).find(([_, v]) => v === 'title')?.[0];
    return rawData.filter(row => titleCol && row[titleCol]?.toString().trim());
  }, [rawData, columnMap]);

  const previewData = useMemo(() => {
    return rawData.slice(0, 10).map(row => {
      const mapped = {};
      Object.entries(columnMap).forEach(([csvCol, fkField]) => {
        if (fkField !== 'skip') mapped[fkField] = row[csvCol] || '';
      });
      return mapped;
    });
  }, [rawData, columnMap]);

  const fieldMap = useMemo(() => {
    const map = {};
    Object.entries(columnMap).forEach(([csvCol, fkField]) => {
      if (fkField !== 'skip') map[fkField] = csvCol;
    });
    return map;
  }, [columnMap]);

  const handleImport = useCallback(async () => {
    if (!user?.id) return;
    setImporting(true);
    setImportProgress(0);
    setStep(3);

    const results = await importProducts({
      validRows,
      fieldMap,
      userId: user.id,
      onProgress: (current, total) => setImportProgress(Math.round((current / total) * 100)),
    });

    setImportResults(results);
    setImporting(false);

    if (results.created > 0) {
      toast({
        title: `${results.created} productos importados`,
        description: `${results.skipped > 0 ? `${results.skipped} omitidos (duplicados). ` : ''}Los productos quedan pendientes de aprobación.`,
      });
    }
  }, [user, validRows, fieldMap, toast]);

  const reset = () => {
    setStep(0); setFileName(''); setRawData([]); setHeaders([]);
    setColumnMap({}); setImportResults(null); setImportProgress(0); setSource('');
  };

  return {
    step, setStep, fileName, rawData, headers, columnMap, setColumnMap,
    importing, importProgress, importResults, source, setSource,
    hasRequiredFields, validRows, previewData,
    handleFile, handleImport, reset,
  };
};

export default useProductImport;