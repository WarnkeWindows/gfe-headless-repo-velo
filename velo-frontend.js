/**
 * Good Faith Exteriors - Window Catalog Frontend
 * Velo Frontend Code for Window Catalog Iframe
 * 
 * This file handles:
 * - User interface interactions
 * - OAuth authentication flow
 * - Product display and filtering
 * - Quote generation and data collection
 * - Integration with backend JSW functions
 */

import { authentication } from 'wix-members';
import { session } from 'wix-storage';
import { local } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

// Import backend functions
import { 
    generateGoogleOAuthUrl, 
    exchangeOAuthCode, 
    validateWixJWT,
    getWindowProducts,
    calculateQuote,
    submitCustomerData,
    getAuthStatus,
    refreshOAuthToken
} from 'backend/velo-oauth.jsw';

// Global state management
let currentUser = null;
let selectedProducts = [];
let currentQuote = null;
let authToken = null;

/**
 * Page initialization
 */
$w.onReady(function () {
    console.log('Good Faith Exteriors Window Catalog - Initializing...');
    
    // Initialize authentication
    initializeAuth();
    
    // Load window products
    loadWindowProducts();
    
    // Setup event handlers
    setupEventHandlers();
    
    // Setup iframe communication
    setupIframeCommunication();
});

/**
 * Initialize authentication system
 */
async function initializeAuth() {
    try {
        // Check for OAuth callback
        const urlParams = new URLSearchParams(wixLocation.query);
        const authCode = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (authCode && state === 'gfe_window_catalog') {
            await handleOAuthCallback(authCode);
            return;
        }
        
        // Check existing authentication
        const authStatus = await getAuthStatus();
        if (authStatus.success && authStatus.isAuthenticated) {
            currentUser = authStatus.member;
            updateAuthUI(true);
        } else {
            updateAuthUI(false);
        }
        
        // Check stored token
        const storedToken = local.getItem('gfe_auth_token');
        if (storedToken) {
            authToken = storedToken;
            $w('#authStatus').text = 'Authenticated';
        }
        
    } catch (error) {
        console.error('Authentication initialization failed:', error);
        showError('Authentication system initialization failed');
    }
}

/**
 * Handle OAuth callback
 */
async function handleOAuthCallback(code) {
    try {
        $w('#loadingIndicator').show();
        
        const redirectUri = wixLocation.baseUrl + wixLocation.path;
        const result = await exchangeOAuthCode(code, redirectUri);
        
        if (result.success) {
            currentUser = result.user;
            authToken = result.session.accessToken;
            
            // Store token
            local.setItem('gfe_auth_token', authToken);
            session.setItem('user_session', JSON.stringify(result.session));
            
            updateAuthUI(true);
            showSuccess('Authentication successful!');
            
            // Clean URL
            wixLocation.to(wixLocation.path);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('OAuth callback failed:', error);
        showError('Authentication failed: ' + error.message);
    } finally {
        $w('#loadingIndicator').hide();
    }
}

/**
 * Setup event handlers
 */
function setupEventHandlers() {
    // Authentication button
    $w('#loginButton').onClick(async () => {
        await initiateOAuth();
    });
    
    // Logout button
    $w('#logoutButton').onClick(() => {
        logout();
    });
    
    // Product filters
    $w('#brandFilter').onChange(() => {
        filterProducts();
    });
    
    $w('#materialFilter').onChange(() => {
        filterProducts();
    });
    
    $w('#seriesFilter').onChange(() => {
        filterProducts();
    });
    
    // Search functionality
    $w('#searchInput').onInput(() => {
        searchProducts();
    });
    
    // Quote generation
    $w('#generateQuoteButton').onClick(() => {
        generateQuote();
    });
    
    // Customer form submission
    $w('#submitQuoteButton').onClick(() => {
        submitQuote();
    });
    
    // Clear selection
    $w('#clearSelectionButton').onClick(() => {
        clearSelection();
    });
}

/**
 * Setup iframe communication
 */
function setupIframeCommunication() {
    // Listen for messages from parent window
    wixWindow.onMessage((event) => {
        const { type, data } = event.data;
        
        switch (type) {
            case 'RESIZE_IFRAME':
                // Handle iframe resizing
                break;
            case 'UPDATE_PRODUCTS':
                loadWindowProducts(data.filters);
                break;
            case 'GET_QUOTE':
                sendQuoteToParent();
                break;
            default:
                console.log('Unknown message type:', type);
        }
    });
}

/**
 * Initiate OAuth authentication
 */
async function initiateOAuth() {
    try {
        const redirectUri = wixLocation.baseUrl + wixLocation.path;
        const state = 'gfe_window_catalog';
        
        const result = await generateGoogleOAuthUrl(redirectUri, state);
        
        if (result.success) {
            wixLocation.to(result.authUrl);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('OAuth initiation failed:', error);
        showError('Failed to start authentication: ' + error.message);
    }
}

/**
 * Logout user
 */
function logout() {
    currentUser = null;
    authToken = null;
    selectedProducts = [];
    currentQuote = null;
    
    local.removeItem('gfe_auth_token');
    session.removeItem('user_session');
    
    updateAuthUI(false);
    clearSelection();
    showSuccess('Logged out successfully');
}

/**
 * Load window products
 */
async function loadWindowProducts(filters = {}) {
    try {
        $w('#loadingIndicator').show();
        
        const result = await getWindowProducts(filters);
        
        if (result.success) {
            displayProducts(result.products);
            updateProductCount(result.totalCount);
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Failed to load products:', error);
        showError('Failed to load window products: ' + error.message);
    } finally {
        $w('#loadingIndicator').hide();
    }
}

/**
 * Display products in the repeater
 */
function displayProducts(products) {
    $w('#productRepeater').data = products.map(product => ({
        _id: product._id,
        productId: product.productId,
        windowBrand: product.windowBrand,
        series: product.series,
        interiorMaterial: product.interiorMaterial,
        exteriorMaterial: product.exteriorMaterial,
        basePrice: product.basePrice,
        pricePerUI: product.pricePerUI,
        description: product.description,
        calculatedPrice: `$${product.calculatedPrice.toFixed(2)}`,
        markupApplied: `${product.markupPercentage}% markup applied`,
        isSelected: selectedProducts.some(p => p.productId === product.productId)
    }));
    
    // Setup repeater item events
    $w('#productRepeater').onItemReady(($item, itemData) => {
        // Product selection
        $item('#selectProductButton').onClick(() => {
            toggleProductSelection(itemData);
        });
        
        // View details
        $item('#viewDetailsButton').onClick(() => {
            showProductDetails(itemData);
        });
        
        // Update selection state
        updateSelectionUI($item, itemData.isSelected);
    });
}

/**
 * Toggle product selection
 */
function toggleProductSelection(product) {
    const existingIndex = selectedProducts.findIndex(p => p.productId === product.productId);
    
    if (existingIndex >= 0) {
        selectedProducts.splice(existingIndex, 1);
    } else {
        selectedProducts.push({
            ...product,
            quantity: 1,
            customUI: product.baseUI
        });
    }
    
    updateSelectionDisplay();
    loadWindowProducts(); // Refresh to update selection state
}

/**
 * Update selection display
 */
function updateSelectionDisplay() {
    const count = selectedProducts.length;
    $w('#selectionCount').text = `${count} product${count !== 1 ? 's' : ''} selected`;
    
    $w('#generateQuoteButton').enable();
    $w('#clearSelectionButton').show();
    
    if (count === 0) {
        $w('#generateQuoteButton').disable();
        $w('#clearSelectionButton').hide();
    }
    
    // Update selected products list
    $w('#selectedProductsList').data = selectedProducts.map(product => ({
        ...product,
        totalPrice: `$${(product.calculatedPrice * product.quantity).toFixed(2)}`
    }));
}

/**
 * Clear all selections
 */
function clearSelection() {
    selectedProducts = [];
    currentQuote = null;
    updateSelectionDisplay();
    loadWindowProducts();
    $w('#quoteSection').hide();
}

/**
 * Generate quote for selected products
 */
async function generateQuote() {
    if (selectedProducts.length === 0) {
        showError('Please select at least one product');
        return;
    }
    
    try {
        $w('#loadingIndicator').show();
        
        const customerInfo = {
            name: $w('#customerName').value || 'Guest User',
            email: $w('#customerEmail').value || (currentUser ? currentUser.email : ''),
            phone: $w('#customerPhone').value || '',
            address: $w('#customerAddress').value || ''
        };
        
        const projectDetails = {
            projectType: $w('#projectType').value || 'residential',
            installationType: $w('#installationType').value || 'replacement',
            notes: $w('#projectNotes').value || ''
        };
        
        const result = await calculateQuote(selectedProducts, customerInfo, projectDetails);
        
        if (result.success) {
            currentQuote = result.quote;
            displayQuote(result.quote);
            $w('#quoteSection').show();
            showSuccess('Quote generated successfully!');
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Quote generation failed:', error);
        showError('Failed to generate quote: ' + error.message);
    } finally {
        $w('#loadingIndicator').hide();
    }
}

/**
 * Display generated quote
 */
function displayQuote(quote) {
    $w('#quoteId').text = quote.quoteId;
    $w('#quoteSubtotal').text = `$${quote.subtotal.toFixed(2)}`;
    $w('#quoteTotalPrice').text = `$${quote.totalPrice.toFixed(2)}`;
    $w('#quoteValidUntil').text = quote.validUntil.toLocaleDateString();
    $w('#markupInfo').text = `${quote.markupPercentage}% markup included`;
    
    // Display quote products
    $w('#quoteProductsList').data = quote.products.map(product => ({
        ...product,
        formattedTotal: `$${product.totalPrice.toFixed(2)}`
    }));
}

/**
 * Submit quote and customer data
 */
async function submitQuote() {
    if (!currentQuote) {
        showError('Please generate a quote first');
        return;
    }
    
    try {
        $w('#loadingIndicator').show();
        
        const customerData = {
            name: $w('#customerName').value,
            email: $w('#customerEmail').value,
            phone: $w('#customerPhone').value,
            address: $w('#customerAddress').value,
            projectType: $w('#projectType').value,
            installationType: $w('#installationType').value,
            notes: $w('#projectNotes').value,
            preferredContact: $w('#preferredContact').value,
            timeframe: $w('#timeframe').value
        };
        
        // Validate required fields
        if (!customerData.name || !customerData.email || !customerData.phone) {
            throw new Error('Please fill in all required fields (Name, Email, Phone)');
        }
        
        const result = await submitCustomerData(customerData, currentQuote.quoteId);
        
        if (result.success) {
            showSuccess('Quote submitted successfully! We will contact you soon.');
            
            // Send data to parent window if in iframe
            sendQuoteToParent();
            
            // Reset form
            resetForm();
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Quote submission failed:', error);
        showError('Failed to submit quote: ' + error.message);
    } finally {
        $w('#loadingIndicator').hide();
    }
}

/**
 * Send quote data to parent window
 */
function sendQuoteToParent() {
    if (currentQuote) {
        const quoteData = {
            type: 'QUOTE_GENERATED',
            data: {
                quote: currentQuote,
                selectedProducts: selectedProducts,
                timestamp: new Date()
            }
        };
        
        wixWindow.postMessage(quoteData);
    }
}

/**
 * Filter products based on selected criteria
 */
async function filterProducts() {
    const filters = {
        brand: $w('#brandFilter').value,
        interiorMaterial: $w('#materialFilter').value,
        series: $w('#seriesFilter').value,
        isActive: true
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === 'all') {
            delete filters[key];
        }
    });
    
    await loadWindowProducts(filters);
}

/**
 * Search products by text
 */
async function searchProducts() {
    const searchTerm = $w('#searchInput').value.toLowerCase();
    
    if (searchTerm.length < 2) {
        await loadWindowProducts();
        return;
    }
    
    // This would be implemented with a proper search endpoint
    // For now, we'll filter on the frontend
    const allProducts = await getWindowProducts();
    
    if (allProducts.success) {
        const filteredProducts = allProducts.products.filter(product => 
            product.windowBrand.toLowerCase().includes(searchTerm) ||
            product.series.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.interiorMaterial.toLowerCase().includes(searchTerm) ||
            product.exteriorMaterial.toLowerCase().includes(searchTerm)
        );
        
        displayProducts(filteredProducts);
        updateProductCount(filteredProducts.length);
    }
}

/**
 * Update authentication UI
 */
function updateAuthUI(isAuthenticated) {
    if (isAuthenticated) {
        $w('#loginButton').hide();
        $w('#logoutButton').show();
        $w('#userInfo').show();
        $w('#authStatus').text = 'Authenticated';
        
        if (currentUser) {
            $w('#userName').text = currentUser.name || currentUser.email;
            $w('#customerEmail').value = currentUser.email;
        }
    } else {
        $w('#loginButton').show();
        $w('#logoutButton').hide();
        $w('#userInfo').hide();
        $w('#authStatus').text = 'Not authenticated';
    }
}

/**
 * Update selection UI for repeater items
 */
function updateSelectionUI($item, isSelected) {
    if (isSelected) {
        $item('#selectProductButton').label = 'Remove';
        $item('#productCard').style.backgroundColor = '#e8f5e8';
    } else {
        $item('#selectProductButton').label = 'Select';
        $item('#productCard').style.backgroundColor = '#ffffff';
    }
}

/**
 * Show product details modal
 */
function showProductDetails(product) {
    $w('#productDetailsModal').show();
    $w('#modalProductName').text = `${product.windowBrand} ${product.series}`;
    $w('#modalProductDescription').text = product.description;
    $w('#modalProductPrice').text = product.calculatedPrice;
    $w('#modalProductSpecs').text = `${product.interiorMaterial} interior, ${product.exteriorMaterial} exterior`;
}

/**
 * Update product count display
 */
function updateProductCount(count) {
    $w('#productCount').text = `${count} products found`;
}

/**
 * Reset form after submission
 */
function resetForm() {
    $w('#customerName').value = '';
    $w('#customerPhone').value = '';
    $w('#customerAddress').value = '';
    $w('#projectNotes').value = '';
    $w('#quoteSection').hide();
    clearSelection();
}

/**
 * Show success message
 */
function showSuccess(message) {
    $w('#successMessage').text = message;
    $w('#successMessage').show();
    setTimeout(() => {
        $w('#successMessage').hide();
    }, 5000);
}

/**
 * Show error message
 */
function showError(message) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    setTimeout(() => {
        $w('#errorMessage').hide();
    }, 5000);
}

