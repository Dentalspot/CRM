import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  UserMinus, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Ban,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Reuse existing modals
import InviteTherapistModal from '@/components/clinic/InviteTherapistModal';
import TherapistManagementModal from '@/components/clinic/TherapistManagementModal';
import logger from '@/lib/utils/logger';

const ClinicTherapistsManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinicInfo, setClinicInfo] = useState(null);
  
  // Data
  const [therapists, setTherapists] = useState([]);
  const [invitations, setInvitations] = useState([]);
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  
  // Actions state
  const [actionLoading, setActionLoading] = useState(null);
  const [therapistToRemove, setTherapistToRemove] = useState(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  const fetchClinicData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      // 1. Get Clinic owned by user
      const { data: myClinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('therapist_id', user.id)
        .limit(1)
        .maybeSingle();

      if (clinicError) throw clinicError;
      setClinicInfo(myClinic);

      if (myClinic) {
        // 2. Fetch Active Therapists
        const { data: ctData, error: ctError } = await supabase
          .from('clinic_therapists')
          .select(`
            id,
            therapist_id,
            is_active,
            joined_at,
            profiles:therapist_id (
              id,
              full_name,
              email,
              phone,
              therapist_branding (avatar_url)
            )
          `)
          .eq('clinic_id', myClinic.id)
          .eq('is_active', true);

        if (ctError) throw ctError;
        setTherapists(ctData || []);

        // 3. Invitations - Edge Function doesn't exist, skip silently
        // TODO: implement invitation tracking table if needed
        setInvitations([]);
      }
    } catch (error) {
      logger.error("Error loading management data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de la clínica."
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  // --- Handlers ---

  const handleResendInvite = async (invitation) => {
    toast({ title: "No disponible", description: "Usa el botón 'Invitar Terapeuta' para agregar profesionales por email." });
  };

  const handleCancelInvite = async (invitationId) => {
    toast({ title: "No disponible", description: "Las invitaciones pendientes se gestionan desde el listado de terapeutas activos." });
  };

  const handleRemoveTherapist = (therapist) => {
    setTherapistToRemove(therapist);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveTherapist = async () => {
    if (!therapistToRemove) return;
    try {
        const { error } = await supabase
            .from('clinic_therapists')
            .update({ is_active: false })
            .eq('id', therapistToRemove.id);
            
        if (error) throw error;
        toast({ title: "Terapeuta desvinculado", description: "El acceso a la clínica ha sido revocado." });
        setIsRemoveDialogOpen(false);
        setTherapistToRemove(null);
        fetchClinicData();
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  // --- Render Helpers ---

  const filteredTherapists = therapists.filter(t => 
    t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(i => i.status === 'pending');

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinicInfo) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">No se encontró una clínica asociada</h2>
        <p className="text-gray-500 mt-2">Debes crear una clínica antes de gestionar terapeutas.</p>
        <Button className="mt-4" onClick={() => window.location.href = '/dashboard/clinic'}>
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Equipo</h1>
          <p className="text-muted-foreground mt-1">
            Administra los terapeutas de <strong>{clinicInfo.name}</strong> y sus accesos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClinicData} title="Refrescar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)} className="bg-primary">
            <Mail className="h-4 w-4 mr-2" />
            Invitar Terapeuta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <TabsList className="w-full md:w-auto">
                <TabsTrigger value="active">
                  Activos
                  <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700">{therapists.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="invitations">
                  Invitaciones
                  {pendingInvitations.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">{pendingInvitations.length}</Badge>
                  )}
                </TabsTrigger>
            </TabsList>
            
            {activeTab === 'active' && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="active" className="mt-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTherapists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No se encontraron terapeutas activos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTherapists.map((ct) => (
                      <TableRow key={ct.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                              {ct.profiles?.therapist_branding?.avatar_url ? (
                                <img src={ct.profiles.therapist_branding.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Users className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{ct.profiles?.full_name || 'Sin Nombre'}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{ct.profiles?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{ct.profiles?.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(ct.joined_at || ct.created_at || new Date()), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                            Activo
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setSelectedTherapist(ct);
                                setIsEditModalOpen(true);
                              }}>
                                Ver Detalles / Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleRemoveTherapist(ct)}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Desvincular
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="mt-0">
            <div className="grid gap-4">
              {pendingInvitations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Mail className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No hay invitaciones pendientes.</p>
                  <Button variant="link" onClick={() => setIsInviteModalOpen(true)} className="mt-2">
                    Enviar una nueva invitación
                  </Button>
                </div>
              ) : (
                pendingInvitations.map((inv) => (
                  <div key={inv.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviada el {format(new Date(inv.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelInvite(inv.id)}
                        disabled={actionLoading === inv.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        {actionLoading === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                        Cancelar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleResendInvite(inv)}
                        disabled={actionLoading === inv.id}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reenviar
                      </Button>
                    </div>
                  </div>
                ))
              )}
              
              {/* History of processed invitations could go here if needed */}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
      </Tabs>

      {/* Modals */}
      <InviteTherapistModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        clinicId={clinicInfo.id}
        onSuccess={() => {
          fetchClinicData();
          setActiveTab('invitations');
        }}
      />

      <TherapistManagementModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clinicId={clinicInfo.id}
        therapistToEdit={selectedTherapist}
        onSuccess={fetchClinicData}
      />

      {/* Remove Confirmation */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular terapeuta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revocará el acceso de <strong>{therapistToRemove?.profiles?.full_name}</strong> a la información de la clínica.
              El historial de citas se mantendrá, pero no podrá gestionar nuevos pacientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveTherapist} className="bg-red-600 hover:bg-red-700">
              Confirmar Desvinculación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClinicTherapistsManagementPage;