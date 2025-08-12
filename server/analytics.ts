import geoip from 'geoip-lite';

// Interface definitions
interface VisitorSession {
  id: string;
  ip: string;
  userAgent: string;
  startTime: Date;
  lastSeen: Date;
  pageViews: number;
  pages: string[];
  referrer?: string;
  country?: string;
  device?: string;
  browser?: string;
}

interface PageView {
  id: string;
  sessionId: string;
  ip: string;
  page: string;
  timestamp: Date;
  referrer?: string;
  userAgent: string;
  timeOnPage?: number;
}

interface AnalyticsData {
  overview: {
    uniqueVisitors: number;
    pageViews: number;
    sessions: number;
    avgSessionDuration: string;
    bounceRate: number;
    newVisitors: number;
  };
  timeRange: {
    date: string;
    visitors: number;
    pageViews: number;
    sessions: number;
    bounceRate: number;
  }[];
  topPages: {
    page: string;
    views: number;
    uniqueViews: number;
    avgTime: string;
  }[];
  trafficSources: {
    source: string;
    visitors: number;
    percentage: number;
    color: string;
  }[];
  deviceTypes: {
    device: string;
    visitors: number;
    percentage: number;
  }[];
  countries: {
    country: string;
    visitors: number;
    sessions: number;
    flag: string;
  }[];
  browserData: {
    browser: string;
    visitors: number;
    percentage: number;
  }[];
}

// In-memory storage for analytics data (in production, use a database)
const sessions = new Map<string, VisitorSession>();
const pageViews: PageView[] = [];
const visitors = new Set<string>();

// Helper functions
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  return 'Desktop';
}

function getBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Other';
}

function getTrafficSource(referrer?: string): string {
  if (!referrer) return 'Direct';
  
  const domain = new URL(referrer).hostname.toLowerCase();
  if (domain.includes('google')) return 'Google';
  if (domain.includes('facebook')) return 'Facebook';
  if (domain.includes('twitter') || domain.includes('t.co')) return 'Twitter';
  if (domain.includes('linkedin')) return 'LinkedIn';
  if (domain.includes('youtube')) return 'YouTube';
  if (domain.includes('instagram')) return 'Instagram';
  if (domain.includes('reddit')) return 'Reddit';
  if (domain.includes('github')) return 'GitHub';
  
  return 'Referral';
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function getCountryFlag(countryCode: string): string {
  const flagMap: { [key: string]: string } = {
    'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪',
    'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'BR': '🇧🇷',
    'IN': '🇮🇳', 'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'RU': '🇷🇺',
    'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪',
    'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'PL': '🇵🇱',
    'IE': '🇮🇪', 'PT': '🇵🇹', 'AT': '🇦🇹', 'CH': '🇨🇭', 'BE': '🇧🇪',
    'GR': '🇬🇷', 'TR': '🇹🇷', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
    'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮', 'SK': '🇸🇰', 'LT': '🇱🇹',
    'LV': '🇱🇻', 'EE': '🇪🇪', 'MT': '🇲🇹', 'CY': '🇨🇾', 'LU': '🇱🇺'
  };
  return flagMap[countryCode] || '🌍';
}

// Analytics tracking functions
export function trackPageView(
  ip: string,
  userAgent: string,
  page: string,
  referrer?: string
): void {
  const sessionId = `${ip}-${new Date().toDateString()}`;
  const now = new Date();
  
  // Add to visitors set
  visitors.add(ip);
  
  // Get or create session
  let session = sessions.get(sessionId);
  if (!session) {
    const geo = geoip.lookup(ip);
    session = {
      id: sessionId,
      ip,
      userAgent,
      startTime: now,
      lastSeen: now,
      pageViews: 0,
      pages: [],
      referrer,
      country: geo?.country || 'Unknown',
      device: getDeviceType(userAgent),
      browser: getBrowserName(userAgent)
    };
    sessions.set(sessionId, session);
  }
  
  // Update session
  session.lastSeen = now;
  session.pageViews++;
  if (!session.pages.includes(page)) {
    session.pages.push(page);
  }
  
  // Create page view record
  const pageView: PageView = {
    id: `${sessionId}-${now.getTime()}`,
    sessionId,
    ip,
    page,
    timestamp: now,
    referrer,
    userAgent
  };
  
  pageViews.push(pageView);
  
  // Keep only last 90 days of data
  const cutoff = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const filteredPageViews = pageViews.filter(pv => pv.timestamp > cutoff);
  pageViews.length = 0;
  pageViews.push(...filteredPageViews);
}

export function getAnalyticsData(rangeDays: number = 30): AnalyticsData {
  const now = new Date();
  const startDate = new Date(now.getTime() - (rangeDays * 24 * 60 * 60 * 1000));
  
  // Filter data for the specified range
  const rangePageViews = pageViews.filter(pv => pv.timestamp >= startDate);
  const rangeSessions = Array.from(sessions.values()).filter(s => s.startTime >= startDate);
  
  // Calculate overview metrics
  const uniqueVisitors = new Set(rangePageViews.map(pv => pv.ip)).size;
  const totalPageViews = rangePageViews.length;
  const totalSessions = rangeSessions.length;
  
  // Calculate bounce rate (sessions with only 1 page view)
  const bouncedSessions = rangeSessions.filter(s => s.pageViews === 1).length;
  const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;
  
  // Calculate average session duration
  const totalDuration = rangeSessions.reduce((sum, session) => {
    return sum + (session.lastSeen.getTime() - session.startTime.getTime());
  }, 0);
  const avgDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
  
  // Count new visitors (first time seeing this IP in our data)
  const newVisitors = rangeSessions.filter(session => {
    const allSessionsForIP = Array.from(sessions.values()).filter(s => s.ip === session.ip);
    return allSessionsForIP.length === 1;
  }).length;
  
  // Generate time series data
  const timeRange = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
    
    const dayPageViews = rangePageViews.filter(pv => 
      pv.timestamp >= dayStart && pv.timestamp < dayEnd
    );
    const daySessions = rangeSessions.filter(s => 
      s.startTime >= dayStart && s.startTime < dayEnd
    );
    const dayVisitors = new Set(dayPageViews.map(pv => pv.ip)).size;
    const dayBouncedSessions = daySessions.filter(s => s.pageViews === 1).length;
    const dayBounceRate = daySessions.length > 0 ? Math.round((dayBouncedSessions / daySessions.length) * 100) : 0;
    
    timeRange.push({
      date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      visitors: dayVisitors,
      pageViews: dayPageViews.length,
      sessions: daySessions.length,
      bounceRate: dayBounceRate
    });
  }
  
  // Top pages
  const pageStats = new Map<string, { views: number; uniqueViews: Set<string>; totalTime: number; timeCount: number }>();
  rangePageViews.forEach(pv => {
    const stats = pageStats.get(pv.page) || { views: 0, uniqueViews: new Set(), totalTime: 0, timeCount: 0 };
    stats.views++;
    stats.uniqueViews.add(pv.ip);
    if (pv.timeOnPage) {
      stats.totalTime += pv.timeOnPage;
      stats.timeCount++;
    }
    pageStats.set(pv.page, stats);
  });
  
  const topPages = Array.from(pageStats.entries())
    .map(([page, stats]) => ({
      page,
      views: stats.views,
      uniqueViews: stats.uniqueViews.size,
      avgTime: stats.timeCount > 0 ? formatDuration(stats.totalTime / stats.timeCount) : '0s'
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  
  // Traffic sources
  const sourceStats = new Map<string, number>();
  rangeSessions.forEach(session => {
    const source = getTrafficSource(session.referrer);
    sourceStats.set(source, (sourceStats.get(source) || 0) + 1);
  });
  
  const sourceColors = {
    'Direct': '#8884d8',
    'Google': '#4285f4',
    'Facebook': '#1877f2',
    'Twitter': '#1da1f2',
    'LinkedIn': '#0077b5',
    'YouTube': '#ff0000',
    'Instagram': '#e4405f',
    'Reddit': '#ff4500',
    'GitHub': '#333333',
    'Referral': '#82ca9d'
  };
  
  const trafficSources = Array.from(sourceStats.entries())
    .map(([source, visitors]) => ({
      source,
      visitors,
      percentage: Math.round((visitors / totalSessions) * 100),
      color: sourceColors[source as keyof typeof sourceColors] || '#8884d8'
    }))
    .sort((a, b) => b.visitors - a.visitors);
  
  // Device types
  const deviceStats = new Map<string, number>();
  rangeSessions.forEach(session => {
    if (session.device) {
      deviceStats.set(session.device, (deviceStats.get(session.device) || 0) + 1);
    }
  });
  
  const deviceTypes = Array.from(deviceStats.entries())
    .map(([device, visitors]) => ({
      device,
      visitors,
      percentage: Math.round((visitors / totalSessions) * 100)
    }))
    .sort((a, b) => b.visitors - a.visitors);
  
  // Countries
  const countryStats = new Map<string, { visitors: Set<string>; sessions: number }>();
  rangeSessions.forEach(session => {
    if (session.country) {
      const stats = countryStats.get(session.country) || { visitors: new Set(), sessions: 0 };
      stats.visitors.add(session.ip);
      stats.sessions++;
      countryStats.set(session.country, stats);
    }
  });
  
  const countries = Array.from(countryStats.entries())
    .map(([country, stats]) => ({
      country,
      visitors: stats.visitors.size,
      sessions: stats.sessions,
      flag: getCountryFlag(country)
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);
  
  // Browser data
  const browserStats = new Map<string, number>();
  rangeSessions.forEach(session => {
    if (session.browser) {
      browserStats.set(session.browser, (browserStats.get(session.browser) || 0) + 1);
    }
  });
  
  const browserData = Array.from(browserStats.entries())
    .map(([browser, visitors]) => ({
      browser,
      visitors,
      percentage: Math.round((visitors / totalSessions) * 100)
    }))
    .sort((a, b) => b.visitors - a.visitors);
  
  return {
    overview: {
      uniqueVisitors,
      pageViews: totalPageViews,
      sessions: totalSessions,
      avgSessionDuration: formatDuration(avgDuration),
      bounceRate,
      newVisitors
    },
    timeRange,
    topPages,
    trafficSources,
    deviceTypes,
    countries,
    browserData
  };
}

// Middleware to track page views automatically
export function analyticsMiddleware(req: any, res: any, next: any) {
  // Skip tracking for API requests, static files, and admin pages
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/static') || 
      req.path.includes('.') ||
      req.path.startsWith('/admin')) {
    return next();
  }
  
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const userAgent = req.get('User-Agent') || '';
  const page = req.path;
  const referrer = req.get('Referer');
  
  // Track the page view
  trackPageView(ip, userAgent, page, referrer);
  
  next();
}