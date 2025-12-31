import { describe, it, expect } from 'vitest';
import { ValidationPipeline } from '../validationPipeline';
import { FieldMetadata, AIFieldResponse } from '@/types';

describe('ValidationPipeline', () => {
  describe('validate', () => {
    it('should reject empty required fields', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Name',
        placeholder: '',
        name: 'name',
        id: 'name',
        required: true,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: '',
        confidence: 80,
        reasoning: 'Empty value',
        source: 'test',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('', field, aiResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Required field cannot be empty');
    });

    it('should accept non-empty required fields', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Name',
        placeholder: '',
        name: 'name',
        id: 'name',
        required: true,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'John Doe',
        confidence: 95,
        reasoning: 'Found in document',
        source: 'resume.pdf',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('John Doe', field, aiResponse);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid email addresses', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'email',
        label: 'Email',
        placeholder: '',
        name: 'email',
        id: 'email',
        required: true,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'notanemail',
        confidence: 80,
        reasoning: 'Attempted extraction',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('notanemail', field, aiResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should accept valid email addresses', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'email',
        label: 'Email',
        placeholder: '',
        name: 'email',
        id: 'email',
        required: true,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'test@example.com',
        confidence: 95,
        reasoning: 'Found email',
        source: 'resume.pdf',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('test@example.com', field, aiResponse);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should warn on low confidence', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Name',
        placeholder: '',
        name: 'name',
        id: 'name',
        required: false,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'Guess',
        confidence: 50,
        reasoning: 'Low confidence guess',
        source: 'inference',
        needsReview: true,
      };

      const result = ValidationPipeline.validate('Guess', field, aiResponse);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Low confidence'))).toBe(true);
    });

    it('should validate phone numbers', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'tel',
        label: 'Phone',
        placeholder: '',
        name: 'phone',
        id: 'phone',
        required: false,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: '123',
        confidence: 60,
        reasoning: 'Partial phone',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('123', field, aiResponse);

      expect(result.warnings.some(w => w.includes('incomplete'))).toBe(true);
    });

    it('should handle URL validation gracefully', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'url',
        label: 'Website',
        placeholder: '',
        name: 'website',
        id: 'website',
        required: false,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'example.com',
        confidence: 70,
        reasoning: 'Attempted URL',
        source: 'document',
        needsReview: false,
      };

      // Should not crash - URL validation accepts many formats
      const result = ValidationPipeline.validate('example.com', field, aiResponse);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should accept valid URLs', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'url',
        label: 'Website',
        placeholder: '',
        name: 'website',
        id: 'website',
        required: false,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'https://example.com',
        confidence: 95,
        reasoning: 'Found URL',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('https://example.com', field, aiResponse);

      expect(result.isValid).toBe(true);
    });

    it('should validate number fields', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'number',
        label: 'Age',
        placeholder: '',
        name: 'age',
        id: 'age',
        required: false,
        description: '',
        context: '',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'not-a-number',
        confidence: 60,
        reasoning: 'Failed conversion',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('not-a-number', field, aiResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must be a number');
    });

    it('should enforce maxLength and provide corrected value', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Name',
        placeholder: '',
        name: 'name',
        id: 'name',
        required: false,
        description: '',
        context: '',
        maxLength: 10,
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'This is a very long name',
        confidence: 80,
        reasoning: 'Found name',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('This is a very long name', field, aiResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('max length'))).toBe(true);
      expect(result.correctedValue).toBe('This is a ');
      expect(result.correctedValue?.length).toBe(10);
    });

    it('should validate pattern matching', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Code',
        placeholder: '',
        name: 'code',
        id: 'code',
        required: false,
        description: '',
        context: '',
        pattern: '^[A-Z]{3}$',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'abc',
        confidence: 75,
        reasoning: 'Found code',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('abc', field, aiResponse);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('pattern'))).toBe(true);
    });

    it('should pass valid pattern matching', () => {
      const field: FieldMetadata = {
        element: document.createElement('input'),
        type: 'text',
        label: 'Code',
        placeholder: '',
        name: 'code',
        id: 'code',
        required: false,
        description: '',
        context: '',
        pattern: '^[A-Z]{3}$',
      };

      const aiResponse: AIFieldResponse = {
        fieldIndex: 1,
        value: 'ABC',
        confidence: 95,
        reasoning: 'Found code',
        source: 'document',
        needsReview: false,
      };

      const result = ValidationPipeline.validate('ABC', field, aiResponse);

      expect(result.isValid).toBe(true);
    });
  });
});
