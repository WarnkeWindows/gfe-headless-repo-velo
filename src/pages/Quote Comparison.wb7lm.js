import wixData from 'wix-data';
import wixUsers from 'wix-users';
import { fetch } from 'wix-fetch';

// === PAGE CONFIGURATION ===
const PAGE_CONFIG = {
    iframe: {
        id: '#quoteComparisonIframe',
        // IMPORTANT: In a live environment, restrict this to your actual iframe hosting domain.
        trustedOrigins: ["*"] // Using wildcard for development flexibility.
    },
    collections: {
        quotes: 'Quotes',
        comparisons: 'Comparisons',
        analytics: 'Analytics'
    },
    // These endpoints correspond to functions in your http-functions.js backend file.
    apiEndpoints: {
        analyzeCompetitor: '/_functions/analyze-competitor-quote',
        saveComparison: '/_functions/save-comparison',
        emailComparison: '/_functions/email-comparison'
    }
};

// === GLOBAL STATE ===
let pageState = {
    iframeLoaded: false,
    currentUser: null,
    userQuotes: [],
};

// === PAGE INITIALIZATION ===
$w.onReady(async function () {
    console.log("Quote Comparison page ready.");
    await initializePage();
});

/**
 * Sets up the page, fetches initial user data, and configures iframe communication.
 */
async function initializePage() {
    pageState.currentUser = wixUsers.currentUser;
    await loadUserQuotes();
    setupIframeEventHandlers();
}

/**
 * Fetches all quotes from the 'Quotes' collection belonging to the current user.
 */
async function loadUserQuotes() {
    try {
        if (pageState.currentUser.loggedIn) {
            const results = await wixData.query(PAGE_CONFIG.collections.quotes)
                // The '_owner' field automatically stores the user ID of the item's creator.
                .eq("_owner", pageState.currentUser.id)
                .descending("_createdDate")
                .find();

            pageState.userQuotes = results.items;
            console.log(`Found ${results.totalCount} quotes for the current user.`);
        }
    } catch (error) {
        console.error("Error loading user quotes:", error);
    }
}

// === IFRAME COMMUNICATION ===

/**
 * Sets up the listener for messages coming from the quoteComparisonIframe.
 */
function setupIframeEventHandlers() {
    // Listen for the iframe to finish loading its content
    $w(PAGE_CONFIG.iframe.id).onLoad(() => {
        pageState.iframeLoaded = true;
        console.log("Iframe content loaded.");
    });

    // Add a global listener for all messages
    window.addEventListener('message', handleIframeMessage);
}

/**
 * The main router for all incoming messages from the iframe.
 * @param {MessageEvent} event The message event from the iframe.
 */
function handleIframeMessage(event) {
    // Security: Ensure the message is from a trusted origin.
    if (!isTrustedOrigin(event.origin)) {
        console.warn(`Message from untrusted origin blocked: ${event.origin}`);
        return;
    }

    const { type, payload, source } = event.data;

    // Ensure the message is from our specific iframe source
    if (source !== 'gfe-quote-comparison-iframe') {
        return;
    }

    console.log(`Received message of type: ${type}`);

    // A unified handler object is a clean, scalable way to manage message types.
    const messageHandlers = {
        'QC_PAGE_READY': handlePageReady,
        'QC_ANALYZE_COMPETITOR_QUOTE': () => handleAnalyzeCompetitorQuote(payload),
        'QC_SAVE_COMPARISON': () => handleSaveComparison(payload),
        'QC_EMAIL_COMPARISON': () => handleEmailComparison(payload)
    };

    // Execute the appropriate handler if it exists
    if (messageHandlers[type]) {
        messageHandlers[type]();
    }
}


// === MESSAGE HANDLER FUNCTIONS ===

/**
 * Responds to the iframe's ready signal by sending it the user's quotes.
 */
function handlePageReady() {
    sendToIframe('PAGE_DATA_RESPONSE', {
        gfeQuotes: pageState.userQuotes
    });
}

/**
 * Calls the backend to analyze the uploaded competitor quote using AI.
 * @param {object} payload Contains GFE quote data and the competitor's file.
 */
async function handleAnalyzeCompetitorQuote(payload) {
    try {
        const response = await fetch(PAGE_CONFIG.apiEndpoints.analyzeCompetitor, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            sendToIframe('COMPETITOR_ANALYSIS_COMPLETE', { success: true, comparison: result.comparison });
        } else {
            throw new Error(result.error || 'AI analysis failed.');
        }
    } catch (error) {
        console.error("Error during competitor analysis:", error);
        sendToIframe('OPERATION_FAILED', { error: error.message });
    }
}

/**
 * Calls the backend to save the generated comparison to the 'Comparisons' collection.
 * @param {object} payload The full comparison result object.
 */
async function handleSaveComparison(payload) {
    try {
        const response = await fetch(PAGE_CONFIG.apiEndpoints.saveComparison, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.data)
        });
        const result = await response.json();

        if (response.ok && result.success) {
            sendToIframe('COMPARISON_SAVED', { success: true, comparisonId: result.comparisonId });
        } else {
            throw new Error(result.error || 'Failed to save comparison.');
        }
    } catch (error) {
        console.error("Error saving comparison:", error);
        sendToIframe('OPERATION_FAILED', { error: error.message });
    }
}

/**
 * Calls the backend to email the comparison report to the current user.
 * @param {object} payload The full comparison result object.
 */
async function handleEmailComparison(payload) {
     try {
         // Ensure we have user info before attempting to email
        if (!pageState.currentUser.loggedIn) {
            throw new Error("User must be logged in to receive emails.");
        }
        const userEmail = await pageState.currentUser.getEmail();

        const response = await fetch(PAGE_CONFIG.apiEndpoints.emailComparison, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Add the user's email to the payload for the backend service
            body: JSON.stringify({ ...payload.data, userEmail: userEmail })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            sendToIframe('COMPARISON_EMAILED', { success: true });
        } else {
            throw new Error(result.error || 'Failed to email comparison.');
        }
    } catch (error) {
        console.error("Error emailing comparison:", error);
        sendToIframe('OPERATION_FAILED', { error: error.message });
    }
}


// === UTILITY FUNCTIONS ===

/**
 * Sends a structured message to the `quoteComparisonIframe`.
 * @param {string} type The message type identifier.
 * @param {object} payload The data object to send.
 */
function sendToIframe(type, payload) {
    if (!pageState.iframeLoaded) {
        console.warn("Attempted to send message before iframe was loaded.");
        return;
    }
    $w(PAGE_CONFIG.iframe.id).postMessage({
        source: 'wix-parent',
        type,
        payload
    });
}

/**
 * Checks if the message origin is in the list of trusted domains.
 * @param {string} origin The origin URL of the message sender.
 * @returns {boolean}
 */
function isTrustedOrigin(origin) {
    // A wildcard allows all origins, which is useful for local development but
    // should be replaced with specific domains for production security.
    if (PAGE_CONFIG.iframe.trustedOrigins.includes('*')) {
        return true;
    }
    return PAGE_CONFIG.iframe.trustedOrigins.includes(origin);
}
