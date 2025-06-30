/**
 * Unified Constants and Configuration - Grid-Flow Engine Integration
 * File: backend/config/constants.web.js
 * 
 * Complete system configuration with Grid-Flow Engine credentials and all API integrations
 */

// =====================================================================
// GRID-FLOW ENGINE CONFIGURATION
// =====================================================================

export const GRID_FLOW_ENGINE = {
    CLIENT_ID: '00a645c0-e9d5-474e-8546-4759ca41752a',
    ACCOUNT_ID: '10d52dd8-ec9b-4453-adbc-6293b99af499',
    API_TOKEN: 'GRID_FLOW_ENGINE IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjgyZjQwODQ1LTk2NmUtNDY3ZC05NmQ1LWQxNzNlMDRlOTIwYVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcImE3MTQyZjc3LTI3OTktNDkyNy1iNDQzLWIwYTNkMjU1NzEzZlwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxMGQ1MmRkOC1lYzliLTQ0NTMtYWRiYy02MjkzYjk5YWY0OTlcIn19IiwiaWF0IjoxNzUwNTI1NzEwfQ.L0PoXM4y7m-n9CJytC9FotwKlIao-bIgC69eXiz-Hi9DR5IgekGziVa5n-IbJyEcMUTAwHNeocMpfkJF9kA2qU2ebxPU9rYcDCNZRLiE0JbgZWOO4bIYdHdkIIaKJt5BeqXN9iMHc9cSVry-U6xsesgIB-oqrCD6R13pxvSrxSITyNhpCiTgf8-yzlrL45wplhguc3domIVNW4sE-pmvP8l07A-yJaJsEj60fYqwEAXe9y2eU8M-z2WutvvInbJpjMCDKUKr-AhDmceTp9Bw7dzu0frzZ5stHU2fwT8FlKVRaPYvVt16bj-jRVGmFV3dm6_EKAjlQC2UB1ZcT2g3EQ',
    BASE_URL: 'https://api.wix.com/headless',
    ENDPOINTS: {
        COLLECTIONS: '/v1/data/collections',
        ITEMS: '/v1/data/items',
        QUERY: '/v1/data/query',
        BULK: '/v1/data/bulk'
    }
};

// =====================================================================
// WIX SECRETS CONFIGURATION
// =====================================================================

export const WIX_SECRETS = {
    // AI Services
    CLAUDE_API_KEY: 'claude_api_key',
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    OPENAI_ASSISTANT_ID: 'OPENAI_ASSISTANT_ID',
    
    // Google Cloud Services
    GOOGLE_CLOUD_CLIENT_ID: 'google-cloud-client-id',
    GOOGLE_CLOUD_PROJECT_ID: 'google-cloud-project-id',
    GOOGLE_CLOUD_ML_SERVICE_AGENT: 'google_cloud_ml_service_agent',
    DISCOVERY_ENGINE_SERVICE_ACCOUNT: 'discovery_engine_service_account',
    NOTEBOOK_LM_PROJECT_ID: 'notebook-lm-project-id',
    
    // Google Sheets Integration
    GOOGLE_SHEET_ID: 'google-sheet-id',
    GOOGLE_SPREADSHEET_URL: 'google_spreadsheet_url',
    
    // PDF Services
    PDF_API_KEY: 'pdf_api_key',
    PDF_API_SECRET: 'pdf_api_secret',
    
    // External Services
    RELLO_API_KEY: 'rello_api_Key',
    VERCEL_TOKEN: 'vercel_token',
    
    // Wix Platform
    GFE_ID_WIX_API: 'GFE_ID_WIX_API'
};

// =====================================================================
// SYSTEM CONFIGURATION
// =====================================================================

export const SYSTEM_CONFIG = {
    VERSION: '2.0.0',
    ENVIRONMENT: 'production',
    DEBUG_MODE: false,
    
    // Performance Settings
    CACHE_TTL: 300000, // 5 minutes
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    
    // Security Settings
    TRUSTED_ORIGINS: [
        'https://goodfaithexteriors.com',
        'https://www.goodfaithexteriors.com',
        'https://gfe-ai-advisor.netlify.app',
        'https://gfe-window-estimator.vercel.app'
    ],
    
    // Rate Limiting
    RATE_LIMITS: {
        AI_REQUESTS_PER_MINUTE: 60,
        IMAGE_UPLOADS_PER_HOUR: 100,
        QUOTE_GENERATIONS_PER_DAY: 500
    }
};

// =====================================================================
// AI ORCHESTRATED ROUTER CONFIGURATION
// =====================================================================

export const AI_ROUTER_CONFIG = {
    INTENT_CLASSIFICATION: {
        MODEL: 'claude-3-5-sonnet-20241022',
        MAX_TOKENS: 1000,
        TEMPERATURE: 0.1,
        SYSTEM_PROMPT: `You are an intent classifier for a window replacement company. 
        Analyze user queries and return one or more intent tags from this list:
        - product_lookup: User wants to find specific window products
        - brand_comparison: User wants to compare different brands
        - pricing_estimate: User wants pricing information
        - technical_specs: User wants technical specifications
        - energy_efficiency: User wants energy performance data
        - installation_info: User wants installation details
        - warranty_info: User wants warranty information
        - measurement_help: User needs help with measurements
        - ai_analysis: User wants AI image analysis
        - quote_generation: User wants a formal quote
        
        Return only the intent tags as a JSON array.`
    },
    
    RESPONSE_GENERATION: {
        MODEL: 'gpt-4-turbo-preview',
        MAX_TOKENS: 2000,
        TEMPERATURE: 0.3,
        SYSTEM_PROMPT: `You are a helpful window replacement expert for Good Faith Exteriors. 
        Provide clear, accurate, and customer-friendly responses based on the provided data.
        Always maintain a professional yet approachable tone.`
    }
};

// =====================================================================
// COLLECTION FIELD MAPPINGS (FLF - Field Label Functioning)
// =====================================================================

export const COLLECTION_MAPPINGS = {
    CRM_LEADS: {
        COLLECTION_ID: 'CRMLeads',
        FIELDS: {
            fullName: { htmlId: 'fullName', jsProperty: 'fullName', apiParam: 'fullName', fieldId: 'fullName' },
            email: { htmlId: 'email', jsProperty: 'email', apiParam: 'email', fieldId: 'email' },
            phone: { htmlId: 'phone', jsProperty: 'phone', apiParam: 'phone', fieldId: 'phone' },
            address: { htmlId: 'address', jsProperty: 'address', apiParam: 'address', fieldId: 'address' },
            projectType: { htmlId: 'projectType', jsProperty: 'projectType', apiParam: 'projectType', fieldId: 'projectType' },
            notes: { htmlId: 'notes', jsProperty: 'notes', apiParam: 'notes', fieldId: 'notes' },
            source: { htmlId: 'source', jsProperty: 'source', apiParam: 'source', fieldId: 'source' },
            sessionId: { htmlId: 'sessionId', jsProperty: 'sessionId', apiParam: 'sessionId', fieldId: 'sessionId' },
            status: { htmlId: 'status', jsProperty: 'status', apiParam: 'status', fieldId: 'status' },
            leadScore: { htmlId: 'leadScore', jsProperty: 'leadScore', apiParam: 'leadScore', fieldId: 'leadScore' }
        }
    },
    
    AI_WINDOW_MEASUREMENTS: {
        COLLECTION_ID: 'AIWindowMeasurements',
        FIELDS: {
            customerId: { htmlId: 'customerId', jsProperty: 'customerId', apiParam: 'customerId', fieldId: 'customerId' },
            analysisId: { htmlId: 'analysisId', jsProperty: 'analysisId', apiParam: 'analysisId', fieldId: 'analysisId' },
            imageWidth: { htmlId: 'imageWidth', jsProperty: 'imageWidth', apiParam: 'imageWidth', fieldId: 'imageWidth' },
            imageHeight: { htmlId: 'imageHeight', jsProperty: 'imageHeight', apiParam: 'imageHeight', fieldId: 'imageHeight' },
            windowsDetected: { htmlId: 'windowsDetected', jsProperty: 'windowsDetected', apiParam: 'windowsDetected', fieldId: 'windowsDetected' },
            confidenceScore: { htmlId: 'confidenceScore', jsProperty: 'confidenceScore', apiParam: 'confidenceScore', fieldId: 'confidenceScore' },
            confidenceLevel: { htmlId: 'confidenceLevel', jsProperty: 'confidenceLevel', apiParam: 'confidenceLevel', fieldId: 'confidenceLevel' },
            analysisData: { htmlId: 'analysisData', jsProperty: 'analysisData', apiParam: 'analysisData', fieldId: 'analysisData' }
        }
    },
    
    PRODUCT_CATALOG: {
        COLLECTION_ID: 'ProductCatalog',
        FIELDS: {
            productId: { htmlId: 'productId', jsProperty: 'productId', apiParam: 'productId', fieldId: 'productId' },
            brand: { htmlId: 'brand', jsProperty: 'brand', apiParam: 'brand', fieldId: 'brand' },
            series: { htmlId: 'series', jsProperty: 'series', apiParam: 'series', fieldId: 'series' },
            name: { htmlId: 'name', jsProperty: 'name', apiParam: 'name', fieldId: 'name' },
            type: { htmlId: 'type', jsProperty: 'type', apiParam: 'type', fieldId: 'type' },
            material: { htmlId: 'material', jsProperty: 'material', apiParam: 'material', fieldId: 'material' },
            pricePerUi: { htmlId: 'pricePerUi', jsProperty: 'pricePerUi', apiParam: 'pricePerUi', fieldId: 'pricePerUi' },
            energyRating: { htmlId: 'energyRating', jsProperty: 'energyRating', apiParam: 'energyRating', fieldId: 'energyRating' },
            warrantyYears: { htmlId: 'warrantyYears', jsProperty: 'warrantyYears', apiParam: 'warrantyYears', fieldId: 'warrantyYears' }
        }
    },
    
    QUOTES: {
        COLLECTION_ID: 'Quotes',
        FIELDS: {
            quoteId: { htmlId: 'quoteId', jsProperty: 'quoteId', apiParam: 'quoteId', fieldId: 'quoteId' },
            customerId: { htmlId: 'customerId', jsProperty: 'customerId', apiParam: 'customerId', fieldId: 'customerId' },
            leadId: { htmlId: 'leadId', jsProperty: 'leadId', apiParam: 'leadId', fieldId: 'leadId' },
            estimateData: { htmlId: 'estimateData', jsProperty: 'estimateData', apiParam: 'estimateData', fieldId: 'estimateData' },
            windowCount: { htmlId: 'windowCount', jsProperty: 'windowCount', apiParam: 'windowCount', fieldId: 'windowCount' },
            materialCost: { htmlId: 'materialCost', jsProperty: 'materialCost', apiParam: 'materialCost', fieldId: 'materialCost' },
            laborCost: { htmlId: 'laborCost', jsProperty: 'laborCost', apiParam: 'laborCost', fieldId: 'laborCost' },
            totalCost: { htmlId: 'totalCost', jsProperty: 'totalCost', apiParam: 'totalCost', fieldId: 'totalCost' },
            status: { htmlId: 'status', jsProperty: 'status', apiParam: 'status', fieldId: 'status' }
        }
    },
    
    SYSTEM_EVENTS: {
        COLLECTION_ID: 'SystemEvents',
        FIELDS: {
            eventId: { htmlId: 'eventId', jsProperty: 'eventId', apiParam: 'eventId', fieldId: 'eventId' },
            eventType: { htmlId: 'eventType', jsProperty: 'eventType', apiParam: 'eventType', fieldId: 'eventType' },
            endpoint: { htmlId: 'endpoint', jsProperty: 'endpoint', apiParam: 'endpoint', fieldId: 'endpoint' },
            customerId: { htmlId: 'customerId', jsProperty: 'customerId', apiParam: 'customerId', fieldId: 'customerId' },
            sessionId: { htmlId: 'sessionId', jsProperty: 'sessionId', apiParam: 'sessionId', fieldId: 'sessionId' },
            eventData: { htmlId: 'eventData', jsProperty: 'eventData', apiParam: 'eventData', fieldId: 'eventData' },
            error: { htmlId: 'error', jsProperty: 'error', apiParam: 'error', fieldId: 'error' }
        }
    }
};

// =====================================================================
// UI ELEMENT IDS
// =====================================================================

export const UI_ELEMENT_IDS = {
    // Main Widget Elements
    MAIN_CONTAINER: 'gfeMainContainer',
    UPLOAD_BUTTON: 'uploadButton',
    IMAGE_PREVIEW: 'imagePreview',
    ANALYSIS_RESULTS: 'analysisResults',
    ESTIMATE_RESULTS: 'estimateResults',
    
    // Form Elements
    CUSTOMER_NAME: 'customerName',
    CUSTOMER_EMAIL: 'customerEmail',
    CUSTOMER_PHONE: 'customerPhone',
    CUSTOMER_ADDRESS: 'customerAddress',
    PROJECT_TYPE: 'projectType',
    NOTES: 'notes',
    
    // Product Browser Elements
    PRODUCT_GRID: 'productGrid',
    BRAND_FILTER: 'brandFilter',
    TYPE_FILTER: 'typeFilter',
    MATERIAL_FILTER: 'materialFilter',
    PRICE_RANGE: 'priceRange',
    
    // Quote Elements
    QUOTE_CONTAINER: 'quoteContainer',
    QUOTE_SUMMARY: 'quoteSummary',
    QUOTE_DETAILS: 'quoteDetails',
    QUOTE_ACTIONS: 'quoteActions',
    
    // AI Chat Elements
    CHAT_CONTAINER: 'chatContainer',
    CHAT_MESSAGES: 'chatMessages',
    CHAT_INPUT: 'chatInput',
    CHAT_SEND: 'chatSend',
    
    // Status Elements
    LOADING_INDICATOR: 'loadingIndicator',
    ERROR_MESSAGE: 'errorMessage',
    SUCCESS_MESSAGE: 'successMessage',
    STATUS_TEXT: 'statusText'
};

// =====================================================================
// MESSAGE TYPES
// =====================================================================

export const MESSAGE_TYPES = {
    // Iframe to Velo
    IFRAME_TO_VELO: {
        COMPONENT_READY: 'GFE_COMPONENT_READY',
        LEAD_CAPTURE: 'GFE_LEAD_CAPTURE',
        ANALYZE_IMAGE: 'GFE_ANALYZE_IMAGE',
        REQUEST_PRODUCTS: 'GFE_REQUEST_PRODUCTS',
        FILTER_PRODUCTS: 'GFE_FILTER_PRODUCTS',
        REQUEST_QUOTE: 'GFE_REQUEST_QUOTE',
        AI_CHAT: 'GFE_AI_CHAT',
        ROUTE_QUERY: 'GFE_ROUTE_QUERY'
    },
    
    // Velo to Iframe
    VELO_TO_IFRAME: {
        INITIAL_CONFIG: 'GFE_INITIAL_CONFIG',
        LEAD_CREATED: 'GFE_LEAD_CREATED',
        ANALYSIS_COMPLETE: 'GFE_ANALYSIS_COMPLETE',
        PRODUCT_CATALOG: 'GFE_PRODUCT_CATALOG',
        QUOTE_GENERATED: 'GFE_QUOTE_GENERATED',
        AI_RESPONSE: 'GFE_AI_RESPONSE',
        ROUTER_RESPONSE: 'GFE_ROUTER_RESPONSE',
        ERROR: 'GFE_ERROR'
    }
};

// =====================================================================
// API ENDPOINTS
// =====================================================================

export const API_ENDPOINTS = {
    // Core Data Operations
    LEADS: '/api/leads',
    MEASUREMENTS: '/api/measurements',
    PRODUCTS: '/api/products',
    QUOTES: '/api/quotes',
    EVENTS: '/api/events',
    
    // AI Services
    AI_ANALYZE: '/api/ai/analyze',
    AI_CHAT: '/api/ai/chat',
    AI_COMPARE: '/api/ai/compare',
    
    // Router System
    ROUTE_QUERY: '/api/route-query',
    INTENT_CLASSIFY: '/api/intent/classify',
    
    // External Integrations
    GRID_FLOW: '/api/gridflow',
    GOOGLE_SHEETS: '/api/sheets',
    PDF_GENERATE: '/api/pdf/generate'
};

// =====================================================================
// PRICING CONFIGURATION
// =====================================================================

export const PRICING_CONFIG = {
    BASE_MULTIPLIERS: {
        STANDARD: 1.0,
        PREMIUM: 1.25,
        LUXURY: 1.5
    },
    
    BRAND_MULTIPLIERS: {
        ANDERSEN: 1.2,
        PELLA: 1.15,
        MARVIN: 1.3,
        MILGARD: 1.1,
        SIMONTON: 1.0,
        JELD_WEN: 1.05
    },
    
    MATERIAL_MULTIPLIERS: {
        VINYL: 1.0,
        WOOD: 1.4,
        ALUMINUM: 0.9,
        FIBERGLASS: 1.3,
        COMPOSITE: 1.2
    },
    
    INSTALLATION_RATES: {
        STANDARD: 150,
        COMPLEX: 200,
        PREMIUM: 250
    }
};

// =====================================================================
// VALIDATION RULES
// =====================================================================

export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\+]?[1-9][\d]{0,15}$/,
    POSTAL_CODE: /^\d{5}(-\d{4})?$/,
    
    FIELD_LENGTHS: {
        NAME: { min: 2, max: 100 },
        EMAIL: { min: 5, max: 254 },
        PHONE: { min: 10, max: 20 },
        ADDRESS: { min: 10, max: 500 },
        NOTES: { max: 2000 }
    },
    
    IMAGE_CONSTRAINTS: {
        MAX_SIZE: 10 * 1024 * 1024, // 10MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
        MIN_DIMENSIONS: { width: 300, height: 300 },
        MAX_DIMENSIONS: { width: 4000, height: 4000 }
    }
};

// =====================================================================
// ERROR CODES
// =====================================================================

export const ERROR_CODES = {
    // System Errors
    SYSTEM_ERROR: 'SYS_001',
    CONFIGURATION_ERROR: 'SYS_002',
    TIMEOUT_ERROR: 'SYS_003',
    
    // Authentication Errors
    INVALID_API_KEY: 'AUTH_001',
    UNAUTHORIZED_ACCESS: 'AUTH_002',
    TOKEN_EXPIRED: 'AUTH_003',
    
    // Validation Errors
    INVALID_INPUT: 'VAL_001',
    MISSING_REQUIRED_FIELD: 'VAL_002',
    INVALID_FORMAT: 'VAL_003',
    
    // Data Errors
    RECORD_NOT_FOUND: 'DATA_001',
    DUPLICATE_RECORD: 'DATA_002',
    DATABASE_ERROR: 'DATA_003',
    
    // AI Service Errors
    AI_SERVICE_UNAVAILABLE: 'AI_001',
    AI_QUOTA_EXCEEDED: 'AI_002',
    AI_ANALYSIS_FAILED: 'AI_003',
    
    // External Service Errors
    EXTERNAL_API_ERROR: 'EXT_001',
    GRID_FLOW_ERROR: 'EXT_002',
    GOOGLE_SHEETS_ERROR: 'EXT_003'
};

// =====================================================================
// COMPANY INFORMATION
// =====================================================================

export const COMPANY_INFO = {
    NAME: 'Good Faith Exteriors',
    EMAIL: 'info@goodfaithexteriors.com',
    PHONE: '651-416-8669',
    ADDRESS: '5090 210th St N, Forest Lake, MN 55025',
    WEBSITE: 'goodfaithexteriors.com',
    LOGO_URL: 'https://static.wixstatic.com/media/10d52d_a5ae576e3b2c44e8b03f257c6986a853~mv2.png'
};

// =====================================================================
// EXPORT DEFAULT CONFIGURATION
// =====================================================================

export default {
    GRID_FLOW_ENGINE,
    WIX_SECRETS,
    SYSTEM_CONFIG,
    AI_ROUTER_CONFIG,
    COLLECTION_MAPPINGS,
    UI_ELEMENT_IDS,
    MESSAGE_TYPES,
    API_ENDPOINTS,
    PRICING_CONFIG,
    VALIDATION_RULES,
    ERROR_CODES,
    COMPANY_INFO
};

