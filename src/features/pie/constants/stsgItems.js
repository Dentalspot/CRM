/**
 * STSG — Screening Test of Spanish Grammar (Toronto, 1973)
 * 23 ítems receptivos + 23 ítems expresivos
 * Cada ítem evalúa un contraste gramatical específico
 * La respuesta correcta está marcada con el campo 'correct'
 */

export const STSG_RECEPTIVO_ITEMS = [
  { num: 1, a: 'El niño está sentado', b: 'El niño no está sentado', correct: 'a', contraste: 'Afirmación vs. Negación' },
  { num: 2, a: 'El gato está encima de la caja', b: 'El gato está adentro de la caja', correct: 'b', contraste: 'Preposiciones de lugar' },
  { num: 3, a: 'Él va arriba', b: 'Ella va arriba', correct: 'a', contraste: 'Pronombres personales (género)' },
  { num: 4, a: 'El perro está detrás de la silla', b: 'El perro está debajo de la silla', correct: 'a', contraste: 'Preposiciones de lugar' },
  { num: 5, a: 'Están comiendo', b: 'Está comiendo', correct: 'a', contraste: 'Número verbal (singular/plural)' },
  { num: 6, a: 'El libro es de él', b: 'El libro es de ella', correct: 'a', contraste: 'Pronombres posesivos (género)' },
  { num: 7, a: 'El niño se cayó', b: 'El niño se cae', correct: 'a', contraste: 'Tiempo verbal (pasado/presente)' },
  { num: 8, a: 'Alguien está en la mesa', b: 'Algo está en la mesa', correct: 'b', contraste: 'Pronombres indefinidos (persona/cosa)' },
  { num: 9, a: 'El niño la está llamando', b: 'El niño lo está llamando', correct: 'b', contraste: 'Pronombres de objeto directo (género)' },
  { num: 10, a: 'Este es mi papá', b: 'Aquel es mi papá', correct: 'a', contraste: 'Demostrativos (proximidad)' },
  { num: 11, a: 'El niño está tomando helado', b: 'El niño estaba tomando helado', correct: 'a', contraste: 'Tiempo verbal (presente/pasado progresivo)' },
  { num: 12, a: '¿Dónde está la niña?', b: '¿Quién es la niña?', correct: 'b', contraste: 'Pronombres interrogativos' },
  { num: 13, a: 'El niño tiene el pájaro', b: 'El niño tenía el pájaro', correct: 'a', contraste: 'Tiempo verbal (presente/pasado)' },
  { num: 14, a: 'La niña las tiene', b: 'La niña la tiene', correct: 'a', contraste: 'Pronombres de OD (número)' },
  { num: 15, a: 'Esta es mi cama', b: 'Esta es nuestra cama', correct: 'b', contraste: 'Posesivos (persona)' },
  { num: 16, a: 'El niño se ve', b: 'El niño lo ve', correct: 'b', contraste: 'Pronombres reflexivos vs. OD' },
  { num: 17, a: 'La niña subirá', b: 'La niña subió', correct: 'a', contraste: 'Tiempo verbal (futuro/pasado)' },
  { num: 18, a: 'Mira quién llegó', b: 'Mira lo que llegó', correct: 'a', contraste: 'Pronombres relativos (persona/cosa)' },
  { num: 19, a: 'La mamá dice "Se lo dio"', b: 'La mamá dice "Me lo dio"', correct: 'b', contraste: 'Pronombres de OI (persona)' },
  { num: 20, a: 'La mamá va a comprar pan', b: 'La mamá fue a comprar pan', correct: 'a', contraste: 'Tiempo verbal (futuro perifrástico/pasado)' },
  { num: 21, a: 'Este es un avión', b: 'Ese es un avión', correct: 'b', contraste: 'Demostrativos (proximidad)' },
  { num: 22, a: 'El papá es alto', b: 'El papá está alto', correct: 'b', contraste: 'Ser vs. Estar' },
  { num: 23, a: 'El niño es llamado por la niña', b: 'La niña es llamada por el niño', correct: 'a', contraste: 'Voz pasiva' },
];

export const STSG_EXPRESIVO_ITEMS = [
  { num: 1, a: 'La puerta no está cerrada', b: 'La puerta está cerrada', correct: 'a', contraste: 'Afirmación vs. Negación' },
  { num: 2, a: 'El perro está encima del auto', b: 'El perro está dentro del auto', correct: 'b', contraste: 'Preposiciones de lugar' },
  { num: 3, a: 'El gato está debajo de la silla', b: 'El gato está detrás de la silla', correct: 'b', contraste: 'Preposiciones de lugar' },
  { num: 4, a: 'Él ve el gato', b: 'Ella ve el gato', correct: 'a', contraste: 'Pronombres personales (género)' },
  { num: 5, a: 'Alguien está en la silla', b: 'Algo está en la silla', correct: 'b', contraste: 'Pronombres indefinidos (persona/cosa)' },
  { num: 6, a: 'El sombrero es de ella', b: 'El sombrero es de él', correct: 'b', contraste: 'Pronombres posesivos (género)' },
  { num: 7, a: 'Está durmiendo', b: 'Están durmiendo', correct: 'b', contraste: 'Número verbal (singular/plural)' },
  { num: 8, a: 'El niño se vistió', b: 'El niño se viste', correct: 'a', contraste: 'Tiempo verbal (pasado/presente)' },
  { num: 9, a: 'La niña está escribiendo', b: 'La niña estaba escribiendo', correct: 'a', contraste: 'Tiempo verbal (presente/pasado progresivo)' },
  { num: 10, a: 'La niña la ve', b: 'La niña lo ve', correct: 'b', contraste: 'Pronombres de objeto directo (género)' },
  { num: 11, a: 'El niño tenía el globo', b: 'El niño tiene el globo', correct: 'a', contraste: 'Tiempo verbal (pasado/presente)' },
  { num: 12, a: 'La niña lo lleva', b: 'La niña los lleva', correct: 'a', contraste: 'Pronombres de OD (número)' },
  { num: 13, a: 'Este es mi amigo', b: 'Aquel es mi amigo', correct: 'b', contraste: 'Demostrativos (proximidad)' },
  { num: 14, a: 'El niño lo lava', b: 'El niño se lava', correct: 'b', contraste: 'Pronombres reflexivos vs. OD' },
  { num: 15, a: 'Este es su perro', b: 'Este es nuestro perro', correct: 'a', contraste: 'Posesivos (persona)' },
  { num: 16, a: 'La niña comió', b: 'La niña comerá', correct: 'a', contraste: 'Tiempo verbal (pasado/futuro)' },
  { num: 17, a: 'Esa es mi muñeca', b: 'Esta es mi muñeca', correct: 'a', contraste: 'Demostrativos (proximidad)' },
  { num: 18, a: '¿Quién está en la puerta?', b: '¿Qué está en la puerta?', correct: 'b', contraste: 'Pronombres interrogativos' },
  { num: 19, a: '¿Dónde está el niño?', b: '¿Quién es el niño?', correct: 'a', contraste: 'Pronombres interrogativos' },
  { num: 20, a: 'El niño va a cortarse el pelo', b: 'El niño fue a cortarse el pelo', correct: 'b', contraste: 'Tiempo verbal (futuro perifrástico/pasado)' },
  { num: 21, a: 'El niño dice "Me la dio"', b: 'El niño dice "Se la dio"', correct: 'a', contraste: 'Pronombres de OI (persona)' },
  { num: 22, a: 'El niño es alto', b: 'El niño está alto', correct: 'b', contraste: 'Ser vs. Estar' },
  { num: 23, a: 'La niña es empujada por el niño', b: 'El niño es empujado por la niña', correct: 'a', contraste: 'Voz pasiva' },
];

/**
 * Categorías gramaticales evaluadas en el STSG para análisis interpretativo
 */
export const STSG_CATEGORIAS = [
  { key: 'negacion', label: 'Afirmación vs. Negación', items: { r: [1], e: [1] } },
  { key: 'preposiciones', label: 'Preposiciones de lugar', items: { r: [2, 4], e: [2, 3] } },
  { key: 'pron_personal', label: 'Pronombres personales (género)', items: { r: [3], e: [4] } },
  { key: 'numero_verbal', label: 'Número verbal (singular/plural)', items: { r: [5], e: [7] } },
  { key: 'posesivos_genero', label: 'Pronombres posesivos (género)', items: { r: [6], e: [6] } },
  { key: 'tiempo_verbal', label: 'Tiempo verbal', items: { r: [7, 11, 13, 17, 20], e: [8, 9, 11, 16, 20] } },
  { key: 'pron_indefinido', label: 'Pronombres indefinidos (persona/cosa)', items: { r: [8], e: [5] } },
  { key: 'pron_od_genero', label: 'Pronombres de OD (género)', items: { r: [9], e: [10] } },
  { key: 'demostrativos', label: 'Demostrativos (proximidad)', items: { r: [10, 21], e: [13, 17] } },
  { key: 'pron_interrogativo', label: 'Pronombres interrogativos', items: { r: [12], e: [18, 19] } },
  { key: 'pron_od_numero', label: 'Pronombres de OD (número)', items: { r: [14], e: [12] } },
  { key: 'posesivos_persona', label: 'Posesivos (persona)', items: { r: [15], e: [15] } },
  { key: 'reflexivos', label: 'Pronombres reflexivos vs. OD', items: { r: [16], e: [14] } },
  { key: 'pron_relativos', label: 'Pronombres relativos (persona/cosa)', items: { r: [18], e: [] } },
  { key: 'pron_oi', label: 'Pronombres de OI (persona)', items: { r: [19], e: [21] } },
  { key: 'ser_estar', label: 'Ser vs. Estar', items: { r: [22], e: [22] } },
  { key: 'voz_pasiva', label: 'Voz pasiva', items: { r: [23], e: [23] } },
];
