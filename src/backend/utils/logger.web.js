/**
 * Logger Utility Service
 * File: backend/utils/logger.web.js
 * 
 * Centralized logging service for system events
 */

import { SystemEventsService } from '../core/gridflow-service.web.js';

// =====================================================================
// LOGGER SERVICE
// =====================================================================

class Logger {
    constructor() {
        this.eventsService = new SystemEventsService();
        this.logLevel = 'INFO';
        this.enableConsoleLog = true;
    }

    /**
     * Log system event
     */
    async logSystemEvent(eventData) {
        try {
            // Add timestamp if not present
            if (!eventData.timestamp) {
                eventData.timestamp = new Date().toISOString();
            }

            // Console logging for development
            if (this.enableConsoleLog) {
                console.log(`[${eventData.timestamp}] ${eventData.eventType}:`, eventData);
            }

            // Save to database
            await this.eventsService.logEvent(eventData);

        } catch (error) {
            // Fallback to console only if database logging fails
            console.error('Failed to log system event:', error);
            console.log('Original event:', eventData);
        }
    }

    /**
     * Log info message
     */
    async info(message, data = {}) {
        await this.logSystemEvent({
            eventType: 'INFO',
            message: message,
            eventData: data,
            level: 'INFO'
        });
    }

    /**
     * Log warning message
     */
    async warn(message, data = {}) {
        await this.logSystemEvent({
            eventType: 'WARNING',
            message: message,
            eventData: data,
            level: 'WARNING'
        });
    }

    /**
     * Log error message
     */
    async error(message, error = null, data = {}) {
        await this.logSystemEvent({
            eventType: 'ERROR',
            message: message,
            error: error?.message || error,
            eventData: data,
            level: 'ERROR'
        });
    }

    /**
     * Log debug message
     */
    async debug(message, data = {}) {
        if (this.logLevel === 'DEBUG') {
            await this.logSystemEvent({
                eventType: 'DEBUG',
                message: message,
                eventData: data,
                level: 'DEBUG'
            });
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Export convenience function
export async function logSystemEvent(eventData) {
    return await logger.logSystemEvent(eventData);
}

export { logger };
export default logger;

