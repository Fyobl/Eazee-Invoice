import { User } from '@shared/schema';

interface EmailAttachment {
  content: string; // Base64 encoded content
  name: string;
  type?: string;
}

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  attachment?: EmailAttachment;
}

export const sendEmailWithBrevo = async (
  user: User,
  options: EmailOptions
): Promise<boolean> => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('Brevo API key not configured');
  }

  if (!user.senderEmail || !user.isEmailVerified) {
    throw new Error('User email not verified for sending');
  }

  try {
    const emailData = {
      sender: {
        name: user.companyName || user.displayName || 'Eazee Invoice',
        email: user.senderEmail
      },
      replyTo: {
        email: user.senderEmail,
        name: user.companyName || user.displayName
      },
      to: [{
        email: options.to,
        name: options.toName || options.to
      }],
      subject: options.subject,
      htmlContent: options.htmlContent,
      ...(options.attachment && {
        attachment: [{
          content: options.attachment.content,
          name: options.attachment.name,
          contentType: options.attachment.type || 'application/pdf'
        }]
      })
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo email send failed:', errorData);
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.messageId);
    return true;

  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const replaceEmailVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
};

export const generateEmailHTML = (
  bodyContent: string,
  user: User
): string => {
  const logoHtml = user.companyLogo 
    ? `<img src="${user.companyLogo}" alt="${user.companyName}" style="max-height: 60px; margin-bottom: 15px;" />`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from ${user.companyName || 'Your Company'}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #f8fafc; 
    }
    .email-container { 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
      overflow: hidden; 
    }
    .header { 
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
      color: white; 
      padding: 30px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: bold; 
    }
    .header p { 
      margin: 10px 0 0 0; 
      font-size: 14px; 
      opacity: 0.9; 
    }
    .content { 
      padding: 40px; 
    }
    .content-body {
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
      padding: 25px; 
      border-radius: 8px; 
      margin: 20px 0;
      white-space: pre-line;
      line-height: 1.7;
    }
    .company-details {
      background: #f1f5f9; 
      border-left: 4px solid #3b82f6; 
      padding: 20px; 
      margin: 25px 0; 
      border-radius: 0 8px 8px 0;
    }
    .company-details h3 { 
      margin: 0 0 10px 0; 
      color: #1e293b; 
      font-size: 16px; 
    }
    .company-details p { 
      margin: 5px 0; 
      color: #64748b; 
      font-size: 14px; 
    }
    .attachment-note {
      background: #ecfdf5; 
      border: 1px solid #10b981; 
      padding: 15px; 
      border-radius: 8px; 
      margin: 20px 0;
      text-align: center;
    }
    .attachment-note p {
      margin: 0;
      color: #065f46;
      font-weight: 500;
    }
    .footer { 
      background: #1e293b; 
      color: #94a3b8; 
      padding: 30px; 
      text-align: center; 
      font-size: 14px; 
    }
    .footer p { 
      margin: 10px 0; 
    }
    .footer .signature {
      color: #e2e8f0;
      font-weight: 500;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${logoHtml}
      <h1>${user.companyName || 'Your Company'}</h1>
      <p>Professional Business Communication</p>
    </div>
    
    <div class="content">
      <div class="content-body">
        ${bodyContent}
      </div>
      
      <div class="attachment-note">
        <p>📎 Your document has been attached to this email as a PDF</p>
      </div>
      
      <div class="company-details">
        <h3>${user.companyName || 'Your Company'}</h3>
        ${user.companyAddress ? `<p>${user.companyAddress.replace(/\n/g, '<br>')}</p>` : ''}
        ${user.companyVatNumber ? `<p><strong>VAT Number:</strong> ${user.companyVatNumber}</p>` : ''}
        ${user.companyRegistrationNumber ? `<p><strong>Company Registration:</strong> ${user.companyRegistrationNumber}</p>` : ''}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <p><strong>Best regards,</strong></p>
        <p>${user.companyName || user.displayName || 'Your Company'}</p>
      </div>
      <p>This email was sent from your professional invoicing system.</p>
      <p>© ${new Date().getFullYear()} ${user.companyName || 'Your Company'}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};