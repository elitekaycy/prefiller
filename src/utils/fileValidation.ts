/**
 * File Validation Utility
 *
 * Provides secure file validation using magic bytes and content sanitization
 * to prevent XSS, malicious file uploads, and other security vulnerabilities.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  warnings?: string[];
}

interface FileSizeLimit {
  maxSize: number; // in bytes
  displaySize: string; // for error messages
}

interface MagicBytePattern {
  signature: number[];
  offset?: number;
  mask?: number[];
}

/**
 * Magic byte signatures for file type detection
 * Source: https://en.wikipedia.org/wiki/List_of_file_signatures
 */
const MAGIC_BYTES: Record<string, MagicBytePattern[]> = {
  'application/pdf': [
    { signature: [0x25, 0x50, 0x44, 0x46, 0x2D], offset: 0 }, // %PDF-
  ],
  'text/plain': [
    // Text files don't have a magic byte signature, validated by content
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    // DOCX is a ZIP file, check for ZIP signature
    { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0 }, // PK..
  ],
  'application/msword': [
    // DOC file signature
    { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], offset: 0 },
  ],
};

/**
 * File size limits by MIME type
 */
const SIZE_LIMITS: Record<string, FileSizeLimit> = {
  'application/pdf': {
    maxSize: 5 * 1024 * 1024, // 5 MB
    displaySize: '5 MB',
  },
  'text/plain': {
    maxSize: 1 * 1024 * 1024, // 1 MB
    displaySize: '1 MB',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    maxSize: 3 * 1024 * 1024, // 3 MB
    displaySize: '3 MB',
  },
  'application/msword': {
    maxSize: 3 * 1024 * 1024, // 3 MB
    displaySize: '3 MB',
  },
};

/**
 * Default size limit for unknown types
 */
const DEFAULT_SIZE_LIMIT: FileSizeLimit = {
  maxSize: 2 * 1024 * 1024, // 2 MB
  displaySize: '2 MB',
};

/**
 * Allowed MIME types
 */
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

/**
 * Suspicious patterns in extracted content
 */
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
  /eval\s*\(/gi,
  /data:text\/html/gi,
];

export class FileValidator {
  /**
   * Validate a file before processing
   */
  static async validate(file: File): Promise<FileValidationResult> {
    const warnings: string[] = [];

    // 1. Check if file type is allowed
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported: ${file.type}. Allowed types: PDF, TXT, DOC, DOCX`,
      };
    }

    // 2. Check file size
    const sizeLimit = SIZE_LIMITS[file.type] || DEFAULT_SIZE_LIMIT;
    if (file.size > sizeLimit.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${sizeLimit.displaySize} limit. File size: ${this.formatFileSize(file.size)}`,
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty',
      };
    }

    // 3. Validate magic bytes (file signature)
    const magicBytesValid = await this.validateMagicBytes(file);
    if (!magicBytesValid.valid) {
      return magicBytesValid;
    }

    // 4. Check file name for suspicious patterns
    if (this.hasSuspiciousFileName(file.name)) {
      warnings.push('File name contains unusual characters');
    }

    return {
      valid: true,
      detectedType: file.type,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate file magic bytes match declared MIME type
   */
  private static async validateMagicBytes(file: File): Promise<FileValidationResult> {
    // Skip magic byte validation for text files (they don't have a signature)
    if (file.type === 'text/plain') {
      // For text files, check if content is valid UTF-8
      try {
        const content = await this.readFileAsText(file);
        if (!this.isValidUTF8(content)) {
          return {
            valid: false,
            error: 'File appears to be corrupted or not a valid text file',
          };
        }
        return { valid: true };
      } catch (error) {
        return {
          valid: false,
          error: 'Failed to read file as text',
        };
      }
    }

    const patterns = MAGIC_BYTES[file.type];
    if (!patterns || patterns.length === 0) {
      // No magic bytes defined, skip validation
      return { valid: true };
    }

    try {
      const header = await this.readFileHeader(file, 512); // Read first 512 bytes

      for (const pattern of patterns) {
        if (this.matchesMagicBytes(header, pattern)) {
          return { valid: true, detectedType: file.type };
        }
      }

      return {
        valid: false,
        error: `File signature does not match ${file.type}. The file may be corrupted or mislabeled.`,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Read file header bytes
   */
  private static async readFileHeader(file: File, length: number): Promise<Uint8Array> {
    const slice = file.slice(0, length);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }

  /**
   * Read entire file as text
   */
  private static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Check if bytes match a magic byte pattern
   */
  private static matchesMagicBytes(bytes: Uint8Array, pattern: MagicBytePattern): boolean {
    const offset = pattern.offset || 0;
    const signature = pattern.signature;

    if (bytes.length < offset + signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (bytes[offset + i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if string is valid UTF-8
   */
  private static isValidUTF8(str: string): boolean {
    // Check for null bytes or other invalid characters
    return !str.includes('\u0000') && str.trim().length > 0;
  }

  /**
   * Check file name for suspicious patterns
   */
  private static hasSuspiciousFileName(fileName: string): boolean {
    // Check for double extensions, null bytes, path traversal
    const suspicious = [
      /\.\./g, // Path traversal
      /\x00/g, // Null bytes
      /\.(exe|bat|cmd|sh|ps1|vbs|scr)$/i, // Executable extensions
    ];

    return suspicious.some(pattern => pattern.test(fileName));
  }

  /**
   * Sanitize extracted text content to prevent XSS
   */
  static sanitizeText(text: string): string {
    if (!text) return '';

    let sanitized = text;

    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }

    // Encode special characters
    sanitized = this.encodeHTMLEntities(sanitized);

    return sanitized;
  }

  /**
   * Encode HTML entities to prevent XSS
   */
  private static encodeHTMLEntities(str: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'/]/g, char => entities[char] || char);
  }

  /**
   * Check extracted content for suspicious patterns
   */
  static hasSuspiciousContent(text: string): { suspicious: boolean; patterns: string[] } {
    const foundPatterns: string[] = [];

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        foundPatterns.push(pattern.source);
      }
    }

    return {
      suspicious: foundPatterns.length > 0,
      patterns: foundPatterns,
    };
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Get file size limit for a type
   */
  static getSizeLimit(mimeType: string): FileSizeLimit {
    return SIZE_LIMITS[mimeType] || DEFAULT_SIZE_LIMIT;
  }

  /**
   * Check if file type is supported
   */
  static isSupportedType(mimeType: string): boolean {
    return ALLOWED_TYPES.includes(mimeType);
  }

  /**
   * Get list of supported file types
   */
  static getSupportedTypes(): string[] {
    return [...ALLOWED_TYPES];
  }
}
