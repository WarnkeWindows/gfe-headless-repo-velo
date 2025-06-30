/**
 * GFlow System - Utility Functions and Helper Modules
 * Common utilities supporting FLF implementation and system operations
 * 
 * @author Manus AI
 * @version 1.0.0
 * @date 2025-12-21
 */

import { v4 as uuidv4 } from 'uuid';
import { CollectionName } from '../types/wix-collections';
import { FieldDataType } from '../types/flf-mapping';

/**
 * Data transformation utilities
 */
export class DataUtils {
  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert camelCase to kebab-case
   */
  static camelToKebab(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  /**
   * Convert kebab-case to camelCase
   */
  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }

    return obj;
  }

  /**
   * Merge objects deeply
   */
  static deepMerge<T>(target: T, source: Partial<T>): T {
    const result = this.deepClone(target);

    Object.keys(source).forEach(key => {
      const sourceValue = (source as any)[key];
      const targetValue = (result as any)[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        (result as any)[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        (result as any)[key] = sourceValue;
      }
    });

    return result;
  }

  /**
   * Check if value is a plain object
   */
  static isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
  }

  /**
   * Flatten nested object to dot notation
   */
  static flatten(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (this.isObject(value)) {
        Object.assign(flattened, this.flatten(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });

    return flattened;
  }

  /**
   * Unflatten dot notation object to nested structure
   */
  static unflatten(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const keys = key.split('.');
      let current = result;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          current[k] = obj[key];
        } else {
          if (!current[k]) {
            current[k] = {};
          }
          current = current[k];
        }
      });
    });

    return result;
  }

  /**
   * Remove undefined and null values from object
   */
  static removeEmpty(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (value !== null && value !== undefined) {
        if (this.isObject(value)) {
          const cleanedNested = this.removeEmpty(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else if (Array.isArray(value)) {
          const cleanedArray = value.filter(item => item !== null && item !== undefined);
          if (cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
          }
        } else {
          cleaned[key] = value;
        }
      }
    });

    return cleaned;
  }
}

/**
 * String manipulation utilities
 */
export class StringUtils {
  /**
   * Capitalize first letter of string
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert string to title case
   */
  static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Generate slug from string
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, length: number, suffix = '...'): string {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Generate random string
   */
  static randomString(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Mask sensitive data
   */
  static mask(str: string, visibleChars = 4, maskChar = '*'): string {
    if (str.length <= visibleChars) {
      return maskChar.repeat(str.length);
    }
    const visible = str.slice(-visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars);
    return masked + visible;
  }

  /**
   * Extract initials from name
   */
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
  }
}

/**
 * Date and time utilities
 */
export class DateUtils {
  /**
   * Format date to ISO string
   */
  static toISOString(date: Date | string): string {
    return new Date(date).toISOString();
  }

  /**
   * Format date for display
   */
  static formatDate(date: Date | string, format = 'MM/DD/YYYY'): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return d.toLocaleDateString();
    }
  }

  /**
   * Format time for display
   */
  static formatTime(date: Date | string, format24Hour = false): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { 
      hour12: !format24Hour,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(date: Date | string): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return this.formatDate(target);
  }

  /**
   * Add time to date
   */
  static addTime(date: Date | string, amount: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months'): Date {
    const d = new Date(date);
    
    switch (unit) {
      case 'minutes':
        d.setMinutes(d.getMinutes() + amount);
        break;
      case 'hours':
        d.setHours(d.getHours() + amount);
        break;
      case 'days':
        d.setDate(d.getDate() + amount);
        break;
      case 'weeks':
        d.setDate(d.getDate() + (amount * 7));
        break;
      case 'months':
        d.setMonth(d.getMonth() + amount);
        break;
    }
    
    return d;
  }

  /**
   * Check if date is within business hours
   */
  static isBusinessHours(date: Date | string, startHour = 9, endHour = 17): boolean {
    const d = new Date(date);
    const hour = d.getHours();
    const day = d.getDay();
    
    // Check if weekend (Saturday = 6, Sunday = 0)
    if (day === 0 || day === 6) {
      return false;
    }
    
    return hour >= startHour && hour < endHour;
  }
}

/**
 * Validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate credit card number (Luhn algorithm)
   */
  static isValidCreditCard(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain special characters');
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }
}

/**
 * File and media utilities
 */
export class FileUtils {
  /**
   * Get file extension
   */
  static getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if file type is supported image format
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const extension = this.getExtension(filename);
    return imageExtensions.includes(extension);
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const extension = this.getExtension(originalName);
    const baseName = originalName.replace(`.${extension}`, '');
    const timestamp = Date.now();
    const random = StringUtils.randomString(6);
    
    return `${StringUtils.slugify(baseName)}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Compress image file
   */
  static async compressImage(file: File, quality = 0.8, maxWidth = 1920, maxHeight = 1080): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Create standardized error response
   */
  static createErrorResponse(
    message: string,
    code: string,
    statusCode = 500,
    details?: any
  ): ErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
        statusCode,
        details,
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      }
    };
  }

  /**
   * Create success response
   */
  static createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Handle async errors with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  /**
   * Log error with context
   */
  static logError(error: Error, context?: Record<string, any>): void {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    console.error('Error logged:', errorLog);
    
    // In production, this would send to logging service
    // Example: LoggingService.error(errorLog);
  }
}

/**
 * API response interfaces
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Universal Inches calculation utility
 */
export class WindowMeasurementUtils {
  /**
   * Calculate Universal Inches from width and height
   * Formula: (Width - 4) + (Height - 4) = Universal Inches
   * Subtracts 2 inches from each side for trim
   */
  static calculateUniversalInches(width: number, height: number): number {
    const adjustedWidth = Math.max(0, width - 4);
    const adjustedHeight = Math.max(0, height - 4);
    return adjustedWidth + adjustedHeight;
  }

  /**
   * Calculate window area in square inches
   */
  static calculateArea(width: number, height: number): number {
    return width * height;
  }

  /**
   * Calculate window perimeter
   */
  static calculatePerimeter(width: number, height: number): number {
    return 2 * (width + height);
  }

  /**
   * Validate window measurements
   */
  static validateMeasurements(width: number, height: number): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Basic validation
    if (width <= 0) errors.push('Width must be positive');
    if (height <= 0) errors.push('Height must be positive');

    // Reasonable size checks
    if (width > 120) warnings.push('Width seems unusually large (>10 feet)');
    if (height > 120) warnings.push('Height seems unusually large (>10 feet)');
    if (width < 12) warnings.push('Width seems unusually small (<1 foot)');
    if (height < 12) warnings.push('Height seems unusually small (<1 foot)');

    // Aspect ratio checks
    const aspectRatio = width / height;
    if (aspectRatio > 4) warnings.push('Window is very wide relative to height');
    if (aspectRatio < 0.25) warnings.push('Window is very tall relative to width');

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Convert pixels to inches using reference object
   */
  static pixelsToInches(
    pixelMeasurement: number,
    referencePixels: number,
    referenceInches: number
  ): number {
    return (pixelMeasurement * referenceInches) / referencePixels;
  }

  /**
   * Standard reference object dimensions
   */
  static readonly REFERENCE_OBJECTS = {
    POST_IT_NOTE: { width: 3, height: 3 },
    CREDIT_CARD: { width: 3.375, height: 2.125 },
    DOLLAR_BILL: { width: 6.14, height: 2.61 },
    QUARTER: { diameter: 0.955 },
    BUSINESS_CARD: { width: 3.5, height: 2 }
  };
}

export {
  DataUtils,
  StringUtils,
  DateUtils,
  ValidationUtils,
  FileUtils,
  ErrorUtils,
  WindowMeasurementUtils
};

