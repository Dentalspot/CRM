import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Modal to process refunds
 */
const RefundModal = ({ open, onOpenChange, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Procesar Reembolso</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <p>¿Estás seguro de reembolsar este pago? Esta acción es irreversible.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Confirmar Reembolso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundModal;