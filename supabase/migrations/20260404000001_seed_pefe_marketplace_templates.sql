-- Seed PEFE evaluation templates as marketplace items (published by admin marketplace@fonokit.cl)
-- These are free ($0) evaluation protocols for speech-language pathologists

DO $$
DECLARE
  v_admin_id uuid;
  v_template_1_id uuid := gen_random_uuid();
  v_template_2_id uuid := gen_random_uuid();
  v_item_1_id uuid := gen_random_uuid();
  v_item_2_id uuid := gen_random_uuid();
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'marketplace@fonokit.cl' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Admin user marketplace@fonokit.cl not found, skipping seed';
    RETURN;
  END IF;

  -- ============================================
  -- PEFE 4.6 - 5 años
  -- ============================================
  INSERT INTO patient_document_templates (id, therapist_id, name, category, content, is_global, variables, created_at, updated_at)
  VALUES (
    v_template_1_id,
    v_admin_id,
    'PEFE — Evaluación Fonoaudiológica (4 años 6 meses a 5 años)',
    'evaluacion',
    'Pauta de Evaluación Fonoaudiológica para niños de 4.6 a 5 años. Evalúa comprensión y expresión del lenguaje.',
    true,
    '{
      "fields": [
        {"id": "header_datos", "type": "header", "label": "Datos del Paciente"},
        {"id": "nombre", "type": "text", "label": "Nombre", "required": true, "placeholder": "Nombre completo del paciente"},
        {"id": "fecha_nacimiento", "type": "date", "label": "Fecha de Nacimiento", "required": true},
        {"id": "edad", "type": "text", "label": "Edad", "required": true},
        {"id": "fecha_evaluacion", "type": "date", "label": "Fecha de Evaluación", "required": true},
        {"id": "n_ficha", "type": "text", "label": "N° Ficha"},

        {"id": "header_comprension", "type": "header", "label": "1. COMPRENSIÓN"},

        {"id": "header_comp_a", "type": "info", "content": "a) Identificación de objetos por su uso"},
        {"id": "comp_frio", "type": "loglp", "label": "¿Qué usas cuando tienes frío?", "required": true},
        {"id": "comp_planchar", "type": "loglp", "label": "¿Qué se usa para planchar?", "required": true},
        {"id": "comp_escribir", "type": "loglp", "label": "¿Qué se usa para escribir?", "required": true},
        {"id": "comp_borrar", "type": "loglp", "label": "¿Qué se usa para borrar?", "required": true},
        {"id": "comp_hora", "type": "loglp", "label": "¿Qué sirve para ver la hora?", "required": true},

        {"id": "header_comp_b", "type": "info", "content": "b) Comparaciones estéticas"},
        {"id": "comp_bonita", "type": "loglp", "label": "¿Qué muñeca es más bonita?", "required": true},
        {"id": "comp_sucio", "type": "loglp", "label": "¿Cuál vestido está sucio?", "required": true},
        {"id": "comp_viejo", "type": "loglp", "label": "¿Cuál zapato está viejo?", "required": true},
        {"id": "comp_ordenado", "type": "loglp", "label": "¿Cuál niño está ordenado?", "required": true},

        {"id": "header_comp_c", "type": "info", "content": "c) Contestar a preguntas"},
        {"id": "comp_ojos", "type": "loglp", "label": "¿Para qué te sirven los ojos?", "required": true},
        {"id": "comp_orejas", "type": "loglp", "label": "¿Para qué te sirven las orejas?", "required": true},
        {"id": "comp_casa", "type": "loglp", "label": "¿Para qué tenemos casa?", "required": true},
        {"id": "comp_libros", "type": "loglp", "label": "¿Para qué tenemos libros?", "required": true},
        {"id": "comp_edad", "type": "loglp", "label": "¿Tú tienes XX años? (decir más o menos)", "required": true},

        {"id": "header_comp_d", "type": "info", "content": "d) Identificación de colores por su nombre"},
        {"id": "comp_rojo", "type": "loglp", "label": "Muéstrame el rojo", "required": true},
        {"id": "comp_azul", "type": "loglp", "label": "Muéstrame el azul", "required": true},
        {"id": "comp_verde", "type": "loglp", "label": "Muéstrame el verde", "required": true},

        {"id": "header_expresion", "type": "header", "label": "2. EXPRESIÓN"},

        {"id": "header_exp_a", "type": "info", "content": "a) Vocabulario — Nombrar"},
        {"id": "exp_lapiz", "type": "loglp", "label": "Lápiz", "inline": true, "required": true},
        {"id": "exp_avion", "type": "loglp", "label": "Avión", "inline": true, "required": true},
        {"id": "exp_dedos", "type": "loglp", "label": "Dedos", "inline": true, "required": true},
        {"id": "exp_muneca", "type": "loglp", "label": "Muñeca", "inline": true, "required": true},
        {"id": "exp_telefono", "type": "loglp", "label": "Teléfono", "inline": true, "required": true},
        {"id": "exp_pajaro", "type": "loglp", "label": "Pájaro", "inline": true, "required": true},
        {"id": "exp_platano", "type": "loglp", "label": "Plátano", "inline": true, "required": true},
        {"id": "exp_gallina", "type": "loglp", "label": "Gallina", "inline": true, "required": true},
        {"id": "exp_chomba", "type": "loglp", "label": "Chomba", "inline": true, "required": true},
        {"id": "exp_botella", "type": "loglp", "label": "Botella", "inline": true, "required": true},
        {"id": "exp_camisa", "type": "loglp", "label": "Camisa", "inline": true, "required": true},
        {"id": "exp_naranja", "type": "loglp", "label": "Naranja", "inline": true, "required": true},
        {"id": "exp_chaqueta", "type": "loglp", "label": "Chaqueta", "inline": true, "required": true},
        {"id": "exp_tetera", "type": "loglp", "label": "Tetera", "inline": true, "required": true},
        {"id": "exp_calcetin", "type": "loglp", "label": "Calcetín", "inline": true, "required": true},

        {"id": "header_exp_b", "type": "info", "content": "b) Descripción de escenas — El tipo de respuesta más común es la enumeración (al menos 3 objetos nombrados espontáneamente)"},
        {"id": "exp_escena_1", "type": "textarea", "label": "Escena 1", "placeholder": "Descripción del niño..."},
        {"id": "exp_escena_2", "type": "textarea", "label": "Escena 2", "placeholder": "Descripción del niño..."},
        {"id": "exp_escena_3", "type": "textarea", "label": "Escena 3", "placeholder": "Descripción del niño..."},

        {"id": "header_exp_c", "type": "info", "content": "c) Definiciones por uso"},
        {"id": "exp_libro", "type": "loglp", "label": "¿Para qué sirve el libro?", "required": true},
        {"id": "exp_lapices_colores", "type": "loglp", "label": "¿Para qué sirven los lápices de colores?", "required": true},
        {"id": "exp_llave", "type": "loglp", "label": "¿Para qué sirve la llave?", "required": true},
        {"id": "exp_toalla", "type": "loglp", "label": "¿Para qué sirve la toalla?", "required": true},

        {"id": "header_exp_d", "type": "info", "content": "d) Repetición de oraciones"},
        {"id": "exp_rep_1", "type": "loglp", "label": "Mi hermano pilló una mariposa", "required": true},
        {"id": "exp_rep_2", "type": "loglp", "label": "Esos niños van a la escuela en la mañana", "required": true},
        {"id": "exp_rep_3", "type": "loglp", "label": "El papá se levanta temprano para ir a trabajar", "required": true},
        {"id": "exp_rep_4", "type": "loglp", "label": "En la plaza hay flores y plantas muy bonitas", "required": true},

        {"id": "header_obs", "type": "header", "label": "Observaciones y Conclusiones"},
        {"id": "observaciones", "type": "textarea", "label": "Observaciones", "placeholder": "Observaciones clínicas adicionales..."},
        {"id": "conclusiones", "type": "textarea", "label": "Conclusiones", "placeholder": "Conclusiones de la evaluación..."}
      ]
    }'::jsonb,
    now(),
    now()
  );

  -- Marketplace item for PEFE 4.6-5
  INSERT INTO marketplace_items (id, seller_id, therapist_plan_template_id, item_type, title, description, price, currency, is_active, is_approved, slug, category)
  VALUES (
    v_item_1_id,
    v_admin_id,
    v_template_1_id,
    'evaluation',
    'PEFE — Evaluación Fonoaudiológica (4 años 6 meses a 5 años)',
    'Pauta de Evaluación Fonoaudiológica para niños de 4.6 a 5 años. Evalúa comprensión (identificación por uso, comparaciones, preguntas, colores) y expresión (vocabulario, descripción de escenas, definiciones por uso, repetición de oraciones). Protocolo clínico listo para usar en fichas clínicas.',
    0,
    'CLP',
    true,
    true,
    'pefe-evaluacion-4-6-a-5-anos',
    'evaluacion'
  );

  -- ============================================
  -- PEFE 5 - 6.11 años
  -- ============================================
  INSERT INTO patient_document_templates (id, therapist_id, name, category, content, is_global, variables, created_at, updated_at)
  VALUES (
    v_template_2_id,
    v_admin_id,
    'PEFE — Evaluación Fonoaudiológica (5 a 6 años 11 meses)',
    'evaluacion',
    'Pauta de Evaluación Fonoaudiológica para niños de 5 a 6.11 años. Evalúa nivel semántico, morfosintáctico y comprensivo.',
    true,
    '{
      "fields": [
        {"id": "header_datos", "type": "header", "label": "Datos del Paciente"},
        {"id": "nombre", "type": "text", "label": "Nombre", "required": true, "placeholder": "Nombre completo"},
        {"id": "fecha_nacimiento", "type": "date", "label": "Fecha de Nacimiento", "required": true},
        {"id": "edad", "type": "text", "label": "Edad", "required": true},
        {"id": "colegio", "type": "text", "label": "Colegio"},
        {"id": "curso", "type": "text", "label": "Curso"},
        {"id": "fecha_evaluacion", "type": "date", "label": "Fecha de Evaluación", "required": true},

        {"id": "header_semantico", "type": "header", "label": "NIVEL SEMÁNTICO"},

        {"id": "header_sem_1", "type": "info", "content": "1. Evocación Categorial — Nombrar al menos 2"},
        {"id": "sem_animales", "type": "textarea", "label": "Animales", "placeholder": "Nombrar al menos 2...", "required": true},
        {"id": "sem_ropa", "type": "textarea", "label": "Prendas de vestir (ropa)", "placeholder": "Nombrar al menos 2...", "required": true},
        {"id": "sem_frutas", "type": "textarea", "label": "Frutas", "placeholder": "Nombrar al menos 2...", "required": true},
        {"id": "sem_transporte", "type": "textarea", "label": "Medios de Transporte", "placeholder": "Nombrar al menos 2...", "required": true},

        {"id": "header_sem_2", "type": "info", "content": "2. Definiciones — ¿Qué es?"},
        {"id": "sem_chaleco", "type": "text", "label": "Un chaleco", "required": true},
        {"id": "sem_cama", "type": "text", "label": "Una cama", "required": true},
        {"id": "sem_uva", "type": "text", "label": "Una uva", "required": true},
        {"id": "sem_tijera", "type": "text", "label": "Una tijera", "required": true},

        {"id": "header_sem_3", "type": "info", "content": "3. Asociación Auditiva — Completar"},
        {"id": "sem_asoc_cama", "type": "text", "label": "Te sientas en una silla, te duermes en una...", "required": true},
        {"id": "sem_asoc_vidrio", "type": "text", "label": "Las mesas son de madera, las botellas son de...", "required": true},
        {"id": "sem_asoc_duras", "type": "text", "label": "Las almohadas son blandas, las piedras son...", "required": true},
        {"id": "sem_asoc_vuelan", "type": "text", "label": "Las culebras se arrastran, los pájaros...", "required": true},
        {"id": "sem_asoc_ensenan", "type": "text", "label": "Los choferes manejan, los profesores...", "required": true},
        {"id": "sem_asoc_rodillas", "type": "text", "label": "Los brazos tienen codos, las piernas tienen...", "required": true},

        {"id": "header_sem_4", "type": "info", "content": "4. Contenidos — Preguntas de razonamiento"},
        {"id": "sem_dientes", "type": "textarea", "label": "¿Por qué tienes que lavarte los dientes todos los días?", "required": true},
        {"id": "sem_dormir", "type": "textarea", "label": "¿Por qué tienes que acostarte temprano?", "required": true},
        {"id": "sem_comida", "type": "textarea", "label": "¿Por qué tienes que comer toda la comida?", "required": true},

        {"id": "header_morfo", "type": "header", "label": "NIVEL MORFOSINTÁCTICO"},

        {"id": "header_morfo_1", "type": "info", "content": "1. Nivel de Desarrollo — Oración más extensa y completa formulada por el menor"},
        {"id": "morfo_oracion", "type": "textarea", "label": "Oración más extensa", "required": true},

        {"id": "header_morfo_2", "type": "info", "content": "2. Nociones (TECAL)"},
        {"id": "morfo_masc_fem", "type": "loglp", "label": "Masculino / Femenino", "required": true},
        {"id": "morfo_afirm_neg", "type": "loglp", "label": "Afirmativo / Negativo", "required": true},
        {"id": "morfo_sing_plur", "type": "loglp", "label": "Singular / Plural", "required": true},
        {"id": "morfo_pres_fut", "type": "loglp", "label": "Presente / Futuro", "required": true},

        {"id": "header_morfo_3", "type": "info", "content": "3. Completación de Oraciones"},
        {"id": "morfo_comp_1", "type": "text", "label": "Los niños jugaban...", "required": true},
        {"id": "morfo_comp_2", "type": "text", "label": "La señora ... en la cocina", "required": true},
        {"id": "morfo_comp_3", "type": "text", "label": "El papá...", "required": true},
        {"id": "morfo_comp_4", "type": "text", "label": "Ayer...", "required": true},

        {"id": "header_morfo_4", "type": "info", "content": "4. Descripción de Láminas"},
        {"id": "morfo_lamina", "type": "textarea", "label": "Descripción", "placeholder": "Transcribir descripción del niño..."},

        {"id": "header_morfo_5", "type": "info", "content": "5. Relato"},
        {"id": "morfo_relato", "type": "textarea", "label": "Relato del niño", "placeholder": "Transcribir relato..."},

        {"id": "header_comprensivo", "type": "header", "label": "NIVEL COMPRENSIVO"},

        {"id": "header_comp_1", "type": "info", "content": "1. Comprensión de Relato"},
        {"id": "comp_relato", "type": "textarea", "label": "Respuestas del niño", "placeholder": "Registrar respuestas..."},

        {"id": "header_comp_2", "type": "info", "content": "2. Situaciones — ¿Qué harías tú al...?"},
        {"id": "comp_derramar", "type": "text", "label": "Derramar o botar comida", "required": true},
        {"id": "comp_cruzar", "type": "text", "label": "Cruzar la calle repentinamente", "required": true},
        {"id": "comp_dormido", "type": "text", "label": "Quedarse dormido", "required": true},
        {"id": "comp_herida", "type": "text", "label": "Hacerse una herida en una pierna", "required": true},

        {"id": "header_comp_3", "type": "info", "content": "3. Absurdos Verbales"},
        {"id": "comp_absurdo_1", "type": "textarea", "label": "Como llovía mucho, Juan, para no mojarse se metió en el agua", "required": true, "placeholder": "Respuesta del niño..."},
        {"id": "comp_absurdo_2", "type": "textarea", "label": "El elefante era tan grande que lo guardaron en una caja de zapatos", "required": true, "placeholder": "Respuesta del niño..."},
        {"id": "comp_absurdo_3", "type": "textarea", "label": "El hombre fue al médico porque le dolía mucho el pie de su hermana", "required": true, "placeholder": "Respuesta del niño..."},

        {"id": "header_comp_4", "type": "info", "content": "4. Órdenes (TOKEN)"},
        {"id": "comp_token_1", "type": "loglp", "label": "Toca el círculo rojo", "required": true},
        {"id": "comp_token_2", "type": "loglp", "label": "Toca el cuadro azul", "required": true},
        {"id": "comp_token_3", "type": "loglp", "label": "Toca el cuadro verde y el círculo azul", "required": true},
        {"id": "comp_token_4", "type": "loglp", "label": "Toca el cuadro rojo pequeño y el círculo amarillo grande", "required": true},
        {"id": "comp_token_5", "type": "loglp", "label": "Pon el cuadro blanco debajo del círculo amarillo", "required": true},
        {"id": "comp_token_6", "type": "loglp", "label": "Toca los cuadros lentamente y los círculos rápidamente", "required": true},

        {"id": "evaluador", "type": "text", "label": "Nombre Evaluador", "required": true}
      ]
    }'::jsonb,
    now(),
    now()
  );

  -- Marketplace item for PEFE 5-6.11
  INSERT INTO marketplace_items (id, seller_id, therapist_plan_template_id, item_type, title, description, price, currency, is_active, is_approved, slug, category)
  VALUES (
    v_item_2_id,
    v_admin_id,
    v_template_2_id,
    'evaluation',
    'PEFE — Evaluación Fonoaudiológica (5 a 6 años 11 meses)',
    'Pauta de Evaluación Fonoaudiológica para niños de 5 a 6.11 años. Evalúa nivel semántico (evocación categorial, definiciones, asociación auditiva, contenidos), nivel morfosintáctico (nociones TECAL, completación, descripción, relato) y nivel comprensivo (comprensión de relato, situaciones, absurdos verbales, órdenes TOKEN). Protocolo clínico completo listo para usar.',
    0,
    'CLP',
    true,
    true,
    'pefe-evaluacion-5-a-6-11-anos',
    'evaluacion'
  );

  RAISE NOTICE 'Seeded 2 PEFE templates and marketplace items successfully';
END $$;
