# Consentimiento Clínico v1 — Template para `legal_documents`

**⚠️ DISCLAIMER IMPORTANTE**: Este documento es un **template v1 pragmático** redactado por IA (no por abogado) para desbloquear el launch beta de DentalSpot con una base legal mínima. **Su objetivo** es activar el sistema de consent que ya está implementado en código y permitir operación con compliance básica Ley 20.584 + Ley 21.719.

**Antes de usar en producción**:
- Revisar con abogado chileno especializado en salud digital (idealmente con experiencia en telemedicina / fichas clínicas electrónicas).
- El abogado probablemente generará una v2 que reemplace esta. Ver `known-issues.md §Opción E1/E2` para el flujo de versionado.
- Este template fue redactado con las mejores prácticas observadas en SaaS de salud chilenos pero puede faltar cobertura de casos edge específicos (menores de edad, tratamientos especiales, etc.).

---

## Dos versiones

**A. Texto completo para mostrar al paciente** (sección siguiente) — este es el contenido que va en la columna `legal_documents.content` y que el paciente lee antes de firmar.

**B. SQL INSERT** (al final) — copy-paste al Supabase SQL Editor para sembrar el row.

---

## A. TEXTO DEL DOCUMENTO (para `content`)

```
CONSENTIMIENTO INFORMADO Y AUTORIZACIÓN
TRATAMIENTO ODONTOLÓGICO Y USO DE LA PLATAFORMA DENTALSPOT

Versión: 1
Fecha de vigencia: 2026-04-22

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
tienes derecho a preguntar a tu dentista o a solicitar tiempo para consultar
con otra persona de confianza.


========================================================================
SECCIÓN A — CONSENTIMIENTO PARA EL TRATAMIENTO ODONTOLÓGICO (Ley 20.584)
========================================================================

Al firmar este documento confirmas que:

1. Fuiste informado/a por el profesional sobre tu diagnóstico, el tratamiento
   propuesto, los procedimientos que involucra, su duración estimada, los
   beneficios esperados, los riesgos posibles (incluidos los poco frecuentes
   pero relevantes) y las alternativas terapéuticas disponibles, incluyendo
   la opción de no tratarse.

2. Tuviste la oportunidad de hacer todas las preguntas que consideras
   necesarias, y que estas fueron respondidas en lenguaje comprensible.

3. Entiendes que tienes derecho a:
   - Rehusar el tratamiento en cualquier momento.
   - Solicitar una segunda opinión profesional antes de continuar.
   - Revocar este consentimiento cuando quieras (ver Sección H).
   - Ser informado/a de cualquier cambio significativo en el plan de
     tratamiento antes de que se ejecute.

4. Aceptas recibir el tratamiento en los términos conversados con tu
   profesional.


========================================================================
SECCIÓN B — AUTORIZACIÓN PARA REGISTRO DIGITAL DE TU FICHA CLÍNICA
========================================================================

Autorizas que tu información clínica — que incluye:

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
- Permitir comunicación entre tú y tu profesional (recordatorios, notas).
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

Conforme a la Ley 21.719, puedes ejercer en cualquier momento los siguientes
derechos sobre tus datos:

1. ACCESO: pedir copia de la información que tenemos sobre ti.
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
- Contacta a tu profesional o clínica tratante (canal principal).
- O escribe directamente a DentalSpot al email [placeholder: email@dentalspot.cl]
  indicando tu nombre, RUT y el derecho que quieres ejercer.
- Te responderemos en un plazo máximo de 20 días hábiles.
- Si no quedas conforme con la respuesta, puedes reclamar ante la Agencia
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
- Pasado ese plazo, puedes solicitar su eliminación total. Alternativamente,
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

Al firmar este documento aceptas esta transferencia internacional.


========================================================================
SECCIÓN G — GRABACIÓN DE AUDIO CON IA (OPCIONAL — CHECKBOX SEPARADO)
========================================================================

ESTA SECCIÓN ES OPT-IN. La puedes aceptar o rechazar de forma independiente
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
Puedes pedirle a tu profesional que no grabe una consulta específica, o
revocar el consentimiento general en cualquier momento. Las grabaciones
previas se eliminarán dentro de 30 días de tu solicitud.


========================================================================
SECCIÓN H — REVOCACIÓN DEL CONSENTIMIENTO
========================================================================

Puedes revocar este consentimiento en cualquier momento, total o parcialmente,
sin necesidad de justificar. La revocación tiene efecto desde el momento de
tu solicitud y no afecta la legalidad del tratamiento realizado previamente.

Consecuencias:
- Si revocas el consentimiento para el tratamiento odontológico: el
  profesional no podrá continuar la atención.
- Si revocas el consentimiento para el tratamiento de datos: se aplicarán
  los plazos de retención de la Sección E. Datos con obligación legal de
  retención serán mantenidos hasta el plazo mínimo legal y luego eliminados.

Para revocar, contacta a tu profesional o escribe a [placeholder: email].


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
— [Placeholder: Razón social DentalSpot / Communicare SpA]
— [Placeholder: RUT]
— [Placeholder: Dirección comercial]
— Contacto para derechos ARCO: [Placeholder: email@dentalspot.cl]

Autoridad de control (Chile):
— Agencia Nacional de Protección de Datos Personales (cuando esté operativa
  conforme a Ley 21.719).
— Transitoriamente: Servicio Nacional del Consumidor (SERNAC) para materias
  de protección del consumidor.

========================================================================
FIN DEL DOCUMENTO
========================================================================
```

---

## B. SQL INSERT

Copy-paste al Supabase SQL Editor (proyecto `tomremkbuxvedliyywbo`). Rellenar los placeholders `[XXX]` antes de ejecutar, o dejarlos para v1 testing y actualizar después.

```sql
-- Insertar consentimiento clínico v1
-- IMPORTANTE: antes de ejecutar, reemplazar los placeholders marcados
-- como [placeholder: ...] en el texto con los datos reales.

INSERT INTO public.legal_documents (
  slug,
  title,
  version,
  status,
  content,
  published_at,
  created_at,
  updated_at
) VALUES (
  'consentimiento-clinico',
  'Consentimiento Informado y Tratamiento de Datos',
  1,
  'published',
  $CONTENT$
CONSENTIMIENTO INFORMADO Y AUTORIZACIÓN
TRATAMIENTO ODONTOLÓGICO Y USO DE LA PLATAFORMA DENTALSPOT

Versión: 1
Fecha de vigencia: 2026-04-22

[... pegar aquí el texto completo de la Sección A arriba ...]
$CONTENT$,
  NOW(),
  NOW(),
  NOW()
);

-- Verificar
SELECT id, slug, title, version, status, published_at
FROM legal_documents
WHERE slug = 'consentimiento-clinico';
```

**Nota importante**: el `$CONTENT$...$CONTENT$` es dollar-quoted string de PostgreSQL — te permite pegar texto con apóstrofes sin escapar. Usalo tal cual.

---

## Checklist antes de sembrar el doc en producción

- [ ] Placeholders `[placeholder: ...]` en Sección G y "Identidad del responsable" reemplazados con datos reales (email soporte, razón social, RUT)
- [ ] Fecha de vigencia actualizada si ya no es 2026-04-22
- [ ] Si la empresa aún no está constituida formalmente, usar "Communicare SpA (en formación)" como placeholder temporal
- [ ] Probar en staging primero: crear paciente test, login como paciente, verificar que aparece el ClinicalConsentGate y que la firma se registra en `legal_signatures`

---

## Cuando llegue v2 del abogado

1. Abrir admin UI: `/admin/legal/documents`
2. Editar doc `consentimiento-clinico` → cambiar `content` + incrementar `version` a 2
3. Los usuarios que firmaron v1 serán detectados como "no firmados" (el hook usa `document_version` para matching exacto)
4. En su próximo login, se les pedirá firmar la nueva versión

Alternativa SQL directa:
```sql
UPDATE legal_documents
SET content = $CONTENT$...nueva versión...$CONTENT$,
    version = 2,
    updated_at = NOW()
WHERE slug = 'consentimiento-clinico';
```

Las firmas de v1 quedan en `legal_signatures` como registro histórico — son válidas para lo que cubrieron en su momento, pero dejan de contar para futuras verificaciones.

---

## Riesgo residual aceptado al usar este template

Al usar v1 sin revisión legal, aceptas:
- Que un abogado podría identificar gaps de cobertura (ej. menores de edad, tratamientos estéticos vs. terapéuticos, obligaciones específicas del Colegio de Dentistas, etc.)
- Que podría haber lenguaje que un regulador interpretase distinto al intencional
- Que no cubre todas las jurisdicciones (solo Chile)

**Mitigación**: limitá el uso a beta trusted (N≤10 dentistas conocidos personalmente), mantené comunicación activa con usuarios, y priorizá redactar v2 con abogado dentro del primer mes.

---

## Próximos docs legales a redactar (spec separado)

- Términos y Condiciones del Servicio (entre dentista y DentalSpot)
- Política de Privacidad (pública, en landing)
- Política de Cookies (la UI de admin de cookies ya existe — falta el doc)
- Acuerdo de Procesamiento de Datos (DPA) entre DentalSpot y dentista/clínica
- Aviso de Privacidad para el paciente (resumen simple de esta política, <500 palabras)
