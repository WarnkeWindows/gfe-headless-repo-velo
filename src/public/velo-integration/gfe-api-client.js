/**
 * Frontend API Client
 * Good Faith Exteriors - Window Estimator Frontend
 * public/js/gfe-api-client.js
 *
 * Handles all frontend-backend communication with proper error handling
 * Provides consistent API interface for Wix frontend components
 */
// @ts-ignore
window.gfeApi;
const UI_ELEMENT_IDS = {
    // Image upload and analysis
    imageInput: '#uploadButton',
    uploadedImageDisplay: '#uploadedImage',
    analyzeImageButton: '#analyzeImage',
    retakePhotoButton: '#retakePhoto',
    // Window measurements
    widthInput: '#width',
    heightInput: '#height',
    quantityInput: '#quantity',
    windowTypeDropdown: '#windowType',
    materialDropdown: '#material',
    brandDropdown: '#brand',
    // Calculation and results
    calculatePriceButton: '#calculatePrice',
    estimateResults: '#estimateResults',
    // AI analysis status
    aiAnalysisStatus: '#aiAnalysisStatus',
    aiAnalysisResult: '#aiAnalysisResult',
    windowAdvisorText: '#windowAdvisorText',
    // Customer information
    customerName: '#customerName',
    customerEmail: '#customerEmail',
    customerPhone: '#customerPhone',
    customerAddress: '#customerAddress',
    // Quote and communication
    quoteExplanation: '#quoteExplanation',
    sendQuoteButton: '#sendQuote',
    scheduleConsultationButton: '#scheduleConsultation'
};

// =====================================================================
// API CLIENT CLASS
// =====================================================================

class GFEFrontendApiClient {
    constructor() {
        this.baseUrl = '/_functions'; // Velo HTTP Functions are exposed under /_functions
        this.sessionId = this.generateSessionId();
    }

    // Helper to generate a session ID
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generic request helper for API calls
     */
    async makeRequest(method, path, data) {
        const fullPath = `${this.baseUrl}${path}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        };

        try {
            const response = await fetch(fullPath, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || result.message || 'API request failed');
            }
            return result;
        } catch (error) {
            console.error(`Frontend API call to ${fullPath} failed:`, error);
            this.displayError(`Request failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * POST request helper
     */
    async post(path, data) {
        return this.makeRequest('POST', path, data);
    }

    /**
     * GET request helper
     */
    async get(path, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullPath = queryString ? `${path}?${queryString}` : path;
        return this.makeRequest('GET', fullPath);
    }

    // =====================================================================
    // AI ANALYSIS METHODS
    // =====================================================================

    /**
     * Analyze window image using Claude AI
     */
    async analyzeWindow(imageData, customerInfo = {}, analysisType = 'detailed') {
        this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Analyzing image with AI...', false);
        try {
            const result = await this.post('/api/analyze-window', {
                imageData,
                context: {
                    sessionId: this.sessionId,
                    customerInfo
                },
                analysisType
            });
            this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Analysis complete!', false);
            // Update UI with analysis results
            if (result.analysis) {
                this.updateAnalysisResults(result.analysis);
            }
            return result;
        } catch (error) {
            this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Analysis failed. Please try again.', true);
            throw error;
        }
    }

    /**
     * Validate measurements using AI
     */
    async validateMeasurements(measurements, windowType, context = {}) {
        try {
            const result = await this.post('/api/validate-measurements', {
                measurements,
                windowType,
                sessionId: this.sessionId,
                context
            });
            return result;
        } catch (error) {
            console.error('Measurement validation failed:', error);
            throw error;
        }
    }

    // =====================================================================
    // PRICING AND QUOTE METHODS
    // =====================================================================

    /**
     * Calculate window replacement quote
     */
    async calculateQuote(windows, customerInfo = {}) {
        this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Calculating quote...', false);
        try {
            const result = await this.post('/api/calculate-quote', {
                windows,
                customerInfo,
                sessionId: this.sessionId
            });
            this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Quote calculated successfully!', false);
            // Update UI with quote results
            if (result.quote) {
                this.updateQuoteResults(result.quote);
            }
            return result;
        } catch (error) {
            this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, 'Quote calculation failed. Please try again.', true);
            throw error;
        }
    }

    /**
     * Create quote item - saves individual window item to backend
     */
    async createQuoteItem(quoteItemData) {
        try {
            const result = await this.post('/api/create-quote-item', {
                ...quoteItemData,
                sessionId: this.sessionId,
                timestamp: new Date().toISOString()
            });
            return result;
        } catch (error) {
            console.error('Failed to create quote item:', error);
            throw error;
        }
    }

    /**
     * Generate personalized quote explanation
     */
    async generateQuoteExplanation(quoteData, customerProfile = {}) {
        try {
            const result = await this.post('/api/generate-quote-explanation', {
                quoteData,
                customerProfile,
                sessionId: this.sessionId
            });
            // Update UI with explanation
            if (result.explanation) {
                this.displayMessage(UI_ELEMENT_IDS.quoteExplanation, result.explanation, false);
            }
            return result;
        } catch (error) {
            console.error('Quote explanation generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate customer communication
     */
    async generateCustomerCommunication(customerInfo, messageType, contextData = {}) {
        try {
            const result = await this.post('/api/generate-customer-communication', {
                customerInfo,
                messageType,
                contextData,
                sessionId: this.sessionId
            });
            return result;
        } catch (error) {
            console.error('Customer communication generation failed:', error);
            throw error;
        }
    }

    // =====================================================================
    // DATA RETRIEVAL METHODS
    // =====================================================================

    /**
     * Get window materials
     */
    async getMaterials() {
        try {
            const result = await this.get('/api/materials');
            return result.materials || [];
        } catch (error) {
            console.error('Failed to get materials:', error);
            return [];
        }
    }

    /**
     * Get window types
     */
    async getWindowTypes() {
        try {
            const result = await this.get('/api/window-types');
            return result.windowTypes || [];
        } catch (error) {
            console.error('Failed to get window types:', error);
            return [];
        }
    }

    /**
     * Get window brands
     */
    async getWindowBrands() {
        try {
            const result = await this.get('/api/window-brands');
            return result.brands || [];
        } catch (error) {
            console.error('Failed to get window brands:', error);
            return [];
        }
    }

    /**
     * Get window products
     */
    async getWindowProducts(filters = {}) {
        try {
            const result = await this.get('/api/window-products', filters);
            return result.products || [];
        } catch (error) {
            console.error('Failed to get window products:', error);
            return [];
        }
    }

    /**
     * Get configuration data
     */
    async getConfiguration() {
        try {
            const result = await this.get('/api/configuration');
            return result.config || {};
        } catch (error) {
            console.error('Failed to get configuration:', error);
            return {};
        }
    }

    // =====================================================================
    // CUSTOMER METHODS
    // =====================================================================

    /**
     * Create or update customer
     */
    async createOrUpdateCustomer(customerData) {
        try {
            const result = await this.post('/api/customer', customerData);
            return result;
        } catch (error) {
            console.error('Failed to create/update customer:', error);
            throw error;
        }
    }

    /**
     * Get customer by email
     */
    async getCustomerByEmail(email) {
        try {
            const result = await this.get('/api/customer', { email });
            return result;
        } catch (error) {
            console.error('Failed to get customer:', error);
            throw error;
        }
    }

    // =====================================================================
    // UI UPDATE METHODS
    // =====================================================================

    /**
     * Display message in UI element
     */
    displayMessage(elementId, message, isError = false) {
        try {
            const element = $w(elementId);
            if (element) {
                element.text = message;
                if (isError) {
                    element.style.color = '#F44336'; // Red for errors
                } else {
                    element.style.color = '#4CAF50'; // Green for success
                }
                element.show();
            }
        } catch (error) {
            console.error(`Failed to display message in ${elementId}:`, error);
        }
    }

    /**
     * Display error message
     */
    displayError(message) {
        this.displayMessage(UI_ELEMENT_IDS.aiAnalysisStatus, message, true);
    }

    /**
     * Update analysis results in UI
     */
    updateAnalysisResults(analysis) {
        try {
            if (!analysis) return;
            
            // Update measurement inputs if analysis contains estimates
            if (analysis.estimatedWidth && $w(UI_ELEMENT_IDS.widthInput)) {
                $w(UI_ELEMENT_IDS.widthInput).value = analysis.estimatedWidth.toString();
            }
            if (analysis.estimatedHeight && $w(UI_ELEMENT_IDS.heightInput)) {
                $w(UI_ELEMENT_IDS.heightInput).value = analysis.estimatedHeight.toString();
            }
            
            // Update dropdowns if analysis contains suggestions
            if (analysis.windowType && $w(UI_ELEMENT_IDS.windowTypeDropdown)) {
                $w(UI_ELEMENT_IDS.windowTypeDropdown).value = analysis.windowType;
            }
            if (analysis.material && $w(UI_ELEMENT_IDS.materialDropdown)) {
                $w(UI_ELEMENT_IDS.materialDropdown).value = analysis.material;
            }
            
            // Display analysis notes and recommendations
            const analysisText = `
AI Analysis Results:
Window Type: ${analysis.windowType || 'Unknown'}
Estimated Dimensions: ${analysis.estimatedWidth || 'N/A'}x${analysis.estimatedHeight || 'N/A'}
Material: ${analysis.material || 'Unknown'}
Confidence: ${analysis.confidence || 0}%

${analysis.notes ? 'Notes: ' + analysis.notes : ''}
${analysis.recommendations ? 'Recommendations:\n• ' + analysis.recommendations.join('\n• ') : ''}
            `;
            
            this.displayMessage(UI_ELEMENT_IDS.aiAnalysisResult, analysisText.trim(), false);
            
        } catch (error) {
            console.error('Failed to update analysis results:', error);
        }
    }

    /**
     * Update quote results in UI
     */
    updateQuoteResults(quote) {
        try {
            if (!quote.summary) return;
            const summary = quote.summary;
            const resultsText = `
Quote Summary:
• ${summary.windowCount} window(s), ${summary.totalQuantity} total units
• Subtotal: $${summary.subtotal}
• Labor: $${summary.totalLabor}
• Tax: $${summary.totalTax}
• Total: $${summary.finalTotal}
Energy Savings:
• Estimated annual savings: $${quote.energySavings?.estimatedAnnualSavings || '0'}
• Payback period: ${quote.energySavings?.paybackPeriod || 'N/A'} years
            `;
            this.displayMessage(UI_ELEMENT_IDS.estimateResults, resultsText, false);
        } catch (error) {
            console.error('Failed to update quote results:', error);
        }
    }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Validate frontend input
 */
function validateFrontendInput(value, fieldName) {
    if (!value || String(value).trim() === '') {
        const gfeApiInstance = // @ts-ignore
window.gfeApi;  new GFEFrontendApiClient();
        gfeApiInstance.displayError(`${fieldName} cannot be empty.`);
        return false;
    }
    return true;
}

/**
 * Get customer info from form
 */
function getCustomerInfoFromForm() {
    try {
        return {
            name: $w(UI_ELEMENT_IDS.customerName)?.value || '',
            email: $w(UI_ELEMENT_IDS.customerEmail)?.value || '',
            phone: $w(UI_ELEMENT_IDS.customerPhone)?.value || '',
            address: $w(UI_ELEMENT_IDS.customerAddress)?.value || ''
        };
    } catch (error) {
        console.error('Failed to get customer info from form:', error);
        return {};
    }
}

/**
 * Get window data from form
 */
function getWindowDataFromForm() {
    try {
        return {
            width: $w(UI_ELEMENT_IDS.widthInput)?.value || '36',
            height: $w(UI_ELEMENT_IDS.heightInput)?.value || '48',
            quantity: $w(UI_ELEMENT_IDS.quantityInput)?.value || '1',
            windowType: $w(UI_ELEMENT_IDS.windowTypeDropdown)?.value || 'Single Hung',
            material: $w(UI_ELEMENT_IDS.materialDropdown)?.value || 'Vinyl',
            brand: $w(UI_ELEMENT_IDS.brandDropdown)?.value || 'Standard'
        };
    } catch (error) {
        console.error('Failed to get window data from form:', error);
        return {
            width: '36',
            height: '48',
            quantity: '1',
            windowType: 'Single Hung',
            material: 'Vinyl',
            brand: 'Standard'
        };
    }
}

// =====================================================================
// GLOBAL INSTANCE AND EXPORTS
// =====================================================================

// Create global API client instance
const gfeApi = new GFEFrontendApiClient();
// @ts-ignore
window.gfeApi;

// Export for use in other modules
export {
    GFEFrontendApiClient,
    gfeApi,
    UI_ELEMENT_IDS,
    fileToBase64,
    validateFrontendInput,
    getCustomerInfoFromForm,
    getWindowDataFromForm
};