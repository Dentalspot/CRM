# Legal Outreach — material pre-armado

**Creado:** 2026-04-20 (sesión spec kit DentalSpot)
**Uso:** material listo para mandar a abogados cuando tengas presupuesto para contratar asesoría legal de Fase A del pivot (triage IA + marketplace).

---

## Archivos

| Archivo | Contenido |
|---|---|
| `01-email-inicial.md` | Email de primer contacto. Personalizar `[Nombre]` + enviar con 02 y 03 como adjuntos |
| `02-agenda-reunion.md` | 25 preguntas legales críticas en 8 secciones + 3 preguntas de calibración al inicio + template de notas en vivo |
| `03-documentos-redactar.md` | 7 documentos legales a redactar (scope + plantilla de cotización) |
| `04-presupuesto-referencia.md` | Rangos de precio mercado Chile 2026 + cómo bajar costo 30-50% + canales para encontrar candidatos |

---

## Flujo sugerido cuando retomes

### Semana 1 — Research candidatos (1-2 h)

1. LinkedIn booleano + Startup Chile / CORFO + Colegio de Abogados
2. Filtrar 5-8 nombres → shortlist 3 candidatos
3. Ver `04-presupuesto-referencia.md` §"Canales para encontrar candidatos"

### Semana 1-2 — Primer contacto (30 min)

1. Personalizar `01-email-inicial.md` por cada candidato
2. Adjuntar `02-agenda-reunion.md` + `03-documentos-redactar.md`
3. Enviar a 2-3 simultáneos
4. Esperar respuestas 3-7 días

### Semana 2-3 — Reuniones (1.5 h cada una)

Por cada candidato:
1. Llevar impreso `02-agenda-reunion.md`
2. Iniciar con las 3 preguntas de calibración (sección "Calibración inicial")
3. Si aprueba → recorrer las 8 secciones
4. Al cierre: pedir cotización escrita desglosada (plantilla en `03-documentos-redactar.md`)
5. Usar template de notas en vivo del archivo 02

### Semana 3-4 — Comparación y decisión (1 h)

1. Recibir 3 cotizaciones en formato desglosado
2. Llenar tabla comparativa (en `03-documentos-redactar.md` §"Comparación de cotizaciones")
3. Aplicar regla de decisión: priorizar respuestas de calibración sobre precio
4. Contratar ganador, arrancar Fase A

### Semana 4+ — Asesoría puntual (8-12 h, ~2 semanas calendario)

1. Kickoff: mandar las 25 preguntas del agenda
2. Recibir memorándum por secciones
3. Paralelo: iniciar redacción 3 docs core (privacidad + T&C paciente + consentimiento IA)

---

## Estado actual del proyecto

**Triggering event:** decidiste abrir spec para pivot a marketplace B2C con triage IA. Legal es bloqueante para FASE A (antes de escribir código del funnel público).

**Por qué estos materiales están listos:**
Armados el 2026-04-20 durante sesión spec kit intensiva. Decisión: diferir ejecución hasta tener presupuesto (~$3.5M - $5M CLP para Fase A mínima).

**Decisiones de producto que afectan el legal:**
- Triage IA = "guía educativa", NO diagnóstico → evita registro ISP como SaMD probablemente
- Proveedor IA a decidir (OpenAI vs Anthropic vs Google vs propio) → afecta transferencia internacional de datos
- Foto dental sin rostro inicialmente → reduce sensibilidad datos biométricos

**Cuando retomes, verifica que estas premisas siguen vigentes** antes de mandar los emails.

---

## Contexto referencial

Relacionado con:
- `.specify/memory/ecosystem-communicare.md` — la visión del ecosistema
- `.specify/memory/data-compliance.md` — inventario de compliance ya implementado
- `.specify/memory/constitution.md` — Principle I (Compliance-First) obliga a este research

Si las premisas cambian (ej: decides que el triage SÍ es diagnóstico), actualizar archivos 01-03 antes de contactar.
