import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Eye, FileText, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ACTION_LABELS = {
  view_record: 'Consultó registro',
  edit_record: 'Modificó registro',
  create_record: 'Creó registro',
  export_file: 'Exportó archivo',
  print_record: 'Imprimió registro',
  grant_exceptional_access: 'Autorizó acceso excepcional',
  exceptional_access: 'Acceso excepcional',
};

const RESOURCE_LABELS = {
  clinical_record: 'Ficha clínica',
  clinical_entry: 'Nota de sesión',
  odontogram: 'Odontograma',
  diagnosis: 'Diagnóstico',
  document: 'Documento',
  full_file: 'Ficha completa',
};

const CONTEXT_COLORS = {
  'Equipo tratante': 'bg-teal-100 text-teal-700',
  'Acceso excepcional': 'bg-amber-100 text-amber-700',
};

const formatLabel = (value, labels) => {
  if (!value) return '—';
  return labels[value] || value.replace(/_/g, ' ');
};

const PatientAccessHistoryPage = () => {
  const [accessHistory, setAccessHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_access_history_view')
        .select('*')
        .order('accessed_at', { ascending: false });

      if (!error) {
        setAccessHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <>
      <Helmet>
        <title>Historial de Accesos | DentalSpot</title>
      </Helmet>

      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            Historial de Accesos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registro de quién ha consultado o modificado tu información clínica.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actividad reciente
              {!loading && (
                <Badge variant="secondary" className="ml-2">
                  {accessHistory.length} {accessHistory.length === 1 ? 'registro' : 'registros'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading */}
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && accessHistory.length === 0 && (
              <div className="text-center py-12">
                <Eye className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">
                  Aún no hay registros de acceso a tu ficha clínica.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Cuando un profesional consulte tu información, aparecerá aquí.
                </p>
              </div>
            )}

            {/* Loaded */}
            {!loading && accessHistory.length > 0 && (
              <div className="space-y-2">
                {accessHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border">
                    <div className="p-2 bg-white rounded-full border shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {entry.accessed_by_name || 'Profesional'}
                        </p>
                        <Badge className={`text-[10px] ${CONTEXT_COLORS[entry.access_context] || 'bg-gray-100 text-gray-600'}`}>
                          {entry.access_context || 'Acceso'}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatLabel(entry.action, ACTION_LABELS)} — {formatLabel(entry.resource_type, RESOURCE_LABELS)}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {entry.accessed_at
                          ? format(parseISO(entry.accessed_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })
                          : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PatientAccessHistoryPage;
