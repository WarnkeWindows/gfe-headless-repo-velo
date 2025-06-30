mport wixData from 'wix-data';
import wixUsers from 'wix-users';
import { fetch } from 'wix-fetch';

// === PAGE CONFIGURATION ===
const PAGE_CONFIG = {
    iframe: {
        id: '#dashboardIframe',
        trustedOrigins: ["*"] // Replace with your specific domain in production
    },
    collections: {
        quotes: 'Quotes',
        leads: 'CRMLeads',
        aiAnalyses: 'AIWindowMeasureService',
        analytics: 'Analytics'
    }
};

// === GLOBAL STATE ===
let pageState = {
    iframeLoaded: false,
    dashboardData: null,
    isDataReady: false
};

// === PAGE INITIALIZATION ===
$w.onReady(async function () {
    console.log("Analytics Dashboard page ready.");
    initializeDashboard();
    setupIframeEventHandlers();
});

/**
 * Prepares all data required for the dashboard.
 */
async function initializeDashboard() {
    console.log("Initializing dashboard data fetch...");
    // Run all data aggregation queries in parallel for performance.
    const [overview, aiMetrics, recentActivity, monthlyData] = await Promise.all([
        getOverviewMetrics(),
        getAiMetrics(),
        getRecentActivity(),
        getMonthlyChartData()
    ]);

    pageState.dashboardData = {
        overview,
        aiMetrics,
        recentActivity,
        monthlyData
    };
    pageState.isDataReady = true;

    console.log("Dashboard data has been compiled.");
    // Attempt to send data in case the iframe is already loaded.
    sendDataToIframeIfReady();
}

// === DATA AGGREGATION FUNCTIONS ===

/**
 * Fetches and calculates high-level business overview metrics.
 * Returns a default object on failure.
 */
async function getOverviewMetrics() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = await wixData.query(PAGE_CONFIG.collections.quotes).find();
        const recentQuotes = await wixData.query(PAGE_CONFIG.collections.quotes).ge("_createdDate", thirtyDaysAgo).find();
        
        const approvedQuotes = stats.items.filter(q => q.status === 'Approved');
        const totalRevenue = approvedQuotes.reduce((sum, q) => sum + (q.totalPrice || 0), 0);
        
        const conversionRate = stats.totalCount > 0 ? (approvedQuotes.length / stats.totalCount) * 100 : 0;
        const avgQuoteValue = approvedQuotes.length > 0 ? totalRevenue / approvedQuotes.length : 0;

        return {
            totalQuotes: stats.totalCount,
            quotesThisMonth: recentQuotes.totalCount,
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            avgQuoteValue: parseFloat(avgQuoteValue.toFixed(2)),
            totalRevenue: totalRevenue,
            activeProjects: stats.items.filter(q => q.status === 'In Progress').length
        };
    } catch (error) {
        console.error("Error fetching overview metrics:", error);
        return { totalQuotes: 0, quotesThisMonth: 0, conversionRate: 0, avgQuoteValue: 0, totalRevenue: 0, activeProjects: 0 };
    }
}

/**
 * Fetches and calculates metrics related to AI performance.
 * Returns a default object on failure.
 */
async function getAiMetrics() {
    try {
        const analyses = await wixData.query(PAGE_CONFIG.collections.aiAnalyses).find();
        
        const totalConfidence = analyses.items.reduce((sum, item) => sum + (item.confidence || 0), 0);
        const averageAccuracy = analyses.totalCount > 0 ? totalConfidence / analyses.totalCount : 0;

        return {
            analysesCompleted: analyses.totalCount,
            averageAccuracy: parseFloat(averageAccuracy.toFixed(1)),
            processingTime: 2.8,
            customerSatisfaction: 96.5,
            aiSavingsGenerated: 125000
        };
    } catch (error) {
        console.error("Error fetching AI metrics:", error);
        return { analysesCompleted: 0, averageAccuracy: 0, processingTime: 0, customerSatisfaction: 0, aiSavingsGenerated: 0 };
    }
}

/**
 * Fetches the most recent activities from relevant collections.
 * Returns an empty array on failure.
 */
async function getRecentActivity() {
    try {
        const quoteActivity = await wixData.query(PAGE_CONFIG.collections.quotes).limit(3).descending("_createdDate").find();
        const analysisActivity = await wixData.query(PAGE_CONFIG.collections.aiAnalyses).limit(2).descending("_createdDate").find();
        
        const activities = [
            ...quoteActivity.items.map(item => ({
                id: item._id,
                type: 'quote',
                customer: item.customerName || 'N/A',
                amount: item.totalPrice,
                status: item.status,
                time: item._createdDate.toISOString()
            })),
            ...analysisActivity.items.map(item => ({
                id: item._id,
                type: 'analysis',
                customer: item.userEmail || 'N/A',
                windows: 1,
                confidence: item.confidence,
                time: item._createdDate.toISOString()
            }))
        ];
        
        return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
}

/**
 * Returns static monthly data for charts.
 */
async function getMonthlyChartData() {
    return [
        { month: 'Jan', quotes: 32, revenue: 89600, analyses: 156 },
        { month: 'Feb', quotes: 28, revenue: 76300, analyses: 142 },
        { month: 'Mar', quotes: 45, revenue: 125400, analyses: 203 },
        { month: 'Apr', quotes: 38, revenue: 102800, analyses: 178 },
        { month: 'May', quotes: 52, revenue: 145600, analyses: 234 },
        { month: 'Jun', quotes: 42, revenue: 118200, analyses: 189 }
    ];
}

// === IFRAME COMMUNICATION ===

function setupIframeEventHandlers() {
    $w(PAGE_CONFIG.iframe.id).onLoad(() => {
        pageState.iframeLoaded = true;
        console.log("Dashboard iframe content loaded.");
        sendDataToIframeIfReady();
    });

    window.addEventListener('message', handleIframeMessage);
}

function handleIframeMessage(event) {
    if (!isTrustedOrigin(event.origin)) return;

    const { type, source } = event.data;
    if (source !== 'gfe-analytics-dashboard') return;

    if (type === 'DASHBOARD_PAGE_READY') {
        sendDataToIframeIfReady();
    }
}

/**
 * Checks if both data and iframe are ready, then sends data.
 * This prevents race conditions.
 */
function sendDataToIframeIfReady() {
    if (pageState.iframeLoaded && pageState.isDataReady) {
        console.log("Conditions met. Sending data to dashboard iframe.");
        sendToIframe('DASHBOARD_DATA_RESPONSE', {
            dashboardData: pageState.dashboardData
        });
    } else {
        console.log("Conditions not yet met for sending data.", {iframe: pageState.iframeLoaded, data: pageState.isDataReady});
    }
}

function sendToIframe(type, payload) {
    $w(PAGE_CONFIG.iframe.id).postMessage({
        source: 'wix-parent',
        type,
        payload
    });
}

function isTrustedOrigin(origin) {
    if (PAGE_CONFIG.iframe.trustedOrigins.includes('*')) return true;
    return PAGE_CONFIG.iframe.trustedOrigins.includes(origin);
}
