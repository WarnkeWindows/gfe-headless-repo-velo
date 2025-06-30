// Filename: Page Code - home.js
// This code orchestrates communication between the Wix page and the embedded iframe.

import { getWindowBrands, getCompanyInfo, processClaudeChat } from 'backend/master-gfe-integration.jsw';
import wixLocation from 'wix-location';

// Store the iframe element for easy access
let iframe;

$w.onReady(function () {
    console.log("Velo page is ready. Initializing iframe communication.");
    iframe = $w("#gfeHomePageIframe");
    setupIframeListener();
});

/**
 * Sets up the listener for messages coming from the iframe.
 */
function setupIframeListener() {
    iframe.onMessage(async (event) => {
        if (!event.data || !event.data.type) {
            console.warn("Received an invalid message from iframe:", event.data);
            return;
        }

        console.log(`Velo Page: Received message of type '${event.data.type}' from iframe.`);
        const { type, payload } = event.data;

        // Route the message to the appropriate handler
        switch (type) {
            case 'homepage_ready':
                handleHomepageReady();
                break;
            case 'request_company_info':
                handleCompanyInfoRequest();
                break;
            case 'request_brands_data':
                handleBrandsDataRequest();
                break;
            case 'navigate_to_service':
                handleNavigation(payload);
                break;
            case 'process_claude_chat':
                handleClaudeChat(payload);
                break;
            case 'track_event':
                console.log('Analytics Event:', payload); // In a full implementation, this would call an analytics service
                break;
            case 'contact_click':
                console.log('Contact Clicked:', payload.type);
                // Handle contact clicks, e.g., wixLocation.to(`mailto:${email}`)
                break;
            default:
                console.log(`Velo Page: No handler for message type '${type}'.`);
        }
    });
}

/**
 * Sends a structured message to the iframe.
 * @param {string} type - The message type or command.
 * @param {object} payload - The data to send.
 */
function sendToIframe(type, payload) {
    console.log(`Velo Page: Sending message of type '${type}' to iframe.`);
    iframe.postMessage({ type, payload });
}

// --- Message Handlers ---

/**
 * Handles the iframe's initial "ready" signal by providing connection confirmation.
 */
function handleHomepageReady() {
    sendToIframe('wix_ready', {
        timestamp: new Date().toISOString(),
        status: 'connected',
        flfSupport: true
    });
}

/**
 * Fetches company info from the backend and sends it to the iframe.
 */
async function handleCompanyInfoRequest() {
    try {
        const companyInfo = await getCompanyInfo();
        sendToIframe('company_info_response', { companyInfo });
    } catch (error) {
        console.error("Failed to get company info:", error);
    }
}

/**
 * Fetches window brand data from the backend and sends it to the iframe.
 */
async function handleBrandsDataRequest() {
    try {
        const brands = await getWindowBrands();
        sendToIframe('brands_data_response', { brands });
    } catch (error) {
        console.error("Failed to get brands data:", error);
    }
}

/**
 * Navigates the user to a different page on the Wix site.
 * @param {object} payload - The navigation payload from the iframe.
 */
function handleNavigation(payload) {
    const { service } = payload;
    let targetPage = '/'; // Default to home

    // Map service names to your Wix site page URLs
    const pageMap = {
        'window-estimator': '/window-estimator', // Example URL
        'ai-window-measure': '/ai-window-measure', // Example URL
        'window-products': '/product-browser', // Example URL
        'schedule-consultation': '/schedule-consultation' // Example URL
    };

    if (pageMap[service]) {
        targetPage = pageMap[service];
    }

    wixLocation.to(targetPage);
    // Notify the iframe that navigation is complete to reset loading states
    setTimeout(() => sendToIframe('navigation_complete', {}), 500);
}

/**
 * Processes a chat message by sending it to the backend AI service.
 * @param {object} payload - The chat payload from the iframe.
 */
async function handleClaudeChat(payload) {
    const { messageId, message, conversationHistory, context } = payload;
    try {
        const response = await processClaudeChat(message, conversationHistory, context);
        sendToIframe('chatbot_response', { messageId, response });
    } catch (error) {
        console.error("Error processing Claude chat:", error);
        sendToIframe('chatbot_response', { messageId, error: error.message });
    }
}