import * as SibApiV3Sdk from '@sendinblue/client';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.sender = { 
      email: params.fromEmail || 'noreply@eazeeinvoice.com', 
      name: params.fromName || 'Eazee Invoice' 
    };
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    
    if (params.textContent) {
      sendSmtpEmail.textContent = params.textContent;
    }

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response.messageId);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Eazee Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #2563eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧾 Eazee Invoice</h1>
        <p>Password Reset Request</p>
      </div>
      
      <div class="content">
        <h2>Reset Your Password</h2>
        <p>Hello,</p>
        
        <p>We received a request to reset the password for your Eazee Invoice account associated with <strong>${email}</strong>.</p>
        
        <p>If you made this request, click the button below to reset your password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        
        <div class="warning">
          <strong>Important:</strong>
          <ul>
            <li>This link will expire in <strong>1 hour</strong> for security reasons</li>
            <li>If you didn't request this reset, you can safely ignore this email</li>
            <li>Your password won't change until you click the link and create a new one</li>
          </ul>
        </div>
        
        <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>
        
        <div class="footer">
          <p>This email was sent from Eazee Invoice. If you didn't request a password reset, please contact support.</p>
          <p><strong>Note:</strong> Never share this reset link with anyone. Our team will never ask for your password.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Reset Your Password - Eazee Invoice

Hello,

We received a request to reset the password for your Eazee Invoice account associated with ${email}.

If you made this request, click the link below to reset your password:
${resetUrl}

Important:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, you can safely ignore this email
- Your password won't change until you click the link and create a new one

If you're having trouble, copy and paste the URL into your web browser.

This email was sent from Eazee Invoice. If you didn't request a password reset, please contact support.
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your Password - Eazee Invoice',
    htmlContent,
    textContent,
    fromName: 'Eazee Invoice Support'
  });
}

// Send welcome email to new users
export async function sendWelcomeEmail(email: string, firstName: string, companyName: string): Promise<boolean> {
  const loginUrl = process.env.NODE_ENV === 'production' 
    ? 'https://eazeeinvoice.com/login' 
    : 'http://localhost:5000/login';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Eazee Invoice - Professional Invoicing Made Simple</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
        .email-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px; }
        .welcome-message { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-list { margin: 30px 0; }
        .feature-item { display: flex; align-items: flex-start; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .feature-icon { font-size: 24px; margin-right: 15px; color: #3b82f6; }
        .feature-content h3 { margin: 0 0 8px 0; color: #1e293b; font-size: 16px; }
        .feature-content p { margin: 0; color: #64748b; font-size: 14px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; text-align: center; font-size: 16px; }
        .button:hover { background: #2563eb; }
        .trial-info { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .trial-info h3 { color: #065f46; margin: 0 0 10px 0; }
        .pricing-info { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .pricing-info h3 { color: #92400e; margin: 0 0 10px 0; }
        .support-section { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 30px; text-align: center; font-size: 14px; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .footer .social-links { margin: 20px 0; }
        .footer .social-links a { color: #60a5fa; margin: 0 10px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🧾 Welcome to Eazee Invoice!</h1>
          <p>Professional invoicing made simple for ${companyName}</p>
        </div>
        
        <div class="content">
          <div class="welcome-message">
            <h2>Hi ${firstName}! 👋</h2>
            <p>Welcome to Eazee Invoice - the complete business management solution designed specifically for freelancers and small businesses like <strong>${companyName}</strong>.</p>
            <p>You're now ready to streamline your invoicing process and take control of your business finances!</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">🚀 Start Using Eazee Invoice</a>
          </div>

          <div class="trial-info">
            <h3>🎉 Your 7-Day Free Trial is Active!</h3>
            <p>You have full access to all premium features for the next 7 days. No credit card required - start creating professional invoices right away!</p>
          </div>

          <h2>🌟 What You Can Do With Eazee Invoice:</h2>
          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">📄</div>
              <div class="feature-content">
                <h3>Professional Invoicing & Quotes</h3>
                <p>Create, track, and manage unlimited invoices and quotes with professional PDF generation. Convert quotes to invoices instantly.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">👥</div>
              <div class="feature-content">
                <h3>Complete Customer Management</h3>
                <p>Manage unlimited customers and products with CSV import/export, comprehensive profiles, and searchable databases.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-content">
                <h3>Business Analytics & Reports</h3>
                <p>Track revenue, analyze customer insights, and generate detailed business reports including VAT reports and profit analysis.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📧</div>
              <div class="feature-content">
                <h3>Email Integration</h3>
                <p>Email invoices and quotes directly to customers with customizable templates and professional PDF attachments.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🎨</div>
              <div class="feature-content">
                <h3>Company Branding</h3>
                <p>Add your company logo, customize colors, and include your business details on all documents for a professional appearance.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <div class="feature-content">
                <h3>Mobile-Friendly Design</h3>
                <p>Access your business anywhere with our responsive design that works perfectly on desktop, tablet, and mobile devices.</p>
              </div>
            </div>
          </div>

          <div class="pricing-info">
            <h3>💰 Simple, Affordable Pricing</h3>
            <p><strong>Monthly:</strong> £5.99/month - Full access to all features</p>
            <p><strong>Annual:</strong> £64.69/year - Save 10% with annual billing</p>
            <p>No setup fees, no hidden costs. Cancel anytime.</p>
          </div>

          <h2>🚀 Getting Started is Easy:</h2>
          <ol style="font-size: 16px; line-height: 1.8;">
            <li><strong>Set up your company profile</strong> - Add your logo and business details</li>
            <li><strong>Add your first customer</strong> - Import from CSV or add manually</li>
            <li><strong>Create your first invoice</strong> - Use our intuitive invoice builder</li>
            <li><strong>Get paid faster</strong> - Email professional invoices to customers</li>
          </ol>

          <div class="support-section">
            <h3>💬 Need Help? We're Here for You!</h3>
            <p>Our comprehensive help section includes step-by-step guides, video tutorials, and feature demonstrations to get you started quickly.</p>
            <p>Have questions? Our support team is ready to help you succeed with Eazee Invoice.</p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${loginUrl}" class="button">🎯 Access Your Dashboard Now</a>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b;">
            Thanks for choosing Eazee Invoice to power your business!<br>
            <strong>The Eazee Invoice Team</strong>
          </p>
        </div>

        <div class="footer">
          <p><strong>Eazee Invoice</strong> - Professional invoicing made simple</p>
          <div class="social-links">
            <a href="https://www.facebook.com/profile.php?id=61578914895610">Facebook</a>
          </div>
          <p>© 2024 Eazee Invoice. All rights reserved.</p>
          <p><a href="${loginUrl.replace('/login', '/privacy-policy')}">Privacy Policy</a> | <a href="${loginUrl.replace('/login', '/terms-of-service')}">Terms of Service</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to Eazee Invoice!

Hi ${firstName}!

Welcome to Eazee Invoice - the complete business management solution for ${companyName}.

YOUR 7-DAY FREE TRIAL IS ACTIVE!
You have full access to all premium features for the next 7 days.

WHAT YOU CAN DO:
• Professional Invoicing & Quotes - Create unlimited invoices and quotes with PDF generation
• Complete Customer Management - Manage unlimited customers and products
• Business Analytics & Reports - Track revenue and generate detailed reports
• Email Integration - Email invoices directly to customers
• Company Branding - Add your logo and customize documents
• Mobile-Friendly Design - Access your business anywhere

SIMPLE PRICING:
• Monthly: £5.99/month - Full access to all features
• Annual: £64.69/year - Save 10% with annual billing

GETTING STARTED:
1. Set up your company profile - Add your logo and business details
2. Add your first customer - Import from CSV or add manually
3. Create your first invoice - Use our intuitive invoice builder
4. Get paid faster - Email professional invoices to customers

Access your dashboard: ${loginUrl}

Need help? Our comprehensive help section and support team are ready to help you succeed.

Thanks for choosing Eazee Invoice!
The Eazee Invoice Team

© 2024 Eazee Invoice. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: '🎉 Welcome to Eazee Invoice - Your 7-Day Free Trial Starts Now!',
    htmlContent,
    textContent,
    fromName: 'Eazee Invoice Team'
  });
}