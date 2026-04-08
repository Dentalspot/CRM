import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTherapistPatients, updatePatient, archivePatient, associatePatient } from '@/lib/patientApi';
import { useToast } from '@/components/ui/use-toast';
import useDebounce from '@/hooks/useDebounce';
import logger from '@/lib/utils/logger';

export const usePatients = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchPatients = useCallback(async () => {
    if (!user || user.role !== 'therapist') {
      setPatients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getTherapistPatients(user.id, debouncedSearchTerm);
      setPatients(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: "Error al cargar pacientes",
        description: "No se pudieron obtener los datos de los pacientes. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleUpsertPatient = async (patientData) => {
    if (!user || user.role !== 'therapist') {
      toast({
        title: "Acceso denegado",
        description: "Solo los terapeutas pueden gestionar pacientes.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      if (patientData.id) {
        // Use updatePatient instead of upsertPatient
        const savedPatient = await updatePatient(patientData.id, patientData);
        toast({
          title: "Éxito",
          description: `Paciente actualizado correctamente.`,
        });
      } else {
        if (!patientData.email) {
            throw new Error("El email es requerido para asociar un nuevo paciente.");
        }
        await associatePatient(user.id, patientData.email);
        toast({
          title: "Éxito",
          description: `Paciente asociado correctamente.`,
        });
      }

      await fetchPatients();
      return true;

    } catch (err) {
      logger.error("Error en handleUpsertPatient:", err);
      toast({
        title: "Error",
        description: err.message || `No se pudo ${patientData.id ? 'actualizar' : 'asociar'} el paciente.`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!user || user.role !== 'therapist') {
      toast({
        title: "Acceso denegado",
        description: "Solo los terapeutas pueden archivar pacientes.",
        variant: "destructive",
      });
      return;
    }
    try {
      await archivePatient(patientId);
      fetchPatients(); 
      toast({
        title: "Paciente Archivado",
        description: "El paciente ha sido archivado.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo archivar el paciente.",
        variant: "destructive",
      });
    }
  };

  return {
    patients,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    handleUpsertPatient,
    handleDeletePatient,
    refreshPatients: fetchPatients,
  };
};