import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';

const RevokeAccessDialog = ({ grant, onConfirm, onCancel }) => (
  <Dialog open={!!grant} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-700">
          <ShieldOff className="h-5 w-5" /> Revocar acceso
        </DialogTitle>
        <DialogDescription>
          <strong>{grant?.therapist?.full_name}</strong> ya no podrá ver tu historia clínica completa.
          Sin embargo, seguirá teniendo acceso a las notas que él/ella escribió personalmente.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => onConfirm(grant?.id)}
        >
          Confirmar revocación
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default RevokeAccessDialog;