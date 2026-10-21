import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8081/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- User API ---
export const userAPI = {
  create: (userData: any) => apiClient.post('/users', userData),
  get: (userId: string) => apiClient.get(`/users/${userId}`),
  me: () => apiClient.get('/users/me'),
  getByPhone: (phone: string) => apiClient.get(`/users/phone/${phone}`),
  update: (userId: string, updates: any) => apiClient.put(`/users/${userId}`, updates),
  addAddress: (userId: string, addressData: any) => apiClient.post(`/users/${userId}/addresses`, addressData),
  deleteAddress: (userId: string, addressId: string) => apiClient.delete(`/users/${userId}/addresses/${addressId}`),
  getImageUploadUrl: (userId: string, fileInfo: any) => apiClient.post(`/users/${userId}/image-upload-url`, fileInfo),
};

// --- Restaurant API ---
export const restaurantAPI = {
  create: (restaurantData: any) => apiClient.post('/restaurants', restaurantData),
  getAll: (params?: any) => apiClient.get('/restaurants', { params }),
  getById: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}`),
  update: (restaurantId: string, updates: any) => apiClient.put(`/restaurants/${restaurantId}`, updates),
  getMenu: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}/menu`),
  addMenuItem: (restaurantId: string, itemData: any) => apiClient.post(`/restaurants/${restaurantId}/menu`, itemData),
  updateMenuItem: (restaurantId: string, itemId: string, updates: any) => apiClient.put(`/restaurants/${restaurantId}/menu/${itemId}`, updates),
  deleteMenuItem: (restaurantId: string, itemId: string) => apiClient.delete(`/restaurants/${restaurantId}/menu/${itemId}`),
  getOrders: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}/orders`),
  addReview: (restaurantId: string, reviewData: any) => apiClient.post(`/restaurants/${restaurantId}/reviews`, reviewData),
  getReviews: (restaurantId: string) => apiClient.get(`/restaurants/${restaurantId}/reviews`),
  getImageUploadUrl: (restaurantId: string, fileInfo: any) => apiClient.post(`/restaurants/${restaurantId}/image-upload-url`, fileInfo),
};

// --- Order API ---
export const orderAPI = {
  create: (orderData: any) => apiClient.post('/orders', orderData),
  getById: (orderId: string) => apiClient.get(`/orders/${orderId}`),
  updateStatus: (orderId: string, status: string) => apiClient.patch(`/orders/${orderId}/status`, { status }),
  getForUser: (userId: string) => apiClient.get(`/users/${userId}/orders`),
  addRating: (orderId: string, ratingData: any) => apiClient.post(`/orders/${orderId}/rating`, ratingData),

};

// --- Delivery Partner API ---
export const deliveryAPI = {
  create: (partnerData: any) => apiClient.post('/delivery-partners', partnerData),
  get: (partnerId: string) => apiClient.get(`/delivery-partners/${partnerId}`),
  update: (partnerId: string, updates: any) => apiClient.put(`/delivery-partners/${partnerId}`, updates),
  setAvailability: (partnerId: string, isAvailable: boolean) => apiClient.put(`/delivery-partners/${partnerId}/availability`, { isAvailable }),
  getAvailableOrders: () => apiClient.get('/orders/available'),
  acceptOrder: (partnerId: string, orderId: string) => apiClient.post(`/delivery-partners/${partnerId}/orders/${orderId}/accept`),
  getAssignedOrders: (partnerId: string) => apiClient.get(`/delivery-partners/${partnerId}/orders`),
};

// --- Admin API ---
export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/stats'),
  getAllUsers: () => apiClient.get('/admin/users'),
  getRestaurants: (verified?: boolean) => apiClient.get('/admin/restaurants', { params: { verified } }),
  verifyRestaurant: (restaurantId: string) => apiClient.patch(`/admin/restaurants/${restaurantId}/verify`),
  getAllOrders: () => apiClient.get('/admin/orders'),
  createPromoCode: (promoData: any) => apiClient.post('/admin/promos', promoData),
  getPromoCodes: () => apiClient.get('/admin/promos'),
  updateSettings: (settingsData: any) => apiClient.post('/admin/settings', settingsData),
  getSettings: () => apiClient.get('/admin/settings'),
};