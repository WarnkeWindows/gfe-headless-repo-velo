/**
 * Grid-Flow Engine Integration Service
 * File: backend/core/gridflow-service.web.js
 * 
 * Wix Headless API integration with Grid-Flow Engine credentials
 */

import { fetch } from 'wix-fetch';
import { 
    GRID_FLOW_ENGINE, 
    COLLECTION_MAPPINGS, 
    ERROR_CODES,
    SYSTEM_CONFIG 
} from '../config/constants.web.js';
import { logSystemEvent } from '../utils/logger.web.js';
import { validateInput } from '../utils/validator.web.js';

// =====================================================================
// GRID-FLOW ENGINE CLIENT
// =====================================================================

class GridFlowClient {
    constructor() {
        this.baseUrl = GRID_FLOW_ENGINE.BASE_URL;
        this.clientId = GRID_FLOW_ENGINE.CLIENT_ID;
        this.accountId = GRID_FLOW_ENGINE.ACCOUNT_ID;
        this.apiToken = GRID_FLOW_ENGINE.API_TOKEN;
        this.headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
            'X-Client-ID': this.clientId,
            'X-Account-ID': this.accountId
        };
    }

    /**
     * Make authenticated request to Grid-Flow Engine
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: this.headers
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Grid-Flow API error ${response.status}: ${errorData}`);
            }
            
            return await response.json();
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'GRIDFLOW_API_ERROR',
                error: error.message,
                eventData: { endpoint, method, status: error.status }
            });
            throw error;
        }
    }

    /**
     * Get collection schema
     */
    async getCollectionSchema(collectionId) {
        return await this.makeRequest(`${GRID_FLOW_ENGINE.ENDPOINTS.COLLECTIONS}/${collectionId}/schema`);
    }

    /**
     * Query collection items
     */
    async queryCollection(collectionId, queryOptions = {}) {
        const endpoint = `${GRID_FLOW_ENGINE.ENDPOINTS.QUERY}/${collectionId}`;
        return await this.makeRequest(endpoint, 'POST', queryOptions);
    }

    /**
     * Get single item by ID
     */
    async getItem(collectionId, itemId) {
        return await this.makeRequest(`${GRID_FLOW_ENGINE.ENDPOINTS.ITEMS}/${collectionId}/${itemId}`);
    }

    /**
     * Create new item
     */
    async createItem(collectionId, itemData) {
        return await this.makeRequest(`${GRID_FLOW_ENGINE.ENDPOINTS.ITEMS}/${collectionId}`, 'POST', itemData);
    }

    /**
     * Update existing item
     */
    async updateItem(collectionId, itemId, itemData) {
        return await this.makeRequest(`${GRID_FLOW_ENGINE.ENDPOINTS.ITEMS}/${collectionId}/${itemId}`, 'PUT', itemData);
    }

    /**
     * Delete item
     */
    async deleteItem(collectionId, itemId) {
        return await this.makeRequest(`${GRID_FLOW_ENGINE.ENDPOINTS.ITEMS}/${collectionId}/${itemId}`, 'DELETE');
    }

    /**
     * Bulk operations
     */
    async bulkOperation(operations) {
        return await this.makeRequest(GRID_FLOW_ENGINE.ENDPOINTS.BULK, 'POST', { operations });
    }
}

// =====================================================================
// COLLECTION SERVICES
// =====================================================================

/**
 * CRM Leads Service
 */
export class CRMLeadsService {
    constructor() {
        this.client = new GridFlowClient();
        this.collectionId = COLLECTION_MAPPINGS.CRM_LEADS.COLLECTION_ID;
        this.fieldMappings = COLLECTION_MAPPINGS.CRM_LEADS.FIELDS;
    }

    /**
     * Create new lead
     */
    async createLead(leadData) {
        try {
            // Transform data using FLF mappings
            const transformedData = this.transformToCollectionFormat(leadData);
            
            // Validate required fields
            const validation = this.validateLeadData(transformedData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Add metadata
            transformedData.createdDate = new Date().toISOString();
            transformedData.status = transformedData.status || 'new';
            transformedData.source = transformedData.source || 'ai-window-estimator';
            
            const result = await this.client.createItem(this.collectionId, transformedData);
            
            await logSystemEvent({
                eventType: 'LEAD_CREATED',
                eventData: { leadId: result._id, source: transformedData.source }
            });
            
            return result;
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'LEAD_CREATION_ERROR',
                error: error.message,
                eventData: leadData
            });
            throw error;
        }
    }

    /**
     * Update existing lead
     */
    async updateLead(leadId, updateData) {
        try {
            const transformedData = this.transformToCollectionFormat(updateData);
            transformedData.updatedDate = new Date().toISOString();
            
            const result = await this.client.updateItem(this.collectionId, leadId, transformedData);
            
            await logSystemEvent({
                eventType: 'LEAD_UPDATED',
                eventData: { leadId: leadId }
            });
            
            return result;
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'LEAD_UPDATE_ERROR',
                error: error.message,
                eventData: { leadId, updateData }
            });
            throw error;
        }
    }

    /**
     * Search leads
     */
    async searchLeads(searchCriteria) {
        try {
            const queryOptions = this.buildQueryOptions(searchCriteria);
            return await this.client.queryCollection(this.collectionId, queryOptions);
        } catch (error) {
            await logSystemEvent({
                eventType: 'LEAD_SEARCH_ERROR',
                error: error.message,
                eventData: searchCriteria
            });
            throw error;
        }
    }

    /**
     * Get lead by ID
     */
    async getLeadById(leadId) {
        try {
            return await this.client.getItem(this.collectionId, leadId);
        } catch (error) {
            await logSystemEvent({
                eventType: 'LEAD_FETCH_ERROR',
                error: error.message,
                eventData: { leadId }
            });
            throw error;
        }
    }

    /**
     * Transform data to collection format using FLF
     */
    transformToCollectionFormat(data) {
        const transformed = {};
        
        for (const [key, mapping] of Object.entries(this.fieldMappings)) {
            if (data.hasOwnProperty(mapping.jsProperty)) {
                transformed[mapping.fieldId] = data[mapping.jsProperty];
            }
        }
        
        return transformed;
    }

    /**
     * Validate lead data
     */
    validateLeadData(data) {
        const errors = [];
        
        if (!data.fullName || data.fullName.trim().length < 2) {
            errors.push('Full name is required and must be at least 2 characters');
        }
        
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Valid email address is required');
        }
        
        if (!data.phone || data.phone.length < 10) {
            errors.push('Valid phone number is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Build query options
     */
    buildQueryOptions(criteria) {
        const options = {
            filter: {},
            sort: [{ fieldName: 'createdDate', order: 'desc' }],
            paging: { limit: 50, offset: 0 }
        };
        
        if (criteria.email) {
            options.filter.email = { $eq: criteria.email };
        }
        
        if (criteria.status) {
            options.filter.status = { $eq: criteria.status };
        }
        
        if (criteria.source) {
            options.filter.source = { $eq: criteria.source };
        }
        
        if (criteria.dateRange) {
            options.filter.createdDate = {
                $gte: criteria.dateRange.start,
                $lte: criteria.dateRange.end
            };
        }
        
        return options;
    }
}

/**
 * Product Catalog Service
 */
export class ProductCatalogService {
    constructor() {
        this.client = new GridFlowClient();
        this.collectionId = COLLECTION_MAPPINGS.PRODUCT_CATALOG.COLLECTION_ID;
        this.fieldMappings = COLLECTION_MAPPINGS.PRODUCT_CATALOG.FIELDS;
    }

    /**
     * Search products
     */
    async searchProducts(searchCriteria) {
        try {
            const queryOptions = this.buildProductQuery(searchCriteria);
            const result = await this.client.queryCollection(this.collectionId, queryOptions);
            
            // Transform results for frontend consumption
            return result.items.map(item => this.transformFromCollectionFormat(item));
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'PRODUCT_SEARCH_ERROR',
                error: error.message,
                eventData: searchCriteria
            });
            throw error;
        }
    }

    /**
     * Get product by ID
     */
    async getProductById(productId) {
        try {
            const result = await this.client.getItem(this.collectionId, productId);
            return this.transformFromCollectionFormat(result);
        } catch (error) {
            await logSystemEvent({
                eventType: 'PRODUCT_FETCH_ERROR',
                error: error.message,
                eventData: { productId }
            });
            throw error;
        }
    }

    /**
     * Get products by brand
     */
    async getProductsByBrand(brand) {
        return await this.searchProducts({ brand: brand });
    }

    /**
     * Get products by type
     */
    async getProductsByType(type) {
        return await this.searchProducts({ type: type });
    }

    /**
     * Get energy efficient products
     */
    async getEnergyEfficientProducts(minRating = 7) {
        return await this.searchProducts({ 
            energyRating: { $gte: minRating },
            isActive: true 
        });
    }

    /**
     * Build product query
     */
    buildProductQuery(criteria) {
        const options = {
            filter: { isActive: { $eq: true } },
            sort: [{ fieldName: 'energyRating', order: 'desc' }],
            paging: { limit: 100, offset: 0 }
        };
        
        if (criteria.brand) {
            if (typeof criteria.brand === 'string') {
                options.filter.brand = { $eq: criteria.brand };
            } else if (criteria.brand.$in) {
                options.filter.brand = criteria.brand;
            }
        }
        
        if (criteria.type) {
            options.filter.type = { $eq: criteria.type };
        }
        
        if (criteria.material) {
            options.filter.material = { $eq: criteria.material };
        }
        
        if (criteria.priceRange) {
            options.filter.pricePerUi = {
                $gte: criteria.priceRange.min || 0,
                $lte: criteria.priceRange.max || 10000
            };
        }
        
        if (criteria.energyRating) {
            if (typeof criteria.energyRating === 'number') {
                options.filter.energyRating = { $gte: criteria.energyRating };
            } else {
                options.filter.energyRating = criteria.energyRating;
            }
        }
        
        if (criteria.limit) {
            options.paging.limit = Math.min(criteria.limit, 100);
        }
        
        return options;
    }

    /**
     * Transform from collection format using FLF
     */
    transformFromCollectionFormat(item) {
        const transformed = {};
        
        for (const [key, mapping] of Object.entries(this.fieldMappings)) {
            if (item.hasOwnProperty(mapping.fieldId)) {
                transformed[mapping.jsProperty] = item[mapping.fieldId];
            }
        }
        
        // Add computed fields
        transformed._id = item._id;
        transformed.estimatedPrice = this.calculateEstimatedPrice(transformed);
        
        return transformed;
    }

    /**
     * Calculate estimated price with installation
     */
    calculateEstimatedPrice(product) {
        const basePrice = product.pricePerUi || 0;
        const installationMultiplier = 1.3; // 30% installation cost
        return Math.round(basePrice * installationMultiplier);
    }
}

/**
 * AI Window Measurements Service
 */
export class AIWindowMeasurementsService {
    constructor() {
        this.client = new GridFlowClient();
        this.collectionId = COLLECTION_MAPPINGS.AI_WINDOW_MEASUREMENTS.COLLECTION_ID;
        this.fieldMappings = COLLECTION_MAPPINGS.AI_WINDOW_MEASUREMENTS.FIELDS;
    }

    /**
     * Save AI analysis results
     */
    async saveAnalysis(analysisData) {
        try {
            const transformedData = this.transformToCollectionFormat(analysisData);
            transformedData.timestamp = new Date().toISOString();
            
            const result = await this.client.createItem(this.collectionId, transformedData);
            
            await logSystemEvent({
                eventType: 'AI_ANALYSIS_SAVED',
                eventData: { analysisId: result._id, customerId: analysisData.customerId }
            });
            
            return result;
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'AI_ANALYSIS_SAVE_ERROR',
                error: error.message,
                eventData: analysisData
            });
            throw error;
        }
    }

    /**
     * Get analysis by customer ID
     */
    async getAnalysisByCustomer(customerId) {
        try {
            const queryOptions = {
                filter: { customerId: { $eq: customerId } },
                sort: [{ fieldName: 'timestamp', order: 'desc' }],
                paging: { limit: 10, offset: 0 }
            };
            
            return await this.client.queryCollection(this.collectionId, queryOptions);
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'AI_ANALYSIS_FETCH_ERROR',
                error: error.message,
                eventData: { customerId }
            });
            throw error;
        }
    }

    /**
     * Transform to collection format
     */
    transformToCollectionFormat(data) {
        const transformed = {};
        
        for (const [key, mapping] of Object.entries(this.fieldMappings)) {
            if (data.hasOwnProperty(mapping.jsProperty)) {
                transformed[mapping.fieldId] = data[mapping.jsProperty];
            }
        }
        
        return transformed;
    }
}

/**
 * Quotes Service
 */
export class QuotesService {
    constructor() {
        this.client = new GridFlowClient();
        this.collectionId = COLLECTION_MAPPINGS.QUOTES.COLLECTION_ID;
        this.fieldMappings = COLLECTION_MAPPINGS.QUOTES.FIELDS;
    }

    /**
     * Create new quote
     */
    async createQuote(quoteData) {
        try {
            const transformedData = this.transformToCollectionFormat(quoteData);
            transformedData.createdDate = new Date().toISOString();
            transformedData.status = transformedData.status || 'draft';
            
            // Set expiration date (30 days from now)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 30);
            transformedData.validUntil = validUntil.toISOString();
            
            const result = await this.client.createItem(this.collectionId, transformedData);
            
            await logSystemEvent({
                eventType: 'QUOTE_CREATED',
                eventData: { quoteId: result._id, customerId: quoteData.customerId }
            });
            
            return result;
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'QUOTE_CREATION_ERROR',
                error: error.message,
                eventData: quoteData
            });
            throw error;
        }
    }

    /**
     * Update quote status
     */
    async updateQuoteStatus(quoteId, status) {
        try {
            const updateData = {
                status: status,
                updatedDate: new Date().toISOString()
            };
            
            const result = await this.client.updateItem(this.collectionId, quoteId, updateData);
            
            await logSystemEvent({
                eventType: 'QUOTE_STATUS_UPDATED',
                eventData: { quoteId, status }
            });
            
            return result;
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'QUOTE_UPDATE_ERROR',
                error: error.message,
                eventData: { quoteId, status }
            });
            throw error;
        }
    }

    /**
     * Get quotes by customer
     */
    async getQuotesByCustomer(customerId) {
        try {
            const queryOptions = {
                filter: { customerId: { $eq: customerId } },
                sort: [{ fieldName: 'createdDate', order: 'desc' }],
                paging: { limit: 20, offset: 0 }
            };
            
            return await this.client.queryCollection(this.collectionId, queryOptions);
            
        } catch (error) {
            await logSystemEvent({
                eventType: 'QUOTES_FETCH_ERROR',
                error: error.message,
                eventData: { customerId }
            });
            throw error;
        }
    }

    /**
     * Transform to collection format
     */
    transformToCollectionFormat(data) {
        const transformed = {};
        
        for (const [key, mapping] of Object.entries(this.fieldMappings)) {
            if (data.hasOwnProperty(mapping.jsProperty)) {
                transformed[mapping.fieldId] = data[mapping.jsProperty];
            }
        }
        
        return transformed;
    }
}

/**
 * System Events Service
 */
export class SystemEventsService {
    constructor() {
        this.client = new GridFlowClient();
        this.collectionId = COLLECTION_MAPPINGS.SYSTEM_EVENTS.COLLECTION_ID;
        this.fieldMappings = COLLECTION_MAPPINGS.SYSTEM_EVENTS.FIELDS;
    }

    /**
     * Log system event
     */
    async logEvent(eventData) {
        try {
            const transformedData = this.transformToCollectionFormat(eventData);
            transformedData.timestamp = new Date().toISOString();
            transformedData.eventId = this.generateEventId();
            
            return await this.client.createItem(this.collectionId, transformedData);
            
        } catch (error) {
            // Don't log errors for logging service to avoid infinite loops
            console.error('Failed to log system event:', error);
            throw error;
        }
    }

    /**
     * Get events by type
     */
    async getEventsByType(eventType, limit = 100) {
        try {
            const queryOptions = {
                filter: { eventType: { $eq: eventType } },
                sort: [{ fieldName: 'timestamp', order: 'desc' }],
                paging: { limit: limit, offset: 0 }
            };
            
            return await this.client.queryCollection(this.collectionId, queryOptions);
            
        } catch (error) {
            console.error('Failed to fetch system events:', error);
            throw error;
        }
    }

    /**
     * Transform to collection format
     */
    transformToCollectionFormat(data) {
        const transformed = {};
        
        for (const [key, mapping] of Object.entries(this.fieldMappings)) {
            if (data.hasOwnProperty(mapping.jsProperty)) {
                transformed[mapping.fieldId] = data[mapping.jsProperty];
            }
        }
        
        return transformed;
    }

    /**
     * Generate unique event ID
     */
    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// =====================================================================
// UNIFIED DATA SERVICE
// =====================================================================

/**
 * Unified data service that combines all collection services
 */
export class UnifiedDataService {
    constructor() {
        this.leads = new CRMLeadsService();
        this.products = new ProductCatalogService();
        this.measurements = new AIWindowMeasurementsService();
        this.quotes = new QuotesService();
        this.events = new SystemEventsService();
    }

    /**
     * Health check for all services
     */
    async healthCheck() {
        const results = {};
        
        try {
            // Test each service
            results.leads = await this.testService(() => this.leads.searchLeads({ limit: 1 }));
            results.products = await this.testService(() => this.products.searchProducts({ limit: 1 }));
            results.measurements = await this.testService(() => this.measurements.getAnalysisByCustomer('test'));
            results.quotes = await this.testService(() => this.quotes.getQuotesByCustomer('test'));
            results.events = await this.testService(() => this.events.getEventsByType('HEALTH_CHECK', 1));
            
            const allHealthy = Object.values(results).every(result => result.status === 'healthy');
            
            return {
                overall: allHealthy ? 'healthy' : 'degraded',
                services: results,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                overall: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Test individual service
     */
    async testService(serviceCall) {
        try {
            await serviceCall();
            return { status: 'healthy' };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                error: error.message 
            };
        }
    }
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
    GridFlowClient,
    CRMLeadsService,
    ProductCatalogService,
    AIWindowMeasurementsService,
    QuotesService,
    SystemEventsService,
    UnifiedDataService
};

// Default export
export default UnifiedDataService;

