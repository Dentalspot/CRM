import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Shield, Eye, Download, Loader2 } from 'lucide-react';
import { EVENT_TYPES, VISIBILITY_LABELS } from '../constants/timelineConfig';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabaseClient';

const TimelineEventCard = ({ event, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const config = EVENT_TYPES[event.type] || EVENT_TYPES.session;
  const Icon = config.icon;
  const visLabel = VISIBILITY_LABELS[event.visibility];

  const isReport = event.type === 'document' && (event.entryType === 'informe_tea' || event.entryType === 'informe' || event.entryType === 'informe_clinico');

  // Check if this document has a downloadable PDF (informe TEA with evaluation_id)
  const hasDownloadablePdf = isReport && event.raw?.details?.evaluation_id;

  const handleDownloadPdf = async () => {
    if (!event.raw?.details?.evaluation_id) return;
    setDownloading(true);
    try {
      const { data } = await supabase
        .from('ados2_evaluations')
        .select('report_html')
        .eq('id', event.raw.details.evaluation_id)
        .maybeSingle();

      if (data?.report_html) {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(data.report_html);
          w.document.close();
        }
      }
    } catch (err) {
      console.error('Error loading report:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try { return format(parseISO(d), "d 'de' MMMM", { locale: es }); } catch { return d; }
  };

  return (
    <div className={`relative flex gap-3 group`}>
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className={`h-3 w-3 rounded-full ${config.dot} ring-2 ring-white z-10`} />
        <div className="w-0.5 flex-1 bg-gray-100 mt-1" />
      </div>

      {/* Card */}
      <div
        className={`flex-1 mb-4 rounded-lg border ${config.border} ${config.bg} p-3 transition-all hover:shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
        onClick={() => onClick && onClick(event)}
      >
        <div className="flex items-start gap-2.5">
          <div className={`h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0 border ${config.border}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">{event.title}</span>
              {isReport && (
                <Badge variant="outline" className="text-[9px] bg-cyan-50 text-cyan-700 border-cyan-200">
                  Informe
                </Badge>
              )}
              {event.referral && (
                <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 gap-0.5">
                  Derivación{event.referral.professional_name ? ` → ${event.referral.professional_name}` : (event.referral.referred_professional_name ? ` → ${event.referral.referred_professional_name}` : '')}
                </Badge>
              )}
              {event.visibility === 'professional_only' && (
                <Badge variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200 gap-0.5">
                  <Shield className="h-2.5 w-2.5" /> Solo profesionales
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400">{formatDate(event.date)}</span>
              <span className="text-[11px] text-gray-300">·</span>
              <span className="text-[11px] text-gray-400">{event.therapistName}</span>
            </div>

            {event.summary && (
              <div className={`text-xs text-gray-600 mt-1.5 ${!expanded ? 'line-clamp-3' : ''}`}>
                {expanded ? (
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-sm font-bold text-gray-800 mt-2 mb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-semibold text-gray-700 mt-2 mb-0.5">{children}</h3>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5">{children}</ul>,
                      li: ({ children }) => <li className="text-xs">{children}</li>,
                      p: ({ children }) => <p className="mb-1">{children}</p>,
                    }}
                  >
                    {event.summary}
                  </ReactMarkdown>
                ) : (
                  <p>{event.summary.substring(0, 150)}{event.summary.length > 150 ? '...' : ''}</p>
                )}
              </div>
            )}

            {event.summary && event.summary.length > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-[11px] text-teal-600 hover:text-teal-700 mt-1"
              >
                {expanded ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Ver detalle</>}
              </button>
            )}

            {/* Download PDF button for informes */}
            {hasDownloadablePdf && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs gap-1.5 text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Descargar PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineEventCard;