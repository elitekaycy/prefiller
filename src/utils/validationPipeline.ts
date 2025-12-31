import { FieldMetadata, AIFieldResponse, ValidationResult } from '@/types';

export class ValidationPipeline {
  /**
   * Validate field value before filling
   */
  static validate(
    value: string,
    field: FieldMetadata,
    aiResponse: AIFieldResponse
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let correctedValue: string | undefined;

    if (field.required && !value.trim()) {
      errors.push('Required field cannot be empty');
    }

    const typeValidation = this.validateByType(value, field);
    errors.push(...typeValidation.errors);
    warnings.push(...typeValidation.warnings);

    if (field.pattern && value) {
      try {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          errors.push(`Doesn't match pattern: ${field.pattern}`);
        }
      } catch (e) {
        // Invalid regex, skip
      }
    }

    if (field.maxLength && value.length > field.maxLength) {
      errors.push(`Exceeds max length ${field.maxLength}`);
      correctedValue = value.slice(0, field.maxLength);
    }

    if (aiResponse.confidence < 70) {
      warnings.push(`Low confidence (${aiResponse.confidence}%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedValue,
    };
  }

  private static validateByType(
    value: string,
    field: FieldMetadata
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (field.type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Invalid email format');
        }
        break;

      case 'tel':
      case 'phone':
        const digits = value.replace(/\D/g, '');
        if (value && digits.length < 10) {
          warnings.push('Phone number may be incomplete');
        }
        break;

      case 'url':
        if (value) {
          try {
            new URL(value.startsWith('http') ? value : `https://${value}`);
          } catch {
            errors.push('Invalid URL format');
          }
        }
        break;

      case 'number':
      case 'range':
        if (value && isNaN(parseFloat(value))) {
          errors.push('Must be a number');
        }
        break;
    }

    return { errors, warnings };
  }
}
