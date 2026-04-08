"""
Genera informe PDF de implementación de IA en Fonokit.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from datetime import datetime
import os

# Colors
PRIMARY = HexColor('#6366F1')    # Indigo
SECONDARY = HexColor('#8B5CF6')  # Violet
ACCENT = HexColor('#06B6D4')     # Cyan
DARK = HexColor('#1E1B4B')       # Dark indigo
LIGHT_BG = HexColor('#F8FAFC')
BORDER = HexColor('#E2E8F0')
SUCCESS = HexColor('#10B981')
WARNING = HexColor('#F59E0B')
DANGER = HexColor('#EF4444')
TEXT_DARK = HexColor('#1E293B')
TEXT_MUTED = HexColor('#64748B')

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'Fonokit_AI_Implementation_Report.pdf')


class ColorBar(Flowable):
    def __init__(self, width, height=4, color=PRIMARY):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.color = color

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 2, fill=1, stroke=0)


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'CustomTitle', parent=styles['Title'],
        fontSize=28, textColor=DARK, spaceAfter=6,
        fontName='Helvetica-Bold', alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        'Subtitle', parent=styles['Normal'],
        fontSize=13, textColor=TEXT_MUTED, spaceAfter=20,
        fontName='Helvetica',
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', parent=styles['Heading1'],
        fontSize=18, textColor=PRIMARY, spaceBefore=24, spaceAfter=10,
        fontName='Helvetica-Bold', borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading2'],
        fontSize=13, textColor=DARK, spaceBefore=14, spaceAfter=6,
        fontName='Helvetica-Bold',
    ))
    styles.add(ParagraphStyle(
        'BodyText2', parent=styles['Normal'],
        fontSize=10, textColor=TEXT_DARK, spaceAfter=8,
        fontName='Helvetica', leading=15, alignment=TA_JUSTIFY,
    ))
    styles.add(ParagraphStyle(
        'BulletItem', parent=styles['Normal'],
        fontSize=10, textColor=TEXT_DARK, spaceAfter=4,
        fontName='Helvetica', leading=14, leftIndent=20,
        bulletIndent=8, bulletFontSize=10,
    ))
    styles.add(ParagraphStyle(
        'SmallMuted', parent=styles['Normal'],
        fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9, textColor=white, fontName='Helvetica-Bold',
        alignment=TA_CENTER, leading=12,
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9, textColor=TEXT_DARK, fontName='Helvetica',
        leading=12,
    ))
    styles.add(ParagraphStyle(
        'TableCellCenter', parent=styles['Normal'],
        fontSize=9, textColor=TEXT_DARK, fontName='Helvetica',
        alignment=TA_CENTER, leading=12,
    ))
    styles.add(ParagraphStyle(
        'KPIValue', parent=styles['Normal'],
        fontSize=22, textColor=PRIMARY, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        'KPILabel', parent=styles['Normal'],
        fontSize=9, textColor=TEXT_MUTED, fontName='Helvetica',
        alignment=TA_CENTER,
    ))
    return styles


def make_table(headers, rows, col_widths=None):
    s = build_styles()
    header_row = [Paragraph(h, s['TableHeader']) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), s['TableCell']) if i == 0 else Paragraph(str(c), s['TableCellCenter']) for i, c in enumerate(row)])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def make_kpi_row(kpis):
    s = build_styles()
    cells = []
    for value, label in kpis:
        cells.append([
            Paragraph(str(value), s['KPIValue']),
            Paragraph(label, s['KPILabel']),
        ])

    data = [cells]
    t = Table(data, colWidths=[130] * len(kpis))
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    return t


def build_report():
    doc = SimpleDocTemplate(
        OUTPUT_PATH, pagesize=letter,
        leftMargin=1*inch, rightMargin=1*inch,
        topMargin=0.8*inch, bottomMargin=0.8*inch,
    )
    s = build_styles()
    story = []
    W = doc.width

    # ========== COVER ==========
    story.append(Spacer(1, 1.5*inch))
    story.append(ColorBar(W, 6, PRIMARY))
    story.append(Spacer(1, 20))
    story.append(Paragraph('Informe de Implementacion', s['CustomTitle']))
    story.append(Paragraph('Sistema de Inteligencia Artificial', s['CustomTitle']))
    story.append(Spacer(1, 8))
    story.append(ColorBar(100, 3, ACCENT))
    story.append(Spacer(1, 16))
    story.append(Paragraph('FONOKIT - Plataforma de Fonoaudiologia', s['Subtitle']))
    story.append(Paragraph(f'Fecha: {datetime.now().strftime("%d de %B de %Y")} | Version 1.0', s['Subtitle']))
    story.append(Spacer(1, 40))

    # KPIs cover
    story.append(make_kpi_row([
        ('7', 'Edge Functions'),
        ('6', 'Modelos HF'),
        ('3', 'Tablas Nuevas'),
        ('$0', 'Costo Modelos'),
    ]))

    story.append(PageBreak())

    # ========== INDICE ==========
    story.append(Paragraph('Contenido', s['SectionTitle']))
    story.append(ColorBar(W, 2, BORDER))
    story.append(Spacer(1, 12))
    toc_items = [
        '1. Resumen Ejecutivo',
        '2. Arquitectura del Sistema',
        '3. Modelos de IA Implementados',
        '4. Edge Functions Deployeadas',
        '5. Infraestructura de Base de Datos',
        '6. Admin Dashboard (antes vs despues)',
        '7. Auditoria Tecnica Realizada',
        '8. Meta Pixel y Tracking',
        '9. Deploy Automatico (CI/CD)',
        '10. Proximos Pasos',
    ]
    for item in toc_items:
        story.append(Paragraph(item, s['BodyText2']))
    story.append(PageBreak())

    # ========== 1. RESUMEN EJECUTIVO ==========
    story.append(Paragraph('1. Resumen Ejecutivo', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'Se implemento un sistema completo de inteligencia artificial para la plataforma Fonokit, '
        'utilizando modelos gratuitos de HuggingFace como backbone principal. El sistema incluye '
        '7 Edge Functions deployeadas en Supabase que cubren: sugerencias de tratamiento, '
        'interpretacion de evaluaciones clinicas (ADI-R, ADOS-2, Perfil Sensorial), generacion de '
        'material terapeutico, analisis de progreso del paciente, y recomendaciones de productos del marketplace.',
        s['BodyText2']
    ))
    story.append(Paragraph(
        'Ademas se realizo una auditoria tecnica completa del repositorio que incluyo: '
        'versionamiento del schema de base de datos (186 tablas), habilitacion de Row Level Security '
        'en las 173 tablas activas, consolidacion de 13 tablas duplicadas, centralizacion del logging '
        '(0 console.log en produccion), estandarizacion del error handling, y optimizacion de queries N+1.',
        s['BodyText2']
    ))
    story.append(Spacer(1, 12))
    story.append(make_kpi_row([
        ('173', 'Tablas con RLS'),
        ('431', 'Policies'),
        ('271', 'Archivos con Logger'),
        ('99', 'Funciones apiHandler'),
    ]))
    story.append(PageBreak())

    # ========== 2. ARQUITECTURA ==========
    story.append(Paragraph('2. Arquitectura del Sistema', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'La arquitectura se basa en Edge Functions de Supabase (Deno/TypeScript) que actuan como '
        'gateway entre el frontend React y los modelos de HuggingFace. Un cliente compartido '
        '(_shared/hf-client.ts) centraliza las llamadas a la API de HF con retry automatico '
        'para cold starts y rate limits.',
        s['BodyText2']
    ))

    arch_data = [
        ['Capa', 'Tecnologia', 'Proposito'],
        ['Frontend', 'React + Vite', 'UI del admin y terapeutas'],
        ['API Gateway', 'Supabase Edge Functions', '7 funciones Deno/TypeScript'],
        ['AI Models', 'HuggingFace Inference API', 'Mistral-7B, BART, MiniLM, Whisper'],
        ['Chat AI', 'Anthropic Claude Haiku', 'Chatbot de pacientes'],
        ['Database', 'Supabase PostgreSQL + pgvector', '173 tablas + embeddings vectoriales'],
        ['Shared Client', '_shared/hf-client.ts', 'Retry, fallback, PII stripping'],
    ]
    story.append(Spacer(1, 8))
    story.append(make_table(arch_data[0], arch_data[1:], col_widths=[100, 170, 190]))
    story.append(PageBreak())

    # ========== 3. MODELOS ==========
    story.append(Paragraph('3. Modelos de IA Implementados', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    models = [
        ['Modelo', 'Tipo', 'Uso en Fonokit', 'Costo'],
        ['Mistral-7B-Instruct-v0.3', 'Generacion', 'Tratamientos, evaluaciones, material', 'Gratis'],
        ['BART-Large-CNN', 'Resumen', 'Resumir transcripciones clinicas', 'Gratis'],
        ['BART-Large-MNLI', 'Clasificacion', 'Clasificar tendencias de progreso', 'Gratis'],
        ['MiniLM-L6-v2', 'Embeddings', 'Busqueda semantica marketplace', 'Gratis'],
        ['Whisper-Small', 'Transcripcion', 'Audio a texto en sesiones', 'Gratis'],
        ['Claude Haiku 4.5', 'Chat', 'Chatbot pacientes/terapeutas', '~$0.001/call'],
    ]
    story.append(make_table(models[0], models[1:], col_widths=[130, 75, 200, 55]))
    story.append(Spacer(1, 14))

    story.append(Paragraph('Estrategia de Rate Limits (HF Free Tier)', s['SubSection']))
    bullets = [
        'Header x-wait-for-model: true en todas las requests (espera cold start)',
        'Retry automatico: 3 intentos con backoff 10s / 20s / 30s',
        'Quotas por usuario: 20 calls/dia free, 100 premium (tabla ai_usage_quotas)',
        'Cola async (ai_task_queue) para operaciones bulk no urgentes',
        'Fallback chain: cada feature tiene degradacion graceful',
    ]
    for b in bullets:
        story.append(Paragraph(f'<bullet>&bull;</bullet> {b}', s['BulletItem']))
    story.append(PageBreak())

    # ========== 4. EDGE FUNCTIONS ==========
    story.append(Paragraph('4. Edge Functions Deployeadas', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    funcs = [
        ['Edge Function', 'Modelos', 'Input', 'Output'],
        ['suggest-treatment', 'Mistral-7B', 'Diagnostico + historial', 'Plan de tratamiento JSON'],
        ['evaluate-analysis', 'Mistral-7B', 'Scores ADI-R/ADOS-2/Sensorial', 'Interpretacion clinica'],
        ['generate-material', 'Mistral-7B', 'Diagnostico + tipo + edad', 'Ejercicios terapeuticos'],
        ['analyze-progress', 'BART-MNLI + Mistral', 'Actividades de sesion', 'Reporte de tendencias'],
        ['recommend-purchases', 'MiniLM embeddings', 'Contexto paciente', 'Items marketplace'],
        ['process-notiz', 'Whisper + Claude', 'Audio de sesion', 'Notas clinicas'],
        ['new-meta-capi', 'N/A', 'Eventos browser', 'Tracking server-side'],
    ]
    story.append(make_table(funcs[0], funcs[1:], col_widths=[120, 105, 125, 120]))
    story.append(Spacer(1, 12))

    story.append(Paragraph('Prompt Templates Editables', s['SubSection']))
    story.append(Paragraph(
        'Se crearon 4 prompt templates almacenados en la tabla ai_prompt_templates que son '
        'editables desde el admin dashboard. Cada template usa variables con formato {{variable}} '
        'que se reemplazan dinamicamente con datos del paciente. Los templates cubren: '
        'sugerencias de tratamiento, interpretacion de evaluaciones, generacion de material, '
        'y analisis de progreso.',
        s['BodyText2']
    ))
    story.append(PageBreak())

    # ========== 5. DB ==========
    story.append(Paragraph('5. Infraestructura de Base de Datos', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    story.append(Paragraph('Nuevas Tablas para AI', s['SubSection']))
    tables = [
        ['Tabla', 'Proposito', 'Columnas Clave'],
        ['ai_task_queue', 'Cola async para jobs AI', 'task_type, input/output_data, status'],
        ['ai_embeddings', 'Vectores para busqueda semantica', 'source_table, embedding vector(384)'],
        ['ai_prompt_templates', 'Prompts editables desde admin', 'template, variables, model, category'],
    ]
    story.append(make_table(tables[0], tables[1:], col_widths=[120, 175, 175]))
    story.append(Spacer(1, 12))

    story.append(Paragraph('Extension PostgreSQL', s['SubSection']))
    story.append(Paragraph(
        'Se habilito pgvector para almacenar embeddings de 384 dimensiones (MiniLM-L6-v2) '
        'que permiten busqueda semantica por similitud coseno contra el catalogo del marketplace.',
        s['BodyText2']
    ))

    story.append(Paragraph('Datos Disponibles para Entrenamiento', s['SubSection']))
    datasets = [
        ['Dataset', 'Tabla', 'Tipo de Dato'],
        ['Sesiones Notiz', 'notiz_sessions', 'Transcripciones + analisis'],
        ['Historia Clinica', 'clinical_history', 'Notas de sesion estructuradas'],
        ['Planes de Tratamiento', 'treatment_plans', 'Objetivos + actividades JSON'],
        ['Evaluaciones ADI-R', 'adir_evaluations + items', 'Scores por dominio A/B/C/D'],
        ['Evaluaciones ADOS-2', 'ados2_evaluations + items', 'Scores AS/CRR/COM'],
        ['Perfil Sensorial', 'sensorial_evaluations + items', 'Scores por seccion sensorial'],
        ['Actividades de Sesion', 'session_activities', 'Logros: logrado/en_proceso/no_logrado'],
        ['Feedback AI', 'ai_feedback', 'Aceptado/rechazado/modificado'],
    ]
    story.append(make_table(datasets[0], datasets[1:], col_widths=[120, 170, 180]))
    story.append(PageBreak())

    # ========== 6. ADMIN DASHBOARD ==========
    story.append(Paragraph('6. Admin Dashboard: Antes vs Despues', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    comparison = [
        ['Componente', 'Antes', 'Despues'],
        ['fetchModels()', '4 modelos hardcodeados', '6 modelos reales con provider/model_id'],
        ['fetchUsageStats()', 'Conteo basico', 'Notiz + templates + chat + quotas + tokens'],
        ['runInference()', 'return "Mock response"', 'supabase.functions.invoke() real'],
        ['fetchTrainingJobs()', 'return []', 'Query a ai_task_queue'],
        ['Prompt Templates', 'return { success: false }', 'CRUD real contra ai_prompt_templates'],
        ['Datasets', 'Solo conteos', 'Conteos de 8 fuentes de datos'],
        ['Settings', 'return { success: true }', 'CRUD real contra ai_settings'],
        ['Evaluaciones', 'return []', 'Stats de ai_feedback (accepted/rejected)'],
    ]
    story.append(make_table(comparison[0], comparison[1:], col_widths=[110, 165, 195]))
    story.append(PageBreak())

    # ========== 7. AUDITORIA ==========
    story.append(Paragraph('7. Auditoria Tecnica Realizada', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    audit = [
        ['Item', 'Antes', 'Despues', 'Impacto'],
        ['Schema versionado', '2 archivos SQL', '7 migraciones + baseline', 'Infraestructura'],
        ['Tablas duplicadas', '186 tablas', '173 tablas (-13)', 'Limpieza'],
        ['RLS (seguridad)', '20 tablas sin RLS', '173/173 con 431 policies', 'Seguridad'],
        ['Console.log', '~1,192 en produccion', '0 (logger centralizado)', 'Produccion'],
        ['Error handling', 'Inconsistente', '99 funciones con apiHandler', 'Estabilidad'],
        ['Tipos TypeScript', '0 lineas', '15,356 lineas generadas', 'Type safety'],
        ['Query N+1', '8 roundtrips/ficha', '1 roundtrip (RPC)', 'Performance'],
        ['Permisos', '4 contextos duplicados', '1 sistema unificado', 'Mantenibilidad'],
    ]
    story.append(make_table(audit[0], audit[1:], col_widths=[105, 120, 140, 95]))
    story.append(PageBreak())

    # ========== 8. META PIXEL ==========
    story.append(Paragraph('8. Meta Pixel y Conversions API', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'Se configuro el Meta Pixel (ID: 1464610018368997) con doble tracking: '
        'browser-side via fbq() y server-side via la edge function new-meta-capi que envia '
        'eventos a la Meta Conversions API. Ambas vias comparten un event_id UUID para deduplicacion.',
        s['BodyText2']
    ))

    meta_config = [
        ['Configuracion', 'Valor'],
        ['Pixel/Dataset ID', '1464610018368997'],
        ['Business ID', '512800222455177'],
        ['System User', 'Conversions API System User (61586790467616)'],
        ['Token expiracion', 'Nunca'],
        ['Supabase Secret', 'META_CAPI_ACCESS_TOKEN configurado'],
        ['Edge Function', 'new-meta-capi deployeada'],
    ]
    story.append(make_table(meta_config[0], meta_config[1:], col_widths=[140, 330]))
    story.append(Spacer(1, 14))

    # ========== 9. CI/CD ==========
    story.append(Paragraph('9. Deploy Automatico (CI/CD)', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'Se configuro GitHub Actions para deploy automatico a Hostinger via FTP. '
        'Cada push a main ejecuta: npm ci, npm run build, y sube dist/ completo a public_html '
        'con dangerous-clean-slate que elimina assets viejos antes de subir. '
        'Esto resuelve el problema de pagina en blanco que ocurria con el deploy manual.',
        s['BodyText2']
    ))

    cicd = [
        ['Paso', 'Herramienta', 'Detalle'],
        ['1. Checkout', 'actions/checkout@v4', 'Descarga codigo del repo'],
        ['2. Setup Node', 'actions/setup-node@v4', 'Node 20 + npm cache'],
        ['3. Install', 'npm ci', 'Instala dependencias'],
        ['4. Build', 'npm run build', 'Vite build con env vars de secrets'],
        ['5. Deploy', 'FTP-Deploy-Action@v4.3.5', 'Sube dist/ a Hostinger, limpia viejos'],
    ]
    story.append(make_table(cicd[0], cicd[1:], col_widths=[70, 150, 250]))
    story.append(PageBreak())

    # ========== 10. PROXIMOS PASOS ==========
    story.append(Paragraph('10. Proximos Pasos', s['SectionTitle']))
    story.append(ColorBar(W, 2, PRIMARY))
    story.append(Spacer(1, 10))

    phases = [
        ['Fase', 'Descripcion', 'Esfuerzo', 'Impacto'],
        ['Fase 2', 'UI de sugerencias en ficha paciente', 'Medio', 'Alto'],
        ['Fase 3', 'Embeddings batch + busqueda semantica', 'Medio', 'Medio-Alto'],
        ['Fase 4', 'FonoLevel AI scoring + pipeline training data', 'Alto', 'Medio'],
        ['Futuro', 'Fine-tuning con HF AutoTrain ($9/mo)', 'Alto', 'Alto'],
    ]
    story.append(make_table(phases[0], phases[1:], col_widths=[60, 230, 80, 100]))
    story.append(Spacer(1, 16))

    story.append(Paragraph('Sobre Fine-Tuning', s['SubSection']))
    story.append(Paragraph(
        'El fine-tuning real de modelos en HuggingFace requiere HF Pro ($9/mes) o GPU local. '
        'Lo implementado actualmente usa few-shot prompting via ai_prompt_templates como forma de '
        '"entrenamiento" inmediato. Se crearon pipelines de datos (ai_task_queue) y estructura '
        'de feedback (ai_feedback, ai_recommendation_feedback) que permitiran fine-tuning futuro '
        'cuando haya presupuesto. Los datos se exportan en formato JSONL listo para AutoTrain.',
        s['BodyText2']
    ))

    story.append(Spacer(1, 40))
    story.append(HRFlowable(width=W, thickness=1, color=BORDER))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f'Generado automaticamente | Fonokit AI Implementation Report | {datetime.now().strftime("%Y-%m-%d %H:%M")}',
        s['SmallMuted']
    ))

    # Build
    doc.build(story)
    return OUTPUT_PATH


if __name__ == '__main__':
    path = build_report()
    print(f'PDF generado: {path}')
