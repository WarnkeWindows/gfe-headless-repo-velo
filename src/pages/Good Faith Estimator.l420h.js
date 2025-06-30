// Window Estimator - Complete Velo Page Code
// Location: Pages/Window Estimator (windowEstimator)
// iFrame Element ID: #windowQuoteTool

// Import backend services based on your project structure
import { 
    calculateWindowPrice,
    getUniversalInches 
} from 'backend/core/pricingCalculator.jsw';

import { 
    createQuote, 
    saveQuote,
    updateQuote,
    generateQuotePDF 
} from 'backend/core/quoteService.jsw';

import { 
    sendQuoteEmail,
    sendInternalNotification 
} from 'backend/core/emailService.jsw';

import { 
    getWindowProducts,
    getWindowBrands,
    getWindowMaterials,
    getWindowTypes,
    getGlassOptions 
} from 'backend/core/dataService.jsw';

import { 
    getCompanyInfo 
} from 'backend/core/secretsManager.jsw';

import { 
    processEstimatorContact,
    scheduleConsultation,
    getContactHistory 
} from 'backend/integrations/gfe-contact-integration.jsw';

import { 
    logAnalyticsEvent 
} from 'backend/analyticsService.jsw';

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Configuration
const PAGE_CONFIG = {
    elementId: '#windowQuoteTool',
    componentName: 'Window Estimator',
    source: 'window_estimator',
    connectionTimeout: 8000,
    maxRetries: 3,
    enableAnalytics: true,
    enableErrorLogging: true
};

// Global state variables
let iFrameReady = false;
let currentSessionId = null;
let connectionAttempts = 0;
let estimatorInitialized = false;

/**
 * Page initialization
 */
$w.onReady(function () {
    console.log('🪟 Window Estimator - Velo Code Loaded');
    
    // Generate session ID for tracking
    currentSessionId = generateSessionId();
    
    // Set up postMessage listener for iFrame communication
    setupMessageListener();
    
    // Initialize connection monitoring
    initializeConnectionMonitoring();
    
    // Log page view
    logPageView();
    
    // Initialize estimator
    initializeWindowEstimator();
});

/**
 * Set up message listener with security and error handling
 */
function setupMessageListener() {
    if (typeof window !== 'undefined') {
        window.addEventListener('message', handleIFrameMessage);
        console.log('📡 PostMessage listener configured for Window Estimator');
    } else {
        console.warn('⚠️ Window object not available');
    }
}

/**
 * Initialize connection monitoring and timeout handling
 */
function initializeConnectionMonitoring() {
    setTimeout(() => {
        checkEstimatorConnection();
    }, PAGE_CONFIG.connectionTimeout);
}

/**
 * Initialize window estimator and send ready signal
 */
function initializeWindowEstimator() {
    setTimeout(() => {
        const currentUrl = wixLocation.url || 'https://goodfaithexteriors.com/window-estimator';
        
        sendMessageToEstimator('connection_established', {
            timestamp: new Date().toISOString(),
            sessionId: currentSessionId,
            siteUrl: currentUrl
        });
        
        console.log('🚀 Sent connection_established to Window Estimator');
    }, 2000);
}

/**
 * Handle messages from the Window Estimator iFrame
 */
async function handleIFrameMessage(event) {
    // Security: Verify origin in production
    // if (event.origin !== 'https://goodfaithexteriors.com') return;
    
    const { type, payload, source } = event.data;
    
    // Only handle messages from our window estimator
    if (source !== PAGE_CONFIG.source) return;
    
    try {
        console.log('📨 Received message from Window Estimator:', type);
        
        switch (type) {
            case 'estimator_ready':
                await handleEstimatorReady(payload);
                break;
                
            case 'request_materials_data':
                await handleMaterialsDataRequest();
                break;
                
            case 'request_window_types_data':
                await handleWindowTypesDataRequest();
                break;
                
            case 'request_window_brands_data':
                await handleWindowBrandsDataRequest();
                break;
                
            case 'request_company_info':
                await handleCompanyInfoRequest();
                break;
                
            case 'calculate_quote':
                await handleCalculateQuote(payload);
                break;
                
            case 'save_quote':
                await handleSaveQuote(payload);
                break;
                
            case 'email_quote_to_customer':
                await handleEmailQuote(payload);
                break;
                
            case 'process_estimator_contact':
                await handleProcessContact(payload);
                break;
                
            case 'schedule_consultation':
                await handleScheduleConsultation(payload);
                break;
                
            case 'check_contact_history':
                await handleCheckContactHistory(payload);
                break;
                
            case 'navigate_to_ai_measurement':
                await handleNavigateToAI(payload);
                break;
                
            case 'gfe_quote_update':
                await handleQuoteUpdateAnalytics(payload);
                break;
                
            default:
                console.log('🤷 Unknown message type from Window Estimator:', type);
        }
        
    } catch (error) {
        console.error('❌ Error handling Window Estimator message:', error);
        await logError('estimator_message_error', error, { type, payload });
        
        sendMessageToEstimator('error', {
            message: 'Failed to process request',
            originalType: type
        });
    }
}

/**
 * Handle estimator ready event
 */
async function handleEstimatorReady(payload) {
    try {
        iFrameReady = true;
        estimatorInitialized = true;
        
        console.log('✅ Window Estimator ready:', payload);
        
        // Log analytics
        if (PAGE_CONFIG.enableAnalytics) {
            await logAnalyticsEvent('estimator_loaded', 'page_interaction', {
                sessionId: currentSessionId,
                timestamp: payload.timestamp,
                windowCount: payload.windowCount,
                version: payload.version
            });
        }
        
        // Send confirmation
        sendMessageToEstimator('connection_established', {
            status: 'ready',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error handling estimator ready:', error);
    }
}

/**
 * Handle materials data request from Materials collection
 */
async function handleMaterialsDataRequest() {
    try {
        console.log('🔍 Fetching materials data from Materials collection...');
        
        const result = await getWindowMaterials();
        
        if (result.success) {
            sendMessageToEstimator('materials_data', {
                success: true,
                materials: result.materials || []
            });
            
            console.log(`✅ Sent ${result.materials?.length || 0} materials from Materials collection`);
        } else {
            throw new Error(result.error || 'Failed to fetch materials');
        }
        
    } catch (error) {
        console.error('❌ Error fetching materials:', error);
        await logError('materials_fetch_error', error);
        
        sendMessageToEstimator('materials_data', {
            success: false,
            error: 'Unable to load materials',
            materials: []
        });
    }
}

/**
 * Handle window types data request from WindowOptions collection
 */
async function handleWindowTypesDataRequest() {
    try {
        console.log('🔍 Fetching window types data from WindowOptions collection...');
        
        const result = await getWindowTypes();
        
        if (result.success) {
            sendMessageToEstimator('window_types_data', {
                success: true,
                windowTypes: result.windowTypes || []
            });
            
            console.log(`✅ Sent ${result.windowTypes?.length || 0} window types from WindowOptions collection`);
        } else {
            throw new Error(result.error || 'Failed to fetch window types');
        }
        
    } catch (error) {
        console.error('❌ Error fetching window types:', error);
        await logError('window_types_fetch_error', error);
        
        sendMessageToEstimator('window_types_data', {
            success: false,
            error: 'Unable to load window types',
            windowTypes: []
        });
    }
}

/**
 * Handle window brands data request from WindowBrands collection
 */
async function handleWindowBrandsDataRequest() {
    try {
        console.log('🔍 Fetching window brands data from WindowBrands collection...');
        
        const result = await getWindowBrands();
        
        if (result.success) {
            sendMessageToEstimator('window_brands_data', {
                success: true,
                windowBrands: result.windowBrands || []
            });
            
            console.log(`✅ Sent ${result.windowBrands?.length || 0} window brands from WindowBrands collection`);
        } else {
            throw new Error(result.error || 'Failed to fetch window brands');
        }
        
    } catch (error) {
        console.error('❌ Error fetching window brands:', error);
        await logError('window_brands_fetch_error', error);
        
        sendMessageToEstimator('window_brands_data', {
            success: false,
            error: 'Unable to load window brands',
            windowBrands: []
        });
    }
}

/**
 * Handle company info request
 */
async function handleCompanyInfoRequest() {
    try {
        console.log('🔍 Fetching company info...');
        
        const companyInfo = await getCompanyInfo();
        
        sendMessageToEstimator('company_info_response', companyInfo);
        
        console.log('✅ Sent company info to Window Estimator');
        
    } catch (error) {
        console.error('❌ Error fetching company info:', error);
        await logError('company_info_fetch_error', error);
        
        sendMessageToEstimator('company_info_response', {
            error: 'Unable to load company information'
        });
    }
}

/**
 * Handle quote calculation request
 */
async function handleCalculateQuote(payload) {
    try {
        console.log('💰 Calculating quote for:', payload);
        
        const { customer, windows } = payload;
        
        // Validate input
        if (!customer || !windows || windows.length === 0) {
            throw new Error('Invalid quote data provided');
        }
        
        // Calculate pricing for each window
        const quoteItems = [];
        let totalPrice = 0;
        
        for (const window of windows) {
            const pricingResult = await calculateWindowPrice({
                windowType: window.windowType,
                material: window.material,
                brand: window.brand,
                width: window.width,
                height: window.height,
                quantity: window.quantity,
                universalInches: window.universalInches || (window.width * window.height),
                glassOptions: window.glassOptions,
                notes: window.notes
            });
            
            if (pricingResult.success) {
                const itemTotal = pricingResult.totalPrice * window.quantity;
                totalPrice += itemTotal;
                
                quoteItems.push({
                    windowId: window.id,
                    description: `${window.windowType} Window - ${window.width}" x ${window.height}"`,
                    windowType: window.windowType,
                    material: window.material,
                    brand: window.brand,
                    width: window.width,
                    height: window.height,
                    quantity: window.quantity,
                    unitPrice: pricingResult.totalPrice,
                    totalPrice: itemTotal,
                    laborCost: pricingResult.laborCost,
                    materialCost: pricingResult.materialCost,
                    universalInches: window.universalInches,
                    notes: window.notes
                });
            } else {
                throw new Error(`Failed to calculate price for window ${window.id}: ${pricingResult.error}`);
            }
        }
        
        const quote = {
            customer,
            items: quoteItems,
            totalPrice,
            itemCount: quoteItems.length,
            calculatedAt: new Date().toISOString(),
            sessionId: currentSessionId
        };
        
        sendMessageToEstimator('quote_calculated', {
            success: true,
            quote
        });
        
        // Log analytics
        await logAnalyticsEvent('quote_calculated', 'quote_interaction', {
            sessionId: currentSessionId,
            totalPrice,
            windowCount: windows.length,
            timestamp: new Date().toISOString()
        });
        
        console.log('✅ Quote calculated successfully:', totalPrice);
        
    } catch (error) {
        console.error('❌ Error calculating quote:', error);
        await logError('quote_calculation_error', error, payload);
        
        sendMessageToEstimator('quote_calculated', {
            success: false,
            error: error.message || 'Failed to calculate quote'
        });
    }
}

/**
 * Handle save quote request
 */
async function handleSaveQuote(payload) {
    try {
        console.log('💾 Saving quote:', payload);
        
        const { quote, customer } = payload;
        
        // Create quote in database
        const quoteResult = await createQuote({
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            projectAddress: customer.address,
            items: quote.items,
            totalAmount: quote.totalPrice,
            itemCount: quote.items.length,
            status: 'pending',
            sessionId: currentSessionId
        });
        
        if (quoteResult.success) {
            sendMessageToEstimator('quote_saved', {
                success: true,
                quoteId: quoteResult.quoteId,
                message: 'Quote saved successfully'
            });
            
            // Log analytics
            await logAnalyticsEvent('quote_saved', 'quote_interaction', {
                sessionId: currentSessionId,
                quoteId: quoteResult.quoteId,
                totalPrice: quote.totalPrice,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Quote saved with ID:', quoteResult.quoteId);
        } else {
            throw new Error(quoteResult.error);
        }
        
    } catch (error) {
        console.error('❌ Error saving quote:', error);
        await logError('quote_save_error', error, payload);
        
        sendMessageToEstimator('quote_saved', {
            success: false,
            error: error.message || 'Failed to save quote'
        });
    }
}

/**
 * Handle email quote request
 */
async function handleEmailQuote(payload) {
    try {
        console.log('📧 Emailing quote:', payload);
        
        const { quote, customer } = payload;
        
        // Generate PDF first
        const pdfResult = await generateQuotePDF({
            quote,
            customer
        });
        
        if (pdfResult.success) {
            // Send email with PDF attachment
            const emailResult = await sendQuoteEmail({
                customerEmail: customer.email,
                customerName: customer.name,
                quote,
                pdfUrl: pdfResult.pdfUrl
            });
            
            if (emailResult.success) {
                sendMessageToEstimator('quote_emailed', {
                    success: true,
                    message: 'Quote emailed successfully'
                });
                
                // Send internal notification
                await sendInternalNotification({
                    type: 'quote_emailed',
                    customer,
                    quote,
                    timestamp: new Date().toISOString()
                });
                
                console.log('✅ Quote emailed successfully');
            } else {
                throw new Error(emailResult.error);
            }
        } else {
            throw new Error('Failed to generate PDF: ' + pdfResult.error);
        }
        
    } catch (error) {
        console.error('❌ Error emailing quote:', error);
        await logError('quote_email_error', error, payload);
        
        sendMessageToEstimator('quote_emailed', {
            success: false,
            error: error.message || 'Failed to email quote'
        });
    }
}

/**
 * Handle process contact request
 */
async function handleProcessContact(payload) {
    try {
        console.log('👤 Processing estimator contact:', payload);
        
        const { customer, quote } = payload;
        
        const contactResult = await processEstimatorContact({
            fullName: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            leadType: 'window_estimator',
            projectType: 'window_replacement',
            quoteTotal: quote.totalPrice,
            notes: `Quote generated via Window Estimator. ${quote.items.length} windows. Session: ${currentSessionId}`,
            source: 'window_estimator',
            sessionId: currentSessionId
        });
        
        if (contactResult.success) {
            console.log('✅ Contact processed successfully:', contactResult.leadId);
            
            // Log analytics
            await logAnalyticsEvent('lead_generated', 'lead_generation', {
                sessionId: currentSessionId,
                leadId: contactResult.leadId,
                source: 'window_estimator',
                quoteTotal: quote.totalPrice,
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('⚠️ Contact processing failed:', contactResult.error);
        }
        
    } catch (error) {
        console.error('❌ Error processing contact:', error);
        await logError('contact_processing_error', error, payload);
    }
}

/**
 * Handle schedule consultation request
 */
async function handleScheduleConsultation(payload) {
    try {
        console.log('📅 Scheduling consultation:', payload);
        
        const result = await scheduleConsultation(payload);
        
        if (result.success) {
            console.log('✅ Consultation scheduled successfully');
        } else {
            console.warn('⚠️ Consultation scheduling failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error scheduling consultation:', error);
    }
}

/**
 * Handle check contact history request
 */
async function handleCheckContactHistory(payload) {
    try {
        console.log('🔍 Checking contact history:', payload);
        
        const history = await getContactHistory(payload.email);
        
        // You could send this back to the iframe if needed
        console.log('📋 Contact history retrieved:', history);
        
    } catch (error) {
        console.error('❌ Error checking contact history:', error);
    }
}

/**
 * Handle navigate to AI measurement
 */
async function handleNavigateToAI(payload) {
    try {
        console.log('🤖 Navigating to AI Measurement tool');
        
        // Option 1: Navigate to AI measurement page
        wixLocation.to('/ai-window-measurement');
        
        // Option 2: Open in lightbox (uncomment if you prefer lightbox)
        // wixWindow.openLightbox('aiWindowMeasurement', payload);
        
        // Option 3: Open in new tab (uncomment if you prefer new tab)
        // wixWindow.openUrl('https://goodfaithexteriors.com/ai-window-measurement');
        
    } catch (error) {
        console.error('❌ Error navigating to AI measurement:', error);
    }
}

/**
 * Handle quote update analytics
 */
async function handleQuoteUpdateAnalytics(payload) {
    try {
        if (PAGE_CONFIG.enableAnalytics) {
            await logAnalyticsEvent('quote_interaction', 'estimator_usage', {
                sessionId: currentSessionId,
                action: payload.action,
                windowCount: payload.windowCount,
                timestamp: payload.timestamp
            });
        }
    } catch (error) {
        console.error('❌ Error logging quote analytics:', error);
    }
}

/**
 * Send message to the Window Estimator iFrame
 */
function sendMessageToEstimator(type, payload = {}) {
    const iframe = $w(PAGE_CONFIG.elementId);
    if (iframe && iframe.postMessage && iFrameReady) {
        iframe.postMessage({
            type,
            payload,
            source: 'wix_velo',
            timestamp: new Date().toISOString()
        }, '*');
        
        console.log('📤 Sent message to Window Estimator:', type);
    } else if (!iFrameReady) {
        console.warn('⚠️ Attempted to send message before estimator ready:', type);
    } else {
        console.error('❌ Window Estimator iframe not found or postMessage not available');
    }
}

/**
 * Check if estimator connection is working
 */
function checkEstimatorConnection() {
    if (!iFrameReady && connectionAttempts < PAGE_CONFIG.maxRetries) {
        connectionAttempts++;
        console.warn(`⚠️ Window Estimator not ready, attempt ${connectionAttempts}/${PAGE_CONFIG.maxRetries}`);
        
        // Try to reconnect
        setTimeout(() => {
            initializeWindowEstimator();
            checkEstimatorConnection();
        }, 2000);
    } else if (!iFrameReady) {
        console.error('❌ Failed to establish connection with Window Estimator after maximum retries');
        logError('estimator_connection_failed', new Error('Connection timeout'), {
            attempts: connectionAttempts,
            timeout: PAGE_CONFIG.connectionTimeout
        });
    }
}

/**
 * Log page view analytics
 */
async function logPageView() {
    try {
        if (PAGE_CONFIG.enableAnalytics) {
            const currentUrl = wixLocation.url || 'https://goodfaithexteriors.com/window-estimator';
            
            await logAnalyticsEvent('page_view', 'page_interaction', {
                page: 'window_estimator',
                sessionId: currentSessionId,
                timestamp: new Date().toISOString(),
                url: currentUrl
            });
        }
    } catch (error) {
        console.error('❌ Error logging page view:', error);
    }
}

/**
 * Log errors to ErrorLogs collection
 */
async function logError(errorType, error, context = {}) {
    try {
        if (PAGE_CONFIG.enableErrorLogging) {
            console.error(`🚨 ${errorType}:`, error, context);
            
            // You would implement this function in your backend
            // await logErrorToCollection({
            //     errorType,
            //     message: error.message,
            //     stack: error.stack,
            //     context,
            //     sessionId: currentSessionId,
            //     timestamp: new Date().toISOString(),
            //     component: PAGE_CONFIG.componentName
            // });
        }
    } catch (logError) {
        console.error('❌ Failed to log error:', logError);
    }
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return 'est_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Export functions for testing (optional)
 */
export { 
    handleIFrameMessage, 
    sendMessageToEstimator,
    generateSessionId
};