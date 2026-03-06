import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import { getMyNotifications } from '../services/api';
import {
    LayoutDashboard, Package, Car, Users, Bell,
    LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import logo from '../assets/logo.png';

const NAV = [
    { to: '/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/drivers',       icon: <Car size={18} />,             label: 'Drivers' },
    { to: '/customers',     icon: <Users size={18} />,           label: 'Customers' },
    { to: '/notifications', icon: <Bell size={18} />,            label: 'Notifications', badge: true },
];

const Sidebar = ({ onCollapse }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [unread, setUnread] = useState(0);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        if (onCollapse) onCollapse(next);
    };

    useEffect(() => {
        if (user) {
            getMyNotifications()
                .then(r => setUnread(r.data.unreadCount))
                .catch(() => {});
        }
    }, [user, location]);

    useEffect(() => { setMobileOpen(false); }, [location]);

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const handleLogout = () => { logout(); navigate('/login'); };
    const isActive = path => location.pathname === path;

    const SidebarContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Brand */}
            <div style={{ padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '0.5rem' }}>
                {!collapsed && (
                    <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
                        <img src={logo} alt="logo" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8 }} />
                        <div>
                            <span style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem', color: '#fff', letterSpacing: '1px' }}>LOVELISTICS</span>
                            <span style={{ display: 'inline-block', background: '#e8610a', color: '#fff', fontSize: '0.5rem', fontWeight: 800, padding: '1px 5px', borderRadius: 4, letterSpacing: '1px' }}>ADMIN</span>
                        </div>
                    </Link>
                )}
                {collapsed && (
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <img src={logo} alt="logo" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 8 }} />
                    </Link>
                )}
                <button onClick={toggleCollapse}
                    className="collapse-btn-desktop"
                    style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                    {collapsed ? <ChevronRight size={15} /> : <Menu size={15} />}
                </button>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: '0 0.75rem', overflowY: 'auto' }}>
                {NAV.map(({ to, icon, label, badge }) => {
                    const active = isActive(to);
                    return (
                        <Link key={to} to={to}
                            title={collapsed ? label : undefined}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: collapsed ? '0.7rem' : '0.7rem 0.9rem',
                                borderRadius: 10, marginBottom: '0.25rem',
                                textDecoration: 'none', justifyContent: collapsed ? 'center' : 'flex-start',
                                background: active ? 'rgba(232,97,10,0.15)' : 'transparent',
                                color: active ? '#e8610a' : 'rgba(255,255,255,0.65)',
                                fontWeight: active ? 700 : 500, fontSize: '0.88rem',
                                transition: 'background 0.15s, color 0.15s',
                                position: 'relative',
                            }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}}
                        >
                            <span style={{ flexShrink: 0, position: 'relative' }}>
                                {icon}
                                {badge && unread > 0 && collapsed && (
                                    <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#e8610a' }} />
                                )}
                            </span>
                            {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                            {!collapsed && badge && unread > 0 && (
                                <span style={{ background: '#e8610a', color: '#fff', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: 999, minWidth: 18, textAlign: 'center' }}>{unread}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {!collapsed && (
                    <div style={{ padding: '0.6rem 0.75rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e8610a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</p>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Administrator</p>
                        </div>
                    </div>
                )}
                <button onClick={() => setShowLogoutModal(true)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '0.6rem', padding: collapsed ? '0.7rem' : '0.65rem 0.9rem', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8610a'; e.currentTarget.style.color = '#e8610a'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >
                    <LogOut size={16} />
                    {!collapsed && 'Logout'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                .sidebar-desktop {
                    position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
                    background: #0d1f4f;
                    box-shadow: 4px 0 24px rgba(0,0,0,0.12);
                    transition: width 0.25s ease;
                    display: flex; flex-direction: column;
                }
                .topbar-mobile {
                    display: none;
                    position: fixed; top: 0; left: 0; right: 0; height: 56px;
                    background: #0d1f4f; z-index: 99;
                    align-items: center; justify-content: space-between;
                    padding: 0 1rem;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
                }
                .collapse-btn-desktop { display: flex; }
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .topbar-mobile { display: flex !important; }
                    .collapse-btn-desktop { display: none !important; }
                }
            `}</style>

            {/* Desktop Sidebar */}
            <div className="sidebar-desktop" style={{ width: collapsed ? 64 : 240 }}>
                <SidebarContent />
            </div>

            {/* Mobile Topbar */}
            <div className="topbar-mobile">
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <img src={logo} alt="logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 900, color: '#fff', fontSize: '0.9rem', letterSpacing: '1px' }}>LOVELISTICS</span>
                    <span style={{ background: '#e8610a', color: '#fff', fontSize: '0.48rem', fontWeight: 800, padding: '1px 4px', borderRadius: 3, letterSpacing: '1px' }}>ADMIN</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {unread > 0 && (
                        <Link to="/notifications" style={{ position: 'relative', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                            <Bell size={20} />
                            <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#e8610a' }} />
                        </Link>
                    )}
                    <button onClick={() => setMobileOpen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <Menu size={22} />
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex' }} onClick={() => setMobileOpen(false)}>
                    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: 240, background: '#0d1f4f', zIndex: 201, boxShadow: '4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setMobileOpen(false)}
                                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <SidebarContent />
                    </div>
                </div>
            )}
            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                        <div style={{ width: 60, height: 60, background: 'rgba(13,31,79,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <LogOut size={28} color="#0d1f4f" />
                        </div>
                        <h5 style={{ fontWeight: 700, color: '#0d1f4f', marginBottom: '0.5rem' }}>Log Out?</h5>
                        <p style={{ color: '#6b7a99', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to log out of your account?
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowLogoutModal(false)}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: '1px solid #dde2ef', background: '#fff', color: '#6b7a99', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Stay
                            </button>
                            <button onClick={handleLogout}
                                style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: '#0d1f4f', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                Yes, Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;