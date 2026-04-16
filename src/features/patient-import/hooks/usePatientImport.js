import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { parseFile, autoMapColumns } from '../utils/fileParser';
import { importPatients } from '../utils/importEngine';

const usePatientImport = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
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
      setColumnMap(autoMapColumns(h));
      setStep(1);
    } catch (err) {
      toast({ variant: 'destructive', title: err.message });
    }
  }, [toast]);

  const hasRequiredFields = useMemo(() => Object.values(columnMap).includes('full_name'), [columnMap]);

  const validRows = useMemo(() => {
    const nameCol = Object.entries(columnMap).find(([_, v]) => v === 'full_name')?.[0];
    return rawData.filter(row => nameCol && row[nameCol]?.toString().trim());
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

  const duplicateEmails = useMemo(() => {
    const emailCol = Object.entries(columnMap).find(([_, v]) => v === 'email')?.[0];
    if (!emailCol) return 0;
    const emails = validRows.map(r => r[emailCol]?.toString().trim().toLowerCase()).filter(Boolean);
    return emails.length - new Set(emails).size;
  }, [validRows, columnMap]);

  // Build field map (csvColumn → dentalspotField)
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

    const results = await importPatients({
      validRows,
      fieldMap,
      userId: user.id,
      organizationId: currentOrganizationId,
      onProgress: (current, total) => setImportProgress(Math.round((current / total) * 100)),
    });

    setImportResults(results);
    setImporting(false);

    if (results.created > 0) {
      toast({
        title: `${results.created} pacientes importados`,
        description: results.skipped > 0 ? `${results.skipped} omitidos (ya existían)` : undefined,
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
    hasRequiredFields, validRows, previewData, duplicateEmails,
    handleFile, handleImport, reset,
  };
};

export default usePatientImport;