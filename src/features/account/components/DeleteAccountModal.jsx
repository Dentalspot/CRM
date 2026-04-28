import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { useDeleteAccount } from '../hooks/useDeleteAccount';

/**
 * Modal de confirmación de eliminación de cuenta.
 * Re-prompt de password + lista de consecuencias.
 */
const DeleteAccountModal = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { deleteAccount, submitting } = useDeleteAccount();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = async () => {
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Contraseña requerida',
        description: 'Ingresa tu contraseña para confirmar.',
      });
      return;
    }

    const result = await deleteAccount({ password });

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la cuenta',
        description: result.error?.message || 'Intenta de nuevo.',
      });
      return;
    }

    toast({
      title: 'Cuenta eliminada',
      description: 'Tu cuenta ha sido eliminada. Te enviamos una confirmación por email.',
    });

    // Redirect a login (signOut ya se ejecutó dentro del hook)
    setTimeout(() => {
      window.location.replace('/auth/login');
    }, 1200);
  };

  const handleCancel = () => {
    if (submitting) return;
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Eliminar cuenta</DialogTitle>
              <DialogDescription className="mt-1">
                Esta acción es <strong>irreversible</strong>. Lee atentamente antes de continuar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
            <p className="font-semibold text-red-900">Lo que se eliminará:</p>
            <ul className="list-disc list-inside text-red-800 space-y-0.5">
              <li>Tu nombre, email, teléfono y RUT</li>
              <li>Tu foto de perfil</li>
              <li>Tu acceso a la plataforma</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
            <p className="font-semibold text-amber-900">Lo que conservamos por obligación legal:</p>
            <ul className="list-disc list-inside text-amber-800 space-y-0.5">
              <li>Historial clínico (anonimizado, 5 años)</li>
              <li>Registros de pago y presupuestos (5 años)</li>
            </ul>
            <p className="text-xs text-amber-700 mt-1">
              Conforme a la Ley 21.719 y normativa sanitaria chilena. Los datos se mantienen sin posibilidad de identificarte.
            </p>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="text-sm">
              Confirma con tu contraseña *
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting || !password}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Eliminar mi cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountModal;
