import { trackPageView } from './analytics';

// Generate sample analytics data for demonstration
export function generateSampleAnalyticsData() {
  const samplePages = [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/pricing',
    '/about',
    '/features',
    '/help',
    '/contact'
  ];

  const sampleReferrers = [
    undefined, // Direct traffic
    'https://google.com/search',
    'https://facebook.com',
    'https://twitter.com',
    'https://linkedin.com',
    'https://github.com',
    'https://reddit.com',
    'https://youtube.com'
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];

  // Generate sample IPs from different countries
  const sampleIPs = [
    '203.0.113.1', // Australia
    '198.51.100.1', // USA
    '192.0.2.1', // UK
    '203.0.113.50', // Canada
    '198.51.100.50', // Germany
    '192.0.2.50', // France
    '203.0.113.100', // Japan
    '198.51.100.100', // Brazil
    '192.0.2.100', // India
    '203.0.113.150' // Netherlands
  ];

  // Generate data for the past 30 days
  const now = new Date();
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    // Generate 5-50 page views per day with more recent days having more traffic
    const baseViews = Math.max(5, 50 - daysAgo);
    const dailyViews = baseViews + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < dailyViews; i++) {
      // Set a realistic time during the day
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const viewTime = new Date(date);
      viewTime.setHours(hour, minute, second);
      
      // Choose random values
      const ip = sampleIPs[Math.floor(Math.random() * sampleIPs.length)];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const page = samplePages[Math.floor(Math.random() * samplePages.length)];
      const referrer = Math.random() > 0.6 ? sampleReferrers[Math.floor(Math.random() * sampleReferrers.length)] : undefined;
      
      // Temporarily override Date for historical data
      const originalDate = global.Date;
      (global as any).Date = class extends originalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(viewTime.getTime());
          } else {
            super(...(args as [number, number, number]));
          }
        }
        
        static now() {
          return viewTime.getTime();
        }
      };
      
      trackPageView(ip, userAgent, page, referrer);
      
      // Restore original Date
      global.Date = originalDate;
    }
  }
  
  console.log('✅ Generated sample analytics data for the past 30 days');
}