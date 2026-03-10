import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = cookies.get('admin_user');
        const savedToken = cookies.get('admin_token');
        if (savedUser && savedToken) {
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        cookies.set('admin_user', userData, { path: '/', maxAge: 18000 });
        cookies.set('admin_token', token, { path: '/', maxAge: 18000 });
        setUser(userData);
    };

    // ── NEW: merge partial profile updates into state + cookie ─
    const updateUser = (partial) => {
        setUser(prev => {
            const updated = { ...prev, ...partial };
            cookies.set('admin_user', updated, { path: '/', maxAge: 18000 });
            return updated;
        });
    };

    const logout = () => {
        cookies.remove('admin_user', { path: '/' });
        cookies.remove('admin_token', { path: '/' });
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);