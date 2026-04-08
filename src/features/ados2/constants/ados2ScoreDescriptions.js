/**
 * ADOS-2 Score Descriptions
 *
 * Describes what each score (0, 1, 2, 3, 7, 8) means for every item,
 * organized by module. Used to auto-generate clinical report narratives.
 *
 * Structure: MODULE_X_DESCRIPTIONS[itemCode][scoreValue] = "description"
 */

// ═══════════════════════════════════════════
// MÓDULO 1 — Pre-Verbal / Palabras sueltas (a partir de 31 meses)
// ═══════════════════════════════════════════
export const MODULE_1_DESCRIPTIONS = {
  'A-1': {
    name: 'Nivel general de lenguaje oral no ecolálico',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso regular de verbalizaciones de dos o más palabras.',
      1: 'Solo uso ocasional de frases; en general usa palabras sueltas.',
      2: 'Solo se reconocen palabras sueltas o aproximaciones de palabras; debe utilizar por lo menos cinco palabras distintas a lo largo de la sesión.',
      3: 'Por lo menos una palabra o aproximación de palabra, pero menos de cinco palabras dichas durante la sesión.',
      4: 'No hay uso espontáneo de palabras ni aproximaciones de palabras.',
    },
  },
  'A-2': {
    name: 'Frecuencia de la vocalización espontánea dirigida a otros',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Dirige vocalizaciones hacia el familiar o cuidador o al examinador en varios contextos pragmáticos. Incluye charlar o vocalizar para ser amigable o para expresar interés, además de para expresar sus necesidades.',
      1: 'Dirige vocalizaciones al familiar o cuidador o al examinador consistentemente en un solo contexto; o dirige pocas vocalizaciones en varios contextos pragmáticos.',
      2: 'Dirige una vocalización esporádica al familiar o cuidador o al examinador de manera inconsistente en pocos contextos. Puede incluir lloriqueos o llantos debidos a la frustración.',
      3: 'Las vocalizaciones no están dirigidas nunca o casi nunca al familiar o cuidador o al examinador; o nunca o casi nunca vocaliza.',
    },
  },
  'A-3': {
    name: 'Entonación de las vocalizaciones o verbalizaciones',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Entonación normal, con variación apropiada, sin peculiaridades ni rarezas.',
      1: 'Poca variación de timbre o tono; más bien plano o exagerado, o alguna que otra entonación peculiar.',
      2: 'Entonación rara o tono de voz y acento inapropiado; o marcadamente plano o con vocalizaciones mecánicas, sin tono; o llanto extraño y algunas vocalizaciones.',
      8: 'N/A: no hay suficientes vocalizaciones para poder evaluar la entonación.',
    },
  },
  'A-4': {
    name: 'Ecolalia inmediata',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No repite el habla de otras personas (requiere al menos cinco palabras para codificarse como 0).',
      1: 'Eco ocasional del lenguaje.',
      2: 'Repite palabras o frases con frecuencia, pero también muestra algo de lenguaje espontáneo, el cual puede ser estereotipado.',
      3: 'El habla consiste principalmente en ecolalia inmediata.',
      8: 'No se ha percibido ecolalia, pero el lenguaje es demasiado limitado como para valorarlo.',
    },
  },
  'A-5': {
    name: 'Uso estereotipado o idiosincrásico de palabras o frases',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas (requiere al menos cinco palabras).',
      1: 'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños con el mismo nivel de lenguaje expresivo, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o emplea palabras raras.',
      2: 'A menudo utiliza vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.',
      3: 'Utiliza frecuentemente habla rara o estereotipada y raramente usa un habla espontánea no estereotipada.',
      8: 'El lenguaje es demasiado limitado como para valorarlo.',
    },
  },
  'A-6': {
    name: 'Uso del cuerpo de otro',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No se utiliza el cuerpo de otra persona para un objetivo concreto, excepto en situaciones donde otras estrategias no han funcionado y se da junto con una mirada coordinada.',
      1: 'Toma la mano del adulto y lo lleva a distintos lugares sin una mirada o contacto visual coordinado, pero no la coloca sobre los objetos ni la utiliza como herramienta.',
      2: 'Coloca la mano del adulto u otra parte de su cuerpo sobre un objeto; o mueve la mano del adulto cuando está sujetando algún objeto; o usa la mano u otra parte del cuerpo del adulto como herramienta.',
      8: 'Escasa o inexistente comunicación espontánea.',
    },
  },
  'A-7': {
    name: 'Señalar',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Señala con el dedo índice para mostrar una referencia dirigida visualmente (mirada coordinada hacia el objeto y la persona) a objetos que están a distancia, en al menos dos actividades.',
      1: 'Señala para referirse a objetos, pero sin la flexibilidad ni la frecuencia suficiente; o produce una aproximación de la acción de señalar coordinada con la mirada o una vocalización.',
      2: 'Señala únicamente cuando está cerca de tocar o está tocando un objeto, sin que se coordine con la mirada o una vocalización.',
      3: 'No señala objetos de ninguna de las maneras descritas anteriormente.',
    },
  },
  'A-8': {
    name: 'Gestos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso espontáneo de, por lo menos, dos gestos diferentes de cualquier tipo (descriptivo, convencional, emocional o instrumental); por lo menos uno debe usarse más de una vez.',
      1: 'Uso espontáneo de gestos descriptivos, convencionales, instrumentales o emocionales, pero exagerados o limitados en el rango o la variedad de contextos.',
      2: 'No hay un uso espontáneo de gestos descriptivos, convencionales, instrumentales o emocionales; o solo hay un uso inapropiado.',
      8: 'N/A (limitado por alguna dificultad motora severa).',
    },
  },
  'B-1': {
    name: 'Contacto visual inusual',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.',
      2: 'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.',
    },
  },
  'B-2': {
    name: 'Sonrisa social correspondida',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Sonríe inmediatamente en respuesta a una de las dos primeras sonrisas brindadas por parte del examinador o del familiar o cuidador.',
      1: 'Sonrisa demorada o parcial en respuesta a una de las dos primeras sonrisas del examinador o del familiar o cuidador; o sonríe únicamente después de más de dos sonrisas.',
      2: 'Sonríe de manera total o parcial a un adulto únicamente después de que le hayan hecho cosquillas o le hayan tocado de alguna manera.',
      3: 'No sonríe en respuesta a otra persona.',
    },
  },
  'B-3': {
    name: 'Expresiones faciales dirigidas a otros',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Dirige al familiar o cuidador o al examinador diversas expresiones faciales apropiadas con la intención de comunicar estados emocionales o cognitivos.',
      1: 'Dirige algunas expresiones faciales al examinador o al familiar o cuidador (p. ej., únicamente dirige expresiones que indican emociones extremas, u ocasionalmente dirige una variedad más amplia).',
      2: 'No dirige expresiones faciales apropiadas a los demás.',
    },
  },
  'B-4': {
    name: 'Integración de la mirada y otras conductas durante las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Utiliza eficientemente el contacto visual junto con palabras o vocalizaciones o gestos para comunicar una intención social.',
      1: 'Utiliza el contacto visual y otras estrategias independientemente uno de otro para comunicar una intención social (utiliza tanto el contacto visual como la vocalización en diferentes momentos, pero no los coordina entre sí).',
      2: 'Utiliza o el contacto visual u otras estrategias (vocalización, gestos) para comunicar intención social, pero no ambos.',
      3: 'No utiliza ni contacto visual ni otras estrategias para comunicar intención social; o no hay iniciaciones sociales.',
    },
  },
  'B-5': {
    name: 'Disfrute compartido durante la interacción',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Da muestras claras de disfrute con el examinador que son pertinentes al contexto y que suceden en más de una actividad. Incluye disfrute en al menos una actividad que no sea de naturaleza puramente física.',
      1: 'Muestra cierto disfrute adecuado al contexto en las interacciones con el examinador; o proporciona una muestra clara de disfrute dirigida al examinador durante una sola interacción.',
      2: 'Muestra escaso o nulo disfrute en la interacción con el examinador, pero muestra disfrute en sus propias actividades o en la interacción con el familiar o cuidador.',
      3: 'Muestra poco o ningún disfrute expresado durante la evaluación y poco interés en los juguetes.',
    },
  },
  'B-6': {
    name: 'Respuesta al nombre',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mira hacia el examinador y establece contacto visual inmediatamente en al menos uno de los dos primeros intentos realizados por el examinador.',
      1: 'Mira hacia el familiar o cuidador y establece contacto visual después del primer o segundo intento de llamarle solo por su nombre; o responde en el tercer o cuarto intento del examinador.',
      2: 'No establece contacto visual con el examinador o el familiar o cuidador inmediatamente después de haberle llamado por su nombre en seis ocasiones, pero cambia la orientación de la mirada brevemente.',
      3: 'No mira hacia el examinador o el familiar o cuidador después de cualquier intento puramente verbal u oral para intentar conseguir su atención.',
    },
  },
  'B-7': {
    name: 'Pedir',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Exhibe una integración apropiada del contacto visual y, por lo menos, un comportamiento más (vocalización, gesto) para pedir, con una indicación clara de que quiere que el adulto haga o le dé algo.',
      1: 'Realiza uno o más comportamientos para pedir sin integrar el contacto visual con otros comportamientos como vocalizaciones o gestos.',
      2: 'No hace una petición directa, pero usa algún medio físico para pedir al menos una acción como parte de una rutina (p. ej., tira de la mano del examinador).',
      3: 'Puede participar en las rutinas o tratar de activar el objeto mediante vocalizaciones, golpes u otras acciones sin mirar al adulto ni vocalizar para pedir ayuda.',
    },
  },
  'B-8': {
    name: 'Dar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Entrega espontáneamente juguetes u objetos a otras personas en múltiples contextos durante la evaluación, incluyendo entregar con el propósito de compartir.',
      1: 'Más de un ejemplo en el que da objetos a otras personas con el propósito de recibir ayuda o como parte de una rutina, pero debe repetirse de manera espontánea.',
      2: 'Nunca o casi nunca da algo a otra persona.',
    },
  },
  'B-9': {
    name: 'Mostrar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra espontáneamente juguetes u objetos, sosteniéndolos o colocándolos delante de un adulto y estableciendo contacto visual, con o sin vocalización.',
      1: 'Muestra juguetes u objetos de una manera parcial o inconsistente (p. ej., sostiene un objeto delante de un adulto sin coordinarlo con el contacto visual; o muestra objetos solo en una ocasión).',
      2: 'No muestra objetos a otras personas.',
    },
  },
  'B-10': {
    name: 'Iniciación espontánea de la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto fuera del alcance, mirando primero al objeto, luego al examinador y nuevamente al objeto.',
      1: 'Hace referencias parciales a un objeto fuera del alcance con el fin de dirigir la atención de un adulto. Puede mirar y señalar pero no coordina con mirar a otra persona.',
      2: 'No hay una aproximación a una iniciación espontánea de atención conjunta para dirigir la atención del adulto hacia un objeto fuera del alcance.',
    },
  },
  'B-11': {
    name: 'Respuesta a la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin que haya necesidad de señalar.',
      1: 'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.',
      2: 'No sigue la mirada del examinador ni su acción de señalar, pero mira hacia el objeto cuando se activa.',
      3: 'No se orienta hacia el objeto incluso cuando este está activado.',
    },
  },
  'B-12': {
    name: 'Características de las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso efectivo de formas verbales y no verbales con la intención de realizar iniciaciones sociales claras hacia el examinador o familiar. Estas iniciaciones son adecuadas a los contextos inmediatos.',
      1: 'Las iniciaciones sociales tienen características ligeramente inusuales. Se restringen a demandas personales o están relacionadas con intereses marcados, pero con alguna intención de implicar al familiar o al examinador.',
      2: 'Las iniciaciones a menudo carecen de integración en el contexto o de naturaleza social. Alguna iniciación social claramente inapropiada.',
      3: 'No hay iniciaciones sociales de ningún tipo.',
    },
  },
  'B-13a': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del examinador o de dirigirla hacia objetos o acciones interesantes.',
      1: 'Algunos intentos de captar, mantener o dirigir la atención del examinador, pero con escasa frecuencia o en pocas actividades.',
      2: 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del examinador, incluyendo iniciaciones que únicamente tienen la intención de buscar consuelo.',
      3: 'Muestra relativamente poca preocupación con respecto a si el examinador está prestándole atención o no, a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
    },
  },
  'B-13b': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del familiar o cuidador o de dirigirla hacia objetos o acciones interesantes.',
      1: 'Algunos intentos de captar, mantener o dirigir la atención del familiar o cuidador, pero con escasa frecuencia o en pocas actividades.',
      2: 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del familiar o cuidador, incluyendo iniciaciones que únicamente tienen la intención de buscar consuelo.',
      3: 'Muestra relativamente poca preocupación con respecto a si el familiar o cuidador está prestándole atención o no, a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
      8: 'El familiar o cuidador no estuvo presente durante la aplicación del ADOS-2.',
    },
  },
  'B-14': {
    name: 'Calidad de la respuesta social',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra una gama adecuada de respuestas que son variadas de acuerdo a las situaciones sociales y a las presiones inmediatas.',
      1: 'Reacciona a la mayoría de los contextos sociales, pero de forma algo limitada, socialmente embarazosa, inapropiada, inconsistente o consistentemente negativa.',
      2: 'Respuestas extrañas, estereotipadas o respuestas muy poco variadas o que son inapropiadas para el contexto.',
      3: 'Respuesta mínima o inexistente a los intentos del examinador por implicar al niño.',
    },
  },
  'B-15': {
    name: 'Nivel de implicación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Se implica espontáneamente y se muestra interesado en las actividades que le presenta el examinador de manera consistente.',
      1: 'Se implica espontáneamente de forma inconsistente.',
      2: 'Se implica solo cuando el examinador se esfuerza en obtener y mantener el interés del niño.',
      3: 'No se implica cuando el examinador se esfuerza en atraer el interés del niño; o se implica solo durante la merienda o juegos con contacto físico.',
    },
  },
  'B-16': {
    name: 'Calidad general de la relación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La interacción entre el niño y el examinador es agradable y apropiada dentro del contexto de la evaluación.',
      1: 'La interacción es agradable a veces, pero no de forma sostenida (a veces se ha sentido raro o poco natural, o el comportamiento del niño ha parecido mecánico o ligeramente inapropiado).',
      2: 'Interacción unilateral o inusual dando como resultado de manera sistemática una sesión ligeramente incómoda.',
      3: 'El niño muestra una consideración mínima hacia el examinador; o la observación es marcadamente difícil o incómoda durante una parte significativa del tiempo.',
    },
  },
  'C-1': {
    name: 'Juego funcional con objetos',
    domain: 'Juego',
    scores: {
      0: 'Juega espontáneamente con diversos juguetes de una manera convencional, incluyendo juegos apropiados con varias miniaturas o juguetes figurativos diferentes.',
      1: 'Realiza algo de juego funcional espontáneo con al menos una miniatura o juguete figurativo.',
      2: 'Únicamente juega de manera adecuada con juguetes de causa y efecto o con juguetes de construcción; o juega a empujar el coche de juguete.',
      3: 'No juega con los juguetes o únicamente lo hace de manera estereotipada.',
    },
  },
  'C-2': {
    name: 'Imaginación y creatividad',
    domain: 'Juego',
    scores: {
      0: 'Usa espontáneamente la muñeca u otro objeto como agente independiente; o usa espontáneamente los objetos para representar otros objetos.',
      1: 'Realiza juego simbólico espontáneo con la muñeca o con otros objetos, pero no emplea la muñeca u otros juguetes como agentes independientes o para representar otra cosa.',
      2: 'Imita el juego simbólico pero no hay juego simbólico espontáneo.',
      3: 'No hay juego simbólico espontáneo ni imitado.',
    },
  },
  'D-1': {
    name: 'Interés sensorial inusual en los materiales de juego o en las personas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.',
      1: 'Varios intereses sensoriales posibles pero no tan claros como los especificados para el código 2; o solo se observa claramente un caso de interés sensorial inusual.',
      2: 'Interés evidente por elementos sensoriales de los objetos o los materiales de juego; o examen sensorial de sí mismo o de otros. Deben observarse dos o más ejemplos claros.',
      3: 'Comportamientos de búsqueda sensorial evidentes e inusuales que ocurren durante al menos dos tareas o actividades diferentes y que pueden interferir con la evaluación.',
    },
  },
  'D-2': {
    name: 'Manierismos de manos y dedos y otros manierismos complejos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Manierismos inusuales o repetitivos de manos y dedos o manierismos complejos que no son tan claros como lo especificado para el código 2.',
      2: 'Hay movimientos rápidos o retorcimientos de dedos evidentes; o manierismos complejos, estereotipias o posturas. Si son claros, pueden ser breves o infrecuentes.',
      3: 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación.',
    },
  },
  'D-3': {
    name: 'Conducta autolesiva',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No intenta autolesionarse.',
      1: 'Autolesión dudosa o posible o autolesión infrecuente pero clara (p. ej., al menos se observa un ejemplo claro de morderse su propia mano, tirarse del pelo, abofetearse o golpearse la cabeza).',
      2: 'Más de un ejemplo claro de autolesión, como golpearse la cabeza, abofetearse la propia cara, tirarse del pelo o morderse.',
    },
  },
  'D-4': {
    name: 'Intereses inusualmente repetitivos o comportamientos estereotipados',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No se observan intereses repetitivos inusuales ni comportamientos estereotipados.',
      1: 'Interés o comportamiento repetitivo posible o leve, pero no tan claro como lo especificado para el código 2.',
      2: 'Intereses inusualmente repetitivos o comportamientos estereotipados evidentes que pueden incluir preocupaciones por objetos o actividades inusuales.',
      3: 'Intereses inusualmente repetitivos o comportamientos estereotipados marcados que interfieren con la evaluación o que requieren retirar objetos de la habitación.',
    },
  },
  // ── Otros comportamientos (E) ──
  'E-1': {
    name: 'Elevado nivel de actividad / agitación',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No se observa un nivel de actividad inusualmente alto.',
      1: 'Algo inquieto o ligeramente hiperactivo.',
      2: 'Claramente hiperactivo o agitado durante una parte significativa de la sesión.',
    },
  },
  'E-2': {
    name: 'Berrinches, agresiones, comportamientos negativos o disruptivos',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No se observan berrinches, agresiones ni comportamientos disruptivos.',
      1: 'Berrinches o comportamientos negativos leves o breves.',
      2: 'Berrinches, agresiones o comportamientos disruptivos marcados.',
    },
  },
  'E-3': {
    name: 'Ansiedad',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No se observa ansiedad significativa.',
      1: 'Alguna ansiedad o tensión observable.',
      2: 'Ansiedad marcada que interfiere con la evaluación.',
    },
  },
};

// ═══════════════════════════════════════════
// MÓDULO 2 — Lenguaje con frases (a partir de 30 meses)
// ═══════════════════════════════════════════
export const MODULE_2_DESCRIPTIONS = {
  'A-1': {
    name: 'Nivel general de lenguaje oral no ecolálico',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Habla con frases no ecolálicas de tres o más palabras por verbalización; algunos marcadores gramaticales.',
      1: 'El habla consiste principalmente en verbalizaciones de dos o tres palabras, con pocos o ningún marcador gramatical.',
      2: 'El uso de frases es ocasional, generalmente utiliza palabras sueltas.',
      3: 'Únicamente palabras sueltas; o toda el habla es ecolálica con o sin intención comunicativa; o no hay lenguaje hablado.',
    },
  },
  'A-2': {
    name: 'Anormalidades del habla asociadas al autismo',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Entonación que varía adecuadamente, volumen razonable y velocidad normal del habla, con un ritmo regular coordinado con la respiración.',
      1: 'Poca variación de timbre y tono; más bien entonación plana o exagerada, pero no claramente peculiar; o volumen levemente inusual; o habla inusualmente lenta, rápida o espasmódica.',
      2: 'Habla claramente anormal: lenta y vacilante; inapropiadamente rápida; ritmo entrecortado e irregular; entonación rara o timbre y acento inapropiados; marcadamente plana o mecánica; volumen consistentemente anormal.',
      7: 'Tartamudeo u otro trastorno de la fluidez verbal.',
      8: 'El habla no tiene la suficiente frecuencia o complejidad como para evaluar su entonación, ritmo o velocidad.',
    },
  },
  'A-3': {
    name: 'Ecolalia inmediata',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No repite el habla de otra persona.',
      1: 'Eco ocasional del lenguaje.',
      2: 'Repite palabras o frases con regularidad, pero también muestra algo de lenguaje espontáneo.',
      3: 'El habla consiste principalmente en ecolalia inmediata.',
    },
  },
  'A-4': {
    name: 'Uso estereotipado o idiosincrásico de palabras o frases',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas.',
      1: 'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o emplea palabras raras.',
      2: 'A menudo usa vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.',
      3: 'Utiliza frecuentemente habla rara o estereotipada y casi nunca usa un habla espontánea no estereotipada.',
    },
  },
  'A-5': {
    name: 'Conversación',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'La conversación fluye, construyéndose sobre el diálogo del examinador, con secuencias de al menos cuatro elementos de intercambio recíproco.',
      1: 'Parte del habla incluye algo de elaboración espontánea o da pie a que el examinador pueda seguir la conversación, pero la cantidad es menor a la esperada o es limitada en flexibilidad.',
      2: 'Poca conversación recíproca sostenida; puede seguir su propio pensamiento más que participar en un intercambio; escasa sensación de reciprocidad.',
      3: 'Escasa habla comunicativa espontánea. Puede emitir algunas respuestas limitadas a las iniciaciones del examinador, pero muy escasas.',
    },
  },
  'A-6': {
    name: 'Señalar',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Señala con el dedo índice con referencia dirigida visualmente (mirada coordinada) a un objeto a distancia para expresar interés.',
      1: 'Señala para referirse a objetos y expresar interés, pero sin suficiente flexibilidad; o produce una aproximación coordinada con mirada o vocalización; o señala únicamente para pedir algo.',
      2: 'Señala únicamente sin coordinación con la mirada o vocalización y sin propósito de expresar interés.',
      3: 'No señala como se ha descrito anteriormente.',
    },
  },
  'A-7': {
    name: 'Gestos descriptivos, convencionales, instrumentales o informativos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso espontáneo de varios gestos descriptivos. Puede usar además gestos convencionales o instrumentales.',
      1: 'Algún uso espontáneo de gestos descriptivos, pero exagerados, poco variados o en pocos contextos; o uso frecuente de gestos convencionales o instrumentales, pero poco o ningún uso de gestos descriptivos.',
      2: 'Algún uso espontáneo de gestos informativos, convencionales o instrumentales, pero uso excepcional o ningún uso de gestos descriptivos.',
      3: 'Ausencia o uso muy limitado de gestos convencionales, instrumentales, informativos o descriptivos. Incluye agarrar y alcanzar con fines comunicativos.',
      8: 'N/A (limitado por alguna dificultad motora severa).',
    },
  },
  'B-1': {
    name: 'Contacto visual inusual',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.',
      2: 'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.',
    },
  },
  'B-2': {
    name: 'Expresiones faciales dirigidas a otros',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Dirige al familiar o cuidador o al examinador diversas expresiones faciales apropiadas con la intención de comunicar estados emocionales o cognitivos.',
      1: 'Dirige algunas expresiones faciales al examinador o al familiar o cuidador, pero de forma limitada o solo con emociones extremas.',
      2: 'No dirige expresiones faciales apropiadas a los demás.',
    },
  },
  'B-3': {
    name: 'Disfrute compartido durante la interacción',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Da muestras claras de disfrute con el examinador adecuadas al contexto en más de una actividad, incluyendo al menos una que no sea puramente física.',
      1: 'Muestra cierto disfrute adecuado al contexto; o una muestra clara de disfrute en una sola interacción.',
      2: 'Escaso o nulo disfrute en la interacción con el examinador, pero muestra disfrute en sus propias actividades o con el familiar.',
      3: 'Poco o nulo disfrute expresado durante la evaluación y poco interés en los juguetes.',
    },
  },
  'B-4': {
    name: 'Respuesta al nombre',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mira hacia el examinador y establece contacto visual inmediatamente en al menos uno de los dos primeros intentos.',
      1: 'Mira hacia el familiar o cuidador y establece contacto visual después del primer o segundo intento; o responde al tercer o cuarto intento del examinador.',
      2: 'No establece contacto visual después de haberle llamado por su nombre en seis ocasiones, pero cambia la orientación de la mirada brevemente.',
    },
  },
  'B-5': {
    name: 'Mostrar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra espontáneamente juguetes u objetos, sosteniéndolos delante de un adulto y estableciendo contacto visual.',
      1: 'Muestra juguetes de manera parcial o inconsistente; o muestra objetos solo en una ocasión.',
      2: 'No muestra objetos a otras personas.',
    },
  },
  'B-6': {
    name: 'Iniciación espontánea de la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto fuera del alcance (cambio de mirada de tres puntos).',
      1: 'Hace referencias parciales a un objeto fuera del alcance; puede mirar y señalar pero no coordina con mirar a otra persona.',
      2: 'No hay aproximación a una iniciación espontánea de atención conjunta.',
    },
  },
  'B-7': {
    name: 'Respuesta a la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin necesidad de señalar.',
      1: 'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.',
      2: 'No sigue la mirada ni la acción de señalar, pero mira hacia el objeto cuando se activa.',
      3: 'No se orienta hacia el objeto incluso cuando está activado.',
    },
  },
  'B-8': {
    name: 'Características de las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso efectivo de formas verbales y no verbales con intención de realizar iniciaciones sociales claras y apropiadas al contexto.',
      1: 'Las iniciaciones sociales tienen características ligeramente inusuales; se restringen a demandas personales o intereses marcados, pero con alguna intención de implicar al examinador.',
      2: 'Al menos una minoría importante de iniciaciones inapropiadas; muchas carecen de integración en el contexto o de naturaleza social.',
      3: 'No hay iniciaciones sociales de ningún tipo.',
    },
  },
  'B-9a': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: Examinador',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del examinador.',
      1: 'Algunos intentos, pero con escasa frecuencia o en pocas actividades.',
      2: 'Intentos ocasionales, incluyendo iniciaciones solo con intención de buscar consuelo.',
      3: 'Relativamente poca preocupación con respecto a si el examinador le presta atención, a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
    },
  },
  'B-9b': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: Familiar o cuidador',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del familiar o cuidador.',
      1: 'Algunos intentos, pero con escasa frecuencia o en pocas actividades.',
      2: 'Intentos ocasionales, incluyendo iniciaciones solo con intención de buscar consuelo.',
      3: 'Relativamente poca preocupación, a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
      8: 'El familiar o cuidador no estuvo presente durante la aplicación del ADOS-2.',
    },
  },
  'B-10': {
    name: 'Calidad de la respuesta social',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra una gama adecuada de respuestas variadas de acuerdo a las situaciones sociales.',
      1: 'Reacciona a la mayoría de los contextos sociales, pero de forma algo limitada, socialmente embarazosa, inapropiada o inconsistente.',
      2: 'Respuestas extrañas, estereotipadas o muy poco variadas o inapropiadas para el contexto.',
      3: 'Respuesta mínima o inexistente a los intentos del examinador por implicar al niño.',
    },
  },
  'B-11': {
    name: 'Cantidad de comunicación social recíproca',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso extenso de comportamientos verbales o no verbales para realizar un intercambio social (charlar, hacer comentarios, comportamientos no verbales con intención de reciprocidad).',
      1: 'Alguna comunicación social recíproca, pero reducida en frecuencia, cantidad o contextos.',
      2: 'La mayor parte de la comunicación está orientada a objetos o a responder preguntas; es ecolálica o tiene que ver con preocupaciones; poca o ninguna reciprocidad o charla social.',
      3: 'Escasa o nula comunicación con el examinador o el familiar.',
    },
  },
  'B-12': {
    name: 'Calidad general de la relación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La interacción entre el niño y el examinador es agradable y apropiada.',
      1: 'La interacción es agradable a veces, pero no de forma sostenida.',
      2: 'Interacción unilateral o inusual dando como resultado una sesión ligeramente incómoda.',
      3: 'El niño muestra una consideración mínima hacia el examinador, o la sesión es marcadamente incómoda.',
    },
  },
  'C-1': {
    name: 'Juego funcional con objetos',
    domain: 'Juego',
    scores: {
      0: 'Juega espontáneamente con diversos juguetes de manera convencional, incluyendo juegos con varias miniaturas o juguetes figurativos.',
      1: 'Algo de juego funcional espontáneo con al menos una miniatura o juguete figurativo.',
      2: 'Únicamente juega de manera adecuada con juguetes de causa y efecto o de construcción; o empuja el coche de juguete.',
      3: 'No juega con los juguetes o únicamente lo hace de manera estereotipada.',
    },
  },
  'C-2': {
    name: 'Imaginación y creatividad',
    domain: 'Juego',
    scores: {
      0: 'Variedad de juegos o actividades espontáneos, ingeniosos o creativos, incluyendo el uso de la muñeca como agente de acción.',
      1: 'Algo de juego creativo espontáneo o juego simbólico, pero poco variado.',
      2: 'Poco juego creativo espontáneo o juego simbólico, o solo se produce juego repetitivo o estereotipado.',
      3: 'No hay juego creativo ni inventivo.',
    },
  },
  'D-1': {
    name: 'Interés sensorial inusual en los materiales de juego o en las personas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.',
      1: 'Varios intereses sensoriales posibles pero no tan claros; o solo un caso claro de interés sensorial inusual.',
      2: 'Interés evidente por elementos sensoriales de los objetos. Deben observarse dos o más ejemplos claros.',
      3: 'Comportamientos de búsqueda sensorial evidentes durante al menos dos tareas diferentes y que interfieren con la evaluación.',
    },
  },
  'D-2': {
    name: 'Manierismos de manos y dedos y otros manierismos complejos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Manierismos inusuales o repetitivos que no son tan claros como para el código 2.',
      2: 'Movimientos rápidos o retorcimientos de dedos evidentes; o manierismos complejos, estereotipias o posturas.',
      3: 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o interfieren con la evaluación.',
    },
  },
  'D-3': {
    name: 'Conducta autolesiva',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No intenta autolesionarse.',
      1: 'Autolesión dudosa o posible o autolesión infrecuente pero clara.',
      2: 'Más de un ejemplo claro de autolesión.',
    },
  },
  'D-4': {
    name: 'Intereses inusualmente repetitivos o comportamientos estereotipados',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo comportamientos repetitivos ni estereotipados durante la evaluación.',
      1: 'Presencia de un interés o comportamiento repetitivo o estereotipado hasta el punto de ser inusual, pero no interfiere con las actividades.',
      2: 'Intereses o comportamientos claramente repetitivos o estereotipados que constituyen una minoría sustancial y pueden interferir con las actividades.',
      3: 'Los intereses repetitivos o estereotipados constituyen la mayoría de los intereses del niño; o muestra resistencia o gran angustia ante intentos de redirigir su atención.',
    },
  },
};

// ═══════════════════════════════════════════
// MÓDULO 3 — Niños y adolescentes con fluidez verbal
// ═══════════════════════════════════════════
export const MODULE_3_DESCRIPTIONS = {
  'A-1': {
    name: 'Nivel general de lenguaje oral no ecolálico',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Utiliza frases de una manera generalmente correcta (debe utilizar algunas verbalizaciones complejas).',
      1: 'Algo de habla relativamente compleja (en ocasiones utiliza expresiones de dos o más oraciones que contengan un nombre y un verbo dentro de la misma oración) pero con errores gramaticales recurrentes no asociados con el uso de un dialecto.',
      2: 'El habla no-ecolálica se compone principalmente de expresiones de al menos tres palabras, pero sin el lenguaje complejo que se ha descrito anteriormente.',
      3: 'El habla no-ecolálica consiste principalmente en frases simples.',
    },
  },
  'A-2': {
    name: 'Anormalidades del habla asociadas al autismo (entonación/volumen/ritmo/velocidad)',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Entonación que varía adecuadamente, volumen razonable y velocidad normal del habla, con un ritmo regular coordinado con la respiración.',
      1: 'Poca variación de timbre y tono; entonación bastante monótona o exagerada, pero no claramente peculiar; o volumen levemente inusual; o habla que tiende a ser inusualmente lenta o rápida o espasmódica.',
      2: 'Habla claramente anormal por cualquiera de las siguientes razones: lenta y vacilante; inapropiadamente rápida; ritmo entrecortado e irregular; entonación rara o timbre o acento inapropiados; marcadamente plana o carente de matices; volumen consistentemente anormal.',
      7: 'Tartamudeo u otro trastorno de la fluidez verbal.',
    },
  },
  'A-3': {
    name: 'Ecolalia inmediata',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No repite el habla de otra persona.',
      1: 'Eco ocasional del lenguaje.',
      2: 'Repite palabras o frases con regularidad, pero también muestra algo de lenguaje espontáneo, el cual puede ser estereotipado.',
      3: 'El habla consiste principalmente en ecolalia inmediata.',
    },
  },
  'A-4': {
    name: 'Uso estereotipado o idiosincrásico de palabras o frases',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas.',
      1: 'El uso de palabras o frases tiende a ser más repetitivo o formal que en la mayoría de las personas con el mismo nivel de lenguaje expresivo, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o emplea palabras de una manera inusual.',
      2: 'A menudo usa vocalizaciones estereotipadas o palabras o frases raras, junto con lenguaje adicional.',
      3: 'Utiliza frecuentemente habla rara o estereotipada y casi nunca usa un habla espontánea no estereotipada.',
    },
  },
  'A-5': {
    name: 'Ofrece información',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Ofrece información espontáneamente sobre sus propios pensamientos, sentimientos o experiencias en varias ocasiones.',
      1: 'A veces ofrece información de manera espontánea sobre sus propios pensamientos, sentimientos o experiencias.',
      2: 'Nunca o casi nunca ofrece información de forma espontánea, a menos que sea acerca de sus intereses restringidos o preocupaciones; o informa acerca de hechos o conocimientos generales.',
    },
  },
  'A-6': {
    name: 'Pide información',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Le pregunta al examinador sobre sus pensamientos, sentimientos o experiencias en varias ocasiones.',
      1: 'Ocasionalmente (por lo menos un ejemplo claro) le pregunta al examinador acerca de sus pensamientos, sentimientos o experiencias.',
      2: 'Responde adecuadamente a los comentarios hechos por el examinador acerca de sus pensamientos, sentimientos o experiencias, pero no hace preguntas sobre ellos de manera espontánea.',
      3: 'Rara vez o nunca expresa interés por los pensamientos, los sentimientos o las experiencias del examinador.',
    },
  },
  'A-7': {
    name: 'Narración de sucesos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Informa sobre un hecho no rutinario específico que no es parte de una preocupación o de un interés marcado y que pareciera ser real. Da información suficiente sin necesitar preguntas específicas para ayudarle.',
      1: 'Proporciona suficiente información de un hecho rutinario que no es parte de una preocupación o interés marcado y pareciera ser real. Da información sin necesitar preguntas específicas.',
      2: 'Proporciona información acerca de hechos rutinarios o no rutinarios, pero depende de las preguntas específicas del examinador para poder continuar; o únicamente describe una situación poco verosímil.',
      3: 'Respuestas inconsistentes o insuficientes, incluso a las preguntas específicas.',
    },
  },
  'A-8': {
    name: 'Conversación',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'La conversación fluye, construyéndose sobre el diálogo del examinador. Requiere secuencias de al menos cuatro elementos de intercambio recíproco.',
      1: 'Parte del habla del evaluado incluye algo de elaboración espontánea de sus propias respuestas, pero bien la cantidad de habla es menor a la esperada o bien es limitada en cuanto a su flexibilidad.',
      2: 'Poca conversación recíproca sostenida por el evaluado; puede seguir su propio tren de pensamiento más que participar en un intercambio; escasa sensación de reciprocidad.',
      3: 'Poca habla comunicativa espontánea. Asigne este código a aquellos evaluados que emitan algunas respuestas limitadas a las iniciaciones de conversación realizadas por el examinador.',
    },
  },
  'A-9': {
    name: 'Gestos descriptivos, convencionales, instrumentales o informativos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso espontáneo de varios gestos descriptivos. Puede usar además gestos convencionales o instrumentales.',
      1: 'Algún uso espontáneo de gestos descriptivos, pero exagerados, poco variados o que se producen en pocos contextos; o uso frecuente de gestos convencionales o instrumentales pero uso excepcional o ningún uso de gestos descriptivos.',
      2: 'Algún uso espontáneo de gestos informativos, convencionales o instrumentales, pero uso excepcional o ningún uso de gestos descriptivos.',
      3: 'Ausencia o uso muy limitado de gestos convencionales, instrumentales, informativos o descriptivos.',
      8: 'N/A (limitado por alguna dificultad motora severa).',
    },
  },
  'B-1': {
    name: 'Contacto visual inusual',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mirada apropiada, con cambios sutiles mezclados con otro tipo de comunicación.',
      2: 'Establece un contacto visual modulado pobremente para iniciar, terminar o regular una interacción social.',
    },
  },
  'B-2': {
    name: 'Expresiones faciales dirigidas al examinador',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Dirige diversas expresiones faciales apropiadas al examinador con la intención de comunicar estados emocionales o cognitivos.',
      1: 'Dirige algunas expresiones faciales al examinador (p. ej., dirige únicamente expresiones que indican emociones extremas, u ocasionalmente dirige una variedad más amplia de expresiones).',
      2: 'No dirige expresiones faciales apropiadas al examinador.',
    },
  },
  'B-3': {
    name: 'Producción de lenguaje y comunicación no verbal asociada',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La vocalización en general se acompaña de cambios sutiles y socialmente adecuados en los gestos, las miradas y las expresiones faciales.',
      1: 'La vocalización se acompaña de una variedad o frecuencia de gestos, miradas y expresiones faciales anormal, limitada o inferior a la usual; o usa casi exclusivamente una sola modalidad.',
      2: 'Escasa o nula comunicación no verbal combinada con vocalizaciones.',
      7: 'Cierta evitación de la mirada directa, quizás debida a timidez, pero muestra cierta modulación y coordinación del lenguaje y las conductas no verbales.',
      8: 'N/A; no hay vocalizaciones; o el empleo de gestos, expresiones faciales o miradas socialmente dirigidas fue mínimo o nulo.',
    },
  },
  'B-4': {
    name: 'Disfrute compartido durante la interacción',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Da muestras claras de disfrute adecuadas al contexto durante el intercambio interactivo o la conversación con el examinador en más de una actividad o tema.',
      1: 'Muestra cierto disfrute adecuado al contexto durante las interacciones con el examinador, o proporciona una muestra clara de disfrute durante una sola interacción.',
      2: 'Muestra escaso o nulo disfrute en la interacción con el examinador, pero puede mostrar disfrute en su propio discurso o acciones.',
      3: 'Poco o nulo disfrute expresado durante la evaluación.',
    },
  },
  'B-5': {
    name: 'Comentarios sobre las emociones de otros / empatía',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Transmite espontáneamente una clara comprensión o identificación de varias emociones diferentes en otras personas o personajes o responde adecuadamente a ellas.',
      1: 'Transmite cierta comprensión, identificación y respuesta a una emoción de otras personas (identifica espontánea y correctamente al menos una emoción en otra persona o personaje).',
      2: 'Escasa o nula identificación o comunicación de que comprende los estados emocionales de otros.',
    },
  },
  'B-6': {
    name: 'Comprensión de las situaciones y relaciones sociales típicas',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra ejemplos de comprensión de la naturaleza de varias relaciones sociales típicas, incluyendo la comprensión de su propio papel en al menos una de ellas.',
      1: 'Muestra ejemplos de comprensión de varias relaciones sociales típicas, pero no de su propio papel en ellas; o muestra comprensión de solo una relación y de su papel en ella.',
      2: 'Muestra cierta comprensión de una sola relación social típica, pero no necesariamente de su papel en la misma.',
      3: 'Muestra una comprensión escasa o nula de las relaciones sociales típicas.',
    },
  },
  'B-7': {
    name: 'Características de las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso efectivo de formas verbales y no verbales para realizar iniciaciones sociales claras hacia el examinador. Apropiadas a los contextos inmediatos.',
      1: 'Iniciaciones sociales con características ligeramente inusuales. Se restringen a demandas personales o están relacionadas con los propios intereses del evaluado, pero con alguna intención de involucrar al examinador.',
      2: 'Iniciaciones inapropiadas; muchas iniciaciones carecen de integración en el contexto o de naturaleza social. Hace referencia a preocupaciones pero hace pocos intentos de involucrar al examinador.',
      3: 'No hay iniciaciones sociales de ningún tipo.',
    },
  },
  'B-8': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del examinador o de dirigirla hacia objetos, acciones o temas interesantes para el evaluado.',
      1: 'Algunos intentos de captar, mantener o dirigir la atención del examinador, pero que se observan con escasa frecuencia o en pocas actividades diferentes.',
      2: 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del examinador, incluyendo iniciaciones relacionadas únicamente con preocupaciones.',
      3: 'Muestra relativamente poca preocupación con respecto a si el examinador está prestándole atención o no a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
    },
  },
  'B-9': {
    name: 'Calidad de la respuesta social',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra una gama de respuestas apropiadas que varían de acuerdo a las situaciones y las presiones sociales inmediatas.',
      1: 'Reacciona a la mayoría de los contextos sociales, pero de forma algo limitada, socialmente embarazosa, inapropiada, inconsistente o consistentemente negativa.',
      2: 'Respuestas extrañas, estereotipadas o respuestas muy poco variadas, o que son inapropiadas para el contexto.',
      3: 'Respuesta mínima o inexistente a los intentos del examinador por implicar al evaluado.',
    },
  },
  'B-10': {
    name: 'Cantidad de comunicación social recíproca',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso extenso de comportamientos verbales o no verbales para realizar un intercambio social.',
      1: 'Muestra alguna comunicación social recíproca, pero reducida en frecuencia o cantidad o en el número de contextos.',
      2: 'La mayor parte de la comunicación está orientada a objetos o a responder preguntas; o es ecolálica; o tiene que ver con preocupaciones; hay poca o ninguna reciprocidad.',
      3: 'Escasa o nula comunicación con el examinador.',
    },
  },
  'B-11': {
    name: 'Calidad general de la relación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La interacción entre el evaluado y el examinador es agradable y apropiada dentro del contexto de la evaluación del ADOS-2.',
      1: 'La interacción es agradable a veces, pero no de forma sostenida (a veces se ha sentido raro o poco natural, o el comportamiento del evaluado ha parecido mecánico o ligeramente inapropiado).',
      2: 'Interacción unilateral o inusual dando como resultado de manera sistemática una sesión ligeramente incómoda o una sesión que podría haber sido difícil si el examinador no hubiese modificado continuamente la estructura de la situación.',
      3: 'El evaluado muestra una consideración mínima hacia el examinador o la sesión es marcadamente incómoda durante una parte significativa del tiempo.',
    },
  },
  'C-1': {
    name: 'Imaginación y creatividad',
    domain: 'Imaginación',
    scores: {
      0: 'Introduce diversas actividades o comentarios en la conversación que son creativos, originales y espontáneos.',
      1: 'Algunas acciones imaginativas o creativas, pero poco variadas o solo ocurren en respuesta a una situación estructurada.',
      2: 'Escasas acciones imaginativas o creativas; o solo presenta acciones que son de tipo repetitivo o estereotipado.',
      3: 'No hay acciones creativas o inventivas (ni siquiera repetitivas o estereotipadas).',
    },
  },
  'D-1': {
    name: 'Interés sensorial inusual en los materiales de juego o en las personas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No presenta intereses sensoriales inusuales.',
      1: 'Varios intereses sensoriales posibles no tan claros como los especificados para el código 2, o solo se observa claramente un caso de interés sensorial inusual o de comportamiento de búsqueda sensorial.',
      2: 'Interés evidente por elementos sensoriales de los objetos o de los materiales de juego; o examen sensorial de sí mismo o de otros. Deben observarse dos o más ejemplos claros.',
      3: 'Comportamientos evidentes e inusuales de búsqueda sensorial que ocurren frecuentemente, durante al menos dos tareas o actividades diferentes, y que deben interferir con la evaluación del ADOS-2.',
    },
  },
  'D-2': {
    name: 'Manierismos de manos y dedos y otros manierismos complejos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Manierismos inusuales o repetitivos de manos y dedos o manierismos complejos que no son tan claros como los que se especifican en el código 2.',
      2: 'Hay movimientos rápidos o retorcimientos de dedos evidentes; o manierismos de manos o dedos complejos, estereotipias o posturas.',
      3: 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.',
    },
  },
  'D-3': {
    name: 'Conducta autolesiva',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No intenta autolesionarse.',
      1: 'Autolesión dudosa o posible o autolesión infrecuente pero clara.',
      2: 'Más de un ejemplo claro de autolesión, como golpearse la cabeza, abofetearse la propia cara, tirarse del pelo o morderse.',
    },
  },
  'D-4': {
    name: 'Interés excesivo o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo un interés excesivo o referencias a objetos o temas inusuales o altamente específicos o temas u objetos restringidos o conductas repetitivas.',
      1: 'Referencias ocasionales a temas o patrones de interés inusuales o altamente específicos, que suceden en un grado inusual, o comportamientos repetitivos ocasionales.',
      2: 'Patrones de interés evidentes, estereotipados o inusuales que pueden o no interrumpir o interferir con la comunicación social o comportamientos claramente repetitivos.',
      3: 'Preocupaciones o comportamientos repetitivos evidentes, hasta el punto que interfieren con la evaluación.',
    },
  },
  'D-5': {
    name: 'Compulsiones o rituales',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo actividades o rutinas verbales claras que el evaluado debiera llevar a cabo por completo o de acuerdo a una secuencia que no fuera parte de la tarea.',
      1: 'Actividades o lenguaje inusualmente fijados a una rutina, pero no hay comportamientos que sean de tipo claramente compulsivo.',
      2: 'Una o más actividades o rutinas verbales que el evaluado tiene que completar o decir de una manera específica. El evaluado parece estar bajo cierta presión o se pone nervioso si se interrumpe una actividad.',
    },
  },
  // ── Otros comportamientos (E) ──
  'E-1': {
    name: 'Elevado nivel de actividad / agitación',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'No muestra un elevado nivel de actividad o agitación. Puede moverse constantemente en la silla.',
      2: 'Dificultades para quedarse sentado; se mueve estando en la silla o fuera de ella, o agarra o manipula los objetos de una manera que es ligeramente disruptiva.',
      3: 'Comportamientos hiperactivos que son difíciles de interrumpir. El nivel de actividad interfiere con la evaluación.',
      7: 'Muy quieto, muy poca actividad.',
    },
  },
  'E-2': {
    name: 'Berrinches, agresiones, comportamientos negativos o disruptivos',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'No se muestra enfadado, disruptivo, perturbador, negativo ni agresivo durante la evaluación con el ADOS-2.',
      1: 'Muestra un ejemplo de ligera disrupción, enfado o comportamiento agresivo o negativo hacia el examinador.',
      2: 'Muestra más de un comportamiento intencionalmente disruptivo o negativo.',
      3: 'Muestra berrinches temperamentales marcados o repetitivos o agresión significativa.',
    },
  },
  'E-3': {
    name: 'Ansiedad',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'No hay una ansiedad evidente.',
      1: 'Signos leves de ansiedad o de inseguridad, especialmente al principio de la sesión de evaluación o en respuesta a las actividades concretas.',
      2: 'Ansiedad marcada a lo largo de la evaluación con el ADOS-2 (puede ser intermitente o continua).',
    },
  },
};

// ═══════════════════════════════════════════
// MÓDULO 4 — Adolescentes y adultos con fluidez verbal
// ═══════════════════════════════════════════
export const MODULE_4_DESCRIPTIONS = {
  'A-1': {
    name: 'Nivel general de lenguaje no ecolálico',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Utiliza oraciones generalmente de forma correcta (debe utilizar algunas verbalizaciones complejas de dos o más cláusulas).',
      1: 'Cierta complejidad del habla (en ocasiones utiliza verbalizaciones de dos o más cláusulas) pero con errores gramaticales recurrentes.',
      2: 'El habla no ecolálica se compone principalmente de verbalizaciones de por lo menos 3 o más palabras, pero las frases simples no son elípticas.',
      3: 'El habla no ecolálica consiste principalmente en frases simples.',
    },
  },
  'A-2': {
    name: 'Anormalidades del habla asociadas con autismo (entonación, volumen, ritmo y velocidad)',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Entonación que varía apropiadamente, volumen razonable y velocidad normal del habla, con un ritmo regular coordinado con la respiración.',
      1: 'Poca variación de timbre y tono; más bien monótono o exagerado, pero sin una entonación claramente peculiar; o tiene un volumen levemente inusual; o tiene un habla que tiende a ser inapropiadamente lenta o rápida o espasmódica.',
      2: 'Habla claramente anormal: lenta y vacilante; inapropiadamente rápida; espasmódica y con un ritmo irregular; entonación rara o timbre o acento inapropiado; marcadamente monótona y sin entonación; volumen consistentemente anormal.',
      7: 'Tartamudeo u otro trastorno de la fluencia verbal.',
      8: 'N/A (el habla no se da con la suficiente frecuencia o complejidad como para evaluar entonación/ritmo/velocidad).',
    },
  },
  'A-3': {
    name: 'Ecolalia inmediata',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Rara vez o nunca repite el habla de otra persona.',
      1: 'Eco ocasional del habla de otros.',
      2: 'Repite palabras o frases con regularidad, pero también posee lenguaje espontáneo (puede ser estereotipado).',
      3: 'El habla consiste principalmente en ecolalia inmediata.',
    },
  },
  'A-4': {
    name: 'Uso estereotipado o idiosincrásico de palabras o frases',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Rara vez o nunca usa palabras o frases estereotipadas o idiosincrásicas.',
      1: 'El uso de palabras o frases tiende a ser más repetitivo o formal que en la mayoría de los individuos con el mismo nivel de complejidad, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o hace uso de palabras raras o emplea frases de forma inusual, junto con otro lenguaje espontáneo flexible.',
      2: 'A menudo emplea vocalizaciones estereotipadas o palabras o frases raras, ya sea con presencia o no de otro lenguaje.',
      3: 'Las frases son casi exclusivamente vocalizaciones raras o estereotipadas.',
    },
  },
  'A-5': {
    name: 'Ofrece información',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'En varias ocasiones ofrece información espontáneamente sobre sus pensamientos, sentimientos o experiencias.',
      1: 'Ocasionalmente ofrece información de manera espontánea sobre sus pensamientos, sentimientos o experiencias.',
      2: 'Rara vez o nunca ofrece información de forma espontánea a no ser que sea acerca de sus intereses circunscritos o preocupaciones; o informa acerca de hechos o conocimientos generales, incluyendo las preocupaciones o intereses circunscritos.',
    },
  },
  'A-6': {
    name: 'Pide información',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Le pregunta al examinador sobre sus pensamientos, sentimientos o experiencias en varias ocasiones.',
      1: 'Ocasionalmente (por lo menos un ejemplo claro) le pregunta al examinador sobre sus pensamientos, sentimientos o experiencias.',
      2: 'Responde adecuadamente a los comentarios hechos por el examinador acerca de sus pensamientos, sentimientos o experiencias, pero espontáneamente no hace preguntas sobre ellos.',
      3: 'Rara vez o nunca le pregunta al examinador acerca de sus pensamientos, sentimientos o experiencias, ni expresa interés por ellos.',
    },
  },
  'A-7': {
    name: 'Narración de sucesos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Da un informe de un hecho no-rutinario específico que no es parte de una preocupación o de un marcado interés y que pareciera ser real. Da un informe razonable sin necesitar preguntas específicas para ayudarlo.',
      1: 'Da un informe razonable de un hecho rutinario que no es parte de una preocupación o de un marcado interés y pareciera ser real. Da este informe sin preguntas específicas que lo guíen. Se incluyen aquí las respuestas a la tarea de demostración.',
      2: 'Da información acerca de un hecho rutinario o no-rutinario, pero depende de las preguntas específicas del examinador para poder continuar; o únicamente describe una situación que no pareciera poder ser real.',
      3: 'Respuestas inconsistentes o insuficientes, inclusive a las preguntas específicas.',
    },
  },
  'A-8': {
    name: 'Conversación',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'La conversación fluye, construyéndose sobre el diálogo del examinador. Requiere secuencias de al menos cuatro elementos de intercambio recíproco.',
      1: 'Parte del habla del individuo incluye algo de elaboración espontánea de sus propias respuestas; o da pautas y entradas al examinador para que pueda seguir la conversación, pero la cantidad de habla es menor a la esperada o está limitada en cuanto a flexibilidad.',
      2: 'Poca conversación recíproca sostenida por el individuo; puede seguir su propio tren de pensamiento más que participar en un intercambio; puede hacer algún ofrecimiento espontáneo de información pero con escaso sentido de la reciprocidad.',
      3: 'Poca habla comunicativa espontánea. Asigne este código a aquellos individuos que emiten algunas respuestas limitadas, pero muy escasas.',
    },
  },
  'A-9': {
    name: 'Gestos descriptivos, convencionales, instrumentales o informativos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso espontáneo de varios gestos descriptivos. Los gestos pueden ser típicos o idiosincrásicos, pero deben ser comunicativos. Puede usar además gestos convencionales o instrumentales.',
      1: 'Algún uso espontáneo de gestos descriptivos, pero exagerado o limitado en el rango o variedad de contextos; o uso frecuente de gestos convencionales o instrumentales, pero no descriptivos.',
      2: 'Algún uso espontáneo de gestos informativos, convencionales o instrumentales, pero no descriptivos.',
      3: 'Poco o ningún uso de gestos convencionales, instrumentales, informativos o descriptivos.',
      8: 'N/A (limitado por alguna discapacidad física).',
    },
  },
  'A-10': {
    name: 'Gestos enfáticos o emocionales',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Variedad de gestos enfáticos o emocionales bien integrados en el habla.',
      1: 'Algunos gestos enfáticos o emocionales pero exagerados; o gestos limitados en frecuencia, en estilo, en su integración en el habla o en su oportunidad o idoneidad.',
      2: 'Gestos enfáticos o emocionales extraños, excesivos o claramente mal integrados en el habla.',
      3: 'Escasos o nulos gestos enfáticos o emocionales.',
      8: 'La cantidad de lenguaje espontáneo es insuficiente como para poder juzgar los gestos que lo acompañan.',
    },
  },
  'B-1': {
    name: 'Contacto visual inusual',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.',
      2: 'Establece un contacto visual pobremente modulado socialmente para iniciar, terminar o regular una interacción social.',
    },
  },
  'B-2': {
    name: 'Expresiones faciales dirigidas a otros',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Dirige una variedad de expresiones faciales apropiadas al examinador o a otra persona con la intención de comunicar emociones.',
      1: 'Dirige algunas expresiones faciales al examinador o a otra persona (p. ej., dirige únicamente expresiones que indiquen emociones extremas u ocasionalmente dirige una variedad más amplia de expresiones). Se le puede asignar este código a un individuo que tenga una variedad limitada de expresiones pero que dirige la mayoría de sus expresiones a otra persona.',
      2: 'Rara vez o nunca dirige expresiones faciales apropiadas a otros.',
    },
  },
  'B-3': {
    name: 'Producción de lenguaje y comunicación no verbal vinculada',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La vocalización en general se acompaña de cambios sutiles y socialmente adecuados en los gestos, las miradas y las expresiones faciales.',
      1: 'La vocalización se acompaña de una variedad o frecuencia de gestos, miradas y expresiones faciales anormal, limitada o inferior a la usual; o usa casi exclusivamente una sola modalidad.',
      2: 'Escasa o nula comunicación no verbal en conjunción con las vocalizaciones.',
      7: 'Cierta evitación de la mirada, quizás debida a timidez, pero muestra cierta modulación y coordinación del lenguaje y las conductas no verbales.',
      8: 'N/A; no hubo vocalizaciones; o el empleo de gestos, expresiones faciales o miradas socialmente dirigidas fue mínimo o nulo.',
    },
  },
  'B-4': {
    name: 'Placer compartido durante la interacción',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra claros y apropiados signos de disfrute durante un intercambio interactivo o conversacional en más de una actividad o tema de conversación.',
      1: 'Expresa algo de goce apropiado en las acciones del examinador; o muestra claros signos de placer durante una sola interacción.',
      2: 'Expresa escaso o nulo placer en la interacción con el examinador. Puede expresar placer en sus propias actividades o en partes de la conversación, pero no en los comportamientos del examinador o en su interacción con él.',
      8: 'No se puede valorar este ítem ya sea porque la interacción existente ha sido escasa o nula o por otras razones.',
    },
  },
  'B-5': {
    name: 'Comunicación de sus propias emociones',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Comunica de manera efectiva una variedad de emociones que está sintiendo o ha sentido.',
      1: 'Cierta descripción de haber sentido varias emociones, pero limitada en variedad o en capacidad para poder comunicarlas adecuadamente (puede transmitir una emoción de un modo efectivo).',
      2: 'Comunica una sola emoción con una mínima descripción de otras.',
      3: 'Escasa o nula comunicación de sus propias emociones.',
    },
  },
  'B-6': {
    name: 'Empatía / comentarios sobre las emociones de otros',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Transmite que claramente comprende y comparte la emoción de otros en emociones variadas y diferentes.',
      1: 'Transmite que en cierto grado comprende y comparte la emoción de otros en más de una emoción; o transmite que claramente comprende y comparte una emoción experimentada por otro individuo.',
      2: 'Transmite que en cierto grado comprende o comparte al menos una experiencia emocional de otro individuo.',
      3: 'Escasa o nula manifestación de que comprende o comparte estados emocionales.',
    },
  },
  'B-7': {
    name: 'Insight (comprensión de relaciones sociales)',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra varios ejemplos de comprensión de la naturaleza de relaciones sociales típicas, incluyendo la comprensión de su propio rol en al menos una de ellas.',
      1: 'Muestra ejemplos de comprensión de varias relaciones sociales típicas, pero no de su propio rol dentro de ellas; o muestra comprensión de sólo una relación y de su rol en ella.',
      2: 'Muestra cierta comprensión de una sola relación social, pero no necesariamente de su rol en esa relación.',
      3: 'Muestra una comprensión escasa o nula de las relaciones sociales típicas, con o sin conocimiento sobre su rol en ellas.',
    },
  },
  'B-8': {
    name: 'Responsabilidad',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Se ve como responsable de sus propias acciones en varios contextos, incluso cuando se trata de problemas menores de la vida diaria.',
      1: 'Brinda por lo menos una indicación clara de percibirse a sí mismo como responsable de sus propias acciones. No debe mostrar más de un ejemplo claro de falta de responsabilidad. No es consistente a lo largo de varios contextos.',
      2: 'Muestra escasos indicios de sentido de la responsabilidad de sus propias acciones o muestra varios ejemplos claros de una falta de responsabilidad que sí sería esperable a su edad cronológica.',
    },
  },
  'B-9': {
    name: 'Cualidad de los acercamientos sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso efectivo de formas verbales y no-verbales para hacer claros acercamientos sociales hacia el examinador. Los acercamientos deben ser apropiados al contexto inmediato.',
      1: 'Cualidad levemente inusual de algunos acercamientos sociales. Pueden restringirse a demandas personales o estar relacionados con intereses propios del individuo, pero con alguna intención de incluir al examinador en ese interés.',
      2: 'Acercamientos inapropiados; muchos acercamientos carecen de integración en el contexto o carecen de cualidad social. Incluye plantear preocupaciones pero con escasa intención de implicar al examinador.',
      3: 'Insignificante cantidad de acercamientos sociales de cualquier tipo.',
    },
  },
  'B-10': {
    name: 'Cualidad de la respuesta social',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Gama de respuestas apropiadas que varían de acuerdo a las situaciones y presiones sociales inmediatas.',
      1: 'Muestra respuesta a la mayoría de las situaciones sociales, pero algo limitada, socialmente rara, inapropiada, inconsistente o consistentemente negativa.',
      2: 'Respuestas raras o estereotipadas o respuestas con poca variación o inapropiadas al contexto.',
      3: 'Mínima o inexistente respuesta a los intentos por parte del examinador de involucrar al individuo.',
    },
  },
  'B-11': {
    name: 'Cantidad de comunicación social recíproca',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Hace un amplio uso de comportamientos verbales o no verbales para obtener intercambio social.',
      1: 'Muestra algo de comunicación social recíproca, pero reducida en frecuencia o cantidad o en número de contextos.',
      2: 'La mayor parte de la comunicación está relacionada con un objeto o en respuesta a una pregunta; o es ecolálica; o tiene que ver con ciertas preocupaciones. Hay poca charla social o de ida y vuelta.',
      3: 'Escasa o nula comunicación social recíproca.',
    },
  },
  'B-12': {
    name: 'Cualidad general del rapport',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Interacción cómoda con el examinador, apropiada al contexto.',
      1: 'Interacción cómoda por momentos, pero no sostenida (a veces se percibe como rara o artificial o el comportamiento del individuo pareciera mecánico o ligeramente inapropiado).',
      2: 'Interacción unilateral o inusual convirtiéndose en una entrevista que es levemente incómoda de forma consistente o una entrevista que hubiera sido difícil si el examinador no hubiera estado constantemente re-estructurando la situación.',
      3: 'El individuo muestra poca consideración por el examinador; o la entrevista resulta considerablemente incómoda durante una parte significativa del tiempo.',
    },
  },
  'C-1': {
    name: 'Imaginación y creatividad',
    domain: 'Imaginación',
    scores: {
      0: 'Variedad de actividades o comentarios en la conversación que fueron creativos, originales y espontáneos.',
      1: 'Algunas acciones imaginativas o creativas, pero limitadas en su variedad o en que ocurren solo en respuesta a una situación estructurada.',
      2: 'Escasas acciones imaginativas o creativas; o solo presenta acciones que son de cualidad repetitiva o estereotipada.',
      3: 'No hay acciones creativas o inventivas (ni siquiera repetitivas o estereotipadas).',
    },
  },
  'D-1': {
    name: 'Interés sensorial inusual en los materiales de juego o las personas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No realiza ninguna acción sensorial inusual (olisquear, tocar repetidamente, palpar texturas, lamer o morder, meterse algo en la boca, interés por repetir ciertos sonidos, examen visual prolongado o inusual).',
      1: 'Intereses sensoriales inusuales ocasionales; o no son tan claros como lo especificado para código 2.',
      2: 'Claro interés por elementos no funcionales de los materiales de juego; o examinación sensorial de sí mismo o de otros.',
    },
  },
  'D-2': {
    name: 'Manierismos de manos y dedos y otros manierismos complejos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Manierismos de manos o dedos o manierismos complejos breves u ocasionales; o manierismos que no son tan claros como se especifica en el código 2.',
      2: 'Hay evidentes movimientos, sacudidas o retorcimientos de dedos o manos u otros manierismos o estereotipias.',
    },
  },
  'D-3': {
    name: 'Conductas autolesivas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No intenta autolesionarse.',
      1: 'Rara vez se autolesiona o no es claro (p. ej., por lo menos una vez se muerde la mano o el brazo, o se tira del pelo, se abofetea su propia cara o se golpea la cabeza).',
      2: 'Autolesión claramente presente (más de una vez se golpea la cabeza, se abofetea, se tira del pelo o se muerde).',
    },
  },
  'D-4': {
    name: 'Excesivo interés o referencias a temas u objetos inusuales o altamente específicos o comportamientos repetitivos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo un excesivo interés o referencias a objetos o temas inusuales o altamente específicos o restringidos.',
      1: 'Referencias ocasionales a temas o patrones de interés inusuales o altamente específicos, que suceden en un grado inusual.',
      2: 'Patrones de intereses estereotipados o inusuales claramente presentes, que pueden o no interferir con la comunicación social.',
      3: 'Preocupación o preocupaciones claramente presentes, hasta el punto que interfieren con la evaluación.',
    },
  },
  'D-5': {
    name: 'Compulsiones o rituales',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo actividades o rutinas verbales claras que se debieran llevar a cabo por completo o de acuerdo a una secuencia que no fuera parte de la tarea.',
      1: 'Actividades o lenguaje inusualmente fijado a una rutina, pero no hay comportamientos que sean de cualidad claramente compulsiva.',
      2: 'Una o más actividades o rutinas verbales que el individuo tiene que completar o decir de una manera específica. El individuo parece estar bajo cierta presión o se pone ansioso si una actividad se interrumpe.',
    },
  },
  // ── Otros comportamientos (E) ──
  'E-1': {
    name: 'Elevado nivel de actividad o agitación',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'Se sienta quieto de manera apropiada durante la evaluación.',
      1: 'Se sienta pero está inquieto o se mueve constantemente en la silla. Las dificultades en la evaluación no se deben principalmente a su nivel de actividad.',
      2: 'Dificultades para quedarse sentado; se levanta del asiento o manipula los objetos de una manera que resulta difícil interrumpirlo. El elevado nivel de actividad interfiere con la evaluación.',
      7: 'Muy quieto, poca actividad.',
    },
  },
  'E-2': {
    name: 'Berrinches, agresiones, comportamientos negativos o disruptivos',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'No se muestra enfadado, negativo, destructivo o agresivo ni presenta un comportamiento disruptivo durante la evaluación con el ADOS.',
      1: 'Ocasionalmente se muestra enfadado, agresivo, negativo o presenta un comportamiento disruptivo hacia el examinador pero de forma leve.',
      2: 'Muestra negativismo marcado o repetitivo o agresiones importantes. Incluye gritos, alaridos o chillidos.',
    },
  },
  'E-3': {
    name: 'Ansiedad',
    domain: 'Otros Comportamientos Anormales',
    scores: {
      0: 'No hay signos obvios de ansiedad.',
      1: 'Signos leves de ansiedad, especialmente al principio de la entrevista o en respuesta a ítems específicos.',
      2: 'Ansiedad marcada durante la evaluación (puede ser intermitente o continua).',
    },
  },
};

// ═══════════════════════════════════════════
// MÓDULO T — Pre-Verbal / Palabras sueltas (12 a 30 meses)
// ═══════════════════════════════════════════
export const MODULE_T_DESCRIPTIONS = {
  // ── A. Lenguaje y Comunicación ──
  'A-1': {
    name: 'Nivel general de lenguaje oral no ecolálico',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso regular de verbalizaciones de dos o más palabras.',
      1: 'Solo uso ocasional de frases; en general usa palabras sueltas.',
      2: 'Solo se reconocen palabras sueltas o aproximaciones de palabras; debe utilizar por lo menos cinco palabras distintas a lo largo de la sesión.',
      3: 'Por lo menos una palabra o aproximación de palabra, pero menos de cinco palabras dichas durante la sesión.',
      4: 'No hay palabras ni aproximaciones de palabras.',
    },
  },
  'A-1a': {
    name: 'Frecuencia del balbuceo',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Reduplicaciones frecuentes de consonantes o vocales o combinaciones más complejas.',
      1: 'Sonidos de una sola sílaba frecuentes (debe contener una consonante).',
      2: 'Sonidos de una sola sílaba ocasionales (debe contener una consonante); o reduplicaciones ocasionales de consonantes o vocales.',
      3: 'No hay balbuceo (solo hay sonidos vocales).',
      8: 'Presenta demasiado lenguaje como para codificar el balbuceo (obtiene un código de 0, 1 o 2 en el ítem A1).',
    },
  },
  'A-2': {
    name: 'Frecuencia de la vocalización espontánea dirigida a otros',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Dirige vocalizaciones hacia el familiar o cuidador o al examinador en varios contextos pragmáticos. Incluye charlar o vocalizar para ser amigable o para expresar interés, además de para expresar sus necesidades.',
      1: 'Dirige vocalizaciones al familiar o cuidador o al examinador inconsistentemente en varios contextos pragmáticos.',
      2: 'Dirige vocalizaciones al familiar o cuidador o al examinador consistentemente en un solo contexto pragmático (p. ej., solo para hacer peticiones).',
      3: 'Dirige una vocalización esporádica al familiar o cuidador o al examinador; o parece que las vocalizaciones no están dirigidas nunca o casi nunca. También se codifica si solo lloriquea o llora debido a la frustración.',
    },
  },
  'A-3': {
    name: 'Entonación de las vocalizaciones o verbalizaciones',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Entonación normal, con variación apropiada, sin peculiaridades ni rarezas.',
      1: 'Entonación rara pero no tan clara como se especifica para los códigos 2 y 3; o pequeña variación en el tono; o tono algo plano o exagerado.',
      2: 'Entonación rara o tono de voz y acento inapropiados; o tono marcadamente plano o con vocalizaciones mecánicas; debe ir acompañado de alguna entonación apropiada.',
      3: 'Entonación en su mayor parte rara o inapropiada.',
      8: 'N/A (no hay suficientes vocalizaciones para poder evaluar la entonación; incluye la presencia de llanto normal y de algunas otras vocalizaciones).',
    },
  },
  'A-4': {
    name: 'Ecolalia inmediata',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No repite el habla del adulto (requiere al menos cinco palabras para codificarse como 0).',
      1: 'Eco ocasional del lenguaje.',
      2: 'Repite palabras o frases con frecuencia, pero también muestra algo de lenguaje espontáneo, el cual puede ser estereotipado.',
      3: 'El habla consiste principalmente en ecolalia inmediata.',
      8: 'No se ha percibido ecolalia, pero el lenguaje es demasiado limitado como para valorarlo.',
    },
  },
  'A-5': {
    name: 'Uso estereotipado o idiosincrásico de palabras o frases',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Nunca o casi nunca usa palabras o frases estereotipadas o idiosincrásicas (requiere al menos cinco palabras).',
      1: 'El uso de palabras o frases tiende a ser más repetitivo que en la mayoría de los niños con el mismo nivel de lenguaje expresivo, pero no es claramente raro; u ocasionalmente produce vocalizaciones estereotipadas o hace uso de palabras raras.',
      2: 'A menudo utiliza vocalizaciones estereotipadas o palabras o frases raras, junto con otro tipo de lenguaje.',
      3: 'Utiliza frecuentemente habla rara o estereotipada y raramente usa un habla espontánea no estereotipada.',
      8: 'El lenguaje es demasiado limitado como para valorarlo.',
    },
  },
  'A-6': {
    name: 'Uso del cuerpo de otro',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'No se utiliza el cuerpo de otra persona para un objetivo concreto, excepto en situaciones donde otras estrategias no han funcionado y se da junto con una mirada coordinada.',
      1: 'Toma la mano del adulto y la lleva a distintos lugares sin una mirada o contacto visual coordinado, pero no la coloca sobre los objetos ni la utiliza como herramienta; o mueve la mano del examinador sin establecer contacto visual SOLO en Bloqueo de juguetes.',
      2: 'Mueve la mano de otra persona mientras está sosteniendo un objeto; o aleja la mano del examinador de un juguete u objeto sin establecer contacto visual. Esto debe ocurrir en una actividad distinta de Bloqueo de juguetes.',
      3: 'Coloca la mano del adulto u otra parte de su cuerpo sobre un objeto; o usa la mano u otra parte del cuerpo del adulto como herramienta o como gesto del niño.',
      8: 'N/A (escasa o inexistente comunicación espontánea; o no se ha aplicado Bloqueo de juguetes y no se ha utilizado el cuerpo de otro).',
    },
  },
  'A-7': {
    name: 'Señalar',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Señala con el dedo índice para mostrar una referencia dirigida visualmente (mirada coordinada hacia el objeto y la persona) a objetos que están a distancia, en al menos dos actividades.',
      1: 'Señala para referirse a objetos, pero sin la flexibilidad ni la frecuencia suficiente; o produce una aproximación a la acción de señalar; o coordina la mirada o la vocalización únicamente con la acción de señalar que incluye tocar objetos cercanos.',
      2: 'Señala únicamente cuando está cerca de tocar o está tocando un objeto, sin que se coordine con la mirada o una vocalización.',
      3: 'No señala objetos de ninguna de las maneras descritas anteriormente.',
    },
  },
  'A-8': {
    name: 'Gestos',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Uso espontáneo de al menos tres gestos diferentes de cualquier tipo; por lo menos uno se debe usar en más de una actividad.',
      1: 'Uso espontáneo de al menos dos gestos descriptivos, convencionales, instrumentales o emocionales; o de tres o más gestos pero cada gesto se utiliza solo en una actividad.',
      2: 'Uso espontáneo de solo un gesto o de un gesto comunicativo para alcanzar objetos; o uso solo de gestos solicitados o imitados.',
      3: 'No hay un uso espontáneo, solicitado ni imitado de gestos descriptivos, convencionales, instrumentales o emocionales; o solo hay un uso inapropiado.',
      8: 'N/A (limitado por alguna dificultad motora severa).',
    },
  },
  'A-9': {
    name: 'Frecuencia de vocalización no dirigida',
    domain: 'Lenguaje y Comunicación',
    scores: {
      0: 'Pocas vocalizaciones no dirigidas.',
      1: 'Varias vocalizaciones no dirigidas en una actividad; o vocalizaciones no dirigidas infrecuentes en varias actividades.',
      2: 'Vocalizaciones no dirigidas frecuentes; puede incluir también vocalizaciones socialmente dirigidas.',
      3: 'Vocalizaciones no dirigidas frecuentes y casi todas las vocalizaciones no son dirigidas.',
      8: 'Nunca o casi nunca vocaliza.',
    },
  },
  // ── B. Interacción Social Recíproca ──
  'B-1': {
    name: 'Contacto visual inusual',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mirada apropiada, con cambios sutiles entremezclados con otro tipo de comunicación.',
      1: 'Mirada dirigida evidente con alguna modulación; sin embargo, no es consistente o no combina cambios sutiles con otro tipo de comunicación.',
      2: 'Establece un contacto visual modulado de manera pobre para iniciar, terminar o regular una interacción social.',
      3: 'Establece un contacto visual modulado de manera pobre para iniciar, terminar o regular una interacción social y evita activamente el contacto visual de manera frecuente.',
    },
  },
  'B-2': {
    name: 'Expresiones faciales dirigidas a otros',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Dirige diversas expresiones faciales apropiadas al familiar o cuidador o al examinador con la intención de comunicar estados emocionales o cognitivos.',
      1: 'Dirige algunas expresiones faciales al examinador o al familiar o cuidador (p. ej., en los extremos emocionales). Se le puede asignar este código a un niño que dirija pocas expresiones faciales pero que dirija la mayoría de sus expresiones a otra persona.',
      2: 'Utiliza cierta variedad de expresiones faciales pero poco dirigidas o dirige una sola expresión facial.',
      3: 'Variedad limitada de expresiones faciales y no dirigidas.',
    },
  },
  'B-3': {
    name: 'Juego imposible',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Establece contacto visual en los dos ensayos (debe ser con el examinador).',
      1: 'Establece contacto visual en un solo ensayo (debe ser con el examinador).',
      2: 'No establece contacto visual, pero muestra conciencia de la situación mediante la vocalización y otros medios (distintos a mover la mano o el cuerpo del examinador).',
      3: 'Mueve la mano del examinador sin establecer contacto visual; o no responde a ninguna de las presiones.',
    },
  },
  'B-4': {
    name: 'Juego de broma',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Establece contacto visual en los dos ensayos (debe ser con el examinador).',
      1: 'Establece contacto visual en un solo ensayo (debe ser con el examinador).',
      2: 'No establece contacto visual, pero muestra conciencia de la situación mediante la vocalización y otros medios (distintos a mover la mano o el cuerpo del examinador).',
      3: 'Mueve la mano del examinador sin establecer contacto visual; o no responde a ninguna de las presiones.',
      8: 'N/A.',
    },
  },
  'B-5': {
    name: 'Integración de la mirada y otras conductas durante las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Normalmente utiliza un contacto visual adecuado junto con palabras o vocalizaciones o gestos para comunicar una intención social.',
      1: 'Utiliza tanto el contacto visual como otras estrategias para comunicar una intención social en momentos diferentes, pero no los coordina entre sí. También si integra ocasionalmente el contacto visual con palabras o vocalizaciones o gestos.',
      2: 'Utiliza principalmente una estrategia (contacto visual, vocalizaciones o gestos) para comunicar intención social, sin integrarlos.',
      3: 'Utiliza pocas veces alguna estrategia comunicativa para comunicar intención social; o no hay iniciaciones sociales.',
    },
  },
  'B-6': {
    name: 'Disfrute compartido durante la interacción',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Da muestras claras de disfrute con el examinador que son adecuadas al contexto y que ocurren en más de una actividad. Debe incluir disfrute en al menos una actividad que no sea de naturaleza puramente física.',
      1: 'Da muestras claras de disfrute dirigidas al examinador durante una sola interacción (puede ser de naturaleza física).',
      2: 'Muestra cierto disfrute apropiado en la interacción con el examinador o puede mostrar disfrute en la interacción con el familiar o cuidador.',
      3: 'Muestra poco o ningún disfrute en la interacción con el examinador o el familiar o cuidador. Puede mostrar disfrute en sus propias acciones o en los juguetes.',
    },
  },
  'B-7': {
    name: 'Respuesta al nombre',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Mira hacia la cara del examinador inmediatamente en por lo menos una de las dos primeras presiones realizadas por el examinador.',
      1: 'Mira hacia el familiar o cuidador después del primer o segundo intento de llamarle solo por su nombre; o mira hacia el examinador después del tercer o cuarto intento.',
      2: 'No mira hacia el examinador o el familiar o cuidador inmediatamente después de que se le haya llamado por su nombre en seis ocasiones, sino que mira solamente después de una vocalización o verbalización que le resulte interesante o familiar.',
      3: 'No mira hacia el examinador o al familiar o cuidador después de cualquier intento puramente verbal u oral para intentar conseguir su atención. Puede mirar en respuesta a que le toquen.',
    },
  },
  'B-8': {
    name: 'Ignorar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Demanda de atención clara, con mirada y vocalización integradas dirigidas hacia el examinador o el familiar o cuidador.',
      1: 'Demanda de atención clara, con mirada y vocalización hacia el examinador o familiar pero sin estar integradas; o demanda de atención clara con gestos y verbalización pero sin mirarles; o mirada y gestos sin vocalización.',
      2: 'Mira o vocaliza o hace gestos al examinador o al familiar; o mira a su alrededor incluyendo al examinador o al familiar; o se produce demanda de atención dudosa.',
      3: 'Comportamiento agitado o no dirigido hacia el examinador o el familiar o cuidador.',
    },
  },
  'B-9': {
    name: 'Pedir',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Exhibe una integración apropiada del contacto visual y de por lo menos un comportamiento más para pedir en más de una actividad. Debe incluir el establecimiento del contacto visual con el adulto y una indicación clara de que quiere que el adulto haga o le dé algo.',
      1: 'Exhibe los comportamientos descritos en el código 0 pero ocurren solo en una actividad.',
      2: 'Realiza uno o más de los comportamientos descritos para pedir sin integrar el contacto visual con otros comportamientos como vocalizaciones o gestos. Incluye alcanzarle un objeto a un adulto sin mirarlo, o mirarlo sin otro comportamiento que lo acompañe.',
      3: 'No hace una petición directa. Puede participar en la rutina o tratar de activar el objeto mediante vocalizaciones no dirigidas o golpeando sin mirar a otra persona. Puede incluir que tire de la mano del examinador hacia un objeto.',
    },
  },
  'B-10': {
    name: 'Cantidad de peticiones',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Realiza peticiones a lo largo de las actividades frecuentemente.',
      1: 'Realiza peticiones a lo largo de las actividades pocas veces.',
      2: 'Realiza peticiones solo en una actividad (p. ej., durante la merienda).',
      3: 'No realiza peticiones o solo hace peticiones confusas.',
    },
  },
  'B-11': {
    name: 'Dar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Entrega espontáneamente juguetes u objetos a otras personas durante la evaluación. Debe incluir al menos un ejemplo claro de entregar juguetes, comida o comida de juguete con el propósito de compartir.',
      1: 'Da objetos a otras personas de manera consistente con el propósito de recibir ayuda, como parte de una rutina o con una intención ambigua.',
      2: 'Da objetos a veces, tal y como se ha descrito para el código 1.',
      3: 'Nunca o casi nunca da algo a otra persona.',
    },
  },
  'B-12': {
    name: 'Mostrar',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Muestra espontáneamente juguetes u objetos durante la evaluación, sosteniéndolos o colocándolos delante de un adulto y estableciendo contacto visual con o sin vocalización.',
      1: 'Solo un ejemplo claro de mostrar, tal y como se describe para un código 0.',
      2: 'Muestra juguetes u objetos de una manera parcial o inconsistente (p. ej., sostiene un objeto o lo coloca delante de un adulto sin coordinarlo con el contacto visual).',
      3: 'No muestra objetos a otra persona.',
    },
  },
  'B-13': {
    name: 'Iniciación espontánea de la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa el contacto visual integrado claramente para dirigir la atención de un adulto hacia un objeto que está fuera del alcance mirando primero al objeto, luego al examinador o familiar y nuevamente al objeto. Un ejemplo claro es suficiente.',
      1: 'Mira el objeto y luego mira al examinador o al familiar o cuidador, pero no vuelve a mirar al objeto.',
      2: 'Hace referencias parciales a un objeto que está fuera del alcance. Puede mirar al objeto o señalar o vocalizar, pero no coordina ninguna de estas acciones con mirar a otra persona.',
      3: 'No hay una aproximación a una iniciación espontánea de atención conjunta para dirigir la atención de otra persona hacia un objeto que está fuera del alcance del niño.',
    },
  },
  'B-14': {
    name: 'Respuesta a la atención conjunta',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Usa la orientación de los ojos y la cara del examinador como único estímulo para mirar hacia lo indicado, sin que haya necesidad de señalar.',
      1: 'Sigue la acción de señalar del examinador mirando a o en la dirección del objeto.',
      2: 'No sigue la mirada del examinador ni su acción de señalar, pero mira hacia el objeto cuando se activa.',
      3: 'No se orienta hacia el objeto incluso cuando este está activado.',
    },
  },
  'B-15': {
    name: 'Características de las iniciaciones sociales',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Uso efectivo de formas no verbales y verbales con la intención de realizar iniciaciones sociales claras hacia el examinador o hacia el familiar o cuidador. Apropiadas a los contextos inmediatos.',
      1: 'Las iniciaciones sociales tienen características ligeramente inusuales. Se restringen a demandas personales o están relacionadas con intereses marcados, pero con alguna intención de implicar al familiar o al examinador en esos intereses.',
      2: 'Las iniciaciones a menudo carecen de integración en el contexto; o de naturaleza social. Se asigna si muestra alguna iniciación social claramente inapropiada.',
      3: 'No hay iniciaciones sociales de ningún tipo.',
    },
  },
  'B-16a': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: EXAMINADOR',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del examinador o de dirigirla hacia objetos o acciones interesantes para el niño.',
      1: 'Algunos intentos de captar, mantener o dirigir la atención del examinador, pero se observan con escasa frecuencia o en pocas actividades diferentes.',
      2: 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del examinador, incluyendo iniciaciones que únicamente tienen la intención de buscar consuelo.',
      3: 'Muestra relativamente poca preocupación con respecto a si el examinador está prestándole atención o no a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
    },
  },
  'B-16b': {
    name: 'Cantidad de iniciaciones sociales / mantenimiento de la atención: FAMILIAR O CUIDADOR',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Intentos frecuentes de captar o mantener la atención del familiar o cuidador o de dirigirla hacia objetos o acciones interesantes para el niño.',
      1: 'Algunos intentos de captar, mantener o dirigir la atención del familiar o cuidador, pero se observan con escasa frecuencia o en pocas actividades diferentes.',
      2: 'Realiza intentos ocasionales de captar, mantener o dirigir la atención del familiar o cuidador, incluyendo iniciaciones que tienen únicamente la intención de buscar consuelo.',
      3: 'Muestra relativamente poca preocupación con respecto a si el familiar o cuidador está prestándole atención o no a menos que necesite ayuda.',
      7: 'Demandas de atención inusualmente frecuentes, intensas o excesivas.',
      8: 'El familiar o cuidador no estuvo presente durante la aplicación del ADOS-2.',
    },
  },
  'B-17': {
    name: 'Nivel de implicación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'Se implica espontáneamente y se muestra interesado en las actividades que le presenta el examinador de manera consistente.',
      1: 'Se implica espontáneamente de forma inconsistente.',
      2: 'Se implica solo cuando el examinador se esfuerza en obtener y mantener el interés del niño.',
      3: 'No se implica ni cuando el examinador se esfuerza en atraer el interés del niño, o el niño se implica durante la merienda o los juegos solo cuando se produce contacto físico.',
    },
  },
  'B-18': {
    name: 'Calidad general de la relación',
    domain: 'Interacción Social Recíproca',
    scores: {
      0: 'La interacción entre el niño y el examinador es agradable y apropiada dentro del contexto de la evaluación del ADOS-2.',
      1: 'La interacción es agradable a veces, pero no de forma sostenida (a veces se ha sentido raro o poco natural, o el comportamiento del niño ha parecido mecánico o ligeramente inapropiado).',
      2: 'Interacción unilateral o inusual dando como resultado una sesión ligeramente incómoda de manera sistemática.',
      3: 'El niño muestra una consideración mínima hacia el examinador; o la observación es marcadamente difícil o incómoda durante una parte significativa del tiempo.',
    },
  },
  // ── C. Juego ──
  'C-1': {
    name: 'Juego funcional con objetos',
    domain: 'Juego',
    scores: {
      0: 'Juega espontáneamente con diversos juguetes de una manera convencional, incluyendo juegos apropiados con varias miniaturas o juguetes figurativos diferentes.',
      1: 'Realiza algo de juego funcional espontáneo con al menos una miniatura o juguete figurativo.',
      2: 'Únicamente juega de manera adecuada con juguetes de causa y efecto o juguetes de construcción; o juega a empujar el coche de juguete.',
      3: 'No juega con los juguetes o únicamente lo hace de manera estereotipada.',
    },
  },
  'C-2': {
    name: 'Imaginación y creatividad',
    domain: 'Juego',
    scores: {
      0: 'Usa espontáneamente la muñeca u otro objeto como agente independiente; o usa espontáneamente los objetos para representar otros objetos.',
      1: 'Realiza juego simbólico espontáneo con la muñeca u otros objetos, pero no emplea la muñeca u otros juguetes como agentes independientes o para representar otra cosa.',
      2: 'Imita el juego simbólico como se describe en el código 1; o lo imita con un sustituto; pero no hay juego simbólico espontáneo.',
      3: 'No hay juego simbólico espontáneo ni imitado.',
    },
  },
  'C-3': {
    name: 'Imitación funcional y simbólica',
    domain: 'Juego',
    scores: {
      0: 'El niño utiliza el sustituto como un objeto que no ha sido previamente presentado.',
      1: 'El niño utiliza el sustituto como un objeto que ha sido previamente presentado.',
      2: 'El niño imita el uso de un objeto real previamente presentado.',
      3: 'No se produce imitación tal y como se define en los códigos anteriores.',
    },
  },
  // ── D. Comportamientos Estereotipados e Intereses Restringidos ──
  'D-1': {
    name: 'Interés sensorial inusual en los materiales de juego o en las personas',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No presenta intereses sensoriales inusuales ni comportamientos de búsqueda sensorial.',
      1: 'Varios intereses sensoriales posibles pero no tan claros como los especificados para el código 2; o solo se observa claramente un caso de interés sensorial inusual.',
      2: 'Interés evidente por elementos sensoriales de los objetos o de los materiales de juego; o examen sensorial de sí mismo o de otros. Deben observarse dos o más ejemplos claros.',
      3: 'Comportamientos evidentes e inusuales de búsqueda sensorial que ocurren durante al menos dos tareas o actividades diferentes y que pueden interferir con la evaluación del ADOS-2.',
    },
  },
  'D-2': {
    name: 'Movimientos de manos y dedos / postura',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Movimientos inusuales o repetitivos que no son tan claros como lo que se especifica para los códigos 2 y 3.',
      2: 'Hay manierismos de manos y dedos evidentes. Si son claros, pueden ser breves o infrecuentes.',
      3: 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.',
    },
  },
  'D-3': {
    name: 'Otros manierismos complejos',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'Ninguno.',
      1: 'Manierismos inusuales o repetitivos que no son tan claros como lo que se especifica para los códigos 2 y 3.',
      2: 'Hay manierismos complejos evidentes. Si son claros, pueden ser breves o infrecuentes.',
      3: 'Los manierismos ocurren frecuentemente durante al menos dos tareas o actividades diferentes o pueden interferir con la evaluación del ADOS-2.',
    },
  },
  'D-4': {
    name: 'Conducta autolesiva',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No intenta autolesionarse.',
      1: 'Autolesión dudosa o posible.',
      2: 'Autolesión infrecuente pero clara (al menos se observa un ejemplo claro de morderse su propia mano, de tirarse del pelo, de abofetearse su propia cara o de golpearse la cabeza).',
      3: 'Más de un ejemplo claro de autolesión, como golpearse la cabeza, abofetearse la propia cara, tirarse del pelo o morderse.',
    },
  },
  'D-5': {
    name: 'Intereses inusualmente repetitivos o comportamientos estereotipados',
    domain: 'Comportamientos Estereotipados e Intereses Restringidos',
    scores: {
      0: 'No hubo comportamientos repetitivos ni estereotipados durante la evaluación con el ADOS-2.',
      1: 'Un interés o comportamiento que es repetitivo o estereotipado hasta el punto de ser inusual. Este interés o comportamiento surge durante otras actividades y no interfiere con las actividades del ADOS-2.',
      2: 'Intereses o comportamientos claramente repetitivos o estereotipados. Constituyen una minoría sustancial de los intereses y comportamientos espontáneos del niño y pueden interferir con la capacidad del niño para completar las actividades del ADOS-2.',
      3: 'Los intereses o comportamientos repetitivos o estereotipados constituyen la mayoría de los intereses del niño; o el niño muestra resistencia o gran angustia ante los intentos de dirigir su atención hacia otros objetos o actividades.',
    },
  },
  // ── E. Otros Comportamientos ──
  'E-1': {
    name: 'Elevado nivel de actividad',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'Se sienta o se queda quieto adecuadamente cuando se espera que lo haga durante la evaluación con el ADOS-2. Puede explorar la habitación como sería esperable para su nivel de desarrollo.',
      1: 'Se sienta o se queda quieto cuando se espera claramente que lo haga en actividades distintas de la merienda, pero se mueve constantemente o se levanta del asiento.',
      2: 'Inquieto; es más activo que otros niños de su mismo nivel de desarrollo.',
      3: 'Se mueve sin parar y de manera enérgica de un lado al otro de la habitación, de una manera que resulta difícil interrumpirlo; el nivel de actividad interfiere con la evaluación.',
      7: 'Muy quieto, muy poca actividad.',
    },
  },
  'E-2': {
    name: 'Lloriqueo e irritabilidad',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No muestra lloriqueo ni irritabilidad durante la evaluación del ADOS-2, o muestra ocasionalmente un lloriqueo o una irritabilidad leve que dura menos de 3 segundos.',
      1: 'Muestra ocasionalmente una irritabilidad leve que dura al menos de 3 a 5 segundos.',
      2: 'Muestra susceptibilidad o irritabilidad de forma repetida. Se incluye aquí cualquier grito en voz alta.',
      3: 'Tiene berrinches con o sin alguna muestra de agresión.',
    },
  },
  'E-3': {
    name: 'Comportamiento agresivo o disruptivo',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No se muestra agresivo ni disruptivo de manera intencional durante la evaluación con el ADOS-2.',
      1: 'Ocasionalmente muestra comportamientos leves de agresión o intencionalmente disruptivos.',
      2: 'Muestra comportamientos leves de agresión o intencionalmente disruptivos de manera repetida.',
      3: 'Exhibe uno o varios comportamientos claros de agresión de intensidad significativa.',
    },
  },
  'E-4': {
    name: 'Ansiedad',
    domain: 'Otros Comportamientos',
    scores: {
      0: 'No hay una ansiedad evidente o muestra un recelo inicial breve.',
      1: 'Signos leves de ansiedad; o muestra una ansiedad leve y prolongada ante los desconocidos.',
      2: 'Ansiedad marcada solo en respuesta a una petición concreta o a un juguete o tarea en particular; o ansiedad marcada y persistente ante los desconocidos.',
      3: 'Ansiedad marcada en respuesta a más de un juguete o tarea o en varias ocasiones a lo largo de la evaluación del ADOS-2.',
    },
  },
};

// ═══════════════════════════════════════════
// INDEX: Acceso por módulo
// ═══════════════════════════════════════════
export const SCORE_DESCRIPTIONS = {
  'T': MODULE_T_DESCRIPTIONS,
  '1': MODULE_1_DESCRIPTIONS,
  '2': MODULE_2_DESCRIPTIONS,
  '3': MODULE_3_DESCRIPTIONS,
  '4': MODULE_4_DESCRIPTIONS,
};

/**
 * Obtiene la descripción de un puntaje para un ítem específico.
 * @param {string} module - Módulo ADOS-2 ('T', '1', '2', '3', '4')
 * @param {string} itemCode - Código del ítem (p.ej. 'A-7', 'B-1')
 * @param {number} score - Puntaje raw (0, 1, 2, 3, 7, 8, 9)
 * @returns {{ name: string, domain: string, description: string } | null}
 */
export function getScoreDescription(module, itemCode, score) {
  const moduleDescs = SCORE_DESCRIPTIONS[module];
  if (!moduleDescs) return null;
  const item = moduleDescs[itemCode];
  if (!item) return null;
  const description = item.scores[score];
  if (!description) return null;
  return { name: item.name, domain: item.domain, description };
}
