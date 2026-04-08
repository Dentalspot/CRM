import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ChevronRight,
  Shield,
  Brain,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useClinicalConsent } from '@/hooks/useClinicalConsent';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DOCUMENT_ICONS = {
  report: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: FileText },
  tea: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: Brain },
  certificate: { bg: 'bg-blue-50', text: 'text-blue-600', icon: FileText },
  default: { bg: 'bg-gray-50', text: 'text-gray-500', icon: FileText },
};

const getDocStyle = (doc) => {
  if (doc.entry_type === 'informe_tea') return DOCUMENT_ICONS.tea;
  const title = (doc.title || '').toLowerCase();
  if (title.includes('informe') || title.includes('reporte') || title.includes('report')) {
    return DOCUMENT_ICONS.report;
  }
  if (title.includes('certificado') || title.includes('certificate')) {
    return DOCUMENT_ICONS.certificate;
  }
  return DOCUMENT_ICONS.default;
};

const RecentDocuments = ({ documents = [] }) => {
  const { hasSigned, isLoading } = useClinicalConsent();
  const visibleDocs = documents.slice(0, 3);

  // ========== CONSENT REQUIRED ==========
  if (!isLoading && !hasSigned) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="border border-purple-200 bg-purple-50/30">
          <CardContent className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-purple-800 font-medium text-sm">
              Consentimiento requerido
            </p>
            <p className="text-xs text-purple-600 mt-1 mb-3">
              Firma el consentimiento informado para acceder a tu información clínica.
            </p>
            <Link to="/dashboard/patient/clinical-file">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Firmar consentimiento
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== EMPTY STATE ==========
  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              Sin documentos aún
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tus informes y certificados aparecerán aquí cuando estén listos.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== CON DOCUMENTOS ==========
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-500" />
            Documentos recientes
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-1.5 pt-1">
          {visibleDocs.map((doc) => {
            const style = getDocStyle(doc);
            const DocIcon = style.icon || FileText;
            const dateStr = doc.created_at
              ? format(parseISO(doc.created_at), "d MMM", { locale: es })
              : '';

            return (
              <Link
                key={doc.id}
                to="/dashboard/patient/clinical-file"
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                  <DocIcon className={`h-4 w-4 ${style.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.title || 'Documento'}
                  </p>
                  {dateStr && (
                    <p className="text-xs text-gray-400">{dateStr}</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                  asChild
                >
                  <Link to="/dashboard/patient/clinical-file">
                    <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                  </Link>
                </Button>
              </Link>
            );
          })}

          {/* Ver todos */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-400 hover:text-emerald-600 text-xs mt-1"
            asChild
          >
            <Link to="/dashboard/patient/clinical-file">
              Ver en mi ficha clínica
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentDocuments;