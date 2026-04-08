import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Modal for assigning a badge to a therapist.
 */
const BadgeAssignmentModal = ({ open, onOpenChange, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Insignia</DialogTitle>
          <DialogDescription>Selecciona la insignia a otorgar y una justificación.</DialogDescription>
        </DialogHeader>
        {/* Form for badge selection would go here */}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm}>Asignar Insignia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeAssignmentModal;