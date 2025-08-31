'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MapPin,
  DollarSign,
  Users,
  Filter,
  Building
} from 'lucide-react';
import Cookies from 'js-cookie';

const VenueModal = ({ isOpen, onClose, venue, onSave, vendors = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    vendorId: '',
    sports: [],
    basePrice: '',
    peakPrice: '',
    capacity: '',
    facilities: [],
    status: 'active'
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        location: venue.location || '',
        description: venue.description || '',
        vendorId: venue.vendor_id || '',
        sports: venue.sports ? (Array.isArray(venue.sports) ? venue.sports : venue.sports.split(',')) : [],
        basePrice: venue.base_price || '',
        peakPrice: venue.peak_price || '',
        capacity: venue.capacity || '',
        facilities: venue.facilities || [],
        status: venue.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        location: '',
        description: '',
        vendorId: user?.role === 'vendor' ? user.id : '',
        sports: [],
        basePrice: '',
        peakPrice: '',
        capacity: '',
        facilities: [],
        status: 'active'
      });
    }
  }, [venue, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const facilityOptions = [
    'Parking', 'Restrooms', 'Changing Rooms', 'Equipment Rental', 
    'Lighting', 'Seating', 'Cafeteria', 'First Aid', 'WiFi', 'Air Conditioning'
  ];

  const toggleFacility = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  required
                  value={formData.vendorId}
                  onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sports Available
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
              {['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Swimming', 'Volleyball', 'Hockey', 'Table Tennis', 'Squash'].map(sport => (
                <label key={sport} className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.sports.includes(sport)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, sports: [...formData.sports, sport]});
                      } else {
                        setFormData({...formData, sports: formData.sports.filter(s => s !== sport)});
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{sport}</span>
                </label>
              ))}
            </div>
            {formData.sports.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Please select at least one sport</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (₹/hour)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peak Price (₹/hour)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.peakPrice}
                onChange={(e) => setFormData({...formData, peakPrice: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facilities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {facilityOptions.map(facility => (
                <label key={facility} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => toggleFacility(facility)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{facility}</span>
                </label>
              ))}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

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
              {venue ? 'Update' : 'Create'} Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function VenuesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Invalid user data:', error);
      router.push('/login');
      return;
    }
  }, [router]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    if (user?.role === 'admin') {
      try {
        const token = Cookies.get('token');
        const response = await fetch('/api/vendors', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setVendors(data.vendors);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchVendors();
  }, [user]);

  const handleSave = async (formData) => {
    try {
      const token = Cookies.get('token');
      const url = selectedVenue ? `/api/venues/${selectedVenue.id}` : '/api/venues';
      const method = selectedVenue ? 'PUT' : 'POST';

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
        setSelectedVenue(null);
        fetchVenues();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      alert('Failed to save venue');
    }
  };

  const handleDelete = async (venue) => {
    if (!confirm(`Are you sure you want to delete venue "${venue.name}"?`)) {
      return;
    }

    try {
      const token = Cookies.get('token');
      const response = await fetch(`/api/venues/${venue.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        fetchVenues();
      } else {
        alert(data.error || 'Failed to delete venue');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      alert('Failed to delete venue');
    }
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || venue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout pageTitle={user?.role === 'admin' ? 'Venue Management' : 'My Venues'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === 'admin' ? 'All Venues' : 'My Venues'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Manage all sports venues across the platform' 
                : 'Manage your sports venues and pricing'
              }
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedVenue(null);
              setShowModal(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Add Venue
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search venues..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <div key={venue.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin size={14} className="mr-1" />
                        {venue.location}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      venue.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {venue.status}
                    </span>
                  </div>

                  {venue.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{venue.description}</p>
                  )}

                  {user?.role === 'admin' && venue.vendor_name && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Vendor:</span> {venue.vendor_name}
                    </div>
                  )}

                  {venue.sports && venue.sports.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Sports Available:</p>
                      <div className="flex flex-wrap gap-1">
                        {venue.sports.slice(0, 3).map(sport => (
                          <span key={sport} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                            {sport}
                          </span>
                        ))}
                        {venue.sports.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{venue.sports.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <DollarSign size={14} className="mr-1" />
                        Base Price
                      </div>
                      <span className="font-semibold text-gray-900">₹{venue.base_price}/hour</span>
                    </div>
                    {venue.peak_price && venue.peak_price !== venue.base_price && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <DollarSign size={14} className="mr-1" />
                          Peak Price
                        </div>
                        <span className="font-semibold text-gray-900">₹{venue.peak_price}/hour</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users size={14} className="mr-1" />
                        Capacity
                      </div>
                      <span className="font-semibold text-gray-900">{venue.capacity} people</span>
                    </div>
                  </div>

                  {venue.facilities && venue.facilities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Facilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {venue.facilities.slice(0, 3).map(facility => (
                          <span key={facility} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {facility}
                          </span>
                        ))}
                        {venue.facilities.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{venue.facilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedVenue(venue);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(venue)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No venues found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new venue.'}
              </p>
            </div>
          )}
        </div>

        {/* Venue Modal */}
        <VenueModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedVenue(null);
          }}
          venue={selectedVenue}
          onSave={handleSave}
          vendors={vendors}
        />
      </div>
    </DashboardLayout>
  );
}
