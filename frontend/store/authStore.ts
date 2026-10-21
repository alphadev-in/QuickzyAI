import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../services/api';

interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'customer' | 'restaurant' | 'delivery';
  profileImage?: string;
  addresses?: any[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: async (user) => {
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      await AsyncStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  
  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const { data: user } = await userAPI.me();
        if (user) {
            set({ user, isAuthenticated: true, isLoading: false });
        } else {
            set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isLoading: false });
    }
  },
}));