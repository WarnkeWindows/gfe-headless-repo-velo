/**
 * AI-Orchestrated Router Service
 * File: backend/core/ai-router.web.js
 * 
 * Dynamic API-driven knowledge routing system for intelligent product queries
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { 
    AI_ROUTER_CONFIG, 
    WIX_SECRETS, 
    API_ENDPOINTS,
    MESSAGE_TYPES,
    ERROR_CODES,
    SYSTEM_CONFIG
} from '../config/constants.web.js';
import { logSystemEvent } from '../utils/logger.web.js';
import { validateInput } from '../utils/validator.web.js';
import { searchProducts } from './wix-data-service.web.js';
import { generateQuote } from '../services/pricing-service.web.js';

// =====================================================================
// MAIN ROUTER FUNCTION
// =====================================================================

/**
 * Main entry point for AI-Orchestrated routing
 * @param {Object} queryData - User query and context
 * @returns {Object} Structured response with data and AI analysis
 */
export async function routeQuery(queryData) {
    const startTime = Date.now();
    const sessionId = queryData.sessionId || generateSessionId();
    
    try {
        // Log incoming query
        await logSystemEvent({
            eventType: 'ROUTE_QUERY_START',
            sessionId: sessionId,
            eventData: {
                query: queryData.query,
                customerContext: queryData.customerContext
            }
        });
        
        // Step 1: Validate input
        const validation = validateQueryInput(queryData);
        if (!validation.isValid) {
            throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
        }
        
        // Step 2: Classify intent using Claude
        const intents = await classifyIntent(queryData.query, sessionId);
        
        // Step 3: Route to appropriate services based on intents
        const serviceResults = await executeServiceRouting(intents, queryData, sessionId);
        
        // Step 4: Generate AI summary and recommendations
        const aiAnalysis = await generateAIAnalysis(queryData, serviceResults, sessionId);
        
        // Step 5: Compile final response
        const response = {
            query: queryData.query,
            sessionId: sessionId,
            intents: intents,
            processingTime: Date.now() - startTime,
            ...serviceResults,
            aiSummary: aiAnalysis.summary,
            recommendation: aiAnalysis.recommendation,
            confidence: aiAnalysis.confidence,
            followUpSuggestions: aiAnalysis.followUpSuggestions
        };
        
        // Log successful completion
        await logSystemEvent({
            eventType: 'ROUTE_QUERY_SUCCESS',
            sessionId: sessionId,
            eventData: {
                intents: intents,
                processingTime: response.processingTime,
                resultCount: serviceResults.products?.length || 0
            }
        });
        
        return response;
        
    } catch (error) {
        // Log error
        await logSystemEvent({
            eventType: 'ROUTE_QUERY_ERROR',
            sessionId: sessionId,
            error: error.message,
            eventData: {
                query: queryData.query,
                processingTime: Date.now() - startTime
            }
        });
        
        throw error;
    }
}

// =====================================================================
// INTENT CLASSIFICATION
// =====================================================================

/**
 * Classify user intent using Claude AI
 * @param {string} query - User query
 * @param {string} sessionId - Session identifier
 * @returns {Array} Array of intent tags
 */
async function classifyIntent(query, sessionId) {
    try {
        const claudeApiKey = await getSecret(WIX_SECRETS.CLAUDE_API_KEY);
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: AI_ROUTER_CONFIG.INTENT_CLASSIFICATION.MODEL,
                max_tokens: AI_ROUTER_CONFIG.INTENT_CLASSIFICATION.MAX_TOKENS,
                temperature: AI_ROUTER_CONFIG.INTENT_CLASSIFICATION.TEMPERATURE,
                system: AI_ROUTER_CONFIG.INTENT_CLASSIFICATION.SYSTEM_PROMPT,
                messages: [{
                    role: 'user',
                    content: `Classify this query: "${query}"`
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }
        
        const data = await response.json();
        const intentText = data.content[0].text;
        
        // Parse JSON response
        try {
            const intents = JSON.parse(intentText);
            return Array.isArray(intents) ? intents : [intents];
        } catch (parseError) {
            // Fallback: extract intents from text
            return extractIntentsFromText(intentText);
        }
        
    } catch (error) {
        await logSystemEvent({
            eventType: 'INTENT_CLASSIFICATION_ERROR',
            sessionId: sessionId,
            error: error.message
        });
        
        // Fallback to keyword-based classification
        return classifyIntentFallback(query);
    }
}

/**
 * Fallback intent classification using keywords
 * @param {string} query - User query
 * @returns {Array} Array of intent tags
 */
function classifyIntentFallback(query) {
    const lowerQuery = query.toLowerCase();
    const intents = [];
    
    // Keyword mapping
    const intentKeywords = {
        'product_lookup': ['window', 'product', 'find', 'search', 'show', 'available'],
        'brand_comparison': ['compare', 'versus', 'vs', 'difference', 'better', 'best'],
        'pricing_estimate': ['price', 'cost', 'estimate', 'quote', 'how much', 'budget'],
        'technical_specs': ['specification', 'specs', 'technical', 'details', 'features'],
        'energy_efficiency': ['energy', 'efficient', 'rating', 'u-factor', 'thermal'],
        'installation_info': ['install', 'installation', 'how to', 'process'],
        'warranty_info': ['warranty', 'guarantee', 'coverage'],
        'measurement_help': ['measure', 'size', 'dimension', 'how big'],
        'ai_analysis': ['analyze', 'analysis', 'image', 'photo', 'picture'],
        'quote_generation': ['quote', 'estimate', 'proposal', 'formal quote']
    };
    
    for (const [intent, keywords] of Object.entries(intentKeywords)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
            intents.push(intent);
        }
    }
    
    return intents.length > 0 ? intents : ['product_lookup'];
}

// =====================================================================
// SERVICE ROUTING
// =====================================================================

/**
 * Execute service routing based on classified intents
 * @param {Array} intents - Classified intent tags
 * @param {Object} queryData - Original query data
 * @param {string} sessionId - Session identifier
 * @returns {Object} Combined service results
 */
async function executeServiceRouting(intents, queryData, sessionId) {
    const results = {};
    const promises = [];
    
    // Route to appropriate services
    for (const intent of intents) {
        switch (intent) {
            case 'product_lookup':
                promises.push(
                    handleProductLookup(queryData, sessionId)
                        .then(data => results.products = data)
                        .catch(error => results.productError = error.message)
                );
                break;
                
            case 'brand_comparison':
                promises.push(
                    handleBrandComparison(queryData, sessionId)
                        .then(data => results.brandComparison = data)
                        .catch(error => results.brandComparisonError = error.message)
                );
                break;
                
            case 'pricing_estimate':
                promises.push(
                    handlePricingEstimate(queryData, sessionId)
                        .then(data => results.pricing = data)
                        .catch(error => results.pricingError = error.message)
                );
                break;
                
            case 'technical_specs':
                promises.push(
                    handleTechnicalSpecs(queryData, sessionId)
                        .then(data => results.specifications = data)
                        .catch(error => results.specsError = error.message)
                );
                break;
                
            case 'energy_efficiency':
                promises.push(
                    handleEnergyEfficiency(queryData, sessionId)
                        .then(data => results.energyData = data)
                        .catch(error => results.energyError = error.message)
                );
                break;
                
            case 'ai_analysis':
                promises.push(
                    handleAIAnalysis(queryData, sessionId)
                        .then(data => results.aiAnalysis = data)
                        .catch(error => results.aiAnalysisError = error.message)
                );
                break;
                
            case 'quote_generation':
                promises.push(
                    handleQuoteGeneration(queryData, sessionId)
                        .then(data => results.quote = data)
                        .catch(error => results.quoteError = error.message)
                );
                break;
        }
    }
    
    // Wait for all services to complete
    await Promise.all(promises);
    
    return results;
}

// =====================================================================
// SERVICE HANDLERS
// =====================================================================

/**
 * Handle product lookup requests
 */
async function handleProductLookup(queryData, sessionId) {
    const searchParams = extractSearchParams(queryData.query);
    
    // Add customer context filters
    if (queryData.customerContext) {
        if (queryData.customerContext.climate) {
            searchParams.energyRating = { $gte: 7 }; // High efficiency for cold climates
        }
        if (queryData.customerContext.budget) {
            searchParams.pricePerUi = { $lte: queryData.customerContext.budget };
        }
    }
    
    const products = await searchProducts(searchParams);
    
    // Enhance with additional data
    return products.map(product => ({
        ...product,
        estimatedPrice: calculateEstimatedPrice(product, queryData.customerContext),
        suitabilityScore: calculateSuitabilityScore(product, queryData.customerContext)
    }));
}

/**
 * Handle brand comparison requests
 */
async function handleBrandComparison(queryData, sessionId) {
    const brands = extractBrandsFromQuery(queryData.query);
    const products = await searchProducts({ brand: { $in: brands } });
    
    // Group by brand
    const brandGroups = products.reduce((acc, product) => {
        if (!acc[product.brand]) acc[product.brand] = [];
        acc[product.brand].push(product);
        return acc;
    }, {});
    
    // Generate comparison data
    const comparison = {};
    for (const [brand, brandProducts] of Object.entries(brandGroups)) {
        comparison[brand] = {
            productCount: brandProducts.length,
            avgPrice: brandProducts.reduce((sum, p) => sum + p.pricePerUi, 0) / brandProducts.length,
            avgEnergyRating: brandProducts.reduce((sum, p) => sum + (p.energyRating || 0), 0) / brandProducts.length,
            avgWarranty: brandProducts.reduce((sum, p) => sum + (p.warrantyYears || 0), 0) / brandProducts.length,
            products: brandProducts.slice(0, 3) // Top 3 products
        };
    }
    
    return comparison;
}

/**
 * Handle pricing estimate requests
 */
async function handlePricingEstimate(queryData, sessionId) {
    const searchParams = extractSearchParams(queryData.query);
    const products = await searchProducts(searchParams);
    
    if (products.length === 0) {
        return { error: 'No products found for pricing estimate' };
    }
    
    // Generate pricing estimates
    const estimates = products.slice(0, 5).map(product => {
        const basePrice = product.pricePerUi;
        const windowCount = queryData.customerContext?.windowCount || 10;
        
        return {
            product: product,
            pricePerWindow: basePrice,
            totalMaterialCost: basePrice * windowCount,
            estimatedInstallation: basePrice * windowCount * 0.3,
            totalEstimate: basePrice * windowCount * 1.3
        };
    });
    
    return {
        estimates: estimates,
        priceRange: {
            min: Math.min(...estimates.map(e => e.totalEstimate)),
            max: Math.max(...estimates.map(e => e.totalEstimate)),
            avg: estimates.reduce((sum, e) => sum + e.totalEstimate, 0) / estimates.length
        }
    };
}

/**
 * Handle technical specifications requests
 */
async function handleTechnicalSpecs(queryData, sessionId) {
    const searchParams = extractSearchParams(queryData.query);
    const products = await searchProducts(searchParams);
    
    return products.map(product => ({
        productId: product.productId,
        brand: product.brand,
        name: product.name,
        specifications: {
            material: product.material,
            type: product.type,
            energyRating: product.energyRating,
            uFactor: product.uFactor,
            solarHeatGainCoefficient: product.shgc,
            visibleTransmittance: product.vt,
            airLeakage: product.airLeakage,
            warrantyYears: product.warrantyYears
        }
    }));
}

/**
 * Handle energy efficiency requests
 */
async function handleEnergyEfficiency(queryData, sessionId) {
    const products = await searchProducts({ energyRating: { $gte: 6 } });
    
    // Sort by energy efficiency
    const sortedProducts = products.sort((a, b) => (b.energyRating || 0) - (a.energyRating || 0));
    
    return {
        topPerformers: sortedProducts.slice(0, 5),
        energyComparison: sortedProducts.map(product => ({
            product: product.name,
            brand: product.brand,
            energyRating: product.energyRating,
            estimatedSavings: calculateEnergySavings(product, queryData.customerContext)
        }))
    };
}

/**
 * Handle AI analysis requests
 */
async function handleAIAnalysis(queryData, sessionId) {
    if (!queryData.imageData) {
        return { error: 'No image data provided for AI analysis' };
    }
    
    // This would integrate with the existing AI analysis service
    // For now, return a placeholder structure
    return {
        analysisId: generateAnalysisId(),
        windowsDetected: 3,
        confidenceScore: 0.85,
        measurements: [
            { width: 36, height: 48, type: 'double-hung' },
            { width: 24, height: 36, type: 'casement' },
            { width: 48, height: 24, type: 'picture' }
        ],
        recommendations: [
            'Consider energy-efficient double-hung windows for the main openings',
            'Casement windows would work well for the smaller opening',
            'Picture window could maximize natural light'
        ]
    };
}

/**
 * Handle quote generation requests
 */
async function handleQuoteGeneration(queryData, sessionId) {
    const quoteData = {
        customerId: queryData.customerId || sessionId,
        windowCount: queryData.customerContext?.windowCount || 1,
        selectedProducts: queryData.selectedProducts || [],
        customerContext: queryData.customerContext
    };
    
    return await generateQuote(quoteData);
}

// =====================================================================
// AI ANALYSIS AND SUMMARY
// =====================================================================

/**
 * Generate AI analysis and summary using GPT-4
 */
async function generateAIAnalysis(queryData, serviceResults, sessionId) {
    try {
        const openaiApiKey = await getSecret(WIX_SECRETS.OPENAI_API_KEY);
        
        const prompt = buildAnalysisPrompt(queryData, serviceResults);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: AI_ROUTER_CONFIG.RESPONSE_GENERATION.MODEL,
                max_tokens: AI_ROUTER_CONFIG.RESPONSE_GENERATION.MAX_TOKENS,
                temperature: AI_ROUTER_CONFIG.RESPONSE_GENERATION.TEMPERATURE,
                messages: [
                    {
                        role: 'system',
                        content: AI_ROUTER_CONFIG.RESPONSE_GENERATION.SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        
        const data = await response.json();
        const analysisText = data.choices[0].message.content;
        
        // Parse structured response
        return parseAIAnalysis(analysisText);
        
    } catch (error) {
        await logSystemEvent({
            eventType: 'AI_ANALYSIS_ERROR',
            sessionId: sessionId,
            error: error.message
        });
        
        // Fallback to basic analysis
        return generateBasicAnalysis(serviceResults);
    }
}

/**
 * Build analysis prompt for AI
 */
function buildAnalysisPrompt(queryData, serviceResults) {
    return `
User Query: "${queryData.query}"
Customer Context: ${JSON.stringify(queryData.customerContext || {})}

Service Results:
${JSON.stringify(serviceResults, null, 2)}

Please provide a comprehensive analysis including:
1. A customer-friendly summary of the findings
2. Specific recommendations with reasoning
3. Best value and best performance options
4. Confidence level in the recommendations
5. Follow-up questions or suggestions

Format your response as JSON with the following structure:
{
  "summary": "Customer-friendly summary...",
  "recommendation": {
    "bestValue": "Product name and reasoning...",
    "bestPerformance": "Product name and reasoning..."
  },
  "confidence": 0.85,
  "followUpSuggestions": ["suggestion1", "suggestion2"]
}
`;
}

/**
 * Parse AI analysis response
 */
function parseAIAnalysis(analysisText) {
    try {
        return JSON.parse(analysisText);
    } catch (error) {
        // Fallback parsing
        return {
            summary: analysisText,
            recommendation: {
                bestValue: "Please review the product options provided",
                bestPerformance: "Consider the highest-rated products for optimal performance"
            },
            confidence: 0.7,
            followUpSuggestions: [
                "Would you like more specific product recommendations?",
                "Do you need help with measurements or installation?"
            ]
        };
    }
}

/**
 * Generate basic analysis fallback
 */
function generateBasicAnalysis(serviceResults) {
    const productCount = serviceResults.products?.length || 0;
    
    return {
        summary: `Found ${productCount} products matching your criteria. Review the options to find the best fit for your needs.`,
        recommendation: {
            bestValue: productCount > 0 ? serviceResults.products[0].name : "No products found",
            bestPerformance: productCount > 0 ? serviceResults.products[0].name : "No products found"
        },
        confidence: 0.6,
        followUpSuggestions: [
            "Would you like to refine your search criteria?",
            "Do you need help comparing specific products?"
        ]
    };
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Validate query input
 */
function validateQueryInput(queryData) {
    const errors = [];
    
    if (!queryData.query || typeof queryData.query !== 'string') {
        errors.push('Query is required and must be a string');
    }
    
    if (queryData.query && queryData.query.length > 1000) {
        errors.push('Query must be less than 1000 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Extract search parameters from query
 */
function extractSearchParams(query) {
    const lowerQuery = query.toLowerCase();
    const params = {};
    
    // Extract window types
    const windowTypes = ['double-hung', 'casement', 'picture', 'sliding', 'awning', 'bay', 'bow'];
    for (const type of windowTypes) {
        if (lowerQuery.includes(type)) {
            params.type = type;
            break;
        }
    }
    
    // Extract materials
    const materials = ['vinyl', 'wood', 'aluminum', 'fiberglass', 'composite'];
    for (const material of materials) {
        if (lowerQuery.includes(material)) {
            params.material = material;
            break;
        }
    }
    
    // Extract brands
    const brands = ['andersen', 'pella', 'marvin', 'milgard', 'simonton', 'jeld-wen'];
    for (const brand of brands) {
        if (lowerQuery.includes(brand)) {
            params.brand = brand;
            break;
        }
    }
    
    return params;
}

/**
 * Extract brands from query
 */
function extractBrandsFromQuery(query) {
    const lowerQuery = query.toLowerCase();
    const brands = ['andersen', 'pella', 'marvin', 'milgard', 'simonton', 'jeld-wen'];
    
    return brands.filter(brand => lowerQuery.includes(brand));
}

/**
 * Calculate estimated price with context
 */
function calculateEstimatedPrice(product, context) {
    let price = product.pricePerUi;
    
    // Apply context-based adjustments
    if (context?.complexity === 'high') {
        price *= 1.2;
    }
    if (context?.urgency === 'rush') {
        price *= 1.1;
    }
    
    return Math.round(price);
}

/**
 * Calculate suitability score
 */
function calculateSuitabilityScore(product, context) {
    let score = 0.5; // Base score
    
    // Climate suitability
    if (context?.climate === 'cold' && product.energyRating >= 8) {
        score += 0.3;
    }
    
    // Budget alignment
    if (context?.budget && product.pricePerUi <= context.budget) {
        score += 0.2;
    }
    
    return Math.min(1.0, score);
}

/**
 * Calculate energy savings
 */
function calculateEnergySavings(product, context) {
    const baselineRating = 5;
    const ratingDiff = (product.energyRating || baselineRating) - baselineRating;
    const annualSavings = ratingDiff * 50; // $50 per rating point per year
    
    return {
        annual: annualSavings,
        lifetime: annualSavings * (product.warrantyYears || 10)
    };
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate unique analysis ID
 */
function generateAnalysisId() {
    return 'analysis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Extract intents from text (fallback)
 */
function extractIntentsFromText(text) {
    const intentPatterns = {
        'product_lookup': /product|window|find|search/i,
        'brand_comparison': /compare|versus|vs|difference/i,
        'pricing_estimate': /price|cost|estimate|quote/i,
        'technical_specs': /spec|technical|detail|feature/i,
        'energy_efficiency': /energy|efficient|rating/i
    };
    
    const intents = [];
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
        if (pattern.test(text)) {
            intents.push(intent);
        }
    }
    
    return intents.length > 0 ? intents : ['product_lookup'];
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
    routeQuery,
    classifyIntent,
    executeServiceRouting,
    generateAIAnalysis
};

