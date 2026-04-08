-- ═══════════════════════════════════════════════════════════
-- ADOS-2: Tabla de descripciones de puntaje por ítem
-- Almacena qué significa cada código (0,1,2,3,7,8) para cada ítem
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ados2_score_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,          -- 'T','1','2','3','4'
  item_code TEXT NOT NULL,       -- 'A-2','B-1', etc.
  item_name TEXT NOT NULL,
  domain TEXT NOT NULL,          -- 'Lenguaje y Comunicación', 'Interacción Social Recíproca', etc.
  score_value INTEGER NOT NULL,  -- 0,1,2,3,4,7,8,9
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, item_code, score_value)
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ados2_score_desc_lookup ON ados2_score_descriptions(module, item_code);

-- ═══════════════════════════════════════════════════════════
-- MÓDULO 1: Datos completos
-- ═══════════════════════════════════════════════════════════

INSERT INTO ados2_score_descriptions (module, item_code, item_name, domain, score_value, description) VALUES
-- A1. Nivel general de lenguaje oral no ecolálico
('1','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',0,'Uso regular de verbalizaciones de dos o más palabras.'),
('1','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',1,'Solo uso ocasional de frases; en general usa palabras sueltas.'),
('1','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',2,'Solo se reconocen palabras sueltas o aproximaciones de palabras; debe utilizar por lo menos cinco palabras distintas a lo largo de la sesión.'),
('1','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',3,'Por lo menos una palabra o aproximación de palabra, pero menos de cinco palabras dichas durante la sesión.'),
('1','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',4,'No hay uso espontáneo de palabras ni aproximaciones de palabras.'),

-- A2. Frecuencia de la vocalización espontánea dirigida a otros
('1','A-2','Frecuencia de la vocalización espontánea dirigida a otros','Lenguaje y Comunicación',0,'Dirige vocalizaciones hacia el familiar o cuidador o al examinador en varios contextos pragmáticos, incluyendo charlar para ser amigable o expresar interés.'),
('1','A-2','Frecuencia de la vocalización espontánea dirigida a otros','Lenguaje y Comunicación',1,'Dirige vocalizaciones consistentemente en un solo contexto; o dirige pocas vocalizaciones en varios contextos pragmáticos.'),
('1','A-2','Frecuencia de la vocalización espontánea dirigida a otros','Lenguaje y Comunicación',2,'Dirige una vocalización esporádica de manera inconsistente en pocos contextos. Puede incluir lloriqueos o llantos debidos a la frustración.'),
('1','A-2','Frecuencia de la vocalización espontánea dirigida a otros','Lenguaje y Comunicación',3,'Las vocalizaciones no están dirigidas nunca o casi nunca al familiar o cuidador o al examinador; o nunca o casi nunca vocaliza.'),

-- A3. Entonación de las vocalizaciones o verbalizaciones
('1','A-3','Entonación de las vocalizaciones o verbalizaciones','Lenguaje y Comunicación',0,'Entonación normal, con variación apropiada, sin peculiaridades ni rarezas.'),
('1','A-3','Entonación de las vocalizaciones o verbalizaciones','Lenguaje y Comunicación',1,'Poca variación de timbre o tono; más bien plano o exagerado, o alguna que otra entonación peculiar.'),
('1','A-3','Entonación de las vocalizaciones o verbalizaciones','Lenguaje y Comunicación',2,'Entonación rara o tono de voz y acento inapropiado; o marcadamente plano o con vocalizaciones mecánicas; o llanto extraño.'),
('1','A-3','Entonación de las vocalizaciones o verbalizaciones','Lenguaje y Comunicación',8,'N/A: no hay suficientes vocalizaciones para poder evaluar la entonación.'),

-- A4. Ecolalia inmediata
('1','A-4','Ecolalia inmediata','Lenguaje y Comunicación',0,'No repite el habla de otras personas (requiere al menos cinco palabras).'),
('1','A-4','Ecolalia inmediata','Lenguaje y Comunicación',1,'Eco ocasional del lenguaje.'),
('1','A-4','Ecolalia inmediata','Lenguaje y Comunicación',2,'Repite palabras o frases con frecuencia, pero también muestra algo de lenguaje espontáneo.'),
('1','A-4','Ecolalia inmediata','Lenguaje y Comunicación',3,'El habla consiste principalmente en ecolalia inmediata.'),
('1','A-4','Ecolalia inmediata','Lenguaje y Comunicación',8,'No se ha percibido ecolalia, pero el lenguaje es demasiado limitado como para valorarlo.'),

-- A5. Uso estereotipado o idiosincrásico de palabras o frases
('1','A-5','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',0,'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas (requiere al menos cinco palabras).'),
('1','A-5','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',1,'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños con el mismo nivel de lenguaje expresivo, pero no es claramente raro.'),
('1','A-5','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',2,'A menudo utiliza vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.'),
('1','A-5','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',3,'Utiliza frecuentemente habla rara o estereotipada y raramente usa un habla espontánea no estereotipada.'),
('1','A-5','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',8,'El lenguaje es demasiado limitado como para valorarlo.'),

-- A6. Uso del cuerpo de otro
('1','A-6','Uso del cuerpo de otro','Lenguaje y Comunicación',0,'No se utiliza el cuerpo de otra persona para un objetivo concreto, excepto cuando otras estrategias no han funcionado y se da junto con una mirada coordinada.'),
('1','A-6','Uso del cuerpo de otro','Lenguaje y Comunicación',1,'Toma la mano del adulto y lo lleva a distintos lugares sin mirada o contacto visual coordinado, pero no la utiliza como herramienta.'),
('1','A-6','Uso del cuerpo de otro','Lenguaje y Comunicación',2,'Coloca la mano del adulto sobre un objeto; o usa la mano del adulto como herramienta o como un gesto del niño.'),
('1','A-6','Uso del cuerpo de otro','Lenguaje y Comunicación',8,'Escasa o inexistente comunicación espontánea.'),

-- A7. Señalar
('1','A-7','Señalar','Lenguaje y Comunicación',0,'Señala con el dedo índice con referencia dirigida visualmente (mirada coordinada) a objetos a distancia, en al menos dos actividades.'),
('1','A-7','Señalar','Lenguaje y Comunicación',1,'Señala para referirse a objetos, pero sin flexibilidad ni frecuencia suficiente; o produce una aproximación coordinada con mirada o vocalización.'),
('1','A-7','Señalar','Lenguaje y Comunicación',2,'Señala únicamente cuando está cerca de tocar o tocando un objeto, sin coordinación con la mirada o vocalización.'),
('1','A-7','Señalar','Lenguaje y Comunicación',3,'No señala objetos de ninguna de las maneras descritas.'),

-- A8. Gestos
('1','A-8','Gestos','Lenguaje y Comunicación',0,'Uso espontáneo de al menos dos gestos diferentes de cualquier tipo; por lo menos uno usado más de una vez.'),
('1','A-8','Gestos','Lenguaje y Comunicación',1,'Uso espontáneo de gestos descriptivos, convencionales, instrumentales o emocionales, pero exagerados o limitados en rango o variedad.'),
('1','A-8','Gestos','Lenguaje y Comunicación',2,'No hay uso espontáneo de gestos descriptivos, convencionales, instrumentales o emocionales; o solo hay uso inapropiado.'),
('1','A-8','Gestos','Lenguaje y Comunicación',8,'N/A (limitado por alguna dificultad motora severa).'),

-- B1. Contacto visual inusual
('1','B-1','Contacto visual inusual','Interacción Social Recíproca',0,'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.'),
('1','B-1','Contacto visual inusual','Interacción Social Recíproca',2,'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.'),

-- B3. Expresiones faciales dirigidas a otros
('1','B-3','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',0,'Dirige diversas expresiones faciales apropiadas con la intención de comunicar estados emocionales o cognitivos.'),
('1','B-3','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',1,'Dirige algunas expresiones faciales al examinador o familiar, pero de forma limitada o solo con emociones extremas.'),
('1','B-3','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',2,'No dirige expresiones faciales apropiadas a los demás.'),

-- B4. Integración de la mirada y otras conductas
('1','B-4','Integración de la mirada y otras conductas durante las iniciaciones sociales','Interacción Social Recíproca',0,'Utiliza eficientemente el contacto visual junto con palabras, vocalizaciones o gestos para comunicar una intención social.'),
('1','B-4','Integración de la mirada y otras conductas durante las iniciaciones sociales','Interacción Social Recíproca',1,'Utiliza el contacto visual y otras estrategias independientemente para comunicar intención social, pero no los coordina entre sí.'),
('1','B-4','Integración de la mirada y otras conductas durante las iniciaciones sociales','Interacción Social Recíproca',2,'Utiliza o el contacto visual u otras estrategias para comunicar intención social, pero no ambos.'),
('1','B-4','Integración de la mirada y otras conductas durante las iniciaciones sociales','Interacción Social Recíproca',3,'No utiliza ni contacto visual ni otras estrategias para comunicar intención social; o no hay iniciaciones sociales.'),

-- B5. Disfrute compartido
('1','B-5','Disfrute compartido durante la interacción','Interacción Social Recíproca',0,'Da muestras claras de disfrute pertinentes al contexto en más de una actividad, incluyendo al menos una que no sea puramente física.'),
('1','B-5','Disfrute compartido durante la interacción','Interacción Social Recíproca',1,'Muestra cierto disfrute adecuado al contexto; o una muestra clara en una sola interacción.'),
('1','B-5','Disfrute compartido durante la interacción','Interacción Social Recíproca',2,'Escaso o nulo disfrute en la interacción con el examinador, pero muestra disfrute en sus propias actividades o con el familiar.'),
('1','B-5','Disfrute compartido durante la interacción','Interacción Social Recíproca',3,'Poco o ningún disfrute expresado durante la evaluación y poco interés en los juguetes.'),

-- B9. Mostrar
('1','B-9','Mostrar','Interacción Social Recíproca',0,'Muestra espontáneamente juguetes u objetos, sosteniéndolos delante de un adulto y estableciendo contacto visual.'),
('1','B-9','Mostrar','Interacción Social Recíproca',1,'Muestra juguetes de manera parcial o inconsistente; o muestra objetos solo en una ocasión.'),
('1','B-9','Mostrar','Interacción Social Recíproca',2,'No muestra objetos a otras personas.'),

-- B10. Iniciación espontánea de la atención conjunta
('1','B-10','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',0,'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto fuera del alcance (cambio de mirada de tres puntos).'),
('1','B-10','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',1,'Hace referencias parciales a un objeto fuera del alcance; puede mirar y señalar pero no coordina con mirar a otra persona.'),
('1','B-10','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',2,'No hay aproximación a una iniciación espontánea de atención conjunta.'),

-- B11. Respuesta a la atención conjunta
('1','B-11','Respuesta a la atención conjunta','Interacción Social Recíproca',0,'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin necesidad de señalar.'),
('1','B-11','Respuesta a la atención conjunta','Interacción Social Recíproca',1,'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.'),
('1','B-11','Respuesta a la atención conjunta','Interacción Social Recíproca',2,'No sigue la mirada ni la acción de señalar del examinador, pero mira hacia el objeto cuando se activa.'),
('1','B-11','Respuesta a la atención conjunta','Interacción Social Recíproca',3,'No se orienta hacia el objeto incluso cuando este está activado.'),

-- B12. Características de las iniciaciones sociales
('1','B-12','Características de las iniciaciones sociales','Interacción Social Recíproca',0,'Uso efectivo de formas verbales y no verbales con intención de realizar iniciaciones sociales claras y adecuadas al contexto.'),
('1','B-12','Características de las iniciaciones sociales','Interacción Social Recíproca',1,'Las iniciaciones sociales tienen características ligeramente inusuales; se restringen a demandas personales o intereses marcados.'),
('1','B-12','Características de las iniciaciones sociales','Interacción Social Recíproca',2,'Las iniciaciones a menudo carecen de integración en el contexto o de naturaleza social.'),
('1','B-12','Características de las iniciaciones sociales','Interacción Social Recíproca',3,'No hay iniciaciones sociales de ningún tipo.'),

-- D1. Interés sensorial inusual
('1','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',0,'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.'),
('1','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',1,'Varios intereses sensoriales posibles pero no tan claros; o solo un caso claro de interés sensorial inusual.'),
('1','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',2,'Interés evidente por elementos sensoriales de los objetos. Deben observarse dos o más ejemplos claros.'),
('1','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',3,'Comportamientos de búsqueda sensorial evidentes durante al menos dos tareas diferentes y que pueden interferir con la evaluación.'),

-- D2. Manierismos de manos y dedos
('1','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',0,'Ninguno.'),
('1','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',1,'Manierismos inusuales o repetitivos de manos y dedos que no son tan claros como para el código 2.'),
('1','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',2,'Movimientos rápidos o retorcimientos de dedos evidentes; o manierismos complejos, estereotipias o posturas.'),
('1','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',3,'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o interfieren con la evaluación.'),

-- D4. Intereses inusualmente repetitivos
('1','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',0,'No se observan intereses repetitivos inusuales ni comportamientos estereotipados.'),
('1','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',1,'Interés o comportamiento repetitivo posible o leve.'),
('1','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',2,'Intereses inusualmente repetitivos o comportamientos estereotipados evidentes.'),
('1','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',3,'Intereses repetitivos o comportamientos estereotipados marcados que interfieren con la evaluación.')
ON CONFLICT (module, item_code, score_value) DO NOTHING;

-- RLS
ALTER TABLE ados2_score_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Score descriptions are readable by authenticated users"
  ON ados2_score_descriptions FOR SELECT
  TO authenticated
  USING (true);
