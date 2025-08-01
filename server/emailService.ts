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