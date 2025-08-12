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
    ? `<img src="${user.companyLogo}" alt="${user.companyName}" style="max-height: 80px; margin-bottom: 20px;" />`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email from ${user.companyName || 'Eazee Invoice'}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #e9ecef;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #e9ecef;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 0.9em;
      color: #666;
    }
    .content {
      white-space: pre-line;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    ${user.companyName ? `<h2>${user.companyName}</h2>` : ''}
    ${user.companyAddress ? `<p>${user.companyAddress.replace(/\n/g, '<br>')}</p>` : ''}
  </div>
  
  <div class="content">
    ${bodyContent}
  </div>
  
  <div class="footer">
    <p>
      Best regards,<br>
      ${user.companyName || user.displayName}
    </p>
    ${user.companyVatNumber ? `<p><strong>VAT Number:</strong> ${user.companyVatNumber}</p>` : ''}
    ${user.companyRegistrationNumber ? `<p><strong>Company Registration:</strong> ${user.companyRegistrationNumber}</p>` : ''}
  </div>
</body>
</html>`;
};