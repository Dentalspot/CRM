import React, { useState } from 'react';
import { searchSimilarClinics, requestJoinClinic, formatRutEmpresa } from '@/services/clinicDetectionService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, AlertTriangle, Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ClinicSearchStep = ({ onCreateNew, onJoinExisting, initialRut = '', initialName = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rut, setRut] = useState(initialRut);
  const [name, setName] = useState(initialName);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  const handleSearch = async () => {
    if (!rut && !name) return;
    setSearching(true);
    const data = await searchSimilarClinics({ rutEmpresa: rut, name });
    setResults(data);
    setSearching(false);
  };

  const handleJoin = async (clinicId) => {
    setJoiningId(clinicId);
    try {
      const result = await requestJoinClinic(clinicId, user.id);
      if (result.success) {
        toast({ title: '✅ ' + result.message });
        onJoinExisting(clinicId);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setJoiningId(null);
    }
  };

  // — Exact RUT match —
  if (results && results.exactRutMatch?.length > 0) {
    const clinic = results.exactRutMatch[0];
    return (
      <Card className="border-2 border-teal-400">
        <CardContent className="p-6 space-y-4">
          <Badge className="bg-teal-100 text-teal-800 border border-teal-300">
            ✓ Clínica verificada en DentalSpot
          </Badge>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900">{clinic.name}</h3>
            {clinic.address && <p className="text-sm text-gray-500">{clinic.address}</p>}
            {clinic.owner_name && <p className="text-sm text-gray-500">Admin: {clinic.owner_name}</p>}
            <p className="text-sm text-gray-500">
              {clinic.therapist_count} terapeuta{clinic.therapist_count !== 1 ? 's' : ''} activos
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleJoin(clinic.id)}
              disabled={!!joiningId}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {joiningId === clinic.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Solicitar unirme
            </Button>
            <Button
              variant="outline"
              onClick={() => { setResults(null); onCreateNew({ rutEmpresa: rut, name }); }}
            >
              No es mi clínica, crear nueva
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // — Fuzzy name matches —
  if (results && results.nameMatches?.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-700 font-medium">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>⚠️ Encontramos clínicas con nombres similares:</span>
        </div>
        <div className="space-y-3">
          {results.nameMatches.map(clinic => (
            <Card key={clinic.id} className="border-amber-300">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{clinic.name}</p>
                  {clinic.address && <p className="text-xs text-gray-500 truncate">{clinic.address}</p>}
                  <p className="text-xs text-gray-500">{clinic.therapist_count} terapeutas activos</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleJoin(clinic.id)}
                  disabled={!!joiningId}
                  className="border-amber-400 text-amber-700 hover:bg-amber-50 shrink-0"
                >
                  {joiningId === clinic.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                  Es esta →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={() => onCreateNew({ rutEmpresa: rut, name })}>
          Ninguna es mi clínica → Crear nueva
        </Button>
      </div>
    );
  }

  // — No match —
  if (results && !results.hasMatch) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          No encontramos esta clínica en DentalSpot. Puedes crearla como nueva.
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onCreateNew({ rutEmpresa: rut, name })} className="flex-1">
            Crear clínica nueva
          </Button>
          <Button variant="outline" onClick={() => setResults(null)}>
            Buscar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  // — Search form —
  return (
    <Card className="border-gray-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">¿Ya existe esta clínica en DentalSpot?</h3>
        </div>
        <p className="text-sm text-gray-500">
          Busca primero para evitar duplicados. Si ya existe, puedes unirte directamente.
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>RUT Empresa</Label>
            <Input
              placeholder="76.123.456-7"
              value={rut}
              onChange={(e) => setRut(formatRutEmpresa(e.target.value))}
              maxLength={12}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label>Nombre del lugar</Label>
            <Input
              placeholder="Ej: Centro de Terapia Integral"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSearch}
            disabled={searching || (!rut && !name)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {searching
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Search className="mr-2 h-4 w-4" />
            }
            Buscar
          </Button>
          <Button variant="outline" onClick={() => onCreateNew({ rutEmpresa: rut, name })}>
            Crear directamente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClinicSearchStep;
