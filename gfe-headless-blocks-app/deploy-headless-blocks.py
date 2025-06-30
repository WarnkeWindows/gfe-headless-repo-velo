#!/usr/bin/env python3
"""
Good Faith Exteriors - Wix Headless Blocks App Deployment Script
Deploys all widgets with dark navy blue theme and gold accents to goodfaithexteriors.com
"""

import json
import requests
import os
import time
from datetime import datetime

class WixHeadlessBlocksDeployer:
    def __init__(self):
        self.config = self.load_config()
        self.base_url = "https://www.wixapis.com"
        self.headers = {
            "Authorization": f"Bearer {self.config['wix']['headless']['api_token']}",
            "Content-Type": "application/json",
            "wix-account-id": self.config['wix']['headless']['account_id']
        }
        self.deployment_results = {
            "timestamp": datetime.now().isoformat(),
            "status": "in_progress",
            "widgets": {},
            "errors": [],
            "success_count": 0,
            "total_count": 0
        }

    def load_config(self):
        """Load configuration from app-config.json"""
        config_path = os.path.join(os.path.dirname(__file__), 'config', 'app-config.json')
        with open(config_path, 'r') as f:
            return json.load(f)

    def log(self, message, level="INFO"):
        """Log deployment messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def create_widget_block(self, widget_id, widget_config):
        """Create a widget block in Wix Headless Blocks App"""
        self.log(f"Creating widget block: {widget_id}")
        
        # Read widget HTML file
        widget_path = os.path.join(os.path.dirname(__file__), 'widgets', f'{widget_id}.html')
        if not os.path.exists(widget_path):
            self.log(f"Widget file not found: {widget_path}", "ERROR")
            return False

        with open(widget_path, 'r', encoding='utf-8') as f:
            widget_html = f.read()

        # Prepare widget block data
        block_data = {
            "name": widget_config["name"],
            "description": widget_config["description"],
            "category": widget_config["category"],
            "icon": widget_config["icon"],
            "html": widget_html,
            "css": self.extract_css_from_html(widget_html),
            "javascript": self.extract_js_from_html(widget_html),
            "configuration": {
                "theme": self.config["theme"],
                "images": self.config["image_assets"],
                "domain": self.config["app"]["domain"]
            },
            "metadata": {
                "version": self.config["app"]["version"],
                "author": "Good Faith Exteriors",
                "tags": ["windows", "doors", "estimator", "ai", "calculator"],
                "responsive": True,
                "mobile_optimized": True
            }
        }

        try:
            # Create block via Wix Blocks API
            response = requests.post(
                f"{self.base_url}/blocks/v1/blocks",
                headers=self.headers,
                json=block_data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                self.log(f"✅ Widget block created successfully: {widget_id}")
                self.deployment_results["widgets"][widget_id] = {
                    "status": "success",
                    "block_id": result.get("id"),
                    "name": widget_config["name"],
                    "url": result.get("url", ""),
                    "created_at": datetime.now().isoformat()
                }
                self.deployment_results["success_count"] += 1
                return True
            else:
                error_msg = f"Failed to create widget block: {response.status_code} - {response.text}"
                self.log(error_msg, "ERROR")
                self.deployment_results["widgets"][widget_id] = {
                    "status": "error",
                    "error": error_msg
                }
                self.deployment_results["errors"].append(error_msg)
                return False

        except Exception as e:
            error_msg = f"Exception creating widget block {widget_id}: {str(e)}"
            self.log(error_msg, "ERROR")
            self.deployment_results["widgets"][widget_id] = {
                "status": "error",
                "error": error_msg
            }
            self.deployment_results["errors"].append(error_msg)
            return False

    def extract_css_from_html(self, html_content):
        """Extract CSS from HTML content"""
        import re
        css_pattern = r'<style[^>]*>(.*?)</style>'
        matches = re.findall(css_pattern, html_content, re.DOTALL)
        return '\n'.join(matches)

    def extract_js_from_html(self, html_content):
        """Extract JavaScript from HTML content"""
        import re
        js_pattern = r'<script[^>]*>(.*?)</script>'
        matches = re.findall(js_pattern, html_content, re.DOTALL)
        return '\n'.join(matches)

    def deploy_landing_page(self):
        """Deploy the main landing page"""
        self.log("Deploying landing page...")
        
        landing_page_path = os.path.join(os.path.dirname(__file__), 'landing-page', 'index.html')
        if not os.path.exists(landing_page_path):
            self.log("Landing page file not found", "ERROR")
            return False

        with open(landing_page_path, 'r', encoding='utf-8') as f:
            landing_html = f.read()

        # Deploy landing page as main site page
        page_data = {
            "title": "Good Faith Exteriors - Premium Windows & Doors",
            "description": "Get instant window quotes with AI-powered estimation tools",
            "html": landing_html,
            "slug": "home",
            "meta": {
                "keywords": "windows, doors, installation, quotes, AI estimation",
                "author": "Good Faith Exteriors",
                "viewport": "width=device-width, initial-scale=1.0"
            },
            "seo": {
                "title": "Good Faith Exteriors - Premium Windows & Doors Installation",
                "description": "Get online quotes in minutes with real products and real pricing. AI-powered window estimation tools.",
                "canonical": f"https://{self.config['app']['domain']}"
            }
        }

        try:
            # Deploy page via Wix Sites API
            response = requests.post(
                f"{self.base_url}/sites/v1/sites/{self.config['wix']['headless']['meta_site_id']}/pages",
                headers=self.headers,
                json=page_data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                self.log("✅ Landing page deployed successfully")
                self.deployment_results["landing_page"] = {
                    "status": "success",
                    "page_id": result.get("id"),
                    "url": f"https://{self.config['app']['domain']}",
                    "deployed_at": datetime.now().isoformat()
                }
                return True
            else:
                error_msg = f"Failed to deploy landing page: {response.status_code} - {response.text}"
                self.log(error_msg, "ERROR")
                self.deployment_results["landing_page"] = {
                    "status": "error",
                    "error": error_msg
                }
                return False

        except Exception as e:
            error_msg = f"Exception deploying landing page: {str(e)}"
            self.log(error_msg, "ERROR")
            self.deployment_results["landing_page"] = {
                "status": "error",
                "error": error_msg
            }
            return False

    def configure_domain(self):
        """Configure custom domain for the site"""
        self.log(f"Configuring domain: {self.config['app']['domain']}")
        
        domain_config = {
            "domain": self.config['app']['domain'],
            "subdomain": "www",
            "ssl_enabled": True,
            "redirect_www": True,
            "force_https": True
        }

        try:
            response = requests.post(
                f"{self.base_url}/sites/v1/sites/{self.config['wix']['headless']['meta_site_id']}/domains",
                headers=self.headers,
                json=domain_config,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                self.log("✅ Domain configured successfully")
                return True
            else:
                self.log(f"Domain configuration response: {response.status_code} - {response.text}", "WARNING")
                return True  # Continue deployment even if domain config fails
                
        except Exception as e:
            self.log(f"Exception configuring domain: {str(e)}", "WARNING")
            return True  # Continue deployment

    def setup_collections(self):
        """Set up Wix data collections for the app"""
        self.log("Setting up data collections...")
        
        collections = [
            {
                "name": "GFE_Leads",
                "displayName": "Leads",
                "fields": [
                    {"key": "name", "type": "text", "displayName": "Name"},
                    {"key": "email", "type": "text", "displayName": "Email"},
                    {"key": "phone", "type": "text", "displayName": "Phone"},
                    {"key": "source", "type": "text", "displayName": "Source"},
                    {"key": "status", "type": "text", "displayName": "Status"},
                    {"key": "notes", "type": "richText", "displayName": "Notes"}
                ]
            },
            {
                "name": "GFE_Quotes",
                "displayName": "Quotes",
                "fields": [
                    {"key": "quoteId", "type": "text", "displayName": "Quote ID"},
                    {"key": "customerEmail", "type": "text", "displayName": "Customer Email"},
                    {"key": "windowType", "type": "text", "displayName": "Window Type"},
                    {"key": "brand", "type": "text", "displayName": "Brand"},
                    {"key": "material", "type": "text", "displayName": "Material"},
                    {"key": "quantity", "type": "number", "displayName": "Quantity"},
                    {"key": "total", "type": "number", "displayName": "Total Price"},
                    {"key": "status", "type": "text", "displayName": "Status"}
                ]
            },
            {
                "name": "GFE_Products",
                "displayName": "Products",
                "fields": [
                    {"key": "name", "type": "text", "displayName": "Product Name"},
                    {"key": "brand", "type": "text", "displayName": "Brand"},
                    {"key": "type", "type": "text", "displayName": "Type"},
                    {"key": "style", "type": "text", "displayName": "Style"},
                    {"key": "material", "type": "text", "displayName": "Material"},
                    {"key": "priceRange", "type": "text", "displayName": "Price Range"},
                    {"key": "features", "type": "text", "displayName": "Features"},
                    {"key": "image", "type": "image", "displayName": "Image"}
                ]
            }
        ]

        success_count = 0
        for collection in collections:
            try:
                response = requests.post(
                    f"{self.base_url}/data/v1/collections",
                    headers=self.headers,
                    json=collection,
                    timeout=30
                )
                
                if response.status_code in [200, 201]:
                    self.log(f"✅ Collection created: {collection['name']}")
                    success_count += 1
                else:
                    self.log(f"Collection creation response: {response.status_code} - {response.text}", "WARNING")
                    
            except Exception as e:
                self.log(f"Exception creating collection {collection['name']}: {str(e)}", "WARNING")

        self.log(f"Collections setup completed: {success_count}/{len(collections)} successful")
        return success_count > 0

    def deploy_all_widgets(self):
        """Deploy all widgets to Wix Headless Blocks App"""
        self.log("🚀 Starting Wix Headless Blocks App Deployment")
        self.log("=" * 60)
        
        widgets = self.config["widgets"]
        self.deployment_results["total_count"] = len(widgets)
        
        # Deploy each widget
        for widget in widgets:
            widget_id = widget["id"]
            self.log(f"Deploying widget: {widget_id}")
            
            success = self.create_widget_block(widget_id, widget)
            if success:
                self.log(f"✅ Widget deployed: {widget_id}")
            else:
                self.log(f"❌ Widget failed: {widget_id}")
            
            # Small delay between deployments
            time.sleep(1)

        # Deploy landing page
        self.deploy_landing_page()
        
        # Configure domain
        self.configure_domain()
        
        # Setup collections
        self.setup_collections()
        
        # Finalize deployment
        self.deployment_results["status"] = "completed"
        self.deployment_results["completion_time"] = datetime.now().isoformat()
        
        # Save results
        self.save_deployment_results()
        
        # Print summary
        self.print_deployment_summary()

    def save_deployment_results(self):
        """Save deployment results to JSON file"""
        results_path = os.path.join(os.path.dirname(__file__), 'deployment-results.json')
        with open(results_path, 'w') as f:
            json.dump(self.deployment_results, f, indent=2)
        self.log(f"Deployment results saved to: {results_path}")

    def print_deployment_summary(self):
        """Print deployment summary"""
        self.log("=" * 60)
        self.log("🎉 DEPLOYMENT COMPLETED!")
        self.log("=" * 60)
        
        success_rate = (self.deployment_results["success_count"] / self.deployment_results["total_count"]) * 100
        self.log(f"📊 Success Rate: {success_rate:.1f}% ({self.deployment_results['success_count']}/{self.deployment_results['total_count']} widgets)")
        
        self.log(f"🌐 Site URL: https://{self.config['app']['domain']}")
        self.log(f"✏️  Dashboard: {self.config['wix']['blocks_app']['dashboard_link']}")
        self.log(f"🏢 Account ID: {self.config['wix']['headless']['account_id']}")
        self.log(f"🆔 Meta Site ID: {self.config['wix']['headless']['meta_site_id']}")
        
        if self.deployment_results["errors"]:
            self.log(f"⚠️  Errors encountered: {len(self.deployment_results['errors'])}")
            for error in self.deployment_results["errors"]:
                self.log(f"   - {error}")
        
        self.log("=" * 60)
        self.log("📋 Deployed Widgets:")
        for widget_id, widget_data in self.deployment_results["widgets"].items():
            status_icon = "✅" if widget_data["status"] == "success" else "❌"
            self.log(f"   {status_icon} {widget_id}: {widget_data.get('name', 'Unknown')}")
        
        self.log("=" * 60)

def main():
    """Main deployment function"""
    deployer = WixHeadlessBlocksDeployer()
    deployer.deploy_all_widgets()

if __name__ == "__main__":
    main()

