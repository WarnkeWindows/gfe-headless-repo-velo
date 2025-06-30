/**
 * Anthropic AI Service - Fully Integrated
 * File: backend/ai/anthropic-service.web.js
 *
 * Handles integration with Anthropic Claude AI for image analysis and chat.
 * This version is fully wired into the GFE data service and constants.
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';

// Correctly import from your unified data service and constants files
import {
    createSuccessResponse,
    createErrorResponse,
    logSystemEvent,
    saveAIMeasurement
} from '../core/wix-data-service.web.js';

import {
    SYSTEM_CONSTANTS,
    ERROR_CODES,
    generateUniqueId
} from '../config/constants.web.js';

// =====================================================================
// INTERNAL ANTHROPIC API HELPER
// =====================================================================

/**
 * A centralized function to make authenticated API calls to Anthropic Claude.
 * It uses credentials and configurations from the Wix Secrets Manager and constants file.
 * @param {Array} messages - The array of message objects for the API call.
 * @param {string} systemPrompt - The system prompt to guide the AI's response.
 * @param {object} options - Additional options like max_tokens and temperature.
 * @returns {Promise<object>} The JSON response from the Anthropic API.
 */
async function callAnthropicAPI(messages, systemPrompt = '', options = {}) {
    const apiKey = await getSecret('claude_api_key');
    if (!apiKey) {
        // This will be caught and wrapped in a standard error response
        throw new Error('Anthropic API key is not configured in Wix Secrets Manager.');
    }

    const requestBody = {
        model: SYSTEM_CONSTANTS.AI_MODEL || 'claude-3-5-sonnet-20240620',
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.2,
        messages: messages,
        ...(systemPrompt && { system: systemPrompt })
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API Error:", errorText);
        throw new Error(`Anthropic API request failed with status ${response.status}.`);
    }

    return response.json();
}

// =====================================================================
// EXPORTED SERVICE FUNCTIONS
// =====================================================================

/**
 * Analyzes a window image using Claude Vision, persists the analysis, and returns the result.
 * This function now integrates with the wix-data-service for storage.
 * @param {string} imageData - Base64 encoded image string.
 * @param {string} customerId - The ID of the customer requesting the analysis.
 * @param {object} metadata - Additional metadata for the analysis.
 * @returns {Promise<object>} A standardized success or error response object.
 */
export async function analyzeWindowImage(imageData, customerId, metadata = {}) {
    // Validate required parameters
    if (!imageData) {
        return createErrorResponse({
            code: ERROR_CODES.REQUIRED_FIELD_MISSING,
            message: 'Image data is required for analysis.'
        }, 'analyzeWindowImage');
    }

    const systemPrompt = `You are an expert window dimension analyst. Your task is to analyze the provided image, use any 3"x3" Post-it notes as a scale reference, and return a single JSON object with the window's estimated dimensions and other details. The response must be only the JSON object. Your response format is: {"windowsDetected": number, "measurements": [{"width": number, "height": number, "type": string, "confidence": number}], "overallConfidence": number, "recommendations": [string], "imageQuality": string, "analysisNotes": string}`;

    try {
        const messages = [{
            role: 'user',
            content: [{
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageData.replace(/^data:image\/[a-z]+;base64,/, '') }
            }, {
                type: 'text',
                text: 'Analyze this window image for dimensions using the Post-it note for scale and provide recommendations.'
            }]
        }];

        const response = await callAnthropicAPI(messages, systemPrompt, { temperature: 0.1 });
        const analysisResult = JSON.parse(response.content[0].text);

        // Prepare data for storage by calling the data service
        const measurementData = {
            customerId: customerId,
            timestamp: new Date(),
            confidenceScore: analysisResult.overallConfidence,
            windowsDetected: analysisResult.windowsDetected,
            analysisData: analysisResult,
            apiResults: response,
            ...metadata
        };

        // Persist the measurement results using the data service
        const saveResult = await saveAIMeasurement(measurementData);
        if (!saveResult.success) {
            // Log the failure to save but still return the analysis to the user
            console.error("Failed to save AI measurement, but analysis was successful.", saveResult.error);
            await logSystemEvent({ eventType: 'ai_save_measurement_error', error: saveResult.error });
        }

        // Return a standardized success response containing the analysis
        return createSuccessResponse(analysisResult, 'Image analysis completed successfully.');

    } catch (error) {
        // Return a standardized error response
        return createErrorResponse(error, 'analyzeWindowImage');
    }
}

/**
 * Generates a conversational response using Claude AI.
 * @param {string} message - The user's message.
 * @param {Array} conversationHistory - The existing conversation history.
 * @param {string} customerId - The ID of the customer in the chat.
 * @param {object} context - Additional context for the conversation.
 * @returns {Promise<object>} A standardized success or error response object.
 */
export async function handleAIChat(message, conversationHistory = [], customerId = null, context = {}) {
    if (!message) {
        return createErrorResponse({ code: ERROR_CODES.REQUIRED_FIELD_MISSING, message: 'Message is required.' }, 'handleAIChat');
    }

    const systemPrompt = `You are a helpful AI assistant for Good Faith Exteriors, a professional window replacement company in Minnesota. Your name is GFE-AI. Provide friendly, expert advice on windows, pricing, and installation. Always offer to schedule a consultation for detailed quotes. Company phone: ${SYSTEM_CONSTANTS.COMPANY_PHONE}.`;

    try {
        const messages = [...conversationHistory, { role: 'user', content: message }];
        const response = await callAnthropicAPI(messages, systemPrompt);
        const aiResponse = response.content[0].text;

        await logSystemEvent({
            eventType: 'ai_chat_interaction',
            customerId: customerId,
            details: { messageLength: message.length, responseLength: aiResponse.length }
        });

        const chatResponse = {
            response: aiResponse,
            conversationId: context.conversationId || generateUniqueId(),
            timestamp: new Date().toISOString()
        };

        return createSuccessResponse(chatResponse, 'Chat response generated.');

    } catch (error) {
        return createErrorResponse(error, 'handleAIChat');
    }
}


/**
 * Generates product recommendations based on an analysis.
 * @param {object} analysisData - The data from a successful window analysis.
 * @param {object} customerPreferences - Any preferences the customer has provided.
 * @returns {Promise<object>} A standardized success or error response object.
 */
export async function generateProductRecommendations(analysisData, customerPreferences = {}) {
    if (!analysisData) {
        return createErrorResponse({ code: ERROR_CODES.REQUIRED_FIELD_MISSING, message: 'Analysis data is required.' }, 'generateProductRecommendations');
    }

    const systemPrompt = `You are a window product specialist for Good Faith Exteriors. Based on the provided window analysis and customer preferences, recommend the best window products in a valid JSON array format. Response must be only the JSON array. Format: [{"brand": string, "series": string, "reasoning": string, "priority": number}]`;

    try {
        const analysisText = `Analysis: ${JSON.stringify(analysisData)}. Preferences: ${JSON.stringify(customerPreferences)}. Provide product recommendations.`;
        const messages = [{ role: 'user', content: analysisText }];

        const response = await callAnthropicAPI(messages, systemPrompt);
        const recommendations = JSON.parse(response.content[0].text);

        return createSuccessResponse(recommendations, 'Product recommendations generated.');

    } catch (error) {
        return createErrorResponse(error, 'generateProductRecommendations');
    }
}