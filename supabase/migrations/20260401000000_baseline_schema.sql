--
-- PostgreSQL database dump
--

-- restrict removed for compatibility

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'pendiente',
    'confirmada',
    'en_progreso',
    'completada',
    'cancelada',
    'no_asistio'
);


--
-- Name: clinic_attendance_modality; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clinic_attendance_modality AS ENUM (
    'presencial',
    'online',
    'ambas'
);


--
-- Name: clinic_attention_modality; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.clinic_attention_modality AS ENUM (
    'presencial',
    'online'
);


--
-- Name: consultation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.consultation_type AS ENUM (
    'Presencial',
    'Online',
    'presencial',
    'online'
);


--
-- Name: consultation_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.consultation_type_enum AS ENUM (
    'evaluacion_inicial',
    'tratamiento',
    'control',
    'seguimiento',
    'alta'
);


--
-- Name: day_of_week; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.day_of_week AS ENUM (
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo'
);


--
-- Name: difficulty_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.difficulty_enum AS ENUM (
    'muy_facil',
    'facil',
    'adecuado',
    'dificil',
    'muy_dificil'
);


--
-- Name: discount_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.discount_type_enum AS ENUM (
    'porcentaje',
    'monto_fijo'
);


--
-- Name: goal_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.goal_type_enum AS ENUM (
    'general',
    'especifico'
);


--
-- Name: invoice_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_status_enum AS ENUM (
    'borrador',
    'emitida',
    'pagada',
    'vencida',
    'cancelada'
);


--
-- Name: marketplace_item_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.marketplace_item_type AS ENUM (
    'plan',
    'activity',
    'material',
    'bundle',
    'evaluation',
    'resource'
);


--
-- Name: modalidad_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.modalidad_enum AS ENUM (
    'presencial',
    'online',
    'mixta'
);


--
-- Name: modality_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.modality_enum AS ENUM (
    'presencial',
    'online',
    'ambas',
    'Mixto'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'read'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_confirmed',
    'new_review',
    'review_response'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'paid',
    'pending'
);


--
-- Name: product_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_type_enum AS ENUM (
    'insumo',
    'plantilla_informe',
    'plantilla_planificacion',
    'curso_online',
    'fisico',
    'digital'
);


--
-- Name: report_delivery_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_delivery_status AS ENUM (
    'not_delivered',
    'delivered_to_patient',
    'delivered_to_family',
    'delivered_to_institution'
);


--
-- Name: report_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_status AS ENUM (
    'draft',
    'in_review',
    'validated',
    'signed',
    'locked',
    'archived'
);


--
-- Name: role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_enum AS ENUM (
    'paciente',
    'terapeuta',
    'clinica',
    'admin'
);


--
-- Name: sender_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sender_type_enum AS ENUM (
    'user',
    'ai'
);


--
-- Name: session_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_type_enum AS ENUM (
    'evaluacion',
    'tratamiento',
    'control'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'patient',
    'therapist',
    'admin',
    'superadmin',
    'clinic'
);


--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role_enum AS ENUM (
    'patient',
    'therapist',
    'admin',
    'superadmin'
);


--
-- Name: accept_invitation(text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.accept_invitation(p_invite_code text, p_invitee_email text, p_invitee_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE therapist_invitations
  SET 
    status = 'accepted',
    invitee_email = p_invitee_email,
    invitee_id = p_invitee_id,
    accepted_at = NOW()
  WHERE invite_code = p_invite_code
    AND status = 'pending';
END;
$$;


--
-- Name: add_specialty_to_therapist(uuid, integer, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_specialty_to_therapist(p_therapist_id uuid, p_specialty_id integer, p_added_by uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_specialty_name TEXT;
    v_current_count INTEGER;
    v_max_specialties INTEGER := 10;
    v_therapist_name TEXT;
BEGIN
    -- Validar terapeuta
    SELECT full_name INTO v_therapist_name
    FROM profiles
    WHERE id = p_therapist_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found',
            'message', 'El terapeuta no existe'
        );
    END IF;

    -- Validar especialidad
    SELECT name INTO v_specialty_name
    FROM specialties
    WHERE id = p_specialty_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_not_found',
            'message', 'La especialidad no existe'
        );
    END IF;

    -- Verificar repetición
    IF EXISTS(
        SELECT 1 FROM therapist_specialties 
        WHERE therapist_id = p_therapist_id AND specialty_id = p_specialty_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_already_assigned',
            'message', format('Ya tienes asignada la especialidad: %s', v_specialty_name),
            'specialty_name', v_specialty_name
        );
    END IF;

    -- Contar especialidades
    SELECT COUNT(*) INTO v_current_count
    FROM therapist_specialties
    WHERE therapist_id = p_therapist_id;

    IF v_current_count >= v_max_specialties THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_limit_exceeded',
            'message', format('Has alcanzado el límite de %s especialidades', v_max_specialties),
            'current_count', v_current_count,
            'max_allowed', v_max_specialties
        );
    END IF;

    -- Insertar especialidad
    INSERT INTO therapist_specialties (therapist_id, specialty_id)
    VALUES (p_therapist_id, p_specialty_id);

    -- Registrar en logs
    INSERT INTO specialty_change_logs (
        therapist_id,
        action,
        specialty_id,
        specialty_name,
        changed_by,
        change_details
    ) VALUES (
        p_therapist_id,
        'added',
        p_specialty_id,
        v_specialty_name,
        COALESCE(p_added_by, p_therapist_id),
        jsonb_build_object(
            'therapist_name', v_therapist_name,
            'total_after', v_current_count + 1,
            'timestamp', NOW()
        )
    );

    -- Respuesta final
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Especialidad "%s" agregada correctamente', v_specialty_name),
        'specialty_added', jsonb_build_object(
            'id', p_specialty_id,
            'name', v_specialty_name
        ),
        'current_specialties', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description
                )
                ORDER BY s.name
            )
            FROM therapist_specialties ts
            JOIN specialties s ON s.id = ts.specialty_id
            WHERE ts.therapist_id = p_therapist_id
        ),
        'total_specialties', v_current_count + 1
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: add_to_favorites(uuid, uuid, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_to_favorites(p_user_id uuid, p_item_id uuid, p_list_name text DEFAULT 'default'::text, p_notify_on_sale boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_favorite_id UUID;
  v_current_price NUMERIC;
BEGIN
  -- Obtener precio actual
  SELECT price INTO v_current_price
  FROM marketplace_items WHERE id = p_item_id;
  
  -- Insertar o actualizar favorito
  INSERT INTO marketplace_favorites (
    user_id, marketplace_item_id, list_name, 
    notify_on_sale, original_price_when_saved
  ) VALUES (
    p_user_id, p_item_id, p_list_name,
    p_notify_on_sale, v_current_price
  )
  ON CONFLICT (user_id, marketplace_item_id, list_name) 
  DO UPDATE SET 
    notify_on_sale = EXCLUDED.notify_on_sale,
    updated_at = NOW()
  RETURNING id INTO v_favorite_id;
  
  RETURN v_favorite_id;
END;
$$;


--
-- Name: assign_specialties_to_therapist(uuid, integer[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_specialties_to_therapist(p_therapist_id uuid, p_specialty_ids integer[]) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    specialty_id INTEGER;
BEGIN
    -- Eliminar especialidades existentes si se pide reemplazo completo
    DELETE FROM therapist_specialties
    WHERE therapist_id = p_therapist_id;
    
    -- Asignar nuevas especialidades
    FOREACH specialty_id IN ARRAY p_specialty_ids
    LOOP
        INSERT INTO therapist_specialties (therapist_id, specialty_id)
        VALUES (p_therapist_id, specialty_id)
        ON CONFLICT (therapist_id, specialty_id) DO NOTHING;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


--
-- Name: associate_patient_to_therapist(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.associate_patient_to_therapist(p_profile_id uuid, p_therapist_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_patient_id uuid;
BEGIN
  -- 1. Check if patient relation already exists
  SELECT id INTO v_patient_id
  FROM patients
  WHERE profile_id = p_profile_id 
    AND therapist_id = p_therapist_id
  LIMIT 1;
  
  IF v_patient_id IS NOT NULL THEN
    RETURN v_patient_id;
  END IF;

  -- 2. Verify profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- 3. Insert new patient record
  INSERT INTO patients (
    profile_id,
    therapist_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_profile_id,
    p_therapist_id,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_patient_id;

  RETURN v_patient_id;
END;
$$;


--
-- Name: auto_grant_passport_on_appointment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_grant_passport_on_appointment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_patient_profile_id UUID;
BEGIN
  -- Only for new scheduled appointments
  IF NEW.status != 'scheduled' THEN
    RETURN NEW;
  END IF;

  -- Get patient's profile_id
  SELECT profile_id INTO v_patient_profile_id
  FROM patients
  WHERE id = NEW.patient_id;

  IF v_patient_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if grant already exists for this therapist-patient pair
  IF EXISTS (
    SELECT 1 FROM patient_access_grants
    WHERE patient_id = NEW.patient_id
      AND granted_to = NEW.therapist_id
      AND is_active = true
  ) THEN
    RETURN NEW; -- Already has access, skip
  END IF;

  -- Auto-grant passport access
  INSERT INTO patient_access_grants (
    patient_id,
    profile_id,
    granted_to,
    access_level,
    granted_by,
    is_active,
    accepted_at
  ) VALUES (
    NEW.patient_id,
    v_patient_profile_id,
    NEW.therapist_id,
    'full',
    'system',
    true,
    NOW()
  );

  -- Log the auto-grant
  INSERT INTO clinical_access_log (
    patient_id,
    accessed_by,
    action,
    details
  ) VALUES (
    NEW.patient_id,
    NEW.therapist_id,
    'auto_grant',
    jsonb_build_object(
      'reason', 'appointment_scheduled',
      'appointment_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;


--
-- Name: auto_schedule_reminders_on_appointment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_schedule_reminders_on_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_prefs jsonb;
  v_timing int;
  v_scheduled_time timestamp with time zone;
  v_patient_id uuid;
BEGIN
  -- Get therapist preferences
  SELECT reminder_preferences INTO v_prefs FROM therapist_details WHERE user_id = NEW.therapist_id;
  
  -- Default if null
  IF v_prefs IS NULL THEN
    v_prefs := '{"email_enabled": true, "timing_hours": 24}'::jsonb;
  END IF;

  -- Only schedule if enabled and status is scheduled
  IF (v_prefs->>'email_enabled')::boolean = true AND NEW.status = 'scheduled' THEN
    v_timing := COALESCE((v_prefs->>'timing_hours')::int, 24);
    
    -- Calculate time (24h before appointment)
    v_scheduled_time := (NEW.date + NEW.start_time) - (v_timing || ' hours')::interval;
    
    -- Insert for patient if scheduled time is in future (or slightly past but reasonable)
    IF v_scheduled_time > now() - interval '1 hour' THEN
        INSERT INTO scheduled_reminders (appointment_id, therapist_id, patient_id, reminder_type, scheduled_time)
        VALUES (NEW.id, NEW.therapist_id, NEW.patient_id, 'patient', v_scheduled_time);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: block_therapist_time_slot(uuid, date, time without time zone, time without time zone, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.block_therapist_time_slot(p_therapist_id uuid, p_block_date date, p_start_time time without time zone, p_end_time time without time zone, p_reason text DEFAULT 'Bloqueo manual'::text, p_clinic_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointment_id UUID;
    v_affected_appointments INTEGER := 0;
    v_clinics_affected JSONB := '[]'::JSONB;
BEGIN
    -- Si no se especifica clínica, bloquear en todas las clínicas del terapeuta
    IF p_clinic_id IS NULL THEN
        -- Crear bloqueos en todas las clínicas
        WITH blocked_clinics AS (
            INSERT INTO appointments (
                patient_id,
                therapist_id,
                clinic_id,
                appointment_date,
                appointment_time,
                duration,
                status,
                modalidad,
                notes
            )
            SELECT 
                p_therapist_id, -- El mismo terapeuta como "paciente"
                p_therapist_id,
                c.id,
                p_block_date,
                p_start_time,
                EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60,
                'blocked',
                'presencial', -- Default para bloqueos
                'BLOQUEO DE AGENDA: ' || p_reason
            FROM clinics c
            WHERE c.therapist_id = p_therapist_id
            RETURNING clinic_id, id
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'clinic_id', clinic_id,
                'block_id', id
            )
        ) INTO v_clinics_affected
        FROM blocked_clinics;
    ELSE
        -- Validar que la clínica pertenece al terapeuta
        IF NOT EXISTS(
            SELECT 1 FROM clinics 
            WHERE id = p_clinic_id AND therapist_id = p_therapist_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_clinic',
                'message', 'La clínica no pertenece a este terapeuta'
            );
        END IF;
        
        -- Crear bloqueo único
        INSERT INTO appointments (
            patient_id,
            therapist_id,
            clinic_id,
            appointment_date,
            appointment_time,
            duration,
            status,
            modalidad,
            notes
        ) VALUES (
            p_therapist_id,
            p_therapist_id,
            p_clinic_id,
            p_block_date,
            p_start_time,
            EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60,
            'blocked',
            'presencial',
            'BLOQUEO DE AGENDA: ' || p_reason
        ) RETURNING id INTO v_appointment_id;
        
        v_clinics_affected := jsonb_build_array(
            jsonb_build_object(
                'clinic_id', p_clinic_id,
                'block_id', v_appointment_id
            )
        );
    END IF;
    
    -- Buscar citas afectadas que necesitan ser reprogramadas
    SELECT COUNT(*) INTO v_affected_appointments
    FROM appointments
    WHERE therapist_id = p_therapist_id
        AND appointment_date = p_block_date
        AND status = 'scheduled'
        AND (p_clinic_id IS NULL OR clinic_id = p_clinic_id)
        AND (
            (appointment_time, appointment_time + (duration || ' minutes')::INTERVAL)
            OVERLAPS
            (p_start_time, p_end_time)
        );
    
    RETURN jsonb_build_object(
        'success', true,
        'therapist_id', p_therapist_id,
        'block_details', jsonb_build_object(
            'date', p_block_date,
            'start_time', p_start_time::TEXT,
            'end_time', p_end_time::TEXT,
            'duration_minutes', EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 60,
            'reason', p_reason
        ),
        'clinics_blocked', v_clinics_affected,
        'affected_appointments', v_affected_appointments,
        'message', CASE 
            WHEN v_affected_appointments > 0 THEN
                format('Tiempo bloqueado. ATENCIÓN: Hay %s citas que necesitan ser reprogramadas', v_affected_appointments)
            ELSE
                'Tiempo bloqueado exitosamente'
        END,
        'action_required', v_affected_appointments > 0
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: book_appointment(uuid, uuid, timestamp without time zone, timestamp without time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.book_appointment(p_therapist_id uuid, p_patient_id uuid, p_start_time timestamp without time zone, p_end_time timestamp without time zone, p_mode text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  new_id UUID := gen_random_uuid();
BEGIN
  IF NOT can_book_appointment(p_therapist_id, p_start_time, p_end_time) THEN
    RAISE EXCEPTION 'El profesional no está disponible en este horario';
  END IF;

  INSERT INTO appointments (id, therapist_id, patient_id, start_time, end_time, mode, status, created_at, updated_at)
  VALUES (new_id, p_therapist_id, p_patient_id, p_start_time, p_end_time, p_mode, 'pendiente', NOW(), NOW());

  RETURN new_id;
END;
$$;


--
-- Name: calculate_ados2_scores(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_ados2_scores(p_evaluation_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_eval ados2_evaluations%ROWTYPE;
  v_total_as NUMERIC := 0;
  v_total_crr NUMERIC := 0;
  v_total_com NUMERIC := 0;
  v_total_global NUMERIC := 0;
  v_rango TEXT := 'no_tea';
BEGIN
  SELECT * INTO v_eval FROM ados2_evaluations WHERE id = p_evaluation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Evaluación no encontrada'; END IF;

  -- Convertir raw scores: 7,8,9 → 0; resto igual
  UPDATE ados2_item_responses SET
    algorithm_score = CASE
      WHEN raw_score IN (7, 8, 9) THEN 0
      WHEN raw_score = 3 THEN 2
      ELSE raw_score
    END
  WHERE evaluation_id = p_evaluation_id;

  -- Sumar por dominio
  SELECT COALESCE(SUM(algorithm_score), 0) INTO v_total_as
  FROM ados2_item_responses
  WHERE evaluation_id = p_evaluation_id AND domain = 'AS';

  SELECT COALESCE(SUM(algorithm_score), 0) INTO v_total_crr
  FROM ados2_item_responses
  WHERE evaluation_id = p_evaluation_id AND domain = 'CRR';

  SELECT COALESCE(SUM(algorithm_score), 0) INTO v_total_com
  FROM ados2_item_responses
  WHERE evaluation_id = p_evaluation_id AND domain = 'COM';

  -- Total global según módulo
  IF v_eval.module = '4' THEN
    v_total_global := v_total_com + v_total_as;
  ELSE
    v_total_global := v_total_as + v_total_crr;
  END IF;

  -- Puntos de corte por módulo y algoritmo
  IF v_eval.module = '1' THEN
    IF v_eval.algorithm = 'pocas_palabras' THEN
      v_rango := CASE
        WHEN v_total_global >= 16 THEN 'autismo'
        WHEN v_total_global >= 11 THEN 'espectro_autista'
        ELSE 'no_tea' END;
    ELSE -- algunas_palabras
      v_rango := CASE
        WHEN v_total_global >= 12 THEN 'autismo'
        WHEN v_total_global >= 8  THEN 'espectro_autista'
        ELSE 'no_tea' END;
    END IF;

  ELSIF v_eval.module = '2' THEN
    IF v_eval.algorithm = 'menores_5' THEN
      v_rango := CASE
        WHEN v_total_global >= 10 THEN 'autismo'
        WHEN v_total_global >= 7  THEN 'espectro_autista'
        ELSE 'no_tea' END;
    ELSE -- 5_o_mas
      v_rango := CASE
        WHEN v_total_global >= 9 THEN 'autismo'
        WHEN v_total_global >= 8 THEN 'espectro_autista'
        ELSE 'no_tea' END;
    END IF;

  ELSIF v_eval.module = '3' THEN
    v_rango := CASE
      WHEN v_total_global >= 9 THEN 'autismo'
      WHEN v_total_global >= 7 THEN 'espectro_autista'
      ELSE 'no_tea' END;

  ELSIF v_eval.module = 'T' THEN
    -- Módulo T no tiene puntos de corte fijos, solo descriptivo
    v_rango := null;
  END IF;

  -- Actualizar evaluación
  UPDATE ados2_evaluations SET
    total_as          = v_total_as,
    total_crr         = v_total_crr,
    total_comunicacion = v_total_com,
    total_global      = v_total_global,
    rango_preocupacion = v_rango,
    updated_at        = NOW()
  WHERE id = p_evaluation_id;

  RETURN jsonb_build_object(
    'total_as',       v_total_as,
    'total_crr',      v_total_crr,
    'total_com',      v_total_com,
    'total_global',   v_total_global,
    'rango',          v_rango
  );
END;
$$;


--
-- Name: calculate_daily_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_daily_metrics() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT therapist_id as user_id 
        FROM patient_sessions 
        WHERE DATE(created_at) = CURRENT_DATE - 1
    LOOP
        INSERT INTO metrics_summary (
            user_id, 
            metric_type, 
            period_start, 
            period_end, 
            metrics_data,
            total_sessions,
            total_patients
        )
        SELECT 
            user_record.user_id,
            'daily',
            CURRENT_DATE - 1,
            CURRENT_DATE - 1,
            jsonb_build_object(
                'sessions_by_type', jsonb_agg(DISTINCT session_type),
                'average_duration', AVG(duration_minutes)
            ),
            COUNT(DISTINCT id),
            COUNT(DISTINCT patient_id)
        FROM patient_sessions
        WHERE therapist_id = user_record.user_id
        AND DATE(created_at) = CURRENT_DATE - 1
        GROUP BY therapist_id
        ON CONFLICT (user_id, metric_type, period_start) 
        DO UPDATE SET 
            metrics_data = EXCLUDED.metrics_data,
            total_sessions = EXCLUDED.total_sessions,
            total_patients = EXCLUDED.total_patients;
    END LOOP;
END;
$$;


--
-- Name: calculate_feedback_score(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_feedback_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Calcular score basado en el tipo de feedback
    NEW.feedback_score = CASE 
        WHEN NEW.feedback_type = 'accepted' THEN 1.0
        WHEN NEW.feedback_type = 'rejected' THEN 0.0
        WHEN NEW.feedback_type = 'implicit_accept' THEN 0.8
        WHEN NEW.feedback_type = 'implicit_reject' THEN 0.2
        ELSE 0.5
    END;
    
    -- Ajustar por duración de interacción si está disponible
    IF NEW.interaction_duration IS NOT NULL THEN
        IF NEW.interaction_duration > 300 THEN -- Más de 5 minutos
            NEW.feedback_score = LEAST(NEW.feedback_score + 0.1, 1.0);
        ELSIF NEW.interaction_duration < 10 THEN -- Menos de 10 segundos
            NEW.feedback_score = GREATEST(NEW.feedback_score - 0.2, 0.0);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: calculate_specialty_scores(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_specialty_scores(p_therapist_id uuid) RETURNS TABLE(out_therapist_id uuid, out_specialty_id uuid, out_specialty text, out_education_score numeric, out_experience_score numeric, out_final_score numeric, out_badge text, out_matching_education text[], out_matching_experience text[])
    LANGUAGE sql STABLE
    AS $$
  WITH
  edu_data AS (
    SELECT 
      te.title AS edu_title,
      LOWER(COALESCE(te.title, '') || ' ' || COALESCE(te.description, '')) AS edu_text,
      CASE 
        WHEN LOWER(te.title) LIKE '%magíster%' OR LOWER(te.title) LIKE '%magister%' OR LOWER(te.title) LIKE '%master%' THEN 3.0
        WHEN LOWER(te.title) LIKE '%diplomado%' THEN 2.0
        WHEN LOWER(te.title) LIKE '%pasantía%' OR LOWER(te.title) LIKE '%pasantia%' THEN 1.5
        WHEN LOWER(te.title) LIKE '%curso%' THEN 1.0
        ELSE 1.5
      END AS edu_type_weight,
      CASE 
        WHEN te.graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 2 THEN 1.2
        WHEN te.graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 5 THEN 1.0
        WHEN te.graduation_year >= EXTRACT(YEAR FROM CURRENT_DATE)::int - 10 THEN 0.8
        ELSE 0.6
      END AS recency_weight
    FROM therapist_education te
    WHERE te.therapist_id = p_therapist_id
  ),
  
  exp_data AS (
    SELECT 
      tex.role AS exp_role,
      LOWER(COALESCE(tex.role, '') || ' ' || COALESCE(tex.institution, '') || ' ' || COALESCE(tex.description, '')) AS exp_text,
      GREATEST(
        EXTRACT(YEAR FROM AGE(COALESCE(tex.end_date, CURRENT_DATE), COALESCE(tex.start_date, CURRENT_DATE))),
        0
      ) AS years_in_role
    FROM therapist_experience tex
    WHERE tex.therapist_id = p_therapist_id
  ),
  
  edu_matches AS (
    SELECT 
      s.id AS s_id,
      s.name AS s_name,
      ed.edu_title,
      SUM(sk.weight * ed.edu_type_weight * ed.recency_weight) AS match_score
    FROM specialties s
    JOIN specialty_keywords sk ON sk.specialty_id = s.id
    CROSS JOIN edu_data ed
    WHERE ed.edu_text LIKE '%' || LOWER(sk.keyword) || '%'
    GROUP BY s.id, s.name, ed.edu_title
  ),
  
  exp_matches AS (
    SELECT 
      s.id AS s_id,
      s.name AS s_name,
      ex.exp_role,
      SUM(sk.weight * GREATEST(ex.years_in_role * 0.5, 1)) AS match_score
    FROM specialties s
    JOIN specialty_keywords sk ON sk.specialty_id = s.id
    CROSS JOIN exp_data ex
    WHERE ex.exp_text LIKE '%' || LOWER(sk.keyword) || '%'
    GROUP BY s.id, s.name, ex.exp_role
  ),
  
  edu_totals AS (
    SELECT 
      s_id,
      s_name,
      SUM(match_score) AS total_edu_score,
      ARRAY_AGG(DISTINCT edu_title) AS matched_titles
    FROM edu_matches
    GROUP BY s_id, s_name
  ),
  
  exp_totals AS (
    SELECT 
      s_id,
      s_name,
      SUM(match_score) AS total_exp_score,
      ARRAY_AGG(DISTINCT exp_role) AS matched_roles
    FROM exp_matches
    GROUP BY s_id, s_name
  ),
  
  combined AS (
    SELECT 
      COALESCE(e.s_id, x.s_id) AS s_id,
      COALESCE(e.s_name, x.s_name) AS s_name,
      COALESCE(e.total_edu_score, 0) AS edu_score,
      COALESCE(x.total_exp_score, 0) AS exp_score,
      (COALESCE(e.total_edu_score, 0) * 0.4 + COALESCE(x.total_exp_score, 0) * 0.6) AS raw_score,
      COALESCE(e.matched_titles, ARRAY[]::TEXT[]) AS matched_edu,
      COALESCE(x.matched_roles, ARRAY[]::TEXT[]) AS matched_exp
    FROM edu_totals e
    FULL OUTER JOIN exp_totals x ON e.s_id = x.s_id
  )
  
  SELECT
    p_therapist_id,
    c.s_id,
    c.s_name,
    ROUND(LEAST(c.edu_score, 100), 1),
    ROUND(LEAST(c.exp_score, 100), 1),
    ROUND(LEAST(c.raw_score * 10, 100), 1),
    CASE 
      WHEN c.raw_score * 10 >= 80 THEN 'Experto'
      WHEN c.raw_score * 10 >= 50 THEN 'Avanzado'
      WHEN c.raw_score * 10 >= 25 THEN 'Profesional'
      ELSE 'Emergente'
    END,
    c.matched_edu,
    c.matched_exp
  FROM combined c
  WHERE c.raw_score > 0
  ORDER BY c.raw_score DESC;
$$;


--
-- Name: calculate_therapist_rating(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_therapist_rating(p_therapist_id uuid) RETURNS TABLE(average_rating numeric, total_reviews integer, rating_distribution jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH rating_stats AS (
        SELECT 
            AVG(rating)::NUMERIC(3,2) as avg_rating,
            COUNT(*)::INTEGER as total,
            jsonb_object_agg(
                rating::TEXT, 
                count_per_rating
            ) as distribution
        FROM (
            SELECT 
                rating,
                COUNT(*) as count_per_rating
            FROM reviews
            WHERE therapist_id = p_therapist_id
            AND is_visible = true
            GROUP BY rating
        ) r
    )
    SELECT 
        COALESCE(avg_rating, 0.00) as average_rating,
        COALESCE(total, 0) as total_reviews,
        COALESCE(
            distribution, 
            '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb
        ) as rating_distribution
    FROM rating_stats;
END;
$$;


--
-- Name: FUNCTION calculate_therapist_rating(p_therapist_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_therapist_rating(p_therapist_id uuid) IS 'Calcula el rating promedio, total de reseñas y distribución de ratings para un terapeuta';


--
-- Name: can_book_appointment(uuid, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_book_appointment(p_therapist_id uuid, p_start_time timestamp without time zone, p_end_time timestamp without time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Revisa si hay solapamiento con otra cita
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE therapist_id = p_therapist_id
      AND status != 'cancelado'
      AND (
        (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
      )
  ) THEN
    RETURN FALSE;
  END IF;

  -- Revisa si el horario está dentro de la disponibilidad registrada
  IF NOT EXISTS (
    SELECT 1 FROM therapist_availabilities
    WHERE therapist_id = p_therapist_id
      AND p_start_time::time >= start_time
      AND p_end_time::time <= end_time
      AND day_of_week = EXTRACT(DOW FROM p_start_time)
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;


--
-- Name: can_user_create_clinic(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_user_create_clinic() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('terapeuta', 'clinica', 'admin')
  );
END;
$$;


--
-- Name: can_user_review(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_user_review(p_user_id uuid, p_item_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_has_purchased BOOLEAN;
  v_has_reviewed BOOLEAN;
  v_result JSONB;
BEGIN
  -- Verificar si compró
  SELECT EXISTS (
    SELECT 1 FROM marketplace_orders mo
    JOIN order_items oi ON mo.id = oi.order_id
    WHERE mo.buyer_id = p_user_id
      AND oi.marketplace_item_id = p_item_id
      AND mo.status = 'completed'
  ) INTO v_has_purchased;
  
  -- Verificar si ya dejó review
  SELECT EXISTS (
    SELECT 1 FROM marketplace_reviews
    WHERE reviewer_id = p_user_id
      AND marketplace_item_id = p_item_id
  ) INTO v_has_reviewed;
  
  v_result := jsonb_build_object(
    'can_review', v_has_purchased AND NOT v_has_reviewed,
    'has_purchased', v_has_purchased,
    'has_reviewed', v_has_reviewed,
    'reason', CASE
      WHEN NOT v_has_purchased THEN 'must_purchase_first'
      WHEN v_has_reviewed THEN 'already_reviewed'
      ELSE 'can_review'
    END
  );
  
  RETURN v_result;
END;
$$;


--
-- Name: cancel_appointment(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_appointment(p_appointment_id uuid, p_user_id uuid, p_cancellation_reason text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointment RECORD;
    v_user_role TEXT;
    v_hours_until_appointment NUMERIC;
    v_cancellation_fee_applies BOOLEAN := false;
BEGIN
    -- Obtener datos de la cita
    SELECT 
        a.*,
        t.full_name AS therapist_name,
        p.full_name AS patient_name,
        c.name AS clinic_name
    INTO v_appointment
    FROM appointments a
    JOIN profiles t ON a.therapist_id = t.id
    JOIN profiles p ON a.patient_id = p.id
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.id = p_appointment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'appointment_not_found',
            'message', 'La cita no existe'
        );
    END IF;
    
    -- Verificar si la cita ya está cancelada
    IF v_appointment.status IN ('cancelled', 'completed') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_status',
            'message', format('La cita ya está %s', v_appointment.status),
            'current_status', v_appointment.status
        );
    END IF;
    
    -- Determinar el rol del usuario
    IF p_user_id = v_appointment.patient_id THEN
        v_user_role := 'patient';
    ELSIF p_user_id = v_appointment.therapist_id THEN
        v_user_role := 'therapist';
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'message', 'No tienes permisos para cancelar esta cita'
        );
    END IF;
    
    -- Calcular horas hasta la cita
    v_hours_until_appointment := EXTRACT(EPOCH FROM (
        (v_appointment.appointment_date + v_appointment.appointment_time) - NOW()
    )) / 3600;
    
    -- Política de cancelación: menos de 24 horas podría tener penalización
    IF v_user_role = 'patient' AND v_hours_until_appointment < 24 AND v_hours_until_appointment > 0 THEN
        v_cancellation_fee_applies := true;
    END IF;
    
    -- Actualizar la cita
    UPDATE appointments 
    SET 
        status = 'cancelled',
        cancellation_reason = COALESCE(p_cancellation_reason, 
            CASE 
                WHEN v_user_role = 'patient' THEN 'Cancelado por el paciente'
                ELSE 'Cancelado por el terapeuta'
            END
        ),
        updated_at = NOW()
    WHERE id = p_appointment_id;
    
    -- Retornar resultado con toda la info relevante
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'cancelled_by', v_user_role,
        'cancellation_details', jsonb_build_object(
            'reason', COALESCE(p_cancellation_reason, 'No especificado'),
            'cancelled_at', NOW(),
            'hours_notice', GREATEST(0, v_hours_until_appointment),
            'late_cancellation_fee_applies', v_cancellation_fee_applies
        ),
        'appointment_info', jsonb_build_object(
            'date', v_appointment.appointment_date,
            'time', v_appointment.appointment_time::TEXT,
            'therapist', v_appointment.therapist_name,
            'patient', v_appointment.patient_name,
            'clinic', v_appointment.clinic_name
        ),
        'message', CASE 
            WHEN v_cancellation_fee_applies THEN 
                'Cita cancelada. Nota: Se aplica tarifa por cancelación tardía (menos de 24 horas)'
            ELSE 
                'Cita cancelada exitosamente'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: change_user_role(uuid, public.role_enum); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.change_user_role(user_id uuid, new_role public.role_enum) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Actualizar en profiles
    UPDATE profiles 
    SET role = new_role 
    WHERE id = user_id;
    
    -- Actualizar en auth.users metadata con el valor correcto
    UPDATE auth.users 
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', new_role::text)
    WHERE id = user_id;
END;
$$;


--
-- Name: check_appointment_availability(uuid, uuid, date, time without time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_appointment_availability(p_therapist_id uuid, p_clinic_id uuid, p_date date, p_time time without time zone, p_duration integer DEFAULT 60) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_day_of_week INTEGER;
    v_has_availability BOOLEAN;
    v_has_conflict BOOLEAN;
    v_next_available JSONB;
BEGIN
    -- día de la semana 0=domingo → 7
    v_day_of_week := CASE 
        WHEN EXTRACT(DOW FROM p_date) = 0 THEN 7
        ELSE EXTRACT(DOW FROM p_date)::integer
    END;

    -- validar disponibilidad base del terapeuta
    SELECT EXISTS(
        SELECT 1 
        FROM therapist_availabilities
        WHERE therapist_id = p_therapist_id
        AND (clinic_id = p_clinic_id OR clinic_id IS NULL)
        AND day_of_week = v_day_of_week
        AND is_active = TRUE
        AND p_time >= start_time
        AND p_time + (p_duration || ' minutes')::interval <= end_time
    ) INTO v_has_availability;

    -- verificar conflictos con citas reales
    SELECT EXISTS(
        SELECT 1
        FROM appointments
        WHERE therapist_id = p_therapist_id
        AND clinic_id = p_clinic_id
        AND appointment_date = p_date
        AND status NOT IN ('cancelled', 'no-show')
        AND (
            (appointment_time, appointment_time + (duration || ' minutes')::interval)
            OVERLAPS
            (p_time, p_time + (p_duration || ' minutes')::interval)
        )
    ) INTO v_has_conflict;

    -- Buscar el siguiente slot disponible si no está libre
    IF NOT (v_has_availability AND NOT v_has_conflict) THEN
        WITH slots AS (
            SELECT 
                ta.start_time + (gs.slot * (p_duration || ' minutes')::interval) as slot_start
            FROM therapist_availabilities ta
            CROSS JOIN generate_series(
                0,
                FLOOR((EXTRACT(EPOCH FROM (ta.end_time - ta.start_time)) / 60) / p_duration)::int - 1
            ) gs(slot)
            WHERE ta.therapist_id = p_therapist_id
              AND (ta.clinic_id = p_clinic_id OR ta.clinic_id IS NULL)
              AND ta.day_of_week = v_day_of_week
              AND ta.is_active = true
              AND ta.start_time + (gs.slot * (p_duration || ' minutes')::interval) >= p_time
              AND NOT EXISTS (
                    SELECT 1 FROM appointments a
                    WHERE a.therapist_id = p_therapist_id
                    AND a.appointment_date = p_date
                    AND a.status NOT IN ('cancelled','no-show')
                    AND (
                        (a.appointment_time, a.appointment_time + (a.duration||' minutes')::interval)
                        OVERLAPS
                        (ta.start_time + (gs.slot * (p_duration||' minutes')::interval),
                         ta.start_time + ((gs.slot+1)*(p_duration||' minutes')::interval))
                    )
              )
            ORDER BY slot_start
            LIMIT 1
        )
        SELECT jsonb_build_object(
            'date', p_date,
            'time', slot_start::time::text
        ) INTO v_next_available
        FROM slots;
    END IF;

    RETURN jsonb_build_object(
        'available', v_has_availability AND NOT v_has_conflict,
        'has_base_availability', v_has_availability,
        'has_conflict', v_has_conflict,
        'next_available_slot', v_next_available
    );
END;
$$;


--
-- Name: check_appointment_conflict(uuid, uuid, date, time without time zone, time without time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_appointment_conflict(p_therapist_id uuid, p_patient_id uuid, p_date date, p_start_time time without time zone, p_end_time time without time zone, p_exclude_appointment_id uuid DEFAULT NULL::uuid) RETURNS TABLE(has_conflict boolean, conflict_type text, conflict_details jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_therapist_conflict BOOLEAN;
  v_patient_conflict BOOLEAN;
  v_conflicts JSONB;
BEGIN
  -- Verificar conflicto del terapeuta
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE therapist_id = p_therapist_id
      AND date = p_date
      AND status NOT IN ('canceled', 'no-show')
      AND (id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
      AND (
        (start_time <= p_start_time AND end_time > p_start_time)
        OR (start_time < p_end_time AND end_time >= p_end_time)
        OR (start_time >= p_start_time AND end_time <= p_end_time)
      )
  ) INTO v_therapist_conflict;
  
  -- Verificar conflicto del paciente
  SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = p_patient_id
      AND date = p_date
      AND status NOT IN ('canceled', 'no-show')
      AND (id != p_exclude_appointment_id OR p_exclude_appointment_id IS NULL)
      AND (
        (start_time <= p_start_time AND end_time > p_start_time)
        OR (start_time < p_end_time AND end_time >= p_end_time)
        OR (start_time >= p_start_time AND end_time <= p_end_time)
      )
  ) INTO v_patient_conflict;
  
  -- Construir respuesta
  IF v_therapist_conflict OR v_patient_conflict THEN
    SELECT jsonb_build_object(
      'therapist_conflict', v_therapist_conflict,
      'patient_conflict', v_patient_conflict
    ) INTO v_conflicts;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      CASE 
        WHEN v_therapist_conflict THEN 'therapist'
        WHEN v_patient_conflict THEN 'patient'
      END::TEXT,
      v_conflicts;
  ELSE
    RETURN QUERY SELECT FALSE::BOOLEAN, NULL::TEXT, NULL::JSONB;
  END IF;
END;
$$;


--
-- Name: check_blocked_time_overlap(uuid, uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_blocked_time_overlap(p_therapist_id uuid, p_clinic_id uuid, p_start timestamp with time zone, p_end timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_times
    WHERE therapist_id = p_therapist_id
      AND clinic_id = p_clinic_id
      AND (start_time, end_time) OVERLAPS (p_start, p_end)
  );
END;
$$;


--
-- Name: check_email_exists(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_email_exists(p_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email
  );
END;
$$;


--
-- Name: check_expired_subscriptions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_expired_subscriptions() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Marcar como expired las suscripciones vencidas
  UPDATE therapist_subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND current_period_end < CURRENT_DATE;
    
  -- Cancelar las que llevan más de 7 días expiradas
  UPDATE therapist_subscriptions
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE status = 'expired'
    AND current_period_end < (CURRENT_DATE - INTERVAL '7 days');
END;
$$;


--
-- Name: check_max_session_activities(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_max_session_activities() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.session_activities WHERE session_id = NEW.session_id) >= 3 THEN
    RAISE EXCEPTION 'Máximo 3 actividades por sesión permitidas';
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: check_patient_double_booking(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_patient_double_booking() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    conflict_count INTEGER;
    new_start_datetime TIMESTAMP;
    new_end_datetime TIMESTAMP;
BEGIN
    -- Construir los valores de fecha y hora completos para la nueva cita
    new_start_datetime := NEW.date + NEW.start_time;
    new_end_datetime := NEW.date + NEW.end_time;

    -- Contar las citas existentes para el mismo paciente que se solapan en el tiempo, sin importar el terapeuta.
    SELECT COUNT(*)
    INTO conflict_count
    FROM public.appointments
    WHERE
        -- La cita es para el mismo paciente
        patient_id = NEW.patient_id
        -- Y no es la misma cita que estamos actualizando (importante para updates)
        AND id IS DISTINCT FROM NEW.id
        -- Y el estado no es cancelado
        AND status <> 'cancelled'
        -- Y las fechas se solapan
        AND (date + start_time, date + end_time) OVERLAPS (new_start_datetime, new_end_datetime);

    -- Si se encuentra al menos un conflicto, lanzar un error
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'El paciente ya tiene una cita agendada en ese horario. Elige otro horario.';
    END IF;

    -- Si no hay conflictos, permitir la inserción/actualización
    RETURN NEW;
END;
$$;


--
-- Name: check_policies_health(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_policies_health() RETURNS TABLE(table_name text, policy_count bigint, has_recursion_risk boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename,
        COUNT(*),
        COUNT(*) FILTER (WHERE qual LIKE '%profiles%' AND tablename = 'profiles') > 0
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
    ORDER BY tablename;
END;
$$;


--
-- Name: cleanup_failed_registration(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_failed_registration(user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Eliminar de profiles
  DELETE FROM profiles WHERE id = user_id;
  
  -- Nota: No puedes eliminar de auth.users desde SQL
  -- Eso requiere una Edge Function
END;
$$;


--
-- Name: clone_purchased_plan(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clone_purchased_plan(p_marketplace_item_id uuid, p_buyer_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_original_plan_id UUID;
  v_new_plan_id UUID;
  v_item_title TEXT;
  v_objective RECORD;
  v_new_objective_id UUID;
  v_activity RECORD;
BEGIN
  -- Obtener plan original desde marketplace_items
  SELECT 
    COALESCE(plan_template_id, therapist_plan_template_id),
    title
  INTO v_original_plan_id, v_item_title
  FROM marketplace_items 
  WHERE id = p_marketplace_item_id;
  
  IF v_original_plan_id IS NULL THEN
    RAISE EXCEPTION 'Este item no tiene un plan de tratamiento asociado';
  END IF;
  
  -- Clonar el plan principal
  INSERT INTO treatment_plans (
    therapist_id, 
    name, 
    description, 
    target_diagnosis,
    duration_weeks, 
    recommended_sessions, 
    session_duration_minutes,
    general_objective, 
    is_archived,
    source_marketplace_item_id -- Campo para tracking
  )
  SELECT 
    p_buyer_id,
    name || ' (Adquirido)',
    description,
    target_diagnosis,
    duration_weeks,
    recommended_sessions,
    session_duration_minutes,
    general_objective,
    false,
    p_marketplace_item_id
  FROM treatment_plans 
  WHERE id = v_original_plan_id
  RETURNING id INTO v_new_plan_id;
  
  -- Clonar objetivos
  FOR v_objective IN 
    SELECT * FROM plan_objectives WHERE plan_id = v_original_plan_id ORDER BY display_order
  LOOP
    INSERT INTO plan_objectives (
      plan_id, 
      title, 
      description, 
      objective_type, 
      display_order
    ) VALUES (
      v_new_plan_id,
      v_objective.title,
      v_objective.description,
      v_objective.objective_type,
      v_objective.display_order
    ) RETURNING id INTO v_new_objective_id;
    
    -- Clonar actividades del objetivo
    FOR v_activity IN
      SELECT * FROM plan_objective_activities 
      WHERE objective_id = v_objective.id 
      ORDER BY display_order
    LOOP
      INSERT INTO plan_objective_activities (
        objective_id, 
        name, 
        description, 
        instructions,
        duration_minutes, 
        materials, 
        display_order
      ) VALUES (
        v_new_objective_id,
        v_activity.name,
        v_activity.description,
        v_activity.instructions,
        v_activity.duration_minutes,
        v_activity.materials,
        v_activity.display_order
      );
    END LOOP;
  END LOOP;
  
  RETURN v_new_plan_id;
END;
$$;


--
-- Name: FUNCTION clone_purchased_plan(p_marketplace_item_id uuid, p_buyer_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.clone_purchased_plan(p_marketplace_item_id uuid, p_buyer_id uuid) IS 'Clona un plan de tratamiento cuando se completa la compra';


--
-- Name: confirm_public_appointment(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirm_public_appointment(p_appointment_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE appointments
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = p_appointment_id;
END;
$$;


--
-- Name: count_unread_notifications(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.count_unread_notifications(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM notifications
    WHERE user_id = p_user_id
    AND status IN ('pending', 'sent');
    
    RETURN COALESCE(v_count, 0);
END;
$$;


--
-- Name: create_appointment(uuid, uuid, uuid, date, time without time zone, text, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_appointment(p_patient_id uuid, p_therapist_id uuid, p_clinic_id uuid, p_date date, p_time time without time zone, p_modalidad text, p_duration integer DEFAULT 60, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointment_id INTEGER;
    v_clinic_modalidad clinic_attendance_modality;
    v_day_of_week day_of_week;
    v_is_available BOOLEAN;
    v_overlapping_count INTEGER;
    v_datetime TIMESTAMP;
    v_clinic_id_int INTEGER;
BEGIN
    -- Combinar fecha y hora
    v_datetime := p_date + p_time;
    
    -- Obtener el clinic_id como integer (temporal)
    SELECT id::TEXT::INTEGER INTO v_clinic_id_int
    FROM clinics 
    WHERE id = p_clinic_id 
    LIMIT 1;
    
    IF v_clinic_id_int IS NULL THEN
        v_clinic_id_int := 1;
    END IF;
    
    -- Verificar que la clínica pertenece al terapeuta
    SELECT modalidad INTO v_clinic_modalidad
    FROM clinics
    WHERE id = p_clinic_id AND therapist_id = p_therapist_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'clinic_not_found',
            'message', 'La clínica no existe o no pertenece a este terapeuta'
        );
    END IF;
    
    -- Validar modalidad compatible
    IF (p_modalidad = 'presencial' AND v_clinic_modalidad = 'online') OR 
       (p_modalidad = 'online' AND v_clinic_modalidad = 'presencial') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'modality_mismatch',
            'message', format('La clínica solo acepta modalidad %s', v_clinic_modalidad)
        );
    END IF;
    
    -- Verificar overlapping
    SELECT COUNT(*) INTO v_overlapping_count
    FROM appointments
    WHERE therapist_id = p_therapist_id
        AND DATE(appointment_datetime) = p_date
        AND status NOT IN ('cancelled', 'cancelled_by_therapist', 'cancelled_by_patient', 'no_show')
        AND (
            (appointment_datetime, appointment_datetime + (duration_minutes || ' minutes')::INTERVAL) 
            OVERLAPS 
            (v_datetime, v_datetime + (p_duration || ' minutes')::INTERVAL)
        );
    
    IF v_overlapping_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'time_slot_taken',
            'message', 'Ya existe una cita en este horario'
        );
    END IF;
    
    -- Convertir día
    v_day_of_week := day_number_to_spanish(EXTRACT(DOW FROM p_date)::INTEGER);
    
    -- Verificar disponibilidad
    SELECT EXISTS(
        SELECT 1 
        FROM therapist_availabilities
        WHERE therapist_id = p_therapist_id
            AND clinic_id = p_clinic_id
            AND day_of_week = v_day_of_week
            AND is_active = true
            AND p_time >= start_time
            AND p_time + (p_duration || ' minutes')::INTERVAL <= end_time::TIME
    ) INTO v_is_available;
    
    IF NOT v_is_available THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_available',
            'message', 'El terapeuta no tiene disponibilidad en este horario'
        );
    END IF;
    
    -- Crear la cita con el status correcto
    INSERT INTO appointments (
        patient_id,
        therapist_id,
        clinic_id,
        appointment_datetime,
        duration_minutes,
        consultation_type,
        patient_notes,
        status
    ) VALUES (
        p_patient_id,
        p_therapist_id,
        v_clinic_id_int,
        v_datetime,
        p_duration,
        CASE 
            WHEN p_modalidad = 'presencial' THEN 'in_person'::consultation_type
            WHEN p_modalidad = 'online' THEN 'video_call'::consultation_type
            ELSE 'both'::consultation_type
        END,
        p_notes,
        'pending_confirmation'::appointment_status  -- CORREGIDO
    ) RETURNING id INTO v_appointment_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'message', 'Cita creada exitosamente'
    );
    
EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'duplicate_appointment',
            'message', 'Ya existe una cita en este horario'
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: create_appointment_reminder(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_appointment_reminder(p_appointment_id uuid, p_hours_before integer DEFAULT 24) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_appointment RECORD;
    v_therapist_name TEXT;
    v_clinic_name TEXT;
    v_clinic_address TEXT;
BEGIN
    -- Obtener datos de la cita
    SELECT 
        a.*,
        p.full_name as patient_name,
        t.full_name as therapist_name,
        c.name as clinic_name,
        c.address as clinic_address,
        c.modalidad
    INTO v_appointment
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    JOIN profiles t ON t.id = a.therapist_id
    LEFT JOIN clinics c ON c.id = a.clinic_id
    WHERE a.id = p_appointment_id
    AND a.status = 'scheduled';
    
    -- Si no encuentra la cita o no está agendada, retornar null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Crear la notificación
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        status
    ) VALUES (
        v_appointment.patient_id,
        'appointment_reminder',
        'Recordatorio de Cita',
        format('Tienes una cita con %s el %s a las %s en %s. Modalidad: %s',
            v_appointment.therapist_name,
            to_char(v_appointment.appointment_date, 'DD/MM/YYYY'),
            v_appointment.appointment_time::text,
            COALESCE(v_appointment.clinic_name, 'Consulta Online'),
            COALESCE(v_appointment.modalidad, 'online')
        ),
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'therapist_id', v_appointment.therapist_id,
            'clinic_id', v_appointment.clinic_id,
            'hours_before', p_hours_before,
            'appointment_date', v_appointment.appointment_date,
            'appointment_time', v_appointment.appointment_time
        ),
        'pending'
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;


--
-- Name: create_appointment_v3(uuid, text, uuid, uuid, date, time without time zone, time without time zone, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_appointment_v3(p_therapist_id uuid, p_patient_email text, p_clinic_id uuid, p_service_id uuid, p_date date, p_start_time time without time zone, p_end_time time without time zone, p_notes text DEFAULT NULL::text, p_send_email_reminder boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_profile RECORD;
    v_patient RECORD;
    v_patient_id uuid;
    v_appointment_id uuid;
BEGIN
    -------------------------------------------------------------------
    -- 1. Validación básica
    -------------------------------------------------------------------
    IF p_patient_email IS NULL OR trim(p_patient_email) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'missing_email',
            'message', 'El email del paciente es obligatorio.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 2. Buscar perfil del paciente (la identidad real)
    -------------------------------------------------------------------
    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE email = p_patient_email
    LIMIT 1;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'patient_not_registered',
            'message', 'El paciente no tiene cuenta en Fonokit.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 3. Verificar relación terapeuta ↔ paciente
    -------------------------------------------------------------------
    SELECT *
    INTO v_patient
    FROM public.patients
    WHERE therapist_id = p_therapist_id
      AND profile_id = v_profile.id
    LIMIT 1;

    IF v_patient.id IS NULL THEN
        -- Crear relación nueva
        INSERT INTO public.patients (
            therapist_id,
            profile_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            p_therapist_id,
            v_profile.id,
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_patient_id;
    ELSE
        -- Reactivar si estaba archivado
        IF v_patient.status = 'archived' THEN
            UPDATE public.patients
            SET status = 'active', updated_at = NOW()
            WHERE id = v_patient.id;
        END IF;

        v_patient_id := v_patient.id;
    END IF;

    -------------------------------------------------------------------
    -- 4. Validar que no exista una cita en el mismo horario
    -------------------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM public.appointments a
        WHERE a.patient_id = v_patient_id
        AND a.date = p_date
        AND (p_start_time, p_end_time)
            OVERLAPS (a.start_time, a.end_time)
        AND a.status IN ('scheduled','confirmed')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'double_booking',
            'message', 'El paciente ya tiene una cita en ese horario.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 5. Crear la cita
    -------------------------------------------------------------------
    INSERT INTO public.appointments (
        therapist_id,
        patient_id,
        clinic_id,
        service_id,
        date,
        start_time,
        end_time,
        notes,
        send_email_reminder,
        status
    )
    VALUES (
        p_therapist_id,
        v_patient_id,
        p_clinic_id,
        p_service_id,
        p_date,
        p_start_time,
        p_end_time,
        p_notes,
        p_send_email_reminder,
        'scheduled'
    )
    RETURNING id INTO v_appointment_id;

    -------------------------------------------------------------------
    -- 6. Respuesta final JSON
    -------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'patient', jsonb_build_object(
            'profile_id', v_profile.id,
            'patient_id', v_patient_id,
            'full_name', v_profile.full_name,
            'email', v_profile.email,
            'phone', v_profile.phone
        ),
        'message', 'Cita creada correctamente.'
    );

END;
$$;


--
-- Name: create_clinic(uuid, text, text, integer, public.clinic_attendance_modality, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_clinic(p_therapist_id uuid, p_name text, p_address text, p_city_id integer, p_modalidad public.clinic_attendance_modality, p_phone text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_description text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
    v_clinic_id UUID;
    v_clinic_count INTEGER;
    v_city_name TEXT;
    v_region_name TEXT;
    v_max_clinics INTEGER := 5; -- Límite configurable
BEGIN
    -- Validar que el terapeuta existe
    IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = p_therapist_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found',
            'message', 'El terapeuta no existe'
        );
    END IF;
    
    -- Validar ciudad
    SELECT 
        c.name,
        r.name
    INTO v_city_name, v_region_name
    FROM ubication_cities c
    JOIN ubication_regions r ON c.region_id = r.id
    WHERE c.id = p_city_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_city',
            'message', 'La ciudad especificada no es válida'
        );
    END IF;
    
    -- Contar clínicas actuales del terapeuta
    SELECT COUNT(*) INTO v_clinic_count
    FROM clinics
    WHERE therapist_id = p_therapist_id;
    
    IF v_clinic_count >= v_max_clinics THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'clinic_limit_exceeded',
            'message', format('Has alcanzado el límite máximo de %s clínicas', v_max_clinics),
            'current_count', v_clinic_count,
            'max_allowed', v_max_clinics
        );
    END IF;
    
    -- Validar que no exista una clínica con el mismo nombre para este terapeuta
    IF EXISTS(
        SELECT 1 FROM clinics 
        WHERE therapist_id = p_therapist_id 
        AND LOWER(TRIM(name)) = LOWER(TRIM(p_name))
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'duplicate_clinic_name',
            'message', 'Ya tienes una clínica con este nombre'
        );
    END IF;
    
    -- Validar email si se proporciona
    IF p_email IS NOT NULL AND p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_email',
            'message', 'El formato del email no es válido'
        );
    END IF;
    
    -- Crear la clínica
    INSERT INTO clinics (
        therapist_id,
        name,
        address,
        phone,
        email,
        description,
        modalidad,
        city_id
    ) VALUES (
        p_therapist_id,
        TRIM(p_name),
        TRIM(p_address),
        p_phone,
        LOWER(p_email),
        p_description,
        p_modalidad,
        p_city_id
    ) RETURNING id INTO v_clinic_id;
    
    -- Si es modalidad online, crear disponibilidad básica automática
    IF p_modalidad IN ('online', 'ambas') THEN
        -- Crear horario estándar L-V 9:00-18:00
        INSERT INTO therapist_availabilities (therapist_id, clinic_id, day_of_week, start_time, end_time, is_active)
        SELECT 
            p_therapist_id,
            v_clinic_id,
            day,
            '09:00'::TIME,
            '18:00'::TIME,
            true
        FROM generate_series(1, 5) AS day;
    END IF;
    
    -- Retornar la clínica creada con toda la info
    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_clinic_id,
        'clinic_details', jsonb_build_object(
            'id', v_clinic_id,
            'name', TRIM(p_name),
            'address', TRIM(p_address),
            'city', v_city_name,
            'region', v_region_name,
            'modalidad', p_modalidad,
            'phone', p_phone,
            'email', LOWER(p_email),
            'description', p_description
        ),
        'message', CASE 
            WHEN p_modalidad IN ('online', 'ambas') THEN
                'Clínica creada exitosamente. Se agregó disponibilidad estándar L-V 9:00-18:00'
            ELSE
                'Clínica creada exitosamente. Recuerda configurar tu disponibilidad'
        END,
        'therapist_clinic_count', v_clinic_count + 1,
        'auto_availability_created', p_modalidad IN ('online', 'ambas')
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$_$;


--
-- Name: create_clinic_and_associate_therapist(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_clinic_and_associate_therapist(clinic_data jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  new_clinic_id uuid;
BEGIN
  -- Primero, verificamos si el usuario tiene permiso usando nuestra función.
  IF NOT public.can_user_create_clinic() THEN
    RAISE EXCEPTION 'El usuario no tiene permisos para crear una clínica.';
  END IF;

  -- Insertamos la nueva clínica.
  INSERT INTO public.clinics (name, address, city_id, modality, is_active)
  VALUES (
    clinic_data->>'name',
    clinic_data->>'address',
    (clinic_data->>'city_id')::integer,
    (clinic_data->>'modality')::modality_enum,
    (clinic_data->>'is_active')::boolean
  ) RETURNING id INTO new_clinic_id;

  -- Asociamos la nueva clínica con el terapeuta que la creó.
  INSERT INTO public.clinic_therapists (clinic_id, therapist_id, is_active)
  VALUES (new_clinic_id, auth.uid(), true);

  RETURN new_clinic_id;
END;
$$;


--
-- Name: create_clinic_with_therapist(text, jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_clinic_with_therapist(p_clinic_name text, p_clinic_data jsonb, p_therapist_id uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_clinic_id UUID;
    v_therapist_id UUID;
    v_modality_text TEXT;
    v_modality_enum modality_enum;
BEGIN
    -- Usar el ID del usuario actual si no se proporciona.
    v_therapist_id := COALESCE(p_therapist_id, auth.uid());
    
    -- Verificar que el usuario tiene el rol adecuado.
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = v_therapist_id 
        AND role IN ('terapeuta', 'clinica', 'admin')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'message', 'Usuario no autorizado para crear clínicas.'
        );
    END IF;
    
    -- 1. Extraer, limpiar y convertir a minúsculas la modalidad.
    v_modality_text := lower(trim(p_clinic_data->>'modality'));

    -- 2. Mapear de forma segura el texto del frontend al ENUM de la base de datos.
    v_modality_enum := CASE
        WHEN v_modality_text = 'presencial' THEN 'presencial'::modality_enum
        WHEN v_modality_text = 'online' THEN 'online'::modality_enum
        WHEN v_modality_text = 'mixto' OR v_modality_text = 'ambas' THEN 'ambas'::modality_enum
        WHEN v_modality_text IS NULL THEN 'ambas'::modality_enum -- 3. Valor por defecto si no se envía.
        ELSE NULL -- Si no es válido, se volverá nulo.
    END;

    -- 4. Si la modalidad no es válida, devolver un error amigable.
    IF v_modality_enum IS NULL THEN
         RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_modality',
            'message', 'Valor de modalidad no válido. Use: Online, Presencial o Mixto.'
        );
    END IF;

    -- Crear la clínica con la modalidad ya validada y convertida.
    INSERT INTO clinics (
        name,
        rut,
        address,
        phone,
        email,
        website_url,
        modality,
        is_active
    ) VALUES (
        p_clinic_name,
        p_clinic_data->>'rut',
        p_clinic_data->>'address',
        p_clinic_data->>'phone',
        p_clinic_data->>'email',
        p_clinic_data->>'website_url',
        v_modality_enum, -- Usamos la variable segura.
        (p_clinic_data->>'is_active')::boolean
    ) RETURNING id INTO v_clinic_id;
    
    -- Asociar el terapeuta con la clínica.
    INSERT INTO clinic_therapists (
        clinic_id,
        therapist_id,
        is_active
    ) VALUES (
        v_clinic_id,
        v_therapist_id,
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_clinic_id,
        'message', 'Clínica creada exitosamente.'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: create_clinical_history_from_appointment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_clinical_history_from_appointment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Check if entry already exists for this appointment
    IF NOT EXISTS (
      SELECT 1 FROM clinical_history 
      WHERE appointment_id = NEW.id
    ) THEN
      INSERT INTO clinical_history (
        patient_id,
        therapist_id,
        entry_type,
        entry_date,
        summary,
        appointment_id,
        is_external,
        created_at
      ) VALUES (
        NEW.patient_id,
        NEW.therapist_id,
        'sesion_terapia',
        (NEW.date || ' ' || NEW.start_time)::timestamp,
        COALESCE(NEW.notes, 'Sesión completada'),
        NEW.id,
        false,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_clinical_history_from_session(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_clinical_history_from_session() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_patient_id uuid;
  v_therapist_id uuid;
  v_plan_name text;
  v_session_number integer;
  v_activities jsonb;
  v_summary text;
  v_details jsonb;
  v_history_id uuid;
BEGIN
  -- Solo actuar cuando el status cambia a 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Obtener datos del plan asignado
    SELECT 
      pap.patient_id,
      pap.therapist_id,
      COALESCE(tp.name, pap.name) as plan_name
    INTO v_patient_id, v_therapist_id, v_plan_name
    FROM patient_assigned_plans pap
    LEFT JOIN treatment_plans tp ON tp.id = pap.plan_template_id
    WHERE pap.id = NEW.assigned_plan_id;
    
    -- Obtener número de sesión
    v_session_number := NEW.session_number;
    
    -- Obtener actividades de la sesión con sus niveles de logro
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', sa.name,
        'description', sa.description,
        'duration_minutes', sa.duration_minutes,
        'achievement_level', sa.achievement_level,
        'status', sa.status
      )
    )
    INTO v_activities
    FROM session_activities sa
    WHERE sa.session_id = NEW.id;
    
    -- Construir resumen
    v_summary := format('Sesión %s - %s', v_session_number, v_plan_name);
    
    -- Construir detalles
    v_details := jsonb_build_object(
      'plan_id', NEW.assigned_plan_id,
      'session_id', NEW.id,
      'session_number', v_session_number,
      'scheduled_date', NEW.scheduled_date,
      'completed_date', NEW.completed_date,
      'activities', COALESCE(v_activities, '[]'::jsonb),
      'notes', NEW.notes,
      'auto_generated', true
    );
    
    -- Crear entrada en clinical_history
    -- FIX: Usar 'sesion_terapia' en lugar de 'sesion' para cumplir FK
    INSERT INTO clinical_history (
      patient_id,
      therapist_id,
      entry_type,
      summary,
      details,
      entry_date,
      assigned_plan_id
    ) VALUES (
      v_patient_id,
      v_therapist_id,
      'sesion_terapia', 
      v_summary,
      v_details,
      COALESCE(NEW.completed_date, now()),
      NEW.assigned_plan_id
    )
    RETURNING id INTO v_history_id;
    
    -- Actualizar la sesión con el ID del historial
    UPDATE plan_sessions 
    SET clinical_history_id = v_history_id
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_patient_and_appointment(uuid, text, text, text, text, uuid, uuid, date, time without time zone, time without time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_patient_and_appointment(p_therapist_id uuid, p_patient_email text, p_patient_full_name text, p_patient_phone text, p_patient_rut text, p_clinic_id uuid, p_service_id uuid, p_date date, p_start_time time without time zone, p_end_time time without time zone, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_profile RECORD;
    v_patient RECORD;
    v_patient_id uuid;
    v_appointment_id uuid;
BEGIN
    -------------------------------------------------------------------
    -- VALIDACIONES BÁSICAS
    -------------------------------------------------------------------
    IF p_therapist_id IS NULL THEN
        RAISE EXCEPTION 'p_therapist_id es obligatorio';
    END IF;

    IF p_patient_email IS NULL OR trim(p_patient_email) = '' THEN
        RAISE EXCEPTION 'p_patient_email es obligatorio';
    END IF;

    -------------------------------------------------------------------
    -- 1. Buscar perfil REAL del paciente
    -------------------------------------------------------------------
    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE email = p_patient_email
    LIMIT 1;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'patient_not_registered',
            'message', 'El paciente debe crear una cuenta en Fonokit antes de agendar.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 2. Validar RUT si viene
    -------------------------------------------------------------------
    IF p_patient_rut IS NOT NULL AND v_profile.rut IS NOT NULL THEN
        IF p_patient_rut <> v_profile.rut THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'rut_mismatch',
                'message', 'El RUT ingresado no coincide con el registrado por el paciente.'
            );
        END IF;
    END IF;

    -------------------------------------------------------------------
    -- 3. Verificar si ya existe la relación terapeuta ↔ paciente
    -------------------------------------------------------------------
    SELECT *
    INTO v_patient
    FROM public.patients
    WHERE therapist_id = p_therapist_id
      AND profile_id = v_profile.id
    LIMIT 1;

    IF v_patient.id IS NOT NULL THEN
        -- Reactivar si está archivado
        IF v_patient.status = 'archived' THEN
            UPDATE public.patients
            SET status = 'active', updated_at = NOW()
            WHERE id = v_patient.id;
        END IF;

        v_patient_id := v_patient.id;
    ELSE
        -------------------------------------------------------------------
        -- 4. Crear relación terapeuta ↔ paciente
        -------------------------------------------------------------------
        INSERT INTO public.patients (
            therapist_id,
            profile_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            p_therapist_id,
            v_profile.id,
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_patient_id;
    END IF;

    -------------------------------------------------------------------
    -- 5. Prevenir doble booking
    -------------------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE patient_id = v_patient_id
          AND date = p_date
          AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
          AND status IN ('scheduled', 'confirmed')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'double_booking',
            'message', 'El paciente ya tiene una cita programada en este horario.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 6. Crear cita
    -------------------------------------------------------------------
    INSERT INTO public.appointments (
        therapist_id,
        clinic_id,
        patient_id,
        service_id,
        date,
        start_time,
        end_time,
        notes,
        status
    )
    VALUES (
        p_therapist_id,
        p_clinic_id,
        v_patient_id,
        p_service_id,
        p_date,
        p_start_time,
        p_end_time,
        p_notes,
        'scheduled'
    )
    RETURNING id INTO v_appointment_id;

    -------------------------------------------------------------------
    -- 7. Respuesta final
    -------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'patient_id', v_patient_id,
        'profile', jsonb_build_object(
            'id', v_profile.id,
            'full_name', v_profile.full_name,
            'email', v_profile.email,
            'phone', v_profile.phone,
            'rut', v_profile.rut
        ),
        'message', 'Paciente vinculado y cita creada exitosamente.'
    );

END;
$$;


--
-- Name: create_patient_and_appointment_v2(uuid, text, text, uuid, uuid, date, time without time zone, time without time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_patient_and_appointment_v2(p_therapist_id uuid DEFAULT NULL::uuid, p_patient_email text DEFAULT NULL::text, p_patient_rut text DEFAULT NULL::text, p_clinic_id uuid DEFAULT NULL::uuid, p_service_id uuid DEFAULT NULL::uuid, p_date date DEFAULT NULL::date, p_start_time time without time zone DEFAULT NULL::time without time zone, p_end_time time without time zone DEFAULT NULL::time without time zone, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_profile record;
    v_patient record;
    v_patient_id uuid;
    v_appointment_id uuid;
BEGIN
    -------------------------------------------------------------------
    -- VALIDACIONES
    -------------------------------------------------------------------
    IF p_therapist_id IS NULL THEN
        RAISE EXCEPTION 'p_therapist_id es obligatorio';
    END IF;

    IF p_patient_email IS NULL OR trim(p_patient_email) = '' THEN
        RAISE EXCEPTION 'p_patient_email es obligatorio';
    END IF;

    -------------------------------------------------------------------
    -- 1. Buscar profile del paciente
    -------------------------------------------------------------------
    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE email = p_patient_email
    LIMIT 1;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'patient_not_registered',
            'message', 'El paciente debe tener cuenta en Fonokit antes de agendar.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 2. Validar RUT si viene
    -------------------------------------------------------------------
    IF p_patient_rut IS NOT NULL AND v_profile.rut IS NOT NULL THEN
        IF v_profile.rut <> p_patient_rut THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'rut_mismatch',
                'message', 'El RUT no coincide con el que tiene registrado el paciente.'
            );
        END IF;
    END IF;

    -------------------------------------------------------------------
    -- 3. Buscar si ya existe relación therapist ←→ patient
    -------------------------------------------------------------------
    SELECT *
    INTO v_patient
    FROM public.patients
    WHERE therapist_id = p_therapist_id
      AND profile_id = v_profile.id
    LIMIT 1;

    IF v_patient.id IS NOT NULL THEN
        -- Reactivar si está archivado
        IF v_patient.status = 'archived' THEN
            UPDATE public.patients
            SET status = 'active', updated_at = NOW()
            WHERE id = v_patient.id;
        END IF;

        v_patient_id := v_patient.id;

    ELSE
        -------------------------------------------------------------------
        -- 4. Crear relación nueva
        -------------------------------------------------------------------
        INSERT INTO public.patients (
            therapist_id,
            profile_id,
            status,
            created_at,
            updated_at
        )
        VALUES (
            p_therapist_id,
            v_profile.id,
            'active',
            NOW(),
            NOW()
        )
        RETURNING id INTO v_patient_id;
    END IF;

    -------------------------------------------------------------------
    -- 5. Prevenir doble booking
    -------------------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM public.appointments
        WHERE patient_id = v_patient_id
          AND date = p_date
          AND (p_start_time, p_end_time) OVERLAPS (start_time, end_time)
          AND status IN ('scheduled', 'confirmed')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'double_booking',
            'message', 'El paciente ya tiene una cita en ese horario.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 6. Crear cita
    -------------------------------------------------------------------
    INSERT INTO public.appointments (
        therapist_id,
        clinic_id,
        patient_id,
        service_id,
        date,
        start_time,
        end_time,
        notes
    )
    VALUES (
        p_therapist_id,
        p_clinic_id,
        v_patient_id,
        p_service_id,
        p_date,
        p_start_time,
        p_end_time,
        p_notes
    )
    RETURNING id INTO v_appointment_id;

    -------------------------------------------------------------------
    -- 7. Respuesta final
    -------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'patient_id', v_patient_id,
        'profile', jsonb_build_object(
            'id', v_profile.id,
            'name', v_profile.full_name,
            'email', v_profile.email,
            'phone', v_profile.phone,
            'rut', v_profile.rut
        ),
        'message', 'Cita creada correctamente.'
    );

END;
$$;


--
-- Name: create_profile_for_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_profile_for_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- This function is now disabled to allow manual profile creation from the frontend.
  -- The logic has been moved to the `register` function in `AuthContext.jsx`.
  -- This prevents potential race conditions or duplicate profile entries.
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    clinic_id uuid,
    service_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    notes text,
    send_email_reminder boolean DEFAULT false,
    status text DEFAULT 'scheduled'::text NOT NULL,
    color text DEFAULT '#FF4D8D'::text,
    recurring_group_id uuid,
    modality_patient text DEFAULT 'presencial'::text,
    duration_minutes integer DEFAULT 40 NOT NULL,
    confirmation_status text DEFAULT 'pending'::text,
    specialty_id uuid,
    block_type text,
    CONSTRAINT appointments_block_type_check CHECK ((block_type = ANY (ARRAY['aula_recursos'::text, 'trabajo_colaborativo'::text, 'coordinacion'::text, 'informe'::text, 'preparacion_material'::text]))),
    CONSTRAINT appointments_confirmation_status_check CHECK ((confirmation_status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text]))),
    CONSTRAINT appointments_modality_patient_check CHECK ((modality_patient = ANY (ARRAY['online'::text, 'presencial'::text, 'mixta'::text]))),
    CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text, 'no-show'::text]))),
    CONSTRAINT check_modality_patient_values CHECK ((modality_patient = ANY (ARRAY['online'::text, 'presencial'::text, 'mixta'::text])))
);


--
-- Name: create_recurring_appointments(jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_recurring_appointments(p_base_appointment jsonb, p_weeks integer) RETURNS SETOF public.appointments
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_current_date DATE;
  v_start_time TIME;
  v_end_time TIME;
  v_duration INTEGER;
  v_appointment appointments;
  v_group_id UUID;
BEGIN
  -- Extract values from JSONB
  v_current_date := (p_base_appointment->>'date')::DATE;
  v_start_time := (p_base_appointment->>'start_time')::TIME;
  v_duration := COALESCE((p_base_appointment->>'duration_minutes')::INTEGER, 45);
  v_end_time := COALESCE(
    (p_base_appointment->>'end_time')::TIME,
    v_start_time + (v_duration || ' minutes')::INTERVAL
  );
  v_group_id := COALESCE(
    (p_base_appointment->>'recurring_group_id')::UUID,
    gen_random_uuid()
  );
  
  -- Create appointments for each week
  FOR i IN 0..(p_weeks - 1) LOOP
    INSERT INTO appointments (
      patient_id,
      therapist_id,
      clinic_id,
      date,
      start_time,
      end_time,
      duration_minutes,
      status,
      notes,
      recurring_group_id,
      modality_patient,
      created_at,
      updated_at
    ) VALUES (
      (p_base_appointment->>'patient_id')::UUID,
      (p_base_appointment->>'therapist_id')::UUID,
      NULLIF(p_base_appointment->>'clinic_id', '')::UUID,
      v_current_date + (i * 7),
      v_start_time,
      v_end_time,
      v_duration,
      COALESCE(p_base_appointment->>'status', 'scheduled'),
      COALESCE(p_base_appointment->>'notes', ''),
      v_group_id,
      COALESCE(p_base_appointment->>'modality_patient', 'presencial'),
      NOW(),
      NOW()
    )
    RETURNING * INTO v_appointment;
    
    RETURN NEXT v_appointment;
  END LOOP;
  
  RETURN;
END;
$$;


--
-- Name: create_review(uuid, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_review(p_appointment_id uuid, p_rating integer, p_comment text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_review_id UUID;
    v_therapist_id UUID;
    v_patient_id UUID;
    v_appointment_status appointment_status;
    v_appointment_date DATE;
    v_days_since_appointment INTEGER;
BEGIN
    -- Obtener datos de la cita
    SELECT 
        a.patient_id,
        a.therapist_id,
        a.status,
        a.appointment_date,
        EXTRACT(DAY FROM NOW() - a.appointment_date)::INTEGER
    INTO 
        v_patient_id,
        v_therapist_id,
        v_appointment_status,
        v_appointment_date,
        v_days_since_appointment
    FROM appointments a
    WHERE a.id = p_appointment_id;

    -- Validación 1: La cita existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cita no existe';
    END IF;

    -- Validación 2: El usuario actual es el paciente de la cita
    IF v_patient_id != auth.uid() THEN
        RAISE EXCEPTION 'Solo el paciente puede dejar una reseña';
    END IF;

    -- Validación 3: La cita debe estar completada
    IF v_appointment_status != 'completed' THEN
        RAISE EXCEPTION 'Solo puedes dejar reseña de citas completadas';
    END IF;

    -- Validación 4: Máximo 30 días después de la cita
    IF v_days_since_appointment > 30 THEN
        RAISE EXCEPTION 'El plazo para dejar reseña ha expirado (máximo 30 días)';
    END IF;

    -- Validación 5: Rating válido (1-5)
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'El rating debe estar entre 1 y 5';
    END IF;

    -- Validación 6: No duplicar review
    IF EXISTS (
        SELECT 1 FROM reviews 
        WHERE patient_id = v_patient_id 
        AND appointment_id = p_appointment_id
    ) THEN
        RAISE EXCEPTION 'Ya has dejado una reseña para esta cita';
    END IF;

    -- Crear la review
    INSERT INTO reviews (
        patient_id,
        therapist_id,
        appointment_id,
        rating,
        comment,
        is_visible
    ) VALUES (
        v_patient_id,
        v_therapist_id,
        p_appointment_id,
        p_rating,
        p_comment,
        true
    ) RETURNING id INTO v_review_id;

    RETURN v_review_id;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya existe una reseña para esta cita';
END;
$$;


--
-- Name: FUNCTION create_review(p_appointment_id uuid, p_rating integer, p_comment text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_review(p_appointment_id uuid, p_rating integer, p_comment text) IS 'Crea una nueva reseña para una cita completada. Solo el paciente puede crear la reseña dentro de 30 días.';


--
-- Name: create_therapist_branding(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_therapist_branding() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.role = 'therapist' THEN
    INSERT INTO therapist_branding (therapist_id)
    VALUES (NEW.id)
    ON CONFLICT (therapist_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: create_user_wallet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_user_wallet() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: day_number_to_spanish(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.day_number_to_spanish(day_num integer) RETURNS public.day_of_week
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    RETURN CASE 
        WHEN day_num = 0 OR day_num = 7 THEN 'Domingo'::day_of_week
        WHEN day_num = 1 THEN 'Lunes'::day_of_week
        WHEN day_num = 2 THEN 'Martes'::day_of_week
        WHEN day_num = 3 THEN 'Miércoles'::day_of_week
        WHEN day_num = 4 THEN 'Jueves'::day_of_week
        WHEN day_num = 5 THEN 'Viernes'::day_of_week
        WHEN day_num = 6 THEN 'Sábado'::day_of_week
        ELSE NULL
    END;
END;
$$;


--
-- Name: debug_search_params(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_search_params(p_modalidad text DEFAULT NULL::text) RETURNS TABLE(param_value text, param_is_null boolean, param_length integer, equals_presencial boolean, equals_online boolean, equals_todas boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_modalidad as param_value,
        p_modalidad IS NULL as param_is_null,
        CASE WHEN p_modalidad IS NOT NULL THEN length(p_modalidad) ELSE 0 END as param_length,
        p_modalidad = 'presencial' as equals_presencial,
        p_modalidad = 'online' as equals_online,
        p_modalidad = 'todas' as equals_todas;
END;
$$;


--
-- Name: debug_set_availability(uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_set_availability(p_therapist_id uuid, p_clinic_id uuid, p_availabilities jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_keys text[];
BEGIN
    -- Obtener las claves del primer elemento si existe
    IF p_availabilities->0 IS NOT NULL THEN
        SELECT array_agg(key) INTO v_keys
        FROM jsonb_object_keys(p_availabilities->0) AS key;
    END IF;
    
    RETURN jsonb_build_object(
        'received_data', jsonb_build_object(
            'therapist_id', p_therapist_id,
            'clinic_id', p_clinic_id,
            'availabilities_count', jsonb_array_length(p_availabilities),
            'availabilities', p_availabilities,
            'first_item', p_availabilities->0,
            'first_item_keys', v_keys
        )
    );
END;
$$;


--
-- Name: delete_all_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_all_users() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    PERFORM auth.delete_user(user_record.id);
  END LOOP;
END;
$$;


--
-- Name: delete_clinic(uuid, uuid, boolean, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_clinic(p_clinic_id uuid, p_therapist_id uuid, p_force_delete boolean DEFAULT false, p_transfer_appointments_to uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_clinic RECORD;
    v_active_appointments INTEGER;
    v_total_appointments INTEGER;
    v_future_appointments INTEGER;
    v_availabilities_count INTEGER;
    v_transfer_clinic RECORD;
    v_archived_data JSONB;
BEGIN
    -- Obtener datos de la clínica
    SELECT 
        c.*,
        ci.name AS city_name,
        COUNT(DISTINCT a.id) AS total_appointments
    INTO v_clinic
    FROM clinics c
    LEFT JOIN ubication_cities ci ON c.city_id = ci.id
    LEFT JOIN appointments a ON c.id = a.clinic_id
    WHERE c.id = p_clinic_id AND c.therapist_id = p_therapist_id
    GROUP BY c.id, c.therapist_id, c.name, c.address, c.phone, 
             c.email, c.description, c.modalidad, c.city_id, 
             c.created_at, c.updated_at, ci.name;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'clinic_not_found',
            'message', 'La clínica no existe o no te pertenece'
        );
    END IF;
    
    -- Contar citas futuras
    SELECT 
        COUNT(*) FILTER (WHERE status = 'scheduled' AND appointment_date >= CURRENT_DATE),
        COUNT(*) FILTER (WHERE appointment_date >= CURRENT_DATE)
    INTO v_active_appointments, v_future_appointments
    FROM appointments
    WHERE clinic_id = p_clinic_id;
    
    -- Si hay citas activas y no se fuerza la eliminación
    IF v_active_appointments > 0 AND NOT p_force_delete THEN
        -- Si se especifica clínica de transferencia
        IF p_transfer_appointments_to IS NOT NULL THEN
            -- Validar clínica de destino
            SELECT * INTO v_transfer_clinic
            FROM clinics
            WHERE id = p_transfer_appointments_to 
            AND therapist_id = p_therapist_id;
            
            IF NOT FOUND THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'invalid_transfer_clinic',
                    'message', 'La clínica de destino no existe o no te pertenece'
                );
            END IF;
            
            -- Validar compatibilidad de modalidades
            IF NOT (v_transfer_clinic.modalidad = 'ambas' OR 
                   v_transfer_clinic.modalidad = v_clinic.modalidad OR
                   v_clinic.modalidad = 'ambas') THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'modalidad_incompatible',
                    'message', format('La clínica destino (%s) no es compatible con la modalidad de las citas', v_transfer_clinic.modalidad),
                    'source_modalidad', v_clinic.modalidad,
                    'target_modalidad', v_transfer_clinic.modalidad
                );
            END IF;
            
            -- Transferir citas futuras
            UPDATE appointments
            SET 
                clinic_id = p_transfer_appointments_to,
                notes = COALESCE(notes, '') || E'\n---\n' || 
                       format('[%s] Transferida desde clínica: %s', NOW()::DATE, v_clinic.name)
            WHERE clinic_id = p_clinic_id
            AND appointment_date >= CURRENT_DATE
            AND status = 'scheduled';
            
        ELSE
            -- No se puede eliminar sin transferir o forzar
            RETURN jsonb_build_object(
                'success', false,
                'error', 'has_active_appointments',
                'message', 'La clínica tiene citas activas. Debes transferirlas o forzar la eliminación',
                'active_appointments', v_active_appointments,
                'options', jsonb_build_object(
                    'transfer_to_another_clinic', 'Especifica transfer_appointments_to',
                    'force_delete', 'Usa force_delete=true para cancelar todas las citas'
                )
            );
        END IF;
    END IF;
    
    -- Si se fuerza la eliminación, cancelar todas las citas futuras
    IF p_force_delete AND v_active_appointments > 0 THEN
        UPDATE appointments
        SET 
            status = 'cancelled',
            cancellation_reason = 'Clínica eliminada por el terapeuta',
            updated_at = NOW()
        WHERE clinic_id = p_clinic_id
        AND appointment_date >= CURRENT_DATE
        AND status = 'scheduled';
    END IF;
    
    -- Archivar datos importantes antes de eliminar
    v_archived_data := jsonb_build_object(
        'clinic_info', jsonb_build_object(
            'id', v_clinic.id,
            'name', v_clinic.name,
            'address', v_clinic.address,
            'city', v_clinic.city_name,
            'modalidad', v_clinic.modalidad,
            'deleted_at', NOW()
        ),
        'statistics', jsonb_build_object(
            'total_appointments', v_clinic.total_appointments,
            'cancelled_future_appointments', CASE 
                WHEN p_force_delete THEN v_active_appointments 
                ELSE 0 
            END,
            'transferred_appointments', CASE 
                WHEN p_transfer_appointments_to IS NOT NULL THEN v_active_appointments 
                ELSE 0 
            END
        )
    );
    
    -- Contar disponibilidades que se eliminarán
    SELECT COUNT(*) INTO v_availabilities_count
    FROM therapist_availabilities
    WHERE clinic_id = p_clinic_id;
    
    -- Eliminar disponibilidades
    DELETE FROM therapist_availabilities
    WHERE clinic_id = p_clinic_id;
    
    -- Finalmente, eliminar la clínica
    DELETE FROM clinics
    WHERE id = p_clinic_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_clinic', v_archived_data,
        'actions_taken', jsonb_build_object(
            'appointments_cancelled', CASE WHEN p_force_delete THEN v_active_appointments ELSE 0 END,
            'appointments_transferred', CASE WHEN p_transfer_appointments_to IS NOT NULL THEN v_active_appointments ELSE 0 END,
            'availabilities_deleted', v_availabilities_count,
            'transfer_clinic', CASE 
                WHEN p_transfer_appointments_to IS NOT NULL THEN
                    jsonb_build_object(
                        'id', v_transfer_clinic.id,
                        'name', v_transfer_clinic.name
                    )
                ELSE NULL
            END
        ),
        'message', CASE
            WHEN p_force_delete AND v_active_appointments > 0 THEN
                format('Clínica eliminada. Se cancelaron %s citas activas', v_active_appointments)
            WHEN p_transfer_appointments_to IS NOT NULL AND v_active_appointments > 0 THEN
                format('Clínica eliminada. Se transfirieron %s citas a %s', v_active_appointments, v_transfer_clinic.name)
            ELSE
                'Clínica eliminada exitosamente'
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: delete_recurring_appointments(uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_recurring_appointments(p_recurring_group_id uuid, p_only_future boolean DEFAULT true) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  IF p_only_future THEN
    DELETE FROM appointments
    WHERE recurring_group_id = p_recurring_group_id
      AND date >= CURRENT_DATE
      AND status NOT IN ('completed', 'cancelled');
  ELSE
    DELETE FROM appointments
    WHERE recurring_group_id = p_recurring_group_id
      AND status NOT IN ('completed');
  END IF;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;


--
-- Name: encrypt_rut(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_rut(plain_rut text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN encode(
    encrypt(
      plain_rut::bytea, 
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'responsible_rut_key')::bytea,
      'aes'
    ),
    'base64'
  );
END;
$$;


--
-- Name: ensure_unique_profile_slug(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_unique_profile_slug(desired_slug text, profile_id_to_exclude uuid DEFAULT NULL::uuid) RETURNS text
    LANGUAGE plpgsql
    AS $$
    DECLARE
      final_slug TEXT := desired_slug;
      counter INT := 1;
      is_unique BOOLEAN := FALSE;
    BEGIN
      WHILE NOT is_unique LOOP
        IF profile_id_to_exclude IS NULL THEN
          PERFORM 1 FROM public.profiles WHERE slug = final_slug LIMIT 1;
        ELSE
          PERFORM 1 FROM public.profiles WHERE slug = final_slug AND id != profile_id_to_exclude LIMIT 1;
        END IF;
        
        IF NOT FOUND THEN
          is_unique := TRUE;
        ELSE
          final_slug := desired_slug || '-' || counter;
          counter := counter + 1;
        END IF;
      END LOOP;
      RETURN final_slug;
    END;
    $$;


--
-- Name: find_and_associate_patient(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_and_associate_patient(p_therapist_id uuid, p_patient_email text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_profile_id uuid;
    v_patient_record_id uuid;
    v_profile_data record;
    v_is_already_associated boolean;
BEGIN
    -- 1. Buscar el perfil del paciente por email.
    SELECT id, full_name, email, phone INTO v_profile_id, v_profile_data.full_name, v_profile_data.email, v_profile_data.phone
    FROM public.profiles
    WHERE email = p_patient_email
    LIMIT 1;

    -- Si el perfil no existe, devolver un error. El paciente debe registrarse primero.
    IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'patient_not_found',
            'message', 'No se encontró un usuario con ese correo. El paciente debe registrarse en la plataforma primero.'
        );
    END IF;

    -- 2. Verificar si ya existe una asociación (incluso si está inactiva).
    SELECT id, status = 'active' INTO v_patient_record_id, v_is_already_associated
    FROM public.patients
    WHERE therapist_id = p_therapist_id AND profile_id = v_profile_id;
    
    -- Si ya está asociado y activo, no hacer nada más que devolver la información.
    IF v_is_already_associated THEN
         RETURN jsonb_build_object(
            'success', true,
            'patient_record_id', v_patient_record_id,
            'profile_id', v_profile_id,
            'full_name', v_profile_data.full_name,
            'email', v_profile_data.email,
            'message', 'Este paciente ya está en tu lista.'
        );
    END IF;

    -- Si existe pero está inactivo, reactivarlo.
    IF v_patient_record_id IS NOT NULL THEN
        UPDATE public.patients
        SET status = 'active'
        WHERE id = v_patient_record_id;
    ELSE
        -- Si la asociación no existe, crearla.
        SELECT full_name, email, phone, rut INTO v_profile_data
        FROM public.profiles
        WHERE id = v_profile_id;

        INSERT INTO public.patients (id, therapist_id, profile_id, full_name, email, phone, rut, status)
        VALUES (gen_random_uuid(), p_therapist_id, v_profile_id, v_profile_data.full_name, v_profile_data.email, v_profile_data.phone, v_profile_data.rut, 'active')
        RETURNING id INTO v_patient_record_id;
    END IF;

    -- 3. Devolver el resultado exitoso.
    RETURN jsonb_build_object(
        'success', true,
        'patient_record_id', v_patient_record_id,
        'profile_id', v_profile_id,
        'full_name', v_profile_data.full_name,
        'email', v_profile_data.email,
        'message', 'Paciente asociado correctamente.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: fn_auto_assign_diagnosis_specialty(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_auto_assign_diagnosis_specialty() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.specialty_id IS NULL THEN
    NEW.specialty_id := fn_infer_specialty(NULL, NEW.diagnosis_name);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fn_infer_specialty(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_infer_specialty(p_diagnosis_code text DEFAULT NULL::text, p_diagnosis_name text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_specialty_id UUID;
BEGIN
  IF p_diagnosis_code IS NOT NULL AND p_diagnosis_code != '' THEN
    SELECT dsm.specialty_id INTO v_specialty_id
    FROM diagnosis_specialty_map dsm
    WHERE dsm.match_type IN ('cie10_prefix', 'cie10_exact')
      AND p_diagnosis_code ILIKE dsm.diagnosis_pattern || '%'
    ORDER BY dsm.priority DESC, LENGTH(dsm.diagnosis_pattern) DESC
    LIMIT 1;
    IF v_specialty_id IS NOT NULL THEN RETURN v_specialty_id; END IF;
  END IF;

  IF p_diagnosis_name IS NOT NULL AND p_diagnosis_name != '' THEN
    SELECT dsm.specialty_id INTO v_specialty_id
    FROM diagnosis_specialty_map dsm
    WHERE dsm.match_type = 'keyword'
      AND p_diagnosis_name ILIKE '%' || dsm.diagnosis_pattern || '%'
    ORDER BY dsm.priority DESC, LENGTH(dsm.diagnosis_pattern) DESC
    LIMIT 1;
  END IF;

  RETURN v_specialty_id;
END;
$$;


--
-- Name: generate_landing_page_url(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_landing_page_url() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_base text;
BEGIN
    -- Solo generar si no viene desde el frontend
    IF NEW.custom_url IS NULL OR NEW.custom_url = '' THEN
        
        -- 1) Obtener nombre del terapeuta
        SELECT full_name 
        INTO v_base
        FROM profiles
        WHERE id = NEW.therapist_id;

        -- Si el terapeuta no tiene nombre, usamos su UUID parcial
        IF v_base IS NULL OR v_base = '' THEN
            v_base := substring(NEW.therapist_id::text from 1 for 8);
        END IF;

        -- 2) Normalizar (minúsculas, sin tildes, sin caracteres raros)
        v_base := unaccent(lower(v_base));

        -- 3) Reemplazar espacios por guiones
        v_base := regexp_replace(v_base, '\s+', '-', 'g');

        -- 4) Quitar cualquier caracter no permitido
        v_base := regexp_replace(v_base, '[^a-z0-9\-]+', '', 'g');

        -- 5) Generar URL única usando tu función centralizada
        NEW.custom_url := generate_unique_slug(
            v_base,
            'therapist_landing_pages',
            'custom_url'
        );
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: generate_order_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(nextval('order_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;


--
-- Name: generate_public_slug(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_public_slug() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo generar slug si el perfil es público y no tiene slug
    IF NEW.is_public = true AND (NEW.public_slug IS NULL OR NEW.public_slug = '') THEN
        NEW.public_slug = generate_unique_slug(
            COALESCE(NEW.full_name, NEW.email), 
            'profiles', 
            'public_slug'
        );
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: generate_report_hash(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_report_hash() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.hash_integrity = encode(
        digest(
            COALESCE(NEW.editable_json::text, '') || 
            COALESCE(NEW.final_pdf_url, '') || 
            NEW.patient_id::text || 
            NEW.therapist_id::text,
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$;


--
-- Name: generate_slug(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_slug(input_text text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    DECLARE
      slug TEXT;
    BEGIN
      -- Normalize to lowercase
      slug := lower(input_text);
      -- Replace accented characters with non-accented equivalents
      slug := translate(slug, 'áéíóúñüäëïöüàèìòùâêîôûç', 'aeiounuaeiouaeiouaeiouc');
      -- Replace non-alphanumeric characters (except hyphens) with a hyphen
      slug := regexp_replace(slug, '[^a-z0-9\-]+', '-', 'g');
      -- Replace multiple hyphens with a single hyphen
      slug := regexp_replace(slug, '-+', '-', 'g');
      -- Remove leading and trailing hyphens
      slug := trim(BOTH '-' FROM slug);
      RETURN slug;
    END;
    $$;


--
-- Name: generate_unique_slug(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_slug(base_text text, table_name text, column_name text) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 1;
    sql_query text;
    exists_slug boolean;
BEGIN
    -- 1. Normalizar el texto base → slug inicial
    base_slug := regexp_replace(
                    lower(base_text),
                    '[^a-z0-9]+',
                    '-',
                    'g'
                 );

    base_slug := regexp_replace(base_slug, '-+$', '');
    base_slug := regexp_replace(base_slug, '^-+', '');

    final_slug := base_slug;

    -- 2. Loop para encontrar un slug disponible
    LOOP
        sql_query := format(
            'SELECT EXISTS(SELECT 1 FROM %I WHERE %I = $1)',
            table_name,
            column_name
        );

        EXECUTE sql_query INTO exists_slug USING final_slug;

        EXIT WHEN NOT exists_slug;

        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$_$;


--
-- Name: generate_unique_slug_for_blog(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_unique_slug_for_blog() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_slug TEXT;
  v_base_slug TEXT;
  v_counter INT := 1;
BEGIN
  v_base_slug := public.slugify(NEW.title);
  v_slug := v_base_slug;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = v_slug) THEN
      EXIT;
    END IF;
    v_slug := v_base_slug || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  NEW.slug := v_slug;
  RETURN NEW;
END;
$$;


--
-- Name: get_all_specialties(uuid, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_specialties(p_therapist_id uuid DEFAULT NULL::uuid, p_include_stats boolean DEFAULT true, p_only_available boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_specialties JSONB;
    v_therapist_specialties INTEGER[];
    v_total_therapists INTEGER;
BEGIN
    -- Si se proporciona un terapeuta, obtener sus especialidades actuales
    IF p_therapist_id IS NOT NULL THEN
        SELECT array_agg(specialty_id) INTO v_therapist_specialties
        FROM therapist_specialties
        WHERE therapist_id = p_therapist_id;
        
        v_therapist_specialties := COALESCE(v_therapist_specialties, ARRAY[]::INTEGER[]);
    END IF;
    
    -- Obtener total de terapeutas para estadísticas
    IF p_include_stats THEN
        SELECT COUNT(DISTINCT user_id) INTO v_total_therapists
        FROM therapist_details;
    END IF;
    
    -- Obtener todas las especialidades con información detallada
    WITH specialty_data AS (
        SELECT 
            s.id,
            s.name,
            s.description,
            s.created_at,
            -- Contar terapeutas que tienen esta especialidad
            COUNT(DISTINCT ts.therapist_id) AS therapist_count,
            -- Si un terapeuta específico la tiene
            CASE 
                WHEN p_therapist_id IS NOT NULL THEN
                    s.id = ANY(v_therapist_specialties)
                ELSE NULL
            END AS is_assigned,
            -- Estadísticas adicionales si se solicitan
            CASE WHEN p_include_stats THEN
                jsonb_build_object(
                    'total_therapists', COUNT(DISTINCT ts.therapist_id),
                    'active_therapists', COUNT(DISTINCT ts.therapist_id) FILTER (
                        WHERE EXISTS (
                            SELECT 1 FROM appointments a
                            WHERE a.therapist_id = ts.therapist_id
                            AND a.status IN ('scheduled', 'completed')
                            AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
                        )
                    ),
                    'popularity_percentage', CASE 
                        WHEN v_total_therapists > 0 THEN
                            ROUND((COUNT(DISTINCT ts.therapist_id)::NUMERIC / v_total_therapists) * 100, 1)
                        ELSE 0
                    END,
                    'cities_available', COUNT(DISTINCT td.city_id)
                )
            ELSE NULL
            END AS statistics,
            -- Top 3 ciudades donde más se ofrece
            CASE WHEN p_include_stats THEN
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'city', c.name,
                            'count', city_count
                        )
                    )
                    FROM (
                        SELECT 
                            ci.name,
                            COUNT(DISTINCT ts2.therapist_id) as city_count
                        FROM therapist_specialties ts2
                        JOIN therapist_details td2 ON ts2.therapist_id = td2.user_id
                        JOIN ubication_cities ci ON td2.city_id = ci.id
                        WHERE ts2.specialty_id = s.id
                        GROUP BY ci.id, ci.name
                        ORDER BY city_count DESC
                        LIMIT 3
                    ) c
                )
            ELSE NULL
            END AS top_cities
        FROM specialties s
        LEFT JOIN therapist_specialties ts ON s.id = ts.specialty_id
        LEFT JOIN therapist_details td ON ts.therapist_id = td.user_id
        WHERE 
            -- Si only_available es true y hay un therapist_id, mostrar solo las NO asignadas
            (NOT p_only_available OR p_therapist_id IS NULL OR s.id != ALL(v_therapist_specialties))
        GROUP BY s.id, s.name, s.description, s.created_at
    ),
    categorized_specialties AS (
        SELECT 
            *,
            -- Categorizar por popularidad
            CASE 
                WHEN therapist_count = 0 THEN 'new'
                WHEN therapist_count <= 5 THEN 'rare'
                WHEN therapist_count <= 20 THEN 'common'
                ELSE 'popular'
            END AS popularity_category,
            -- Categorizar por área (basado en keywords en el nombre)
            CASE 
                WHEN LOWER(name) LIKE '%lenguaje%' THEN 'lenguaje'
                WHEN LOWER(name) LIKE '%habla%' THEN 'habla'
                WHEN LOWER(name) LIKE '%voz%' THEN 'voz'
                WHEN LOWER(name) LIKE '%audición%' OR LOWER(name) LIKE '%auditiv%' THEN 'audicion'
                WHEN LOWER(name) LIKE '%deglución%' OR LOWER(name) LIKE '%alimenta%' THEN 'deglucion'
                WHEN LOWER(name) LIKE '%neuro%' THEN 'neurologia'
                WHEN LOWER(name) LIKE '%niño%' OR LOWER(name) LIKE '%infantil%' OR LOWER(name) LIKE '%pediátric%' THEN 'pediatria'
                WHEN LOWER(name) LIKE '%adult%' OR LOWER(name) LIKE '%geriátric%' THEN 'adultos'
                ELSE 'otros'
            END AS area_category
        FROM specialty_data
    )
    SELECT jsonb_build_object(
        'specialties', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', name,
                'description', description,
                'is_assigned', is_assigned,
                'therapist_count', therapist_count,
                'popularity_category', popularity_category,
                'area_category', area_category,
                'statistics', statistics,
                'top_cities', top_cities
            )
            ORDER BY 
                -- Ordenar por: primero las asignadas (si hay therapist_id), 
                -- luego por popularidad, luego alfabético
                CASE WHEN is_assigned THEN 0 ELSE 1 END,
                therapist_count DESC,
                name
        ),
        'summary', jsonb_build_object(
            'total_specialties', COUNT(*),
            'assigned_count', CASE 
                WHEN p_therapist_id IS NOT NULL THEN 
                    COUNT(*) FILTER (WHERE is_assigned)
                ELSE NULL
            END,
            'available_count', CASE 
                WHEN p_therapist_id IS NOT NULL THEN 
                    COUNT(*) FILTER (WHERE NOT is_assigned OR is_assigned IS NULL)
                ELSE NULL
            END,
            'by_area', jsonb_object_agg(
                area_category,
                area_count
            ),
            'by_popularity', jsonb_object_agg(
                popularity_category,
                pop_count
            )
        )
    ) INTO v_specialties
    FROM (
        SELECT 
            cs.*,
            COUNT(*) OVER (PARTITION BY area_category) as area_count,
            COUNT(*) OVER (PARTITION BY popularity_category) as pop_count
        FROM categorized_specialties cs
    ) cs_with_counts;
    
    -- Agregar información del terapeuta si se proporcionó
    IF p_therapist_id IS NOT NULL THEN
        v_specialties := v_specialties || jsonb_build_object(
            'therapist_info', jsonb_build_object(
                'therapist_id', p_therapist_id,
                'current_specialties', v_therapist_specialties,
                'can_add_more', array_length(v_therapist_specialties, 1) < 10
            )
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', v_specialties,
        'filters_applied', jsonb_build_object(
            'therapist_id', p_therapist_id,
            'include_stats', p_include_stats,
            'only_available', p_only_available
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_available_slots(uuid, uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_available_slots(p_therapist_id uuid, p_clinic_id uuid, p_date date) RETURNS TABLE(start_time time without time zone, end_time time without time zone, is_available boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT 
      generate_series(
        '06:00:00'::TIME,
        '22:00:00'::TIME,
        '30 minutes'::INTERVAL
      )::TIME AS slot_time
  ),
  appointments_on_date AS (
    SELECT start_time, end_time 
    FROM appointments 
    WHERE therapist_id = p_therapist_id 
      AND clinic_id = p_clinic_id 
      AND date = p_date
      AND status != 'canceled'
  ),
  blocked_on_date AS (
    SELECT 
      start_time::TIME AS start_time,
      end_time::TIME AS end_time 
    FROM blocked_times 
    WHERE therapist_id = p_therapist_id 
      AND clinic_id = p_clinic_id 
      AND DATE(start_time) = p_date
  )
  SELECT 
    ts.slot_time AS start_time,
    (ts.slot_time + INTERVAL '30 minutes')::TIME AS end_time,
    NOT EXISTS (
      SELECT 1 FROM appointments_on_date a
      WHERE ts.slot_time >= a.start_time 
        AND ts.slot_time < a.end_time
    ) AND NOT EXISTS (
      SELECT 1 FROM blocked_on_date b
      WHERE ts.slot_time >= b.start_time 
        AND ts.slot_time < b.end_time
    ) AS is_available
  FROM time_slots ts
  ORDER BY ts.slot_time;
END;
$$;


--
-- Name: get_available_slots_for_patient(uuid, date, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_available_slots_for_patient(p_therapist_id uuid, p_date date, p_consultation_type text) RETURNS TABLE(time_slot time without time zone, is_available boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH base_slots AS (
    -- Generar slots desde therapist_availabilities
    SELECT 
      generate_series(
        start_time::time, 
        end_time::time - INTERVAL '30 minutes', 
        INTERVAL '30 minutes'
      )::time AS slot
    FROM therapist_availabilities
    WHERE therapist_id = p_therapist_id
      AND day_of_week = EXTRACT(DOW FROM p_date)
      AND consultation_type = p_consultation_type
      AND is_active = TRUE
  ),
  blocked AS (
    -- Slots ocupados por citas
    SELECT start_time AS slot FROM appointments
    WHERE therapist_id = p_therapist_id
      AND date = p_date
      AND status IN ('scheduled', 'confirmed')
    UNION
    -- Slots bloqueados manualmente
    SELECT 
      generate_series(
        start_time::time,
        end_time::time - INTERVAL '30 minutes',
        INTERVAL '30 minutes'
      )::time
    FROM blocked_times
    WHERE therapist_id = p_therapist_id
      AND p_date BETWEEN start_time::date AND end_time::date
  )
  SELECT 
    bs.slot,
    (b.slot IS NULL) AS is_available
  FROM base_slots bs
  LEFT JOIN blocked b ON bs.slot = b.slot
  ORDER BY bs.slot;
END;
$$;


--
-- Name: get_available_time_slots(uuid, uuid, timestamp with time zone, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_available_time_slots(p_therapist_id uuid, p_clinic_id uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_slot_minutes integer) RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
DECLARE
BEGIN
  RETURN QUERY
  WITH base_avail AS (
    -- Disponibilidad por día dentro del rango pedido
    SELECT
      d::date AS work_date,
      ta.start_time,
      ta.end_time,
      ta.clinic_id
    FROM generate_series(
           date_trunc('day', p_from)::date,
           date_trunc('day', p_to)::date,
           interval '1 day'
         ) d
    JOIN therapist_availabilities ta
      ON ta.therapist_id = p_therapist_id
     AND (ta.is_active IS NULL OR ta.is_active = true)
     AND ta.day_of_week = EXTRACT(ISODOW FROM d)  -- 1=lunes,..7=domingo
     AND (p_clinic_id IS NULL OR ta.clinic_id = p_clinic_id)
  ),
  slots AS (
    -- Generamos cada slot dentro de esa franja horaria
    SELECT
      make_timestamptz(
        EXTRACT(YEAR  FROM work_date)::int,
        EXTRACT(MONTH FROM work_date)::int,
        EXTRACT(DAY   FROM work_date)::int,
        EXTRACT(HOUR   FROM start_time)::int,
        EXTRACT(MINUTE FROM start_time)::int,
        0,
        EXTRACT(TIMEZONE FROM p_from)::int
      )
      + (n * (p_slot_minutes || ' minutes')::interval) AS slot_start,
      make_timestamptz(
        EXTRACT(YEAR  FROM work_date)::int,
        EXTRACT(MONTH FROM work_date)::int,
        EXTRACT(DAY   FROM work_date)::int,
        EXTRACT(HOUR   FROM start_time)::int,
        EXTRACT(MINUTE FROM start_time)::int,
        0,
        EXTRACT(TIMEZONE FROM p_from)::int
      )
      + ((n + 1) * (p_slot_minutes || ' minutes')::interval) AS slot_end
    FROM base_avail ba
    CROSS JOIN LATERAL generate_series(
      0,
      floor(
        (
          (ba.end_time::time - ba.start_time::time)
          / (p_slot_minutes || ' minutes')::interval
        )::numeric
      )::int - 1
    ) AS n
  ),
  busy_appointments AS (
    SELECT
      make_timestamptz(
        EXTRACT(YEAR  FROM a.date)::int,
        EXTRACT(MONTH FROM a.date)::int,
        EXTRACT(DAY   FROM a.date)::int,
        EXTRACT(HOUR   FROM a.start_time)::int,
        EXTRACT(MINUTE FROM a.start_time)::int,
        0,
        EXTRACT(TIMEZONE FROM p_from)::int
      ) AS appt_start,
      make_timestamptz(
        EXTRACT(YEAR  FROM a.date)::int,
        EXTRACT(MONTH FROM a.date)::int,
        EXTRACT(DAY   FROM a.date)::int,
        EXTRACT(HOUR   FROM a.end_time)::int,
        EXTRACT(MINUTE FROM a.end_time)::int,
        0,
        EXTRACT(TIMEZONE FROM p_from)::int
      ) AS appt_end
    FROM appointments a
    WHERE a.therapist_id = p_therapist_id
      AND (p_clinic_id IS NULL OR a.clinic_id = p_clinic_id)
      AND a.status IN ('scheduled','confirmed')
      AND a.date BETWEEN p_from::date AND p_to::date
  ),
  blocked AS (
    SELECT
      cb.start_datetime AS block_start,
      cb.end_datetime   AS block_end
    FROM calendar_blocks cb
    WHERE cb.therapist_id = p_therapist_id
      AND (p_clinic_id IS NULL OR cb.clinic_id = p_clinic_id)
      AND cb.start_datetime <= p_to
      AND cb.end_datetime   >= p_from
  )
  SELECT
    s.slot_start,
    s.slot_end
  FROM slots s
  WHERE
    -- dentro del rango solicitado
    s.slot_start >= p_from
    AND s.slot_end   <= p_to

    -- no solapar con citas
    AND NOT EXISTS (
      SELECT 1
      FROM busy_appointments b
      WHERE s.slot_start < b.appt_end
        AND s.slot_end   > b.appt_start
    )

    -- no solapar con bloqueos manuales
    AND NOT EXISTS (
      SELECT 1
      FROM blocked bl
      WHERE s.slot_start < bl.block_end
        AND s.slot_end   > bl.block_start
    )
  ORDER BY s.slot_start;
END;
$$;


--
-- Name: get_batch_next_available_slots(uuid[], date, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_batch_next_available_slots(p_therapist_ids uuid[], p_start_date date DEFAULT CURRENT_DATE, p_max_days_per_therapist integer DEFAULT 14, p_max_slots_per_day integer DEFAULT 3, p_max_days_to_show integer DEFAULT 2) RETURNS TABLE(therapist_id uuid, availability_date date, time_slots jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_end_date DATE;
  v_slot_duration INTEGER := 30;
BEGIN
  v_end_date := p_start_date + p_max_days_per_therapist;

  RETURN QUERY
  WITH
  date_series AS (
    SELECT generate_series(p_start_date, v_end_date - 1, '1 day'::interval)::date AS the_date
  ),

  -- Expandir slots usando TIMESTAMP en vez de TIME
  therapist_slots_expanded AS (
    SELECT
      ta.therapist_id AS t_id,
      ds.the_date,
      gs.slot_time::time AS slot_time,
      ta.clinic_id AS avail_clinic_id
    FROM date_series ds
    CROSS JOIN LATERAL (
      SELECT ta2.*
      FROM therapist_availabilities ta2
      WHERE ta2.therapist_id = ANY(p_therapist_ids)
        AND ta2.is_active = true
        AND ta2.day_of_week = EXTRACT(DOW FROM ds.the_date)::integer
    ) ta
    CROSS JOIN LATERAL (
      -- FIX: Castear TIME a TIMESTAMP para que generate_series funcione
      SELECT gs2::time AS slot_time
      FROM generate_series(
        ('2000-01-01'::date + ta.start_time)::timestamp,
        ('2000-01-01'::date + ta.end_time - (v_slot_duration || ' minutes')::interval)::timestamp,
        (v_slot_duration || ' minutes')::interval
      ) gs2
    ) gs
  ),

  slots_not_blocked AS (
    SELECT tse.*
    FROM therapist_slots_expanded tse
    WHERE NOT EXISTS (
      SELECT 1
      FROM blocked_times bt
      WHERE bt.therapist_id = tse.t_id
        AND (bt.clinic_id IS NULL OR bt.clinic_id = tse.avail_clinic_id)
        AND tse.the_date BETWEEN (bt.start_time AT TIME ZONE 'America/Santiago')::date
                               AND (bt.end_time AT TIME ZONE 'America/Santiago')::date
        AND tse.slot_time >= (bt.start_time AT TIME ZONE 'America/Santiago')::time
        AND tse.slot_time < (bt.end_time AT TIME ZONE 'America/Santiago')::time
    )
  ),

  slots_available AS (
    SELECT snb.*
    FROM slots_not_blocked snb
    WHERE NOT EXISTS (
      SELECT 1
      FROM appointments apt
      WHERE apt.therapist_id = snb.t_id
        AND apt.date = snb.the_date
        AND apt.status IN ('scheduled', 'confirmed')
        AND snb.slot_time >= apt.start_time::time
        AND snb.slot_time < apt.end_time::time
    )
    AND (
      snb.the_date > CURRENT_DATE
      OR (snb.the_date = CURRENT_DATE AND snb.slot_time > CURRENT_TIME)
    )
  ),

  day_slots AS (
    SELECT
      sa.t_id,
      sa.the_date,
      jsonb_agg(
        jsonb_build_object(
          'time', to_char(sa.slot_time, 'HH24:MI'),
          'available', true
        )
        ORDER BY sa.slot_time
      ) AS all_slots
    FROM slots_available sa
    GROUP BY sa.t_id, sa.the_date
  ),

  day_slots_limited AS (
    SELECT
      ds2.t_id,
      ds2.the_date,
      (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(ds2.all_slots) AS elem
          LIMIT p_max_slots_per_day
        ) sub
      ) AS limited_slots
    FROM day_slots ds2
  ),

  ranked_days AS (
    SELECT
      dsl.t_id,
      dsl.the_date,
      dsl.limited_slots,
      ROW_NUMBER() OVER (PARTITION BY dsl.t_id ORDER BY dsl.the_date) AS day_rank
    FROM day_slots_limited dsl
  )

  SELECT
    rd.t_id AS therapist_id,
    rd.the_date AS availability_date,
    rd.limited_slots AS time_slots
  FROM ranked_days rd
  WHERE rd.day_rank <= p_max_days_to_show
  ORDER BY rd.t_id, rd.the_date;

END;
$$;


--
-- Name: get_clinical_calendar_events(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_clinical_calendar_events(p_therapist_id uuid, p_start_date date, p_end_date date) RETURNS TABLE(id uuid, patient_id uuid, patient_name text, therapist_id uuid, entry_type text, entry_date timestamp with time zone, summary text, appointment_id uuid, is_external boolean, event_title text, event_color text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.patient_id,
    pat_profile.full_name as patient_name,
    ch.therapist_id,
    ch.entry_type,
    ch.entry_date,
    ch.summary,
    ch.appointment_id,
    (ch.therapist_id != p_therapist_id) as is_external,
    -- Event title for calendar
    CASE 
      WHEN ch.therapist_id = p_therapist_id THEN 
        COALESCE(pat_profile.full_name, 'Paciente') || ' - ' || 
        COALESCE(cet.label, ch.entry_type)
      ELSE 
        'Sesión externa: ' || COALESCE(ext_profile.full_name, 'Otro profesional')
    END as event_title,
    -- Color coding
    CASE 
      WHEN ch.therapist_id != p_therapist_id THEN '#9CA3AF' -- Gray for external
      WHEN ch.entry_type = 'sesion_terapia' THEN '#10B981' -- Green
      WHEN ch.entry_type = 'evaluacion_inicial' THEN '#3B82F6' -- Blue
      WHEN ch.entry_type = 'plan_tratamiento' THEN '#8B5CF6' -- Purple
      ELSE '#6B7280' -- Default gray
    END as event_color
  FROM clinical_history ch
  LEFT JOIN patients pat ON ch.patient_id = pat.id
  LEFT JOIN profiles pat_profile ON pat.profile_id = pat_profile.id
  LEFT JOIN profiles ext_profile ON ch.therapist_id = ext_profile.id
  LEFT JOIN clinical_entry_types cet ON ch.entry_type = cet.code
  WHERE ch.patient_id IN (
    SELECT id FROM patients WHERE therapist_id = p_therapist_id
  )
  AND ch.entry_date::date BETWEEN p_start_date AND p_end_date
  ORDER BY ch.entry_date;
END;
$$;


--
-- Name: get_complete_therapist_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_complete_therapist_profile(user_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', row_to_json(p.*),
        'details', row_to_json(td.*),
        'specialties', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'specialty_id', ts.specialty_id,
                    'specialty_name', s.name,
                    'is_primary', ts.is_primary
                )
            )
            FROM therapist_specialties ts
            JOIN specialties s ON ts.specialty_id = s.id
            WHERE ts.therapist_id = user_uuid
            ), '[]'::jsonb
        ),
        'insurances', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'insurance_id', ti.insurance_provider_id,
                    'insurance_name', ip.name,
                    'is_active', ti.is_active
                )
            )
            FROM therapist_insurances ti
            JOIN insurance_providers ip ON ti.insurance_provider_id = ip.id
            WHERE ti.therapist_id = user_uuid
            ), '[]'::jsonb
        ),
        'services', COALESCE(
            (SELECT jsonb_agg(row_to_json(ts.*))
            FROM therapist_services ts
            WHERE ts.therapist_id = user_uuid
            AND ts.is_active = true
            ), '[]'::jsonb
        ),
        'availabilities', COALESCE(
            (SELECT jsonb_agg(row_to_json(ta.*))
            FROM therapist_availabilities ta
            WHERE ta.therapist_id = user_uuid
            AND ta.is_active = true
            ), '[]'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN therapist_details td ON td.user_id = p.id
    WHERE p.id = user_uuid
    AND p.role = 'terapeuta';
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;


--
-- Name: get_item_review_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_item_review_summary(p_item_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_reviews', COUNT(*),
    'average_rating', ROUND(AVG(rating)::numeric, 2),
    'verified_count', COUNT(*) FILTER (WHERE is_verified_purchase),
    'would_recommend_percent', ROUND(
      (COUNT(*) FILTER (WHERE would_recommend)::numeric / NULLIF(COUNT(*), 0) * 100), 0
    ),
    'rating_distribution', jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ),
    'average_quality', ROUND(AVG(rating_quality)::numeric, 2),
    'average_value', ROUND(AVG(rating_value)::numeric, 2),
    'average_ease_of_use', ROUND(AVG(rating_ease_of_use)::numeric, 2),
    'average_effectiveness', ROUND(AVG(rating_effectiveness)::numeric, 2),
    'top_diagnoses', (
      SELECT jsonb_agg(DISTINCT d)
      FROM marketplace_reviews r, unnest(r.diagnosis_used_for) d
      WHERE r.marketplace_item_id = p_item_id
        AND r.is_visible = true
        AND r.status = 'approved'
      LIMIT 5
    )
  ) INTO v_summary
  FROM marketplace_reviews
  WHERE marketplace_item_id = p_item_id
    AND is_visible = true
    AND status = 'approved';
  
  RETURN v_summary;
END;
$$;


--
-- Name: get_marketplace_item_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_marketplace_item_stats(p_item_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_sales', COALESCE(total_sales, 0),
    'total_reviews', COALESCE(total_reviews, 0),
    'average_rating', COALESCE(rating, 0),
    'total_favorites', (SELECT COUNT(*) FROM marketplace_favorites WHERE marketplace_item_id = p_item_id),
    'total_views', COALESCE(view_count, 0),
    'rating_distribution', (
      SELECT jsonb_object_agg(r.rating, r.count)
      FROM (
        SELECT rating, COUNT(*) as count
        FROM marketplace_reviews
        WHERE marketplace_item_id = p_item_id AND is_visible = true
        GROUP BY rating
      ) r
    )
  ) INTO v_stats
  FROM marketplace_items
  WHERE id = p_item_id;
  
  RETURN v_stats;
END;
$$;


--
-- Name: get_paginated_patients(uuid, integer, integer, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_paginated_patients(p_therapist_id uuid, p_page integer DEFAULT 0, p_page_size integer DEFAULT 20, p_search_term text DEFAULT NULL::text, p_status text DEFAULT 'active'::text, p_sort_by text DEFAULT 'name_asc'::text) RETURNS TABLE(patient_id uuid, full_name text, email text, phone text, last_visit date, next_visit date, patient_status text, total_results bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_offset integer;
BEGIN
    v_offset := p_page * p_page_size;

    RETURN QUERY
    WITH patient_base AS (
        SELECT
            pt.id AS patient_id,
            pr.full_name,
            pr.email,
            pr.phone,
            pt.status,
            pt.created_at
        FROM public.patients pt
        JOIN public.profiles pr ON pr.id = pt.profile_id
        WHERE pt.therapist_id = p_therapist_id
        AND (
            (p_status = 'active' AND pt.status = 'active')
            OR
            (p_status = 'archived' AND pt.status = 'archived')
        )
        AND (
            p_search_term IS NULL
            OR pr.full_name ILIKE '%' || p_search_term || '%'
            OR pr.email ILIKE '%' || p_search_term || '%'
            OR pr.phone ILIKE '%' || p_search_term || '%'
        )
    ),
    appointment_stats AS (
        SELECT
            a.patient_id,
            MAX(CASE WHEN a.status = 'completed'
                     AND a.date < CURRENT_DATE THEN a.date END) AS last_visit,
            MIN(CASE WHEN a.status IN ('scheduled','confirmed')
                     AND a.date >= CURRENT_DATE THEN a.date END) AS next_visit
        FROM public.appointments a
        WHERE a.therapist_id = p_therapist_id
        GROUP BY a.patient_id
    )
    SELECT
        pb.patient_id,
        pb.full_name,
        pb.email,
        pb.phone,
        aps.last_visit,
        aps.next_visit,
        pb.status AS patient_status,
        (SELECT COUNT(*) FROM patient_base) AS total_results
    FROM patient_base pb
    LEFT JOIN appointment_stats aps ON aps.patient_id = pb.patient_id
    ORDER BY
        CASE WHEN p_sort_by = 'name_asc' THEN pb.full_name END ASC,
        CASE WHEN p_sort_by = 'name_desc' THEN pb.full_name END DESC,
        CASE WHEN p_sort_by = 'created_at_desc' THEN pb.created_at END DESC,
        CASE WHEN p_sort_by = 'last_visit_desc' THEN aps.last_visit END DESC NULLS LAST
    LIMIT p_page_size
    OFFSET v_offset;

END;
$$;


--
-- Name: get_patient_appointments(uuid, boolean, text, date, date, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_appointments(p_patient_id uuid, p_include_past boolean DEFAULT false, p_status text DEFAULT NULL::text, p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_resolved_patient_id UUID;
    v_appointments JSONB;
    v_total_count INTEGER;
    v_next_appointment JSONB;
    v_history_stats JSONB;
BEGIN
    -- =============================================
    -- RESOLVER patient_id desde profiles.id
    -- El frontend envía profiles.id (auth.uid()),
    -- pero appointments.patient_id usa patients.id
    -- =============================================
    SELECT id INTO v_resolved_patient_id
    FROM patients
    WHERE profile_id = p_patient_id
    LIMIT 1;

    -- Si no se encuentra, intentar directo (por si ya viene patients.id)
    IF v_resolved_patient_id IS NULL THEN
        IF EXISTS (SELECT 1 FROM patients WHERE id = p_patient_id) THEN
            v_resolved_patient_id := p_patient_id;
        ELSE
            RETURN jsonb_build_object(
                'success', true,
                'patient_id', p_patient_id,
                'appointments', '[]'::JSONB,
                'next_appointment', NULL,
                'statistics', jsonb_build_object(
                    'total_appointments', 0,
                    'completed', 0,
                    'cancelled', 0
                )
            );
        END IF;
    END IF;

    -- Configurar fechas por defecto
    p_date_from := COALESCE(p_date_from, 
        CASE WHEN p_include_past THEN CURRENT_DATE - INTERVAL '1 year' ELSE CURRENT_DATE END
    );
    p_date_to := COALESCE(p_date_to, CURRENT_DATE + INTERVAL '6 months');

    -- Obtener citas con columnas reales
    WITH appointment_data AS (
        SELECT 
            a.id,
            a.date AS appointment_date,
            a.start_time AS appointment_time,
            a.end_time,
            a.duration_minutes,
            a.status,
            a.location_type,
            a.meeting_url,
            a.notes,
            a.cancellation_reason,
            a.clinic_id,
            a.service_id,
            a.created_at,
            -- Info del terapeuta
            jsonb_build_object(
                'id', t.id,
                'name', t.full_name,
                'email', t.email,
                'details', jsonb_build_object(
                    'about_me', LEFT(COALESCE(td.about_me, ''), 200),
                    'avatar_url', tb.avatar_url
                )
            ) AS therapist,
            -- Info de la clínica (puede ser NULL)
            CASE WHEN c.id IS NOT NULL THEN
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'address', c.address,
                    'modalidad', c.modalidad
                )
            ELSE NULL END AS clinic,
            -- Info del servicio (puede ser NULL)
            CASE WHEN ts.id IS NOT NULL THEN
                jsonb_build_object(
                    'name', ts.service_name,
                    'duration_minutes', ts.duration_minutes
                )
            ELSE NULL END AS service,
            -- Flags
            CASE 
                WHEN a.date < CURRENT_DATE THEN 'past'
                WHEN a.date = CURRENT_DATE THEN 'today'
                ELSE 'future'
            END AS time_category,
            CASE 
                WHEN a.status IN ('scheduled', 'confirmed') AND a.date >= CURRENT_DATE THEN true
                ELSE false
            END AS can_modify
        FROM appointments a
        JOIN profiles t ON a.therapist_id = t.id
        LEFT JOIN therapist_details td ON t.id = td.user_id
        LEFT JOIN therapist_branding tb ON t.id = tb.user_id
        LEFT JOIN clinics c ON a.clinic_id = c.id
        LEFT JOIN therapist_services ts ON a.service_id = ts.id
        WHERE a.patient_id = v_resolved_patient_id
            AND a.date >= p_date_from
            AND a.date <= p_date_to
            AND (p_status IS NULL OR a.status = p_status)
            AND (p_include_past OR a.date >= CURRENT_DATE)
    ),
    paginated_data AS (
        SELECT * FROM appointment_data
        ORDER BY 
            CASE WHEN time_category = 'future' THEN 0 WHEN time_category = 'today' THEN 0 ELSE 1 END,
            appointment_date,
            appointment_time
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'date', appointment_date,
                'time', appointment_time::TEXT,
                'end_time', end_time::TEXT,
                'duration_minutes', duration_minutes,
                'status', status,
                'location_type', location_type,
                'meeting_url', meeting_url,
                'therapist', therapist,
                'clinic', clinic,
                'service', service,
                'notes', notes,
                'cancellation_reason', cancellation_reason,
                'time_category', time_category,
                'can_modify', can_modify,
                'created_at', created_at
            )
        )
    INTO v_appointments
    FROM paginated_data;

    -- Total count
    SELECT COUNT(*) INTO v_total_count
    FROM appointments a
    WHERE a.patient_id = v_resolved_patient_id
        AND a.date >= p_date_from
        AND a.date <= p_date_to
        AND (p_status IS NULL OR a.status = p_status)
        AND (p_include_past OR a.date >= CURRENT_DATE);

    -- Próxima cita
    SELECT jsonb_build_object(
        'id', a.id,
        'date', a.date,
        'time', a.start_time::TEXT,
        'therapist_name', t.full_name,
        'location_type', a.location_type,
        'days_until', (a.date - CURRENT_DATE)
    ) INTO v_next_appointment
    FROM appointments a
    JOIN profiles t ON a.therapist_id = t.id
    WHERE a.patient_id = v_resolved_patient_id
        AND a.status IN ('scheduled', 'confirmed')
        AND a.date >= CURRENT_DATE
    ORDER BY a.date, a.start_time
    LIMIT 1;

    -- Stats
    SELECT jsonb_build_object(
        'total_appointments', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'scheduled', COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed'))
    ) INTO v_history_stats
    FROM appointments
    WHERE patient_id = v_resolved_patient_id;

    -- Retornar
    RETURN jsonb_build_object(
        'success', true,
        'patient_id', v_resolved_patient_id,
        'pagination', jsonb_build_object(
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset
        ),
        'next_appointment', v_next_appointment,
        'statistics', v_history_stats,
        'appointments', COALESCE(v_appointments, '[]'::JSONB)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_patient_appointments(uuid, date, date, text, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_appointments(p_patient_id uuid, p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_status text DEFAULT NULL::text, p_include_past boolean DEFAULT true, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointments JSONB;
    v_total_count INTEGER;
    v_next_appointment JSONB;
    v_history_stats JSONB;
BEGIN
    -- Configurar fechas por defecto
    p_date_from := COALESCE(p_date_from, 
        CASE WHEN p_include_past THEN CURRENT_DATE - INTERVAL '1 year' ELSE CURRENT_DATE END
    );
    p_date_to := COALESCE(p_date_to, CURRENT_DATE + INTERVAL '6 months');
    
    -- Obtener las citas del paciente
    WITH appointment_data AS (
        SELECT 
            a.id,
            a.appointment_date,
            a.appointment_time,
            a.duration,
            a.status,
            a.modalidad,
            a.notes,
            a.cancellation_reason,
            a.created_at,
            -- Info del terapeuta
            jsonb_build_object(
                'id', t.id,
                'name', t.full_name,
                'email', t.email,
                'details', jsonb_build_object(
                    'registration_supersalud', td.registration_supersalud,
                    'about_me', LEFT(td.about_me, 200),
                    'avatar_url', td.avatar_url
                )
            ) AS therapist,
            -- Info de la clínica
            jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'address', c.address,
                'phone', c.phone,
                'modalidad', c.modalidad,
                'city', ci.name
            ) AS clinic,
            -- Especialidades del terapeuta
            (
                SELECT jsonb_agg(s.name)
                FROM therapist_specialties ts
                JOIN specialties s ON ts.specialty_id = s.id
                WHERE ts.therapist_id = a.therapist_id
            ) AS therapist_specialties,
            -- Flags útiles
            CASE 
                WHEN a.appointment_date < CURRENT_DATE THEN 'past'
                WHEN a.appointment_date = CURRENT_DATE THEN 'today'
                ELSE 'future'
            END AS time_category,
            -- Si puede dejar review (cita completada y sin review)
            CASE 
                WHEN a.status = 'completed' AND NOT EXISTS (
                    SELECT 1 FROM reviews r 
                    WHERE r.appointment_id = a.id AND r.patient_id = p_patient_id
                ) THEN true
                ELSE false
            END AS can_review,
            -- Si puede cancelar/reprogramar
            CASE 
                WHEN a.status = 'scheduled' AND 
                     (a.appointment_date + a.appointment_time) > NOW() THEN true
                ELSE false
            END AS can_modify
        FROM appointments a
        JOIN profiles t ON a.therapist_id = t.id
        LEFT JOIN therapist_details td ON t.id = td.user_id
        JOIN clinics c ON a.clinic_id = c.id
        LEFT JOIN ubication_cities ci ON c.city_id = ci.id
        WHERE a.patient_id = p_patient_id
            AND a.appointment_date >= p_date_from
            AND a.appointment_date <= p_date_to
            AND (p_status IS NULL OR a.status = p_status)
            AND (p_include_past OR a.appointment_date >= CURRENT_DATE)
    ),
    paginated_data AS (
        SELECT * FROM appointment_data
        ORDER BY 
            CASE WHEN time_category = 'future' THEN 0 ELSE 1 END,
            appointment_date,
            appointment_time
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'date', appointment_date,
                'time', appointment_time::TEXT,
                'duration', duration,
                'status', status,
                'modalidad', modalidad,
                'therapist', therapist,
                'clinic', clinic,
                'therapist_specialties', COALESCE(therapist_specialties, '[]'::JSONB),
                'notes', notes,
                'cancellation_reason', cancellation_reason,
                'time_category', time_category,
                'can_review', can_review,
                'can_modify', can_modify,
                'created_at', created_at
            )
        )
    INTO v_appointments
    FROM paginated_data;
    
    -- Obtener próxima cita
    SELECT jsonb_build_object(
        'id', a.id,
        'date', a.appointment_date,
        'time', a.appointment_time::TEXT,
        'therapist_name', t.full_name,
        'clinic_name', c.name,
        'modalidad', a.modalidad,
        'days_until', (a.appointment_date - CURRENT_DATE)
    ) INTO v_next_appointment
    FROM appointments a
    JOIN profiles t ON a.therapist_id = t.id
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.patient_id = p_patient_id
        AND a.status = 'scheduled'
        AND a.appointment_date >= CURRENT_DATE
    ORDER BY a.appointment_date, a.appointment_time
    LIMIT 1;
    
    -- Contar total
    SELECT COUNT(*) INTO v_total_count
    FROM appointment_data;
    
    -- Estadísticas del historial
    WITH history_stats AS (
        SELECT 
            COUNT(*) AS total_appointments,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed,
            COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
            COUNT(*) FILTER (WHERE status = 'no-show') AS no_shows,
            COUNT(DISTINCT therapist_id) AS unique_therapists,
            COUNT(*) FILTER (WHERE can_review) AS pending_reviews
        FROM appointment_data
    )
    SELECT jsonb_build_object(
        'total_appointments', total_appointments,
        'completed', completed,
        'cancelled', cancelled,
        'no_shows', no_shows,
        'attendance_rate', 
            CASE 
                WHEN (completed + no_shows) > 0 THEN 
                    ROUND((completed::NUMERIC / (completed + no_shows)) * 100, 1)
                ELSE 0
            END,
        'unique_therapists', unique_therapists,
        'pending_reviews', pending_reviews
    ) INTO v_history_stats
    FROM history_stats;
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'patient_id', p_patient_id,
        'filters', jsonb_build_object(
            'date_from', p_date_from,
            'date_to', p_date_to,
            'status', p_status,
            'include_past', p_include_past
        ),
        'pagination', jsonb_build_object(
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'has_more', v_total_count > (p_offset + p_limit)
        ),
        'next_appointment', v_next_appointment,
        'statistics', v_history_stats,
        'appointments', COALESCE(v_appointments, '[]'::JSONB)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_patient_clinical_timeline(uuid, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_clinical_timeline(p_patient_id uuid, p_include_external boolean DEFAULT true, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, patient_id uuid, therapist_id uuid, therapist_name text, therapist_title text, therapist_avatar text, entry_type text, entry_date timestamp with time zone, summary text, session_notes text, appointment_id uuid, assigned_plan_id uuid, is_external boolean, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.patient_id,
    ch.therapist_id,
    p.full_name as therapist_name,
    td.professional_title as therapist_title,
    tb.avatar_url as therapist_avatar, -- Corrected: Fetch from therapist_branding
    ch.entry_type,
    ch.entry_date,
    -- For external entries, only show summary, hide detailed notes
    CASE 
      WHEN ch.therapist_id = auth.uid() THEN ch.summary
      ELSE COALESCE(ch.summary, 'Sesión con otro profesional')
    END as summary,
    -- Hide session_notes for external entries
    CASE 
      WHEN ch.therapist_id = auth.uid() THEN ch.session_notes
      ELSE NULL
    END as session_notes,
    ch.appointment_id,
    ch.assigned_plan_id,
    (ch.therapist_id != auth.uid()) as is_external,
    ch.created_at
  FROM clinical_history ch
  LEFT JOIN profiles p ON ch.therapist_id = p.id
  LEFT JOIN therapist_details td ON ch.therapist_id = td.user_id
  LEFT JOIN therapist_branding tb ON ch.therapist_id = tb.therapist_id -- Added join
  WHERE ch.patient_id = p_patient_id
    AND (p_include_external = true OR ch.therapist_id = auth.uid())
  ORDER BY ch.entry_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


--
-- Name: get_patient_external_sessions_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_external_sessions_count(p_patient_id uuid) RETURNS TABLE(total_external integer, external_therapists jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_external,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'therapist_id', ch.therapist_id,
        'therapist_name', p.full_name,
        'session_count', (
          SELECT COUNT(*) FROM clinical_history ch2 
          WHERE ch2.patient_id = p_patient_id 
          AND ch2.therapist_id = ch.therapist_id
          AND ch2.therapist_id != auth.uid()
        )
      )) FILTER (WHERE ch.therapist_id != auth.uid()),
      '[]'::jsonb
    ) as external_therapists
  FROM clinical_history ch
  LEFT JOIN profiles p ON ch.therapist_id = p.id
  WHERE ch.patient_id = p_patient_id
    AND ch.therapist_id != auth.uid();
END;
$$;


--
-- Name: get_public_appointment_details(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_public_appointment_details(p_appointment_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'date', a.date,
    'start_time', a.start_time,
    'duration_minutes', a.duration_minutes,
    'modality_patient', a.modality_patient,
    'status', a.status,
    'therapist', jsonb_build_object('full_name', p.full_name, 'avatar_url', td.avatar_url),
    'clinic', CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('name', c.name, 'address', c.address) ELSE null END
  ) INTO result
  FROM appointments a
  JOIN profiles p ON a.therapist_id = p.id
  LEFT JOIN therapist_details td ON p.id = td.user_id
  LEFT JOIN clinics c ON a.clinic_id = c.id
  WHERE a.id = p_appointment_id;

  RETURN result;
END;
$$;


--
-- Name: motivational_phrases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motivational_phrases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    author text,
    category text,
    language text DEFAULT 'es'::text,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: get_random_motivational_phrase(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_random_motivational_phrase() RETURNS SETOF public.motivational_phrases
    LANGUAGE sql
    AS $$
  SELECT *
  FROM public.motivational_phrases
  ORDER BY random()
  LIMIT 1;
$$;


--
-- Name: get_random_phrase(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_random_phrase() RETURNS TABLE(content text, author text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT mp.content, mp.author
  FROM motivational_phrases mp
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;


--
-- Name: get_specialty_change_history(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_specialty_change_history(p_therapist_id uuid, p_days_back integer DEFAULT 30, p_limit integer DEFAULT 50) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_history JSONB;
BEGIN
    WITH history_data AS (
        SELECT 
            scl.id,
            scl.action,
            scl.specialty_id,
            scl.specialty_name,
            scl.created_at,
            scl.change_details,
            p.full_name AS changed_by_name,
            CASE 
                WHEN scl.changed_by = p_therapist_id THEN 'self'
                ELSE 'other'
            END AS changed_by_type
        FROM specialty_change_logs scl
        LEFT JOIN profiles p ON scl.changed_by = p.id
        WHERE scl.therapist_id = p_therapist_id
            AND scl.created_at >= CURRENT_TIMESTAMP - (p_days_back || ' days')::INTERVAL
        ORDER BY scl.created_at DESC
        LIMIT p_limit
    )
    SELECT jsonb_build_object(
        'history', jsonb_agg(
            jsonb_build_object(
                'id', id,
                'action', action,
                'specialty', jsonb_build_object(
                    'id', specialty_id,
                    'name', specialty_name
                ),
                'changed_by', jsonb_build_object(
                    'name', changed_by_name,
                    'type', changed_by_type
                ),
                'details', change_details,
                'created_at', created_at,
                'time_ago', CASE
                    WHEN created_at > NOW() - INTERVAL '1 hour' THEN 
                        EXTRACT(MINUTE FROM (NOW() - created_at)) || ' minutos'
                    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 
                        EXTRACT(HOUR FROM (NOW() - created_at)) || ' horas'
                    ELSE 
                        EXTRACT(DAY FROM (NOW() - created_at)) || ' días'
                END
            )
        ),
        'summary', jsonb_build_object(
            'total_changes', COUNT(*),
            'additions', COUNT(*) FILTER (WHERE action = 'added'),
            'removals', COUNT(*) FILTER (WHERE action = 'removed'),
            'bulk_updates', COUNT(*) FILTER (WHERE action = 'bulk_update'),
            'period_days', p_days_back
        )
    ) INTO v_history
    FROM history_data;
    
    RETURN jsonb_build_object(
        'success', true,
        'therapist_id', p_therapist_id,
        'data', COALESCE(v_history, jsonb_build_object(
            'history', '[]'::JSONB,
            'summary', jsonb_build_object(
                'total_changes', 0,
                'additions', 0,
                'removals', 0,
                'bulk_updates', 0,
                'period_days', p_days_back
            )
        ))
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_specialty_ranking(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_specialty_ranking(p_specialty_slug text, p_limit integer DEFAULT 10) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(t), '[]'::json) INTO result
  FROM (
    SELECT
      rb.therapist_id,
      rb.final_score,
      rb.badge_label,
      rb.badge_emoji,
      rb.badge_color,
      rb.education_points,
      rb.experience_points,
      rb.unique_patients,
      rb.completed_plans,
      rb.signed_reports,
      ROW_NUMBER() OVER (ORDER BY rb.final_score DESC) AS ranking
    FROM v_reputation_badges rb
    WHERE rb.specialty_slug = p_specialty_slug
    ORDER BY rb.final_score DESC
    LIMIT p_limit
  ) t;

  RETURN result;
END;
$$;


--
-- Name: get_therapist_appointments(uuid, date, date, text, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_appointments(p_therapist_id uuid, p_date_from date DEFAULT CURRENT_DATE, p_date_to date DEFAULT NULL::date, p_status text DEFAULT NULL::text, p_clinic_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointments JSONB;
    v_total_count INTEGER;
    v_stats JSONB;
BEGIN
    -- Si no se especifica fecha final, usar 30 días desde la fecha inicial
    p_date_to := COALESCE(p_date_to, p_date_from + INTERVAL '30 days');
    
    -- Obtener las citas con toda la info necesaria
    WITH appointment_data AS (
        SELECT 
            a.id,
            a.appointment_date,
            a.appointment_time,
            a.duration,
            a.status,
            a.modalidad,
            a.notes,
            a.cancellation_reason,
            a.created_at,
            a.updated_at,
            -- Info del paciente
            jsonb_build_object(
                'id', p.id,
                'name', p.full_name,
                'email', p.email
            ) AS patient,
            -- Info de la clínica
            jsonb_build_object(
                'id', c.id,
                'name', c.name,
                'address', c.address,
                'modalidad', c.modalidad
            ) AS clinic,
            -- Calcular tiempo hasta la cita
            CASE 
                WHEN a.status = 'scheduled' AND (a.appointment_date + a.appointment_time) > NOW() THEN
                    EXTRACT(EPOCH FROM ((a.appointment_date + a.appointment_time) - NOW())) / 3600
                ELSE NULL
            END AS hours_until_appointment,
            -- Indicador de cita próxima (menos de 24 horas)
            CASE 
                WHEN a.status = 'scheduled' AND 
                     (a.appointment_date + a.appointment_time) > NOW() AND
                     (a.appointment_date + a.appointment_time) <= NOW() + INTERVAL '24 hours' THEN true
                ELSE false
            END AS is_upcoming_soon
        FROM appointments a
        JOIN profiles p ON a.patient_id = p.id
        JOIN clinics c ON a.clinic_id = c.id
        WHERE a.therapist_id = p_therapist_id
            AND a.appointment_date >= p_date_from
            AND a.appointment_date <= p_date_to
            AND (p_status IS NULL OR a.status = p_status)
            AND (p_clinic_id IS NULL OR a.clinic_id = p_clinic_id)
        ORDER BY a.appointment_date, a.appointment_time
    ),
    paginated_data AS (
        SELECT * FROM appointment_data
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'date', appointment_date,
                'time', appointment_time::TEXT,
                'duration', duration,
                'status', status,
                'modalidad', modalidad,
                'patient', patient,
                'clinic', clinic,
                'notes', notes,
                'cancellation_reason', cancellation_reason,
                'hours_until_appointment', hours_until_appointment,
                'is_upcoming_soon', is_upcoming_soon,
                'created_at', created_at,
                'updated_at', updated_at
            )
            ORDER BY appointment_date, appointment_time
        )
    INTO v_appointments
    FROM paginated_data;
    
    -- Contar total de registros
    SELECT COUNT(*) INTO v_total_count
    FROM appointment_data;
    
    -- Calcular estadísticas
    WITH stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_count,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
            COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
            COUNT(*) FILTER (WHERE status = 'no-show') AS no_show_count,
            COUNT(*) FILTER (WHERE modalidad = 'presencial') AS presencial_count,
            COUNT(*) FILTER (WHERE modalidad = 'online') AS online_count,
            COUNT(*) FILTER (WHERE is_upcoming_soon) AS upcoming_24h_count
        FROM appointment_data
    )
    SELECT jsonb_build_object(
        'total', v_total_count,
        'by_status', jsonb_build_object(
            'scheduled', scheduled_count,
            'completed', completed_count,
            'cancelled', cancelled_count,
            'no_show', no_show_count
        ),
        'by_modalidad', jsonb_build_object(
            'presencial', presencial_count,
            'online', online_count
        ),
        'upcoming_24h', upcoming_24h_count
    ) INTO v_stats
    FROM stats;
    
    -- Retornar resultado completo
    RETURN jsonb_build_object(
        'success', true,
        'therapist_id', p_therapist_id,
        'filters', jsonb_build_object(
            'date_from', p_date_from,
            'date_to', p_date_to,
            'status', p_status,
            'clinic_id', p_clinic_id
        ),
        'pagination', jsonb_build_object(
            'total', v_total_count,
            'limit', p_limit,
            'offset', p_offset,
            'has_more', v_total_count > (p_offset + p_limit)
        ),
        'statistics', v_stats,
        'appointments', COALESCE(v_appointments, '[]'::JSONB)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_therapist_availability(text, uuid, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_availability(p_therapist_identifier text, p_clinic_id uuid, p_start_date date, p_days integer) RETURNS TABLE(availability_date date, time_slots jsonb)
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_therapist_id UUID;
  v_end_date DATE;
  v_slot_duration INTEGER := 30;
BEGIN
  v_end_date := p_start_date + p_days;
  
  -- Resolver therapist_id desde UUID o slug
  IF p_therapist_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_therapist_id := p_therapist_identifier::UUID;
  ELSE
    SELECT td.user_id INTO v_therapist_id
    FROM therapist_details td WHERE td.slug = p_therapist_identifier;
  END IF;
  
  IF v_therapist_id IS NULL THEN RETURN; END IF;
  
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, v_end_date - 1, '1 day'::interval)::date AS the_date
  ),
  available_slots AS (
    SELECT ds.the_date, ta.start_time, ta.end_time, ta.clinic_id
    FROM date_series ds
    INNER JOIN therapist_availabilities ta 
      ON ta.therapist_id = v_therapist_id
      AND ta.is_active = true
      AND ta.day_of_week = EXTRACT(DOW FROM ds.the_date)::integer
    WHERE 
      -- LÓGICA MEJORADA: Solo mostrar disponibilidad específica de la clínica
      (p_clinic_id IS NOT NULL AND ta.clinic_id = p_clinic_id)
      OR 
      (p_clinic_id IS NULL AND ta.clinic_id IS NULL)
  ),
  time_slots_expanded AS (
    SELECT avs.the_date, slot_time::time AS slot_time, avs.clinic_id
    FROM available_slots avs,
    LATERAL generate_series(
      ('2000-01-01'::date + avs.start_time)::timestamp,
      ('2000-01-01'::date + avs.end_time - (v_slot_duration || ' minutes')::interval)::timestamp,
      (v_slot_duration || ' minutes')::interval
    ) AS slot_time
  ),
  slots_with_status AS (
    SELECT tse.the_date, tse.slot_time,
      NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.therapist_id = v_therapist_id
          AND a.date = tse.the_date
          AND a.start_time = tse.slot_time
          AND a.status NOT IN ('cancelled', 'canceled', 'no_show')
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocked_times bt
        WHERE bt.therapist_id = v_therapist_id
          AND (bt.clinic_id IS NULL OR bt.clinic_id = tse.clinic_id)
          AND (tse.the_date + tse.slot_time) >= bt.start_time
          AND (tse.the_date + tse.slot_time) < bt.end_time
      ) AS is_available
    FROM time_slots_expanded tse
  )
  SELECT sws.the_date AS availability_date,
    jsonb_agg(
      jsonb_build_object('time', to_char(sws.slot_time, 'HH24:MI'), 'available', sws.is_available)
      ORDER BY sws.slot_time
    ) AS time_slots
  FROM slots_with_status sws
  GROUP BY sws.the_date
  ORDER BY sws.the_date;
END;
$_$;


--
-- Name: get_therapist_clinics(uuid, boolean, boolean, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_clinics(p_therapist_id uuid, p_include_stats boolean DEFAULT true, p_include_availability boolean DEFAULT false, p_city_id integer DEFAULT NULL::integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_clinics JSONB;
    v_total_appointments INTEGER;
    v_active_appointments INTEGER;
    v_summary JSONB;
BEGIN
    -- Validar que el terapeuta existe
    IF NOT EXISTS(SELECT 1 FROM profiles WHERE id = p_therapist_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found',
            'message', 'El terapeuta no existe'
        );
    END IF;
    
    -- Obtener clínicas con información detallada
    WITH clinic_data AS (
        SELECT 
            c.id,
            c.name,
            c.address,
            c.phone,
            c.email,
            c.description,
            c.modalidad,
            c.created_at,
            c.updated_at,
            -- Información de ubicación
            jsonb_build_object(
                'city_id', ci.id,
                'city_name', ci.name,
                'region_id', r.id,
                'region_name', r.name
            ) AS location,
            -- Estadísticas si se solicitan
            CASE WHEN p_include_stats THEN
                jsonb_build_object(
                    'total_appointments', COUNT(DISTINCT a.id),
                    'scheduled_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.status = 'scheduled' AND a.appointment_date >= CURRENT_DATE
                    ),
                    'completed_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.status = 'completed'
                    ),
                    'cancelled_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.status = 'cancelled'
                    ),
                    'no_show_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.status = 'no-show'
                    ),
                    'today_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.appointment_date = CURRENT_DATE AND a.status = 'scheduled'
                    ),
                    'week_appointments', COUNT(DISTINCT a.id) FILTER (
                        WHERE a.appointment_date >= CURRENT_DATE 
                        AND a.appointment_date < CURRENT_DATE + INTERVAL '7 days'
                        AND a.status = 'scheduled'
                    ),
                    'month_revenue_potential', SUM(a.duration) FILTER (
                        WHERE a.appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
                        AND a.appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                        AND a.status IN ('scheduled', 'completed')
                    ),
                    'occupancy_rate_week', CASE
                        WHEN COUNT(DISTINCT ta.id) > 0 THEN
                            ROUND(
                                (COUNT(DISTINCT a.id) FILTER (
                                    WHERE a.appointment_date >= CURRENT_DATE 
                                    AND a.appointment_date < CURRENT_DATE + INTERVAL '7 days'
                                    AND a.status = 'scheduled'
                                )::NUMERIC * 100) / 
                                NULLIF(
                                    -- Slots disponibles en la semana (aproximado)
                                    SUM(
                                        EXTRACT(EPOCH FROM (ta.end_time - ta.start_time)) / 3600 * 2
                                    ) FILTER (WHERE ta.is_active), 
                                    0
                                ), 
                                1
                            )
                        ELSE 0
                    END
                )
            ELSE NULL
            END AS statistics,
            -- Disponibilidad si se solicita
            CASE WHEN p_include_availability THEN
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'day_of_week', ta.day_of_week,
                            'day_name', CASE ta.day_of_week
                                WHEN 0 THEN 'Domingo'
                                WHEN 1 THEN 'Lunes'
                                WHEN 2 THEN 'Martes'
                                WHEN 3 THEN 'Miércoles'
                                WHEN 4 THEN 'Jueves'
                                WHEN 5 THEN 'Viernes'
                                WHEN 6 THEN 'Sábado'
                            END,
                            'start_time', ta.start_time::TEXT,
                            'end_time', ta.end_time::TEXT,
                            'is_active', ta.is_active
                        )
                        ORDER BY ta.day_of_week, ta.start_time
                    )
                    FROM therapist_availabilities ta
                    WHERE ta.clinic_id = c.id AND ta.is_active = true
                )
            ELSE NULL
            END AS availability,
            -- Próxima cita disponible
            (
                SELECT jsonb_build_object(
                    'date', next_slot.slot_date,
                    'time', next_slot.slot_time::TEXT
                )
                FROM (
                    SELECT 
                        d.date AS slot_date,
                        ta.start_time AS slot_time
                    FROM generate_series(
                        CURRENT_DATE, 
                        CURRENT_DATE + INTERVAL '14 days', 
                        INTERVAL '1 day'
                    ) d(date)
                    JOIN therapist_availabilities ta ON ta.clinic_id = c.id
                    WHERE ta.day_of_week = EXTRACT(DOW FROM d.date)::INTEGER
                        AND ta.is_active = true
                        AND NOT EXISTS (
                            SELECT 1 FROM appointments a2
                            WHERE a2.clinic_id = c.id
                                AND a2.appointment_date = d.date::DATE
                                AND a2.appointment_time = ta.start_time
                                AND a2.status = 'scheduled'
                        )
                    ORDER BY d.date, ta.start_time
                    LIMIT 1
                ) next_slot
            ) AS next_available_slot
        FROM clinics c
        LEFT JOIN ubication_cities ci ON c.city_id = ci.id
        LEFT JOIN ubication_regions r ON ci.region_id = r.id
        LEFT JOIN appointments a ON c.id = a.clinic_id
        LEFT JOIN therapist_availabilities ta ON c.id = ta.clinic_id
        WHERE c.therapist_id = p_therapist_id
            AND (p_city_id IS NULL OR c.city_id = p_city_id)
        GROUP BY c.id, c.name, c.address, c.phone, c.email, c.description, 
                 c.modalidad, c.created_at, c.updated_at, ci.id, ci.name, r.id, r.name
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'address', address,
            'phone', phone,
            'email', email,
            'description', description,
            'modalidad', modalidad,
            'location', location,
            'statistics', statistics,
            'availability', availability,
            'next_available_slot', next_available_slot,
            'created_at', created_at,
            'updated_at', updated_at,
            'status', CASE
                WHEN availability IS NULL OR jsonb_array_length(availability) = 0 THEN 'no_availability'
                WHEN statistics->>'scheduled_appointments' = '0' THEN 'available'
                WHEN (statistics->>'occupancy_rate_week')::NUMERIC > 80 THEN 'busy'
                ELSE 'normal'
            END
        )
        ORDER BY 
            CASE modalidad 
                WHEN 'ambas' THEN 1 
                WHEN 'presencial' THEN 2 
                ELSE 3 
            END,
            created_at DESC
    ) INTO v_clinics
    FROM clinic_data;
    
    -- Calcular resumen general si hay estadísticas
    IF p_include_stats THEN
        WITH summary_data AS (
            SELECT 
                COUNT(DISTINCT c.id) AS total_clinics,
                COUNT(DISTINCT c.id) FILTER (WHERE c.modalidad = 'presencial') AS presencial_clinics,
                COUNT(DISTINCT c.id) FILTER (WHERE c.modalidad = 'online') AS online_clinics,
                COUNT(DISTINCT c.id) FILTER (WHERE c.modalidad = 'ambas') AS ambas_clinics,
                COUNT(DISTINCT c.city_id) AS cities_count,
                COUNT(DISTINCT a.id) AS total_appointments_all,
                COUNT(DISTINCT a.id) FILTER (
                    WHERE a.status = 'scheduled' AND a.appointment_date >= CURRENT_DATE
                ) AS active_appointments_all,
                COUNT(DISTINCT ta.id) FILTER (WHERE ta.is_active) AS active_availability_blocks
            FROM clinics c
            LEFT JOIN appointments a ON c.id = a.clinic_id
            LEFT JOIN therapist_availabilities ta ON c.id = ta.clinic_id
            WHERE c.therapist_id = p_therapist_id
        )
        SELECT jsonb_build_object(
            'total_clinics', total_clinics,
            'by_modalidad', jsonb_build_object(
                'presencial', presencial_clinics,
                'online', online_clinics,
                'ambas', ambas_clinics
            ),
            'cities_coverage', cities_count,
            'total_appointments', total_appointments_all,
            'active_appointments', active_appointments_all,
            'has_availability_configured', active_availability_blocks > 0,
            'avg_appointments_per_clinic', CASE 
                WHEN total_clinics > 0 THEN 
                    ROUND(total_appointments_all::NUMERIC / total_clinics, 1)
                ELSE 0
            END
        ) INTO v_summary
        FROM summary_data;
    ELSE
        SELECT jsonb_build_object(
            'total_clinics', COUNT(*)
        ) INTO v_summary
        FROM clinics
        WHERE therapist_id = p_therapist_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'therapist_id', p_therapist_id,
        'filters', jsonb_build_object(
            'city_id', p_city_id,
            'include_stats', p_include_stats,
            'include_availability', p_include_availability
        ),
        'summary', v_summary,
        'clinics', COALESCE(v_clinics, '[]'::JSONB),
        'message', CASE 
            WHEN v_clinics IS NULL OR jsonb_array_length(v_clinics) = 0 THEN
                'No tienes clínicas registradas'
            WHEN jsonb_array_length(v_clinics) = 1 THEN
                '1 clínica encontrada'
            ELSE
                format('%s clínicas encontradas', jsonb_array_length(v_clinics))
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_therapist_clinics(uuid, uuid, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_clinics(p_therapist_id uuid, p_city_id uuid DEFAULT NULL::uuid, p_include_stats boolean DEFAULT false, p_include_availability boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_clinics JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'address', c.address,
      'phone', c.phone,
      'email', c.email,
      'modalidad', c.modalidad,
      'created_at', c.created_at
    )
    ORDER BY c.created_at DESC
  ) INTO v_clinics
  FROM clinics c
  WHERE c.therapist_id = p_therapist_id;

  RETURN jsonb_build_object(
    'success', true,
    'clinics', COALESCE(v_clinics, '[]'::JSONB)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unexpected_error',
      'message', SQLERRM
    );
END;
$$;


--
-- Name: get_therapist_full_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_full_profile(p_therapist_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_profile JSONB;
    v_slug TEXT;
    v_landing_url TEXT;
BEGIN
    -- Verificar si existe el terapeuta
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_therapist_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found'
        );
    END IF;
    
    -- Obtener o crear slug para landing page
    SELECT custom_url INTO v_slug
    FROM therapist_landing_pages
    WHERE therapist_id = p_therapist_id;
    
    IF v_slug IS NULL THEN
        -- Crear slug basado en nombre
        SELECT public.slugify(full_name) || '-' || SUBSTRING(p_therapist_id::TEXT, 1, 8)
        INTO v_slug
        FROM profiles
        WHERE id = p_therapist_id;
        
        -- Insertar landing page
        INSERT INTO therapist_landing_pages (therapist_id, custom_url)
        VALUES (p_therapist_id, v_slug)
        ON CONFLICT (therapist_id) DO UPDATE SET updated_at = NOW();
    END IF;
    
    -- Construir URL completa
    v_landing_url := 'https://fonokit.cl/profesional/' || v_slug;
    
    -- Obtener toda la información
    WITH therapist_data AS (
        SELECT 
            p.id,
            p.full_name,
            p.email,
            td.avatar_url,
            td.about_me,
            td.headline_statement,
            td.registration_supersalud,
            td.registration_secreduc,
            td.social_instagram_url,
            td.social_facebook_url,
            p.gender,
            p.birthdate,
            td.main_address,
            tb.primary_color,
            tb.secondary_color,
            tb.logo_url,
            tb.font_family as typography,
            ci.name AS city,
            r.name AS region
        FROM profiles p
        LEFT JOIN therapist_details td ON p.id = td.user_id
        LEFT JOIN therapist_branding tb ON p.id = tb.therapist_id
        LEFT JOIN cities ci ON p.city_id = ci.id
        LEFT JOIN regions r ON p.region_id = r.id
        WHERE p.id = p_therapist_id
    )
    SELECT jsonb_build_object(
        'success', true,
        'landing_url', v_landing_url,
        'slug', v_slug,
        'profile', jsonb_build_object(
            -- Información básica
            'basic_info', row_to_json(therapist_data),
            
            -- Especialidades
            'specialties', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', s.id,
                        'name', s.name,
                        'description', s.description
                    )
                    ORDER BY s.name
                )
                FROM therapist_specialties ts
                JOIN specialties s ON ts.specialty_id = s.id
                WHERE ts.therapist_id = p_therapist_id
            ),
            
            -- Formación académica
            'formations', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'title', title,
                        'institution', institution,
                        'graduation_year', graduation_year,
                        'description', description
                    )
                    ORDER BY graduation_year DESC NULLS LAST
                )
                FROM therapist_education
                WHERE therapist_id = p_therapist_id AND is_public = true
            ),
            
            -- Experiencia laboral
            'experiences', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'role', role,
                        'institution', institution,
                        'start_date', start_date,
                        'end_date', end_date,
                        'description', description
                    )
                    ORDER BY start_date DESC
                )
                FROM therapist_experience
                WHERE therapist_id = p_therapist_id AND is_public = true
            ),
            
            -- Servicios
            'services', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'name', service_name,
                        'description', service_description,
                        'is_active', is_active
                    )
                    ORDER BY service_name
                )
                FROM therapist_services
                WHERE therapist_id = p_therapist_id AND is_active = true
            ),
            
            -- Condiciones que trata
            'conditions', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'name', condition_name
                    )
                    ORDER BY condition_name
                )
                FROM therapist_conditions
                WHERE therapist_id = p_therapist_id AND is_public = true
            ),
            
            -- Idiomas
            'languages', (
                SELECT jsonb_agg(language)
                FROM unnest(COALESCE((SELECT languages FROM therapist_details WHERE user_id = p_therapist_id), ARRAY[]::text[])) as language
            ),
            
            -- Clínicas
            'clinics', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', c.id,
                        'name', c.name,
                        'address', c.address,
                        'modality', c.modality,
                        'phone', c.phone,
                        'email', c.email,
                        'description', c.description,
                        'city', ci.name
                    )
                    ORDER BY c.name
                )
                FROM clinics c
                LEFT JOIN cities ci ON c.city_id = ci.id
                WHERE c.therapist_id = p_therapist_id
            ),
            
            -- Estadísticas y reviews
            'stats', (
                SELECT jsonb_build_object(
                    'total_appointments', COUNT(DISTINCT a.id),
                    'completed_appointments', COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed'),
                    'average_rating', ROUND(AVG(pr.rating), 1),
                    'total_reviews', COUNT(DISTINCT pr.id)
                )
                FROM profiles p
                LEFT JOIN appointments a ON p.id = a.therapist_id
                LEFT JOIN patient_reviews pr ON p.id = pr.therapist_id
                WHERE p.id = p_therapist_id
            ),
            
            -- Reviews destacadas
            'featured_reviews', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'rating', r.rating,
                        'review', r.review,
                        'created_at', r.created_at,
                        'patient_name', LEFT(p.full_name, 1) || '***'
                    )
                    ORDER BY r.rating DESC, r.created_at DESC
                )
                FROM (
                    SELECT * FROM patient_reviews
                    WHERE therapist_id = p_therapist_id 
                        AND review IS NOT NULL
                        AND LENGTH(review) > 20
                    ORDER BY rating DESC, created_at DESC
                    LIMIT 5
                ) r
                JOIN profiles p ON (SELECT patient_id FROM appointments WHERE id = r.id) = p.id
            ),
            
            -- Disponibilidad resumida
            'availability_summary', (
                SELECT jsonb_agg(DISTINCT
                    jsonb_build_object(
                        'day_number', day_of_week,
                        'day_name', 
                          CASE day_of_week
                            WHEN 0 THEN 'Domingo'
                            WHEN 1 THEN 'Lunes'
                            WHEN 2 THEN 'Martes'
                            WHEN 3 THEN 'Miércoles'
                            WHEN 4 THEN 'Jueves'
                            WHEN 5 THEN 'Viernes'
                            WHEN 6 THEN 'Sábado'
                          END,
                        'clinic_id', clinic_id
                    )
                    ORDER BY day_of_week
                )
                FROM therapist_availabilities
                WHERE therapist_id = p_therapist_id AND is_active = true
            )
        )
    ) INTO v_profile
    FROM therapist_data;
    
    RETURN v_profile;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: get_therapist_growth_plan(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_growth_plan(p_therapist_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_specialties JSONB;
  v_courses JSONB;
  v_stats JSONB;
  v_patient_count INT;
  v_session_count INT;
BEGIN

  -- Conteos generales
  SELECT COUNT(DISTINCT id) INTO v_patient_count
  FROM patients WHERE therapist_id = p_therapist_id AND status = 'active';

  SELECT COUNT(*) INTO v_session_count
  FROM appointments 
  WHERE therapist_id = p_therapist_id AND status = 'completed';

  -- Progreso por especialidad
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'specialty_slug',    s.slug,
      'specialty_name',    s.name,
      'specialty_icon',    COALESCE(s.icon, '🎯'),
      'final_score',       COALESCE(tsb.final_score, 0),
      'education_score',   COALESCE(tsb.education_score, 0),
      'experience_score',  COALESCE(tsb.experience_score, 0),
      'current_badge',     COALESCE(tsb.badge, 'Básico'),
      'current_emoji',     CASE COALESCE(tsb.badge, 'Básico')
                             WHEN 'experiencia_basica'       THEN '🌱'
                             WHEN 'profesional_experiencia'  THEN '⚡'
                             WHEN 'alta_experiencia'         THEN '🔥'
                             WHEN 'experto'                  THEN '💎'
                             WHEN 'maximo'                   THEN '👑'
                             ELSE '🌱' END,
      'next_badge_level',  CASE COALESCE(tsb.final_score, 0)
                             WHEN 0 THEN 'experiencia_basica'
                             ELSE CASE
                               WHEN COALESCE(tsb.final_score, 0) < 25 THEN 'experiencia_basica'
                               WHEN COALESCE(tsb.final_score, 0) < 50 THEN 'profesional_experiencia'
                               WHEN COALESCE(tsb.final_score, 0) < 75 THEN 'alta_experiencia'
                               WHEN COALESCE(tsb.final_score, 0) < 90 THEN 'experto'
                               ELSE 'maximo'
                             END
                           END,
      'next_badge',        CASE
                             WHEN COALESCE(tsb.final_score, 0) < 25 THEN 'Profesional'
                             WHEN COALESCE(tsb.final_score, 0) < 50 THEN 'Alta Experiencia'
                             WHEN COALESCE(tsb.final_score, 0) < 75 THEN 'Experto'
                             WHEN COALESCE(tsb.final_score, 0) < 90 THEN 'Máximo'
                             ELSE 'Máximo'
                           END,
      'next_emoji',        CASE
                             WHEN COALESCE(tsb.final_score, 0) < 25 THEN '⚡'
                             WHEN COALESCE(tsb.final_score, 0) < 50 THEN '🔥'
                             WHEN COALESCE(tsb.final_score, 0) < 75 THEN '💎'
                             ELSE '👑'
                           END,
      'progress_percent',  LEAST(100, COALESCE(tsb.final_score, 0)),
      'points_to_next',    CASE
                             WHEN COALESCE(tsb.final_score, 0) < 25 THEN (25 - COALESCE(tsb.final_score, 0))
                             WHEN COALESCE(tsb.final_score, 0) < 50 THEN (50 - COALESCE(tsb.final_score, 0))
                             WHEN COALESCE(tsb.final_score, 0) < 75 THEN (75 - COALESCE(tsb.final_score, 0))
                             WHEN COALESCE(tsb.final_score, 0) < 90 THEN (90 - COALESCE(tsb.final_score, 0))
                             ELSE 0
                           END,
      'weakest_axis',      CASE 
                             WHEN COALESCE(tsb.education_score, 0) < COALESCE(tsb.experience_score, 0) 
                             THEN 'education' ELSE 'experience' 
                           END,
      'unique_patients',   v_patient_count
    )
  ), '[]'::jsonb)
  INTO v_specialties
  FROM therapist_specialties ts
  JOIN specialties s ON s.id = ts.specialty_id
  LEFT JOIN therapist_specialty_badges tsb 
    ON tsb.therapist_id = p_therapist_id AND tsb.specialty = s.slug
  WHERE ts.therapist_id = p_therapist_id;

  -- Cursos recomendados (eje más débil)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          sc.id,
      'title',       sc.title,
      'institution', sc.institution,
      'modality',    sc.modality,
      'url',         sc.url,
      'price',       sc.price,
      'duration_hours', sc.duration_hours,
      'specialty',   s.name
    )
  ), '[]'::jsonb)
  INTO v_courses
  FROM suggested_courses sc
  LEFT JOIN specialties s ON s.id = sc.specialty_id
  WHERE sc.specialty_id IN (
    SELECT specialty_id FROM therapist_specialties WHERE therapist_id = p_therapist_id
  )
  LIMIT 6;

  -- Stats generales
  v_stats := jsonb_build_object(
    'total_patients',  v_patient_count,
    'total_sessions',  v_session_count,
    'specialties_count', (
      SELECT COUNT(*) FROM therapist_specialties WHERE therapist_id = p_therapist_id
    )
  );

  RETURN jsonb_build_object(
    'specialties_progress',  COALESCE(v_specialties, '[]'::jsonb),
    'recommended_courses',   COALESCE(v_courses, '[]'::jsonb),
    'stats',                 v_stats
  );
END;
$$;


--
-- Name: get_therapist_next_available_slots(uuid, uuid, timestamp with time zone, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_next_available_slots(p_therapist_id uuid, p_clinic_id uuid DEFAULT NULL::uuid, p_from timestamp with time zone DEFAULT now(), p_days_ahead integer DEFAULT 30, p_slot_minutes integer DEFAULT 30, p_limit integer DEFAULT 10) RETURNS TABLE(slot_start timestamp with time zone, slot_end timestamp with time zone, slot_date date, slot_time time without time zone, day_name text)
    LANGUAGE sql STABLE
    AS $$
    WITH raw_slots AS (
        SELECT 
            gas.slot_start,
            gas.slot_end
        FROM public.get_available_time_slots(
            p_therapist_id,
            p_clinic_id,
            p_from,
            p_from + (p_days_ahead || ' days')::interval,
            p_slot_minutes
        ) AS gas
        WHERE gas.slot_start > p_from
    )
    SELECT
        rs.slot_start,
        rs.slot_end,
        rs.slot_start::date AS slot_date,
        rs.slot_start::time AS slot_time,
        CASE EXTRACT(DOW FROM rs.slot_start)
            WHEN 0 THEN 'Domingo'
            WHEN 1 THEN 'Lunes'
            WHEN 2 THEN 'Martes'
            WHEN 3 THEN 'Miércoles'
            WHEN 4 THEN 'Jueves'
            WHEN 5 THEN 'Viernes'
            WHEN 6 THEN 'Sábado'
        END AS day_name
    FROM raw_slots rs
    ORDER BY rs.slot_start
    LIMIT p_limit;
$$;


--
-- Name: get_therapist_patients_for_agenda(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_patients_for_agenda(p_therapist_id uuid, p_search_term text DEFAULT NULL::text) RETURNS TABLE(id uuid, profile_id uuid, full_name text, email text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        pat.id,
        pat.profile_id,
        pat.full_name,
        pat.email
    FROM 
        public.patients pat
    WHERE 
        pat.therapist_id = p_therapist_id
        AND pat.status = 'active'
        AND (
            p_search_term IS NULL OR 
            pat.full_name ILIKE '%' || p_search_term || '%' OR
            pat.email ILIKE '%' || p_search_term || '%'
        )
    ORDER BY 
        pat.full_name
    LIMIT 20;
END;
$$;


--
-- Name: get_therapist_patients_with_details(uuid, text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_patients_with_details(p_therapist_id uuid, p_search_term text DEFAULT NULL::text, p_status text DEFAULT 'active'::text, p_sort_by text DEFAULT 'name_asc'::text, p_page integer DEFAULT 0, p_page_size integer DEFAULT 10) RETURNS TABLE(patient_id uuid, patient_name text, patient_email text, patient_phone text, last_visit_date date, next_visit_date date, status text, total_count bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_offset integer;
BEGIN
    v_offset := p_page * p_page_size;

    RETURN QUERY
    WITH patient_base AS (
        SELECT
            p.id,
            p.full_name,
            p.email,
            p.phone,
            p.rut,
            p.created_at,
            COALESCE(p.is_blacklisted, false) as is_archived
        FROM public.patients p
        WHERE p.therapist_id = p_therapist_id
        AND (
            (p_status = 'active' AND (p.is_blacklisted IS NULL OR p.is_blacklisted = false)) OR
            (p_status = 'archived' AND p.is_blacklisted = true)
        )
        AND (
            p_search_term IS NULL OR
            p.full_name ILIKE '%' || p_search_term || '%' OR
            p.email ILIKE '%' || p_search_term || '%' OR
            p.phone ILIKE '%' || p_search_term || '%'
        )
    ),
    patient_appointments AS (
        SELECT
            a.patient_id,
            MAX(CASE WHEN a.status = 'completed' AND a.date < CURRENT_DATE THEN a.date ELSE NULL END) as last_visit,
            MIN(CASE WHEN a.status = 'scheduled' AND a.date >= CURRENT_DATE THEN a.date ELSE NULL END) as next_visit
        FROM public.appointments a
        WHERE a.therapist_id = p_therapist_id AND a.patient_id IN (SELECT id FROM patient_base)
        GROUP BY a.patient_id
    )
    SELECT
        pb.id,
        pb.full_name,
        pb.email,
        pb.phone,
        pa.last_visit,
        pa.next_visit,
        CASE WHEN pb.is_archived THEN 'archived' ELSE 'active' END as patient_status,
        (SELECT COUNT(*) FROM patient_base) as total_results
    FROM patient_base pb
    LEFT JOIN patient_appointments pa ON pb.id = pa.patient_id
    ORDER BY
        CASE WHEN p_sort_by = 'name_asc' THEN pb.full_name END ASC,
        CASE WHEN p_sort_by = 'name_desc' THEN pb.full_name END DESC,
        CASE WHEN p_sort_by = 'last_visit_desc' THEN pa.last_visit END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'created_at_desc' THEN pb.created_at END DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;


--
-- Name: get_therapist_reputation(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_reputation(p_therapist_id uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'therapist_id', p_therapist_id,
    'global', (
      SELECT json_build_object(
        'score', global_score,
        'badge', global_badge,
        'badge_level', global_badge_level,
        'emoji', global_badge_emoji,
        'color', global_badge_color,
        'total_specialties', total_specialties,
        'total_unique_patients', total_unique_patients,
        'total_appointments', total_appointments,
        'total_completed_plans', total_completed_plans,
        'total_signed_reports', total_signed_reports
      )
      FROM v_reputation_therapist_global
      WHERE therapist_id = p_therapist_id
    ),
    'specialties', (
      SELECT json_agg(
        json_build_object(
          'specialty_slug', specialty_slug,
          'specialty_name', specialty_name,
          'specialty_icon', specialty_icon,
          'education_points', education_points,
          'experience_points', experience_points,
          'final_score', final_score,
          'badge_level', badge_level,
          'badge_label', badge_label,
          'badge_emoji', badge_emoji,
          'badge_color', badge_color,
          'unique_patients', unique_patients,
          'experience_breakdown', json_build_object(
            'diagnoses', diagnosis_points,
            'conditions', condition_points,
            'patient_diversity', patient_diversity_points,
            'appointments', appointment_points,
            'plan_completions', plan_completion_points,
            'followups', followup_points,
            'evaluations', evaluation_points,
            'reports', report_points
          )
        )
        ORDER BY final_score DESC
      )
      FROM v_reputation_badges
      WHERE therapist_id = p_therapist_id
    ),
    'formula', json_build_object(
      'education_weight', 0.4,
      'experience_weight', 0.6
    ),
    'legal_disclaimer', 'Nivel de experiencia en Fonokit basado en formación declarada y práctica clínica registrada en la plataforma.',
    'calculated_at', now()
  ) INTO result;
  RETURN result;
END;
$$;


--
-- Name: get_therapist_reputation_overview(integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_reputation_overview(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_min_score integer DEFAULT 0, p_badge_level text DEFAULT NULL::text) RETURNS TABLE(id uuid, name text, email text, global_score integer, level_name text, badge_emoji text, total_specialties integer, total_patients integer, total_appointments integer, badges jsonb, calculated_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    p.id,
    p.full_name AS name,
    p.email,
    COALESCE((
      SELECT AVG(tsb.final_score)::INT
      FROM therapist_specialty_badges tsb
      WHERE tsb.therapist_id = p.id
    ), 0) AS global_score,
    COALESCE((
      SELECT tsb.badge
      FROM therapist_specialty_badges tsb
      WHERE tsb.therapist_id = p.id
      ORDER BY tsb.final_score DESC
      LIMIT 1
    ), 'Sin nivel') AS level_name,
    CASE
      WHEN (SELECT MAX(tsb.final_score) FROM therapist_specialty_badges tsb WHERE tsb.therapist_id = p.id) >= 80 THEN '🏆'
      WHEN (SELECT MAX(tsb.final_score) FROM therapist_specialty_badges tsb WHERE tsb.therapist_id = p.id) >= 60 THEN '🟠'
      WHEN (SELECT MAX(tsb.final_score) FROM therapist_specialty_badges tsb WHERE tsb.therapist_id = p.id) >= 40 THEN '🟡'
      WHEN (SELECT MAX(tsb.final_score) FROM therapist_specialty_badges tsb WHERE tsb.therapist_id = p.id) >= 20 THEN '🔹'
      ELSE '⬜'
    END AS badge_emoji,
    COALESCE((
      SELECT COUNT(*)::INT
      FROM therapist_specialty_badges tsb
      WHERE tsb.therapist_id = p.id AND tsb.final_score > 0
    ), 0) AS total_specialties,
    COALESCE((
      SELECT COUNT(DISTINCT pat.id)::INT
      FROM patients pat
      WHERE pat.therapist_id = p.id
    ), 0) AS total_patients,
    COALESCE((
      SELECT COUNT(*)::INT
      FROM appointments a
      WHERE a.therapist_id = p.id
    ), 0) AS total_appointments,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'specialty', tsb.specialty,
        'badge', tsb.badge,
        'final_score', tsb.final_score,
        'education_score', tsb.education_score,
        'experience_score', tsb.experience_score
      ) ORDER BY tsb.final_score DESC)
      FROM therapist_specialty_badges tsb
      WHERE tsb.therapist_id = p.id AND tsb.final_score > 0
    ), '[]'::jsonb) AS badges,
    NOW() AS calculated_at
  FROM profiles p
  WHERE p.role = 'therapist'
  ORDER BY global_score DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;


--
-- Name: get_therapist_reviews(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_reviews(p_therapist_id uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0) RETURNS TABLE(review_id uuid, patient_name text, rating integer, comment text, review_date timestamp with time zone, appointment_date date)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id AS review_id,
        p.full_name AS patient_name,
        r.rating,
        r.comment,
        r.created_at AS review_date,
        a.appointment_date
    FROM reviews r
    INNER JOIN profiles p ON r.patient_id = p.id
    INNER JOIN appointments a ON r.appointment_id = a.id
    WHERE r.therapist_id = p_therapist_id
    AND r.is_visible = true
    ORDER BY r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


--
-- Name: FUNCTION get_therapist_reviews(p_therapist_id uuid, p_limit integer, p_offset integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_therapist_reviews(p_therapist_id uuid, p_limit integer, p_offset integer) IS 'Obtiene las reseñas visibles de un terapeuta con paginación';


--
-- Name: get_therapist_schedule_for_search(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_schedule_for_search(p_therapist_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_schedule JSONB;
BEGIN
    WITH schedule_data AS (
        SELECT 
            ta.day_of_week::TEXT as day_text,
            CASE ta.day_of_week::TEXT
                WHEN 'Domingo' THEN 0
                WHEN 'Lunes' THEN 1
                WHEN 'Martes' THEN 2
                WHEN 'Miércoles' THEN 3
                WHEN 'Jueves' THEN 4
                WHEN 'Viernes' THEN 5
                WHEN 'Sábado' THEN 6
                ELSE 1
            END as day_num,
            ta.start_time,
            ta.end_time,
            ta.consultation_type::TEXT as tipo,
            ta.is_active
        FROM therapist_availabilities ta
        WHERE ta.therapist_id = p_therapist_id
        AND ta.is_active = true
    )
    SELECT jsonb_build_object(
        'success', true,
        'has_schedule', COUNT(*) > 0,
        'schedule', jsonb_agg(
            jsonb_build_object(
                'day', day_text,
                'day_num', day_num,
                'start_time', start_time::TEXT,
                'end_time', end_time::TEXT,
                'tipo', tipo
            )
            ORDER BY day_num
        ),
        'modalidades', jsonb_build_object(
            'presencial', EXISTS(
                SELECT 1 FROM therapist_availabilities 
                WHERE therapist_id = p_therapist_id 
                AND consultation_type::TEXT IN ('presencial', 'both')
                AND is_active = true
            ),
            'online', EXISTS(
                SELECT 1 FROM therapist_availabilities 
                WHERE therapist_id = p_therapist_id 
                AND consultation_type::TEXT IN ('online', 'both')
                AND is_active = true
            )
        )
    ) INTO v_schedule
    FROM schedule_data;
    
    RETURN COALESCE(v_schedule, jsonb_build_object(
        'success', true,
        'has_schedule', false,
        'schedule', '[]'::JSONB,
        'modalidades', jsonb_build_object(
            'presencial', false,
            'online', false
        )
    ));
END;
$$;


--
-- Name: get_therapist_specialties(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_therapist_specialties(p_therapist_id uuid) RETURNS TABLE(id integer, name text, description text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description
    FROM 
        specialties s
        JOIN therapist_specialties ts ON s.id = ts.specialty_id
    WHERE 
        ts.therapist_id = p_therapist_id
    ORDER BY 
        s.order, s.name;
END;
$$;


--
-- Name: get_user_email_by_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_email_by_id(user_id_param uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Esta función debe definirse con SECURITY DEFINER para que pueda acceder a auth.users
  -- La política RLS de la tabla auth.users podría restringir el acceso directo.
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  RETURN user_email;
END;
$$;


--
-- Name: get_user_notifications(uuid, public.notification_status, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_notifications(p_user_id uuid, p_status public.notification_status DEFAULT NULL::public.notification_status, p_limit integer DEFAULT 50) RETURNS TABLE(id uuid, type public.notification_type, status public.notification_status, title text, message text, data jsonb, sent_at timestamp with time zone, read_at timestamp with time zone, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.status,
        n.title,
        n.message,
        n.data,
        n.sent_at,
        n.read_at,
        n.created_at
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND (p_status IS NULL OR n.status = p_status)
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(p_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT raw_user_meta_data->>'role'
  FROM auth.users
  WHERE id = p_user_id;
$$;


--
-- Name: get_weekly_availability(uuid, uuid, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_weekly_availability(p_therapist_id uuid, p_clinic_id uuid DEFAULT NULL::uuid, p_include_stats boolean DEFAULT true) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_availability JSONB;
    v_total_hours_week NUMERIC := 0;
    v_clinics_data JSONB := '[]'::JSONB;
    v_modalidades JSONB;
BEGIN
    -- Validar clínica si se especifica
    IF p_clinic_id IS NOT NULL AND NOT EXISTS(
        SELECT 1 FROM clinics 
        WHERE id = p_clinic_id AND therapist_id = p_therapist_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_clinic',
            'message', 'La clínica no pertenece a este terapeuta'
        );
    END IF;
    
    -- Obtener modalidades
    SELECT jsonb_object_agg(modalidad, count) INTO v_modalidades
    FROM (
        SELECT c.modalidad, COUNT(*) as count
        FROM clinics c
        WHERE c.therapist_id = p_therapist_id
            AND (p_clinic_id IS NULL OR c.id = p_clinic_id)
        GROUP BY c.modalidad
    ) modalidad_counts;
    
    -- Obtener la disponibilidad consolidada
    WITH base_availability AS (
        SELECT 
            c.id AS clinic_id,
            c.name AS clinic_name,
            c.modalidad,
            c.address,
            ci.name AS city,
            ta.day_of_week,
            ta.start_time,
            ta.end_time,
            ta.is_active,
            EXTRACT(EPOCH FROM (ta.end_time - ta.start_time)) / 3600 AS hours
        FROM clinics c
        LEFT JOIN therapist_availabilities ta ON c.id = ta.clinic_id
        LEFT JOIN ubication_cities ci ON c.city_id = ci.id
        WHERE c.therapist_id = p_therapist_id
            AND (p_clinic_id IS NULL OR c.id = p_clinic_id)
    ),
    clinic_summary AS (
        SELECT 
            clinic_id,
            clinic_name,
            modalidad,
            address,
            city,
            SUM(CASE WHEN is_active THEN hours ELSE 0 END) AS total_weekly_hours
        FROM base_availability
        GROUP BY clinic_id, clinic_name, modalidad, address, city
    ),
    weekly_calendar AS (
        SELECT 
            dw.day_name,
            -- Agregar time_blocks aquí
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'clinic_id', ba.clinic_id,
                        'clinic_name', ba.clinic_name,
                        'start_time', ba.start_time::TEXT,
                        'end_time', ba.end_time::TEXT,
                        'modalidad', ba.modalidad
                    ) ORDER BY ba.start_time
                ) FILTER (WHERE ba.is_active = true),
                '[]'::JSONB
            ) AS time_blocks,
            COUNT(DISTINCT ba.clinic_id) FILTER (WHERE ba.is_active = true) AS block_count,
            COALESCE(SUM(ba.hours) FILTER (WHERE ba.is_active = true), 0) AS daily_hours
        FROM (VALUES 
            ('Lunes'::day_of_week), ('Martes'::day_of_week), ('Miércoles'::day_of_week),
            ('Jueves'::day_of_week), ('Viernes'::day_of_week), ('Sábado'::day_of_week),
            ('Domingo'::day_of_week)
        ) AS dw(day_name)
        LEFT JOIN base_availability ba ON ba.day_of_week = dw.day_name
        GROUP BY dw.day_name
    )
    SELECT jsonb_build_object(
        'clinics', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'clinic_id', cs.clinic_id,
                    'clinic_name', cs.clinic_name,
                    'modalidad', cs.modalidad,
                    'address', cs.address,
                    'city', cs.city,
                    'total_weekly_hours', ROUND(cs.total_weekly_hours, 2)
                )
            )
            FROM clinic_summary cs
        ),
        'consolidated_calendar', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'day_of_week', day_name::TEXT,
                    'day_name', day_name::TEXT,
                    'is_working_day', block_count > 0,
                    'total_blocks', block_count,
                    'daily_hours', ROUND(daily_hours, 2),
                    'time_blocks', time_blocks  -- IMPORTANTE: Incluir time_blocks
                )
                ORDER BY 
                    CASE day_name::TEXT
                        WHEN 'Lunes' THEN 1
                        WHEN 'Martes' THEN 2
                        WHEN 'Miércoles' THEN 3
                        WHEN 'Jueves' THEN 4
                        WHEN 'Viernes' THEN 5
                        WHEN 'Sábado' THEN 6
                        WHEN 'Domingo' THEN 7
                    END
            )
            FROM weekly_calendar
        ),
        'summary', jsonb_build_object(
            'total_weekly_hours', (SELECT ROUND(SUM(total_weekly_hours), 2) FROM clinic_summary),
            'working_days', (SELECT COUNT(*) FROM weekly_calendar WHERE block_count > 0),
            'total_clinics', (SELECT COUNT(DISTINCT clinic_id) FROM clinic_summary),
            'modalidades', v_modalidades
        )
    ) INTO v_availability;
    
    -- Agregar estadísticas si se solicitan
    IF p_include_stats THEN
        WITH appointment_stats AS (
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending_confirmation' AND appointment_datetime >= NOW()) AS upcoming,
                COUNT(*) FILTER (WHERE status = 'completed' AND appointment_datetime >= NOW() - INTERVAL '30 days') AS completed_month,
                AVG(duration_minutes) AS avg_duration
            FROM appointments
            WHERE therapist_id = p_therapist_id
                AND (p_clinic_id IS NULL OR clinic_id = (
                    SELECT id::TEXT::INTEGER FROM clinics WHERE id = p_clinic_id LIMIT 1
                ))
        )
        SELECT v_availability || jsonb_build_object(
            'appointment_stats', jsonb_build_object(
                'upcoming_appointments', upcoming,
                'completed_last_30_days', completed_month,
                'average_appointment_duration', ROUND(avg_duration, 0)
            )
        ) INTO v_availability
        FROM appointment_stats;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'therapist_id', p_therapist_id,
        'data', v_availability,
        'generated_at', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: handle_new_therapist_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_therapist_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  default_city_id   INTEGER;
  v_primary_color   text;
  v_secondary_color text;
  v_typography      text;

  v_full_name  text;
  v_headline   text;
  v_about_me   text;
  v_slug       text;
  v_landing_id uuid;
BEGIN
  --------------------------------------------------------------------
  -- 0. Solo aplica para usuarios con rol 'therapist'
  --------------------------------------------------------------------
  IF NEW.role <> 'therapist'::user_role THEN
    RETURN NEW;
  END IF;

  --------------------------------------------------------------------
  -- 1. Ciudad por defecto (determinista)
  --------------------------------------------------------------------
  BEGIN
    SELECT id
    INTO default_city_id
    FROM ubication_cities
    ORDER BY id ASC
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      -- Si aún no tienes esta tabla, simplemente no seteamos ciudad
      default_city_id := NULL;
    WHEN OTHERS THEN
      default_city_id := NULL;
  END;

  --------------------------------------------------------------------
  -- 2. Estilos base (si existe tabla de estilos globales)
  --------------------------------------------------------------------
  BEGIN
    SELECT primary_color, secondary_color, typography
    INTO v_primary_color, v_secondary_color, v_typography
    FROM default_style_settings
    LIMIT 1;
  EXCEPTION
    WHEN undefined_table THEN
      v_primary_color   := NULL;
      v_secondary_color := NULL;
      v_typography      := NULL;
    WHEN OTHERS THEN
      v_primary_color   := NULL;
      v_secondary_color := NULL;
      v_typography      := NULL;
  END;

  v_primary_color   := COALESCE(v_primary_color,   '#00A8CC');
  v_secondary_color := COALESCE(v_secondary_color, '#F2F2F2');
  v_typography      := COALESCE(v_typography,      'Inter');

  --------------------------------------------------------------------
  -- 3. Nombre completo desde profiles
  --------------------------------------------------------------------
  SELECT full_name
  INTO v_full_name
  FROM profiles
  WHERE id = NEW.id;

  v_full_name := COALESCE(v_full_name, 'Tu terapeuta');

  v_headline := format(
    'Terapia fonoaudiológica para potenciar la comunicación de %s',
    v_full_name
  );

  v_about_me := format(
    '%s ofrece un enfoque humano, basado en evidencia y diseñado para acompañar a familias y pacientes en procesos de cambio reales.',
    v_full_name
  );

  --------------------------------------------------------------------
  -- 4. Crear/asegurar therapist_details
  --------------------------------------------------------------------
  INSERT INTO public.therapist_details (
    user_id,
    registration_supersalud,
    registration_secreduc,
    about_me,
    logo_url,
    primary_color,
    secondary_color,
    typography,
    created_at,
    updated_at,
    headline_statement,
    city_id,
    main_address,
    avatar_url
  )
  VALUES (
    NEW.id,
    'Pendiente',
    'Pendiente',
    v_about_me,
    NULL,
    v_primary_color,
    v_secondary_color,
    v_typography,
    NOW(),
    NOW(),
    v_headline,
    default_city_id,
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    about_me         = EXCLUDED.about_me,
    primary_color    = EXCLUDED.primary_color,
    secondary_color  = EXCLUDED.secondary_color,
    typography       = EXCLUDED.typography,
    headline_statement = EXCLUDED.headline_statement,
    city_id          = COALESCE(EXCLUDED.city_id, therapist_details.city_id),
    updated_at       = NOW();

  --------------------------------------------------------------------
  -- 5. Slug único para la landing
  --------------------------------------------------------------------
  v_slug := generate_unique_slug(
    v_full_name,
    'therapist_landing_pages',
    'custom_url'
  );

  --------------------------------------------------------------------
  -- 6. Crear landing principal
  --------------------------------------------------------------------
  BEGIN
    INSERT INTO public.therapist_landing_pages (
      therapist_id,
      custom_url,
      hero_title,
      hero_subtitle,
      seo_title,
      seo_description,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      v_slug,
      format('Terapia con %s', v_full_name),
      'Sesiones personalizadas para avanzar en comunicación, lenguaje y calidad de vida.',
      format('Terapia fonoaudiológica con %s | Fonokit', v_full_name),
      'Reserva horas, conoce el enfoque terapéutico y agenda tu primera sesión en pocos clics.',
      NOW(),
      NOW()
    )
    ON CONFLICT (therapist_id) DO UPDATE
    SET
      custom_url       = EXCLUDED.custom_url,
      updated_at       = NOW()
    RETURNING id INTO v_landing_id;
  EXCEPTION
    WHEN undefined_table THEN
      -- Si aún no tienes therapist_landing_pages, no rompemos nada
      v_landing_id := NULL;
  END;

  --------------------------------------------------------------------
  -- 7. Secciones base de la landing (opcional, protegidas)
  --------------------------------------------------------------------
  IF v_landing_id IS NOT NULL THEN
    BEGIN
      -- Hero
      INSERT INTO public.landing_sections(landing_id, section_type, title, content, position)
      VALUES
        (v_landing_id, 'hero', 'Bienvenido/a', v_headline, 1)
      ON CONFLICT DO NOTHING;

      -- Enfoque / Sobre mí
      INSERT INTO public.landing_sections(landing_id, section_type, title, content, position)
      VALUES
        (
          v_landing_id,
          'about',
          'Mi enfoque terapéutico',
          v_about_me,
          2
        )
      ON CONFLICT DO NOTHING;

      -- Servicios
      INSERT INTO public.landing_sections(landing_id, section_type, title, content, position)
      VALUES
        (
          v_landing_id,
          'services',
          'Servicios que ofrezco',
          'Evaluación inicial, intervención individual, orientación a familias y seguimiento en el tiempo.',
          3
        )
      ON CONFLICT DO NOTHING;

      -- Testimonios (placeholder)
      INSERT INTO public.landing_sections(landing_id, section_type, title, content, position)
      VALUES
        (
          v_landing_id,
          'testimonials',
          'Testimonios',
          'Pronto podrás ver aquí historias reales de familias que han confiado en este proceso.',
          4
        )
      ON CONFLICT DO NOTHING;

      -- CTA final
      INSERT INTO public.landing_sections(landing_id, section_type, title, content, position)
      VALUES
        (
          v_landing_id,
          'cta',
          '¿Damos el primer paso?',
          'Agenda una primera sesión o reunión breve para entender tu caso y ver cómo podemos ayudarte.',
          5
        )
      ON CONFLICT DO NOTHING;

    EXCEPTION
      WHEN undefined_table THEN
        -- Si no existe landing_sections, se ignora silenciosamente
        NULL;
    END;
  END IF;

  --------------------------------------------------------------------
  -- 8. CTAs base (agenda + contacto) – opcional
  --------------------------------------------------------------------
  IF v_landing_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.landing_call_to_actions(landing_id, cta_text, cta_url, style)
      VALUES
        (v_landing_id, 'Agendar una sesión', '/agenda', 'primary'),
        (v_landing_id, 'Escríbeme por WhatsApp', '/contacto', 'secondary')
      ON CONFLICT DO NOTHING;
    EXCEPTION
      WHEN undefined_table THEN
        NULL;
    END;
  END IF;

  --------------------------------------------------------------------
  -- 9. Onboarding interno del terapeuta (checklist) – opcional
  --------------------------------------------------------------------
  BEGIN
    INSERT INTO public.therapist_onboarding_tasks(
      therapist_id,
      task_key,
      title,
      description,
      is_completed,
      created_at
    )
    VALUES
      (NEW.id, 'complete_profile', 'Completa tu perfil profesional', 'Agrega foto, especialidades y una biografía corta.', false, NOW()),
      (NEW.id, 'connect_calendar', 'Conecta tu agenda', 'Sincroniza tu disponibilidad para que los pacientes puedan agendar online.', false, NOW()),
      (NEW.id, 'publish_services', 'Configura tus servicios', 'Define tipos de sesión, modalidades y valores.', false, NOW()),
      (NEW.id, 'share_landing', 'Comparte tu página', 'Envía tu landing page a tus pacientes o publícala en redes.', false, NOW())
    ON CONFLICT DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;

  --------------------------------------------------------------------
  -- 10. Placeholder de media (portada / video) – opcional
  --------------------------------------------------------------------
  BEGIN
    INSERT INTO public.therapist_media_assets(
      therapist_id,
      asset_type,
      title,
      description,
      url,
      created_at
    )
    VALUES (
      NEW.id,
      'hero_image',
      'Portada inicial',
      'Imagen de portada por defecto para tu página profesional.',
      '/assets/default/hero-therapy.jpg',
      NOW()
    )
    ON CONFLICT DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      NULL;
  END;

  --------------------------------------------------------------------
  -- Fin
  --------------------------------------------------------------------
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_therapist_profile_and_branding(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_therapist_profile_and_branding() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_default_city_id INTEGER;
  v_slug text;
BEGIN
  ------------------------------------------------------------------
  -- Ejecutar solo cuando el nuevo usuario es un terapeuta
  ------------------------------------------------------------------
  IF NEW.role <> 'therapist' THEN
    RETURN NEW;
  END IF;

  ------------------------------------------------------------------
  -- Obtener ciudad predeterminada (si falla, queda NULL)
  ------------------------------------------------------------------
  BEGIN
    SELECT id INTO v_default_city_id
    FROM ubication_cities
    ORDER BY id
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      v_default_city_id := NULL;
  END;

  ------------------------------------------------------------------
  -- Generación del SLUG único
  ------------------------------------------------------------------
  v_slug := public.generate_unique_slug(
                COALESCE(NEW.full_name, NEW.id::text),
                'therapist_details',
                'slug'
            );

  ------------------------------------------------------------------
  -- Crear therapist_details si no existe
  ------------------------------------------------------------------
  INSERT INTO public.therapist_details (
    user_id,
    registration_supersalud,
    registration_secreduc,
    social_instagram_url,
    social_facebook_url,
    social_linkedin_url,
    social_twitter_url,
    about_me,
    headline_statement,
    main_address,
    created_at,
    updated_at,
    public_email,
    is_public,
    specialization_areas,
    languages,
    professional_title,
    university,
    graduation_year,
    city_id,
    slug
  )
  VALUES (
    NEW.id,
    'Pendiente',
    'Pendiente',
    '',
    '',
    '',
    '',
    'Profesional de fonoaudiología',
    'Especialista en Trastornos de la Comunicación',
    'Dirección pendiente',
    NOW(),
    NOW(),
    NEW.email,
    false,
    ARRAY[]::text[],
    ARRAY['Español']::text[],
    '',
    '',
    NULL,
    v_default_city_id,
    v_slug
  )
  ON CONFLICT (user_id) DO NOTHING;

  ------------------------------------------------------------------
  -- Crear therapist_branding si no existe
  ------------------------------------------------------------------
  INSERT INTO public.therapist_branding (
    therapist_id,
    primary_color,
    secondary_color,
    font_family,
    logo_url,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    '#00A8CC', -- primario default
    '#F2F2F2', -- secundario default
    'Arial',
    NULL,
    NULL,   -- avatar inicial
    NOW(),
    NOW()
  )
  ON CONFLICT (therapist_id) DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_role user_role;
  v_full_name TEXT;
  v_rut TEXT;
BEGIN
  -- Log the start of the function execution for debugging purposes.
  RAISE NOTICE '[handle_new_user] - Trigger fired for new user: %', NEW.email;

  -- Safely determine the user's role from metadata, with 'patient' as a robust fallback.
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    IF v_role IS NULL THEN
      v_role := 'patient';
      RAISE NOTICE '[handle_new_user] - Role is NULL in metadata, falling back to ''patient'' for user: %', NEW.email;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_role := 'patient';
      RAISE WARNING '[handle_new_user] - Invalid role value in metadata for user: %. Falling back to ''patient''.', NEW.email;
  END;

  -- Extract full_name and rut from metadata, handling different possible keys and providing defaults.
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    'Usuario'
  );
  v_rut := NEW.raw_user_meta_data->>'rut';

  -- Insert the new user into the public.profiles table.
  -- This is the critical step that syncs auth.users with public.profiles.
  INSERT INTO public.profiles (id, email, role, full_name, rut, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_full_name,
    v_rut,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[handle_new_user] - Successfully created profile for user: % with role: %', NEW.email, v_role;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log any unexpected errors to the database logs to prevent silent failures.
    RAISE EXCEPTION '[handle_new_user] - FAILED to create profile for user ID: %. Error: %', NEW.id, SQLERRM;
END;
$$;


--
-- Name: handle_new_user_profile(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_profile() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, rut, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'rut',
    (NEW.raw_user_meta_data->>'role')::user_role
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(VARIADIC roles text[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.role::text) = any (select lower(r) from unnest(roles) r)
  );
$$;


--
-- Name: increment_activity_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_activity_usage(activity_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE therapist_exercises 
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = activity_id;
END;
$$;


--
-- Name: increment_coupon_usage(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_coupon_usage(p_coupon_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE discount_coupons
  SET 
    used_count = COALESCE(used_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_coupon_id;
END;
$$;


--
-- Name: increment_template_version(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_template_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si no se especifica version_number, calcular el siguiente
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM template_versions
        WHERE template_id = NEW.template_id
        AND template_type = NEW.template_type;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: increment_view_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_view_count(p_item_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE marketplace_items 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_item_id;
END;
$$;


--
-- Name: initialize_therapist_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_therapist_profile(user_uuid uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Asegurar que existe el registro en therapist_details
    INSERT INTO therapist_details (user_id, created_at, updated_at)
    VALUES (user_uuid, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Asegurar que el rol está correctamente configurado
    UPDATE profiles 
    SET role = 'terapeuta' 
    WHERE id = user_uuid;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;


--
-- Name: is_city_in_region(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_city_in_region(p_city_id integer, p_region_id integer) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  -- Si alguno de los IDs es nulo, no podemos validar, así que lo permitimos.
  IF p_city_id IS NULL OR p_region_id IS NULL THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.cities
    WHERE id = p_city_id AND region_id = p_region_id
  );
END;
$$;


--
-- Name: is_clinic_owner(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_clinic_owner(p_clinic_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM clinics
    WHERE id = p_clinic_id AND therapist_id = auth.uid()
  );
$$;


--
-- Name: is_user_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_admin(uid uuid) RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT role = 'admin'
  FROM public.profiles
  WHERE id = uid
$$;


--
-- Name: is_user_therapist(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_therapist(user_id_param uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Esta función se ejecuta con los permisos del definidor,
  -- lo que le permite leer la tabla 'profiles' sin activar sus políticas RLS para esta consulta.
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id_param AND role = 'therapist'
  );
END;
$$;


--
-- Name: keep_immutable_created_at_log(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.keep_immutable_created_at_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.immutable_created_at_log := OLD.immutable_created_at_log;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: link_patient_by_email(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_patient_by_email(p_therapist_id uuid, p_patient_email text) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_profile RECORD;
    v_patient RECORD;
    v_patient_id uuid;
BEGIN
    -------------------------------------------------------------------
    -- 1. Validación
    -------------------------------------------------------------------
    IF p_patient_email IS NULL OR trim(p_patient_email) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'missing_email',
            'message', 'Debes ingresar un correo válido.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 2. Buscar perfil real del paciente
    -------------------------------------------------------------------
    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE email = p_patient_email
    LIMIT 1;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'patient_not_registered',
            'message', 'El paciente no está registrado en Fonokit.'
        );
    END IF;

    -------------------------------------------------------------------
    -- 3. ¿Ya existe la relación terapeuta ↔ paciente?
    -------------------------------------------------------------------
    SELECT *
    INTO v_patient
    FROM public.patients
    WHERE therapist_id = p_therapist_id
      AND profile_id = v_profile.id
    LIMIT 1;

    IF v_patient.id IS NOT NULL THEN
        -- Si está archivado → reactivar
        IF v_patient.status = 'archived' THEN
            UPDATE public.patients
            SET status = 'active', updated_at = NOW()
            WHERE id = v_patient.id;
        END IF;

        v_patient_id := v_patient.id;

        RETURN jsonb_build_object(
            'success', true,
            'patient_id', v_patient_id,
            'profile', jsonb_build_object(
                'id', v_profile.id,
                'full_name', v_profile.full_name,
                'email', v_profile.email,
                'phone', v_profile.phone,
                'rut', v_profile.rut
            ),
            'message', 'El paciente ya estaba asociado (se reactivó si era necesario).'
        );
    END IF;

    -------------------------------------------------------------------
    -- 4. Crear relación nueva
    -------------------------------------------------------------------
    INSERT INTO public.patients (
        therapist_id,
        profile_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_therapist_id,
        v_profile.id,
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_patient_id;

    -------------------------------------------------------------------
    -- 5. Respuesta final
    -------------------------------------------------------------------
    RETURN jsonb_build_object(
        'success', true,
        'patient_id', v_patient_id,
        'profile', jsonb_build_object(
            'id', v_profile.id,
            'full_name', v_profile.full_name,
            'email', v_profile.email,
            'phone', v_profile.phone,
            'rut', v_profile.rut
        ),
        'message', 'Paciente vinculado correctamente.'
    );

END;
$$;


--
-- Name: link_patient_to_therapist(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_patient_to_therapist(p_profile_id uuid, p_therapist_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_patient_id uuid;
BEGIN
    -- ¿Ya existe la relación?
    SELECT id INTO v_patient_id
    FROM patients
    WHERE profile_id = p_profile_id
      AND therapist_id = p_therapist_id
    LIMIT 1;

    IF v_patient_id IS NOT NULL THEN
        RETURN v_patient_id;
    END IF;

    -- Crear relación nueva
    INSERT INTO patients (
        profile_id,
        therapist_id,
        status,
        created_at,
        updated_at
    )
    VALUES (
        p_profile_id,
        p_therapist_id,
        'active',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_patient_id;

    RETURN v_patient_id;
END;
$$;


--
-- Name: list_patients_paginated(uuid, integer, integer, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.list_patients_paginated(p_therapist_id uuid, p_page integer DEFAULT 0, p_page_size integer DEFAULT 20, p_status text DEFAULT 'active'::text, p_search_term text DEFAULT NULL::text, p_sort_by text DEFAULT 'name_asc'::text) RETURNS TABLE(id uuid, full_name text, email text, phone text, last_visit date, next_visit date, patient_status text, total_results integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_offset integer;
BEGIN
    v_offset := p_page * p_page_size;

    RETURN QUERY
    WITH patient_base AS (
        SELECT
            pt.id,
            pr.full_name,
            pr.email,
            pr.phone,
            pr.birthdate,
            pr.gender,
            pr.rut,
            pt.created_at,
            COALESCE(pt.is_blacklisted, false) AS is_archived
        FROM public.patients pt
        JOIN public.profiles pr
          ON pr.id = pt.profile_id
        WHERE pt.therapist_id = p_therapist_id
        AND (
            (p_status = 'active' AND (pt.is_blacklisted IS NULL OR pt.is_blacklisted = false)) OR
            (p_status = 'archived' AND pt.is_blacklisted = true)
        )
        AND (
            p_search_term IS NULL OR
            pr.full_name ILIKE '%' || p_search_term || '%' OR
            pr.email ILIKE '%' || p_search_term || '%' OR
            pr.phone ILIKE '%' || p_search_term || '%'
        )
    ),
    patient_appointments AS (
        SELECT
            a.patient_id,
            MAX(CASE WHEN a.status = 'completed' AND a.date < CURRENT_DATE THEN a.date END) AS last_visit,
            MIN(CASE WHEN a.status = 'scheduled' AND a.date >= CURRENT_DATE THEN a.date END) AS next_visit
        FROM public.appointments a
        WHERE a.therapist_id = p_therapist_id
          AND a.patient_id IN (SELECT id FROM patient_base)
        GROUP BY a.patient_id
    )
    SELECT
        pb.id,
        pb.full_name,
        pb.email,
        pb.phone,
        pa.last_visit,
        pa.next_visit,
        CASE WHEN pb.is_archived THEN 'archived' ELSE 'active' END AS patient_status,
        (SELECT COUNT(*) FROM patient_base) AS total_results
    FROM patient_base pb
    LEFT JOIN patient_appointments pa ON pb.id = pa.patient_id
    ORDER BY
        CASE WHEN p_sort_by = 'name_asc' THEN pb.full_name END ASC,
        CASE WHEN p_sort_by = 'name_desc' THEN pb.full_name END DESC,
        CASE WHEN p_sort_by = 'last_visit_desc' THEN pa.last_visit END DESC NULLS LAST,
        CASE WHEN p_sort_by = 'created_at_desc' THEN pb.created_at END DESC
    LIMIT p_page_size
    OFFSET v_offset;

END;
$$;


--
-- Name: log_report_action(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_report_action() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO report_logs (report_id, user_id, action, details)
        VALUES (NEW.id, NEW.therapist_id, 'create', 
                jsonb_build_object('report_type', NEW.report_type));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != NEW.status THEN
            INSERT INTO report_logs (report_id, user_id, action, details)
            VALUES (NEW.id, NEW.therapist_id, 
                    CASE 
                        WHEN NEW.status = 'validated' THEN 'validate'
                        WHEN NEW.status = 'archived' THEN 'archive'
                        ELSE 'edit'
                    END,
                    jsonb_build_object(
                        'old_status', OLD.status,
                        'new_status', NEW.status
                    ));
        ELSE
            INSERT INTO report_logs (report_id, user_id, action)
            VALUES (NEW.id, NEW.therapist_id, 'edit');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: log_search_params(text, text, integer, integer, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_search_params(p_modalidad text, p_modalidad_clean text, p_result_count integer, p_specialty_id integer, p_region_id integer, p_city_id integer, p_search_term text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO search_logs (
        modalidad_received, 
        modalidad_cleaned, 
        modalidad_length,
        modalidad_char_codes,
        results_count,
        all_params
    ) VALUES (
        p_modalidad,
        p_modalidad_clean,
        CASE WHEN p_modalidad IS NOT NULL THEN length(p_modalidad) ELSE NULL END,
        CASE WHEN p_modalidad IS NOT NULL THEN 
            array(SELECT ascii(unnest(string_to_array(p_modalidad, NULL))))
        ELSE NULL END,
        p_result_count,
        jsonb_build_object(
            'specialty_id', p_specialty_id,
            'region_id', p_region_id,
            'city_id', p_city_id,
            'modalidad', p_modalidad,
            'search_term', p_search_term
        )
    );
END;
$$;


--
-- Name: make_first_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.make_first_admin(admin_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id 
    FROM profiles 
    WHERE email = admin_email;
    
    IF user_id IS NOT NULL THEN
        UPDATE profiles 
        SET role = 'admin' 
        WHERE id = user_id;
        
        UPDATE auth.users 
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', 'admin')
        WHERE id = user_id;
        
        RAISE NOTICE 'Usuario % ahora es administrador', admin_email;
    ELSE
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;
END;
$$;


--
-- Name: mark_all_notifications_as_read(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_all_notifications_as_read(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE notifications
    SET 
        status = 'read',
        read_at = NOW()
    WHERE user_id = p_user_id
    AND status IN ('pending', 'sent');
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    RETURN v_updated;
END;
$$;


--
-- Name: mark_notification_as_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mark_notification_as_read(p_notification_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE notifications
    SET 
        status = 'read',
        read_at = NOW()
    WHERE id = p_notification_id
    AND user_id = p_user_id
    AND status != 'read';
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    RETURN v_updated > 0;
END;
$$;


--
-- Name: match_faq(text, double precision); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_faq(query_text text, threshold double precision DEFAULT 0.3) RETURNS TABLE(id uuid, question text, answer text, similarity double precision)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.question,
    f.answer,
    similarity(f.question, query_text) as similarity
  FROM faq_chatbot f
  WHERE similarity(f.question, query_text) > threshold
  ORDER BY similarity DESC
  LIMIT 1;
END;
$$;


--
-- Name: normalize_role(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_role(in_role text) RETURNS public.user_role
    LANGUAGE plpgsql
    AS $$
DECLARE r text := lower(coalesce(in_role,''));
BEGIN
  IF r IN ('therapist','terapeuta','fonoaudiologo','fonoaudiólogo') THEN
    RETURN 'therapist';
  ELSIF r IN ('clinic','clínica','clinica') THEN
    RETURN 'clinic';
  ELSE
    RETURN 'patient';
  END IF;
END; $$;


--
-- Name: notify_appointment_cancelled(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_appointment_cancelled(p_appointment_id uuid, p_cancelled_by uuid, p_cancellation_reason text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_appointment RECORD;
    v_notify_user_id UUID;
    v_cancelled_by_name TEXT;
    v_cancelled_by_role TEXT;
BEGIN
    -- Obtener datos de la cita
    SELECT 
        a.*,
        p.full_name as patient_name,
        t.full_name as therapist_name,
        c.name as clinic_name
    INTO v_appointment
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    JOIN profiles t ON t.id = a.therapist_id
    LEFT JOIN clinics c ON c.id = a.clinic_id
    WHERE a.id = p_appointment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cita no encontrada: %', p_appointment_id;
    END IF;
    
    -- Determinar quién canceló y a quién notificar
    SELECT full_name INTO v_cancelled_by_name FROM profiles WHERE id = p_cancelled_by;
    
    -- Si el paciente cancela, notificar al terapeuta y viceversa
    IF p_cancelled_by = v_appointment.patient_id THEN
        v_notify_user_id := v_appointment.therapist_id;
        v_cancelled_by_role := 'paciente';
    ELSIF p_cancelled_by = v_appointment.therapist_id THEN
        v_notify_user_id := v_appointment.patient_id;
        v_cancelled_by_role := 'terapeuta';
    ELSE
        -- Si es un admin u otro usuario
        v_notify_user_id := v_appointment.patient_id;
        v_cancelled_by_role := 'administrador';
    END IF;
    
    -- Crear notificación para el usuario afectado
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        status
    ) VALUES (
        v_notify_user_id,
        'appointment_cancelled',
        'Cita Cancelada',
        format('Tu cita del %s a las %s ha sido cancelada por %s. %s',
            to_char(v_appointment.appointment_date, 'DD/MM/YYYY'),
            v_appointment.appointment_time::text,
            v_cancelled_by_name,
            CASE 
                WHEN p_cancellation_reason IS NOT NULL 
                THEN format('Motivo: %s', p_cancellation_reason)
                ELSE ''
            END
        ),
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'cancelled_by', p_cancelled_by,
            'cancelled_by_role', v_cancelled_by_role,
            'cancellation_reason', p_cancellation_reason,
            'therapist_id', v_appointment.therapist_id,
            'patient_id', v_appointment.patient_id,
            'appointment_date', v_appointment.appointment_date,
            'appointment_time', v_appointment.appointment_time
        ),
        'pending'
    ) RETURNING id INTO v_notification_id;
    
    -- Si el terapeuta cancela, también notificar al terapeuta para su registro
    IF p_cancelled_by = v_appointment.therapist_id THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            status
        ) VALUES (
            v_appointment.therapist_id,
            'appointment_cancelled',
            'Confirmación de Cancelación',
            format('Has cancelado la cita con %s del %s a las %s',
                v_appointment.patient_name,
                to_char(v_appointment.appointment_date, 'DD/MM/YYYY'),
                v_appointment.appointment_time::text
            ),
            jsonb_build_object(
                'appointment_id', p_appointment_id,
                'cancelled_by', p_cancelled_by,
                'cancellation_reason', p_cancellation_reason,
                'patient_id', v_appointment.patient_id
            ),
            'pending'
        );
    END IF;
    
    RETURN v_notification_id;
END;
$$;


--
-- Name: notify_new_review(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_new_review(p_review_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_notification_id UUID;
    v_review RECORD;
    v_stars_text TEXT;
BEGIN
    -- Obtener datos de la reseña
    SELECT 
        r.*,
        p.full_name as patient_name,
        t.full_name as therapist_name,
        td.avatar_url as therapist_avatar
    INTO v_review
    FROM reviews r
    JOIN profiles p ON p.id = r.patient_id
    JOIN profiles t ON t.id = r.therapist_id
    LEFT JOIN therapist_details td ON td.user_id = r.therapist_id
    WHERE r.id = p_review_id
    AND r.is_visible = true;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Generar texto de estrellas
    v_stars_text := repeat('⭐', v_review.rating);
    
    -- Crear notificación para el terapeuta
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        status
    ) VALUES (
        v_review.therapist_id,
        'new_review',
        format('Nueva Reseña: %s', v_stars_text),
        format('%s te ha dejado una reseña de %s estrellas: "%s"',
            v_review.patient_name,
            v_review.rating,
            CASE 
                WHEN length(v_review.comment) > 100 
                THEN substring(v_review.comment from 1 for 100) || '...'
                ELSE COALESCE(v_review.comment, 'Sin comentario')
            END
        ),
        jsonb_build_object(
            'review_id', p_review_id,
            'patient_id', v_review.patient_id,
            'patient_name', v_review.patient_name,
            'rating', v_review.rating,
            'comment', v_review.comment,
            'appointment_id', v_review.appointment_id,
            'created_at', v_review.created_at
        ),
        'pending'
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;


--
-- Name: prevent_amount_change_on_paid_invoice(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_amount_change_on_paid_invoice() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('pagada', 'emitida') AND (
         NEW.subtotal     IS DISTINCT FROM OLD.subtotal
      OR NEW.tax_amount   IS DISTINCT FROM OLD.tax_amount
      OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
      OR NEW.amount_paid  IS DISTINCT FROM OLD.amount_paid
    ) THEN
      RAISE EXCEPTION 'No se pueden modificar montos en facturas pagadas o emitidas';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: process_completed_order(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_completed_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_item RECORD;
  v_cloned_plan_id UUID;
BEGIN
  -- Solo procesar cuando cambia a completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    
    -- Procesar cada item de la orden
    FOR v_item IN
      SELECT oi.*, mi.plan_template_id, mi.therapist_plan_template_id, mi.item_type
      FROM order_items oi
      JOIN marketplace_items mi ON oi.marketplace_item_id = mi.id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Si es un plan de tratamiento, clonarlo
      IF v_item.item_type = 'treatment_plan' AND 
         (v_item.plan_template_id IS NOT NULL OR v_item.therapist_plan_template_id IS NOT NULL) THEN
        
        v_cloned_plan_id := clone_purchased_plan(v_item.marketplace_item_id, NEW.buyer_id);
        
        -- Registrar el plan clonado en order_items (opcional)
        UPDATE order_items
        SET commission_amount = v_cloned_plan_id::text -- Hack temporal, mejor agregar campo
        WHERE id = v_item.id;
        
      END IF;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: process_completed_order(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_completed_order(order_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_purchase RECORD;
  v_plan RECORD;
  v_cloned_id UUID;
BEGIN
  -- Get the purchase
  SELECT * INTO v_purchase
  FROM marketplace_purchases
  WHERE id = order_id AND payment_status = 'completed';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Already cloned
  IF v_purchase.cloned_plan_id IS NOT NULL THEN
    RETURN;
  END IF;

  -- Get the marketplace plan
  SELECT * INTO v_plan
  FROM marketplace_plans
  WHERE id = v_purchase.marketplace_plan_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Clone into treatment_plans
  INSERT INTO treatment_plans (
    therapist_id,
    name,
    description,
    duration_weeks,
    is_template,
    is_archived,
    general_objective,
    specific_objectives,
    activities,
    number_of_sessions,
    plan_type,
    target_diagnosis,
    recommended_sessions,
    session_duration_minutes,
    is_global,
    target_population,
    diagnosis_scope,
    notes,
    is_active,
    source_marketplace_item_id,
    marketplace_item_id,
    created_at,
    updated_at
  ) VALUES (
    v_purchase.buyer_id,
    v_plan.name,
    v_plan.description,
    v_plan.duration_weeks,
    true,
    false,
    v_plan.general_objective,
    v_plan.specific_objectives,
    v_plan.activities,
    v_plan.total_sessions,
    'marketplace',
    v_plan.target_diagnosis,
    v_plan.total_sessions,
    v_plan.session_duration_minutes,
    false,
    v_plan.target_population,
    v_plan.diagnosis_scope,
    'Comprado en Marketplace',
    true,
    v_plan.id,
    v_plan.id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_cloned_id;

  -- Update purchase with cloned reference
  UPDATE marketplace_purchases
  SET cloned_plan_id = v_cloned_id,
      updated_at = NOW()
  WHERE id = order_id;

END;
$$;


--
-- Name: remove_specialty_from_therapist(uuid, integer, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_specialty_from_therapist(p_therapist_id uuid, p_specialty_id integer, p_removed_by uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_specialty_name TEXT;
    v_therapist_name TEXT;
    v_remaining_count INTEGER;
    v_has_active_appointments BOOLEAN;
    v_appointments_count INTEGER;
BEGIN
    -- Validar que el terapeuta existe
    SELECT full_name INTO v_therapist_name
    FROM profiles
    WHERE id = p_therapist_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found',
            'message', 'El terapeuta no existe'
        );
    END IF;
    
    -- Obtener nombre de la especialidad
    SELECT name INTO v_specialty_name
    FROM specialties
    WHERE id = p_specialty_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_not_found',
            'message', 'La especialidad no existe'
        );
    END IF;
    
    -- Verificar que tiene esta especialidad
    IF NOT EXISTS(
        SELECT 1 FROM therapist_specialties 
        WHERE therapist_id = p_therapist_id AND specialty_id = p_specialty_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_not_assigned',
            'message', format('No tienes asignada la especialidad: %s', v_specialty_name),
            'specialty_name', v_specialty_name
        );
    END IF;
    
    -- Verificar si hay citas futuras relacionadas con esta especialidad
    -- (Esto es opcional, pero puede ser útil para advertir)
    WITH future_appointments AS (
        SELECT COUNT(*) AS count
        FROM appointments a
        WHERE a.therapist_id = p_therapist_id
            AND a.status = 'scheduled'
            AND a.appointment_date >= CURRENT_DATE
            AND a.notes ILIKE '%' || v_specialty_name || '%'
    )
    SELECT count > 0, count 
    INTO v_has_active_appointments, v_appointments_count
    FROM future_appointments;
    
    -- Contar cuántas especialidades quedarán
    SELECT COUNT(*) - 1 INTO v_remaining_count
    FROM therapist_specialties
    WHERE therapist_id = p_therapist_id;
    
    -- Advertir si es la última especialidad
    IF v_remaining_count = 0 THEN
        -- Decidir si permitir o no (por ahora solo advertimos)
        NULL; -- Podríamos bloquear si queremos forzar al menos una especialidad
    END IF;
    
    -- Eliminar la especialidad
    DELETE FROM therapist_specialties 
    WHERE therapist_id = p_therapist_id AND specialty_id = p_specialty_id;
    
    -- Registrar en el log
    INSERT INTO specialty_change_logs (
        therapist_id,
        action,
        specialty_id,
        specialty_name,
        changed_by,
        change_details
    ) VALUES (
        p_therapist_id,
        'removed',
        p_specialty_id,
        v_specialty_name,
        COALESCE(p_removed_by, p_therapist_id),
        jsonb_build_object(
            'therapist_name', v_therapist_name,
            'reason', p_reason,
            'remaining_specialties', v_remaining_count,
            'had_related_appointments', v_has_active_appointments,
            'related_appointments_count', v_appointments_count,
            'timestamp', NOW()
        )
    );
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', format('Especialidad "%s" removida exitosamente', v_specialty_name),
        'specialty_removed', jsonb_build_object(
            'id', p_specialty_id,
            'name', v_specialty_name
        ),
        'warnings', CASE
            WHEN v_has_active_appointments THEN
                format('Nota: Hay %s citas futuras que podrían estar relacionadas con esta especialidad', v_appointments_count)
            WHEN v_remaining_count = 0 THEN
                'Advertencia: No tienes ninguna especialidad asignada'
            ELSE NULL
        END,
        'current_specialties', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description
                )
                ORDER BY s.name
            )
            FROM therapist_specialties ts
            JOIN specialties s ON ts.specialty_id = s.id
            WHERE ts.therapist_id = p_therapist_id
        ),
        'total_specialties', v_remaining_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: request_withdrawal(uuid, numeric, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_bank_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_request withdrawal_requests%ROWTYPE;
  v_estimated TIMESTAMPTZ;
BEGIN
  -- Lock wallet row
  SELECT * INTO v_wallet FROM wallets 
  WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet no encontrada';
  END IF;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  IF p_amount < 10000 THEN
    RAISE EXCEPTION 'El monto mínimo de retiro es $10.000 CLP';
  END IF;

  v_estimated := NOW() + INTERVAL '14 days';

  -- Crear solicitud
  INSERT INTO withdrawal_requests (user_id, wallet_id, amount, status, bank_account_data, estimated_completion_date)
  VALUES (p_user_id, v_wallet.id, p_amount, 'pending', p_bank_data, v_estimated)
  RETURNING * INTO v_request;

  -- Debitar saldo
  UPDATE wallets SET
    balance      = balance - p_amount,
    last_updated = NOW()
  WHERE id = v_wallet.id;

  -- Registrar transacción
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, reference_type, status)
  VALUES (v_wallet.id, 'debit', p_amount, 'Solicitud de retiro de fondos', v_request.id, 'withdrawal', 'pending');

  -- Notificación
  INSERT INTO notifications (user_id, type, title, message, read)
  VALUES (p_user_id, 'system', 'Solicitud de Retiro Recibida',
    'Tu solicitud por $' || p_amount || ' está siendo procesada.',
    false)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'request_id', v_request.id);

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$_$;


--
-- Name: reschedule_appointment(uuid, uuid, date, time without time zone, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reschedule_appointment(p_appointment_id uuid, p_user_id uuid, p_new_date date, p_new_time time without time zone, p_new_clinic_id uuid DEFAULT NULL::uuid, p_new_modalidad text DEFAULT NULL::text, p_reason text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_appointment RECORD;
    v_user_role TEXT;
    v_hours_until_appointment NUMERIC;
    v_new_clinic_modalidad clinic_attendance_modality;
    v_day_of_week day_of_week;  -- Cambiar de INTEGER a day_of_week
    v_is_available BOOLEAN;
    v_has_conflict BOOLEAN;
    v_reschedule_allowed BOOLEAN := true;
    v_reschedule_message TEXT;
BEGIN
    -- Obtener datos actuales de la cita
    SELECT 
        a.*,
        c.modalidad AS clinic_modalidad
    INTO v_appointment
    FROM appointments a
    JOIN clinics c ON a.clinic_id = c.id
    WHERE a.id = p_appointment_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'appointment_not_found',
            'message', 'La cita no existe'
        );
    END IF;
    
    -- Verificar estado de la cita
    IF v_appointment.status != 'scheduled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_status',
            'message', format('No se puede reprogramar una cita %s', v_appointment.status),
            'current_status', v_appointment.status
        );
    END IF;
    
    -- Determinar rol del usuario
    IF p_user_id = v_appointment.patient_id THEN
        v_user_role := 'patient';
    ELSIF p_user_id = v_appointment.therapist_id THEN
        v_user_role := 'therapist';
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'message', 'No tienes permisos para reprogramar esta cita'
        );
    END IF;
    
    -- Calcular tiempo hasta la cita actual
    v_hours_until_appointment := EXTRACT(EPOCH FROM (
        (v_appointment.appointment_date + v_appointment.appointment_time) - NOW()
    )) / 3600;
    
    -- Política de reprogramación
    IF v_user_role = 'patient' AND v_hours_until_appointment < 48 AND v_hours_until_appointment > 0 THEN
        v_reschedule_message := 'Reprogramación con menos de 48 horas de anticipación';
    END IF;
    
    -- Si no se especifica nueva clínica o modalidad, usar las actuales
    p_new_clinic_id := COALESCE(p_new_clinic_id, v_appointment.clinic_id);
    p_new_modalidad := COALESCE(p_new_modalidad, v_appointment.modalidad);
    
    -- Validar nueva clínica si cambió
    IF p_new_clinic_id != v_appointment.clinic_id THEN
        SELECT modalidad INTO v_new_clinic_modalidad
        FROM clinics
        WHERE id = p_new_clinic_id AND therapist_id = v_appointment.therapist_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_clinic',
                'message', 'La nueva clínica no es válida para este terapeuta'
            );
        END IF;
    ELSE
        v_new_clinic_modalidad := v_appointment.clinic_modalidad;
    END IF;
    
    -- Validar modalidad con la nueva clínica
    IF (p_new_modalidad = 'presencial' AND v_new_clinic_modalidad = 'online') OR 
       (p_new_modalidad = 'online' AND v_new_clinic_modalidad = 'presencial') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'modality_mismatch',
            'message', format('La clínica solo acepta modalidad %s', v_new_clinic_modalidad)
        );
    END IF;
    
    -- Verificar conflictos en el nuevo horario
    SELECT EXISTS(
        SELECT 1
        FROM appointments
        WHERE therapist_id = v_appointment.therapist_id
            AND appointment_date = p_new_date
            AND appointment_time = p_new_time
            AND id != p_appointment_id
            AND status NOT IN ('cancelled', 'no-show')
    ) INTO v_has_conflict;
    
    IF v_has_conflict THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'time_conflict',
            'message', 'Ya existe una cita en el nuevo horario solicitado'
        );
    END IF;
    
    -- Verificar disponibilidad del terapeuta usando conversión
    v_day_of_week := day_number_to_spanish(EXTRACT(DOW FROM p_new_date)::INTEGER);
    
    SELECT EXISTS(
        SELECT 1 
        FROM therapist_availabilities
        WHERE therapist_id = v_appointment.therapist_id
            AND clinic_id = p_new_clinic_id
            AND day_of_week = v_day_of_week  -- Comparar ENUM con ENUM
            AND is_active = true
            AND p_new_time >= start_time
            AND p_new_time + (v_appointment.duration || ' minutes')::INTERVAL <= end_time::TIME
    ) INTO v_is_available;
    
    IF NOT v_is_available THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_available',
            'message', 'El terapeuta no tiene disponibilidad en el nuevo horario'
        );
    END IF;
    
    -- Guardar información anterior en el campo notes
    UPDATE appointments
    SET 
        appointment_date = p_new_date,
        appointment_time = p_new_time,
        clinic_id = p_new_clinic_id,
        modalidad = p_new_modalidad,
        notes = COALESCE(notes, '') || E'\n---\n' || 
                format('[%s] Reprogramado por %s. Fecha anterior: %s %s. Razón: %s',
                    NOW()::DATE,
                    v_user_role,
                    v_appointment.appointment_date,
                    v_appointment.appointment_time::TEXT,
                    COALESCE(p_reason, 'No especificada')
                ),
        updated_at = NOW()
    WHERE id = p_appointment_id;
    
    -- Retornar resultado detallado
    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'rescheduled_by', v_user_role,
        'old_schedule', jsonb_build_object(
            'date', v_appointment.appointment_date,
            'time', v_appointment.appointment_time::TEXT,
            'clinic_id', v_appointment.clinic_id,
            'modalidad', v_appointment.modalidad
        ),
        'new_schedule', jsonb_build_object(
            'date', p_new_date,
            'time', p_new_time::TEXT,
            'clinic_id', p_new_clinic_id,
            'modalidad', p_new_modalidad
        ),
        'changes', jsonb_build_object(
            'date_changed', p_new_date != v_appointment.appointment_date,
            'time_changed', p_new_time != v_appointment.appointment_time,
            'clinic_changed', p_new_clinic_id != v_appointment.clinic_id,
            'modalidad_changed', p_new_modalidad != v_appointment.modalidad
        ),
        'message', COALESCE(v_reschedule_message, 'Cita reprogramada exitosamente'),
        'reason', COALESCE(p_reason, 'No especificada')
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: reschedule_recurring_appointments(uuid, integer, time without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reschedule_recurring_appointments(p_recurring_group_id uuid, p_new_day_of_week integer DEFAULT NULL::integer, p_new_time time without time zone DEFAULT NULL::time without time zone) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_updated_count INTEGER;
  v_days_diff INTEGER;
  v_first_appointment RECORD;
BEGIN
  SELECT * INTO v_first_appointment
  FROM appointments
  WHERE recurring_group_id = p_recurring_group_id
    AND date >= CURRENT_DATE
    AND status NOT IN ('completed', 'cancelled')
  ORDER BY date
  LIMIT 1;
  
  IF v_first_appointment IS NULL THEN
    RETURN 0;
  END IF;
  
  IF p_new_day_of_week IS NOT NULL THEN
    v_days_diff := p_new_day_of_week - EXTRACT(DOW FROM v_first_appointment.date)::INTEGER;
    IF v_days_diff < 0 THEN
      v_days_diff := v_days_diff + 7;
    END IF;
  ELSE
    v_days_diff := 0;
  END IF;
  
  UPDATE appointments
  SET 
    date = CASE 
      WHEN p_new_day_of_week IS NOT NULL 
      THEN date + (v_days_diff || ' days')::INTERVAL
      ELSE date
    END,
    start_time = COALESCE(p_new_time, start_time),
    end_time = CASE 
      WHEN p_new_time IS NOT NULL 
      THEN p_new_time + (duration_minutes || ' minutes')::INTERVAL
      ELSE end_time
    END,
    updated_at = NOW()
  WHERE recurring_group_id = p_recurring_group_id
    AND date >= CURRENT_DATE
    AND status NOT IN ('completed', 'cancelled');
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;


--
-- Name: save_therapist_basic_schedule(uuid, integer, time without time zone, time without time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_therapist_basic_schedule(p_therapist_id uuid, p_day_number integer, p_start_time time without time zone, p_end_time time without time zone, p_consultation_type text DEFAULT 'both'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Eliminar horario anterior para ese día
    DELETE FROM therapist_availabilities
    WHERE therapist_id = p_therapist_id 
    AND day_of_week::TEXT::INTEGER = p_day_number;
    
    -- Insertar nuevo horario
    INSERT INTO therapist_availabilities (
        therapist_id,
        day_of_week,
        start_time,
        end_time,
        consultation_type,
        clinic_id,
        is_active
    ) VALUES (
        p_therapist_id,
        p_day_number::TEXT::day_of_week,
        p_start_time,
        p_end_time,
        p_consultation_type::consultation_type,
        1, -- clinic_id temporal fijo
        true
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Horario guardado exitosamente'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;


--
-- Name: save_therapist_services(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.save_therapist_services(p_therapist_id uuid, p_services jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_service JSONB;
    v_saved_count INTEGER := 0;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    -- Desactivar servicios anteriores (soft delete)
    DELETE FROM therapist_services 
    WHERE therapist_id = p_therapist_id;
    
    -- Insertar nuevos servicios
    FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
    LOOP
        BEGIN
            INSERT INTO therapist_services (
                therapist_id,
                name,
                description,
                duration_minutes,
                price,
                currency,
                type
            ) VALUES (
                p_therapist_id,
                v_service->>'name',
                v_service->>'description',
                COALESCE((v_service->>'duration_minutes')::INTEGER, 60),
                COALESCE((v_service->>'price')::NUMERIC, 0),
                COALESCE(v_service->>'currency', 'CLP'),
                COALESCE(v_service->>'type', 'standard')::service_type
            );
            v_saved_count := v_saved_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                v_errors := v_errors || jsonb_build_object(
                    'service', v_service->>'name',
                    'error', SQLERRM
                );
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', jsonb_array_length(v_errors) = 0,
        'saved_count', v_saved_count,
        'errors', v_errors,
        'message', format('%s prestaciones guardadas', v_saved_count)
    );
END;
$$;


--
-- Name: schedule_appointment(uuid, uuid, text, text, text, uuid, timestamp with time zone, timestamp with time zone, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.schedule_appointment(p_therapist_id uuid, p_clinic_id uuid, p_patient_full_name text, p_patient_email text, p_patient_phone text, p_service_id uuid, p_start timestamp with time zone, p_end timestamp with time zone, p_notes text DEFAULT NULL::text) RETURNS TABLE(appointment_id uuid, start_time timestamp with time zone, end_time timestamp with time zone, clinic_id uuid, patient_id uuid, patient_name text, service_id uuid)
    LANGUAGE plpgsql
    AS $$
declare
  v_patient_id uuid;
  v_appointment_id uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_clinic_id uuid;
  v_service_id uuid;
  v_patient_name text;
begin
  -- Upsert paciente: Intenta encontrar por email primero, luego por nombre/teléfono
  if p_patient_email is not null and length(trim(p_patient_email)) > 0 then
    insert into patients (therapist_id, full_name, email, phone)
    values (p_therapist_id, p_patient_full_name, p_patient_email, p_patient_phone)
    on conflict (therapist_id, email) where email is not null do update
      set full_name = excluded.full_name,
          phone     = coalesce(excluded.phone, patients.phone)
    returning id into v_patient_id;
  end if;

  if v_patient_id is null and p_patient_phone is not null and length(trim(p_patient_phone)) > 0 then
    insert into patients (therapist_id, full_name, email, phone)
    values (p_therapist_id, p_patient_full_name, p_patient_email, p_patient_phone)
    on conflict (therapist_id, full_name, phone) where phone is not null do update
      set email = coalesce(excluded.email, patients.email)
    returning id into v_patient_id;
  end if;

  -- Si aún no se encontró o creó, es un paciente nuevo sin email ni teléfono único
  if v_patient_id is null then
      insert into patients (therapist_id, full_name, email, phone)
      values (p_therapist_id, p_patient_full_name, p_patient_email, p_patient_phone)
      returning id into v_patient_id;
  end if;

  -- Crear cita
  insert into appointments (therapist_id, clinic_id, patient_id, service_id, date, start_time, end_time, notes)
  values (p_therapist_id, p_clinic_id, v_patient_id, p_service_id, p_start::date, p_start::time, p_end::time, p_notes)
  returning id, appointments.start_time, appointments.end_time, appointments.clinic_id, appointments.patient_id, appointments.service_id
  into v_appointment_id, v_start_time, v_end_time, v_clinic_id, v_service_id;

  select full_name into v_patient_name from patients where id = v_patient_id;

  return query select v_appointment_id, p_start, p_end, v_clinic_id, v_patient_id, v_patient_name, v_service_id;
end;
$$;


--
-- Name: schedule_appointment_and_patient(uuid, uuid, uuid, text, text, text, text, date, time without time zone, time without time zone, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.schedule_appointment_and_patient(p_therapist_id uuid, p_clinic_id uuid, p_service_id uuid, p_patient_full_name text, p_patient_email text, p_patient_phone text, p_patient_rut text, p_date date, p_start_time time without time zone, p_end_time time without time zone, p_notes text, p_send_email_reminder boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_patient_id uuid;
    v_appointment_id uuid;
BEGIN
    -- Primero, intenta encontrar al paciente por su email (si se proporciona)
    IF p_patient_email IS NOT NULL AND p_patient_email != '' THEN
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND email = p_patient_email;
    END IF;

    -- Si no se encontró por email, intenta por RUT (si se proporciona)
    IF v_patient_id IS NULL AND p_patient_rut IS NOT NULL AND p_patient_rut != '' THEN
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND rut = p_patient_rut;
    END IF;

    -- Si el paciente no existe, créalo
    IF v_patient_id IS NULL THEN
        INSERT INTO public.patients (therapist_id, full_name, email, phone, rut, notes)
        VALUES (p_therapist_id, p_patient_full_name, p_patient_email, p_patient_phone, p_patient_rut, 'Paciente creado desde la agenda.')
        RETURNING id INTO v_patient_id;
    END IF;

    -- Ahora, crea la cita con el ID del paciente (existente o recién creado)
    INSERT INTO public.appointments (
        therapist_id,
        patient_id,
        clinic_id,
        service_id,
        date,
        start_time,
        end_time,
        notes,
        send_email_reminder
    )
    VALUES (
        p_therapist_id,
        v_patient_id,
        p_clinic_id,
        p_service_id,
        p_date,
        p_start_time,
        p_end_time,
        p_notes,
        p_send_email_reminder
    )
    RETURNING id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$;


--
-- Name: search_courses(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_courses(p_specialty_slug text DEFAULT NULL::text, p_education_level text DEFAULT NULL::text, p_modality text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_results JSONB;
  v_total   INT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM suggested_courses sc
  LEFT JOIN specialties s ON s.id = sc.specialty_id
  WHERE (p_specialty_slug IS NULL OR s.slug = p_specialty_slug)
    AND (p_modality IS NULL OR sc.modality = p_modality);

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_results
  FROM (
    SELECT 
      sc.id, sc.title, sc.institution, sc.modality,
      sc.url, sc.price, sc.duration_hours,
      s.name AS specialty, s.slug AS specialty_slug
    FROM suggested_courses sc
    LEFT JOIN specialties s ON s.id = sc.specialty_id
    WHERE (p_specialty_slug IS NULL OR s.slug = p_specialty_slug)
      AND (p_modality IS NULL OR sc.modality = p_modality)
    ORDER BY sc.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN jsonb_build_object(
    'results',     v_results,
    'total_count', v_total
  );
END;
$$;


--
-- Name: search_patients_basic(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_patients_basic(p_therapist_id uuid, p_search_term text DEFAULT NULL::text) RETURNS TABLE(patient_id uuid, profile_id uuid, full_name text, email text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS patient_id,
        p.profile_id,
        pr.full_name,
        pr.email
    FROM public.patients p
    JOIN public.profiles pr ON pr.id = p.profile_id
    WHERE 
        p.therapist_id = p_therapist_id
        AND p.status = 'active'
        AND (
            p_search_term IS NULL OR 
            pr.full_name ILIKE '%' || p_search_term || '%' OR
            pr.email ILIKE '%' || p_search_term || '%'
        )
    ORDER BY pr.full_name
    LIMIT 20;
END;
$$;


--
-- Name: search_patients_quick(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_patients_quick(p_therapist_id uuid, p_search_term text DEFAULT NULL::text) RETURNS TABLE(id uuid, profile_id uuid, full_name text, email text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        pat.id,
        pat.profile_id,
        pr.full_name,
        pr.email
    FROM 
        public.patients pat
        JOIN public.profiles pr
          ON pr.id = pat.profile_id
    WHERE 
        pat.therapist_id = p_therapist_id
        AND pat.status = 'active'
        AND (
            p_search_term IS NULL OR 
            pr.full_name ILIKE '%' || p_search_term || '%' OR
            pr.email ILIKE '%' || p_search_term || '%'
        )
    ORDER BY 
        pr.full_name
    LIMIT 20;
END;
$$;


--
-- Name: search_similar_clinics(text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_similar_clinics(p_rut_empresa text DEFAULT NULL::text, p_name text DEFAULT NULL::text, p_city_id integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'exact_rut_match', (
      SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'address', c.address,
        'rut_empresa', c.rut_empresa,
        'razon_social', c.razon_social,
        'therapist_count', (SELECT COUNT(*) FROM clinic_therapists ct WHERE ct.clinic_id = c.id AND ct.is_active = true),
        'owner_name', (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id)
      ))
      FROM clinics c
      WHERE c.rut_empresa IS NOT NULL 
        AND c.rut_empresa = REPLACE(REPLACE(REPLACE(COALESCE(p_rut_empresa, ''), '.', ''), '-', ''), ' ', '')
        AND c.is_active = true
    ),
    'name_matches', (
      SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'address', c.address,
        'rut_empresa', c.rut_empresa,
        'similarity', similarity(c.name, COALESCE(p_name, '')),
        'therapist_count', (SELECT COUNT(*) FROM clinic_therapists ct WHERE ct.clinic_id = c.id AND ct.is_active = true),
        'owner_name', (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id)
      ))
      FROM clinics c
      WHERE p_name IS NOT NULL 
        AND p_name != ''
        AND similarity(c.name, p_name) > 0.3
        AND c.is_active = true
      ORDER BY similarity(c.name, p_name) DESC
      LIMIT 5
    ),
    'address_matches', (
      SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'address', c.address,
        'rut_empresa', c.rut_empresa,
        'therapist_count', (SELECT COUNT(*) FROM clinic_therapists ct WHERE ct.clinic_id = c.id AND ct.is_active = true),
        'owner_name', (SELECT p.full_name FROM profiles p WHERE p.id = c.therapist_id)
      ))
      FROM clinics c
      WHERE p_city_id IS NOT NULL 
        AND c.city_id = p_city_id
        AND p_name IS NOT NULL
        AND similarity(c.name, p_name) > 0.2
        AND c.is_active = true
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: search_therapists_by_specialty(integer, integer, text, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_therapists_by_specialty(p_specialty_id integer, p_city_id integer DEFAULT NULL::integer, p_modalidad text DEFAULT NULL::text, p_include_availability boolean DEFAULT true, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_therapists JSONB;
    v_specialty_name TEXT;
    v_total_count INTEGER;
BEGIN
    -- Validar que la especialidad existe
    SELECT name INTO v_specialty_name
    FROM specialties
    WHERE id = p_specialty_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_not_found',
            'message', 'La especialidad no existe'
        );
    END IF;
    
    -- Buscar terapeutas con esa especialidad
    WITH therapist_matches AS (
        SELECT DISTINCT
            t.id,
            t.full_name,
            t.email,
            td.avatar_url,
            td.about_me,
            td.headline_statement,
            td.city_id,
            ci.name AS city_name,
            r.name AS region_name,
            -- Clínicas que coinciden con filtros
            jsonb_agg(DISTINCT 
                jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'modalidad', c.modalidad,
                    'address', c.address,
                    'city', c_city.name
                )
            ) FILTER (
                WHERE c.id IS NOT NULL 
                AND (p_modalidad IS NULL OR c.modalidad = p_modalidad::clinic_attendance_modality OR c.modalidad = 'ambas')
            ) AS matching_clinics,
            -- Todas las especialidades del terapeuta
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', s.id,
                        'name', s.name
                    )
                    ORDER BY 
                        CASE WHEN s.id = p_specialty_id THEN 0 ELSE 1 END,
                        s.name
                )
                FROM therapist_specialties ts2
                JOIN specialties s ON ts2.specialty_id = s.id
                WHERE ts2.therapist_id = t.id
            ) AS specialties,
            -- Estadísticas del terapeuta
            COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') AS completed_appointments,
            AVG(rv.rating) AS average_rating,
            COUNT(DISTINCT rv.id) AS review_count
        FROM therapist_specialties ts
        JOIN profiles t ON ts.therapist_id = t.id
        JOIN therapist_details td ON t.id = td.user_id
        LEFT JOIN ubication_cities ci ON td.city_id = ci.id
        LEFT JOIN ubication_regions r ON ci.region_id = r.id
        LEFT JOIN clinics c ON t.id = c.therapist_id
        LEFT JOIN ubication_cities c_city ON c.city_id = c_city.id
        LEFT JOIN appointments a ON t.id = a.therapist_id
        LEFT JOIN reviews rv ON t.id = rv.therapist_id AND rv.is_visible = true
        WHERE ts.specialty_id = p_specialty_id
            AND (p_city_id IS NULL OR td.city_id = p_city_id OR c.city_id = p_city_id)
        GROUP BY t.id, t.full_name, t.email, td.avatar_url, td.about_me, 
                 td.headline_statement, td.city_id, ci.name, r.name
    ),
    filtered_therapists AS (
        SELECT 
            *,
            -- Calcular próxima disponibilidad aquí
            CASE WHEN p_include_availability THEN
                (
                    SELECT jsonb_build_object(
                        'date', slot_date,
                        'time', slot_time::TEXT,
                        'clinic_id', clinic_id
                    )
                    FROM (
                        SELECT DISTINCT
                            gen_date.date AS slot_date,
                            ta.start_time AS slot_time,
                            ta.clinic_id
                        FROM generate_series(
                            CURRENT_DATE,
                            CURRENT_DATE + INTERVAL '14 days',
                            INTERVAL '1 day'
                        ) gen_date(date)
                        CROSS JOIN therapist_availabilities ta
                        JOIN clinics cl ON ta.clinic_id = cl.id
                        WHERE ta.therapist_id = therapist_matches.id
                            AND ta.day_of_week = EXTRACT(DOW FROM gen_date.date)::INTEGER
                            AND ta.is_active = true
                            AND (p_modalidad IS NULL OR cl.modalidad = p_modalidad::clinic_attendance_modality OR cl.modalidad = 'ambas')
                            AND NOT EXISTS (
                                SELECT 1 FROM appointments apt
                                WHERE apt.therapist_id = therapist_matches.id
                                    AND apt.appointment_date = gen_date.date::DATE
                                    AND apt.appointment_time = ta.start_time
                                    AND apt.status IN ('scheduled', 'blocked')
                            )
                        ORDER BY gen_date.date, ta.start_time
                        LIMIT 1
                    ) next_slot
                )
            ELSE NULL
            END AS next_available_slot
        FROM therapist_matches
        WHERE jsonb_array_length(COALESCE(matching_clinics, '[]'::jsonb)) > 0
        ORDER BY 
            average_rating DESC NULLS LAST,
            completed_appointments DESC,
            full_name
        LIMIT p_limit OFFSET p_offset
    )
    SELECT 
        jsonb_build_object(
            'therapists', COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'id', id,
                        'full_name', full_name,
                        'email', email,
                        'avatar_url', avatar_url,
                        'about_me', LEFT(about_me, 200),
                        'headline_statement', headline_statement,
                        'location', jsonb_build_object(
                            'city_id', city_id,
                            'city', city_name,
                            'region', region_name
                        ),
                        'matching_clinics', matching_clinics,
                        'specialties', specialties,
                        'stats', jsonb_build_object(
                            'completed_appointments', completed_appointments,
                            'average_rating', ROUND(average_rating, 1),
                            'review_count', review_count
                        ),
                        'next_available_slot', next_available_slot,
                        'match_score', 100
                    )
                ),
                '[]'::jsonb
            ),
            'total_count', (
                SELECT COUNT(DISTINCT t.id)
                FROM therapist_specialties ts
                JOIN profiles t ON ts.therapist_id = t.id
                JOIN therapist_details td ON t.id = td.user_id
                LEFT JOIN clinics c ON t.id = c.therapist_id
                WHERE ts.specialty_id = p_specialty_id
                    AND (p_city_id IS NULL OR td.city_id = p_city_id OR c.city_id = p_city_id)
                    AND (p_modalidad IS NULL OR EXISTS (
                        SELECT 1 FROM clinics c2 
                        WHERE c2.therapist_id = t.id 
                        AND (c2.modalidad = p_modalidad::clinic_attendance_modality OR c2.modalidad = 'ambas')
                    ))
            )
        ) INTO v_therapists
    FROM filtered_therapists;
    
    RETURN jsonb_build_object(
        'success', true,
        'search_criteria', jsonb_build_object(
            'specialty_id', p_specialty_id,
            'specialty_name', v_specialty_name,
            'city_id', p_city_id,
            'modalidad', p_modalidad
        ),
        'data', COALESCE(v_therapists, jsonb_build_object(
            'therapists', '[]'::jsonb,
            'total_count', 0
        )),
        'pagination', jsonb_build_object(
            'limit', p_limit,
            'offset', p_offset,
            'has_more', COALESCE((v_therapists->>'total_count')::INTEGER, 0) > (p_offset + p_limit)
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: search_therapists_nearby_v2(numeric, numeric, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_therapists_nearby_v2(p_latitude numeric, p_longitude numeric, p_radius_km integer DEFAULT 50, p_limit integer DEFAULT 10) RETURNS TABLE(therapist_id uuid, full_name text, avatar_url text, city_name text, distance_km numeric, has_clinics boolean, clinics jsonb, specialties text[], rating numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH nearby_cities AS (
        SELECT 
            c.id as city_id,
            c.name as city_name,
            ROUND(
                6371 * acos(
                    LEAST(1.0,
                        cos(radians(p_latitude)) * cos(radians(c.latitude)) *
                        cos(radians(c.longitude) - radians(p_longitude)) +
                        sin(radians(p_latitude)) * sin(radians(c.latitude))
                    )
                )::numeric, 2
            ) as distance_km
        FROM ubication_cities c
        WHERE c.latitude IS NOT NULL 
        AND c.longitude IS NOT NULL
        AND 6371 * acos(
            LEAST(1.0,
                cos(radians(p_latitude)) * cos(radians(c.latitude)) *
                cos(radians(c.longitude) - radians(p_longitude)) +
                sin(radians(p_latitude)) * sin(radians(c.latitude))
            )
        ) <= p_radius_km
    )
    SELECT 
        p.id as therapist_id,
        p.full_name,
        td.avatar_url,
        nc.city_name,
        nc.distance_km,
        CASE WHEN COUNT(cl.id) > 0 THEN true ELSE false END as has_clinics,
        CASE 
            WHEN COUNT(cl.id) > 0 THEN
                jsonb_agg(DISTINCT jsonb_build_object(
                    'id', cl.id,
                    'name', cl.name,
                    'address', cl.address,
                    'modalidad', cl.modalidad::text,
                    'phone', cl.phone
                ))
            ELSE '[]'::jsonb
        END as clinics,
        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as specialties,
        COALESCE(AVG(r.rating), 0)::numeric(3,2) as rating
    FROM profiles p
    INNER JOIN therapist_details td ON p.id = td.user_id
    INNER JOIN nearby_cities nc ON td.city_id = nc.city_id
    LEFT JOIN clinics cl ON p.id = cl.therapist_id
    LEFT JOIN therapist_specialties ts ON p.id = ts.therapist_id
    LEFT JOIN specialties s ON ts.specialty_id = s.id
    LEFT JOIN reviews r ON p.id = r.therapist_id
    GROUP BY p.id, p.full_name, td.avatar_url, nc.city_name, nc.distance_km
    ORDER BY nc.distance_km ASC
    LIMIT p_limit;
END;
$$;


--
-- Name: search_therapists_public(uuid, integer, integer, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_therapists_public(p_specialty_id uuid DEFAULT NULL::uuid, p_region_id integer DEFAULT NULL::integer, p_city_id integer DEFAULT NULL::integer, p_modality text DEFAULT NULL::text, p_search_term text DEFAULT NULL::text) RETURNS TABLE(id uuid, therapist_id uuid, full_name text, public_email text, languages text[], specialization_areas text[], years_experience integer, registration_supersalud text, registration_secreduc text, professional_title text, university text, graduation_year integer, region_id integer, city_id integer, phone text, avg_rating numeric, total_reviews bigint, avatar_url text, public_slug text, headline_statement text, about_me text, city_name text, region_name text, min_price numeric, offers_online boolean, offers_presential boolean, clinics jsonb, specialties text[], fonolevel_score integer, fonolevel_badge text, fonolevel_emoji text, fonolevel_color text, insurances jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_modality_clean text;
BEGIN
  v_modality_clean := lower(trim(p_modality));
  IF v_modality_clean IN ('', 'todas') THEN
    v_modality_clean := NULL;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.id AS therapist_id,
    p.full_name,
    td.public_email,
    td.languages,
    (SELECT array_agg(s.name) FROM public.therapist_specialties ts JOIN public.specialties s ON ts.specialty_id = s.id WHERE ts.therapist_id = p.id) AS specialization_areas,
    td.years_experience,
    td.registration_supersalud,
    td.registration_secreduc,
    td.professional_title,
    td.university,
    td.graduation_year,
    p.region_id,
    p.city_id,
    p.phone,
    (SELECT COALESCE(AVG(pr.rating), 0) FROM public.patient_reviews pr WHERE pr.therapist_id = p.id) AS avg_rating,
    (SELECT COUNT(pr.id) FROM public.patient_reviews pr WHERE pr.therapist_id = p.id) AS total_reviews,
    tb.avatar_url,
    td.slug AS public_slug,
    td.headline_statement,
    td.about_me,
    ci.name AS city_name,
    r.name AS region_name,
    (SELECT MIN(tsvc.price_clp) FROM public.therapist_services tsvc WHERE tsvc.therapist_id = p.id AND tsvc.is_active = true) AS min_price,
    EXISTS(SELECT 1 FROM public.clinics cl WHERE cl.therapist_id = p.id AND cl.modality IN ('online', 'ambas') AND cl.is_active = true) AS offers_online,
    EXISTS(SELECT 1 FROM public.clinics cl WHERE cl.therapist_id = p.id AND cl.modality IN ('presencial', 'ambas') AND cl.is_active = true) AS offers_presential,
    (SELECT jsonb_agg(jsonb_build_object(
      'id', cl.id, 'name', cl.name, 'address', cl.address,
      'modality', cl.modality, 'latitude', cl.latitude, 'longitude', cl.longitude
    )) FROM public.clinics cl WHERE cl.therapist_id = p.id AND cl.is_active = true) AS clinics,
    (SELECT array_agg(s.name) FROM public.therapist_specialties t_spec JOIN public.specialties s ON t_spec.specialty_id = s.id WHERE t_spec.therapist_id = p.id) AS specialties,
    -- FonoLevel
    COALESCE(fl.global_score, 0)::integer AS fonolevel_score,
    COALESCE(fl.global_badge, 'En formacion')::text AS fonolevel_badge,
    COALESCE(fl.global_badge_emoji, '🔹')::text AS fonolevel_emoji,
    COALESCE(fl.global_badge_color, 'gray')::text AS fonolevel_color,
    -- Insurances
    (SELECT jsonb_agg(jsonb_build_object('id', ip.id, 'name', ip.name, 'logo_url', ip.logo_url))
     FROM public.therapist_insurances ti
     JOIN public.insurance_providers ip ON ip.id = ti.insurance_provider_id
     WHERE ti.therapist_id = p.id AND ti.is_active = true AND ip.is_active = true
    ) AS insurances
  FROM
    public.profiles p
  JOIN public.therapist_details td ON p.id = td.user_id
  LEFT JOIN public.therapist_branding tb ON p.id = tb.therapist_id
  LEFT JOIN public.cities ci ON p.city_id = ci.id
  LEFT JOIN public.regions r ON p.region_id = r.id
  LEFT JOIN public.v_reputation_therapist_global fl ON fl.therapist_id = p.id
  WHERE
    p.role = 'therapist' AND td.is_public = true
    AND (p_specialty_id IS NULL OR EXISTS (
      SELECT 1 FROM public.therapist_specialties ts WHERE ts.therapist_id = p.id AND ts.specialty_id = p_specialty_id
    ))
    AND (p_region_id IS NULL OR p.region_id = p_region_id)
    AND (p_city_id IS NULL OR p.city_id = p_city_id)
    AND (v_modality_clean IS NULL OR EXISTS (
      SELECT 1 FROM public.clinics cl WHERE cl.therapist_id = p.id AND (cl.modality::text = v_modality_clean OR cl.modality = 'ambas') AND cl.is_active = true
    ))
    AND (p_search_term IS NULL OR p_search_term = ''
      OR p.full_name ILIKE '%' || p_search_term || '%'
      OR td.professional_title ILIKE '%' || p_search_term || '%'
      OR td.about_me ILIKE '%' || p_search_term || '%'
      OR EXISTS (SELECT 1 FROM public.therapist_specialties t_spec JOIN public.specialties s ON t_spec.specialty_id = s.id WHERE t_spec.therapist_id = p.id AND s.name ILIKE '%' || p_search_term || '%')
    )
  ORDER BY avg_rating DESC NULLS LAST, total_reviews DESC NULLS LAST;
END;
$$;


--
-- Name: search_therapists_with_details(uuid, integer, integer, text, text, text, integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_therapists_with_details(p_specialty_id uuid DEFAULT NULL::uuid, p_region_id integer DEFAULT NULL::integer, p_city_id integer DEFAULT NULL::integer, p_modalidad text DEFAULT NULL::text, p_search_term text DEFAULT NULL::text, p_order text DEFAULT 'relevance'::text, p_days integer DEFAULT 14, p_slot_duration integer DEFAULT 30, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(therapist_id uuid, full_name text, slug text, avatar_url text, specialties text[], modalidades text[], city_name text, region_name text, avg_rating numeric, review_count bigint, headline_statement text, has_availability boolean, available_days jsonb, availability_days_count integer, availability_slots integer, availability_hours numeric, clinics jsonb, fonolevel_score integer, fonolevel_badge text, fonolevel_emoji text, fonolevel_color text, insurances jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_modalidad_clean text;
  v_term text;
BEGIN
  v_modalidad_clean := NULLIF(lower(trim(p_modalidad)), '');
  IF v_modalidad_clean IN ('todas', 'mixta', 'ambas', 'null', '') THEN
    v_modalidad_clean := NULL;
  END IF;
  v_term := NULLIF(trim(p_search_term), '');

  RETURN QUERY
  WITH
  therapist_base AS (
    SELECT DISTINCT p.id
    FROM public.profiles p
    JOIN public.therapist_details td ON td.user_id = p.id
    WHERE p.role = 'therapist'
      AND td.is_public = true
      AND td.slug IS NOT NULL
      AND (p_specialty_id IS NULL OR EXISTS (
        SELECT 1 FROM public.therapist_specialties ts
        WHERE ts.therapist_id = p.id AND ts.specialty_id = p_specialty_id AND ts.is_public = true
      ))
      AND (v_term IS NULL
        OR p.full_name ILIKE '%' || v_term || '%'
        OR td.about_me ILIKE '%' || v_term || '%'
        OR EXISTS (
          SELECT 1 FROM public.therapist_specialties ts
          JOIN public.specialties s ON s.id = ts.specialty_id
          WHERE ts.therapist_id = p.id AND ts.is_public = true AND s.name ILIKE '%' || v_term || '%'
        )
      )
  ),
  location_filtered AS (
    SELECT tb.id FROM therapist_base tb
    WHERE (p_city_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clinic_therapists ct JOIN public.clinics c ON c.id = ct.clinic_id
      WHERE ct.therapist_id = tb.id AND ct.is_active = true AND c.is_active = true AND c.city_id = p_city_id
    ))
    AND (p_city_id IS NOT NULL OR p_region_id IS NULL OR EXISTS (
      SELECT 1 FROM public.clinic_therapists ct JOIN public.clinics c ON c.id = ct.clinic_id
      JOIN public.cities ci ON ci.id = c.city_id
      WHERE ct.therapist_id = tb.id AND ct.is_active = true AND c.is_active = true AND ci.region_id = p_region_id
    ))
  ),
  modality_filtered AS (
    SELECT lf.id FROM location_filtered lf
    WHERE v_modalidad_clean IS NULL OR EXISTS (
      SELECT 1 FROM public.clinic_therapists ct JOIN public.clinics c ON c.id = ct.clinic_id
      WHERE ct.therapist_id = lf.id AND ct.is_active = true AND c.is_active = true
        AND (lower(c.modality::text) = v_modalidad_clean OR lower(c.modality::text) = 'presencial' OR lower(c.modality::text) = 'online')
    )
  ),
  date_series AS (
    SELECT generate_series(CURRENT_DATE, CURRENT_DATE + (p_days - 1), interval '1 day')::date AS d
  ),
  availability AS (
    SELECT
      mf.id AS tid,
      COUNT(*)::int AS free_slots,
      (COUNT(*) * p_slot_duration / 60.0)::numeric AS free_hours,
      COUNT(DISTINCT ds.d)::int AS days_with_availability
    FROM modality_filtered mf
    JOIN date_series ds ON TRUE
    JOIN public.therapist_availabilities ta ON ta.therapist_id = mf.id AND ta.is_active = true
      AND ta.day_of_week = EXTRACT(ISODOW FROM ds.d)::int
    JOIN LATERAL (
      SELECT gs AS slot_start, gs + (p_slot_duration || ' minutes')::interval AS slot_end
      FROM generate_series(
        ds.d::timestamp + ta.start_time,
        ds.d::timestamp + ta.end_time - (p_slot_duration || ' minutes')::interval,
        (p_slot_duration || ' minutes')::interval
      ) AS gs
    ) gen ON TRUE
    LEFT JOIN public.appointments a ON a.therapist_id = mf.id AND a.date = ds.d
      AND a.status IN ('scheduled','confirmed','pending')
      AND a.start_time < gen.slot_end::time AND a.end_time > gen.slot_start::time
    WHERE a.id IS NULL
    GROUP BY mf.id
  ),
  ratings AS (
    SELECT r.therapist_id AS tid, AVG(r.rating)::numeric(3,2) AS avg_r, COUNT(r.id)::bigint AS rev_count
    FROM public.patient_reviews r WHERE r.therapist_id IN (SELECT id FROM modality_filtered)
    GROUP BY r.therapist_id
  )
  SELECT
    p.id,
    p.full_name,
    td.slug,
    tb.avatar_url,
    ARRAY(
      SELECT s.name FROM public.therapist_specialties ts
      JOIN public.specialties s ON s.id = ts.specialty_id
      WHERE ts.therapist_id = p.id AND ts.is_public = true ORDER BY s.name
    ),
    ARRAY(
      SELECT DISTINCT lower(c.modality::text) FROM public.clinic_therapists ct
      JOIN public.clinics c ON c.id = ct.clinic_id
      WHERE ct.therapist_id = p.id AND ct.is_active = true AND c.is_active = true
    ),
    city.name,
    region.name,
    COALESCE(ra.avg_r, 0.00),
    COALESCE(ra.rev_count, 0),
    td.headline_statement,
    EXISTS (SELECT 1 FROM public.therapist_availabilities ta WHERE ta.therapist_id = p.id AND ta.is_active = true),
    (SELECT jsonb_agg(DISTINCT ta.day_of_week ORDER BY ta.day_of_week)
     FROM public.therapist_availabilities ta WHERE ta.therapist_id = p.id AND ta.is_active = true),
    COALESCE(av.days_with_availability, 0),
    COALESCE(av.free_slots, 0),
    COALESCE(av.free_hours, 0.0),
    (SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'address', c.address, 'modality', c.modality))
     FROM public.clinics c WHERE c.therapist_id = p.id AND c.is_active = true),
    COALESCE(fl.global_score, 0),
    COALESCE(fl.global_badge, 'En formacion'),
    COALESCE(fl.global_badge_emoji, '🔹'),
    COALESCE(fl.global_badge_color, 'gray'),
    (SELECT jsonb_agg(jsonb_build_object('id', ip.id, 'name', ip.name, 'logo_url', ip.logo_url))
     FROM public.therapist_insurances ti
     JOIN public.insurance_providers ip ON ip.id = ti.insurance_provider_id
     WHERE ti.therapist_id = p.id AND ti.is_active = true AND ip.is_active = true)
  FROM modality_filtered mf
  JOIN public.profiles p ON p.id = mf.id
  JOIN public.therapist_details td ON td.user_id = p.id
  LEFT JOIN public.therapist_branding tb ON tb.therapist_id = p.id
  LEFT JOIN public.cities city ON p.city_id = city.id
  LEFT JOIN public.regions region ON city.region_id = region.id
  LEFT JOIN availability av ON av.tid = p.id
  LEFT JOIN ratings ra ON ra.tid = p.id
  LEFT JOIN v_reputation_therapist_global fl ON fl.therapist_id = p.id
  ORDER BY
    CASE WHEN lower(p_order) = 'rating' THEN ra.avg_r END DESC NULLS LAST,
    CASE WHEN lower(p_order) = 'availability_hours' THEN av.free_hours END DESC NULLS LAST,
    p.full_name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


--
-- Name: search_therapists_with_reputation(text, integer, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_therapists_with_reputation(p_specialty_slug text DEFAULT NULL::text, p_min_score integer DEFAULT 0, p_badge_level text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'results', COALESCE((
      SELECT json_agg(t) FROM (
        SELECT therapist_id, specialty_name, specialty_icon, final_score,
          badge_label, badge_emoji, badge_color, badge_level,
          education_points, experience_points, unique_patients
        FROM v_reputation_badges
        WHERE (p_specialty_slug IS NULL OR specialty_slug = p_specialty_slug)
          AND final_score >= p_min_score
          AND (p_badge_level IS NULL OR badge_level = p_badge_level)
        ORDER BY final_score DESC
        LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json),
    'legal_disclaimer', 'Nivel de experiencia en Fonokit basado en formación declarada y práctica clínica registrada en la plataforma.'
  ) INTO result;
  RETURN result;
END;
$$;


--
-- Name: set_therapist_specialties(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_therapist_specialties(p_therapist_id uuid, p_specialty_ids uuid[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- seguridad: solo el dueño puede modificarse (o comenta esta línea si usas policies)
  IF p_therapist_id <> auth.uid() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '28000';
  END IF;

  -- borrar las que ya no estén
  DELETE FROM therapist_specialties ts
  WHERE ts.therapist_id = p_therapist_id
    AND (p_specialty_ids IS NULL OR ts.specialty_id <> ALL(p_specialty_ids));

  -- insertar las nuevas (ignora duplicadas por el unique index)
  INSERT INTO therapist_specialties(therapist_id, specialty_id)
  SELECT p_therapist_id, unnest(p_specialty_ids)
  ON CONFLICT (therapist_id, specialty_id) DO NOTHING;
END;
$$;


--
-- Name: slugify(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.slugify(value text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
    DECLARE
      -- character varying(255) because of index limitations
      slug TEXT;
    BEGIN
      -- Remove accents
      slug := unaccent(value);
      -- Convert to lowercase
      slug := lower(slug);
      -- Replace non-alphanumeric characters with a hyphen
      slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
      -- Remove leading and trailing hyphens
      slug := regexp_replace(slug, '^-+|-+$', '', 'g');
      -- Ensure the slug is not empty
      IF slug = '' THEN
        RETURN 'n-a'; -- Or generate a random string
      END IF;
      RETURN slug;
    END;
    $_$;


--
-- Name: suggest_missing_specialties(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.suggest_missing_specialties(p_therapist_id uuid) RETURNS TABLE(out_specialty_id uuid, out_specialty text, out_suggested_score numeric, out_reason text, out_matching_education text[])
    LANGUAGE sql STABLE
    AS $$
  SELECT 
    css.out_specialty_id,
    css.out_specialty,
    css.out_final_score,
    'Formación detectada: ' || ARRAY_TO_STRING(css.out_matching_education, ', '),
    css.out_matching_education
  FROM calculate_specialty_scores(p_therapist_id) css
  WHERE css.out_specialty_id NOT IN (
    SELECT ts.specialty_id 
    FROM therapist_specialties ts 
    WHERE ts.therapist_id = p_therapist_id
  )
  AND css.out_final_score >= 15
  ORDER BY css.out_final_score DESC;
$$;


--
-- Name: sync_appointment_to_clinical_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_appointment_to_clinical_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_summary text;
    v_details jsonb;
BEGIN
    -- Determine summary based on operation type
    IF TG_OP = 'INSERT' THEN
        v_summary := 'Cita programada.';
        v_details := jsonb_build_object('initial_notes', NEW.notes);
    ELSE -- TG_OP = 'UPDATE'
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_summary := 'Estado de la cita actualizado a "' || NEW.status || '".';
        ELSE
            v_summary := NULL; -- Don't overwrite summary if only notes change
        END IF;
        v_details := jsonb_build_object(
            'notes_updated', NEW.notes,
            'status_change', jsonb_build_object('from', OLD.status, 'to', NEW.status)
        );
    END IF;

    -- Upsert the clinical history entry using the simplified function
    PERFORM public.upsert_clinical_history_from_appointment(
        NEW.id,
        NEW.therapist_id,
        NEW.patient_id,
        NEW.status,
        v_summary,
        v_details
    );

    RETURN NEW;
END;
$$;


--
-- Name: sync_therapist_location(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_therapist_location(p_therapist uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_city_id   int;
  v_region_id int;
begin
  -- Tomar la primera clínica ACTIVA del terapeuta (tanto el vínculo como la clínica deben estar activos)
  -- Ordenar por created_at para tener un resultado determinista.
  select 
    c.city_id, 
    c.region_id
  into 
    v_city_id, 
    v_region_id
  from clinic_therapists ct
  join clinics c on c.id = ct.clinic_id and c.is_active = true
  where ct.therapist_id = p_therapist
    and ct.is_active = true
  order by ct.created_at asc, ct.id asc
  limit 1;

  -- Actualizar profiles con la ubicación encontrada.
  -- Si no se encuentra ninguna clínica activa, los valores serán NULL, limpiando la ubicación.
  update public.profiles
     set city_id   = v_city_id,
         region_id = v_region_id,
         updated_at = now()
   where id = p_therapist;
end;
$$;


--
-- Name: sync_therapist_location_from_clinics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_therapist_location_from_clinics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
  v_therapist_id uuid;
begin
  select therapist_id
    into v_therapist_id
  from clinic_therapists
  where clinic_id = NEW.id
    and is_active = true
  limit 1;

  if v_therapist_id is not null then
    perform public.sync_therapist_location(v_therapist_id);
  end if;

  return NEW;
end;
$$;


--
-- Name: sync_therapist_location_trigger(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_therapist_location_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Solo sincronizar cuando la relación queda activa
  IF NEW.is_active = true THEN
    PERFORM public.sync_therapist_location(NEW.therapist_id);
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: test_notification_system(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.test_notification_system() RETURNS TABLE(test_name text, result boolean, details text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_patient_id UUID;
    v_therapist_id UUID;
    v_appointment_id UUID;
    v_review_id UUID;
    v_notification_id UUID;
    v_count INTEGER;
    v_initial_count INTEGER;
BEGIN
    -- Obtener terapeuta existente
    SELECT id INTO v_therapist_id FROM profiles 
    WHERE email = 'joaquin.paredes@fonokit.cl' LIMIT 1;
    
    -- Obtener otro usuario como paciente (puede ser otro terapeuta)
    SELECT id INTO v_patient_id FROM profiles 
    WHERE id != v_therapist_id 
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_patient_id IS NULL OR v_therapist_id IS NULL THEN
        RETURN QUERY SELECT 'Error: No hay suficientes usuarios'::TEXT, 
                           false, 
                           'Se necesitan al menos 2 usuarios en el sistema'::TEXT;
        RETURN;
    END IF;
    
    -- Guardar conteo inicial de notificaciones
    SELECT count_unread_notifications(v_therapist_id) INTO v_initial_count;
    
    -- Test 1: Crear recordatorio sin cita (debe retornar NULL)
    BEGIN
        SELECT create_appointment_reminder(gen_random_uuid()) INTO v_notification_id;
        RETURN QUERY SELECT 'Test 1: Recordatorio sin cita válida'::TEXT, 
                           v_notification_id IS NULL, 
                           'Debe retornar NULL para cita inexistente'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Test 1: Recordatorio sin cita válida'::TEXT, 
                           false, 
                           SQLERRM::TEXT;
    END;
    
    -- Test 2: Crear cita y recordatorio
    BEGIN
        -- Crear una cita temporal
        INSERT INTO appointments (
            patient_id, therapist_id, appointment_date, 
            appointment_time, status
        ) VALUES (
            v_patient_id, v_therapist_id, 
            CURRENT_DATE + INTERVAL '2 days', 
            '10:00:00'::TIME, 'scheduled'
        ) RETURNING id INTO v_appointment_id;
        
        -- Crear recordatorio
        SELECT create_appointment_reminder(v_appointment_id, 24) INTO v_notification_id;
        
        RETURN QUERY SELECT 'Test 2: Crear recordatorio de cita'::TEXT, 
                           v_notification_id IS NOT NULL, 
                           format('Recordatorio creado: %s', v_notification_id)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Test 2: Crear recordatorio de cita'::TEXT, 
                           false, 
                           SQLERRM::TEXT;
    END;
    
    -- Test 3: Notificación de cancelación
    BEGIN
        -- Crear notificación de cancelación
        SELECT notify_appointment_cancelled(
            v_appointment_id, 
            v_patient_id, 
            'Cambio de planes'
        ) INTO v_notification_id;
        
        RETURN QUERY SELECT 'Test 3: Notificación de cancelación'::TEXT, 
                           v_notification_id IS NOT NULL, 
                           format('Notificación creada: %s', v_notification_id)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Test 3: Notificación de cancelación'::TEXT, 
                           false, 
                           SQLERRM::TEXT;
    END;
    
    -- Test 4: Contar notificaciones no leídas
    BEGIN
        SELECT count_unread_notifications(v_therapist_id) INTO v_count;
        RETURN QUERY SELECT 'Test 4: Contar notificaciones no leídas'::TEXT, 
                           v_count > v_initial_count, 
                           format('Notificaciones no leídas: antes=%s, ahora=%s', 
                                  v_initial_count, v_count)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Test 4: Contar notificaciones no leídas'::TEXT, 
                           false, 
                           SQLERRM::TEXT;
    END;
    
    -- Test 5: Obtener notificaciones del terapeuta
    BEGIN
        SELECT COUNT(*) INTO v_count
        FROM get_user_notifications(v_therapist_id, NULL, 10);
        
        RETURN QUERY SELECT 'Test 5: Obtener notificaciones'::TEXT, 
                           v_count > 0, 
                           format('Notificaciones obtenidas: %s', v_count)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Test 5: Obtener notificaciones'::TEXT, 
                           false, 
                           SQLERRM::TEXT;
    END;
    
    -- Limpiar datos de prueba
    DELETE FROM notifications WHERE data->>'appointment_id' = v_appointment_id::TEXT;
    DELETE FROM appointments WHERE id = v_appointment_id;
    
END;
$$;


--
-- Name: trg_fn_sync_therapist_location(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_fn_sync_therapist_location() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  -- El trigger ahora simplemente invoca la función RPC centralizada.
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_therapist_location(OLD.therapist_id);
  ELSE
    PERFORM public.sync_therapist_location(NEW.therapist_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
      RETURN OLD;
  END IF;
  RETURN NEW;
end;
$$;


--
-- Name: trigger_session_to_clinical_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_session_to_clinical_history() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_plan RECORD;
  v_duration integer;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    SELECT 
      pap.patient_id,
      pap.therapist_id,
      pap.name as plan_name
    INTO v_plan
    FROM patient_assigned_plans pap
    WHERE pap.id = NEW.assigned_plan_id;
    
    -- Safely get duration, defaulting to 45 if null
    v_duration := COALESCE(NEW.duration_minutes, 45);
    
    IF v_plan IS NOT NULL THEN
      -- FIX: Usar 'sesion_terapia' en lugar de 'sesion_terapia' (asegurar consistencia)
      -- Nota: El error original mencionaba 'sesion', aquí ya estaba 'sesion_terapia' en el código previo,
      -- pero nos aseguramos de que coincida con clinical_entry_types.
      INSERT INTO clinical_history (
        patient_id,
        therapist_id,
        entry_type,
        entry_date,
        summary,
        session_notes,
        duration_minutes,
        session_state,
        assigned_plan_id,
        details,
        created_at,
        updated_at
      ) VALUES (
        v_plan.patient_id,
        v_plan.therapist_id,
        'sesion_terapia',
        COALESCE(NEW.completed_date, NOW()),
        'Sesión ' || NEW.session_number || ' - ' || v_plan.plan_name,
        NEW.notes,
        v_duration,
        'completed',
        NEW.assigned_plan_id,
        jsonb_build_object(
          'session_id', NEW.id,
          'session_number', NEW.session_number,
          'plan_id', NEW.assigned_plan_id,
          'auto_generated', true
        ),
        NOW(),
        NOW()
      );
      
      UPDATE patient_assigned_plans
      SET 
        completed_sessions = completed_sessions + 1,
        progress_percentage = ROUND(((completed_sessions + 1)::NUMERIC / NULLIF(total_sessions, 0)) * 100, 2),
        updated_at = NOW()
      WHERE id = NEW.assigned_plan_id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


--
-- Name: update_clinic(uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_clinic(p_clinic_id uuid, p_therapist_id uuid, p_updates jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
    v_current_clinic RECORD;
    v_city_name TEXT;
    v_region_name TEXT;
    v_update_count INTEGER := 0;
    v_changes JSONB := '{}'::JSONB;
    v_has_active_appointments BOOLEAN;
BEGIN
    -- Obtener datos actuales de la clínica
    SELECT * INTO v_current_clinic
    FROM clinics
    WHERE id = p_clinic_id AND therapist_id = p_therapist_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'clinic_not_found',
            'message', 'La clínica no existe o no te pertenece'
        );
    END IF;
    
    -- Verificar si hay citas activas (para cambios sensibles)
    SELECT EXISTS(
        SELECT 1 FROM appointments
        WHERE clinic_id = p_clinic_id
        AND status = 'scheduled'
        AND appointment_date >= CURRENT_DATE
    ) INTO v_has_active_appointments;
    
    -- Actualizar nombre
    IF p_updates ? 'name' AND p_updates->>'name' IS DISTINCT FROM v_current_clinic.name THEN
        -- Validar que no exista otro con el mismo nombre
        IF EXISTS(
            SELECT 1 FROM clinics 
            WHERE therapist_id = p_therapist_id 
            AND id != p_clinic_id
            AND LOWER(TRIM(name)) = LOWER(TRIM(p_updates->>'name'))
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'duplicate_clinic_name',
                'message', 'Ya tienes otra clínica con este nombre'
            );
        END IF;
        
        UPDATE clinics SET name = TRIM(p_updates->>'name') WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('name', jsonb_build_object(
            'old', v_current_clinic.name,
            'new', TRIM(p_updates->>'name')
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar dirección
    IF p_updates ? 'address' AND p_updates->>'address' IS DISTINCT FROM v_current_clinic.address THEN
        UPDATE clinics SET address = TRIM(p_updates->>'address') WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('address', jsonb_build_object(
            'old', v_current_clinic.address,
            'new', TRIM(p_updates->>'address')
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar ciudad
    IF p_updates ? 'city_id' AND (p_updates->>'city_id')::INTEGER IS DISTINCT FROM v_current_clinic.city_id THEN
        -- Validar nueva ciudad
        SELECT c.name, r.name 
        INTO v_city_name, v_region_name
        FROM ubication_cities c
        JOIN ubication_regions r ON c.region_id = r.id
        WHERE c.id = (p_updates->>'city_id')::INTEGER;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_city',
                'message', 'La ciudad especificada no es válida'
            );
        END IF;
        
        UPDATE clinics SET city_id = (p_updates->>'city_id')::INTEGER WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('city', jsonb_build_object(
            'old_id', v_current_clinic.city_id,
            'new_id', (p_updates->>'city_id')::INTEGER,
            'new_name', v_city_name,
            'new_region', v_region_name
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar modalidad (CRÍTICO - puede afectar citas)
    IF p_updates ? 'modalidad' AND p_updates->>'modalidad' IS DISTINCT FROM v_current_clinic.modalidad::TEXT THEN
        -- Validar cambio de modalidad si hay citas activas
        IF v_has_active_appointments THEN
            -- Si cambia de 'ambas' a 'presencial' o 'online', verificar citas
            IF v_current_clinic.modalidad = 'ambas' AND p_updates->>'modalidad' IN ('presencial', 'online') THEN
                -- Verificar si hay citas de la modalidad que se elimina
                IF EXISTS(
                    SELECT 1 FROM appointments
                    WHERE clinic_id = p_clinic_id
                    AND status = 'scheduled'
                    AND appointment_date >= CURRENT_DATE
                    AND modalidad != p_updates->>'modalidad'
                ) THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'modalidad_conflict',
                        'message', format('No puedes cambiar a modalidad %s porque tienes citas activas en otra modalidad', p_updates->>'modalidad'),
                        'has_active_appointments', true
                    );
                END IF;
            END IF;
            
            -- No permitir cambiar de presencial a online o viceversa si hay citas
            IF v_current_clinic.modalidad IN ('presencial', 'online') AND 
               p_updates->>'modalidad' IN ('presencial', 'online') AND
               v_current_clinic.modalidad != p_updates->>'modalidad' THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'modalidad_change_blocked',
                    'message', 'No puedes cambiar la modalidad porque tienes citas activas',
                    'current_modalidad', v_current_clinic.modalidad,
                    'has_active_appointments', true
                );
            END IF;
        END IF;
        
        UPDATE clinics SET modalidad = (p_updates->>'modalidad')::clinic_attendance_modality WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('modalidad', jsonb_build_object(
            'old', v_current_clinic.modalidad,
            'new', p_updates->>'modalidad'
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar teléfono
    IF p_updates ? 'phone' AND p_updates->>'phone' IS DISTINCT FROM v_current_clinic.phone THEN
        UPDATE clinics SET phone = p_updates->>'phone' WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object(
            'old', v_current_clinic.phone,
            'new', p_updates->>'phone'
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar email
    IF p_updates ? 'email' AND p_updates->>'email' IS DISTINCT FROM v_current_clinic.email THEN
        -- Validar formato email
        IF p_updates->>'email' IS NOT NULL AND 
           p_updates->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'invalid_email',
                'message', 'El formato del email no es válido'
            );
        END IF;
        
        UPDATE clinics SET email = LOWER(p_updates->>'email') WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('email', jsonb_build_object(
            'old', v_current_clinic.email,
            'new', LOWER(p_updates->>'email')
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar descripción
    IF p_updates ? 'description' AND p_updates->>'description' IS DISTINCT FROM v_current_clinic.description THEN
        UPDATE clinics SET description = p_updates->>'description' WHERE id = p_clinic_id;
        v_changes := v_changes || jsonb_build_object('description', jsonb_build_object(
            'old', LEFT(v_current_clinic.description, 50),
            'new', LEFT(p_updates->>'description', 50),
            'truncated', true
        ));
        v_update_count := v_update_count + 1;
    END IF;
    
    -- Actualizar timestamp
    IF v_update_count > 0 THEN
        UPDATE clinics SET updated_at = NOW() WHERE id = p_clinic_id;
    END IF;
    
    -- Obtener datos actualizados
    SELECT 
        c.*,
        ci.name AS city_name,
        r.name AS region_name
    INTO v_current_clinic
    FROM clinics c
    JOIN ubication_cities ci ON c.city_id = ci.id
    JOIN ubication_regions r ON ci.region_id = r.id
    WHERE c.id = p_clinic_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', p_clinic_id,
        'updates_applied', v_update_count,
        'changes', v_changes,
        'updated_clinic', jsonb_build_object(
            'id', v_current_clinic.id,
            'name', v_current_clinic.name,
            'address', v_current_clinic.address,
            'city', v_current_clinic.city_name,
            'region', v_current_clinic.region_name,
            'modalidad', v_current_clinic.modalidad,
            'phone', v_current_clinic.phone,
            'email', v_current_clinic.email,
            'description', v_current_clinic.description,
            'updated_at', v_current_clinic.updated_at
        ),
        'warnings', CASE 
            WHEN v_has_active_appointments AND v_changes ? 'modalidad' THEN
                'Modalidad actualizada. Verifica que las citas existentes sean compatibles'
            ELSE NULL
        END,
        'message', CASE 
            WHEN v_update_count = 0 THEN 'No se detectaron cambios'
            WHEN v_update_count = 1 THEN 'Clínica actualizada exitosamente'
            ELSE format('Se actualizaron %s campos', v_update_count)
        END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$_$;


--
-- Name: update_clinics_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_clinics_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$;


--
-- Name: update_item_rating_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_item_rating_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_item_id UUID;
BEGIN
  v_item_id := COALESCE(NEW.marketplace_item_id, OLD.marketplace_item_id);
  
  UPDATE marketplace_items
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM marketplace_reviews
      WHERE marketplace_item_id = v_item_id
        AND is_visible = true
        AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM marketplace_reviews
      WHERE marketplace_item_id = v_item_id
        AND is_visible = true
        AND status = 'approved'
    )
  WHERE id = v_item_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_marketplace_item_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_marketplace_item_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_item_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_item_id := OLD.item_id;
  ELSE
    target_item_id := NEW.item_id;
  END IF;

  UPDATE marketplace_items
  SET 
    rating = (SELECT ROUND(CAST(AVG(rating) AS numeric), 1) FROM marketplace_reviews WHERE item_id = target_item_id),
    total_reviews = (SELECT COUNT(*) FROM marketplace_reviews WHERE item_id = target_item_id)
  WHERE id = target_item_id;
  
  RETURN NULL;
END;
$$;


--
-- Name: update_marketplace_item_sales(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_marketplace_item_sales() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE marketplace_items
    SET total_sales = COALESCE(total_sales, 0) + 1
    WHERE id IN (
      SELECT marketplace_item_id 
      FROM order_items 
      WHERE order_id = NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_patient_diagnosis_summary(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_patient_diagnosis_summary() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE patients p SET diagnosis_summary =
    (
      SELECT CONCAT(dc.code, ' — ', dc.name)
      FROM patient_diagnoses pd
      JOIN diagnosis_codes dc ON dc.id = pd.code_id
      WHERE pd.patient_id = p.id
      AND pd.is_primary = true
      AND pd.is_active = true
      ORDER BY pd.diagnosed_at DESC
      LIMIT 1
    )
  WHERE p.id = NEW.patient_id;

  RETURN NEW;
END;
$$;


--
-- Name: update_plan_progress(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_plan_progress() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE public.patient_assigned_plans
  SET 
    completed_sessions = (
      SELECT COUNT(*) FROM public.plan_sessions 
      WHERE assigned_plan_id = NEW.assigned_plan_id AND status = 'completed'
    ),
    progress_percentage = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
         NULLIF(COUNT(*)::numeric, 0)) * 100, 2
      )
      FROM public.plan_sessions 
      WHERE assigned_plan_id = NEW.assigned_plan_id
    ),
    updated_at = now()
  WHERE id = NEW.assigned_plan_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_review(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review(p_review_id uuid, p_comment text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_patient_id UUID;
    v_review_created_at TIMESTAMP WITH TIME ZONE;
    v_hours_since_creation INTEGER;
BEGIN
    -- Obtener datos de la review
    SELECT 
        r.patient_id,
        r.created_at,
        EXTRACT(HOUR FROM NOW() - r.created_at)::INTEGER
    INTO 
        v_patient_id,
        v_review_created_at,
        v_hours_since_creation
    FROM reviews r
    WHERE r.id = p_review_id;

    -- Validación 1: La review existe
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La reseña no existe';
    END IF;

    -- Validación 2: Solo el autor puede editar
    IF v_patient_id != auth.uid() THEN
        RAISE EXCEPTION 'Solo puedes editar tus propias reseñas';
    END IF;

    -- Validación 3: Solo en las primeras 8 horas
    IF v_hours_since_creation > 8 THEN
        RAISE EXCEPTION 'El plazo para editar ha expirado (máximo 8 horas)';
    END IF;

    -- Actualizar solo el comentario
    UPDATE reviews 
    SET comment = p_comment
    WHERE id = p_review_id;

    RETURN true;
END;
$$;


--
-- Name: FUNCTION update_review(p_review_id uuid, p_comment text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_review(p_review_id uuid, p_comment text) IS 'Actualiza solo el comentario de una reseña. Permitido únicamente en las primeras 8 horas después de crearla.';


--
-- Name: update_review_helpful_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_helpful_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_helpful THEN
      UPDATE marketplace_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE marketplace_reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_helpful THEN
      UPDATE marketplace_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE marketplace_reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_helpful != NEW.is_helpful THEN
    IF NEW.is_helpful THEN
      UPDATE marketplace_reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE marketplace_reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_review_report_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_report_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_reviews SET report_count = report_count + 1 WHERE id = NEW.review_id;
    -- Auto-ocultar si tiene muchos reportes
    UPDATE marketplace_reviews SET status = 'flagged', is_visible = false 
    WHERE id = NEW.review_id AND report_count >= 3;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_review_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.pros, ' '), '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.cons, ' '), '')), 'C');
  RETURN NEW;
END;
$$;


--
-- Name: update_review_vote_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_review_vote_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  target_review_id uuid;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_review_id := OLD.review_id;
  ELSE
    target_review_id := NEW.review_id;
  END IF;

  UPDATE marketplace_reviews
  SET 
    helpful_count = (SELECT COUNT(*) FROM marketplace_review_votes WHERE review_id = target_review_id AND vote_type = 'helpful'),
    not_helpful_count = (SELECT COUNT(*) FROM marketplace_review_votes WHERE review_id = target_review_id AND vote_type = 'unhelpful')
  WHERE id = target_review_id;
  
  RETURN NULL;
END;
$$;


--
-- Name: update_session_message_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_session_message_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE ai_chat_sessions 
    SET total_messages = total_messages + 1,
        free_conversations_count = CASE 
            WHEN subscription_status = 'free' THEN free_conversations_count + 1
            ELSE free_conversations_count
        END
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;


--
-- Name: update_team_members_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_team_members_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


--
-- Name: update_therapist_specialties(uuid, integer[], uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_therapist_specialties(p_therapist_id uuid, p_specialty_ids integer[], p_updated_by uuid DEFAULT NULL::uuid, p_update_mode text DEFAULT 'replace'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_therapist_name TEXT;
    v_current_specialty_ids INTEGER[];
    v_to_add INTEGER[];
    v_to_remove INTEGER[];
    v_invalid_ids INTEGER[];
    v_added_count INTEGER := 0;
    v_removed_count INTEGER := 0;
    v_max_specialties INTEGER := 10;
    v_changes_summary JSONB;
BEGIN
    -- Validar modo de actualización
    IF p_update_mode NOT IN ('replace', 'add_only', 'remove_only') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_update_mode',
            'message', 'Modo de actualización inválido. Use: replace, add_only, o remove_only'
        );
    END IF;
    
    -- Validar que el terapeuta existe
    SELECT full_name INTO v_therapist_name
    FROM profiles
    WHERE id = p_therapist_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'therapist_not_found',
            'message', 'El terapeuta no existe'
        );
    END IF;
    
    -- Validar que no se exceda el límite
    IF p_update_mode IN ('replace', 'add_only') AND array_length(p_specialty_ids, 1) > v_max_specialties THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'specialty_limit_exceeded',
            'message', format('No puedes tener más de %s especialidades', v_max_specialties),
            'requested_count', array_length(p_specialty_ids, 1),
            'max_allowed', v_max_specialties
        );
    END IF;
    
    -- Validar que todos los IDs de especialidad existen
    SELECT array_agg(id) INTO v_invalid_ids
    FROM unnest(p_specialty_ids) AS id
    WHERE NOT EXISTS (SELECT 1 FROM specialties WHERE specialties.id = unnest.id);
    
    IF array_length(v_invalid_ids, 1) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'invalid_specialty_ids',
            'message', 'Algunos IDs de especialidad no son válidos',
            'invalid_ids', v_invalid_ids
        );
    END IF;
    
    -- Obtener especialidades actuales
    SELECT array_agg(specialty_id) INTO v_current_specialty_ids
    FROM therapist_specialties
    WHERE therapist_id = p_therapist_id;
    
    v_current_specialty_ids := COALESCE(v_current_specialty_ids, ARRAY[]::INTEGER[]);
    
    -- Calcular cambios según el modo
    IF p_update_mode = 'replace' THEN
        -- Determinar qué agregar y qué quitar
        v_to_add := ARRAY(
            SELECT unnest(p_specialty_ids)
            EXCEPT
            SELECT unnest(v_current_specialty_ids)
        );
        
        v_to_remove := ARRAY(
            SELECT unnest(v_current_specialty_ids)
            EXCEPT
            SELECT unnest(p_specialty_ids)
        );
    ELSIF p_update_mode = 'add_only' THEN
        -- Solo agregar las que no están
        v_to_add := ARRAY(
            SELECT unnest(p_specialty_ids)
            EXCEPT
            SELECT unnest(v_current_specialty_ids)
        );
        v_to_remove := ARRAY[]::INTEGER[];
    ELSE -- remove_only
        -- Solo quitar las especificadas que sí tiene
        v_to_add := ARRAY[]::INTEGER[];
        v_to_remove := ARRAY(
            SELECT unnest(p_specialty_ids)
            INTERSECT
            SELECT unnest(v_current_specialty_ids)
        );
    END IF;
    
    -- Validar que después de los cambios no exceda el límite
    IF array_length(v_current_specialty_ids, 1) - array_length(v_to_remove, 1) + array_length(v_to_add, 1) > v_max_specialties THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'would_exceed_limit',
            'message', format('Los cambios resultarían en más de %s especialidades', v_max_specialties),
            'current_count', array_length(v_current_specialty_ids, 1),
            'would_add', array_length(v_to_add, 1),
            'would_remove', array_length(v_to_remove, 1)
        );
    END IF;
    
    -- Realizar las eliminaciones
    IF array_length(v_to_remove, 1) > 0 THEN
        DELETE FROM therapist_specialties
        WHERE therapist_id = p_therapist_id
        AND specialty_id = ANY(v_to_remove);
        
        v_removed_count := array_length(v_to_remove, 1);
    END IF;
    
    -- Realizar las adiciones
    IF array_length(v_to_add, 1) > 0 THEN
        INSERT INTO therapist_specialties (therapist_id, specialty_id)
        SELECT p_therapist_id, unnest(v_to_add);
        
        v_added_count := array_length(v_to_add, 1);
    END IF;
    
    -- Crear resumen de cambios con nombres
    WITH changes AS (
        SELECT 
            'added' AS action,
            s.id,
            s.name
        FROM specialties s
        WHERE s.id = ANY(v_to_add)
        UNION ALL
        SELECT 
            'removed' AS action,
            s.id,
            s.name
        FROM specialties s
        WHERE s.id = ANY(v_to_remove)
    )
    SELECT jsonb_build_object(
        'added', jsonb_agg(jsonb_build_object('id', id, 'name', name)) FILTER (WHERE action = 'added'),
        'removed', jsonb_agg(jsonb_build_object('id', id, 'name', name)) FILTER (WHERE action = 'removed')
    ) INTO v_changes_summary
    FROM changes;
    
    -- Registrar en el log si hubo cambios
    IF v_added_count > 0 OR v_removed_count > 0 THEN
        INSERT INTO specialty_change_logs (
            therapist_id,
            action,
            specialty_id,
            specialty_name,
            changed_by,
            change_details
        ) VALUES (
            p_therapist_id,
            'bulk_update',
            NULL,
            NULL,
            COALESCE(p_updated_by, p_therapist_id),
            jsonb_build_object(
                'therapist_name', v_therapist_name,
                'update_mode', p_update_mode,
                'added_count', v_added_count,
                'removed_count', v_removed_count,
                'changes', v_changes_summary,
                'timestamp', NOW()
            )
        );
    END IF;
    
    -- Obtener especialidades finales
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE
            WHEN v_added_count = 0 AND v_removed_count = 0 THEN 'No se realizaron cambios'
            WHEN p_update_mode = 'replace' THEN format('Especialidades actualizadas: %s agregadas, %s removidas', v_added_count, v_removed_count)
            WHEN p_update_mode = 'add_only' THEN format('%s especialidades agregadas', v_added_count)
            ELSE format('%s especialidades removidas', v_removed_count)
        END,
        'update_mode', p_update_mode,
        'changes', jsonb_build_object(
            'added_count', v_added_count,
            'removed_count', v_removed_count,
            'details', v_changes_summary
        ),
        'current_specialties', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description
                )
                ORDER BY s.name
            )
            FROM therapist_specialties ts
            JOIN specialties s ON ts.specialty_id = s.id
            WHERE ts.therapist_id = p_therapist_id
        ),
        'total_specialties', (
            SELECT COUNT(*)
            FROM therapist_specialties
            WHERE therapist_id = p_therapist_id
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unexpected_error',
            'message', SQLERRM
        );
END;
$$;


--
-- Name: update_therapist_specialties_safe(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_therapist_specialties_safe(p_therapist_id uuid, p_specialty_ids uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Eliminar las especialidades que ya no están en la lista
    DELETE FROM public.therapist_specialties
    WHERE therapist_id = p_therapist_id
    AND NOT (specialty_id = ANY(p_specialty_ids));

    -- Insertar las nuevas especialidades, ignorando las que ya existen
    INSERT INTO public.therapist_specialties (therapist_id, specialty_id, is_public)
    SELECT p_therapist_id, unnest(p_specialty_ids), true
    ON CONFLICT (therapist_id, specialty_id) DO NOTHING;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: upsert_clinical_history_from_appointment(uuid, uuid, uuid, text, text, jsonb, text, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_clinical_history_from_appointment(p_appointment_id uuid, p_therapist_id uuid, p_patient_id uuid, p_status text, p_summary text, p_details jsonb, p_entry_type text, p_entry_date timestamp with time zone) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.clinical_history (
        appointment_id,
        therapist_id,
        patient_id,
        status,
        summary,
        details,
        entry_type,
        entry_date
    )
    VALUES (
        p_appointment_id,
        p_therapist_id,
        p_patient_id,
        p_status,
        p_summary,
        p_details,
        p_entry_type,
        p_entry_date
    )
    ON CONFLICT (appointment_id)
    DO UPDATE SET
        status = EXCLUDED.status,
        summary = CASE 
                    WHEN EXCLUDED.summary IS NOT NULL AND EXCLUDED.summary <> '' THEN EXCLUDED.summary
                    ELSE public.clinical_history.summary
                  END,
        details = public.clinical_history.details || EXCLUDED.details,
        entry_type = COALESCE(EXCLUDED.entry_type, public.clinical_history.entry_type),
        updated_at = NOW();
END;
$$;


--
-- Name: upsert_patient_and_create_appointment(uuid, uuid, uuid, text, text, text, text, date, time without time zone, time without time zone, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_patient_and_create_appointment(p_therapist_id uuid, p_clinic_id uuid, p_service_id uuid, p_patient_full_name text, p_patient_email text, p_patient_phone text, p_patient_rut text, p_date date, p_start_time time without time zone, p_end_time time without time zone, p_notes text, p_send_email_reminder boolean) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_patient_id uuid;
    v_appointment_id uuid;
    is_new_patient boolean := false;
BEGIN
    -- Lógica de Upsert para el paciente
    IF p_patient_email IS NOT NULL AND p_patient_email != '' THEN
        -- Intentar encontrar por email
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND email = p_patient_email;

        IF v_patient_id IS NOT NULL THEN
            -- Paciente encontrado, actualizarlo
            UPDATE public.patients
            SET full_name = p_patient_full_name, phone = p_patient_phone, rut = p_patient_rut
            WHERE id = v_patient_id;
        ELSE
            -- No se encontró por email, crear nuevo
            is_new_patient := true;
        END IF;
    ELSE
        -- Intentar encontrar por nombre y teléfono
        SELECT id INTO v_patient_id FROM public.patients
        WHERE therapist_id = p_therapist_id AND full_name = p_patient_full_name AND phone = p_patient_phone;
        
        IF v_patient_id IS NOT NULL THEN
             -- Paciente encontrado, actualizarlo
            UPDATE public.patients
            SET email = p_patient_email, rut = p_patient_rut
            WHERE id = v_patient_id;
        ELSE
            -- No se encontró, crear nuevo
            is_new_patient := true;
        END IF;
    END IF;

    IF is_new_patient THEN
         INSERT INTO public.patients (therapist_id, full_name, email, phone, rut, notes)
         VALUES (p_therapist_id, p_patient_full_name, p_patient_email, p_patient_phone, p_patient_rut, 'Paciente creado desde la agenda.')
         RETURNING id INTO v_patient_id;
    END IF;

    -- Crear la cita
    BEGIN
        INSERT INTO public.appointments (
            therapist_id, patient_id, clinic_id, service_id, date,
            start_time, end_time, status, notes, send_email_reminder
        )
        VALUES (
            p_therapist_id, v_patient_id, p_clinic_id, p_service_id, p_date,
            p_start_time, p_end_time, 'scheduled', p_notes, p_send_email_reminder
        )
        RETURNING id INTO v_appointment_id;

    EXCEPTION
        WHEN OTHERS THEN
            -- Si la creación de la cita falla y era un paciente nuevo, revertir la creación del paciente.
            IF is_new_patient AND v_patient_id IS NOT NULL THEN
                DELETE FROM public.patients WHERE id = v_patient_id;
            END IF;
            -- Re-lanzar el error para que el frontend lo capture
            RAISE;
    END;

    RETURN v_appointment_id;
END;
$$;


--
-- Name: upsert_therapist_profile_and_details(uuid, text, text, text, text, integer, integer, date, text, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_therapist_profile_and_details(p_user_id uuid, p_full_name text, p_display_name text, p_bio text, p_street text, p_city_id integer, p_region_id integer, p_birthdate date, p_gender text, p_is_public boolean, p_professional_title text, p_headline_statement text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Actualizar la tabla 'profiles'
    UPDATE profiles
    SET 
        full_name = p_full_name,
        display_name = p_display_name,
        bio = p_bio,
        street = p_street,
        city_id = p_city_id,
        region_id = p_region_id,
        birthdate = p_birthdate,
        gender = p_gender,
        is_public = p_is_public,
        updated_at = now()
    WHERE id = p_user_id;

    -- Upsert (insertar o actualizar) la tabla 'therapist_details'
    INSERT INTO therapist_details (
        user_id, 
        professional_title, 
        headline_statement,
        about_me,
        is_public,
        updated_at
    )
    VALUES (
        p_user_id,
        p_professional_title,
        p_headline_statement,
        p_bio,
        p_is_public,
        now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        professional_title = EXCLUDED.professional_title,
        headline_statement = EXCLUDED.headline_statement,
        about_me = EXCLUDED.about_me,
        is_public = EXCLUDED.is_public,
        updated_at = now();

    -- Upsert (insertar o actualizar) la tabla 'therapist_profiles'
    INSERT INTO therapist_profiles (
      therapist_id,
      headline,
      about_me,
      updated_at
    )
    VALUES (
      p_user_id,
      p_headline_statement,
      p_bio,
      now()
    )
    ON CONFLICT(therapist_id) DO UPDATE SET
      headline = EXCLUDED.headline,
      about_me = EXCLUDED.about_me,
      updated_at = now();
END;
$$;


--
-- Name: upsert_user_profile(uuid, text, text, text, text, text, integer, integer, date, text, boolean, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.upsert_user_profile(p_user_id uuid, p_full_name text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_display_name text DEFAULT NULL::text, p_bio text DEFAULT NULL::text, p_street text DEFAULT NULL::text, p_city_id integer DEFAULT NULL::integer, p_region_id integer DEFAULT NULL::integer, p_birthdate date DEFAULT NULL::date, p_gender text DEFAULT NULL::text, p_is_public boolean DEFAULT NULL::boolean, p_professional_title text DEFAULT NULL::text, p_headline_statement text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET
        full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
        city_id = COALESCE(p_city_id, city_id),
        region_id = COALESCE(p_region_id, region_id),
        birthdate = COALESCE(p_birthdate, birthdate),
        gender = COALESCE(NULLIF(p_gender, ''), gender),
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.therapist_details (user_id, is_public, professional_title, about_me, headline_statement, main_address, updated_at)
    VALUES (p_user_id, COALESCE(p_is_public, false), p_professional_title, p_bio, p_headline_statement, p_street, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        is_public = COALESCE(EXCLUDED.is_public, therapist_details.is_public),
        professional_title = COALESCE(NULLIF(EXCLUDED.professional_title, ''), therapist_details.professional_title),
        headline_statement = COALESCE(NULLIF(EXCLUDED.headline_statement, ''), therapist_details.headline_statement),
        about_me = COALESCE(NULLIF(EXCLUDED.about_me, ''), therapist_details.about_me),
        main_address = COALESCE(NULLIF(EXCLUDED.main_address, ''), therapist_details.main_address),
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'message', 'Perfil actualizado correctamente.');
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', SQLERRM, 'error_code', SQLSTATE);
END;
$$;


--
-- Name: user_has_purchased(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_purchased(p_user_id uuid, p_marketplace_item_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM marketplace_orders mo
    JOIN order_items oi ON mo.id = oi.order_id
    WHERE mo.buyer_id = p_user_id
      AND oi.marketplace_item_id = p_marketplace_item_id
      AND mo.status = 'completed'
  );
END;
$$;


--
-- Name: FUNCTION user_has_purchased(p_user_id uuid, p_marketplace_item_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_purchased(p_user_id uuid, p_marketplace_item_id uuid) IS 'Verifica si un usuario ha comprado un item específico';


--
-- Name: validate_appointment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_appointment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Verificar que no haya superposición de horarios
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND date = NEW.date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status != 'canceled'
      AND (
        (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
        (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Ya existe una cita en ese horario';
  END IF;
  
  -- Verificar horario bloqueado
  IF EXISTS (
    SELECT 1 FROM blocked_times
    WHERE therapist_id = NEW.therapist_id
      AND clinic_id = NEW.clinic_id
      AND DATE(start_time) = NEW.date
      AND (
        (NEW.start_time >= start_time::TIME AND NEW.start_time < end_time::TIME) OR
        (NEW.end_time > start_time::TIME AND NEW.end_time <= end_time::TIME)
      )
  ) THEN
    RAISE EXCEPTION 'El horario está bloqueado';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: validate_appointment_availability(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_appointment_availability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    conflict_count INTEGER;
    v_day_of_week INTEGER;
    v_user_role TEXT;
BEGIN
    -- Obtener el rol del usuario que realiza la acción
    SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();

    -- Si el usuario es un terapeuta, se salta la validación de disponibilidad
    IF v_user_role = 'terapeuta' THEN
        -- Aún así, se verifica que no haya citas que se solapen
        SELECT COUNT(*)
        INTO conflict_count
        FROM appointments
        WHERE therapist_id = NEW.therapist_id
        AND id IS DISTINCT FROM NEW.id
        AND date = NEW.date
        AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time);
        
        IF conflict_count > 0 THEN
            RAISE EXCEPTION 'El terapeuta ya tiene una cita programada en ese horario';
        END IF;

        RETURN NEW;
    END IF;

    -- Lógica original para pacientes y otros roles
    v_day_of_week := EXTRACT(DOW FROM NEW.date);
    IF v_day_of_week = 0 THEN
        v_day_of_week := 7;
    END IF;

    -- Chequeo de citas que se solapan
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointments
    WHERE therapist_id = NEW.therapist_id
    AND id IS DISTINCT FROM NEW.id
    AND date = NEW.date
    AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time);
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'El terapeuta ya tiene una cita programada en ese horario';
    END IF;
    
    -- Chequeo de disponibilidad (solo para no-terapeutas)
    IF NOT EXISTS (
        SELECT 1
        FROM therapist_availabilities
        WHERE therapist_id = NEW.therapist_id
        AND clinic_id = NEW.clinic_id
        AND day_of_week = v_day_of_week
        AND start_time <= NEW.start_time
        AND end_time >= NEW.end_time
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'La cita está fuera del horario de disponibilidad del terapeuta';
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: verify_review_purchase(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_review_purchase() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_order_id UUID;
  v_purchase_date TIMESTAMPTZ;
BEGIN
  -- Buscar si el reviewer compró este item
  SELECT mo.id, mo.created_at INTO v_order_id, v_purchase_date
  FROM marketplace_orders mo
  JOIN order_items oi ON mo.id = oi.order_id
  WHERE mo.buyer_id = NEW.reviewer_id
    AND oi.marketplace_item_id = NEW.marketplace_item_id
    AND mo.status = 'completed'
  ORDER BY mo.created_at DESC
  LIMIT 1;
  
  IF v_order_id IS NOT NULL THEN
    NEW.is_verified_purchase := true;
    NEW.verification_date := NOW();
    NEW.order_id := v_order_id;
    NEW.purchase_date := v_purchase_date;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: wallet_purchase(uuid, numeric, text, text, uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.wallet_purchase(p_buyer_id uuid, p_amount numeric, p_item_id text, p_item_title text, p_seller_id uuid DEFAULT NULL::uuid, p_commission_rate numeric DEFAULT 0.10) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_buyer_wallet RECORD;
  v_seller_wallet RECORD;
  v_seller_amount NUMERIC;
BEGIN
  -- Lock buyer wallet
  SELECT * INTO v_buyer_wallet FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
  IF NOT FOUND OR v_buyer_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Saldo insuficiente');
  END IF;

  -- Debit buyer
  UPDATE wallets SET balance = balance - p_amount, last_updated = NOW() WHERE id = v_buyer_wallet.id;
  INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, reference_type, status)
  VALUES (v_buyer_wallet.id, 'debit', p_amount, 'Compra: ' || p_item_title, p_item_id, 'purchase', 'completed');

  -- Credit seller
  IF p_seller_id IS NOT NULL THEN
    SELECT * INTO v_seller_wallet FROM wallets WHERE user_id = p_seller_id FOR UPDATE;
    IF FOUND THEN
      v_seller_amount := p_amount * (1 - p_commission_rate);
      UPDATE wallets SET balance = balance + v_seller_amount, total_earned = total_earned + v_seller_amount, last_updated = NOW() WHERE id = v_seller_wallet.id;
      INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, reference_type, status)
      VALUES (v_seller_wallet.id, 'credit', v_seller_amount, 'Venta: ' || p_item_title, p_item_id, 'sale', 'completed');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;


--
-- Name: activity_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: activity_library; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_library (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    is_global boolean DEFAULT false,
    category_id uuid,
    name text NOT NULL,
    description text,
    instructions text,
    objectives text,
    default_duration_minutes integer DEFAULT 15,
    materials text,
    difficulty_level text,
    age_range_min integer,
    age_range_max integer,
    tags text[],
    times_used integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT activity_library_difficulty_level_check CHECK ((difficulty_level = ANY (ARRAY['basico'::text, 'intermedio'::text, 'avanzado'::text]))),
    CONSTRAINT prevent_edit_global CHECK ((NOT ((is_global = true) AND (therapist_id IS NOT NULL))))
);


--
-- Name: adir_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adir_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    informant_name text,
    informant_relationship text,
    fecha_evaluacion date DEFAULT CURRENT_DATE NOT NULL,
    examinador text,
    total_a smallint,
    total_b smallint,
    total_c smallint,
    total_d smallint,
    cumple_criterio_a boolean,
    cumple_criterio_b boolean,
    cumple_criterio_c boolean,
    cumple_criterio_d boolean,
    clasificacion text,
    verbal_status text NOT NULL,
    observaciones text,
    status text DEFAULT 'borrador'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    informacion_adicional text
);


--
-- Name: adir_item_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adir_item_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evaluation_id uuid,
    item_code text NOT NULL,
    item_name text,
    domain text NOT NULL,
    section text,
    raw_score smallint,
    algorithm_score smallint,
    period text DEFAULT 'current'::text,
    notes text
);


--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    target_resource text,
    target_id uuid,
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    module text NOT NULL,
    can_read boolean DEFAULT true,
    can_write boolean DEFAULT true,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now()
);


--
-- Name: ados2_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ados2_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    module text NOT NULL,
    algorithm text,
    fecha_evaluacion date,
    examinador text,
    informacion_adicional text,
    status text DEFAULT 'borrador'::text NOT NULL,
    rango_preocupacion text,
    total_as integer,
    total_crr integer,
    total_com integer,
    total_global integer,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ados2_evaluations_status_check CHECK ((status = ANY (ARRAY['borrador'::text, 'completada'::text, 'revisada'::text])))
);


--
-- Name: ados2_item_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ados2_item_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evaluation_id uuid NOT NULL,
    item_code text NOT NULL,
    item_name text NOT NULL,
    domain text NOT NULL,
    raw_score integer,
    algorithm_score integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ados2_item_responses_domain_check CHECK ((domain = ANY (ARRAY['AS'::text, 'CRR'::text, 'COM'::text])))
);


--
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    sender_type public.sender_type_enum NOT NULL,
    message text NOT NULL,
    tokens_used integer,
    model_used text,
    response_time_ms integer,
    analyzed boolean DEFAULT false,
    feedback jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.ai_chat_messages FORCE ROW LEVEL SECURITY;


--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    therapist_id uuid,
    session_type text NOT NULL,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    free_conversations_count integer DEFAULT 0,
    subscription_status text,
    total_messages integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_chat_sessions_session_type_check CHECK ((session_type = ANY (ARRAY['patient'::text, 'therapist'::text, 'anonymous'::text]))),
    CONSTRAINT ai_chat_sessions_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['free'::text, 'trial'::text, 'premium'::text, 'expired'::text]))),
    CONSTRAINT user_reference_check CHECK ((((session_type = 'patient'::text) AND (patient_id IS NOT NULL) AND (therapist_id IS NULL)) OR ((session_type = 'therapist'::text) AND (therapist_id IS NOT NULL) AND (patient_id IS NULL)) OR ((session_type = 'anonymous'::text) AND (patient_id IS NULL) AND (therapist_id IS NULL))))
);

ALTER TABLE ONLY public.ai_chat_sessions FORCE ROW LEVEL SECURITY;


--
-- Name: ai_conversation_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_conversation_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    analysis_type text NOT NULL,
    results jsonb NOT NULL,
    confidence_score numeric(3,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_conversation_analysis_analysis_type_check CHECK ((analysis_type = ANY (ARRAY['sentiment'::text, 'topics'::text, 'recommendations'::text, 'summary'::text])))
);


--
-- Name: ai_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    therapist_id uuid,
    session_id uuid,
    suggestion_id uuid,
    suggestion_type text,
    suggestion_content jsonb,
    status text NOT NULL,
    rating integer,
    comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT ai_feedback_status_check CHECK ((status = ANY (ARRAY['accepted'::text, 'rejected'::text, 'modified'::text, 'pending'::text]))),
    CONSTRAINT ai_feedback_suggestion_type_check CHECK ((suggestion_type = ANY (ARRAY['material'::text, 'activity'::text, 'plan'::text, 'evaluation'::text, 'general'::text])))
);

ALTER TABLE ONLY public.ai_feedback FORCE ROW LEVEL SECURITY;


--
-- Name: ai_plan_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_plan_limits (
    plan_name text NOT NULL,
    max_calls_per_month integer NOT NULL,
    max_tokens_per_month integer NOT NULL,
    model text DEFAULT 'claude-haiku-4-5-20251001'::text NOT NULL
);


--
-- Name: ai_recommendation_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendation_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recommendation_type text NOT NULL,
    recommendation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    patient_context jsonb,
    feedback_type text NOT NULL,
    feedback_score numeric(3,2),
    interaction_duration integer,
    modifications jsonb,
    model_version text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_recommendation_feedback_feedback_type_check CHECK ((feedback_type = ANY (ARRAY['accepted'::text, 'rejected'::text, 'implicit_accept'::text, 'implicit_reject'::text]))),
    CONSTRAINT ai_recommendation_feedback_recommendation_type_check CHECK ((recommendation_type = ANY (ARRAY['material'::text, 'exercise'::text, 'plan'::text, 'activity'::text])))
);

ALTER TABLE ONLY public.ai_recommendation_feedback FORCE ROW LEVEL SECURITY;


--
-- Name: ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    category text DEFAULT 'limits'::text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_usage_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    calls_used integer DEFAULT 0 NOT NULL,
    tokens_used integer DEFAULT 0 NOT NULL,
    plan_name text DEFAULT 'individual'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: arco_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.arco_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    status text DEFAULT 'pending'::text,
    description text,
    response text,
    requested_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    resolved_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: assigned_plan_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assigned_plan_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assigned_plan_id uuid NOT NULL,
    exercise_id uuid,
    activity_id uuid,
    scheduled_date date,
    completed boolean DEFAULT false,
    completed_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_fields text[],
    ip_address inet,
    user_agent text,
    "timestamp" timestamp with time zone DEFAULT now(),
    CONSTRAINT audit_logs_action_check CHECK ((action = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])))
);


--
-- Name: availability_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    action text NOT NULL,
    availability_data jsonb,
    performed_by uuid NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT availability_logs_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'deleted'::text, 'activated'::text, 'deactivated'::text])))
);


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    therapist_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2) DEFAULT 0,
    status public.invoice_status_enum DEFAULT 'borrador'::public.invoice_status_enum NOT NULL,
    due_date date NOT NULL,
    payment_method text,
    payment_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    buyer_id uuid,
    organization_id uuid,
    currency text DEFAULT 'CLP'::text NOT NULL,
    exchange_rate numeric,
    payment_reference text,
    invoice_file_url text,
    immutable_created_at_log timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid
);


--
-- Name: blocked_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blocked_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blocked_times (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    clinic_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_end_time_after_start_time CHECK ((end_time > start_time))
);


--
-- Name: blog_article_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_article_tags (
    article_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: blog_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text,
    excerpt text,
    featured_image_url text,
    meta_description text,
    category_id uuid,
    author_id uuid,
    status text DEFAULT 'draft'::text,
    views_count integer DEFAULT 0,
    published_at timestamp with time zone,
    scheduled_publish_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT blog_articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text, 'archived'::text])))
);


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid,
    user_id uuid,
    content text NOT NULL,
    status text DEFAULT 'pending'::text,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT blog_comments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'spam'::text])))
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    question_id uuid,
    title text NOT NULL,
    content text,
    slug text NOT NULL,
    status text DEFAULT 'pending_review'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    published_at timestamp with time zone,
    excerpt text,
    cover_url text,
    content_html text,
    content_md text,
    author_name text,
    specialty_id uuid,
    subtitle text,
    faq jsonb DEFAULT '[]'::jsonb,
    meta_title text,
    meta_description text,
    keywords text[],
    shareable_quote text,
    category text
);


--
-- Name: blog_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blog_post_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    action text NOT NULL,
    comments text,
    reviewed_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: calendar_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    clinic_id uuid,
    block_type text NOT NULL,
    title text NOT NULL,
    description text,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    is_recurring boolean DEFAULT false,
    recurrence_rule text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT calendar_blocks_block_type_check CHECK ((block_type = ANY (ARRAY['vacation'::text, 'personal'::text, 'meeting'::text, 'lunch'::text, 'other'::text]))),
    CONSTRAINT valid_block_time CHECK ((end_datetime > start_datetime))
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name text NOT NULL,
    region_id integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: clinic_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    rejected_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    CONSTRAINT clinic_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text])))
);


--
-- Name: clinic_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    therapist_id uuid,
    patient_id uuid,
    appointment_id uuid,
    document_type text DEFAULT 'boleta'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    emisor_rut text,
    emisor_razon_social text,
    emisor_giro text,
    emisor_direccion text,
    receptor_rut text,
    receptor_nombre text,
    receptor_giro text,
    receptor_direccion text,
    monto_neto integer DEFAULT 0 NOT NULL,
    monto_iva integer DEFAULT 0 NOT NULL,
    monto_total integer DEFAULT 0 NOT NULL,
    monto_exento integer DEFAULT 0 NOT NULL,
    es_exento boolean DEFAULT false,
    detalle jsonb DEFAULT '[]'::jsonb,
    folio integer,
    track_id text,
    sii_response jsonb,
    pdf_url text,
    periodo text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT clinic_invoices_document_type_check CHECK ((document_type = ANY (ARRAY['boleta'::text, 'factura'::text, 'boleta_honorarios'::text, 'nota_credito'::text]))),
    CONSTRAINT clinic_invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'issued'::text, 'sent_to_sii'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text])))
);


--
-- Name: TABLE clinic_invoices; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinic_invoices IS 'Documentos tributarios electrónicos del centro. Capa 1: pre-documentos gestionados por la clínica. Capa 2: integración API SII.';


--
-- Name: clinic_therapists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_therapists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid,
    therapist_id uuid,
    is_active boolean DEFAULT true,
    joined_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    show_in_public_profile boolean DEFAULT true,
    commission_percent numeric DEFAULT 30,
    CONSTRAINT clinic_therapists_commission_percent_check CHECK (((commission_percent >= (0)::numeric) AND (commission_percent <= (100)::numeric)))
);


--
-- Name: COLUMN clinic_therapists.commission_percent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinic_therapists.commission_percent IS 'Porcentaje que retiene el centro por sesión completada del terapeuta';


--
-- Name: clinical_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_access_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    accessed_by uuid NOT NULL,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT clinical_access_log_action_check CHECK ((action = ANY (ARRAY['view'::text, 'download_pdf'::text, 'share'::text, 'revoke'::text, 'grant'::text, 'export'::text, 'auto_grant'::text])))
);


--
-- Name: clinical_entry_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_entry_types (
    code text NOT NULL,
    name text NOT NULL,
    category text NOT NULL
);


--
-- Name: clinical_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    entry_date timestamp with time zone DEFAULT now() NOT NULL,
    entry_type text NOT NULL,
    summary text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    appointment_id uuid,
    status text,
    session_type text,
    duration_minutes integer,
    assigned_plan_id uuid,
    session_notes text,
    session_state text,
    legacy_session_id uuid,
    recorded_by uuid,
    signed_by uuid,
    signed_at timestamp with time zone,
    source_system text,
    location_type text,
    care_context text,
    caregiver_present boolean,
    risk_flag boolean,
    diagnosis_id uuid,
    is_external boolean DEFAULT false,
    is_professional_only boolean DEFAULT false,
    visibility text DEFAULT 'all'::text,
    CONSTRAINT clinical_history_visibility_check CHECK ((visibility = ANY (ARRAY['all'::text, 'professional_only'::text, 'author_only'::text])))
);

ALTER TABLE ONLY public.clinical_history FORCE ROW LEVEL SECURITY;


--
-- Name: clinical_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    report_type text NOT NULL,
    version integer DEFAULT 1,
    editable_json jsonb NOT NULL,
    final_pdf_url text,
    hash_integrity text,
    validated_by uuid,
    validated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    template_id uuid,
    visibility_scope text DEFAULT 'private'::text NOT NULL,
    delivery_status text,
    encounter_id uuid,
    status public.report_status DEFAULT 'draft'::public.report_status NOT NULL,
    signed_at timestamp with time zone,
    signed_by uuid,
    signed_hash text,
    locked_at timestamp with time zone,
    document_id uuid,
    locked_reason text,
    created_by uuid,
    specialty_id uuid,
    CONSTRAINT clinical_reports_report_type_check CHECK ((report_type = ANY (ARRAY['anamnesis'::text, 'evaluacion'::text, 'informe'::text, 'evolucion'::text, 'consentimiento'::text, 'certificado'::text, 'otro'::text])))
);

ALTER TABLE ONLY public.clinical_reports FORCE ROW LEVEL SECURITY;


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    rut text,
    address text,
    phone text,
    email text,
    website_url text,
    logo_url text,
    modality public.modality_enum DEFAULT 'presencial'::public.modality_enum,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    city_id integer,
    region_id integer,
    description text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    google_maps_url text,
    business_hours jsonb,
    amenities text[],
    public_transport text,
    photos jsonb,
    therapist_id uuid,
    is_public boolean DEFAULT true,
    type text DEFAULT 'consulta_privada'::text,
    rbd text,
    rut_empresa text,
    razon_social text,
    schedule_text text,
    website text,
    instagram text,
    facebook text,
    slug text,
    modalidad text DEFAULT 'presencial'::text,
    CONSTRAINT clinics_type_check CHECK ((type = ANY (ARRAY['consulta_privada'::text, 'colegio'::text, 'clinica'::text, 'hospital'::text, 'otro'::text])))
);


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    sale_id uuid,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    payment_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cookie_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cookie_consents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    consent_version text NOT NULL,
    essential boolean DEFAULT true,
    analytics boolean DEFAULT false,
    marketing boolean DEFAULT false,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    page_url text
);


--
-- Name: coupon_uses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_uses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    discount_amount numeric(10,2) NOT NULL,
    used_at timestamp with time zone DEFAULT now()
);


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    student_id uuid NOT NULL,
    status text DEFAULT 'enrolled'::text,
    payment_method text,
    payment_status text DEFAULT 'pending'::text,
    amount_paid integer DEFAULT 0,
    commission_amount integer DEFAULT 0,
    fonolevel_credited boolean DEFAULT false,
    sponsored_by uuid,
    certificate_url text,
    completed_at timestamp with time zone,
    enrolled_at timestamp with time zone DEFAULT now(),
    CONSTRAINT course_enrollments_payment_method_check CHECK ((payment_method = ANY (ARRAY['wallet'::text, 'mercadopago'::text, 'free'::text, 'clinic_sponsored'::text]))),
    CONSTRAINT course_enrollments_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'refunded'::text]))),
    CONSTRAINT course_enrollments_status_check CHECK ((status = ANY (ARRAY['enrolled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: course_lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    title text NOT NULL,
    content text,
    video_url text,
    media_url text,
    duration_minutes integer,
    order_index integer DEFAULT 0 NOT NULL,
    visibility text DEFAULT 'paid'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT course_lessons_visibility_check CHECK ((visibility = ANY (ARRAY['free'::text, 'paid'::text, 'preview'::text])))
);


--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    video_url text,
    duration_minutes integer DEFAULT 0,
    sort_order integer DEFAULT 0,
    is_free_preview boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: course_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT course_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instructor_id uuid NOT NULL,
    title text NOT NULL,
    slug text,
    description text,
    short_description text,
    cover_image_url text,
    syllabus_url text,
    specialty_id uuid,
    course_type text DEFAULT 'curso'::text,
    level text DEFAULT 'intermedio'::text,
    modality text DEFAULT 'online'::text,
    format text DEFAULT 'grabado'::text,
    hours integer DEFAULT 0,
    start_date date,
    end_date date,
    is_permanent boolean DEFAULT false,
    price integer DEFAULT 0,
    currency text DEFAULT 'CLP'::text,
    max_students integer,
    score_boost integer DEFAULT 5,
    status text DEFAULT 'draft'::text,
    rejection_reason text,
    is_featured boolean DEFAULT false,
    rating numeric(3,2) DEFAULT 0,
    total_reviews integer DEFAULT 0,
    total_enrollments integer DEFAULT 0,
    video_url text,
    platform_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    CONSTRAINT courses_course_type_check CHECK ((course_type = ANY (ARRAY['curso'::text, 'taller'::text, 'diplomado'::text, 'certificacion'::text, 'masterclass'::text, 'mentoria'::text]))),
    CONSTRAINT courses_format_check CHECK ((format = ANY (ARRAY['vivo'::text, 'grabado'::text, 'mixto'::text]))),
    CONSTRAINT courses_level_check CHECK ((level = ANY (ARRAY['basico'::text, 'intermedio'::text, 'avanzado'::text, 'experto'::text]))),
    CONSTRAINT courses_modality_check CHECK ((modality = ANY (ARRAY['online'::text, 'presencial'::text, 'hibrido'::text]))),
    CONSTRAINT courses_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'approved'::text, 'rejected'::text, 'archived'::text])))
);


--
-- Name: debug_signup_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debug_signup_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: diagnosis_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnosis_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    system_id uuid NOT NULL,
    code text NOT NULL,
    code_alt text,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: diagnosis_specialty_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnosis_specialty_map (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    diagnosis_pattern text NOT NULL,
    match_type text DEFAULT 'keyword'::text NOT NULL,
    specialty_id uuid NOT NULL,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT diagnosis_specialty_map_match_type_check CHECK ((match_type = ANY (ARRAY['keyword'::text, 'cie10_prefix'::text, 'cie10_exact'::text])))
);


--
-- Name: diagnosis_systems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnosis_systems (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: discount_coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    description text,
    expiration_date timestamp with time zone,
    max_uses integer,
    current_uses integer DEFAULT 0,
    is_active boolean DEFAULT true,
    applicable_plans text[],
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    min_purchase_amount numeric,
    max_discount_amount numeric,
    valid_from timestamp with time zone DEFAULT now(),
    coupon_type text DEFAULT 'marketplace'::text
);


--
-- Name: education_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    provider text,
    education_level text,
    specialty_id uuid,
    estimated_points integer,
    url text,
    is_active boolean DEFAULT true,
    description text,
    modality text DEFAULT 'online'::text,
    country text DEFAULT 'Chile'::text,
    duration_hours integer,
    price_clp integer,
    provider_url text,
    is_featured boolean DEFAULT false,
    tags text[],
    CONSTRAINT education_recommendations_education_level_check CHECK ((education_level = ANY (ARRAY['doctorado'::text, 'magister'::text, 'diplomado'::text, 'curso_certificado'::text, 'curso_corto'::text])))
);


--
-- Name: email_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_type text NOT NULL,
    subject text NOT NULL,
    body_html text,
    body_text text,
    recipient_email text NOT NULL,
    cc_emails text[],
    status text DEFAULT 'pending'::text NOT NULL,
    scheduled_for timestamp with time zone DEFAULT now(),
    sent_at timestamp with time zone,
    failed_at timestamp with time zone,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT email_notifications_notification_type_check CHECK ((notification_type = ANY (ARRAY['appointment_reminder'::text, 'appointment_confirmation'::text, 'appointment_cancellation'::text, 'report_ready'::text, 'plan_assigned'::text, 'session_summary'::text, 'payment_reminder'::text, 'newsletter'::text, 'system_update'::text]))),
    CONSTRAINT email_notifications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_name text NOT NULL,
    notification_type text NOT NULL,
    subject_template text NOT NULL,
    body_html_template text NOT NULL,
    body_text_template text,
    variables jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: faq_chatbot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faq_chatbot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: favorite_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorite_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    is_default boolean DEFAULT false,
    is_public boolean DEFAULT false,
    share_code text,
    view_count integer DEFAULT 0,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE favorite_lists; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.favorite_lists IS 'Listas personalizadas para organizar favoritos';


--
-- Name: generated_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.generated_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    template_type text NOT NULL,
    patient_info jsonb,
    generated_content text,
    title text,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: insurance_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    logo_url text,
    website text,
    contact_phone text,
    contact_email text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'complaint'::text,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'medium'::text,
    reported_by uuid,
    assigned_to text,
    resolution text,
    resolution_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_document_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_document_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    version integer NOT NULL,
    content text,
    change_summary text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text,
    type text DEFAULT 'terms'::text NOT NULL,
    content text,
    version integer DEFAULT 1,
    status text DEFAULT 'draft'::text,
    published_at timestamp with time zone,
    effective_date date,
    expiry_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'general'::text,
    content text,
    status text DEFAULT 'draft'::text,
    responsible text,
    review_date date,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: legal_signatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_signatures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    document_id uuid NOT NULL,
    document_version integer NOT NULL,
    accepted_at timestamp with time zone DEFAULT now(),
    ip_address text,
    user_agent text
);


--
-- Name: marketing_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketing_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text,
    email text,
    phone text,
    rut text,
    source text DEFAULT 'manual'::text NOT NULL,
    segment text DEFAULT 'establecido'::text,
    city text,
    region text,
    specialty text,
    institution text,
    status text DEFAULT 'new'::text,
    notes text,
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    imported_at timestamp with time zone DEFAULT now(),
    contacted_at timestamp with time zone,
    converted_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: marketplace_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    marketplace_plan_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: marketplace_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid,
    plan_template_id uuid,
    therapist_plan_template_id uuid,
    item_type text NOT NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text,
    commission_percentage numeric(5,2) DEFAULT 15.00,
    rating numeric(3,2),
    total_reviews integer DEFAULT 0,
    total_sales integer DEFAULT 0,
    is_approved boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    target_age_min integer,
    target_age_max integer,
    duration_weeks integer,
    total_sessions integer,
    total_activities integer DEFAULT 0,
    target_diagnosis text[],
    preview_content jsonb,
    sample_pdf_url text,
    author_credentials text,
    language text DEFAULT 'es'::text,
    view_count integer DEFAULT 0,
    slug text,
    therapist_material_id uuid,
    category text,
    subtitle text,
    badge_text text,
    discount_price numeric,
    sku text,
    gallery_urls jsonb DEFAULT '[]'::jsonb,
    track_quantity boolean DEFAULT false,
    hide_add_to_cart boolean DEFAULT false,
    admin_feedback text,
    upsell_ids jsonb DEFAULT '[]'::jsonb,
    downsell_ids jsonb DEFAULT '[]'::jsonb,
    bundle_ids jsonb DEFAULT '[]'::jsonb,
    related_ids jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT item_reference_check CHECK ((((item_type = 'product'::text) AND (product_id IS NOT NULL)) OR ((item_type = 'plan'::text) AND ((plan_template_id IS NOT NULL) OR (therapist_plan_template_id IS NOT NULL))) OR (item_type <> ALL (ARRAY['product'::text, 'plan'::text])))),
    CONSTRAINT marketplace_items_item_type_check CHECK ((item_type = ANY (ARRAY['product'::text, 'plan'::text, 'evaluation'::text, 'material'::text, 'course'::text]))),
    CONSTRAINT marketplace_items_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: marketplace_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    marketplace_item_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    order_id uuid,
    rating integer NOT NULL,
    title text,
    content text,
    pros text[],
    cons text[],
    author_response text,
    author_responded_at timestamp with time zone,
    is_verified_purchase boolean DEFAULT false,
    is_visible boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rating_quality integer,
    rating_value integer,
    rating_ease_of_use integer,
    rating_effectiveness integer,
    patient_age_range text,
    diagnosis_used_for text[],
    sessions_completed integer,
    would_recommend boolean,
    verification_date timestamp with time zone,
    purchase_date timestamp with time zone,
    not_helpful_count integer DEFAULT 0,
    report_count integer DEFAULT 0,
    status text DEFAULT 'approved'::text,
    moderation_reason text,
    moderated_by uuid,
    moderated_at timestamp with time zone,
    is_edited boolean DEFAULT false,
    attachments jsonb DEFAULT '[]'::jsonb,
    search_vector tsvector,
    published_at timestamp with time zone,
    CONSTRAINT marketplace_reviews_age_range_check CHECK (((patient_age_range = ANY (ARRAY['0-2'::text, '3-5'::text, '6-12'::text, '13-17'::text, '18-64'::text, '65+'::text])) OR (patient_age_range IS NULL))),
    CONSTRAINT marketplace_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT marketplace_reviews_rating_ease_of_use_check CHECK (((rating_ease_of_use >= 1) AND (rating_ease_of_use <= 5))),
    CONSTRAINT marketplace_reviews_rating_effectiveness_check CHECK (((rating_effectiveness >= 1) AND (rating_effectiveness <= 5))),
    CONSTRAINT marketplace_reviews_rating_quality_check CHECK (((rating_quality >= 1) AND (rating_quality <= 5))),
    CONSTRAINT marketplace_reviews_rating_value_check CHECK (((rating_value >= 1) AND (rating_value <= 5))),
    CONSTRAINT marketplace_reviews_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'flagged'::text, 'hidden'::text])))
);


--
-- Name: TABLE marketplace_reviews; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.marketplace_reviews IS 'Reseñas y calificaciones de items del marketplace con verificación de compra';


--
-- Name: COLUMN marketplace_reviews.is_verified_purchase; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.marketplace_reviews.is_verified_purchase IS 'Indica si se verificó que el reviewer compró el item';


--
-- Name: COLUMN marketplace_reviews.rating_effectiveness; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.marketplace_reviews.rating_effectiveness IS 'Calificación de efectividad terapéutica del plan/material';


--
-- Name: COLUMN marketplace_reviews.diagnosis_used_for; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.marketplace_reviews.diagnosis_used_for IS 'Diagnósticos donde el terapeuta usó este material';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    role public.user_role DEFAULT 'patient'::public.user_role NOT NULL,
    full_name text DEFAULT ''::text,
    rut text,
    email text NOT NULL,
    phone text,
    region_id integer,
    city_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    birthdate date,
    gender text,
    timezone text DEFAULT 'UTC'::text,
    languages jsonb DEFAULT '[]'::jsonb,
    is_super_admin boolean DEFAULT false,
    onboarding_completed boolean DEFAULT false,
    CONSTRAINT chk_city_in_region CHECK (public.is_city_in_region(city_id, region_id))
);

ALTER TABLE ONLY public.profiles FORCE ROW LEVEL SECURITY;


--
-- Name: COLUMN profiles.timezone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.timezone IS 'User-selected timezone, e.g., "America/Santiago"';


--
-- Name: therapist_branding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_branding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    primary_color text,
    secondary_color text,
    font_family text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    logo_url character varying(255),
    avatar_url text,
    accent_color text,
    text_color text,
    background_color text,
    font_size_base integer
);


--
-- Name: therapist_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_details (
    user_id uuid NOT NULL,
    social_instagram_url text,
    social_facebook_url text,
    social_linkedin_url text,
    social_twitter_url text,
    about_me text,
    headline_statement text,
    main_address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    registration_supersalud text,
    registration_secreduc text,
    public_email text,
    is_public boolean DEFAULT false,
    years_experience integer,
    specialization_areas text[],
    languages text[] DEFAULT ARRAY['Español'::text],
    professional_title text,
    university text,
    graduation_year integer,
    slug text,
    city_id integer,
    reminder_preferences jsonb DEFAULT '{"timing_hours": 24, "email_enabled": true}'::jsonb,
    bank_name text,
    account_type text,
    account_number text,
    account_holder_name text,
    account_holder_rut text,
    bank_email text,
    bank_verified boolean DEFAULT false,
    bank_verification_status text DEFAULT 'pending'::text
);


--
-- Name: marketplace_items_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.marketplace_items_view AS
 SELECT mi.id,
    mi.seller_id,
    mi.product_id,
    mi.plan_template_id,
    mi.therapist_plan_template_id,
    mi.item_type,
    mi.title,
    mi.description,
    mi.price,
    mi.currency,
    mi.commission_percentage,
    mi.rating,
    mi.total_reviews,
    mi.total_sales,
    mi.is_approved,
    mi.is_active,
    mi.created_at,
    mi.updated_at,
    p.full_name AS seller_name,
    COALESCE(tb.avatar_url, (tb.logo_url)::text) AS seller_avatar,
    tb.primary_color AS seller_primary_color,
    tb.logo_url AS seller_logo,
    td.professional_title AS seller_specialty,
    td.headline_statement AS seller_headline,
    td.years_experience AS seller_experience,
    td.specialization_areas AS seller_specializations,
    c.name AS seller_clinic,
    c.address AS seller_clinic_address,
    c.logo_url AS seller_clinic_logo,
    COALESCE(( SELECT (avg(mr.rating))::numeric(3,2) AS avg
           FROM public.marketplace_reviews mr
          WHERE ((mr.marketplace_item_id = mi.id) AND (mr.is_visible = true))), mi.rating, (0)::numeric) AS avg_rating,
    COALESCE(( SELECT (count(*))::integer AS count
           FROM public.marketplace_reviews mr
          WHERE ((mr.marketplace_item_id = mi.id) AND (mr.is_visible = true))), mi.total_reviews, 0) AS review_count
   FROM ((((public.marketplace_items mi
     LEFT JOIN public.profiles p ON ((mi.seller_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((mi.seller_id = tb.therapist_id)))
     LEFT JOIN public.therapist_details td ON ((mi.seller_id = td.user_id)))
     LEFT JOIN public.clinics c ON (((mi.seller_id = c.therapist_id) AND (c.is_active = true))))
  WHERE (mi.is_active = true);


--
-- Name: marketplace_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    buyer_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text,
    status text DEFAULT 'pending'::text,
    payment_method text,
    payment_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT marketplace_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: marketplace_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    gross_amount integer NOT NULL,
    platform_fee integer NOT NULL,
    net_amount integer NOT NULL,
    status text DEFAULT 'pending'::text,
    payment_method text,
    payment_reference text,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone,
    CONSTRAINT marketplace_payouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: marketplace_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    original_plan_id uuid,
    author_id uuid NOT NULL,
    author_name text,
    author_credentials text,
    name text NOT NULL,
    slug text,
    description text,
    long_description text,
    target_diagnosis text[],
    target_age_min integer,
    target_age_max integer,
    duration_weeks integer DEFAULT 8 NOT NULL,
    total_sessions integer DEFAULT 8 NOT NULL,
    total_activities integer DEFAULT 0,
    objectives_preview jsonb,
    cover_image_url text,
    preview_video_url text,
    sample_pdf_url text,
    price_clp integer DEFAULT 0 NOT NULL,
    price_usd numeric(10,2),
    is_free boolean DEFAULT false,
    discount_percentage integer DEFAULT 0,
    discount_valid_until timestamp with time zone,
    status text DEFAULT 'draft'::text,
    is_featured boolean DEFAULT false,
    view_count integer DEFAULT 0,
    purchase_count integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    tags text[],
    language text DEFAULT 'es'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    meta_title text,
    meta_description text,
    CONSTRAINT marketplace_plans_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'suspended'::text, 'archived'::text])))
);


--
-- Name: marketplace_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    marketplace_plan_id uuid NOT NULL,
    price_paid integer NOT NULL,
    currency text DEFAULT 'CLP'::text,
    discount_applied integer DEFAULT 0,
    payment_status text DEFAULT 'pending'::text,
    payment_method text,
    payment_reference text,
    license_type text DEFAULT 'personal'::text,
    license_expires_at timestamp with time zone,
    cloned_plan_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT marketplace_purchases_license_type_check CHECK ((license_type = ANY (ARRAY['personal'::text, 'clinic'::text, 'unlimited'::text]))),
    CONSTRAINT marketplace_purchases_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: marketplace_review_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_review_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT marketplace_review_votes_vote_type_check CHECK ((vote_type = ANY (ARRAY['helpful'::text, 'unhelpful'::text])))
);


--
-- Name: marketplace_saved_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    filters jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: measure_scales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.measure_scales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    domain text NOT NULL,
    description text,
    min_value integer,
    max_value integer,
    higher_is_better boolean DEFAULT true,
    citation text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: membership_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membership_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price_clp numeric NOT NULL,
    price_usd numeric,
    billing_cycle text NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT membership_plans_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text, 'lifetime'::text])))
);


--
-- Name: metrics_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metrics_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    metric_type text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    metrics_data jsonb NOT NULL,
    total_sessions integer DEFAULT 0,
    total_patients integer DEFAULT 0,
    total_revenue numeric(10,2) DEFAULT 0,
    average_session_duration integer,
    completion_rate numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT metrics_summary_metric_type_check CHECK ((metric_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text])))
);


--
-- Name: moderation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    moderator_id uuid,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moderation_logs_entity_type_check CHECK ((entity_type = ANY (ARRAY['question'::text, 'answer'::text, 'comment'::text, 'article'::text])))
);


--
-- Name: motivational_patient; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motivational_patient (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    phrase_id uuid NOT NULL,
    sent_at timestamp with time zone DEFAULT now(),
    seen boolean DEFAULT false,
    seen_at timestamp with time zone,
    phrase text
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false,
    read_at timestamp with time zone,
    action_url text,
    priority text DEFAULT 'normal'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['appointment'::text, 'reminder'::text, 'message'::text, 'system'::text, 'payment'::text, 'document'::text])))
);


--
-- Name: notiz_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notiz_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid,
    audio_file_path text,
    transcription text,
    extracted_data jsonb,
    summary text,
    key_points text[],
    next_steps text[],
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    marketplace_item_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    total_price numeric(10,2) NOT NULL,
    commission_amount numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


--
-- Name: order_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_access_grants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_access_grants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    granted_to uuid,
    access_level text DEFAULT 'full'::text NOT NULL,
    granted_by text DEFAULT 'patient'::text NOT NULL,
    is_active boolean DEFAULT true,
    share_token text,
    token_expires_at timestamp with time zone,
    granted_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone,
    notes text,
    accepted_at timestamp with time zone,
    CONSTRAINT patient_access_grants_access_level_check CHECK ((access_level = ANY (ARRAY['full'::text, 'read_only'::text, 'professional_notes'::text, 'revoked'::text]))),
    CONSTRAINT patient_access_grants_granted_by_check CHECK ((granted_by = ANY (ARRAY['patient'::text, 'system'::text, 'therapist'::text, 'clinic'::text])))
);


--
-- Name: patient_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    goal_id uuid,
    exercise_id uuid,
    name text NOT NULL,
    description text,
    instructions text,
    difficulty public.difficulty_enum DEFAULT 'adecuado'::public.difficulty_enum,
    video_url text,
    pdf_url text,
    image_url text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    session_id uuid,
    achievement_level integer,
    observation text,
    log_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    therapist_id uuid,
    activity_type text DEFAULT 'exercise'::text,
    duration_minutes integer,
    score integer,
    notes text,
    completion_date timestamp with time zone DEFAULT now(),
    CONSTRAINT patient_activity_logs_achievement_level_check CHECK (((achievement_level >= 0) AND (achievement_level <= 100)))
);


--
-- Name: patient_assigned_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_assigned_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    plan_template_id uuid,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status text DEFAULT 'activo'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_sessions integer DEFAULT 8,
    completed_sessions integer DEFAULT 0,
    current_session integer DEFAULT 1,
    progress_percentage numeric(5,2) DEFAULT 0,
    specialty_id uuid
);


--
-- Name: patient_development_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_development_areas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_diagnoses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    diagnosis_name text NOT NULL,
    clinical_description text,
    severity text,
    related_entry_id uuid,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    diagnosed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    system_id uuid NOT NULL,
    code_id uuid NOT NULL,
    specialty_id uuid
);


--
-- Name: patient_document_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_document_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    name text NOT NULL,
    category text,
    content text,
    variables jsonb,
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    file_size integer,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    document_date date,
    source text DEFAULT 'manual'::text,
    source_id uuid
);

ALTER TABLE ONLY public.patient_documents FORCE ROW LEVEL SECURITY;


--
-- Name: patient_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    evaluation_date timestamp with time zone DEFAULT now(),
    evaluation_type text,
    observations text,
    results jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    specialty_id uuid
);


--
-- Name: patient_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    area_id uuid,
    evaluation_id uuid,
    goal_type public.goal_type_enum NOT NULL,
    title text NOT NULL,
    description text,
    target_date date,
    achieved boolean DEFAULT false,
    achieved_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    plan_objective_id uuid
);


--
-- Name: patient_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    file_url text,
    file_type text,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    source_material_id uuid,
    assigned_by uuid,
    assigned_reason text,
    visible_to_family boolean DEFAULT false,
    acknowledged_at timestamp with time zone,
    completed_at timestamp with time zone
);


--
-- Name: patient_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    appointment_id uuid,
    amount integer NOT NULL,
    currency text DEFAULT 'CLP'::text,
    payment_method text,
    payment_reference text,
    status text DEFAULT 'completed'::text,
    concept text,
    notes text,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_plan_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_plan_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    marketplace_plan_id uuid NOT NULL,
    purchase_id uuid,
    assigned_by uuid NOT NULL,
    status text DEFAULT 'active'::text,
    assigned_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    notes text,
    CONSTRAINT patient_plan_assignments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'paused'::text])))
);


--
-- Name: patient_private_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_private_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.patient_private_notes FORCE ROW LEVEL SECURITY;


--
-- Name: patient_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    title text NOT NULL,
    body text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    therapist_id uuid,
    specialty_id uuid,
    CONSTRAINT patient_questions_title_check CHECK ((char_length(title) >= 10))
);


--
-- Name: patient_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    rating numeric,
    review text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT patient_reviews_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    notes text,
    is_blacklisted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    patient_type text,
    responsible_name text,
    responsible_rut text,
    birth_city text,
    nationality text,
    anamnesis_template text,
    evaluation_template text,
    profile_id uuid,
    status text,
    last_appointment_date date,
    admission_date date,
    discharge_date date,
    treatment_stage text,
    communication_channel text,
    alerts jsonb DEFAULT '{}'::jsonb,
    medical_history text,
    diagnosis text,
    allergies text,
    other_info text,
    avatar_url text,
    diagnosis_summary text,
    attention_type text DEFAULT 'consulta_privada'::text,
    clinic_id uuid,
    clinical_consent_signed boolean DEFAULT false,
    clinical_consent_date timestamp with time zone,
    notiz_consent boolean DEFAULT false,
    CONSTRAINT patients_attention_type_check CHECK ((attention_type = ANY (ARRAY['consulta_privada'::text, 'pie_escolar'::text]))),
    CONSTRAINT patients_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'discharged'::text])))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    service_id uuid,
    amount numeric NOT NULL,
    currency text NOT NULL,
    method text,
    paid_at timestamp with time zone,
    status public.payment_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: performance_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric(10,2),
    metric_unit text,
    resource_type text,
    resource_id text,
    measured_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT performance_metrics_resource_type_check CHECK ((resource_type = ANY (ARRAY['database'::text, 'api'::text, 'storage'::text, 'function'::text])))
);


--
-- Name: pie_paci; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_paci (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    therapist_id uuid,
    period text,
    objectives jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pie_schedule_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_schedule_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    school_id uuid,
    student_id uuid,
    day_of_week integer,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    block_type text,
    is_manual boolean DEFAULT false,
    academic_year integer,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pie_schedule_blocks_block_type_check CHECK ((block_type = ANY (ARRAY['aula_recursos'::text, 'trabajo_colaborativo'::text, 'coordinacion'::text, 'informe'::text, 'preparacion_material'::text]))),
    CONSTRAINT pie_schedule_blocks_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 5)))
);


--
-- Name: pie_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    therapist_id uuid,
    schedule_block_id uuid,
    session_date date NOT NULL,
    attended boolean DEFAULT true,
    notes text,
    objectives_worked text[],
    student_performance text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pie_sessions_student_performance_check CHECK ((student_performance = ANY (ARRAY['logrado'::text, 'en_proceso'::text, 'no_logrado'::text])))
);


--
-- Name: pie_student_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_student_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    school_id uuid,
    course text,
    teacher_name text,
    nee_type text,
    diagnosis text,
    academic_year integer DEFAULT (EXTRACT(year FROM now()))::integer,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pie_student_data_nee_type_check CHECK ((nee_type = ANY (ARRAY['transitoria'::text, 'permanente'::text])))
);


--
-- Name: pie_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid,
    full_name text NOT NULL,
    rut text,
    course text,
    teacher_name text,
    nee_type text,
    diagnosis text,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pie_students_nee_type_check CHECK ((nee_type = ANY (ARRAY['transitoria'::text, 'permanente'::text])))
);


--
-- Name: pie_therapist_schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pie_therapist_schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    school_id uuid,
    hours_assigned numeric(4,1),
    academic_year integer
);


--
-- Name: plan_objective_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_objective_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    objective_id uuid NOT NULL,
    exercise_id uuid,
    name text NOT NULL,
    description text,
    instructions text,
    duration_minutes integer DEFAULT 10,
    materials text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE plan_objective_activities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.plan_objective_activities IS 'Actividades sugeridas para cada objetivo específico';


--
-- Name: plan_objectives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_objectives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    objective_type text NOT NULL,
    parent_objective_id uuid,
    title text NOT NULL,
    description text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    scale_id uuid,
    baseline_value numeric,
    target_value numeric,
    CONSTRAINT plan_objectives_objective_type_check CHECK ((objective_type = ANY (ARRAY['general'::text, 'specific'::text])))
);


--
-- Name: TABLE plan_objectives; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.plan_objectives IS 'Objetivos generales y específicos de los planes';


--
-- Name: plan_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assigned_plan_id uuid NOT NULL,
    session_number integer NOT NULL,
    scheduled_date date,
    completed_date timestamp with time zone,
    status text DEFAULT 'pending'::text,
    clinical_history_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    duration_minutes integer DEFAULT 45,
    CONSTRAINT plan_sessions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text])))
);


--
-- Name: TABLE plan_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.plan_sessions IS 'Sesiones planificadas para cada plan asignado';


--
-- Name: plan_template_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_template_exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_template_id uuid,
    therapist_plan_template_id uuid,
    exercise_id uuid NOT NULL,
    week_number integer,
    day_number integer,
    order_index integer DEFAULT 0,
    repetitions integer,
    duration_minutes integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT check_template_reference CHECK ((((plan_template_id IS NOT NULL) AND (therapist_plan_template_id IS NULL)) OR ((plan_template_id IS NULL) AND (therapist_plan_template_id IS NOT NULL))))
);


--
-- Name: planification_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planification_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: platform_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    reward_granted boolean DEFAULT false,
    reward_amount numeric DEFAULT 30000,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT platform_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: product_sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2) NOT NULL,
    is_visible boolean DEFAULT true,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_sales_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'refunded'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    type text NOT NULL,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    sku text,
    product_type text DEFAULT 'digital'::text NOT NULL,
    stock_limit integer,
    current_stock integer,
    media_url text,
    preview_url text,
    download_url text,
    options jsonb,
    tags text[],
    is_featured boolean DEFAULT false NOT NULL
);


--
-- Name: progress_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progress_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    report_type text NOT NULL,
    analysis_data jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT now(),
    shared_with_patient boolean DEFAULT false,
    shared_with_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: qa_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid,
    therapist_id uuid,
    content text NOT NULL,
    is_accepted boolean DEFAULT false,
    helpful_votes integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT qa_answers_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: qa_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: qa_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    category_id uuid,
    patient_id uuid,
    is_anonymous boolean DEFAULT false,
    status text DEFAULT 'pending'::text,
    views_count integer DEFAULT 0,
    helpful_votes integer DEFAULT 0,
    approved_at timestamp with time zone,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT qa_questions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'closed'::text])))
);


--
-- Name: refund_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refund_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    subscription_id uuid,
    invoice_id uuid,
    amount numeric NOT NULL,
    currency text DEFAULT 'CLP'::text,
    reason text NOT NULL,
    detailed_explanation text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    admin_notes text,
    rejection_reason text,
    refund_method text,
    refund_reference text,
    refunded_at timestamp with time zone,
    mp_payment_id text,
    mp_refund_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT refund_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id integer NOT NULL,
    name text NOT NULL,
    country_code text DEFAULT 'CL'::text,
    created_at timestamp with time zone DEFAULT now(),
    ordinal integer
);


--
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- Name: reminder_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reminder_id uuid,
    appointment_id uuid,
    recipient_email text,
    reminder_type text,
    sent_at timestamp with time zone DEFAULT now(),
    delivery_status text,
    error_details jsonb,
    channel text DEFAULT 'email'::text
);


--
-- Name: report_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.report_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    ip_address inet,
    user_agent text,
    "timestamp" timestamp with time zone DEFAULT now(),
    CONSTRAINT report_logs_action_check CHECK ((action = ANY (ARRAY['create'::text, 'edit'::text, 'validate'::text, 'export'::text, 'view'::text, 'share'::text, 'archive'::text])))
);


--
-- Name: review_helpful_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_helpful_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE review_helpful_votes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_helpful_votes IS 'Votos de utilidad (útil/no útil) en reseñas';


--
-- Name: review_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text,
    resolution_notes text,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT review_reports_reason_check CHECK ((reason = ANY (ARRAY['spam'::text, 'inappropriate'::text, 'fake_review'::text, 'harassment'::text, 'misleading'::text, 'conflict_of_interest'::text, 'contains_pii'::text, 'other'::text]))),
    CONSTRAINT review_reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'action_taken'::text, 'dismissed'::text])))
);


--
-- Name: TABLE review_reports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.review_reports IS 'Reportes de reseñas inapropiadas para moderación';


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    buyer_id uuid,
    seller_id uuid,
    amount numeric NOT NULL,
    commission_amount numeric NOT NULL,
    creator_earnings numeric NOT NULL,
    status text DEFAULT 'completed'::text,
    payment_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sales_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_summary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_info jsonb NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    commission_amount numeric(10,2),
    net_amount numeric(10,2),
    client_info jsonb,
    payment_status text,
    delivery_status text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: scheduled_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid,
    therapist_id uuid,
    patient_id uuid,
    reminder_type text,
    scheduled_time timestamp with time zone,
    status text DEFAULT 'pending'::text,
    sent_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    channel text DEFAULT 'email'::text,
    CONSTRAINT scheduled_reminders_reminder_type_check CHECK ((reminder_type = ANY (ARRAY['therapist'::text, 'patient'::text]))),
    CONSTRAINT scheduled_reminders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'cancelled'::text])))
);


--
-- Name: schools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schools (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    rbd text,
    region_id integer,
    city_id integer,
    coordinator_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: search_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    search_query text NOT NULL,
    search_type text,
    results_count integer DEFAULT 0,
    clicked_result_id uuid,
    search_filters jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    modalidad_received text,
    CONSTRAINT search_logs_search_type_check CHECK ((search_type = ANY (ARRAY['therapist'::text, 'patient'::text, 'material'::text, 'exercise'::text, 'marketplace'::text])))
);


--
-- Name: sensorial_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensorial_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    informant_name text,
    informant_relationship text,
    fecha_evaluacion date,
    examinador text,
    scores_by_section jsonb DEFAULT '{}'::jsonb,
    classifications_by_section jsonb DEFAULT '{}'::jsonb,
    total_score integer,
    overall_classification text,
    atypical_sections integer DEFAULT 0,
    observaciones text,
    status text DEFAULT 'borrador'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sensorial_item_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensorial_item_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    evaluation_id uuid NOT NULL,
    item_code text NOT NULL,
    item_name text,
    section text NOT NULL,
    score smallint DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    clinic_id uuid,
    name text NOT NULL,
    description text,
    duration_minutes integer DEFAULT 60,
    price numeric(10,2),
    currency text DEFAULT 'CLP'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: session_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    activity_id uuid,
    objective_id uuid,
    exercise_id uuid,
    name text NOT NULL,
    description text,
    display_order integer NOT NULL,
    duration_minutes integer DEFAULT 15,
    status text DEFAULT 'pending'::text,
    achievement_level text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    instructions text,
    materials text,
    CONSTRAINT session_activities_achievement_level_check CHECK ((achievement_level = ANY (ARRAY['no_logrado'::text, 'en_proceso'::text, 'logrado'::text, 'superado'::text]))),
    CONSTRAINT session_activities_display_order_check CHECK (((display_order >= 1) AND (display_order <= 3))),
    CONSTRAINT session_activities_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'partial'::text, 'skipped'::text])))
);


--
-- Name: TABLE session_activities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.session_activities IS 'Actividades planificadas por sesión (máximo 3)';


--
-- Name: session_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    appointment_id uuid,
    action text NOT NULL,
    performed_by uuid NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT session_logs_action_check CHECK ((action = ANY (ARRAY['created'::text, 'started'::text, 'completed'::text, 'cancelled'::text, 'modified'::text])))
);


--
-- Name: specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    slug text
);


--
-- Name: specialties_catalog; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.specialties_catalog AS
 SELECT specialties.id,
    specialties.slug,
    specialties.name,
    specialties.description,
        CASE specialties.slug
            WHEN 'audicion'::text THEN '👂'::text
            WHEN 'cognicion'::text THEN '🧠'::text
            WHEN 'deglucion'::text THEN '🍽️'::text
            WHEN 'estetica'::text THEN '✨'::text
            WHEN 'lenguaje-adulto'::text THEN '💬'::text
            WHEN 'lenguaje-infantil'::text THEN '👶'::text
            WHEN 'habla'::text THEN '🗣️'::text
            WHEN 'voz'::text THEN '🎤'::text
            WHEN 'miofuncional'::text THEN '💪'::text
            ELSE '🔹'::text
        END AS icon,
    true AS is_active,
    (row_number() OVER (ORDER BY specialties.name))::integer AS display_order
   FROM public.specialties;


--
-- Name: specialties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.specialties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: specialties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.specialties_id_seq OWNED BY public.specialties.id;


--
-- Name: specialty_change_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialty_change_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    old_specialties text[],
    new_specialties text[],
    change_reason text,
    approved_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: specialty_keywords; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialty_keywords (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    specialty_id uuid NOT NULL,
    keyword text NOT NULL,
    weight numeric(3,2) DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscription_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subscription_id uuid,
    user_id uuid,
    amount numeric NOT NULL,
    currency text DEFAULT 'CLP'::text NOT NULL,
    status text NOT NULL,
    payment_method text,
    provider_payment_id text,
    invoice_url text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT subscription_payments_status_check CHECK ((status = ANY (ARRAY['succeeded'::text, 'pending'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text,
    description text,
    price numeric NOT NULL,
    currency text DEFAULT 'CLP'::text,
    billing_cycle text DEFAULT 'monthly'::text,
    features jsonb DEFAULT '[]'::jsonb,
    max_patients integer,
    max_clinics integer,
    max_users integer,
    max_storage_mb integer,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    plan_id uuid,
    status text NOT NULL,
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    canceled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'canceled'::text, 'incomplete'::text, 'trialing'::text])))
);


--
-- Name: suggested_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suggested_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    provider text,
    url text,
    specialty_id uuid,
    status text DEFAULT 'pending'::text,
    suggested_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: support_incident_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_incident_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    incident_id uuid,
    author_id uuid,
    content text NOT NULL
);


--
-- Name: support_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_incidents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    description text,
    status text DEFAULT 'investigating'::text,
    severity text DEFAULT 'medium'::text,
    affected_service text,
    resolved_at timestamp with time zone,
    created_by uuid,
    CONSTRAINT support_incidents_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT support_incidents_status_check CHECK ((status = ANY (ARRAY['investigating'::text, 'identified'::text, 'monitoring'::text, 'resolved'::text])))
);


--
-- Name: support_ticket_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ticket_id uuid,
    author_id uuid,
    content text NOT NULL,
    is_internal boolean DEFAULT true
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    assigned_to uuid,
    title text NOT NULL,
    description text,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'medium'::text,
    category text DEFAULT 'general'::text,
    resolved_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT support_tickets_category_check CHECK ((category = ANY (ARRAY['general'::text, 'billing'::text, 'technical'::text, 'account'::text, 'other'::text]))),
    CONSTRAINT support_tickets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
    CONSTRAINT support_tickets_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'resolved'::text, 'closed'::text])))
);


--
-- Name: symptom_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptom_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    symptoms jsonb,
    additional_info text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    level text DEFAULT 'info'::text,
    message text NOT NULL,
    source text,
    user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT system_logs_level_check CHECK ((level = ANY (ARRAY['debug'::text, 'info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    user_id uuid NOT NULL,
    invited_by uuid,
    role text DEFAULT 'therapist'::text NOT NULL,
    permissions jsonb DEFAULT '{"can_manage_team": false, "can_view_billing": false, "can_edit_patients": true, "can_view_patients": true, "can_access_reports": true, "can_delete_patients": false}'::jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    invitation_token text,
    invitation_sent_at timestamp with time zone,
    invitation_accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT team_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'therapist'::text, 'assistant'::text, 'secretary'::text]))),
    CONSTRAINT team_members_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text, 'removed'::text])))
);


--
-- Name: TABLE team_members; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.team_members IS 'Miembros del equipo para clínicas con Plan Centro';


--
-- Name: COLUMN team_members.role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.team_members.role IS 'Rol: owner (dueño), admin, therapist, assistant, secretary';


--
-- Name: COLUMN team_members.permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.team_members.permissions IS 'Permisos específicos en formato JSON';


--
-- Name: COLUMN team_members.invitation_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.team_members.invitation_token IS 'Token único para aceptar invitación';


--
-- Name: therapist_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_appointments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    therapist_id uuid NOT NULL,
    patient_id uuid,
    clinic_id uuid,
    appointment_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    modality text DEFAULT 'presencial'::public.modality_enum,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT therapist_appointments_modality_check CHECK ((modality = ANY (ARRAY['presencial'::text, 'online'::text]))),
    CONSTRAINT therapist_appointments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'completed'::text, 'blocked'::text])))
);


--
-- Name: therapist_availabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_availabilities (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    therapist_id uuid NOT NULL,
    clinic_id uuid,
    day_of_week integer NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    modality public.modality_enum DEFAULT 'presencial'::public.modality_enum,
    CONSTRAINT therapist_availabilities_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_time_range CHECK ((end_time > start_time))
);


--
-- Name: therapist_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    commission_amount numeric(10,2) NOT NULL,
    commission_percentage numeric(5,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    paid_at timestamp with time zone,
    payment_reference text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT therapist_commissions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])))
);


--
-- Name: therapist_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    condition_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT true NOT NULL,
    specialty_id uuid
);


--
-- Name: therapist_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    file_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    size bigint NOT NULL,
    storage_path text NOT NULL,
    category text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    education_level text,
    specialty_id uuid,
    verified boolean DEFAULT false,
    CONSTRAINT therapist_documents_education_level_check CHECK ((education_level = ANY (ARRAY['doctorado'::text, 'magister'::text, 'diplomado'::text, 'curso'::text])))
);


--
-- Name: therapist_education; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_education (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    title text NOT NULL,
    institution text,
    graduation_year integer,
    certificate_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT false,
    description text,
    education_level text,
    specialty_id uuid,
    verified boolean DEFAULT false,
    hours integer DEFAULT 0,
    CONSTRAINT therapist_education_education_level_check CHECK ((education_level = ANY (ARRAY['doctorado'::text, 'magister'::text, 'diplomado'::text, 'curso_certificado'::text, 'curso_corto'::text])))
);


--
-- Name: therapist_exercises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    name text NOT NULL,
    description text,
    instructions text,
    difficulty public.difficulty_enum DEFAULT 'adecuado'::public.difficulty_enum,
    exercise_type text,
    category text,
    video_url text,
    image_url text,
    pdf_url text,
    is_public boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    times_used integer DEFAULT 0,
    default_duration_minutes integer DEFAULT 15,
    materials text,
    usage_count integer DEFAULT 0
);


--
-- Name: therapist_experience; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_experience (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    role text NOT NULL,
    institution text NOT NULL,
    location text,
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT false,
    description text
);


--
-- Name: therapist_favorite_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_favorite_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_insurances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_insurances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    insurance_provider_id uuid NOT NULL,
    coverage_details text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invite_code text NOT NULL,
    inviter_id uuid NOT NULL,
    invitee_email text,
    invitee_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    accepted_at timestamp with time zone,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    created_at timestamp with time zone DEFAULT now(),
    reward_credited boolean DEFAULT false,
    reward_amount integer DEFAULT 500,
    CONSTRAINT therapist_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text])))
);


--
-- Name: therapist_invite_quotas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_invite_quotas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    monthly_limit integer DEFAULT 10 NOT NULL,
    used_this_month integer DEFAULT 0 NOT NULL,
    last_reset_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_landing_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_landing_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    custom_url text NOT NULL,
    hero_title text,
    hero_subtitle text,
    hero_image_url text,
    testimonials_section jsonb,
    contact_section jsonb,
    theme_options jsonb,
    meta_title text,
    meta_description text,
    published boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    material_name text NOT NULL,
    description text,
    file_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category text,
    file_name text
);


--
-- Name: therapist_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    recommended_therapist_id uuid,
    match_score numeric,
    symptoms_matched jsonb,
    recommendation_date timestamp with time zone DEFAULT now()
);


--
-- Name: therapist_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid,
    service_name text NOT NULL,
    duration_minutes integer,
    price_clp numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    service_category text,
    is_active boolean DEFAULT true,
    service_description text,
    modality text DEFAULT 'presencial'::public.modality_enum,
    price_usd numeric,
    insurance_coverage boolean DEFAULT false,
    insurance_providers text[],
    max_participants integer DEFAULT 1,
    min_age integer,
    max_age integer,
    requirements text,
    is_public boolean DEFAULT false,
    CONSTRAINT therapist_services_modality_check CHECK (((modality IS NULL) OR (modality = ANY (ARRAY['online'::text, 'presencial'::text, 'hibrido'::text, 'ambas'::text])))),
    CONSTRAINT therapist_services_service_category_check CHECK (((service_category IS NULL) OR (service_category = ANY (ARRAY['evaluacion'::text, 'terapia_individual'::text, 'terapia_grupal'::text, 'talleres'::text, 'capacitacion'::text, 'asesoria'::text, 'otros'::text]))))
);


--
-- Name: therapist_specialties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_specialties (
    therapist_id uuid NOT NULL,
    specialty_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_public boolean DEFAULT true NOT NULL
);


--
-- Name: therapist_specialty_badges; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.therapist_specialty_badges AS
 SELECT css.out_therapist_id AS therapist_id,
    css.out_specialty AS specialty,
    css.out_badge AS badge,
    css.out_final_score AS final_score,
    css.out_education_score AS education_score,
    css.out_experience_score AS experience_score,
    css.out_matching_education AS matching_education,
    css.out_matching_experience AS matching_experience
   FROM (public.therapist_specialties ts
     CROSS JOIN LATERAL public.calculate_specialty_scores(ts.therapist_id) css(out_therapist_id, out_specialty_id, out_specialty, out_education_score, out_experience_score, out_final_score, out_badge, out_matching_education, out_matching_experience))
  WHERE (css.out_specialty_id = ts.specialty_id)
  GROUP BY css.out_therapist_id, css.out_specialty_id, css.out_specialty, css.out_badge, css.out_final_score, css.out_education_score, css.out_experience_score, css.out_matching_education, css.out_matching_experience;


--
-- Name: therapist_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapist_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    plan_name text NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text,
    billing_cycle text NOT NULL,
    status text DEFAULT 'active'::text,
    current_period_start date NOT NULL,
    current_period_end date NOT NULL,
    cancel_at_period_end boolean DEFAULT false,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_id text,
    preference_id text,
    payment_status text DEFAULT 'pending'::text,
    payment_method text,
    mercadopago_subscription_id text,
    mp_preapproval_id text,
    external_reference text,
    last_payment_id text,
    next_payment_date date,
    mp_subscription_id text,
    clinic_id uuid,
    discount_percent numeric(5,2) DEFAULT 0,
    original_price integer,
    final_price integer,
    CONSTRAINT therapist_subscriptions_billing_cycle_check CHECK ((billing_cycle = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text]))),
    CONSTRAINT therapist_subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'suspended'::text, 'pending'::text])))
);


--
-- Name: therapists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    specialty text NOT NULL,
    experience_years integer,
    bio text,
    photo_url text,
    certifications text[],
    success_rate numeric,
    languages text[],
    availability_status text DEFAULT 'Available'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: therapy_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.therapy_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid,
    therapist_id uuid,
    plan_id uuid,
    session_number integer,
    focus_objective_id uuid,
    activities_used jsonb,
    session_outcome text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: treatment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    therapist_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    duration_weeks integer,
    is_template boolean DEFAULT true,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    general_objective text,
    specific_objectives jsonb,
    activities jsonb,
    number_of_sessions integer,
    plan_type text DEFAULT 'general'::text,
    target_diagnosis text,
    recommended_sessions integer DEFAULT 8,
    session_duration_minutes integer DEFAULT 45,
    is_global boolean DEFAULT false NOT NULL,
    target_population text,
    diagnosis_scope text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    source_marketplace_item_id uuid,
    is_purchasable boolean DEFAULT false,
    marketplace_item_id uuid,
    specialty_id uuid
);


--
-- Name: TABLE treatment_plans; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.treatment_plans IS 'Plantillas de planes de tratamiento (is_template=true) o planes específicos';


--
-- Name: user_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    addon_key text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'CLP'::text,
    billing_cycle text DEFAULT 'monthly'::text,
    current_period_start date,
    current_period_end date,
    mp_subscription_id text,
    external_reference text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    event_data jsonb,
    session_id text,
    platform text,
    device_info jsonb,
    location_info jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_analytics_platform_check CHECK ((platform = ANY (ARRAY['web'::text, 'mobile'::text, 'desktop'::text])))
);


--
-- Name: user_favorite_phrases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorite_phrases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    phrase_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notification_preferences (
    user_id uuid NOT NULL,
    email_appointments boolean DEFAULT true,
    email_reminders boolean DEFAULT true,
    email_messages boolean DEFAULT true,
    email_system boolean DEFAULT true,
    email_marketing boolean DEFAULT false,
    sms_appointments boolean DEFAULT false,
    sms_reminders boolean DEFAULT false,
    push_appointments boolean DEFAULT true,
    push_reminders boolean DEFAULT true,
    push_messages boolean DEFAULT true,
    reminder_hours_before integer DEFAULT 24,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: v_patient_clinical_timeline; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_patient_clinical_timeline AS
 SELECT ch.id,
    ch.patient_id,
    ch.therapist_id,
    ch.entry_type,
    ch.entry_date,
    ch.summary,
    ch.session_notes,
    ch.appointment_id,
    ch.assigned_plan_id,
    ch.is_external,
    ch.created_at,
    p.full_name AS therapist_name,
    td.professional_title AS therapist_title,
        CASE
            WHEN (ch.therapist_id <> auth.uid()) THEN true
            ELSE false
        END AS is_external_view
   FROM ((public.clinical_history ch
     LEFT JOIN public.profiles p ON ((ch.therapist_id = p.id)))
     LEFT JOIN public.therapist_details td ON ((ch.therapist_id = td.user_id)))
  WHERE (ch.patient_id IN ( SELECT patients.id
           FROM public.patients
          WHERE (patients.therapist_id = auth.uid())))
  ORDER BY ch.entry_date DESC;


--
-- Name: v_patient_plans_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_patient_plans_summary AS
 SELECT pap.id AS assigned_plan_id,
    pap.patient_id,
    pap.therapist_id,
    pap.name AS plan_name,
    pap.start_date,
    pap.end_date,
    pap.status,
    pap.total_sessions,
    pap.completed_sessions,
    pap.progress_percentage,
    tp.general_objective,
    tp.plan_type,
    tp.target_diagnosis,
    ( SELECT count(*) AS count
           FROM public.plan_objectives
          WHERE ((plan_objectives.plan_id = tp.id) AND (plan_objectives.objective_type = 'specific'::text))) AS total_specific_objectives,
    ( SELECT count(*) AS count
           FROM public.plan_sessions
          WHERE (plan_sessions.assigned_plan_id = pap.id)) AS total_planned_sessions
   FROM (public.patient_assigned_plans pap
     LEFT JOIN public.treatment_plans tp ON ((tp.id = pap.plan_template_id)));


--
-- Name: v_patient_timeline; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_patient_timeline AS
 SELECT ch.id,
    ch.patient_id,
    ch.therapist_id,
    'history'::text AS source_type,
    ch.entry_type,
    ch.summary,
    ch.details,
    COALESCE(ch.entry_date, ch.created_at) AS event_date,
    ch.assigned_plan_id,
        CASE
            WHEN (ch.entry_type = 'sesion'::text) THEN 'completed'::text
            ELSE 'recorded'::text
        END AS status,
    ch.created_at,
    ch.updated_at
   FROM public.clinical_history ch
UNION ALL
 SELECT ps.id,
    pap.patient_id,
    pap.therapist_id,
    'scheduled_session'::text AS source_type,
    'sesion_programada'::text AS entry_type,
    format('Sesión %s - %s (Programada)'::text, ps.session_number, COALESCE(tp.name, pap.name)) AS summary,
    jsonb_build_object('plan_id', ps.assigned_plan_id, 'session_id', ps.id, 'session_number', ps.session_number, 'scheduled_date', ps.scheduled_date, 'status', ps.status) AS details,
    COALESCE((ps.scheduled_date)::timestamp with time zone, ps.created_at) AS event_date,
    ps.assigned_plan_id,
    ps.status,
    ps.created_at,
    ps.updated_at
   FROM ((public.plan_sessions ps
     JOIN public.patient_assigned_plans pap ON ((pap.id = ps.assigned_plan_id)))
     LEFT JOIN public.treatment_plans tp ON ((tp.id = pap.plan_template_id)))
  WHERE ((ps.status = ANY (ARRAY['pending'::text, 'scheduled'::text])) AND (ps.clinical_history_id IS NULL));


--
-- Name: v_public_therapists; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_public_therapists AS
 SELECT td.user_id AS therapist_id,
    p.full_name,
    p.region_id,
    p.city_id,
    p.phone,
    td.public_email,
    td.languages,
    td.specialization_areas,
    td.years_experience,
    td.registration_supersalud,
    td.registration_secreduc,
    td.professional_title,
    td.university,
    td.graduation_year,
    td.is_public,
    td.created_at,
    td.updated_at,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base,
    tb.logo_url,
    tb.avatar_url
   FROM ((public.therapist_details td
     JOIN public.profiles p ON ((p.id = td.user_id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = td.user_id)))
  WHERE ((p.role = 'therapist'::public.user_role) AND (td.is_public = true));


--
-- Name: v_public_therapists_with_reviews; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_public_therapists_with_reviews AS
 SELECT p.id AS therapist_id,
    p.full_name,
    (COALESCE(avg(pr.rating), (0)::numeric))::numeric(3,2) AS avg_rating,
    count(pr.id) AS total_reviews,
    td.public_email,
    td.languages,
    td.specialization_areas,
    td.years_experience,
    td.registration_supersalud,
    td.registration_secreduc,
    td.professional_title,
    td.university,
    td.graduation_year,
    p.region_id,
    p.city_id,
    p.phone,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base,
    tb.logo_url,
    tb.avatar_url
   FROM (((public.profiles p
     JOIN public.therapist_details td ON ((td.user_id = p.id)))
     LEFT JOIN public.patient_reviews pr ON ((pr.therapist_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = p.id)))
  WHERE ((p.role = 'therapist'::public.user_role) AND (td.is_public = true))
  GROUP BY p.id, p.full_name, p.region_id, p.city_id, p.phone, td.public_email, td.languages, td.specialization_areas, td.years_experience, td.registration_supersalud, td.registration_secreduc, td.professional_title, td.university, td.graduation_year, tb.primary_color, tb.secondary_color, tb.accent_color, tb.text_color, tb.background_color, tb.font_family, tb.font_size_base, tb.logo_url, tb.avatar_url;


--
-- Name: v_recent_activity; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_recent_activity AS
 SELECT 'Cita'::text AS activity_type,
    a.id,
    a.therapist_id AS user_id,
    (a.date + a.start_time) AS activity_date,
    jsonb_build_object('patient_id', a.patient_id, 'clinic_id', a.clinic_id, 'notes', a.notes) AS details
   FROM public.appointments a
UNION ALL
 SELECT 'Nuevo Paciente'::text AS activity_type,
    p.id,
    p.therapist_id AS user_id,
    p.created_at AS activity_date,
    jsonb_build_object('full_name', pr.full_name, 'email', pr.email) AS details
   FROM (public.patients p
     JOIN public.profiles pr ON ((pr.id = p.profile_id)));


--
-- Name: v_reputation_clinical_score; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reputation_clinical_score AS
 WITH diagnosis_pts AS (
         SELECT patient_diagnoses.therapist_id,
            patient_diagnoses.specialty_id,
            (LEAST(count(*), (15)::bigint))::integer AS pts,
            count(DISTINCT patient_diagnoses.patient_id) AS diag_patients
           FROM public.patient_diagnoses
          WHERE ((patient_diagnoses.is_active = true) AND (patient_diagnoses.specialty_id IS NOT NULL))
          GROUP BY patient_diagnoses.therapist_id, patient_diagnoses.specialty_id
        ), condition_pts AS (
         SELECT therapist_conditions.therapist_id,
            therapist_conditions.specialty_id,
            (LEAST(count(*), (10)::bigint))::integer AS pts
           FROM public.therapist_conditions
          WHERE ((therapist_conditions.is_public = true) AND (therapist_conditions.specialty_id IS NOT NULL))
          GROUP BY therapist_conditions.therapist_id, therapist_conditions.specialty_id
        ), patient_pts AS (
         SELECT appointments.therapist_id,
            appointments.specialty_id,
            (LEAST((count(DISTINCT appointments.patient_id) * 2), (20)::bigint))::integer AS pts,
            count(DISTINCT appointments.patient_id) AS unique_patients
           FROM public.appointments
          WHERE ((appointments.status = 'completed'::text) AND (appointments.specialty_id IS NOT NULL))
          GROUP BY appointments.therapist_id, appointments.specialty_id
        ), appointment_pts AS (
         SELECT appointments.therapist_id,
            appointments.specialty_id,
            (LEAST(floor(((count(*))::numeric / (3)::numeric)), (10)::numeric))::integer AS pts,
            count(*) AS total_appointments
           FROM public.appointments
          WHERE ((appointments.status = 'completed'::text) AND (appointments.specialty_id IS NOT NULL))
          GROUP BY appointments.therapist_id, appointments.specialty_id
        ), plan_completion_pts AS (
         SELECT patient_assigned_plans.therapist_id,
            patient_assigned_plans.specialty_id,
            (LEAST((count(*) * 3), (15)::bigint))::integer AS pts,
            count(*) AS completed_plans
           FROM public.patient_assigned_plans
          WHERE ((patient_assigned_plans.status = 'completed'::text) AND (patient_assigned_plans.specialty_id IS NOT NULL))
          GROUP BY patient_assigned_plans.therapist_id, patient_assigned_plans.specialty_id
        ), followup_pts AS (
         SELECT pap.therapist_id,
            pap.specialty_id,
            (LEAST((count(*) * 2), (10)::bigint))::integer AS pts
           FROM public.patient_assigned_plans pap
          WHERE ((pap.completed_sessions >= 3) AND (pap.specialty_id IS NOT NULL))
          GROUP BY pap.therapist_id, pap.specialty_id
        ), evaluation_pts AS (
         SELECT pe.therapist_id,
            pe.specialty_id,
            (LEAST(count(*), (10)::bigint))::integer AS pts,
            count(*) AS total_evaluations
           FROM public.patient_evaluations pe
          WHERE ((pe.specialty_id IS NOT NULL) AND (pe.observations IS NOT NULL) AND (pe.observations <> ''::text))
          GROUP BY pe.therapist_id, pe.specialty_id
        ), report_pts AS (
         SELECT cr.therapist_id,
            cr.specialty_id,
            (LEAST((count(*) * 2), (10)::bigint))::integer AS pts,
            count(*) AS signed_reports
           FROM public.clinical_reports cr
          WHERE ((cr.status = 'signed'::public.report_status) AND (cr.specialty_id IS NOT NULL) AND (cr.signed_at IS NOT NULL))
          GROUP BY cr.therapist_id, cr.specialty_id
        ), all_combos AS (
         SELECT diagnosis_pts.therapist_id,
            diagnosis_pts.specialty_id
           FROM diagnosis_pts
        UNION
         SELECT condition_pts.therapist_id,
            condition_pts.specialty_id
           FROM condition_pts
        UNION
         SELECT patient_pts.therapist_id,
            patient_pts.specialty_id
           FROM patient_pts
        UNION
         SELECT appointment_pts.therapist_id,
            appointment_pts.specialty_id
           FROM appointment_pts
        UNION
         SELECT plan_completion_pts.therapist_id,
            plan_completion_pts.specialty_id
           FROM plan_completion_pts
        UNION
         SELECT followup_pts.therapist_id,
            followup_pts.specialty_id
           FROM followup_pts
        UNION
         SELECT evaluation_pts.therapist_id,
            evaluation_pts.specialty_id
           FROM evaluation_pts
        UNION
         SELECT report_pts.therapist_id,
            report_pts.specialty_id
           FROM report_pts
        )
 SELECT ac.therapist_id,
    ac.specialty_id,
    s.slug AS specialty_slug,
    s.name AS specialty_name,
    COALESCE(d.pts, 0) AS diagnosis_points,
    COALESCE(c.pts, 0) AS condition_points,
    COALESCE(p.pts, 0) AS patient_diversity_points,
    COALESCE(a.pts, 0) AS appointment_points,
    COALESCE(pc.pts, 0) AS plan_completion_points,
    COALESCE(f.pts, 0) AS followup_points,
    COALESCE(e.pts, 0) AS evaluation_points,
    COALESCE(r.pts, 0) AS report_points,
    LEAST((((((((COALESCE(d.pts, 0) + COALESCE(c.pts, 0)) + COALESCE(p.pts, 0)) + COALESCE(a.pts, 0)) + COALESCE(pc.pts, 0)) + COALESCE(f.pts, 0)) + COALESCE(e.pts, 0)) + COALESCE(r.pts, 0)), 100) AS experience_points,
    COALESCE(p.unique_patients, (0)::bigint) AS unique_patients,
    COALESCE(a.total_appointments, (0)::bigint) AS total_appointments,
    COALESCE(pc.completed_plans, (0)::bigint) AS completed_plans,
    COALESCE(e.total_evaluations, (0)::bigint) AS total_evaluations,
    COALESCE(r.signed_reports, (0)::bigint) AS signed_reports
   FROM (((((((((all_combos ac
     JOIN public.specialties s ON ((s.id = ac.specialty_id)))
     LEFT JOIN diagnosis_pts d ON (((d.therapist_id = ac.therapist_id) AND (d.specialty_id = ac.specialty_id))))
     LEFT JOIN condition_pts c ON (((c.therapist_id = ac.therapist_id) AND (c.specialty_id = ac.specialty_id))))
     LEFT JOIN patient_pts p ON (((p.therapist_id = ac.therapist_id) AND (p.specialty_id = ac.specialty_id))))
     LEFT JOIN appointment_pts a ON (((a.therapist_id = ac.therapist_id) AND (a.specialty_id = ac.specialty_id))))
     LEFT JOIN plan_completion_pts pc ON (((pc.therapist_id = ac.therapist_id) AND (pc.specialty_id = ac.specialty_id))))
     LEFT JOIN followup_pts f ON (((f.therapist_id = ac.therapist_id) AND (f.specialty_id = ac.specialty_id))))
     LEFT JOIN evaluation_pts e ON (((e.therapist_id = ac.therapist_id) AND (e.specialty_id = ac.specialty_id))))
     LEFT JOIN report_pts r ON (((r.therapist_id = ac.therapist_id) AND (r.specialty_id = ac.specialty_id))));


--
-- Name: v_reputation_education_score; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reputation_education_score AS
 SELECT ts.therapist_id,
    ts.specialty_id,
    s.slug AS specialty_slug,
    s.name AS specialty_name,
    COALESCE((cs.out_education_score)::bigint, (0)::bigint) AS education_points,
    COALESCE(cs.out_final_score, (0)::numeric) AS precalculated_total,
    (0)::bigint AS total_formaciones,
    'calculado'::text AS highest_level
   FROM ((public.therapist_specialties ts
     JOIN public.specialties s ON ((s.id = ts.specialty_id)))
     LEFT JOIN LATERAL ( SELECT calculate_specialty_scores.out_specialty_id,
            calculate_specialty_scores.out_education_score,
            calculate_specialty_scores.out_final_score
           FROM public.calculate_specialty_scores(ts.therapist_id) calculate_specialty_scores(out_therapist_id, out_specialty_id, out_specialty, out_education_score, out_experience_score, out_final_score, out_badge, out_matching_education, out_matching_experience)
          WHERE (calculate_specialty_scores.out_specialty_id = ts.specialty_id)) cs ON (true))
  WHERE (ts.is_public = true);


--
-- Name: v_reputation_specialty_scores; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reputation_specialty_scores AS
 SELECT ts.therapist_id,
    s.id AS specialty_id,
    s.slug AS specialty_slug,
    s.name AS specialty_name,
        CASE s.slug
            WHEN 'audicion'::text THEN '👂'::text
            WHEN 'cognicion'::text THEN '🧠'::text
            WHEN 'deglucion'::text THEN '🍽️'::text
            WHEN 'estetica'::text THEN '✨'::text
            WHEN 'lenguaje-adulto'::text THEN '💬'::text
            WHEN 'lenguaje-infantil'::text THEN '👶'::text
            WHEN 'habla'::text THEN '🗣️'::text
            WHEN 'voz'::text THEN '🎤'::text
            WHEN 'miofuncional'::text THEN '💪'::text
            ELSE '🔹'::text
        END AS specialty_icon,
    COALESCE(edu.education_points, (0)::bigint) AS education_points,
    COALESCE(cli.experience_points, 0) AS experience_points,
    GREATEST((COALESCE(edu.precalculated_total, (0)::numeric))::integer, (round((((COALESCE(edu.education_points, (0)::bigint))::numeric * 0.4) + ((COALESCE(cli.experience_points, 0))::numeric * 0.6))))::integer) AS final_score,
    COALESCE(cli.diagnosis_points, 0) AS diagnosis_points,
    COALESCE(cli.condition_points, 0) AS condition_points,
    COALESCE(cli.patient_diversity_points, 0) AS patient_diversity_points,
    COALESCE(cli.appointment_points, 0) AS appointment_points,
    COALESCE(cli.plan_completion_points, 0) AS plan_completion_points,
    COALESCE(cli.followup_points, 0) AS followup_points,
    COALESCE(cli.evaluation_points, 0) AS evaluation_points,
    COALESCE(cli.report_points, 0) AS report_points,
    COALESCE(edu.total_formaciones, (0)::bigint) AS total_formaciones,
    COALESCE(edu.highest_level, 'ninguno'::text) AS highest_education,
    COALESCE(cli.unique_patients, (0)::bigint) AS unique_patients,
    COALESCE(cli.total_appointments, (0)::bigint) AS total_appointments,
    COALESCE(cli.completed_plans, (0)::bigint) AS completed_plans,
    COALESCE(cli.total_evaluations, (0)::bigint) AS total_evaluations,
    COALESCE(cli.signed_reports, (0)::bigint) AS signed_reports
   FROM (((public.therapist_specialties ts
     JOIN public.specialties s ON ((s.id = ts.specialty_id)))
     LEFT JOIN public.v_reputation_education_score edu ON (((edu.therapist_id = ts.therapist_id) AND (edu.specialty_id = ts.specialty_id))))
     LEFT JOIN public.v_reputation_clinical_score cli ON (((cli.therapist_id = ts.therapist_id) AND (cli.specialty_id = ts.specialty_id))))
  WHERE (ts.is_public = true);


--
-- Name: v_reputation_badges; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reputation_badges AS
 SELECT rss.therapist_id,
    rss.specialty_id,
    rss.specialty_slug,
    rss.specialty_name,
    rss.specialty_icon,
    rss.education_points,
    rss.experience_points,
    rss.final_score,
    rss.diagnosis_points,
    rss.condition_points,
    rss.patient_diversity_points,
    rss.appointment_points,
    rss.plan_completion_points,
    rss.followup_points,
    rss.evaluation_points,
    rss.report_points,
    rss.total_formaciones,
    rss.highest_education,
    rss.unique_patients,
    rss.total_appointments,
    rss.completed_plans,
    rss.total_evaluations,
    rss.signed_reports,
        CASE
            WHEN (rss.final_score >= 90) THEN 'experto'::text
            WHEN (rss.final_score >= 75) THEN 'alta_experiencia'::text
            WHEN (rss.final_score >= 50) THEN 'profesional_experiencia'::text
            WHEN (rss.final_score >= 25) THEN 'experiencia_basica'::text
            ELSE 'en_formacion'::text
        END AS badge_level,
        CASE
            WHEN (rss.final_score >= 90) THEN 'Experto Fonokit'::text
            WHEN (rss.final_score >= 75) THEN 'Alta experiencia clínica'::text
            WHEN (rss.final_score >= 50) THEN 'Profesional con experiencia'::text
            WHEN (rss.final_score >= 25) THEN 'Experiencia básica'::text
            ELSE 'En formación'::text
        END AS badge_label,
        CASE
            WHEN (rss.final_score >= 90) THEN '🟣'::text
            WHEN (rss.final_score >= 75) THEN '🔵'::text
            WHEN (rss.final_score >= 50) THEN '🟠'::text
            WHEN (rss.final_score >= 25) THEN '🟡'::text
            ELSE '🔹'::text
        END AS badge_emoji,
        CASE
            WHEN (rss.final_score >= 90) THEN 'purple'::text
            WHEN (rss.final_score >= 75) THEN 'blue'::text
            WHEN (rss.final_score >= 50) THEN 'orange'::text
            WHEN (rss.final_score >= 25) THEN 'yellow'::text
            ELSE 'gray'::text
        END AS badge_color
   FROM public.v_reputation_specialty_scores rss;


--
-- Name: v_reputation_therapist_global; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_reputation_therapist_global AS
 SELECT v_reputation_specialty_scores.therapist_id,
    (round(avg(v_reputation_specialty_scores.final_score)))::integer AS global_score,
    max(v_reputation_specialty_scores.final_score) AS best_specialty_score,
    count(*) AS total_specialties,
    sum(v_reputation_specialty_scores.unique_patients) AS total_unique_patients,
    sum(v_reputation_specialty_scores.total_appointments) AS total_appointments,
    sum(v_reputation_specialty_scores.completed_plans) AS total_completed_plans,
    sum(v_reputation_specialty_scores.signed_reports) AS total_signed_reports,
        CASE
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (90)::numeric) THEN 'experto'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (75)::numeric) THEN 'alta_experiencia'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (50)::numeric) THEN 'profesional_experiencia'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (25)::numeric) THEN 'experiencia_basica'::text
            ELSE 'en_formacion'::text
        END AS global_badge_level,
        CASE
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (90)::numeric) THEN 'Experto Fonokit'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (75)::numeric) THEN 'Alta experiencia clínica'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (50)::numeric) THEN 'Profesional con experiencia'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (25)::numeric) THEN 'Experiencia básica'::text
            ELSE 'En formación'::text
        END AS global_badge,
        CASE
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (90)::numeric) THEN '🟣'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (75)::numeric) THEN '🔵'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (50)::numeric) THEN '🟠'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (25)::numeric) THEN '🟡'::text
            ELSE '🔹'::text
        END AS global_badge_emoji,
        CASE
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (90)::numeric) THEN 'purple'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (75)::numeric) THEN 'blue'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (50)::numeric) THEN 'orange'::text
            WHEN (round(avg(v_reputation_specialty_scores.final_score)) >= (25)::numeric) THEN 'yellow'::text
            ELSE 'gray'::text
        END AS global_badge_color
   FROM public.v_reputation_specialty_scores
  GROUP BY v_reputation_specialty_scores.therapist_id;


--
-- Name: v_therapist_course_suggestions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_therapist_course_suggestions AS
 SELECT ts.therapist_id,
    sc.id AS course_id,
    sc.title AS course_title,
    sc.provider AS course_provider,
    'curso'::text AS course_level,
    ''::text AS course_description,
    10 AS course_points,
    10 AS real_points_gain,
    sc.url AS course_url,
    NULL::numeric AS course_price,
    NULL::integer AS course_hours,
    'online'::text AS course_modality,
    'Chile'::text AS course_country,
    false AS course_featured,
        CASE
            WHEN ((rb.final_score + 10) >=
            CASE
                WHEN (rb.final_score < 25) THEN 25
                WHEN (rb.final_score < 50) THEN 50
                WHEN (rb.final_score < 75) THEN 75
                WHEN (rb.final_score < 90) THEN 90
                ELSE 100
            END) THEN true
            ELSE false
        END AS would_level_up,
    s.name AS specialty_name,
        CASE s.slug
            WHEN 'audicion'::text THEN '👂'::text
            WHEN 'cognicion'::text THEN '🧠'::text
            WHEN 'deglucion'::text THEN '🍽️'::text
            WHEN 'estetica'::text THEN '✨'::text
            WHEN 'lenguaje-adulto'::text THEN '💬'::text
            WHEN 'lenguaje-infantil'::text THEN '👶'::text
            WHEN 'habla'::text THEN '🗣️'::text
            WHEN 'voz'::text THEN '🎤'::text
            WHEN 'miofuncional'::text THEN '💪'::text
            ELSE '🔹'::text
        END AS specialty_icon,
    ('Este curso puede mejorar tu nivel en '::text || s.name) AS motivation_message,
        CASE
            WHEN ((rb.final_score + 10) >=
            CASE
                WHEN (rb.final_score < 25) THEN 25
                WHEN (rb.final_score < 50) THEN 50
                WHEN (rb.final_score < 75) THEN 75
                WHEN (rb.final_score < 90) THEN 90
                ELSE 100
            END) THEN 100
            ELSE 10
        END AS recommendation_priority
   FROM (((public.therapist_specialties ts
     JOIN public.specialties s ON ((s.id = ts.specialty_id)))
     JOIN public.v_reputation_badges rb ON (((rb.therapist_id = ts.therapist_id) AND (rb.specialty_id = ts.specialty_id))))
     LEFT JOIN public.suggested_courses sc ON (((sc.specialty_id = ts.specialty_id) AND (sc.status = 'active'::text))))
  WHERE ((ts.is_public = true) AND (sc.id IS NOT NULL));


--
-- Name: v_therapist_full_profile; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_therapist_full_profile AS
 SELECT p.id,
    p.full_name,
    p.email,
    p.phone,
    p.rut,
    p.region_id,
    p.city_id,
    td.slug,
    td.about_me,
    td.headline_statement,
    td.professional_title,
    td.university,
    td.graduation_year,
    td.years_experience,
    td.is_public,
    td.public_email,
    td.main_address,
    td.specialization_areas,
    td.languages,
    td.social_instagram_url,
    td.social_facebook_url,
    td.social_linkedin_url,
    td.social_twitter_url,
    tb.avatar_url,
    tb.logo_url,
    tb.primary_color,
    tb.secondary_color,
    tb.accent_color,
    tb.text_color,
    tb.background_color,
    tb.font_family,
    tb.font_size_base
   FROM ((public.profiles p
     LEFT JOIN public.therapist_details td ON ((td.user_id = p.id)))
     LEFT JOIN public.therapist_branding tb ON ((tb.therapist_id = p.id)))
  WHERE (p.role = 'therapist'::public.user_role);


--
-- Name: v_therapist_metrics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_therapist_metrics AS
 SELECT t.user_id AS therapist_id,
    p.full_name AS therapist_name,
    count(DISTINCT ch.patient_id) AS total_patients,
    count(DISTINCT ch.id) AS total_sessions,
    count(DISTINCT a.id) AS total_appointments,
    avg(ch.duration_minutes) AS avg_session_duration,
    count(DISTINCT mi.id) AS marketplace_items,
    COALESCE(sum(tc.commission_amount), (0)::numeric) AS total_commissions
   FROM (((((public.therapist_details t
     JOIN public.profiles p ON ((p.id = t.user_id)))
     LEFT JOIN public.clinical_history ch ON (((ch.therapist_id = t.user_id) AND (ch.entry_type = 'sesion'::text))))
     LEFT JOIN public.appointments a ON ((a.therapist_id = t.user_id)))
     LEFT JOIN public.marketplace_items mi ON ((mi.seller_id = t.user_id)))
     LEFT JOIN public.therapist_commissions tc ON ((tc.therapist_id = t.user_id)))
  GROUP BY t.user_id, p.full_name;


--
-- Name: v_therapist_specialty_progress; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_therapist_specialty_progress AS
 SELECT rb.therapist_id,
    rb.specialty_id,
    rb.specialty_slug,
    rb.specialty_name,
    rb.specialty_icon,
    rb.final_score,
    rb.education_points,
    rb.experience_points,
    rb.unique_patients,
    rb.badge_level,
    rb.badge_label,
    rb.badge_emoji,
    rb.badge_color,
        CASE
            WHEN (rb.final_score >= 90) THEN 'Experto Fonokit'::text
            WHEN (rb.final_score >= 75) THEN 'Experto Fonokit'::text
            WHEN (rb.final_score >= 50) THEN 'Alta experiencia clínica'::text
            WHEN (rb.final_score >= 25) THEN 'Profesional con experiencia'::text
            ELSE 'Experiencia básica'::text
        END AS next_badge_label,
        CASE
            WHEN (rb.final_score >= 90) THEN '🟣'::text
            WHEN (rb.final_score >= 75) THEN '🟣'::text
            WHEN (rb.final_score >= 50) THEN '🔵'::text
            WHEN (rb.final_score >= 25) THEN '🟠'::text
            ELSE '🟡'::text
        END AS next_badge_emoji,
        CASE
            WHEN (rb.final_score >= 90) THEN 'experto'::text
            WHEN (rb.final_score >= 75) THEN 'experto'::text
            WHEN (rb.final_score >= 50) THEN 'alta_experiencia'::text
            WHEN (rb.final_score >= 25) THEN 'profesional_experiencia'::text
            ELSE 'experiencia_basica'::text
        END AS next_badge_level,
        CASE
            WHEN (rb.final_score >= 90) THEN 0
            WHEN (rb.final_score >= 75) THEN (90 - rb.final_score)
            WHEN (rb.final_score >= 50) THEN (75 - rb.final_score)
            WHEN (rb.final_score >= 25) THEN (50 - rb.final_score)
            ELSE (25 - rb.final_score)
        END AS points_to_next_badge,
        CASE
            WHEN (rb.final_score >= 90) THEN (100)::numeric
            WHEN (rb.final_score >= 75) THEN round(((((rb.final_score - 75))::numeric / (15)::numeric) * (100)::numeric))
            WHEN (rb.final_score >= 50) THEN round(((((rb.final_score - 50))::numeric / (25)::numeric) * (100)::numeric))
            WHEN (rb.final_score >= 25) THEN round(((((rb.final_score - 25))::numeric / (25)::numeric) * (100)::numeric))
            ELSE round((((rb.final_score)::numeric / (25)::numeric) * (100)::numeric))
        END AS progress_to_next_percent,
        CASE
            WHEN (rb.education_points <= rb.experience_points) THEN 'education'::text
            ELSE 'experience'::text
        END AS weakest_axis
   FROM public.v_reputation_badges rb;


--
-- Name: v_user_dashboard; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_user_dashboard AS
 SELECT profiles.id AS user_id,
    profiles.role,
        CASE profiles.role
            WHEN 'therapist'::public.user_role THEN '/dashboard/therapist'::text
            WHEN 'patient'::public.user_role THEN '/dashboard/patient'::text
            WHEN 'clinic'::public.user_role THEN '/dashboard/clinic'::text
            WHEN 'admin'::public.user_role THEN '/dashboard/admin'::text
            WHEN 'superadmin'::public.user_role THEN '/dashboard/superadmin'::text
            ELSE '/login'::text
        END AS dashboard_path
   FROM public.profiles;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    description text,
    reference_id text,
    reference_type text,
    status text DEFAULT 'completed'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT wallet_transactions_type_check CHECK ((type = ANY (ARRAY['credit'::text, 'debit'::text])))
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance numeric DEFAULT 0.00 NOT NULL,
    currency text DEFAULT 'CLP'::text,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    bank_account_data jsonb NOT NULL,
    requested_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone,
    estimated_completion_date date,
    admin_notes text,
    CONSTRAINT withdrawal_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'rejected'::text])))
);


--
-- Name: word_searches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.word_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    config jsonb NOT NULL,
    grid jsonb NOT NULL,
    solution_grid jsonb NOT NULL,
    placed_words text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- Name: activity_categories activity_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_categories
    ADD CONSTRAINT activity_categories_code_key UNIQUE (code);


--
-- Name: activity_categories activity_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_categories
    ADD CONSTRAINT activity_categories_pkey PRIMARY KEY (id);


--
-- Name: activity_library activity_library_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_library
    ADD CONSTRAINT activity_library_pkey PRIMARY KEY (id);


--
-- Name: adir_evaluations adir_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_evaluations
    ADD CONSTRAINT adir_evaluations_pkey PRIMARY KEY (id);


--
-- Name: adir_item_responses adir_item_responses_evaluation_id_item_code_period_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_item_responses
    ADD CONSTRAINT adir_item_responses_evaluation_id_item_code_period_key UNIQUE (evaluation_id, item_code, period);


--
-- Name: adir_item_responses adir_item_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_item_responses
    ADD CONSTRAINT adir_item_responses_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_permissions admin_permissions_user_id_module_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_module_key UNIQUE (user_id, module);


--
-- Name: ados2_evaluations ados2_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ados2_evaluations
    ADD CONSTRAINT ados2_evaluations_pkey PRIMARY KEY (id);


--
-- Name: ados2_item_responses ados2_item_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ados2_item_responses
    ADD CONSTRAINT ados2_item_responses_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_analysis ai_conversation_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_analysis
    ADD CONSTRAINT ai_conversation_analysis_pkey PRIMARY KEY (id);


--
-- Name: ai_feedback ai_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_pkey PRIMARY KEY (id);


--
-- Name: ai_plan_limits ai_plan_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_plan_limits
    ADD CONSTRAINT ai_plan_limits_pkey PRIMARY KEY (plan_name);


--
-- Name: ai_recommendation_feedback ai_recommendation_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendation_feedback
    ADD CONSTRAINT ai_recommendation_feedback_pkey PRIMARY KEY (id);


--
-- Name: ai_settings ai_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_key_key UNIQUE (key);


--
-- Name: ai_settings ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_quotas ai_usage_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_quotas
    ADD CONSTRAINT ai_usage_quotas_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_quotas ai_usage_quotas_therapist_id_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_quotas
    ADD CONSTRAINT ai_usage_quotas_therapist_id_period_start_key UNIQUE (therapist_id, period_start);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: arco_requests arco_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arco_requests
    ADD CONSTRAINT arco_requests_pkey PRIMARY KEY (id);


--
-- Name: assigned_plan_activities assigned_plan_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: availability_logs availability_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_logs
    ADD CONSTRAINT availability_logs_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices billing_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: billing_invoices billing_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_pkey PRIMARY KEY (id);


--
-- Name: blocked_slots blocked_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_slots
    ADD CONSTRAINT blocked_slots_pkey PRIMARY KEY (id);


--
-- Name: blocked_times blocked_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_times
    ADD CONSTRAINT blocked_times_pkey PRIMARY KEY (id);


--
-- Name: blog_article_tags blog_article_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_article_tags
    ADD CONSTRAINT blog_article_tags_pkey PRIMARY KEY (article_id, tag_id);


--
-- Name: blog_articles blog_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_pkey PRIMARY KEY (id);


--
-- Name: blog_articles blog_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_slug_key UNIQUE (slug);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_comments blog_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_question_id_key UNIQUE (question_id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: blog_reviews blog_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_reviews
    ADD CONSTRAINT blog_reviews_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_name_key UNIQUE (name);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug);


--
-- Name: calendar_blocks calendar_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_blocks
    ADD CONSTRAINT calendar_blocks_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: clinic_invitations clinic_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invitations
    ADD CONSTRAINT clinic_invitations_pkey PRIMARY KEY (id);


--
-- Name: clinic_invitations clinic_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invitations
    ADD CONSTRAINT clinic_invitations_token_key UNIQUE (token);


--
-- Name: clinic_invoices clinic_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invoices
    ADD CONSTRAINT clinic_invoices_pkey PRIMARY KEY (id);


--
-- Name: clinic_therapists clinic_therapists_clinic_id_therapist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_therapists
    ADD CONSTRAINT clinic_therapists_clinic_id_therapist_id_key UNIQUE (clinic_id, therapist_id);


--
-- Name: clinic_therapists clinic_therapists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_therapists
    ADD CONSTRAINT clinic_therapists_pkey PRIMARY KEY (id);


--
-- Name: clinical_access_log clinical_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_access_log
    ADD CONSTRAINT clinical_access_log_pkey PRIMARY KEY (id);


--
-- Name: clinical_entry_types clinical_entry_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_entry_types
    ADD CONSTRAINT clinical_entry_types_pkey PRIMARY KEY (code);


--
-- Name: clinical_history clinical_history_appointment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_history_appointment_id_key UNIQUE (appointment_id);


--
-- Name: clinical_history clinical_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_history_pkey PRIMARY KEY (id);


--
-- Name: clinical_reports clinical_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_reports
    ADD CONSTRAINT clinical_reports_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_rut_key UNIQUE (rut);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: cookie_consents cookie_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cookie_consents
    ADD CONSTRAINT cookie_consents_pkey PRIMARY KEY (id);


--
-- Name: coupon_uses coupon_uses_coupon_id_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_coupon_id_order_id_key UNIQUE (coupon_id, order_id);


--
-- Name: coupon_uses coupon_uses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_pkey PRIMARY KEY (id);


--
-- Name: course_enrollments course_enrollments_course_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_student_id_key UNIQUE (course_id, student_id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_lessons course_lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_lessons_pkey PRIMARY KEY (id);


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: course_reviews course_reviews_course_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_course_id_reviewer_id_key UNIQUE (course_id, reviewer_id);


--
-- Name: course_reviews course_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: courses courses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_slug_key UNIQUE (slug);


--
-- Name: debug_signup_logs debug_signup_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debug_signup_logs
    ADD CONSTRAINT debug_signup_logs_pkey PRIMARY KEY (id);


--
-- Name: diagnosis_codes diagnosis_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_codes
    ADD CONSTRAINT diagnosis_codes_pkey PRIMARY KEY (id);


--
-- Name: diagnosis_codes diagnosis_codes_system_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_codes
    ADD CONSTRAINT diagnosis_codes_system_code_unique UNIQUE (system_id, code);


--
-- Name: diagnosis_specialty_map diagnosis_specialty_map_diagnosis_pattern_match_type_specia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_specialty_map
    ADD CONSTRAINT diagnosis_specialty_map_diagnosis_pattern_match_type_specia_key UNIQUE (diagnosis_pattern, match_type, specialty_id);


--
-- Name: diagnosis_specialty_map diagnosis_specialty_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_specialty_map
    ADD CONSTRAINT diagnosis_specialty_map_pkey PRIMARY KEY (id);


--
-- Name: diagnosis_systems diagnosis_systems_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_systems
    ADD CONSTRAINT diagnosis_systems_code_key UNIQUE (code);


--
-- Name: diagnosis_systems diagnosis_systems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_systems
    ADD CONSTRAINT diagnosis_systems_pkey PRIMARY KEY (id);


--
-- Name: discount_coupons discount_coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_coupons
    ADD CONSTRAINT discount_coupons_code_key UNIQUE (code);


--
-- Name: discount_coupons discount_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_coupons
    ADD CONSTRAINT discount_coupons_pkey PRIMARY KEY (id);


--
-- Name: education_recommendations education_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_recommendations
    ADD CONSTRAINT education_recommendations_pkey PRIMARY KEY (id);


--
-- Name: email_notifications email_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_template_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_template_name_key UNIQUE (template_name);


--
-- Name: faq_chatbot faq_chatbot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faq_chatbot
    ADD CONSTRAINT faq_chatbot_pkey PRIMARY KEY (id);


--
-- Name: favorite_lists favorite_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_lists
    ADD CONSTRAINT favorite_lists_pkey PRIMARY KEY (id);


--
-- Name: favorite_lists favorite_lists_share_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_lists
    ADD CONSTRAINT favorite_lists_share_code_key UNIQUE (share_code);


--
-- Name: favorite_lists favorite_lists_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_lists
    ADD CONSTRAINT favorite_lists_user_id_name_key UNIQUE (user_id, name);


--
-- Name: generated_templates generated_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_templates
    ADD CONSTRAINT generated_templates_pkey PRIMARY KEY (id);


--
-- Name: insurance_providers insurance_providers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_code_key UNIQUE (code);


--
-- Name: insurance_providers insurance_providers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_name_key UNIQUE (name);


--
-- Name: insurance_providers insurance_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_providers
    ADD CONSTRAINT insurance_providers_pkey PRIMARY KEY (id);


--
-- Name: legal_disputes legal_disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_disputes
    ADD CONSTRAINT legal_disputes_pkey PRIMARY KEY (id);


--
-- Name: legal_document_versions legal_document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_document_versions
    ADD CONSTRAINT legal_document_versions_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: legal_documents legal_documents_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_slug_key UNIQUE (slug);


--
-- Name: legal_policies legal_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_policies
    ADD CONSTRAINT legal_policies_pkey PRIMARY KEY (id);


--
-- Name: legal_signatures legal_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_signatures
    ADD CONSTRAINT legal_signatures_pkey PRIMARY KEY (id);


--
-- Name: legal_signatures legal_signatures_user_id_document_id_document_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_signatures
    ADD CONSTRAINT legal_signatures_user_id_document_id_document_version_key UNIQUE (user_id, document_id, document_version);


--
-- Name: marketing_leads marketing_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_leads
    ADD CONSTRAINT marketing_leads_pkey PRIMARY KEY (id);


--
-- Name: marketplace_favorites marketplace_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_favorites
    ADD CONSTRAINT marketplace_favorites_pkey PRIMARY KEY (id);


--
-- Name: marketplace_favorites marketplace_favorites_user_id_marketplace_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_favorites
    ADD CONSTRAINT marketplace_favorites_user_id_marketplace_plan_id_key UNIQUE (user_id, marketplace_plan_id);


--
-- Name: marketplace_items marketplace_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_items marketplace_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_slug_key UNIQUE (slug);


--
-- Name: marketplace_orders marketplace_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_order_number_key UNIQUE (order_number);


--
-- Name: marketplace_orders marketplace_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);


--
-- Name: marketplace_payouts marketplace_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_payouts
    ADD CONSTRAINT marketplace_payouts_pkey PRIMARY KEY (id);


--
-- Name: marketplace_plans marketplace_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_plans
    ADD CONSTRAINT marketplace_plans_pkey PRIMARY KEY (id);


--
-- Name: marketplace_plans marketplace_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_plans
    ADD CONSTRAINT marketplace_plans_slug_key UNIQUE (slug);


--
-- Name: marketplace_purchases marketplace_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_purchases
    ADD CONSTRAINT marketplace_purchases_pkey PRIMARY KEY (id);


--
-- Name: marketplace_review_votes marketplace_review_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_review_votes
    ADD CONSTRAINT marketplace_review_votes_pkey PRIMARY KEY (id);


--
-- Name: marketplace_review_votes marketplace_review_votes_review_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_review_votes
    ADD CONSTRAINT marketplace_review_votes_review_id_user_id_key UNIQUE (review_id, user_id);


--
-- Name: marketplace_reviews marketplace_reviews_marketplace_item_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_marketplace_item_id_reviewer_id_key UNIQUE (marketplace_item_id, reviewer_id);


--
-- Name: marketplace_reviews marketplace_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_pkey PRIMARY KEY (id);


--
-- Name: marketplace_saved_searches marketplace_saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_saved_searches
    ADD CONSTRAINT marketplace_saved_searches_pkey PRIMARY KEY (id);


--
-- Name: measure_scales measure_scales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.measure_scales
    ADD CONSTRAINT measure_scales_pkey PRIMARY KEY (id);


--
-- Name: membership_plans membership_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membership_plans
    ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);


--
-- Name: metrics_summary metrics_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metrics_summary
    ADD CONSTRAINT metrics_summary_pkey PRIMARY KEY (id);


--
-- Name: metrics_summary metrics_summary_user_id_metric_type_period_start_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metrics_summary
    ADD CONSTRAINT metrics_summary_user_id_metric_type_period_start_key UNIQUE (user_id, metric_type, period_start);


--
-- Name: moderation_logs moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_pkey PRIMARY KEY (id);


--
-- Name: motivational_patient motivational_patient_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_patient
    ADD CONSTRAINT motivational_patient_pkey PRIMARY KEY (id);


--
-- Name: motivational_phrases motivational_phrases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_phrases
    ADD CONSTRAINT motivational_phrases_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notiz_sessions notiz_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notiz_sessions
    ADD CONSTRAINT notiz_sessions_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: patient_access_grants patient_access_grants_patient_id_granted_to_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_patient_id_granted_to_key UNIQUE (patient_id, granted_to);


--
-- Name: patient_access_grants patient_access_grants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_pkey PRIMARY KEY (id);


--
-- Name: patient_access_grants patient_access_grants_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_share_token_key UNIQUE (share_token);


--
-- Name: patient_activities patient_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT patient_activities_pkey PRIMARY KEY (id);


--
-- Name: patient_activity_logs patient_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: patient_assigned_plans patient_assigned_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assigned_plans
    ADD CONSTRAINT patient_assigned_plans_pkey PRIMARY KEY (id);


--
-- Name: patient_development_areas patient_development_areas_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_development_areas
    ADD CONSTRAINT patient_development_areas_name_key UNIQUE (name);


--
-- Name: patient_development_areas patient_development_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_development_areas
    ADD CONSTRAINT patient_development_areas_pkey PRIMARY KEY (id);


--
-- Name: patient_diagnoses patient_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_diagnoses
    ADD CONSTRAINT patient_diagnoses_pkey PRIMARY KEY (id);


--
-- Name: patient_document_templates patient_document_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_document_templates
    ADD CONSTRAINT patient_document_templates_pkey PRIMARY KEY (id);


--
-- Name: patient_documents patient_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_documents
    ADD CONSTRAINT patient_documents_pkey PRIMARY KEY (id);


--
-- Name: patient_evaluations patient_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_evaluations
    ADD CONSTRAINT patient_evaluations_pkey PRIMARY KEY (id);


--
-- Name: patient_goals patient_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_pkey PRIMARY KEY (id);


--
-- Name: patient_materials patient_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_materials
    ADD CONSTRAINT patient_materials_pkey PRIMARY KEY (id);


--
-- Name: patient_payments patient_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_payments
    ADD CONSTRAINT patient_payments_pkey PRIMARY KEY (id);


--
-- Name: patient_plan_assignments patient_plan_assignments_patient_id_marketplace_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_patient_id_marketplace_plan_id_key UNIQUE (patient_id, marketplace_plan_id);


--
-- Name: patient_plan_assignments patient_plan_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_pkey PRIMARY KEY (id);


--
-- Name: patient_private_notes patient_private_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_private_notes
    ADD CONSTRAINT patient_private_notes_pkey PRIMARY KEY (id);


--
-- Name: patient_questions patient_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_questions
    ADD CONSTRAINT patient_questions_pkey PRIMARY KEY (id);


--
-- Name: patient_reviews patient_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_reviews
    ADD CONSTRAINT patient_reviews_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: patients patients_profile_therapist_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_profile_therapist_unique UNIQUE (profile_id, therapist_id);


--
-- Name: payments payments_appointment_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_appointment_id_unique UNIQUE (appointment_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: performance_metrics performance_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_metrics
    ADD CONSTRAINT performance_metrics_pkey PRIMARY KEY (id);


--
-- Name: pie_paci pie_paci_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_paci
    ADD CONSTRAINT pie_paci_pkey PRIMARY KEY (id);


--
-- Name: pie_schedule_blocks pie_schedule_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_schedule_blocks
    ADD CONSTRAINT pie_schedule_blocks_pkey PRIMARY KEY (id);


--
-- Name: pie_sessions pie_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_sessions
    ADD CONSTRAINT pie_sessions_pkey PRIMARY KEY (id);


--
-- Name: pie_student_data pie_student_data_patient_id_academic_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_student_data
    ADD CONSTRAINT pie_student_data_patient_id_academic_year_key UNIQUE (patient_id, academic_year);


--
-- Name: pie_student_data pie_student_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_student_data
    ADD CONSTRAINT pie_student_data_pkey PRIMARY KEY (id);


--
-- Name: pie_students pie_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_students
    ADD CONSTRAINT pie_students_pkey PRIMARY KEY (id);


--
-- Name: pie_therapist_schools pie_therapist_schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_therapist_schools
    ADD CONSTRAINT pie_therapist_schools_pkey PRIMARY KEY (id);


--
-- Name: pie_therapist_schools pie_therapist_schools_therapist_id_school_id_academic_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_therapist_schools
    ADD CONSTRAINT pie_therapist_schools_therapist_id_school_id_academic_year_key UNIQUE (therapist_id, school_id, academic_year);


--
-- Name: plan_objective_activities plan_objective_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objective_activities
    ADD CONSTRAINT plan_objective_activities_pkey PRIMARY KEY (id);


--
-- Name: plan_objectives plan_objectives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objectives
    ADD CONSTRAINT plan_objectives_pkey PRIMARY KEY (id);


--
-- Name: plan_sessions plan_sessions_assigned_plan_id_session_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_sessions
    ADD CONSTRAINT plan_sessions_assigned_plan_id_session_number_key UNIQUE (assigned_plan_id, session_number);


--
-- Name: plan_sessions plan_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_sessions
    ADD CONSTRAINT plan_sessions_pkey PRIMARY KEY (id);


--
-- Name: plan_template_exercises plan_template_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_template_exercises
    ADD CONSTRAINT plan_template_exercises_pkey PRIMARY KEY (id);


--
-- Name: planification_types planification_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planification_types
    ADD CONSTRAINT planification_types_name_key UNIQUE (name);


--
-- Name: planification_types planification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planification_types
    ADD CONSTRAINT planification_types_pkey PRIMARY KEY (id);


--
-- Name: platform_feedback platform_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_feedback
    ADD CONSTRAINT platform_feedback_pkey PRIMARY KEY (id);


--
-- Name: product_sales product_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sales
    ADD CONSTRAINT product_sales_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_rut_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_rut_key UNIQUE (rut);


--
-- Name: progress_reports progress_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_reports
    ADD CONSTRAINT progress_reports_pkey PRIMARY KEY (id);


--
-- Name: qa_answers qa_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_answers
    ADD CONSTRAINT qa_answers_pkey PRIMARY KEY (id);


--
-- Name: qa_categories qa_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT qa_categories_pkey PRIMARY KEY (id);


--
-- Name: qa_categories qa_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_categories
    ADD CONSTRAINT qa_categories_slug_key UNIQUE (slug);


--
-- Name: qa_questions qa_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_pkey PRIMARY KEY (id);


--
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: reminder_logs reminder_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_pkey PRIMARY KEY (id);


--
-- Name: report_logs report_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_logs
    ADD CONSTRAINT report_logs_pkey PRIMARY KEY (id);


--
-- Name: review_helpful_votes review_helpful_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id);


--
-- Name: review_helpful_votes review_helpful_votes_review_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_user_id_key UNIQUE (review_id, user_id);


--
-- Name: review_reports review_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_pkey PRIMARY KEY (id);


--
-- Name: review_reports review_reports_review_id_reporter_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_review_id_reporter_id_key UNIQUE (review_id, reporter_id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sales_summary sales_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_pkey PRIMARY KEY (id);


--
-- Name: scheduled_reminders scheduled_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_pkey PRIMARY KEY (id);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: schools schools_rbd_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_rbd_key UNIQUE (rbd);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: sensorial_evaluations sensorial_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_evaluations
    ADD CONSTRAINT sensorial_evaluations_pkey PRIMARY KEY (id);


--
-- Name: sensorial_item_responses sensorial_item_responses_evaluation_id_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_item_responses
    ADD CONSTRAINT sensorial_item_responses_evaluation_id_item_code_key UNIQUE (evaluation_id, item_code);


--
-- Name: sensorial_item_responses sensorial_item_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_item_responses
    ADD CONSTRAINT sensorial_item_responses_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: session_activities session_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_pkey PRIMARY KEY (id);


--
-- Name: session_activities session_activities_session_id_display_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_session_id_display_order_key UNIQUE (session_id, display_order);


--
-- Name: session_logs session_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_pkey PRIMARY KEY (id);


--
-- Name: specialties specialties_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_name_key UNIQUE (name);


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (id);


--
-- Name: specialty_change_logs specialty_change_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_change_logs
    ADD CONSTRAINT specialty_change_logs_pkey PRIMARY KEY (id);


--
-- Name: specialty_keywords specialty_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_keywords
    ADD CONSTRAINT specialty_keywords_pkey PRIMARY KEY (id);


--
-- Name: subscription_payments subscription_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_key UNIQUE (slug);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: suggested_courses suggested_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggested_courses
    ADD CONSTRAINT suggested_courses_pkey PRIMARY KEY (id);


--
-- Name: support_incident_notes support_incident_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_incident_notes
    ADD CONSTRAINT support_incident_notes_pkey PRIMARY KEY (id);


--
-- Name: support_incidents support_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_incidents
    ADD CONSTRAINT support_incidents_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_notes support_ticket_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT support_ticket_notes_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: symptom_profiles symptom_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_profiles
    ADD CONSTRAINT symptom_profiles_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- Name: therapist_appointments therapist_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_appointments
    ADD CONSTRAINT therapist_appointments_pkey PRIMARY KEY (id);


--
-- Name: therapist_availabilities therapist_availabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_availabilities
    ADD CONSTRAINT therapist_availabilities_pkey PRIMARY KEY (id);


--
-- Name: therapist_branding therapist_branding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_branding
    ADD CONSTRAINT therapist_branding_pkey PRIMARY KEY (id);


--
-- Name: therapist_branding therapist_branding_therapist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_branding
    ADD CONSTRAINT therapist_branding_therapist_id_key UNIQUE (therapist_id);


--
-- Name: therapist_commissions therapist_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_commissions
    ADD CONSTRAINT therapist_commissions_pkey PRIMARY KEY (id);


--
-- Name: therapist_conditions therapist_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_conditions
    ADD CONSTRAINT therapist_conditions_pkey PRIMARY KEY (id);


--
-- Name: therapist_details therapist_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT therapist_details_pkey PRIMARY KEY (user_id);


--
-- Name: therapist_details therapist_details_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT therapist_details_slug_key UNIQUE (slug);


--
-- Name: therapist_details therapist_details_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT therapist_details_user_id_key UNIQUE (user_id);


--
-- Name: therapist_documents therapist_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_documents
    ADD CONSTRAINT therapist_documents_pkey PRIMARY KEY (id);


--
-- Name: therapist_education therapist_education_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_education
    ADD CONSTRAINT therapist_education_pkey PRIMARY KEY (id);


--
-- Name: therapist_exercises therapist_exercises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_exercises
    ADD CONSTRAINT therapist_exercises_pkey PRIMARY KEY (id);


--
-- Name: therapist_experience therapist_experience_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_experience
    ADD CONSTRAINT therapist_experience_pkey PRIMARY KEY (id);


--
-- Name: therapist_favorite_activities therapist_favorite_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_favorite_activities
    ADD CONSTRAINT therapist_favorite_activities_pkey PRIMARY KEY (id);


--
-- Name: therapist_favorite_activities therapist_favorite_activities_therapist_id_activity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_favorite_activities
    ADD CONSTRAINT therapist_favorite_activities_therapist_id_activity_id_key UNIQUE (therapist_id, activity_id);


--
-- Name: therapist_insurances therapist_insurances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_insurances
    ADD CONSTRAINT therapist_insurances_pkey PRIMARY KEY (id);


--
-- Name: therapist_insurances therapist_insurances_therapist_id_insurance_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_insurances
    ADD CONSTRAINT therapist_insurances_therapist_id_insurance_provider_id_key UNIQUE (therapist_id, insurance_provider_id);


--
-- Name: therapist_invitations therapist_invitations_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invitations
    ADD CONSTRAINT therapist_invitations_invite_code_key UNIQUE (invite_code);


--
-- Name: therapist_invitations therapist_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invitations
    ADD CONSTRAINT therapist_invitations_pkey PRIMARY KEY (id);


--
-- Name: therapist_invite_quotas therapist_invite_quotas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invite_quotas
    ADD CONSTRAINT therapist_invite_quotas_pkey PRIMARY KEY (id);


--
-- Name: therapist_invite_quotas therapist_invite_quotas_therapist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invite_quotas
    ADD CONSTRAINT therapist_invite_quotas_therapist_id_key UNIQUE (therapist_id);


--
-- Name: therapist_landing_pages therapist_landing_pages_custom_url_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_landing_pages
    ADD CONSTRAINT therapist_landing_pages_custom_url_key UNIQUE (custom_url);


--
-- Name: therapist_landing_pages therapist_landing_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_landing_pages
    ADD CONSTRAINT therapist_landing_pages_pkey PRIMARY KEY (id);


--
-- Name: therapist_landing_pages therapist_landing_pages_therapist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_landing_pages
    ADD CONSTRAINT therapist_landing_pages_therapist_id_key UNIQUE (therapist_id);


--
-- Name: therapist_materials therapist_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_materials
    ADD CONSTRAINT therapist_materials_pkey PRIMARY KEY (id);


--
-- Name: therapist_profiles therapist_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_profiles
    ADD CONSTRAINT therapist_profiles_pkey PRIMARY KEY (id);


--
-- Name: therapist_recommendations therapist_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_recommendations
    ADD CONSTRAINT therapist_recommendations_pkey PRIMARY KEY (id);


--
-- Name: therapist_services therapist_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_services
    ADD CONSTRAINT therapist_services_pkey PRIMARY KEY (id);


--
-- Name: therapist_specialties therapist_specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_specialties
    ADD CONSTRAINT therapist_specialties_pkey PRIMARY KEY (therapist_id, specialty_id);


--
-- Name: therapist_subscriptions therapist_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_subscriptions
    ADD CONSTRAINT therapist_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: therapists therapists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapists
    ADD CONSTRAINT therapists_pkey PRIMARY KEY (id);


--
-- Name: therapy_sessions therapy_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_pkey PRIMARY KEY (id);


--
-- Name: treatment_plans treatment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_pkey PRIMARY KEY (id);


--
-- Name: appointments unique_appointment_slot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT unique_appointment_slot UNIQUE (therapist_id, clinic_id, date, start_time);


--
-- Name: therapist_availabilities unique_availability_slot; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_availabilities
    ADD CONSTRAINT unique_availability_slot UNIQUE (therapist_id, clinic_id, day_of_week, start_time);


--
-- Name: therapist_subscriptions unique_external_reference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_subscriptions
    ADD CONSTRAINT unique_external_reference UNIQUE (external_reference);


--
-- Name: team_members unique_user_per_clinic; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT unique_user_per_clinic UNIQUE (clinic_id, user_id);


--
-- Name: user_addons user_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addons
    ADD CONSTRAINT user_addons_pkey PRIMARY KEY (id);


--
-- Name: user_addons user_addons_user_id_addon_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addons
    ADD CONSTRAINT user_addons_user_id_addon_key_key UNIQUE (user_id, addon_key);


--
-- Name: user_analytics user_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_phrases user_favorite_phrases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_phrases
    ADD CONSTRAINT user_favorite_phrases_pkey PRIMARY KEY (id);


--
-- Name: user_favorite_phrases user_favorite_phrases_user_id_phrase_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_phrases
    ADD CONSTRAINT user_favorite_phrases_user_id_phrase_id_key UNIQUE (user_id, phrase_id);


--
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: word_searches word_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_searches
    ADD CONSTRAINT word_searches_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices_invoice_number_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX billing_invoices_invoice_number_unique ON public.billing_invoices USING btree (lower(invoice_number));


--
-- Name: clinical_reports_encounter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinical_reports_encounter_idx ON public.clinical_reports USING btree (encounter_id);


--
-- Name: clinical_reports_patient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinical_reports_patient_idx ON public.clinical_reports USING btree (patient_id);


--
-- Name: clinical_reports_signed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinical_reports_signed_idx ON public.clinical_reports USING btree (signed_at);


--
-- Name: clinical_reports_therapist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinical_reports_therapist_idx ON public.clinical_reports USING btree (therapist_id);


--
-- Name: clinics_therapist_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinics_therapist_active_idx ON public.clinics USING btree (therapist_id) WHERE is_active;


--
-- Name: idx_access_grants_granted_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_grants_granted_to ON public.patient_access_grants USING btree (granted_to);


--
-- Name: idx_access_grants_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_grants_patient ON public.patient_access_grants USING btree (patient_id);


--
-- Name: idx_access_grants_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_grants_token ON public.patient_access_grants USING btree (share_token);


--
-- Name: idx_access_log_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_log_patient ON public.clinical_access_log USING btree (patient_id);


--
-- Name: idx_activity_library_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_library_category ON public.activity_library USING btree (category_id);


--
-- Name: idx_activity_library_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_library_global ON public.activity_library USING btree (is_global) WHERE (is_global = true);


--
-- Name: idx_activity_library_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_library_tags ON public.activity_library USING gin (tags);


--
-- Name: idx_activity_library_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_library_therapist ON public.activity_library USING btree (therapist_id);


--
-- Name: idx_activity_logs_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_patient ON public.patient_activity_logs USING btree (patient_id);


--
-- Name: idx_admin_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_permissions_user ON public.admin_permissions USING btree (user_id);


--
-- Name: idx_ados2_eval_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ados2_eval_patient ON public.ados2_evaluations USING btree (patient_id);


--
-- Name: idx_ados2_eval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ados2_eval_status ON public.ados2_evaluations USING btree (status);


--
-- Name: idx_ados2_eval_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ados2_eval_therapist ON public.ados2_evaluations USING btree (therapist_id);


--
-- Name: idx_ados2_responses_eval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ados2_responses_eval ON public.ados2_item_responses USING btree (evaluation_id);


--
-- Name: idx_ai_chat_messages_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_messages_created ON public.ai_chat_messages USING btree (created_at);


--
-- Name: idx_ai_chat_messages_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_messages_session ON public.ai_chat_messages USING btree (session_id);


--
-- Name: idx_ai_chat_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_active ON public.ai_chat_sessions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_ai_chat_sessions_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_patient ON public.ai_chat_sessions USING btree (patient_id);


--
-- Name: idx_ai_chat_sessions_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_chat_sessions_therapist ON public.ai_chat_sessions USING btree (therapist_id);


--
-- Name: idx_ai_conversation_analysis_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_conversation_analysis_session ON public.ai_conversation_analysis USING btree (session_id);


--
-- Name: idx_ai_feedback_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_feedback_patient ON public.ai_feedback USING btree (patient_id);


--
-- Name: idx_ai_feedback_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_feedback_session ON public.ai_feedback USING btree (session_id);


--
-- Name: idx_ai_feedback_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_feedback_status ON public.ai_feedback USING btree (status);


--
-- Name: idx_ai_feedback_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_feedback_therapist ON public.ai_feedback USING btree (therapist_id);


--
-- Name: idx_ai_recommendation_feedback_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendation_feedback_created ON public.ai_recommendation_feedback USING btree (created_at);


--
-- Name: idx_ai_recommendation_feedback_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendation_feedback_type ON public.ai_recommendation_feedback USING btree (recommendation_type);


--
-- Name: idx_ai_recommendation_feedback_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recommendation_feedback_user ON public.ai_recommendation_feedback USING btree (user_id);


--
-- Name: idx_appointments_confirmation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_confirmation ON public.appointments USING btree (confirmation_status);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (date, therapist_id);


--
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_appointments_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_therapist ON public.appointments USING btree (therapist_id);


--
-- Name: idx_appointments_therapist_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_therapist_date ON public.therapist_appointments USING btree (therapist_id, appointment_date);


--
-- Name: idx_appt_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appt_clinic ON public.appointments USING btree (clinic_id);


--
-- Name: idx_appt_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appt_patient ON public.appointments USING btree (patient_id);


--
-- Name: idx_appt_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appt_therapist ON public.appointments USING btree (therapist_id);


--
-- Name: idx_assigned_plan_activities_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assigned_plan_activities_date ON public.assigned_plan_activities USING btree (scheduled_date);


--
-- Name: idx_assigned_plan_activities_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assigned_plan_activities_plan ON public.assigned_plan_activities USING btree (assigned_plan_id);


--
-- Name: idx_audit_logs_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_record ON public.audit_logs USING btree (record_id);


--
-- Name: idx_audit_logs_table; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_table ON public.audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_availability_logs_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_availability_logs_therapist ON public.availability_logs USING btree (therapist_id);


--
-- Name: idx_billing_invoices_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_invoices_therapist ON public.billing_invoices USING btree (therapist_id);


--
-- Name: idx_blog_posts_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_author_id ON public.blog_posts USING btree (author_id);


--
-- Name: idx_blog_posts_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_question_id ON public.blog_posts USING btree (question_id);


--
-- Name: idx_blog_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);


--
-- Name: idx_blog_reviews_blog_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_reviews_blog_post_id ON public.blog_reviews USING btree (blog_post_id);


--
-- Name: idx_blog_reviews_reviewer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blog_reviews_reviewer_id ON public.blog_reviews USING btree (reviewer_id);


--
-- Name: idx_calendar_blocks_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_blocks_datetime ON public.calendar_blocks USING btree (start_datetime, end_datetime);


--
-- Name: idx_calendar_blocks_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_blocks_therapist ON public.calendar_blocks USING btree (therapist_id);


--
-- Name: idx_cities_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_region ON public.cities USING btree (region_id);


--
-- Name: idx_cities_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_region_id ON public.cities USING btree (region_id);


--
-- Name: idx_clinic_invitations_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invitations_clinic_id ON public.clinic_invitations USING btree (clinic_id);


--
-- Name: idx_clinic_invitations_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invitations_email ON public.clinic_invitations USING btree (email);


--
-- Name: idx_clinic_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invitations_token ON public.clinic_invitations USING btree (token);


--
-- Name: idx_clinic_invoices_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invoices_clinic ON public.clinic_invoices USING btree (clinic_id);


--
-- Name: idx_clinic_invoices_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invoices_periodo ON public.clinic_invoices USING btree (periodo);


--
-- Name: idx_clinic_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_invoices_status ON public.clinic_invoices USING btree (status);


--
-- Name: idx_clinic_therapists_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_therapists_clinic ON public.clinic_therapists USING btree (clinic_id);


--
-- Name: idx_clinic_therapists_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinic_therapists_therapist ON public.clinic_therapists USING btree (therapist_id);


--
-- Name: idx_clinical_history_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_appointment_id ON public.clinical_history USING btree (appointment_id);


--
-- Name: idx_clinical_history_assigned_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_assigned_plan ON public.clinical_history USING btree (assigned_plan_id);


--
-- Name: idx_clinical_history_patient_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_patient_date ON public.clinical_history USING btree (patient_id, entry_date DESC);


--
-- Name: idx_clinical_history_patient_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_patient_therapist ON public.clinical_history USING btree (patient_id, therapist_id);


--
-- Name: idx_clinical_history_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_history_plan ON public.clinical_history USING btree (assigned_plan_id);


--
-- Name: idx_clinical_reports_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_reports_patient ON public.clinical_reports USING btree (patient_id);


--
-- Name: idx_clinical_reports_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_reports_therapist ON public.clinical_reports USING btree (therapist_id);


--
-- Name: idx_clinical_reports_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinical_reports_type ON public.clinical_reports USING btree (report_type);


--
-- Name: idx_clinics_city_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_city_active ON public.clinics USING btree (city_id, is_active);


--
-- Name: idx_clinics_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_is_public ON public.clinics USING btree (is_public);


--
-- Name: idx_clinics_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_location ON public.clinics USING btree (latitude, longitude);


--
-- Name: idx_clinics_rut_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clinics_rut_empresa ON public.clinics USING btree (rut_empresa) WHERE ((rut_empresa IS NOT NULL) AND (rut_empresa <> ''::text));


--
-- Name: idx_clinics_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clinics_slug ON public.clinics USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: idx_clinics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_type ON public.clinics USING btree (type);


--
-- Name: idx_course_lessons_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_lessons_product ON public.course_lessons USING btree (product_id);


--
-- Name: idx_courses_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);


--
-- Name: idx_courses_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_specialty ON public.courses USING btree (specialty_id);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_ct_therapist_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ct_therapist_active ON public.clinic_therapists USING btree (therapist_id, is_active);


--
-- Name: idx_diagnosis_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnosis_codes_code ON public.diagnosis_codes USING btree (code);


--
-- Name: idx_diagnosis_codes_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnosis_codes_system ON public.diagnosis_codes USING btree (system_id);


--
-- Name: idx_diagnosis_codes_system_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_diagnosis_codes_system_code ON public.diagnosis_codes USING btree (system_id, code);


--
-- Name: idx_discount_coupons_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_coupons_code ON public.discount_coupons USING btree (code);


--
-- Name: idx_discount_coupons_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_coupons_is_active ON public.discount_coupons USING btree (is_active);


--
-- Name: idx_edu_rec_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edu_rec_level ON public.education_recommendations USING btree (education_level) WHERE (is_active = true);


--
-- Name: idx_edu_rec_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edu_rec_specialty ON public.education_recommendations USING btree (specialty_id) WHERE (is_active = true);


--
-- Name: idx_email_notifications_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_scheduled ON public.email_notifications USING btree (scheduled_for);


--
-- Name: idx_email_notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_status ON public.email_notifications USING btree (status);


--
-- Name: idx_email_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_type ON public.email_notifications USING btree (notification_type);


--
-- Name: idx_email_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_notifications_user ON public.email_notifications USING btree (user_id);


--
-- Name: idx_email_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_type ON public.email_templates USING btree (notification_type);


--
-- Name: idx_enrollments_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_course ON public.course_enrollments USING btree (course_id);


--
-- Name: idx_enrollments_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_student ON public.course_enrollments USING btree (student_id);


--
-- Name: idx_favorite_activities_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorite_activities_activity ON public.therapist_favorite_activities USING btree (activity_id);


--
-- Name: idx_favorite_activities_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorite_activities_therapist ON public.therapist_favorite_activities USING btree (therapist_id);


--
-- Name: idx_helpful_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_helpful_review ON public.review_helpful_votes USING btree (review_id);


--
-- Name: idx_helpful_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_helpful_user ON public.review_helpful_votes USING btree (user_id);


--
-- Name: idx_insurance_providers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insurance_providers_active ON public.insurance_providers USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_invitations_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_code ON public.therapist_invitations USING btree (invite_code);


--
-- Name: idx_invitations_inviter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invitations_inviter ON public.therapist_invitations USING btree (inviter_id);


--
-- Name: idx_leads_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_email ON public.marketing_leads USING btree (email);


--
-- Name: idx_leads_segment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_segment ON public.marketing_leads USING btree (segment);


--
-- Name: idx_leads_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_source ON public.marketing_leads USING btree (source);


--
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.marketing_leads USING btree (status);


--
-- Name: idx_leads_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_tags ON public.marketing_leads USING gin (tags);


--
-- Name: idx_lists_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_public ON public.favorite_lists USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_lists_share; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_share ON public.favorite_lists USING btree (share_code) WHERE (share_code IS NOT NULL);


--
-- Name: idx_lists_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lists_user ON public.favorite_lists USING btree (user_id);


--
-- Name: idx_marketplace_items_age; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_age ON public.marketplace_items USING btree (target_age_min, target_age_max);


--
-- Name: idx_marketplace_items_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_approved ON public.marketplace_items USING btree (is_approved, is_active) WHERE ((is_approved = true) AND (is_active = true));


--
-- Name: idx_marketplace_items_diagnosis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_diagnosis ON public.marketplace_items USING gin (target_diagnosis);


--
-- Name: idx_marketplace_items_material; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_material ON public.marketplace_items USING btree (therapist_material_id);


--
-- Name: idx_marketplace_items_plan_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_plan_template ON public.marketplace_items USING btree (plan_template_id);


--
-- Name: idx_marketplace_items_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_seller ON public.marketplace_items USING btree (seller_id);


--
-- Name: idx_marketplace_items_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_items_type ON public.marketplace_items USING btree (item_type);


--
-- Name: idx_marketplace_orders_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_orders_buyer ON public.marketplace_orders USING btree (buyer_id);


--
-- Name: idx_marketplace_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders USING btree (status);


--
-- Name: idx_marketplace_reviews_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_reviews_item ON public.marketplace_reviews USING btree (marketplace_item_id);


--
-- Name: idx_marketplace_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_reviews_rating ON public.marketplace_reviews USING btree (rating);


--
-- Name: idx_marketplace_reviews_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marketplace_reviews_reviewer ON public.marketplace_reviews USING btree (reviewer_id);


--
-- Name: idx_metrics_summary_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metrics_summary_period ON public.metrics_summary USING btree (period_start, period_end);


--
-- Name: idx_metrics_summary_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metrics_summary_user ON public.metrics_summary USING btree (user_id);


--
-- Name: idx_motivational_phrases_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_motivational_phrases_active ON public.motivational_phrases USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_motivational_phrases_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_motivational_phrases_category ON public.motivational_phrases USING btree (category);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read) WHERE (read = false);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_notiz_sessions_therapist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notiz_sessions_therapist_id ON public.notiz_sessions USING btree (therapist_id);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_patient_activities_goal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_activities_goal ON public.patient_activities USING btree (goal_id);


--
-- Name: idx_patient_activities_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_activities_patient ON public.patient_activities USING btree (patient_id);


--
-- Name: idx_patient_activity_logs_activity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_activity_logs_activity ON public.patient_activity_logs USING btree (activity_id);


--
-- Name: idx_patient_activity_logs_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_activity_logs_patient ON public.patient_activity_logs USING btree (patient_id);


--
-- Name: idx_patient_assigned_plans_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_assigned_plans_patient ON public.patient_assigned_plans USING btree (patient_id);


--
-- Name: idx_patient_assigned_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_assigned_plans_status ON public.patient_assigned_plans USING btree (status);


--
-- Name: idx_patient_assigned_plans_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_assigned_plans_therapist ON public.patient_assigned_plans USING btree (therapist_id);


--
-- Name: idx_patient_diagnoses_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_diagnoses_code ON public.patient_diagnoses USING btree (code_id);


--
-- Name: idx_patient_diagnoses_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_diagnoses_patient ON public.patient_diagnoses USING btree (patient_id);


--
-- Name: idx_patient_diagnoses_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_diagnoses_primary ON public.patient_diagnoses USING btree (is_primary) WHERE (is_primary = true);


--
-- Name: idx_patient_diagnoses_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_diagnoses_system ON public.patient_diagnoses USING btree (system_id);


--
-- Name: idx_patient_evaluations_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_evaluations_patient ON public.patient_evaluations USING btree (patient_id);


--
-- Name: idx_patient_evaluations_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_evaluations_therapist ON public.patient_evaluations USING btree (therapist_id);


--
-- Name: idx_patient_goals_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_goals_area ON public.patient_goals USING btree (area_id);


--
-- Name: idx_patient_goals_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_goals_patient ON public.patient_goals USING btree (patient_id);


--
-- Name: idx_patient_goals_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_goals_type ON public.patient_goals USING btree (goal_type);


--
-- Name: idx_patient_materials_assigned_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_materials_assigned_by ON public.patient_materials USING btree (assigned_by);


--
-- Name: idx_patient_materials_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_materials_patient ON public.patient_materials USING btree (patient_id);


--
-- Name: idx_patient_materials_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_materials_patient_id ON public.patient_materials USING btree (patient_id);


--
-- Name: idx_patient_materials_source_material_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_materials_source_material_id ON public.patient_materials USING btree (source_material_id);


--
-- Name: idx_patient_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_payments_date ON public.patient_payments USING btree (payment_date);


--
-- Name: idx_patient_payments_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_payments_patient ON public.patient_payments USING btree (patient_id);


--
-- Name: idx_patient_payments_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_payments_therapist ON public.patient_payments USING btree (therapist_id);


--
-- Name: idx_patient_questions_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_questions_patient_id ON public.patient_questions USING btree (patient_id);


--
-- Name: idx_patient_questions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_questions_status ON public.patient_questions USING btree (status);


--
-- Name: idx_patients_attention_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_attention_type ON public.patients USING btree (attention_type);


--
-- Name: idx_patients_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_clinic_id ON public.patients USING btree (clinic_id);


--
-- Name: idx_patients_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_profile_id ON public.patients USING btree (profile_id);


--
-- Name: idx_patients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_status ON public.patients USING btree (status);


--
-- Name: idx_patients_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_therapist ON public.patients USING btree (therapist_id);


--
-- Name: idx_performance_metrics_measured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_metrics_measured ON public.performance_metrics USING btree (measured_at);


--
-- Name: idx_performance_metrics_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_metrics_name ON public.performance_metrics USING btree (metric_name);


--
-- Name: idx_pie_student_data_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pie_student_data_patient ON public.pie_student_data USING btree (patient_id);


--
-- Name: idx_pie_student_data_school; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pie_student_data_school ON public.pie_student_data USING btree (school_id);


--
-- Name: idx_plan_obj_activities_objective; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_obj_activities_objective ON public.plan_objective_activities USING btree (objective_id);


--
-- Name: idx_plan_objectives_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_objectives_parent ON public.plan_objectives USING btree (parent_objective_id);


--
-- Name: idx_plan_objectives_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_objectives_plan ON public.plan_objectives USING btree (plan_id);


--
-- Name: idx_plan_sessions_assigned_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_sessions_assigned_plan ON public.plan_sessions USING btree (assigned_plan_id);


--
-- Name: idx_plan_sessions_clinical_history; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_sessions_clinical_history ON public.plan_sessions USING btree (clinical_history_id);


--
-- Name: idx_plan_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_sessions_status ON public.plan_sessions USING btree (status);


--
-- Name: idx_plan_template_exercises_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_template_exercises_plan ON public.plan_template_exercises USING btree (plan_template_id);


--
-- Name: idx_plan_template_exercises_therapist_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_template_exercises_therapist_plan ON public.plan_template_exercises USING btree (therapist_plan_template_id);


--
-- Name: idx_product_sales_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_sales_product ON public.product_sales USING btree (product_id);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_full_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_full_name_trgm ON public.profiles USING gin (full_name public.gin_trgm_ops);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_refund_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refund_requests_status ON public.refund_requests USING btree (status);


--
-- Name: idx_refund_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refund_requests_user_id ON public.refund_requests USING btree (user_id);


--
-- Name: idx_rep_appointments_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_appointments_completed ON public.appointments USING btree (therapist_id, specialty_id) WHERE (status = 'completed'::text);


--
-- Name: idx_rep_conditions_therapist_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_conditions_therapist_specialty ON public.therapist_conditions USING btree (therapist_id, specialty_id) WHERE (is_public = true);


--
-- Name: idx_rep_diagnoses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_diagnoses_active ON public.patient_diagnoses USING btree (therapist_id, specialty_id) WHERE (is_active = true);


--
-- Name: idx_rep_education_therapist_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_education_therapist_specialty ON public.therapist_education USING btree (therapist_id, specialty_id) WHERE (verified = true);


--
-- Name: idx_rep_evaluations_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_evaluations_specialty ON public.patient_evaluations USING btree (therapist_id, specialty_id);


--
-- Name: idx_rep_plans_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_plans_completed ON public.patient_assigned_plans USING btree (therapist_id, specialty_id) WHERE (status = 'completed'::text);


--
-- Name: idx_rep_reports_signed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rep_reports_signed ON public.clinical_reports USING btree (therapist_id, specialty_id) WHERE (status = 'signed'::public.report_status);


--
-- Name: idx_report_logs_report; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_logs_report ON public.report_logs USING btree (report_id);


--
-- Name: idx_report_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_logs_timestamp ON public.report_logs USING btree ("timestamp");


--
-- Name: idx_report_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_report_logs_user ON public.report_logs USING btree (user_id);


--
-- Name: idx_reports_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_review ON public.review_reports USING btree (review_id);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status ON public.review_reports USING btree (status);


--
-- Name: idx_reviews_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_created ON public.marketplace_reviews USING btree (created_at DESC);


--
-- Name: idx_reviews_diagnosis; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_diagnosis ON public.marketplace_reviews USING gin (diagnosis_used_for);


--
-- Name: idx_reviews_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_featured ON public.marketplace_reviews USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_reviews_helpful; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_helpful ON public.marketplace_reviews USING btree (helpful_count DESC);


--
-- Name: idx_reviews_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_item ON public.marketplace_reviews USING btree (marketplace_item_id);


--
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_rating ON public.marketplace_reviews USING btree (rating);


--
-- Name: idx_reviews_reviewer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_reviewer ON public.marketplace_reviews USING btree (reviewer_id);


--
-- Name: idx_reviews_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_search ON public.marketplace_reviews USING gin (search_vector);


--
-- Name: idx_reviews_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_status ON public.marketplace_reviews USING btree (status);


--
-- Name: idx_reviews_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_verified ON public.marketplace_reviews USING btree (is_verified_purchase) WHERE (is_verified_purchase = true);


--
-- Name: idx_reviews_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_visible ON public.marketplace_reviews USING btree (is_visible) WHERE (is_visible = true);


--
-- Name: idx_sales_summary_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_summary_seller ON public.sales_summary USING btree (seller_id);


--
-- Name: idx_scheduled_reminders_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_reminders_pending ON public.scheduled_reminders USING btree (status, scheduled_time) WHERE (status = 'pending'::text);


--
-- Name: idx_search_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_created ON public.search_logs USING btree (created_at);


--
-- Name: idx_search_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_type ON public.search_logs USING btree (search_type);


--
-- Name: idx_search_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_user ON public.search_logs USING btree (user_id);


--
-- Name: idx_sensorial_evaluations_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensorial_evaluations_patient ON public.sensorial_evaluations USING btree (patient_id);


--
-- Name: idx_sensorial_evaluations_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensorial_evaluations_therapist ON public.sensorial_evaluations USING btree (therapist_id);


--
-- Name: idx_sensorial_responses_evaluation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensorial_responses_evaluation ON public.sensorial_item_responses USING btree (evaluation_id);


--
-- Name: idx_services_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_clinic ON public.services USING btree (clinic_id);


--
-- Name: idx_services_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_therapist ON public.services USING btree (therapist_id);


--
-- Name: idx_session_activities_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_activities_session ON public.session_activities USING btree (session_id);


--
-- Name: idx_session_logs_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_appointment ON public.session_logs USING btree (appointment_id);


--
-- Name: idx_session_logs_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_logs_session ON public.session_logs USING btree (session_id);


--
-- Name: idx_specialties_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialties_name_trgm ON public.specialties USING gin (name public.gin_trgm_ops);


--
-- Name: idx_specialty_change_logs_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialty_change_logs_therapist ON public.specialty_change_logs USING btree (therapist_id);


--
-- Name: idx_specialty_keywords_keyword; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_specialty_keywords_keyword ON public.specialty_keywords USING btree (lower(keyword));


--
-- Name: idx_subscriptions_external_ref; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_external_ref ON public.therapist_subscriptions USING btree (external_reference);


--
-- Name: idx_subscriptions_external_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_external_reference ON public.therapist_subscriptions USING btree (external_reference) WHERE (external_reference IS NOT NULL);


--
-- Name: idx_subscriptions_mp_preapproval; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_mp_preapproval ON public.therapist_subscriptions USING btree (mp_preapproval_id);


--
-- Name: idx_subscriptions_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_payment_id ON public.therapist_subscriptions USING btree (payment_id);


--
-- Name: idx_subscriptions_preference_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_preference_id ON public.therapist_subscriptions USING btree (preference_id);


--
-- Name: idx_support_incidents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_incidents_status ON public.support_incidents USING btree (status);


--
-- Name: idx_support_tickets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_created_at ON public.support_tickets USING btree (created_at DESC);


--
-- Name: idx_support_tickets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_status ON public.support_tickets USING btree (status);


--
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- Name: idx_system_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at DESC);


--
-- Name: idx_system_logs_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_logs_level ON public.system_logs USING btree (level);


--
-- Name: idx_ta_therapist_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ta_therapist_active ON public.therapist_availabilities USING btree (therapist_id, is_active);


--
-- Name: idx_td_about_me_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_td_about_me_trgm ON public.therapist_details USING gin (about_me public.gin_trgm_ops);


--
-- Name: idx_team_members_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_clinic_id ON public.team_members USING btree (clinic_id);


--
-- Name: idx_team_members_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_status ON public.team_members USING btree (status) WHERE (status = 'active'::text);


--
-- Name: idx_team_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);


--
-- Name: idx_therapist_availabilities_clinic; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_availabilities_clinic ON public.therapist_availabilities USING btree (clinic_id);


--
-- Name: idx_therapist_availabilities_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_availabilities_day ON public.therapist_availabilities USING btree (day_of_week);


--
-- Name: idx_therapist_availabilities_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_availabilities_therapist ON public.therapist_availabilities USING btree (therapist_id);


--
-- Name: idx_therapist_commissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_commissions_status ON public.therapist_commissions USING btree (status);


--
-- Name: idx_therapist_commissions_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_commissions_therapist ON public.therapist_commissions USING btree (therapist_id);


--
-- Name: idx_therapist_conditions_therapist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_conditions_therapist_id ON public.therapist_conditions USING btree (therapist_id);


--
-- Name: idx_therapist_details_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_details_public ON public.therapist_details USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_therapist_details_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_details_slug ON public.therapist_details USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: idx_therapist_details_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_details_user_id ON public.therapist_details USING btree (user_id);


--
-- Name: idx_therapist_exercises_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_active ON public.therapist_exercises USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_therapist_exercises_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_category ON public.therapist_exercises USING btree (category);


--
-- Name: idx_therapist_exercises_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_difficulty ON public.therapist_exercises USING btree (difficulty);


--
-- Name: idx_therapist_exercises_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_is_active ON public.therapist_exercises USING btree (is_active);


--
-- Name: idx_therapist_exercises_is_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_is_public ON public.therapist_exercises USING btree (is_public);


--
-- Name: idx_therapist_exercises_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_public ON public.therapist_exercises USING btree (is_public) WHERE (is_public = true);


--
-- Name: idx_therapist_exercises_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_exercises_therapist ON public.therapist_exercises USING btree (therapist_id);


--
-- Name: idx_therapist_insurances_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_insurances_provider ON public.therapist_insurances USING btree (insurance_provider_id);


--
-- Name: idx_therapist_insurances_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_insurances_therapist ON public.therapist_insurances USING btree (therapist_id);


--
-- Name: idx_therapist_landing_pages_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_landing_pages_published ON public.therapist_landing_pages USING btree (published) WHERE (published = true);


--
-- Name: idx_therapist_landing_pages_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_landing_pages_therapist ON public.therapist_landing_pages USING btree (therapist_id);


--
-- Name: idx_therapist_landing_pages_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_landing_pages_url ON public.therapist_landing_pages USING btree (custom_url);


--
-- Name: idx_therapist_materials_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_materials_category ON public.therapist_materials USING btree (category);


--
-- Name: idx_therapist_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_services_active ON public.therapist_services USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_therapist_services_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_services_category ON public.therapist_services USING btree (service_category);


--
-- Name: idx_therapist_services_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_services_therapist ON public.therapist_services USING btree (therapist_id);


--
-- Name: idx_therapist_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_subscriptions_status ON public.therapist_subscriptions USING btree (status);


--
-- Name: idx_therapist_subscriptions_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_therapist_subscriptions_therapist ON public.therapist_subscriptions USING btree (therapist_id);


--
-- Name: idx_treatment_plans_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_active ON public.treatment_plans USING btree (is_active);


--
-- Name: idx_treatment_plans_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_global ON public.treatment_plans USING btree (is_global);


--
-- Name: idx_treatment_plans_therapist; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_therapist ON public.treatment_plans USING btree (therapist_id);


--
-- Name: idx_ts_therapist_public; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ts_therapist_public ON public.therapist_specialties USING btree (therapist_id, is_public);


--
-- Name: idx_user_addons_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_addons_key ON public.user_addons USING btree (addon_key, status);


--
-- Name: idx_user_addons_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_addons_user ON public.user_addons USING btree (user_id);


--
-- Name: idx_user_analytics_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_analytics_event ON public.user_analytics USING btree (event_type);


--
-- Name: idx_user_analytics_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_analytics_user ON public.user_analytics USING btree (user_id);


--
-- Name: idx_user_favorite_phrases_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_favorite_phrases_user ON public.user_favorite_phrases USING btree (user_id);


--
-- Name: idx_wallet_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions USING btree (created_at DESC);


--
-- Name: idx_wallet_transactions_wallet_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions USING btree (wallet_id);


--
-- Name: idx_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);


--
-- Name: idx_withdrawal_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);


--
-- Name: idx_withdrawal_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);


--
-- Name: patient_goals_plan_objective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_goals_plan_objective_idx ON public.patient_goals USING btree (plan_objective_id);


--
-- Name: patient_reviews_therapist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX patient_reviews_therapist_idx ON public.patient_reviews USING btree (therapist_id);


--
-- Name: therapist_services_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX therapist_services_public_idx ON public.therapist_services USING btree (therapist_id) WHERE (is_public AND (price_clp > (0)::numeric));


--
-- Name: therapist_specialties_public_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX therapist_specialties_public_idx ON public.therapist_specialties USING btree (therapist_id) WHERE is_public;


--
-- Name: therapist_specialties_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX therapist_specialties_unique ON public.therapist_specialties USING btree (therapist_id, specialty_id);


--
-- Name: ux_ts_therapist_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_ts_therapist_specialty ON public.therapist_specialties USING btree (therapist_id, specialty_id);


--
-- Name: therapist_landing_pages auto_generate_landing_url; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_generate_landing_url BEFORE INSERT ON public.therapist_landing_pages FOR EACH ROW EXECUTE FUNCTION public.generate_landing_page_url();


--
-- Name: ai_recommendation_feedback calculate_ai_feedback_score; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_ai_feedback_score BEFORE INSERT OR UPDATE ON public.ai_recommendation_feedback FOR EACH ROW EXECUTE FUNCTION public.calculate_feedback_score();


--
-- Name: appointments check_patient_double_booking_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER check_patient_double_booking_trigger BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.check_patient_double_booking();


--
-- Name: session_activities enforce_max_session_activities; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER enforce_max_session_activities BEFORE INSERT ON public.session_activities FOR EACH ROW EXECUTE FUNCTION public.check_max_session_activities();


--
-- Name: clinical_reports generate_hash_on_report; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_hash_on_report BEFORE INSERT OR UPDATE ON public.clinical_reports FOR EACH ROW EXECUTE FUNCTION public.generate_report_hash();


--
-- Name: marketplace_orders generate_order_number_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON public.marketplace_orders FOR EACH ROW WHEN ((new.order_number IS NULL)) EXECUTE FUNCTION public.generate_order_number();


--
-- Name: clinical_reports log_clinical_report_changes; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER log_clinical_report_changes AFTER INSERT OR UPDATE ON public.clinical_reports FOR EACH ROW EXECUTE FUNCTION public.log_report_action();


--
-- Name: blog_posts on_blog_post_insert_generate_slug; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_blog_post_insert_generate_slug BEFORE INSERT ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.generate_unique_slug_for_blog();


--
-- Name: profiles on_user_created_create_wallet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_user_created_create_wallet AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_user_wallet();


--
-- Name: blog_posts set_blog_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_services set_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.therapist_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments trg_auto_grant_passport; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_grant_passport AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.auto_grant_passport_on_appointment();


--
-- Name: appointments trg_auto_schedule_reminders; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_schedule_reminders AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.auto_schedule_reminders_on_appointment();


--
-- Name: patient_diagnoses trg_auto_specialty_diagnosis; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_auto_specialty_diagnosis BEFORE INSERT OR UPDATE ON public.patient_diagnoses FOR EACH ROW EXECUTE FUNCTION public.fn_auto_assign_diagnosis_specialty();


--
-- Name: billing_invoices trg_keep_immutable_created_at_log; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_keep_immutable_created_at_log BEFORE UPDATE ON public.billing_invoices FOR EACH ROW EXECUTE FUNCTION public.keep_immutable_created_at_log();


--
-- Name: profiles trg_new_therapist_profile; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_new_therapist_profile AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_therapist_profile_and_branding();


--
-- Name: billing_invoices trg_prevent_amount_change_on_paid_invoice; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_amount_change_on_paid_invoice BEFORE UPDATE ON public.billing_invoices FOR EACH ROW EXECUTE FUNCTION public.prevent_amount_change_on_paid_invoice();


--
-- Name: plan_sessions trg_session_to_clinical_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_session_to_clinical_history AFTER UPDATE ON public.plan_sessions FOR EACH ROW EXECUTE FUNCTION public.trigger_session_to_clinical_history();


--
-- Name: clinic_therapists trg_sync_therapist_location; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_therapist_location AFTER INSERT OR UPDATE OF is_active ON public.clinic_therapists FOR EACH ROW WHEN ((new.is_active = true)) EXECUTE FUNCTION public.sync_therapist_location_trigger();


--
-- Name: clinics trg_sync_therapists_on_clinic_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_therapists_on_clinic_update AFTER UPDATE OF city_id, region_id ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.sync_therapist_location_trigger();


--
-- Name: patient_diagnoses trg_update_diagnosis_summary; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_diagnosis_summary AFTER INSERT OR UPDATE ON public.patient_diagnoses FOR EACH ROW EXECUTE FUNCTION public.update_patient_diagnosis_summary();


--
-- Name: appointments trigger_appointment_to_clinical_history; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_appointment_to_clinical_history AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.create_clinical_history_from_appointment();


--
-- Name: plan_sessions trigger_create_history_on_session_complete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_history_on_session_complete AFTER UPDATE OF status ON public.plan_sessions FOR EACH ROW EXECUTE FUNCTION public.create_clinical_history_from_session();


--
-- Name: plan_sessions trigger_create_history_on_session_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_history_on_session_insert AFTER INSERT ON public.plan_sessions FOR EACH ROW WHEN ((new.status = 'completed'::text)) EXECUTE FUNCTION public.create_clinical_history_from_session();


--
-- Name: profiles trigger_create_therapist_branding; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_create_therapist_branding AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_therapist_branding();


--
-- Name: favorite_lists trigger_lists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_lists_updated_at BEFORE UPDATE ON public.favorite_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marketplace_orders trigger_process_completed_order; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_process_completed_order AFTER UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.process_completed_order();


--
-- Name: marketplace_reviews trigger_review_search_vector; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_review_search_vector BEFORE INSERT OR UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_review_search_vector();


--
-- Name: marketplace_reviews trigger_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_reviews_updated_at BEFORE UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: team_members trigger_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_team_members_updated_at();


--
-- Name: review_helpful_votes trigger_update_helpful_counts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_helpful_counts AFTER INSERT OR DELETE OR UPDATE ON public.review_helpful_votes FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_counts();


--
-- Name: marketplace_reviews trigger_update_item_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_item_rating AFTER INSERT OR DELETE OR UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_item_rating_stats();


--
-- Name: marketplace_orders trigger_update_item_sales; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_item_sales AFTER UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_item_sales();


--
-- Name: plan_sessions trigger_update_plan_progress; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_plan_progress AFTER INSERT OR UPDATE OF status ON public.plan_sessions FOR EACH ROW EXECUTE FUNCTION public.update_plan_progress();


--
-- Name: review_reports trigger_update_report_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_report_count AFTER INSERT ON public.review_reports FOR EACH ROW EXECUTE FUNCTION public.update_review_report_count();


--
-- Name: marketplace_reviews trigger_verify_purchase; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_verify_purchase BEFORE INSERT ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.verify_review_purchase();


--
-- Name: ai_chat_sessions update_ai_chat_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_feedback update_ai_feedback_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_feedback_updated_at BEFORE UPDATE ON public.ai_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assigned_plan_activities update_assigned_plan_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assigned_plan_activities_updated_at BEFORE UPDATE ON public.assigned_plan_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: billing_invoices update_billing_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_billing_invoices_updated_at BEFORE UPDATE ON public.billing_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_blocks update_calendar_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_blocks_updated_at BEFORE UPDATE ON public.calendar_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clinic_therapists update_clinic_therapists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clinic_therapists_updated_at BEFORE UPDATE ON public.clinic_therapists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clinical_history update_clinical_history_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clinical_history_updated_at BEFORE UPDATE ON public.clinical_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clinical_reports update_clinical_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clinical_reports_updated_at BEFORE UPDATE ON public.clinical_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clinics update_clinics_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_lessons update_course_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: discount_coupons update_discount_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_discount_coupons_updated_at BEFORE UPDATE ON public.discount_coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_notifications update_email_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON public.email_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_templates update_email_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: insurance_providers update_insurance_providers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_insurance_providers_updated_at BEFORE UPDATE ON public.insurance_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marketplace_reviews update_item_rating_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_item_rating_trigger AFTER INSERT OR DELETE OR UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_marketplace_item_rating();


--
-- Name: marketplace_items update_marketplace_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON public.marketplace_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marketplace_orders update_marketplace_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON public.marketplace_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_chat_messages update_message_count_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_message_count_trigger AFTER INSERT ON public.ai_chat_messages FOR EACH ROW WHEN ((new.sender_type = 'user'::public.sender_type_enum)) EXECUTE FUNCTION public.update_session_message_count();


--
-- Name: motivational_phrases update_motivational_phrases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_motivational_phrases_updated_at BEFORE UPDATE ON public.motivational_phrases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_activities update_patient_activities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_activities_updated_at BEFORE UPDATE ON public.patient_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_activity_logs update_patient_activity_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_activity_logs_updated_at BEFORE UPDATE ON public.patient_activity_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_assigned_plans update_patient_assigned_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_assigned_plans_updated_at BEFORE UPDATE ON public.patient_assigned_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_development_areas update_patient_development_areas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_development_areas_updated_at BEFORE UPDATE ON public.patient_development_areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_document_templates update_patient_document_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_document_templates_updated_at BEFORE UPDATE ON public.patient_document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_evaluations update_patient_evaluations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_evaluations_updated_at BEFORE UPDATE ON public.patient_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_goals update_patient_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_goals_updated_at BEFORE UPDATE ON public.patient_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_materials update_patient_materials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_materials_updated_at BEFORE UPDATE ON public.patient_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_private_notes update_patient_private_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_private_notes_updated_at BEFORE UPDATE ON public.patient_private_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patient_questions update_patient_questions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_questions_updated_at BEFORE UPDATE ON public.patient_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: marketplace_review_votes update_review_votes_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_review_votes_trigger AFTER INSERT OR DELETE OR UPDATE ON public.marketplace_review_votes FOR EACH ROW EXECUTE FUNCTION public.update_review_vote_counts();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_commissions update_therapist_commissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_commissions_updated_at BEFORE UPDATE ON public.therapist_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_details update_therapist_details_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_details_updated_at BEFORE UPDATE ON public.therapist_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_documents update_therapist_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_documents_updated_at BEFORE UPDATE ON public.therapist_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_exercises update_therapist_exercises_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_exercises_updated_at BEFORE UPDATE ON public.therapist_exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_insurances update_therapist_insurances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_insurances_updated_at BEFORE UPDATE ON public.therapist_insurances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_landing_pages update_therapist_landing_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_landing_pages_updated_at BEFORE UPDATE ON public.therapist_landing_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_services update_therapist_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_services_updated_at BEFORE UPDATE ON public.therapist_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: therapist_subscriptions update_therapist_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_therapist_subscriptions_updated_at BEFORE UPDATE ON public.therapist_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: treatment_plans update_treatment_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_notification_preferences update_user_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON public.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: word_searches update_word_searches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_word_searches_updated_at BEFORE UPDATE ON public.word_searches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments validate_appointment_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_appointment_before_insert BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validate_appointment();


--
-- Name: activity_library activity_library_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_library
    ADD CONSTRAINT activity_library_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.activity_categories(id);


--
-- Name: activity_library activity_library_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_library
    ADD CONSTRAINT activity_library_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: adir_evaluations adir_evaluations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_evaluations
    ADD CONSTRAINT adir_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: adir_evaluations adir_evaluations_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_evaluations
    ADD CONSTRAINT adir_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);


--
-- Name: adir_item_responses adir_item_responses_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adir_item_responses
    ADD CONSTRAINT adir_item_responses_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.adir_evaluations(id) ON DELETE CASCADE;


--
-- Name: admin_audit_logs admin_audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id);


--
-- Name: admin_permissions admin_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id);


--
-- Name: admin_permissions admin_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_permissions
    ADD CONSTRAINT admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ados2_evaluations ados2_evaluations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ados2_evaluations
    ADD CONSTRAINT ados2_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: ados2_evaluations ados2_evaluations_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ados2_evaluations
    ADD CONSTRAINT ados2_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ados2_item_responses ados2_item_responses_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ados2_item_responses
    ADD CONSTRAINT ados2_item_responses_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.ados2_evaluations(id) ON DELETE CASCADE;


--
-- Name: ai_chat_messages ai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- Name: ai_chat_sessions ai_chat_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_chat_sessions ai_chat_sessions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_conversation_analysis ai_conversation_analysis_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_conversation_analysis
    ADD CONSTRAINT ai_conversation_analysis_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE;


--
-- Name: ai_feedback ai_feedback_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_feedback ai_feedback_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.clinical_history(id) ON DELETE SET NULL;


--
-- Name: ai_feedback ai_feedback_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_recommendation_feedback ai_recommendation_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendation_feedback
    ADD CONSTRAINT ai_recommendation_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: ai_usage_quotas ai_usage_quotas_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_quotas
    ADD CONSTRAINT ai_usage_quotas_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.therapist_services(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: arco_requests arco_requests_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arco_requests
    ADD CONSTRAINT arco_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(id);


--
-- Name: arco_requests arco_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arco_requests
    ADD CONSTRAINT arco_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: assigned_plan_activities assigned_plan_activities_activity_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_activity_fk FOREIGN KEY (activity_id) REFERENCES public.patient_activities(id) ON DELETE SET NULL;


--
-- Name: assigned_plan_activities assigned_plan_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.patient_activities(id) ON DELETE CASCADE;


--
-- Name: assigned_plan_activities assigned_plan_activities_assigned_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_assigned_plan_id_fkey FOREIGN KEY (assigned_plan_id) REFERENCES public.patient_assigned_plans(id) ON DELETE CASCADE;


--
-- Name: assigned_plan_activities assigned_plan_activities_exercise_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_exercise_fk FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: assigned_plan_activities assigned_plan_activities_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assigned_plan_activities
    ADD CONSTRAINT assigned_plan_activities_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: availability_logs availability_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_logs
    ADD CONSTRAINT availability_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: availability_logs availability_logs_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_logs
    ADD CONSTRAINT availability_logs_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: billing_invoices billing_invoices_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: blocked_slots blocked_slots_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_slots
    ADD CONSTRAINT blocked_slots_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: blocked_times blocked_times_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_times
    ADD CONSTRAINT blocked_times_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: blocked_times blocked_times_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blocked_times
    ADD CONSTRAINT blocked_times_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: blog_article_tags blog_article_tags_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_article_tags
    ADD CONSTRAINT blog_article_tags_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE;


--
-- Name: blog_article_tags blog_article_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_article_tags
    ADD CONSTRAINT blog_article_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;


--
-- Name: blog_articles blog_articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id);


--
-- Name: blog_articles blog_articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_articles
    ADD CONSTRAINT blog_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id);


--
-- Name: blog_comments blog_comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.blog_articles(id) ON DELETE CASCADE;


--
-- Name: blog_comments blog_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blog_comments(id);


--
-- Name: blog_comments blog_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.patient_questions(id) ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id);


--
-- Name: blog_reviews blog_reviews_blog_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_reviews
    ADD CONSTRAINT blog_reviews_blog_post_id_fkey FOREIGN KEY (blog_post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_reviews blog_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_reviews
    ADD CONSTRAINT blog_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: calendar_blocks calendar_blocks_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_blocks
    ADD CONSTRAINT calendar_blocks_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: calendar_blocks calendar_blocks_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_blocks
    ADD CONSTRAINT calendar_blocks_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: cities cities_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: clinic_invitations clinic_invitations_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invitations
    ADD CONSTRAINT clinic_invitations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_invitations clinic_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invitations
    ADD CONSTRAINT clinic_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: clinic_invoices clinic_invoices_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invoices
    ADD CONSTRAINT clinic_invoices_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: clinic_invoices clinic_invoices_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invoices
    ADD CONSTRAINT clinic_invoices_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id);


--
-- Name: clinic_invoices clinic_invoices_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invoices
    ADD CONSTRAINT clinic_invoices_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: clinic_invoices clinic_invoices_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_invoices
    ADD CONSTRAINT clinic_invoices_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: clinic_therapists clinic_therapists_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_therapists
    ADD CONSTRAINT clinic_therapists_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: clinic_therapists clinic_therapists_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_therapists
    ADD CONSTRAINT clinic_therapists_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: clinical_access_log clinical_access_log_accessed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_access_log
    ADD CONSTRAINT clinical_access_log_accessed_by_fkey FOREIGN KEY (accessed_by) REFERENCES public.profiles(id);


--
-- Name: clinical_access_log clinical_access_log_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_access_log
    ADD CONSTRAINT clinical_access_log_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: clinical_history clinical_entry_type_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_entry_type_fk FOREIGN KEY (entry_type) REFERENCES public.clinical_entry_types(code);


--
-- Name: clinical_history clinical_history_diagnosis_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_history_diagnosis_fk FOREIGN KEY (diagnosis_id) REFERENCES public.patient_diagnoses(id);


--
-- Name: clinical_history clinical_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clinical_history clinical_history_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT clinical_history_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: clinical_reports clinical_reports_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_reports
    ADD CONSTRAINT clinical_reports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: clinical_reports clinical_reports_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_reports
    ADD CONSTRAINT clinical_reports_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: clinical_reports clinical_reports_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_reports
    ADD CONSTRAINT clinical_reports_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: clinics clinics_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: clinics clinics_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id);


--
-- Name: clinics clinics_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: commissions commissions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: cookie_consents cookie_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cookie_consents
    ADD CONSTRAINT cookie_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: coupon_uses coupon_uses_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: coupon_uses coupon_uses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_uses
    ADD CONSTRAINT coupon_uses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_sponsored_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_sponsored_by_fkey FOREIGN KEY (sponsored_by) REFERENCES public.profiles(id);


--
-- Name: course_enrollments course_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: course_lessons course_lessons_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_lessons_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: course_modules course_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_reviews course_reviews_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_reviews course_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: courses courses_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id);


--
-- Name: diagnosis_codes diagnosis_codes_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_codes
    ADD CONSTRAINT diagnosis_codes_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.diagnosis_systems(id);


--
-- Name: diagnosis_specialty_map diagnosis_specialty_map_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_specialty_map
    ADD CONSTRAINT diagnosis_specialty_map_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id);


--
-- Name: discount_coupons discount_coupons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_coupons
    ADD CONSTRAINT discount_coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: email_notifications email_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_notifications
    ADD CONSTRAINT email_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: favorite_lists favorite_lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_lists
    ADD CONSTRAINT favorite_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: clinical_history fk_appointment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_history
    ADD CONSTRAINT fk_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: marketplace_items fk_marketplace_plan_template; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT fk_marketplace_plan_template FOREIGN KEY (plan_template_id) REFERENCES public.treatment_plans(id) ON DELETE SET NULL;


--
-- Name: patient_activities fk_patient_activities_exercise; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT fk_patient_activities_exercise FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: profiles fk_profiles_city; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT fk_profiles_city FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: profiles fk_profiles_region; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT fk_profiles_region FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;


--
-- Name: therapist_landing_pages fk_therapist_landing_pages_therapist; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_landing_pages
    ADD CONSTRAINT fk_therapist_landing_pages_therapist FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_details fk_therapist_profile; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT fk_therapist_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: generated_templates generated_templates_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.generated_templates
    ADD CONSTRAINT generated_templates_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);


--
-- Name: legal_disputes legal_disputes_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_disputes
    ADD CONSTRAINT legal_disputes_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.profiles(id);


--
-- Name: legal_document_versions legal_document_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_document_versions
    ADD CONSTRAINT legal_document_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: legal_document_versions legal_document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_document_versions
    ADD CONSTRAINT legal_document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.legal_documents(id) ON DELETE CASCADE;


--
-- Name: legal_documents legal_documents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: legal_policies legal_policies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_policies
    ADD CONSTRAINT legal_policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: legal_signatures legal_signatures_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_signatures
    ADD CONSTRAINT legal_signatures_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.legal_documents(id);


--
-- Name: legal_signatures legal_signatures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_signatures
    ADD CONSTRAINT legal_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: marketing_leads marketing_leads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketing_leads
    ADD CONSTRAINT marketing_leads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: marketplace_favorites marketplace_favorites_marketplace_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_favorites
    ADD CONSTRAINT marketplace_favorites_marketplace_plan_id_fkey FOREIGN KEY (marketplace_plan_id) REFERENCES public.marketplace_plans(id) ON DELETE CASCADE;


--
-- Name: marketplace_favorites marketplace_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_favorites
    ADD CONSTRAINT marketplace_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: marketplace_items marketplace_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: marketplace_items marketplace_items_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: marketplace_items marketplace_items_therapist_material_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_items
    ADD CONSTRAINT marketplace_items_therapist_material_fk FOREIGN KEY (therapist_material_id) REFERENCES public.therapist_materials(id) ON DELETE SET NULL;


--
-- Name: marketplace_orders marketplace_orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: marketplace_payouts marketplace_payouts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_payouts
    ADD CONSTRAINT marketplace_payouts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: marketplace_plans marketplace_plans_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_plans
    ADD CONSTRAINT marketplace_plans_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);


--
-- Name: marketplace_plans marketplace_plans_original_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_plans
    ADD CONSTRAINT marketplace_plans_original_plan_id_fkey FOREIGN KEY (original_plan_id) REFERENCES public.treatment_plans(id) ON DELETE SET NULL;


--
-- Name: marketplace_purchases marketplace_purchases_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_purchases
    ADD CONSTRAINT marketplace_purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id);


--
-- Name: marketplace_purchases marketplace_purchases_cloned_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_purchases
    ADD CONSTRAINT marketplace_purchases_cloned_plan_id_fkey FOREIGN KEY (cloned_plan_id) REFERENCES public.treatment_plans(id);


--
-- Name: marketplace_purchases marketplace_purchases_marketplace_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_purchases
    ADD CONSTRAINT marketplace_purchases_marketplace_plan_id_fkey FOREIGN KEY (marketplace_plan_id) REFERENCES public.marketplace_plans(id);


--
-- Name: marketplace_review_votes marketplace_review_votes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_review_votes
    ADD CONSTRAINT marketplace_review_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.marketplace_reviews(id) ON DELETE CASCADE;


--
-- Name: marketplace_review_votes marketplace_review_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_review_votes
    ADD CONSTRAINT marketplace_review_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: marketplace_reviews marketplace_reviews_marketplace_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_marketplace_item_id_fkey FOREIGN KEY (marketplace_item_id) REFERENCES public.marketplace_items(id) ON DELETE CASCADE;


--
-- Name: marketplace_reviews marketplace_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id);


--
-- Name: marketplace_reviews marketplace_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);


--
-- Name: marketplace_saved_searches marketplace_saved_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_saved_searches
    ADD CONSTRAINT marketplace_saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: metrics_summary metrics_summary_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metrics_summary
    ADD CONSTRAINT metrics_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: moderation_logs moderation_logs_moderator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_moderator_id_fkey FOREIGN KEY (moderator_id) REFERENCES auth.users(id);


--
-- Name: motivational_patient motivational_patient_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_patient
    ADD CONSTRAINT motivational_patient_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: motivational_patient motivational_patient_phrase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_patient
    ADD CONSTRAINT motivational_patient_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.motivational_phrases(id) ON DELETE CASCADE;


--
-- Name: motivational_phrases motivational_phrases_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivational_phrases
    ADD CONSTRAINT motivational_phrases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: notiz_sessions notiz_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notiz_sessions
    ADD CONSTRAINT notiz_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: notiz_sessions notiz_sessions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notiz_sessions
    ADD CONSTRAINT notiz_sessions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_marketplace_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_marketplace_item_id_fkey FOREIGN KEY (marketplace_item_id) REFERENCES public.marketplace_items(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id);


--
-- Name: orders orders_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: patient_access_grants patient_access_grants_granted_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_granted_to_fkey FOREIGN KEY (granted_to) REFERENCES public.profiles(id);


--
-- Name: patient_access_grants patient_access_grants_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_access_grants patient_access_grants_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_access_grants
    ADD CONSTRAINT patient_access_grants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: patient_activities patient_activities_exercise_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT patient_activities_exercise_fk FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: patient_activities patient_activities_goal_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT patient_activities_goal_fk FOREIGN KEY (goal_id) REFERENCES public.patient_goals(id) ON DELETE SET NULL;


--
-- Name: patient_activities patient_activities_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT patient_activities_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.patient_goals(id) ON DELETE CASCADE;


--
-- Name: patient_activities patient_activities_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activities
    ADD CONSTRAINT patient_activities_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_activity_logs patient_activity_logs_activity_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_activity_fk FOREIGN KEY (activity_id) REFERENCES public.patient_activities(id) ON DELETE CASCADE;


--
-- Name: patient_activity_logs patient_activity_logs_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.patient_activities(id) ON DELETE CASCADE;


--
-- Name: patient_activity_logs patient_activity_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_activity_logs patient_activity_logs_session_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_session_fk FOREIGN KEY (session_id) REFERENCES public.clinical_history(id) ON DELETE CASCADE;


--
-- Name: patient_activity_logs patient_activity_logs_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_activity_logs
    ADD CONSTRAINT patient_activity_logs_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: patient_assigned_plans patient_assigned_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assigned_plans
    ADD CONSTRAINT patient_assigned_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_assigned_plans patient_assigned_plans_plan_template_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assigned_plans
    ADD CONSTRAINT patient_assigned_plans_plan_template_fk FOREIGN KEY (plan_template_id) REFERENCES public.treatment_plans(id) ON DELETE SET NULL;


--
-- Name: patient_assigned_plans patient_assigned_plans_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_assigned_plans
    ADD CONSTRAINT patient_assigned_plans_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_diagnoses patient_diagnoses_code_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_diagnoses
    ADD CONSTRAINT patient_diagnoses_code_fk FOREIGN KEY (code_id) REFERENCES public.diagnosis_codes(id) ON DELETE RESTRICT;


--
-- Name: patient_diagnoses patient_diagnoses_patient_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_diagnoses
    ADD CONSTRAINT patient_diagnoses_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: patient_diagnoses patient_diagnoses_system_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_diagnoses
    ADD CONSTRAINT patient_diagnoses_system_fk FOREIGN KEY (system_id) REFERENCES public.diagnosis_systems(id) ON DELETE RESTRICT;


--
-- Name: patient_diagnoses patient_diagnoses_therapist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_diagnoses
    ADD CONSTRAINT patient_diagnoses_therapist_fk FOREIGN KEY (therapist_id) REFERENCES public.therapist_details(user_id);


--
-- Name: patient_document_templates patient_document_templates_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_document_templates
    ADD CONSTRAINT patient_document_templates_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_documents patient_documents_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_documents
    ADD CONSTRAINT patient_documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_documents patient_documents_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_documents
    ADD CONSTRAINT patient_documents_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_evaluations patient_evaluations_patient_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_evaluations
    ADD CONSTRAINT patient_evaluations_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_evaluations patient_evaluations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_evaluations
    ADD CONSTRAINT patient_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_evaluations patient_evaluations_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_evaluations
    ADD CONSTRAINT patient_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_goals patient_goals_area_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_area_fk FOREIGN KEY (area_id) REFERENCES public.patient_development_areas(id) ON DELETE SET NULL;


--
-- Name: patient_goals patient_goals_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.patient_development_areas(id) ON DELETE SET NULL;


--
-- Name: patient_goals patient_goals_evaluation_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_evaluation_fk FOREIGN KEY (evaluation_id) REFERENCES public.patient_evaluations(id) ON DELETE SET NULL;


--
-- Name: patient_goals patient_goals_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.patient_evaluations(id) ON DELETE CASCADE;


--
-- Name: patient_goals patient_goals_patient_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_patient_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_goals patient_goals_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_goals patient_goals_plan_objective_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_goals
    ADD CONSTRAINT patient_goals_plan_objective_fk FOREIGN KEY (plan_objective_id) REFERENCES public.plan_objectives(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: patient_materials patient_materials_assigned_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_materials
    ADD CONSTRAINT patient_materials_assigned_by_fk FOREIGN KEY (assigned_by) REFERENCES public.therapist_details(user_id) ON DELETE SET NULL;


--
-- Name: patient_materials patient_materials_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_materials
    ADD CONSTRAINT patient_materials_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_materials patient_materials_source_material_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_materials
    ADD CONSTRAINT patient_materials_source_material_fk FOREIGN KEY (source_material_id) REFERENCES public.therapist_materials(id) ON DELETE SET NULL;


--
-- Name: patient_materials patient_materials_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_materials
    ADD CONSTRAINT patient_materials_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_payments patient_payments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_payments
    ADD CONSTRAINT patient_payments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- Name: patient_payments patient_payments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_payments
    ADD CONSTRAINT patient_payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_payments patient_payments_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_payments
    ADD CONSTRAINT patient_payments_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: patient_plan_assignments patient_plan_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id);


--
-- Name: patient_plan_assignments patient_plan_assignments_marketplace_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_marketplace_plan_id_fkey FOREIGN KEY (marketplace_plan_id) REFERENCES public.marketplace_plans(id) ON DELETE CASCADE;


--
-- Name: patient_plan_assignments patient_plan_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_plan_assignments patient_plan_assignments_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_plan_assignments
    ADD CONSTRAINT patient_plan_assignments_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.marketplace_purchases(id);


--
-- Name: patient_private_notes patient_private_notes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_private_notes
    ADD CONSTRAINT patient_private_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_private_notes patient_private_notes_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_private_notes
    ADD CONSTRAINT patient_private_notes_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_questions patient_questions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_questions
    ADD CONSTRAINT patient_questions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: patient_questions patient_questions_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_questions
    ADD CONSTRAINT patient_questions_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id);


--
-- Name: patient_questions patient_questions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_questions
    ADD CONSTRAINT patient_questions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: patient_reviews patient_reviews_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_reviews
    ADD CONSTRAINT patient_reviews_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: patients patients_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: patients patients_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: patients patients_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);


--
-- Name: payments payments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: payments payments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: payments payments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: payments payments_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: pie_paci pie_paci_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_paci
    ADD CONSTRAINT pie_paci_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.pie_students(id);


--
-- Name: pie_paci pie_paci_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_paci
    ADD CONSTRAINT pie_paci_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: pie_schedule_blocks pie_schedule_blocks_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_schedule_blocks
    ADD CONSTRAINT pie_schedule_blocks_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: pie_schedule_blocks pie_schedule_blocks_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_schedule_blocks
    ADD CONSTRAINT pie_schedule_blocks_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.pie_students(id);


--
-- Name: pie_schedule_blocks pie_schedule_blocks_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_schedule_blocks
    ADD CONSTRAINT pie_schedule_blocks_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: pie_sessions pie_sessions_schedule_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_sessions
    ADD CONSTRAINT pie_sessions_schedule_block_id_fkey FOREIGN KEY (schedule_block_id) REFERENCES public.pie_schedule_blocks(id);


--
-- Name: pie_sessions pie_sessions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_sessions
    ADD CONSTRAINT pie_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.pie_students(id);


--
-- Name: pie_sessions pie_sessions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_sessions
    ADD CONSTRAINT pie_sessions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: pie_student_data pie_student_data_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_student_data
    ADD CONSTRAINT pie_student_data_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: pie_student_data pie_student_data_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_student_data
    ADD CONSTRAINT pie_student_data_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.clinics(id);


--
-- Name: pie_student_data pie_student_data_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_student_data
    ADD CONSTRAINT pie_student_data_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: pie_students pie_students_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_students
    ADD CONSTRAINT pie_students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: pie_therapist_schools pie_therapist_schools_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_therapist_schools
    ADD CONSTRAINT pie_therapist_schools_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id);


--
-- Name: pie_therapist_schools pie_therapist_schools_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pie_therapist_schools
    ADD CONSTRAINT pie_therapist_schools_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: plan_objective_activities plan_objective_activities_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objective_activities
    ADD CONSTRAINT plan_objective_activities_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: plan_objective_activities plan_objective_activities_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objective_activities
    ADD CONSTRAINT plan_objective_activities_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.plan_objectives(id) ON DELETE CASCADE;


--
-- Name: plan_objectives plan_objectives_parent_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objectives
    ADD CONSTRAINT plan_objectives_parent_objective_id_fkey FOREIGN KEY (parent_objective_id) REFERENCES public.plan_objectives(id) ON DELETE CASCADE;


--
-- Name: plan_objectives plan_objectives_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objectives
    ADD CONSTRAINT plan_objectives_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.treatment_plans(id) ON DELETE CASCADE;


--
-- Name: plan_objectives plan_objectives_scale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_objectives
    ADD CONSTRAINT plan_objectives_scale_id_fkey FOREIGN KEY (scale_id) REFERENCES public.measure_scales(id);


--
-- Name: plan_sessions plan_sessions_assigned_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_sessions
    ADD CONSTRAINT plan_sessions_assigned_plan_id_fkey FOREIGN KEY (assigned_plan_id) REFERENCES public.patient_assigned_plans(id) ON DELETE CASCADE;


--
-- Name: plan_sessions plan_sessions_clinical_history_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_sessions
    ADD CONSTRAINT plan_sessions_clinical_history_id_fkey FOREIGN KEY (clinical_history_id) REFERENCES public.clinical_history(id) ON DELETE SET NULL;


--
-- Name: plan_template_exercises plan_template_exercises_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_template_exercises
    ADD CONSTRAINT plan_template_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE CASCADE;


--
-- Name: platform_feedback platform_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_feedback
    ADD CONSTRAINT platform_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: product_sales product_sales_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sales
    ADD CONSTRAINT product_sales_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: product_sales product_sales_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sales
    ADD CONSTRAINT product_sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: products products_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: progress_reports progress_reports_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_reports
    ADD CONSTRAINT progress_reports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id);


--
-- Name: progress_reports progress_reports_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progress_reports
    ADD CONSTRAINT progress_reports_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: qa_answers qa_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_answers
    ADD CONSTRAINT qa_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.qa_questions(id) ON DELETE CASCADE;


--
-- Name: qa_answers qa_answers_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_answers
    ADD CONSTRAINT qa_answers_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);


--
-- Name: qa_questions qa_questions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: qa_questions qa_questions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.qa_categories(id);


--
-- Name: qa_questions qa_questions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id);


--
-- Name: refund_requests refund_requests_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.billing_invoices(id) ON DELETE SET NULL;


--
-- Name: refund_requests refund_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: refund_requests refund_requests_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.therapist_subscriptions(id) ON DELETE SET NULL;


--
-- Name: refund_requests refund_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reminder_logs reminder_logs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: reminder_logs reminder_logs_reminder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_logs
    ADD CONSTRAINT reminder_logs_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.scheduled_reminders(id) ON DELETE SET NULL;


--
-- Name: report_logs report_logs_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_logs
    ADD CONSTRAINT report_logs_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.clinical_reports(id) ON DELETE CASCADE;


--
-- Name: report_logs report_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.report_logs
    ADD CONSTRAINT report_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: review_helpful_votes review_helpful_votes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.marketplace_reviews(id) ON DELETE CASCADE;


--
-- Name: review_helpful_votes review_helpful_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: review_reports review_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: review_reports review_reports_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(id);


--
-- Name: review_reports review_reports_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_reports
    ADD CONSTRAINT review_reports_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.marketplace_reviews(id) ON DELETE CASCADE;


--
-- Name: sales sales_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id);


--
-- Name: sales sales_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.marketplace_items(id);


--
-- Name: sales sales_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id);


--
-- Name: sales_summary sales_summary_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: sales_summary sales_summary_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_summary
    ADD CONSTRAINT sales_summary_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: scheduled_reminders scheduled_reminders_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;


--
-- Name: scheduled_reminders scheduled_reminders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id);


--
-- Name: scheduled_reminders scheduled_reminders_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: schools schools_coordinator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_coordinator_id_fkey FOREIGN KEY (coordinator_id) REFERENCES public.profiles(id);


--
-- Name: search_logs search_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: sensorial_evaluations sensorial_evaluations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_evaluations
    ADD CONSTRAINT sensorial_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: sensorial_evaluations sensorial_evaluations_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_evaluations
    ADD CONSTRAINT sensorial_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);


--
-- Name: sensorial_item_responses sensorial_item_responses_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensorial_item_responses
    ADD CONSTRAINT sensorial_item_responses_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.sensorial_evaluations(id) ON DELETE CASCADE;


--
-- Name: services services_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: services services_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: session_activities session_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.plan_objective_activities(id) ON DELETE SET NULL;


--
-- Name: session_activities session_activities_exercise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.therapist_exercises(id) ON DELETE SET NULL;


--
-- Name: session_activities session_activities_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.plan_objectives(id) ON DELETE SET NULL;


--
-- Name: session_activities session_activities_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_activities
    ADD CONSTRAINT session_activities_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.plan_sessions(id) ON DELETE CASCADE;


--
-- Name: session_logs session_logs_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: session_logs session_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: session_logs session_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_logs
    ADD CONSTRAINT session_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.clinical_history(id) ON DELETE CASCADE;


--
-- Name: specialty_change_logs specialty_change_logs_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_change_logs
    ADD CONSTRAINT specialty_change_logs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: specialty_change_logs specialty_change_logs_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_change_logs
    ADD CONSTRAINT specialty_change_logs_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: specialty_keywords specialty_keywords_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialty_keywords
    ADD CONSTRAINT specialty_keywords_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: subscription_payments subscription_payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);


--
-- Name: subscription_payments subscription_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_payments
    ADD CONSTRAINT subscription_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: suggested_courses suggested_courses_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggested_courses
    ADD CONSTRAINT suggested_courses_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id);


--
-- Name: suggested_courses suggested_courses_suggested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggested_courses
    ADD CONSTRAINT suggested_courses_suggested_by_fkey FOREIGN KEY (suggested_by) REFERENCES public.profiles(id);


--
-- Name: support_incident_notes support_incident_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_incident_notes
    ADD CONSTRAINT support_incident_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_incident_notes support_incident_notes_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_incident_notes
    ADD CONSTRAINT support_incident_notes_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.support_incidents(id) ON DELETE CASCADE;


--
-- Name: support_incidents support_incidents_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_incidents
    ADD CONSTRAINT support_incidents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_ticket_notes support_ticket_notes_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT support_ticket_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_ticket_notes support_ticket_notes_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT support_ticket_notes_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: symptom_profiles symptom_profiles_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_profiles
    ADD CONSTRAINT symptom_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id);


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: team_members team_members_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: team_members team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: therapist_appointments therapist_appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_appointments
    ADD CONSTRAINT therapist_appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


--
-- Name: therapist_appointments therapist_appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_appointments
    ADD CONSTRAINT therapist_appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: therapist_appointments therapist_appointments_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_appointments
    ADD CONSTRAINT therapist_appointments_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_availabilities therapist_availabilities_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_availabilities
    ADD CONSTRAINT therapist_availabilities_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: therapist_availabilities therapist_availabilities_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_availabilities
    ADD CONSTRAINT therapist_availabilities_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_branding therapist_branding_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_branding
    ADD CONSTRAINT therapist_branding_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_commissions therapist_commissions_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_commissions
    ADD CONSTRAINT therapist_commissions_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- Name: therapist_commissions therapist_commissions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_commissions
    ADD CONSTRAINT therapist_commissions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_conditions therapist_conditions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_conditions
    ADD CONSTRAINT therapist_conditions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_details therapist_details_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT therapist_details_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: therapist_details therapist_details_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_details
    ADD CONSTRAINT therapist_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_documents therapist_documents_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_documents
    ADD CONSTRAINT therapist_documents_file_id_fkey FOREIGN KEY (file_id) REFERENCES storage.objects(id) ON DELETE CASCADE;


--
-- Name: therapist_documents therapist_documents_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_documents
    ADD CONSTRAINT therapist_documents_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_education therapist_education_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_education
    ADD CONSTRAINT therapist_education_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_exercises therapist_exercises_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_exercises
    ADD CONSTRAINT therapist_exercises_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_experience therapist_experience_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_experience
    ADD CONSTRAINT therapist_experience_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_favorite_activities therapist_favorite_activities_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_favorite_activities
    ADD CONSTRAINT therapist_favorite_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.therapist_exercises(id) ON DELETE CASCADE;


--
-- Name: therapist_favorite_activities therapist_favorite_activities_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_favorite_activities
    ADD CONSTRAINT therapist_favorite_activities_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: therapist_insurances therapist_insurances_insurance_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_insurances
    ADD CONSTRAINT therapist_insurances_insurance_provider_id_fkey FOREIGN KEY (insurance_provider_id) REFERENCES public.insurance_providers(id) ON DELETE CASCADE;


--
-- Name: therapist_insurances therapist_insurances_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_insurances
    ADD CONSTRAINT therapist_insurances_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.therapist_details(user_id) ON DELETE CASCADE;


--
-- Name: therapist_invitations therapist_invitations_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invitations
    ADD CONSTRAINT therapist_invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.profiles(id);


--
-- Name: therapist_invitations therapist_invitations_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invitations
    ADD CONSTRAINT therapist_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_invite_quotas therapist_invite_quotas_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_invite_quotas
    ADD CONSTRAINT therapist_invite_quotas_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_materials therapist_materials_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_materials
    ADD CONSTRAINT therapist_materials_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_recommendations therapist_recommendations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_recommendations
    ADD CONSTRAINT therapist_recommendations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id);


--
-- Name: therapist_recommendations therapist_recommendations_recommended_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_recommendations
    ADD CONSTRAINT therapist_recommendations_recommended_therapist_id_fkey FOREIGN KEY (recommended_therapist_id) REFERENCES public.therapists(id);


--
-- Name: therapist_services therapist_services_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_services
    ADD CONSTRAINT therapist_services_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_specialties therapist_specialties_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_specialties
    ADD CONSTRAINT therapist_specialties_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: therapist_specialties therapist_specialties_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_specialties
    ADD CONSTRAINT therapist_specialties_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapist_subscriptions therapist_subscriptions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_subscriptions
    ADD CONSTRAINT therapist_subscriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id);


--
-- Name: therapist_subscriptions therapist_subscriptions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapist_subscriptions
    ADD CONSTRAINT therapist_subscriptions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: therapists therapists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapists
    ADD CONSTRAINT therapists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: therapy_sessions therapy_sessions_focus_objective_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_focus_objective_id_fkey FOREIGN KEY (focus_objective_id) REFERENCES public.plan_objectives(id);


--
-- Name: therapy_sessions therapy_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: therapy_sessions therapy_sessions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.treatment_plans(id);


--
-- Name: therapy_sessions therapy_sessions_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.therapy_sessions
    ADD CONSTRAINT therapy_sessions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id);


--
-- Name: treatment_plans treatment_plans_marketplace_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_marketplace_item_id_fkey FOREIGN KEY (marketplace_item_id) REFERENCES public.marketplace_items(id);


--
-- Name: treatment_plans treatment_plans_source_marketplace_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_source_marketplace_item_id_fkey FOREIGN KEY (source_marketplace_item_id) REFERENCES public.marketplace_items(id);


--
-- Name: treatment_plans treatment_plans_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_addons user_addons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addons
    ADD CONSTRAINT user_addons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_analytics user_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_favorite_phrases user_favorite_phrases_phrase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_phrases
    ADD CONSTRAINT user_favorite_phrases_phrase_id_fkey FOREIGN KEY (phrase_id) REFERENCES public.motivational_phrases(id) ON DELETE CASCADE;


--
-- Name: user_favorite_phrases user_favorite_phrases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorite_phrases
    ADD CONSTRAINT user_favorite_phrases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: user_notification_preferences user_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: withdrawal_requests withdrawal_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: withdrawal_requests withdrawal_requests_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: word_searches word_searches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word_searches
    ADD CONSTRAINT word_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_audit_logs Admin full access logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access logs" ON public.admin_audit_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
-- Name: subscription_payments Admin full access payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access payments" ON public.subscription_payments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
-- Name: membership_plans Admin full access plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access plans" ON public.membership_plans USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
-- Name: subscriptions Admin full access subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access subscriptions" ON public.subscriptions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
-- Name: therapists Admin manage therapists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin manage therapists" ON public.therapists USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: faq_chatbot Admins can manage FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage FAQs" ON public.faq_chatbot USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: discount_coupons Admins can manage all coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all coupons" ON public.discount_coupons TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: patients Admins can manage all patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all patients" ON public.patients USING (public.is_admin());


--
-- Name: blog_reviews Admins can manage all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all reviews" ON public.blog_reviews USING (public.has_role(VARIADIC ARRAY['admin'::text])) WITH CHECK (public.has_role(VARIADIC ARRAY['admin'::text]));


--
-- Name: admin_audit_logs Admins can manage audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage audit logs" ON public.admin_audit_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_articles Admins can manage blog_articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage blog_articles" ON public.blog_articles USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_categories Admins can manage blog_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage blog_categories" ON public.blog_categories USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.blog_categories USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: discount_coupons Admins can manage coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage coupons" ON public.discount_coupons USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: subscription_plans Admins can manage plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage plans" ON public.subscription_plans USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: suggested_courses Admins can manage suggested courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage suggested courses" ON public.suggested_courses USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: support_ticket_notes Admins can manage ticket notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage ticket notes" ON public.support_ticket_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: withdrawal_requests Admins can manage withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawal_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: appointments Admins can read all appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all appointments" ON public.appointments FOR SELECT USING (public.is_admin());


--
-- Name: cookie_consents Admins can read all consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all consents" ON public.cookie_consents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: marketplace_items Admins can read all marketplace items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all marketplace items" ON public.marketplace_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: patients Admins can read all patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all patients" ON public.patients FOR SELECT USING (public.is_admin());


--
-- Name: profiles Admins can read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());


--
-- Name: therapist_subscriptions Admins can read all subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read all subscriptions" ON public.therapist_subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_posts Admins can read blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read blog_posts" ON public.blog_posts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: clinical_history Admins can read clinical_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read clinical_history" ON public.clinical_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: cookie_consents Admins can read cookie consents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read cookie consents" ON public.cookie_consents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: admin_permissions Admins can read own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read own permissions" ON public.admin_permissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: patient_questions Admins can read patient_questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read patient_questions" ON public.patient_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: session_activities Admins can read session_activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can read session_activities" ON public.session_activities FOR SELECT USING (public.is_admin());


--
-- Name: marketplace_items Admins can update marketplace items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update marketplace items" ON public.marketplace_items FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: audit_logs Admins can view all audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(VARIADIC ARRAY['admin'::text]));


--
-- Name: progress_reports Admins can view all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reports" ON public.progress_reports FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: wallet_transactions Admins can view all transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: wallets Admins can view all wallets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_posts Admins can write blog_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can write blog_posts" ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_posts Admins have full access to blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins have full access to blog posts" ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: therapist_details Admins have full access to therapist details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins have full access to therapist details" ON public.therapist_details USING ((public.get_user_role(auth.uid()) = 'admin'::text));


--
-- Name: ai_settings Admins manage ai_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage ai_settings" ON public.ai_settings USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: arco_requests Admins manage arco requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage arco requests" ON public.arco_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: commissions Admins manage commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage commissions" ON public.commissions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: marketing_leads Admins manage leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage leads" ON public.marketing_leads USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: legal_disputes Admins manage legal_disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage legal_disputes" ON public.legal_disputes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: legal_documents Admins manage legal_documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage legal_documents" ON public.legal_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: legal_policies Admins manage legal_policies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage legal_policies" ON public.legal_policies USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: legal_signatures Admins manage legal_signatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage legal_signatures" ON public.legal_signatures USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: legal_document_versions Admins manage legal_versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins manage legal_versions" ON public.legal_document_versions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: platform_feedback Admins read all feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all feedback" ON public.platform_feedback USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: patient_documents Admins read all patient_documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all patient_documents" ON public.patient_documents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: profiles Admins read all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.admin_permissions
  WHERE (admin_permissions.user_id = auth.uid()))));


--
-- Name: marketplace_payouts Admins read marketplace_payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read marketplace_payouts" ON public.marketplace_payouts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: sales_summary Admins read sales_summary; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read sales_summary" ON public.sales_summary FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: therapist_commissions Admins read therapist_commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins read therapist_commissions" ON public.therapist_commissions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: marketplace_payouts Admins update marketplace_payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update marketplace_payouts" ON public.marketplace_payouts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: sales Admins view all sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all sales" ON public.sales FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: profiles Allow full access for service_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow full access for service_role" ON public.profiles USING ((auth.role() = 'service_role'::text));


--
-- Name: report_logs Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.report_logs FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: services Allow insert for own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for own services" ON public.services FOR INSERT TO authenticated WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: services Allow public read access to active services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to active services" ON public.services FOR SELECT USING ((is_active = true));


--
-- Name: services Allow update and delete for own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update and delete for own services" ON public.services TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: cookie_consents Anyone can insert cookie consent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert cookie consent" ON public.cookie_consents FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: diagnosis_codes Anyone can read diagnosis codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read diagnosis codes" ON public.diagnosis_codes FOR SELECT USING (true);


--
-- Name: diagnosis_systems Anyone can read diagnosis systems; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read diagnosis systems" ON public.diagnosis_systems FOR SELECT USING (true);


--
-- Name: subscription_plans Anyone can read plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read plans" ON public.subscription_plans FOR SELECT USING (true);


--
-- Name: marketplace_reviews Anyone can read reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read reviews" ON public.marketplace_reviews FOR SELECT USING (true);


--
-- Name: marketplace_review_votes Anyone can read votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read votes" ON public.marketplace_review_votes FOR SELECT USING (true);


--
-- Name: therapist_details Anyone can view therapist details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view therapist details" ON public.therapist_details FOR SELECT USING (true);


--
-- Name: discount_coupons Authenticated users can view active coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active coupons" ON public.discount_coupons FOR SELECT TO authenticated USING (((is_active = true) AND ((expiration_date IS NULL) OR (expiration_date > now()))));


--
-- Name: marketplace_review_votes Authenticated users can vote; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can vote" ON public.marketplace_review_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_reviews Buyers can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers can create reviews" ON public.marketplace_reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: sales Buyers view own purchases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Buyers view own purchases" ON public.sales FOR SELECT TO authenticated USING ((buyer_id = auth.uid()));


--
-- Name: clinic_invitations Clinic owners can create invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinic owners can create invitations" ON public.clinic_invitations FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
-- Name: clinic_invoices Clinic owners can manage their invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinic owners can manage their invoices" ON public.clinic_invoices USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.therapist_id = auth.uid())))) WITH CHECK ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.therapist_id = auth.uid()))));


--
-- Name: clinic_invitations Clinic owners can update invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinic owners can update invitations" ON public.clinic_invitations FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
-- Name: clinic_invitations Clinic owners can view invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinic owners can view invitations" ON public.clinic_invitations FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clinics c
  WHERE ((c.id = clinic_invitations.clinic_id) AND (c.therapist_id = auth.uid())))));


--
-- Name: activity_library Create own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Create own activities" ON public.activity_library FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Create own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Create own plans" ON public.treatment_plans FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: activity_library Delete own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete own activities" ON public.activity_library FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Delete own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Delete own plans" ON public.treatment_plans FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Edit own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Edit own plans" ON public.treatment_plans FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: marketplace_items Enable delete for users based on seller_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users based on seller_id" ON public.marketplace_items FOR DELETE USING ((auth.uid() = seller_id));


--
-- Name: marketplace_orders Enable insert for buyers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for buyers" ON public.marketplace_orders FOR INSERT WITH CHECK ((auth.uid() = buyer_id));


--
-- Name: order_items Enable insert for order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for order items" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.marketplace_orders
  WHERE ((marketplace_orders.id = order_items.order_id) AND (marketplace_orders.buyer_id = auth.uid())))));


--
-- Name: marketplace_items Enable insert for users based on seller_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for users based on seller_id" ON public.marketplace_items FOR INSERT WITH CHECK ((auth.uid() = seller_id));


--
-- Name: marketplace_items Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.marketplace_items FOR SELECT USING ((((is_active = true) AND (is_approved = true)) OR (auth.uid() = seller_id)));


--
-- Name: marketplace_orders Enable select for buyers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable select for buyers" ON public.marketplace_orders FOR SELECT USING ((auth.uid() = buyer_id));


--
-- Name: order_items Enable select for order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable select for order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.marketplace_orders
  WHERE ((marketplace_orders.id = order_items.order_id) AND (marketplace_orders.buyer_id = auth.uid())))));


--
-- Name: marketplace_items Enable update for users based on seller_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on seller_id" ON public.marketplace_items FOR UPDATE USING ((auth.uid() = seller_id));


--
-- Name: faq_chatbot Everyone can read FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can read FAQs" ON public.faq_chatbot FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: therapist_favorite_activities Manage own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Manage own favorites" ON public.therapist_favorite_activities USING ((therapist_id = auth.uid()));


--
-- Name: team_members Owners and admins can invite members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners and admins can invite members" ON public.team_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.team_members team_members_1
  WHERE ((team_members_1.user_id = auth.uid()) AND (team_members_1.clinic_id = team_members_1.clinic_id) AND (team_members_1.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (team_members_1.status = 'active'::text)))));


--
-- Name: team_members Owners and admins can update members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners and admins can update members" ON public.team_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.team_members team_members_1
  WHERE ((team_members_1.user_id = auth.uid()) AND (team_members_1.clinic_id = team_members_1.clinic_id) AND (team_members_1.role = ANY (ARRAY['owner'::text, 'admin'::text])) AND (team_members_1.status = 'active'::text)))));


--
-- Name: patient_questions Patients can manage their own questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can manage their own questions" ON public.patient_questions USING ((patient_id = auth.uid())) WITH CHECK ((patient_id = auth.uid()));


--
-- Name: clinical_reports Patients can view own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view own reports" ON public.clinical_reports FOR SELECT USING (((auth.uid() = patient_id) AND (status = ANY (ARRAY['validated'::public.report_status, 'signed'::public.report_status, 'locked'::public.report_status]))));


--
-- Name: session_activities Patients can view session activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view session activities" ON public.session_activities FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.plan_sessions ps
     JOIN public.patient_assigned_plans pap ON ((pap.id = ps.assigned_plan_id)))
  WHERE ((ps.id = session_activities.session_id) AND (pap.patient_id = auth.uid())))));


--
-- Name: progress_reports Patients can view shared reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view shared reports" ON public.progress_reports FOR SELECT USING (((auth.uid() = patient_id) AND (shared_with_patient = true)));


--
-- Name: patient_assigned_plans Patients can view their assigned plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their assigned plans" ON public.patient_assigned_plans FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: patient_payments Patients can view their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their own payments" ON public.patient_payments FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
-- Name: plan_sessions Patients can view their plan sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients can view their plan sessions" ON public.plan_sessions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patient_assigned_plans pap
  WHERE ((pap.id = plan_sessions.assigned_plan_id) AND (pap.patient_id = auth.uid())))));


--
-- Name: patient_documents Patients read own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Patients read own documents" ON public.patient_documents FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
-- Name: blocked_times Public can not view blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can not view blocked times" ON public.blocked_times FOR SELECT USING (false);


--
-- Name: blog_categories Public can read categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can read categories" ON public.blog_categories FOR SELECT USING (true);


--
-- Name: email_templates Public can view active email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active email templates" ON public.email_templates FOR SELECT USING ((is_active = true));


--
-- Name: therapist_services Public can view active therapist services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view active therapist services" ON public.therapist_services FOR SELECT USING ((is_active = true));


--
-- Name: therapist_availabilities Public can view availabilities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view availabilities" ON public.therapist_availabilities FOR SELECT USING (true);


--
-- Name: cities Public can view cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view cities" ON public.cities FOR SELECT TO authenticated, anon USING (true);


--
-- Name: insurance_providers Public can view insurance providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view insurance providers" ON public.insurance_providers FOR SELECT USING ((is_active = true));


--
-- Name: therapist_education Public can view public education records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view public education records" ON public.therapist_education FOR SELECT USING ((is_public = true));


--
-- Name: therapist_services Public can view public services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view public services" ON public.therapist_services FOR SELECT USING ((is_public = true));


--
-- Name: therapist_experience Public can view public therapist experience; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view public therapist experience" ON public.therapist_experience FOR SELECT USING ((is_public = true));


--
-- Name: therapist_landing_pages Public can view published landing pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published landing pages" ON public.therapist_landing_pages FOR SELECT USING ((published = true));


--
-- Name: regions Public can view regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view regions" ON public.regions FOR SELECT TO authenticated, anon USING (true);


--
-- Name: specialties Public can view specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view specialties" ON public.specialties FOR SELECT TO authenticated, anon USING (true);


--
-- Name: specialties Public can view specialties catalog; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view specialties catalog" ON public.specialties FOR SELECT TO authenticated, anon USING (true);


--
-- Name: therapist_branding Public can view therapist branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view therapist branding" ON public.therapist_branding FOR SELECT USING (true);


--
-- Name: profiles Public can view therapist profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view therapist profiles" ON public.profiles FOR SELECT USING ((role = 'therapist'::public.user_role));


--
-- Name: planification_types Public read access to planification types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access to planification types" ON public.planification_types FOR SELECT USING (true);


--
-- Name: membership_plans Public read plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read plans" ON public.membership_plans FOR SELECT USING (true);


--
-- Name: legal_documents Public read published docs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read published docs" ON public.legal_documents FOR SELECT USING ((status = 'published'::text));


--
-- Name: therapists Public read therapists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read therapists" ON public.therapists FOR SELECT USING (true);


--
-- Name: blog_posts Published blog posts are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Published blog posts are public" ON public.blog_posts FOR SELECT USING ((status = 'published'::text));


--
-- Name: marketplace_reviews Reviewers can delete own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviewers can delete own reviews" ON public.marketplace_reviews FOR DELETE USING ((auth.uid() = reviewer_id));


--
-- Name: marketplace_reviews Reviewers can update own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviewers can update own reviews" ON public.marketplace_reviews FOR UPDATE USING ((auth.uid() = reviewer_id));


--
-- Name: marketplace_reviews Reviews are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are public" ON public.marketplace_reviews FOR SELECT USING ((is_visible = true));


--
-- Name: sales Sellers view own sales; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sellers view own sales" ON public.sales FOR SELECT TO authenticated USING ((seller_id = auth.uid()));


--
-- Name: therapist_recommendations Service role manages recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role manages recommendations" ON public.therapist_recommendations USING (true);


--
-- Name: team_members Team members can view their clinic members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Team members can view their clinic members" ON public.team_members FOR SELECT USING (((clinic_id IN ( SELECT tm.clinic_id
   FROM public.team_members tm
  WHERE ((tm.user_id = auth.uid()) AND (tm.status = 'active'::text)))) OR (user_id = auth.uid())));


--
-- Name: pie_student_data Terapeuta ve sus propios datos PIE; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Terapeuta ve sus propios datos PIE" ON public.pie_student_data USING ((therapist_id = auth.uid()));


--
-- Name: therapist_favorite_activities Terapeutas pueden agregar favoritos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Terapeutas pueden agregar favoritos" ON public.therapist_favorite_activities FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_favorite_activities Terapeutas pueden eliminar sus favoritos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Terapeutas pueden eliminar sus favoritos" ON public.therapist_favorite_activities FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: therapist_favorite_activities Terapeutas pueden ver sus favoritos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Terapeutas pueden ver sus favoritos" ON public.therapist_favorite_activities FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: patient_plan_assignments Therapist can manage own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapist can manage own assignments" ON public.patient_plan_assignments USING ((assigned_by = auth.uid()));


--
-- Name: patient_diagnoses Therapist can manage patient diagnoses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapist can manage patient diagnoses" ON public.patient_diagnoses USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: adir_evaluations Therapist owns adir_evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapist owns adir_evaluations" ON public.adir_evaluations USING ((therapist_id = auth.uid()));


--
-- Name: adir_item_responses Therapist owns adir_item_responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapist owns adir_item_responses" ON public.adir_item_responses USING ((evaluation_id IN ( SELECT adir_evaluations.id
   FROM public.adir_evaluations
  WHERE (adir_evaluations.therapist_id = auth.uid()))));


--
-- Name: therapist_exercises Therapists can delete own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete own exercises" ON public.therapist_exercises FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can delete own materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete own materials" ON public.therapist_materials FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can delete own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete own scheduled reminders" ON public.scheduled_reminders FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can delete own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete own templates" ON public.patient_document_templates FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_conditions Therapists can delete their own conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete their own conditions" ON public.therapist_conditions FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can delete their own education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete their own education" ON public.therapist_education FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can delete their own generated templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete their own generated templates" ON public.generated_templates FOR DELETE USING ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can delete their own specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can delete their own specialties" ON public.therapist_specialties FOR DELETE TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: patient_activity_logs Therapists can insert activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert activity logs" ON public.patient_activity_logs FOR INSERT WITH CHECK (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = patient_activity_logs.patient_id) AND (patients.therapist_id = auth.uid()))))));


--
-- Name: therapist_exercises Therapists can insert own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert own exercises" ON public.therapist_exercises FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can insert own materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert own materials" ON public.therapist_materials FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can insert own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert own scheduled reminders" ON public.scheduled_reminders FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can insert own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert own templates" ON public.patient_document_templates FOR INSERT WITH CHECK (((therapist_id = auth.uid()) OR (therapist_id IS NULL)));


--
-- Name: suggested_courses Therapists can insert suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert suggestions" ON public.suggested_courses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'therapist'::public.user_role)))));


--
-- Name: therapist_conditions Therapists can insert their own conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert their own conditions" ON public.therapist_conditions FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can insert their own education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert their own education" ON public.therapist_education FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can insert their own generated templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert their own generated templates" ON public.generated_templates FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can insert their own specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can insert their own specialties" ON public.therapist_specialties FOR INSERT TO authenticated WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_assigned_plans Therapists can manage assigned plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage assigned plans" ON public.patient_assigned_plans USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_private_notes Therapists can manage notes for their own patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage notes for their own patients" ON public.patient_private_notes USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: plan_objective_activities Therapists can manage objective activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage objective activities" ON public.plan_objective_activities USING ((EXISTS ( SELECT 1
   FROM (public.plan_objectives po
     JOIN public.treatment_plans tp ON ((tp.id = po.plan_id)))
  WHERE ((po.id = plan_objective_activities.objective_id) AND (tp.therapist_id = auth.uid())))));


--
-- Name: therapist_availabilities Therapists can manage own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage own availability" ON public.therapist_availabilities USING ((auth.uid() = therapist_id));


--
-- Name: therapist_branding Therapists can manage own branding; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage own branding" ON public.therapist_branding USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_landing_pages Therapists can manage own landing page; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage own landing page" ON public.therapist_landing_pages USING ((auth.uid() = therapist_id));


--
-- Name: clinical_reports Therapists can manage own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage own reports" ON public.clinical_reports USING (((auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['therapist'::text, 'admin'::text])));


--
-- Name: therapist_services Therapists can manage own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage own services" ON public.therapist_services USING ((auth.uid() = therapist_id));


--
-- Name: plan_objectives Therapists can manage plan objectives; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage plan objectives" ON public.plan_objectives USING ((EXISTS ( SELECT 1
   FROM public.treatment_plans tp
  WHERE ((tp.id = plan_objectives.plan_id) AND (tp.therapist_id = auth.uid())))));


--
-- Name: plan_sessions Therapists can manage plan sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage plan sessions" ON public.plan_sessions USING ((EXISTS ( SELECT 1
   FROM public.patient_assigned_plans pap
  WHERE ((pap.id = plan_sessions.assigned_plan_id) AND (pap.therapist_id = auth.uid())))));


--
-- Name: session_activities Therapists can manage session activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage session activities" ON public.session_activities USING ((EXISTS ( SELECT 1
   FROM (public.plan_sessions ps
     JOIN public.patient_assigned_plans pap ON ((pap.id = ps.assigned_plan_id)))
  WHERE ((ps.id = session_activities.session_id) AND (pap.therapist_id = auth.uid())))));


--
-- Name: therapist_appointments Therapists can manage their appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their appointments" ON public.therapist_appointments USING ((auth.uid() = therapist_id));


--
-- Name: progress_reports Therapists can manage their generated reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their generated reports" ON public.progress_reports USING ((auth.uid() = therapist_id));


--
-- Name: blocked_slots Therapists can manage their own blocked slots.; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own blocked slots." ON public.blocked_slots USING ((therapist_id = auth.uid()));


--
-- Name: blocked_times Therapists can manage their own blocked times; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own blocked times" ON public.blocked_times TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: blog_posts Therapists can manage their own blog posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own blog posts" ON public.blog_posts USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: clinical_history Therapists can manage their own clinical history entries; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own clinical history entries" ON public.clinical_history USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: therapist_details Therapists can manage their own details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own details" ON public.therapist_details USING ((auth.uid() = user_id));


--
-- Name: therapist_documents Therapists can manage their own documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own documents" ON public.therapist_documents USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_experience Therapists can manage their own experience; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own experience" ON public.therapist_experience USING ((auth.uid() = therapist_id)) WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: notiz_sessions Therapists can manage their own notiz sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own notiz sessions" ON public.notiz_sessions USING ((auth.uid() = therapist_id));


--
-- Name: patient_documents Therapists can manage their own patient documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own patient documents" ON public.patient_documents USING ((auth.uid() = therapist_id));


--
-- Name: payments Therapists can manage their own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own payments" ON public.payments TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: treatment_plans Therapists can manage their own treatment plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their own treatment plans" ON public.treatment_plans TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: patient_payments Therapists can manage their patient payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can manage their patient payments" ON public.patient_payments USING ((therapist_id = auth.uid()));


--
-- Name: generated_templates Therapists can see their own generated templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can see their own generated templates" ON public.generated_templates FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: therapist_exercises Therapists can update own exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update own exercises" ON public.therapist_exercises FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_materials Therapists can update own materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update own materials" ON public.therapist_materials FOR UPDATE USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: scheduled_reminders Therapists can update own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update own scheduled reminders" ON public.scheduled_reminders FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: patient_document_templates Therapists can update own templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update own templates" ON public.patient_document_templates FOR UPDATE USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: profiles Therapists can update patient profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update patient profiles" ON public.profiles FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid())))));


--
-- Name: patient_questions Therapists can update patient questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update patient questions" ON public.patient_questions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.patients p
  WHERE ((p.profile_id = patient_questions.patient_id) AND (p.therapist_id = auth.uid())))));


--
-- Name: therapist_education Therapists can update their own education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update their own education" ON public.therapist_education FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: generated_templates Therapists can update their own generated templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can update their own generated templates" ON public.generated_templates FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: patient_questions Therapists can view all questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view all questions" ON public.patient_questions FOR SELECT TO authenticated USING ((public.get_user_role(auth.uid()) = 'therapist'::text));


--
-- Name: patient_document_templates Therapists can view own and global templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own and global templates" ON public.patient_document_templates FOR SELECT USING (((therapist_id = auth.uid()) OR (is_global = true)));


--
-- Name: therapist_exercises Therapists can view own and public exercises; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own and public exercises" ON public.therapist_exercises FOR SELECT USING (((therapist_id = auth.uid()) OR (is_public = true)));


--
-- Name: therapist_materials Therapists can view own materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own materials" ON public.therapist_materials FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: reminder_logs Therapists can view own reminder logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own reminder logs" ON public.reminder_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.appointments a
  WHERE ((a.id = reminder_logs.appointment_id) AND (a.therapist_id = auth.uid())))));


--
-- Name: scheduled_reminders Therapists can view own scheduled reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own scheduled reminders" ON public.scheduled_reminders FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: suggested_courses Therapists can view own suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view own suggestions" ON public.suggested_courses FOR SELECT USING ((suggested_by = auth.uid()));


--
-- Name: blog_reviews Therapists can view reviews on their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view reviews on their posts" ON public.blog_reviews FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.blog_posts
  WHERE ((blog_posts.id = blog_reviews.blog_post_id) AND (blog_posts.author_id = auth.uid())))));


--
-- Name: therapist_conditions Therapists can view their own conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view their own conditions" ON public.therapist_conditions FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: therapist_education Therapists can view their own education; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view their own education" ON public.therapist_education FOR SELECT USING ((auth.uid() = therapist_id));


--
-- Name: therapist_specialties Therapists can view their own specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists can view their own specialties" ON public.therapist_specialties FOR SELECT TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: sensorial_evaluations Therapists manage own sensorial evals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists manage own sensorial evals" ON public.sensorial_evaluations USING ((therapist_id = auth.uid()));


--
-- Name: therapist_specialties Therapists manage own specialties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists manage own specialties" ON public.therapist_specialties USING (((auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['admin'::text])));


--
-- Name: sensorial_item_responses Therapists manage sensorial responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists manage sensorial responses" ON public.sensorial_item_responses USING ((evaluation_id IN ( SELECT sensorial_evaluations.id
   FROM public.sensorial_evaluations
  WHERE (sensorial_evaluations.therapist_id = auth.uid()))));


--
-- Name: commissions Therapists view own commissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Therapists view own commissions" ON public.commissions FOR SELECT TO authenticated USING ((therapist_id = auth.uid()));


--
-- Name: activity_library Update own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Update own activities" ON public.activity_library FOR UPDATE USING ((therapist_id = auth.uid()));


--
-- Name: ai_chat_sessions Users can create chat sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create chat sessions" ON public.ai_chat_sessions FOR INSERT WITH CHECK (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR (session_type = 'anonymous'::text)));


--
-- Name: refund_requests Users can create refund requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create refund requests" ON public.refund_requests FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: withdrawal_requests Users can create withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_review_votes Users can delete own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own votes" ON public.marketplace_review_votes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can insert own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own logs" ON public.report_logs FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: ai_feedback Users can manage own AI feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own AI feedback" ON public.ai_feedback USING (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR public.has_role(VARIADIC ARRAY['admin'::text])));


--
-- Name: marketplace_reviews Users can manage own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own reviews" ON public.marketplace_reviews USING ((reviewer_id = auth.uid()));


--
-- Name: review_helpful_votes Users can manage own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own votes" ON public.review_helpful_votes USING ((user_id = auth.uid()));


--
-- Name: user_notification_preferences Users can manage their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own notification preferences" ON public.user_notification_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: marketplace_saved_searches Users can manage their own saved searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own saved searches" ON public.marketplace_saved_searches USING ((auth.uid() = user_id));


--
-- Name: word_searches Users can manage their own word searches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own word searches" ON public.word_searches USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_addons Users can read own addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own addons" ON public.user_addons FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: cookie_consents Users can read own consent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own consent" ON public.cookie_consents FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: therapist_subscriptions Users can read own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own subscriptions" ON public.therapist_subscriptions FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: marketplace_review_votes Users can update own votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own votes" ON public.marketplace_review_votes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_analytics Users can view own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_chat_sessions Users can view own chat sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own chat sessions" ON public.ai_chat_sessions FOR SELECT USING (((auth.uid() = patient_id) OR (auth.uid() = therapist_id) OR (session_type = 'anonymous'::text)));


--
-- Name: email_notifications Users can view own email notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own email notifications" ON public.email_notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can view own logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own logs" ON public.report_logs FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: metrics_summary Users can view own metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own metrics" ON public.metrics_summary FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: refund_requests Users can view own refund requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own refund requests" ON public.refund_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.wallets w
  WHERE ((w.id = wallet_transactions.wallet_id) AND (w.user_id = auth.uid())))));


--
-- Name: wallets Users can view own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: withdrawal_requests Users can view own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: report_logs Users can view report logs for their reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view report logs for their reports" ON public.report_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clinical_reports cr
  WHERE ((cr.id = report_logs.report_id) AND ((cr.therapist_id = auth.uid()) OR (cr.patient_id = auth.uid()))))));


--
-- Name: therapist_appointments Users can view their own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own appointments" ON public.therapist_appointments FOR SELECT USING (((auth.uid() = therapist_id) OR (auth.uid() = patient_id)));


--
-- Name: user_notification_preferences Users can view their own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notification preferences" ON public.user_notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: arco_requests Users create own arco requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users create own arco requests" ON public.arco_requests FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: platform_feedback Users create own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users create own feedback" ON public.platform_feedback FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: marketplace_favorites Users manage own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own favorites" ON public.marketplace_favorites USING ((user_id = auth.uid()));


--
-- Name: symptom_profiles Users manage own symptoms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage own symptoms" ON public.symptom_profiles USING ((auth.uid() = patient_id));


--
-- Name: arco_requests Users read own arco requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own arco requests" ON public.arco_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: platform_feedback Users read own feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own feedback" ON public.platform_feedback FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: therapist_recommendations Users read own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own recommendations" ON public.therapist_recommendations FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: legal_signatures Users read own signatures; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own signatures" ON public.legal_signatures FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: subscription_payments Users see own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own payments" ON public.subscription_payments FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: subscriptions Users see own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users see own subscriptions" ON public.subscriptions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: legal_signatures Users sign documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users sign documents" ON public.legal_signatures FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: activity_library View global and own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View global and own activities" ON public.activity_library FOR SELECT USING (((is_global = true) OR (therapist_id = auth.uid())));


--
-- Name: treatment_plans View global and own plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View global and own plans" ON public.treatment_plans FOR SELECT USING (((is_global = true) OR (therapist_id = auth.uid())));


--
-- Name: activity_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_library; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_library ENABLE ROW LEVEL SECURITY;

--
-- Name: adir_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.adir_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: adir_item_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.adir_item_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: wallet_transactions admin_all_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_transactions ON public.wallet_transactions USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: wallets admin_all_wallets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_wallets ON public.wallets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: withdrawal_requests admin_all_withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_all_withdrawals ON public.withdrawal_requests USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: admin_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: support_incident_notes admin_full_access_incident_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_incident_notes ON public.support_incident_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: support_incidents admin_full_access_incidents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_incidents ON public.support_incidents USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: system_logs admin_full_access_system_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_system_logs ON public.system_logs USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: support_ticket_notes admin_full_access_ticket_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_ticket_notes ON public.support_ticket_notes USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: support_tickets admin_full_access_tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_full_access_tickets ON public.support_tickets USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: courses admin_manage_all_courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_all_courses ON public.courses USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: course_enrollments admin_manage_enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_manage_enrollments ON public.course_enrollments USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: admin_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_permissions admin_permissions_no_client_writes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_permissions_no_client_writes ON public.admin_permissions TO authenticated USING (false) WITH CHECK (false);


--
-- Name: ados2_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ados2_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: ados2_item_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ados2_item_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_chat_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversation_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversation_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_plan_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_plan_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_recommendation_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_recommendation_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_quotas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_quotas ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_invitations anyone_can_accept_invitation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_can_accept_invitation ON public.therapist_invitations FOR UPDATE USING ((status = 'pending'::text)) WITH CHECK ((status = 'accepted'::text));


--
-- Name: clinical_access_log anyone_can_insert_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_can_insert_log ON public.clinical_access_log FOR INSERT WITH CHECK (true);


--
-- Name: courses anyone_read_approved_courses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_read_approved_courses ON public.courses FOR SELECT USING ((status = 'approved'::text));


--
-- Name: therapist_invitations anyone_read_by_code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_read_by_code ON public.therapist_invitations FOR SELECT USING (true);


--
-- Name: ai_plan_limits anyone_read_limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_read_limits ON public.ai_plan_limits FOR SELECT USING (true);


--
-- Name: course_modules anyone_read_modules_of_approved; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_read_modules_of_approved ON public.course_modules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_modules.course_id) AND (courses.status = 'approved'::text)))));


--
-- Name: course_reviews anyone_read_reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY anyone_read_reviews ON public.course_reviews FOR SELECT USING (true);


--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments appointments_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appointments_insert ON public.appointments FOR INSERT TO authenticated WITH CHECK (((auth.uid() = therapist_id) OR (auth.uid() = patient_id)));


--
-- Name: appointments appt_patient_cancel; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appt_patient_cancel ON public.appointments FOR UPDATE USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
-- Name: appointments appt_patient_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appt_patient_view_own ON public.appointments FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
-- Name: appointments appt_therapist_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appt_therapist_update ON public.appointments FOR UPDATE USING ((therapist_id IN ( SELECT therapist_details.user_id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid()))));


--
-- Name: appointments appt_therapist_view_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY appt_therapist_view_own ON public.appointments FOR SELECT USING ((therapist_id IN ( SELECT therapist_details.user_id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid()))));


--
-- Name: arco_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.arco_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: assigned_plan_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assigned_plan_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: availability_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.availability_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: billing_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_times; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts blog_posts_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_admin_all ON public.blog_posts USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: blog_posts blog_posts_public_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_posts_public_select ON public.blog_posts FOR SELECT TO authenticated, anon USING ((status = 'published'::text));


--
-- Name: blog_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.blog_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_reviews blog_reviews_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY blog_reviews_admin_all ON public.blog_reviews USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: calendar_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: clinics clinic_members_can_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinic_members_can_read ON public.clinics FOR SELECT USING ((id IN ( SELECT clinic_therapists.clinic_id
   FROM public.clinic_therapists
  WHERE ((clinic_therapists.therapist_id = auth.uid()) AND (clinic_therapists.is_active = true)))));


--
-- Name: clinic_therapists clinic_owner_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinic_owner_manage ON public.clinic_therapists USING (public.is_clinic_owner(clinic_id)) WITH CHECK (public.is_clinic_owner(clinic_id));


--
-- Name: clinic_therapists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_therapists ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_access_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_access_log ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_history ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: clinics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

--
-- Name: clinics clinics_manage_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinics_manage_own ON public.clinics TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: clinics clinics_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinics_public_read ON public.clinics FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: cookie_consents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_uses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

--
-- Name: course_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: course_lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: course_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: course_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_therapists ct_manage_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ct_manage_self ON public.clinic_therapists TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: clinic_therapists ct_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ct_read_active ON public.clinic_therapists FOR SELECT TO authenticated, anon USING ((is_active = true));


--
-- Name: therapist_specialties del_therapist_specialties_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY del_therapist_specialties_self ON public.therapist_specialties FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: diagnosis_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diagnosis_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: diagnosis_systems; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.diagnosis_systems ENABLE ROW LEVEL SECURITY;

--
-- Name: discount_coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: education_recommendations edu_rec_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY edu_rec_admin_all ON public.education_recommendations USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));


--
-- Name: education_recommendations edu_rec_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY edu_rec_select ON public.education_recommendations FOR SELECT USING ((is_active = true));


--
-- Name: education_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.education_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: email_notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: faq_chatbot; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faq_chatbot ENABLE ROW LEVEL SECURITY;

--
-- Name: generated_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.generated_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_specialties ins_therapist_specialties_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ins_therapist_specialties_self ON public.therapist_specialties FOR INSERT WITH CHECK ((therapist_id = auth.uid()));


--
-- Name: course_modules instructor_manage_modules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instructor_manage_modules ON public.course_modules USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_modules.course_id) AND (courses.instructor_id = auth.uid())))));


--
-- Name: courses instructor_manage_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instructor_manage_own ON public.courses USING ((auth.uid() = instructor_id));


--
-- Name: course_enrollments instructor_read_course_enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY instructor_read_course_enrollments ON public.course_enrollments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.courses
  WHERE ((courses.id = course_enrollments.course_id) AND (courses.instructor_id = auth.uid())))));


--
-- Name: insurance_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_disputes ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_document_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_policies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_policies ENABLE ROW LEVEL SECURITY;

--
-- Name: legal_signatures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legal_signatures ENABLE ROW LEVEL SECURITY;

--
-- Name: marketing_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_items marketplace_items_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY marketplace_items_delete_policy ON public.marketplace_items FOR DELETE USING ((seller_id = auth.uid()));


--
-- Name: marketplace_items marketplace_items_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY marketplace_items_insert_policy ON public.marketplace_items FOR INSERT WITH CHECK (((auth.uid() IS NOT NULL) AND (seller_id = auth.uid())));


--
-- Name: marketplace_items marketplace_items_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY marketplace_items_select_policy ON public.marketplace_items FOR SELECT USING ((((is_active = true) AND (is_approved = true)) OR (seller_id = auth.uid())));


--
-- Name: marketplace_items marketplace_items_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY marketplace_items_update_policy ON public.marketplace_items FOR UPDATE USING ((seller_id = auth.uid())) WITH CHECK ((seller_id = auth.uid()));


--
-- Name: marketplace_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_payouts ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_review_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_review_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_saved_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_saved_searches ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: metrics_summary; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.metrics_summary ENABLE ROW LEVEL SECURITY;

--
-- Name: motivational_patient; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.motivational_patient ENABLE ROW LEVEL SECURITY;

--
-- Name: motivational_phrases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.motivational_phrases ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notiz_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notiz_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments only_therapist_can_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY only_therapist_can_delete ON public.appointments FOR DELETE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_access_grants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_access_grants ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_assigned_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_assigned_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_development_areas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_development_areas ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_diagnoses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_diagnoses ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_document_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_document_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_goals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments patient_insert_appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_insert_appointments ON public.appointments FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))) OR (auth.uid() = therapist_id)));


--
-- Name: patient_access_grants patient_manages_own_grants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_manages_own_grants ON public.patient_access_grants USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: patient_materials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: patients patient_own_record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_own_record ON public.patients FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: patient_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_plan_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_plan_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_private_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_private_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: clinical_access_log patient_sees_own_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_sees_own_log ON public.clinical_access_log FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.profile_id = auth.uid()))));


--
-- Name: appointments patient_select_own_appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_select_own_appointments ON public.appointments FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))));


--
-- Name: patients patient_select_own_patient_record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_select_own_patient_record ON public.patients FOR SELECT TO authenticated USING ((profile_id = auth.uid()));


--
-- Name: ados2_evaluations patient_view_own_evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_view_own_evaluations ON public.ados2_evaluations FOR SELECT USING ((auth.uid() = patient_id));


--
-- Name: ados2_item_responses patient_view_own_item_responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_view_own_item_responses ON public.ados2_item_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ados2_evaluations
  WHERE ((ados2_evaluations.id = ados2_item_responses.evaluation_id) AND (ados2_evaluations.patient_id = auth.uid())))));


--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments patients can see own appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "patients can see own appointments" ON public.appointments FOR SELECT TO authenticated USING ((auth.uid() = patient_id));


--
-- Name: patients patients_select_own_or_assigned; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patients_select_own_or_assigned ON public.patients FOR SELECT USING (((profile_id = auth.uid()) OR (therapist_id IN ( SELECT patients.id
   FROM public.therapist_details
  WHERE (therapist_details.user_id = auth.uid())))));


--
-- Name: patients patients_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patients_update_own ON public.patients FOR UPDATE USING ((profile_id = auth.uid()));


--
-- Name: clinical_history patients_view_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patients_view_own_clinical_history ON public.clinical_history FOR SELECT TO authenticated USING ((patient_id = auth.uid()));


--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: pie_student_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pie_student_data ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_objective_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_objective_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_objectives; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_objectives ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: plan_template_exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.plan_template_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: planification_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planification_types ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_questions pq_select_for_therapists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pq_select_for_therapists ON public.patient_questions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'therapist'::public.user_role)))));


--
-- Name: product_sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING ((id = auth.uid()));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING ((id = auth.uid()));


--
-- Name: progress_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: motivational_phrases public_read_motivational_phrases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY public_read_motivational_phrases ON public.motivational_phrases FOR SELECT USING ((is_active = true));


--
-- Name: refund_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: report_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: review_helpful_votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

--
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- Name: sales_summary; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales_summary ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: search_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_specialties sel_therapist_specialties_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY sel_therapist_specialties_self ON public.therapist_specialties FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: sensorial_evaluations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sensorial_evaluations ENABLE ROW LEVEL SECURITY;

--
-- Name: sensorial_item_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sensorial_item_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_usage_quotas service_role_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_all ON public.ai_usage_quotas TO service_role USING (true);


--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: session_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: session_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: specialties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: specialty_change_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialty_change_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: course_enrollments student_enroll; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_enroll ON public.course_enrollments FOR INSERT WITH CHECK ((auth.uid() = student_id));


--
-- Name: course_enrollments student_read_own_enrollments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_read_own_enrollments ON public.course_enrollments FOR SELECT USING ((auth.uid() = student_id));


--
-- Name: course_reviews student_write_review; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY student_write_review ON public.course_reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: subscription_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: subscription_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: suggested_courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suggested_courses ENABLE ROW LEVEL SECURITY;

--
-- Name: support_incident_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_incident_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: support_incidents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_incidents ENABLE ROW LEVEL SECURITY;

--
-- Name: support_ticket_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: symptom_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.symptom_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: system_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments therapist_and_patient_can_update_fixed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_and_patient_can_update_fixed ON public.appointments FOR UPDATE TO authenticated USING (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid())))))) WITH CHECK (((auth.uid() = therapist_id) OR (EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.id = appointments.patient_id) AND (patients.profile_id = auth.uid()))))));


--
-- Name: therapist_appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_availabilities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_availabilities ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_branding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_branding ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: patients therapist_delete_own_patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_delete_own_patients ON public.patients FOR DELETE USING ((therapist_id = auth.uid()));


--
-- Name: therapist_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_details ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_education; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_education ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_exercises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_exercises ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_experience; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_experience ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_favorite_activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_favorite_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments therapist_insert_own_appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_insert_own_appointments ON public.appointments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: patients therapist_insert_own_patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_insert_own_patients ON public.patients FOR INSERT TO authenticated WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: therapist_insurances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_insurances ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_invite_quotas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_invite_quotas ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_landing_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_landing_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: blocked_slots therapist_manage_own_blocked_slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_manage_own_blocked_slots ON public.blocked_slots USING ((therapist_id = auth.uid()));


--
-- Name: therapist_materials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: ados2_evaluations therapist_own_evaluations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_evaluations ON public.ados2_evaluations USING ((auth.uid() = therapist_id));


--
-- Name: therapist_invitations therapist_own_invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_invitations ON public.therapist_invitations USING ((auth.uid() = inviter_id));


--
-- Name: ados2_item_responses therapist_own_item_responses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_item_responses ON public.ados2_item_responses USING ((EXISTS ( SELECT 1
   FROM public.ados2_evaluations
  WHERE ((ados2_evaluations.id = ados2_item_responses.evaluation_id) AND (ados2_evaluations.therapist_id = auth.uid())))));


--
-- Name: patients therapist_own_patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_patients ON public.patients USING ((therapist_id = auth.uid()));


--
-- Name: ai_usage_quotas therapist_own_quota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_quota ON public.ai_usage_quotas USING ((auth.uid() = therapist_id));


--
-- Name: therapist_invite_quotas therapist_own_quota; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_own_quota ON public.therapist_invite_quotas USING ((auth.uid() = therapist_id));


--
-- Name: therapist_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_access_grants therapist_sees_own_grants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_sees_own_grants ON public.patient_access_grants FOR SELECT USING (((granted_to = auth.uid()) AND (is_active = true)));


--
-- Name: clinical_access_log therapist_sees_related_log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_sees_related_log ON public.clinical_access_log FOR SELECT USING ((accessed_by = auth.uid()));


--
-- Name: therapist_details therapist_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_select_own ON public.therapist_details FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: appointments therapist_select_own_appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_select_own_appointments ON public.appointments FOR SELECT TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: patients therapist_select_own_patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_select_own_patients ON public.patients FOR SELECT TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: therapist_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_services ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_services therapist_services_select_own_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_services_select_own_active ON public.therapist_services FOR SELECT TO authenticated USING (((therapist_id = auth.uid()) AND (is_active = true)));


--
-- Name: therapist_specialties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapist_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: therapist_details therapist_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_update_own ON public.therapist_details FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: appointments therapist_update_own_appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_update_own_appointments ON public.appointments FOR UPDATE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: patients therapist_update_own_patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapist_update_own_patients ON public.patients FOR UPDATE TO authenticated USING ((auth.uid() = therapist_id));


--
-- Name: therapists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments therapists can create appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "therapists can create appointments" ON public.appointments FOR INSERT WITH CHECK ((auth.uid() = therapist_id));


--
-- Name: appointments therapists can update appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "therapists can update appointments" ON public.appointments FOR UPDATE USING ((auth.uid() = therapist_id));


--
-- Name: clinical_history therapists_insert_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_insert_own_clinical_history ON public.clinical_history FOR INSERT TO authenticated WITH CHECK (((therapist_id = auth.uid()) AND (patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
-- Name: clinical_history therapists_update_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_update_own_clinical_history ON public.clinical_history FOR UPDATE TO authenticated USING ((therapist_id = auth.uid())) WITH CHECK (((therapist_id = auth.uid()) AND (patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
-- Name: clinical_history therapists_view_own_clinical_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_view_own_clinical_history ON public.clinical_history FOR SELECT USING ((therapist_id = auth.uid()));


--
-- Name: profiles therapists_view_patient_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_view_patient_profiles ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.patients
  WHERE ((patients.profile_id = profiles.id) AND (patients.therapist_id = auth.uid())))));


--
-- Name: clinical_history therapists_view_shared_patient_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_view_shared_patient_history ON public.clinical_history FOR SELECT USING ((patient_id IN ( SELECT patients.id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid()))));


--
-- Name: clinical_history therapists_view_shared_patient_history_metadata; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY therapists_view_shared_patient_history_metadata ON public.clinical_history FOR SELECT USING (((therapist_id = auth.uid()) OR (patient_id IN ( SELECT DISTINCT clinical_history.patient_id
   FROM public.patients
  WHERE (patients.therapist_id = auth.uid())))));


--
-- Name: treatment_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: user_addons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_addons ENABLE ROW LEVEL SECURITY;

--
-- Name: user_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_favorite_phrases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_favorite_phrases ENABLE ROW LEVEL SECURITY;

--
-- Name: user_notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: support_tickets users_create_tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_create_tickets ON public.support_tickets FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: support_tickets users_own_tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_tickets ON public.support_tickets FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions users_own_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_transactions ON public.wallet_transactions USING ((wallet_id IN ( SELECT wallets.id
   FROM public.wallets
  WHERE (wallets.user_id = auth.uid()))));


--
-- Name: wallets users_own_wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_wallet ON public.wallets USING ((user_id = auth.uid()));


--
-- Name: withdrawal_requests users_own_withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_withdrawals ON public.withdrawal_requests USING ((user_id = auth.uid()));


--
-- Name: support_tickets users_update_own_tickets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_update_own_tickets ON public.support_tickets FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: wallet_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawal_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: word_searches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.word_searches ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict rXk1dtvAX1yRJVk5SQuxzk9sHS6VaRQRYobc7cV4QoJqG3WGig01nIcPWXZPeMg

