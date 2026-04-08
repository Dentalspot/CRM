import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Modal for manually changing a therapist's level.
 */
const LevelChangeModal = ({ open, onOpenChange, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Nivel Manualmente</DialogTitle>
          <DialogDescription>Esta acción es auditada. Ingresa una justificación.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
            <label htmlFor="reason">Justificación</label>
            <Input id="reason" placeholder="Ej: Corrección por error en cálculo..." />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm}>Confirmar Cambio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelChangeModal;