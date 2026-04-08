import React from 'react';
import usePatientImport from './hooks/usePatientImport';
import StepIndicator from './components/StepIndicator';
import UploadStep from './components/UploadStep';
import MappingStep from './components/MappingStep';
import PreviewStep from './components/PreviewStep';
import ImportingStep from './components/ImportingStep';

const ImportPatientsPage = () => {
  const {
    step, setStep, fileName, rawData, headers, columnMap, setColumnMap,
    importing, importProgress, importResults, source, setSource,
    hasRequiredFields, validRows, previewData, duplicateEmails,
    handleFile, handleImport, reset,
  } = usePatientImport();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Pacientes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube tu archivo CSV o Excel desde Doctoralia, AgendaPro, Medilink o cualquier otra plataforma.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {step === 0 && <UploadStep source={source} setSource={setSource} onFile={handleFile} />}
      {step === 1 && <MappingStep headers={headers} rawData={rawData} columnMap={columnMap} setColumnMap={setColumnMap} hasRequired={hasRequiredFields} fileName={fileName} onNext={() => setStep(2)} onBack={reset} />}
      {step === 2 && <PreviewStep previewData={previewData} validRows={validRows} duplicateEmails={duplicateEmails} columnMap={columnMap} onImport={handleImport} onBack={() => setStep(1)} />}
      {step === 3 && <ImportingStep importing={importing} progress={importProgress} results={importResults} onReset={reset} />}
    </div>
  );
};

export default ImportPatientsPage;