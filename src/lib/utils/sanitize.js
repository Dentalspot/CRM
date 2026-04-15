
import DOMPurify from 'dompurify';

export const sanitizeHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};

/**
 * Escapa caracteres HTML peligrosos en strings de texto plano.
 * Usar en template literals de document.write() para datos que NO
 * deben contener HTML (nombres, RUTs, títulos, fechas).
 */
export const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Sanitiza un documento HTML completo preservando <html>, <head>,
 * <body>, <style> y estilos inline — necesario para reportes clínicos
 * almacenados que usan CSS de impresión.
 *
 * Stripea <script> y todos los event handlers inline (onclick, onerror, etc.).
 */
export const sanitizeFullHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
  });
};
