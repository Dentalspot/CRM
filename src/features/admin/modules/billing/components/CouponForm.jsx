import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Form to create or edit a coupon
 */
const CouponForm = ({ onSubmit, initialData }) => {
  return (
    <form className="space-y-4">
      <div className="grid gap-2">
        <label>Código del Cupón</label>
        <Input placeholder="EJ: VERANO2026" defaultValue={initialData?.code} />
      </div>
      <Button type="button" onClick={() => onSubmit({})}>Guardar Cupón</Button>
    </form>
  );
};

export default CouponForm;