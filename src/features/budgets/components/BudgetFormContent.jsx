import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistClinics } from '../hooks/useTherapistClinics';

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

/**
 * UI puro del formulario de presupuesto.
 * Recibe el resultado de useBudgetForm() vía props (form).
 * No conoce si está en modal o página.
 */
const BudgetFormContent = ({ form }) => {
  const { user } = useAuth();
  const { clinics, loading: loadingClinics } = useTherapistClinics(user?.id);
  const {
    title, setTitle,
    description, setDescription,
    discountPct, setDiscountPct,
    clinicId, setClinicId,
    items,
    services, loadingServices,
    addItem, removeItem, updateItem, selectServiceForItem,
    subtotal, discountAmount, total,
    validation,
  } = form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budget-title">Título del presupuesto *</Label>
          <Input
            id="budget-title"
            placeholder="Ej: Plan Ortodoncia 12 meses"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="budget-discount">Descuento (%)</Label>
          <Input
            id="budget-discount"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
          />
        </div>
      </div>

      {clinics.length > 0 && (
        <div>
          <Label htmlFor="budget-clinic">Clínica (opcional)</Label>
          <Select
            value={clinicId || 'none'}
            onValueChange={(val) => setClinicId(val === 'none' ? null : val)}
            disabled={loadingClinics}
          >
            <SelectTrigger id="budget-clinic">
              <SelectValue placeholder="Selecciona una clínica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Sin clínica (consulta privada) —</SelectItem>
              {clinics.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Si asocias una clínica, su equipo podrá registrar pagos.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="budget-desc">Descripción / notas (opcional)</Label>
        <Textarea
          id="budget-desc"
          placeholder="Detalles adicionales del presupuesto..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Servicios cotizados</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Agregar item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.uid}
              className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg bg-muted/30"
            >
              {/* Selector de servicio */}
              <div className="col-span-12 md:col-span-4">
                <Label className="text-xs text-muted-foreground">Servicio</Label>
                <Select
                  value={item.service_id || 'free'}
                  onValueChange={(val) => selectServiceForItem(item.uid, val === 'free' ? null : val)}
                  disabled={loadingServices}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Elegir o texto libre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">— Texto libre —</SelectItem>
                    {services.map((svc) => (
                      <SelectItem key={svc.id} value={svc.id}>
                        {svc.name} (${formatCLP(svc.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descripción */}
              <div className="col-span-12 md:col-span-4">
                <Label className="text-xs text-muted-foreground">Descripción *</Label>
                <Input
                  className="h-9"
                  placeholder="Ej: Limpieza dental"
                  value={item.description}
                  onChange={(e) => updateItem(item.uid, { description: e.target.value })}
                />
              </div>

              {/* Cantidad */}
              <div className="col-span-4 md:col-span-1">
                <Label className="text-xs text-muted-foreground">Cant.</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.uid, { quantity: e.target.value })}
                />
              </div>

              {/* Precio unitario */}
              <div className="col-span-6 md:col-span-2">
                <Label className="text-xs text-muted-foreground">Precio unit.</Label>
                <Input
                  className="h-9"
                  type="number"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(item.uid, { unit_price: e.target.value })}
                />
              </div>

              {/* Eliminar */}
              <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-9 w-9"
                  onClick={() => removeItem(item.uid)}
                  disabled={items.length === 1}
                  title="Eliminar item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Subtotal del item */}
              <div className="col-span-12 text-right text-sm text-muted-foreground">
                Subtotal item: ${formatCLP((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-mono">${formatCLP(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Descuento ({discountPct || 0}%):</span>
          <span className="font-mono">-${formatCLP(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold border-t pt-2">
          <span>Total:</span>
          <span className="font-mono text-primary">${formatCLP(total)} CLP</span>
        </div>
      </div>

      {/* Errores de validación */}
      {!validation.valid && validation.errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((err, i) => (<li key={i}>{err}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BudgetFormContent;
