# Grid-Flow-Engine Command Center - Deployment Guide

## 🚀 Complete Operational Command Center for Good Faith Exteriors

This guide provides step-by-step instructions for deploying the fully operational Grid-Flow-Engine Command Center with all credentials integrated.

## 📁 Files Included

### Core Files
1. **`grid-flow-engine-command-center.html`** - Main command center interface (self-contained iframe)
2. **`grid-flow-engine-backend.jsw`** - Complete Velo backend with all credentials
3. **`grid-flow-engine-config.json`** - Comprehensive configuration file
4. **`DEPLOYMENT_GUIDE.md`** - This deployment guide

### Reference Files (from your uploads)
- `velo-frontend.js` - Frontend integration code
- `velo-oauth.jsw` - OAuth backend functions
- `wix-database-schema.js` - Database structure
- `updated-credentials.json` - Credential reference
- `client_secret_*.json` - Google OAuth credentials

## 🔐 Credentials Integrated

### Google OAuth & Workspace
- **Client ID**: `837326026335-og5oga2u90sm079ht8450s5j4v4kmio0.apps.googleusercontent.com`
- **Client Secret**: `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`
- **API Key**: `AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY`
- **Organization ID**: `518845478181`
- **Service Account**: `837326026335-compute@developer.gserviceaccount.com`

### Wix Headless API
- **Client ID**: `b32df066-e276-4d06-b9ee-18187d7b1439`
- **App Name**: `Grid-Flow Engine`
- **Account ID**: `10d52dd8-ec9b-4453-adbc-6293b99af499`
- **Admin Token**: Complete token integrated in backend

### Site Configuration
- **Domain**: `goodfaithexteriors.com`
- **Workspace**: `gridFlowEngine`
- **Metasite ID**: `5ec64f41-3f5e-4ba1-b9fc-018d3a8681a4`
- **Backend URL**: `https://gfe-backend-837326026335.us-central1.run.app`

## 🛠️ Deployment Steps

### Step 1: Wix Database Setup

1. **Access Wix Editor**
   - Go to your Wix site dashboard
   - Navigate to **Database > Collections**

2. **Create Required Collections**
   ```
   - WindowProducts (Product catalog)
   - Quotes (Generated quotes)
   - Customers (Customer data)
   - UserSessions (OAuth sessions)
   - PricingRules (Pricing configuration)
   - Analytics (Usage tracking)
   ```

3. **Set Collection Permissions**
   - WindowProducts: Read = Anyone, Write = Admin
   - All others: Read/Write = Admin only

### Step 2: Velo Backend Integration

1. **Add Backend File**
   - In Wix Editor, go to **Code Files**
   - Create new **Backend** file: `grid-flow-engine-backend.jsw`
   - Copy content from provided `grid-flow-engine-backend.jsw`
   - Save and publish

2. **Configure Wix Secrets** (Optional - for enhanced security)
   ```
   - GOOGLE_CLIENT_SECRET
   - WIX_ADMIN_TOKEN
   - BACKEND_URL
   - NOTIFICATION_EMAIL
   ```

### Step 3: Command Center Deployment

#### Option A: Direct HTML Iframe (Recommended)

1. **Upload HTML File**
   - Upload `grid-flow-engine-command-center.html` to your web hosting
   - Or use Wix Media Manager to host the file

2. **Embed in Wix Page**
   ```html
   <iframe 
       src="https://your-domain.com/grid-flow-engine-command-center.html"
       width="100%" 
       height="800px"
       frameborder="0"
       allow="camera; microphone; geolocation">
   </iframe>
   ```

#### Option B: Wix HTML Component

1. **Add HTML Component**
   - In Wix Editor, add **HTML Component** from "Embed & Social"
   - Assign unique ID: `#gridFlowEngineCommandCenter`

2. **Insert HTML Code**
   - Copy content from `grid-flow-engine-command-center.html`
   - Paste into HTML Component
   - Configure component settings

### Step 4: Frontend Integration (Optional)

1. **Add Page Code**
   - Create new page or edit existing page
   - Add frontend code from `velo-frontend.js`
   - Connect UI elements to backend functions

2. **Setup Communication**
   ```javascript
   // In page code
   $w('#gridFlowEngineCommandCenter').onMessage((event) => {
       const { type, data } = event.data;
       // Handle messages from command center
   });
   ```

## 🔧 Configuration

### Pricing Engine Setup
- **Base Markup**: 30% (already configured)
- **Calculation**: `(basePrice + pricePerUI) × 1.30`
- **Brand Multipliers**: Configured for major brands

### Authentication Flow
1. Google OAuth 2.0 for user authentication
2. Wix JWT tokens for session management
3. Automatic token refresh every 50 minutes
4. 24-hour session timeout

### API Endpoints
- `/api/products` - Window product catalog
- `/api/quotes/generate` - Quote generation
- `/api/customers` - Customer management
- `/api/analytics` - Usage analytics
- `/oauth/google/authorize` - OAuth flow

## 🎯 Features Included

### Command Center Dashboard
- **Real-time Metrics**: Products, quotes, customers, uptime
- **System Status**: All services monitoring
- **Authentication Manager**: OAuth status and controls
- **API Configuration**: Complete credential display
- **Terminal Interface**: Command-line system control

### Window Catalog System
- **Product Display**: Filterable catalog with search
- **30% Markup Pricing**: Automatic price calculation
- **Quote Generation**: Customer data collection
- **Analytics Tracking**: Usage and conversion metrics

### Security Features
- **CORS Protection**: Cross-origin request security
- **XSS Protection**: Input validation and sanitization
- **Token Encryption**: AES-256 encryption
- **Rate Limiting**: API abuse prevention

## 🧪 Testing

### Command Center Testing
1. **Open Command Center**: Navigate to deployed iframe
2. **Test Navigation**: Click through all sections
3. **Terminal Commands**: Try `status`, `help`, `config`
4. **API Testing**: Use "Test" buttons in API Endpoints section

### Integration Testing
1. **OAuth Flow**: Test Google authentication
2. **Product Loading**: Verify window products display
3. **Quote Generation**: Test quote calculation
4. **Customer Submission**: Test data collection

## 📊 Monitoring

### Health Checks
- **Endpoint**: `/health`
- **Interval**: Every 5 minutes
- **Alerts**: Email notifications for failures

### Analytics
- **Event Tracking**: Page views, interactions, conversions
- **Performance Metrics**: Response times, error rates
- **Dashboard Reporting**: Real-time analytics display

## 🔒 Security Considerations

### Production Deployment
1. **Move Credentials to Secrets**: Use Wix Secrets Manager
2. **Enable HTTPS**: Ensure all connections are encrypted
3. **Configure CORS**: Restrict to authorized domains
4. **Regular Updates**: Keep tokens and credentials current

### Access Control
- **Admin Only**: Backend operations restricted
- **User Authentication**: OAuth required for sensitive operations
- **Session Management**: Automatic timeout and refresh

## 🚨 Troubleshooting

### Common Issues

1. **OAuth Errors**
   - Verify redirect URIs in Google Console
   - Check client ID and secret
   - Ensure proper scopes configured

2. **API Connection Issues**
   - Verify backend URL accessibility
   - Check CORS configuration
   - Validate Wix admin token

3. **Database Errors**
   - Ensure collections exist with proper permissions
   - Verify field types match schema
   - Check data validation rules

### Debug Commands
```bash
# Terminal commands for debugging
status          # Check all system status
config          # Display configuration
auth            # Check authentication status
products        # Show product count
refresh         # Refresh all data
```

## 📞 Support

### Documentation
- **API Reference**: Available in command center
- **Database Schema**: See `wix-database-schema.js`
- **Configuration**: See `grid-flow-engine-config.json`

### Contact Information
- **Technical Support**: Available through command center
- **Business Support**: Contact Good Faith Exteriors
- **Emergency**: Use command center alert system

## 🎉 Success Criteria

### Deployment Complete When:
- ✅ Command center loads without errors
- ✅ All sections navigate properly
- ✅ Terminal commands execute successfully
- ✅ API endpoints respond correctly
- ✅ Authentication flow works
- ✅ Product catalog displays with pricing
- ✅ Quote generation functions
- ✅ Analytics tracking active

### Performance Targets
- **Load Time**: < 3 seconds
- **API Response**: < 500ms
- **Uptime**: > 99.5%
- **Error Rate**: < 1%

## 📈 Next Steps

### Phase 2 Enhancements
1. **PDF Quote Export**: Generate downloadable quotes
2. **Email Integration**: Automated quote delivery
3. **Advanced Analytics**: Detailed reporting dashboard
4. **Mobile Optimization**: Responsive design improvements
5. **Bulk Operations**: Mass product updates

### Maintenance Schedule
- **Daily**: Health check monitoring
- **Weekly**: Performance review
- **Monthly**: Security audit
- **Quarterly**: Feature updates

---

**Grid-Flow-Engine Command Center v1.0.0**  
*Complete operational command center for Good Faith Exteriors*  
*Deployed: December 30, 2024*

