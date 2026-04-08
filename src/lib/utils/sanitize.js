
import DOMPurify from 'dompurify';

export const sanitizeHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};
