-- ═══════════════════════════════════════════════════════════
-- ADOS-2 Módulo 2: Descripciones de puntaje por ítem
-- ═══════════════════════════════════════════════════════════

INSERT INTO ados2_score_descriptions (module, item_code, item_name, domain, score_value, description) VALUES
-- A1. Nivel general de lenguaje oral no ecolálico
('2','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',0,'Habla con frases no ecolálicas de tres o más palabras por verbalización; algunos marcadores gramaticales.'),
('2','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',1,'El habla consiste principalmente en verbalizaciones de dos o tres palabras, con pocos o ningún marcador gramatical.'),
('2','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',2,'El uso de frases es ocasional, generalmente utiliza palabras sueltas.'),
('2','A-1','Nivel general de lenguaje oral no ecolálico','Lenguaje y Comunicación',3,'Únicamente palabras sueltas; o toda el habla es ecolálica con o sin intención comunicativa; o no hay lenguaje hablado.'),

-- A2. Anormalidades del habla asociadas al autismo
('2','A-2','Anormalidades del habla asociadas al autismo','Lenguaje y Comunicación',0,'Entonación que varía adecuadamente, volumen razonable y velocidad normal del habla, con un ritmo regular coordinado con la respiración.'),
('2','A-2','Anormalidades del habla asociadas al autismo','Lenguaje y Comunicación',1,'Poca variación de timbre y tono; más bien entonación plana o exagerada, pero no claramente peculiar; o volumen levemente inusual; o habla inusualmente lenta, rápida o espasmódica.'),
('2','A-2','Anormalidades del habla asociadas al autismo','Lenguaje y Comunicación',2,'Habla claramente anormal: lenta y vacilante; inapropiadamente rápida; ritmo entrecortado e irregular; entonación rara o timbre y acento inapropiados; marcadamente plana o mecánica; volumen consistentemente anormal.'),
('2','A-2','Anormalidades del habla asociadas al autismo','Lenguaje y Comunicación',7,'Tartamudeo u otro trastorno de la fluidez verbal.'),
('2','A-2','Anormalidades del habla asociadas al autismo','Lenguaje y Comunicación',8,'El habla no tiene la suficiente frecuencia o complejidad como para evaluar su entonación, ritmo o velocidad.'),

-- A3. Ecolalia inmediata
('2','A-3','Ecolalia inmediata','Lenguaje y Comunicación',0,'No repite el habla de otra persona.'),
('2','A-3','Ecolalia inmediata','Lenguaje y Comunicación',1,'Eco ocasional del lenguaje.'),
('2','A-3','Ecolalia inmediata','Lenguaje y Comunicación',2,'Repite palabras o frases con regularidad, pero también muestra algo de lenguaje espontáneo.'),
('2','A-3','Ecolalia inmediata','Lenguaje y Comunicación',3,'El habla consiste principalmente en ecolalia inmediata.'),

-- A4. Uso estereotipado o idiosincrásico de palabras o frases
('2','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',0,'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas.'),
('2','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',1,'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o emplea palabras raras.'),
('2','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',2,'A menudo usa vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.'),
('2','A-4','Uso estereotipado o idiosincrásico de palabras o frases','Lenguaje y Comunicación',3,'Utiliza frecuentemente habla rara o estereotipada y casi nunca usa un habla espontánea no estereotipada.'),

-- A5. Conversación
('2','A-5','Conversación','Lenguaje y Comunicación',0,'La conversación fluye, construyéndose sobre el diálogo del examinador, con secuencias de al menos cuatro elementos de intercambio recíproco.'),
('2','A-5','Conversación','Lenguaje y Comunicación',1,'Parte del habla incluye algo de elaboración espontánea o da pie a que el examinador pueda seguir la conversación, pero la cantidad es menor a la esperada o es limitada en flexibilidad.'),
('2','A-5','Conversación','Lenguaje y Comunicación',2,'Poca conversación recíproca sostenida; puede seguir su propio pensamiento más que participar en un intercambio; escasa sensación de reciprocidad.'),
('2','A-5','Conversación','Lenguaje y Comunicación',3,'Escasa habla comunicativa espontánea. Puede emitir algunas respuestas limitadas a las iniciaciones del examinador, pero muy escasas.'),

-- A6. Señalar
('2','A-6','Señalar','Lenguaje y Comunicación',0,'Señala con el dedo índice con referencia dirigida visualmente (mirada coordinada) a un objeto a distancia para expresar interés.'),
('2','A-6','Señalar','Lenguaje y Comunicación',1,'Señala para referirse a objetos y expresar interés, pero sin suficiente flexibilidad; o produce una aproximación coordinada con mirada o vocalización; o señala únicamente para pedir algo.'),
('2','A-6','Señalar','Lenguaje y Comunicación',2,'Señala únicamente sin coordinación con la mirada o vocalización y sin propósito de expresar interés.'),
('2','A-6','Señalar','Lenguaje y Comunicación',3,'No señala como se ha descrito anteriormente.'),

-- A7. Gestos descriptivos, convencionales, instrumentales o informativos
('2','A-7','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',0,'Uso espontáneo de varios gestos descriptivos. Puede usar además gestos convencionales o instrumentales.'),
('2','A-7','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',1,'Algún uso espontáneo de gestos descriptivos, pero exagerados, poco variados o en pocos contextos; o uso frecuente de gestos convencionales o instrumentales, pero poco o ningún uso de gestos descriptivos.'),
('2','A-7','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',2,'Algún uso espontáneo de gestos informativos, convencionales o instrumentales, pero uso excepcional o ningún uso de gestos descriptivos.'),
('2','A-7','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',3,'Ausencia o uso muy limitado de gestos convencionales, instrumentales, informativos o descriptivos. Incluye agarrar y alcanzar con fines comunicativos.'),
('2','A-7','Gestos descriptivos, convencionales, instrumentales o informativos','Lenguaje y Comunicación',8,'N/A (limitado por alguna dificultad motora severa).'),

-- B1. Contacto visual inusual
('2','B-1','Contacto visual inusual','Interacción Social Recíproca',0,'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.'),
('2','B-1','Contacto visual inusual','Interacción Social Recíproca',2,'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.'),

-- B2. Expresiones faciales dirigidas a otros
('2','B-2','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',0,'Dirige al familiar o cuidador o al examinador diversas expresiones faciales apropiadas con la intención de comunicar estados emocionales o cognitivos.'),
('2','B-2','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',1,'Dirige algunas expresiones faciales al examinador o al familiar o cuidador, pero de forma limitada o solo con emociones extremas.'),
('2','B-2','Expresiones faciales dirigidas a otros','Interacción Social Recíproca',2,'No dirige expresiones faciales apropiadas a los demás.'),

-- B3. Disfrute compartido durante la interacción
('2','B-3','Disfrute compartido durante la interacción','Interacción Social Recíproca',0,'Da muestras claras de disfrute con el examinador adecuadas al contexto en más de una actividad, incluyendo al menos una que no sea puramente física.'),
('2','B-3','Disfrute compartido durante la interacción','Interacción Social Recíproca',1,'Muestra cierto disfrute adecuado al contexto; o una muestra clara de disfrute en una sola interacción.'),
('2','B-3','Disfrute compartido durante la interacción','Interacción Social Recíproca',2,'Escaso o nulo disfrute en la interacción con el examinador, pero muestra disfrute en sus propias actividades o con el familiar.'),
('2','B-3','Disfrute compartido durante la interacción','Interacción Social Recíproca',3,'Poco o nulo disfrute expresado durante la evaluación y poco interés en los juguetes.'),

-- B4. Respuesta al nombre
('2','B-4','Respuesta al nombre','Interacción Social Recíproca',0,'Mira hacia el examinador y establece contacto visual inmediatamente en al menos uno de los dos primeros intentos.'),
('2','B-4','Respuesta al nombre','Interacción Social Recíproca',1,'Mira hacia el familiar o cuidador y establece contacto visual después del primer o segundo intento; o responde al tercer o cuarto intento del examinador.'),
('2','B-4','Respuesta al nombre','Interacción Social Recíproca',2,'No establece contacto visual después de haberle llamado por su nombre en seis ocasiones, pero cambia la orientación de la mirada brevemente.'),

-- B5. Mostrar
('2','B-5','Mostrar','Interacción Social Recíproca',0,'Muestra espontáneamente juguetes u objetos, sosteniéndolos delante de un adulto y estableciendo contacto visual.'),
('2','B-5','Mostrar','Interacción Social Recíproca',1,'Muestra juguetes de manera parcial o inconsistente; o muestra objetos solo en una ocasión.'),
('2','B-5','Mostrar','Interacción Social Recíproca',2,'No muestra objetos a otras personas.'),

-- B6. Iniciación espontánea de la atención conjunta
('2','B-6','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',0,'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto fuera del alcance (cambio de mirada de tres puntos).'),
('2','B-6','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',1,'Hace referencias parciales a un objeto fuera del alcance; puede mirar y señalar pero no coordina con mirar a otra persona.'),
('2','B-6','Iniciación espontánea de la atención conjunta','Interacción Social Recíproca',2,'No hay aproximación a una iniciación espontánea de atención conjunta.'),

-- B7. Respuesta a la atención conjunta
('2','B-7','Respuesta a la atención conjunta','Interacción Social Recíproca',0,'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin necesidad de señalar.'),
('2','B-7','Respuesta a la atención conjunta','Interacción Social Recíproca',1,'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.'),
('2','B-7','Respuesta a la atención conjunta','Interacción Social Recíproca',2,'No sigue la mirada ni la acción de señalar, pero mira hacia el objeto cuando se activa.'),
('2','B-7','Respuesta a la atención conjunta','Interacción Social Recíproca',3,'No se orienta hacia el objeto incluso cuando está activado.'),

-- B8. Características de las iniciaciones sociales
('2','B-8','Características de las iniciaciones sociales','Interacción Social Recíproca',0,'Uso efectivo de formas verbales y no verbales con intención de realizar iniciaciones sociales claras y apropiadas al contexto.'),
('2','B-8','Características de las iniciaciones sociales','Interacción Social Recíproca',1,'Las iniciaciones sociales tienen características ligeramente inusuales; se restringen a demandas personales o intereses marcados, pero con alguna intención de implicar al examinador.'),
('2','B-8','Características de las iniciaciones sociales','Interacción Social Recíproca',2,'Al menos una minoría importante de iniciaciones inapropiadas; muchas carecen de integración en el contexto o de naturaleza social.'),
('2','B-8','Características de las iniciaciones sociales','Interacción Social Recíproca',3,'No hay iniciaciones sociales de ningún tipo.'),

-- B9a. Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador
('2','B-9a','Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador','Interacción Social Recíproca',0,'Intentos frecuentes de captar o mantener la atención del examinador.'),
('2','B-9a','Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador','Interacción Social Recíproca',1,'Algunos intentos, pero con escasa frecuencia o en pocas actividades.'),
('2','B-9a','Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador','Interacción Social Recíproca',2,'Intentos ocasionales, incluyendo iniciaciones solo con intención de buscar consuelo.'),
('2','B-9a','Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador','Interacción Social Recíproca',3,'Relativamente poca preocupación con respecto a si el examinador le presta atención, a menos que necesite ayuda.'),
('2','B-9a','Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador','Interacción Social Recíproca',7,'Demandas de atención inusualmente frecuentes, intensas o excesivas.'),

-- B9b. Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',0,'Intentos frecuentes de captar o mantener la atención del familiar o cuidador.'),
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',1,'Algunos intentos, pero con escasa frecuencia o en pocas actividades.'),
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',2,'Intentos ocasionales, incluyendo iniciaciones solo con intención de buscar consuelo.'),
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',3,'Relativamente poca preocupación, a menos que necesite ayuda.'),
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',7,'Demandas de atención inusualmente frecuentes, intensas o excesivas.'),
('2','B-9b','Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador','Interacción Social Recíproca',8,'El familiar o cuidador no estuvo presente durante la aplicación del ADOS-2.'),

-- B10. Calidad de la respuesta social
('2','B-10','Calidad de la respuesta social','Interacción Social Recíproca',0,'Muestra una gama adecuada de respuestas variadas de acuerdo a las situaciones sociales.'),
('2','B-10','Calidad de la respuesta social','Interacción Social Recíproca',1,'Reacciona a la mayoría de los contextos sociales, pero de forma algo limitada, socialmente embarazosa, inapropiada o inconsistente.'),
('2','B-10','Calidad de la respuesta social','Interacción Social Recíproca',2,'Respuestas extrañas, estereotipadas o muy poco variadas o inapropiadas para el contexto.'),
('2','B-10','Calidad de la respuesta social','Interacción Social Recíproca',3,'Respuesta mínima o inexistente a los intentos del examinador por implicar al niño.'),

-- B11. Cantidad de comunicación social recíproca
('2','B-11','Cantidad de comunicación social recíproca','Interacción Social Recíproca',0,'Uso extenso de comportamientos verbales o no verbales para realizar un intercambio social (charlar, hacer comentarios, comportamientos no verbales con intención de reciprocidad).'),
('2','B-11','Cantidad de comunicación social recíproca','Interacción Social Recíproca',1,'Alguna comunicación social recíproca, pero reducida en frecuencia, cantidad o contextos.'),
('2','B-11','Cantidad de comunicación social recíproca','Interacción Social Recíproca',2,'La mayor parte de la comunicación está orientada a objetos o a responder preguntas; es ecolálica o tiene que ver con preocupaciones; poca o ninguna reciprocidad o charla social.'),
('2','B-11','Cantidad de comunicación social recíproca','Interacción Social Recíproca',3,'Escasa o nula comunicación con el examinador o el familiar.'),

-- B12. Calidad general de la relación
('2','B-12','Calidad general de la relación','Interacción Social Recíproca',0,'La interacción entre el niño y el examinador es agradable y apropiada.'),
('2','B-12','Calidad general de la relación','Interacción Social Recíproca',1,'La interacción es agradable a veces, pero no de forma sostenida.'),
('2','B-12','Calidad general de la relación','Interacción Social Recíproca',2,'Interacción unilateral o inusual dando como resultado una sesión ligeramente incómoda.'),
('2','B-12','Calidad general de la relación','Interacción Social Recíproca',3,'El niño muestra una consideración mínima hacia el examinador, o la sesión es marcadamente incómoda.'),

-- C1. Juego funcional con objetos
('2','C-1','Juego funcional con objetos','Juego',0,'Juega espontáneamente con diversos juguetes de manera convencional, incluyendo juegos con varias miniaturas o juguetes figurativos.'),
('2','C-1','Juego funcional con objetos','Juego',1,'Algo de juego funcional espontáneo con al menos una miniatura o juguete figurativo.'),
('2','C-1','Juego funcional con objetos','Juego',2,'Únicamente juega de manera adecuada con juguetes de causa y efecto o de construcción; o empuja el coche de juguete.'),
('2','C-1','Juego funcional con objetos','Juego',3,'No juega con los juguetes o únicamente lo hace de manera estereotipada.'),

-- C2. Imaginación y creatividad
('2','C-2','Imaginación y creatividad','Juego',0,'Variedad de juegos o actividades espontáneos, ingeniosos o creativos, incluyendo el uso de la muñeca como agente de acción.'),
('2','C-2','Imaginación y creatividad','Juego',1,'Algo de juego creativo espontáneo o juego simbólico, pero poco variado.'),
('2','C-2','Imaginación y creatividad','Juego',2,'Poco juego creativo espontáneo o juego simbólico, o solo se produce juego repetitivo o estereotipado.'),
('2','C-2','Imaginación y creatividad','Juego',3,'No hay juego creativo ni inventivo.'),

-- D1. Interés sensorial inusual en los materiales de juego o en las personas
('2','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',0,'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.'),
('2','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',1,'Varios intereses sensoriales posibles pero no tan claros; o solo un caso claro de interés sensorial inusual.'),
('2','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',2,'Interés evidente por elementos sensoriales de los objetos. Deben observarse dos o más ejemplos claros.'),
('2','D-1','Interés sensorial inusual en los materiales de juego o en las personas','Comportamientos Estereotipados e Intereses Restringidos',3,'Comportamientos de búsqueda sensorial evidentes durante al menos dos tareas diferentes y que interfieren con la evaluación.'),

-- D2. Manierismos de manos y dedos y otros manierismos complejos
('2','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',0,'Ninguno.'),
('2','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',1,'Manierismos inusuales o repetitivos que no son tan claros como para el código 2.'),
('2','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',2,'Movimientos rápidos o retorcimientos de dedos evidentes; o manierismos complejos, estereotipias o posturas.'),
('2','D-2','Manierismos de manos y dedos y otros manierismos complejos','Comportamientos Estereotipados e Intereses Restringidos',3,'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o interfieren con la evaluación.'),

-- D3. Conducta autolesiva
('2','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',0,'No intenta autolesionarse.'),
('2','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',1,'Autolesión dudosa o posible o autolesión infrecuente pero clara.'),
('2','D-3','Conducta autolesiva','Comportamientos Estereotipados e Intereses Restringidos',2,'Más de un ejemplo claro de autolesión.'),

-- D4. Intereses inusualmente repetitivos o comportamientos estereotipados
('2','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',0,'No hubo comportamientos repetitivos ni estereotipados durante la evaluación.'),
('2','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',1,'Presencia de un interés o comportamiento repetitivo o estereotipado hasta el punto de ser inusual, pero no interfiere con las actividades.'),
('2','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',2,'Intereses o comportamientos claramente repetitivos o estereotipados que constituyen una minoría sustancial y pueden interferir con las actividades.'),
('2','D-4','Intereses inusualmente repetitivos o comportamientos estereotipados','Comportamientos Estereotipados e Intereses Restringidos',3,'Los intereses repetitivos o estereotipados constituyen la mayoría de los intereses del niño; o muestra resistencia o gran angustia ante intentos de redirigir su atención.')

ON CONFLICT (module, item_code, score_value) DO NOTHING;
