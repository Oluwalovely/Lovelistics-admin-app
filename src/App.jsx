import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import AuthGuard from './auth/AuthGuard';
import SidebarLayout from './components/Sidebarlayout';
import Profile from './pages/Profile';
import Revenue from './pages/Revenue';

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border" style={{ color: '#0d1f4f' }} role="status" />
        </div>
    );
    return user?.role === 'admin' ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        {/* Protected routes wrapped in SidebarLayout */}
        <Route element={<AuthGuard />}>
            <Route path="/dashboard"         element={<SidebarLayout><Dashboard /></SidebarLayout>} />
            <Route path="/orders/:orderId"   element={<SidebarLayout><OrderDetails /></SidebarLayout>} />
            <Route path="/drivers"           element={<SidebarLayout><Drivers /></SidebarLayout>} />
            <Route path="/customers"         element={<SidebarLayout><Customers /></SidebarLayout>} />
            <Route path="/notifications"     element={<SidebarLayout><Notifications /></SidebarLayout>} />
            <Route path="/profile"     element={<SidebarLayout><Profile /></SidebarLayout>} />
            <Route path="/revenue"     element={<SidebarLayout><Revenue /></SidebarLayout>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
);

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    </BrowserRouter>
);

export default App;