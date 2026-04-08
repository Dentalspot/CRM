import { format, differenceInYears, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
// import CryptoJS from 'crypto-js'; // Imported dynamically or used if environment permits

/**
 * Calculates age from birthdate
 * @param {string|Date} birthdate 
 * @returns {number|string}
 */
export const calculateAge = (birthdate) => {
  if (!birthdate) return 'N/A';
  try {
    const date = typeof birthdate === 'string' ? parseISO(birthdate) : birthdate;
    return differenceInYears(new Date(), date);
  } catch (e) {
    return 'Error';
  }
};

/**
 * Formats a RUT/Run for display
 * @param {string} rut 
 * @returns {string}
 */
export const formatRut = (rut) => {
  if (!rut) return '';
  // Basic formatter, assumes clean input or cleans it
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

/**
 * Checks compliance status based on patient data fields
 * @param {object} patient 
 * @returns {object} { status: 'compliant'|'warning'|'non-compliant', issues: [] }
 */
export const checkComplianceStatus = (patient) => {
  const issues = [];
  
  if (!patient?.profile?.email) issues.push('Falta correo electrónico (Requerido por Ley)');
  if (!patient?.consent_signed) issues.push('Consentimiento informado no firmado');
  if (!patient?.privacy_policy_accepted) issues.push('Política de privacidad no aceptada');
  
  // Example for Chile Data Law (Law 19.628)
  if (!patient?.rut && !patient?.profile?.rut) issues.push('Falta RUT/ID nacional');

  let status = 'compliant';
  if (issues.length > 0) status = 'warning';
  if (issues.length > 2) status = 'non-compliant';

  return { status, issues };
};

/**
 * Simple encryption helper for sensitive local data before sending or storing 
 * (Note: Use Supabase encryption functions for DB storage preferred)
 */
export const encryptSensitiveData = (data, key) => {
  // Placeholder for crypto-js logic if needed client-side
  // return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  return JSON.stringify(data); // Passthrough if no key provided
};

export const getComplianceColor = (status) => {
  switch (status) {
    case 'compliant': return 'text-green-600 bg-green-100 border-green-200';
    case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'non-compliant': return 'text-red-600 bg-red-100 border-red-200';
    default: return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const PATIENT_STATUS_LABELS = {
  active: 'Activo',
  archived: 'Archivado',
  inactive: 'Inactivo',
  pending: 'Pendiente',
  discharged: 'Alta'
};