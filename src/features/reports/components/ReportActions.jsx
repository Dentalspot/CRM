import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Share2, Download, CheckCircle2 } from 'lucide-react';
import ShareReportModal from './ShareReportModal';
import { cn } from '@/lib/utils';

const ReportActions = ({ hookData, onBack, isModal = false }) => {
  const { saveReportToDb, generatePDF, generatedReport, isLoading } = hookData;
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleSave = async () => {
    const result = await saveReportToDb();
    if (result) setIsSaved(true);
  };

  return (
    <>
      <div className={cn(
        "bg-white/90 backdrop-blur border-t p-4 z-10",
        isModal ? "sticky bottom-0 w-full rounded-b-lg" : "fixed bottom-0 left-0 right-0"
      )}>
        <div className={cn("flex justify-between items-center", isModal ? "w-full" : "max-w-5xl mx-auto")}>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Editar
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={generatePDF}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
            
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)} disabled={!isSaved}>
              <Share2 className="mr-2 h-4 w-4" /> Compartir
            </Button>

            <Button onClick={handleSave} disabled={isSaved || isLoading} className={isSaved ? "bg-green-600 hover:bg-green-700" : ""}>
              {isSaved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Guardado
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar Informe
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ShareReportModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        report={generatedReport}
      />
    </>
  );
};

export default ReportActions;