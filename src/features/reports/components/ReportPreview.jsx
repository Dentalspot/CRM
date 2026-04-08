import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

const ReportPreview = ({ reportData }) => {
  const { user } = useAuth(); // Logged in therapist info

  if (!reportData) return <div className="p-8 text-center">No hay datos para previsualizar.</div>;

  const { patient, appointment, template, content, generatedAt } = reportData;

  return (
    <Card className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:border-none my-8 min-h-[297mm] p-[20mm] text-sm text-gray-800 relative">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-2">
          {template.name}
        </h1>
        <p className="text-gray-500">Generado el {new Date(generatedAt).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Patient Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider border-b pb-1 mb-2">
            Información del Paciente
          </h3>
          <p><span className="font-semibold">Nombre:</span> {patient.name}</p>
          <p><span className="font-semibold">RUT:</span> {patient.rut || 'No registrado'}</p>
          <p><span className="font-semibold">Fecha Nacimiento:</span> {patient.birthdate || 'No registrada'}</p>
          {patient.email && <p><span className="font-semibold">Email:</span> {patient.email}</p>}
        </div>

        {/* Professional Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider border-b pb-1 mb-2">
            Profesional Tratante
          </h3>
          <p><span className="font-semibold">Nombre:</span> {user.full_name}</p>
          <p><span className="font-semibold">Especialidad:</span> Odontología</p>
          {user.email && <p><span className="font-semibold">Contacto:</span> {user.email}</p>}
        </div>
      </div>

      {appointment && (
        <div className="mb-8 p-3 bg-gray-50 rounded border border-gray-100">
          <h3 className="font-bold text-gray-900 text-xs uppercase mb-1">Detalles de la Sesión</h3>
          <div className="flex gap-6 text-xs text-gray-600">
            <span>Fecha: {appointment.date}</span>
            <span>Hora: {appointment.start_time}</span>
            <span>Estado: {appointment.status}</span>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Dynamic Content */}
      <div className="space-y-6">
        {template.fields.map((field) => (
          <div key={field.name}>
            <h4 className="font-bold text-gray-900 mb-1">{field.label}</h4>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {content[field.name] || <span className="text-gray-400 italic">Sin información registrada</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t-2 border-gray-100 flex justify-between items-end">
        <div className="text-xs text-gray-400">
          Documento generado electrónicamente a través de DentalSpot.
          <br />
          ID Verificación: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
        <div className="text-center">
          <div className="h-16 mb-2">
            {/* Espacio para firma digital o imagen */}
          </div>
          <div className="border-t border-gray-300 w-48 mx-auto pt-2">
            <p className="font-bold">{user.full_name}</p>
            <p className="text-xs text-gray-500">Odontólogo/a</p>
          </div>
        </div>
      </div>

    </Card>
  );
};

export default ReportPreview;