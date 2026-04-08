import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Modal to upload new datasets.
 */
const DatasetUploadModal = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>Subir Dataset</DialogTitle></DialogHeader>
      {/* Upload logic */}
    </DialogContent>
  </Dialog>
);

export default DatasetUploadModal;