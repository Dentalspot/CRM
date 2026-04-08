-- =============================================
-- ADOS-2 Module T Score Descriptions
-- Pre-Verbal / Palabras sueltas (12 a 30 meses)
-- =============================================

INSERT INTO ados2_score_descriptions (module, item_code, item_name, domain, score_value, description)
VALUES
-- A. Lenguaje y Comunicación
('T', 'A-1', 'Nivel general de lenguaje oral no ecolálico', 'Lenguaje y Comunicación', 0, 'Uso regular de verbalizaciones de dos o más palabras.'),
('T', 'A-1', 'Nivel general de lenguaje oral no ecolálico', 'Lenguaje y Comunicación', 1, 'Solo uso ocasional de frases; en general usa palabras sueltas.'),
('T', 'A-1', 'Nivel general de lenguaje oral no ecolálico', 'Lenguaje y Comunicación', 2, 'Solo se reconocen palabras sueltas o aproximaciones de palabras; debe utilizar por lo menos cinco palabras distintas a lo largo de la sesión.'),
('T', 'A-1', 'Nivel general de lenguaje oral no ecolálico', 'Lenguaje y Comunicación', 3, 'Por lo menos una palabra o aproximación de palabra, pero menos de cinco palabras dichas durante la sesión.'),
('T', 'A-1', 'Nivel general de lenguaje oral no ecolálico', 'Lenguaje y Comunicación', 4, 'No hay palabras ni aproximaciones de palabras.'),

('T', 'A-1a', 'Frecuencia del balbuceo', 'Lenguaje y Comunicación', 0, 'Reduplicaciones frecuentes de consonantes o vocales o combinaciones más complejas.'),
('T', 'A-1a', 'Frecuencia del balbuceo', 'Lenguaje y Comunicación', 1, 'Sonidos de una sola sílaba frecuentes (debe contener una consonante).'),
('T', 'A-1a', 'Frecuencia del balbuceo', 'Lenguaje y Comunicación', 2, 'Sonidos de una sola sílaba ocasionales (debe contener una consonante); o reduplicaciones ocasionales de consonantes o vocales.'),
('T', 'A-1a', 'Frecuencia del balbuceo', 'Lenguaje y Comunicación', 3, 'No hay balbuceo (solo hay sonidos vocales).'),
('T', 'A-1a', 'Frecuencia del balbuceo', 'Lenguaje y Comunicación', 8, 'Presenta demasiado lenguaje como para codificar el balbuceo (obtiene un código de 0, 1 o 2 en el ítem A1).'),

('T', 'A-2', 'Frecuencia de la vocalización espontánea dirigida a otros', 'Lenguaje y Comunicación', 0, 'Dirige vocalizaciones hacia el familiar o cuidador o al examinador en varios contextos pragmáticos. Incluye charlar o vocalizar para ser amigable o para expresar interés, además de para expresar sus necesidades.'),
('T', 'A-2', 'Frecuencia de la vocalización espontánea dirigida a otros', 'Lenguaje y Comunicación', 1, 'Dirige vocalizaciones al familiar o cuidador o al examinador inconsistentemente en varios contextos pragmáticos.'),
('T', 'A-2', 'Frecuencia de la vocalización espontánea dirigida a otros', 'Lenguaje y Comunicación', 2, 'Dirige vocalizaciones al familiar o cuidador o al examinador consistentemente en un solo contexto pragmático (p. ej., solo para hacer peticiones).'),
('T', 'A-2', 'Frecuencia de la vocalización espontánea dirigida a otros', 'Lenguaje y Comunicación', 3, 'Dirige una vocalización esporádica al familiar o cuidador o al examinador; o parece que las vocalizaciones no están dirigidas nunca o casi nunca. También se codifica si solo lloriquea o llora debido a la frustración.'),

('T', 'A-3', 'Entonación de las vocalizaciones o verbalizaciones', 'Lenguaje y Comunicación', 0, 'Entonación normal, con variación apropiada, sin peculiaridades ni rarezas.'),
('T', 'A-3', 'Entonación de las vocalizaciones o verbalizaciones', 'Lenguaje y Comunicación', 1, 'Entonación rara pero no tan clara como se especifica para los códigos 2 y 3; o pequeña variación en el tono; o tono algo plano o exagerado.'),
('T', 'A-3', 'Entonación de las vocalizaciones o verbalizaciones', 'Lenguaje y Comunicación', 2, 'Entonación rara o tono de voz y acento inapropiados; o tono marcadamente plano o con vocalizaciones mecánicas; debe ir acompañado de alguna entonación apropiada.'),
('T', 'A-3', 'Entonación de las vocalizaciones o verbalizaciones', 'Lenguaje y Comunicación', 3, 'Entonación en su mayor parte rara o inapropiada.'),
('T', 'A-3', 'Entonación de las vocalizaciones o verbalizaciones', 'Lenguaje y Comunicación', 8, 'N/A (no hay suficientes vocalizaciones para poder evaluar la entonación; incluye la presencia de llanto normal y de algunas otras vocalizaciones).'),

('T', 'A-4', 'Ecolalia inmediata', 'Lenguaje y Comunicación', 0, 'No repite el habla del adulto (requiere al menos cinco palabras para codificarse como 0).'),
('T', 'A-4', 'Ecolalia inmediata', 'Lenguaje y Comunicación', 1, 'Eco ocasional del lenguaje.'),
('T', 'A-4', 'Ecolalia inmediata', 'Lenguaje y Comunicación', 2, 'Repite palabras o frases con frecuencia, pero también muestra algo de lenguaje espontáneo, el cual puede ser estereotipado.'),
('T', 'A-4', 'Ecolalia inmediata', 'Lenguaje y Comunicación', 3, 'El habla consiste principalmente en ecolalia inmediata.'),
('T', 'A-4', 'Ecolalia inmediata', 'Lenguaje y Comunicación', 8, 'No se ha percibido ecolalia, pero el lenguaje es demasiado limitado como para valorarlo.'),

('T', 'A-5', 'Uso estereotipado o idiosincrásico de palabras o frases', 'Lenguaje y Comunicación', 0, 'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas (requiere al menos cinco palabras).'),
('T', 'A-5', 'Uso estereotipado o idiosincrásico de palabras o frases', 'Lenguaje y Comunicación', 1, 'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños con el mismo nivel de lenguaje expresivo, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o hace uso de palabras raras.'),
('T', 'A-5', 'Uso estereotipado o idiosincrásico de palabras o frases', 'Lenguaje y Comunicación', 2, 'A menudo utiliza vocalizaciones estereotipadas o palabras o frases raras, junto con otro tipo de lenguaje.'),
('T', 'A-5', 'Uso estereotipado o idiosincrásico de palabras o frases', 'Lenguaje y Comunicación', 3, 'Utiliza frecuentemente habla rara o estereotipada y raramente usa un habla espontánea no estereotipada.'),
('T', 'A-5', 'Uso estereotipado o idiosincrásico de palabras o frases', 'Lenguaje y Comunicación', 8, 'El lenguaje es demasiado limitado como para valorarlo.'),

('T', 'A-6', 'Uso del cuerpo de otro', 'Lenguaje y Comunicación', 0, 'No se utiliza el cuerpo de otra persona para un objetivo concreto, excepto en situaciones donde otras estrategias no han funcionado y se da junto con una mirada coordinada.'),
('T', 'A-6', 'Uso del cuerpo de otro', 'Lenguaje y Comunicación', 1, 'Toma la mano del adulto y la lleva a distintos lugares sin una mirada o contacto visual coordinado, pero no la coloca sobre los objetos ni la utiliza como herramienta; o mueve la mano del examinador sin establecer contacto visual SOLO en Bloqueo de juguetes.'),
('T', 'A-6', 'Uso del cuerpo de otro', 'Lenguaje y Comunicación', 2, 'Mueve la mano de otra persona mientras está sosteniendo un objeto; o aleja la mano del examinador de un juguete u objeto sin establecer contacto visual. Esto debe ocurrir en una actividad distinta de Bloqueo de juguetes.'),
('T', 'A-6', 'Uso del cuerpo de otro', 'Lenguaje y Comunicación', 3, 'Coloca la mano del adulto u otra parte de su cuerpo sobre un objeto; o usa la mano u otra parte del cuerpo del adulto como herramienta o como gesto del niño.'),
('T', 'A-6', 'Uso del cuerpo de otro', 'Lenguaje y Comunicación', 8, 'N/A (escasa o inexistente comunicación espontánea; o no se ha aplicado Bloqueo de juguetes y no se ha utilizado el cuerpo de otro).'),

('T', 'A-7', 'Señalar', 'Lenguaje y Comunicación', 0, 'Señala con el dedo índice para mostrar una referencia dirigida visualmente (mirada coordinada hacia el objeto y la persona) a objetos que están a distancia, en al menos dos actividades.'),
('T', 'A-7', 'Señalar', 'Lenguaje y Comunicación', 1, 'Señala para referirse a objetos, pero sin la flexibilidad ni la frecuencia suficiente; o produce una aproximación a la acción de señalar; o coordina la mirada o la vocalización únicamente con la acción de señalar que incluye tocar objetos cercanos.'),
('T', 'A-7', 'Señalar', 'Lenguaje y Comunicación', 2, 'Señala únicamente cuando está cerca de tocar o está tocando un objeto, sin que se coordine con la mirada o una vocalización.'),
('T', 'A-7', 'Señalar', 'Lenguaje y Comunicación', 3, 'No señala objetos de ninguna de las maneras descritas anteriormente.'),

('T', 'A-8', 'Gestos', 'Lenguaje y Comunicación', 0, 'Uso espontáneo de al menos tres gestos diferentes de cualquier tipo; por lo menos uno se debe usar en más de una actividad.'),
('T', 'A-8', 'Gestos', 'Lenguaje y Comunicación', 1, 'Uso espontáneo de al menos dos gestos descriptivos, convencionales, instrumentales o emocionales; o de tres o más gestos pero cada gesto se utiliza solo en una actividad.'),
('T', 'A-8', 'Gestos', 'Lenguaje y Comunicación', 2, 'Uso espontáneo de solo un gesto o de un gesto comunicativo para alcanzar objetos; o uso solo de gestos solicitados o imitados.'),
('T', 'A-8', 'Gestos', 'Lenguaje y Comunicación', 3, 'No hay un uso espontáneo, solicitado ni imitado de gestos descriptivos, convencionales, instrumentales o emocionales; o solo hay un uso inapropiado.'),
('T', 'A-8', 'Gestos', 'Lenguaje y Comunicación', 8, 'N/A (limitado por alguna dificultad motora severa).'),

('T', 'A-9', 'Frecuencia de vocalización no dirigida', 'Lenguaje y Comunicación', 0, 'Pocas vocalizaciones no dirigidas.'),
('T', 'A-9', 'Frecuencia de vocalización no dirigida', 'Lenguaje y Comunicación', 1, 'Varias vocalizaciones no dirigidas en una actividad; o vocalizaciones no dirigidas infrecuentes en varias actividades.'),
('T', 'A-9', 'Frecuencia de vocalización no dirigida', 'Lenguaje y Comunicación', 2, 'Vocalizaciones no dirigidas frecuentes; puede incluir también vocalizaciones socialmente dirigidas.'),
('T', 'A-9', 'Frecuencia de vocalización no dirigida', 'Lenguaje y Comunicación', 3, 'Vocalizaciones no dirigidas frecuentes y casi todas las vocalizaciones no son dirigidas.'),
('T', 'A-9', 'Frecuencia de vocalización no dirigida', 'Lenguaje y Comunicación', 8, 'Nunca o casi nunca vocaliza.'),

-- B. Interacción Social Recíproca
('T', 'B-1', 'Contacto visual inusual', 'Interacción Social Recíproca', 0, 'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.'),
('T', 'B-1', 'Contacto visual inusual', 'Interacción Social Recíproca', 1, 'Mirada dirigida evidente con alguna modulación; sin embargo, no es consistente o no combina cambios sutiles con otro tipo de comunicación.'),
('T', 'B-1', 'Contacto visual inusual', 'Interacción Social Recíproca', 2, 'Establece un contacto visual modulado de manera pobre para iniciar, terminar o regular una interacción social.'),
('T', 'B-1', 'Contacto visual inusual', 'Interacción Social Recíproca', 3, 'Establece un contacto visual modulado de manera pobre para iniciar, terminar o regular una interacción social y evita activamente el contacto visual de manera frecuente.'),

('T', 'B-2', 'Expresiones faciales dirigidas a otros', 'Interacción Social Recíproca', 0, 'Dirige diversas expresiones faciales apropiadas al familiar o cuidador o al examinador con la intención de comunicar estados emocionales o cognitivos.'),
('T', 'B-2', 'Expresiones faciales dirigidas a otros', 'Interacción Social Recíproca', 1, 'Dirige algunas expresiones faciales al examinador o al familiar o cuidador (p. ej., en los extremos emocionales). Se le puede asignar este código a un niño que dirija pocas expresiones faciales pero que dirija la mayoría de sus expresiones a otra persona.'),
('T', 'B-2', 'Expresiones faciales dirigidas a otros', 'Interacción Social Recíproca', 2, 'Utiliza cierta variedad de expresiones faciales pero poco dirigidas o dirige una sola expresión facial.'),
('T', 'B-2', 'Expresiones faciales dirigidas a otros', 'Interacción Social Recíproca', 3, 'Variedad limitada de expresiones faciales y no dirigidas.'),

('T', 'B-3', 'Juego imposible', 'Interacción Social Recíproca', 0, 'Establece contacto visual en los dos ensayos (debe ser con el examinador).'),
('T', 'B-3', 'Juego imposible', 'Interacción Social Recíproca', 1, 'Establece contacto visual en un solo ensayo (debe ser con el examinador).'),
('T', 'B-3', 'Juego imposible', 'Interacción Social Recíproca', 2, 'No establece contacto visual, pero muestra conciencia de la situación mediante la vocalización y otros medios (distintos a mover la mano o el cuerpo del examinador).'),
('T', 'B-3', 'Juego imposible', 'Interacción Social Recíproca', 3, 'Mueve la mano del examinador sin establecer contacto visual; o no responde a ninguna de las presiones.'),

('T', 'B-4', 'Juego de broma', 'Interacción Social Recíproca', 0, 'Establece contacto visual en los dos ensayos (debe ser con el examinador).'),
('T', 'B-4', 'Juego de broma', 'Interacción Social Recíproca', 1, 'Establece contacto visual en un solo ensayo (debe ser con el examinador).'),
('T', 'B-4', 'Juego de broma', 'Interacción Social Recíproca', 2, 'No establece contacto visual, pero muestra conciencia de la situación mediante la vocalización y otros medios (distintos a mover la mano o el cuerpo del examinador).'),
('T', 'B-4', 'Juego de broma', 'Interacción Social Recíproca', 3, 'Mueve la mano del examinador sin establecer contacto visual; o no responde a ninguna de las presiones.'),
('T', 'B-4', 'Juego de broma', 'Interacción Social Recíproca', 8, 'N/A.'),

('T', 'B-5', 'Integración de la mirada y otras conductas durante las iniciaciones sociales', 'Interacción Social Recíproca', 0, 'Normalmente utiliza un contacto visual adecuado junto con palabras o vocalizaciones o gestos para comunicar una intención social.'),
('T', 'B-5', 'Integración de la mirada y otras conductas durante las iniciaciones sociales', 'Interacción Social Recíproca', 1, 'Utiliza tanto el contacto visual como otras estrategias para comunicar una intención social en momentos diferentes, pero no los coordina entre sí. También si integra ocasionalmente el contacto visual con palabras o vocalizaciones o gestos.'),
('T', 'B-5', 'Integración de la mirada y otras conductas durante las iniciaciones sociales', 'Interacción Social Recíproca', 2, 'Utiliza principalmente una estrategia (contacto visual, vocalizaciones o gestos) para comunicar intención social, sin integrarlos.'),
('T', 'B-5', 'Integración de la mirada y otras conductas durante las iniciaciones sociales', 'Interacción Social Recíproca', 3, 'Utiliza pocas veces alguna estrategia comunicativa para comunicar intención social; o no hay iniciaciones sociales.'),

('T', 'B-6', 'Disfrute compartido durante la interacción', 'Interacción Social Recíproca', 0, 'Da muestras claras de disfrute con el examinador que son adecuadas al contexto y que ocurren en más de una actividad. Debe incluir disfrute en al menos una actividad que no sea de naturaleza puramente física.'),
('T', 'B-6', 'Disfrute compartido durante la interacción', 'Interacción Social Recíproca', 1, 'Da muestras claras de disfrute dirigidas al examinador durante una sola interacción (puede ser de naturaleza física).'),
('T', 'B-6', 'Disfrute compartido durante la interacción', 'Interacción Social Recíproca', 2, 'Muestra cierto disfrute apropiado en la interacción con el examinador o puede mostrar disfrute en la interacción con el familiar o cuidador.'),
('T', 'B-6', 'Disfrute compartido durante la interacción', 'Interacción Social Recíproca', 3, 'Muestra poco o ningún disfrute en la interacción con el examinador o el familiar o cuidador. Puede mostrar disfrute en sus propias acciones o en los juguetes.'),

('T', 'B-7', 'Respuesta al nombre', 'Interacción Social Recíproca', 0, 'Mira hacia la cara del examinador inmediatamente en por lo menos una de las dos primeras presiones realizadas por el examinador.'),
('T', 'B-7', 'Respuesta al nombre', 'Interacción Social Recíproca', 1, 'Mira hacia el familiar o cuidador después del primer o segundo intento de llamarle solo por su nombre; o mira hacia el examinador después del tercer o cuarto intento.'),
('T', 'B-7', 'Respuesta al nombre', 'Interacción Social Recíproca', 2, 'No mira hacia el examinador o el familiar o cuidador inmediatamente después de que se le haya llamado por su nombre en seis ocasiones, sino que mira solamente después de una vocalización o verbalización que le resulte interesante o familiar.'),
('T', 'B-7', 'Respuesta al nombre', 'Interacción Social Recíproca', 3, 'No mira hacia el examinador o al familiar o cuidador después de cualquier intento puramente verbal u oral para intentar conseguir su atención. Puede mirar en respuesta a que le toquen.'),

('T', 'B-8', 'Ignorar', 'Interacción Social Recíproca', 0, 'Demanda de atención clara, con mirada y vocalización integradas dirigidas hacia el examinador o el familiar o cuidador.'),
('T', 'B-8', 'Ignorar', 'Interacción Social Recíproca', 1, 'Demanda de atención clara, con mirada y vocalización hacia el examinador o familiar pero sin estar integradas; o demanda de atención clara con gestos y verbalización pero sin mirarles; o mirada y gestos sin vocalización.'),
('T', 'B-8', 'Ignorar', 'Interacción Social Recíproca', 2, 'Mira o vocaliza o hace gestos al examinador o al familiar; o mira a su alrededor incluyendo al examinador o al familiar; o se produce demanda de atención dudosa.'),
('T', 'B-8', 'Ignorar', 'Interacción Social Recíproca', 3, 'Comportamiento agitado o no dirigido hacia el examinador o el familiar o cuidador.'),

('T', 'B-9', 'Pedir', 'Interacción Social Recíproca', 0, 'Exhibe una integración apropiada del contacto visual y de por lo menos un comportamiento más para pedir en más de una actividad. Debe incluir el establecimiento del contacto visual con el adulto y una indicación clara de que quiere que el adulto haga o le dé algo.'),
('T', 'B-9', 'Pedir', 'Interacción Social Recíproca', 1, 'Exhibe los comportamientos descritos en el código 0 pero ocurren solo en una actividad.'),
('T', 'B-9', 'Pedir', 'Interacción Social Recíproca', 2, 'Realiza uno o más de los comportamientos descritos para pedir sin integrar el contacto visual con otros comportamientos como vocalizaciones o gestos. Incluye alcanzarle un objeto a un adulto sin mirarlo, o mirarlo sin otro comportamiento que lo acompañe.'),
('T', 'B-9', 'Pedir', 'Interacción Social Recíproca', 3, 'No hace una petición directa. Puede participar en la rutina o tratar de activar el objeto mediante vocalizaciones no dirigidas o golpeando sin mirar a otra persona. Puede incluir que tire de la mano del examinador hacia un objeto.'),

('T', 'B-10', 'Cantidad de peticiones', 'Interacción Social Recíproca', 0, 'Realiza peticiones a lo largo de las actividades frecuentemente.'),
('T', 'B-10', 'Cantidad de peticiones', 'Interacción Social Recíproca', 1, 'Realiza peticiones a lo largo de las actividades pocas veces.'),
('T', 'B-10', 'Cantidad de peticiones', 'Interacción Social Recíproca', 2, 'Realiza peticiones solo en una actividad (p. ej., durante la merienda).'),
('T', 'B-10', 'Cantidad de peticiones', 'Interacción Social Recíproca', 3, 'No realiza peticiones o solo hace peticiones confusas.'),

('T', 'B-11', 'Dar', 'Interacción Social Recíproca', 0, 'Entrega espontáneamente juguetes u objetos a otras personas durante la evaluación. Debe incluir al menos un ejemplo claro de entregar juguetes, comida o comida de juguete con el propósito de compartir.'),
('T', 'B-11', 'Dar', 'Interacción Social Recíproca', 1, 'Da objetos a otras personas de manera consistente con el propósito de recibir ayuda, como parte de una rutina o con una intención ambigua.'),
('T', 'B-11', 'Dar', 'Interacción Social Recíproca', 2, 'Da objetos a veces, tal y como se ha descrito para el código 1.'),
('T', 'B-11', 'Dar', 'Interacción Social Recíproca', 3, 'Nunca o casi nunca da algo a otra persona.'),

('T', 'B-12', 'Mostrar', 'Interacción Social Recíproca', 0, 'Muestra espontáneamente juguetes u objetos durante la evaluación, sosteniéndolos o colocándolos delante de un adulto y estableciendo contacto visual con o sin vocalización.'),
('T', 'B-12', 'Mostrar', 'Interacción Social Recíproca', 1, 'Solo un ejemplo claro de mostrar, tal y como se describe para un código 0.'),
('T', 'B-12', 'Mostrar', 'Interacción Social Recíproca', 2, 'Muestra juguetes u objetos de una manera parcial o inconsistente (p. ej., sostiene un objeto o lo coloca delante de un adulto sin coordinarlo con el contacto visual).'),
('T', 'B-12', 'Mostrar', 'Interacción Social Recíproca', 3, 'No muestra objetos a otra persona.'),

('T', 'B-13', 'Iniciación espontánea de la atención conjunta', 'Interacción Social Recíproca', 0, 'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto que está fuera del alcance mirando primero al objeto, luego al examinador o familiar y nuevamente al objeto. Un ejemplo claro es suficiente.'),
('T', 'B-13', 'Iniciación espontánea de la atención conjunta', 'Interacción Social Recíproca', 1, 'Mira el objeto y luego mira al examinador o al familiar o cuidador, pero no vuelve a mirar al objeto.'),
('T', 'B-13', 'Iniciación espontánea de la atención conjunta', 'Interacción Social Recíproca', 2, 'Hace referencias parciales a un objeto que está fuera del alcance. Puede mirar al objeto o señalar o vocalizar, pero no coordina ninguna de estas acciones con mirar a otra persona.'),
('T', 'B-13', 'Iniciación espontánea de la atención conjunta', 'Interacción Social Recíproca', 3, 'No hay una aproximación a una iniciación espontánea de atención conjunta para dirigir la atención de otra persona hacia un objeto que está fuera del alcance del niño.'),

('T', 'B-14', 'Respuesta a la atención conjunta', 'Interacción Social Recíproca', 0, 'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin que haya necesidad de señalar.'),
('T', 'B-14', 'Respuesta a la atención conjunta', 'Interacción Social Recíproca', 1, 'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.'),
('T', 'B-14', 'Respuesta a la atención conjunta', 'Interacción Social Recíproca', 2, 'No sigue la mirada del examinador ni su acción de señalar, pero mira hacia el objeto cuando se activa.'),
('T', 'B-14', 'Respuesta a la atención conjunta', 'Interacción Social Recíproca', 3, 'No se orienta hacia el objeto incluso cuando este está activado.'),

('T', 'B-15', 'Características de las iniciaciones sociales', 'Interacción Social Recíproca', 0, 'Uso efectivo de formas no verbales y verbales con la intención de realizar iniciaciones sociales claras hacia el examinador o hacia el familiar o cuidador. Apropiadas a los contextos inmediatos.'),
('T', 'B-15', 'Características de las iniciaciones sociales', 'Interacción Social Recíproca', 1, 'Las iniciaciones sociales tienen características ligeramente inusuales. Se restringen a demandas personales o están relacionadas con intereses marcados, pero con alguna intención de implicar al familiar o al examinador en esos intereses.'),
('T', 'B-15', 'Características de las iniciaciones sociales', 'Interacción Social Recíproca', 2, 'Las iniciaciones a menudo carecen de integración en el contexto; o de naturaleza social. Se asigna si muestra alguna iniciación social claramente inapropiada.'),
('T', 'B-15', 'Características de las iniciaciones sociales', 'Interacción Social Recíproca', 3, 'No hay iniciaciones sociales de ningún tipo.'),

('T', 'B-16a', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR', 'Interacción Social Recíproca', 0, 'Intentos frecuentes de captar o mantener la atención del examinador o de dirigirla hacia objetos o acciones interesantes para el niño.'),
('T', 'B-16a', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR', 'Interacción Social Recíproca', 1, 'Algunos intentos de captar, mantener o dirigir la atención del examinador, pero se observan con escasa frecuencia o en pocas actividades diferentes.'),
('T', 'B-16a', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR', 'Interacción Social Recíproca', 2, 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del examinador, incluyendo iniciaciones que únicamente tienen la intención de buscar consuelo.'),
('T', 'B-16a', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR', 'Interacción Social Recíproca', 3, 'Muestra relativamente poca preocupación con respecto a si el examinador está prestándole atención o no a menos que necesite ayuda.'),
('T', 'B-16a', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR', 'Interacción Social Recíproca', 7, 'Demandas de atención inusualmente frecuentes, intensas o excesivas.'),

('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 0, 'Intentos frecuentes de captar o mantener la atención del familiar o cuidador o de dirigirla hacia objetos o acciones interesantes para el niño.'),
('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 1, 'Algunos intentos de captar, mantener o dirigir la atención del familiar o cuidador, pero se observan con escasa frecuencia o en pocas actividades diferentes.'),
('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 2, 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del familiar o cuidador, incluyendo iniciaciones que tienen únicamente la intención de buscar consuelo.'),
('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 3, 'Muestra relativamente poca preocupación con respecto a si el familiar o cuidador está prestándole atención o no a menos que necesite ayuda.'),
('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 7, 'Demandas de atención inusualmente frecuentes, intensas o excesivas.'),
('T', 'B-16b', 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR', 'Interacción Social Recíproca', 8, 'El familiar o cuidador no estuvo presente durante la aplicación del ADOS-2.'),

('T', 'B-17', 'Nivel de implicación', 'Interacción Social Recíproca', 0, 'Se implica espontáneamente y se muestra interesado en las actividades que le presenta el examinador de manera consistente.'),
('T', 'B-17', 'Nivel de implicación', 'Interacción Social Recíproca', 1, 'Se implica espontáneamente de forma inconsistente.'),
('T', 'B-17', 'Nivel de implicación', 'Interacción Social Recíproca', 2, 'Se implica solo cuando el examinador se esfuerza en obtener y mantener el interés del niño.'),
('T', 'B-17', 'Nivel de implicación', 'Interacción Social Recíproca', 3, 'No se implica ni cuando el examinador se esfuerza en atraer el interés del niño, o el niño se implica durante la merienda o los juegos solo cuando se produce contacto físico.'),

('T', 'B-18', 'Calidad general de la relación', 'Interacción Social Recíproca', 0, 'La interacción entre el niño y el examinador es agradable y apropiada dentro del contexto de la evaluación del ADOS-2.'),
('T', 'B-18', 'Calidad general de la relación', 'Interacción Social Recíproca', 1, 'La interacción es agradable a veces, pero no de forma sostenida (a veces se ha sentido raro o poco natural, o el comportamiento del niño ha parecido mecánico o ligeramente inapropiado).'),
('T', 'B-18', 'Calidad general de la relación', 'Interacción Social Recíproca', 2, 'Interacción unilateral o inusual dando como resultado una sesión ligeramente incómoda de manera sistemática.'),
('T', 'B-18', 'Calidad general de la relación', 'Interacción Social Recíproca', 3, 'El niño muestra una consideración mínima hacia el examinador; o la observación es marcadamente difícil o incómoda durante una parte significativa del tiempo.'),

-- C. Juego
('T', 'C-1', 'Juego funcional con objetos', 'Juego', 0, 'Juega espontáneamente con diversos juguetes de una manera convencional, incluyendo juegos apropiados con varias miniaturas o juguetes figurativos diferentes.'),
('T', 'C-1', 'Juego funcional con objetos', 'Juego', 1, 'Realiza algo de juego funcional espontáneo con al menos una miniatura o juguete figurativo.'),
('T', 'C-1', 'Juego funcional con objetos', 'Juego', 2, 'Únicamente juega de manera adecuada con juguetes de causa y efecto o juguetes de construcción; o juega a empujar el coche de juguete.'),
('T', 'C-1', 'Juego funcional con objetos', 'Juego', 3, 'No juega con los juguetes o únicamente lo hace de manera estereotipada.'),

('T', 'C-2', 'Imaginación y creatividad', 'Juego', 0, 'Usa espontáneamente la muñeca u otro objeto como agente independiente; o usa espontáneamente los objetos para representar otros objetos.'),
('T', 'C-2', 'Imaginación y creatividad', 'Juego', 1, 'Realiza juego simbólico espontáneo con la muñeca u otros objetos, pero no emplea la muñeca u otros juguetes como agentes independientes o para representar otra cosa.'),
('T', 'C-2', 'Imaginación y creatividad', 'Juego', 2, 'Imita el juego simbólico como se describe en el código 1; o lo imita con un sustituto; pero no hay juego simbólico espontáneo.'),
('T', 'C-2', 'Imaginación y creatividad', 'Juego', 3, 'No hay juego simbólico espontáneo ni imitado.'),

('T', 'C-3', 'Imitación funcional y simbólica', 'Juego', 0, 'El niño utiliza el sustituto como un objeto que no ha sido previamente presentado.'),
('T', 'C-3', 'Imitación funcional y simbólica', 'Juego', 1, 'El niño utiliza el sustituto como un objeto que ha sido previamente presentado.'),
('T', 'C-3', 'Imitación funcional y simbólica', 'Juego', 2, 'El niño imita el uso de un objeto real previamente presentado.'),
('T', 'C-3', 'Imitación funcional y simbólica', 'Juego', 3, 'No se produce imitación tal y como se define en los códigos anteriores.'),

-- D. Comportamientos Estereotipados e Intereses Restringidos
('T', 'D-1', 'Interés sensorial inusual en los materiales de juego o en las personas', 'Comportamientos Estereotipados e Intereses Restringidos', 0, 'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.'),
('T', 'D-1', 'Interés sensorial inusual en los materiales de juego o en las personas', 'Comportamientos Estereotipados e Intereses Restringidos', 1, 'Varios intereses sensoriales posibles pero no tan claros como los especificados para el código 2; o solo se observa claramente un caso de interés sensorial inusual.'),
('T', 'D-1', 'Interés sensorial inusual en los materiales de juego o en las personas', 'Comportamientos Estereotipados e Intereses Restringidos', 2, 'Interés evidente por elementos sensoriales de los objetos o de los materiales de juego; o examen sensorial de sí mismo o de otros. Deben observarse dos o más ejemplos claros.'),
('T', 'D-1', 'Interés sensorial inusual en los materiales de juego o en las personas', 'Comportamientos Estereotipados e Intereses Restringidos', 3, 'Comportamientos evidentes e inusuales de búsqueda sensorial que ocurren durante al menos dos tareas o actividades diferentes y que pueden interferir con la evaluación del ADOS-2.'),

('T', 'D-2', 'Movimientos de manos y dedos / postura', 'Comportamientos Estereotipados e Intereses Restringidos', 0, 'Ninguno.'),
('T', 'D-2', 'Movimientos de manos y dedos / postura', 'Comportamientos Estereotipados e Intereses Restringidos', 1, 'Movimientos inusuales o repetitivos que no son tan claros como lo que se especifica para los códigos 2 y 3.'),
('T', 'D-2', 'Movimientos de manos y dedos / postura', 'Comportamientos Estereotipados e Intereses Restringidos', 2, 'Hay manierismos de manos y dedos evidentes. Si son claros, pueden ser breves o infrecuentes.'),
('T', 'D-2', 'Movimientos de manos y dedos / postura', 'Comportamientos Estereotipados e Intereses Restringidos', 3, 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.'),

('T', 'D-3', 'Otros manierismos complejos', 'Comportamientos Estereotipados e Intereses Restringidos', 0, 'Ninguno.'),
('T', 'D-3', 'Otros manierismos complejos', 'Comportamientos Estereotipados e Intereses Restringidos', 1, 'Manierismos inusuales o repetitivos que no son tan claros como lo que se especifica para los códigos 2 y 3.'),
('T', 'D-3', 'Otros manierismos complejos', 'Comportamientos Estereotipados e Intereses Restringidos', 2, 'Hay manierismos complejos evidentes. Si son claros, pueden ser breves o infrecuentes.'),
('T', 'D-3', 'Otros manierismos complejos', 'Comportamientos Estereotipados e Intereses Restringidos', 3, 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.'),

('T', 'D-4', 'Conducta autolesiva', 'Comportamientos Estereotipados e Intereses Restringidos', 0, 'No intenta autolesionarse.'),
('T', 'D-4', 'Conducta autolesiva', 'Comportamientos Estereotipados e Intereses Restringidos', 1, 'Autolesión dudosa o posible.'),
('T', 'D-4', 'Conducta autolesiva', 'Comportamientos Estereotipados e Intereses Restringidos', 2, 'Autolesión infrecuente pero clara (al menos se observa un ejemplo claro de morderse su propia mano, de tirarse del pelo, de abofetearse su propia cara o de golpearse la cabeza).'),
('T', 'D-4', 'Conducta autolesiva', 'Comportamientos Estereotipados e Intereses Restringidos', 3, 'Más de un ejemplo claro de autolesión, como golpearse la cabeza, abofetearse la propia cara, tirarse del pelo o morderse.'),

('T', 'D-5', 'Intereses inusualmente repetitivos o comportamientos estereotipados', 'Comportamientos Estereotipados e Intereses Restringidos', 0, 'No hubo comportamientos repetitivos ni estereotipados durante la evaluación con el ADOS-2.'),
('T', 'D-5', 'Intereses inusualmente repetitivos o comportamientos estereotipados', 'Comportamientos Estereotipados e Intereses Restringidos', 1, 'Un interés o comportamiento que es repetitivo o estereotipado hasta el punto de ser inusual. Este interés o comportamiento surge durante otras actividades y no interfiere con las actividades del ADOS-2.'),
('T', 'D-5', 'Intereses inusualmente repetitivos o comportamientos estereotipados', 'Comportamientos Estereotipados e Intereses Restringidos', 2, 'Intereses o comportamientos claramente repetitivos o estereotipados. Constituyen una minoría sustancial de los intereses y comportamientos espontáneos del niño y pueden interferir con la capacidad del niño para completar las actividades del ADOS-2.'),
('T', 'D-5', 'Intereses inusualmente repetitivos o comportamientos estereotipados', 'Comportamientos Estereotipados e Intereses Restringidos', 3, 'Los intereses o comportamientos repetitivos o estereotipados constituyen la mayoría de los intereses del niño; o el niño muestra resistencia o gran angustia ante los intentos de dirigir su atención hacia otros objetos o actividades.'),

-- E. Otros Comportamientos
('T', 'E-1', 'Elevado nivel de actividad', 'Otros Comportamientos', 0, 'Se sienta o se queda quieto adecuadamente cuando se espera que lo haga durante la evaluación con el ADOS-2. Puede explorar la habitación como sería esperable para su nivel de desarrollo.'),
('T', 'E-1', 'Elevado nivel de actividad', 'Otros Comportamientos', 1, 'Se sienta o se queda quieto cuando se espera claramente que lo haga en actividades distintas de la merienda, pero se mueve constantemente o se levanta del asiento.'),
('T', 'E-1', 'Elevado nivel de actividad', 'Otros Comportamientos', 2, 'Inquieto; es más activo que otros niños de su mismo nivel de desarrollo.'),
('T', 'E-1', 'Elevado nivel de actividad', 'Otros Comportamientos', 3, 'Se mueve sin parar y de manera enérgica de un lado al otro de la habitación, de una manera que resulta difícil interrumpirlo; el nivel de actividad interfiere con la evaluación.'),
('T', 'E-1', 'Elevado nivel de actividad', 'Otros Comportamientos', 7, 'Muy quieto, muy poca actividad.'),

('T', 'E-2', 'Lloriqueo e irritabilidad', 'Otros Comportamientos', 0, 'No muestra lloriqueo ni irritabilidad durante la evaluación del ADOS-2, o muestra ocasionalmente un lloriqueo o una irritabilidad leve que dura menos de 3 segundos.'),
('T', 'E-2', 'Lloriqueo e irritabilidad', 'Otros Comportamientos', 1, 'Muestra ocasionalmente una irritabilidad leve que dura al menos de 3 a 5 segundos.'),
('T', 'E-2', 'Lloriqueo e irritabilidad', 'Otros Comportamientos', 2, 'Muestra susceptibilidad o irritabilidad de forma repetida. Se incluye aquí cualquier grito en voz alta.'),
('T', 'E-2', 'Lloriqueo e irritabilidad', 'Otros Comportamientos', 3, 'Tiene berrinches con o sin alguna muestra de agresión.'),

('T', 'E-3', 'Comportamiento agresivo o disruptivo', 'Otros Comportamientos', 0, 'No se muestra agresivo ni disruptivo de manera intencional durante la evaluación con el ADOS-2.'),
('T', 'E-3', 'Comportamiento agresivo o disruptivo', 'Otros Comportamientos', 1, 'Ocasionalmente muestra comportamientos leves de agresión o intencionalmente disruptivos.'),
('T', 'E-3', 'Comportamiento agresivo o disruptivo', 'Otros Comportamientos', 2, 'Muestra comportamientos leves de agresión o intencionalmente disruptivos de manera repetida.'),
('T', 'E-3', 'Comportamiento agresivo o disruptivo', 'Otros Comportamientos', 3, 'Exhibe uno o varios comportamientos claros de agresión de intensidad significativa.'),

('T', 'E-4', 'Ansiedad', 'Otros Comportamientos', 0, 'No hay una ansiedad evidente o muestra un recelo inicial breve.'),
('T', 'E-4', 'Ansiedad', 'Otros Comportamientos', 1, 'Signos leves de ansiedad; o muestra una ansiedad leve y prolongada ante los desconocidos.'),
('T', 'E-4', 'Ansiedad', 'Otros Comportamientos', 2, 'Ansiedad marcada solo en respuesta a una petición concreta o a un juguete o tarea en particular; o ansiedad marcada y persistente ante los desconocidos.'),
('T', 'E-4', 'Ansiedad', 'Otros Comportamientos', 3, 'Ansiedad marcada en respuesta a más de un juguete o tarea o en varias ocasiones a lo largo de la evaluación del ADOS-2.')

ON CONFLICT (module, item_code, score_value) DO NOTHING;
