-- Self-booking Fase 1: hacer funcional la reserva pública de citas.
--
-- Decisiones de negocio (founder 2026-05-25):
--   - Aprobación manual: la reserva entra como 'scheduled' + booking_source
--     'online_self_booking'; el dentista la aprueba (→ confirmed) o cancela
--     usando el flujo de estado existente. Badge "Reserva online" en agenda
--     (Fase 2).
--   - Híbrido guest+cuenta: el RPC crea "paciente sin cuenta" (Fase 1);
--     la opción de crear cuenta post-reserva es Fase 2.
--   - Reserva genérica: sin selección de servicio obligatoria.
--   - Toggle por dentista: accepts_online_booking, default OFF.
--
-- Bug que arregla: el RPC schedule_appointment_and_patient NO asignaba
-- organization_id (NOT NULL en appointments Y en patients) → todo insert
-- fallaba. Por eso había 0 reservas. Ahora deriva org del clinic.

-- ============================================================
-- Paso 1: Toggle por dentista
-- ============================================================
ALTER TABLE public.therapist_details
ADD COLUMN IF NOT EXISTS accepts_online_booking boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.therapist_details.accepts_online_booking
IS 'Si true, el dentista acepta reservas online desde su perfil público. Default false (opt-in). Self-booking Fase 1.';

-- ============================================================
-- Paso 2: Origen de la cita (distingue reserva online de manual)
-- ============================================================
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS booking_source text NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN public.appointments.booking_source
IS 'Origen de la cita: manual (creada por dentista/asistente) | online_self_booking (reserva pública del paciente). Self-booking Fase 1.';

-- ============================================================
-- Paso 3: Fix del RPC schedule_appointment_and_patient
-- ============================================================
-- Mantiene la MISMA signature (el frontend no cambia su llamada). Cambios:
--   - Valida accepts_online_booking del dentista (rechaza si OFF)
--   - Deriva organization_id del clinic (fix del NOT NULL bloqueante)
--   - Asigna organization_id también al crear el paciente
--   - status='scheduled', booking_source='online_self_booking'
--   - box_id queda NULL a propósito: el dentista lo asigna al confirmar.
--     validate_appointment igual previene overlap del dentista (una reserva
--     sin box choca con cualquier cita del dentista que solape).

CREATE OR REPLACE FUNCTION public.schedule_appointment_and_patient(
    p_therapist_id uuid,
    p_clinic_id uuid,
    p_service_id uuid,
    p_patient_full_name text,
    p_patient_email text,
    p_patient_phone text,
    p_patient_rut text,
    p_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_notes text,
    p_send_email_reminder boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_patient_id uuid;
    v_appointment_id uuid;
    v_organization_id uuid;
    v_accepts_booking boolean;
BEGIN
    -- Gate: el dentista debe aceptar reservas online
    SELECT accepts_online_booking INTO v_accepts_booking
    FROM public.therapist_details WHERE user_id = p_therapist_id;

    IF v_accepts_booking IS NOT TRUE THEN
        RAISE EXCEPTION 'Este profesional no acepta reservas online en este momento.';
    END IF;

    -- Derivar organization_id: del clinic si es presencial; si es online
    -- (p_clinic_id NULL) usar la org donde el dentista es member activo.
    IF p_clinic_id IS NOT NULL THEN
        SELECT organization_id INTO v_organization_id
        FROM public.clinics WHERE id = p_clinic_id;
    END IF;

    IF v_organization_id IS NULL THEN
        SELECT organization_id INTO v_organization_id
        FROM public.organization_members
        WHERE user_id = p_therapist_id AND role = 'dentist' AND is_active = true
        LIMIT 1;
    END IF;

    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'No se pudo determinar la organización del profesional.';
    END IF;

    -- Buscar paciente existente por email (mismo therapist)
    IF p_patient_email IS NOT NULL AND p_patient_email != '' THEN
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND email = p_patient_email;
    END IF;

    -- Si no, por RUT
    IF v_patient_id IS NULL AND p_patient_rut IS NOT NULL AND p_patient_rut != '' THEN
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND rut = p_patient_rut;
    END IF;

    -- Crear paciente sin cuenta si no existe (con organization_id — NOT NULL)
    IF v_patient_id IS NULL THEN
        INSERT INTO public.patients (
            therapist_id, organization_id, full_name, email, phone, rut, notes
        )
        VALUES (
            p_therapist_id, v_organization_id, p_patient_full_name, p_patient_email,
            p_patient_phone, p_patient_rut, 'Paciente creado desde reserva online.'
        )
        RETURNING id INTO v_patient_id;
    END IF;

    -- Crear la cita (org_id obligatorio, box_id NULL → dentista asigna al confirmar)
    INSERT INTO public.appointments (
        therapist_id, patient_id, clinic_id, service_id, organization_id,
        date, start_time, end_time, notes, send_email_reminder,
        status, booking_source
    )
    VALUES (
        p_therapist_id, v_patient_id, p_clinic_id, p_service_id, v_organization_id,
        p_date, p_start_time, p_end_time, p_notes, p_send_email_reminder,
        'scheduled', 'online_self_booking'
    )
    RETURNING id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$function$;
