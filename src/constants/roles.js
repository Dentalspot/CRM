export const USER_ROLES = {
  ADMIN: 'admin',
  THERAPIST: 'therapist', // Mantiene 'therapist' en DB para evitar migracion
  PATIENT: 'patient',
  CLINIC: 'clinic',
  LAB: 'lab',
  ASSISTANT: 'assistant' // Rol operativo determinado por organization_members, no por profiles.role
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.THERAPIST]: 'Dentista',
  [USER_ROLES.PATIENT]: 'Paciente',
  [USER_ROLES.CLINIC]: 'Clínica',
  [USER_ROLES.LAB]: 'Laboratorio',
  [USER_ROLES.ASSISTANT]: 'Asistente'
};

// Roles visibles en el selector público.
// ADMIN y LAB quedan fuera del selector (ADMIN se asigna internamente,
// LAB diferido — ver docs/product/feature-backlog.md).
//
// ASSISTANT solo aparece en LOGIN. No se expone en REGISTER porque el
// asistente no puede auto-registrarse: debe ser invitado por la clínica
// vía organization_members (rol real se deriva desde ahí, ver RoleLandingRedirect).
//
// @param {'login'|'register'} context
export const getPublicRoles = (context = 'login') => {
  const all = [
    {
      value: USER_ROLES.PATIENT,
      label: ROLE_LABELS[USER_ROLES.PATIENT],
      description: 'Busco atención dental para mí o un familiar',
      icon: '👤',
    },
    {
      value: USER_ROLES.THERAPIST,
      label: ROLE_LABELS[USER_ROLES.THERAPIST],
      description: 'Soy dentista y quiero gestionar mis pacientes',
      icon: '🦷',
    },
    {
      value: USER_ROLES.CLINIC,
      label: ROLE_LABELS[USER_ROLES.CLINIC],
      description: 'Administro un centro o clínica dental',
      icon: '🏥',
    },
    {
      value: USER_ROLES.ASSISTANT,
      label: ROLE_LABELS[USER_ROLES.ASSISTANT],
      description: 'Colaboro en la coordinación de una clínica',
      icon: '🧑‍💼',
    }
  ];
  return context === 'register'
    ? all.filter((r) => r.value !== USER_ROLES.ASSISTANT)
    : all;
};
