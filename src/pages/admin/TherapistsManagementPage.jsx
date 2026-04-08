import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MoreHorizontal, ShieldAlert, CheckCircle } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import logger from '@/lib/utils/logger';
import { Badge } from '@/components/ui/badge';

const TherapistsManagementPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTherapists = async () => {
    setLoading(true);
    try {
      // Corrected Query: Joining profiles with therapist_branding for avatars
      // and therapist_details for professional info
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          therapist_branding (
            avatar_url
          ),
          therapist_details!therapist_details_user_id_fkey (
            professional_title,
            registration_supersalud,
            city_id,
            is_public
          )
        `)
        .eq('role', 'therapist')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTherapists(data || []);
    } catch (err) {
      logger.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const filteredTherapists = therapists.filter(t => 
    t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
<div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button>Exportar CSV</Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-lg shadow border dark:border-slate-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terapeuta</TableHead>
                  <TableHead>Email / Rut</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Unión</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Cargando terapeutas...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTherapists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No se encontraron terapeutas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTherapists.map((therapist) => {
                    // Extract avatar safely from joined table array or object
                    const branding = Array.isArray(therapist.therapist_branding) 
                      ? therapist.therapist_branding[0] 
                      : therapist.therapist_branding;
                    
                    const details = Array.isArray(therapist.therapist_details)
                      ? therapist.therapist_details[0]
                      : therapist.therapist_details;

                    return (
                      <TableRow key={therapist.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProfileAvatar 
                              src={branding?.avatar_url} 
                              alt={therapist.full_name} 
                            />
                            <div>
                              <p className="font-medium">{therapist.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {details?.professional_title || 'Sin título'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{therapist.email}</p>
                            <p className="text-xs text-muted-foreground">{therapist.rut || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {details?.registration_supersalud ? (
                            <Badge variant="outline" className="text-xs">
                              {details.registration_supersalud}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pendiente</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {details?.is_public ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                              <CheckCircle className="w-3 h-3 mr-1" /> Público
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Oculto</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(therapist.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
    </div>
  );
};

export default TherapistsManagementPage;