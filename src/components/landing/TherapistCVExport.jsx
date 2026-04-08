/**
 * @file src/components/landing/TherapistCVExport.jsx
 *
 * Generates a print-optimized CV from therapist landing page data.
 * Opens in a new window with @media print styles for clean PDF export.
 */

import { DENTALSPOT_COLORS } from './sections/shared/utils';

const EDUCATION_TYPE_MAP = {
  doctorado: { label: 'Doctorado', weight: 6 },
  magister: { label: 'Magíster', weight: 5 },
  diplomado: { label: 'Diplomado', weight: 4 },
  licenciatura: { label: 'Licenciatura', weight: 3 },
  curso: { label: 'Curso', weight: 2 },
  taller: { label: 'Taller', weight: 1 },
};

function detectType(edu) {
  const title = (edu.title || edu.degree || '').toLowerCase();
  if (title.includes('doctor')) return EDUCATION_TYPE_MAP.doctorado;
  if (title.includes('magíster') || title.includes('master') || title.includes('máster')) return EDUCATION_TYPE_MAP.magister;
  if (title.includes('diplomado') || title.includes('diploma')) return EDUCATION_TYPE_MAP.diplomado;
  if (title.includes('licenciatura') || title.includes('grado')) return EDUCATION_TYPE_MAP.licenciatura;
  if (title.includes('taller')) return EDUCATION_TYPE_MAP.taller;
  return EDUCATION_TYPE_MAP.curso;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function exportTherapistCV(data) {
  if (!data) return;

  const { therapist, education, experience, specialties, conditions, services, specialtyBadges, languages } = data;
  const details = therapist.therapist_details || {};
  const primaryColor = data.branding?.primaryColor || DENTALSPOT_COLORS.primary;
  const secondaryColor = data.branding?.secondaryColor || DENTALSPOT_COLORS.secondary;

  // Sort education by weight
  const sortedEducation = [...(education || [])].sort((a, b) => {
    return (detectType(b).weight - detectType(a).weight) || ((b.graduation_year || 0) - (a.graduation_year || 0));
  });

  const avatarUrl = therapist.avatar_url || '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>CV - ${therapist.full_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1e293b;
    background: #fff;
    font-size: 11px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4;
    margin: 15mm 18mm;
  }

  @media print {
    body { font-size: 10px; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
    section { page-break-inside: avoid; }
  }

  .cv-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 20px;
  }

  /* Header */
  .cv-header {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 3px solid ${primaryColor};
    margin-bottom: 20px;
  }

  .cv-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid ${primaryColor};
    flex-shrink: 0;
  }

  .cv-header-info { flex: 1; }

  .cv-name {
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 2px;
  }

  .cv-title {
    font-size: 14px;
    font-weight: 600;
    color: ${primaryColor};
    margin-bottom: 6px;
  }

  .cv-headline {
    font-size: 12px;
    color: #475569;
    font-style: italic;
    margin-bottom: 8px;
  }

  .cv-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 10px;
    color: #64748b;
  }

  .cv-contact span { display: flex; align-items: center; gap: 3px; }

  /* Badge */
  .cv-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    color: white;
    background: ${secondaryColor};
    margin-bottom: 6px;
  }

  /* Sections */
  .cv-section {
    margin-bottom: 18px;
  }

  .cv-section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: ${primaryColor};
    border-bottom: 2px solid ${primaryColor}20;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }

  /* About */
  .cv-about {
    font-size: 11px;
    color: #334155;
    line-height: 1.6;
  }

  /* Two columns */
  .cv-two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* Education */
  .cv-edu-item {
    margin-bottom: 10px;
    padding-left: 12px;
    border-left: 2px solid ${primaryColor}40;
  }

  .cv-edu-type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: ${primaryColor};
  }

  .cv-edu-title {
    font-size: 11px;
    font-weight: 600;
    color: #0f172a;
  }

  .cv-edu-institution {
    font-size: 10px;
    color: #64748b;
  }

  .cv-edu-year {
    font-size: 9px;
    color: #94a3b8;
  }

  /* Experience */
  .cv-exp-item {
    margin-bottom: 10px;
    padding-left: 12px;
    border-left: 2px solid ${secondaryColor}40;
  }

  .cv-exp-role {
    font-size: 11px;
    font-weight: 600;
    color: #0f172a;
  }

  .cv-exp-company {
    font-size: 10px;
    color: #64748b;
  }

  .cv-exp-dates {
    font-size: 9px;
    color: #94a3b8;
  }

  /* Tags */
  .cv-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .cv-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 500;
    background: ${primaryColor}12;
    color: ${primaryColor};
    border: 1px solid ${primaryColor}25;
  }

  .cv-tag--secondary {
    background: ${secondaryColor}12;
    color: ${secondaryColor};
    border-color: ${secondaryColor}25;
  }

  /* Specialty badges */
  .cv-specialty-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .cv-specialty-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f8fafc;
    font-size: 10px;
  }

  .cv-specialty-name { font-weight: 500; color: #334155; }
  .cv-specialty-badge { font-weight: 700; font-size: 9px; color: ${secondaryColor}; }

  /* Services */
  .cv-services-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .cv-service-item {
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fafbfc;
  }

  .cv-service-name { font-weight: 600; font-size: 10px; color: #0f172a; }
  .cv-service-detail { font-size: 9px; color: #64748b; }

  /* Languages */
  .cv-lang-list {
    display: flex;
    gap: 8px;
  }

  .cv-lang-item {
    font-size: 10px;
    color: #334155;
    font-weight: 500;
  }

  /* Footer */
  .cv-footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 9px;
    color: #94a3b8;
  }

  /* Print button */
  .print-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #0f172a;
    padding: 12px 24px;
    display: flex;
    justify-content: center;
    gap: 12px;
    z-index: 100;
  }

  .print-bar button {
    padding: 8px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  .btn-print {
    background: ${primaryColor};
    color: white;
  }

  .btn-close {
    background: #334155;
    color: white;
  }

  .cv-container { margin-top: 60px; }

  @media print {
    .print-bar { display: none; }
    .cv-container { margin-top: 0; }
  }
</style>
</head>
<body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">Descargar PDF</button>
  <button class="btn-close" onclick="window.close()">Cerrar</button>
</div>

<div class="cv-container">
  <!-- HEADER -->
  <header class="cv-header">
    ${avatarUrl ? `<img class="cv-avatar" src="${avatarUrl}" alt="${therapist.full_name}" />` : ''}
    <div class="cv-header-info">
      <h1 class="cv-name">${therapist.full_name || ''}</h1>
      <p class="cv-title">${details.professional_title || 'Odontólogo/a'}</p>
      ${therapist.badge_label ? `<span class="cv-badge">${therapist.badge_label}</span>` : ''}
      ${details.headline_statement ? `<p class="cv-headline">${details.headline_statement}</p>` : ''}
      <div class="cv-contact">
        ${details.public_email || therapist.email ? `<span>📧 ${details.public_email || therapist.email}</span>` : ''}
        ${therapist.phone ? `<span>📱 ${therapist.phone}</span>` : ''}
        ${details.years_experience ? `<span>🗓 ${details.years_experience} años de experiencia</span>` : ''}
        ${details.university ? `<span>🎓 ${details.university}${details.graduation_year ? ` (${details.graduation_year})` : ''}</span>` : ''}
      </div>
      <div class="cv-contact" style="margin-top:4px;">
        ${details.registration_supersalud ? `<span>SIS: ${details.registration_supersalud}</span>` : ''}
        ${details.registration_secreduc ? `<span>SECREDUC: ${details.registration_secreduc}</span>` : ''}
      </div>
    </div>
  </header>

  <!-- ABOUT -->
  ${details.about_me ? `
  <section class="cv-section">
    <h2 class="cv-section-title">Perfil Profesional</h2>
    <p class="cv-about">${details.about_me}</p>
  </section>
  ` : ''}

  <!-- SPECIALTIES & CONDITIONS -->
  <div class="cv-two-cols">
    ${(specialties && specialties.length > 0) || (specialtyBadges && specialtyBadges.length > 0) ? `
    <section class="cv-section">
      <h2 class="cv-section-title">Especialidades</h2>
      ${specialtyBadges && specialtyBadges.length > 0 ? `
      <div class="cv-specialty-list">
        ${specialtyBadges.map(sb => `
          <div class="cv-specialty-item">
            <span class="cv-specialty-name">${sb.specialty}</span>
            <span class="cv-specialty-badge">${sb.badge}</span>
          </div>
        `).join('')}
      </div>
      ` : `
      <div class="cv-tags">
        ${specialties.map(s => `<span class="cv-tag">${s}</span>`).join('')}
      </div>
      `}
    </section>
    ` : ''}

    ${conditions && conditions.length > 0 ? `
    <section class="cv-section">
      <h2 class="cv-section-title">Condiciones que Trata</h2>
      <div class="cv-tags">
        ${conditions.map(c => `<span class="cv-tag cv-tag--secondary">${c}</span>`).join('')}
      </div>
    </section>
    ` : ''}
  </div>

  <!-- EDUCATION & EXPERIENCE -->
  <div class="cv-two-cols">
    ${sortedEducation.length > 0 ? `
    <section class="cv-section">
      <h2 class="cv-section-title">Formación Académica</h2>
      ${sortedEducation.map(edu => {
        const type = detectType(edu);
        return `
        <div class="cv-edu-item">
          <div class="cv-edu-type">${type.label}</div>
          <div class="cv-edu-title">${edu.title || edu.degree || ''}</div>
          <div class="cv-edu-institution">${edu.institution || ''}</div>
          ${edu.graduation_year ? `<div class="cv-edu-year">${edu.graduation_year}</div>` : ''}
        </div>`;
      }).join('')}
    </section>
    ` : ''}

    ${experience && experience.length > 0 ? `
    <section class="cv-section">
      <h2 class="cv-section-title">Experiencia Profesional</h2>
      ${experience.map(exp => `
        <div class="cv-exp-item">
          <div class="cv-exp-role">${exp.role || exp.position || ''}</div>
          <div class="cv-exp-company">${exp.institution || exp.company || ''}</div>
          <div class="cv-exp-dates">${formatDate(exp.start_date)}${exp.end_date ? ` — ${formatDate(exp.end_date)}` : ' — Presente'}</div>
        </div>
      `).join('')}
    </section>
    ` : ''}
  </div>

  <!-- SERVICES -->
  ${services && services.length > 0 ? `
  <section class="cv-section">
    <h2 class="cv-section-title">Servicios</h2>
    <div class="cv-services-grid">
      ${services.map(s => `
        <div class="cv-service-item">
          <div class="cv-service-name">${s.name || ''}</div>
          <div class="cv-service-detail">
            ${s.duration_minutes ? `${s.duration_minutes} min` : ''}
            ${s.modality ? ` · ${s.modality === 'online' ? 'Online' : s.modality === 'presencial' ? 'Presencial' : 'Online/Presencial'}` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- LANGUAGES -->
  ${languages && languages.length > 0 ? `
  <section class="cv-section">
    <h2 class="cv-section-title">Idiomas</h2>
    <div class="cv-lang-list">
      ${languages.map(l => `<span class="cv-lang-item">${typeof l === 'string' ? l : l.language}</span>`).join(' · ')}
    </div>
  </section>
  ` : ''}

  <!-- FOOTER -->
  <footer class="cv-footer">
    CV generado desde DentalSpot.cl — ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
  </footer>
</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
