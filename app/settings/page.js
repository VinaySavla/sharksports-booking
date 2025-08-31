'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  User, 
  Mail, 
  Phone, 
  Key, 
  CreditCard, 
  Bell, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import Cookies from 'js-cookie';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const FormField = ({ icon: Icon, label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      <div className="flex items-center space-x-2">
        <Icon size={16} />
        <span>{label}</span>
      </div>
    </label>
    {children}
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({
    merchantKey: '',
    merchantSalt: '',
    environment: 'test'
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    bookingReminders: true,
    paymentAlerts: true
  });

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || ''
      });

      // Fetch payment config if user is admin
      if (parsedUser.role === 'admin') {
        fetchPaymentConfig();
      }
    }
    setLoading(false);
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/payment-config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.config) {
        setPaymentConfig({
          merchantKey: data.config.merchant_key || '',
          merchantSalt: data.config.merchant_salt || '',
          environment: data.config.environment || 'test'
        });
      }
    } catch (error) {
      console.error('Error fetching payment config:', error);
    }
  };

  const handlePaymentConfigSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/payment-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentConfig)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Payment configuration updated successfully');
      } else {
        alert(data.error || 'Failed to update payment configuration');
      }
    } catch (error) {
      console.error('Error updating payment config:', error);
      alert('Failed to update payment configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();
      
      if (data.success) {
        // Update stored user data
        Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
        setUser(data.user);
        alert('Profile updated successfully');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    setSaving(true);

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password updated successfully');
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-4">
              <TabButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </TabButton>
              <TabButton
                active={activeTab === 'password'}
                onClick={() => setActiveTab('password')}
              >
                Password
              </TabButton>
              <TabButton
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </TabButton>
              {user?.role === 'admin' && (
                <TabButton
                  active={activeTab === 'payments'}
                  onClick={() => setActiveTab('payments')}
                >
                  Payment Settings
                </TabButton>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField icon={User} label="Full Name">
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </FormField>

                  <FormField icon={Mail} label="Email Address">
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </FormField>
                </div>

                <FormField icon={Phone} label="Phone Number">
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </FormField>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <FormField icon={Key} label="Current Password">
                  <div className="relative">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>

                <FormField icon={Key} label="New Password">
                  <div className="relative">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>

                <FormField icon={Key} label="Confirm New Password">
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormField>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <FormField icon={Bell} label="Notification Preferences">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                        <p className="text-sm text-gray-500">Receive email updates about bookings and payments</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Push Notifications</span>
                        <p className="text-sm text-gray-500">Get instant notifications in your browser</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.bookingReminders}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          bookingReminders: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Booking Reminders</span>
                        <p className="text-sm text-gray-500">Reminders for upcoming bookings</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentAlerts}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          paymentAlerts: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Payment Alerts</span>
                        <p className="text-sm text-gray-500">Notifications for payment confirmations and failures</p>
                      </div>
                    </label>
                  </div>
                </FormField>

                <div className="pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Payment Settings Tab (Admin only) */}
            {activeTab === 'payments' && user?.role === 'admin' && (
              <div className="space-y-6">
                <FormField icon={CreditCard} label="PayU Integration">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> PayU integration is currently in development mode. 
                      Contact support to configure your live payment gateway.
                    </p>
                  </div>

                  <form onSubmit={handlePaymentConfigSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PayU Merchant Key
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.merchantKey}
                        onChange={(e) => setPaymentConfig(prev => ({ ...prev, merchantKey: e.target.value }))}
                        placeholder="Enter your PayU merchant key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PayU Salt
                      </label>
                      <input
                        type="password"
                        value={paymentConfig.merchantSalt}
                        onChange={(e) => setPaymentConfig(prev => ({ ...prev, merchantSalt: e.target.value }))}
                        placeholder="Enter your PayU salt"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Environment
                      </label>
                      <select
                        value={paymentConfig.environment}
                        onChange={(e) => setPaymentConfig(prev => ({ ...prev, environment: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="test">Test Environment</option>
                        <option value="live">Live Environment</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Saving...' : 'Save Payment Configuration'}
                      </button>
                    </div>
                  </form>
                </FormField>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700">User ID</p>
              <p className="text-sm text-gray-900 mt-1">#{user?.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Role</p>
              <p className="text-sm text-gray-900 mt-1 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Account Created</p>
              <p className="text-sm text-gray-900 mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
