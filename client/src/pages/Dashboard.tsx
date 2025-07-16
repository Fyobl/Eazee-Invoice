import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/hooks/useDatabase';
import { FileText, Quote, FileBarChart, Users, Plus, TrendingUp, Sun, Cloud, CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import React from 'react';

export const Dashboard = () => {
  const { userData } = useAuth();
  const { data: invoices } = useDatabase('invoices');
  const { data: quotes } = useDatabase('quotes');
  const { data: customers } = useDatabase('customers');
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocation] = useState<string>('');
  const [weatherLoading, setWeatherLoading] = useState(true);

  const totalRevenue = invoices?.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0) || 0;

  // Weather functionality
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Get weather from Open-Meteo API (no API key required)
            const weatherResponse = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
            );
            const weatherData = await weatherResponse.json();
            
            // Get location name from reverse geocoding
            const locationResponse = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=auto`
            );
            
            // For location name, we'll use a simple approach
            setLocation('Current Location');
            setWeather(weatherData);
            setWeatherLoading(false);
          }, (error) => {
            console.error('Geolocation error:', error);
            setWeatherLoading(false);
          });
        } else {
          setWeatherLoading(false);
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode === 0) return Sun; // Clear sky
    if (weatherCode <= 3) return Cloud; // Partly cloudy
    if (weatherCode <= 67) return CloudRain; // Rain
    return Cloud; // Default
  };

  const getWeatherDescription = (weatherCode: number) => {
    if (weatherCode === 0) return 'Clear';
    if (weatherCode <= 3) return 'Partly Cloudy';
    if (weatherCode <= 67) return 'Rainy';
    return 'Cloudy';
  };

  // Arrange stats in the requested order
  const welcomeBox = {
    title: 'Welcome Back!',
    value: userData?.firstName || userData?.displayName || 'User',
    subtitle: "Here's what's happening with your business today.",
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    type: 'welcome'
  };

  const businessStats = [
    {
      title: 'Total Invoices',
      value: invoices?.length || 0,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Active Quotes',
      value: quotes?.filter(q => q.status === 'sent').length || 0,
      icon: Quote,
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Customers',
      value: customers?.length || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'This Month',
      value: `£${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400'
    }
  ];

  // Weather widget data
  const weatherWidget = {
    title: 'Local Weather',
    loading: weatherLoading,
    location: location,
    weather: weather,
    icon: weather ? getWeatherIcon(weather.current?.weather_code || 0) : Sun,
    color: 'text-amber-600 dark:text-amber-400'
  };

  const quickActions = [
    { label: 'Create New Invoice', href: '/invoices/new', icon: Plus },
    { label: 'Generate Quote', href: '/quotes/new', icon: Quote },
    { label: 'Add Customer', href: '/customers/new', icon: Plus }
  ];

  // Generate real recent activity from database
  const recentActivity = [];
  
  // Add recent invoices
  const recentInvoices = invoices?.slice(0, 2) || [];
  recentInvoices.forEach(invoice => {
    const timeAgo = getTimeAgo(invoice.createdAt);
    recentActivity.push({
      action: `Invoice ${invoice.number} created for ${invoice.customerName}`,
      time: timeAgo,
      icon: FileText
    });
  });
  
  // Add recent quotes
  const recentQuotes = quotes?.slice(0, 2) || [];
  recentQuotes.forEach(quote => {
    const timeAgo = getTimeAgo(quote.createdAt);
    recentActivity.push({
      action: `Quote ${quote.number} created for ${quote.customerName}`,
      time: timeAgo,
      icon: Quote
    });
  });
  
  // Add recent customers
  const recentCustomers = customers?.slice(0, 1) || [];
  recentCustomers.forEach(customer => {
    const timeAgo = getTimeAgo(customer.createdAt);
    recentActivity.push({
      action: `New customer "${customer.name}" added`,
      time: timeAgo,
      icon: Users
    });
  });
  
  // Sort by creation time (most recent first) and limit to 5
  recentActivity.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const limitedActivity = recentActivity.slice(0, 5);
  
  // Helper function to calculate time ago
  function getTimeAgo(dateString: string | Date) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }

  return (
    <Layout title="Dashboard">
      {/* 2x3 Grid Layout: Welcome/Weather, Invoices/Quotes, Customers/This Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Row 1: Welcome Back (Left) */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{welcomeBox.title}</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{welcomeBox.value}!</p>
                </div>
                <Users className={`h-8 w-8 ${welcomeBox.color}`} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{welcomeBox.subtitle}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Row 1: Local Weather (Right) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{weatherWidget.title}</p>
                {weatherWidget.loading ? (
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading...</p>
                ) : weather ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {Math.round(weather.current?.temperature_2m || 0)}°C
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {getWeatherDescription(weather.current?.weather_code || 0)}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center">
                        <Wind className="h-3 w-3 mr-1" />
                        {Math.round(weather.current?.wind_speed_10m || 0)}km/h
                      </div>
                      <div className="flex items-center">
                        <Droplets className="h-3 w-3 mr-1" />
                        {Math.round(weather.current?.relative_humidity_2m || 0)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Unavailable</p>
                )}
              </div>
              {weather ? (
                React.createElement(getWeatherIcon(weather.current?.weather_code || 0), { className: `h-8 w-8 ${weatherWidget.color}` })
              ) : (
                <Sun className={`h-8 w-8 ${weatherWidget.color}`} />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Row 2: Total Invoices (Left) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{businessStats[0].title}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{businessStats[0].value}</p>
              </div>
              <FileText className={`h-8 w-8 ${businessStats[0].color}`} />
            </div>
          </CardContent>
        </Card>
        
        {/* Row 2: Active Quotes (Right) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{businessStats[1].title}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{businessStats[1].value}</p>
              </div>
              <Quote className={`h-8 w-8 ${businessStats[1].color}`} />
            </div>
          </CardContent>
        </Card>
        
        {/* Row 3: Customers (Left) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{businessStats[2].title}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{businessStats[2].value}</p>
              </div>
              <Users className={`h-8 w-8 ${businessStats[2].color}`} />
            </div>
          </CardContent>
        </Card>
        
        {/* Row 3: This Month (Right) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{businessStats[3].title}</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{businessStats[3].value}</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${businessStats[3].color}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button 
                  variant={index === 0 ? "default" : "outline"} 
                  className="w-full justify-start"
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {limitedActivity.length > 0 ? (
              limitedActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 dark:text-slate-100">{activity.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No recent activity yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Create your first invoice or quote to see activity here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
