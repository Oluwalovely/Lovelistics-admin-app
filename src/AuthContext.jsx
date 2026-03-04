import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ─── Load user from sessionStorage on app start ───────────
    // sessionStorage clears automatically when the browser/tab is closed
    // so users must log in again on every new session
    useEffect(() => {
        const savedUser = sessionStorage.getItem('admin_user');
        const savedToken = sessionStorage.getItem('admin_token');

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // ─── Login ────────────────────────────────────────────────
    const login = (userData, token) => {
        sessionStorage.setItem('admin_user', JSON.stringify(userData));
        sessionStorage.setItem('admin_token', token);
        setUser(userData);
    };

    // ─── Logout ───────────────────────────────────────────────
    const logout = () => {
        sessionStorage.removeItem('admin_user');
        sessionStorage.removeItem('admin_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);