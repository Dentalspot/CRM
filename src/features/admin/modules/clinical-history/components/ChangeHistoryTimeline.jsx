import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * @file ChangeHistoryTimeline.jsx
 * @description Displays a timeline of changes made to a clinical record.
 */
const ChangeHistoryTimeline = ({ history }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Cambios</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {(!history || history.length === 0) ? (
            <div className="text-center text-muted-foreground p-10">No hay historial de cambios.</div>
          ) : (
            <div className="relative pl-6">
              {history.map((item, index) => (
                <div key={item.id} className="mb-8">
                  <div className="absolute left-0 top-0 h-full border-l-2 border-border"></div>
                  <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-primary"></div>
                  <p className="font-semibold">{item.user_name} realizó un cambio</p>
                  <p className="text-sm text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
                  <div className="mt-2 text-xs bg-muted p-2 rounded">
                    <p><strong>Campo:</strong> {item.field_changed}</p>
                    <p><strong>Antes:</strong> {item.old_value}</p>
                    <p><strong>Después:</strong> {item.new_value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChangeHistoryTimeline;