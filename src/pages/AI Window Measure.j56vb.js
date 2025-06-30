// =====================================================================
// GOOD FAITH EXTERIORS - VELO PAGE CODE
// Complete Integration for AI Window Estimator Iframe
// =====================================================================

import { initializeSecrets, getSecretsManager } from 'backend/secrets.js';
import { initializeAIService, getAIService, analyzeWindow } from 'backend/velo-backend-ai-service.js';
import { initializePricingService, getPricingService, calculatePrice, generateQuote } from 'backend/velo-backend-pricing-service.js';
import wixData from 'wix-data';
import { sendEmail } from 'wix-crm-backend';

// =====================================================================
// GLOBAL VARIABLES AND INITIALIZATION
// =====================================================================

let servicesInitialized = false;
let activeIframes = new Map(); // Track active iframe sessions
let userSessions = new Map(); // Track user sessions and data

/**
 * Page initialization - called when page loads
 */
$w.onReady(async function () {
    console.log('🏠 Good Faith Exteriors - Velo Page Loading...');
    
    try {
        // Initialize all backend services
        await initializeBackendServices();
        
        // Setup iframe message handlers
        setupIframeHandlers();
        
        // Initialize page elements
        initializePageElements();
        
        console.log('✅ Good Faith Exteriors page initialized successfully');
        
    } catch (error) {
        console.error('❌ Page initialization failed:', error);
        showErrorMessage('System initialization failed. Please refresh the page.');
    }
});

/**
 * Initialize all backend services
 */
async function initializeBackendServices() {
    if (servicesInitialized) return;
    
    console.log('🔧 Initializing backend services...');
    
    try {
        // Initialize secrets manager
        await initializeSecrets();
        console.log('✅ Secrets manager initialized');
        
        // Initialize AI service
        await initializeAIService();
        console.log('✅ AI service initialized');
        
        // Initialize pricing service
        await initializePricingService();
        console.log('✅ Pricing service initialized');
        
        servicesInitialized = true;
        
    } catch (error) {
        console.error('❌ Backend services initialization failed:', error);
        throw error;
    }
}

/**
 * Setup iframe message handlers
 */
function setupIframeHandlers() {
    // Main AI Window Estimator iframe
    if ($w('#aiWindowMeasureIframe')) {
        $w('#aiWindowMeasureIframe').onMessage(handleAIWindowMessage);
        console.log('✅ AI Window Measure iframe handler setup');
    }
    
    // AI Advisor iframe
    if ($w('#aiWindowAdvisorIframe')) {
        $w('#aiWindowAdvisorIframe').onMessage(handleAIAdvisorMessage);
        console.log('✅ AI Window Advisor iframe handler setup');
    }
    
    // Good Faith Estimate iframe
    if ($w('#goodFaithEstimateIframe')) {
        $w('#goodFaithEstimateIframe').onMessage(handleEstimateMessage);
        console.log('✅ Good Faith Estimate iframe handler setup');
    }
    
    // Window Products Browser iframe
    if ($w('#windowProductsBrowserIframe')) {
        $w('#windowProductsBrowserIframe').onMessage(handleProductsBrowserMessage);
        console.log('✅ Window Products Browser iframe handler setup');
    }
}

/**
 * Initialize page elements
 */
function initializePageElements() {
    // Hide loading overlays if they exist
    if ($w('#loadingOverlay')) {
        $w('#loadingOverlay').hide();
    }
    
    // Setup any page-level buttons or elements
    if ($w('#refreshSystemBtn')) {
        $w('#refreshSystemBtn').onClick(refreshSystem);
    }
    
    if ($w('#systemStatusBtn')) {
        $w('#systemStatusBtn').onClick(showSystemStatus);
    }
}

// =====================================================================
// MAIN AI WINDOW MEASURE IFRAME HANDLERS
// =====================================================================

/**
 * Handle messages from the main AI Window Measure iframe
 */
async function handleAIWindowMessage(event) {
    const { type, data } = event.data;
    const sessionId = data?.sessionId || 'unknown';
    
    console.log('📥 AI Window Message:', type, 'Session:', sessionId);
    
    try {
        switch (type) {
            case 'gfe_iframe_message':
                await handleGFEIframeMessage(event.data, '#aiWindowMeasureIframe');
                break;
                
            default:
                console.warn('⚠️ Unknown AI Window message type:', type);
        }
    } catch (error) {
        console.error('❌ Error handling AI Window message:', error);
        sendErrorToIframe('#aiWindowMeasureIframe', error.message, sessionId);
    }
}

/**
 * Handle GFE iframe messages (main message router)
 */
async function handleGFEIframeMessage(message, iframeId) {
    const { eventType, data } = message;
    const sessionId = data?.sessionId || 'unknown';
    
    // Track active iframe session
    activeIframes.set(sessionId, {
        iframeId: iframeId,
        lastActivity: new Date().toISOString(),
        data: data
    });
    
    switch (eventType) {
        case 'iframe_ready':
            await handleIframeReady(data, iframeId);
            break;
            
        case 'ai_analysis_request':
            await handleAIAnalysisRequest(data, iframeId);
            break;
            
        case 'measurement_validation_request':
            await handleMeasurementValidation(data, iframeId);
            break;
            
        case 'estimate_calculation_request':
            await handleEstimateCalculation(data, iframeId);
            break;
            
        case 'email_quote_request':
            await handleEmailQuote(data, iframeId);
            break;
            
        case 'consultation_request':
            await handleConsultationRequest(data, iframeId);
            break;
            
        case 'brand_selected':
            await handleBrandSelection(data, iframeId);
            break;
            
        case 'window_type_selected':
            await handleWindowTypeSelection(data, iframeId);
            break;
            
        case 'brochure_viewed':
            await handleBrochureView(data, iframeId);
            break;
            
        case 'tab_changed':
            await handleTabChange(data, iframeId);
            break;
            
        case 'form_changed':
            await handleFormChange(data, iframeId);
            break;
            
        default:
            console.warn('⚠️ Unknown GFE event type:', eventType);
    }
}

// =====================================================================
// SPECIFIC EVENT HANDLERS
// =====================================================================

/**
 * Handle iframe ready event
 */
async function handleIframeReady(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('🚀 Iframe ready:', iframeId, 'Session:', sessionId);
    
    // Initialize user session
    userSessions.set(sessionId, {
        startTime: new Date().toISOString(),
        iframeId: iframeId,
        interactions: [],
        currentData: {}
    });
    
    // Send initial configuration to iframe
    const config = {
        features: getSecretsManager().getFrontendConfig().features,
        branding: {
            companyName: 'Good Faith Exteriors',
            phone: '651-416-8669',
            website: 'https://goodfaithexteriors.com'
        },
        sessionId: sessionId
    };
    
    sendMessageToIframe(iframeId, 'initial_config', config);
    
    // Log session start
    await logUserInteraction(sessionId, 'session_start', { iframeId });
}

/**
 * Handle AI analysis request
 */
async function handleAIAnalysisRequest(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('🤖 AI Analysis requested for session:', sessionId);
    
    try {
        // Get user identifier for rate limiting
        const userIdentifier = await getUserIdentifier(sessionId);
        
        // Perform AI analysis
        const analysisResult = await analyzeWindow(
            data.imageData,
            sessionId,
            userIdentifier
        );
        
        // Send results back to iframe
        sendMessageToIframe(iframeId, 'ai_analysis_response', {
            success: true,
            results: analysisResult.analysis,
            sessionId: sessionId
        });
        
        // Store analysis in user session
        updateUserSession(sessionId, 'aiAnalysis', analysisResult);
        
        // Log interaction
        await logUserInteraction(sessionId, 'ai_analysis_completed', {
            confidence: analysisResult.analysis.confidence,
            windowType: analysisResult.analysis.windowType
        });
        
    } catch (error) {
        console.error('❌ AI Analysis failed:', error);
        
        sendMessageToIframe(iframeId, 'ai_analysis_response', {
            success: false,
            error: error.message,
            sessionId: sessionId
        });
        
        await logUserInteraction(sessionId, 'ai_analysis_failed', { error: error.message });
    }
}

/**
 * Handle measurement validation
 */
async function handleMeasurementValidation(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('📏 Measurement validation for session:', sessionId);
    
    try {
        const { measurements, windowType, material, brand } = data;
        
        // Validate measurements
        const validation = validateMeasurements(measurements, windowType);
        
        // Send validation results
        sendMessageToIframe(iframeId, 'measurement_validation_response', {
            isValid: validation.isValid,
            feedback: validation.feedback,
            suggestions: validation.suggestions,
            sessionId: sessionId
        });
        
        // Store measurements in user session
        updateUserSession(sessionId, 'measurements', {
            ...measurements,
            windowType,
            material,
            brand,
            validated: validation.isValid
        });
        
        await logUserInteraction(sessionId, 'measurements_validated', {
            isValid: validation.isValid,
            windowType: windowType
        });
        
    } catch (error) {
        console.error('❌ Measurement validation failed:', error);
        sendErrorToIframe(iframeId, error.message, sessionId);
    }
}

/**
 * Handle estimate calculation
 */
async function handleEstimateCalculation(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('💰 Estimate calculation for session:', sessionId);
    
    try {
        const { customer, specifications, estimate } = data;
        
        // Calculate pricing using backend service
        const pricingService = getPricingService();
        const calculation = pricingService.calculateWindowPrice(specifications);
        
        // Generate formal quote
        const quote = await pricingService.generateQuote(customer, calculation);
        
        // Save quote to database
        const savedQuote = await saveQuoteToDatabase(quote, sessionId);
        
        // Send results back to iframe
        sendMessageToIframe(iframeId, 'estimate_calculation_response', {
            success: true,
            estimate: calculation,
            quote: quote,
            quoteId: savedQuote._id,
            sessionId: sessionId
        });
        
        // Update user session
        updateUserSession(sessionId, 'quote', {
            calculation: calculation,
            quote: quote,
            quoteId: savedQuote._id
        });
        
        await logUserInteraction(sessionId, 'estimate_calculated', {
            total: calculation.pricing.total,
            quoteId: savedQuote._id
        });
        
    } catch (error) {
        console.error('❌ Estimate calculation failed:', error);
        
        sendMessageToIframe(iframeId, 'estimate_calculation_response', {
            success: false,
            error: error.message,
            sessionId: sessionId
        });
        
        await logUserInteraction(sessionId, 'estimate_calculation_failed', { error: error.message });
    }
}

/**
 * Handle email quote request
 */
async function handleEmailQuote(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('📧 Email quote request for session:', sessionId);
    
    try {
        const userSession = userSessions.get(sessionId);
        if (!userSession || !userSession.currentData.quote) {
            throw new Error('No quote available to email');
        }
        
        const quote = userSession.currentData.quote.quote;
        const customerEmail = data.customerEmail || quote.customer.email;
        
        // Send email using Wix CRM
        await sendQuoteEmail(customerEmail, quote);
        
        // Update quote status in database
        await updateQuoteStatus(quote.quoteId, 'emailed');
        
        sendMessageToIframe(iframeId, 'email_quote_response', {
            success: true,
            message: `Quote sent to ${customerEmail}`,
            sessionId: sessionId
        });
        
        await logUserInteraction(sessionId, 'quote_emailed', { 
            email: customerEmail,
            quoteId: quote.quoteId 
        });
        
    } catch (error) {
        console.error('❌ Email quote failed:', error);
        sendErrorToIframe(iframeId, error.message, sessionId);
    }
}

/**
 * Handle consultation request
 */
async function handleConsultationRequest(data, iframeId) {
    const sessionId = data.sessionId;
    console.log('📅 Consultation request for session:', sessionId);
    
    try {
        const { customerName, customerPhone } = data;
        
        // Create lead in CRM
        const lead = await createCRMLead({
            name: customerName,
            phone: customerPhone,
            source: 'AI Window Estimator',
            sessionId: sessionId,
            requestType: 'consultation'
        });
        
        // Schedule follow-up task
        await scheduleFollowUp(lead._id, customerName, customerPhone);
        
        sendMessageToIframe(iframeId, 'consultation_response', {
            success: true,
            message: 'Consultation request received. We will contact you within 24 hours.',
            leadId: lead._id,
            sessionId: sessionId
        });
        
        await logUserInteraction(sessionId, 'consultation_requested', {
            leadId: lead._id,
            customerName: customerName
        });
        
    } catch (error) {
        console.error('❌ Consultation request failed:', error);
        sendErrorToIframe(iframeId, error.message, sessionId);
    }
}

/**
 * Handle brand selection
 */
async function handleBrandSelection(data, iframeId) {
    const sessionId = data.sessionId;
    const brand = data.brand;
    
    console.log('🏷️ Brand selected:', brand, 'Session:', sessionId);
    
    // Update user session
    updateUserSession(sessionId, 'selectedBrand', brand);
    
    // Log interaction
    await logUserInteraction(sessionId, 'brand_selected', { brand: brand });
    
    // Send brand-specific data if needed
    const brandData = await getBrandData(brand);
    if (brandData) {
        sendMessageToIframe(iframeId, 'brand_data', {
            brand: brand,
            data: brandData,
            sessionId: sessionId
        });
    }
}

/**
 * Handle window type selection
 */
async function handleWindowTypeSelection(data, iframeId) {
    const sessionId = data.sessionId;
    const windowType = data.type;
    
    console.log('🪟 Window type selected:', windowType, 'Session:', sessionId);
    
    // Update user session
    updateUserSession(sessionId, 'selectedWindowType', {
        type: windowType,
        multiplier: data.multiplier
    });
    
    await logUserInteraction(sessionId, 'window_type_selected', { 
        windowType: windowType,
        multiplier: data.multiplier 
    });
}

/**
 * Handle brochure view
 */
async function handleBrochureView(data, iframeId) {
    const sessionId = data.sessionId;
    
    console.log('📄 Brochure viewed:', data.url, 'Session:', sessionId);
    
    await logUserInteraction(sessionId, 'brochure_viewed', {
        url: data.url,
        brand: data.brand
    });
}

/**
 * Handle tab change
 */
async function handleTabChange(data, iframeId) {
    const sessionId = data.sessionId;
    const tab = data.tab;
    
    console.log('📑 Tab changed to:', tab, 'Session:', sessionId);
    
    // Update user session
    updateUserSession(sessionId, 'currentTab', tab);
    
    await logUserInteraction(sessionId, 'tab_changed', { tab: tab });
}

/**
 * Handle form change
 */
async function handleFormChange(data, iframeId) {
    const sessionId = data.sessionId;
    
    // Update user session with form data
    updateUserSession(sessionId, 'formData', {
        field: data.field,
        value: data.value,
        timestamp: new Date().toISOString()
    });
    
    // Log significant form changes
    if (['windowWidth', 'windowHeight', 'material', 'brand'].includes(data.field)) {
        await logUserInteraction(sessionId, 'form_field_changed', {
            field: data.field,
            value: data.value
        });
    }
}

// =====================================================================
// AI ADVISOR IFRAME HANDLERS
// =====================================================================

/**
 * Handle messages from AI Advisor iframe
 */
async function handleAIAdvisorMessage(event) {
    const { type, data } = event.data;
    const sessionId = data?.sessionId || 'unknown';
    
    console.log('🤖 AI Advisor Message:', type, 'Session:', sessionId);
    
    // Route to main handler with advisor-specific context
    await handleGFEIframeMessage({
        ...event.data,
        context: 'advisor'
    }, '#aiWindowAdvisorIframe');
}

// =====================================================================
// ESTIMATE IFRAME HANDLERS
// =====================================================================

/**
 * Handle messages from Good Faith Estimate iframe
 */
async function handleEstimateMessage(event) {
    const { type, data } = event.data;
    const sessionId = data?.sessionId || 'unknown';
    
    console.log('💰 Estimate Message:', type, 'Session:', sessionId);
    
    // Route to main handler with estimate-specific context
    await handleGFEIframeMessage({
        ...event.data,
        context: 'estimate'
    }, '#goodFaithEstimateIframe');
}

// =====================================================================
// PRODUCTS BROWSER IFRAME HANDLERS
// =====================================================================

/**
 * Handle messages from Window Products Browser iframe
 */
async function handleProductsBrowserMessage(event) {
    const { type, data } = event.data;
    const sessionId = data?.sessionId || 'unknown';
    
    console.log('🏠 Products Browser Message:', type, 'Session:', sessionId);
    
    // Route to main handler with products-specific context
    await handleGFEIframeMessage({
        ...event.data,
        context: 'products'
    }, '#windowProductsBrowserIframe');
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Send message to iframe
 */
function sendMessageToIframe(iframeId, eventType, data) {
    const iframe = $w(iframeId);
    if (iframe) {
        const message = {
            type: 'velo_to_iframe',
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        iframe.postMessage(message);
        console.log('📤 Sent to iframe:', iframeId, eventType);
    } else {
        console.warn('⚠️ Iframe not found:', iframeId);
    }
}

/**
 * Send error message to iframe
 */
function sendErrorToIframe(iframeId, errorMessage, sessionId) {
    sendMessageToIframe(iframeId, 'error_occurred', {
        error: errorMessage,
        sessionId: sessionId
    });
}

/**
 * Update user session data
 */
function updateUserSession(sessionId, key, value) {
    const session = userSessions.get(sessionId);
    if (session) {
        if (!session.currentData) {
            session.currentData = {};
        }
        session.currentData[key] = value;
        session.lastUpdate = new Date().toISOString();
        userSessions.set(sessionId, session);
    }
}

/**
 * Get user identifier for rate limiting
 */
async function getUserIdentifier(sessionId) {
    // In a real implementation, this might use visitor ID or user ID
    // For now, use session ID
    return sessionId;
}

/**
 * Validate measurements
 */
function validateMeasurements(measurements, windowType) {
    const { width, height } = measurements;
    
    const validation = {
        isValid: true,
        feedback: [],
        suggestions: []
    };
    
    // Basic size validation
    if (width < 12 || width > 120) {
        validation.isValid = false;
        validation.feedback.push('Width should be between 12 and 120 inches');
    }
    
    if (height < 12 || height > 120) {
        validation.isValid = false;
        validation.feedback.push('Height should be between 12 and 120 inches');
    }
    
    // Window type specific validation
    if (windowType === 'Bay Window' && (width < 72 || height < 36)) {
        validation.suggestions.push('Bay windows typically require larger dimensions');
    }
    
    if (windowType === 'Picture' && (width / height < 1.2)) {
        validation.suggestions.push('Picture windows are typically wider than they are tall');
    }
    
    return validation;
}

/**
 * Save quote to database
 */
async function saveQuoteToDatabase(quote, sessionId) {
    try {
        const quoteData = {
            ...quote,
            sessionId: sessionId,
            status: 'draft',
            createdDate: new Date(),
            lastModified: new Date()
        };
        
        const result = await wixData.save('Quotes', quoteData);
        console.log('✅ Quote saved to database:', result._id);
        return result;
        
    } catch (error) {
        console.error('❌ Failed to save quote:', error);
        throw new Error('Failed to save quote to database');
    }
}

/**
 * Send quote email
 */
async function sendQuoteEmail(customerEmail, quote) {
    try {
        const emailContent = generateQuoteEmailContent(quote);
        
        await sendEmail({
            to: customerEmail,
            from: 'quotes@goodfaithexteriors.com',
            subject: `Your Window Replacement Quote - ${quote.quoteId}`,
            htmlBody: emailContent.html,
            textBody: emailContent.text
        });
        
        console.log('✅ Quote email sent to:', customerEmail);
        
    } catch (error) {
        console.error('❌ Failed to send quote email:', error);
        throw new Error('Failed to send quote email');
    }
}

/**
 * Generate quote email content
 */
function generateQuoteEmailContent(quote) {
    const html = `
        <h2>Your Window Replacement Quote</h2>
        <p>Dear ${quote.customer.name},</p>
        <p>Thank you for your interest in Good Faith Exteriors. Here is your personalized quote:</p>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3>Quote #${quote.quoteId}</h3>
            <p><strong>Total: $${quote.pricing.grandTotal.toLocaleString()}</strong></p>
            <p>Valid until: ${new Date(quote.terms.validUntil).toLocaleDateString()}</p>
        </div>
        
        <p>This quote includes professional installation and our standard warranty.</p>
        <p>To schedule a consultation or if you have any questions, please call us at 651-416-8669.</p>
        
        <p>Best regards,<br>Good Faith Exteriors Team</p>
    `;
    
    const text = `
        Your Window Replacement Quote
        
        Dear ${quote.customer.name},
        
        Thank you for your interest in Good Faith Exteriors. Here is your personalized quote:
        
        Quote #${quote.quoteId}
        Total: $${quote.pricing.grandTotal.toLocaleString()}
        Valid until: ${new Date(quote.terms.validUntil).toLocaleDateString()}
        
        This quote includes professional installation and our standard warranty.
        To schedule a consultation or if you have any questions, please call us at 651-416-8669.
        
        Best regards,
        Good Faith Exteriors Team
    `;
    
    return { html, text };
}

/**
 * Create CRM lead
 */
async function createCRMLead(leadData) {
    try {
        const lead = {
            ...leadData,
            status: 'new',
            createdDate: new Date(),
            source: 'AI Window Estimator'
        };
        
        const result = await wixData.save('CRMLeads', lead);
        console.log('✅ CRM lead created:', result._id);
        return result;
        
    } catch (error) {
        console.error('❌ Failed to create CRM lead:', error);
        throw new Error('Failed to create CRM lead');
    }
}

/**
 * Schedule follow-up task
 */
async function scheduleFollowUp(leadId, customerName, customerPhone) {
    try {
        const followUp = {
            leadId: leadId,
            customerName: customerName,
            customerPhone: customerPhone,
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            status: 'pending',
            type: 'consultation_follow_up',
            createdDate: new Date()
        };
        
        const result = await wixData.save('ScheduledAppointments', followUp);
        console.log('✅ Follow-up scheduled:', result._id);
        return result;
        
    } catch (error) {
        console.error('❌ Failed to schedule follow-up:', error);
        throw new Error('Failed to schedule follow-up');
    }
}

/**
 * Update quote status
 */
async function updateQuoteStatus(quoteId, status) {
    try {
        await wixData.update('Quotes', {
            _id: quoteId,
            status: status,
            lastModified: new Date()
        });
        
        console.log('✅ Quote status updated:', quoteId, status);
        
    } catch (error) {
        console.error('❌ Failed to update quote status:', error);
    }
}

/**
 * Get brand data
 */
async function getBrandData(brandName) {
    try {
        const brandData = await wixData.query('WindowBrands')
            .eq('name', brandName)
            .find();
            
        return brandData.items[0] || null;
        
    } catch (error) {
        console.error('❌ Failed to get brand data:', error);
        return null;
    }
}

/**
 * Log user interaction
 */
async function logUserInteraction(sessionId, action, details = {}) {
    try {
        const interaction = {
            sessionId: sessionId,
            action: action,
            details: details,
            timestamp: new Date(),
            userAgent: 'iframe_user' // In real implementation, get from request
        };
        
        // Store in user session
        const session = userSessions.get(sessionId);
        if (session) {
            if (!session.interactions) {
                session.interactions = [];
            }
            session.interactions.push(interaction);
            userSessions.set(sessionId, session);
        }
        
        // Optionally save to database for analytics
        // await wixData.save('UserInteractions', interaction);
        
    } catch (error) {
        console.error('❌ Failed to log interaction:', error);
    }
}

/**
 * Show error message on page
 */
function showErrorMessage(message) {
    if ($w('#errorMessage')) {
        $w('#errorMessage').text = message;
        $w('#errorMessage').show();
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            $w('#errorMessage').hide();
        }, 5000);
    }
}

/**
 * Refresh system (for admin use)
 */
async function refreshSystem() {
    try {
        console.log('🔄 Refreshing system...');
        
        servicesInitialized = false;
        await initializeBackendServices();
        
        // Notify all active iframes
        for (const [sessionId, session] of activeIframes) {
            sendMessageToIframe(session.iframeId, 'system_refreshed', {
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('✅ System refreshed successfully');
        
    } catch (error) {
        console.error('❌ System refresh failed:', error);
        showErrorMessage('System refresh failed: ' + error.message);
    }
}

/**
 * Show system status (for admin use)
 */
async function showSystemStatus() {
    try {
        const aiService = getAIService();
        const pricingService = getPricingService();
        const secretsManager = getSecretsManager();
        
        const status = {
            services: {
                secrets: secretsManager.checkSecretHealth(),
                ai: aiService.getHealthStatus(),
                pricing: pricingService.getHealthStatus()
            },
            sessions: {
                active: activeIframes.size,
                total: userSessions.size
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 System Status:', status);
        
        // Display status in UI if element exists
        if ($w('#systemStatus')) {
            $w('#systemStatus').text = JSON.stringify(status, null, 2);
            $w('#systemStatus').show();
        }
        
    } catch (error) {
        console.error('❌ Failed to get system status:', error);
    }
}

// =====================================================================
// EXPORT FUNCTIONS FOR EXTERNAL ACCESS
// =====================================================================

export {
    handleAIWindowMessage,
    handleAIAdvisorMessage,
    handleEstimateMessage,
    handleProductsBrowserMessage,
    refreshSystem,
    showSystemStatus
};

