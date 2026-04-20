# DentalSpot — Rol en el ecosistema Communicare
**Communicare** (del latín *communicare* = comunicar) es la marca paraguas creada por Danissa Klagges que aloja los SaaS específicos por especialidad de salud que ella construye. La misión:
> Que la información clínica viaje con el paciente, no se quede atrapada en cada profesional.
DentalSpot es el **pilar fundacional y más maduro** del ecosistema — la referencia de compliance y arquitectura que los demás verticales deben alcanzar.
## Estructura del ecosistema
| Componente | Estado | Rol de DentalSpot |
|---|---|---|
| **DentalSpot** (dentistas) | ✅ Producción, compliance maduro | **Tú estás aquí.** Referencia del ecosistema. |
| **FONOKIT** (fonoaudiólogos) | 🟡 Producción con bugs críticos | Hermano menor, debe replicar patrones de DentalSpot |
| **API entre ambos** | ❌ Visión, no implementada | DentalSpot expone primero |
| **Pasaporte Clínico Universal** | ❌ Visión, feature emblemática | DentalSpot emite el primer formato |
| **Futuros SaaS** | ❌ Backlog | cardiología, neurología, nutrición, psiquiatría |
**NO confundir con `lpage`** (`/Users/danissaklagges/Documents/lpage`): proyecto separado de Danissa (agencia digital para profesionales independientes), **NO forma parte del ecosistema Communicare**.
## Las 3 historias fundacionales (manifiesto)
Toda decisión de producto en DentalSpot debe pasar el filtro: *"¿esto previene una de estas tragedias?"*
### 1. Disautonomía + Ehlers-Danlos
Amiga de Danissa. Mujer joven invalidada años por sistema fragmentado (cardio + neuro + interna + reumato no se hablan). **A quién toca:** mujeres adultas invisibilizadas.
### 2. Niño TEA + epilepsia no diagnosticada ⭐ (historia ariete)
Paciente de Danissa, 12 años, recién diagnosticado epilepsia. Dato clínico: 82–92 % de niños TEA tienen actividad epileptiforme subclínica. El control-niño-sano en Chile es "perfecto en papel, ciego en práctica". **A quién toca:** miedo universal de cualquier padre.
### 3. Profesional acusada injustamente
Dermatóloga amiga de Danissa diagnosticó dermatitis atópica; otra profesional dijo sarna. Sin antecedentes clínicos = profesional vulnerable a reclamo injusto. **Aplica directamente a dentistas:** sin auditoría de quién accedió y firmó qué, cualquier dentista queda desprotegido frente a reclamos. Es el caso directo de por qué `clinical_audit_log` append-only + `legal_signatures` versionado son no-negociables (ver Constitution III).
## Mensaje raíz
> *"En Chile, los profesionales de salud no se hablan entre ellos. Y los que pagan el precio son los pacientes."*
## Tono
Activista, no comercial. Basado en evidencia clínica. Honesto sobre el problema (sistema fragmentado mata o daña pacientes). Empático con el profesional individual (no es su culpa, es del sistema).
## Implicaciones técnicas para DentalSpot
DentalSpot es el **laboratorio de referencia** del ecosistema. Patrones ya implementados aquí que deben replicarse en FONOKIT y futuros verticales:
- `origin_app` en metadata de signup (aislamiento entre apps del ecosistema)
- `organization_id` como scope multi-tenant en todas las tablas con PHI
- RLS 3 fases (`rls_phase1_administrative` / `rls_phase2_clinical` / `rls_phase3_compliance`) como patrón
- `clinical_audit_log` append-only con triggers (audit general — dentista accede/edita/crea PHI)
- `legal_signatures` versionado con user agent + IP + versión de documento
- `arco_requests` + flujo self-service paciente (`AccountSecuritySettings`) + gestión admin (`ArcoRequestsPage`)
- `processing_lawful_basis` como referencia en tablas con PHI
- Modal de consentimiento que **no miente** (consulta fuente de verdad vía RPC, no columna cosmética)
- Patrón canónico **"backfill idempotente + trigger de sincronización"** para toda tabla derivada poblada por migración one-shot (ver `architecture.md` §"Canonical patterns", ejemplificado en spec 003 commit `c55d1a5`)

### Pasaporte Clínico Universal — implementación parcial presente

El módulo `src/features/clinical-passport/` en DentalSpot es la **primera implementación parcial del Pasaporte Clínico Universal** del ecosistema Communicare. Cubre:

| Pieza | Archivo | Propósito |
|---|---|---|
| Tabla audit del passport | `clinical_access_log` (distinta de `clinical_audit_log`) | acciones `grant`, `share`, `revoke`, `download_pdf`, `auto_grant`, `export`, `view` |
| Aceptación de passport por otro profesional | `src/pages/AcceptPassportPage.jsx` | endpoint público con token; permite que un profesional externo acepte acceso temporal a la ficha |
| Gestión de grants | `src/features/clinical-passport/components/AccessGrantsManager.jsx` | admin de grants activos y revocaciones |
| Compartir passport | `src/features/clinical-passport/components/SharePassportModal.jsx` | genera token de acceso compartido |
| Audit log del passport | `src/features/admin/modules/clinical-history/hooks/useAccessLog.js` + `useCompliance.js` | lectura del log `clinical_access_log` |

**Estado:** infraestructura viva en DentalSpot pero aún NO alcanza los objetivos del Pasaporte Clínico Universal del ecosistema (HL7 FHIR, firma digital del prestador emisor, interoperabilidad con FONOKIT). Es la semilla — spec futura dedicada debe completar el formato portable estándar. No confundir con el audit general (`clinical_audit_log`): son tablas y propósitos distintos, documentados en `data-compliance.md` §"Dos tablas distintas".
## Interfaces futuras con otros verticales
Cuando FONOKIT u otros SaaS conecten con DentalSpot:
- **Schema clínico compartido:** semántica de `patients`, `clinical_audit_log` (audit general) + `clinical_access_log` (passport sharing), `processing_lawful_basis`, `arco_requests`, `patient_care_team` debe ser compatible cross-app
- **Pasaporte Clínico Universal:** formato objetivo HL7 FHIR; mínimo aceptable JSON estructurado con firma digital del prestador emisor
- **Co-branding:** "Powered by Communicare" obligatorio en UI paciente y en exports clínicos (PDF de ficha, cartas de referencia)
## Filtro obligatorio para specs de DentalSpot
Antes de aprobar cualquier `/speckit-specify`, responder:
1. **¿Qué historia fundacional previene o protege esta feature?** Si ninguna, cuestionar scope.
2. **¿Rompe la semántica cross-app del ecosistema?** (naming, tipos, constraints que FONOKIT heredará)
3. **¿Degrada el estándar de compliance que FONOKIT debe seguir?** No podemos bajar la vara.
4. **¿Bloquea el Pasaporte Clínico Universal?** Toda feature clínica debe ser exportable al formato compartido.
## Docs relacionados
- `.specify/memory/constitution.md` — 6 principios no-negociables
- `.specify/memory/architecture.md` — mapa técnico del repo
- `.specify/memory/data-compliance.md` — evidencia del compliance implementado
- Gemelo en FONOKIT: `/Users/danissaklagges/Documents/FONOKIT/.specify/memory/ecosystem-communicare.md`
---
**Last updated**: 2026-04-20 | **Source**: Espejo adaptado del `ecosystem-communicare.md` de FONOKIT (memoria persistente, 2026-04-18) + aprendizajes ciclo spec 001/002/003 (19-20 abr): `clinical-passport` identificado como implementación parcial del Pasaporte Clínico Universal; distinción explícita entre `clinical_audit_log` y `clinical_access_log`; patrón canónico backfill+trigger añadido.
