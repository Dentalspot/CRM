export const DentalSpot_PRODUCT_FIELDS = [
  { key: 'skip', label: '⊘ No importar', required: false },
  { key: 'title', label: 'Nombre del producto', required: true },
  { key: 'description', label: 'Descripción', required: false },
  { key: 'price', label: 'Precio (CLP)', required: true },
  { key: 'item_type', label: 'Tipo (material/template/plan/course)', required: false },
  { key: 'category', label: 'Categoría', required: false },
  { key: 'slug', label: 'Slug / URL', required: false },
  { key: 'target_age_min', label: 'Edad mínima', required: false },
  { key: 'target_age_max', label: 'Edad máxima', required: false },
  { key: 'duration_weeks', label: 'Duración (semanas)', required: false },
  { key: 'total_sessions', label: 'Total sesiones', required: false },
  { key: 'language', label: 'Idioma', required: false },
  { key: 'author_credentials', label: 'Credenciales del autor', required: false },
  { key: 'image_url', label: 'URL de imagen', required: false },
  { key: 'sample_pdf_url', label: 'URL PDF muestra', required: false },
];

export const WOOCOMMERCE_AUTO_MAP = {
  'name': 'title', 'nombre': 'title', 'title': 'title', 'product name': 'title', 'nombre del producto': 'title', 'post_title': 'title',
  'description': 'description', 'descripción': 'description', 'short description': 'description', 'descripcion': 'description', 'post_excerpt': 'description',
  'regular price': 'price', 'price': 'price', 'precio': 'price', 'sale price': 'price', 'precio regular': 'price', 'regular_price': 'price',
  'categories': 'category', 'category': 'category', 'categoría': 'category', 'categorias': 'category', 'tipo': 'category',
  'type': 'item_type', 'tipo producto': 'item_type', 'item_type': 'item_type',
  'slug': 'slug', 'url': 'slug', 'permalink': 'slug', 'post_name': 'slug',
  'images': 'image_url', 'image': 'image_url', 'imagen': 'image_url', 'thumbnail': 'image_url', 'featured image': 'image_url',
  'edad minima': 'target_age_min', 'edad mínima': 'target_age_min', 'min age': 'target_age_min',
  'edad maxima': 'target_age_max', 'edad máxima': 'target_age_max', 'max age': 'target_age_max',
  'idioma': 'language', 'language': 'language',
  'duracion': 'duration_weeks', 'duración': 'duration_weeks', 'duration': 'duration_weeks',
  'sesiones': 'total_sessions', 'sessions': 'total_sessions',
  'autor': 'author_credentials', 'author': 'author_credentials', 'credenciales': 'author_credentials',
  'pdf': 'sample_pdf_url', 'muestra': 'sample_pdf_url', 'sample': 'sample_pdf_url',
};

export const SOURCE_HINTS = {
  WooCommerce: '→ En WordPress, ve a Productos → Exportar → selecciona todos los campos → descarga CSV.',
  Shopify: '→ En Shopify, ve a Productos → Exportar → CSV con todos los productos.',
  'Excel propio': '→ Asegúrate de tener al menos columnas de nombre y precio.',
  Otro: '→ Cualquier CSV o Excel con datos de productos funciona.',
};

export const ITEM_TYPES = ['material', 'template', 'plan', 'course'];

export const TEMPLATE_CSV = 'nombre,precio,descripcion,categoria,tipo,edad minima,edad maxima,idioma\nGuía articulación /r/,9990,Material para trabajar el fonema /r/ en sesión,Articulación,material,4,8,Español\nPlan TEL expresivo 12 semanas,29990,Plan terapéutico completo para TEL expresivo,Lenguaje,plan,3,6,Español\n';