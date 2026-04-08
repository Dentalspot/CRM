/**
 * Sync WooCommerce CSV export → Fonokit marketplace_items
 * Updates: price, description, image URLs (gallery_urls)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://ungjizupgostxkemilob.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ2ppenVwZ29zdHhrZW1pbG9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY3MjQ4OCwiZXhwIjoyMDYyMjQ4NDg4fQ.7gW6A3frk86o8NyHQ_kuTOdhsvgHXoYkdY_gIU_9Wvw'
);

const CSV_PATH = '/Users/danissaklagges/Downloads/wc-product-export-3-4-2026-1775254610640.csv';

// Simple CSV parser that handles quoted fields with commas and newlines
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = text.split('\n');

  for (const line of lines) {
    if (inQuotes) {
      current += '\n' + line;
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        inQuotes = false;
        rows.push(current);
        current = '';
      }
    } else {
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        inQuotes = true;
        current = line;
      } else {
        rows.push(line);
      }
    }
  }

  // Parse each row into fields
  return rows.map(row => {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQ && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        fields.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  });
}

// Strip HTML tags and clean description
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Normalize title for matching
function normalize(str) {
  return (str || '').toLowerCase().trim()
    .replace(/\s+/g, ' ')
    .replace(/[®™©]/g, '')
    .trim();
}

async function main() {
  console.log('📄 Reading WooCommerce CSV...\n');
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const parsed = parseCSV(csvText);

  const headers = parsed[0];
  const nameIdx = headers.indexOf('Nombre');
  const priceIdx = headers.indexOf('Precio normal');
  const shortDescIdx = headers.indexOf('Descripción corta');
  const descIdx = headers.indexOf('Descripción');
  const imagesIdx = headers.indexOf('Imágenes');
  const typeIdx = headers.indexOf('Tipo');

  console.log(`CSV columns found: Name=${nameIdx}, Price=${priceIdx}, ShortDesc=${shortDescIdx}, Desc=${descIdx}, Images=${imagesIdx}`);

  // Build WooCommerce product map
  const wcProducts = {};
  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (!row || row.length < 5) continue;

    const name = (row[nameIdx] || '').trim();
    const price = parseFloat(row[priceIdx]) || 0;
    const shortDesc = stripHtml(row[shortDescIdx] || '');
    const desc = stripHtml(row[descIdx] || '');
    const images = (row[imagesIdx] || '').split(',').map(u => u.trim()).filter(Boolean);
    const type = row[typeIdx];

    if (name) {
      wcProducts[normalize(name)] = { name, price, shortDesc, desc, images, type };
    }
  }

  console.log(`\n📦 WooCommerce products: ${Object.keys(wcProducts).length}`);

  // Fetch Fonokit products
  const { data: fkProducts, error } = await supabase
    .from('marketplace_items')
    .select('id, title, price, description, gallery_urls')
    .eq('is_active', true)
    .order('title');

  if (error) { console.error('DB Error:', error); return; }
  console.log(`🏪 Fonokit products: ${fkProducts.length}\n`);

  let matched = 0;
  let updated = 0;

  for (const fk of fkProducts) {
    const normTitle = normalize(fk.title);

    // Try exact match, then partial
    let wc = wcProducts[normTitle];
    if (!wc) {
      // Try partial match
      for (const [key, val] of Object.entries(wcProducts)) {
        if (key.includes(normTitle) || normTitle.includes(key)) {
          wc = val;
          break;
        }
      }
    }

    if (!wc) {
      console.log(`  ⚪ No match: "${fk.title}"`);
      continue;
    }

    matched++;
    const updates = {};
    let changes = [];

    // Update price if WC has one and FK doesn't (or is 0)
    if (wc.price > 0 && (fk.price === 0 || fk.price === null)) {
      updates.price = wc.price;
      changes.push(`price: $${wc.price.toLocaleString('es-CL')}`);
    }

    // Update description if FK has none
    const bestDesc = wc.shortDesc || wc.desc;
    if (bestDesc && (!fk.description || fk.description.length < 20)) {
      // Use short desc, or first 500 chars of long desc
      updates.description = bestDesc.substring(0, 500);
      changes.push(`desc: ${updates.description.substring(0, 50)}...`);
    }

    // Update images if FK has none
    if (wc.images.length > 0 && (!fk.gallery_urls || fk.gallery_urls.length === 0)) {
      updates.gallery_urls = wc.images;
      changes.push(`images: ${wc.images.length}`);
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: upErr } = await supabase
        .from('marketplace_items')
        .update(updates)
        .eq('id', fk.id);

      if (upErr) {
        console.log(`  ❌ Error "${fk.title}": ${upErr.message}`);
      } else {
        console.log(`  ✅ "${fk.title}" → ${changes.join(' | ')}`);
        updated++;
      }
    } else {
      console.log(`  ✔️  "${fk.title}" (ya actualizado)`);
    }
  }

  console.log(`\n🎉 Done! Matched: ${matched}/${fkProducts.length}, Updated: ${updated}`);
}

main().catch(console.error);
