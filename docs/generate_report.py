#!/usr/bin/env python3
"""Generate professional PDF report for Fonokit AI Evidence-Based Generator implementation."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Colors
PURPLE = HexColor('#7C3AED')
PURPLE_LIGHT = HexColor('#EDE9FE')
PURPLE_DARK = HexColor('#5B21B6')
BLUE = HexColor('#2563EB')
BLUE_LIGHT = HexColor('#DBEAFE')
GRAY = HexColor('#6B7280')
GRAY_LIGHT = HexColor('#F3F4F6')
GREEN = HexColor('#059669')
GREEN_LIGHT = HexColor('#D1FAE5')
AMBER = HexColor('#D97706')
AMBER_LIGHT = HexColor('#FEF3C7')

OUTPUT_PATH = '/Users/danissaklagges/Documents/FONOKIT/docs/informe-generador-ia-evidencia.pdf'

def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'TitleMain', parent=styles['Title'],
        fontSize=28, leading=34, textColor=white,
        alignment=TA_CENTER, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        'SubtitleMain', parent=styles['Normal'],
        fontSize=14, leading=18, textColor=HexColor('#E0D5FF'),
        alignment=TA_CENTER, spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        'DateMain', parent=styles['Normal'],
        fontSize=11, leading=14, textColor=HexColor('#C4B5FD'),
        alignment=TA_CENTER, spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'SectionTitle', parent=styles['Heading1'],
        fontSize=16, leading=20, textColor=PURPLE_DARK,
        spaceBefore=16, spaceAfter=8,
        borderColor=PURPLE, borderWidth=0, borderPadding=0
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading2'],
        fontSize=12, leading=16, textColor=PURPLE,
        spaceBefore=10, spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        'BodyText2', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=HexColor('#374151'),
        alignment=TA_JUSTIFY, spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        'BulletItem', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=HexColor('#374151'),
        leftIndent=16, spaceAfter=3, bulletIndent=4
    ))
    styles.add(ParagraphStyle(
        'SmallNote', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=GRAY,
        alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=HexColor('#374151')
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=white, fontName='Helvetica-Bold'
    ))
    return styles


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Footer line
    canvas.setStrokeColor(PURPLE_LIGHT)
    canvas.setLineWidth(0.5)
    canvas.line(30, 35, w - 30, 35)
    # Footer text
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(30, 22, 'Fonokit - Plataforma de Fonoaudiologia')
    canvas.drawRightString(w - 30, 22, f'Pagina {doc.page}')
    canvas.restoreState()


def title_page_template(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Full purple background
    canvas.setFillColor(PURPLE)
    canvas.rect(0, h * 0.45, w, h * 0.55, fill=1, stroke=0)
    # Lighter stripe
    canvas.setFillColor(PURPLE_DARK)
    canvas.rect(0, h * 0.45, w, 4, fill=1, stroke=0)
    # Bottom section
    canvas.setFillColor(GRAY_LIGHT)
    canvas.rect(0, 0, w, h * 0.45, fill=1, stroke=0)
    canvas.restoreState()


def build_report():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm
    )

    styles = build_styles()
    story = []

    # ═══════════════════════════════════════════
    # TITLE PAGE
    # ═══════════════════════════════════════════
    story.append(Spacer(1, 80))
    story.append(Paragraph('INFORME DE', styles['SubtitleMain']))
    story.append(Paragraph('IMPLEMENTACION', styles['TitleMain']))
    story.append(Spacer(1, 10))
    story.append(Paragraph('Generador IA Basado en<br/>Evidencia Cientifica', styles['SubtitleMain']))
    story.append(Spacer(1, 6))
    story.append(Paragraph('Pipeline de 2 Modelos + PubMed', styles['DateMain']))
    story.append(Spacer(1, 40))
    story.append(Paragraph('Fonokit - Plataforma de Fonoaudiologia', styles['DateMain']))
    story.append(Paragraph('2 de Abril, 2026', styles['DateMain']))
    story.append(Spacer(1, 20))

    # Info box in the white area
    info_data = [
        [Paragraph('<b>Proyecto:</b> Fonokit', styles['TableCell']),
         Paragraph('<b>Version:</b> 2.0', styles['TableCell'])],
        [Paragraph('<b>Modulo:</b> Generador IA', styles['TableCell']),
         Paragraph('<b>Estado:</b> Desplegado', styles['TableCell'])],
        [Paragraph('<b>Autor:</b> Equipo Desarrollo', styles['TableCell']),
         Paragraph('<b>Fecha:</b> 02/04/2026', styles['TableCell'])],
    ]
    info_table = Table(info_data, colWidths=[80 * mm, 80 * mm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), white),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE_LIGHT),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(Spacer(1, 60))
    story.append(info_table)

    story.append(PageBreak())

    # ═══════════════════════════════════════════
    # 1. RESUMEN EJECUTIVO
    # ═══════════════════════════════════════════
    story.append(Paragraph('1. Resumen Ejecutivo', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'El generador de plantillas terapeuticas de Fonokit ha sido actualizado con un '
        '<b>pipeline de 2 modelos de Inteligencia Artificial</b> que transforma la forma en que '
        'se crean los planes de tratamiento fonoaudiologico.',
        styles['BodyText2']
    ))
    story.append(Paragraph(
        'El nuevo sistema busca automaticamente evidencia cientifica en <b>PubMed</b> (la base de datos '
        'biomedica mas grande del mundo), la analiza con un modelo de IA especializado en investigacion '
        'clinica, y luego genera planes de tratamiento estructurados con un segundo modelo experto en '
        'planificacion terapeutica.',
        styles['BodyText2']
    ))
    story.append(Paragraph(
        'Esto garantiza que <b>todos los planes esten fundamentados en literatura cientifica actual</b>, '
        'con citaciones especificas por actividad, niveles de evidencia identificados, y recomendaciones '
        'basadas en hallazgos de estudios recientes.',
        styles['BodyText2']
    ))

    # Key metrics box
    metrics_data = [
        [Paragraph('<b>30+</b>', ParagraphStyle('m', parent=styles['TableCell'], alignment=TA_CENTER, fontSize=14, textColor=PURPLE)),
         Paragraph('<b>5-6</b>', ParagraphStyle('m2', parent=styles['TableCell'], alignment=TA_CENTER, fontSize=14, textColor=BLUE)),
         Paragraph('<b>2</b>', ParagraphStyle('m3', parent=styles['TableCell'], alignment=TA_CENTER, fontSize=14, textColor=GREEN)),
         Paragraph('<b>3</b>', ParagraphStyle('m4', parent=styles['TableCell'], alignment=TA_CENTER, fontSize=14, textColor=AMBER))],
        [Paragraph('Terminos clinicos\nmapeados', ParagraphStyle('ml', parent=styles['SmallNote'], alignment=TA_CENTER)),
         Paragraph('Articulos PubMed\npor consulta', ParagraphStyle('ml2', parent=styles['SmallNote'], alignment=TA_CENTER)),
         Paragraph('Modelos IA\nen pipeline', ParagraphStyle('ml3', parent=styles['SmallNote'], alignment=TA_CENTER)),
         Paragraph('Niveles de\nfallback', ParagraphStyle('ml4', parent=styles['SmallNote'], alignment=TA_CENTER))],
    ]
    metrics_table = Table(metrics_data, colWidths=[40 * mm] * 4)
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(Spacer(1, 10))
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # ═══════════════════════════════════════════
    # 2. ARQUITECTURA DEL PIPELINE
    # ═══════════════════════════════════════════
    story.append(Paragraph('2. Arquitectura del Pipeline', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'El pipeline ejecuta 3 pasos secuenciales para cada solicitud de generacion:',
        styles['BodyText2']
    ))

    # Pipeline steps as table
    pipeline_data = [
        [Paragraph('<b>Paso</b>', styles['TableHeader']),
         Paragraph('<b>Componente</b>', styles['TableHeader']),
         Paragraph('<b>Descripcion</b>', styles['TableHeader'])],
        [Paragraph('1', ParagraphStyle('pc', parent=styles['TableCell'], alignment=TA_CENTER)),
         Paragraph('<b>Busqueda PubMed</b>', styles['TableCell']),
         Paragraph('Mapea el diagnostico en espanol a terminos MeSH en ingles. '
                    'Busca 5-6 articulos relevantes usando E-utilities API (gratuita). '
                    'Extrae titulo, autores, revista, ano, abstract (800 chars) y DOI.', styles['TableCell'])],
        [Paragraph('2', ParagraphStyle('pc2', parent=styles['TableCell'], alignment=TA_CENTER)),
         Paragraph('<b>Modelo Analista</b>\n(Llama 3.3 70B)', styles['TableCell']),
         Paragraph('Sintetiza la evidencia cientifica extrayendo: hallazgos principales, '
                    'tecnicas con mayor soporte empirico, parametros de dosificacion, '
                    'resultados esperados, precauciones y niveles de evidencia por hallazgo.', styles['TableCell'])],
        [Paragraph('3', ParagraphStyle('pc3', parent=styles['TableCell'], alignment=TA_CENTER)),
         Paragraph('<b>Modelo Planificador</b>\n(Claude Haiku)', styles['TableCell']),
         Paragraph('Genera un plan terapeutico estructurado en JSON basado en la sintesis '
                    'de evidencia. Incluye plan por sesiones con actividades paso a paso, '
                    'criterios de logro, materiales, y fundamentacion por actividad.', styles['TableCell'])],
    ]
    pipeline_table = Table(pipeline_data, colWidths=[15 * mm, 35 * mm, 110 * mm])
    pipeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PURPLE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (0, 1), BLUE_LIGHT),
        ('BACKGROUND', (0, 2), (0, 2), PURPLE_LIGHT),
        ('BACKGROUND', (0, 3), (0, 3), GREEN_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(pipeline_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        '<b>Ventaja clave:</b> El modelo planificador recibe evidencia pre-digerida y sintetizada, '
        'no abstracts crudos. Esto produce planes de mayor calidad clinica con fundamentacion '
        'especifica en cada actividad terapeutica.',
        styles['BodyText2']
    ))

    # ═══════════════════════════════════════════
    # 3. MODELOS DE IA UTILIZADOS
    # ═══════════════════════════════════════════
    story.append(Paragraph('3. Modelos de IA Utilizados', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    models_data = [
        [Paragraph('<b>Rol</b>', styles['TableHeader']),
         Paragraph('<b>Modelo</b>', styles['TableHeader']),
         Paragraph('<b>Proveedor</b>', styles['TableHeader']),
         Paragraph('<b>Costo</b>', styles['TableHeader']),
         Paragraph('<b>Temp.</b>', styles['TableHeader'])],
        [Paragraph('Analista de Evidencia', styles['TableCell']),
         Paragraph('Llama 3.3 70B Instruct', styles['TableCell']),
         Paragraph('HuggingFace Hyperbolic', styles['TableCell']),
         Paragraph('Gratis', styles['TableCell']),
         Paragraph('0.2', styles['TableCell'])],
        [Paragraph('Planificador (primario)', styles['TableCell']),
         Paragraph('Claude Haiku 4.5', styles['TableCell']),
         Paragraph('Anthropic API', styles['TableCell']),
         Paragraph('Con creditos', styles['TableCell']),
         Paragraph('0.3', styles['TableCell'])],
        [Paragraph('Planificador (fallback 1)', styles['TableCell']),
         Paragraph('Llama 3.3 70B Instruct', styles['TableCell']),
         Paragraph('HuggingFace Hyperbolic', styles['TableCell']),
         Paragraph('Gratis', styles['TableCell']),
         Paragraph('0.3', styles['TableCell'])],
        [Paragraph('Planificador (fallback 2)', styles['TableCell']),
         Paragraph('DeepSeek-V3', styles['TableCell']),
         Paragraph('HuggingFace Hyperbolic', styles['TableCell']),
         Paragraph('Gratis', styles['TableCell']),
         Paragraph('0.3', styles['TableCell'])],
    ]
    models_table = Table(models_data, colWidths=[34 * mm, 34 * mm, 38 * mm, 25 * mm, 15 * mm])
    models_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PURPLE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, 1), BLUE_LIGHT),
        ('BACKGROUND', (0, 2), (-1, 2), PURPLE_LIGHT),
        ('BACKGROUND', (0, 3), (-1, 3), GRAY_LIGHT),
        ('BACKGROUND', (0, 4), (-1, 4), GRAY_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(models_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        'La temperatura baja (0.2-0.3) garantiza respuestas clinicamente precisas y consistentes. '
        'El modelo analista usa 0.2 para maxima fidelidad a la evidencia, mientras que el '
        'planificador usa 0.3 para permitir cierta creatividad en el diseno de actividades.',
        styles['BodyText2']
    ))

    # ═══════════════════════════════════════════
    # 4. ESTRUCTURA DEL PLAN GENERADO
    # ═══════════════════════════════════════════
    story.append(Paragraph('4. Estructura del Plan Generado (JSON)', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'El modelo planificador genera un JSON estructurado con los siguientes campos:',
        styles['BodyText2']
    ))

    json_fields = [
        ('<b>titulo</b> - Titulo descriptivo del plan', ''),
        ('<b>objetivo_general</b> - Objetivo principal basado en evidencia', ''),
        ('<b>objetivos_especificos[]</b> - Lista de objetivos medibles', ''),
        ('<b>plan_sesiones[]</b> - Plan detallado por sesion:', ''),
        ('    sesion, objetivo_sesion', ''),
        ('    actividades[]: nombre, descripcion_paso_a_paso[], duracion_minutos,', ''),
        ('    materiales[], criterio_logro, fundamentacion_evidencia', ''),
        ('<b>frecuencia_recomendada</b> - Ej: "2-3 sesiones semanales de 45 min"', ''),
        ('<b>duracion_total_plan</b> - Ej: "8-12 semanas"', ''),
        ('<b>indicadores_progreso[]</b> - Metricas medibles de avance', ''),
        ('<b>evidencia_base[]</b> - hallazgo, referencia [Autor, Ano], nivel_evidencia', ''),
        ('<b>recomendaciones_para_familia[]</b> - Actividades para el hogar', ''),
        ('<b>precauciones[]</b> - Contraindicaciones documentadas', ''),
        ('<b>criterios_alta</b> - Cuando dar de alta al paciente del plan', ''),
    ]
    for field, _ in json_fields:
        indent = 24 if field.startswith('    ') else 16
        story.append(Paragraph(
            field.strip(),
            ParagraphStyle('jsonfield', parent=styles['BodyText2'],
                           leftIndent=indent, fontSize=9, spaceAfter=2,
                           fontName='Courier' if not field.startswith('<b>') else 'Helvetica')
        ))

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        '<b>Compatibilidad:</b> El frontend soporta tanto el formato nuevo (plan_sesiones) como el '
        'formato antiguo (actividades[]) para backward compatibility con planes generados anteriormente.',
        styles['BodyText2']
    ))

    # ═══════════════════════════════════════════
    # 5. INTEGRACION CON PUBMED
    # ═══════════════════════════════════════════
    story.append(PageBreak())
    story.append(Paragraph('5. Integracion con PubMed', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'El sistema se conecta a PubMed a traves de la API E-utilities del NCBI '
        '(National Center for Biotechnology Information). Esta API es gratuita y no requiere '
        'API key para uso moderado.',
        styles['BodyText2']
    ))

    story.append(Paragraph('Mapeo de Terminos Clinicos', styles['SubSection']))
    story.append(Paragraph(
        'Se implemento un diccionario de 30+ terminos fonoaudiologicos en espanol '
        'mapeados a terminos MeSH (Medical Subject Headings) en ingles:',
        styles['BodyText2']
    ))

    terms_data = [
        [Paragraph('<b>Espanol</b>', styles['TableHeader']),
         Paragraph('<b>Terminos MeSH (Ingles)</b>', styles['TableHeader'])],
        [Paragraph('disfagia', styles['TableCell']),
         Paragraph('deglutition disorders, dysphagia, swallowing therapy', styles['TableCell'])],
        [Paragraph('tartamudez', styles['TableCell']),
         Paragraph('stuttering, fluency disorders, stammering treatment', styles['TableCell'])],
        [Paragraph('autismo / TEA', styles['TableCell']),
         Paragraph('autism spectrum disorder, ASD communication, speech therapy autism', styles['TableCell'])],
        [Paragraph('apraxia', styles['TableCell']),
         Paragraph('apraxia of speech, childhood apraxia, motor speech disorders', styles['TableCell'])],
        [Paragraph('afasia', styles['TableCell']),
         Paragraph('aphasia, aphasia rehabilitation, language therapy stroke', styles['TableCell'])],
        [Paragraph('dislalia', styles['TableCell']),
         Paragraph('articulation disorders, phonological disorders, speech sound disorders', styles['TableCell'])],
        [Paragraph('voz / disfonia', styles['TableCell']),
         Paragraph('voice disorders, dysphonia, voice therapy techniques', styles['TableCell'])],
        [Paragraph('lenguaje', styles['TableCell']),
         Paragraph('language development disorders, specific language impairment, DLD', styles['TableCell'])],
    ]
    terms_table = Table(terms_data, colWidths=[35 * mm, 125 * mm])
    terms_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('BOX', (0, 0), (-1, -1), 1, BLUE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BLUE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(terms_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        'Cada articulo retornado incluye: PMID, titulo, autores (primeros 3 + et al.), '
        'revista, ano de publicacion, abstract (hasta 800 caracteres) y DOI con enlace directo a PubMed.',
        styles['BodyText2']
    ))

    # ═══════════════════════════════════════════
    # 6. INTERFAZ DE USUARIO
    # ═══════════════════════════════════════════
    story.append(Paragraph('6. Interfaz de Usuario', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'La pagina TemplateGeneratorPage fue actualizada con los siguientes componentes:',
        styles['BodyText2']
    ))

    ui_items = [
        '<b>Indicador de progreso de 3 pasos</b> durante la generacion: PubMed > Analisis > Plan, '
        'con dots animados que muestran el paso actual.',
        '<b>Panel "Sintesis de Evidencia"</b> colapsable que muestra el output del modelo analista '
        '(Llama 3.3 70B), permitiendo ver como se interpreto la literatura.',
        '<b>Plan por sesiones</b> con timeline visual: cada sesion se renderiza con borde lateral '
        'azul, badge de numero de sesion, y actividades numeradas jerarquicamente (1.1, 1.2, etc.).',
        '<b>Fundamentacion inline</b> por actividad: cada actividad muestra su citacion de evidencia '
        'en un badge azul con icono de laboratorio.',
        '<b>Panel de articulos PubMed</b> con enlaces externos directos a cada articulo.',
        '<b>Secciones nuevas:</b> Indicadores de Progreso, Recomendaciones para la Familia '
        '(colapsable), Precauciones, y Criterios de Alta.',
        '<b>Modelo usado</b> visible en el header: "Analisis: Llama 3.3 | Planificacion: Claude Haiku".',
        '<b>Backward compatible</b> con el formato JSON anterior (actividades[] sin plan_sesiones).',
    ]
    for item in ui_items:
        story.append(Paragraph(
            f'&bull; {item}', styles['BulletItem']
        ))

    # ═══════════════════════════════════════════
    # 7. ARCHIVOS MODIFICADOS
    # ═══════════════════════════════════════════
    story.append(Paragraph('7. Archivos Modificados', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    files_data = [
        [Paragraph('<b>Archivo</b>', styles['TableHeader']),
         Paragraph('<b>Accion</b>', styles['TableHeader']),
         Paragraph('<b>Descripcion</b>', styles['TableHeader'])],
        [Paragraph('supabase/functions/\ngenerate-template/index.ts', styles['TableCell']),
         Paragraph('Reescrito', styles['TableCell']),
         Paragraph('Pipeline de 2 modelos con PubMed, analista y planificador. '
                    'Cascade de fallback Claude > Llama > DeepSeek.', styles['TableCell'])],
        [Paragraph('src/features/therapist/pages/\nTemplateGeneratorPage.jsx', styles['TableCell']),
         Paragraph('Actualizado', styles['TableCell']),
         Paragraph('Nuevo renderizado para plan_sesiones, sintesis de evidencia, '
                    'indicadores de progreso, recomendaciones familiares.', styles['TableCell'])],
    ]
    files_table = Table(files_data, colWidths=[50 * mm, 22 * mm, 88 * mm])
    files_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PURPLE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, -1), white),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(files_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph('Despliegue:', styles['SubSection']))
    deploy_items = [
        'Edge function desplegada en Supabase (supabase functions deploy generate-template)',
        'Build de produccion generado (npm run build)',
        'Codigo pushed a GitHub (git push origin main)',
    ]
    for item in deploy_items:
        story.append(Paragraph(f'&bull; {item}', styles['BulletItem']))

    # ═══════════════════════════════════════════
    # 8. RESILIENCIA Y FALLBACKS
    # ═══════════════════════════════════════════
    story.append(Paragraph('8. Resiliencia y Fallbacks', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph(
        'El sistema esta disenado para ser resiliente ante fallas en cualquier componente:',
        styles['BodyText2']
    ))

    fallback_data = [
        [Paragraph('<b>Componente</b>', styles['TableHeader']),
         Paragraph('<b>Si falla...</b>', styles['TableHeader']),
         Paragraph('<b>Criticidad</b>', styles['TableHeader'])],
        [Paragraph('Busqueda PubMed', styles['TableCell']),
         Paragraph('Continua con conocimiento clinico general del modelo', styles['TableCell']),
         Paragraph('No critica', styles['TableCell'])],
        [Paragraph('Modelo Analista (Llama)', styles['TableCell']),
         Paragraph('Usa abstracts crudos de PubMed como contexto directo', styles['TableCell']),
         Paragraph('No critica', styles['TableCell'])],
        [Paragraph('Claude Haiku', styles['TableCell']),
         Paragraph('Fallback a Llama 3.3 70B (gratis)', styles['TableCell']),
         Paragraph('No critica', styles['TableCell'])],
        [Paragraph('Llama 3.3 70B', styles['TableCell']),
         Paragraph('Fallback a DeepSeek-V3 (gratis)', styles['TableCell']),
         Paragraph('No critica', styles['TableCell'])],
        [Paragraph('Todos los LLMs', styles['TableCell']),
         Paragraph('Retorna error al usuario con mensaje descriptivo', styles['TableCell']),
         Paragraph('Critica', styles['TableCell'])],
    ]
    fallback_table = Table(fallback_data, colWidths=[40 * mm, 85 * mm, 25 * mm])
    fallback_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PURPLE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('BACKGROUND', (0, 1), (-1, 4), white),
        ('BACKGROUND', (0, 5), (-1, 5), AMBER_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, PURPLE),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, PURPLE_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(fallback_table)

    # ═══════════════════════════════════════════
    # 9. PROXIMOS PASOS
    # ═══════════════════════════════════════════
    story.append(Spacer(1, 10))
    story.append(Paragraph('9. Proximos Pasos', styles['SectionTitle']))
    story.append(HRFlowable(width='100%', thickness=2, color=PURPLE, spaceBefore=0, spaceAfter=8))

    next_steps = [
        '<b>Testing con diagnosticos reales:</b> Probar generacion de planes para disfagia infantil, '
        'tartamudez, TEL, apraxia del habla, y otros diagnosticos frecuentes.',
        '<b>Monitoreo de calidad:</b> Revisar la calidad de los planes generados y la relevancia '
        'de las citaciones de evidencia con fonoaudiologos clinicos.',
        '<b>Filtros PubMed avanzados:</b> Agregar filtros por rango de fechas, tipo de articulo '
        '(meta-analisis, RCT), y poblacion (pediatrica, adultos).',
        '<b>Generacion de materiales imprimibles:</b> Potencial tercer modelo para convertir el '
        'plan en fichas de trabajo, laminas, y material para sesion.',
        '<b>Dashboard Meta Ads:</b> Implementacion del dashboard de Meta Ads en el modulo de '
        'marketing admin (feature separada, planificada).',
        '<b>Optimizacion de latencia:</b> Evaluar ejecucion paralela del paso 1 y pre-carga '
        'de modelos para reducir tiempo de respuesta.',
    ]
    for step in next_steps:
        story.append(Paragraph(f'&bull; {step}', styles['BulletItem']))

    # Final note
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width='60%', thickness=1, color=PURPLE_LIGHT, spaceBefore=0, spaceAfter=8))
    story.append(Paragraph(
        'Este informe fue generado automaticamente como parte del proceso de documentacion '
        'de Fonokit. Para consultas sobre la implementacion, contactar al equipo de desarrollo.',
        styles['SmallNote']
    ))

    # Build
    doc.build(story, onFirstPage=title_page_template, onLaterPages=header_footer)
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f'PDF generado exitosamente: {OUTPUT_PATH}')
    print(f'Tamano: {size_kb:.1f} KB')


if __name__ == '__main__':
    build_report()
