import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authAPI, usersAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [resumeInfo, setResumeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: (user as any).phone || '' });
      // compute avatar URL if available
      if (user.profilePicture) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        setProfilePictureUrl(`${apiUrl}/uploads/profiles/${user._id}/${user.profilePicture}`);
      } else {
        setProfilePictureUrl(null);
      }
      // load resume info only for candidates (avoid 403 for other roles)
      if (user.role === 'candidate') {
        usersAPI.getResumeInfo()
          .then(res => setResumeInfo(res.data.data?.resume))
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    try {
      const res = await authAPI.updateProfile({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone });
      const updatedUser = res.data.data?.user;
      if (updatedUser) updateUser(updatedUser);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    }
  };

  const uploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const uploaded = await usersAPI.uploadResume(file);
      const info = await usersAPI.getResumeInfo();
      setResumeInfo(info.data.data?.resume);
      if (uploaded.data?.data?.profileCompletion !== undefined) {
        updateUser({ profileCompletion: uploaded.data.data.profileCompletion });
      }
      toast.success('Resume uploaded');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const uploadProfilePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const res = await usersAPI.uploadProfilePicture(file);
      const data = res.data.data;
      if (data?.profilePicture) {
        // Update local auth user and picture URL
        updateUser({ profilePicture: data.profilePicture, profileCompletion: data.profileCompletion });
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        setProfilePictureUrl(data.profilePictureUrl || `${apiUrl}/uploads/profiles/${user?._id}/${data.profilePicture}`);
      }
      toast.success('Profile picture updated');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const completion = user?.profileCompletion ?? 0;

  const tasks: { label: string; done: boolean }[] = [
    { label: 'Add phone number', done: !!form.phone },
    { label: 'Upload profile picture', done: !!(user as any)?.profilePicture },
  ];
  if (user?.role === 'candidate') {
    tasks.push(
      { label: 'Upload resume', done: !!resumeInfo },
      { label: 'Resume has skills', done: Array.isArray(resumeInfo?.skills) && resumeInfo.skills.length > 0 },
    );
  }
  if (user?.role === 'recruiter') {
    tasks.push({ label: 'Company', done: !!(user as any).company });
    tasks.push({ label: 'Department', done: !!(user as any).department });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Completion */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <div className="text-sm text-gray-600">Completion: <span className="font-semibold text-gray-900">{completion}%</span></div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completion}%` }} />
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">First Name</label>
              <input name="firstName" value={form.firstName} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
          </div>
        </div>

        {/* Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user?.role === 'candidate' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>
              {resumeInfo ? (
                <div className="text-sm text-gray-700 mb-3">
                  <div><span className="font-medium">File:</span> {resumeInfo.originalName}</div>
                  <div><span className="font-medium">Uploaded:</span> {new Date(resumeInfo.uploadDate).toLocaleString()}</div>
                  <div><span className="font-medium">Skills:</span> {(resumeInfo.skills || []).slice(0,8).join(', ') || 'N/A'}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 mb-3">No resume uploaded yet.</div>
              )}
              <label className="inline-block">
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={uploadResume} />
                <span className={`px-4 py-2 rounded cursor-pointer ${uploadingResume ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {uploadingResume ? 'Uploading...' : 'Upload / Replace Resume'}
                </span>
              </label>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-gray-500 text-sm">No image</div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Recommended: square image, max 2MB.
              </div>
            </div>
            <label className="inline-block">
              <input type="file" accept="image/*" className="hidden" onChange={uploadProfilePicture} />
              <span className={`px-4 py-2 rounded cursor-pointer ${uploadingPicture ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {uploadingPicture ? 'Uploading...' : 'Upload Picture'}
              </span>
            </label>
          </div>
        </div>

        {/* Complete your profile checklist */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Profile</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tasks.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${t.done ? 'bg-green-600' : 'bg-gray-300'}`} />
                <span className={t.done ? 'text-gray-700' : 'text-gray-900'}>{t.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
