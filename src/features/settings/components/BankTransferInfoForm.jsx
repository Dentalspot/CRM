import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateRut, formatRut, cleanRut } from '@/utils/rutUtils';
import logger from '@/lib/utils/logger';
import { Loader2, ShieldCheck, AlertCircle, Building2, CreditCard } from 'lucide-react';

const BANKS = [
  "Banco Estado", "Banco de Chile", "Banco Santander", "BCI", "Scotiabank",
  "Itaú", "Banco Security", "Banco Bice", "Banco Falabella", "Banco Ripley",
  "Banco Consorcio", "Banco Internacional", "Tenpo", "Coopeuch"
];

const ACCOUNT_TYPES = [
  { value: "corriente", label: "Cuenta Corriente" },
  { value: "vista", label: "Cuenta Vista / RUT" },
  { value: "ahorro", label: "Cuenta de Ahorro" }
];

const BankTransferInfoForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const { control, register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      bank_name: '',
      account_type: '',
      account_number: '',
      account_holder_name: '',
      account_holder_rut: '',
      bank_email: ''
    }
  });

  const accountHolderRut = watch('account_holder_rut');

  // Effect to format RUT in real-time
  useEffect(() => {
    if (accountHolderRut) {
      const formatted = formatRut(accountHolderRut);
      if (formatted !== accountHolderRut) {
        setValue('account_holder_rut', formatted);
      }
    }
  }, [accountHolderRut, setValue]);

  useEffect(() => {
    if (user?.id) {
      fetchBankDetails();
    }
  }, [user?.id]);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('therapist_details')
        .select('bank_name, account_type, account_number, account_holder_name, account_holder_rut, bank_email, bank_verified, bank_verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.bank_name) {
        setInitialData(data);
        reset(data);
      } else {
        setIsEditing(true); // Auto-open edit mode if no data
      }
    } catch (error) {
      logger.error('Error fetching bank details:', error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Validar RUT único (regla de negocio: rut/email únicos entre terapeutas para pagos)
      // Nota: Esto es una validación "soft" en frontend/API, idealmente sería un constraint en DB
      const cleanHolderRut = cleanRut(data.account_holder_rut);
      
      const { data: existingRut, error: rutCheckError } = await supabase
        .from('therapist_details')
        .select('user_id')
        .neq('user_id', user.id) // Excluir al usuario actual
        .eq('account_holder_rut', data.account_holder_rut)
        .maybeSingle();

      if (rutCheckError) throw rutCheckError;

      if (existingRut) {
        toast({
          variant: "destructive",
          title: "RUT duplicado",
          description: "Este RUT ya está asociado a otra cuenta bancaria en el sistema."
        });
        setLoading(false);
        return;
      }

      // 2. Guardar datos
      const updates = {
        ...data,
        updated_at: new Date(),
        // Si se cambian datos críticos, reseteamos la verificación
        bank_verified: false,
        bank_verification_status: 'pending'
      };

      const { error } = await supabase
        .from('therapist_details')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Datos guardados exitosamente",
        description: "Tus datos bancarios han sido actualizados."
      });
      
      setInitialData({ ...initialData, ...updates });
      setIsEditing(false);

    } catch (error) {
      logger.error('Error updating bank info:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron actualizar los datos bancarios."
      });
    } finally {
      setLoading(false);
    }
  };

  const maskAccountNumber = (number) => {
    if (!number) return '';
    if (number.length <= 4) return number;
    return '•••• ' + number.slice(-4);
  };

  // Status Badge Helper
  const renderStatusBadge = () => {
    const status = initialData?.bank_verification_status || 'pending';
    const isVerified = initialData?.bank_verified;

    if (isVerified || status === 'verified') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 gap-1"><ShieldCheck className="h-3 w-3" /> Verificado</Badge>;
    }
    if (status === 'rejected') {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Rechazado</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"><Loader2 className="h-3 w-3" /> Pendiente de Verificación</Badge>;
  };

  if (!isEditing && initialData?.bank_name) {
    return (
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Datos de Transferencia
              </CardTitle>
              <CardDescription>Cuenta donde recibirás tus pagos y comisiones</CardDescription>
            </div>
            {renderStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Banco</Label>
              <p className="font-medium text-slate-900">{initialData.bank_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tipo de Cuenta</Label>
              <p className="font-medium text-slate-900 capitalize">{initialData.account_type?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Número de Cuenta</Label>
              <p className="font-medium text-slate-900 font-mono tracking-widest">{maskAccountNumber(initialData.account_number)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Notificaciones</Label>
              <p className="font-medium text-slate-900">{initialData.bank_email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Titular</Label>
              <p className="font-medium text-slate-900">{initialData.account_holder_name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">RUT Titular</Label>
              <p className="font-medium text-slate-900">{initialData.account_holder_rut}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Editar Datos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-teal-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-teal-600" />
          {initialData ? 'Actualizar Datos Bancarios' : 'Configurar Datos de Pago'}
        </CardTitle>
        <CardDescription>
          Ingresa los datos de la cuenta bancaria donde deseas recibir tus ganancias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Datos Seguros</AlertTitle>
          <AlertDescription className="text-blue-700 text-xs">
            La información bancaria se almacena de forma segura y solo se utiliza para procesar tus pagos. 
            El RUT y número de cuenta se mantendrán parcialmente ocultos en la interfaz.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Banco */}
            <div className="space-y-2">
              <Label htmlFor="bank_name">Banco <span className="text-red-500">*</span></Label>
              <Controller
                name="bank_name"
                control={control}
                rules={{ required: "Debes seleccionar un banco" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger className={errors.bank_name ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bank_name && <span className="text-xs text-red-500">{errors.bank_name.message}</span>}
            </div>

            {/* Tipo de Cuenta */}
            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo de Cuenta <span className="text-red-500">*</span></Label>
              <Controller
                name="account_type"
                control={control}
                rules={{ required: "Selecciona el tipo de cuenta" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <SelectTrigger className={errors.account_type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Tipo de cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.account_type && <span className="text-xs text-red-500">{errors.account_type.message}</span>}
            </div>

            {/* Número de Cuenta */}
            <div className="space-y-2">
              <Label htmlFor="account_number">Número de Cuenta <span className="text-red-500">*</span></Label>
              <Input
                id="account_number"
                placeholder="Ej: 123456789"
                {...register("account_number", { 
                  required: "Ingresa el número de cuenta",
                  pattern: {
                    value: /^[0-9]+$/,
                    message: "Solo se permiten números"
                  },
                  minLength: {
                    value: 5,
                    message: "Mínimo 5 dígitos"
                  }
                })}
                className={errors.account_number ? "border-red-500" : ""}
              />
              {errors.account_number && <span className="text-xs text-red-500">{errors.account_number.message}</span>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="bank_email">Email de Contacto <span className="text-red-500">*</span></Label>
              <Input
                id="bank_email"
                type="email"
                placeholder="Para comprobantes de transferencia"
                {...register("bank_email", { 
                  required: "Ingresa un email de contacto",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email inválido"
                  }
                })}
                className={errors.bank_email ? "border-red-500" : ""}
              />
              {errors.bank_email && <span className="text-xs text-red-500">{errors.bank_email.message}</span>}
            </div>

            {/* Nombre Titular */}
            <div className="space-y-2">
              <Label htmlFor="account_holder_name">Nombre Completo Titular <span className="text-red-500">*</span></Label>
              <Input
                id="account_holder_name"
                placeholder="Como aparece en el banco"
                {...register("account_holder_name", { required: "El nombre del titular es obligatorio" })}
                className={errors.account_holder_name ? "border-red-500" : ""}
              />
              {errors.account_holder_name && <span className="text-xs text-red-500">{errors.account_holder_name.message}</span>}
            </div>

            {/* RUT Titular */}
            <div className="space-y-2">
              <Label htmlFor="account_holder_rut">RUT Titular <span className="text-red-500">*</span></Label>
              <Input
                id="account_holder_rut"
                placeholder="12.345.678-9"
                {...register("account_holder_rut", { 
                  required: "El RUT es obligatorio",
                  validate: (value) => validateRut(value) || "RUT inválido"
                })}
                className={errors.account_holder_rut ? "border-red-500" : ""}
              />
              {errors.account_holder_rut && <span className="text-xs text-red-500">{errors.account_holder_rut.message}</span>}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t">
            {initialData && (
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Datos Bancarios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BankTransferInfoForm;