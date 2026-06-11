import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronRight, Edit2, Trash2, EyeOff, Eye, Clock } from 'lucide-react';
import { deactivateService, reactivateService, deleteServiceIfUnused } from '../api/clinicServicesApi';

const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
    Number(n) || 0,
  );

export default function ServicesBySpecialtyList({ groups, onEdit, onReload }) {
  const [openGroups, setOpenGroups] = useState(() => new Set(groups.map((g) => g.value)));
  const [confirmDelete, setConfirmDelete] = useState(null);

  const toggle = (value) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleDeactivate = async (svc) => {
    try {
      await deactivateService(svc.id);
      toast({ title: 'Servicio desactivado', description: `"${svc.name}" no aparecerá más en presupuestos nuevos.` });
      onReload?.();
    } catch (err) {
      toast({ title: 'No se pudo desactivar', description: err.message, variant: 'destructive' });
    }
  };

  const handleReactivate = async (svc) => {
    try {
      await reactivateService(svc.id);
      toast({ title: 'Servicio reactivado' });
      onReload?.();
    } catch (err) {
      toast({ title: 'No se pudo reactivar', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteServiceIfUnused(confirmDelete.id);
      toast({ title: 'Servicio eliminado' });
      setConfirmDelete(null);
      onReload?.();
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err.message, variant: 'destructive' });
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = openGroups.has(group.value);
        return (
          <Card key={group.value} className="overflow-hidden">
            <button
              onClick={() => toggle(group.value)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors"
              type="button"
            >
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-foreground">{group.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {group.items.length}
                </Badge>
              </div>
            </button>

            {isOpen && (
              <CardContent className="pt-0 pb-3 px-0">
                <div className="divide-y">
                  {group.items.map((svc) => (
                    <div
                      key={svc.id}
                      className={`px-4 py-3 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors ${
                        !svc.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{svc.name}</span>
                          {!svc.is_active && (
                            <Badge variant="outline" className="text-xs">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        {svc.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{svc.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{formatCLP(svc.price)}</span>
                          {svc.duration_minutes > 0 && (
                            <span className="flex items-center gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {svc.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => onEdit(svc)} title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {svc.is_active ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeactivate(svc)}
                            title="Desactivar"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReactivate(svc)}
                            title="Reactivar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirmDelete(svc)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{confirmDelete?.name}</strong> definitivamente.
              Si está siendo usado en algún presupuesto o cita, no se podrá eliminar (vas a poder desactivarlo).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
