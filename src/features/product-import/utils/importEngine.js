import { supabase } from '@/lib/supabaseClient';

const cleanPrice = (value) => {
  if (!value) return 0;
  const str = value.toString().replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
};

const inferItemType = (category, title) => {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes('plan') || text.includes('programa')) return 'plan';
  if (text.includes('curso') || text.includes('course')) return 'course';
  if (text.includes('template') || text.includes('plantilla')) return 'template';
  return 'material';
};

const slugify = (text) => {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);
};

export const importProducts = async ({ validRows, fieldMap, userId, onProgress }) => {
  const results = { created: 0, skipped: 0, errors: [] };
  const total = validRows.length;

  for (let i = 0; i < total; i++) {
    const row = validRows[i];
    try {
      const title = row[fieldMap.title]?.toString().trim();
      if (!title) { results.skipped++; onProgress(i + 1, total); continue; }

      const price = cleanPrice(row[fieldMap.price]);
      if (price <= 0 && fieldMap.price) { results.skipped++; onProgress(i + 1, total); continue; }

      const description = row[fieldMap.description]?.toString().trim() || null;
      const category = row[fieldMap.category]?.toString().trim() || null;
      const itemType = row[fieldMap.item_type]?.toString().trim().toLowerCase() || inferItemType(category || '', title);
      const slug = row[fieldMap.slug]?.toString().trim() || slugify(title);

      // Check duplicate by title + seller
      const { data: existing } = await supabase
        .from('marketplace_items')
        .select('id')
        .eq('seller_id', userId)
        .ilike('title', title)
        .maybeSingle();

      if (existing) { results.skipped++; onProgress(i + 1, total); continue; }

      const productData = {
        seller_id: userId,
        title,
        description,
        price: price || 0,
        currency: 'CLP',
        item_type: ['material', 'template', 'plan', 'course'].includes(itemType) ? itemType : 'material',
        category,
        slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
        is_active: true,
        is_approved: false, // Pending review
        language: row[fieldMap.language]?.toString().trim() || 'Español',
        author_credentials: row[fieldMap.author_credentials]?.toString().trim() || null,
        sample_pdf_url: row[fieldMap.sample_pdf_url]?.toString().trim() || null,
      };

      // Optional numeric fields
      if (fieldMap.target_age_min && row[fieldMap.target_age_min]) {
        const v = parseInt(row[fieldMap.target_age_min]);
        if (!isNaN(v)) productData.target_age_min = v;
      }
      if (fieldMap.target_age_max && row[fieldMap.target_age_max]) {
        const v = parseInt(row[fieldMap.target_age_max]);
        if (!isNaN(v)) productData.target_age_max = v;
      }
      if (fieldMap.duration_weeks && row[fieldMap.duration_weeks]) {
        const v = parseInt(row[fieldMap.duration_weeks]);
        if (!isNaN(v)) productData.duration_weeks = v;
      }
      if (fieldMap.total_sessions && row[fieldMap.total_sessions]) {
        const v = parseInt(row[fieldMap.total_sessions]);
        if (!isNaN(v)) productData.total_sessions = v;
      }

      const { error } = await supabase.from('marketplace_items').insert(productData);
      if (error) throw error;
      results.created++;
    } catch (err) {
      results.errors.push({
        row: i + 1,
        name: row[fieldMap.title] || 'Sin nombre',
        error: err.message,
      });
    }
    onProgress(i + 1, total);
  }
  return results;
};