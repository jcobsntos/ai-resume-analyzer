import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { 
  User, 
  Job, 
  Application, 
  ApiResponse, 
  LoginFormData, 
  RegisterFormData,
  JobFormData,
  ApplicationFormData,
  JobFilters,
  ApplicationFilters,
  DashboardAnalytics
} from '@/types';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
let lastRateLimitToastAt = 0;
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An error occurred';

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (status === 429) {
      const now = Date.now();
      if (now - lastRateLimitToastAt > 60_000) {
        toast.error('Server is busy. Please try again shortly.');
        lastRateLimitToastAt = now;
      }
      // Avoid spamming user with repeated 429 errors
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (status && status >= 400) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (data: LoginFormData): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> => 
    api.post('/auth/login', data),
    
  register: (data: RegisterFormData): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> => 
    api.post('/auth/register', data),
    
  logout: (): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.post('/auth/logout'),
    
  getProfile: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => 
    api.get('/auth/me'),
    
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => 
    api.patch('/auth/updateMe', data),
    
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => 
    api.patch('/auth/updatePassword', data),
};

// Users API
export const usersAPI = {
  uploadResume: (file: File): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();
    formData.append('resume', file);
    // Do not set Content-Type explicitly; let the browser set the boundary
    return api.post('/users/resume', formData);
  },
  
  uploadProfilePicture: (file: File): Promise<AxiosResponse<ApiResponse<any>>> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    // Do not set Content-Type explicitly; let the browser set the boundary
    return api.post('/users/profile-picture', formData);
  },
  
  getResumeInfo: (): Promise<AxiosResponse<ApiResponse<{ resume: any }>>> => 
    api.get('/users/resume/info'),
    
  downloadResume: (): Promise<AxiosResponse<Blob>> => 
    api.get('/users/resume/download', { responseType: 'blob' }),
    
  deleteResume: (): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete('/users/resume'),
    
  deleteProfilePicture: (): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete('/users/profile-picture'),
    
  downloadCandidateResume: (userId: string): Promise<AxiosResponse<Blob>> => 
    api.get(`/users/${userId}/resume/download`, { responseType: 'blob' }),
};

// Jobs API
export const jobsAPI = {
  getJobs: (filters?: JobFilters): Promise<AxiosResponse<ApiResponse<{ jobs: Job[] }>>> => 
    api.get('/jobs', { params: filters }),
    
  getJob: (id: string): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> => 
    api.get(`/jobs/${id}`),
    
  getJobBySlug: (slug: string): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> => 
    api.get(`/jobs/slug/${slug}`),
    
  createJob: (data: JobFormData): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> => 
    api.post('/jobs', data),
    
  updateJob: (id: string, data: Partial<JobFormData>): Promise<AxiosResponse<ApiResponse<{ job: Job }>>> => 
    api.patch(`/jobs/${id}`, data),
    
  deleteJob: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/jobs/${id}`),
    
  getJobApplications: (id: string, filters?: ApplicationFilters): Promise<AxiosResponse<ApiResponse<{ job: Job; applications: Application[] }>>> => 
    api.get(`/jobs/${id}/applications`, { params: filters }),
    
  getSimilarJobs: (id: string): Promise<AxiosResponse<ApiResponse<{ similarJobs: Job[] }>>> => 
    api.get(`/jobs/${id}/similar`),
    
  searchJobs: (query: string, filters?: Partial<JobFilters>): Promise<AxiosResponse<ApiResponse<{ jobs: Job[] }>>> => 
    api.post('/jobs/search', { query, filters }),
    
  getJobStats: (): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get('/jobs/stats/overview'),
};

// Applications API
export const applicationsAPI = {
  apply: (data: ApplicationFormData): Promise<AxiosResponse<ApiResponse<{ application: Application }>>> => 
    api.post('/applications/apply', data),
    
  getApplications: (filters?: ApplicationFilters): Promise<AxiosResponse<ApiResponse<{ applications: Application[] }>>> => 
    api.get('/applications', { params: filters }),
    
  getMyApplications: (filters?: ApplicationFilters): Promise<AxiosResponse<ApiResponse<{ applications: Application[] }>>> => 
    api.get('/applications/my-applications', { params: filters }),
    
  getApplication: (id: string): Promise<AxiosResponse<ApiResponse<{ application: Application }>>> => 
    api.get(`/applications/${id}`),
    
  updateApplicationStatus: (id: string, status: string, notes?: string): Promise<AxiosResponse<ApiResponse<{ application: Application }>>> => 
    api.patch(`/applications/${id}/status`, { status, notes }),
    
  withdrawApplication: (id: string): Promise<AxiosResponse<ApiResponse<{ application: Application }>>> => 
    api.patch(`/applications/${id}/withdraw`),
    
  addRecruiterNote: (id: string, note: string, isPrivate?: boolean): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post(`/applications/${id}/notes`, { note, isPrivate }),
    
  scheduleInterview: (id: string, interviewData: any): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.post(`/applications/${id}/interview`, interviewData),
    
  reAnalyzeApplication: (id: string): Promise<AxiosResponse<ApiResponse<{ aiAnalysis: any }>>> => 
    api.post(`/applications/${id}/re-analyze`),
    
  bulkUpdateStatus: (applicationIds: string[], status: string, notes?: string): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.patch('/applications/bulk/status', { applicationIds, status, notes }),
    
  getApplicationStats: (): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get('/applications/stats'),
    
  deleteApplication: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/applications/${id}`),
    
  bulkDeleteApplications: (applicationIds: string[]): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.delete('/applications/bulk', { data: { applicationIds } }),
};

// Analytics API
export const analyticsAPI = {
  getDashboardAnalytics: (timeRange?: number): Promise<AxiosResponse<ApiResponse<{ analytics: DashboardAnalytics }>>> => 
    api.get('/analytics/dashboard', { params: { timeRange } }),
    
  getRecruitmentFunnel: (): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get('/analytics/funnel'),
    
  getTopCandidates: (limit?: number, minScore?: number): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get('/analytics/top-candidates', { params: { limit, minScore } }),
};

// Admin API (for user management)
export const adminAPI = {
  getUsers: (filters?: any): Promise<AxiosResponse<ApiResponse<{ users: User[] }>>> => 
    api.get('/auth/users', { params: filters }),
    
  getUser: (id: string): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => 
    api.get(`/auth/users/${id}`),
    
  updateUser: (id: string, data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> => 
    api.patch(`/auth/users/${id}`, data),
    
  deleteUser: (id: string): Promise<AxiosResponse<ApiResponse<null>>> => 
    api.delete(`/auth/users/${id}`),
    
  getUserStats: (): Promise<AxiosResponse<ApiResponse<any>>> => 
    api.get('/auth/users/stats'),
};

// Utility functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    return error.response.data.errors.map((e: any) => e.message).join(', ');
  }
  return error.message || 'An unexpected error occurred';
};

// Anti-IDM download function using iframe method
const downloadViaIframe = (url: string, filename: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  // Remove iframe after download attempt
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
};

// Convert blob to base64 and download
const downloadViaDataURL = async (data: Blob, filename: string) => {
  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const link = document.createElement('a');
      link.href = reader.result as string;
      link.download = filename;
      link.style.display = 'none';
      link.setAttribute('data-bypass-idm', 'true');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve();
    };
    reader.onerror = reject;
    reader.readAsDataURL(data);
  });
};

export const downloadFile = async (data: Blob, filename: string) => {
  try {
    console.log('downloadFile called with:', { data, filename, size: data?.size, type: data?.type });
    
    // Check for IDM interference - if blob size is 0 and type is text/xml, it's likely IDM
    if (data?.size === 0 && data?.type?.includes('text/xml')) {
      console.log('IDM interference detected - trying fallback method');
      toast.error('IDM interference detected. Using fallback download method...');
      
      // Try alternative download method - use direct backend URL with iframe
      const token = localStorage.getItem('token');
      const backendURL = 'http://localhost:5000';
      
      // This is a simplified approach - we'll need to modify this based on the specific endpoint
      toast.error('Please disable IDM or use a browser without IDM extension for file downloads.');
      return;
    }
    
    // If server responded with an error JSON (e.g., 403/404), avoid saving a corrupted file
    if (data && data.type && data.type.includes('application/json')) {
      console.log('Response is JSON, checking for error...');
      const text = await (data as any).text();
      try {
        const json = JSON.parse(text);
        console.log('Error response JSON:', json);
        toast.error(json.message || 'Failed to download file');
      } catch {
        console.log('Could not parse JSON response');
        toast.error('Failed to download file');
      }
      return;
    }

    // Check if blob has actual content
    if (!data || data.size === 0) {
      console.log('Empty blob received');
      toast.error('Received empty file. This may be due to IDM interference or server error.');
      return;
    }

    console.log('Creating download blob with size:', data?.size);
    
    // Try multiple download methods to bypass IDM
    try {
      // Method 1: Base64 data URL (often bypasses IDM)
      await downloadViaDataURL(data, filename);
      console.log('Download via data URL successful for:', filename);
    } catch (e) {
      console.log('Data URL method failed, trying blob URL...');
      
      // Method 2: Standard blob URL (fallback)
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('data-no-external', 'true');
      link.setAttribute('data-bypass-idm', 'true');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('Download via blob URL initiated for:', filename);
    }
    
  } catch (e) {
    console.error('Download file error:', e);
    toast.error('Download failed');
  }
};

export default api;
