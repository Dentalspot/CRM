/**
 * @file src/components/clinic/profile/ResponsibleCard.jsx
 *
 * Card presentacional para "Datos del responsable legal" dentro del tab
 * "Datos de la Clínica" (reemplaza el antiguo tab "Sobre Mí" para users
 * clinic).
 *
 * Compliance Ley 20.584 art. 5 (Chile): todo establecimiento de salud debe
 * identificar al responsable del mismo. Este card captura los 5 datos
 * mínimos del responsable (Nombre, RUT, Cargo, Teléfono, Correo).
 *
 * Props-only component. El estado + submit vive en el padre
 * (ClinicInfoSection) para permitir save atómico clínica + responsable.
 *
 * - Correo: read-only porque es el login email (auth.users.email). Cambiarlo
 *   rompe Supabase Auth. Label explica al usuario.
 * - RUT: validación client-side via utils/rutUtils.js (dígito verificador).
 *   Error inline si inválido.
 * - Cargo: dropdown con 4 opciones legalmente relevantes en Chile.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, FileText, Phone, Mail, UserCheck, Info, AlertCircle } from 'lucide-react';
import { formatRut } from '@/utils/rutUtils';

export const RESPONSIBLE_ROLES = [
  { value: 'owner', label: 'Dueño/a' },
  { value: 'technical_director', label: 'Director/a técnico/a' },
  { value: 'administrator', label: 'Administrador/a' },
  { value: 'other', label: 'Otro' },
];

/**
 * @param {object} props
 * @param {object} props.form - { full_name, rut, responsible_role, phone_responsable }
 * @param {string} props.userEmail - read-only login email
 * @param {string} [props.rutError] - error message for RUT field (if invalid)
 * @param {(field: string, value: string) => void} props.onChange
 */
const ResponsibleCard = ({ form, userEmail, rutError, onChange }) => {
  return (
    <section className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-8">
      <header>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Responsable legal
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Persona legalmente a cargo del establecimiento. Ley 20.584 art. 5
          exige identificar al responsable del mismo.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre completo */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-primary">Nombre completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={form.full_name || ''}
              onChange={(e) => onChange('full_name', e.target.value)}
              placeholder="Nombre y apellido del responsable"
              className="pl-9"
              required
            />
          </div>
        </div>

        {/* RUT */}
        <div className="space-y-2">
          <Label className="text-primary">RUT *</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={form.rut || ''}
              onChange={(e) => onChange('rut', formatRut(e.target.value))}
              placeholder="12.345.678-9"
              maxLength={12}
              className={`pl-9 font-mono ${rutError ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
            />
          </div>
          {rutError && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {rutError}
            </p>
          )}
        </div>

        {/* Cargo */}
        <div className="space-y-2">
          <Label className="text-primary">Cargo *</Label>
          <Select
            value={form.responsible_role || ''}
            onValueChange={(v) => onChange('responsible_role', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu cargo" />
            </SelectTrigger>
            <SelectContent>
              {RESPONSIBLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label className="text-primary">Teléfono</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={form.phone_responsable || ''}
              onChange={(e) => onChange('phone_responsable', e.target.value)}
              placeholder="+56 9 1234 5678"
              className="pl-9"
            />
          </div>
        </div>

        {/* Correo (read-only) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Correo de acceso</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={userEmail || ''}
              disabled
              readOnly
              className="pl-9 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            Este es el correo con el que inicias sesión. Para cambiarlo, contacta a soporte.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          <strong>Nota legal:</strong> Al completar estos datos declaras ser la persona responsable del establecimiento ante la autoridad sanitaria (Ley 20.584 art. 5). Tus datos personales se tratan según nuestra política de privacidad (Ley 21.719).
        </p>
      </div>
    </section>
  );
};

export default ResponsibleCard;
