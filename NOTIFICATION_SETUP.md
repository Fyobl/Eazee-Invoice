# Push Notification Setup Guide

## Overview
Your Eazee Invoice app can now send push notifications to your phone whenever someone subscribes! Here are three easy options to choose from:

## Option 1: Pushover (Recommended - Easiest)

Pushover is the simplest option with a clean mobile app.

### Setup Steps:
1. **Download Pushover app** on your phone (iOS/Android) - $5 one-time purchase
2. **Create account** at https://pushover.net
3. **Create an application**:
   - Go to https://pushover.net/apps/build
   - Name: "Eazee Invoice Notifications"
   - Description: "New subscription alerts"
   - Click "Create Application"
4. **Get your keys**:
   - **App Token**: Found on your app page (starts with `a...`)
   - **User Key**: Found on your main dashboard (starts with `u...`)

### Add to Replit Secrets:
```
PUSHOVER_APP_TOKEN=your_app_token_here
PUSHOVER_USER_KEY=your_user_key_here
```

## Option 2: Telegram (Free)

Free option using Telegram messenger.

### Setup Steps:
1. **Install Telegram** on your phone
2. **Create a bot**:
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Choose name: "Eazee Invoice Bot"
   - Choose username: "eazeeinvoice_notifications_bot" (must end in 'bot')
   - Save the bot token (starts with numbers and colon)
3. **Get your Chat ID**:
   - Start a chat with your bot
   - Send any message to it
   - Visit: `https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates`
   - Look for "chat":{"id": NUMBER - that's your chat ID

### Add to Replit Secrets:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Option 3: Discord (Free)

Use Discord if you're already active there.

### Setup Steps:
1. **Create a Discord server** (or use existing)
2. **Create a webhook**:
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Name: "Eazee Invoice Notifications"
   - Choose channel for notifications
   - Copy webhook URL

### Add to Replit Secrets:
```
DISCORD_WEBHOOK_URL=your_webhook_url_here
```

## Testing Your Setup

Once you've added your chosen service secrets:

1. Go to your admin panel
2. Add this test button code or use the API endpoint:
   - `POST /api/test-notification` (admin only)
3. You should receive a test notification on your phone!

## What You'll Get

When someone subscribes, you'll receive:
- **Title**: "🎉 New Subscription!"
- **Message**: "[Customer Name] ([email]) just subscribed for £5.99/month"
- **Time**: UK time zone
- **Sound**: Special notification sound (Pushover)

## Multiple Services

You can set up multiple services - the app will send to all configured platforms simultaneously!

## Troubleshooting

- **No notifications**: Check your secrets are spelled correctly
- **Pushover not working**: Ensure you've purchased the app and verified your account
- **Telegram silent**: Make sure you've messaged your bot first
- **Discord quiet**: Verify webhook URL is complete and channel exists

## Support

If you need help setting this up, the notification system logs detailed information in your server console to help diagnose issues.