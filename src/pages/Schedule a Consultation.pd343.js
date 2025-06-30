// Velo Page Code for Schedule Consultation Page
// Location: Page Code for Schedule Consultation page in Wix Editor

import { bookConsultation, getAvailableTimeSlots, updateBookingStatus } from 'backend/integrations/consultationBookingService.jsw';
import { logActivity } from 'backend/core/activityLogger.jsw';
import wixWindow from 'wix-window';
import wixUsers from 'wix-users';

// Page variables
let userId = null;
let isInitialized = false;
let sessionStartTime = Date.now();

$w.onReady(function () {
    console.log('📅 Schedule Consultation Page - Velo Code Loaded');
    
    // Get current user if logged in
    getCurrentUser();
    
    // Set up iframe communication
    setupConsultationCommunication();
    
    // Initialize consultation scheduler
    initializeConsultationScheduler();
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
 * Initialize the consultation scheduler
 */
async function initializeConsultationScheduler() {
    try {
        console.log('🚀 Initializing Consultation Scheduler...');
        
        isInitialized = true;
        console.log('✅ Consultation scheduler initialized successfully');
        
        // Send status to iframe
        sendToIframe('connection_status', { status: 'connected' });
        
    } catch (error) {
        console.error('❌ Failed to initialize consultation scheduler:', error);
        isInitialized = false;
        sendToIframe('connection_status', { status: 'disconnected' });
        sendToIframe('error', { 
            message: 'Failed to initialize booking system. Please refresh the page.' 
        });
    }
}

/**
 * Set up communication with the consultation iframe
 */
function setupConsultationCommunication() {
    // Listen for messages from iframe using the iframe element directly
    const iframeElement = $w('#scheduleConsultationEmbed');
    
    if (iframeElement) {
        // Set up the onMessage handler for the iframe
        iframeElement.onMessage((event) => {
            handleIframeMessage(event);
        });
        
        console.log('📡 Consultation communication setup complete');
    } else {
        console.error('❌ Consultation iframe element #scheduleConsultationEmbed not found');
    }
}

/**
 * Handle messages from the consultation iframe
 */
async function handleIframeMessage(event) {
    try {
        // Extract data from Wix iframe event
        const data = event.data || {};
        const { type, payload, source } = data;
        
        // Only handle messages from our consultation scheduler
        if (source !== 'gfe_consultation_scheduler') return;
        
        console.log('📨 Received message from iframe:', type, payload);
        
        switch (type) {
            case 'scheduler_ready':
                console.log('✅ Consultation scheduler ready');
                break;
                
            case 'book_consultation':
                await handleBookConsultation(payload);
                break;
                
            case 'check_availability':
                await handleCheckAvailability(payload);
                break;
                
            case 'track_conversion':
                await handleTrackConversion(payload);
                break;
                
            default:
                console.log('Unknown message type:', type);
        }
        
    } catch (error) {
        console.error('❌ Error handling iframe message:', error);
        sendToIframe('booking_error', { 
            message: 'An error occurred processing your request.' 
        });
    }
}

/**
 * Handle consultation booking request
 */
async function handleBookConsultation(payload) {
    try {
        if (!isInitialized) {
            throw new Error('Booking system not initialized');
        }
        
        console.log('📅 Processing consultation booking...');
        
        const bookingData = {
            customerName: payload.customerName,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            projectType: payload.projectType,
            numberOfWindows: payload.numberOfWindows,
            projectNotes: payload.projectNotes,
            preferredDate: payload.preferredDate,
            preferredTime: payload.preferredTime,
            urgency: payload.urgency,
            serviceType: 'Window Consultation',
            notes: `Project: ${payload.projectType}\nWindows: ${payload.numberOfWindows || 'Not specified'}\nTimeline: ${payload.urgency || 'Not specified'}\n\nNotes: ${payload.projectNotes || 'None provided'}`,
            estimatedValue: calculateEstimatedValue(payload),
            source: payload.source || 'Consultation Booking Form'
        };
        
        // Book consultation using backend service
        const result = await bookConsultation(bookingData);
        
        console.log('📅 Booking result:', result.success);
        
        if (result.success) {
            // Log successful booking activity
            await logActivity({
                type: 'consultation_booking_submitted',
                userId: userId,
                details: {
                    bookingId: result.bookingId,
                    leadId: result.leadId,
                    customerName: bookingData.customerName,
                    preferredDate: bookingData.preferredDate,
                    projectType: bookingData.projectType,
                    source: bookingData.source
                },
                timestamp: new Date()
            });
            
            // Send success response to iframe
            sendToIframe('booking_success', {
                success: true,
                bookingId: result.bookingId,
                confirmationId: result.confirmationId,
                leadId: result.leadId,
                message: result.message,
                booking: result.booking,
                estimatedValue: bookingData.estimatedValue,
                timestamp: new Date().toISOString()
            });
            
            // Log analytics event
            await logConsultationAnalytics('consultation_booked', {
                userId: userId,
                bookingId: result.bookingId,
                customerName: bookingData.customerName,
                projectType: bookingData.projectType,
                estimatedValue: bookingData.estimatedValue,
                source: bookingData.source
            });
            
        } else {
            throw new Error(result.error || 'Booking failed');
        }
        
    } catch (error) {
        console.error('❌ Error booking consultation:', error);
        
        // Log failed booking attempt
        await logActivity({
            type: 'consultation_booking_failed',
            userId: userId,
            details: {
                error: error.message,
                customerName: payload.customerName,
                preferredDate: payload.preferredDate,
                projectType: payload.projectType
            },
            timestamp: new Date()
        });
        
        sendToIframe('booking_error', {
            success: false,
            error: error.message,
            message: 'Failed to schedule consultation. Please try again or call us directly at (612) 555-WINDOWS.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle availability check request
 */
async function handleCheckAvailability(payload) {
    try {
        console.log('🔍 Checking availability for:', payload.date);
        
        // Get available time slots for the requested date
        const availabilityResult = await getAvailableTimeSlots(payload.date);
        
        if (availabilityResult.success) {
            sendToIframe('availability_response', {
                date: payload.date,
                timeSlots: availabilityResult.timeSlots,
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('⚠️ Failed to get availability:', availabilityResult.error);
            // Send default availability (all slots available)
            sendToIframe('availability_response', {
                date: payload.date,
                timeSlots: getDefaultTimeSlots(),
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking availability:', error);
        // Send default availability on error
        sendToIframe('availability_response', {
            date: payload.date,
            timeSlots: getDefaultTimeSlots(),
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Handle conversion tracking
 */
async function handleTrackConversion(payload) {
    try {
        console.log('📊 Tracking conversion:', payload.event);
        
        // Log conversion event
        await logActivity({
            type: 'conversion_tracked',
            userId: userId,
            details: {
                event: payload.event,
                bookingId: payload.bookingId,
                value: payload.value,
                source: 'Consultation Booking'
            },
            timestamp: new Date()
        });
        
        // Log to analytics if available
        await logConsultationAnalytics(payload.event, {
            userId: userId,
            bookingId: payload.bookingId,
            value: payload.value,
            source: 'Consultation Booking'
        });
        
    } catch (error) {
        console.error('❌ Error tracking conversion:', error);
        // Don't throw - conversion tracking failure shouldn't break the flow
    }
}

/**
 * Calculate estimated project value based on form data
 */
function calculateEstimatedValue(payload) {
    let estimatedValue = 0;
    
    // Base estimation logic
    const windowCounts = {
        '1-5': 3,
        '6-10': 8,
        '11-15': 13,
        '16-20': 18,
        '20+': 25,
        'Unknown': 10
    };
    
    const projectMultipliers = {
        'Window Replacement': 800,
        'Partial Replacement': 600,
        'New Construction': 700,
        'Storm Windows': 300,
        'Window Repair': 150,
        'Energy Upgrade': 900,
        'Consultation Only': 0,
        'Other': 500
    };
    
    const numberOfWindows = windowCounts[payload.numberOfWindows] || 10;
    const pricePerWindow = projectMultipliers[payload.projectType] || 500;
    
    estimatedValue = numberOfWindows * pricePerWindow;
    
    // Adjust for urgency
    if (payload.urgency === 'ASAP') {
        estimatedValue *= 1.1; // Rush projects might be higher value
    }
    
    return Math.round(estimatedValue);
}

/**
 * Get default time slots when availability check fails
 */
function getDefaultTimeSlots() {
    return [
        { time: '8:00 AM', available: true },
        { time: '9:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: true },
        { time: '1:00 PM', available: true },
        { time: '2:00 PM', available: true },
        { time: '3:00 PM', available: true },
        { time: '4:00 PM', available: true }
    ];
}

/**
 * Send message to iframe
 */
function sendToIframe(type, payload) {
    const iframeElement = $w('#scheduleConsultationEmbed');
    
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
        console.error('❌ Consultation iframe element not found or postMessage not available');
    }
}

/**
 * Log consultation analytics
 */
async function logConsultationAnalytics(eventType, data) {
    try {
        // Log to activity logger
        await logActivity({
            type: `consultation_${eventType}`,
            userId: data.userId,
            details: {
                bookingId: data.bookingId,
                customerName: data.customerName,
                projectType: data.projectType,
                estimatedValue: data.estimatedValue,
                source: data.source
            },
            timestamp: new Date()
        });
        
        console.log('📊 Consultation Analytics logged:', eventType, data);
        
    } catch (error) {
        console.warn('Warning: Failed to log consultation analytics:', error);
        // Don't throw error - analytics failure shouldn't break functionality
    }
}

/**
 * Handle page visibility changes
 */
function setupPageEventListeners() {
    try {
        // Log session end when user leaves page
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                logConsultationAnalytics('session_end', {
                    userId: userId,
                    sessionDuration: Date.now() - sessionStartTime,
                    source: 'Consultation Page'
                });
            });
        }
    } catch (error) {
        console.warn('Could not set up page event listeners:', error);
    }
}

// Set up page event listeners
setupPageEventListeners();

/**
 * Export functions for testing/debugging
 */
export function getConsultationStatus() {
    return {
        isInitialized: isInitialized,
        userId: userId,
        sessionStartTime: sessionStartTime
    };
}

export function resetConsultationScheduler() {
    isInitialized = false;
    initializeConsultationScheduler();
}

// Log successful initialization
console.log('🎯 Consultation scheduler Velo code initialized successfully');