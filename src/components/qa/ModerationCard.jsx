import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, X } from 'lucide-react';

const ModerationCard = ({ item, type, onApprove, onReject }) => {
  return (
    <Card className="border-l-4 border-l-yellow-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <Badge variant="outline" className="uppercase tracking-wider text-[10px]">
            {type}
          </Badge>
          <span className="text-xs text-muted-foreground">Pendiente desde hace 2h</span>
        </div>
        <CardTitle className="text-base font-medium mt-2">
          {item.title || "Respuesta a pregunta #123"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/30 p-3 rounded text-sm text-muted-foreground">
          {item.content_snippet || item.content}
        </div>
        {item.flags && item.flags.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-yellow-600 text-xs font-medium">
            <AlertTriangle className="w-4 h-4" />
            Reportado por: {item.flags.join(', ')}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onReject(item.id)}>
          <X className="w-4 h-4 mr-1" /> Rechazar
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(item.id)}>
          <Check className="w-4 h-4 mr-1" /> Aprobar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModerationCard;