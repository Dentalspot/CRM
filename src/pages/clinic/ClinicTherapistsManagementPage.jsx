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

// Reuse existing modals + new assistant modal
import InviteTherapistModal from '@/components/clinic/InviteTherapistModal';
import InviteAssistantModal from '@/components/clinic/InviteAssistantModal';
import TherapistManagementModal from '@/components/clinic/TherapistManagementModal';
import logger from '@/lib/utils/logger';

const ClinicTherapistsManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinicInfo, setClinicInfo] = useState(null);
  
  // Data
  const [therapists, setTherapists] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [invitations, setInvitations] = useState([]); // all clinic_invitations rows (filtered by role en render)

  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRole, setActiveRole] = useState('therapist'); // top-level tab: 'therapist' | 'assistant'
  const [activeTab, setActiveTab] = useState('active'); // sub-tab per role: 'active' | 'invitations'

  // Modals state
  const [isInviteTherapistModalOpen, setIsInviteTherapistModalOpen] = useState(false);
  const [isInviteAssistantModalOpen, setIsInviteAssistantModalOpen] = useState(false);
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

      // 1. Get Clinic owned by user (ahora con organization_id post spec 023)
      const { data: myClinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name, organization_id')
        .eq('therapist_id', user.id)
        .limit(1)
        .maybeSingle();

      if (clinicError) throw clinicError;
      setClinicInfo(myClinic);

      if (!myClinic) {
        setLoading(false);
        return;
      }

      // 2. Fetch Active Therapists (flow legacy via clinic_therapists)
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

      // 3. Fetch Active Assistants (spec 023 — via organization_members)
      if (myClinic.organization_id) {
        const { data: omData, error: omError } = await supabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            role,
            is_active,
            joined_at,
            profiles:user_id (
              id,
              full_name,
              email,
              phone
            )
          `)
          .eq('organization_id', myClinic.organization_id)
          .eq('role', 'assistant')
          .eq('is_active', true);

        if (omError) {
          logger.warn('Error fetching assistants (non-fatal):', omError);
          setAssistants([]);
        } else {
          setAssistants(omData || []);
        }
      } else {
        setAssistants([]);
        logger.warn('Clinic sin organization_id — asistentes no se pueden listar. Migración 20260423000002 pendiente?');
      }

      // 4. Fetch invitations (all roles, filter client-side)
      const { data: invData, error: invError } = await supabase
        .from('clinic_invitations')
        .select('id, email, role, status, created_at, expires_at, existing_patient, message')
        .eq('clinic_id', myClinic.id)
        .order('created_at', { ascending: false });

      if (invError) {
        logger.warn('Error fetching invitations (non-fatal):', invError);
        setInvitations([]);
      } else {
        setInvitations(invData || []);
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

  const handleResendInvite = async (_invitation) => {
    toast({ title: "No disponible", description: "Reenvío manual de invitaciones aún no implementado. Cancelá y crear una nueva." });
  };

  const handleCancelInvite = async (invitationId) => {
    setActionLoading(invitationId);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: { action: 'cancel', invite_id: invitationId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'No se pudo cancelar');
      toast({ title: 'Invitación cancelada' });
      fetchClinicData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cancelar', description: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Unified handler — funciona para dentistas (clinic_therapists) y asistentes (organization_members)
  const handleRemove = (row, kind) => {
    // kind: 'therapist' | 'assistant'
    setTherapistToRemove({ ...row, _kind: kind });
    setIsRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!therapistToRemove) return;
    try {
      const kind = therapistToRemove._kind || 'therapist';
      let error;
      if (kind === 'assistant') {
        // Soft delete en organization_members (spec 023 FR-032)
        const { error: errOm } = await supabase
          .from('organization_members')
          .update({ is_active: false, deactivated_at: new Date().toISOString() })
          .eq('id', therapistToRemove.id);
        error = errOm;
      } else {
        // Legacy: clinic_therapists soft delete
        const { error: errCt } = await supabase
          .from('clinic_therapists')
          .update({ is_active: false })
          .eq('id', therapistToRemove.id);
        error = errCt;
      }

      if (error) throw error;
      toast({
        title: kind === 'assistant' ? 'Asistente desvinculado' : 'Dentista desvinculado',
        description: 'El acceso a la clínica ha sido revocado.',
      });
      setIsRemoveDialogOpen(false);
      setTherapistToRemove(null);
      fetchClinicData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // --- Render Helpers ---

  const filterByTerm = (list) => list.filter(row =>
    row.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTherapists = filterByTerm(therapists);
  const filteredAssistants = filterByTerm(assistants);

  // Split invitaciones por role (spec 023)
  const pendingTherapistInvitations = invitations.filter(i =>
    i.status === 'pending' && (i.role === 'therapist' || !i.role)
  );
  const pendingAssistantInvitations = invitations.filter(i =>
    i.status === 'pending' && i.role === 'assistant'
  );

  // Invitación expirada visual helper
  const isInvitationExpired = (inv) =>
    inv.expires_at && new Date(inv.expires_at) < new Date();

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

  // Helper render: una row activa (dentista o asistente) — generaliza avatar + nombre + email + fecha + acciones
  const renderActiveRow = (row, kind) => {
    const profile = row.profiles;
    const avatarUrl = profile?.therapist_branding?.avatar_url;
    return (
      <TableRow key={row.id}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.full_name || 'Sin Nombre'}</div>
              <div className="text-xs text-muted-foreground md:hidden">{profile?.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">{profile?.email}</TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {format(new Date(row.joined_at || row.created_at || new Date()), "d MMM yyyy", { locale: es })}
        </TableCell>
        <TableCell>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">Activo</Badge>
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
              {/* Ver/Editar disponible solo para dentistas (legacy TherapistManagementModal). Asistente queda sin editor en MVP. */}
              {kind === 'therapist' && (
                <>
                  <DropdownMenuItem onClick={() => {
                    setSelectedTherapist(row);
                    setIsEditModalOpen(true);
                  }}>
                    Ver Detalles / Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => handleRemove(row, kind)}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Desvincular
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // Helper render: sub-tabs (Activos / Invitaciones) — reutilizado por cada top-level tab
  const renderRoleSection = ({
    kind,
    activeItems,
    pendingItems,
    emptyActiveText,
    emptyPendingText,
    onInviteClick,
    emptyRoleLabel,
  }) => (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="active">
                Activos
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-700">{activeItems.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitaciones
                {pendingItems.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-700">{pendingItems.length}</Badge>
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
                    <TableHead className="hidden md:table-cell">Contacto</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {emptyActiveText}
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeItems.map((row) => renderActiveRow(row, kind))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="mt-0">
            <div className="grid gap-4">
              {pendingItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Mail className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">{emptyPendingText}</p>
                  <Button variant="link" onClick={onInviteClick} className="mt-2">
                    Enviar una nueva invitación {emptyRoleLabel}
                  </Button>
                </div>
              ) : (
                pendingItems.map((inv) => {
                  const expired = isInvitationExpired(inv);
                  return (
                    <div key={inv.id} className={`flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-white shadow-sm gap-4 ${expired ? 'opacity-60 border-red-200' : ''}`}>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${expired ? 'bg-red-50' : 'bg-yellow-50'}`}>
                          <Clock className={`h-5 w-5 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{inv.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Enviada el {format(new Date(inv.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                            {inv.expires_at && (
                              <> · {expired ? 'Expirada' : `Expira ${format(new Date(inv.expires_at), "d MMM yyyy", { locale: es })}`}</>
                            )}
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );

  const handleInviteClick = () => {
    if (activeRole === 'assistant') {
      setIsInviteAssistantModalOpen(true);
    } else {
      setIsInviteTherapistModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Personal</h1>
          <p className="text-muted-foreground mt-1">
            Administra dentistas y asistentes de <strong>{clinicInfo.name}</strong> y sus accesos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClinicData} title="Refrescar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleInviteClick} className="bg-primary">
            <Mail className="h-4 w-4 mr-2" />
            {activeRole === 'assistant' ? 'Invitar Asistente' : 'Invitar Dentista'}
          </Button>
        </div>
      </div>

      {/* Top-level tabs: Dentistas / Asistentes (spec 023) */}
      <Tabs
        value={activeRole}
        onValueChange={(v) => {
          setActiveRole(v);
          setActiveTab('active');   // reset sub-tab al cambiar role
          setSearchTerm('');        // reset búsqueda (el state es compartido)
        }}
      >
        <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
          <TabsTrigger value="therapist" className="gap-2">
            <Users className="h-4 w-4" /> Dentistas
            <Badge variant="secondary" className="ml-1">{therapists.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-2">
            <Shield className="h-4 w-4" /> Asistentes
            <Badge variant="secondary" className="ml-1">{assistants.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="therapist" className="mt-4">
          {renderRoleSection({
            kind: 'therapist',
            activeItems: filteredTherapists,
            pendingItems: pendingTherapistInvitations,
            emptyActiveText: 'No se encontraron dentistas activos.',
            emptyPendingText: 'No hay invitaciones de dentistas pendientes.',
            onInviteClick: () => setIsInviteTherapistModalOpen(true),
            emptyRoleLabel: 'de dentista',
          })}
        </TabsContent>

        <TabsContent value="assistant" className="mt-4">
          {renderRoleSection({
            kind: 'assistant',
            activeItems: filteredAssistants,
            pendingItems: pendingAssistantInvitations,
            emptyActiveText: 'No hay asistentes activos. Invitá al primero desde el botón arriba.',
            emptyPendingText: 'No hay invitaciones de asistente pendientes.',
            onInviteClick: () => setIsInviteAssistantModalOpen(true),
            emptyRoleLabel: 'de asistente',
          })}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <InviteTherapistModal
        isOpen={isInviteTherapistModalOpen}
        onClose={() => setIsInviteTherapistModalOpen(false)}
        clinicId={clinicInfo.id}
        onSuccess={() => {
          fetchClinicData();
          setActiveRole('therapist');
          setActiveTab('invitations');
        }}
      />

      <InviteAssistantModal
        isOpen={isInviteAssistantModalOpen}
        onClose={() => setIsInviteAssistantModalOpen(false)}
        clinicId={clinicInfo.id}
        onSuccess={() => {
          fetchClinicData();
          setActiveRole('assistant');
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
            <AlertDialogTitle>
              ¿Desvincular {therapistToRemove?._kind === 'assistant' ? 'asistente' : 'dentista'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revocará el acceso de <strong>{therapistToRemove?.profiles?.full_name}</strong> a la información de la clínica.
              {therapistToRemove?._kind === 'assistant' ? (
                <> El usuario mantendrá su cuenta en DentalSpot pero perderá acceso a la agenda y pacientes de esta clínica.</>
              ) : (
                <> El historial de citas se mantendrá, pero no podrá gestionar nuevos pacientes.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-red-600 hover:bg-red-700">
              Confirmar Desvinculación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClinicTherapistsManagementPage;