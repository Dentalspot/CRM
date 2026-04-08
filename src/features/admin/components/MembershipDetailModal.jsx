import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  User, 
  Activity, 
  HardDrive, 
  ShieldAlert, 
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { adminCancelSubscription, adminChangePlan } from '../api/adminMembershipApi';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const PLANS_INFO = {
  free: { label: 'Gratuito', price: 0, color: 'bg-gray-100 text-gray-800' },
  basic: { label: 'Básico', price: 14990, color: 'bg-blue-100 text-blue-800' },
  professional: { label: 'Profesional', price: 29990, color: 'bg-teal-100 text-teal-800' },
  clinic: { label: 'Clínica', price: 89990, color: 'bg-purple-100 text-purple-800' }
};

const MembershipDetailModal = ({ isOpen, onClose, subscription, onUpdate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    if (subscription) {
      setSelectedPlan(subscription.plan_name);
    }
  }, [subscription]);

  if (!subscription) return null;

  const therapist = subscription.therapist || {};
  const currentPlanInfo = PLANS_INFO[subscription.plan_name] || PLANS_INFO.free;

  const handleCancelSubscription = async () => {
    if (!window.confirm("¿Estás seguro de cancelar esta suscripción?")) return;
    
    setIsProcessing(true);
    try {
      await adminCancelSubscription(subscription.id);
      toast({ title: "Suscripción cancelada exitosamente" });
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cancelar", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePlanChange = async () => {
    if (selectedPlan === subscription.plan_name) {
      setEditMode(false);
      return;
    }

    setIsProcessing(true);
    try {
      const newPrice = PLANS_INFO[selectedPlan]?.price || 0;
      await adminChangePlan(subscription.id, selectedPlan, newPrice);
      toast({ title: "Plan actualizado exitosamente" });
      onUpdate && onUpdate();
      setEditMode(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al cambiar plan", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  };

  // Mock Timeline Data based on subscription creation
  const timeline = [
    { 
      date: subscription.created_at, 
      title: 'Suscripción Creada', 
      desc: `Inicio del plan ${subscription.plan_name}`,
      icon: CheckCircle2,
      color: 'text-green-500'
    },
    {
      date: new Date(new Date(subscription.created_at).getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(), // +30 days
      title: 'Renovación Exitosa',
      desc: 'Pago procesado correctamente',
      icon: CreditCard,
      color: 'text-blue-500'
    }
  ].filter(e => new Date(e.date) <= new Date()); // Only show past events

  if (subscription.status === 'cancelled') {
    timeline.push({
      date: subscription.cancelled_at || new Date().toISOString(),
      title: 'Suscripción Cancelada',
      desc: 'Cancelación solicitada por administrador',
      icon: ShieldAlert,
      color: 'text-red-500'
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <User className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl">{therapist.full_name || 'Usuario Desconocido'}</DialogTitle>
                <DialogDescription>{therapist.email}</DialogDescription>
                <div className="flex gap-2 mt-2">
                  <Badge className={currentPlanInfo.color}>{currentPlanInfo.label}</Badge>
                  <Badge variant={subscription.status === 'active' ? 'outline' : 'destructive'}>
                    {subscription.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">ID Suscripción</p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{subscription.id.slice(0, 8)}...</code>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="usage">Uso y Estadísticas</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Plan Management Section */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900">Detalles del Plan</h3>
                {!editMode && subscription.status === 'active' && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <ArrowRightLeft className="h-3 w-3 mr-2" />
                    Cambiar Plan
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Seleccionar Nuevo Plan</Label>
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Gratuito</SelectItem>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="professional">Profesional</SelectItem>
                          <SelectItem value="clinic">Clínica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ciclo de Facturación</Label>
                      <div className="p-2 border rounded bg-white text-sm text-slate-600 capitalize">
                        {subscription.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleSavePlanChange} disabled={isProcessing}>
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Precio Actual</p>
                    <p className="font-medium">{formatCurrency(subscription.price)} / {subscription.billing_cycle === 'monthly' ? 'mes' : 'año'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Próxima Facturación</p>
                    <p className="font-medium">{format(new Date(subscription.current_period_end), 'dd MMM yyyy', { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Inicio Periodo</p>
                    <p className="font-medium">{format(new Date(subscription.current_period_start), 'dd MMM yyyy', { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Método de Pago</p>
                    <div className="flex items-center gap-1 font-medium">
                      <CreditCard className="h-3 w-3 text-slate-400" />
                      <span>Visa •••• 4242</span> 
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features Checklist based on Plan */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Características Incluidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Agenda de Pacientes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Reportes Clínicos Básicos</span>
                </div>
                {(subscription.plan_name === 'professional' || subscription.plan_name === 'clinic') && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Videollamadas HD ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Generación de informes con IA</span>
                    </div>
                  </>
                )}
                {subscription.plan_name === 'clinic' && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Gestión multi-terapeuta</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Pacientes Activos</span>
                  <span className="text-sm text-slate-500">12 / {subscription.plan_name === 'free' ? '5' : 'Ilimitado'}</span>
                </div>
                <Progress value={subscription.plan_name === 'free' ? (12/5)*100 : 15} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Almacenamiento de Archivos</span>
                  <span className="text-sm text-slate-500">450 MB / 5 GB</span>
                </div>
                <Progress value={(450/5000)*100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Sesiones Realizadas (Mes)</span>
                  <span className="text-sm text-slate-500">24 Sesiones</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <Activity className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <div className="text-xl font-bold">85%</div>
                <div className="text-xs text-slate-500">Tasa de Asistencia</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <HardDrive className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <div className="text-xl font-bold">450MB</div>
                <div className="text-xs text-slate-500">Espacio Usado</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <Calendar className="h-6 w-6 mx-auto text-teal-500 mb-2" />
                <div className="text-xl font-bold">24</div>
                <div className="text-xs text-slate-500">Citas este mes</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
              {timeline.map((event, idx) => (
                <div key={idx} className="ml-6 relative">
                  <div className={`absolute -left-[31px] bg-white border border-slate-200 rounded-full p-1 ${event.color}`}>
                    <event.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                    <p className="text-sm text-slate-600">{event.desc}</p>
                    <span className="text-xs text-slate-400">
                      {format(new Date(event.date), "dd MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold mb-2">Facturas</h4>
              <div className="border rounded-md divide-y">
                <div className="flex items-center justify-between p-3 text-sm hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span>Factura #INV-001</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600">{format(new Date(subscription.created_at), 'dd/MM/yyyy')}</span>
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Pagado</Badge>
                    <span className="font-medium">{formatCurrency(subscription.price)}</span>
                  </div>
                </div>
                {/* Mock second invoice if old enough */}
                {new Date(subscription.created_at) < new Date(Date.now() - 30*24*60*60*1000) && (
                   <div className="flex items-center justify-between p-3 text-sm hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>Factura #INV-002</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600">{format(new Date(Date.now()), 'dd/MM/yyyy')}</span>
                      <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Pagado</Badge>
                      <span className="font-medium">{formatCurrency(subscription.price)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 flex justify-between sm:justify-between w-full">
          <div className="flex gap-2">
            {subscription.status === 'active' && (
              <Button 
                variant="outline" 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                Cancelar Suscripción
              </Button>
            )}
          </div>
          <Button onClick={onClose} variant="secondary">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipDetailModal;