-- ═══════════════════════════════════════════════════════════
-- ADOS-2 Módulo 3: Descripciones de puntaje por ítem
-- Niños y adolescentes con fluidez verbal
-- ═══════════════════════════════════════════════════════════

INSERT INTO ados2_score_descriptions (module, item_code, item_name, domain, score_value, description) VALUES
-- A1. Nivel general de lenguaje oral no ecolálico
('3','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',0,'Utiliza frases de una manera generalmente correcta (debe utilizar algunas verbalizaciones complejas).'),
('3','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',1,'Algo de habla relativamente compleja (en ocasiones utiliza expresiones de dos o más oraciones que contengan un nombre y un verbo dentro de la misma oración) pero con errores gramaticales recurrentes no asociados con el uso de un dialecto.'),
('3','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',2,'El habla no-ecolálica se compone principalmente de expresiones de al menos tres palabras, pero sin el lenguaje complejo que se ha descrito anteriormente.'),
('3','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',3,'El habla no-ecolálica consiste principalmente en frases simples.'),

-- A2. Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)
('3','A-2','Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)','Lenguaje y Comunicación',0,'Entonación que varía adecuadamente, volumen razonable y velocidad normal del habla, con un ritmo regular coordinado con la respiración.'),
('3','A-2','Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)','Lenguaje y Comunicación',1,'Poca variación de timbre y tono; entonación bastante monótona o exagerada, pero no claramente peculiar; o volumen levemente inusual; o habla que tiende a ser inusualmente lenta o rápida o espasmódica.'),
('3','A-2','Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)','Lenguaje y Comunicación',2,'Habla claramente anormal por cualquiera de las siguientes razones: lenta y vacilante; inapropiadamente rápida; ritmo entrecortado e irregular; entonación rara o timbre o acento inapropiados; marcadamente plana o carente de matices; volumen consistentemente anormal.'),
('3','A-2','Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)','Lenguaje y Comunicación',7,'Tartamudeo u otro trastorno de la fluidez verbal.'),

-- A3. Ecolalia inmediata
('3','A-3','Ecolalia inmediata','Lenguaje y Comunicación',0,'No repite el habla de otra persona.'),
('3','A-3','Ecolalia inmediata','Lenguaje y Comunicación',1,'Eco ocasional del lenguaje.'),
('3','A-3','Ecolalia inmediata','Lenguaje y Comunicación',2,'Repite palabras o frases con regularidad, pero también muestra algo de lenguaje espontáneo, el cual puede ser estereotipado.'),
('3','A-3','Ecolalia inmediata','Lenguaje y Comunicación',3,'El habla consiste principalmente en ecolalia inmediata.'),

-- A4. Uso estereotipado o idiosincrásico de palabras o frases
('3','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',0,'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas.'),
('3','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',1,'El uso de palabras o frases tiende a ser más repetitivo o formal que en la mayoría de las personas con el mismo nivel de lenguaje expresivo, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o emplea palabras de una manera inusual.'),
('3','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',2,'A menudo usa vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.'),
('3','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',3,'Utiliza frecuentemente habla rara o estereotipada y casi nunca usa un habla espontánea no estereotipada.'),

-- A5. Ofrece información
('3','A-5','Ofrece información','Lenguaje y Comunicación',0,'Ofrece información espontáneamente sobre sus propios pensamientos, sentimientos o experiencias en varias ocasiones.'),
('3','A-5','Ofrece información','Lenguaje y Comunicación',1,'A veces ofrece información de manera espontánea sobre sus propios pensamientos, sentimientos o experiencias.'),
('3','A-5','Ofrece información','Lenguaje y Comunicación',2,'Nunca o casi nunca ofrece información de forma espontánea, a menos que sea acerca de sus intereses restringidos o preocupaciones; o informa acerca de hechos o conocimientos generales.'),

-- A6. Pide información
('3','A-6','Pide información','Lenguaje y Comunicación',0,'Le pregunta al examinador sobre sus pensamientos, sentimientos o experiencias en varias ocasiones.'),
('3','A-6','Pide información','Lenguaje y Comunicación',1,'Ocasionalmente (por lo menos un ejemplo claro) le pregunta al examinador acerca de sus pensamientos, sentimientos o experiencias.'),
('3','A-6','Pide información','Lenguaje y Comunicación',2,'Responde adecuadamente a los comentarios hechos por el examinador acerca de sus pensamientos, sentimientos o experiencias, pero no hace preguntas sobre ellos de manera espontánea.'),
('3','A-6','Pide información','Lenguaje y Comunicación',3,'Rara vez o nunca expresa interés por los pensamientos, los sentimientos o las experiencias del examinador.'),

-- A7. Narración de sucesos
('3','A-7','Narración de sucesos','Lenguaje y Comunicación',0,'Informa sobre un hecho no rutinario específico que no es parte de una preocupación o de un interés marcado y que pareciera ser real. Da información suficiente sin necesitar preguntas específicas para ayudarle.'),
('3','A-7','Narración de sucesos','Lenguaje y Comunicación',1,'Proporciona suficiente información de un hecho rutinario que no es parte de una preocupación o interés marcado y pareciera ser real. Da información sin necesitar preguntas específicas.'),
('3','A-7','Narración de sucesos','Lenguaje y Comunicación',2,'Proporciona información acerca de hechos rutinarios o no rutinarios, pero depende de las preguntas específicas del examinador para poder continuar; o únicamente describe una situación poco verosímil.'),
('3','A-7','Narración de sucesos','Lenguaje y Comunicación',3,'Respuestas inconsistentes o insuficientes, incluso a las preguntas específicas.'),

-- A8. Conversación
('3','A-8','Conversación','Lenguaje y Comunicación',0,'La conversación fluye, construyéndose sobre el diálogo del examinador. Requiere secuencias de al menos cuatro elementos de intercambio recíproco.'),
('3','A-8','Conversación','Lenguaje y Comunicación',1,'Parte del habla del evaluado incluye algo de elaboración espontánea de sus propias respuestas, pero bien la cantidad de habla es menor a la esperada o bien es limitada en cuanto a su flexibilidad.'),
('3','A-8','Conversación','Lenguaje y Comunicación',2,'Poca conversación recíproca sostenida por el evaluado; puede seguir su propio tren de pensamiento más que participar en un intercambio; escasa sensación de reciprocidad.'),
('3','A-8','Conversación','Lenguaje y Comunicación',3,'Poca habla comunicativa espontánea. Asigne este código a aquellos evaluados que emitan algunas respuestas limitadas a las iniciaciones de conversación realizadas por el examinador.'),

-- A9. Gestos descriptivos, convencionales, instrumentales o informativos
('3','A-9','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',0,'Uso espontáneo de varios gestos descriptivos. Puede usar además gestos convencionales o instrumentales.'),
('3','A-9','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',1,'Algún uso espontáneo de gestos descriptivos, pero exagerados, poco variados o que se producen en pocos contextos; o uso frecuente de gestos convencionales o instrumentales pero uso excepcional o ningún uso de gestos descriptivos.'),
('3','A-9','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',2,'Algún uso espontáneo de gestos informativos, convencionales o instrumentales, pero uso excepcional o ningún uso de gestos descriptivos.'),
('3','A-9','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',3,'Ausencia o uso muy limitado de gestos convencionales, instrumentales, informativos o descriptivos.'),
('3','A-9','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',8,'N/A (limitado por alguna dificultad motora severa).'),

-- B1. Contacto visual inusual
('3','B-1','Contacto visual inusual','Interacción Social Recíproca',0,'Mirada apropiada, con cambios sutiles mezclados con otro tipo de comunicación.'),
('3','B-1','Contacto visual inusual','Interacción Social Recíproca',2,'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.'),

-- B2. Expresiones faciales dirigidas al examinador
('3','B-2','Expresiones faciales dirigidas al examinador','Interacción Social Recíproca',0,'Dirige diversas expresiones faciales apropiadas al examinador con la intención de comunicar estados emocionales o cognitivos.'),
('3','B-2','Expresiones faciales dirigidas al examinador','Interacción Social Recíproca',1,'Dirige algunas expresiones faciales al examinador (p. ej., dirige únicamente expresiones que indican emociones extremas, u ocasionalmente dirige una variedad más amplia de expresiones).'),
('3','B-2','Expresiones faciales dirigidas al examinador','Interacción Social Recíproca',2,'No dirige expresiones faciales apropiadas al examinador.'),

-- B3. Producción de lenguaje y comunicación no verbal asociada
('3','B-3','Producción de lenguaje y comunicación no verbal asociada','Interacción Social Recíproca',0,'La vocalización en general se acompaña de cambios sutiles y socialmente adecuados en los gestos, las miradas y las expresiones faciales.'),
('3','B-3','Producción de lenguaje y comunicación no verbal asociada','Interacción Social Recíproca',1,'La vocalización se acompaña de una variedad o frecuencia de gestos, miradas y expresiones faciales anormal, limitada o inferior a la usual; o usa casi exclusivamente una sola modalidad.'),
('3','B-3','Producción de lenguaje y comunicación no verbal asociada','Interacción Social Recíproca',2,'Escasa o nula comunicación no verbal combinada con vocalizaciones.'),
('3','B-3','Producción de lenguaje y comunicación no verbal asociada','Interacción Social Recíproca',7,'Cierta evitación de la mirada directa, quizás debida a timidez, pero muestra cierta modulación y coordinación del lenguaje y las conductas no verbales.'),
('3','B-3','Producción de lenguaje y comunicación no verbal asociada','Interacción Social Recíproca',8,'N/A; no hay vocalizaciones; o el empleo de gestos, expresiones faciales o miradas socialmente dirigidas fue mínimo o nulo.'),

-- B4. Disfrute compartido durante la interacción
('3','B-4','Disfrute compartido durante la interacción','Interacción Social Recíproca',0,'Da muestras claras de disfrute adecuadas al contexto durante el intercambio interactivo o la conversación con el examinador en más de una actividad o tema.'),
('3','B-4','Disfrute compartido durante la interacción','Interacción Social Recíproca',1,'Muestra cierto disfrute adecuado al contexto durante las interacciones con el examinador, o proporciona una muestra clara de disfrute durante una sola interacción.'),
('3','B-4','Disfrute compartido durante la interacción','Interacción Social Recíproca',2,'Muestra escaso o nulo disfrute en la interacción con el examinador, pero puede mostrar disfrute en su propio discurso o acciones.'),
('3','B-4','Disfrute compartido durante la interacción','Interacción Social Recíproca',3,'Poco o nulo disfrute expresado durante la evaluación.'),

-- B5. Comentarios sobre las emociones de otros / empatía
('3','B-5','Comentarios sobre las emociones de otros / empatía','Interacción Social Recíproca',0,'Transmite espontáneamente una clara comprensión o identificación de varias emociones diferentes en otras personas o personajes o responde adecuadamente a ellas.'),
('3','B-5','Comentarios sobre las emociones de otros / empatía','Interacción Social Recíproca',1,'Transmite cierta comprensión, identificación y respuesta a una emoción de otras personas (identifica espontánea y correctamente al menos una emoción en otra persona o personaje).'),
('3','B-5','Comentarios sobre las emociones de otros / empatía','Interacción Social Recíproca',2,'Escasa o nula identificación o comunicación de que comprende los estados emocionales de otros.'),

-- B6. Comprensión de las situaciones y relaciones sociales típicas
('3','B-6','Comprensión de las situaciones y relaciones sociales típicas','Interacción Social Recíproca',0,'Muestra ejemplos de comprensión de la naturaleza de varias relaciones sociales típicas, incluyendo la comprensión de su propio papel en al menos una de ellas.'),
('3','B-6','Comprensión de las situaciones y relaciones sociales típicas','Interacción Social Recíproca',1,'Muestra ejemplos de comprensión de varias relaciones sociales típicas, pero no de su propio papel en ellas; o muestra comprensión de solo una relación y de su papel en ella.'),
('3','B-6','Comprensión de las situaciones y relaciones sociales típicas','Interacción Social Recíproca',2,'Muestra cierta comprensión de una sola relación social típica, pero no necesariamente de su papel en la misma.'),
('3','B-6','Comprensión de las situaciones y relaciones sociales típicas','Interacción Social Recíproca',3,'Muestra una comprensión escasa o nula de las relaciones sociales típicas.'),

-- B7. Características de las iniciaciones sociales
('3','B-7','Características de las iniciaciones sociales','Interacción Social Recíproca',0,'Uso efectivo de formas verbales y no verbales para realizar iniciaciones sociales claras hacia el examinador. Apropiadas a los contextos inmediatos.'),
('3','B-7','Características de las iniciaciones sociales','Interacción Social Recíproca',1,'Iniciaciones sociales con características ligeramente inusuales. Se restringen a demandas personales o están relacionadas con los propios intereses del evaluado, pero con alguna intención de involucrar al examinador.'),
('3','B-7','Características de las iniciaciones sociales','Interacción Social Recíproca',2,'Iniciaciones inapropiadas; muchas iniciaciones carecen de integración en el contexto o de naturaleza social. Hace referencia a preocupaciones pero hace pocos intentos de involucrar al examinador.'),
('3','B-7','Características de las iniciaciones sociales','Interacción Social Recíproca',3,'No hay iniciaciones sociales de ningún tipo.'),

-- B8. Cantidad de iniciaciones sociales / mantenimiento de la atención
('3','B-8','Cantidad de iniciaciones sociales / mantenimiento de la atención','Interacción Social Recíproca',0,'Intentos frecuentes de captar o mantener la atención del examinador o de dirigirla hacia objetos, acciones o temas interesantes para el evaluado.'),
('3','B-8','Cantidad de iniciaciones sociales / mantenimiento de la atención','Interacción Social Recíproca',1,'Algunos intentos de captar, mantener o dirigir la atención del examinador, pero que se observan con escasa frecuencia o en pocas actividades diferentes.'),
('3','B-8','Cantidad de iniciaciones sociales / mantenimiento de la atención','Interacción Social Recíproca',2,'Realiza intentos ocasionales de captar, mantener o dirigir la atención del examinador, incluyendo iniciaciones relacionadas únicamente con preocupaciones.'),
('3','B-8','Cantidad de iniciaciones sociales / mantenimiento de la atención','Interacción Social Recíproca',3,'Muestra relativamente poca preocupación con respecto a si el examinador está prestándole atención o no a menos que necesite ayuda.'),
('3','B-8','Cantidad de iniciaciones sociales / mantenimiento de la atención','Interacción Social Recíproca',7,'Demandas de atención inusualmente frecuentes, intensas o excesivas.'),

-- B9. Calidad de la respuesta social
('3','B-9','Calidad de la respuesta social','Interacción Social Recíproca',0,'Muestra una gama de respuestas apropiadas que varían de acuerdo a las situaciones y las presiones sociales inmediatas.'),
('3','B-9','Calidad de la respuesta social','Interacción Social Recíproca',1,'Reacciona a la mayoría de los contextos sociales, pero de forma algo limitada, socialmente embarazosa, inapropiada, inconsistente o consistentemente negativa.'),
('3','B-9','Calidad de la respuesta social','Interacción Social Recíproca',2,'Respuestas extrañas, estereotipadas o respuestas muy poco variadas, o que son inapropiadas para el contexto.'),
('3','B-9','Calidad de la respuesta social','Interacción Social Recíproca',3,'Respuesta mínima o inexistente a los intentos del examinador por implicar al evaluado.'),

-- B10. Cantidad de comunicación social recíproca
('3','B-10','Cantidad de comunicación social recíproca','Interacción Social Recíproca',0,'Uso extenso de comportamientos verbales o no verbales para realizar un intercambio social.'),
('3','B-10','Cantidad de comunicación social recíproca','Interacción Social Recíproca',1,'Muestra alguna comunicación social recíproca, pero reducida en frecuencia o cantidad o en el número de contextos.'),
('3','B-10','Cantidad de comunicación social recíproca','Interacción Social Recíproca',2,'La mayor parte de la comunicación está orientada a objetos o a responder preguntas; o es ecolálica; o tiene que ver con preocupaciones; hay poca o ninguna reciprocidad.'),
('3','B-10','Cantidad de comunicación social recíproca','Interacción Social Recíproca',3,'Escasa o nula comunicación con el examinador.'),

-- B11. Calidad general de la relación
('3','B-11','Calidad general de la relación','Interacción Social Recíproca',0,'La interacción entre el evaluado y el examinador es agradable y apropiada dentro del contexto de la evaluación del ADOS-2.'),
('3','B-11','Calidad general de la relación','Interacción Social Recíproca',1,'La interacción es agradable a veces, pero no de forma sostenida (a veces se ha sentido raro o poco natural, o el comportamiento del evaluado ha parecido mecánico o ligeramente inapropiado).'),
('3','B-11','Calidad general de la relación','Interacción Social Recíproca',2,'Interacción unilateral o inusual dando como resultado de manera sistemática una sesión ligeramente incómoda o una sesión que podría haber sido difícil si el examinador no hubiese modificado continuamente la estructura de la situación.'),
('3','B-11','Calidad general de la relación','Interacción Social Recíproca',3,'El evaluado muestra una consideración mínima hacia el examinador o la sesión es marcadamente incómoda durante una parte significativa del tiempo.'),

-- C1. Imaginación y creatividad
('3','C-1','Imaginación y creatividad','Imaginación',0,'Introduce diversas actividades o comentarios en la conversación que son creativos, originales y espontáneos.'),
('3','C-1','Imaginación y creatividad','Imaginación',1,'Algunas acciones imaginativas o creativas, pero poco variadas o solo ocurren en respuesta a una situación estructurada.'),
('3','C-1','Imaginación y creatividad','Imaginación',2,'Escasas acciones imaginativas o creativas; o solo presenta acciones que son de tipo repetitivo o estereotipado.'),
('3','C-1','Imaginación y creatividad','Imaginación',3,'No hay acciones creativas o inventivas (ni siquiera repetitivas o estereotipadas).'),

-- D1. Interés sensorial inusual en los materiales de juego o en las personas
('3','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',0,'No presenta intereses sensoriales inusuales.'),
('3','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',1,'Varios intereses sensoriales posibles no tan claros como los especificados para el código 2, o solo se observa claramente un caso de interés sensorial inusual o de comportamiento de búsqueda sensorial.'),
('3','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',2,'Interés evidente por elementos sensoriales de los objetos o de los materiales de juego; o examen sensorial de sí mismo o de otros. Deben observarse dos o más ejemplos claros.'),
('3','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',3,'Comportamientos evidentes e inusuales de búsqueda sensorial que ocurren frecuentemente, durante al menos dos tareas o actividades diferentes, y que deben interferir con la evaluación del ADOS-2.'),

-- D2. Manierismos de manos y dedos y otros manierismos complejos
('3','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',0,'Ninguno.'),
('3','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',1,'Manierismos inusuales o repetitivos de manos y dedos o manierismos complejos que no son tan claros como los que se especifican en el código 2.'),
('3','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',2,'Hay movimientos rápidos o retorcimientos de dedos evidentes; o manierismos de manos o dedos complejos, estereotipias o posturas.'),
('3','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',3,'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.'),

-- D3. Conducta autolesiva
('3','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',0,'No intenta autolesionarse.'),
('3','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',1,'Autolesión dudosa o posible o autolesión infrecuente pero clara.'),
('3','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',2,'Más de un ejemplo claro de autolesión, como golpearse la cabeza, abofetearse la propia cara, tirarse del pelo o morderse.'),

-- D4. Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos
('3','D-4','Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos','Comportamientos Estereotipados e Intereses Restringidos',0,'No hubo un interés excesivo o referencias a objetos o temas inusuales o altamente específicos o temas u objetos restringidos o conductas repetitivas.'),
('3','D-4','Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos','Comportamientos Estereotipados e Intereses Restringidos',1,'Referencias ocasionales a temas o patrones de interés inusuales o altamente específicos, que suceden en un grado inusual, o comportamientos repetitivos ocasionales.'),
('3','D-4','Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos','Comportamientos Estereotipados e Intereses Restringidos',2,'Patrones de interés evidentes, estereotipados o inusuales que pueden o no interrumpir o interferir con la comunicación social o comportamientos claramente repetitivos.'),
('3','D-4','Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos','Comportamientos Estereotipados e Intereses Restringidos',3,'Preocupaciones o comportamientos repetitivos evidentes, hasta el punto que interfieren con la evaluación.'),

-- D5. Compulsiones o rituales
('3','D-5','Compulsiones o rituales','Comportamientos Estereotipados e Intereses Restringidos',0,'No hubo actividades o rutinas verbales claras que el evaluado debiera llevar a cabo por completo o de acuerdo a una secuencia que no fuera parte de la tarea.'),
('3','D-5','Compulsiones o rituales','Comportamientos Estereotipados e Intereses Restringidos',1,'Actividades o lenguaje inusualmente fijados a una rutina, pero no hay comportamientos que sean de tipo claramente compulsivo.'),
('3','D-5','Compulsiones o rituales','Comportamientos Estereotipados e Intereses Restringidos',2,'Una o más actividades o rutinas verbales que el evaluado tiene que completar o decir de una manera específica. El evaluado parece estar bajo cierta presión o se pone nervioso si se interrumpe una actividad.'),

-- E1. Elevado nivel de actividad / agitación
('3','E-1','Elevado nivel de actividad / agitación','Otros Comportamientos Anormales',0,'No muestra un elevado nivel de actividad o agitación. Puede moverse constantemente en la silla.'),
('3','E-1','Elevado nivel de actividad / agitación','Otros Comportamientos Anormales',2,'Dificultades para quedarse sentado; se mueve estando en la silla o fuera de ella, o agarra o manipula los objetos de una manera que es ligeramente disruptiva.'),
('3','E-1','Elevado nivel de actividad / agitación','Otros Comportamientos Anormales',3,'Comportamientos hiperactivos que son difíciles de interrumpir. El nivel de actividad interfiere con la evaluación.'),
('3','E-1','Elevado nivel de actividad / agitación','Otros Comportamientos Anormales',7,'Muy quieto, muy poca actividad.'),

-- E2. Berrinches, agresiones, comportamientos negativos o disruptivos
('3','E-2','Berrinches, agresiones, comportamientos negativos o disruptivos','Otros Comportamientos Anormales',0,'No se muestra enfadado, disruptivo, perturbador, negativo ni agresivo durante la evaluación con el ADOS-2.'),
('3','E-2','Berrinches, agresiones, comportamientos negativos o disruptivos','Otros Comportamientos Anormales',1,'Muestra un ejemplo de ligera disrupción, enfado o comportamiento agresivo o negativo hacia el examinador.'),
('3','E-2','Berrinches, agresiones, comportamientos negativos o disruptivos','Otros Comportamientos Anormales',2,'Muestra más de un comportamiento intencionalmente disruptivo o negativo.'),
('3','E-2','Berrinches, agresiones, comportamientos negativos o disruptivos','Otros Comportamientos Anormales',3,'Muestra berrinches temperamentales marcados o repetitivos o agresión significativa.'),

-- E3. Ansiedad
('3','E-3','Ansiedad','Otros Comportamientos Anormales',0,'No hay una ansiedad evidente.'),
('3','E-3','Ansiedad','Otros Comportamientos Anormales',1,'Signos leves de ansiedad o de inseguridad, especialmente al principio de la sesión de evaluación o en respuesta a las actividades concretas.'),
('3','E-3','Ansiedad','Otros Comportamientos Anormales',2,'Ansiedad marcada a lo largo de la evaluación con el ADOS-2 (puede ser intermitente o continua).')

ON CONFLICT (module, item_code, score_value) DO NOTHING;
