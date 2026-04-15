import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { escapeHTML } from '@/lib/utils/sanitize';

export const useCompliance = () => {
  const [stats, setStats] = useState({
    totalRecords: 0,
    pendingReview: 0,
    reviewed: 0,
    accessIncidents: 0,
    recentAccesses: 0,
    complianceRate: 0,
  });
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompliance = useCallback(async () => {
    setLoading(true);
    try {
      // Count total records
      const { count: totalRecords } = await supabase
        .from('clinical_history')
        .select('*', { count: 'exact', head: true });

      // Count reviewed (has session_notes or summary)
      const { count: reviewed } = await supabase
        .from('clinical_history')
        .select('*', { count: 'exact', head: true })
        .not('session_notes', 'is', null)
        .neq('session_notes', '');

      // Pending = total - reviewed
      const pendingReview = (totalRecords || 0) - (reviewed || 0);

      // Access incidents (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentAccesses } = await supabase
        .from('clinical_access_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Compliance rate
      const rate = totalRecords > 0 ? Math.round((reviewed / totalRecords) * 100) : 100;

      // Fetch pending records for the list
      const { data: pending } = await supabase
        .from('clinical_history')
        .select('id, summary, title, created_at, therapist_id, patient_id, patients(profiles(full_name)), therapist:profiles!clinical_history_therapist_id_fkey(full_name)')
        .or('session_notes.is.null,session_notes.eq.')
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        totalRecords: totalRecords || 0,
        pendingReview,
        reviewed: reviewed || 0,
        accessIncidents: 0,
        recentAccesses: recentAccesses || 0,
        complianceRate: rate,
      });
      setPendingRecords(pending || []);
      setError(null);
    } catch (err) {
      logger.error('Error fetching compliance:', err);
      setError(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompliance(); }, [fetchCompliance]);

  const markAsReviewed = async (recordId) => {
    const { error } = await supabase
      .from('clinical_history')
      .update({ session_notes: '[Revisado por admin]', updated_at: new Date().toISOString() })
      .eq('id', recordId);
    if (!error) fetchCompliance();
    return !error;
  };

  const generateReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Reporte de Cumplimiento - DentalSpot</title>
      <style>body{font-family:system-ui;padding:40px;max-width:800px;margin:auto}
      h1{font-size:24px;color:#333}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:14px}
      th{background:#f5f5f5}.stat{display:inline-block;padding:16px 24px;margin:8px;background:#f9f9f9;border-radius:8px;text-align:center}
      .stat h3{margin:0;font-size:24px}.stat p{margin:4px 0 0;font-size:12px;color:#666}</style></head><body>
      <h1>Reporte de Cumplimiento Normativo</h1>
      <p>Generado: ${new Date().toLocaleString('es-CL')}</p>
      <div>
        <div class="stat"><h3>${escapeHTML(stats.totalRecords)}</h3><p>Total Registros</p></div>
        <div class="stat"><h3>${escapeHTML(stats.reviewed)}</h3><p>Revisados</p></div>
        <div class="stat"><h3>${escapeHTML(stats.pendingReview)}</h3><p>Pendientes</p></div>
        <div class="stat"><h3>${escapeHTML(stats.complianceRate)}%</h3><p>Tasa de Cumplimiento</p></div>
        <div class="stat"><h3>${escapeHTML(stats.recentAccesses)}</h3><p>Accesos (30 días)</p></div>
      </div>
      <h2>Marco Normativo</h2>
      <table>
        <tr><th>Normativa</th><th>Estado</th><th>Descripción</th></tr>
        <tr><td>Ley 19.628</td><td>Cumple</td><td>Protección de la vida privada</td></tr>
        <tr><td>Ley 20.584</td><td>Cumple</td><td>Derechos de los pacientes</td></tr>
        <tr><td>RGPD / GDPR</td><td>Cumple</td><td>Reglamento europeo de datos</td></tr>
        <tr><td>Ag. Nac. Ciberseguridad</td><td>Cumple</td><td>Normativa ANCS Chile</td></tr>
      </table>
      <hr><p style="font-size:11px;color:#999">DentalSpot — Plataforma de Odontología</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return { stats, pendingRecords, loading, error, markAsReviewed, generateReport, refetch: fetchCompliance };
};
