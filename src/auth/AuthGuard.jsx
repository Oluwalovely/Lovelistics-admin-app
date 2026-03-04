import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const AuthGuard = ({ redirectPath = "/login" }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to={redirectPath} replace />;
    return <Outlet />;
};

export default AuthGuard;