import { Layout } from "@/components/Layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  FileText, 
  Users, 
  Package, 
  Quote, 
  Receipt, 
  ArrowRight, 
  Plus, 
  Edit, 
  Mail, 
  Download,
  Search,
  Eye,
  Trash2,
  RotateCcw,
  Settings,
  CreditCard,
  Upload,
  FileDown,
  Copy
} from "lucide-react";

export const Help = () => {
  const sections = [
    {
      id: "customers",
      title: "Managing Customers",
      icon: <Users className="h-6 w-6" />,
      description: "Add, edit, and organize your customer information",
      steps: [
        {
          title: "Adding a New Customer",
          description: "Navigate to the Customers section and click 'Add Customer'",
          details: [
            "Click the 'Customers' link in the sidebar navigation",
            "Click the 'Add Customer' button in the top right",
            "Fill in customer details: Name, Email, Phone, Address",
            "All fields are required for complete customer records",
            "Click 'Add Customer' to save the information"
          ],
          tip: "💡 Complete customer information helps generate professional invoices and quotes",
          visual: (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h6 className="font-medium mb-2">Customer Management:</h6>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Navigate to Customers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4 text-green-500" />
                  <span>Add Customer Details</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Edit className="h-4 w-4 text-purple-500" />
                  <span>Edit Existing Customers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-orange-500" />
                  <span>Bulk Import via CSV</span>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Editing Customer Information",
          description: "Update existing customer details when needed",
          details: [
            "Find the customer in the list",
            "Click the three-dot menu (⋮) next to the customer name",
            "Select 'Edit' from the dropdown menu",
            "Update the necessary information",
            "Click 'Save Changes' to confirm updates"
          ],
          tip: "💡 Keep customer information up-to-date for accurate billing"
        },
        {
          title: "Bulk Customer Import",
          description: "Import multiple customers using CSV files",
          details: [
            "Click 'Upload CSV' button on the customers page",
            "Download the CSV template first (contains sample data)",
            "Fill in your customer data following the template format",
            "Upload the completed CSV file",
            "Review the import results and fix any errors"
          ],
          tip: "💡 Use the CSV template to ensure proper formatting"
        }
      ]
    },
    {
      id: "products",
      title: "Managing Products",
      icon: <Package className="h-6 w-6" />,
      description: "Create and organize your product catalog",
      steps: [
        {
          title: "Adding Products",
          description: "Build your product catalog for easy invoice creation",
          details: [
            "Navigate to the Products section in the sidebar",
            "Click 'Add Product' button",
            "Enter product name and detailed description",
            "Set the unit price in GBP (£)",
            "Configure tax rate as a percentage (e.g., 20 for 20% VAT)",
            "Click 'Add Product' to save"
          ],
          tip: "💡 Accurate product information speeds up invoice and quote creation"
        },
        {
          title: "Product Pricing",
          description: "Set competitive and accurate pricing",
          details: [
            "Price should be per unit (e.g., £50.00 per hour)",
            "Tax rate is applied automatically during invoicing",
            "Update prices regularly to reflect market changes",
            "Use the edit function to modify existing products"
          ],
          tip: "💡 Include tax-inclusive or tax-exclusive pricing based on your business model"
        }
      ]
    },
    {
      id: "quotes",
      title: "Creating Quotes",
      icon: <Quote className="h-6 w-6" />,
      description: "Generate professional quotes for potential clients",
      steps: [
        {
          title: "Creating a New Quote",
          description: "Professional quotes help win new business",
          details: [
            "Click 'Quotes' in the sidebar navigation",
            "Click 'Create Quote' button",
            "Select customer from the searchable dropdown",
            "Add quote number (auto-generated or custom)",
            "Set quote date and expiry date",
            "Add products using the searchable product selector",
            "Adjust quantities as needed",
            "Review totals and tax calculations",
            "Click 'Create Quote' to save"
          ],
          tip: "💡 Set realistic expiry dates to encourage quick decisions"
        },
        {
          title: "Quote Actions",
          description: "Manage quotes after creation",
          details: [
            "View quote details by clicking on the quote number",
            "Download PDF version using the 'Download PDF' option",
            "Send via email with automatic PDF attachment",
            "Edit quote details if changes are needed",
            "Convert to invoice once accepted by customer"
          ],
          tip: "💡 Follow up on quotes before they expire to maximize conversions"
        }
      ]
    },
    {
      id: "invoices",
      title: "Creating Invoices",
      icon: <Receipt className="h-6 w-6" />,
      description: "Generate professional invoices for completed work",
      steps: [
        {
          title: "Creating a New Invoice",
          description: "Professional invoices ensure timely payments",
          details: [
            "Navigate to 'Invoices' in the sidebar",
            "Click 'Create Invoice' button",
            "Select customer from the dropdown",
            "Enter invoice number (auto-generated or custom)",
            "Set invoice date and due date",
            "Add products/services using the product selector",
            "Specify quantities for each item",
            "Review calculated totals and tax amounts",
            "Set initial status (Unpaid, Paid, or Overdue)",
            "Click 'Create Invoice' to save"
          ],
          tip: "💡 Set clear payment terms and due dates to improve cash flow",
          visual: (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h6 className="font-medium mb-2">Invoice Creation Flow:</h6>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Select Customer</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Add Products</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Review & Save</span>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Invoice Management",
          description: "Track and manage invoice status",
          details: [
            "Update invoice status as payments are received",
            "Download professional PDF versions",
            "Send invoices via email with PDF attachments",
            "Edit invoice details if corrections are needed",
            "Monitor overdue invoices in the dashboard"
          ],
          tip: "💡 Regular status updates help track your cash flow"
        }
      ]
    },
    {
      id: "convert",
      title: "Converting Quotes to Invoices",
      icon: <ArrowRight className="h-6 w-6" />,
      description: "Transform accepted quotes into invoices seamlessly",
      steps: [
        {
          title: "Quote to Invoice Conversion",
          description: "Streamline your workflow from quote to payment",
          details: [
            "Navigate to the Quotes section",
            "Find the accepted quote you want to convert",
            "Click the three-dot menu (⋮) next to the quote",
            "Select 'Convert to Invoice' from the dropdown",
            "Review the pre-filled invoice details",
            "Adjust the due date and payment terms if needed",
            "Update the invoice number if required",
            "Click 'Create Invoice' to complete the conversion"
          ],
          tip: "💡 Converting quotes maintains consistency and saves time",
          visual: (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h6 className="font-medium mb-2">Quote to Invoice Conversion:</h6>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <Quote className="h-4 w-4 text-blue-500" />
                  <span>Quote Created</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-green-500" />
                  <span>Quote Accepted</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex items-center space-x-1">
                  <Copy className="h-4 w-4 text-purple-500" />
                  <span>Convert to Invoice</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="flex items-center space-x-1">
                  <Receipt className="h-4 w-4 text-orange-500" />
                  <span>Invoice Ready</span>
                </div>
              </div>
            </div>
          )
        },
        {
          title: "Post-Conversion Steps",
          description: "Complete the billing process",
          details: [
            "The original quote remains unchanged for reference",
            "New invoice appears in the Invoices section",
            "Send the invoice to the customer via email",
            "Update quote status to 'Accepted' for tracking",
            "Monitor invoice payment status"
          ],
          tip: "💡 Keep both quote and invoice for complete project documentation"
        }
      ]
    },
    {
      id: "pdf",
      title: "PDF Generation & Email",
      icon: <FileText className="h-6 w-6" />,
      description: "Create professional PDFs and send via email",
      steps: [
        {
          title: "Generating PDFs",
          description: "Create professional documents for your business",
          details: [
            "Open any invoice, quote, or statement",
            "Click the three-dot menu (⋮) next to the document",
            "Select 'Download PDF' from the dropdown",
            "PDF will be automatically generated and downloaded",
            "Documents include your company branding and logo",
            "All amounts are displayed in GBP (£) currency"
          ],
          tip: "💡 PDFs maintain professional formatting for client communications"
        },
        {
          title: "Email Integration",
          description: "Send documents directly to customers",
          details: [
            "Click 'Send via Email' from the document menu",
            "PDF is automatically generated and downloaded",
            "Your default email client opens with pre-filled content",
            "Email includes professional subject line and message",
            "Manually attach the downloaded PDF to the email",
            "Send the email to complete the process"
          ],
          tip: "💡 Customize email templates in Settings > Email Settings"
        }
      ]
    },
    {
      id: "dashboard",
      title: "Using the Dashboard",
      icon: <Eye className="h-6 w-6" />,
      description: "Monitor your business performance at a glance",
      steps: [
        {
          title: "Dashboard Overview",
          description: "Your business summary in one place",
          details: [
            "Welcome section shows personalized greeting",
            "Local weather widget displays current conditions",
            "Total Invoices card shows invoice count and amount",
            "Active Quotes card displays pending quotes",
            "Customers card shows total customer count",
            "This Month card shows current month's revenue"
          ],
          tip: "💡 Dashboard provides quick insights into your business health"
        },
        {
          title: "Recent Activity",
          description: "Track latest business activities",
          details: [
            "Recent invoices section shows latest billing activity",
            "Quick access to recent quotes and customers",
            "Activity timestamps show when actions occurred",
            "Click on items for quick access to details"
          ],
          tip: "💡 Use recent activity to follow up on pending items"
        }
      ]
    },
    {
      id: "settings",
      title: "Settings & Configuration",
      icon: <Settings className="h-6 w-6" />,
      description: "Configure your business information and preferences",
      steps: [
        {
          title: "Company Settings",
          description: "Set up your business information",
          details: [
            "Navigate to Settings from the sidebar",
            "Update company name and contact details",
            "Upload your company logo for professional branding",
            "Configure address and phone information",
            "Set default currency (GBP) and tax rates",
            "Save changes to apply across all documents"
          ],
          tip: "💡 Complete company information improves document professionalism"
        },
        {
          title: "Email Templates",
          description: "Customize email communications",
          details: [
            "Go to Account > Email Settings",
            "Customize invoice email subject and body",
            "Set up quote email templates",
            "Configure statement email content",
            "Use variables like {customerName} for personalization",
            "Test templates before sending to customers"
          ],
          tip: "💡 Professional email templates improve customer communication"
        }
      ]
    },
    {
      id: "subscription",
      title: "Subscription Management",
      icon: <CreditCard className="h-6 w-6" />,
      description: "Manage your Eazee Invoice Pro subscription",
      steps: [
        {
          title: "Subscription Features",
          description: "Understanding your Pro benefits",
          details: [
            "Unlimited invoices, quotes, and customers",
            "PDF generation and email integration",
            "CSV import/export functionality",
            "Professional templates and branding",
            "Priority customer support",
            "Monthly billing at £19.99/month"
          ],
          tip: "💡 Pro subscription unlocks all business features"
        },
        {
          title: "Managing Subscription",
          description: "Control your subscription settings",
          details: [
            "Access subscription management from the sidebar",
            "View current subscription status and billing date",
            "Update payment methods through Stripe",
            "Cancel subscription if needed (immediate effect)",
            "Reactivate cancelled subscriptions anytime",
            "Monitor subscription status in account settings"
          ],
          tip: "💡 Manage subscriptions to match your business needs"
        }
      ]
    }
  ];

  return (
    <Layout title="Help & User Guide">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Help & User Guide</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Complete guide to using Eazee Invoice. Learn how to manage customers, create invoices, 
            generate quotes, and grow your freelance business.
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
            <CardDescription>Jump to any section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {section.icon}
                  <span className="ml-2">{section.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Sections */}
        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {section.icon}
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Badge variant="outline" className="mt-1">
                        {stepIndex + 1}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-12">
                      <h5 className="font-medium mb-2">Step-by-step instructions:</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-slate-700 dark:text-slate-300">
                            {detail}
                          </li>
                        ))}
                      </ol>
                      
                      {step.tip && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {step.tip}
                          </p>
                        </div>
                      )}
                      
                      {(step as any).visual && (
                        <div className="mt-3">
                          {(step as any).visual}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Common Issues */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Common Questions & Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold">Q: How do I recover deleted items?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Items are moved to the Recycle Bin where they stay for 7 days. 
                  Navigate to the Recycle Bin from the sidebar to restore deleted customers, 
                  products, invoices, or quotes.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold">Q: Why can't I generate PDFs?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  PDF generation requires a modern browser. Make sure you're using 
                  Chrome, Firefox, Safari, or Edge. If issues persist, try refreshing 
                  the page or checking your browser's pop-up blocker settings.
                </p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold">Q: How do I update my subscription?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Go to the Subscription Management page from the sidebar. 
                  You can view your current plan, billing date, and manage 
                  payment methods. Cancellation takes effect immediately.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold">Q: Can I import data from other systems?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes! Use the CSV import feature for customers and products. 
                  Download the template first to ensure proper formatting, 
                  then upload your data file for bulk import.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Demo Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Quick Demo: Key Features
            </CardTitle>
            <CardDescription>
              Try these features to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium">Try Adding a Customer</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Start by adding your first customer to see how easy it is to manage client information.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/customers">Add Customer</Link>
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-medium">Create a Product</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Add products or services to your catalog for quick invoice creation.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/products">Add Product</Link>
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                    <Quote className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-medium">Generate Your First Quote</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Create a professional quote to send to potential clients.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/quotes/new">Create Quote</Link>
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                    <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h4 className="font-medium">Create an Invoice</h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Generate professional invoices for completed work.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/invoices/new">Create Invoice</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Highlights</CardTitle>
            <CardDescription>
              Discover the powerful features that make Eazee Invoice perfect for freelancers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium mb-2">Professional PDFs</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generate branded PDF invoices and quotes with your company logo
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium mb-2">Email Integration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Send documents directly to clients with customizable email templates
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-medium mb-2">Business Analytics</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track revenue, monitor payments, and analyze your business performance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              If you can't find the answer you're looking for, don't hesitate to reach out for support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Download User Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};