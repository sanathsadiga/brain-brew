// Input validation and sanitization utilities

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove potentially dangerous characters and limit length
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent basic XSS
    .slice(0, 1000); // Limit length
};

export const sanitizeCommand = (command: string): string => {
  if (!command) return '';
  
  // Basic command sanitization - preserve necessary characters but remove dangerous patterns
  const sanitized = command
    .trim()
    .slice(0, 2000); // Limit length
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf\s+\//, // rm -rf /
    /:\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;/, // Fork bomb pattern
    /eval\s*\(/, // eval commands
    /exec\s*\(/, // exec commands
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Command contains potentially dangerous patterns');
    }
  }
  
  return sanitized;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateTags = (tags: string[]): string[] => {
  return tags
    .filter(tag => tag && typeof tag === 'string')
    .map(tag => sanitizeText(tag))
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10); // Limit number of tags
};