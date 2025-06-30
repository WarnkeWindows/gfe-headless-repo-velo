/**
 * Unified Pricing Service
 * backend/services/pricing-service.web.js
 * 
 * Handles all pricing calculations including multipliers, estimates, and quote generation
 */

import { getSecret } from 'wix-secrets-backend';
import { 
    createSuccessResponse, 
    createErrorResponse, 
    logSystemEvent,
    getProductCatalog,
    getWindowBrands,
    getWindowTypes
} from '../core/wix-data-service.web.js';
import { 
    ERROR_CODES, 
    SYSTEM_CONSTANTS,
    calculateUniversalInches,
    generateUniqueId 
} from '../config/constants.web.js';

// =====================================================================
// PRICING CONSTANTS
// =====================================================================

const DEFAULT_MULTIPLIERS = {
    base: 1.0,
    labor: 0.3, // 30% of material cost
    overhead: 0.15, // 15% overhead
    profit: 0.20 // 20% profit margin
};

const PRICING_TIERS = {
    economy: { multiplier: 0.8, label: 'Economy' },
    standard: { multiplier: 1.0, label: 'Standard' },
    premium: { multiplier: 1.3, label: 'Premium' },
    luxury: { multiplier: 1.6, label: 'Luxury' }
};

// =====================================================================
// MULTIPLIER MANAGEMENT
// =====================================================================

/**
 * Gets pricing multipliers from Wix secrets (JSON files)
 */
async function getPricingMultipliers() {
    try {
        const multipliers = {
            base: DEFAULT_MULTIPLIERS.base,
            types: {},
            brands: {},
            materials: {},
            options: {}
        };
        
        // Get base price multiplier
        try {
            const baseMultiplier = await getSecret('base_price_multiplier');
            if (baseMultiplier) {
                const parsed = JSON.parse(baseMultiplier);
                multipliers.base = parsed.multiplier || DEFAULT_MULTIPLIERS.base;
            }
        } catch (error) {
            console.warn('Failed to load base price multiplier:', error);
        }
        
        // Get type multipliers
        try {
            const typeMultipliers = await getSecret('type_multipliers');
            if (typeMultipliers) {
                multipliers.types = JSON.parse(typeMultipliers);
            }
        } catch (error) {
            console.warn('Failed to load type multipliers:', error);
        }
        
        // Get brand multipliers
        try {
            const brandMultipliers = await getSecret('brand_multipliers');
            if (brandMultipliers) {
                multipliers.brands = JSON.parse(brandMultipliers);
            }
        } catch (error) {
            console.warn('Failed to load brand multipliers:', error);
        }
        
        // Get material multipliers
        try {
            const materialMultipliers = await getSecret('material_multiplier');
            if (materialMultipliers) {
                multipliers.materials = JSON.parse(materialMultipliers);
            }
        } catch (error) {
            console.warn('Failed to load material multipliers:', error);
        }
        
        // Get options pricing
        try {
            const optionsPricing = await getSecret('options_pricing');
            if (optionsPricing) {
                multipliers.options = JSON.parse(optionsPricing);
            }
        } catch (error) {
            console.warn('Failed to load options pricing:', error);
        }
        
        return multipliers;
        
    } catch (error) {
        console.error('Failed to get pricing multipliers:', error);
        return {
            base: DEFAULT_MULTIPLIERS.base,
            types: {},
            brands: {},
            materials: {},
            options: {}
        };
    }
}

/**
 * Calculates base price for a window
 */
function calculateBasePrice(width, height, baseUnitPrice = 100) {
    if (!width || !height || width <= 0 || height <= 0) {
        return 0;
    }
    
    const universalInches = calculateUniversalInches(width, height);
    return universalInches * baseUnitPrice;
}

/**
 * Applies multipliers to base price
 */
function applyMultipliers(basePrice, multipliers, selections) {
    let finalPrice = basePrice * multipliers.base;
    
    // Apply type multiplier
    if (selections.windowType && multipliers.types[selections.windowType]) {
        finalPrice *= multipliers.types[selections.windowType];
    }
    
    // Apply brand multiplier
    if (selections.brand && multipliers.brands[selections.brand]) {
        finalPrice *= multipliers.brands[selections.brand];
    }
    
    // Apply material multiplier
    if (selections.material && multipliers.materials[selections.material]) {
        finalPrice *= multipliers.materials[selections.material];
    }
    
    return finalPrice;
}

/**
 * Calculates option costs
 */
function calculateOptionCosts(basePrice, options, multipliers) {
    let totalOptionCost = 0;
    
    if (!options || !Array.isArray(options)) {
        return totalOptionCost;
    }
    
    options.forEach(option => {
        if (multipliers.options[option]) {
            const optionData = multipliers.options[option];
            if (optionData.type === 'fixed') {
                totalOptionCost += optionData.cost || 0;
            } else if (optionData.type === 'percentage') {
                totalOptionCost += basePrice * (optionData.percentage || 0);
            }
        }
    });
    
    return totalOptionCost;
}

// =====================================================================
// PRICING CALCULATIONS
// =====================================================================

/**
 * Calculates pricing estimate for windows
 */
export async function calculatePricingEstimate(estimateData) {
    try {
        // Validate input data
        if (!estimateData || !estimateData.measurements || !Array.isArray(estimateData.measurements)) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Measurements array is required'
            }, 'calculatePricingEstimate');
        }
        
        if (estimateData.measurements.length === 0) {
            return createErrorResponse({
                code: ERROR_CODES.VALIDATION_FAILED,
                message: 'At least one measurement is required'
            }, 'calculatePricingEstimate');
        }
        
        // Get pricing multipliers
        const multipliers = await getPricingMultipliers();
        
        // Calculate pricing for each window
        const windowPricing = [];
        let totalMaterialCost = 0;
        let totalLaborCost = 0;
        let totalOptionCost = 0;
        
        for (let i = 0; i < estimateData.measurements.length; i++) {
            const measurement = estimateData.measurements[i];
            const selections = estimateData.selections || {};
            const options = estimateData.options || [];
            
            // Validate measurement
            if (!measurement.width || !measurement.height) {
                continue;
            }
            
            // Calculate base price
            const basePrice = calculateBasePrice(
                measurement.width, 
                measurement.height, 
                selections.baseUnitPrice || 100
            );
            
            // Apply multipliers
            const materialPrice = applyMultipliers(basePrice, multipliers, selections);
            
            // Calculate labor cost
            const laborPrice = materialPrice * DEFAULT_MULTIPLIERS.labor;
            
            // Calculate option costs
            const optionPrice = calculateOptionCosts(materialPrice, options, multipliers);
            
            // Calculate total for this window
            const windowTotal = materialPrice + laborPrice + optionPrice;
            
            const windowPriceData = {
                windowId: measurement.windowId || `window_${i + 1}`,
                width: measurement.width,
                height: measurement.height,
                universalInches: calculateUniversalInches(measurement.width, measurement.height),
                basePrice: basePrice,
                materialPrice: materialPrice,
                laborPrice: laborPrice,
                optionPrice: optionPrice,
                totalPrice: windowTotal,
                selections: selections,
                options: options
            };
            
            windowPricing.push(windowPriceData);
            
            totalMaterialCost += materialPrice;
            totalLaborCost += laborPrice;
            totalOptionCost += optionPrice;
        }
        
        // Calculate totals
        const subtotal = totalMaterialCost + totalLaborCost + totalOptionCost;
        const overhead = subtotal * DEFAULT_MULTIPLIERS.overhead;
        const profit = subtotal * DEFAULT_MULTIPLIERS.profit;
        const totalBeforeTax = subtotal + overhead + profit;
        
        // Apply any discount
        const discount = estimateData.discount || 0;
        const discountAmount = totalBeforeTax * (discount / 100);
        const totalAfterDiscount = totalBeforeTax - discountAmount;
        
        // Calculate tax (if applicable)
        const taxRate = estimateData.taxRate || 0;
        const taxAmount = totalAfterDiscount * (taxRate / 100);
        const finalTotal = totalAfterDiscount + taxAmount;
        
        // Prepare estimate result
        const estimate = {
            estimateId: generateUniqueId(),
            customerId: estimateData.customerId,
            timestamp: new Date().toISOString(),
            windowCount: windowPricing.length,
            windowPricing: windowPricing,
            breakdown: {
                materialCost: totalMaterialCost,
                laborCost: totalLaborCost,
                optionCost: totalOptionCost,
                subtotal: subtotal,
                overhead: overhead,
                profit: profit,
                totalBeforeTax: totalBeforeTax,
                discount: discountAmount,
                totalAfterDiscount: totalAfterDiscount,
                tax: taxAmount,
                finalTotal: finalTotal
            },
            multipliers: {
                base: multipliers.base,
                labor: DEFAULT_MULTIPLIERS.labor,
                overhead: DEFAULT_MULTIPLIERS.overhead,
                profit: DEFAULT_MULTIPLIERS.profit
            },
            selections: estimateData.selections || {},
            options: estimateData.options || [],
            notes: estimateData.notes || ''
        };
        
        // Log pricing calculation
        await logSystemEvent({
            eventType: 'pricing_calculated',
            endpoint: 'calculatePricingEstimate',
            customerId: estimateData.customerId,
            windowCount: windowPricing.length,
            finalTotal: finalTotal,
            estimateId: estimate.estimateId
        });
        
        return createSuccessResponse(estimate, 'Pricing estimate calculated successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'calculatePricingEstimate');
    }
}

/**
 * Gets pricing multipliers for frontend display
 */
export async function getPricingMultipliersForDisplay() {
    try {
        const multipliers = await getPricingMultipliers();
        
        // Format for frontend consumption
        const displayMultipliers = {
            windowTypes: Object.keys(multipliers.types).map(type => ({
                name: type,
                multiplier: multipliers.types[type],
                displayName: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            })),
            
            brands: Object.keys(multipliers.brands).map(brand => ({
                name: brand,
                multiplier: multipliers.brands[brand],
                displayName: brand
            })),
            
            materials: Object.keys(multipliers.materials).map(material => ({
                name: material,
                multiplier: multipliers.materials[material],
                displayName: material.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            })),
            
            options: Object.keys(multipliers.options).map(option => ({
                name: option,
                cost: multipliers.options[option].cost || 0,
                type: multipliers.options[option].type || 'fixed',
                percentage: multipliers.options[option].percentage || 0,
                displayName: option.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            })),
            
            pricingTiers: Object.keys(PRICING_TIERS).map(tier => ({
                name: tier,
                multiplier: PRICING_TIERS[tier].multiplier,
                label: PRICING_TIERS[tier].label
            }))
        };
        
        return createSuccessResponse(displayMultipliers, 'Pricing multipliers retrieved successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'getPricingMultipliersForDisplay');
    }
}

/**
 * Generates quick price estimate based on square footage
 */
export async function generateQuickEstimate(squareFootage, tier = 'standard', options = []) {
    try {
        if (!squareFootage || squareFootage <= 0) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Valid square footage is required'
            }, 'generateQuickEstimate');
        }
        
        // Base price per square foot (this would typically come from configuration)
        const basePricePerSqFt = 150; // $150 per sq ft base
        
        // Get tier multiplier
        const tierData = PRICING_TIERS[tier] || PRICING_TIERS.standard;
        
        // Calculate base cost
        const baseCost = squareFootage * basePricePerSqFt * tierData.multiplier;
        
        // Add labor
        const laborCost = baseCost * DEFAULT_MULTIPLIERS.labor;
        
        // Calculate option costs (simplified)
        let optionCost = 0;
        if (options && options.length > 0) {
            optionCost = baseCost * 0.1 * options.length; // 10% per option
        }
        
        // Calculate totals
        const subtotal = baseCost + laborCost + optionCost;
        const overhead = subtotal * DEFAULT_MULTIPLIERS.overhead;
        const profit = subtotal * DEFAULT_MULTIPLIERS.profit;
        const total = subtotal + overhead + profit;
        
        // Create estimate ranges (±20%)
        const lowEstimate = total * 0.8;
        const highEstimate = total * 1.2;
        
        const quickEstimate = {
            estimateId: generateUniqueId(),
            timestamp: new Date().toISOString(),
            squareFootage: squareFootage,
            tier: tier,
            tierLabel: tierData.label,
            basePricePerSqFt: basePricePerSqFt,
            breakdown: {
                baseCost: baseCost,
                laborCost: laborCost,
                optionCost: optionCost,
                overhead: overhead,
                profit: profit,
                total: total
            },
            estimateRange: {
                low: lowEstimate,
                high: highEstimate,
                average: total
            },
            options: options,
            disclaimer: 'This is a preliminary estimate. Final pricing may vary based on specific measurements, product selections, and site conditions.'
        };
        
        return createSuccessResponse(quickEstimate, 'Quick estimate generated successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'generateQuickEstimate');
    }
}

/**
 * Compares pricing across different tiers
 */
export async function comparePricingTiers(measurements, baseSelections = {}) {
    try {
        if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
            return createErrorResponse({
                code: ERROR_CODES.REQUIRED_FIELD_MISSING,
                message: 'Measurements array is required'
            }, 'comparePricingTiers');
        }
        
        const tierComparisons = [];
        
        // Calculate pricing for each tier
        for (const [tierName, tierData] of Object.entries(PRICING_TIERS)) {
            const estimateData = {
                measurements: measurements,
                selections: {
                    ...baseSelections,
                    tier: tierName,
                    baseUnitPrice: (baseSelections.baseUnitPrice || 100) * tierData.multiplier
                }
            };
            
            const estimate = await calculatePricingEstimate(estimateData);
            
            if (estimate.success) {
                tierComparisons.push({
                    tier: tierName,
                    label: tierData.label,
                    multiplier: tierData.multiplier,
                    totalPrice: estimate.data.breakdown.finalTotal,
                    pricePerWindow: estimate.data.breakdown.finalTotal / measurements.length,
                    breakdown: estimate.data.breakdown
                });
            }
        }
        
        // Sort by price
        tierComparisons.sort((a, b) => a.totalPrice - b.totalPrice);
        
        return createSuccessResponse({
            comparisons: tierComparisons,
            windowCount: measurements.length,
            timestamp: new Date().toISOString()
        }, 'Pricing tier comparison completed successfully');
        
    } catch (error) {
        return createErrorResponse(error, 'comparePricingTiers');
    }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Formats price for display
 */
export function formatPrice(price, includeCents = false) {
    if (typeof price !== 'number' || isNaN(price)) {
        return '$0.00';
    }
    
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: includeCents ? 2 : 0,
        maximumFractionDigits: includeCents ? 2 : 0
    });
    
    return formatter.format(price);
}

/**
 * Calculates financing options
 */
export function calculateFinancingOptions(totalAmount, downPayment = 0) {
    const financedAmount = totalAmount - downPayment;
    const options = [];
    
    // Common financing terms
    const terms = [
        { months: 12, apr: 0.0 }, // 12 months no interest
        { months: 24, apr: 0.0599 }, // 24 months 5.99%
        { months: 36, apr: 0.0799 }, // 36 months 7.99%
        { months: 60, apr: 0.0999 }  // 60 months 9.99%
    ];
    
    terms.forEach(term => {
        const monthlyRate = term.apr / 12;
        let monthlyPayment;
        
        if (term.apr === 0) {
            monthlyPayment = financedAmount / term.months;
        } else {
            monthlyPayment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, term.months)) / 
                            (Math.pow(1 + monthlyRate, term.months) - 1);
        }
        
        options.push({
            months: term.months,
            apr: term.apr,
            monthlyPayment: monthlyPayment,
            totalPayments: monthlyPayment * term.months,
            totalInterest: (monthlyPayment * term.months) - financedAmount
        });
    });
    
    return options;
}

