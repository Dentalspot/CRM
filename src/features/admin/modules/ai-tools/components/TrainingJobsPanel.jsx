/**
 * @file TrainingJobsPanel.jsx
 * @description Panel lateral con trabajos de entrenamiento.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TrainingJobsPanel = ({ jobs = [], loading = false }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Cpu className="h-4 w-4 text-purple-500" />
        Entrenamiento
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      ) : jobs.length === 0 ? (
        <div className="text-center py-6">
          <Cpu className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin trabajos activos</p>
          <p className="text-xs text-muted-foreground mt-1">Los jobs de entrenamiento aparecerán aquí</p>
        </div>
      ) : (
        jobs.map((j) => (
          <div key={j.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Job #{j.id?.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{j.status}</p>
            </div>
            <Badge variant={j.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
              {j.status || 'pending'}
            </Badge>
          </div>
        ))
      )}
      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link to="/admin/ai-tools/training">Ver Entrenamiento</Link>
      </Button>
    </CardContent>
  </Card>
);

export default TrainingJobsPanel;
