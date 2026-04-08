/**
 * @file RecentRecordsPanel.jsx
 * @description Wrapper Card para ClinicalHistoryTable en el dashboard.
 * Reutiliza la tabla existente, agrega header con link a vista completa.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ClinicalHistoryTable from './ClinicalHistoryTable';

const RecentRecordsPanel = ({ records = [], loading = false }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Registros Clínicos Recientes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/clinical-history">
            Ver todos <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ClinicalHistoryTable records={records} isLoading={loading} />
      </CardContent>
    </Card>
  );
};

export default RecentRecordsPanel;
