// GFlow System - Frontend FLF Integration
// File: public/pages/masterPage.js

import { fetch } from 'wix-fetch';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

/**
 * GFlow Frontend Master Controller
 * Implements Field Label Functioning (FLF) principles
 */
class GFlowController {
  constructor() {
    this.apiBaseUrl = 'https://goodfaithexteriors.wixsite.com/_functions';
    this.currentSession = null;
    this.activeAnalysis = null;
    this.flf = new FLFUtils();
    
    this.init();
  }

  /**
   * Initialize the GFlow system
   */
  async init() {
    console.log('Initializing GFlow System...');
    
    // Setup FLF event listeners for all form elements
    this.setupFLFEventListeners();
    
    // Initialize page-specific functionality
    this.initializePageSpecific();
    
    // Setup real-time monitoring
    this.setupRealtimeMonitoring();
    
    console.log('GFlow System initialized successfully');
  }

  /**
   * Setup FLF event listeners - HTML IDs must match collection field names
   */
  setupFLFEventListeners() {
    // CRM Lead form elements (matching CRMLeads collection fields)
    const leadFormElements = [
      'fullName', 'email', 'phone', 'projectType', 
      'contactPreference', 'customerAddress', 'notes'
    ];

    leadFormElements.forEach(fieldId => {
      const element = $w(`#${fieldId}`);
      if (element) {
        element.onChange(() => this.handleFLFFieldChange(fieldId, element.value));
        // Real-time validation
        element.onInput(() => this.validateFLFField(fieldId, element.value));
      }
    });

    // Quote Item form elements (matching QuoteItems collection fields)
    const quoteItemElements = [
      'locationName', 'windowType', 'brand', 'material',
      'width', 'height', 'quantity', 'unitPrice'
    ];

    quoteItemElements.forEach(fieldId => {
      const element = $w(`#${fieldId}`);
      if (element) {
        element.onChange(() => this.handleQuoteItemFieldChange(fieldId, element.value));
        // Auto-calculate dependent fields
        if (['width', 'height', 'quantity', 'unitPrice'].includes(fieldId)) {
          element.onChange(() => this.calculateQuoteItemTotals());
        }
      }
    });

    // AI Window Analysis form elements
    const aiAnalysisElements = [
      'sessionName', 'userEmail', 'userPhone', 'projectType', 
      'sessionNotes', 'windowImage'
    ];

    aiAnalysisElements.forEach(fieldId => {
      const element = $w(`#${fieldId}`);
      if (element) {
        if (fieldId === 'windowImage') {
          element.onChange(() => this.handleImageUpload(element.value));
        } else {
          element.onChange(() => this.handleFLFFieldChange(fieldId, element.value));
        }
      }
    });
  }

  /**
   * Handle FLF field changes with automatic validation
   */
  handleFLFFieldChange(fieldId, value) {
    console.log(`FLF Field Change: ${fieldId} = ${value}`);
    
    // Store in session data
    if (!this.currentSession) {
      this.currentSession = {};
    }
    this.currentSession[fieldId] = value;

    // Trigger real-time validation
    this.validateFLFField(fieldId, value);

    // Update related UI elements
    this.updateRelatedElements(fieldId, value);
  }

  /**
   * Validate FLF field according to collection schema
   */
  validateFLFField(fieldId, value) {
    const validationRules = {
      fullName: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      phone: { required: true, pattern: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/ },
      projectType: { required: true },
      width: { required: true, min: 0, max: 1000, type: 'number' },
      height: { required: true, min: 0, max: 1000, type: 'number' },
      quantity: { required: true, min: 1, type: 'number' },
      unitPrice: { required: true, min: 0, type: 'number' }
    };

    const rule = validationRules[fieldId];
    if (!rule) return true;

    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      isValid = false;
      errorMessage = `${fieldId} is required`;
    }

    // Type validation
    if (isValid && rule.type === 'number' && isNaN(Number(value))) {
      isValid = false;
      errorMessage = `${fieldId} must be a number`;
    }

    // Pattern validation
    if (isValid && rule.pattern && !rule.pattern.test(value)) {
      isValid = false;
      errorMessage = `${fieldId} format is invalid`;
    }

    // Length validation
    if (isValid && rule.minLength && value.length < rule.minLength) {
      isValid = false;
      errorMessage = `${fieldId} must be at least ${rule.minLength} characters`;
    }

    if (isValid && rule.maxLength && value.length > rule.maxLength) {
      isValid = false;
      errorMessage = `${fieldId} must not exceed ${rule.maxLength} characters`;
    }

    // Range validation
    if (isValid && rule.min !== undefined && Number(value) < rule.min) {
      isValid = false;
      errorMessage = `${fieldId} must be at least ${rule.min}`;
    }

    if (isValid && rule.max !== undefined && Number(value) > rule.max) {
      isValid = false;
      errorMessage = `${fieldId} must not exceed ${rule.max}`;
    }

    // Update UI with validation result
    this.updateFieldValidation(fieldId, isValid, errorMessage);
    
    return isValid;
  }

  /**
   * Update field validation UI
   */
  updateFieldValidation(fieldId, isValid, errorMessage) {
    const field = $w(`#${fieldId}`);
    const errorElement = $w(`#${fieldId}Error`);

    if (field) {
      if (isValid) {
        field.style.borderColor = '#4CAF50';
        if (errorElement) errorElement.hide();
      } else {
        field.style.borderColor = '#f44336';
        if (errorElement) {
          errorElement.text = errorMessage;
          errorElement.show();
        }
      }
    }
  }

  /**
   * Handle quote item field changes with auto-calculation
   */
  handleQuoteItemFieldChange(fieldId, value) {
    this.handleFLFFieldChange(fieldId, value);
    
    // Auto-calculate related fields
    if (['width', 'height'].includes(fieldId)) {
      this.calculateUniversalInches();
    }
    
    if (['quantity', 'unitPrice'].includes(fieldId)) {
      this.calculateTotalPrice();
    }
  }

  /**
   * Calculate Universal Inches (FLF field: universalInches)
   */
  calculateUniversalInches() {
    const width = Number($w('#width').value) || 0;
    const height = Number($w('#height').value) || 0;
    const universalInches = (width + height) / 2;
    
    $w('#universalInches').value = universalInches.toFixed(2);
    this.currentSession.universalInches = universalInches;
  }

  /**
   * Calculate total price (FLF field: totalPrice)
   */
  calculateTotalPrice() {
    const quantity = Number($w('#quantity').value) || 0;
    const unitPrice = Number($w('#unitPrice').value) || 0;
    const totalPrice = quantity * unitPrice;
    
    $w('#totalPrice').value = totalPrice.toFixed(2);
    this.currentSession.totalPrice = totalPrice;
  }

  /**
   * Calculate all quote item totals
   */
  calculateQuoteItemTotals() {
    this.calculateUniversalInches();
    this.calculateTotalPrice();
  }

  /**
   * Handle image upload for AI analysis
   */
  async handleImageUpload(fileInfo) {
    console.log('Image uploaded for AI analysis:', fileInfo);
    
    if (!fileInfo || fileInfo.length === 0) return;
    
    const file = fileInfo[0];
    
    // Validate file
    if (!this.validateImageFile(file)) return;
    
    // Update UI
    $w('#uploadStatus').text = 'Processing image...';
    $w('#analyzeButton').disable();
    
    // Store image info
    this.currentSession.windowImage = file.fileUrl;
    
    // Auto-trigger analysis if all required fields are filled
    if (this.areRequiredFieldsFilled(['sessionName', 'userEmail', 'userPhone', 'projectType'])) {
      await this.triggerAIAnalysis();
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      $w('#uploadStatus').text = 'Error: Please upload a valid image file (JPG, PNG, WebP, GIF)';
      return false;
    }

    if (file.size > maxSize) {
      $w('#uploadStatus').text = 'Error: Image file must be less than 10MB';
      return false;
    }

    return true;
  }

  /**
   * Check if required fields are filled
   */
  areRequiredFieldsFilled(requiredFields) {
    return requiredFields.every(fieldId => {
      const element = $w(`#${fieldId}`);
      return element && element.value && element.value.trim() !== '';
    });
  }

  /**
   * Trigger AI analysis
   */
  async triggerAIAnalysis() {
    try {
      $w('#analysisProgress').show();
      $w('#analysisStatus').text = 'Initiating AI analysis...';

      // First, create analysis record
      const analysisData = {
        sessionName: $w('#sessionName').value,
        userEmail: $w('#userEmail').value,
        userPhone: $w('#userPhone').value,
        projectType: $w('#projectType').value,
        sessionNotes: $w('#sessionNotes').value || '',
        windowImage: this.currentSession.windowImage
      };

      const createResponse = await fetch(`${this.apiBaseUrl}/aiWindowAnalysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });

      const createResult = await createResponse.json();
      
      if (!createResult.analysisId) {
        throw new Error('Failed to create analysis record');
      }

      this.activeAnalysis = createResult.analysisId;
      $w('#analysisStatus').text = 'Processing with AI services...';

      // Trigger actual AI analysis
      const analysisResponse = await fetch(`${this.apiBaseUrl}/analyzeWindowImage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: this.currentSession.windowImage,
          sessionId: this.activeAnalysis,
          analysisType: 'measurement'
        })
      });

      const analysisResult = await analysisResponse.json();

      if (analysisResult.success) {
        this.displayAnalysisResults(analysisResult);
      } else {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('AI analysis error:', error);
      $w('#analysisStatus').text = `Error: ${error.message}`;
    } finally {
      $w('#analyzeButton').enable();
    }
  }

  /**
   * Display AI analysis results
   */
  displayAnalysisResults(results) {
    $w('#analysisProgress').hide();
    $w('#resultsSection').show();

    // Update measurement fields (FLF compliance)
    if (results.measurements.width) {
      $w('#width').value = results.measurements.width;
      $w('#measuredWidth').text = `${results.measurements.width}"`;
    }

    if (results.measurements.height) {
      $w('#height').value = results.measurements.height;
      $w('#measuredHeight').text = `${results.measurements.height}"`;
    }

    if (results.measurements.universalInches) {
      $w('#universalInches').value = results.measurements.universalInches;
    }

    // Display confidence and recommendations
    $w('#confidence').text = `${results.confidence}%`;
    $w('#detectedType').text = results.results.detectedType || 'Unknown';

    // Update recommendations list
    if (results.recommendations && results.recommendations.length > 0) {
      $w('#recommendationsList').items = results.recommendations.map(rec => ({
        _id: rec.id || Math.random().toString(),
        title: rec.title || rec,
        description: rec.description || ''
      }));
    }

    // Show confidence warning if low
    if (results.confidence < 85) {
      $w('#confidenceWarning').show();
      $w('#confidenceWarning').text = 'Low confidence detected. Professional measurement recommended.';
    }

    $w('#analysisStatus').text = 'Analysis complete!';
  }

  /**
   * Initialize page-specific functionality
   */
  initializePageSpecific() {
    const currentPage = wixLocation.path[0] || 'home';
    
    switch (currentPage) {
      case 'window-estimator':
        this.initializeWindowEstimator();
        break;
      case 'ai-window-measure':
        this.initializeAIWindowMeasure();
        break;
      case 'quote-comparison':
        this.initializeQuoteComparison();
        break;
      default:
        this.initializeHomePage();
    }
  }

  /**
   * Initialize Window Estimator page
   */
  initializeWindowEstimator() {
    console.log('Initializing Window Estimator...');
    
    // Load window brands and types
    this.loadWindowBrands();
    this.loadWindowTypes();
    
    // Setup quote calculation
    $w('#calculateQuote').onClick(() => this.calculateQuote());
  }

  /**
   * Initialize AI Window Measure page
   */
  initializeAIWindowMeasure() {
    console.log('Initializing AI Window Measure...');
    
    // Setup analysis trigger
    $w('#analyzeButton').onClick(() => this.triggerAIAnalysis());
    
    // Setup real-time form monitoring
    this.setupRealtimeFormMonitoring();
  }

  /**
   * Load window brands from backend
   */
  async loadWindowBrands() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/windowBrands`);
      const data = await response.json();
      
      if (data.windowBrands) {
        const brandOptions = data.windowBrands.map(brand => ({
          label: brand.windowBrand,
          value: brand.windowBrand
        }));
        
        $w('#brand').options = brandOptions;
      }
    } catch (error) {
      console.error('Failed to load window brands:', error);
    }
  }

  /**
   * Load window types from backend
   */
  async loadWindowTypes() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/windowTypes`);
      const data = await response.json();
      
      if (data.windowTypes) {
        const typeOptions = data.windowTypes.map(type => ({
          label: type.windowType,
          value: type.windowType
        }));
        
        $w('#windowType').options = typeOptions;
      }
    } catch (error) {
      console.error('Failed to load window types:', error);
    }
  }

  /**
   * Setup real-time monitoring for system health
   */
  setupRealtimeMonitoring() {
    // Monitor API connectivity
    setInterval(() => this.checkAPIHealth(), 30000); // Every 30 seconds
    
    // Monitor form completion
    setInterval(() => this.updateFormProgress(), 5000); // Every 5 seconds
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/siteStats`);
      if (response.status === 200) {
        $w('#connectionStatus').text = 'Connected';
        $w('#connectionStatus').style.color = '#4CAF50';
      } else {
        throw new Error('API unavailable');
      }
    } catch (error) {
      $w('#connectionStatus').text = 'Disconnected';
      $w('#connectionStatus').style.color = '#f44336';
    }
  }

  /**
   * Update related UI elements when field changes
   */
  updateRelatedElements(fieldId, value) {
    // Example: Update project type specific fields
    if (fieldId === 'projectType') {
      this.updateProjectTypeFields(value);
    }
    
    // Example: Update brand specific options
    if (fieldId === 'brand') {
      this.updateBrandSpecificOptions(value);
    }
  }

  /**
   * Submit CRM Lead (FLF compliant)
   */
  async submitCRMLead() {
    try {
      // Validate all required fields
      const requiredFields = ['fullName', 'email', 'phone', 'projectType'];
      if (!this.areRequiredFieldsFilled(requiredFields)) {
        $w('#submitError').text = 'Please fill in all required fields';
        $w('#submitError').show();
        return;
      }

      $w('#submitButton').disable();
      $w('#submitStatus').text = 'Submitting...';

      const leadData = {
        fullName: $w('#fullName').value,
        email: $w('#email').value,
        phone: $w('#phone').value,
        projectType: $w('#projectType').value,
        contactPreference: $w('#contactPreference').value,
        customerAddress: $w('#customerAddress').value,
        notes: $w('#notes').value,
        source: 'website'
      };

      const response = await fetch(`${this.apiBaseUrl}/createCRMLead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      const result = await response.json();

      if (result.lead) {
        $w('#submitStatus').text = 'Lead submitted successfully!';
        $w('#leadScore').text = `Lead Score: ${result.leadScore}`;
        
        // Redirect to thank you page
        setTimeout(() => {
          wixLocation.to('/thank-you');
        }, 2000);
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      console.error('Lead submission error:', error);
      $w('#submitError').text = error.message;
      $w('#submitError').show();
    } finally {
      $w('#submitButton').enable();
    }
  }
}

/**
 * FLF Utilities Class
 */
class FLFUtils {
  /**
   * Generate API endpoint following FLF patterns
   */
  generateAPIEndpoint(collectionName, action, fieldName = null) {
    const baseEndpoint = `/api/${collectionName.toLowerCase()}`;
    if (fieldName) {
      return `${baseEndpoint}/${action}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
    }
    return `${baseEndpoint}/${action}`;
  }

  /**
   * Validate HTML ID matches collection field
   */
  validateHTMLId(htmlId, collectionField) {
    return htmlId === collectionField;
  }

  /**
   * Generate JavaScript function name following FLF patterns
   */
  generateFunctionName(action, fieldName) {
    return `${action}${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
  }
}

// Initialize GFlow system when page loads
$w.onReady(() => {
  window.gflow = new GFlowController();
});

export default GFlowController;