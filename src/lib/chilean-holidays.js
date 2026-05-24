/**
 * @file src/lib/chilean-holidays.js
 *
 * Feriados oficiales de Chile (Ley 19.668 y modificaciones posteriores).
 *
 * Incluye:
 *  - Feriados fijos (Año Nuevo, 1 Mayo, 21 Mayo, 18-19 Sep, 25 Dic, etc.)
 *  - Feriados móviles calculados desde Pascua (Viernes y Sábado Santo)
 *
 * No incluye (por simplicidad / variabilidad):
 *  - Feriados regionales (ej: 7 jun en Arica)
 *  - Elecciones (varían cada ciclo)
 *  - Feriados bancarios
 *
 * El día de Pueblos Indígenas (solsticio de invierno boreal) se usa la
 * fecha aproximada del 21 jun; algunos años cae 20 o 22. Para producción
 * estricta, conviene fuente oficial Dirección del Trabajo.
 */

import { format } from 'date-fns';

/**
 * Calcula el domingo de Pascua para un año dado (algoritmo de Meeus/Jones/Butcher).
 */
function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Retorna array de { date, name } con los feriados chilenos del año.
 */
export function getChileanHolidays(year) {
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);

  return [
    { date: new Date(year, 0, 1), name: 'Año Nuevo' },
    { date: goodFriday, name: 'Viernes Santo' },
    { date: holySaturday, name: 'Sábado Santo' },
    { date: new Date(year, 4, 1), name: 'Día del Trabajo' },
    { date: new Date(year, 4, 21), name: 'Glorias Navales' },
    { date: new Date(year, 5, 21), name: 'Día de los Pueblos Indígenas' },
    { date: new Date(year, 5, 29), name: 'San Pedro y San Pablo' },
    { date: new Date(year, 6, 16), name: 'Virgen del Carmen' },
    { date: new Date(year, 7, 15), name: 'Asunción de la Virgen' },
    { date: new Date(year, 8, 18), name: 'Independencia Nacional' },
    { date: new Date(year, 8, 19), name: 'Glorias del Ejército' },
    { date: new Date(year, 9, 12), name: 'Encuentro de Dos Mundos' },
    { date: new Date(year, 9, 31), name: 'Iglesias Evangélicas' },
    { date: new Date(year, 10, 1), name: 'Día de Todos los Santos' },
    { date: new Date(year, 11, 8), name: 'Inmaculada Concepción' },
    { date: new Date(year, 11, 25), name: 'Navidad' },
  ];
}

/**
 * Helper: construye un Map yyyy-MM-dd → nombre con feriados de varios años
 * (útil para navegación adyacente sin recalcular).
 */
export function buildHolidaysMap(years) {
  const map = new Map();
  years.forEach((year) => {
    getChileanHolidays(year).forEach((h) => {
      map.set(format(h.date, 'yyyy-MM-dd'), h.name);
    });
  });
  return map;
}
