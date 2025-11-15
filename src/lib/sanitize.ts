import DOMPurify from 'dompurify';

/**
 * Sanitizes AI-generated content to prevent XSS attacks
 * @param content - The content to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeAIContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true,
  });
};
