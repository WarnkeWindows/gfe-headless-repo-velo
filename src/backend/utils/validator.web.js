/**
 * Validation Utility Service
 * File: backend/utils/validator.web.js
 * 
 * Input validation and sanitization utilities
 */

import { VALIDATION_RULES, ERROR_CODES } from '../config/constants.web.js';

// =====================================================================
// VALIDATION FUNCTIONS
// =====================================================================

/**
 * Validate input data against rules
 * @param {Object} data - Data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
 */
export function validateInput(data, rules = {}) {
    const errors = [];
    const warnings = [];

    // Apply default validation rules if none provided
    const validationRules = { ...VALIDATION_RULES, ...rules };

    // Validate each field
    for (const [field, value] of Object.entries(data)) {
        const fieldErrors = validateField(field, value, validationRules);
        errors.push(...fieldErrors);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

/**
 * Validate individual field
 * @param {string} fieldName - Name of the field
 * @param {any} value - Value to validate
 * @param {Object} rules - Validation rules
 * @returns {Array} Array of error messages
 */
function validateField(fieldName, value, rules) {
    const errors = [];

    // Check if field is required
    if (rules.required && rules.required.includes(fieldName)) {
        if (value === null || value === undefined || value === '') {
            errors.push(`${fieldName} is required`);
            return errors; // Skip other validations if required field is missing
        }
    }

    // Skip validation if value is empty and field is not required
    if (value === null || value === undefined || value === '') {
        return errors;
    }

    // Email validation
    if (fieldName === 'email' || fieldName.includes('email')) {
        if (!rules.EMAIL.test(value)) {
            errors.push(`${fieldName} must be a valid email address`);
        }
    }

    // Phone validation
    if (fieldName === 'phone' || fieldName.includes('phone')) {
        const cleanPhone = value.replace(/\D/g, '');
        if (!rules.PHONE.test(cleanPhone)) {
            errors.push(`${fieldName} must be a valid phone number`);
        }
    }

    // Postal code validation
    if (fieldName === 'postalCode' || fieldName === 'zipCode') {
        if (!rules.POSTAL_CODE.test(value)) {
            errors.push(`${fieldName} must be a valid postal code`);
        }
    }

    // Length validation
    if (rules.FIELD_LENGTHS && rules.FIELD_LENGTHS[fieldName]) {
        const lengthRule = rules.FIELD_LENGTHS[fieldName];
        
        if (lengthRule.min && value.length < lengthRule.min) {
            errors.push(`${fieldName} must be at least ${lengthRule.min} characters`);
        }
        
        if (lengthRule.max && value.length > lengthRule.max) {
            errors.push(`${fieldName} must be no more than ${lengthRule.max} characters`);
        }
    }

    // Number validation
    if (typeof value === 'number' || !isNaN(value)) {
        const numValue = Number(value);
        
        if (rules.numberRanges && rules.numberRanges[fieldName]) {
            const range = rules.numberRanges[fieldName];
            
            if (range.min !== undefined && numValue < range.min) {
                errors.push(`${fieldName} must be at least ${range.min}`);
            }
            
            if (range.max !== undefined && numValue > range.max) {
                errors.push(`${fieldName} must be no more than ${range.max}`);
            }
        }
    }

    return errors;
}

/**
 * Sanitize input data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeInput(data) {
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Trim whitespace
            let sanitizedValue = value.trim();
            
            // Remove potentially dangerous characters
            sanitizedValue = sanitizedValue.replace(/[<>]/g, '');
            
            // Normalize phone numbers
            if (key === 'phone' || key.includes('phone')) {
                sanitizedValue = sanitizedValue.replace(/\D/g, '');
                if (sanitizedValue.length === 10) {
                    sanitizedValue = `+1${sanitizedValue}`;
                }
            }
            
            // Normalize email
            if (key === 'email' || key.includes('email')) {
                sanitizedValue = sanitizedValue.toLowerCase();
            }
            
            sanitized[key] = sanitizedValue;
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Validate image data
 * @param {string} imageData - Base64 image data
 * @returns {Object} Validation result
 */
export function validateImageData(imageData) {
    const errors = [];

    if (!imageData || typeof imageData !== 'string') {
        errors.push('Image data is required');
        return { isValid: false, errors };
    }

    // Check if it's base64 encoded
    const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!base64Pattern.test(imageData)) {
        errors.push('Image must be base64 encoded JPEG, PNG, or WebP');
    }

    // Check file size (approximate)
    const base64Data = imageData.split(',')[1];
    if (base64Data) {
        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > VALIDATION_RULES.IMAGE_CONSTRAINTS.MAX_SIZE) {
            errors.push(`Image size must be less than ${VALIDATION_RULES.IMAGE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate product data
 * @param {Object} product - Product data
 * @returns {Object} Validation result
 */
export function validateProductData(product) {
    const errors = [];

    const requiredFields = ['productId', 'brand', 'name', 'type', 'pricePerUi'];
    
    for (const field of requiredFields) {
        if (!product[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate price
    if (product.pricePerUi && (isNaN(product.pricePerUi) || product.pricePerUi <= 0)) {
        errors.push('Price per UI must be a positive number');
    }

    // Validate energy rating
    if (product.energyRating && (isNaN(product.energyRating) || product.energyRating < 1 || product.energyRating > 10)) {
        errors.push('Energy rating must be between 1 and 10');
    }

    // Validate warranty years
    if (product.warrantyYears && (isNaN(product.warrantyYears) || product.warrantyYears < 0)) {
        errors.push('Warranty years must be a non-negative number');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate quote data
 * @param {Object} quote - Quote data
 * @returns {Object} Validation result
 */
export function validateQuoteData(quote) {
    const errors = [];

    // Required fields
    const requiredFields = ['customerId', 'products', 'windowCount'];
    
    for (const field of requiredFields) {
        if (!quote[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate products array
    if (quote.products) {
        if (!Array.isArray(quote.products)) {
            errors.push('Products must be an array');
        } else if (quote.products.length === 0) {
            errors.push('At least one product is required');
        } else {
            // Validate each product
            quote.products.forEach((product, index) => {
                const productValidation = validateProductData(product);
                if (!productValidation.isValid) {
                    errors.push(`Product ${index + 1}: ${productValidation.errors.join(', ')}`);
                }
            });
        }
    }

    // Validate window count
    if (quote.windowCount && (isNaN(quote.windowCount) || quote.windowCount < 1)) {
        errors.push('Window count must be at least 1');
    }

    // Validate costs if provided
    const costFields = ['materialCost', 'laborCost', 'totalCost'];
    for (const field of costFields) {
        if (quote[field] && (isNaN(quote[field]) || quote[field] < 0)) {
            errors.push(`${field} must be a non-negative number`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate measurement data
 * @param {Object} measurement - Measurement data
 * @returns {Object} Validation result
 */
export function validateMeasurementData(measurement) {
    const errors = [];

    // Required fields
    const requiredFields = ['customerId', 'analysisId'];
    
    for (const field of requiredFields) {
        if (!measurement[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate dimensions
    if (measurement.imageWidth && (isNaN(measurement.imageWidth) || measurement.imageWidth <= 0)) {
        errors.push('Image width must be a positive number');
    }

    if (measurement.imageHeight && (isNaN(measurement.imageHeight) || measurement.imageHeight <= 0)) {
        errors.push('Image height must be a positive number');
    }

    // Validate confidence score
    if (measurement.confidenceScore && (isNaN(measurement.confidenceScore) || measurement.confidenceScore < 0 || measurement.confidenceScore > 1)) {
        errors.push('Confidence score must be between 0 and 1');
    }

    // Validate windows detected
    if (measurement.windowsDetected && (isNaN(measurement.windowsDetected) || measurement.windowsDetected < 0)) {
        errors.push('Windows detected must be a non-negative number');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Create validation error response
 * @param {Array} errors - Array of error messages
 * @returns {Object} Error response object
 */
export function createValidationError(errors) {
    return {
        error: 'Validation failed',
        details: errors,
        code: ERROR_CODES.INVALID_INPUT,
        timestamp: new Date().toISOString()
    };
}

/**
 * Validate API request structure
 * @param {Object} request - Request object
 * @param {Array} requiredFields - Required fields
 * @returns {Object} Validation result
 */
export function validateApiRequest(request, requiredFields = []) {
    const errors = [];

    // Check for required fields
    for (const field of requiredFields) {
        if (!request[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate request structure
    if (typeof request !== 'object') {
        errors.push('Request must be a valid object');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate pagination parameters
 * @param {Object} params - Pagination parameters
 * @returns {Object} Validated parameters
 */
export function validatePagination(params) {
    const validated = {
        limit: 50,
        offset: 0
    };

    if (params.limit) {
        const limit = parseInt(params.limit);
        if (!isNaN(limit) && limit > 0 && limit <= 100) {
            validated.limit = limit;
        }
    }

    if (params.offset) {
        const offset = parseInt(params.offset);
        if (!isNaN(offset) && offset >= 0) {
            validated.offset = offset;
        }
    }

    return validated;
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
    validateInput,
    sanitizeInput,
    validateImageData,
    validateProductData,
    validateQuoteData,
    validateMeasurementData,
    createValidationError,
    validateApiRequest,
    validatePagination
};

