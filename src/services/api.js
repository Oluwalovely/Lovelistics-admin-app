import axios from 'axios';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
    const token = cookies.get('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            cookies.remove('admin_token', { path: '/' });
            cookies.remove('admin_user', { path: '/' });
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const loginAdmin = (data) => API.post('/login', data);

export const getAllOrders = () => API.get('/orders');
export const getOrderById = (orderId) => API.get(`/orders/${orderId}`);
export const assignDriver = (orderId, driverId) => API.patch(`/orders/${orderId}/assign-driver`, { driverId });
export const cancelOrder = (orderId) => API.patch(`/orders/${orderId}/cancel`);
export const deleteOrder = (orderId) => API.delete(`/orders/${orderId}`);

export const getAllDrivers = () => API.get('/drivers');
export const getAllCustomers = () => API.get('/customers');
export const approveDriver = (driverId) => API.patch(`/drivers/${driverId}/approve`);

export const getMyNotifications = () => API.get('/notifications');
export const markAllAsRead = () => API.patch('/notifications/read-all');
export const markOneAsRead = (notificationId) => API.patch(`/notifications/${notificationId}/read`);
export const getLatestLocation = (orderId) => API.get(`/orders/${orderId}/tracking/latest`);

export const forgotPassword = (data) => API.post('/forgot-password', data);
export const verifyOTP = (data) => API.post('/verify-otp', data);
export const resetPassword = (data) => API.post('/reset-password', data);

export const getMe = () => API.get('/me');
export const updateProfile = (formData) => API.patch('/update-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const changePassword = (data) => API.post('/change-password', data);