import { create } from 'zustand';
import { Job, JobFilters, PaginatedResponse } from '@/types';
import { jobsAPI } from '@/services/api';
import toast from 'react-hot-toast';

// Simple TTL cache to avoid over-fetching in dev and reduce 429s
const JOBS_FETCH_TTL = 15000; // 15s
let lastJobsAt = 0;
let lastJobsKey = '';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: JobFilters;
}

interface JobActions {
  fetchJobs: (page?: number, filters?: JobFilters) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (jobData: Partial<Job>) => Promise<boolean>;
  updateJob: (id: string, jobData: Partial<Job>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
  searchJobs: (query: string) => Promise<void>;
  setFilters: (filters: Partial<JobFilters>) => void;
  clearFilters: () => void;
  setCurrentJob: (job: Job | null) => void;
  clearError: () => void;
}

type JobStore = JobState & JobActions;

const initialFilters: JobFilters = {
  location: '',
  department: '',
  employmentType: '',
  experienceLevel: '',
  salaryMin: undefined,
  salaryMax: undefined,
  isActive: true,
};

export const useJobStore = create<JobStore>((set, get) => ({
  // State
  jobs: [],
  currentJob: null,
  totalJobs: 0,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  error: null,
  filters: initialFilters,

  // Actions
  fetchJobs: async (page = 1, filters) => {
    const currentFilters = filters || get().filters;
    const key = JSON.stringify({ page, filters: currentFilters });
    const now = Date.now();
    if (key === lastJobsKey && now - lastJobsAt < JOBS_FETCH_TTL) {
      return; // skip duplicate fetch within TTL
    }

    set({ isLoading: true, error: null });
    
    try {
      const response = await jobsAPI.getJobs({
        page,
        limit: 10,
        ...currentFilters,
      });
      
      // Handle different response structures
      let jobsData: Job[] = [];
      let totalJobs = 0;
      let currentPage = page;
      let totalPages = 0;
      
      const data: any = response.data.data;
      if (data && Array.isArray(data.docs)) {
        // Paginated response
        const paged = data as PaginatedResponse<Job>;
        jobsData = paged.docs;
        totalJobs = paged.totalDocs;
        currentPage = paged.page;
        totalPages = paged.totalPages;
      } else if (data && Array.isArray(data.jobs)) {
        // Jobs array response
        jobsData = data.jobs as Job[];
        totalJobs = jobsData.length;
        currentPage = page;
        totalPages = Math.ceil(totalJobs / 10);
      } else if (Array.isArray(data)) {
        // Direct array response
        jobsData = data as Job[];
        totalJobs = jobsData.length;
        currentPage = page;
        totalPages = Math.ceil(totalJobs / 10);
      }
      
      set({
        jobs: jobsData,
        totalJobs,
        currentPage,
        totalPages,
        isLoading: false,
        error: null,
      });
      lastJobsKey = key;
      lastJobsAt = now;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch jobs';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  fetchJobById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobsAPI.getJob(id);
      const job = (response.data.data?.job || response.data.data) as Job;
      
      set({
        currentJob: job,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch job';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  createJob: async (jobData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobsAPI.createJob(jobData as any);
      const newJob = (response.data.data?.job || response.data.data) as Job;
      
      if (newJob) {
        set(state => ({
          jobs: [newJob, ...state.jobs],
          totalJobs: state.totalJobs + 1,
          isLoading: false,
          error: null,
        }));
      }
      
      toast.success('Job created successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create job';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  updateJob: async (id, jobData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobsAPI.updateJob(id, jobData);
      const updatedJob = (response.data.data?.job || response.data.data) as Job;
      
      set(state => ({
        jobs: state.jobs.map(job => 
          job._id === id ? updatedJob : job
        ),
        currentJob: state.currentJob?._id === id ? updatedJob : state.currentJob,
        isLoading: false,
        error: null,
      }));
      
      toast.success('Job updated successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update job';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  deleteJob: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await jobsAPI.deleteJob(id);
      
      set(state => ({
        jobs: state.jobs.filter(job => job._id !== id),
        totalJobs: state.totalJobs - 1,
        currentJob: state.currentJob?._id === id ? null : state.currentJob,
        isLoading: false,
        error: null,
      }));
      
      toast.success('Job deleted successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete job';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
      return false;
    }
  },

  searchJobs: async (query) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobsAPI.searchJobs(query);
      
      // Handle different response structures
      let jobsData: Job[] = [];
      if (response.data.data && Array.isArray(response.data.data.jobs)) {
        jobsData = response.data.data.jobs;
      } else if (Array.isArray(response.data.data)) {
        jobsData = response.data.data;
      }
      
      set({
        jobs: jobsData,
        totalJobs: jobsData.length,
        currentPage: 1,
        totalPages: 1,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to search jobs';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    
    // Automatically refetch with new filters
    get().fetchJobs(1, updatedFilters);
  },

  clearFilters: () => {
    set({ filters: initialFilters });
    get().fetchJobs(1, initialFilters);
  },

  setCurrentJob: (job) => {
    set({ currentJob: job });
  },

  clearError: () => {
    set({ error: null });
  },
}));
