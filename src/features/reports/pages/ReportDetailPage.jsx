import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import ReportPreview from '../components/ReportPreview';
import { Loader2 } from 'lucide-react';
import jsPDF from 'jspdf'; // Re-implement simple PDF logic locally or import utility
import logger from '@/lib/utils/logger';

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data, error } = await supabase
          .from('clinical_reports')
          .select(`
            *,
            patient:patient_id (
              profile:profile_id (full_name, rut, email, birthdate)
            ),
            therapist:therapist_id (
              full_name,
              email
            ),
            encounter:encounter_id (
              date,
              start_time,
              status
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setReport(null);
          return;
        }

        // Reconstruct data structure expected by ReportPreview
        const formattedReport = {
          patient: {
            name: data.patient?.profile?.full_name,
            rut: data.patient?.profile?.rut,
            email: data.patient?.profile?.email,
            birthdate: data.patient?.profile?.birthdate
          },
          therapist: data.therapist, // Should match auth user usually
          appointment: data.encounter ? {
            date: data.encounter.date,
            start_time: data.encounter.start_time,
            status: data.encounter.status
          } : null,
          template: { name: data.report_type, fields: [] }, // We might miss exact fields config here if not stored, but content has keys
          content: data.editable_json,
          generatedAt: data.created_at
        };
        
        // Mock fields from content keys for preview if template fields missing
        const contentKeys = Object.keys(data.editable_json);
        formattedReport.template.fields = contentKeys.map(key => ({
          name: key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) // Simple label generation
        }));

        setReport(formattedReport);
      } catch (err) {
        logger.error('Error loading report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!report) return <div className="p-8 text-center">Informe no encontrado.</div>;

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen pb-24">
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/dashboard/reports')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <div className="flex gap-2">
          {/* Re-use logic for download/share in future if needed, currently placeholders */}
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" /> Descargar PDF
          </Button>
        </div>
      </div>
      
      <ReportPreview reportData={report} />
    </div>
  );
};

export default ReportDetailPage;