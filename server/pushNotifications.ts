import axios from 'axios';

interface PushNotificationConfig {
  service: 'pushover' | 'telegram' | 'discord';
  config: any;
}

// Pushover notification service
export async function sendPushoverNotification(
  appToken: string,
  userKey: string,
  title: string,
  message: string,
  priority: number = 0
) {
  try {
    const response = await axios.post('https://api.pushover.net/1/messages.json', {
      token: appToken,
      user: userKey,
      title,
      message,
      priority,
      sound: 'magic' // Nice notification sound for new subscriptions
    });
    
    console.log('✅ Pushover notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send Pushover notification:', error);
    throw error;
  }
}

// Telegram notification service
export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
) {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    console.log('✅ Telegram notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
    throw error;
  }
}

// Discord webhook notification
export async function sendDiscordNotification(
  webhookUrl: string,
  title: string,
  description: string,
  color: number = 0x00ff00 // Green for good news
) {
  try {
    const response = await axios.post(webhookUrl, {
      embeds: [{
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Eazee Invoice'
        }
      }]
    });
    
    console.log('✅ Discord notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send Discord notification:', error);
    throw error;
  }
}

// Main notification sender that handles different services
export async function sendSubscriptionNotification(
  customerEmail: string,
  customerName: string,
  subscriptionAmount: number,
  currency: string = 'GBP',
  billingFrequency: string = 'monthly'
) {
  const title = '🎉 New Subscription!';
  const frequencyText = billingFrequency === 'yearly' ? '/year' : '/month';
  const message = `${customerName} (${customerEmail}) just subscribed for ${currency === 'GBP' ? '£' : '$'}${subscriptionAmount}${frequencyText}`;
  
  // Send notifications based on available environment variables
  const notifications = [];
  
  // Clean logging for production
  console.log('📱 Processing notification for new subscription...');
  
  // Pushover (recommended - simple app for phones)
  const pushoverUserKey = process.env.PUSHOVER_USER_KEY || process.env.PUSHOVER_USER_TOKEN;
  if (process.env.PUSHOVER_APP_TOKEN && pushoverUserKey) {
    notifications.push(
      sendPushoverNotification(
        process.env.PUSHOVER_APP_TOKEN,
        pushoverUserKey,
        title,
        message,
        1 // High priority for new subscriptions
      )
    );
  }
  
  // Telegram
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const telegramMessage = `<b>${title}</b>\n\n${message}\n\n<i>Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</i>`;
    notifications.push(
      sendTelegramNotification(
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID,
        telegramMessage
      )
    );
  }
  
  // Discord
  if (process.env.DISCORD_WEBHOOK_URL) {
    notifications.push(
      sendDiscordNotification(
        process.env.DISCORD_WEBHOOK_URL,
        title,
        `${message}\n\nTime: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`
      )
    );
  }
  
  // Execute all notifications
  if (notifications.length > 0) {
    try {
      await Promise.allSettled(notifications);
      console.log(`📱 Sent ${notifications.length} subscription notification(s)`);
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
    }
  } else {
    console.log('ℹ️ No notification services configured. Add PUSHOVER_*, TELEGRAM_*, or DISCORD_* environment variables to enable notifications.');
  }
}

// Test notification function for setup verification
export async function sendTestNotification(billingFrequency: 'monthly' | 'yearly' = 'monthly') {
  const amount = billingFrequency === 'monthly' ? 5.99 : 64.69;
  const frequency = billingFrequency === 'monthly' ? 'monthly' : 'yearly';
  
  return sendSubscriptionNotification(
    'test@example.com',
    'Test User',
    amount,
    'GBP',
    frequency
  );
}