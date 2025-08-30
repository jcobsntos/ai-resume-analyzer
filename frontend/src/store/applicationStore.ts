import { create } from 'zustand';
import { Application, ApplicationStatus, ApplicationFilters, PaginatedResponse } from '@/types';
import { applicationsAPI, usersAPI } from '@/services/api';
import api from '@/services/api';
import toast from 'react-hot-toast';

// TTL caches to reduce duplicate requests and 429s
const APPS_FETCH_TTL = 15000; // 15s
const STATS_FETCH_TTL = 30000; // 30s
let lastAppsAt = 0;
let lastAppsKey = '';
let lastStatsAt = 0;

interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  totalApplications: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: ApplicationFilters;
  stats: {
    total: number;
    pending: number;
    reviewing: number;
    interviewing: number;
    hired: number;
    rejected: number;
  };
}

interface ApplicationActions {
  fetchApplications: (page?: number, filters?: ApplicationFilters) => Promise<void>;
  fetchApplicationById: (id: string) => Promise<void>;
  applyToJob: (jobId: string, resumeFile?: File) => Promise<boolean>;
  updateApplicationStatus: (id: string, status: ApplicationStatus, note?: string) => Promise<boolean>;
  addNote: (id: string, note: string) => Promise<boolean>;
  scheduleInterview: (id: string, interviewData: any) => Promise<boolean>;
  withdrawApplication: (id: string) => Promise<boolean>;
  reAnalyzeApplication: (id: string) => Promise<boolean>;
  bulkUpdateStatus: (applicationIds: string[], status: ApplicationStatus, note?: string) => Promise<boolean>;
  deleteApplication: (id: string) => Promise<boolean>;
  bulkDeleteApplications: (applicationIds: string[]) => Promise<boolean>;
  fetchStats: (force?: boolean) => Promise<void>;
  setFilters: (filters: Partial<ApplicationFilters>) => void;
  clearFilters: () => void;
  setCurrentApplication: (application: Application | null) => void;
  clearError: () => void;
}

type ApplicationStore = ApplicationState & ApplicationActions;

const initialFilters: ApplicationFilters = {
  status: '',
  jobId: '',
  dateRange: {
    startDate: '',
    endDate: '',
  },
  aiScoreMin: undefined,
  aiScoreMax: undefined,
};

const initialStats = {
  total: 0,
  pending: 0,
  reviewing: 0,
  interviewing: 0,
  hired: 0,
  rejected: 0,
};

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  // State
  applications: [],
  currentApplication: null,
  totalApplications: 0,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,
  filters: initialFilters,
  stats: initialStats,

  // Actions
  fetchApplications: async (page = 1, filters) => {
    const currentFilters = filters || get().filters;
    const key = JSON.stringify({ page, filters: currentFilters });
    const now = Date.now();
    if (key === lastAppsKey && now - lastAppsAt < APPS_FETCH_TTL) {
      return; // skip duplicate fetch within TTL
    }

    set({ isLoading: true, error: null });
    
    try {
      // Determine role from persisted user (avoid circular imports)
      let role: string | undefined;
      try {
        const u = localStorage.getItem('user');
        role = u ? (JSON.parse(u)?.role as string | undefined) : undefined;
      } catch {}

      // Map UI status to backend status codes
      const mapStatus = (s?: string) => {
        if (!s) return '';
        const map: Record<string, string> = {
          pending: 'applied',
          reviewing: 'screening',
          interviewing: 'interview',
        };
        return map[s] || s;
      };

      const backendStatus = mapStatus(currentFilters.status);

      // Build params explicitly per role
      const baseParams: any = { page, limit: 10 };
      if (backendStatus) baseParams.status = backendStatus;
      if (currentFilters.jobId) baseParams.jobId = currentFilters.jobId;

      let response;
      if (role === 'recruiter' || role === 'admin') {
        if (currentFilters.aiScoreMin !== undefined) baseParams.minScore = currentFilters.aiScoreMin;
        if (currentFilters.aiScoreMax !== undefined) baseParams.maxScore = currentFilters.aiScoreMax;
        response = await applicationsAPI.getApplications(baseParams);
      } else {
        response = await applicationsAPI.getMyApplications(baseParams);
      }
      
      // Handle different response structures
      let applicationsData: Application[] = [];
      let totalApplications = 0;
      let currentPage = page;
      let totalPages = 0;
      
      const data: any = response.data.data;
      if (data && Array.isArray(data.docs)) {
        // Paginated response
        const paged = data as PaginatedResponse<Application>;
        applicationsData = paged.docs;
        totalApplications = paged.totalDocs;
        currentPage = paged.page;
        totalPages = paged.totalPages;
      } else if (data && Array.isArray(data.applications)) {
        // Applications array response
        applicationsData = data.applications as Application[];
        totalApplications = applicationsData.length;
        currentPage = page;
        totalPages = Math.ceil(totalApplications / 10);
      } else if (Array.isArray(data)) {
        // Direct array response
        applicationsData = data as Application[];
        totalApplications = applicationsData.length;
        currentPage = page;
        totalPages = Math.ceil(totalApplications / 10);
      }
      
      set({
        applications: applicationsData,
        totalApplications,
        currentPage,
        totalPages,
        isLoading: false,
        error: null,
      });
      lastAppsKey = key;
      lastAppsAt = now;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch applications';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  fetchApplicationById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await applicationsAPI.getApplication(id);
      const application = (response.data.data?.application || response.data.data) as Application;
      
      set({
        currentApplication: application,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch application';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  applyToJob: async (jobId, resumeFile) => {
    set({ isLoading: true, error: null });
    
    try {
      const applicationData: any = { jobId };
      
      // If resume file is provided, handle upload via FormData
      if (resumeFile) {
        // First upload/replace resume on user profile
        await usersAPI.uploadResume(resumeFile);
        // Then apply with JSON payload
        const response = await applicationsAPI.apply({ jobId });
        const newApplication = response.data.data.application;
        
        set(state => ({
          applications: [newApplication, ...state.applications],
          totalApplications: state.totalApplications + 1,
          isLoading: false,
          error: null,
        }));
        // Refresh stats to reflect new totals immediately
        await get().fetchStats(true);
        
        return true;
      } else {
        // Apply without resume
        const response = await applicationsAPI.apply(applicationData);
        const newApplication = response.data.data.application;
        
        set(state => ({
          applications: [newApplication, ...state.applications],
          totalApplications: state.totalApplications + 1,
          isLoading: false,
          error: null,
        }));
        // Refresh stats to reflect new totals immediately
        await get().fetchStats(true);
        
        return true;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit application';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  updateApplicationStatus: async (id, status, note) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await applicationsAPI.updateApplicationStatus(id, status, note);
      const updatedApplication = response.data.data.application;
      
      set(state => ({
        applications: state.applications.map(app => 
          app._id === id ? updatedApplication : app
        ),
        currentApplication: state.currentApplication?._id === id ? updatedApplication : state.currentApplication,
        isLoading: false,
        error: null,
      }));
      
      // Stats could shift between buckets
      await get().fetchStats(true);
      
      // Notify analytics store to refresh
      window.dispatchEvent(new CustomEvent('applicationStatusChanged', {
        detail: { applicationId: id, newStatus: status }
      }));
      
      toast.success('Application status updated successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update application status';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  addNote: async (id, note) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await applicationsAPI.addRecruiterNote(id, note);
      const updatedApplication = response.data.data;
      
      set(state => ({
        applications: state.applications.map(app => 
          app._id === id ? updatedApplication : app
        ),
        currentApplication: state.currentApplication?._id === id ? updatedApplication : state.currentApplication,
        isLoading: false,
        error: null,
      }));
      
      toast.success('Note added successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add note';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  scheduleInterview: async (id, interviewData) => {
    set({ isLoading: true, error: null });
    
    try {
      await applicationsAPI.scheduleInterview(id, interviewData);
      // Refresh the specific application and stats to keep UI consistent
      await get().fetchApplicationById(id);
      await get().fetchStats(true);
      set({ isLoading: false, error: null });
      toast.success('Interview scheduled successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to schedule interview';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  withdrawApplication: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await applicationsAPI.withdrawApplication(id);
      
      set(state => ({
        applications: state.applications.filter(app => app._id !== id),
        totalApplications: Math.max(0, state.totalApplications - 1),
        currentApplication: state.currentApplication?._id === id ? null : state.currentApplication,
        isLoading: false,
        error: null,
      }));
      
      // Refresh stats to reflect changes
      await get().fetchStats(true);
      toast.success('Application withdrawn successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to withdraw application';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  reAnalyzeApplication: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await applicationsAPI.reAnalyzeApplication(id);
      const aiAnalysis = response.data.data.aiAnalysis;
      
      set(state => ({
        applications: state.applications.map(app => 
          app._id === id ? { ...app, aiAnalysis } as Application : app
        ),
        currentApplication: state.currentApplication?._id === id ? { ...(state.currentApplication as Application), aiAnalysis } : state.currentApplication,
        isLoading: false,
        error: null,
      }));
      
      toast.success('Application re-analyzed successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to re-analyze application';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  bulkUpdateStatus: async (applicationIds, status, note) => {
    set({ isLoading: true, error: null });
    
    try {
      await applicationsAPI.bulkUpdateStatus(applicationIds, status, note);
      // After a bulk action, refresh list and stats for accurate counts/buckets
      await get().fetchApplications(get().currentPage, get().filters);
      await get().fetchStats(true);
      set({ isLoading: false, error: null });
      toast.success(`${applicationIds.length} applications updated successfully!`);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to bulk update applications';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  fetchStats: async (force = false) => {
    const now = Date.now();
    if (!force && now - lastStatsAt < STATS_FETCH_TTL) {
      return; // skip duplicate within TTL
    }
    try {
      const response = await applicationsAPI.getApplicationStats();
      const statsData = response.data.data;

      const byStatus: Record<string, number> = statsData?.stats || {};
      const total = statsData?.summary?.total || 0;
      
      // Map backend statuses to dashboard buckets
      const stats = {
        total: total || 0,
        pending: (byStatus.applied || 0),
        reviewing: (byStatus.screening || 0) + (byStatus.shortlisted || 0) + (byStatus.offer || 0),
        interviewing: (byStatus.interview || 0),
        hired: (byStatus.hired || 0),
        rejected: (byStatus.rejected || 0),
      };
      
      set({ stats });
      lastStatsAt = now;
    } catch (error: any) {
      // Quietly fallback to defaults without console noise
      set({ stats: initialStats });
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    
    // Automatically refetch with new filters
    get().fetchApplications(1, updatedFilters);
  },

  clearFilters: () => {
    set({ filters: initialFilters });
    get().fetchApplications(1, initialFilters);
  },

  setCurrentApplication: (application) => {
    set({ currentApplication: application });
  },

  clearError: () => {
    set({ error: null });
  },

  deleteApplication: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await applicationsAPI.deleteApplication(id);
      
      set(state => ({
        applications: state.applications.filter(app => app._id !== id),
        totalApplications: Math.max(0, state.totalApplications - 1),
        currentApplication: state.currentApplication?._id === id ? null : state.currentApplication,
        isLoading: false,
        error: null,
      }));
      
      // Refresh stats to reflect changes
      await get().fetchStats(true);
      toast.success('Application deleted successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete application';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  bulkDeleteApplications: async (applicationIds) => {
    set({ isLoading: true, error: null });
    
    try {
      await applicationsAPI.bulkDeleteApplications(applicationIds);
      // After bulk delete, refresh list and stats for accurate counts
      await get().fetchApplications(get().currentPage, get().filters);
      await get().fetchStats(true);
      set({ isLoading: false, error: null });
      toast.success(`${applicationIds.length} applications deleted successfully!`);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to bulk delete applications';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },
}));
