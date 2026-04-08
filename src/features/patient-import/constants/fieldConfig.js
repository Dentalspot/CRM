export const DentalSpot_FIELDS = [
  { key: 'skip', label: '⊘ No importar', required: false },
  { key: 'full_name', label: 'Nombre completo', required: true },
  { key: 'rut', label: 'RUT', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Teléfono', required: false },
  { key: 'diagnosis', label: 'Diagnóstico', required: false },
  { key: 'allergies', label: 'Alergias', required: false },
  { key: 'medical_history', label: 'Historial médico', required: false },
  { key: 'notes', label: 'Notas', required: false },
  { key: 'patient_type', label: 'Tipo paciente (adulto/infantil)', required: false },
  { key: 'responsible_name', label: 'Nombre responsable/apoderado', required: false },
  { key: 'responsible_rut', label: 'RUT responsable', required: false },
  { key: 'birth_city', label: 'Ciudad de nacimiento', required: false },
  { key: 'nationality', label: 'Nacionalidad', required: false },
  { key: 'attention_type', label: 'Tipo de atención', required: false },
  { key: 'communication_channel', label: 'Canal comunicación', required: false },
];

export const AUTO_MAP = {
  'nombre': 'full_name', 'name': 'full_name', 'nombre completo': 'full_name', 'full_name': 'full_name', 'paciente': 'full_name', 'patient': 'full_name', 'nombre paciente': 'full_name', 'nombre del paciente': 'full_name',
  'rut': 'rut', 'run': 'rut', 'dni': 'rut', 'cedula': 'rut', 'cédula': 'rut', 'documento': 'rut',
  'email': 'email', 'correo': 'email', 'correo electrónico': 'email', 'correo electronico': 'email', 'mail': 'email', 'e-mail': 'email',
  'telefono': 'phone', 'teléfono': 'phone', 'phone': 'phone', 'celular': 'phone', 'móvil': 'phone', 'movil': 'phone', 'fono': 'phone', 'tel': 'phone',
  'diagnostico': 'diagnosis', 'diagnóstico': 'diagnosis', 'diagnosis': 'diagnosis', 'dx': 'diagnosis',
  'alergias': 'allergies', 'allergies': 'allergies', 'alergia': 'allergies',
  'historial': 'medical_history', 'antecedentes': 'medical_history', 'medical_history': 'medical_history', 'antecedentes médicos': 'medical_history',
  'notas': 'notes', 'nota': 'notes', 'observaciones': 'notes', 'notes': 'notes', 'comentarios': 'notes',
  'tipo': 'patient_type', 'tipo paciente': 'patient_type',
  'apoderado': 'responsible_name', 'responsable': 'responsible_name', 'tutor': 'responsible_name',
  'rut apoderado': 'responsible_rut', 'rut responsable': 'responsible_rut',
  'ciudad nacimiento': 'birth_city',
  'nacionalidad': 'nationality',
  'atencion': 'attention_type', 'atención': 'attention_type', 'modalidad': 'attention_type',
  'canal': 'communication_channel',
};

export const SOURCE_HINTS = {
  Doctoralia: '→ En Doctoralia, ve a Pacientes → Exportar → descarga el CSV con los datos de tus pacientes.',
  AgendaPro: '→ En AgendaPro, ve a Clientes → descargar la planilla Excel con tu base de datos.',
  Medilink: '→ En Medilink, solicita el respaldo de tu base de pacientes en formato Excel o CSV.',
  'Excel propio': '→ Asegúrate de que tu archivo tenga al menos una columna con el nombre del paciente.',
  Otro: '→ Cualquier archivo CSV o Excel con datos de pacientes funciona. Lo mapearemos automáticamente.',
};

export const TEMPLATE_CSV = 'nombre,rut,email,telefono,diagnostico,alergias,notas,tipo paciente,apoderado,rut apoderado\nJuan Pérez,12345678-9,juan@email.com,+56912345678,TEL,Ninguna,Paciente de ejemplo,infantil,María Pérez,98765432-1\n';