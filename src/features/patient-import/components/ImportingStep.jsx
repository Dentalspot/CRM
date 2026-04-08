import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Users, AlertCircle, Loader2 } from 'lucide-react';

const ImportingStep = ({ importing, progress, results, onReset }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {importing ? 'Importando pacientes...' : 'Importación completada'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importing && (
          <>
            <Progress value={progress} className="h-3" />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress}% — Procesando pacientes...
            </div>
          </>
        )}

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-700">{results.created}</p>
                <p className="text-xs text-green-600">Creados</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                <p className="text-2xl font-bold text-gray-600">{results.skipped}</p>
                <p className="text-xs text-gray-500">Ya existían</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <AlertCircle className="h-6 w-6 mx-auto text-red-400 mb-1" />
                <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
                <p className="text-xs text-red-500">Errores</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-red-700 mb-1">Errores:</p>
                {results.errors.slice(0, 20).map((e, i) => (
                  <p key={i} className="text-xs text-red-600">Fila {e.row} ({e.name}): {e.error}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onReset}>Importar otro archivo</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => navigate('/dashboard/therapist')}>
                Ir al dashboard
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportingStep;