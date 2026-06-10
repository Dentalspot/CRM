import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, ChevronsUpDown, Check, Building2, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

// Combobox con autocompletado para elegir servicio del catálogo.
// Si el dentista no tiene servicios cargados, deja el campo libre y avisa.
const ServiceCombobox = ({ services, value, onSelect, disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = services.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-9 w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {selected ? selected.name : value === 'free' ? '— Texto libre —' : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar servicio..." />
          <CommandList>
            <CommandEmpty>
              {services.length === 0
                ? 'No tenés servicios cargados todavía. Usá texto libre y escribí abajo.'
                : 'Sin resultados. Usá texto libre.'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__free__"
                onSelect={() => {
                  onSelect('free');
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === 'free' || !value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                — Texto libre —
              </CommandItem>
              {services.map((svc) => (
                <CommandItem
                  key={svc.id}
                  value={svc.name}
                  onSelect={() => {
                    onSelect(svc.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === svc.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1">
                    <div>{svc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${formatCLP(svc.price)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/**
 * UI puro del formulario de presupuesto.
 * Recibe el resultado de useBudgetForm() vía props (form).
 * No conoce si está en modal o página.
 */
const BudgetFormContent = ({ form, lockedClinic, resolvingClinic }) => {
  const {
    title, setTitle,
    description, setDescription,
    items,
    services, loadingServices,
    addItem, removeItem, updateItem, selectServiceForItem,
    subtotal, total,
    validation,
  } = form;

  // Spec 030 followup: descuento total ya no es un campo independiente.
  // Se calcula del subtotal bruto vs el subtotal neto (con todos los desc unit).
  // Ej: 10 items, 100% off a uno (de igual precio) → Descuento total = 10%
  const subtotalBruto = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const effectiveDiscountPct =
    subtotalBruto > 0
      ? Math.round(((subtotalBruto - subtotal) / subtotalBruto) * 100 * 10) / 10
      : 0;
  const effectiveDiscountAmount = subtotalBruto - subtotal;

  return (
    <div className="space-y-6">
      {/* Título del presupuesto */}
      <div>
        <Label htmlFor="budget-title">Título del presupuesto *</Label>
        <Input
          id="budget-title"
          placeholder="Ej: Plan Ortodoncia 12 meses"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Clínica — readonly, ancla a la org del paciente por Ley 20.584 art. 12 */}
      <div>
        <Label>Clínica del paciente</Label>
        {resolvingClinic ? (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground p-2 rounded border bg-muted/30">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Resolviendo clínica...
          </div>
        ) : lockedClinic ? (
          <div className="mt-1 flex items-center gap-2 text-sm p-2.5 rounded border bg-slate-50">
            <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <span className="font-medium text-slate-800">{lockedClinic.name}</span>
            <span className="ml-auto text-xs text-slate-500">Asignada por la ficha del paciente</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-2 text-sm text-amber-800 p-2 rounded border border-amber-200 bg-amber-50">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            No se pudo determinar la clínica del paciente. Verificá su ficha antes de continuar.
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="budget-desc">
          Descripción / notas <span className="text-muted-foreground font-normal">(opcional · visible para el paciente)</span>
        </Label>
        <Textarea
          id="budget-desc"
          placeholder="Objetivos a lograr, acuerdos con el paciente, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">Plan de tratamiento</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Agregar intervención
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const itemDiscount = Number(item.discount_percentage) || 0;
            const netPrice = (Number(item.unit_price) || 0) * (1 - itemDiscount / 100);
            const itemSubtotal = (Number(item.quantity) || 0) * netPrice;
            return (
              <div
                key={item.uid}
                className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/30"
              >
                {/* Servicio (combobox con autocompletado) — 3 cols desktop */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Servicio</Label>
                  <ServiceCombobox
                    services={services}
                    value={item.service_id || (services.length === 0 ? 'free' : undefined)}
                    onSelect={(val) =>
                      selectServiceForItem(item.uid, val === 'free' ? null : val)
                    }
                    disabled={loadingServices}
                    placeholder="Elegir o texto libre"
                  />
                </div>

                {/* Descripción — 3 cols desktop */}
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Descripción *</Label>
                  <Input
                    className="h-9"
                    placeholder="Ej: Limpieza dental"
                    value={item.description}
                    onChange={(e) => updateItem(item.uid, { description: e.target.value })}
                  />
                </div>

                {/* Cantidad — 1 col */}
                <div className="col-span-3 md:col-span-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Cant.</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.uid, { quantity: e.target.value })}
                  />
                </div>

                {/* Precio unitario — 2 cols */}
                <div className="col-span-5 md:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Precio unit.</Label>
                  <Input
                    className="h-9"
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(item.uid, { unit_price: e.target.value })}
                  />
                </div>

                {/* Descuento unitario por intervención — 2 cols (más espacio para el label) */}
                <div className="col-span-3 md:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Desc. unit %
                  </Label>
                  <Input
                    className="h-9"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={item.discount_percentage || 0}
                    onChange={(e) =>
                      updateItem(item.uid, { discount_percentage: e.target.value })
                    }
                  />
                </div>

                {/* Eliminar — 1 col */}
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-9 w-9"
                    onClick={() => removeItem(item.uid)}
                    disabled={items.length === 1}
                    title="Eliminar intervención"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtotal del item */}
                <div className="col-span-12 text-right text-sm text-muted-foreground">
                  {itemDiscount > 0 && (
                    <span className="text-purple-600 mr-2">
                      −{itemDiscount}% en esta intervención
                    </span>
                  )}
                  Subtotal: <strong className="text-foreground">${formatCLP(itemSubtotal)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totales */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal (sin descuentos):</span>
          <span className="font-mono">${formatCLP(subtotalBruto)}</span>
        </div>

        {/* Descuento total CALCULADO automáticamente desde los Desc. unit % de
            cada intervención. No editable — para descontar globalmente, pongan
            % en cada intervención (o aplicá un descuento masivo desde futuro). */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-md p-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">Descuento total</span>
            <span className="text-[11px] text-slate-500">
              Calculado de los descuentos por intervención
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">
              {effectiveDiscountPct.toFixed(1)}%
            </span>
            <span className="font-mono text-sm text-muted-foreground min-w-[100px] text-right">
              -${formatCLP(effectiveDiscountAmount)}
            </span>
          </div>
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
