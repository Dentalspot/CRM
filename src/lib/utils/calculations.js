import { differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from 'date-fns';

/**
 * Calculate age from birthdate
 * @param {string|Date} birthdate 
 * @returns {number|null} Age in years
 */
export const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate age in months
 * @param {string|Date} birthdate 
 * @returns {number|null} Age in months
 */
export const calculateAgeInMonths = (birthdate) => {
  if (!birthdate) return null;
  return differenceInMonths(new Date(), new Date(birthdate));
};

/**
 * Calculate days remaining until a target date
 * @param {string|Date} targetDate 
 * @returns {number} Days remaining (negative if past)
 */
export const calculateDaysRemaining = (targetDate) => {
  if (!targetDate) return 0;
  return differenceInDays(new Date(targetDate), new Date());
};

/**
 * Calculate days remaining for treatment plan
 * @param {string|Date} endDate 
 * @returns {number} Days remaining
 */
export const calculateTreatmentDaysRemaining = (endDate) => {
  return calculateDaysRemaining(endDate);
};

/**
 * Calculate days elapsed since a start date
 * @param {string|Date} startDate 
 * @returns {number} Days elapsed
 */
export const calculateDaysElapsed = (startDate) => {
  if (!startDate) return 0;
  return differenceInDays(new Date(), new Date(startDate));
};

/**
 * Calculate weeks between two dates
 * @param {string|Date} startDate 
 * @param {string|Date} endDate 
 * @returns {number} Weeks between
 */
export const calculateWeeksBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return differenceInWeeks(new Date(endDate), new Date(startDate));
};

/**
 * Calculate generic progress percentage
 * @param {number} current 
 * @param {number} total 
 * @returns {number} Percentage (0-100)
 */
export const calculateProgress = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
};

/**
 * Alias for calculateProgress
 */
export const calculateCompletionPercentage = calculateProgress;

/**
 * Calculate plan progress based on sessions
 * @param {Array} sessions 
 * @param {string} completedStatus 
 * @returns {Object} { total, completed, percentage }
 */
export const calculatePlanProgress = (sessions = [], completedStatus = 'completed') => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return {
      total: 0,
      completed: 0,
      percentage: 0
    };
  }

  const total = sessions.length;
  const completed = sessions.filter(s => s.status === completedStatus).length;
  const percentage = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    percentage
  };
};

/**
 * Calculate achievement rate for goals/objectives
 * @param {Array} goals 
 * @returns {number} Percentage
 */
export const calculateAchievementRate = (goals = []) => {
  if (!goals || goals.length === 0) return 0;
  const achieved = goals.filter(g => g.status === 'achieved' || g.achieved).length;
  return calculateProgress(achieved, goals.length);
};

/**
 * Calculate duration of a session in minutes
 * @param {string|Date} start 
 * @param {string|Date} end 
 * @returns {number} Minutes
 */
export const calculateSessionDuration = (start, end) => {
  if (!start || !end) return 0;
  const diffMs = new Date(end) - new Date(start);
  return Math.round(diffMs / 60000);
};

/**
 * Calculate total duration of multiple items
 * @param {Array} items 
 * @param {string} durationField 
 * @returns {number} Total minutes
 */
export const calculateTotalDuration = (items = [], durationField = 'duration') => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => acc + (Number(item[durationField]) || 0), 0);
};

/**
 * Convert minutes to human readable string (e.g. "1h 30m")
 * @param {number} minutes 
 * @returns {string}
 */
export const convertMinutesToHoursMinutes = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weightKg 
 * @param {number} heightCm 
 * @returns {number|null} BMI value
 */
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

/**
 * Get BMI Category
 * @param {number} bmi 
 * @returns {string} Category name
 */
export const getBMICategory = (bmi) => {
  if (!bmi) return 'Desconocido';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

/**
 * Calculate average of an array of numbers
 * @param {Array<number>} numbers 
 * @returns {number} Average
 */
export const calculateAverage = (numbers = []) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Number((sum / numbers.length).toFixed(1));
};

/**
 * Calculate session frequency (e.g. sessions per week)
 * @param {Array} sessions 
 * @returns {number} Average sessions per week
 */
export const calculateSessionFrequency = (sessions = []) => {
  if (!sessions || sessions.length < 2) return 0;
  
  // Sort by date
  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = new Date(sorted[0].date);
  const last = new Date(sorted[sorted.length - 1].date);
  
  const weeks = Math.max(1, differenceInWeeks(last, first));
  return Number((sessions.length / weeks).toFixed(1));
};