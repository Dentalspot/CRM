/**
 * Script para actualizar productos del marketplace con precios de WooCommerce
 * y subir fotos desde ~/Downloads/marketplace/
 *
 * Uso: node tools/update-marketplace-products.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://ungjizupgostxkemilob.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZ2ppenVwZ29zdHhrZW1pbG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzI0ODgsImV4cCI6MjA2MjI0ODQ4OH0.SFAQwxrEFdQw_lrNz8Q4mYz1LzcyU0fgvPaLecK4alA'
);

const MARKETPLACE_IMAGES = '/Users/danissaklagges/Downloads/marketplace';

// Precios de WooCommerce (tienda.comunicare.cl)
const WOOCOMMERCE_PRICES = {
  'Tabla De Equilibrio Profesional Wobble Terapia Sensoria': 29990,
  'Juegos de Descanso ADOS-2  Original': 99990,
  'Juegos de Descanso ADOS-2 Original': 99990,
  'Camión de bomberos + Miniaturas ADOS-2': 39990,
  'Fiesta de Cumpleaños ADOS-2': 19990,
  'Mantita de bebé 2 Unidades': 9990,
  'Pelota de tamaño Mediano': 9990,
  'Muñeca párpados móviles Bañera Simple': 29990,
  'Muñeca párpados móviles Bañera Shower': 29990,
  'Juego Libre Bolsa 1 Original': 79990,
  'Familia de Muñecos Original': 39990,
  'Figuras de Acción-Juego Simbólico Alternativos': 39990,
  'Figuras de Acción-Juego Simbólico Original': 69990,
  'Imitación Funcional y simbólica Original': 39990,
  'Bolso de Juguete Original': 49990,
  'ADOS-2 Kit Grafico': 99000,
  'Cinturón de Herramientas Original': 49990,
  'Tarea Demostración ADOS-2': 19990,
  'Conejo Control Remoto': 14990,
  'Juguete Musical': 14990,
  'Juguete Pop-Up Original': 19990,
  'Jack in the Box- Test ADOS-2': 19990,
  'Inventarse una Historia-Miniaturas ADOS-2': 29990,
  'Fonendoscopio COLORES - Naranjo': 14990,
  'Fonendoscopio COLORES - Rojo': 14990,
  'Batería Juguetes para Instituciones': 990000,
  'ARK\'s Grabber Kit + Manual ®': 39990,
  'ARK\'s Z-Vibe 6 puntas + Manual': 69990,
  'Instrumentos Musicales Terapia Fonológica': 29990,
  'Adaptador CIC': 5000,
  'Jeringa Toma Molde Auditivo': 5000,
  'Tubos molde Audífonos': 5000,
  'Adptación de Audifonos  ': 10000,
  'laminas': 5000,
  'laminas /s/': 5000,
};

// Mapeo de producto → carpeta de fotos
const PRODUCT_IMAGE_MAP = {
  'Instrumentos Musicales Terapia Fonológica': 'INSTRUMENTOS',
  'Tabla De Equilibrio Profesional Wobble Terapia Sensoria': 'TANGRAMA',
  'Juegos de Descanso ADOS-2  Original': 'TEST ADOS-2 PRODUCTOS',
  'Juegos de Descanso ADOS-2 Original': 'TEST ADOS-2 PRODUCTOS',
  'Camión de bomberos + Miniaturas ADOS-2': 'TEST ADOS-2 PRODUCTOS',
  'Fiesta de Cumpleaños ADOS-2': 'TEST ADOS-2 PRODUCTOS',
  'Mantita de bebé 2 Unidades': 'BABY SIGNS',
  'Pelota de tamaño Mediano': 'TEST ADOS-2 PRODUCTOS',
  'Muñeca párpados móviles Bañera Simple': 'TEST ADOS-2 PRODUCTOS',
  'Muñeca párpados móviles Bañera Shower': 'TEST ADOS-2 PRODUCTOS',
  'Juego Libre Bolsa 1 Original': 'TEST ADOS-2 PRODUCTOS',
  'Familia de Muñecos Original': 'TEST ADOS-2 PRODUCTOS',
  'Figuras de Acción-Juego Simbólico Alternativos': 'TEST ADOS-2 PRODUCTOS',
  'Figuras de Acción-Juego Simbólico Original': 'TEST ADOS-2 PRODUCTOS',
  'Imitación Funcional y simbólica Original': 'TEST ADOS-2 PRODUCTOS',
  'Bolso de Juguete Original': 'TEST ADOS-2 PRODUCTOS',
  'ADOS-2 Kit Grafico': 'TEST ADOS-2 PRODUCTOS',
  'Cinturón de Herramientas Original': 'TEST ADOS-2 PRODUCTOS',
  'Tarea Demostración ADOS-2': 'TEST ADOS-2 PRODUCTOS',
  'Conejo Control Remoto': 'TEST ADOS-2 PRODUCTOS',
  'Juguete Musical': 'TEST ADOS-2 PRODUCTOS',
  'Juguete Pop-Up Original': 'TEST ADOS-2 PRODUCTOS',
  'Jack in the Box- Test ADOS-2': 'TEST ADOS-2 PRODUCTOS',
  'Inventarse una Historia-Miniaturas ADOS-2': 'TEST ADOS-2 PRODUCTOS',
  'Fonendoscopio COLORES - Naranjo': 'FOTOS LAP',
  'Fonendoscopio COLORES - Rojo': 'FOTOS LAP',
  'Batería Juguetes para Instituciones': 'TEST ADOS-2 PRODUCTOS',
  'ARK\'s Grabber Kit + Manual ®': 'INSTRUMENTOS',
  'ARK\'s Z-Vibe 6 puntas + Manual': 'INSTRUMENTOS',
  'Adaptador CIC': 'FOTOS LAP',
  'Jeringa Toma Molde Auditivo': 'FOTOS LAP',
  'Tubos molde Audífonos': 'FOTOS LAP',
};

function getContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.jp2': 'image/jp2',
  };
  return types[ext.toLowerCase()] || 'image/jpeg';
}

async function uploadImage(filePath, productId) {
  const ext = path.extname(filePath);
  const fileName = `products/${productId}/main${ext}`;
  const fileBuffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from('marketplace')
    .upload(fileName, fileBuffer, {
      contentType: getContentType(ext),
      upsert: true,
    });

  if (error) {
    console.error(`  ❌ Upload error for ${filePath}:`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function main() {
  console.log('📦 Fetching marketplace products...\n');

  const { data: products, error } = await supabase
    .from('marketplace_items')
    .select('id, title, price, description, gallery_urls')
    .eq('is_active', true)
    .order('title');

  if (error) { console.error('Error:', error); return; }

  console.log(`Found ${products.length} active products\n`);

  let updatedCount = 0;

  for (const product of products) {
    const updates = {};
    let changed = false;

    // 1. Update price from WooCommerce
    const wooPrice = WOOCOMMERCE_PRICES[product.title];
    if (wooPrice && product.price !== wooPrice) {
      updates.price = wooPrice;
      changed = true;
    }

    // 2. Upload first image from matching folder
    const imageFolder = PRODUCT_IMAGE_MAP[product.title];
    if (imageFolder && (!product.gallery_urls || product.gallery_urls.length === 0)) {
      const folderPath = path.join(MARKETPLACE_IMAGES, imageFolder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath)
          .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
          .sort();

        if (files.length > 0) {
          console.log(`📸 Uploading image for "${product.title}" from ${imageFolder}/${files[0]}`);
          const imageUrl = await uploadImage(path.join(folderPath, files[0]), product.id);
          if (imageUrl) {
            // Upload up to 4 gallery images
            const galleryUrls = [imageUrl];
            for (let i = 1; i < Math.min(files.length, 4); i++) {
              const galExt = path.extname(files[i]);
              const galName = `products/${product.id}/gallery-${i}${galExt}`;
              const galBuf = fs.readFileSync(path.join(folderPath, files[i]));
              const { error: galErr } = await supabase.storage.from('marketplace').upload(galName, galBuf, {
                contentType: getContentType(galExt), upsert: true
              });
              if (!galErr) {
                const { data: galUrl } = supabase.storage.from('marketplace').getPublicUrl(galName);
                galleryUrls.push(galUrl.publicUrl);
              }
            }
            updates.gallery_urls = galleryUrls;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('marketplace_items')
        .update(updates)
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Error updating "${product.title}":`, updateError.message);
      } else {
        console.log(`  ✅ Updated "${product.title}" — price: $${updates.price || product.price}, images: ${(updates.gallery_urls || []).length}`);
        updatedCount++;
      }
    }
  }

  console.log(`\n🎉 Done! Updated ${updatedCount}/${products.length} products.`);
}

main().catch(console.error);
