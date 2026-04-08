import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload, FileText, AlertTriangle, CheckCircle, XCircle, Tag,
  ArrowLeft, Download, Loader2, X, Plus, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SOURCE_OPTIONS = [
  { value: 'doctoralia', label: 'Doctoralia' },
  { value: 'rnpi', label: 'RNPI' },
  { value: 'daem', label: 'DAEM' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'ticket_compra', label: 'Ticket de Compra' },
  { value: 'supersalud', label: 'Supersalud' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'referido', label: 'Referido' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'manual', label: 'Manual' },
];

const PRESET_TAGS = [
  'cliente', 'ex-cliente', 'retargeting', 'recompra',
  'odontólogo', 'terapeuta ocupacional', 'psicólogo', 'educador diferencial',
  'pediatra', 'neurólogo', 'clínica', 'hospital', 'escuela', 'jardín infantil',
  'santiago', 'temuco', 'concepción', 'valdivia', 'viña del mar',
  'prospecto caliente', 'prospecto frío', 'VIP', 'partner potencial',
  'newsletter', 'webinar', 'demo solicitada', 'prueba gratuita',
];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter (pipe, semicolon, tab, or comma)
  const firstLine = lines[0];
  const delimiter = firstLine.includes('|') ? '|' : firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const rows = lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });

  return { headers, rows };
};

const COLUMN_MAP = {
  'nombre': 'full_name', 'name': 'full_name', 'full_name': 'full_name', 'nombre completo': 'full_name',
  'email': 'email', 'correo': 'email', 'e-mail': 'email', 'mail': 'email',
  'telefono': 'phone', 'teléfono': 'phone', 'phone': 'phone', 'celular': 'phone', 'fono': 'phone',
  'rut': 'rut', 'run': 'rut', 'rut_cliente': 'rut', 'rut cliente': 'rut',
  'especialidad': 'specialty', 'specialty': 'specialty', 'especialización': 'specialty', 'titulo': 'specialty', 'título': 'specialty', 'profesion': 'specialty', 'profesión': 'specialty',
  'ciudad': 'city', 'city': 'city', 'comuna': 'city', 'localidad': 'city',
  'region': 'region', 'región': 'region',
  'producto': 'notes', 'producto comprado': 'notes', 'detalle': 'notes', 'descripcion': 'notes', 'descripción': 'notes',
  'monto': 'total_spent', 'total': 'total_spent', 'valor': 'total_spent', 'gasto': 'total_spent', 'ticket': 'total_spent',
  'pedidos': 'total_orders', 'orders': 'total_orders', 'cantidad pedidos': 'total_orders', 'n_pedidos': 'total_orders',
  'registro': 'first_purchase_date', 'fecha registro': 'first_purchase_date', 'fecha_registro': 'first_purchase_date', 'primer compra': 'first_purchase_date', 'created': 'first_purchase_date',
  'ultima actividad': 'last_activity_date', 'última actividad': 'last_activity_date', 'last activity': 'last_activity_date', 'ultima compra': 'last_activity_date', 'última compra': 'last_activity_date',
  'pais': 'country', 'país': 'country', 'country': 'country',
  'doctoralia': 'has_doctoralia', 'tiene doctoralia': 'has_doctoralia', 'perfil doctoralia': 'has_doctoralia',
  'url doctoralia': 'doctoralia_url', 'doctoralia_url': 'doctoralia_url', 'link doctoralia': 'doctoralia_url',
  'institucion': 'institution', 'institución': 'institution', 'institution': 'institution', 'n_registro': 'institution',
  'notas': 'notes', 'notes': 'notes', 'observaciones': 'notes',
};

const LeadsImportPage = () => {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload, preview, importing, results
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [columnMapping, setColumnMapping] = useState({});
  const [source, setSource] = useState('csv_import');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ inserted: 0, duplicates: 0, errors: 0, duplicateEmails: [] });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      setCsvData({ headers, rows });

      // Auto-map columns
      const mapping = {};
      headers.forEach(h => {
        const normalized = h.toLowerCase().trim();
        if (COLUMN_MAP[normalized]) {
          mapping[h] = COLUMN_MAP[normalized];
        }
      });
      setColumnMapping(mapping);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag('');
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    const res = { inserted: 0, duplicates: 0, errors: 0, matched: 0 };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      // Map rows to leads
      const leads = csvData.rows.map(row => {
        const lead = {};
        Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
          if (row[csvCol]) lead[dbCol] = row[csvCol];
        });
        return lead;
      }).filter(l => l.email || l.rut || l.full_name);

      const total = leads.length;

      // Process one by one for maximum reliability (no batch failures)
      // With small batches of 50 for speed where possible
      const BATCH_SIZE = 50;

      for (let i = 0; i < leads.length; i += BATCH_SIZE) {
        const batch = leads.slice(i, i + BATCH_SIZE);

        for (const rawLead of batch) {
          const lead = {
            ...rawLead,
            email: rawLead.email ? rawLead.email.toLowerCase().trim() : null,
            rut: rawLead.rut ? rawLead.rut.trim() : null,
            full_name: rawLead.full_name ? rawLead.full_name.trim() : null,
            tags: JSON.stringify(tags),
            source,
            status: 'new',
            imported_at: now,
            created_by: user?.id,
          };

          try {
            if (lead.rut) {
              // Has RUT: upsert by RUT (update if exists, insert if not)
              const { data: existing } = await supabase
                .from('marketing_leads')
                .select('id')
                .eq('rut', lead.rut)
                .maybeSingle();

              if (existing) {
                // Update existing with new data (fill missing fields)
                const updates = {};
                if (lead.email && !existing.email) updates.email = lead.email;
                if (lead.phone) updates.phone = lead.phone;
                if (lead.city) updates.city = lead.city;
                if (lead.region) updates.region = lead.region;
                if (lead.specialty) updates.specialty = lead.specialty;
                if (lead.institution) updates.institution = lead.institution;
                updates.tags = lead.tags;
                updates.updated_at = now;

                await supabase.from('marketing_leads').update(updates).eq('id', existing.id);
                res.duplicates++;
              } else {
                const { error } = await supabase.from('marketing_leads').insert(lead);
                if (error) { res.errors++; } else { res.inserted++; }
              }

            } else if (lead.email) {
              // Has email but no RUT: check if email exists
              const { data: existing } = await supabase
                .from('marketing_leads')
                .select('id')
                .eq('email', lead.email)
                .maybeSingle();

              if (existing) {
                res.duplicates++;
              } else if (lead.full_name) {
                // Try fuzzy match to supersalud (assign email to existing record)
                const { data: matchResult } = await supabase.rpc('match_lead_email_to_supersalud', {
                  p_email: lead.email,
                  p_name: lead.full_name,
                  p_threshold: 0.6,
                });

                if (matchResult?.email_assigned) {
                  res.matched++;
                } else {
                  // No match - insert as new lead
                  const { error } = await supabase.from('marketing_leads').insert(lead);
                  if (error) { res.errors++; } else { res.inserted++; }
                }
              } else {
                const { error } = await supabase.from('marketing_leads').insert(lead);
                if (error) { res.errors++; } else { res.inserted++; }
              }

            } else if (lead.full_name) {
              // Name only - insert (may create duplicates but better than losing data)
              const { error } = await supabase.from('marketing_leads').insert(lead);
              if (error) { res.errors++; } else { res.inserted++; }
            }
          } catch {
            res.errors++;
          }
        }

        // Update progress after each batch
        setProgress(Math.min(100, Math.round(((i + batch.length) / total) * 100)));
      }

      // Run batch matching at the end for any remaining unmatched
      try {
        await supabase.rpc('batch_match_leads_to_supersalud', { p_limit: 500 });
      } catch { /* optional */ }

      setResults(res);
      setStep('results');
      toast({
        title: 'Importacion completada',
        description: `${res.inserted} nuevos, ${res.duplicates} existentes, ${res.matched} matcheados, ${res.errors} errores`,
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-teal-600" /> Importar Leads
        </h1>
        <p className="text-muted-foreground">Sube un CSV con contactos de Doctoralia, RNPI, DAEM u otra fuente</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Subir CSV', 'Mapear y Etiquetar', 'Resultados'].map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className="h-px w-8 bg-gray-300" />}
            <Badge variant={
              (i === 0 && step === 'upload') || (i === 1 && (step === 'preview' || step === 'importing')) || (i === 2 && step === 'results')
                ? 'default' : 'outline'
            }>
              {i + 1}. {s}
            </Badge>
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardContent className="p-8">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-teal-400 transition-colors cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">Arrastra tu CSV aquí o haz click para seleccionar</p>
              <p className="text-sm text-gray-500 mt-2">Formatos aceptados: .csv, .txt (separado por coma o punto y coma)</p>
              <p className="text-xs text-gray-400 mt-1">Columnas recomendadas: nombre, email, teléfono, especialidad, ciudad, región</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <strong>Tip:</strong> Los duplicados se detectan por email. Si un contacto ya existe, se marcará como duplicado y no se importará dos veces.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview + Mapping + Tags */}
      {(step === 'preview' || step === 'importing') && (
        <>
          {/* Source + Tags */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Configuración de importación</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Fuente</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Registros encontrados</label>
                  <p className="text-2xl font-bold text-teal-600">{csvData.rows.length}</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  <Tag className="h-4 w-4 inline mr-1" /> Etiquetas (se aplicarán a todos los leads importados)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(t => (
                    <Badge key={t} variant="secondary" className="gap-1 cursor-pointer hover:bg-red-100" onClick={() => removeTag(t)}>
                      {t} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva etiqueta..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                    className="max-w-xs"
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 12).map(t => (
                    <button
                      key={t}
                      onClick={() => addTag(t)}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column Mapping */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Mapeo de columnas</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {csvData.headers.map(h => (
                  <div key={h} className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded min-w-[120px]">{h}</span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={columnMapping[h] || ''}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, [h]: e.target.value }))}
                      className="flex-1 p-1.5 border rounded text-sm"
                    >
                      <option value="">Ignorar</option>
                      <option value="full_name">Nombre</option>
                      <option value="email">Email</option>
                      <option value="phone">Teléfono</option>
                      <option value="rut">RUT</option>
                      <option value="specialty">Especialidad</option>
                      <option value="city">Ciudad</option>
                      <option value="region">Región</option>
                      <option value="institution">Institución</option>
                      <option value="notes">Notas</option>
                      <option value="total_spent">Gasto / Ticket</option>
                      <option value="total_orders">Pedidos</option>
                      <option value="first_purchase_date">Fecha Registro</option>
                      <option value="last_activity_date">Última Actividad</option>
                      <option value="country">País</option>
                      <option value="has_doctoralia">Tiene Doctoralia</option>
                      <option value="doctoralia_url">URL Doctoralia</option>
                    </select>
                    {columnMapping[h] && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preview table */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Vista previa (primeros 5 registros)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      {csvData.headers.map(h => (
                        <th key={h} className="p-2 text-left text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        {csvData.headers.map(h => (
                          <td key={h} className="p-2 max-w-[150px] truncate">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Import button */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setStep('upload'); setCsvData({ headers: [], rows: [] }); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || Object.values(columnMapping).filter(Boolean).length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importando {progress}%</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Importar {csvData.rows.length} leads</>
              )}
            </Button>
          </div>

          {importing && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-teal-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Procesando {csvData.rows.length} leads... {progress}% completado
              </p>
            </div>
          )}
        </>
      )}

      {/* Step 3: Results */}
      {step === 'results' && (
        <>
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold">Importación completada</h2>

              <div className="grid grid-cols-4 gap-4 mt-6 max-w-lg mx-auto">
                <div className="p-4 rounded-lg bg-green-50 text-center">
                  <p className="text-2xl font-bold text-green-600">{results.inserted}</p>
                  <p className="text-xs text-green-700">Nuevos</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 text-center">
                  <p className="text-2xl font-bold text-blue-600">{results.matched || 0}</p>
                  <p className="text-xs text-blue-700">Matcheados</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{results.duplicates}</p>
                  <p className="text-xs text-yellow-700">Existentes</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 text-center">
                  <p className="text-2xl font-bold text-red-600">{results.errors}</p>
                  <p className="text-xs text-red-700">Errores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicates list */}
          {results.duplicateEmails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" /> Emails duplicados ({results.duplicateEmails.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {results.duplicateEmails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <XCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                      {email}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setStep('upload'); setResults({ inserted: 0, duplicates: 0, errors: 0, duplicateEmails: [] }); }}>
              Importar otro CSV
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link to="/admin/marketing"><Users className="h-4 w-4 mr-2" /> Ver todos los leads</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadsImportPage;
