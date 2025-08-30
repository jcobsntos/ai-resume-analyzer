import { create } from 'zustand';
import { User } from '@/types';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  search: string;
  roleFilter: string;
  activeFilter: string;
}

interface UserActions {
  fetchUsers: (force?: boolean) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  setSearch: (search: string) => void;
  setRoleFilter: (role: string) => void;
  setActiveFilter: (active: string) => void;
  invalidateCache: () => void;
}

type UserStore = UserState & UserActions;

let lastFetchKey = '';
let lastFetchAt = 0;
const CACHE_TTL = 30000; // 30 seconds

export const useUserStore = create<UserStore>()((set, get) => {
  // Listen for user creation events to invalidate cache
  if (typeof window !== 'undefined') {
    window.addEventListener('userCreated', () => {
      get().invalidateCache();
      get().fetchUsers(true);
    });
  }

  return {
    // State
    users: [],
    isLoading: false,
    error: null,
    totalUsers: 0,
    currentPage: 1,
    totalPages: 0,
    search: '',
    roleFilter: '',
    activeFilter: '',

    // Actions
    fetchUsers: async (force = false) => {
    const { search, roleFilter, activeFilter } = get();
    const now = Date.now();
    const key = `${search}-${roleFilter}-${activeFilter}`;
    
    // Use cache if recent and same params
    if (!force && lastFetchKey === key && (now - lastFetchAt) < CACHE_TTL) {
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const filters: any = {};
      if (search.trim()) filters.search = search.trim();
      if (roleFilter) filters.role = roleFilter;
      if (activeFilter) filters.active = activeFilter;
      
      const response = await adminAPI.getUsers(filters);
      const data: any = response.data.data;
      
      // Handle different response structures
      let usersData: User[] = [];
      let totalUsers = 0;
      let currentPage = 1;
      let totalPages = 1;
      
      if (data && Array.isArray(data.users)) {
        usersData = data.users;
        totalUsers = response.data.pagination?.totalUsers || usersData.length;
        currentPage = response.data.pagination?.currentPage || 1;
        totalPages = response.data.pagination?.totalPages || 1;
      } else if (Array.isArray(data)) {
        usersData = data;
        totalUsers = usersData.length;
      }
      
      set({
        users: usersData,
        totalUsers,
        currentPage,
        totalPages,
        isLoading: false,
        error: null,
      });
      
      lastFetchKey = key;
      lastFetchAt = now;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      set({
        isLoading: false,
        error: errorMessage,
      });
      toast.error(errorMessage);
    }
  },

  updateUser: async (id: string, data: Partial<User>) => {
    try {
      const response = await adminAPI.updateUser(id, data);
      const updatedUser = response.data.data?.user;
      
      if (updatedUser) {
        set(state => ({
          users: state.users.map(user => 
            user._id === id ? updatedUser : user
          ),
        }));
        toast.success('User updated successfully');
        return true;
      }
      return false;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  deleteUser: async (id: string) => {
    try {
      await adminAPI.deleteUser(id);
      
      set(state => ({
        users: state.users.filter(user => user._id !== id),
        totalUsers: state.totalUsers - 1,
      }));
      
      toast.success('User deleted successfully');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    }
  },

  setSearch: (search: string) => {
    set({ search });
  },

  setRoleFilter: (role: string) => {
    set({ roleFilter: role });
  },

  setActiveFilter: (active: string) => {
    set({ activeFilter: active });
  },

  invalidateCache: () => {
    lastFetchKey = '';
    lastFetchAt = 0;
  },
  };
});
