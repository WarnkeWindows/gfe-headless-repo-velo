/**
 * Unified Wix Data Service
 * backend/core/wix-data-service.web.js
 * 
 * Main data access layer for all Wix collections
 * Implements CRUD operations with validation, sanitization, and error handling
 */

import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';
import { 
    COLLECTIONS, 
    FIELD_MAPPINGS, 
    VALIDATION_SCHEMAS, 
    UI_ELEMENT_IDS,
    MESSAGE_TYPES,
    SYSTEM_CONSTANTS,
    ERROR_CODES,
    getFieldMapping,
    getValidationSchema,
    generateUniqueId,
    createResponse
} from '../config/constants.web.js';

// =====================================================================
// VALIDATION FUNCTIONS
// =====================================================================

/**
 * Validates data against schema
 */
export function validateData(collectionName, data) {
    const schema = getValidationSchema(collectionName);
    const errors = [];
    const sanitized = {};
    
    // Check required fields
    for (const [fieldName, rules] of Object.entries(schema)) {
        const value = data[fieldName];
        
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${fieldName} is required`);
            continue;
        }
        
        if (value !== undefined && value !== null && value !== '') {
            // Type validation
            if (rules.type === 'string' && typeof value !== 'string') {
                errors.push(`${fieldName} must be a string`);
                continue;
            }
            
            if (rules.type === 'number' && typeof value !== 'number') {
                errors.push(`${fieldName} must be a number`);
                continue;
            }
            
            if (rules.type === 'boolean' && typeof value !== 'boolean') {
                errors.push(`${fieldName} must be a boolean`);
                continue;
            }
            
            if (rules.type === 'date' && !(value instanceof Date) && isNaN(Date.parse(value))) {
                errors.push(`${fieldName} must be a valid date`);
                continue;
            }
            
            if (rules.type === 'email' && !rules.pattern.test(value)) {
                errors.push(`${fieldName} must be a valid email address`);
                continue;
            }
            
            if (rules.type === 'phone' && !rules.pattern.test(value)) {
                errors.push(`${fieldName} must be a valid phone number`);
                continue;
            }
            
            if (rules.type === 'enum' && !rules.values.includes(value)) {
                errors.push(`${fieldName} must be one of: ${rules.values.join(', ')}`);
                continue;
            }
            
            // Length validation
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
                continue;
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
                continue;
            }
            
            // Number range validation
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${fieldName} must be at least ${rules.min}`);
                continue;
            }
            
            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${fieldName} must be no more than ${rules.max}`);
                continue;
            }
            
            sanitized[fieldName] = value;
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Sanitizes data for Wix storage
 */
export function sanitizeForWix(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            if (typeof value === 'string') {
                // Remove HTML tags and encode special characters
                sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
            } else if (value instanceof Date) {
                sanitized[key] = value;
            } else if (typeof value === 'object') {
                sanitized[key] = JSON.stringify(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
}

/**
 * Calculates universal inches for window measurements
 */
export function calculateUniversalInches(width, height) {
    if (!width || !height || width <= 0 || height <= 0) {
        return 0;
    }
    return (width * height) / 144; // Convert square inches to square feet, then to UI
}

// =====================================================================
// RESPONSE HELPERS
// =====================================================================

/**
 * Creates standardized success response
 */
export function createSuccessResponse(data, message = 'Operation successful') {
    return createResponse(true, data, message);
}

/**
 * Creates standardized error response
 */
export function createErrorResponse(error, context = '') {
    console.error(`❌ Error in ${context}:`, error);
    
    // Log error to analytics
    logSystemEvent({
        eventType: 'error',
        endpoint: context,
        message: error.message || error,
        details: error.stack || '',
        timestamp: new Date()
    }).catch(console.error);
    
    return createResponse(false, null, '', {
        code: error.code || ERROR_CODES.INTERNAL_ERROR,
        message: error.message || error,
        context
    });
}

// =====================================================================
// SYSTEM EVENT LOGGING
// =====================================================================

/**
 * Logs system events to Analytics collection
 */
export async function logSystemEvent(eventData) {
    try {
        const validation = validateData('analytics', {
            event: eventData.eventType || eventData.event || 'system_event',
            page: eventData.endpoint || eventData.page || 'backend',
            timestamp: eventData.timestamp || new Date(),
            userId: eventData.userId || 'system',
            sessionId: eventData.sessionId || generateUniqueId(),
            details: JSON.stringify({
                message: eventData.message || '',
                details: eventData.details || '',
                endpoint: eventData.endpoint || '',
                ...eventData
            })
        });
        
        if (!validation.isValid) {
            console.error('Invalid analytics data:', validation.errors);
            return false;
        }
        
        const sanitized = sanitizeForWix(validation.sanitized);
        await wixData.save(COLLECTIONS.analytics, sanitized);
        return true;
    } catch (error) {
        console.error('Failed to log system event:', error);
        return false;
    }
}

// =====================================================================
// CUSTOMER MANAGEMENT
// =====================================================================

/**
 * Creates a new customer lead
 */
export async function createLead(leadData) {
    try {
        // Validate lead data
        const validation = validateData('crmLeads', leadData);
        if (!validation.isValid) {
            return createErrorResponse({
                code: ERROR_CODES.VALIDATION_FAILED,
                message: validation.errors.join(', ')
            }, 'createLead');
        }
        
        // Add system fields
        const enrichedData = {
            ...validation.sanitized,
            createdAt: new Date(),
            status: leadData.status || SYSTEM_CONSTANTS.LEAD_STATUS.NEW,
            sessionId: leadData.sessionId || generateUniqueId()
        };
        
        // Sanitize for Wix
        const sanitized = sanitizeForWix(enrichedData);
        
        // Save to collection
        const result = await wixData.save(COLLECTIONS.crmLeads, sanitized);
        
        // Log event
        await logSystemEvent({
            eventType: 'lead_created',
            endpoint: 'createLead',
            leadId: result._id,
            customerEmail: leadData.email,
            source: leadData.source || 'unknown'
        });
        
        return createSuccessResponse(result, 'Lead created successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'createLead');
    }
}

/**
 * Retrieves customer lead by ID
 */
export async function getLead(leadId) {
    try {
        if (!leadId) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Lead ID is required'
            }, 'getLead');
        }
        
        const result = await wixData.get(COLLECTIONS.crmLeads, leadId);
        
        if (!result) {
            return createErrorResponse({
                code: ERROR_CODES.NOT_FOUND,
                message: 'Lead not found'
            }, 'getLead');
        }
        
        return createSuccessResponse(result, 'Lead retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getLead');
    }
}

/**
 * Updates customer lead
 */
export async function updateLead(leadId, updateData) {
    try {
        if (!leadId) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Lead ID is required'
            }, 'updateLead');
        }
        
        // Validate update data
        const validation = validateData('crmLeads', updateData);
        if (!validation.isValid) {
            return createErrorResponse({
                code: ERROR_CODES.VALIDATION_FAILED,
                message: validation.errors.join(', ')
            }, 'updateLead');
        }
        
        // Add update timestamp
        const enrichedData = {
            ...validation.sanitized,
            updatedAt: new Date()
        };
        
        // Sanitize for Wix
        const sanitized = sanitizeForWix(enrichedData);
        sanitized._id = leadId;
        
        // Update in collection
        const result = await wixData.update(COLLECTIONS.crmLeads, sanitized);
        
        // Log event
        await logSystemEvent({
            eventType: 'lead_updated',
            endpoint: 'updateLead',
            leadId: leadId,
            updatedFields: Object.keys(updateData)
        });
        
        return createSuccessResponse(result, 'Lead updated successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'updateLead');
    }
}

/**
 * Searches leads by criteria
 */
export async function searchLeads(criteria = {}) {
    try {
        let query = wixData.query(COLLECTIONS.crmLeads);
        
        // Apply filters
        if (criteria.email) {
            query = query.eq('email', criteria.email);
        }
        
        if (criteria.phone) {
            query = query.eq('phone', criteria.phone);
        }
        
        if (criteria.status) {
            query = query.eq('status', criteria.status);
        }
        
        if (criteria.source) {
            query = query.eq('source', criteria.source);
        }
        
        if (criteria.dateFrom) {
            query = query.ge('createdAt', new Date(criteria.dateFrom));
        }
        
        if (criteria.dateTo) {
            query = query.le('createdAt', new Date(criteria.dateTo));
        }
        
        // Apply sorting
        if (criteria.sortBy) {
            query = criteria.sortOrder === 'asc' 
                ? query.ascending(criteria.sortBy)
                : query.descending(criteria.sortBy);
        } else {
            query = query.descending('createdAt');
        }
        
        // Apply pagination
        if (criteria.limit) {
            query = query.limit(criteria.limit);
        }
        
        if (criteria.skip) {
            query = query.skip(criteria.skip);
        }
        
        const results = await query.find();
        
        return createSuccessResponse({
            items: results.items,
            totalCount: results.totalCount,
            hasNext: results.hasNext(),
            hasPrev: results.hasPrev()
        }, 'Search completed successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'searchLeads');
    }
}

// =====================================================================
// AI MEASUREMENTS
// =====================================================================

/**
 * Saves AI measurement analysis
 */
export async function saveAIMeasurement(measurementData) {
    try {
        // Validate measurement data
        const validation = validateData('aiMeasurements', measurementData);
        if (!validation.isValid) {
            return createErrorResponse({
                code: ERROR_CODES.VALIDATION_FAILED,
                message: validation.errors.join(', ')
            }, 'saveAIMeasurement');
        }
        
        // Calculate universal inches if width and height provided
        if (measurementData.width && measurementData.height) {
            validation.sanitized.universalInches = calculateUniversalInches(
                measurementData.width, 
                measurementData.height
            );
        }
        
        // Add system fields
        const enrichedData = {
            ...validation.sanitized,
            timestamp: measurementData.timestamp || new Date(),
            analysisId: generateUniqueId()
        };
        
        // Sanitize for Wix
        const sanitized = sanitizeForWix(enrichedData);
        
        // Save to collection
        const result = await wixData.save(COLLECTIONS.aiMeasurements, sanitized);
        
        // Log event
        await logSystemEvent({
            eventType: 'ai_measurement_saved',
            endpoint: 'saveAIMeasurement',
            analysisId: result.analysisId,
            customerId: measurementData.customerId,
            windowsDetected: measurementData.windowsDetected,
            confidenceScore: measurementData.confidenceScore
        });
        
        return createSuccessResponse(result, 'AI measurement saved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'saveAIMeasurement');
    }
}

/**
 * Retrieves AI measurements for a customer
 */
export async function getCustomerMeasurements(customerId) {
    try {
        if (!customerId) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Customer ID is required'
            }, 'getCustomerMeasurements');
        }
        
        const results = await wixData.query(COLLECTIONS.aiMeasurements)
            .eq('customerId', customerId)
            .descending('timestamp')
            .find();
        
        return createSuccessResponse(results.items, 'Measurements retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getCustomerMeasurements');
    }
}

// =====================================================================
// PRODUCT CATALOG
// =====================================================================

/**
 * Retrieves product catalog with filters
 */
export async function getProductCatalog(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.windowProductsCatalog);
        
        // Apply filters
        if (filters.brand) {
            query = query.eq('windowBrand', filters.brand);
        }
        
        if (filters.type) {
            query = query.eq('windowType', filters.type);
        }
        
        if (filters.material) {
            query = query.eq('materialCombination', filters.material);
        }
        
        if (filters.isActive !== undefined) {
            query = query.eq('isActive', filters.isActive);
        }
        
        // Apply sorting
        query = query.ascending('orderRank').ascending('windowBrand');
        
        const results = await query.find();
        
        return createSuccessResponse(results.items, 'Product catalog retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getProductCatalog');
    }
}

/**
 * Retrieves window brands
 */
export async function getWindowBrands() {
    try {
        const results = await wixData.query(COLLECTIONS.windowBrands)
            .ascending('orderRank')
            .find();
        
        return createSuccessResponse(results.items, 'Window brands retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getWindowBrands');
    }
}

/**
 * Retrieves window types
 */
export async function getWindowTypes() {
    try {
        const results = await wixData.query(COLLECTIONS.windowTypes)
            .ascending('orderRank')
            .find();
        
        return createSuccessResponse(results.items, 'Window types retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getWindowTypes');
    }
}

// =====================================================================
// QUOTE MANAGEMENT
// =====================================================================

/**
 * Creates a new quote
 */
export async function createQuote(quoteData) {
    try {
        // Validate quote data
        const validation = validateData('quotes', quoteData);
        if (!validation.isValid) {
            return createErrorResponse({
                code: ERROR_CODES.VALIDATION_FAILED,
                message: validation.errors.join(', ')
            }, 'createQuote');
        }
        
        // Add system fields
        const enrichedData = {
            ...validation.sanitized,
            quoteId: quoteData.quoteId || generateUniqueId(),
            dateCreated: new Date(),
            status: quoteData.status || SYSTEM_CONSTANTS.QUOTE_STATUS.DRAFT
        };
        
        // Sanitize for Wix
        const sanitized = sanitizeForWix(enrichedData);
        
        // Save to collection
        const result = await wixData.save(COLLECTIONS.quotes, sanitized);
        
        // Log event
        await logSystemEvent({
            eventType: 'quote_created',
            endpoint: 'createQuote',
            quoteId: result.quoteId,
            customerName: quoteData.customerName,
            totalAmount: quoteData.totalAmount
        });
        
        return createSuccessResponse(result, 'Quote created successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'createQuote');
    }
}

/**
 * Updates quote status
 */
export async function updateQuoteStatus(quoteId, status) {
    try {
        if (!quoteId || !status) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Quote ID and status are required'
            }, 'updateQuoteStatus');
        }
        
        const updateData = {
            _id: quoteId,
            status: status,
            updatedAt: new Date()
        };
        
        const result = await wixData.update(COLLECTIONS.quotes, updateData);
        
        // Log event
        await logSystemEvent({
            eventType: 'quote_status_updated',
            endpoint: 'updateQuoteStatus',
            quoteId: quoteId,
            newStatus: status
        });
        
        return createSuccessResponse(result, 'Quote status updated successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'updateQuoteStatus');
    }
}

// Export all functions for use in other modules
export {
    validateData,
    sanitizeForWix,
    calculateUniversalInches
};
