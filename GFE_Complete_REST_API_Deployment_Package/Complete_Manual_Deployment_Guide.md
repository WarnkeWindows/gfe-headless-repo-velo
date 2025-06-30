# Good Faith Exteriors - Complete Manual Deployment Guide

## 🎯 **DEPLOYMENT OVERVIEW**

This guide provides complete instructions for manually deploying the Good Faith Exteriors website system to **goodfaithexteriors.com** using the Wix platform with all widgets, endpoints, and configurations.

## 📋 **DEPLOYMENT SUMMARY**

### ✅ **What's Ready for Deployment**
- **Landing Page:** Dark navy blue theme with 8 interactive tool cards
- **3 Core Widgets:** AI Window Estimator, Product Browser, AI Chat Agent
- **Data Collections:** Leads, Quotes, Products, Customers
- **API Endpoints:** Quote generation, lead capture, product catalog
- **Domain Configuration:** goodfaithexteriors.com mapping
- **Theme:** Consistent dark navy blue (#1a2332) with gold accents (#d4af37)

### 🔑 **Your Credentials**

#### **Wix Headless Site**
- **Site ID:** `1daf6e42-c7ae-4e56-9a0f-24209afd43c2`
- **Account ID:** `10d52dd8-ec9b-4453-adbc-6293b99af499`
- **Client ID:** `00a645c0-e9d5-474e-8546-4759ca41752a`
- **Dashboard:** https://manage.wix.com/dashboard/1daf6e42-c7ae-4e56-9a0f-24209afd43c2/setup

#### **Wix Blocks App**
- **App ID:** `477baa33-872c-4b41-8f1f-7d5e28a684f2`
- **Dashboard:** https://manage.wix.com/apps/477baa33-872c-4b41-8f1f-7d5e28a684f2/home?referralInfo=blocks
- **Namespace:** `@goodfaithexteriors/grid-flow-engine`

#### **Google Integration**
- **API Key:** `AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY`
- **Project ID:** `837326026335`
- **Service Account:** `837326026335-compute@developer.gserviceaccount.com`

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **Phase 1: Access Your Wix Dashboard**

1. **Open Wix Dashboard**
   - Go to: https://manage.wix.com/dashboard/1daf6e42-c7ae-4e56-9a0f-24209afd43c2/setup
   - Log in with your Wix account

2. **Verify Site Settings**
   - Confirm site name: "Good Faith Exteriors"
   - Check domain settings for goodfaithexteriors.com

### **Phase 2: Set Up Data Collections**

1. **Access Database**
   - In your Wix dashboard, go to "Database" or "Content Manager"
   - Click "Create Collection" for each of the following:

2. **Create GFE_Leads Collection**
   ```
   Collection Name: GFE_Leads
   Fields:
   - name (Text)
   - email (Text)
   - phone (Text)
   - source (Text)
   - status (Text)
   - notes (Rich Text)
   - createdDate (Date & Time)
   - lastContact (Date & Time)
   ```

3. **Create GFE_Quotes Collection**
   ```
   Collection Name: GFE_Quotes
   Fields:
   - quoteId (Text)
   - customerEmail (Text)
   - customerName (Text)
   - customerPhone (Text)
   - windowType (Text)
   - brand (Text)
   - material (Text)
   - quantity (Number)
   - unitPrice (Number)
   - total (Number)
   - status (Text)
   - quoteData (Object)
   - createdDate (Date & Time)
   ```

4. **Create GFE_WindowProducts Collection**
   ```
   Collection Name: GFE_WindowProducts
   Fields:
   - name (Text)
   - brand (Text)
   - type (Text)
   - style (Text)
   - material (Text)
   - series (Text)
   - basePrice (Number)
   - priceRange (Text)
   - features (Tags)
   - image (Image)
   - description (Rich Text)
   - specifications (Object)
   ```

5. **Create GFE_Customers Collection**
   ```
   Collection Name: GFE_Customers
   Fields:
   - email (Text)
   - name (Text)
   - phone (Text)
   - address (Object)
   - preferences (Object)
   - quotes (Reference - Multiple)
   - status (Text)
   - createdDate (Date & Time)
   - lastActivity (Date & Time)
   ```

### **Phase 3: Deploy Landing Page**

1. **Access Site Editor**
   - Click "Edit Site" in your dashboard
   - This opens the Wix Editor

2. **Replace Home Page Content**
   - Select the home page
   - Delete existing content
   - Add an HTML component from "Embed & Social"
   - Copy the content from `/home/ubuntu/gfe-headless-blocks-app/landing-page/index.html`
   - Paste into the HTML component

3. **Configure Page Settings**
   - Set page title: "Good Faith Exteriors - Premium Windows & Doors"
   - Set SEO description: "Get online quotes in minutes with AI-powered estimation tools"
   - Set keywords: "windows, doors, installation, Long Island, AI estimation"

### **Phase 4: Create Widget Pages**

1. **Create AI Estimator Page**
   - Add new page: "AI Window Estimator"
   - URL slug: `/ai-estimator`
   - Add HTML component
   - Copy content from `/home/ubuntu/gfe-headless-blocks-app/widgets/ai-window-estimator.html`

2. **Create Product Browser Page**
   - Add new page: "Product Browser"
   - URL slug: `/products`
   - Add HTML component
   - Copy content from `/home/ubuntu/gfe-headless-blocks-app/widgets/product-browser.html`

3. **Create Contact Page**
   - Add new page: "Contact & Support"
   - URL slug: `/contact`
   - Add contact information and forms

### **Phase 5: Configure Wix Blocks App**

1. **Access Blocks Dashboard**
   - Go to: https://manage.wix.com/apps/477baa33-872c-4b41-8f1f-7d5e28a684f2/home?referralInfo=blocks

2. **Create Widget Blocks**
   - Click "Create New Block"
   - For each widget, create a block:
     - **AI Window Estimator Block**
     - **Product Browser Block**
     - **AI Chat Agent Block**

3. **Configure Each Block**
   - Copy HTML content from respective widget files
   - Set category: "Business Tools"
   - Configure responsive settings
   - Test functionality

### **Phase 6: Set Up Backend Functions**

1. **Enable Velo (Dev Mode)**
   - In Wix Editor, click "Dev Mode" to enable Velo
   - This allows custom backend code

2. **Create Backend Files**
   - Create `quote-handler.jsw` in backend folder
   - Create `lead-handler.jsw` in backend folder
   - Create `product-handler.jsw` in backend folder

3. **Quote Handler Code**
   ```javascript
   import { ok, badRequest, serverError } from 'wix-http-functions';
   import wixData from 'wix-data';

   export async function post_quotes(request) {
       try {
           const quoteData = await request.body.json();
           
           const quoteId = 'GFE-' + Date.now();
           
           const quote = {
               quoteId: quoteId,
               customerEmail: quoteData.email,
               customerName: quoteData.name,
               customerPhone: quoteData.phone,
               windowType: quoteData.windowType,
               brand: quoteData.brand,
               material: quoteData.material,
               quantity: quoteData.quantity,
               unitPrice: quoteData.unitPrice,
               total: quoteData.total,
               status: 'pending',
               quoteData: quoteData,
               createdDate: new Date()
           };
           
           const result = await wixData.insert('GFE_Quotes', quote);
           
           return ok({
               body: {
                   success: true,
                   quoteId: quoteId,
                   quote: result
               }
           });
       } catch (error) {
           return serverError({
               body: { error: error.message }
           });
       }
   }
   ```

### **Phase 7: Configure Domain**

1. **Connect Custom Domain**
   - In Wix dashboard, go to Settings > Domains
   - Click "Connect Domain"
   - Enter: `goodfaithexteriors.com`
   - Follow DNS configuration instructions

2. **SSL Configuration**
   - Enable SSL certificate
   - Force HTTPS redirects
   - Configure www redirects

### **Phase 8: Populate Sample Data**

1. **Add Sample Products**
   - Go to Database > GFE_WindowProducts
   - Add sample products for each brand:
     - Andersen 400 Series Casement
     - Marvin Essential Double Hung
     - Pella Impervia Awning
     - Provia Slider Window
     - Windsor Bay Window
     - Thermo-Tech Picture Window

2. **Configure Product Data**
   ```
   Example Product:
   Name: Andersen 400 Series Casement
   Brand: Andersen
   Type: windows
   Style: casement
   Material: wood
   Series: 400 Series
   Base Price: 750
   Price Range: $600-900
   Features: Low-E Glass, Argon Fill, Wood Frame, Energy Star
   Image: [Upload product image]
   ```

### **Phase 9: Test All Systems**

1. **Test Landing Page**
   - Verify all 8 tool cards display correctly
   - Check responsive design on mobile
   - Test navigation between pages

2. **Test Widgets**
   - AI Window Estimator: Upload test image, generate quote
   - Product Browser: Filter products, view details
   - AI Chat Agent: Test conversation flow

3. **Test Data Flow**
   - Submit test quote, verify database entry
   - Submit test lead, verify capture
   - Test email notifications

### **Phase 10: Launch and Go Live**

1. **Final Review**
   - Check all pages load correctly
   - Verify domain configuration
   - Test all interactive elements

2. **Publish Site**
   - Click "Publish" in Wix Editor
   - Verify live site at goodfaithexteriors.com

3. **Monitor and Optimize**
   - Set up analytics tracking
   - Monitor lead generation
   - Track widget usage

## 🔗 **CONFIGURED ENDPOINTS**

### **Primary URLs**
- **Main Site:** https://goodfaithexteriors.com
- **AI Estimator:** https://goodfaithexteriors.com/ai-estimator
- **Product Browser:** https://goodfaithexteriors.com/products
- **Contact:** https://goodfaithexteriors.com/contact

### **API Endpoints**
- **Quote Creation:** `POST /api/quotes`
- **Lead Capture:** `POST /api/leads`
- **Product Catalog:** `GET /api/products`
- **AI Estimation:** `POST /api/ai/estimate`
- **Chat Support:** `POST /api/chat`

### **Dashboard URLs**
- **Wix Site Dashboard:** https://manage.wix.com/dashboard/1daf6e42-c7ae-4e56-9a0f-24209afd43c2/setup
- **Wix Blocks Dashboard:** https://manage.wix.com/apps/477baa33-872c-4b41-8f1f-7d5e28a684f2/home?referralInfo=blocks

## 🎨 **THEME CONFIGURATION**

### **Color Scheme**
- **Primary Background:** #1a2332 (Dark Navy Blue)
- **Secondary Color:** #d4af37 (Gold)
- **Accent Color:** #c0c0c0 (Silver)
- **Text Color:** #ffffff (White)
- **Border Color:** #d4af37 (Gold)

### **Typography**
- **Font Family:** Inter, sans-serif
- **Headings:** Bold, Gold color
- **Body Text:** Regular, White color
- **Buttons:** Bold, Dark background with Gold text

## 🖼️ **IMAGE ASSETS**

All widgets use proper image URLs from your Wix media library:

### **Logos & Branding**
- **GFE Logo Landscape:** https://static.wixstatic.com/media/10d52d_8f0c20132db94d0d9f695f94fda4b9eb~mv2.png
- **GFE Logo Square:** https://static.wixstatic.com/media/10d52d_ac7573dd43a6475088253b9cebf12832~mv2.png
- **Good Faith Estimator Icon:** https://static.wixstatic.com/media/10d52d_3ae1e0c1d7e14bc29cfa14bb8e1daae3~mv2.png

### **Brand Logos**
- **Andersen:** https://static.wixstatic.com/media/10d52d_0362f0e2607449dc807d7df305883bc9~mv2.jpeg
- **Marvin:** https://static.wixstatic.com/media/10d52d_a5381c6eee234bebb32b712a77ca9670~mv2.jpeg
- **Pella:** https://static.wixstatic.com/media/10d52d_dd63b7a12f074a90aa4b481556b9651f~mv2.jpeg
- **Provia:** https://static.wixstatic.com/media/162602_14f0d6c4e8a349d8aa87f1586bac09da~mv2.png
- **Thermo-Tech:** https://static.wixstatic.com/media/10d52d_49654779eb11499f8a7ca634630787d3~mv2.jpeg

### **Window Types**
- **Casement:** https://static.wixstatic.com/media/10d52d_a8b2670c496343b4b231b5044f46e30b~mv2.png
- **Double-Hung:** https://static.wixstatic.com/media/10d52d_b7191df42c924cb1bb1a936670cd496e~mv2.png
- **Awning:** https://static.wixstatic.com/media/10d52d_2b2decc6c28e488d9b00d9f73c93f592~mv2.png
- **Bay Window:** https://static.wixstatic.com/media/10d52d_f38d25e291c14d229d01ad26856145e5~mv2.png
- **Picture Window:** https://static.wixstatic.com/media/10d52d_16542e06d2ce45a98f06575249fdfbd7~mv2.png

## 📱 **MOBILE OPTIMIZATION**

All components are fully responsive:
- **Breakpoints:** 768px (tablet), 480px (mobile)
- **Touch-friendly:** All buttons and interactive elements
- **Responsive Grid:** Adapts to screen size
- **Mobile Navigation:** Simplified menu structure

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

1. **Widget Not Loading**
   - Check HTML component configuration
   - Verify script tags are included
   - Check browser console for errors

2. **Data Not Saving**
   - Verify collection field names match code
   - Check Velo permissions
   - Test database connections

3. **Domain Not Working**
   - Verify DNS settings
   - Check domain connection in Wix
   - Allow 24-48 hours for propagation

### **Support Resources**
- **Wix Support:** Available through dashboard
- **Documentation:** All files include detailed comments
- **Testing:** Each widget includes test functionality

## 🎯 **SUCCESS METRICS**

Track these metrics after deployment:
- **Widget Usage:** Which tools are most popular
- **Lead Generation:** Conversion rates from each tool
- **Customer Engagement:** Time spent using tools
- **Quote Completion:** How many quotes are generated
- **Mobile Usage:** Percentage of mobile visitors

## 📞 **CONTACT INFORMATION**

### **Business Details**
- **Phone:** 631-416-669
- **Email:** info@goodfaithexteriors.com
- **Website:** goodfaithexteriors.com
- **Service Area:** Long Island, NY

### **Business Hours**
- **Monday-Friday:** 8 AM - 6 PM
- **Saturday:** 9 AM - 4 PM
- **Sunday:** By appointment
- **Emergency Service:** Available 24/7

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Access Wix Dashboard
- [ ] Create Data Collections (4 collections)
- [ ] Deploy Landing Page
- [ ] Create Widget Pages (3 pages)
- [ ] Configure Wix Blocks App
- [ ] Set Up Backend Functions
- [ ] Configure Domain (goodfaithexteriors.com)
- [ ] Populate Sample Data
- [ ] Test All Systems
- [ ] Launch and Go Live
- [ ] Monitor and Optimize

**Your complete Good Faith Exteriors website system is ready for deployment!**

