import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, Search, User, Loader2 } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const ClinicalFileManagementPage = () => {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      let query = supabase
        .from('patients')
        .select('id, profile_id, profiles:profile_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (search.trim()) {
        query = query.or(`profiles.full_name.ilike.%${search}%,profiles.email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Error fetching patients:', error);
        setPatients([]);
      } else {
        setPatients((data || []).filter(p => p.profiles?.full_name));
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Fichas Clínicas</h1>
        <p className="text-muted-foreground">Administración centralizada de expedientes clínicos.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar paciente por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : patients.length > 0 ? (
        <div className="grid gap-2">
          {patients.map(patient => (
            <Link
              key={patient.id}
              to={`/admin/patients/${patient.id}/clinical-file`}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center">
                <User className="h-4 w-4 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{patient.profiles?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{patient.profiles?.email}</p>
              </div>
              <FileText className="h-4 w-4 text-gray-400" />
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">
              {search ? 'Sin resultados' : 'Busca un paciente'}
            </h3>
            <p className="text-slate-500 max-w-md">
              {search ? 'No se encontraron pacientes con ese criterio.' : 'Escribe el nombre o email del paciente para ver su ficha clínica.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClinicalFileManagementPage;
