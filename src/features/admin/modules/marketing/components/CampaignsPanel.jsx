import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_MAP = {
  draft: { label: 'Borrador', variant: 'secondary' },
  scheduled: { label: 'Programada', variant: 'outline' },
  sending: { label: 'Enviando', variant: 'default' },
  sent: { label: 'Enviada', variant: 'default' },
  failed: { label: 'Error', variant: 'destructive' },
};

const CampaignsPanel = ({ campaigns = [], loading = false }) => (
  <Card>
    <CardHeader className="pb-3 flex flex-row items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2">
        <Send className="h-4 w-4 text-pink-500" />
        Campanas Recientes
      </CardTitle>
      <Button variant="outline" size="sm" asChild>
        <Link to="/admin/marketing/campaigns"><Plus className="h-3.5 w-3.5 mr-1" /> Nueva</Link>
      </Button>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8">
          <Send className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin campanas creadas</p>
          <p className="text-xs text-muted-foreground mt-1">Crea tu primera campana de email marketing</p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link to="/admin/marketing/campaigns"><Plus className="h-3.5 w-3.5 mr-1" /> Crear Campana</Link>
          </Button>
        </div>
      ) : (
        campaigns.map((c) => {
          const status = STATUS_MAP[c.status] || STATUS_MAP.draft;
          return (
            <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">{c.subject || c.name || 'Sin asunto'}</p>
                <p className="text-xs text-muted-foreground">{c.segment || 'Todos'}</p>
              </div>
              <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
            </div>
          );
        })
      )}
    </CardContent>
  </Card>
);

export default CampaignsPanel;
