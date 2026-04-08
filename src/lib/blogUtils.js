
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { sanitizeHTML } from '@/lib/utils/sanitize';

export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content ? content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const sanitizeContent = (content) => sanitizeHTML(content);

export const generateExcerpt = (content, length = 160) => {
  if (!content) return '';
  const plainText = content.replace(/<[^>]+>/g, '');
  return plainText.length > length ? plainText.substring(0, length) + '...' : plainText;
};

export const formatDate = (dateString, formatStr = 'dd MMM, yyyy') => {
  if (!dateString) return '';
  return format(new Date(dateString), formatStr, { locale: es });
};

export const validateArticle = (article) => {
  const errors = {};
  if (!article.title || article.title.length < 5) errors.title = 'El título debe tener al menos 5 caracteres';
  if (!article.content || article.content.length < 20) errors.content = 'El contenido es muy corto';
  if (!article.category_id) errors.category_id = 'Debes seleccionar una categoría';
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateQuestion = (question) => {
  const errors = {};
  if (!question.title || question.title.length < 10) errors.title = 'El título debe ser descriptivo (mín. 10 caracteres)';
  if (!question.category_id) errors.category_id = 'Selecciona una categoría';
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAnswer = (answer) => {
  const errors = {};
  if (!answer.content || answer.content.length < 20) errors.content = 'La respuesta debe ser sustancial';
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
