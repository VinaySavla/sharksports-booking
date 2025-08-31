'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  Users,
  Filter
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import Cookies from 'js-cookie';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
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
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const params = new URLSearchParams({
        type: reportType,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReportData();
    }
  }, [reportType, dateRange]);

  const handleExportCSV = () => {
    // Dummy CSV export - in production, implement actual CSV generation
    alert('CSV export feature will be implemented with actual data processing');
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!reportData) return null;

    if (reportType === 'revenue' && reportData.dailyRevenue) {
      const labels = reportData.dailyRevenue.map(item => 
        new Date(item.date).toLocaleDateString()
      );
      const revenue = reportData.dailyRevenue.map(item => item.daily_revenue);

      return {
        labels,
        datasets: [{
          label: 'Daily Revenue',
          data: revenue,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      };
    }

    if (reportType === 'venues' && reportData.venues) {
      const venueNames = reportData.venues.slice(0, 5).map(v => v.name);
      const venueRevenue = reportData.venues.slice(0, 5).map(v => v.total_revenue || 0);

      return {
        labels: venueNames,
        datasets: [{
          label: 'Revenue by Venue',
          data: venueRevenue,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 101, 101, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ]
        }]
      };
    }

    return null;
  };

  const chartData = prepareChartData();

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

  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Comprehensive analytics across all venues and bookings' 
                : 'Analytics for your venues and bookings'
              }
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-3">
              <Filter size={16} className="text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bookings">Bookings Report</option>
                <option value="revenue">Revenue Report</option>
                <option value="venues">Venues Report</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Date Range:</span>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {reportData?.stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={Calendar}
                  title="Total Bookings"
                  value={reportData.stats.total_bookings || 0}
                  subtitle={`${reportData.stats.confirmed_bookings || 0} confirmed`}
                  color="blue"
                />
                <StatCard
                  icon={DollarSign}
                  title="Total Revenue"
                  value={`₹${(reportData.stats.total_revenue || 0).toLocaleString()}`}
                  subtitle={`₹${(reportData.stats.paid_revenue || 0).toLocaleString()} paid`}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Completed"
                  value={reportData.stats.completed_bookings || 0}
                  subtitle="Successfully completed"
                  color="purple"
                />
                <StatCard
                  icon={Users}
                  title="Cancelled"
                  value={reportData.stats.cancelled_bookings || 0}
                  subtitle="Booking cancellations"
                  color="orange"
                />
              </div>
            )}

            {/* Charts */}
            {chartData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {reportType === 'revenue' ? 'Revenue Trends' : 'Venue Performance'}
                  </h3>
                  <div className="h-64">
                    {reportType === 'revenue' ? (
                      <Line data={chartData} options={chartOptions} />
                    ) : (
                      <Bar data={chartData} options={chartOptions} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Data Tables */}
            {reportType === 'bookings' && reportData?.bookings && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Venue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.bookings.slice(0, 50).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{booking.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.customer_name}</div>
                            <div className="text-sm text-gray-500">{booking.customer_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{booking.venue_name}</div>
                            <div className="text-sm text-gray-500">{booking.venue_location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.start_time} - {booking.end_time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">₹{booking.total_amount}</div>
                            <div className={`text-xs ${
                              booking.payment_status === 'paid' ? 'text-green-600' : 
                              booking.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {booking.payment_status}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {booking.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'venues' && reportData?.venues && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Venue Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Venue
                        </th>
                        {user?.role === 'admin' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Bookings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Booking Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.venues.map((venue) => (
                        <tr key={venue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                            <div className="text-sm text-gray-500">{venue.location}</div>
                          </td>
                          {user?.role === 'admin' && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{venue.vendor_name || 'Unassigned'}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{venue.total_bookings || 0}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{(venue.total_revenue || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{venue.total_bookings > 0 
                                ? Math.round((venue.total_revenue || 0) / venue.total_bookings).toLocaleString()
                                : '0'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              venue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {venue.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
