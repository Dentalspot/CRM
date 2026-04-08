-- Seed TAR (Test de Articulación a la Repetición) as marketplace template
-- Free ($0) evaluation protocol for speech-language pathologists

DO $$
DECLARE
  v_admin_id uuid;
  v_template_id uuid := gen_random_uuid();
  v_item_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'marketplace@fonokit.cl' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Admin user marketplace@fonokit.cl not found, skipping seed';
    RETURN;
  END IF;

  -- ============================================
  -- TAR — Test de Articulación a la Repetición
  -- ============================================
  INSERT INTO patient_document_templates (id, therapist_id, name, category, content, is_global, variables, created_at, updated_at)
  VALUES (
    v_template_id,
    v_admin_id,
    'TAR — Test de Articulación a la Repetición',
    'evaluacion',
    'Test de Articulación a la Repetición. Evalúa la producción de fonemas del español en posición inicial, medial, final y trabante mediante repetición de palabras.',
    true,
    '{
      "fields": [
        {"id": "header_datos", "type": "header", "label": "Datos del Paciente"},
        {"id": "nombre", "type": "text", "label": "Nombre", "required": true, "placeholder": "Nombre completo"},
        {"id": "fecha_nacimiento", "type": "date", "label": "Fecha de Nacimiento", "required": true},
        {"id": "edad", "type": "text", "label": "Edad", "required": true},
        {"id": "fecha_evaluacion", "type": "date", "label": "Fecha de Evaluación", "required": true},

        {"id": "header_bilabiales", "type": "header", "label": "BILABIALES"},

        {"id": "info_b", "type": "info", "content": "/b/"},
        {"id": "b_ini_bote", "type": "loglp", "label": "bote (inicial)", "inline": true},
        {"id": "b_ini_bala", "type": "loglp", "label": "bala (inicial)", "inline": true},
        {"id": "b_med_cabeza", "type": "loglp", "label": "cabeza (medial)", "inline": true},
        {"id": "b_med_tabaco", "type": "loglp", "label": "tabaco (medial)", "inline": true},
        {"id": "b_fin_nube", "type": "loglp", "label": "nube (final)", "inline": true},
        {"id": "b_fin_tubo", "type": "loglp", "label": "tubo (final)", "inline": true},
        {"id": "b_tra_objeto", "type": "loglp", "label": "objeto (trabante)", "inline": true},
        {"id": "b_tra_submarino", "type": "loglp", "label": "submarino (trabante)", "inline": true},

        {"id": "info_p", "type": "info", "content": "/p/"},
        {"id": "p_ini_pato", "type": "loglp", "label": "pato (inicial)", "inline": true},
        {"id": "p_ini_pesa", "type": "loglp", "label": "pesa (inicial)", "inline": true},
        {"id": "p_med_zapato", "type": "loglp", "label": "zapato (medial)", "inline": true},
        {"id": "p_med_tapado", "type": "loglp", "label": "tapado (medial)", "inline": true},
        {"id": "p_fin_copa", "type": "loglp", "label": "copa (final)", "inline": true},
        {"id": "p_fin_sopa", "type": "loglp", "label": "sopa (final)", "inline": true},
        {"id": "p_tra_apto", "type": "loglp", "label": "apto (trabante)", "inline": true},
        {"id": "p_tra_septimo", "type": "loglp", "label": "séptimo (trabante)", "inline": true},

        {"id": "info_m", "type": "info", "content": "/m/"},
        {"id": "m_ini_mano", "type": "loglp", "label": "mano (inicial)", "inline": true},
        {"id": "m_ini_mesa", "type": "loglp", "label": "mesa (inicial)", "inline": true},
        {"id": "m_med_camisa", "type": "loglp", "label": "camisa (medial)", "inline": true},
        {"id": "m_med_camote", "type": "loglp", "label": "camote (medial)", "inline": true},
        {"id": "m_fin_suma", "type": "loglp", "label": "suma (final)", "inline": true},
        {"id": "m_fin_lomo", "type": "loglp", "label": "lomo (final)", "inline": true},
        {"id": "m_tra_campo", "type": "loglp", "label": "campo (trabante)", "inline": true},
        {"id": "m_tra_temprano", "type": "loglp", "label": "temprano (trabante)", "inline": true},

        {"id": "header_labiodentales", "type": "header", "label": "LABIODENTALES"},

        {"id": "info_f", "type": "info", "content": "/f/"},
        {"id": "f_ini_foca", "type": "loglp", "label": "foca (inicial)", "inline": true},
        {"id": "f_ini_fino", "type": "loglp", "label": "fino (inicial)", "inline": true},
        {"id": "f_med_bufalo", "type": "loglp", "label": "búfalo (medial)", "inline": true},
        {"id": "f_med_zafiro", "type": "loglp", "label": "zafiro (medial)", "inline": true},
        {"id": "f_fin_cafe", "type": "loglp", "label": "café (final)", "inline": true},
        {"id": "f_fin_mofa", "type": "loglp", "label": "mofa (final)", "inline": true},
        {"id": "f_tra_aftosa", "type": "loglp", "label": "aftosa (trabante)", "inline": true},
        {"id": "f_tra_difteria", "type": "loglp", "label": "difteria (trabante)", "inline": true},

        {"id": "header_postdentales", "type": "header", "label": "POSTDENTALES"},

        {"id": "info_d", "type": "info", "content": "/d/"},
        {"id": "d_ini_dama", "type": "loglp", "label": "dama (inicial)", "inline": true},
        {"id": "d_ini_dato", "type": "loglp", "label": "dato (inicial)", "inline": true},
        {"id": "d_med_cadena", "type": "loglp", "label": "cadena (medial)", "inline": true},
        {"id": "d_med_madera", "type": "loglp", "label": "madera (medial)", "inline": true},
        {"id": "d_fin_codo", "type": "loglp", "label": "codo (final)", "inline": true},
        {"id": "d_fin_nudo", "type": "loglp", "label": "nudo (final)", "inline": true},
        {"id": "d_tra_pared", "type": "loglp", "label": "pared (trabante)", "inline": true},
        {"id": "d_tra_admite", "type": "loglp", "label": "admite (trabante)", "inline": true},

        {"id": "info_t", "type": "info", "content": "/t/"},
        {"id": "t_ini_tapa", "type": "loglp", "label": "tapa (inicial)", "inline": true},
        {"id": "t_ini_tina", "type": "loglp", "label": "tina (inicial)", "inline": true},
        {"id": "t_med_botella", "type": "loglp", "label": "botella (medial)", "inline": true},
        {"id": "t_med_tetera", "type": "loglp", "label": "tetera (medial)", "inline": true},
        {"id": "t_fin_mata", "type": "loglp", "label": "mata (final)", "inline": true},
        {"id": "t_fin_lote", "type": "loglp", "label": "lote (final)", "inline": true},
        {"id": "t_tra_etna", "type": "loglp", "label": "etna (trabante)", "inline": true},
        {"id": "t_tra_istmo", "type": "loglp", "label": "istmo (trabante)", "inline": true},

        {"id": "header_alveolares", "type": "header", "label": "ALVEOLARES"},

        {"id": "info_s", "type": "info", "content": "/s/"},
        {"id": "s_ini_sapo", "type": "loglp", "label": "sapo (inicial)", "inline": true},
        {"id": "s_ini_sala", "type": "loglp", "label": "sala (inicial)", "inline": true},
        {"id": "s_med_cocina", "type": "loglp", "label": "cocina (medial)", "inline": true},
        {"id": "s_med_pesado", "type": "loglp", "label": "pesado (medial)", "inline": true},
        {"id": "s_fin_tasa", "type": "loglp", "label": "tasa (final)", "inline": true},
        {"id": "s_fin_peso", "type": "loglp", "label": "peso (final)", "inline": true},
        {"id": "s_tra_pasto", "type": "loglp", "label": "pasto (trabante)", "inline": true},
        {"id": "s_tra_pasta", "type": "loglp", "label": "pasta (trabante)", "inline": true},

        {"id": "info_n", "type": "info", "content": "/n/"},
        {"id": "n_ini_nido", "type": "loglp", "label": "nido (inicial)", "inline": true},
        {"id": "n_ini_nota", "type": "loglp", "label": "nota (inicial)", "inline": true},
        {"id": "n_med_panera", "type": "loglp", "label": "panera (medial)", "inline": true},
        {"id": "n_med_canoso", "type": "loglp", "label": "canoso (medial)", "inline": true},
        {"id": "n_fin_mani", "type": "loglp", "label": "maní (final)", "inline": true},
        {"id": "n_fin_mono", "type": "loglp", "label": "mono (final)", "inline": true},
        {"id": "n_tra_canto", "type": "loglp", "label": "canto (trabante)", "inline": true},
        {"id": "n_tra_punta", "type": "loglp", "label": "punta (trabante)", "inline": true},

        {"id": "info_l", "type": "info", "content": "/l/"},
        {"id": "l_ini_luna", "type": "loglp", "label": "luna (inicial)", "inline": true},
        {"id": "l_ini_losa", "type": "loglp", "label": "losa (inicial)", "inline": true},
        {"id": "l_med_caluga", "type": "loglp", "label": "caluga (medial)", "inline": true},
        {"id": "l_med_pelota", "type": "loglp", "label": "pelota (medial)", "inline": true},
        {"id": "l_fin_pala", "type": "loglp", "label": "pala (final)", "inline": true},
        {"id": "l_fin_tela", "type": "loglp", "label": "tela (final)", "inline": true},
        {"id": "l_tra_dulce", "type": "loglp", "label": "dulce (trabante)", "inline": true},
        {"id": "l_tra_papel", "type": "loglp", "label": "papel (trabante)", "inline": true},

        {"id": "info_r_suave", "type": "info", "content": "/r/ (suave)"},
        {"id": "r_med_marino", "type": "loglp", "label": "marino (medial)", "inline": true},
        {"id": "r_med_poroto", "type": "loglp", "label": "poroto (medial)", "inline": true},
        {"id": "r_fin_pera", "type": "loglp", "label": "pera (final)", "inline": true},
        {"id": "r_fin_coro", "type": "loglp", "label": "coro (final)", "inline": true},
        {"id": "r_tra_corto", "type": "loglp", "label": "corto (trabante)", "inline": true},
        {"id": "r_tra_torta", "type": "loglp", "label": "torta (trabante)", "inline": true},

        {"id": "info_rr", "type": "info", "content": "/rr/ (vibrante múltiple)"},
        {"id": "rr_ini_rosa", "type": "loglp", "label": "rosa (inicial)", "inline": true},
        {"id": "rr_ini_remo", "type": "loglp", "label": "remo (inicial)", "inline": true},
        {"id": "rr_med_carreta", "type": "loglp", "label": "carreta (medial)", "inline": true},
        {"id": "rr_med_parrilla", "type": "loglp", "label": "parrilla (medial)", "inline": true},
        {"id": "rr_fin_perro", "type": "loglp", "label": "perro (final)", "inline": true},
        {"id": "rr_fin_tarro", "type": "loglp", "label": "tarro (final)", "inline": true},

        {"id": "header_palatales", "type": "header", "label": "PALATALES"},

        {"id": "info_y", "type": "info", "content": "/y/ - /ll/"},
        {"id": "y_ini_llave", "type": "loglp", "label": "llave (inicial)", "inline": true},
        {"id": "y_ini_yema", "type": "loglp", "label": "yema (inicial)", "inline": true},
        {"id": "y_med_payaso", "type": "loglp", "label": "payaso (medial)", "inline": true},
        {"id": "y_med_tallado", "type": "loglp", "label": "tallado (medial)", "inline": true},
        {"id": "y_fin_malla", "type": "loglp", "label": "malla (final)", "inline": true},
        {"id": "y_fin_pollo", "type": "loglp", "label": "pollo (final)", "inline": true},

        {"id": "info_ni", "type": "info", "content": "/ñ/"},
        {"id": "ni_ini_nato", "type": "loglp", "label": "ñato (inicial)", "inline": true},
        {"id": "ni_ini_noqui", "type": "loglp", "label": "ñoqui (inicial)", "inline": true},
        {"id": "ni_med_punete", "type": "loglp", "label": "puñete (medial)", "inline": true},
        {"id": "ni_med_muneca", "type": "loglp", "label": "muñeca (medial)", "inline": true},
        {"id": "ni_fin_cana", "type": "loglp", "label": "caña (final)", "inline": true},
        {"id": "ni_fin_mono2", "type": "loglp", "label": "moño (final)", "inline": true},

        {"id": "info_ch", "type": "info", "content": "/ch/"},
        {"id": "ch_ini_chala", "type": "loglp", "label": "chala (inicial)", "inline": true},
        {"id": "ch_ini_chino", "type": "loglp", "label": "chino (inicial)", "inline": true},
        {"id": "ch_med_lechuga", "type": "loglp", "label": "lechuga (medial)", "inline": true},
        {"id": "ch_med_cachorro", "type": "loglp", "label": "cachorro (medial)", "inline": true},
        {"id": "ch_fin_noche", "type": "loglp", "label": "noche (final)", "inline": true},
        {"id": "ch_fin_ficha", "type": "loglp", "label": "ficha (final)", "inline": true},

        {"id": "header_velares", "type": "header", "label": "VELARES"},

        {"id": "info_k", "type": "info", "content": "/k/"},
        {"id": "k_ini_casa", "type": "loglp", "label": "casa (inicial)", "inline": true},
        {"id": "k_ini_queso", "type": "loglp", "label": "queso (inicial)", "inline": true},
        {"id": "k_med_paquete", "type": "loglp", "label": "paquete (medial)", "inline": true},
        {"id": "k_med_maquina", "type": "loglp", "label": "máquina (medial)", "inline": true},
        {"id": "k_fin_taco", "type": "loglp", "label": "taco (final)", "inline": true},
        {"id": "k_fin_peca", "type": "loglp", "label": "peca (final)", "inline": true},
        {"id": "k_tra_acto", "type": "loglp", "label": "acto (trabante)", "inline": true},
        {"id": "k_tra_secta", "type": "loglp", "label": "secta (trabante)", "inline": true},

        {"id": "info_g", "type": "info", "content": "/g/"},
        {"id": "g_ini_gato", "type": "loglp", "label": "gato (inicial)", "inline": true},
        {"id": "g_ini_goma", "type": "loglp", "label": "goma (inicial)", "inline": true},
        {"id": "g_med_laguna", "type": "loglp", "label": "laguna (medial)", "inline": true},
        {"id": "g_med_pegado", "type": "loglp", "label": "pegado (medial)", "inline": true},
        {"id": "g_fin_jugo", "type": "loglp", "label": "jugo (final)", "inline": true},
        {"id": "g_fin_soga", "type": "loglp", "label": "soga (final)", "inline": true},
        {"id": "g_tra_signo", "type": "loglp", "label": "signo (trabante)", "inline": true},
        {"id": "g_tra_magno", "type": "loglp", "label": "magno (trabante)", "inline": true},

        {"id": "info_x", "type": "info", "content": "/x/ (j)"},
        {"id": "x_ini_jose", "type": "loglp", "label": "José (inicial)", "inline": true},
        {"id": "x_ini_gitano", "type": "loglp", "label": "gitano (inicial)", "inline": true},
        {"id": "x_med_tejido", "type": "loglp", "label": "tejido (medial)", "inline": true},
        {"id": "x_med_mojado", "type": "loglp", "label": "mojado (medial)", "inline": true},
        {"id": "x_fin_caja", "type": "loglp", "label": "caja (final)", "inline": true},
        {"id": "x_fin_teja", "type": "loglp", "label": "teja (final)", "inline": true},
        {"id": "x_tra_reloj", "type": "loglp", "label": "reloj (trabante)", "inline": true},

        {"id": "header_difonos_voc", "type": "header", "label": "DÍFONOS VOCÁLICOS"},
        {"id": "dv_piano", "type": "loglp", "label": "piano", "inline": true},
        {"id": "dv_diario", "type": "loglp", "label": "diario", "inline": true},
        {"id": "dv_violin", "type": "loglp", "label": "violín", "inline": true},
        {"id": "dv_piojo", "type": "loglp", "label": "piojo", "inline": true},
        {"id": "dv_vaina", "type": "loglp", "label": "vaina", "inline": true},
        {"id": "dv_laico", "type": "loglp", "label": "laico", "inline": true},
        {"id": "dv_peumo", "type": "loglp", "label": "peumo", "inline": true},
        {"id": "dv_pie", "type": "loglp", "label": "pie", "inline": true},
        {"id": "dv_tiene", "type": "loglp", "label": "tiene", "inline": true},
        {"id": "dv_nuevo", "type": "loglp", "label": "nuevo", "inline": true},
        {"id": "dv_fuego", "type": "loglp", "label": "fuego", "inline": true},
        {"id": "dv_peineta", "type": "loglp", "label": "peineta", "inline": true},
        {"id": "dv_rey", "type": "loglp", "label": "rey", "inline": true},
        {"id": "dv_reuma", "type": "loglp", "label": "reuma", "inline": true},
        {"id": "dv_ciudad", "type": "loglp", "label": "ciudad", "inline": true},
        {"id": "dv_diuca", "type": "loglp", "label": "diuca", "inline": true},
        {"id": "dv_fui", "type": "loglp", "label": "fui", "inline": true},
        {"id": "dv_ruin", "type": "loglp", "label": "ruin", "inline": true},
        {"id": "dv_boina", "type": "loglp", "label": "boina", "inline": true},
        {"id": "dv_moises", "type": "loglp", "label": "Moisés", "inline": true},
        {"id": "dv_suave", "type": "loglp", "label": "suave", "inline": true},
        {"id": "dv_guata", "type": "loglp", "label": "guata", "inline": true},
        {"id": "dv_cuota", "type": "loglp", "label": "cuota", "inline": true},
        {"id": "dv_fatuo", "type": "loglp", "label": "fatuo", "inline": true},
        {"id": "dv_auto", "type": "loglp", "label": "auto", "inline": true},
        {"id": "dv_pauta", "type": "loglp", "label": "pauta", "inline": true},

        {"id": "header_difonos_cons", "type": "header", "label": "DÍFONOS CONSONÁNTICOS"},
        {"id": "dc_tabla", "type": "loglp", "label": "tabla", "inline": true},
        {"id": "dc_blusa", "type": "loglp", "label": "blusa", "inline": true},
        {"id": "dc_regla", "type": "loglp", "label": "regla", "inline": true},
        {"id": "dc_globo", "type": "loglp", "label": "globo", "inline": true},
        {"id": "dc_grano", "type": "loglp", "label": "grano", "inline": true},
        {"id": "dc_tigre", "type": "loglp", "label": "tigre", "inline": true},
        {"id": "dc_tren", "type": "loglp", "label": "tren", "inline": true},
        {"id": "dc_clavo", "type": "loglp", "label": "clavo", "inline": true},
        {"id": "dc_tecla", "type": "loglp", "label": "tecla", "inline": true},
        {"id": "dc_brazo", "type": "loglp", "label": "brazo", "inline": true},
        {"id": "dc_cabra", "type": "loglp", "label": "cabra", "inline": true},
        {"id": "dc_soplo", "type": "loglp", "label": "soplo", "inline": true},
        {"id": "dc_plato", "type": "loglp", "label": "plato", "inline": true},
        {"id": "dc_potro", "type": "loglp", "label": "potro", "inline": true},
        {"id": "dc_ladra", "type": "loglp", "label": "ladra", "inline": true},
        {"id": "dc_dragon", "type": "loglp", "label": "dragón", "inline": true},
        {"id": "dc_micro", "type": "loglp", "label": "micro", "inline": true},
        {"id": "dc_crema", "type": "loglp", "label": "crema", "inline": true},
        {"id": "dc_premio", "type": "loglp", "label": "premio", "inline": true},
        {"id": "dc_lepra", "type": "loglp", "label": "lepra", "inline": true},
        {"id": "dc_flecha", "type": "loglp", "label": "flecha", "inline": true},
        {"id": "dc_flaco", "type": "loglp", "label": "flaco", "inline": true},
        {"id": "dc_fruta", "type": "loglp", "label": "fruta", "inline": true},
        {"id": "dc_cofre", "type": "loglp", "label": "cofre", "inline": true},
        {"id": "dc_atlas", "type": "loglp", "label": "atlas", "inline": true},
        {"id": "dc_atleta", "type": "loglp", "label": "atleta", "inline": true},

        {"id": "header_polisilabicas", "type": "header", "label": "POLISÍLABAS"},
        {"id": "ps_carabinero", "type": "loglp", "label": "carabinero", "inline": true},
        {"id": "ps_temperatura", "type": "loglp", "label": "temperatura", "inline": true},
        {"id": "ps_panaderia", "type": "loglp", "label": "panadería", "inline": true},
        {"id": "ps_mariposa", "type": "loglp", "label": "mariposa", "inline": true},
        {"id": "ps_caperucita", "type": "loglp", "label": "caperucita", "inline": true},
        {"id": "ps_ametralladora", "type": "loglp", "label": "ametralladora", "inline": true},
        {"id": "ps_submarino", "type": "loglp", "label": "submarino", "inline": true},
        {"id": "ps_refrigerador", "type": "loglp", "label": "refrigerador", "inline": true},
        {"id": "ps_helicoptero", "type": "loglp", "label": "helicóptero", "inline": true},
        {"id": "ps_bicicleta", "type": "loglp", "label": "bicicleta", "inline": true},

        {"id": "header_oraciones", "type": "header", "label": "ORACIONES"},
        {"id": "or_1", "type": "textarea", "label": "El perro salta", "placeholder": "Transcripción fonética"},
        {"id": "or_2", "type": "textarea", "label": "La niña rubia come", "placeholder": "Transcripción fonética"},
        {"id": "or_3", "type": "textarea", "label": "Ana fue al jardín con su gatito", "placeholder": "Transcripción fonética"},
        {"id": "or_4", "type": "textarea", "label": "La guagua lloraba porque tenía hambre", "placeholder": "Transcripción fonética"},
        {"id": "or_5", "type": "textarea", "label": "El mono que estaba dentro de la jaula se comió el maní", "placeholder": "Transcripción fonética"},
        {"id": "or_6", "type": "textarea", "label": "Juanito se metió debajo de la cama para que no lo pillaran", "placeholder": "Transcripción fonética"},

        {"id": "header_obs", "type": "header", "label": "OBSERVACIONES"},
        {"id": "observaciones", "type": "textarea", "label": "Observaciones generales", "placeholder": "Ingrese observaciones sobre la evaluación"}
      ]
    }'::jsonb,
    now(),
    now()
  );

  -- Marketplace item (free)
  INSERT INTO marketplace_items (
    id, seller_id, therapist_plan_template_id, item_type, title, description,
    price, currency, is_active, is_approved, slug, category
  ) VALUES (
    v_item_id,
    v_admin_id,
    v_template_id,
    'evaluation',
    'TAR — Test de Articulación a la Repetición',
    'Test estandarizado para evaluar la articulación de fonemas del español en posición inicial, medial, final y trabante. Incluye bilabiales, labiodentales, postdentales, alveolares, palatales, velares, dífonos vocálicos y consonánticos, polisílabas y oraciones.',
    0,
    'CLP',
    true,
    true,
    'tar-test-articulacion-repeticion',
    'evaluacion'
  );

  RAISE NOTICE 'TAR template seeded successfully';
END $$;
