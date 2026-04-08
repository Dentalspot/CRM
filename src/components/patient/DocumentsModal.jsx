import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  File,
  Image as ImageIcon,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';
import {
  uploadPatientDocument,
  getPatientDocuments,
  deletePatientDocument,
  downloadPatientDocument
} from '@/lib/patientApi';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type) => {
  if (type?.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />;
  if (type?.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

// Standardized props: isOpen, onOpenChange
const DocumentsModal = ({
  isOpen,
  onOpenChange,      // Standardized: replaces onClose
  patient,
  therapistId
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && patient?.id) {
      loadDocuments();
    }
  }, [isOpen, patient]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await getPatientDocuments(patient.id);
      setDocuments(docs || []);
    } catch (error) {
      logger.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo permitido es 50MB.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      await uploadPatientDocument(
        patient.id,
        therapistId,
        selectedFile,
        description
      );

      toast({
        title: "Éxito",
        description: "Documento subido correctamente.",
      });

      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      loadDocuments();

    } catch (error) {
      logger.error(error);
      toast({
        title: "Error",
        description: "Hubo un problema al subir el documento.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;

    try {
      await deletePatientDocument(docToDelete.id, docToDelete.file_path);
      toast({
        title: "Eliminado",
        description: "Documento eliminado correctamente.",
      });
      setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
    } catch (error) {
      logger.error(error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDocToDelete(null);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const url = await downloadPatientDocument(doc.file_path);
      window.open(url, '_blank');
    } catch (error) {
      logger.error(error);
      toast({
        title: "Error",
        description: "No se pudo generar el enlace de descarga.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Documentos del Paciente</DialogTitle>
            <DialogDescription>
              Gestiona archivos, informes y exámenes de {patient?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Upload Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}
                ${selectedFile ? 'bg-green-50 border-green-200' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!selectedFile ? (
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <Upload className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </h3>
                  <p className="text-xs text-gray-500">
                    PDF, Imágenes, Documentos hasta 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 text-green-700">
                    <FileText className="h-6 w-6" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm opacity-75">({formatFileSize(selectedFile.size)})</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-700 hover:text-green-900 hover:bg-green-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-w-sm mx-auto space-y-3 text-left">
                    <div>
                      <Label htmlFor="desc" className="text-xs">Descripción (opcional)</Label>
                      <Input
                        id="desc"
                        placeholder="Ej: Informe de evaluación inicial"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                    <div className="flex justify-center pt-2">
                      <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          'Subir Documento'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Archivos Existentes
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {documents.length}
                </span>
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  <p className="text-gray-500">No hay documentos subidos aún.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow group"
                    >
                      <div className="flex-shrink-0 mr-4">
                        {getFileIcon(doc.file_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.file_name}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{format(new Date(doc.created_at), "d MMM yyyy, HH:mm", { locale: es })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(doc)}
                          title="Descargar"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(doc)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo "{docToDelete?.file_name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DocumentsModal;