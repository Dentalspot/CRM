import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Trash2, FileText, Mail, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { USER_ROLES } from '@/constants/roles';

import DeleteAccountModal from './DeleteAccountModal';
import MyDataCard from './MyDataCard';
import DataAccessLogCard from './DataAccessLogCard';
import NotificationPreferencesCard from './NotificationPreferencesCard';

/**
 * Sección "Privacidad y datos" del perfil.
 * - Pacientes: pueden eliminar su cuenta
 * - Otros roles: ven instrucciones para solicitar eliminación manual
 */
const PrivacySection = () => {
  const { user, profile } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const role = profile?.role || user?.role;
  const isPatient = role === USER_ROLES.PATIENT;

  return (
    <>
      <div className="space-y-4">
        {/* Documentos legales */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Documentos legales</CardTitle>
                <CardDescription>
                  Revisa los términos que aceptaste al usar DentalSpot.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/legal/terminos-condiciones" target="_blank" rel="noopener noreferrer">
                Términos y Condiciones
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/legal/politica-privacidad" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tus derechos */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Tus derechos sobre tus datos</CardTitle>
                <CardDescription>
                  Conforme a la Ley 21.719 sobre protección de datos personales en Chile.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li>✓ Acceder a los datos que tenemos sobre ti</li>
              <li>✓ Rectificar información incorrecta</li>
              <li>✓ Solicitar la eliminación de tus datos personales</li>
              <li>✓ Oponerte a tratamientos específicos</li>
              <li>✓ Recibir tus datos en formato portable</li>
            </ul>
            <div className="mt-3 p-3 bg-muted/40 rounded-md flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Para ejercer cualquier derecho, escribe a{' '}
                <a href="mailto:dentalspot.cl@gmail.com" className="text-primary underline">
                  dentalspot.cl@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Descargar mis datos (todos los roles) */}
        <MyDataCard />

        {/* Quien accedio a mis datos (solo paciente) */}
        {isPatient && <DataAccessLogCard />}

        {/* Preferencias de comunicacion */}
        <NotificationPreferencesCard />

        {/* Eliminar cuenta */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2 mt-0.5">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base text-red-900">Eliminar mi cuenta</CardTitle>
                <CardDescription>
                  Tus datos personales serán anonimizados de forma irreversible.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPatient ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Eliminar tu cuenta es inmediato. Tus datos personales (nombre, email, teléfono,
                  RUT, foto) serán removidos. Por obligación legal, los registros clínicos y
                  financieros se conservan anonimizados por 5 años.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar mi cuenta
                </Button>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">Eliminación manual</p>
                  <p className="text-amber-800">
                    La auto-eliminación no está disponible para tu rol porque otras cuentas
                    (pacientes, equipo) dependen de tu información profesional. Para
                    procesar tu solicitud, escribe a{' '}
                    <a href="mailto:dentalspot.cl@gmail.com" className="underline">
                      dentalspot.cl@gmail.com
                    </a>{' '}
                    indicando tu RUT.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      />
    </>
  );
};

export default PrivacySection;
