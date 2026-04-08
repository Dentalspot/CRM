export const USER_ROLES = {
  ADMIN: 'admin',
  THERAPIST: 'therapist', // Mantiene 'therapist' en DB para evitar migracion
  PATIENT: 'patient',
  CLINIC: 'clinic',
  LAB: 'lab'
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.THERAPIST]: 'Dentista',
  [USER_ROLES.PATIENT]: 'Paciente',
  [USER_ROLES.CLINIC]: 'Clínica',
  [USER_ROLES.LAB]: 'Laboratorio'
};

export const getPublicRoles = () => [
  {
    value: USER_ROLES.PATIENT,
    label: ROLE_LABELS[USER_ROLES.PATIENT],
    description: 'Busco atención odontológica para mí o un familiar'
  },
  {
    value: USER_ROLES.THERAPIST,
    label: ROLE_LABELS[USER_ROLES.THERAPIST],
    description: 'Soy odontólogo/a y quiero gestionar mis pacientes'
  },
  {
    value: USER_ROLES.CLINIC,
    label: ROLE_LABELS[USER_ROLES.CLINIC],
    description: 'Gestiono un centro médico o clínica dental'
  },
  {
    value: USER_ROLES.LAB,
    label: ROLE_LABELS[USER_ROLES.LAB],
    description: 'Soy laboratorio dental o de radiología'
  }
];
