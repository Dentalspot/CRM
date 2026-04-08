-- Fix pie_paci FK: student_id currently references pie_students
-- but the code passes patient_id from the patients table.
-- Drop the old FK and add one to patients instead.
ALTER TABLE pie_paci DROP CONSTRAINT IF EXISTS pie_paci_student_id_fkey;
ALTER TABLE pie_paci ADD CONSTRAINT pie_paci_student_id_fkey FOREIGN KEY (student_id) REFERENCES patients(id);
