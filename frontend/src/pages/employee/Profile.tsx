import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { 
  User, 
  Building2, 
  Briefcase, 
  DollarSign, 
  Calendar,
  Edit,
  Save,
  X
} from 'lucide-react';
import { EmployeeProfile } from '../../types';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.employee.getProfile();
      const profileData = response.data.employeeProfile;
      if (profileData) {
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone || '',
          address: profileData.address || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
    });
  };

  const handleSave = async () => {
    try {
      const response = await api.employee.updateProfile(formData);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      updateUser({
        employeeProfile: updatedProfile,
      });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
        <p className="text-gray-600 mt-2">Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information</p>
        </div>
        {!editing ? (
          <button
            onClick={handleEdit}
            className="btn btn-primary"
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="input"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.phone || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                {editing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Work Information */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Work Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Department</p>
                  <p className="text-sm text-gray-900">{profile.department || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Position</p>
                  <p className="text-sm text-gray-900">{profile.position || 'Not assigned'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Salary</p>
                  <p className="text-sm text-gray-900">
                    {profile.salary ? `$${profile.salary.toLocaleString()}` : 'Not disclosed'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Hire Date</p>
                  <p className="text-sm text-gray-900">
                    {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
              </div>
              {profile.employeeId && (
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Employee ID</p>
                    <p className="text-sm text-gray-900">{profile.employeeId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Stats</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Leaves</span>
                  <span className="text-sm font-medium text-gray-900">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending Leaves</span>
                  <span className="text-sm font-medium text-gray-900">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved Leaves</span>
                  <span className="text-sm font-medium text-gray-900">10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month Attendance</span>
                  <span className="text-sm font-medium text-gray-900">18/20 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
