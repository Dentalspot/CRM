import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { AUTO_MAP } from '../constants/fieldConfig';

export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv' || ext === 'tsv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (!results.data.length) return reject(new Error('Archivo vacío'));
          resolve({ headers: results.meta.fields || [], rows: results.data });
        },
        error: () => reject(new Error('Error al leer CSV')),
      });
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (!json.length) return reject(new Error('Archivo vacío'));
          resolve({ headers: Object.keys(json[0]), rows: json });
        } catch {
          reject(new Error('Error al leer Excel'));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Formato no soportado. Usa CSV o Excel (.xlsx)'));
    }
  });
};

export const autoMapColumns = (headers) => {
  const map = {};
  headers.forEach(col => {
    const normalized = col.toLowerCase().trim().replace(/[_\-\.]/g, ' ');
    if (AUTO_MAP[normalized]) map[col] = AUTO_MAP[normalized];
  });
  return map;
};