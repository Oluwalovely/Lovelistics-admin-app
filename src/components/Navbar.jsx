import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import { getMyNotifications } from '../services/api';
import { Package, Car, User, Bell, LogOut, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await getMyNotifications();
                setUnreadCount(res.data.unreadCount);
            } catch (err) {
                console.log(err);
            }
        };
        if (user) fetchUnread();
    }, [user, location]);

    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="app-nav">
                <div className="app-nav-inner">

                    <Link to="/dashboard" className="app-brand">
                        <img src={logo} alt="LOVELISTICS" className="app-logo" />
                        <div>
                            <span className="app-brand-name">LOVELISTICS</span>
                            <span className="app-admin-badge">ADMIN</span>
                        </div>
                    </Link>

                    <div className="app-nav-links">
                        <Link to="/dashboard" className={`app-nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                            <Package size={16} /> Orders
                        </Link>
                        <Link to="/drivers" className={`app-nav-link ${isActive('/drivers') ? 'active' : ''}`}>
                            <Car size={16} /> Drivers
                        </Link>
                        <Link to="/customers" className={`app-nav-link ${isActive('/customers') ? 'active' : ''}`}>
                            <User size={16} /> Customers
                        </Link>
                        <Link to="/notifications" className={`app-nav-link ${isActive('/notifications') ? 'active' : ''}`}>
                            <Bell size={16} /> Notifications
                            {unreadCount > 0 && <span className="app-nav-badge">{unreadCount}</span>}
                        </Link>
                    </div>

                    <div className="app-nav-right">
                        <Link to="/notifications" className="app-bell">
                            <Bell size={20} />
                            {unreadCount > 0 && <span className="app-bell-badge">{unreadCount}</span>}
                        </Link>
                        <span className="app-greeting">Hi, {user?.fullName?.split(' ')[0]}</span>
                        <button className="app-logout-btn" data-bs-toggle="modal" data-bs-target="#logoutModal">
                            <LogOut size={15} /> Logout
                        </button>
                    </div>

                    <button className="app-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                        {menuOpen ? <X size={22} color="#fff" /> : <Menu size={22} color="#fff" />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="app-mobile-menu">
                        <Link to="/dashboard" className={`app-mobile-link ${isActive('/dashboard') ? 'active' : ''}`}>
                            <Package size={16} /> Orders
                        </Link>
                        <Link to="/drivers" className={`app-mobile-link ${isActive('/drivers') ? 'active' : ''}`}>
                            <Car size={16} /> Drivers
                        </Link>
                        <Link to="/customers" className={`app-mobile-link ${isActive('/customers') ? 'active' : ''}`}>
                            <User size={16} /> Customers
                        </Link>
                        <Link to="/notifications" className={`app-mobile-link ${isActive('/notifications') ? 'active' : ''}`}>
                            <Bell size={16} /> Notifications
                            {unreadCount > 0 && <span className="app-mobile-badge">{unreadCount}</span>}
                        </Link>
                        <div className="app-mobile-divider" />
                        <div className="app-mobile-user">Hi, {user?.fullName?.split(' ')[0]}</div>
                        <button className="app-mobile-logout" data-bs-toggle="modal" data-bs-target="#logoutModal">
                            <LogOut size={15} /> Logout
                        </button>
                    </div>
                )}
            </nav>

            {/* ── Logout Confirmation Modal ─────────────────────── */}
            <div className="modal fade" id="logoutModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0" style={{ borderRadius: 16 }}>
                        <div className="modal-body text-center p-4">
                            <div style={{
                                width: 60, height: 60,
                                background: 'rgba(13,31,79,0.08)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem',
                            }}>
                                <LogOut size={28} color="#0d1f4f" />
                            </div>
                            <h5 className="fw-bold mb-2" style={{ color: '#0d1f4f' }}>Log Out?</h5>
                            <p className="text-muted small mb-4">
                                Are you sure you want to log out of your account?
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    className="btn btn-outline-secondary px-4"
                                    style={{ borderRadius: 10 }}
                                    data-bs-dismiss="modal"
                                >
                                    Stay
                                </button>
                                <button
                                    className="btn px-4 fw-bold"
                                    style={{ background: '#0d1f4f', color: '#fff', borderRadius: 10 }}
                                    data-bs-dismiss="modal"
                                    onClick={handleLogout}
                                >
                                    Yes, Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navbar;