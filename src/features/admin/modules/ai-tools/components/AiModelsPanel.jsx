/**
 * @file AiModelsPanel.jsx
 * @description Panel lateral con modelos de IA registrados.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AiModelsPanel = ({ models = [], loading = false }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Bot className="h-4 w-4 text-cyan-500" />
        Modelos IA
        {models.length > 0 && <Badge variant="secondary" className="text-xs">{models.length}</Badge>}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      ) : models.length === 0 ? (
        <div className="text-center py-6">
          <Bot className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin modelos registrados</p>
          <p className="text-xs text-muted-foreground mt-1">Los modelos aparecerán aquí cuando se configuren</p>
        </div>
      ) : (
        models.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.version || 'v1.0'}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Activo</Badge>
          </div>
        ))
      )}
      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link to="/admin/ai-tools/models">Gestionar Modelos</Link>
      </Button>
    </CardContent>
  </Card>
);

export default AiModelsPanel;
