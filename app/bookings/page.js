'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Filter,
  Search,
  Edit,
  Check,
  X,
  Plus
} from 'lucide-react';
import Cookies from 'js-cookie';

const BookingModal = ({ isOpen, onClose, booking, onSave, venues = [] }) => {
  const [formData, setFormData] = useState({
    venueId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    totalAmount: '',
    notes: ''
  });

  useEffect(() => {
    if (booking) {
      setFormData({
        venueId: booking.venue_id || '',
        customerName: booking.customer_name || '',
        customerEmail: booking.customer_email || '',
        customerPhone: booking.customer_phone || '',
        bookingDate: booking.booking_date ? booking.booking_date.split('T')[0] : '',
        startTime: booking.start_time || '',
        endTime: booking.end_time || '',
        totalAmount: booking.total_amount || '',
        notes: booking.notes || ''
      });
    } else {
      setFormData({
        venueId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
        totalAmount: '',
        notes: ''
      });
    }
  }, [booking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {booking ? 'Edit Booking' : 'Add New Booking'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue
              </label>
              <select
                required
                value={formData.venueId}
                onChange={(e) => setFormData({...formData, venueId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.location}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Date
              </label>
              <input
                type="date"
                required
                value={formData.bookingDate}
                onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Phone
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {booking ? 'Update' : 'Create'} Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onEdit, onUpdateStatus, onUpdatePayment, user }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.venue_name}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin size={14} className="mr-1" />
            {booking.venue_location}
          </div>
          {user?.role === 'admin' && booking.vendor_name && (
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Vendor:</span> {booking.vendor_name}
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.booking_status)}`}>
            {booking.booking_status}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
            {booking.payment_status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <User size={14} className="mr-2 text-gray-400" />
          <span className="font-medium">{booking.customer_name}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail size={14} className="mr-2 text-gray-400" />
          {booking.customer_email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone size={14} className="mr-2 text-gray-400" />
          {booking.customer_phone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Calendar size={14} className="mr-2 text-gray-400" />
          {new Date(booking.booking_date).toLocaleDateString()}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={14} className="mr-2 text-gray-400" />
          {booking.start_time} - {booking.end_time}
        </div>
        <div className="flex items-center text-sm text-gray-900 font-semibold">
          <DollarSign size={14} className="mr-2 text-gray-400" />
          ₹{booking.total_amount}
        </div>
      </div>

      {booking.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">{booking.notes}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {booking.booking_status === 'confirmed' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              <Check size={12} className="mr-1" />
              Complete
            </button>
          )}
          {booking.booking_status !== 'cancelled' && (
            <button
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              <X size={12} className="mr-1" />
              Cancel
            </button>
          )}
          {booking.payment_status === 'pending' && (
            <button
              onClick={() => onUpdatePayment(booking.id, 'paid')}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <DollarSign size={12} className="mr-1" />
              Confirm Payment
            </button>
          )}
        </div>
        <button
          onClick={() => onEdit(booking)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Edit size={16} />
        </button>
      </div>
    </div>
  );
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchBookings = async () => {
    try {
      const token = Cookies.get('token');
      let url = '/api/bookings';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (dateFilter) {
        params.append('date', dateFilter);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/venues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setVenues(data.venues);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchVenues();
  }, [statusFilter, dateFilter]);

  const handleSave = async (formData) => {
    try {
      const token = Cookies.get('token');
      const url = selectedBooking ? `/api/bookings/${selectedBooking.id}` : '/api/bookings';
      const method = selectedBooking ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setSelectedBooking(null);
        fetchBookings();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Failed to save booking');
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingStatus: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBookings();
      } else {
        alert(data.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const handleUpdatePayment = async (bookingId, paymentStatus) => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBookings();
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <DashboardLayout pageTitle="Booking Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Manage all venue bookings and payments' 
                : 'Manage bookings for your venues'
              }
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedBooking(null);
              setShowModal(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Booking
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onEdit={(booking) => {
                  setSelectedBooking(booking);
                  setShowModal(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePayment={handleUpdatePayment}
                user={user}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Get started by adding a new booking.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onSave={handleSave}
          venues={venues}
        />
      </div>
    </DashboardLayout>
  );
}
