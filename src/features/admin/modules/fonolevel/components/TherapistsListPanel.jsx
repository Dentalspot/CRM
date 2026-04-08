import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const TherapistsListPanel = ({ therapists = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Terapeutas Recientes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/dentallevel">Ver todos <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : therapists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Sin terapeutas registrados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Nombre</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {therapists.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/admin/dentallevel/${t.id}`)}>
                  <TableCell className="font-medium">{t.full_name || 'Sin nombre'}</TableCell>
                  <TableCell>
                    {t.is_verified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(t.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TherapistsListPanel;
