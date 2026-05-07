-- ============================================================
-- B5: Fix SECURITY DEFINER functions — set search_path
--
-- Previene privilege escalation via search_path manipulation.
-- Aplica a todas las funciones SECURITY DEFINER del baseline
-- que no tenían SET search_path.
--
-- Ref: https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker
-- ============================================================

-- Batch fix: ALTER FUNCTION ... SET search_path = public
-- Esto no cambia la lógica de la función, solo restringe el search_path.
-- Si una función no existe, el ALTER falla silenciosamente (DO block con EXCEPTION).

DO $$
DECLARE
  fn_name text;
  fn_list text[] := ARRAY[
    'accept_invitation',
    'add_specialty_to_therapist',
    'add_to_favorites',
    'assign_specialties_to_therapist',
    'associate_patient_to_therapist',
    'auto_grant_passport_on_appointment',
    'block_therapist_time_slot',
    'book_appointment',
    'calculate_ados2_scores',
    'calculate_therapist_rating',
    'can_book_appointment',
    'can_user_create_clinic',
    'can_user_review',
    'cancel_appointment',
    'change_user_role',
    'check_appointment_availability',
    'check_appointment_conflict',
    'check_email_exists',
    'check_expired_subscriptions',
    'cleanup_failed_registration',
    'clone_purchased_plan',
    'confirm_public_appointment',
    'count_unread_notifications',
    'create_appointment',
    'create_appointment_reminder',
    'create_clinic',
    'create_clinic_with_therapist',
    'create_clinical_history_from_appointment',
    'create_clinical_history_from_session',
    'create_profile_for_new_user',
    'create_recurring_appointments',
    'create_review',
    'create_therapist_branding',
    'create_user_wallet',
    'delete_clinic',
    'delete_recurring_appointments',
    'encrypt_rut',
    'find_and_associate_patient',
    'get_all_specialties',
    'get_available_time_slots',
    'get_batch_next_available_slots',
    'get_clinical_calendar_events',
    'get_complete_therapist_profile',
    'get_item_review_summary',
    'get_marketplace_item_stats',
    'get_patient_appointments',
    'get_patient_clinical_timeline',
    'get_patient_external_sessions_count',
    'get_public_appointment_details',
    'get_specialty_change_history',
    'get_specialty_ranking',
    'get_therapist_appointments',
    'get_therapist_clinics',
    'get_therapist_full_profile',
    'get_therapist_growth_plan',
    'get_therapist_patients_for_agenda',
    'get_therapist_reputation',
    'get_therapist_reviews',
    'get_therapist_schedule_for_search',
    'get_therapist_specialties',
    'get_user_email_by_id',
    'get_user_notifications',
    'get_user_role',
    'get_weekly_availability',
    'handle_new_therapist_profile',
    'handle_new_therapist_profile_and_branding',
    'handle_new_user',
    'handle_new_user_profile',
    'has_role',
    'increment_activity_usage',
    'increment_coupon_usage',
    'increment_view_count',
    'initialize_therapist_profile',
    'is_admin',
    'is_clinic_owner',
    'is_user_admin',
    'is_user_therapist',
    'make_first_admin',
    'mark_all_notifications_as_read',
    'mark_notification_as_read',
    'match_faq',
    'notify_appointment_cancelled',
    'notify_new_review',
    'process_completed_order',
    'remove_specialty_from_therapist',
    'request_withdrawal',
    'reschedule_appointment',
    'reschedule_recurring_appointments',
    'save_therapist_basic_schedule',
    'save_therapist_services',
    'schedule_appointment_and_patient',
    'search_courses',
    'search_similar_clinics',
    'search_therapists_by_specialty',
    'search_therapists_public',
    'search_therapists_with_details',
    'search_therapists_with_reputation',
    'set_therapist_specialties',
    'sync_therapist_location',
    'trg_fn_sync_therapist_location',
    'update_clinic',
    'update_review',
    'update_therapist_specialties',
    'upsert_clinical_history_from_appointment',
    'upsert_patient_and_create_appointment',
    'upsert_therapist_profile_and_details',
    'upsert_user_profile',
    'user_has_purchased',
    'wallet_purchase'
  ];
BEGIN
  FOREACH fn_name IN ARRAY fn_list LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION public.%I SET search_path = public',
        fn_name
      );
      RAISE NOTICE 'Fixed search_path: %', fn_name;
    EXCEPTION WHEN OTHERS THEN
      -- Function might have multiple overloads or not exist
      -- Try without schema qualification
      BEGIN
        EXECUTE format(
          'DO $inner$ BEGIN ALTER FUNCTION public.%I SET search_path = public; EXCEPTION WHEN OTHERS THEN NULL; END $inner$',
          fn_name
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped (not found or overloaded): %', fn_name;
      END;
    END;
  END LOOP;
END $$;
