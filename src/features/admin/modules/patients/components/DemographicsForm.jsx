import React from 'react';
import { Button } from '@/components/ui/button';
// import { useDemographicsForm } from '../hooks/useDemographicsForm';

/**
 * Form for editing patient demographics
 * @param {object} props - { initialData, onSubmit }
 */
const DemographicsForm = ({ initialData, onSubmit }) => {
  return (
    <form className="space-y-4">
      {/* Form Fields Stub */}
      <div>
        <label>Nombre Completo</label>
        <input type="text" className="border p-2 w-full" defaultValue={initialData?.full_name} />
      </div>
      <Button type="button" onClick={() => onSubmit({})}>Guardar Cambios</Button>
    </form>
  );
};

export default DemographicsForm;