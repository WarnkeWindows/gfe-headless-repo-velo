/**
 * Wix Database Schema for Good Faith Exteriors Window Catalog
 * 
 * This file defines the database collections needed for the window catalog system
 * Use this as a reference when setting up your Wix Data collections
 */

// WindowProducts Collection
const WindowProductsSchema = {
    collectionName: 'WindowProducts',
    fields: {
        _id: { type: 'text', required: true }, // Auto-generated
        productId: { type: 'text', required: true }, // e.g., "PRV-ECO-CSM"
        windowBrand: { type: 'text', required: true }, // e.g., "Provia"
        series: { type: 'text', required: true }, // e.g., "ecoLite"
        interiorMaterial: { type: 'text', required: true }, // e.g., "Vinyl"
        exteriorMaterial: { type: 'text', required: true }, // e.g., "Vinyl"
        basePrice: { type: 'number', required: true }, // Base price in dollars
        baseWidth: { type: 'number', required: true }, // Width in inches
        baseHeight: { type: 'number', required: true }, // Height in inches
        baseUI: { type: 'number', required: true }, // Base United Inches
        pricePerUI: { type: 'number', required: true }, // Price per United Inch
        description: { type: 'text', required: true },
        isActive: { type: 'boolean', required: true },
        createdDate: { type: 'date', required: true },
        updatedDate: { type: 'date', required: true },
        owner: { type: 'text', required: true },
        
        // Additional fields for enhanced functionality
        category: { type: 'text' }, // casement, double_hung, sliding, etc.
        energyRating: { type: 'text' },
        warranty: { type: 'text' },
        installationComplexity: { type: 'text' }, // easy, medium, complex
        leadTime: { type: 'number' }, // days
        images: { type: 'mediaGallery' },
        specifications: { type: 'richText' },
        tags: { type: 'tags' }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Anyone'
    }
};

// Quotes Collection
const QuotesSchema = {
    collectionName: 'Quotes',
    fields: {
        _id: { type: 'text', required: true },
        quoteId: { type: 'text', required: true }, // e.g., "GFE-1703123456789"
        customerId: { type: 'text' }, // Reference to Customers collection
        customerInfo: { type: 'object', required: true },
        projectDetails: { type: 'object', required: true },
        products: { type: 'object', required: true }, // Array of selected products
        subtotal: { type: 'number', required: true },
        markupPercentage: { type: 'number', required: true },
        totalPrice: { type: 'number', required: true },
        status: { type: 'text', required: true }, // draft, sent, accepted, rejected
        validUntil: { type: 'date', required: true },
        createdAt: { type: 'date', required: true },
        updatedAt: { type: 'date' },
        
        // Additional fields
        notes: { type: 'richText' },
        internalNotes: { type: 'richText' },
        salesRep: { type: 'text' },
        source: { type: 'text' }, // website, phone, referral, etc.
        followUpDate: { type: 'date' },
        estimatedInstallDate: { type: 'date' }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    }
};

// Customers Collection
const CustomersSchema = {
    collectionName: 'Customers',
    fields: {
        _id: { type: 'text', required: true },
        name: { type: 'text', required: true },
        email: { type: 'text', required: true },
        phone: { type: 'text', required: true },
        address: { type: 'text' },
        city: { type: 'text' },
        state: { type: 'text' },
        zipCode: { type: 'text' },
        projectType: { type: 'text' }, // residential, commercial
        installationType: { type: 'text' }, // new_construction, replacement
        preferredContact: { type: 'text' }, // email, phone, text
        timeframe: { type: 'text' }, // immediate, 1-3_months, 3-6_months, etc.
        source: { type: 'text', required: true },
        status: { type: 'text', required: true }, // new_lead, contacted, quoted, customer, closed
        createdAt: { type: 'date', required: true },
        updatedAt: { type: 'date' },
        
        // Additional fields
        notes: { type: 'richText' },
        tags: { type: 'tags' },
        assignedSalesRep: { type: 'text' },
        lastContactDate: { type: 'date' },
        nextFollowUpDate: { type: 'date' },
        estimatedValue: { type: 'number' },
        referralSource: { type: 'text' }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    }
};

// UserSessions Collection (for OAuth tracking)
const UserSessionsSchema = {
    collectionName: 'UserSessions',
    fields: {
        _id: { type: 'text', required: true },
        userId: { type: 'text', required: true },
        sessionToken: { type: 'text', required: true },
        accessToken: { type: 'text' },
        refreshToken: { type: 'text' },
        provider: { type: 'text', required: true }, // google, wix, etc.
        userInfo: { type: 'object' },
        expiresAt: { type: 'date', required: true },
        createdAt: { type: 'date', required: true },
        lastUsed: { type: 'date' },
        isActive: { type: 'boolean', required: true }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    }
};

// PricingRules Collection
const PricingRulesSchema = {
    collectionName: 'PricingRules',
    fields: {
        _id: { type: 'text', required: true },
        ruleName: { type: 'text', required: true },
        ruleType: { type: 'text', required: true }, // markup, discount, multiplier
        value: { type: 'number', required: true },
        applicableProducts: { type: 'object' }, // Array of product criteria
        startDate: { type: 'date' },
        endDate: { type: 'date' },
        isActive: { type: 'boolean', required: true },
        createdAt: { type: 'date', required: true },
        updatedAt: { type: 'date' }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    }
};

// Analytics Collection
const AnalyticsSchema = {
    collectionName: 'Analytics',
    fields: {
        _id: { type: 'text', required: true },
        eventType: { type: 'text', required: true }, // page_view, product_view, quote_generated, etc.
        userId: { type: 'text' },
        sessionId: { type: 'text' },
        productId: { type: 'text' },
        quoteId: { type: 'text' },
        customerId: { type: 'text' },
        eventData: { type: 'object' },
        timestamp: { type: 'date', required: true },
        userAgent: { type: 'text' },
        ipAddress: { type: 'text' },
        referrer: { type: 'text' }
    },
    permissions: {
        insert: 'Admin',
        update: 'Admin',
        remove: 'Admin',
        read: 'Admin'
    }
};

// Export schemas for reference
export const DatabaseSchemas = {
    WindowProducts: WindowProductsSchema,
    Quotes: QuotesSchema,
    Customers: CustomersSchema,
    UserSessions: UserSessionsSchema,
    PricingRules: PricingRulesSchema,
    Analytics: AnalyticsSchema
};

// Database setup instructions
export const SetupInstructions = {
    steps: [
        "1. Go to your Wix site's dashboard",
        "2. Navigate to Database > Collections",
        "3. Create each collection using the schemas above",
        "4. Set the appropriate permissions for each collection",
        "5. Import the window products data from the CSV file",
        "6. Configure the pricing rules with 30% markup",
        "7. Test the OAuth integration with the provided credentials"
    ],
    notes: [
        "Ensure all required fields are marked as required in Wix",
        "Set up proper indexes for frequently queried fields",
        "Configure data validation rules where appropriate",
        "Set up automated backups for critical collections"
    ]
};

