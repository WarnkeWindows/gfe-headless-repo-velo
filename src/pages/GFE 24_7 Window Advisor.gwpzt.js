// Velo Page Code for AI Chat Widget - FIXED VERSION
// Location: Page Code for Chat Assistant page in Wix Editor

import { initializeAssistant, createThread, chatWithAssistant, getConversationHistory } from 'backend/ai/openaiAssistantService.jsw';
import { processChatLead, generateChatQuote, scheduleChatConsultation } from 'backend/integrations/chatIntegrationService.jsw';
import { logActivity } from 'backend/core/activityLogger.jsw';
import wixWindow from 'wix-window';
import wixUsers from 'wix-users';

// Page variables
let currentThreadId = null;
let userId = null;
let isInitialized = false;
let sessionStartTime = Date.now();

$w.onReady(function () {
    console.log('🤖 AI Chat Page - Velo Code Loaded');
    
    // Get current user if logged in
    getCurrentUser();
    
    // Set up iframe communication
    setupChatCommunication();
    
    // Initialize assistant
    initializeChatAssistant();
    
    // Set up page event listeners
    setupPageEventListeners();
});

/**
 * Get current user information
 */
async function getCurrentUser() {
    try {
        const user = wixUsers.currentUser;
        if (user.loggedIn) {
            userId = user.id;
            console.log('User logged in:', userId);
        } else {
            userId = 'anonymous_' + generateSessionId();
            console.log('Anonymous user:', userId);
        }
    } catch (error) {
        console.error('Error getting user:', error);
        userId = 'anonymous_' + generateSessionId();
    }
}

/**
 * Generate a session ID for anonymous users
 */
function generateSessionId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Initialize the OpenAI Assistant
 */
async function initializeChatAssistant() {
    try {
        console.log('🚀 Initializing OpenAI Assistant...');
        
        // Initialize assistant in backend
        await initializeAssistant();
        
        isInitialized = true;
        console.log('✅ Assistant initialized successfully');
        
        // Send status to iframe
        sendToIframe('connection_status', { status: 'connected' });
        
    } catch (error) {
        console.error('❌ Failed to initialize assistant:', error);
        isInitialized = false;
        sendToIframe('connection_status', { status: 'disconnected' });
        sendToIframe('error', { 
            message: 'Failed to initialize chat assistant. Please refresh the page.' 
        });
    }
}

/**
 * Set up communication with the chat iframe
 */
function setupChatCommunication() {
    // Listen for messages from iframe using the iframe element directly
    const iframeElement = $w('#aiChatEmbed');
    
    if (iframeElement) {
        // Set up the onMessage handler for the iframe
        iframeElement.onMessage((event) => {
            handleIframeMessage(event);
        });
        
        console.log('📡 Chat communication setup complete');
    } else {
        console.error('❌ Chat iframe element #aiChatEmbed not found');
    }
}

/**
 * Handle messages from the chat iframe
 */
async function handleIframeMessage(event) {
    try {
        // Extract data from Wix iframe event
        const data = event.data || {};
        const { type, payload, source } = data;
        
        // Only handle messages from our chat widget
        if (source !== 'gfe_chat_widget') return;
        
        console.log('📨 Received message from iframe:', type, payload);
        
        switch (type) {
            case 'chat_ready':
                console.log('✅ Chat widget ready');
                break;
                
            case 'create_thread':
                await handleCreateThread(payload);
                break;
                
            case 'send_message':
                await handleSendMessage(payload);
                break;
                
            case 'create_lead':
                await handleCreateLead(payload);
                break;
                
            case 'generate_quote':
                await handleGenerateQuote(payload);
                break;
                
            case 'schedule_consultation':
                await handleScheduleConsultation(payload);
                break;
                
            default:
                console.log('Unknown message type:', type);
        }
        
    } catch (error) {
        console.error('❌ Error handling iframe message:', error);
        sendToIframe('error', { 
            message: 'An error occurred processing your request.' 
        });
    }
}

/**
 * Handle thread creation request
 */
async function handleCreateThread(payload) {
    try {
        if (!isInitialized) {
            throw new Error('Assistant not initialized');
        }
        
        console.log('🧵 Creating new thread...');
        
        // Create thread in backend
        currentThreadId = await createThread(payload.initialMessage);
        
        console.log('✅ Thread created:', currentThreadId);
        
        // Send thread ID back to iframe
        sendToIframe('thread_created', {
            threadId: currentThreadId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error creating thread:', error);
        sendToIframe('error', { 
            message: 'Failed to start conversation. Please try again.' 
        });
    }
}

/**
 * Handle message sending request
 */
async function handleSendMessage(payload) {
    try {
        if (!isInitialized) {
            throw new Error('Assistant not initialized');
        }
        
        if (!currentThreadId) {
            throw new Error('No active conversation');
        }
        
        const { message, threadId } = payload;
        
        console.log('💬 Processing message:', message);
        
        // Send message to assistant
        const response = await chatWithAssistant(threadId, message, userId);
        
        console.log('🤖 Assistant response:', response.success);
        
        // Send response back to iframe
        sendToIframe('message_response', {
            success: response.success,
            response: response.response,
            error: response.error,
            timestamp: new Date().toISOString()
        });
        
        // Log analytics
        await logChatAnalytics('message_sent', {
            userId: userId,
            threadId: threadId,
            messageLength: message.length,
            responseSuccess: response.success
        });
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        sendToIframe('message_response', {
            success: false,
            error: 'Failed to process your message. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle lead creation from chat
 */
async function handleCreateLead(payload) {
    try {
        console.log('👤 Creating lead from chat...');
        
        const leadResult = await processChatLead({
            threadId: currentThreadId,
            userId: userId,
            customerName: payload.customerName,
            email: payload.email,
            phone: payload.phone,
            projectType: payload.projectType,
            conversationSummary: payload.conversationSummary,
            interests: payload.interests,
            urgency: payload.urgency,
            estimatedValue: payload.estimatedValue
        });
        
        // Log activity
        await logActivity({
            type: 'chat_lead_created',
            userId: userId,
            details: {
                threadId: currentThreadId,
                leadId: leadResult.leadId,
                source: 'AI Chat'
            },
            timestamp: new Date()
        });
        
        sendToIframe('lead_created', {
            success: leadResult.success,
            leadId: leadResult.leadId,
            message: leadResult.message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error creating lead:', error);
        sendToIframe('lead_created', {
            success: false,
            error: 'Failed to create lead. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle quote generation from chat
 */
async function handleGenerateQuote(payload) {
    try {
        console.log('📄 Generating quote from chat...');
        
        const quoteResult = await generateChatQuote({
            threadId: currentThreadId,
            userId: userId,
            customerName: payload.customerName,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            windows: payload.windows,
            projectNotes: payload.projectNotes
        });
        
        sendToIframe('quote_generated', {
            success: quoteResult.success,
            quoteId: quoteResult.quoteId,
            quote: quoteResult.quote,
            message: quoteResult.message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error generating quote:', error);
        sendToIframe('quote_generated', {
            success: false,
            error: 'Failed to generate quote. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle consultation scheduling from chat
 */
async function handleScheduleConsultation(payload) {
    try {
        console.log('📅 Scheduling consultation from chat...');
        
        const consultationResult = await scheduleChatConsultation({
            threadId: currentThreadId,
            userId: userId,
            customerName: payload.customerName,
            email: payload.email,
            phone: payload.phone,
            preferredDate: payload.preferredDate,
            preferredTime: payload.preferredTime,
            discussionSummary: payload.discussionSummary,
            urgency: payload.urgency
        });
        
        sendToIframe('consultation_scheduled', {
            success: consultationResult.success,
            leadId: consultationResult.leadId,
            message: consultationResult.message,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error scheduling consultation:', error);
        sendToIframe('consultation_scheduled', {
            success: false,
            error: 'Failed to schedule consultation. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Send message to iframe
 */
function sendToIframe(type, payload) {
    const iframeElement = $w('#aiChatEmbed');
    
    if (iframeElement && iframeElement.postMessage) {
        try {
            iframeElement.postMessage({
                type: type,
                payload: payload,
                source: 'gfe_velo_page',
                timestamp: new Date().toISOString()
            });
            console.log('📤 Sent message to iframe:', type);
        } catch (error) {
            console.error('❌ Error sending message to iframe:', error);
        }
    } else {
        console.error('❌ Chat iframe element not found or postMessage not available');
    }
}

/**
 * Log chat analytics
 */
async function logChatAnalytics(eventType, data) {
    try {
        // Log to activity logger
        await logActivity({
            type: eventType,
            userId: data.userId,
            details: {
                threadId: data.threadId,
                messageLength: data.messageLength,
                responseSuccess: data.responseSuccess,
                source: 'AI Chat'
            },
            timestamp: new Date()
        });
        
        console.log('📊 Chat Analytics logged:', eventType, data);
        
    } catch (error) {
        console.warn('Warning: Failed to log chat analytics:', error);
        // Don't throw error - analytics failure shouldn't break chat
    }
}

/**
 * Handle page visibility changes
 */
function setupPageEventListeners() {
    // Use wixWindow.addEventListener for page events (not iframe events)
    try {
        // Log session end when user leaves page
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                if (currentThreadId) {
                    logChatAnalytics('chat_session_end', {
                        userId: userId,
                        threadId: currentThreadId,
                        sessionDuration: Date.now() - sessionStartTime
                    });
                }
            });
        }
    } catch (error) {
        console.warn('Could not set up page event listeners:', error);
    }
}

/**
 * Export functions for testing/debugging
 */
export function getChatStatus() {
    return {
        isInitialized: isInitialized,
        currentThreadId: currentThreadId,
        userId: userId,
        sessionStartTime: sessionStartTime
    };
}

export function resetChat() {
    currentThreadId = null;
    isInitialized = false;
    initializeChatAssistant();
}

// Log successful initialization
console.log('🎯 AI Chat Velo code initialized successfully');