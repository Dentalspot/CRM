-- Add foreign keys so PostgREST can resolve joins to patients
ALTER TABLE tecal_evaluations
  ADD CONSTRAINT tecal_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  ADD CONSTRAINT tecal_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);

ALTER TABLE stsg_evaluations
  ADD CONSTRAINT stsg_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  ADD CONSTRAINT stsg_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);

ALTER TABLE teprosif_evaluations
  ADD CONSTRAINT teprosif_evaluations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  ADD CONSTRAINT teprosif_evaluations_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES auth.users(id);
