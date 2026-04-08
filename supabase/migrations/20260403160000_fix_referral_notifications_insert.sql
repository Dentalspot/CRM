-- Fix: Allow therapists to insert notifications for their patients
-- Currently there is NO INSERT policy on notifications, so createReferral's
-- notification insert silently fails due to RLS.

-- Therapists can create notifications for patients they are associated with
CREATE POLICY "therapists_insert_patient_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  -- Therapist's own patients (via patients.therapist_id)
  user_id IN (
    SELECT p.profile_id
    FROM patients p
    WHERE p.therapist_id = auth.uid()
      AND p.profile_id IS NOT NULL
  )
  OR
  -- Patients who granted access via patient_access_grants
  user_id IN (
    SELECT pag.profile_id
    FROM patient_access_grants pag
    WHERE pag.granted_to = auth.uid()
      AND pag.is_active = true
  )
);
