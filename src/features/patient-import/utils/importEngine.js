import { supabase } from '@/lib/supabaseClient';

export const importPatients = async ({ validRows, fieldMap, userId, organizationId, onProgress }) => {
  const results = { created: 0, skipped: 0, errors: [] };
  const total = validRows.length;

  for (let i = 0; i < total; i++) {
    const row = validRows[i];
    try {
      const fullName = row[fieldMap.full_name]?.toString().trim();
      if (!fullName) { results.skipped++; continue; }

      const email = row[fieldMap.email]?.toString().trim().toLowerCase() || null;
      const phone = row[fieldMap.phone]?.toString().trim() || null;
      const rut = row[fieldMap.rut]?.toString().trim() || null;

      // Check existing by email or RUT
      let profileId = null;
      if (email) {
        const { data } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
        if (data) profileId = data.id;
      }
      if (!profileId && rut) {
        const { data } = await supabase.from('profiles').select('id').eq('rut', rut).maybeSingle();
        if (data) profileId = data.id;
      }

      // Create profile if not exists
      if (!profileId) {
        const profileEmail = email || `imported-${Date.now()}-${i}@dentalspot.local`;
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({ full_name: fullName, email: profileEmail, phone, rut, role: 'patient' })
          .select('id')
          .single();

        if (profileError) {
          if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
            const { data: found } = await supabase.from('profiles').select('id').eq('email', profileEmail).maybeSingle();
            if (found) profileId = found.id;
            else throw profileError;
          } else throw profileError;
        } else {
          profileId = newProfile.id;
        }
      }

      // Check if patient already linked to this therapist
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', profileId)
        .eq('therapist_id', userId)
        .maybeSingle();

      if (existingPatient) { results.skipped++; onProgress(i + 1, total); continue; }

      // Create patient
      const patientData = {
        therapist_id: userId,
        organization_id: organizationId || null,
        profile_id: profileId,
        status: 'active',
        admission_date: new Date().toISOString().split('T')[0],
      };

      // Map optional fields
      const optionalFields = ['notes', 'diagnosis', 'allergies', 'medical_history', 'patient_type',
        'responsible_name', 'responsible_rut', 'birth_city', 'nationality', 'attention_type', 'communication_channel'];
      
      optionalFields.forEach(f => {
        if (fieldMap[f] && row[fieldMap[f]]) patientData[f] = row[fieldMap[f]].toString();
      });

      const { error: patientError } = await supabase.from('patients').insert(patientData);
      if (patientError) throw patientError;
      results.created++;
    } catch (err) {
      results.errors.push({ row: i + 1, name: row[fieldMap.full_name] || 'Desconocido', error: err.message });
    }
    onProgress(i + 1, total);
  }
  return results;
};