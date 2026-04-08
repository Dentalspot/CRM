-- =============================================================================
-- Seed email_templates with funnel-specific marketing templates
-- Each template has professional HTML with Fonokit branding
-- =============================================================================

-- ==================== COLD OUTREACH ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('cold_01_intro', 'marketing',
 'Hola {{nombre}}, descubre Fonokit — la plataforma para fonoaudiólogos',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:24px;">Fonokit</h1>
  <p style="color:#ccfbf1;margin:8px 0 0;font-size:14px;">Gestión clínica inteligente para fonoaudiólogos</p>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Soy Danissa de <strong>Fonokit</strong>. Te escribo porque como fonoaudiólogo/a en {{ciudad}}, podrías beneficiarte de una herramienta diseñada específicamente para nuestra profesión.</p>
  <p>Fonokit te permite:</p>
  <ul style="line-height:1.8;">
    <li>Gestionar pacientes y sesiones en un solo lugar</li>
    <li>Aplicar evaluaciones clínicas digitales (ADOS-2, ADI-R, Perfil Sensorial)</li>
    <li>Generar informes profesionales con asistencia de IA</li>
  </ul>
  <p>Miles de fonoaudiólogos en Chile ya lo usan. ¿Te gustaría probarlo?</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Crear cuenta gratis</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">Sin tarjeta de crédito. Cancela cuando quieras.</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Hola {{nombre}}, descubre Fonokit para gestionar tu consulta fonoaudiológica. Crea tu cuenta gratis en fonokit.cl',
 '{"nombre": "Nombre del lead", "ciudad": "Ciudad del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('cold_02_valor', 'marketing',
 '{{nombre}}, ¿sabías que puedes generar informes clínicos en minutos?',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Ahorra horas cada semana</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Te escribí hace unos días sobre Fonokit. Hoy quiero mostrarte lo que más valoran nuestros usuarios:</p>
  <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;">
    <h3 style="margin:0 0 12px;color:#0d9488;">Lo que más les gusta:</h3>
    <p style="margin:4px 0;">✅ <strong>Notiz:</strong> Transcribe sesiones automáticamente con IA</p>
    <p style="margin:4px 0;">✅ <strong>Evaluaciones digitales:</strong> ADOS-2, ADI-R, Perfil Sensorial listos para usar</p>
    <p style="margin:4px 0;">✅ <strong>Informes automáticos:</strong> De 2 horas a 10 minutos</p>
    <p style="margin:4px 0;">✅ <strong>Evidencia científica:</strong> Busca artículos de PubMed con resumen en español</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar gratis ahora</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Hola {{nombre}}, genera informes clínicos en minutos con Fonokit. Pruébalo gratis.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('cold_03_demo', 'marketing',
 'Última invitación: prueba Fonokit gratis, {{nombre}}',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">No te quedes fuera</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Este es mi último email sobre Fonokit. No quiero ser insistente, pero creo genuinamente que esta herramienta puede ayudarte en tu práctica diaria.</p>
  <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:20px 0;">
    <p style="margin:0;font-weight:bold;">¿Qué dicen nuestros usuarios?</p>
    <p style="margin:8px 0 0;font-style:italic;color:#92400e;">"Fonokit me ahorra al menos 5 horas semanales en informes y evaluaciones."</p>
  </div>
  <p>Si tienes dudas, agenda una demo personalizada conmigo:</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Crear mi cuenta</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">O responde este email y coordinamos una llamada. Saludos, Danissa.</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Última invitación para probar Fonokit gratis. Crea tu cuenta en fonokit.cl',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== ADOS-2 FUNNEL ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('ados2_01_info', 'marketing',
 '{{nombre}}, aplica el ADOS-2 digital en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">ADOS-2 Digital en Fonokit</h1>
  <p style="color:#ddd6fe;margin:8px 0 0;font-size:14px;">Evaluación del espectro autista simplificada</p>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>¿Aplicas el ADOS-2 en tu práctica? Sabemos lo complejo que es administrar esta evaluación manualmente.</p>
  <p>En Fonokit hemos digitalizado el proceso completo:</p>
  <ul style="line-height:1.8;">
    <li><strong>5 módulos</strong> disponibles (T, 1, 2, 3 y 4)</li>
    <li>Registro de códigos por ítem con descripciones guía</li>
    <li>Cálculo automático de totales SA, CRR y SA+CRR</li>
    <li>Comparación con puntos de corte actualizados</li>
    <li>Informe profesional generado automáticamente</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar ADOS-2 digital</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Aplica el ADOS-2 de forma digital con Fonokit. Cálculo automático y generación de informes.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('ados2_02_caso', 'marketing',
 'Cómo aplicar el ADOS-2 en 30 minutos con Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Caso de uso: ADOS-2</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Te cuento cómo funciona el ADOS-2 en Fonokit paso a paso:</p>
  <div style="background:#f5f3ff;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;"><strong>1.</strong> Selecciona el módulo adecuado para tu paciente</p>
    <p style="margin:4px 0;"><strong>2.</strong> Registra los códigos de cada ítem durante la observación</p>
    <p style="margin:4px 0;"><strong>3.</strong> El sistema calcula automáticamente SA, CRR y totales</p>
    <p style="margin:4px 0;"><strong>4.</strong> Compara con puntos de corte y obtén la clasificación</p>
    <p style="margin:4px 0;"><strong>5.</strong> Genera el informe profesional con un clic</p>
  </div>
  <p>Todo queda guardado en la ficha del paciente para seguimiento longitudinal.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Empezar ahora</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Aprende a aplicar el ADOS-2 digital en 30 minutos con Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('ados2_03_oferta', 'marketing',
 '{{nombre}}, accede al módulo ADOS-2 completo — oferta especial',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Oferta exclusiva ADOS-2</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Como parte de nuestro lanzamiento del módulo TEA completo, te ofrecemos acceso anticipado:</p>
  <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:14px;margin:0;color:#6d28d9;">Acceso completo al módulo TEA</p>
    <p style="font-size:28px;font-weight:bold;color:#7c3aed;margin:8px 0;">ADOS-2 + ADI-R + Perfil Sensorial</p>
    <p style="margin:0;color:#6b7280;">Incluye generación automática de informes</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Activar acceso</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Oferta exclusiva: accede al módulo ADOS-2 + ADI-R + Perfil Sensorial en Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== ADI-R FUNNEL ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('adir_01_info', 'marketing',
 '{{nombre}}, el ADI-R digital ya está disponible en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">ADI-R Digital</h1>
  <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Entrevista diagnóstica de autismo digitalizada</p>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>El ADI-R (Autism Diagnostic Interview-Revised) es fundamental para el diagnóstico de TEA. En Fonokit lo hemos digitalizado completamente:</p>
  <ul style="line-height:1.8;">
    <li>93 ítems organizados por dominio (A, B, C, D)</li>
    <li>Codificación guiada con descripciones por código</li>
    <li>Cálculo automático de algoritmos diagnósticos</li>
    <li>Comparación con puntos de corte estándar</li>
    <li>Informe clínico profesional auto-generado</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar ADI-R digital</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'El ADI-R digital ya está en Fonokit. 93 ítems, cálculo automático e informes.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('adir_02_caso', 'marketing',
 'ADI-R + ADOS-2: evaluación TEA completa en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Evaluación TEA integral</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>La mejor práctica para diagnosticar TEA combina ADI-R + ADOS-2. En Fonokit puedes hacer ambas evaluaciones y el Perfil Sensorial desde una sola plataforma:</p>
  <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;">🔵 <strong>ADI-R:</strong> Entrevista estructurada con padres/cuidadores</p>
    <p style="margin:4px 0;">🟣 <strong>ADOS-2:</strong> Observación directa del paciente</p>
    <p style="margin:4px 0;">🟢 <strong>Perfil Sensorial:</strong> Procesamiento sensorial del paciente</p>
  </div>
  <p>Los tres instrumentos se integran en un <strong>Dashboard TEA</strong> que muestra la visión completa del caso.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Ver Dashboard TEA</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Combina ADI-R + ADOS-2 + Perfil Sensorial en Fonokit para evaluaciones TEA completas.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('adir_03_oferta', 'marketing',
 '{{nombre}}, accede al módulo TEA completo en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Módulo TEA completo</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Este es tu último recordatorio: el módulo TEA de Fonokit incluye todo lo que necesitas para evaluaciones de espectro autista.</p>
  <div style="background:#eff6ff;border:2px solid #2563eb;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:24px;font-weight:bold;color:#2563eb;margin:0;">ADI-R + ADOS-2 + Perfil Sensorial</p>
    <p style="margin:8px 0 0;color:#6b7280;">Dashboard integrado + Informes automáticos</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#2563eb;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Crear cuenta y acceder</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Accede al módulo TEA completo: ADI-R + ADOS-2 + Perfil Sensorial en Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== TEA GENERAL ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('tea_01_modulo', 'marketing',
 '{{nombre}}, evalúa TEA de forma integral con Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#059669,#047857);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Módulo TEA en Fonokit</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Si trabajas con pacientes en el espectro autista, Fonokit tiene un módulo especializado que integra las principales herramientas de evaluación:</p>
  <ul style="line-height:1.8;">
    <li><strong>Dashboard TEA:</strong> Visión global de cada caso</li>
    <li><strong>ADOS-2:</strong> Observación estructurada (5 módulos)</li>
    <li><strong>ADI-R:</strong> Entrevista diagnóstica digital</li>
    <li><strong>Perfil Sensorial:</strong> Procesamiento sensorial completo</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#059669;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Explorar módulo TEA</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Evalúa TEA con ADOS-2, ADI-R y Perfil Sensorial en Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('tea_02_evaluaciones', 'marketing',
 'Automatiza tus evaluaciones TEA — informes en minutos',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#059669,#047857);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Informes TEA automáticos</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>¿Cuánto tiempo te toma escribir un informe de evaluación TEA? Con Fonokit, el informe se genera automáticamente a partir de los datos que registras:</p>
  <div style="background:#ecfdf5;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;">⏱️ <strong>Antes:</strong> 2-3 horas por informe</p>
    <p style="margin:4px 0;">⚡ <strong>Con Fonokit:</strong> 10 minutos de revisión</p>
  </div>
  <p>El sistema incluye interpretación clínica, gráficos y recomendaciones basadas en los resultados.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#059669;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar ahora</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Genera informes TEA automáticos con Fonokit. De 2 horas a 10 minutos.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('tea_03_plataforma', 'marketing',
 '{{nombre}}, únete a la comunidad de fonoaudiólogos en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#059669,#047857);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Más que una herramienta</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Fonokit es más que evaluaciones TEA. Es una plataforma completa para tu práctica profesional:</p>
  <ul style="line-height:1.8;">
    <li>Gestión de pacientes y calendario</li>
    <li>Búsqueda de evidencia científica (PubMed con IA)</li>
    <li>Asistente virtual clínico</li>
    <li>Tienda de recursos profesionales</li>
    <li>Módulo de educación continua</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#059669;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Crear cuenta gratis</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Fonokit: gestión de pacientes, evaluaciones TEA, evidencia científica y más.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== SENSORIAL ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('sensorial_01_perfil', 'marketing',
 '{{nombre}}, aplica el Perfil Sensorial digital en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Perfil Sensorial Digital</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>El Perfil Sensorial de Dunn es esencial para evaluar el procesamiento sensorial. En Fonokit lo aplicamos de forma digital con resultados instantáneos:</p>
  <ul style="line-height:1.8;">
    <li>Cuestionario digital para padres/cuidadores</li>
    <li>Cálculo automático por cuadrante sensorial</li>
    <li>Gráficos de perfil visual</li>
    <li>Informe clínico auto-generado</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#d97706;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar Perfil Sensorial</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Aplica el Perfil Sensorial de Dunn de forma digital con Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('sensorial_02_resultados', 'marketing',
 'Resultados del Perfil Sensorial: interpretación automática con Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Interpretación inteligente</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Cuando aplicas el Perfil Sensorial en Fonokit, no solo obtienes puntajes. Obtienes:</p>
  <div style="background:#fffbeb;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;">📊 Gráficos por cuadrante (bajo registro, búsqueda, sensibilidad, evitación)</p>
    <p style="margin:4px 0;">🎯 Clasificación automática (mucho menos, menos, típico, más, mucho más)</p>
    <p style="margin:4px 0;">📝 Interpretación clínica narrativa</p>
    <p style="margin:4px 0;">📄 Informe listo para entregar a la familia</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#d97706;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Ver ejemplo de informe</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Obtén interpretación automática del Perfil Sensorial con gráficos e informes en Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('sensorial_03_workflow', 'marketing',
 '{{nombre}}, integra el Perfil Sensorial en tu flujo clínico',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#d97706,#b45309);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Tu flujo clínico optimizado</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Con Fonokit, el Perfil Sensorial se integra directamente con tus otras evaluaciones:</p>
  <div style="background:#fffbeb;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;">1️⃣ Registra al paciente</p>
    <p style="margin:4px 0;">2️⃣ Aplica ADOS-2 durante la sesión</p>
    <p style="margin:4px 0;">3️⃣ Envía el Perfil Sensorial a los padres</p>
    <p style="margin:4px 0;">4️⃣ Revisa todo en el Dashboard TEA</p>
    <p style="margin:4px 0;">5️⃣ Genera el informe integrado</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#d97706;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Empezar gratis</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Integra el Perfil Sensorial con ADOS-2 y ADI-R en un solo flujo con Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== COMMUNICARE LEGACY ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('communicare_01_reactivacion', 'marketing',
 '{{nombre}}, tu experiencia en Communicare ahora es mejor en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">De Communicare a Fonokit</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Sabemos que usaste Communicare para gestionar tu consulta. <strong>Fonokit es la evolución</strong> de esa plataforma, con todo lo que necesitas y mucho más:</p>
  <ul style="line-height:1.8;">
    <li>Todo lo de Communicare + evaluaciones clínicas digitales</li>
    <li>Inteligencia artificial para informes y notas</li>
    <li>Búsqueda de evidencia científica integrada</li>
    <li>Módulo TEA completo (ADOS-2, ADI-R, Perfil Sensorial)</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Migrar a Fonokit gratis</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Migra de Communicare a Fonokit gratis. Todo lo que tenías y mucho más.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('communicare_02_novedades', 'marketing',
 'Lo nuevo en Fonokit que no existía en Communicare',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Nuevas funcionalidades</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Fonokit ha evolucionado mucho desde Communicare. Estas son las funcionalidades nuevas que más valoran nuestros usuarios:</p>
  <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:8px 0;">🤖 <strong>Notiz:</strong> Transcripción de sesiones con IA</p>
    <p style="margin:8px 0;">🧠 <strong>Módulo TEA:</strong> ADOS-2 + ADI-R + Perfil Sensorial</p>
    <p style="margin:8px 0;">🔬 <strong>Evidencia:</strong> Búsqueda PubMed con resumen en español</p>
    <p style="margin:8px 0;">💬 <strong>Asistente:</strong> Chatbot clínico con IA</p>
    <p style="margin:8px 0;">📊 <strong>PIE:</strong> Módulo de evaluación para programas educativos</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Explorar Fonokit</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Descubre las nuevas funcionalidades de Fonokit: IA, módulo TEA, evidencia científica.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('communicare_03_migracion', 'marketing',
 '{{nombre}}, migra tus datos de Communicare a Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Migración fácil y gratis</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Entendemos que cambiar de plataforma puede ser complicado. Por eso te ofrecemos:</p>
  <div style="background:#f0fdf4;border:2px solid #0d9488;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:18px;font-weight:bold;color:#0d9488;margin:0;">Migración asistida gratuita</p>
    <p style="margin:8px 0 0;color:#6b7280;">Te ayudamos a importar tus datos de pacientes</p>
  </div>
  <p>Solo crea tu cuenta y nos contactas. Nosotros nos encargamos del resto.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Crear cuenta y migrar</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">Escríbenos a hola@fonokit.cl para coordinar tu migración.</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Migra tus datos de Communicare a Fonokit gratis. Te ayudamos con todo.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== ESTUDIANTES ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('estudiantes_01_plan', 'marketing',
 '{{nombre}}, Fonokit tiene un plan especial para estudiantes',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#ec4899,#db2777);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Plan Universitario Fonokit</h1>
  <p style="color:#fbcfe8;margin:8px 0 0;font-size:14px;">Herramientas profesionales desde tu formación</p>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Si estás estudiando fonoaudiología, Fonokit tiene un plan especial para ti. Accede a herramientas profesionales mientras te formas:</p>
  <ul style="line-height:1.8;">
    <li>Practica con evaluaciones clínicas reales</li>
    <li>Aprende a generar informes profesionales</li>
    <li>Busca evidencia científica para tus trabajos</li>
    <li>Prepárate para el mundo laboral</li>
  </ul>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#ec4899;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Activar plan universitario</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Fonokit tiene un plan especial para estudiantes de fonoaudiología. Accede gratis.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('estudiantes_02_herramientas', 'marketing',
 'Herramientas de IA para tus prácticas clínicas — Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#ec4899,#db2777);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">IA para tus prácticas</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>¿Estás en prácticas clínicas? Fonokit puede ayudarte con herramientas de IA que tus supervisores van a valorar:</p>
  <div style="background:#fdf2f8;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:8px 0;">🎙️ <strong>Notiz:</strong> Transcribe tus sesiones para revisarlas después</p>
    <p style="margin:8px 0;">📚 <strong>Evidencia:</strong> Busca artículos PubMed para fundamentar tus intervenciones</p>
    <p style="margin:8px 0;">🤖 <strong>Asistente:</strong> Consulta dudas clínicas con IA especializada</p>
    <p style="margin:8px 0;">📝 <strong>Plantillas:</strong> Genera informes con estructura profesional</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#ec4899;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Probar herramientas IA</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Herramientas de IA para tus prácticas clínicas de fonoaudiología en Fonokit.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('estudiantes_03_descuento', 'marketing',
 '{{nombre}}, descuento exclusivo para estudiantes de fonoaudiología',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#ec4899,#db2777);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Descuento estudiantil</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Queremos apoyar tu formación profesional. Por eso, como estudiante tienes acceso a un plan especial:</p>
  <div style="background:#fdf2f8;border:2px solid #ec4899;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:28px;font-weight:bold;color:#ec4899;margin:0;">50% OFF</p>
    <p style="margin:8px 0 0;color:#6b7280;">Plan profesional para estudiantes</p>
  </div>
  <p>Solo necesitas verificar tu correo universitario. ¡Así de fácil!</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/register" style="background:#ec4899;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Activar descuento</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 '50% de descuento en Fonokit para estudiantes de fonoaudiología.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== ONBOARDING ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('onboarding_01_bienvenida', 'marketing',
 '¡Bienvenido/a a Fonokit, {{nombre}}! Tu cuenta está lista',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:24px;">¡Bienvenido/a a Fonokit!</h1>
  <p style="color:#ccfbf1;margin:8px 0 0;font-size:14px;">Tu cuenta está lista para usar</p>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>¡Nos alegra mucho que te hayas unido a Fonokit! Tu cuenta ya está activa y lista para usar.</p>
  <p>En los próximos días te enviaremos tips para que saques el máximo provecho de la plataforma. Por ahora, empieza por:</p>
  <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:4px 0;">1️⃣ Completa tu perfil profesional</p>
    <p style="margin:4px 0;">2️⃣ Agrega tu primer paciente</p>
    <p style="margin:4px 0;">3️⃣ Explora el módulo de evaluaciones</p>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/dashboard" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Ir a mi dashboard</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">¿Dudas? Usa el asistente virtual en tu dashboard o escríbenos a hola@fonokit.cl</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Bienvenido a Fonokit. Tu cuenta está lista. Empieza completando tu perfil.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('onboarding_02_primeros_pasos', 'marketing',
 '{{nombre}}, 3 cosas que puedes hacer hoy en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Primeros pasos</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Llevas un par de días en Fonokit. Aquí van 3 cosas que puedes hacer hoy para empezar a ver resultados:</p>
  <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
    <div style="background:#f0fdf4;padding:16px;border-bottom:1px solid #e5e7eb;">
      <strong>1. Registra un paciente</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Dashboard → Mis Pacientes → Nuevo Paciente</p>
    </div>
    <div style="background:#fff;padding:16px;border-bottom:1px solid #e5e7eb;">
      <strong>2. Prueba Notiz</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Graba una sesión de práctica y ve la transcripción automática</p>
    </div>
    <div style="background:#f0fdf4;padding:16px;">
      <strong>3. Busca evidencia</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Prueba buscar "disfagia infantil" en Evidencia Científica</p>
    </div>
  </div>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/dashboard" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Ir a mi dashboard</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 '3 cosas que puedes hacer hoy en Fonokit: registrar paciente, probar Notiz, buscar evidencia.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('onboarding_03_primera_sesion', 'marketing',
 '{{nombre}}, prepara tu primera sesión clínica con Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Tu primera sesión con Fonokit</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Ya tienes tu cuenta configurada. Ahora es momento de usar Fonokit en tu próxima sesión clínica:</p>
  <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;">
    <p style="margin:8px 0;"><strong>Antes de la sesión:</strong> Revisa la ficha del paciente y evaluaciones previas</p>
    <p style="margin:8px 0;"><strong>Durante la sesión:</strong> Activa Notiz para transcribir automáticamente</p>
    <p style="margin:8px 0;"><strong>Después de la sesión:</strong> Revisa la nota clínica generada y ajústala</p>
  </div>
  <p>Si necesitas aplicar una evaluación (ADOS-2, ADI-R, Perfil Sensorial), todo está listo en tu dashboard.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/dashboard" style="background:#0d9488;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Preparar mi sesión</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">¡Éxito en tu sesión! Si necesitas ayuda, el asistente virtual está disponible 24/7.</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Prepara tu primera sesión clínica con Fonokit. Usa Notiz para transcribir automáticamente.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);

-- ==================== REACTIVACION ====================

INSERT INTO public.email_templates (template_name, notification_type, subject_template, body_html_template, body_text_template, variables)
VALUES
('reactivacion_01_te_extranamos', 'marketing',
 '{{nombre}}, te extrañamos en Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Te extrañamos</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Hace un tiempo que no te vemos en Fonokit. Queremos que sepas que hemos estado mejorando la plataforma:</p>
  <ul style="line-height:1.8;">
    <li>Nuevas evaluaciones clínicas</li>
    <li>Herramientas de IA mejoradas</li>
    <li>Interfaz más rápida y moderna</li>
    <li>Búsqueda de evidencia científica</li>
  </ul>
  <p>¿Te gustaría volver a explorar? Tu cuenta sigue activa.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/dashboard" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Volver a Fonokit</a>
  </div>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 'Te extrañamos en Fonokit. Hemos mejorado la plataforma. Tu cuenta sigue activa.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb),

('reactivacion_02_oferta', 'marketing',
 '{{nombre}}, oferta especial para que vuelvas a Fonokit',
 '<!DOCTYPE html><html><body style="font-family:''Segoe UI'',sans-serif;max-width:600px;margin:0 auto;color:#333;">
<div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
  <h1 style="color:#fff;margin:0;font-size:22px;">Oferta de reactivación</h1>
</div>
<div style="padding:32px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
  <p>Hola <strong>{{nombre}}</strong>,</p>
  <p>Te escribimos por última vez con una oferta especial para que vuelvas:</p>
  <div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
    <p style="font-size:28px;font-weight:bold;color:#f59e0b;margin:0;">30% OFF</p>
    <p style="margin:8px 0 0;color:#6b7280;">En tu próximo mes de plan profesional</p>
  </div>
  <p>Tu cuenta y tus datos siguen intactos. Solo tienes que ingresar.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="https://fonokit.cl/dashboard" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Activar oferta</a>
  </div>
  <p style="color:#6b7280;font-size:13px;">Si ya no deseas recibir nuestros emails, puedes cancelar abajo.</p>
</div>
<div style="padding:16px;text-align:center;color:#9ca3af;font-size:11px;">
  Fonokit · Chile · <a href="{{unsubscribe_url}}" style="color:#9ca3af;">Cancelar suscripción</a>
</div>
</body></html>',
 '30% de descuento para que vuelvas a Fonokit. Tu cuenta sigue activa.',
 '{"nombre": "Nombre del lead", "unsubscribe_url": "URL de cancelación"}'::jsonb);
