// Window Products Browser - Velo Page Code
// Location: Pages/Window Products (windowProductsBrowser)
// Element ID: #windowProductsBrowser (HTML iFrame element)

import { 
    getWindowProducts, 
    getWindowBrands, 
    getWindowMaterials, 
    getWindowTypes,
    getGlassOptions
} from 'backend/core/dataService.jsw';

import { 
    logAnalyticsEvent 
} from 'backend/analyticsService.jsw';

import { 
    getCompanyInfo 
} from 'backend/core/secretsManager.jsw';

import wixWindow from 'wix-window';

// Configuration
const COMPONENT_CONFIG = {
    elementId: '#windowProductsBrowser',
    componentName: 'Window Products Browser',
    source: 'window_products_browser',
    connectionTimeout: 8000,
    maxRetries: 3,
    enableAnalytics: true,
    enableErrorLogging: true,
    requireAuth: false,
    requireOriginCheck: false, // Set to true in production
    allowedOrigins: ['https://goodfaithexteriors.com']
};

// Global state variables
let iFrameReady = false;
let currentSessionId = null;
let connectionAttempts = 0;
let componentInitialized = false;

/**
 * Page initialization
 */
$w.onReady(function () {
    console.log(`🪟 ${COMPONENT_CONFIG.componentName} - Velo Code Loaded`);
    
    // Set up postMessage listener for iFrame communication
    setupMessageListener();
    
    // Initialize connection monitoring
    initializeConnectionMonitoring();
    
    // Log page view
    logPageView();
    
    // Component-specific initialization
    initializeComponent();
});

/**
 * Set up message listener with security and error handling
 */
function setupMessageListener() {
    if (typeof window !== 'undefined') {
        window.addEventListener('message', handleIFrameMessage);
        console.log('📡 PostMessage listener configured for Window Products Browser');
    } else {
        console.warn('⚠️ Window object not available');
    }
}

/**
 * Initialize connection monitoring and timeout handling
 */
function initializeConnectionMonitoring() {
    // Set connection timeout
    setTimeout(() => {
        checkConnectionStatus();
    }, COMPONENT_CONFIG.connectionTimeout);
    
    // Periodic connection check
    setInterval(() => {
        if (iFrameReady) {
            sendPingToIFrame();
        }
    }, 30000); // Check every 30 seconds
}

/**
 * Component-specific initialization
 */
function initializeComponent() {
    console.log('🔧 Initializing Window Products Browser component');
    
    // Verify iFrame element exists
    const iframe = $w(COMPONENT_CONFIG.elementId);
    if (!iframe) {
        console.error(`❌ iFrame element ${COMPONENT_CONFIG.elementId} not found`);
        return;
    }
    
    componentInitialized = true;
    console.log('✅ Window Products Browser component initialized');
}

/**
 * Handle messages from the Window Products Browser iFrame
 */
async function handleIFrameMessage(event) {
    // Security: Verify origin in production
    if (COMPONENT_CONFIG.requireOriginCheck) {
        if (!COMPONENT_CONFIG.allowedOrigins.includes(event.origin)) {
            console.warn('🚫 Message from unauthorized origin:', event.origin);
            return;
        }
    }
    
    const { type, payload } = event.data || {};
    
    // Only handle messages from our window products browser
    if (event.data?.source !== COMPONENT_CONFIG.source) return;
    
    try {
        console.log('📨 Received message from Window Products Browser:', type);
        
        switch (type) {
            case 'browser_ready':
                await handleBrowserReady(payload);
                break;
                
            case 'request_products_data':
                await handleProductsDataRequest();
                break;
                
            case 'request_brands_data':
                await handleBrandsDataRequest();
                break;
                
            case 'request_materials_data':
                await handleMaterialsDataRequest();
                break;
                
            case 'request_window_types_data':
                await handleWindowTypesDataRequest();
                break;
                
            case 'request_glass_options_data':
                await handleGlassOptionsDataRequest();
                break;
                
            case 'request_company_info':
                await handleCompanyInfoRequest();
                break;
                
            case 'filter_applied':
                await handleFilterApplied(payload);
                break;
                
            case 'quote_requested':
                await handleQuoteRequested(payload);
                break;
                
            case 'product_info_requested':
                await handleProductInfoRequested(payload);
                break;
                
            case 'view_changed':
                await handleViewChanged(payload);
                break;
                
            case 'filters_cleared':
                await handleFiltersCleared(payload);
                break;
                
            case 'data_refreshed':
                await handleDataRefreshed(payload);
                break;
                
            default:
                console.log('🤷 Unknown message type from Window Products Browser:', type);
        }
        
    } catch (error) {
        console.error('❌ Error handling Window Products Browser message:', error);
        await logError('iframe_message_error', error, { type, payload });
        
        sendMessageToBrowser('data_error', {
            error: 'Failed to process request',
            originalType: type
        });
    }
}

/**
 * Handle browser ready notification
 */
async function handleBrowserReady(payload) {
    iFrameReady = true;
    currentSessionId = payload.sessionId;
    
    console.log('🎯 Window Products Browser ready:', {
        sessionId: currentSessionId,
        component: payload.component,
        version: payload.version
    });
    
    // Send initial data ready signal
    sendMessageToBrowser('wix_data_ready', {
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
        wixEnvironment: 'production',
        features: {
            analytics: COMPONENT_CONFIG.enableAnalytics,
            errorLogging: COMPONENT_CONFIG.enableErrorLogging
        }
    });
    
    // Log browser ready event
    await logAnalyticsEvent('window_products_browser_ready', 'component_interaction', {
        sessionId: currentSessionId,
        userAgent: payload.userAgent,
        viewport: payload.viewport,
        timestamp: payload.timestamp
    });
}

/**
 * Handle products data request from WindowProducts collection
 */
async function handleProductsDataRequest() {
    try {
        console.log('🔍 Fetching products data from WindowProducts collection...');
        
        const result = await getWindowProducts({
            isActive: true
        });
        
        if (result.success) {
            sendMessageToBrowser('products_data', {
                success: true,
                products: result.products || []
            });
            
            console.log(`✅ Sent ${result.products?.length || 0} products from WindowProducts collection`);
        } else {
            throw new Error(result.error || 'Failed to fetch products');
        }
        
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        await logError('products_fetch_error', error);
        
        sendMessageToBrowser('products_data', {
            success: false,
            error: 'Unable to load products',
            products: []
        });
    }
}

/**
 * Handle brands data request from WindowBrands collection
 */
async function handleBrandsDataRequest() {
    try {
        console.log('🔍 Fetching brands data from WindowBrands collection...');
        
        const result = await getWindowBrands();
        
        if (result.success) {
            sendMessageToBrowser('brands_data', {
                success: true,
                brands: result.brands || []
            });
            
            console.log(`✅ Sent ${result.brands?.length || 0} brands from WindowBrands collection`);
        } else {
            throw new Error(result.error || 'Failed to fetch brands');
        }
        
    } catch (error) {
        console.error('❌ Error fetching brands:', error);
        await logError('brands_fetch_error', error);
        
        sendMessageToBrowser('brands_data', {
            success: false,
            error: 'Unable to load brands',
            brands: []
        });
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
            sendMessageToBrowser('materials_data', {
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
        
        sendMessageToBrowser('materials_data', {
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
            sendMessageToBrowser('window_types_data', {
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
        
        sendMessageToBrowser('window_types_data', {
            success: false,
            error: 'Unable to load window types',
            windowTypes: []
        });
    }
}

/**
 * Handle glass options data request from GlassOptions collection
 */
async function handleGlassOptionsDataRequest() {
    try {
        console.log('🔍 Fetching glass options data from GlassOptions collection...');
        
        const result = await getGlassOptions();
        
        if (result.success) {
            sendMessageToBrowser('glass_options_data', {
                success: true,
                glassOptions: result.glassOptions || []
            });
            
            console.log(`✅ Sent ${result.glassOptions?.length || 0} glass options from GlassOptions collection`);
        } else {
            // Glass options might not be implemented yet, send empty array
            sendMessageToBrowser('glass_options_data', {
                success: true,
                glassOptions: []
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching glass options:', error);
        await logError('glass_options_fetch_error', error);
        
        sendMessageToBrowser('glass_options_data', {
            success: false,
            error: 'Unable to load glass options',
            glassOptions: []
        });
    }
}

/**
 * Handle company info request
 */
async function handleCompanyInfoRequest() {
    try {
        console.log('🔍 Fetching company info...');
        
        const companyInfo = {
            name: await getCompanyInfo('company_name') || 'Good Faith Exteriors',
            email: await getCompanyInfo('company_email') || 'info@goodfaithexteriors.com',
            phone: await getCompanyInfo('company_phone') || '(555) 123-4567',
            address: await getCompanyInfo('company_address') || 'Minneapolis, Minnesota',
            website: await getCompanyInfo('company_website') || 'https://goodfaithexteriors.com'
        };