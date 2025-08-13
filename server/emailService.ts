import * as SibApiV3Sdk from '@sendinblue/client';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = (apiInstance as any).authentications['apiKey'];
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

    console.log('📤 Sending email via Brevo:', {
      to: params.to,
      subject: params.subject,
      from: sendSmtpEmail.sender
    });

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully:', (response as any).messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo email error details:', {
      error: error.message,
      statusCode: error.response?.statusCode,
      body: error.response?.body,
      stack: error.stack
    });
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
      <!--[if mso]>
        <style>
          table { border-collapse: collapse; }
          .outlook-spacer { font-size: 1px; line-height: 1px; }
        </style>
      <![endif]-->
      <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
        table { border-collapse: collapse !important; }
        img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        .email-wrapper { background-color: #f8fafc; padding: 20px; font-family: Arial, Helvetica, sans-serif; }
        .email-container { background-color: #ffffff; max-width: 600px; margin: 0 auto; }
        .header-table { background-color: #3b82f6; }
        .content-table { padding: 20px; }
        .feature-table { margin: 15px 0; background-color: #f8fafc; border-left: 4px solid #3b82f6; }
        .button-table { margin: 20px 0; }
        .button-link { background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 15px 30px; font-weight: bold; display: inline-block; text-align: center; }
        .info-box { padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
        .trial-box { background-color: #ecfdf5; border-color: #10b981; }
        .pricing-box { background-color: #fef3c7; border-color: #f59e0b; }
        .support-box { background-color: #f1f5f9; border-color: #e2e8f0; }
        .footer-table { background-color: #1e293b; color: #94a3b8; }
        
        h1, h2, h3 { margin: 0; padding: 10px 0; }
        p { margin: 10px 0; line-height: 1.6; }
        li { margin: 5px 0; line-height: 1.8; }
        
        @media only screen and (max-width: 600px) {
          .email-wrapper { padding: 10px !important; }
          .content-table { padding: 15px !important; }
          .button-link { padding: 12px 25px !important; }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0">
          <!-- Header -->
          <tr>
            <td>
              <table class="header-table" width="100%" cellpadding="30" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="color: #ffffff;">
                    <h1 style="font-size: 28px; margin: 0; color: #ffffff;">🧾 Welcome to Eazee Invoice!</h1>
                    <p style="font-size: 16px; margin: 10px 0 0 0; color: #ffffff;">Professional invoicing made simple for ${companyName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td>
              <table class="content-table" width="100%" cellpadding="20" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Welcome Message -->
                    <table class="info-box" width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #f0f9ff; border-color: #0ea5e9;">
                      <tr>
                        <td>
                          <h2 style="color: #1e293b; font-size: 20px;">Hi ${firstName}! 👋</h2>
                          <p style="color: #333333;">Welcome to Eazee Invoice - the complete business management solution designed specifically for freelancers and small businesses like <strong>${companyName}</strong>.</p>
                          <p style="color: #333333;">You're now ready to streamline your invoicing process and take control of your business finances!</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table class="button-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" class="button-link" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 15px 30px; font-weight: bold; display: inline-block;">🚀 Start Using Eazee Invoice</a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Trial Info -->
                    <table class="info-box trial-box" width="100%" cellpadding="20" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <h3 style="color: #065f46; font-size: 18px;">🎉 Your 7-Day Free Trial is Active!</h3>
                          <p style="color: #333333;">You have full access to all premium features for the next 7 days. No credit card required - start creating professional invoices right away!</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Features Header -->
                    <h2 style="color: #1e293b; font-size: 20px;">🌟 What You Can Do With Eazee Invoice:</h2>
                    
                    <!-- Feature Items -->
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">📄</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Professional Invoicing & Quotes</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Create, track, and manage unlimited invoices and quotes with professional PDF generation. Convert quotes to invoices instantly.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">👥</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Complete Customer Management</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Manage unlimited customers and products with CSV import/export, comprehensive profiles, and searchable databases.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">📊</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Business Analytics & Reports</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Track revenue, analyze customer insights, and generate detailed business reports including VAT reports and profit analysis.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">📧</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Email Integration</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Email invoices and quotes directly to customers with customizable templates and professional PDF attachments.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">🎨</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Company Branding</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Add your company logo, customize colors, and include your business details on all documents for a professional appearance.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <table class="feature-table" width="100%" cellpadding="15" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="color: #3b82f6; font-size: 24px; vertical-align: top;">📱</td>
                        <td style="vertical-align: top;">
                          <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 8px 0;">Mobile-Friendly Design</h3>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Access your business anywhere with our responsive design that works perfectly on desktop, tablet, and mobile devices.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Pricing Info -->
                    <table class="info-box pricing-box" width="100%" cellpadding="20" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <h3 style="color: #92400e; font-size: 18px;">💰 Simple, Affordable Pricing</h3>
                          <p style="color: #333333;"><strong>Monthly:</strong> £5.99/month - Full access to all features</p>
                          <p style="color: #333333;"><strong>Annual:</strong> £64.69/year - Save 10% with annual billing</p>
                          <p style="color: #333333;">No setup fees, no hidden costs. Cancel anytime.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Getting Started -->
                    <h2 style="color: #1e293b; font-size: 20px;">🚀 Getting Started is Easy:</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <ol style="font-size: 16px; line-height: 1.8; color: #333333;">
                            <li><strong>Set up your company profile</strong> - Add your logo and business details</li>
                            <li><strong>Add your first customer</strong> - Import from CSV or add manually</li>
                            <li><strong>Create your products/services</strong> - Essential for building invoices and quotes</li>
                            <li><strong>Create your first invoice</strong> - Use our intuitive invoice builder</li>
                            <li><strong>Get paid faster</strong> - Email professional invoices to customers</li>
                          </ol>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Support Section -->
                    <table class="info-box support-box" width="100%" cellpadding="20" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <h3 style="color: #1e293b; font-size: 18px;">💬 Need Help? We're Here for You!</h3>
                          <p style="color: #333333;">Our comprehensive help section includes step-by-step guides, video tutorials, and feature demonstrations to get you started quickly.</p>
                          <p style="color: #333333;">Have questions? Our support team is ready to help you succeed with Eazee Invoice.</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Final CTA Button -->
                    <table class="button-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" class="button-link" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 15px 30px; font-weight: bold; display: inline-block;">🎯 Access Your Dashboard Now</a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Closing -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                      <tr>
                        <td>
                          <p style="color: #64748b;">
                            Thanks for choosing Eazee Invoice to power your business!<br>
                            <strong>The Eazee Invoice Team</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td>
              <table class="footer-table" width="100%" cellpadding="30" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="color: #94a3b8; margin: 0;"><strong>Eazee Invoice</strong> - Professional invoicing made simple</p>
                    <p style="color: #94a3b8; margin: 20px 0;">
                      <a href="https://www.facebook.com/profile.php?id=61578914895610" style="color: #60a5fa; text-decoration: none;">Facebook</a>
                    </p>
                    <p style="color: #94a3b8; margin: 0;">© 2024 Eazee Invoice. All rights reserved.</p>
                    <p style="color: #94a3b8; margin: 10px 0 0 0;">
                      <a href="${loginUrl.replace('/login', '/privacy-policy')}" style="color: #60a5fa; text-decoration: none;">Privacy Policy</a> | 
                      <a href="${loginUrl.replace('/login', '/terms-of-service')}" style="color: #60a5fa; text-decoration: none;">Terms of Service</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
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
3. Create your products/services - Essential for building invoices and quotes
4. Create your first invoice - Use our intuitive invoice builder
5. Get paid faster - Email professional invoices to customers

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