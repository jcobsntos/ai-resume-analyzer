import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login({ email, password });
          
          // Backend returns { status, message, token, data: { user } }
          const user = response.data.data?.user;
          const token = response.data.token;
          
          if (!user || !token) {
            throw new Error('Invalid response from server');
          }
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          toast.success(`Welcome back, ${user.firstName}!`);
          return true;
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(data);
          // Backend returns { status, message, token, data: { user } }
          const user = response.data.data?.user;
          const token = response.data.token;
          
          if (!user || !token) {
            throw new Error('Invalid response from server');
          }
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          toast.success(`Welcome to Resume AI Analyzer, ${user.firstName}!`);
          
          // Notify other stores that a new user was created
          window.dispatchEvent(new CustomEvent('userCreated', { detail: { user } }));
          
          return true;
        } catch (error: any) {
          const errors = error.response?.data?.errors;
          const message = error.response?.data?.message;
          const errorMessage = Array.isArray(errors) && errors.length
            ? errors.map((e: any) => e.msg || e.message || `${e.param}: invalid`).join(', ')
            : (message || error.message || 'Registration failed');
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          return false;
        }
      },

      logout: () => {
        // Call logout API (fire and forget)
        authAPI.logout().catch(() => {});
        
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        
        toast.success('Logged out successfully');
      },

      updateUser: (userData) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...userData };
          set({ user: updatedUser });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const response = await authAPI.getProfile();
          const user = response.data.data?.user;
          
          if (user) {
            set({ user });
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
          // If refresh fails, logout the user
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state from localStorage on app start
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  
  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
      });
    } catch (error) {
      // Clear corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
};
