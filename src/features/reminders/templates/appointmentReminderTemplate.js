/**
 * Frontend generator for email template preview or fallback.
 * The actual sending uses the Edge Function template.
 */
export const generateReminderEmail = (appointmentData, therapistBranding, reminderType = 'patient') => {
  const {
    patientName,
    therapistName,
    date,
    time,
    location,
    modality
  } = appointmentData;

  const {
    logoUrl,
    primaryColor = '#00A8CC',
    email: therapistEmail,
    phone: therapistPhone
  } = therapistBranding;

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${primaryColor}; padding: 20px; text-align: center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; background: white; padding: 5px; border-radius: 4px;" />` : `<h2 style="color: white; margin: 0;">${therapistName}</h2>`}
      </div>
      
      <div style="padding: 24px; color: #334155;">
        <h3 style="margin-top: 0;">Recordatorio de Cita</h3>
        <p>Hola ${reminderType === 'patient' ? patientName : therapistName},</p>
        <p>Te recordamos que tienes una cita programada:</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${time}</p>
          <p style="margin: 5px 0;"><strong>👤 Profesional:</strong> ${therapistName}</p>
          <p style="margin: 5px 0;"><strong>📍 Modalidad:</strong> ${modality}</p>
          ${location ? `<p style="margin: 5px 0;"><strong>🏢 Dirección:</strong> ${location}</p>` : ''}
        </div>

        <p style="font-size: 14px; color: #64748b;">
          Si no puedes asistir, por favor avísanos con anticipación.
        </p>
      </div>

      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 5px 0;">${therapistEmail} | ${therapistPhone}</p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} DentalSpot</p>
      </div>
    </div>
  `;
};