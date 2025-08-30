import { create } from 'zustand';
import { DashboardAnalytics, RecruitmentFunnelData, TopCandidatesData } from '@/types';
import { analyticsAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface AnalyticsState {
  dashboardData: DashboardAnalytics | null;
  funnelData: RecruitmentFunnelData | null;
  topCandidates: TopCandidatesData | null;
  isLoading: boolean;
  error: string | null;
}

interface AnalyticsActions {
  fetchDashboardAnalytics: (timeframe?: string) => Promise<void>;
  fetchFunnelData: (timeframe?: string) => Promise<void>;
  fetchTopCandidates: (limit?: number, timeframe?: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  clearError: () => void;
}

type AnalyticsStore = AnalyticsState & AnalyticsActions;

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => {
  // Listen for application changes to refresh analytics
  if (typeof window !== 'undefined') {
    window.addEventListener('applicationStatusChanged', () => {
      get().refreshAllData();
    });
    window.addEventListener('userCreated', () => {
      get().refreshAllData();
    });
  }

  return {
    // State
    dashboardData: null,
    funnelData: null,
    topCandidates: null,
    isLoading: false,
    error: null,

    // Actions
    fetchDashboardAnalytics: async (timeframe = '30d') => {
    set({ isLoading: true, error: null });
    
    try {
      const days = parseInt(timeframe) || 30;
      const response = await analyticsAPI.getDashboardAnalytics(days);
      const payload: any = response.data.data;
      const dashboardData = (payload?.analytics || payload) as DashboardAnalytics;
      
      set({
        dashboardData,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard analytics';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  fetchFunnelData: async (timeframe = '30d') => {
    set({ isLoading: true, error: null });
    
    try {
      // API currently does not accept timeframe; ignoring param
      const response = await analyticsAPI.getRecruitmentFunnel();
      const funnelData = response.data.data;
      
      set({
        funnelData,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch funnel data';
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error('Failed to fetch funnel data:', error);
    }
  },

  fetchTopCandidates: async (limit = 10, timeframe = '30d') => {
    set({ isLoading: true, error: null });
    
    try {
      // API signature: (limit?: number, minScore?: number)
      const response = await analyticsAPI.getTopCandidates(limit);
      const topCandidates = response.data.data;
      
      set({
        topCandidates,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch top candidates';
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error('Failed to fetch top candidates:', error);
    }
  },

  refreshAllData: async () => {
    const promises = [
      get().fetchDashboardAnalytics(),
      get().fetchFunnelData(),
      get().fetchTopCandidates(),
    ];
    
    await Promise.allSettled(promises);
  },

  clearError: () => {
    set({ error: null });
  },
  };
});
