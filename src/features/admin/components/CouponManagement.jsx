import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  Calendar as CalendarIcon,
  Copy,
  Tag,
  TrendingUp,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
  generateCouponCode
} from "@/features/admin/api/couponApi";
import logger from '@/lib/utils/logger';
import { cn } from "@/lib/utils";

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mapping DB fields: discount_value -> value, expiration_date -> valid_until, current_uses -> used_count, applicable_plans -> applies_to_products
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      code: "",
      discount_type: "percentage",
      value: "",
      description: "",
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: "",
      max_uses: "",
      min_purchase_amount: "",
      max_discount_amount: "",
      applies_to_products: "",
      is_active: true
    }
  });

  const discountType = watch("discount_type");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsResult, statsResult] = await Promise.all([
        getCoupons({ status: statusFilter }),
        getCouponStats()
      ]);

      if (couponsResult.success) {
        setCoupons(couponsResult.data || []);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
      logger.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setValue("code", coupon.code);
      setValue("discount_type", coupon.discount_type);
      setValue("value", coupon.discount_value); // Map DB column
      setValue("description", coupon.description || "");
      setValue("valid_from", coupon.valid_from ? coupon.valid_from.split('T')[0] : "");
      setValue("valid_until", coupon.expiration_date ? coupon.expiration_date.split('T')[0] : ""); // Map DB column
      setValue("max_uses", coupon.max_uses || "");
      setValue("min_purchase_amount", coupon.min_purchase_amount || "");
      setValue("max_discount_amount", coupon.max_discount_amount || "");
      setValue("applies_to_products", coupon.applicable_plans ? coupon.applicable_plans.join(', ') : ""); // Map DB column
      setValue("is_active", coupon.is_active);
    } else {
      setEditingCoupon(null);
      reset({
        code: "",
        discount_type: "percentage",
        value: "",
        description: "",
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: "",
        max_uses: "",
        min_purchase_amount: "",
        max_discount_amount: "",
        applies_to_products: "",
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleGenerateCode = () => {
    const newCode = generateCouponCode(8);
    setValue("code", newCode);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado", description: code });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // Prepare payload matching DB columns
    const payload = {
      code: data.code.toUpperCase().trim(),
      discount_type: data.discount_type,
      discount_value: Number(data.value),
      description: data.description || null,
      valid_from: data.valid_from ? new Date(data.valid_from).toISOString() : new Date().toISOString(),
      expiration_date: data.valid_until ? new Date(data.valid_until).toISOString() : null,
      max_uses: data.max_uses ? Number(data.max_uses) : null,
      min_purchase_amount: data.min_purchase_amount ? Number(data.min_purchase_amount) : null,
      max_discount_amount: data.max_discount_amount ? Number(data.max_discount_amount) : null,
      applicable_plans: data.applies_to_products
        ? data.applies_to_products.split(',').map(s => s.trim()).filter(Boolean)
        : null,
      is_active: data.is_active ?? true
    };

    let result;
    if (editingCoupon) {
      result = await updateCoupon(editingCoupon.id, payload);
    } else {
      result = await createCoupon(payload);
    }

    if (result.success) {
      toast({
        title: "Éxito",
        description: `Cupón ${editingCoupon ? 'actualizado' : 'creado'} correctamente.`,
      });
      setIsModalOpen(false);
      fetchData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al guardar.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este cupón?")) return;

    const result = await deleteCoupon(id);
    if (result.success) {
      toast({ title: "Cupón eliminado" });
      fetchData();
    } else {
      toast({
        title: "Error al eliminar",
        description: result.error,
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (coupon) => {
    const newStatus = !coupon.is_active;

    // Optimistic update
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: newStatus } : c));

    const result = await updateCoupon(coupon.id, { is_active: newStatus });
    if (!result.success) {
      // Revert if failed
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !newStatus } : c));
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    } else {
      toast({
        title: newStatus ? "Cupón activado" : "Cupón desactivado",
      });
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();

    if (!coupon.is_active) {
      return { label: 'Inactivo', color: 'bg-gray-100 text-gray-600' };
    }
    if (coupon.expiration_date && new Date(coupon.expiration_date) < now) {
      return { label: 'Expirado', color: 'bg-red-100 text-red-600' };
    }
    if (coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses) {
      return { label: 'Agotado', color: 'bg-orange-100 text-orange-600' };
    }
    return { label: 'Activo', color: 'bg-green-100 text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Cupones</p>
                <h3 className="text-2xl font-bold mt-1 text-slate-800">{stats.total}</h3>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Activos</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</h3>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expirados</p>
                <h3 className="text-2xl font-bold text-primary mt-1">{stats.expired}</h3>
              </div>
              <div className="bg-primary p-2.5 rounded-xl border border-primary">
                <XCircle className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usos Totales</p>
                <h3 className="text-2xl font-bold text-violet-600 mt-1">{stats.totalUses}</h3>
              </div>
              <div className="bg-violet-50 p-2.5 rounded-xl border border-violet-100">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Gestión de Cupones</h2>
            <p className="text-sm text-slate-500 mt-1">Crea y administra códigos de descuento para tus planes.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cupón
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-slate-900 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-200 rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} title="Recargar" className="rounded-xl border-slate-200 hover:bg-slate-50">
            <RefreshCw className={cn("h-4 w-4 text-slate-600", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Código</TableHead>
                <TableHead className="font-semibold text-slate-700">Descuento</TableHead>
                <TableHead className="font-semibold text-slate-700">Usos</TableHead>
                <TableHead className="font-semibold text-slate-700">Vigencia</TableHead>
                <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col justify-center items-center gap-2 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="text-sm">Cargando cupones...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-slate-100 p-3 rounded-full">
                        <Tag className="h-6 w-6 text-slate-400" />
                      </div>
                      <p>{searchQuery ? "No se encontraron resultados." : "No hay cupones registrados."}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id} className={cn("hover:bg-slate-50/50 transition-colors", !coupon.is_active && "bg-slate-50/30 opacity-70")}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-sm tracking-wide bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-slate-700"
                            onClick={() => handleCopyCode(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{coupon.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block w-fit text-xs border border-emerald-100">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% OFF`
                              : `-${formatCurrency(coupon.discount_value)}`}
                          </span>
                          {coupon.min_purchase_amount && (
                            <span className="text-[10px] text-slate-400 mt-1">
                              Mín: {formatCurrency(coupon.min_purchase_amount)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                          <span className={cn(
                            "font-bold",
                            coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses ? "text-primary" : "text-slate-700"
                          )}>
                            {coupon.current_uses || 0}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">
                            {coupon.max_uses || '∞'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.expiration_date ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className={new Date(coupon.expiration_date) < new Date() ? "text-primary font-medium" : "text-slate-600"}>
                              {format(new Date(coupon.expiration_date), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">Indefinido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => handleToggleStatus(coupon)}
                            className="data-[state=checked]:bg-emerald-500 scale-90"
                          />
                          <Badge variant="outline" className={cn("rounded-md border-0 px-2", status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors"
                            onClick={() => handleOpenModal(coupon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary rounded-lg transition-colors"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-white rounded-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl font-bold text-slate-900">{editingCoupon ? "Editar Cupón" : "Crear Nuevo Cupón"}</DialogTitle>
            <DialogDescription className="text-slate-500">
              Configura los detalles del cupón de descuento.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-700 font-medium">Código *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    placeholder="VERANO2024"
                    {...register("code", { required: "El código es obligatorio" })}
                    className="uppercase font-mono tracking-wider flex-1 bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
                  />
                  <Button type="button" variant="outline" onClick={handleGenerateCode} className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    Generar
                  </Button>
                </div>
                {errors.code && <span className="text-xs text-primary font-medium">{errors.code.message}</span>}
              </div>

              {/* Tipo y Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-medium">Tipo Descuento *</Label>
                  <Select
                    value={watch("discount_type")}
                    onValueChange={(val) => setValue("discount_type", val)}
                  >
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed_amount">Monto Fijo ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-slate-700 font-medium">
                    {discountType === 'percentage' ? 'Porcentaje (%)' : 'Monto (CLP)'} *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 100 : undefined}
                    placeholder={discountType === 'percentage' ? "20" : "5000"}
                    {...register("value", { required: "El valor es obligatorio", min: 1 })}
                    className="bg-white border-slate-200"
                  />
                  {errors.value && <span className="text-xs text-primary font-medium">{errors.value.message}</span>}
                </div>
              </div>

              {/* Mínimos y Máximos */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="min_purchase_amount" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monto Mínimo</Label>
                  <Input
                    id="min_purchase_amount"
                    type="number"
                    min="0"
                    placeholder="10000"
                    {...register("min_purchase_amount")}
                    className="h-9 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tope Descuento</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    min="0"
                    placeholder="50000"
                    {...register("max_discount_amount")}
                    className="h-9 bg-white"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-medium">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Descuento especial de lanzamiento..."
                  {...register("description")}
                  className="bg-white border-slate-200"
                />
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from" className="text-slate-700 font-medium">Válido Desde</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    {...register("valid_from")}
                    className="bg-white border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until" className="text-slate-700 font-medium">Válido Hasta</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    {...register("valid_until")}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

              {/* Límite de usos */}
              <div className="space-y-2">
                <Label htmlFor="max_uses" className="text-slate-700 font-medium">Límite de Usos</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    placeholder="Ej: 100 (Vacío = ilimitado)"
                    {...register("max_uses")}
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

              {/* Planes aplicables */}
              <div className="space-y-2">
                <Label htmlFor="applies_to_products" className="text-slate-700 font-medium">Planes/Productos Aplicables</Label>
                <Input
                  id="applies_to_products"
                  placeholder="Ej: professional, clinic (Separados por coma)"
                  {...register("applies_to_products")}
                  className="bg-white border-slate-200"
                />
                <p className="text-[11px] text-slate-400">
                  Deja vacío para aplicar a todos los productos.
                </p>
              </div>

              {/* Estado activo */}
              <div className="flex items-center justify-between py-3 px-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <Label className="text-emerald-900 font-semibold">Cupón Activo</Label>
                  <p className="text-xs text-emerald-700">Disponible para ser canjeado inmediatamente</p>
                </div>
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </form>
          </div>

          <DialogFooter className="p-6 border-t border-slate-100 bg-slate-50/50 gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl border-slate-200 hover:bg-slate-100 hover:text-slate-900">
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCoupon ? "Guardar Cambios" : "Crear Cupón"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}