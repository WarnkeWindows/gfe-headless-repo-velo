# Good Faith Exteriors - Window Catalog Integration Summary

## 🔐 Credentials Integrated

### Google OAuth & Workspace
- **Google Workspace API Key**: `AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY`
- **Organization ID**: `518845478181`
- **Service Account**: `837326026335-compute@developer.gserviceaccount.com`
- **Client ID**: `837326026335-og5oga2u90sm079ht8450s5j4v4kmio0.apps.googleusercontent.com`
- **Client Secret**: `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`

### Wix Headless Settings
- **Client ID**: `b32df066-e276-4d06-b9ee-18187d7b1439`
- **App Name**: `Grid-Flow Engine`
- **Admin API Name**: `GRID_FLOW_ENGINE`
- **Account ID**: `10d52dd8-ec9b-4453-adbc-6293b99af499`
- **Admin Token**: `IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0...` (Full token integrated)

### Site Configuration
- **Domain**: `goodfaithexteriors.com`
- **Workspace**: `gridFlowEngine`
- **Metasite ID**: `5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4`
- **Backend Container**: `https://gfe-backend-837326026335.us-central1.run.app`

## 📁 Files Created for Velo Integration

### 1. Backend JSW File: `velo-oauth.jsw`
**Purpose**: Server-side authentication and API integration
**Key Functions**:
- `initializeCredentials()` - Loads all OAuth and API credentials
- `generateGoogleOAuthUrl()` - Creates Google OAuth authentication URLs
- `exchangeOAuthCode()` - Exchanges OAuth codes for access tokens
- `authenticateWixHeadless()` - Authenticates with Wix Headless API
- `wixHeadlessApiRequest()` - Makes authenticated requests to Wix APIs
- `getWindowProducts()` - Retrieves window products with 30% markup
- `calculateQuote()` - Generates quotes for selected products
- `submitCustomerData()` - Handles customer data collection

### 2. Frontend Code: `velo-frontend.js`
**Purpose**: Client-side user interface and interactions
**Key Features**:
- OAuth authentication flow
- Product catalog display with filtering
- Shopping cart functionality
- Quote generation interface
- Customer data collection forms
- Iframe communication support

### 3. Database Schema: `wix-database-schema.js`
**Purpose**: Defines Wix Data collections structure
**Collections Defined**:
- `WindowProducts` - Product catalog with pricing
- `Quotes` - Generated quotes and estimates
- `Customers` - Customer information and leads
- `UserSessions` - OAuth session management
- `PricingRules` - Dynamic pricing configuration
- `Analytics` - Usage tracking and metrics

### 4. Configuration Files:
- `updated-credentials.json` - Consolidated credential storage
- `config.py` - Flask backend configuration (if needed)

## 🔧 Implementation Steps

### Step 1: Set Up Wix Database Collections
1. Go to your Wix site dashboard
2. Navigate to **Database > Collections**
3. Create collections using the schemas in `wix-database-schema.js`
4. Import window products data from the CSV file
5. Set appropriate permissions for each collection

### Step 2: Add Backend JSW File
1. In Wix Editor, go to **Code Files**
2. Create new **Backend** file named `velo-oauth.jsw`
3. Copy the content from the provided `velo-oauth.jsw` file
4. Save and publish

### Step 3: Add Frontend Code
1. Create a new page or add to existing page
2. Add the frontend code from `velo-frontend.js`
3. Connect UI elements to the code functions
4. Configure iframe settings if needed

### Step 4: Configure Wix Secrets
Add these secrets in your Wix site's **Secrets Manager**:
```
cloud_vision_api_client_id
cloud_vision_client_secret
good-faith-exteriors-oauth-app-id
good-faith-exteriors-oauth-app-secret
GFE_ID_Wix_API
GFE-API
BACKEND_URL
company_name
company_email
company_phone
company_website
base_price_multiplier
brand_multipliers
material_multiplier
type_multipliers
quote_email_template
NOTIFICATION_EMAIL
```

## 🎯 Key Features Implemented

### Multi-Layer Authentication
- **Google OAuth 2.0** for user authentication
- **Wix JWT tokens** for session management
- **Wix Headless API** for backend integration

### Window Catalog System
- **Product Display** with filtering and search
- **30% Markup Pricing** automatically applied
- **Quote Generation** with customer data collection
- **Responsive Design** for iframe embedding

### Data Collection & CRM
- **Customer Information** capture
- **Project Details** collection
- **Quote Management** system
- **Analytics Tracking** for usage metrics

### API Integration
- **Google Workspace** integration
- **Wix Headless APIs** for data management
- **Backend Container** communication
- **Cross-origin** request handling

## 🔒 Security Features

### OAuth Implementation
- Secure token exchange
- Refresh token handling
- Session management
- CORS protection

### Data Protection
- Encrypted credential storage
- Secure API communication
- Input validation
- XSS protection

## 📊 Pricing System

### 30% Markup Implementation
- Automatic price calculation
- Base price + (Price per UI × UI) × 1.30
- Real-time quote generation
- Transparent pricing display

### Dynamic Pricing Rules
- Brand-specific multipliers
- Material-based adjustments
- Volume discounts (configurable)
- Seasonal pricing support

## 🌐 Iframe Integration

### Parent-Child Communication
- PostMessage API for data exchange
- Responsive iframe sizing
- Quote data transmission
- Event handling

### Embedding Instructions
```html
<iframe 
    src="https://goodfaithexteriors.com/window-catalog"
    width="100%" 
    height="800px"
    frameborder="0"
    allow="camera; microphone; geolocation">
</iframe>
```

## 📈 Analytics & Tracking

### Event Tracking
- Page views
- Product interactions
- Quote generations
- Customer submissions

### Performance Metrics
- Conversion rates
- Popular products
- User engagement
- Revenue tracking

## 🚀 Deployment Checklist

- [ ] Database collections created
- [ ] JSW backend file uploaded
- [ ] Frontend code implemented
- [ ] Wix secrets configured
- [ ] OAuth credentials tested
- [ ] Window products imported
- [ ] Pricing rules configured
- [ ] Iframe embedding tested
- [ ] Analytics tracking verified
- [ ] Customer data flow tested

## 📞 Support & Maintenance

### Regular Updates
- OAuth token refresh
- Product catalog updates
- Pricing adjustments
- Security patches

### Monitoring
- API usage tracking
- Error logging
- Performance monitoring
- User feedback collection

---

**Note**: All sensitive credentials have been integrated into the Velo backend system. Ensure proper security practices when deploying to production.

