import React, { useState } from 'react';
import { 
  Save, 
  Building2, 
  Clock, 
  Calendar,
  Bell,
  Shield,
  Database
} from 'lucide-react';
import { CompanySettings } from '../../types';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    id: 'company-settings',
    companyName: 'TechCorp Solutions',
    companyEmail: 'info@techcorp.com',
    companyPhone: '+1-555-0123',
    companyAddress: '123 Business Ave, Tech City, TC 12345',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    leavePolicy: {
      annualLeave: 20,
      sickLeave: 10,
      personalLeave: 5,
      maternityLeave: 90,
      paternityLeave: 14,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  const handleSave = async () => {
    try {
      setLoading(true);
      // Implement save settings API call
      console.log('Saving settings:', settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLeavePolicyChange = (field: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      leavePolicy: {
        ...prev.leavePolicy!,
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'company', name: 'Company Info', icon: Building2 },
    { id: 'working-hours', name: 'Working Hours', icon: Clock },
    { id: 'leave-policy', name: 'Leave Policy', icon: Calendar },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and policies</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-5 w-5 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Email</label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Phone</label>
                  <input
                    type="tel"
                    value={settings.companyPhone || ''}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Address</label>
                  <textarea
                    value={settings.companyAddress || ''}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'working-hours' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Working Hours</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(e) => handleInputChange('workingHoursStart', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(e) => handleInputChange('workingHoursEnd', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.workingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('workingDays', [...settings.workingDays, day]);
                          } else {
                            handleInputChange('workingDays', settings.workingDays.filter(d => d !== day));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave-policy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Leave Policy</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Annual Leave (days)</label>
                  <input
                    type="number"
                    value={settings.leavePolicy?.annualLeave || 0}
                    onChange={(e) => handleLeavePolicyChange('annualLeave', parseInt(e.target.value))}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sick Leave (days)</label>
                  <input
                    type="number"
                    value={settings.leavePolicy?.sickLeave || 0}
                    onChange={(e) => handleLeavePolicyChange('sickLeave', parseInt(e.target.value))}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Leave (days)</label>
                  <input
                    type="number"
                    value={settings.leavePolicy?.personalLeave || 0}
                    onChange={(e) => handleLeavePolicyChange('personalLeave', parseInt(e.target.value))}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maternity Leave (days)</label>
                  <input
                    type="number"
                    value={settings.leavePolicy?.maternityLeave || 0}
                    onChange={(e) => handleLeavePolicyChange('maternityLeave', parseInt(e.target.value))}
                    className="input"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paternity Leave (days)</label>
                  <input
                    type="number"
                    value={settings.leavePolicy?.paternityLeave || 0}
                    onChange={(e) => handleLeavePolicyChange('paternityLeave', parseInt(e.target.value))}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Send email notifications for important events</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Leave Request Notifications</h4>
                    <p className="text-sm text-gray-500">Notify HR when leave requests are submitted</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Attendance Reminders</h4>
                    <p className="text-sm text-gray-500">Send reminders for attendance check-in/out</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                    <p className="text-sm text-gray-500">Receive alerts for system issues and updates</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password Policy</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Minimum 8 characters</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Require uppercase letter</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Require lowercase letter</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                      <span className="ml-2 text-sm text-gray-700">Require number</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input type="number" defaultValue="30" className="input" min="5" max="480" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <span className="ml-2 text-sm text-gray-700">Enable 2FA for all users</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">System Information</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">System Version</label>
                  <input type="text" value="HRMS v1.0.0" className="input" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Database Version</label>
                  <input type="text" value="PostgreSQL 15.0" className="input" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Backup</label>
                  <input type="text" value="2023-12-13 10:30:00" className="input" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">System Status</label>
                  <input type="text" value="Healthy" className="input" disabled />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">System Actions</h4>
                <div className="flex space-x-3">
                  <button className="btn btn-secondary">Backup Database</button>
                  <button className="btn btn-secondary">Clear Cache</button>
                  <button className="btn btn-secondary">System Health Check</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
