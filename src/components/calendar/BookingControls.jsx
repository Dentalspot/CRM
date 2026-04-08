import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';

const BookingControls = ({
  patientName,
  onPatientNameChange,
  patientEmail,
  onPatientEmailChange,
  patientPhone,
  onPatientPhoneChange,
  onConfirmBooking,
  isSubmitting,
}) => {
  return (
    <>
      <div className="grid gap-4 py-4">
        {/* Nombre */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="patientNameDialog" className="text-right">
            Nombre *
          </Label>
          <Input
            id="patientNameDialog"
            value={patientName}
            onChange={onPatientNameChange}
            className="col-span-3"
            placeholder="Nombre completo"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Email */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="patientEmailDialog" className="text-right">
            Email *
          </Label>
          <Input
            id="patientEmailDialog"
            type="email"
            value={patientEmail}
            onChange={onPatientEmailChange}
            className="col-span-3"
            placeholder="email@ejemplo.com"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Teléfono */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="patientPhoneDialog" className="text-right">
            Teléfono
          </Label>
          <Input
            id="patientPhoneDialog"
            type="tel"
            value={patientPhone}
            onChange={onPatientPhoneChange}
            className="col-span-3"
            placeholder="+56 9 1234 5678"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>
        </DialogClose>

        <Button onClick={onConfirmBooking} disabled={isSubmitting}>
          {isSubmitting ? 'Confirmando...' : 'Confirmar Cita'}
        </Button>
      </div>
    </>
  );
};

export default BookingControls;