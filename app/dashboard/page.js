'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Cookies from 'js-cookie';
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ icon: Icon, title, value, change, changeType, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${colorClasses[color]} rounded-lg p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'positive' ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ icon: Icon, title, description, time, type = 'info' }) => {
  const typeClasses = {
    info: 'text-blue-600 bg-blue-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-orange-600 bg-orange-100',
    danger: 'text-red-600 bg-red-100'
  };

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
      <div className={`p-2 rounded-full ${typeClasses[type]}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
};

// Helper functions for activity feed
const getActivityIcon = (action) => {
  if (action.includes('booking')) return Calendar;
  if (action.includes('payment')) return DollarSign;
  if (action.includes('vendor')) return Users;
  if (action.includes('venue')) return Building;
  return CheckCircle;
};

const getActivityType = (action) => {
  if (action.includes('confirmed') || action.includes('created')) return 'success';
  if (action.includes('failed') || action.includes('cancelled')) return 'danger';
  if (action.includes('updated') || action.includes('pending')) return 'warning';
  return 'info';
};

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: 0,
    bookingTrends: [],
    venueTypes: []
  });
  const [quickStats, setQuickStats] = useState({
    todayBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    todayRevenue: 0
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('token');
    const storedUser = Cookies.get('user');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Set user from cookie if available to avoid initial API call
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    const fetchDashboardData = async () => {
      try {
        // Get user info if not already set from cookie
        if (!storedUser) {
          const userResponse = await fetch('/api/profile', {
            credentials: 'include'
          });
          const userData = await userResponse.json();
          
          if (userData.success) {
            setUser(userData.user);
          } else if (userResponse.status === 401) {
            // Clear invalid cookies and redirect
            Cookies.remove('token');
            Cookies.remove('user');
            router.push('/login');
            return;
          }
        }

        // Get dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats', {
          credentials: 'include'
        });
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          setStats(statsData.stats);
        } else if (statsResponse.status === 401) {
          // Clear invalid cookies and redirect
          Cookies.remove('token');
          Cookies.remove('user');
          router.push('/login');
          return;
        }

        // Get quick stats (today's data)
        const quickStatsResponse = await fetch('/api/dashboard/quick-stats', {
          credentials: 'include'
        });
        const quickStatsData = await quickStatsResponse.json();
        
        if (quickStatsData.success) {
          setQuickStats(quickStatsData.quickStats);
        }

        // Get recent activities
        const activitiesResponse = await fetch('/api/reports?type=activities&limit=10', {
          credentials: 'include'
        });
        const activitiesData = await activitiesResponse.json();
        
        if (activitiesData.success) {
          setActivities(activitiesData.data || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate chart data from real-time stats
  const bookingTrendsData = {
    labels: stats.bookingTrends?.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bookings',
        data: stats.bookingTrends?.map(item => item.bookings) || [0, 0, 0, 0, 0, 0],
        fill: false,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const venueTypesData = {
    labels: stats.venueTypes?.map(item => item.venue_type) || ['No Data'],
    datasets: [
      {
        data: stats.venueTypes?.map(item => item.count) || [0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.role === 'admin' ? (
            <>
              <StatCard
                icon={Users}
                title="Total Vendors"
                value={stats.totalVendors}
                color="blue"
              />
              <StatCard
                icon={Building}
                title="Total Venues"
                value={stats.totalVenues}
                color="green"
              />
              <StatCard
                icon={Calendar}
                title="Total Bookings"
                value={stats.totalBookings}
                color="purple"
              />
              <StatCard
                icon={DollarSign}
                title="Total Revenue"
                value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
                color="orange"
              />
            </>
          ) : (
            <>
              <StatCard
                icon={Building}
                title="My Venues"
                value={stats.totalVenues}
                color="green"
              />
              <StatCard
                icon={Calendar}
                title="My Bookings"
                value={stats.totalBookings}
                color="purple"
              />
              <StatCard
                icon={DollarSign}
                title="My Revenue"
                value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
                color="orange"
              />
              <StatCard
                icon={TrendingUp}
                title="Active Venues"
                value={stats.totalVenues}
                color="blue"
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600">+12% this month</span>
              </div>
            </div>
            <div className="h-64">
              <Line data={bookingTrendsData} options={chartOptions} />
            </div>
          </div>

          {/* Venue Types Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Types</h3>
            <div className="h-64">
              <Doughnut data={venueTypesData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Activity and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-1">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <ActivityItem
                      key={index}
                      icon={getActivityIcon(activity.action)}
                      title={activity.action}
                      description={activity.description}
                      time={formatTimeAgo(activity.created_at)}
                      type={getActivityType(activity.action)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="mx-auto h-8 w-8 mb-2" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all activity
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Today's Bookings</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{quickStats.todayBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Confirmed</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{quickStats.confirmedBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-600">Pending Payment</span>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">{quickStats.pendingBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-gray-600">Cancelled</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{quickStats.cancelledBookings}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Today's Revenue</span>
                    <span className="text-lg font-bold text-green-600">₹{quickStats.todayRevenue?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
