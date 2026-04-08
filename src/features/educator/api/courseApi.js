import { supabase } from '@/lib/supabaseClient';

// === INSTRUCTOR FUNCTIONS ===

export const fetchMyCourses = async (instructorId) => {
  const { data, error } = await supabase
    .from('courses')
    .select('*, specialty:specialties(name), enrollments:course_enrollments(count)')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchCourseById = async (courseId) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      specialty:specialties(name, slug),
      instructor:profiles!courses_instructor_id_fkey(full_name, therapist_branding(avatar_url)),
      modules:course_modules(id, title, description, video_url, duration_minutes, sort_order, is_free_preview),
      reviews:course_reviews(id, rating, comment, created_at, reviewer:profiles!course_reviews_reviewer_id_fkey(full_name))
    `)
    .eq('id', courseId)
    .single();
  if (error) throw error;
  return data;
};

export const createCourse = async (courseData) => {
  const slug = courseData.title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    + '-' + Date.now().toString(36);

  const { data, error } = await supabase
    .from('courses')
    .insert({ ...courseData, slug, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCourse = async (courseId, updates) => {
  const { data, error } = await supabase
    .from('courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const submitForReview = async (courseId) => {
  return updateCourse(courseId, { status: 'pending_review' });
};

export const deleteCourse = async (courseId) => {
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
};

// === MODULE FUNCTIONS ===

export const fetchCourseModules = async (courseId) => {
  const { data, error } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
};

export const upsertModule = async (moduleData) => {
  const { data, error } = await supabase
    .from('course_modules')
    .upsert(moduleData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteModule = async (moduleId) => {
  const { error } = await supabase.from('course_modules').delete().eq('id', moduleId);
  if (error) throw error;
};

// === ENROLLMENT FUNCTIONS ===

export const fetchCourseEnrollments = async (courseId) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*, student:profiles!course_enrollments_student_id_fkey(full_name, email)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchMyEnrollments = async (studentId) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*, course:courses(title, slug, cover_image_url, instructor:profiles!courses_instructor_id_fkey(full_name), hours, modality)')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const enrollInCourse = async ({ courseId, studentId, paymentMethod, amountPaid, commissionAmount, sponsoredBy }) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      course_id: courseId,
      student_id: studentId,
      payment_method: paymentMethod,
      payment_status: 'completed',
      amount_paid: amountPaid,
      commission_amount: commissionAmount,
      sponsored_by: sponsoredBy || null,
      status: 'enrolled',
    })
    .select()
    .single();
  if (error) throw error;

  // Update course enrollment count (fallback to manual if RPC not available)
  await supabase.rpc('increment_field', { table_name: 'courses', row_id: courseId, field_name: 'total_enrollments', increment_by: 1 })
    .catch(() => {
      supabase.from('courses').select('total_enrollments').eq('id', courseId).single()
        .then(({ data: course }) => {
          if (course) supabase.from('courses').update({ total_enrollments: (course.total_enrollments || 0) + 1 }).eq('id', courseId);
        });
    });

  return data;
};

export const markCourseCompleted = async (enrollmentId) => {
  const { data, error } = await supabase
    .from('course_enrollments')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// === INSTRUCTOR STATS ===

export const fetchInstructorStats = async (instructorId) => {
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, total_enrollments, rating, price')
    .eq('instructor_id', instructorId)
    .eq('status', 'approved');

  const courseIds = (courses || []).map(c => c.id);

  let totalRevenue = 0;
  let totalStudents = 0;
  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('amount_paid, commission_amount')
      .in('course_id', courseIds)
      .eq('payment_status', 'completed');

    totalRevenue = (enrollments || []).reduce((sum, e) => sum + ((e.amount_paid || 0) - (e.commission_amount || 0)), 0);
    totalStudents = (enrollments || []).length;
  }

  const avgRating = courses?.length > 0
    ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
    : 0;

  return {
    totalCourses: courses?.length || 0,
    totalStudents,
    totalRevenue,
    avgRating,
  };
};

// === PUBLIC CATALOG ===

export const fetchApprovedCourses = async (filters = {}) => {
  let query = supabase
    .from('courses')
    .select(`
      *,
      specialty:specialties(name, slug),
      instructor:profiles!courses_instructor_id_fkey(full_name, therapist_branding(avatar_url))
    `)
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('total_enrollments', { ascending: false });

  if (filters.specialty) query = query.eq('specialty_id', filters.specialty);
  if (filters.modality) query = query.eq('modality', filters.modality);
  if (filters.format) query = query.eq('format', filters.format);
  if (filters.type) query = query.eq('course_type', filters.type);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};
