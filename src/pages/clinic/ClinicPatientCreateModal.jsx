/**
 * @file src/pages/clinic/ClinicPatientCreateModal.jsx
 *
 * Modal para que un clinic_admin (rol clínica) cree pacientes nuevos
 * asignándolos a un dentista de la clínica.
 *
 * Reutiliza `createPatientWithoutAccount` / `createPatientAccount` del
 * service patientAccountService, pasando como `therapistId` el dentista
 * seleccionado en el dropdown (no el user.id del admin).
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import {
  createPatientAccount,
  createPatientWithoutAccount,
} from '@/services/patientAccountService';

const ClinicPatientCreateModal = ({
  isOpen,
  onOpenChange,
  organizationId,
  dentists = [],
  onCreated,
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    rut: '',
    therapist_id: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdSummary, setCreatedSummary] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        rut: '',
        therapist_id: dentists.length === 1 ? dentists[0].id : '',
      });
      setErrors({});
      setCreatedSummary(null);
    }
  }, [isOpen, dentists]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!formData.full_name?.trim()) e.full_name = 'Nombre obligatorio';
    if (!formData.phone?.trim()) e.phone = 'Teléfono obligatorio';
    if (!formData.therapist_id) e.therapist_id = 'Selecciona un dentista';
    if (formData.email?.trim() && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      e.email = 'Email inválido';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: 'Revisa los campos obligatorios.',
      });
      return;
    }
    setLoading(true);
    try {
      // B9 fix: gate de plan también para el flow del clinic_admin.
      // El RPC check_plan_limit cuenta pacientes activos del DENTISTA asignado
      // (no del admin), por eso pasamos formData.therapist_id. Sin esto, un
      // clinic_admin podía crear pacientes ilimitados saltándose la cuota del
      // plan del dentista (spec 022 — Phase E enforcement).
      try {
        const { data: allowed, error: limitErr } = await supabase.rpc('check_plan_limit', {
          p_therapist_id: formData.therapist_id,
          p_resource_type: 'patient',
        });
        if (limitErr) {
          // Fail-safe OPEN: si el RPC falla, dejamos crear (continuidad operacional).
          logger.warn('[ClinicPatientCreateModal] check_plan_limit error, allowing:', limitErr);
        } else if (allowed === false) {
          toast({
            variant: 'destructive',
            title: 'Plan del dentista alcanzó el límite',
            description:
              'No se pueden crear más pacientes para este dentista en su plan actual. Pídele al dentista que actualice su plan o asígnalo a otro.',
          });
          setLoading(false);
          return;
        }
      } catch (gateErr) {
        // Misma política fail-safe OPEN que useActivePlanLimits.
        logger.warn('[ClinicPatientCreateModal] check_plan_limit exception, allowing:', gateErr);
      }

      const hasEmail = !!formData.email?.trim();
      const hasRut = !!formData.rut?.trim();

      let result;
      if (hasEmail && hasRut) {
        result = await createPatientAccount({
          therapistId: formData.therapist_id,
          organizationId,
          email: formData.email,
          fullName: formData.full_name,
          rut: formData.rut,
          phone: formData.phone,
        });
      } else {
        result = await createPatientWithoutAccount({
          therapistId: formData.therapist_id,
          organizationId,
          fullName: formData.full_name,
          phone: formData.phone,
          email: formData.email || null,
          rut: formData.rut || null,
        });
      }

      if (!result.success) throw new Error(result.message);
      setCreatedSummary({
        full_name: formData.full_name,
        hasAccount: !!(hasEmail && hasRut),
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el paciente',
        description: err.message || 'Inténtalo nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (createdSummary && onCreated) onCreated();
  };

  if (createdSummary) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Paciente creado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{createdSummary.full_name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {createdSummary.hasAccount
                  ? 'Se creó cuenta y se enviará email de activación.'
                  : 'Sin cuenta. Puedes invitarlo más tarde para que cree su perfil.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar nuevo paciente</DialogTitle>
          <DialogDescription>
            Crea un paciente y asígnalo a uno de los dentistas de la clínica.
            Solo nombre y teléfono son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez González"
              className={errors.full_name ? 'border-destructive' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rut">RUT/ID (opcional)</Label>
            <Input
              id="rut"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
            />
            <p className="text-xs text-muted-foreground">
              Si ingresas email y RUT, generaremos una contraseña segura y la enviaremos al paciente por email.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Label>
              Dentista asignado <span className="text-destructive">*</span>
            </Label>
            {dentists.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay dentistas activos en la clínica. Invita primero a un
                dentista para poder asignar pacientes.
              </p>
            ) : (
              <Select
                value={formData.therapist_id}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, therapist_id: v }))
                }
              >
                <SelectTrigger
                  className={errors.therapist_id ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Selecciona un dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.full_name || d.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.therapist_id && (
              <p className="text-sm text-destructive">{errors.therapist_id}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={loading || dentists.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear paciente'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicPatientCreateModal;
