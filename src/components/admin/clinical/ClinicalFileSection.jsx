import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClinicalFileSection = ({ title, items, onView, onEdit, type }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Button variant="outline" size="sm">Ver Todo</Button>
      </CardHeader>
      <CardContent>
        {items && items.length > 0 ? (
          <div className="space-y-4">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded mt-1">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.summary || item.title || 'Entrada clínica'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.entry_date || item.created_at), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(item)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay registros en esta sección.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicalFileSection;