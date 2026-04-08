-- =============================================================================
-- MIGRATION: Consolidar tablas duplicadas
-- Fecha: 2026-04-01
-- Descripcion: Elimina tablas duplicadas vacias y migra datos de blocked_slots
--
-- NOTA: therapist_commissions y support_incidents NO se eliminan porque
-- tienen schemas distintos a commissions y support_tickets respectivamente.
-- Son tablas complementarias, no duplicadas.
--
-- NOTA: membership_plans NO se elimina porque DirectoryPage.jsx la usa
-- como FK join desde subscriptions. Se debe migrar el codigo primero.
--
-- blog_articles: el codigo fue migrado a usar blog_posts en blogApi.js
-- =============================================================================

-- =============================================================================
-- PASO 1: Migrar datos de blocked_slots (3 rows) → blocked_times
-- blocked_slots: id, therapist_id, start_datetime, end_datetime, reason, created_at
-- blocked_times: id, therapist_id, start_time, end_time, reason, created_at, clinic_id
-- =============================================================================

INSERT INTO blocked_times (id, therapist_id, start_time, end_time, reason, created_at)
SELECT id, therapist_id, start_datetime, end_datetime, reason, created_at
FROM blocked_slots
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PASO 2: DROP tablas duplicadas VACIAS (0 rows)
-- =============================================================================

-- Blog: blog_posts es la tabla activa (6 rows, 9 files)
-- Codigo migrado de blog_articles → blog_posts en blogApi.js
DROP TABLE IF EXISTS blog_articles CASCADE;

-- Appointments: appointments es la tabla activa (31 rows, 48 files)
DROP TABLE IF EXISTS therapist_appointments CASCADE;

-- Calendar: blocked_times es la tabla activa (15 rows, 6 files)
DROP TABLE IF EXISTS calendar_blocks CASCADE;

-- Sales: sales es la tabla activa (17 files de uso)
DROP TABLE IF EXISTS product_sales CASCADE;

-- Patient plans: patient_assigned_plans es la activa (11 rows, 11 files)
-- patient_plan_assignments solo tiene un TODO en codigo, nunca se ejecuta
DROP TABLE IF EXISTS patient_plan_assignments CASCADE;
DROP TABLE IF EXISTS assigned_plan_activities CASCADE;

-- Sessions: plan_sessions es la activa (88 rows, 9 files)
DROP TABLE IF EXISTS therapy_sessions CASCADE;
DROP TABLE IF EXISTS session_logs CASCADE;

-- Q&A: patient_questions es la activa (4 rows, 11 files)
DROP TABLE IF EXISTS qa_questions CASCADE;
DROP TABLE IF EXISTS qa_answers CASCADE;
DROP TABLE IF EXISTS qa_categories CASCADE;

-- =============================================================================
-- PASO 3: DROP tablas duplicadas con datos migrados o sin data util
-- =============================================================================

-- blocked_slots: 3 rows migrados a blocked_times en paso 1
DROP TABLE IF EXISTS blocked_slots CASCADE;

-- therapist_profiles: solo 2 rows con id+timestamps, sin columnas de data
-- therapist_details es la tabla real (67 rows, 32 files)
DROP TABLE IF EXISTS therapist_profiles CASCADE;

-- =============================================================================
-- RESUMEN: 12 tablas eliminadas
-- blog_articles, therapist_appointments, calendar_blocks, product_sales,
-- patient_plan_assignments, assigned_plan_activities,
-- therapy_sessions, session_logs,
-- qa_questions, qa_answers, qa_categories,
-- blocked_slots, therapist_profiles
--
-- NO ELIMINADAS (son tablas complementarias, no duplicadas):
-- - therapist_commissions (schema distinto a commissions)
-- - support_incidents (schema distinto a support_tickets)
-- - membership_plans (FK activa desde subscriptions.plan_id)
-- =============================================================================
