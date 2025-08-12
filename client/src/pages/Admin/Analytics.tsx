import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/Layout/Layout';
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  Globe, 
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async (range = dateRange) => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    fetchAnalytics(value);
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <Layout title="Web Analytics">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analyticsData) {
    return (
      <Layout title="Web Analytics">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Not Available</CardTitle>
              <CardDescription>
                Analytics data could not be loaded. Please check your Google Analytics configuration.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Web Analytics">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Web Analytics</h1>
            <p className="text-muted-foreground">
              Track your website's performance and visitor insights
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.uniqueVisitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.overview.newVisitors} new visitors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.pageViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {(analyticsData.overview.pageViews / analyticsData.overview.uniqueVisitors).toFixed(1)} per visitor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.sessions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {(analyticsData.overview.sessions / analyticsData.overview.uniqueVisitors).toFixed(1)} per visitor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.avgSessionDuration}</div>
              <p className="text-xs text-muted-foreground">Duration</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.bounceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.overview.bounceRate < 40 ? 'Excellent' : 
                 analyticsData.overview.bounceRate < 60 ? 'Good' : 'Needs improvement'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New vs Return</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((analyticsData.overview.newVisitors / analyticsData.overview.uniqueVisitors) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">New visitors</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Visitors Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Visitors Over Time</CardTitle>
                <CardDescription>Daily unique visitors and page views</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData.timeRange}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Unique Visitors"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Page Views"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sessions and Bounce Rate */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sessions</CardTitle>
                  <CardDescription>Daily sessions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.timeRange}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bounce Rate</CardTitle>
                  <CardDescription>Daily bounce rate percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.timeRange}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Bounce Rate']} />
                      <Line
                        type="monotone"
                        dataKey="bounceRate"
                        stroke="#ff7300"
                        strokeWidth={2}
                        dot={{ fill: '#ff7300' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Device Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                  <CardDescription>Visitors by device category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="visitors"
                        data={analyticsData.deviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {analyticsData.deviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries</CardTitle>
                  <CardDescription>Visitors by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.countries.slice(0, 8).map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{country.flag}</span>
                          <div>
                            <p className="font-medium">{country.country}</p>
                            <p className="text-sm text-muted-foreground">
                              {country.sessions} sessions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{country.visitors.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">visitors</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Browser Data */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Usage</CardTitle>
                <CardDescription>Visitors by browser type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.browserData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visitors" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages on your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPages.map((page, index) => (
                    <div key={page.page} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{page.page}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg. time: {page.avgTime}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{page.views.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {page.uniqueViews.toLocaleString()} unique
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acquisition" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your visitors come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        dataKey="visitors"
                        data={analyticsData.trafficSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {analyticsData.trafficSources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Traffic Sources List */}
              <Card>
                <CardHeader>
                  <CardTitle>Source Breakdown</CardTitle>
                  <CardDescription>Detailed traffic source analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.trafficSources.map((source) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span className="font-medium">{source.source}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{source.visitors.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{source.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}