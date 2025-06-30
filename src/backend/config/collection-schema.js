/**
 * Wix Collection Schemas and Field Mappings
 * File: backend/config/collection-schemas.js
 * 
 * Complete field definitions and mappings for all Wix collections
 * Implements Field Label Functioning (FLF) for unified data handling
 */

// =====================================================================
// COLLECTION FIELD SCHEMAS
// =====================================================================

/**
 * CRM Leads Collection Schema
 * Collection ID: CRMLeads
 */
export const CRM_LEADS_SCHEMA = {
    collectionId: 'CRMLeads',
    displayName: 'CRM Leads',
    fields: {
        // Primary Fields
        fullName: {
            type: 'text',
            displayName: 'Full Name',
            required: true,
            maxLength: 100
        },
        email: {
            type: 'text',
            displayName: 'Email',
            required: true,
            maxLength: 255
        },
        phone: {
            type: 'text',
            displayName: 'Phone',
            required: true,
            maxLength: 20
        },
        
        // Address Information
        address: {
            type: 'text',
            displayName: 'Address',
            required: false,
            maxLength: 500
        },
        city: {
            type: 'text',
            displayName: 'City',
            required: false,
            maxLength: 100
        },
        state: {
            type: 'text',
            displayName: 'State',
            required: false,
            maxLength: 50
        },
        zipCode: {
            type: 'text',
            displayName: 'ZIP Code',
            required: false,
            maxLength: 10
        },
        
        // Project Information
        projectType: {
            type: 'text',
            displayName: 'Project Type',
            required: false,
            options: ['replacement', 'new-construction', 'renovation', 'commercial']
        },
        windowCount: {
            type: 'number',
            displayName: 'Window Count',
            required: false,
            min: 1,
            max: 100
        },
        estimatedBudget: {
            type: 'number',
            displayName: 'Estimated Budget',
            required: false,
            min: 0
        },
        
        // Lead Management
        source: {
            type: 'text',
            displayName: 'Lead Source',
            required: false,
            options: ['website', 'ai-window-estimator', 'referral', 'advertising', 'social-media']
        },
        status: {
            type: 'text',
            displayName: 'Status',
            required: true,
            options: ['new', 'contacted', 'qualified', 'quoted', 'converted', 'lost']
        },
        leadScore: {
            type: 'number',
            displayName: 'Lead Score',
            required: false,
            min: 0,
            max: 100
        },
        priority: {
            type: 'text',
            displayName: 'Priority',
            required: false,
            options: ['low', 'medium', 'high', 'urgent']
        },
        
        // Communication
        notes: {
            type: 'richText',
            displayName: 'Notes',
            required: false
        },
        lastContactDate: {
            type: 'dateTime',
            displayName: 'Last Contact Date',
            required: false
        },
        nextFollowUpDate: {
            type: 'dateTime',
            displayName: 'Next Follow-up Date',
            required: false
        },
        
        // System Fields
        sessionId: {
            type: 'text',
            displayName: 'Session ID',
            required: false,
            maxLength: 100
        },
        ipAddress: {
            type: 'text',
            displayName: 'IP Address',
            required: false,
            maxLength: 45
        },
        userAgent: {
            type: 'text',
            displayName: 'User Agent',
            required: false,
            maxLength: 500
        },
        referrerUrl: {
            type: 'url',
            displayName: 'Referrer URL',
            required: false
        }
    },
    
    // Collection Permissions
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    },
    
    // Indexes for performance
    indexes: [
        { fields: ['email'], unique: true },
        { fields: ['status'] },
        { fields: ['source'] },
        { fields: ['leadScore'] },
        { fields: ['_createdDate'] }
    ]
};

/**
 * AI Window Measurements Collection Schema
 * Collection ID: AIWindowMeasurements
 */
export const AI_WINDOW_MEASUREMENTS_SCHEMA = {
    collectionId: 'AIWindowMeasurements',
    displayName: 'AI Window Measurements',
    fields: {
        // Reference Fields
        customerId: {
            type: 'text',
            displayName: 'Customer ID',
            required: true,
            maxLength: 100
        },
        analysisId: {
            type: 'text',
            displayName: 'Analysis ID',
            required: true,
            maxLength: 100
        },
        
        // Image Information
        imageWidth: {
            type: 'number',
            displayName: 'Image Width',
            required: false,
            min: 1
        },
        imageHeight: {
            type: 'number',
            displayName: 'Image Height',
            required: false,
            min: 1
        },
        imageSize: {
            type: 'number',
            displayName: 'Image Size (bytes)',
            required: false,
            min: 0
        },
        imageFormat: {
            type: 'text',
            displayName: 'Image Format',
            required: false,
            options: ['jpeg', 'jpg', 'png', 'webp']
        },
        
        // Analysis Results
        windowsDetected: {
            type: 'number',
            displayName: 'Windows Detected',
            required: true,
            min: 0,
            max: 50
        },
        confidenceScore: {
            type: 'number',
            displayName: 'Confidence Score',
            required: true,
            min: 0,
            max: 1
        },
        confidenceLevel: {
            type: 'text',
            displayName: 'Confidence Level',
            required: true,
            options: ['low', 'medium', 'high']
        },
        postItNotesDetected: {
            type: 'number',
            displayName: 'Post-it Notes Detected',
            required: false,
            min: 0
        },
        scaleAccuracy: {
            type: 'text',
            displayName: 'Scale Accuracy',
            required: false,
            options: ['unknown', 'low', 'medium', 'high']
        },
        
        // Measurement Data
        analysisData: {
            type: 'object',
            displayName: 'Analysis Data',
            required: true
        },
        measurements: {
            type: 'object',
            displayName: 'Measurements',
            required: false
        },
        recommendations: {
            type: 'object',
            displayName: 'Recommendations',
            required: false
        },
        
        // Processing Information
        processingTime: {
            type: 'number',
            displayName: 'Processing Time (ms)',
            required: false,
            min: 0
        },
        aiModel: {
            type: 'text',
            displayName: 'AI Model Used',
            required: false,
            maxLength: 100
        },
        
        // System Fields
        sessionId: {
            type: 'text',
            displayName: 'Session ID',
            required: false,
            maxLength: 100
        }
    },
    
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    },
    
    indexes: [
        { fields: ['customerId'] },
        { fields: ['analysisId'], unique: true },
        { fields: ['confidenceLevel'] },
        { fields: ['_createdDate'] }
    ]
};

/**
 * Quotes Collection Schema
 * Collection ID: Quotes
 */
export const QUOTES_SCHEMA = {
    collectionId: 'Quotes',
    displayName: 'Quotes',
    fields: {
        // Reference Fields
        customerId: {
            type: 'text',
            displayName: 'Customer ID',
            required: true,
            maxLength: 100
        },
        quoteId: {
            type: 'text',
            displayName: 'Quote ID',
            required: true,
            maxLength: 100
        },
        
        // Project Details
        windowCount: {
            type: 'number',
            displayName: 'Window Count',
            required: true,
            min: 1,
            max: 100
        },
        projectType: {
            type: 'text',
            displayName: 'Project Type',
            required: false,
            options: ['replacement', 'new-construction', 'renovation', 'commercial']
        },
        installationComplexity: {
            type: 'text',
            displayName: 'Installation Complexity',
            required: false,
            options: ['standard', 'complex', 'premium']
        },
        
        // Cost Breakdown
        materialCost: {
            type: 'number',
            displayName: 'Material Cost',
            required: true,
            min: 0
        },
        laborCost: {
            type: 'number',
            displayName: 'Labor Cost',
            required: true,
            min: 0
        },
        permitCost: {
            type: 'number',
            displayName: 'Permit Cost',
            required: false,
            min: 0
        },
        disposalCost: {
            type: 'number',
            displayName: 'Disposal Cost',
            required: false,
            min: 0
        },
        totalCost: {
            type: 'number',
            displayName: 'Total Cost',
            required: true,
            min: 0
        },
        
        // Quote Management
        status: {
            type: 'text',
            displayName: 'Status',
            required: true,
            options: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']
        },
        validUntil: {
            type: 'dateTime',
            displayName: 'Valid Until',
            required: false
        },
        sentDate: {
            type: 'dateTime',
            displayName: 'Sent Date',
            required: false
        },
        viewedDate: {
            type: 'dateTime',
            displayName: 'Viewed Date',
            required: false
        },
        acceptedDate: {
            type: 'dateTime',
            displayName: 'Accepted Date',
            required: false
        },
        
        // Product Information
        selectedProducts: {
            type: 'object',
            displayName: 'Selected Products',
            required: false
        },
        productBreakdown: {
            type: 'object',
            displayName: 'Product Breakdown',
            required: false
        },
        
        // Additional Information
        notes: {
            type: 'richText',
            displayName: 'Notes',
            required: false
        },
        terms: {
            type: 'richText',
            displayName: 'Terms and Conditions',
            required: false
        },
        
        // System Fields
        sessionId: {
            type: 'text',
            displayName: 'Session ID',
            required: false,
            maxLength: 100
        },
        generatedBy: {
            type: 'text',
            displayName: 'Generated By',
            required: false,
            options: ['manual', 'ai-estimator', 'api']
        }
    },
    
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    },
    
    indexes: [
        { fields: ['customerId'] },
        { fields: ['quoteId'], unique: true },
        { fields: ['status'] },
        { fields: ['_createdDate'] }
    ]
};

/**
 * Window Products Master Catalog Schema
 * Collection ID: WindowProductsMasterCatalog
 */
export const WINDOW_PRODUCTS_MASTER_CATALOG_SCHEMA = {
    collectionId: 'WindowProductsMasterCatalog',
    displayName: 'Window Products Master Catalog',
    fields: {
        // Product Identification
        productId: {
            type: 'text',
            displayName: 'Product ID',
            required: true,
            maxLength: 100
        },
        sku: {
            type: 'text',
            displayName: 'SKU',
            required: false,
            maxLength: 50
        },
        name: {
            type: 'text',
            displayName: 'Product Name',
            required: true,
            maxLength: 200
        },
        description: {
            type: 'richText',
            displayName: 'Description',
            required: false
        },
        
        // Brand and Type
        brand: {
            type: 'text',
            displayName: 'Brand',
            required: true,
            maxLength: 100
        },
        series: {
            type: 'text',
            displayName: 'Series',
            required: false,
            maxLength: 100
        },
        type: {
            type: 'text',
            displayName: 'Window Type',
            required: true,
            options: ['double-hung', 'casement', 'picture', 'sliding', 'awning', 'bay', 'bow', 'garden', 'hopper']
        },
        
        // Materials and Construction
        material: {
            type: 'text',
            displayName: 'Frame Material',
            required: true,
            options: ['vinyl', 'wood', 'aluminum', 'fiberglass', 'composite', 'steel']
        },
        glazing: {
            type: 'text',
            displayName: 'Glazing',
            required: false,
            options: ['single', 'double', 'triple', 'quad']
        },
        gasType: {
            type: 'text',
            displayName: 'Gas Fill',
            required: false,
            options: ['air', 'argon', 'krypton', 'xenon']
        },
        
        // Performance Ratings
        energyRating: {
            type: 'number',
            displayName: 'Energy Rating (1-10)',
            required: false,
            min: 1,
            max: 10
        },
        uFactor: {
            type: 'number',
            displayName: 'U-Factor',
            required: false,
            min: 0,
            max: 2
        },
        solarHeatGainCoefficient: {
            type: 'number',
            displayName: 'SHGC',
            required: false,
            min: 0,
            max: 1
        },
        visibleTransmittance: {
            type: 'number',
            displayName: 'Visible Transmittance',
            required: false,
            min: 0,
            max: 1
        },
        airLeakage: {
            type: 'number',
            displayName: 'Air Leakage',
            required: false,
            min: 0
        },
        
        // Pricing
        pricePerUi: {
            type: 'number',
            displayName: 'Price per United Inch',
            required: true,
            min: 0
        },
        baseCost: {
            type: 'number',
            displayName: 'Base Cost',
            required: false,
            min: 0
        },
        laborMultiplier: {
            type: 'number',
            displayName: 'Labor Multiplier',
            required: false,
            min: 0,
            max: 5
        },
        
        // Warranty and Certifications
        warrantyYears: {
            type: 'number',
            displayName: 'Warranty Years',
            required: false,
            min: 0,
            max: 50
        },
        certifications: {
            type: 'object',
            displayName: 'Certifications',
            required: false
        },
        
        // Availability and Status
        availability: {
            type: 'text',
            displayName: 'Availability',
            required: true,
            options: ['in-stock', 'special-order', 'discontinued', 'seasonal']
        },
        leadTime: {
            type: 'number',
            displayName: 'Lead Time (days)',
            required: false,
            min: 0
        },
        
        // Images and Media
        imageUrl: {
            type: 'url',
            displayName: 'Product Image URL',
            required: false
        },
        brochureUrl: {
            type: 'url',
            displayName: 'Brochure URL',
            required: false
        },
        
        // System Fields
        isActive: {
            type: 'boolean',
            displayName: 'Is Active',
            required: true
        },
        lastUpdated: {
            type: 'dateTime',
            displayName: 'Last Updated',
            required: false
        }
    },
    
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Anyone'
    },
    
    indexes: [
        { fields: ['productId'], unique: true },
        { fields: ['brand'] },
        { fields: ['type'] },
        { fields: ['material'] },
        { fields: ['energyRating'] },
        { fields: ['pricePerUi'] },
        { fields: ['availability'] },
        { fields: ['isActive'] }
    ]
};

/**
 * System Events Collection Schema
 * Collection ID: SystemEvents
 */
export const SYSTEM_EVENTS_SCHEMA = {
    collectionId: 'SystemEvents',
    displayName: 'System Events',
    fields: {
        // Event Information
        eventType: {
            type: 'text',
            displayName: 'Event Type',
            required: true,
            maxLength: 100
        },
        eventData: {
            type: 'object',
            displayName: 'Event Data',
            required: false
        },
        message: {
            type: 'text',
            displayName: 'Message',
            required: false,
            maxLength: 1000
        },
        
        // Error Information
        error: {
            type: 'text',
            displayName: 'Error Message',
            required: false,
            maxLength: 2000
        },
        stackTrace: {
            type: 'text',
            displayName: 'Stack Trace',
            required: false
        },
        
        // Context
        sessionId: {
            type: 'text',
            displayName: 'Session ID',
            required: false,
            maxLength: 100
        },
        customerId: {
            type: 'text',
            displayName: 'Customer ID',
            required: false,
            maxLength: 100
        },
        userId: {
            type: 'text',
            displayName: 'User ID',
            required: false,
            maxLength: 100
        },
        
        // System Information
        level: {
            type: 'text',
            displayName: 'Log Level',
            required: true,
            options: ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        },
        source: {
            type: 'text',
            displayName: 'Source',
            required: false,
            maxLength: 100
        },
        endpoint: {
            type: 'text',
            displayName: 'Endpoint',
            required: false,
            maxLength: 200
        },
        
        // Performance
        duration: {
            type: 'number',
            displayName: 'Duration (ms)',
            required: false,
            min: 0
        },
        
        // Request Information
        ipAddress: {
            type: 'text',
            displayName: 'IP Address',
            required: false,
            maxLength: 45
        },
        userAgent: {
            type: 'text',
            displayName: 'User Agent',
            required: false,
            maxLength: 500
        }
    },
    
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    },
    
    indexes: [
        { fields: ['eventType'] },
        { fields: ['level'] },
        { fields: ['sessionId'] },
        { fields: ['customerId'] },
        { fields: ['_createdDate'] }
    ]
};

// =====================================================================
// FIELD LABEL FUNCTIONING (FLF) MAPPINGS
// =====================================================================

/**
 * Complete FLF mappings for all collections
 * Maps logical field names to HTML IDs, API parameters, and collection field IDs
 */
export const COMPLETE_FLF_MAPPINGS = {
    // CRM Leads Mapping
    CRM_LEADS: {
        fullName: { 
            htmlId: 'fullName', 
            jsProperty: 'fullName', 
            apiParam: 'fullName', 
            fieldId: 'fullName' 
        },
        email: { 
            htmlId: 'email', 
            jsProperty: 'email', 
            apiParam: 'email', 
            fieldId: 'email' 
        },
        phone: { 
            htmlId: 'phone', 
            jsProperty: 'phone', 
            apiParam: 'phone', 
            fieldId: 'phone' 
        },
        address: { 
            htmlId: 'address', 
            jsProperty: 'address', 
            apiParam: 'address', 
            fieldId: 'address' 
        },
        city: { 
            htmlId: 'city', 
            jsProperty: 'city', 
            apiParam: 'city', 
            fieldId: 'city' 
        },
        state: { 
            htmlId: 'state', 
            jsProperty: 'state', 
            apiParam: 'state', 
            fieldId: 'state' 
        },
        zipCode: { 
            htmlId: 'zipCode', 
            jsProperty: 'zipCode', 
            apiParam: 'zipCode', 
            fieldId: 'zipCode' 
        },
        projectType: { 
            htmlId: 'projectType', 
            jsProperty: 'projectType', 
            apiParam: 'projectType', 
            fieldId: 'projectType' 
        },
        windowCount: { 
            htmlId: 'windowCount', 
            jsProperty: 'windowCount', 
            apiParam: 'windowCount', 
            fieldId: 'windowCount' 
        },
        estimatedBudget: { 
            htmlId: 'estimatedBudget', 
            jsProperty: 'estimatedBudget', 
            apiParam: 'estimatedBudget', 
            fieldId: 'estimatedBudget' 
        },
        notes: { 
            htmlId: 'notes', 
            jsProperty: 'notes', 
            apiParam: 'notes', 
            fieldId: 'notes' 
        },
        source: { 
            htmlId: null, 
            jsProperty: 'source', 
            apiParam: 'source', 
            fieldId: 'source' 
        },
        status: { 
            htmlId: null, 
            jsProperty: 'status', 
            apiParam: 'status', 
            fieldId: 'status' 
        },
        leadScore: { 
            htmlId: null, 
            jsProperty: 'leadScore', 
            apiParam: 'leadScore', 
            fieldId: 'leadScore' 
        },
        sessionId: { 
            htmlId: null, 
            jsProperty: 'sessionId', 
            apiParam: 'sessionId', 
            fieldId: 'sessionId' 
        }
    },
    
    // AI Window Measurements Mapping
    AI_MEASUREMENTS: {
        customerId: { 
            htmlId: null, 
            jsProperty: 'customerId', 
            apiParam: 'customerId', 
            fieldId: 'customerId' 
        },
        analysisId: { 
            htmlId: null, 
            jsProperty: 'analysisId', 
            apiParam: 'analysisId', 
            fieldId: 'analysisId' 
        },
        imageWidth: { 
            htmlId: null, 
            jsProperty: 'imageWidth', 
            apiParam: 'imageWidth', 
            fieldId: 'imageWidth' 
        },
        imageHeight: { 
            htmlId: null, 
            jsProperty: 'imageHeight', 
            apiParam: 'imageHeight', 
            fieldId: 'imageHeight' 
        },
        windowsDetected: { 
            htmlId: null, 
            jsProperty: 'windowsDetected', 
            apiParam: 'windowsDetected', 
            fieldId: 'windowsDetected' 
        },
        confidenceScore: { 
            htmlId: null, 
            jsProperty: 'confidenceScore', 
            apiParam: 'confidenceScore', 
            fieldId: 'confidenceScore' 
        },
        confidenceLevel: { 
            htmlId: null, 
            jsProperty: 'confidenceLevel', 
            apiParam: 'confidenceLevel', 
            fieldId: 'confidenceLevel' 
        },
        analysisData: { 
            htmlId: null, 
            jsProperty: 'analysisData', 
            apiParam: 'analysisData', 
            fieldId: 'analysisData' 
        },
        sessionId: { 
            htmlId: null, 
            jsProperty: 'sessionId', 
            apiParam: 'sessionId', 
            fieldId: 'sessionId' 
        }
    },
    
    // Quotes Mapping
    QUOTES: {
        customerId: { 
            htmlId: null, 
            jsProperty: 'customerId', 
            apiParam: 'customerId', 
            fieldId: 'customerId' 
        },
        quoteId: { 
            htmlId: null, 
            jsProperty: 'quoteId', 
            apiParam: 'quoteId', 
            fieldId: 'quoteId' 
        },
        windowCount: { 
            htmlId: 'windowCount', 
            jsProperty: 'windowCount', 
            apiParam: 'windowCount', 
            fieldId: 'windowCount' 
        },
        projectType: { 
            htmlId: 'projectType', 
            jsProperty: 'projectType', 
            apiParam: 'projectType', 
            fieldId: 'projectType' 
        },
        installationComplexity: { 
            htmlId: 'installationComplexity', 
            jsProperty: 'installationComplexity', 
            apiParam: 'installationComplexity', 
            fieldId: 'installationComplexity' 
        },
        materialCost: { 
            htmlId: null, 
            jsProperty: 'materialCost', 
            apiParam: 'materialCost', 
            fieldId: 'materialCost' 
        },
        laborCost: { 
            htmlId: null, 
            jsProperty: 'laborCost', 
            apiParam: 'laborCost', 
            fieldId: 'laborCost' 
        },
        totalCost: { 
            htmlId: null, 
            jsProperty: 'totalCost', 
            apiParam: 'totalCost', 
            fieldId: 'totalCost' 
        },
        status: { 
            htmlId: null, 
            jsProperty: 'status', 
            apiParam: 'status', 
            fieldId: 'status' 
        },
        notes: { 
            htmlId: 'notes', 
            jsProperty: 'notes', 
            apiParam: 'notes', 
            fieldId: 'notes' 
        },
        sessionId: { 
            htmlId: null, 
            jsProperty: 'sessionId', 
            apiParam: 'sessionId', 
            fieldId: 'sessionId' 
        }
    },
    
    // Product Filters Mapping
    PRODUCT_FILTERS: {
        brand: { 
            htmlId: 'brandFilter', 
            jsProperty: 'brand', 
            apiParam: 'brand', 
            fieldId: 'brand' 
        },
        type: { 
            htmlId: 'typeFilter', 
            jsProperty: 'type', 
            apiParam: 'type', 
            fieldId: 'type' 
        },
        material: { 
            htmlId: 'materialFilter', 
            jsProperty: 'material', 
            apiParam: 'material', 
            fieldId: 'material' 
        },
        maxPrice: { 
            htmlId: 'priceFilter', 
            jsProperty: 'maxPrice', 
            apiParam: 'maxPrice', 
            fieldId: 'pricePerUi' 
        },
        energyRating: { 
            htmlId: 'energyRatingFilter', 
            jsProperty: 'energyRating', 
            apiParam: 'energyRating', 
            fieldId: 'energyRating' 
        }
    }
};

// =====================================================================
// COLLECTION SETUP UTILITIES
// =====================================================================

/**
 * Get all collection schemas
 */
export function getAllCollectionSchemas() {
    return {
        CRMLeads: CRM_LEADS_SCHEMA,
        AIWindowMeasurements: AI_WINDOW_MEASUREMENTS_SCHEMA,
        Quotes: QUOTES_SCHEMA,
        WindowProductsMasterCatalog: WINDOW_PRODUCTS_MASTER_CATALOG_SCHEMA,
        SystemEvents: SYSTEM_EVENTS_SCHEMA
    };
}

/**
 * Get FLF mapping for specific collection
 */
export function getFLFMapping(collectionName) {
    return COMPLETE_FLF_MAPPINGS[collectionName] || {};
}

/**
 * Validate field mapping consistency
 */
export function validateFLFMapping(mapping) {
    const errors = [];
    
    for (const [fieldName, fieldMapping] of Object.entries(mapping)) {
        if (!fieldMapping.fieldId) {
            errors.push(`Missing fieldId for ${fieldName}`);
        }
        if (!fieldMapping.jsProperty) {
            errors.push(`Missing jsProperty for ${fieldName}`);
        }
        if (!fieldMapping.apiParam) {
            errors.push(`Missing apiParam for ${fieldName}`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
    CRM_LEADS_SCHEMA,
    AI_WINDOW_MEASUREMENTS_SCHEMA,
    QUOTES_SCHEMA,
    WINDOW_PRODUCTS_MASTER_CATALOG_SCHEMA,
    SYSTEM_EVENTS_SCHEMA,
    COMPLETE_FLF_MAPPINGS
};

