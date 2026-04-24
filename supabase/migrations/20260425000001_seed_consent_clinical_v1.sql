-- ============================================================================
-- Migration: seed `consentimiento-clinico` v1 en legal_documents
-- ----------------------------------------------------------------------------
-- Spec: desbloquea onboarding real de pacientes en beta
--
-- Context:
-- La tabla `legal_documents` existe pero estaba vacía en prod — por eso
-- `ClinicalConsentGate` no tenía documento para presentar al paciente en
-- el primer login. Block launch-beta detectado durante auditoría.
--
-- Template source: docs/legal/consentimiento-clinico-v1.md
-- Redactado como v1 pragmático (sin abogado) para beta N<=10 clínicas.
-- Cuando llegue v2 del abogado: UPDATE content + version=2. Firmas v1
-- quedan como registro histórico válido.
--
-- Placeholders usados (actualizar post-beta):
--   - Email ARCO: soporte@dentalspot.cl
--   - Razón social: Communicare SpA (en formación)
--   - RUT: [Pendiente de formalización]
--   - Dirección: Chile
--
-- Idempotente: WHERE NOT EXISTS previene duplicados si se aplica >1 vez.
-- ============================================================================

INSERT INTO public.legal_documents (
  slug,
  title,
  type,
  version,
  status,
  content,
  published_at,
  effective_date,
  created_at,
  updated_at
)
SELECT
  'consentimiento-clinico',
  'Consentimiento Informado y Tratamiento de Datos',
  'consent',
  1,
  'published',
  $CONTENT$
CONSENTIMIENTO INFORMADO Y AUTORIZACIÓN
TRATAMIENTO ODONTOLÓGICO Y USO DE LA PLATAFORMA DENTALSPOT

Versión: 1
Fecha de vigencia: 2026-04-25

========================================================================
PRESENTACIÓN
========================================================================

Este documento tiene dos finalidades simultáneas:

(1) Formalizar tu consentimiento informado para el tratamiento odontológico
    que recibirás del profesional o clínica que te está atendiendo, según lo
    dispuesto por la Ley 20.584 sobre derechos y deberes de las personas en
    relación con acciones vinculadas a su atención en salud.

(2) Obtener tu autorización explícita para el tratamiento de tus datos
    personales y datos de salud en la plataforma DentalSpot, conforme a la
    Ley 21.719 de protección de datos personales y la Ley 19.628 (vigente
    durante el período de transición).

Te pedimos que lo leas con atención antes de firmar. Si algo no queda claro,
tenés derecho a preguntar a tu dentista o a solicitar tiempo para consultar
con otra persona de confianza.


========================================================================
SECCIÓN A — CONSENTIMIENTO PARA EL TRATAMIENTO ODONTOLÓGICO (Ley 20.584)
========================================================================

Al firmar este documento confirmás que:

1. Fuiste informado/a por el profesional sobre tu diagnóstico, el tratamiento
   propuesto, los procedimientos que involucra, su duración estimada, los
   beneficios esperados, los riesgos posibles (incluidos los poco frecuentes
   pero relevantes) y las alternativas terapéuticas disponibles, incluyendo
   la opción de no tratarse.

2. Tuviste la oportunidad de hacer todas las preguntas que considerás
   necesarias, y que estas fueron respondidas en lenguaje comprensible.

3. Entendés que tenés derecho a:
   - Rehusar el tratamiento en cualquier momento.
   - Solicitar una segunda opinión profesional antes de continuar.
   - Revocar este consentimiento cuando quieras (ver Sección H).
   - Ser informado/a de cualquier cambio significativo en el plan de
     tratamiento antes de que se ejecute.

4. Aceptás recibir el tratamiento en los términos conversados con tu
   profesional.


========================================================================
SECCIÓN B — AUTORIZACIÓN PARA REGISTRO DIGITAL DE TU FICHA CLÍNICA
========================================================================

Autorizás que tu información clínica — que incluye:

- Datos de identificación (nombre, RUT, contacto)
- Historia clínica odontológica (diagnósticos, tratamientos, evoluciones)
- Odontograma, radiografías y fotografías clínicas cuando correspondan
- Evaluaciones, planes de tratamiento y consentimientos específicos
- Prescripciones y recomendaciones

sea almacenada digitalmente en la plataforma DentalSpot, con los siguientes
resguardos:

- Los datos se almacenan en bases de datos con acceso restringido por rol
  (Row-Level Security) y cifrado en tránsito (TLS).
- Sólo tu profesional tratante y sus colaboradores autorizados (auxiliares,
  recepcionistas de su clínica) pueden acceder a tu ficha.
- DentalSpot como plataforma NO comercializa ni cede tus datos a terceros
  con fines publicitarios ni de marketing.
- El acceso de terceros (por ejemplo otro profesional en la misma clínica)
  queda auditado con registro inalterable (quién, cuándo, qué accedió).


========================================================================
SECCIÓN C — TRATAMIENTO DE DATOS PERSONALES (Ley 21.719)
========================================================================

RESPONSABLE DEL TRATAMIENTO:
Tu profesional o clínica tratante es el "responsable del tratamiento" en
términos de la Ley 21.719. Esto significa que decide las finalidades y
medios del tratamiento de tus datos clínicos.

ENCARGADO DEL TRATAMIENTO:
DentalSpot opera como "encargado del tratamiento" — provee la infraestructura
técnica donde tus datos son almacenados y procesados, siguiendo las
instrucciones del responsable. DentalSpot está sujeto a obligaciones de
seguridad y confidencialidad contractuales.

FINALIDADES DEL TRATAMIENTO:
Tus datos son tratados para:
- Ejecutar la atención odontológica contratada.
- Mantener tu ficha clínica como exige la regulación sanitaria.
- Permitir comunicación entre vos y tu profesional (recordatorios, notas).
- Cumplir obligaciones legales tributarias y sanitarias.

BASES LEGALES DEL TRATAMIENTO (Ley 21.719 art. 12):
- Tu consentimiento expreso (este documento).
- Ejecución del contrato de atención odontológica.
- Cumplimiento de obligaciones legales del profesional (registro de ficha).
- Intereses vitales (en caso de emergencia médica).

CATEGORÍAS DE DATOS SENSIBLES:
Los datos clínicos constituyen "datos sensibles" bajo la Ley 21.719 y reciben
protección reforzada. No serán usados para fines distintos a los médicos
autorizados sin tu consentimiento adicional expreso.


========================================================================
SECCIÓN D — TUS DERECHOS (ARCO + Portabilidad)
========================================================================

Conforme a la Ley 21.719, podés ejercer en cualquier momento los siguientes
derechos sobre tus datos:

1. ACCESO: pedir copia de la información que tenemos sobre vos.
2. RECTIFICACIÓN: corregir datos inexactos o incompletos.
3. CANCELACIÓN / SUPRESIÓN: solicitar la eliminación de tus datos cuando ya
   no sean necesarios para la finalidad original. Aplican límites legales
   (ver Sección E sobre retención).
4. OPOSICIÓN: oponerte al tratamiento de tus datos para finalidades
   específicas cuando concurran razones legítimas.
5. PORTABILIDAD: recibir tus datos en formato estructurado (ej. PDF o JSON)
   para transferirlos a otro profesional de tu elección.
6. LIMITACIÓN: pedir que el tratamiento se suspenda temporalmente mientras
   se resuelve una disputa.

CÓMO EJERCER ESTOS DERECHOS:
- Contactá a tu profesional o clínica tratante (canal principal).
- O escribí directamente a DentalSpot al email soporte@dentalspot.cl
  indicando tu nombre, RUT y el derecho que querés ejercer.
- Te responderemos en un plazo máximo de 20 días hábiles.
- Si no quedás conforme con la respuesta, podés reclamar ante la Agencia
  Nacional de Protección de Datos Personales (cuando esté operativa) o
  iniciar acciones judiciales.


========================================================================
SECCIÓN E — RETENCIÓN DE DATOS
========================================================================

- Mientras mantengas una atención activa con tu profesional: los datos se
  conservan indefinidamente para permitir continuidad de la atención.
- Post-fin de la atención: los datos clínicos se conservan por al menos
  5 años, plazo exigido por normativa sanitaria chilena para la custodia
  de fichas clínicas.
- Pasado ese plazo, podés solicitar su eliminación total. Alternativamente,
  se procederá a la anonimización (disociación irreversible de tu identidad)
  para fines estadísticos agregados.
- Datos de facturación se conservan por el plazo exigido por normativa
  tributaria (6 años típicamente).


========================================================================
SECCIÓN F — TRANSFERENCIA INTERNACIONAL DE DATOS
========================================================================

La infraestructura técnica de DentalSpot opera sobre servidores de Supabase
Inc. (proveedor cloud), los cuales se encuentran físicamente en Estados
Unidos (región AWS US-East-1, Virginia).

Esto implica que tus datos serán transferidos y almacenados fuera del
territorio chileno. DentalSpot:
- Tiene un acuerdo contractual con Supabase que incluye cláusulas de
  protección estándar (Standard Contractual Clauses) y obligaciones de
  seguridad equivalentes a la Ley 21.719.
- No permite transferencias ulteriores a terceros sin tu consentimiento.
- Responde contractualmente por cualquier incidente de seguridad en el
  proveedor.

Al firmar este documento aceptás esta transferencia internacional.


========================================================================
SECCIÓN G — GRABACIÓN DE AUDIO CON IA (OPCIONAL — CHECKBOX SEPARADO)
========================================================================

ESTA SECCIÓN ES OPT-IN. La podés aceptar o rechazar de forma independiente
al resto del consentimiento. No afecta tu atención odontológica.

QUÉ ES: DentalSpot ofrece una funcionalidad llamada "Notiz" que graba el
audio de tu consulta odontológica y utiliza inteligencia artificial para
generar automáticamente notas clínicas legibles. Esto ahorra tiempo al
profesional y mejora la precisión del registro.

QUÉ INCLUYE:
- Grabación de audio durante la consulta (local o servidor).
- Procesamiento del audio mediante un modelo de IA para generar texto.
- Guardado del texto en tu ficha clínica.

QUÉ NO INCLUYE:
- Reconocimiento facial o análisis de video.
- Uso del audio para entrenar modelos de IA (sin consentimiento adicional).
- Acceso del audio por personas distintas a tu profesional tratante.

CÓMO REVOCAR:
Podés pedirle a tu profesional que no grabe una consulta específica, o
revocar el consentimiento general en cualquier momento. Las grabaciones
previas se eliminarán dentro de 30 días de tu solicitud.


========================================================================
SECCIÓN H — REVOCACIÓN DEL CONSENTIMIENTO
========================================================================

Podés revocar este consentimiento en cualquier momento, total o parcialmente,
sin necesidad de justificar. La revocación tiene efecto desde el momento de
tu solicitud y no afecta la legalidad del tratamiento realizado previamente.

Consecuencias:
- Si revocás el consentimiento para el tratamiento odontológico: el
  profesional no podrá continuar la atención.
- Si revocás el consentimiento para el tratamiento de datos: se aplicarán
  los plazos de retención de la Sección E. Datos con obligación legal de
  retención serán mantenidos hasta el plazo mínimo legal y luego eliminados.

Para revocar, contactá a tu profesional o escribí a soporte@dentalspot.cl.


========================================================================
SECCIÓN I — FIRMA DIGITAL
========================================================================

Al marcar "Firmar Consentimiento" en la plataforma, tu firma digital quedará
registrada con:
- Fecha y hora exacta (timestamp servidor).
- Dirección IP desde la cual firmaste.
- Identificador del dispositivo (user agent).
- Versión exacta de este documento que aceptaste.

Estos registros tienen valor probatorio conforme a la Ley 19.799 sobre
documentos electrónicos y firma electrónica simple.

Cuando este documento se actualice (nueva versión por cambio legal,
operacional, o de cobertura), se te pedirá firmar la nueva versión. Las
firmas anteriores seguirán siendo válidas para el tratamiento efectuado
bajo esa versión.


========================================================================
IDENTIDAD DEL RESPONSABLE Y CONTACTO
========================================================================

Responsable del tratamiento (tu profesional o clínica):
— Se identifica en la interfaz de la plataforma antes de la firma.

Encargado del tratamiento (plataforma):
— Communicare SpA (en formación)
— RUT: [Pendiente de formalización]
— Dirección comercial: Chile
— Contacto para derechos ARCO: soporte@dentalspot.cl

Autoridad de control (Chile):
— Agencia Nacional de Protección de Datos Personales (cuando esté operativa
  conforme a Ley 21.719).
— Transitoriamente: Servicio Nacional del Consumidor (SERNAC) para materias
  de protección del consumidor.

========================================================================
FIN DEL DOCUMENTO
========================================================================
$CONTENT$,
  NOW(),
  CURRENT_DATE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.legal_documents
  WHERE slug = 'consentimiento-clinico'
);
