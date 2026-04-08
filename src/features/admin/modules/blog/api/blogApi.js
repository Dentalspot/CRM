
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

/**
 * Columnas REALES de la tabla blog_posts en Supabase.
 * Los nombres del formulario (description, featured_image, category_id)
 * se mapean a los nombres de DB (excerpt, cover_url, specialty_id).
 */
const DB_COLUMNS = [
  'title', 'subtitle', 'content', 'content_html', 'content_md',
  'slug', 'status', 'excerpt', 'cover_url', 'author_id', 'author_name',
  'category', 'question_id', 'published_at',
  'faq', 'meta_title', 'meta_description', 'keywords', 'shareable_quote',
];

/**
 * Form field → DB column mapping
 */
const FIELD_MAP = {
  description: 'excerpt',
  featured_image: 'cover_url',
  category_id: 'category',
};

/**
 * Sanitiza y mapea datos del formulario a columnas reales de blog_posts.
 * 1. Remapea campos del form a nombres de DB
 * 2. Filtra solo columnas válidas
 * 3. Elimina PKs, timestamps y joins
 * 4. Genera slug si está vacío
 */
const sanitizePostData = (formData) => {
  const clean = {};

  // Remap form fields → DB columns
  for (const [formKey, dbKey] of Object.entries(FIELD_MAP)) {
    if (formData[formKey] !== undefined) {
      clean[dbKey] = formData[formKey];
    }
  }

  // Copy valid DB columns directly (sin pisar los ya mapeados)
  for (const key of DB_COLUMNS) {
    if (formData[key] !== undefined && clean[key] === undefined) {
      clean[key] = formData[key];
    }
  }

  // Never send PKs, timestamps, join objects
  delete clean.id;
  delete clean.created_at;
  delete clean.updated_at;

  // Slug nunca vacío → evita 409 Conflict por unique constraint
  if (!clean.slug || clean.slug.trim() === '') {
    const titleSlug = (formData.title || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    clean.slug = titleSlug || `post-${Date.now()}`;
  }

  return clean;
};

export const blogApi = {
  // --- Posts ---
  fetchPosts: apiHandler('fetchPosts', async ({ page = 0, limit = 10, status, search }) => {
    // Note: blog_posts does not have a relation to blog_categories in the schema.
    let query = supabase
      .from('blog_posts')
      .select('*, author:profiles(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  }, { data: [], count: 0 }),

  fetchPostById: apiHandler('fetchPostById', async (id) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, author:profiles!blog_posts_author_id_fkey(full_name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    // Map DB columns to form field names
    return {
      ...data,
      description: data.excerpt,
      featured_image: data.cover_url,
      category_id: data.specialty_id,
    };
  }, null),

  createPost: apiHandler.mutation('createPost', async (postData) => {
    const clean = sanitizePostData(postData);
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(clean)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  updatePost: apiHandler.mutation('updatePost', async (id, updates) => {
    const clean = sanitizePostData(updates);
    clean.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('blog_posts')
      .update(clean)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  deletePost: apiHandler.mutation('deletePost', async (id) => {
    const { error } = await supabase
      .from('blog_posts')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    return true;
  }),

  publishPost: apiHandler.mutation('publishPost', async (id) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  archivePost: apiHandler.mutation('archivePost', async (id) => {
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  // --- Categories ---
  fetchCategories: apiHandler('fetchCategories', async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*, post_count:blog_posts(count)')
      .order('name');
    if (error) throw error;
    return data;
  }, []),

  createCategory: apiHandler.mutation('createCategory', async (categoryData) => {
    const { data, error } = await supabase
      .from('blog_categories')
      .insert(categoryData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  updateCategory: apiHandler.mutation('updateCategory', async (id, updates) => {
    const { data, error } = await supabase
      .from('blog_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }),

  deleteCategory: apiHandler.mutation('deleteCategory', async (id) => {
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }),

  // --- Analytics & Storage ---
  fetchPostAnalytics: apiHandler('fetchPostAnalytics', async (id) => {
    const { data, error } = await supabase
      .from('blog_analytics')
      .select('views, comments_count, shares_count')
      .eq('post_id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data || { views: 0, comments_count: 0, shares_count: 0 };
  }, { views: 0, comments_count: 0, shares_count: 0 }),

  uploadImage: apiHandler.mutation('uploadImage', async (file) => {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    return publicUrl;
  })
};
