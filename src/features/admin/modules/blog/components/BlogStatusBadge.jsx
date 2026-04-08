import React from 'react';
import { Badge } from '@/components/ui/badge';

const BlogStatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100',
    archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100',
    pending_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100',
    deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100',
  };
  
  const labels = {
    published: 'Publicado',
    draft: 'Borrador',
    scheduled: 'Programado',
    archived: 'Archivado',
    pending_review: 'En Revisión',
    deleted: 'Eliminado',
  };

  return (
    <Badge className={styles[status] || styles.draft} variant="outline">
      {labels[status] || status}
    </Badge>
  );
};

export default BlogStatusBadge;