import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders } from '../services/api';
import Navbar from '../components/Navbar';
import {
    Package, Clock, Zap, CheckCircle, XCircle,
    MapPin, Flag, User, Search
} from 'lucide-react';

const THEME = {
    primary: '#0d1f4f',
    secondary: '#e8610a',
    accent: '#f5a623',
    success: '#198754',
    danger: '#dc3545',
};

const statusStyles = {
    'pending': { bg: '#fff8e1', text: '#856404', border: '#ffeeba' },
    'assigned': { bg: '#e7f1ff', text: '#0d1f4f', border: '#b6d4fe' },
    'picked-up': { bg: '#e7f1ff', text: '#0d1f4f', border: '#b6d4fe' },
    'in-transit': { bg: '#fff0e0', text: '#e8610a', border: '#ffcca0' },
    'delivered': { bg: '#d1e7dd', text: '#0f5132', border: '#badbcc' },
    'confirmed': { bg: '#d1e7dd', text: '#0f5132', border: '#badbcc' },
    'cancelled': { bg: '#f8d7da', text: '#842029', border: '#f5c2c7' },
};

const CardStyle = {
    background: '#fff',
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    overflow: 'hidden',
};

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ title, count, icon, color }) => (
    <div className="card h-100" style={{ ...CardStyle, borderLeft: `5px solid ${color}` }}>
        <div className="card-body d-flex align-items-center justify-content-between p-4">
            <div>
                <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                    {title}
                </p>
                <h2 className="fw-bold mb-0" style={{ color: THEME.primary }}>{count}</h2>
            </div>
            <div style={{
                width: 50, height: 50,
                background: `${color}20`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
            }}>
                {icon}
            </div>
        </div>
    </div>
);

// ─── Order Card ───────────────────────────────────────────────
const OrderCard = ({ order }) => {
    const status = statusStyles[order.status] || { bg: '#f8f9fa', text: '#333', border: '#dee2e6' };
    const needsDriver = order.status === 'pending' && !order.driver;

    return (
        <div className="card h-100" style={{ ...CardStyle, borderTop: `3px solid ${needsDriver ? THEME.accent : THEME.primary}` }}>
            {/* Header */}
            <div className="card-header border-0 bg-white pt-3 pb-0 px-3 d-flex justify-content-between align-items-center">
                <span className="badge rounded-pill fw-normal"
                    style={{ background: '#f0f2f5', color: THEME.primary, padding: '6px 12px', fontSize: '0.8rem' }}>
                    #{order.trackingNumber}
                </span>
                <span className="badge rounded-pill"
                    style={{ background: status.bg, color: status.text, border: `1px solid ${status.border}`, padding: '6px 12px', fontSize: '0.75rem' }}>
                    {order.status.toUpperCase()}
                </span>
            </div>

            <div className="card-body px-3 pt-3 pb-3">
                {/* Route */}
                <div className="d-flex align-items-start gap-3 mb-3">
                    <div className="d-flex flex-column align-items-center" style={{ marginTop: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME.secondary }} />
                        <div style={{ width: 2, height: 30, background: '#dee2e6' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: THEME.success }} />
                    </div>
                    <div className="w-100">
                        <div className="mb-3">
                            <p className="mb-0 text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                <MapPin size={11} /> Pickup
                            </p>
                            <p className="fw-semibold mb-0 text-truncate" style={{ color: THEME.primary, maxWidth: 200, fontSize: '0.875rem' }}>
                                {order.pickupAddress?.street}, {order.pickupAddress?.city}
                            </p>
                        </div>
                        <div>
                            <p className="mb-0 text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                <Flag size={11} /> Delivery
                            </p>
                            <p className="fw-semibold mb-0 text-truncate" style={{ color: THEME.primary, maxWidth: 200, fontSize: '0.875rem' }}>
                                {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Customer + Driver */}
                <div className="d-flex gap-2">
                    <div className="flex-fill p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <div className="d-flex align-items-center gap-1 mb-0">
                            <User size={11} color="#6b7a99" />
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Customer</small>
                        </div>
                        <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.8rem', color: THEME.primary }}>
                            {order.customer?.fullName || 'N/A'}
                        </p>
                    </div>
                    <div className="flex-fill p-2 rounded" style={{ background: needsDriver ? '#fff8e1' : '#f8f9fa' }}>
                        <div className="d-flex align-items-center gap-1 mb-0">
                            <User size={11} color="#6b7a99" />
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Driver</small>
                        </div>
                        <p className="mb-0 fw-semibold text-truncate" style={{ fontSize: '0.8rem', color: needsDriver ? THEME.accent : THEME.primary }}>
                            {order.driver?.fullName || 'Unassigned'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="card-footer bg-white border-0 px-3 pb-3 pt-0 d-flex justify-content-between align-items-center">
                <p className="mb-0 fw-bold" style={{ color: THEME.secondary, fontSize: '1.1rem' }}>
                    ₦{order.price?.toLocaleString()}
                </p>
                <Link to={`/orders/${order._id}`} className="btn btn-sm fw-semibold"
                    style={{ background: THEME.primary, color: '#fff', borderRadius: 8, padding: '6px 16px' }}>
                    Manage
                </Link>
            </div>
        </div>
    );
};

// ─── Dashboard ────────────────────────────────────────────────
const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await getAllOrders();
                setOrders(res.data.data);
            } catch (err) {
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        active: orders.filter(o => ['assigned', 'picked-up', 'in-transit'].includes(o.status)).length,
        delivered: orders.filter(o => ['delivered', 'confirmed'].includes(o.status)).length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const filtered = orders
        .filter(o => {
            if (filter === 'all') return true;

            if (filter === 'active') {
                return ['assigned', 'picked-up', 'in-transit'].includes(o.status);
            }

            if (filter === 'delivered') {
                return ['delivered', 'confirmed'].includes(o.status);
            }

            return o.status === filter;
        })
        .filter(o =>
            search === ''
                ? true
                : o.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
                o.customer?.fullName?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div style={{ minHeight: '100vh', background: '#f4f6f9' }}>
            <Navbar />
            <div className="container-fluid py-5" style={{ maxWidth: 1400 }}>

                {/* Header */}
                <div className="mb-5">
                    <h2 className="fw-bold mb-1" style={{ color: THEME.primary }}>All Orders</h2>
                    <p className="text-muted mb-0">Manage and assign all deliveries across the platform.</p>
                </div>

                {/* Stats */}
                <div className="row g-4 mb-5">
                    <div className="col-6 col-md">
                        <StatCard title="Total" count={stats.total} color={THEME.primary} icon={<Package size={24} />} />
                    </div>
                    <div className="col-6 col-md">
                        <StatCard title="Pending" count={stats.pending} color={THEME.accent} icon={<Clock size={24} />} />
                    </div>
                    <div className="col-6 col-md">
                        <StatCard title="Active" count={stats.active} color={THEME.secondary} icon={<Zap size={24} />} />
                    </div>
                    <div className="col-6 col-md">
                        <StatCard title="Delivered" count={stats.delivered} color={THEME.success} icon={<CheckCircle size={24} />} />
                    </div>
                    <div className="col-6 col-md">
                        <StatCard title="Cancelled" count={stats.cancelled} color={THEME.danger} icon={<XCircle size={24} />} />
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
                    <div className="position-relative">
                        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b7a99' }} />
                        <input
                            type="text"
                            placeholder="Search by tracking no or customer..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ border: '1px solid #dde2ef', borderRadius: 8, padding: '0.4rem 0.85rem 0.4rem 2rem', fontSize: '0.85rem', outline: 'none', minWidth: 280, color: THEME.primary }}
                        />
                    </div>
                    {['all', 'pending', 'active', 'delivered', 'cancelled'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className="btn btn-sm"
                            style={{
                                borderRadius: 8, fontWeight: 600, fontSize: '0.82rem',
                                background: filter === f ? THEME.primary : '#fff',
                                color: filter === f ? '#fff' : '#6b7a99',
                                border: filter === f ? 'none' : '1px solid #dde2ef',
                            }}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: THEME.primary }} />
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5 card shadow-sm border-0" style={{ borderRadius: 16 }}>
                        <Package size={48} color="#dde2ef" className="mx-auto mt-4" />
                        <h5 className="fw-bold text-muted mt-3">No orders found</h5>
                        <p className="text-muted mb-4">Try adjusting your search or filter.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {filtered.map(order => (
                            <div key={order._id} className="col-12 col-md-6 col-lg-4">
                                <OrderCard order={order} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;