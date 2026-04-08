import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Share2, Download, Loader2 } from 'lucide-react';
import useClinicalTimeline from './hooks/useClinicalTimeline';
import PassportHeader from './components/PassportHeader';
import ClinicalTimeline from './components/ClinicalTimeline';
import AccessGrantsManager from './components/AccessGrantsManager';
import SharePassportModal from './components/SharePassportModal';
import logger from '@/lib/utils/logger';

const ClinicalPassportPage = () => {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  // Resolve patient ID from profile
  useEffect(() => {
    const resolvePatient = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('patients')
          .select('id')
          .eq('profile_id', user.id)
          .limit(1)
          .maybeSingle();
        if (data) setPatientId(data.id);
      } catch (err) {
        logger.error('Error resolving patient:', err);
      } finally {
        setLoading(false);
      }
    };
    resolvePatient();
  }, [user]);

  const { loading: timelineLoading, grouped, stats, events, filter, setFilter } = useClinicalTimeline({
    patientId,
    profileId: user?.id,
    isPatientView: true,
  });

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-bold text-gray-900">Pasaporte Clínico</h2>
        <p className="text-gray-500 mt-2">
          Tu pasaporte clínico estará disponible cuando un dentista registre tu primera sesión en DentalSpot.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with stats */}
      <PassportHeader
        patientName={user?.full_name}
        stats={stats}
        isPatientView={true}
      />

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-4 w-4 mr-2" /> Compartir con terapeuta
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" /> Descargar PDF
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline (2/3) */}
        <div className="lg:col-span-2">
          <ClinicalTimeline
            grouped={grouped}
            loading={timelineLoading}
            filter={filter}
            setFilter={setFilter}
            totalEvents={events.length}
          />
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          <AccessGrantsManager
            patientId={patientId}
            profileId={user?.id}
          />
        </div>
      </div>

      {/* Share Modal */}
      <SharePassportModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        patientId={patientId}
        profileId={user?.id}
      />
    </div>
  );
};

export default ClinicalPassportPage;