import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, getAllDrivers } from '../services/api';
import Navbar from '../components/Navbar';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    Package, Clock, Zap, CheckCircle, XCircle, TrendingUp,
    TrendingDown, AlertTriangle, MapPin, Flag, User, Search,
    ChevronUp, ChevronDown, ChevronsUpDown, ArrowRight,
    CircleDollarSign, Target, Star, Trophy, Medal
} from 'lucide-react';

// ── Theme ─────────────────────────────────────────────────────
const T = {
    primary: '#0d1f4f',
    orange: '#e8610a',
    teal: '#0d9488',
    amber: '#d97706',
    danger: '#dc2626',
    success: '#16a34a',
    purple: '#7c3aed',
};

const card = {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
};

const statusStyles = {
    'pending': { bg: '#fef3c7', text: '#92400e', border: '#fde68a', dot: T.amber },
    'assigned': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' },
    'picked-up': { bg: '#e0f2fe', text: '#075985', border: '#bae6fd', dot: '#0ea5e9' },
    'in-transit': { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4', dot: T.teal },
    'delivered': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', dot: T.success },
    'confirmed': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', dot: T.success },
    'cancelled': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', dot: T.danger },
};

// ── Helpers ───────────────────────────────────────────────────
const isDelayed = o => o.status === 'pending' && (new Date() - new Date(o.createdAt)) / 36e5 > 2;
const isActive = o => ['assigned', 'picked-up', 'in-transit'].includes(o.status);

const todayRevenue = orders => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today)
        .reduce((s, o) => s + (o.price || 0), 0);
};

const getOrdersPerDay = orders => {
    const counts = {};
    orders.forEach(o => {
        const key = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).slice(-7).map(([date, count]) => ({ date, count }));
};

const getTopCustomers = (orders, n = 3) => {
    const map = {};
    orders.forEach(o => {
        if (!o.customer?._id) return;
        const id = o.customer._id;
        if (!map[id]) map[id] = { id, name: o.customer.fullName, email: o.customer.email, orders: 0, spent: 0 };
        map[id].orders += 1;
        map[id].spent += o.price || 0;
    });
    return Object.values(map).sort((a, b) => b.orders - a.orders).slice(0, n);
};

// ── Sub-components ────────────────────────────────────────────
const StatCard = ({ title, value, icon, color, prefix = '', sub }) => (
    <div style={{ ...card, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
        </div>
        <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{title}</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.primary, margin: '0.1rem 0 0', lineHeight: 1 }}>
                {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </h2>
            {sub && <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{sub}</p>}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const s = statusStyles[status] || { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', dot: '#94a3b8' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '3px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
            {status}
        </span>
    );
};

const SortTh = ({ label, field, sort, onSort }) => (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', padding: '0.7rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {label}
            {sort.field === field
                ? sort.dir === 'asc' ? <ChevronUp size={12} color={T.primary} /> : <ChevronDown size={12} color={T.primary} />
                : <ChevronsUpDown size={12} color="#cbd5e1" />}
        </span>
    </th>
);

const PlainTh = ({ label }) => (
    <th style={{ padding: '0.7rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{label}</th>
);

const RankIcon = ({ rank }) => {
    if (rank === 0) return <Trophy size={18} color="#f59e0b" />;
    if (rank === 1) return <Medal size={18} color="#94a3b8" />;
    return <Medal size={18} color="#b45309" />;
};

const rowBg = o => isDelayed(o) ? '#fffbeb' : o.status === 'cancelled' ? '#fff5f5' : isActive(o) ? '#f0fdfa' : '#fff';
const rowBorder = o => isDelayed(o) ? `3px solid ${T.amber}` : o.status === 'cancelled' ? `3px solid ${T.danger}` : isActive(o) ? `3px solid ${T.teal}` : '3px solid transparent';

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;

    useEffect(() => {
        (async () => {
            try {
                const [oRes, dRes] = await Promise.all([getAllOrders(), getAllDrivers()]);
                setOrders(oRes.data.data);
                setDrivers(dRes.data.data);
            } catch {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => ({
        total: orders.length,
        active: orders.filter(isActive).length,
        pending: orders.filter(o => o.status === 'pending').length,
        delayed: orders.filter(isDelayed).length,
        revenueToday: todayRevenue(orders),
        completion: orders.length ? Math.round((orders.filter(o => ['delivered', 'confirmed'].includes(o.status)).length / orders.length) * 100) : 0,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        delivered:    orders.filter(o => ['delivered', 'confirmed'].includes(o.status)).length,
    }), [orders]);

    const ordersPerDay = useMemo(() => getOrdersPerDay(orders), [orders]);
    const topCustomers = useMemo(() => getTopCustomers(orders, 3), [orders]);

    const handleSort = field => {
        setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
        setPage(1);
    };

    const filtered = useMemo(() => {
        let list = [...orders];
        if (statusFilter === 'active') list = list.filter(isActive);
        else if (statusFilter === 'delayed') list = list.filter(isDelayed);
        else if (statusFilter === 'delivered') list = list.filter(o => ['delivered', 'confirmed'].includes(o.status));
        else if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(o =>
                o.trackingNumber?.toLowerCase().includes(q) ||
                o.customer?.fullName?.toLowerCase().includes(q) ||
                o.driver?.fullName?.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            let va = a[sort.field] ?? '', vb = b[sort.field] ?? '';
            if (sort.field === 'customer') { va = a.customer?.fullName || ''; vb = b.customer?.fullName || ''; }
            if (sort.field === 'driver') { va = a.driver?.fullName || ''; vb = b.driver?.fullName || ''; }
            if (sort.field === 'price') { va = a.price || 0; vb = b.price || 0; }
            if (va < vb) return sort.dir === 'asc' ? -1 : 1;
            if (va > vb) return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [orders, statusFilter, search, sort]);

    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner-border" style={{ color: T.primary, width: 40, height: 40 }} />
                    <p style={{ color: '#94a3b8', marginTop: '1rem', fontWeight: 500 }}>Loading dashboard...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Navbar />

            <style>{`
                .dash-grid-stats   { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
                .dash-ops          { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; align-items: start; }
                .dash-insights     { display: grid; grid-template-columns: 1fr 1fr 1fr 2fr; gap: 1rem; }
                .dash-bottom       { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .top-customers     { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .driver-panel      { position: sticky; top: 80px; }

                @media (max-width: 1200px) {
                    .dash-grid-stats   { grid-template-columns: repeat(3, 1fr); }
                    .dash-insights     { grid-template-columns: 1fr 1fr; }
                }
                @media (max-width: 992px) {
                    .dash-ops          { grid-template-columns: 1fr; }
                    .dash-bottom       { grid-template-columns: 1fr; }
                    .driver-panel      { position: static; }
                    .top-customers     { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 768px) {
                    .dash-grid-stats   { grid-template-columns: repeat(2, 1fr); }
                    .dash-insights     { grid-template-columns: 1fr 1fr; }
                    .top-customers     { grid-template-columns: 1fr; }
                    .hide-mobile       { display: none !important; }
                }
                @media (max-width: 480px) {
                    .dash-grid-stats   { grid-template-columns: 1fr 1fr; }
                    .dash-insights     { grid-template-columns: 1fr; }
                }

                .filter-btn { padding: 0.35rem 0.7rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; text-transform: capitalize; transition: background 0.15s, color 0.15s; }
                .filter-scroll { display: flex; gap: 0.4rem; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
                .filter-scroll::-webkit-scrollbar { height: 0; }
                .table-row:hover td { background: #f1f5f9 !important; }
                .orders-table-wrap { display: block; }
                .orders-card-wrap  { display: none; padding: 0.75rem; }
                @media (max-width: 768px) {
                    .orders-table-wrap { display: none; }
                    .orders-card-wrap  { display: block; }
                }
            `}</style>

            <div style={{ maxWidth: 1500, margin: '0 auto', padding: '1.5rem 1rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontWeight: 800, color: T.primary, fontSize: '1.4rem', margin: 0 }}>Operations Dashboard</h1>
                    <p style={{ color: '#94a3b8', margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {error && <div className="alert alert-danger mt-2 py-2 px-3 mb-0" style={{ fontSize: '0.82rem', borderRadius: 10 }}>{error}</div>}
                </div>

                {/* ── 1. Stat Cards ── */}
                <div className="dash-grid-stats" style={{ marginBottom: '1.5rem' }}>
                    <StatCard title="Total Orders"       value={stats.total}        icon={<Package size={20} />}         color={T.primary} sub="All time" />
<StatCard title="Active Deliveries"  value={stats.active}       icon={<Zap size={20} />}             color={T.teal}    sub="In progress now" />
<StatCard title="Pending Assignment" value={stats.pending}      icon={<Clock size={20} />}           color={T.amber}   sub="Awaiting driver" />
<StatCard title="Delivered"          value={stats.delivered}    icon={<CheckCircle size={20} />}     color={T.success} sub="Completed orders" />
<StatCard title="Delayed Orders"     value={stats.delayed}      icon={<AlertTriangle size={20} />}   color={T.danger}  sub="Pending 2+ hrs" />
<StatCard title="Revenue Today"      value={stats.revenueToday} icon={<CircleDollarSign size={20}/>} color={T.success} prefix="₦" sub="Orders placed today" />
                </div>

                {/* ── 2. Operations Section ── */}
                <div className="dash-ops" style={{ marginBottom: '1.5rem' }}>

                    {/* Orders Table */}
                    <div style={{ ...card, overflow: 'hidden', minWidth: 0 }}>
                        {/* Search + Filters */}
                        <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ position: 'relative', marginBottom: '0.6rem' }}>
                                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                <input
                                    type="text"
                                    placeholder="Search tracking, customer, driver..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: '0.82rem', color: T.primary, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
                                />
                            </div>
                            <div className="filter-scroll">
                                {['all', 'pending', 'active', 'in-transit', 'delivered', 'delayed', 'cancelled'].map(f => (
                                    <button key={f} className="filter-btn" onClick={() => { setStatusFilter(f); setPage(1); }}
                                        style={{ border: statusFilter === f ? 'none' : '1px solid #e2e8f0', background: statusFilter === f ? T.primary : '#fff', color: statusFilter === f ? '#fff' : '#64748b', flexShrink: 0 }}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="orders-table-wrap" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <SortTh label="Order ID" field="trackingNumber" sort={sort} onSort={handleSort} />
                                        <SortTh label="Customer" field="customer" sort={sort} onSort={handleSort} />
                                        <PlainTh label="Pickup" />
                                        <PlainTh label="Destination" />
                                        <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                                        <SortTh label="Driver" field="driver" sort={sort} onSort={handleSort} />
                                        <SortTh label="Price" field="price" sort={sort} onSort={handleSort} />
                                        <PlainTh label="Action" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                            <Package size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                                            No orders found
                                        </td></tr>
                                    ) : paginated.map(order => (
                                        <tr key={order._id} className="table-row" style={{ borderLeft: rowBorder(order) }}>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: T.primary, whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                #{order.trackingNumber}
                                                {isDelayed(order) && <span style={{ marginLeft: 5, fontSize: '0.62rem', background: '#fef3c7', color: T.amber, padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>LATE</span>}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: T.primary, flexShrink: 0 }}>
                                                        {order.customer?.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    {order.customer?.fullName || 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MapPin size={10} color={T.orange} style={{ flexShrink: 0 }} />
                                                    {order.pickupAddress?.city || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.78rem', color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Flag size={10} color={T.success} style={{ flexShrink: 0 }} />
                                                    {order.deliveryAddress?.city || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                <StatusBadge status={order.status} />
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', color: order.driver ? '#334155' : T.amber, fontWeight: order.driver ? 500 : 700, whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                {order.driver?.fullName || 'Unassigned'}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: T.primary, whiteSpace: 'nowrap', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                ₦{order.price?.toLocaleString() || '—'}
                                            </td>
                                            <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #f8fafc', background: rowBg(order) }}>
                                                <Link to={`/orders/${order._id}`}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: T.primary, color: '#fff', padding: '4px 10px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                                                    Manage <ArrowRight size={11} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="orders-card-wrap">
                            {paginated.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                                    <Package size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                                    No orders found
                                </div>
                            ) : paginated.map(order => (
                                <div key={order._id} style={{ borderLeft: rowBorder(order), background: rowBg(order), borderRadius: 12, padding: '1rem', marginBottom: '0.6rem', border: '1px solid #f1f5f9' }}>
                                    {/* Top row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, color: T.primary, fontSize: '0.82rem' }}>
                                                #{order.trackingNumber}
                                                {isDelayed(order) && <span style={{ marginLeft: 5, fontSize: '0.6rem', background: '#fef3c7', color: T.amber, padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>LATE</span>}
                                            </p>
                                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{order.customer?.fullName || 'N/A'}</p>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    {/* Route */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <MapPin size={10} color={T.orange} />{order.pickupAddress?.city || '—'}
                                        </span>
                                        <span style={{ color: '#cbd5e1' }}>→</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Flag size={10} color={T.success} />{order.deliveryAddress?.city || '—'}
                                        </span>
                                    </div>
                                    {/* Bottom row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Driver</p>
                                            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: order.driver ? T.primary : T.amber }}>{order.driver?.fullName || 'Unassigned'}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontWeight: 800, color: T.primary, fontSize: '0.9rem' }}>₦{order.price?.toLocaleString() || '—'}</p>
                                        </div>
                                        <Link to={`/orders/${order._id}`}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: T.primary, color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                                            Manage <ArrowRight size={11} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                                </p>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setPage(p)}
                                            style={{ width: 30, height: 30, borderRadius: 7, border: p === page ? 'none' : '1px solid #e2e8f0', background: p === page ? T.primary : '#fff', color: p === page ? '#fff' : '#64748b', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Row Legend */}
                        <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                            {[{ color: T.amber, label: 'Delayed' }, { color: T.teal, label: 'Active' }, { color: T.danger, label: 'Cancelled' }].map(({ color, label }) => (
                                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Driver Locations Panel */}
                    <div className="driver-panel" style={{ ...card, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <div>
                                <h6 style={{ fontWeight: 700, color: T.primary, margin: 0, fontSize: '0.9rem' }}>Driver Locations</h6>
                                <p style={{ color: '#94a3b8', fontSize: '0.72rem', margin: '0.1rem 0 0' }}>{drivers.length} drivers registered</p>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.teal}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.teal }}>
                                <MapPin size={17} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 9 }}>
                            {[{ color: T.success, label: 'Active' }, { color: '#cbd5e1', label: 'Offline' }].map(({ color, label }) => (
                                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />{label}
                                </span>
                            ))}
                        </div>
                        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                            {drivers.length === 0
                                ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}><User size={28} style={{ opacity: 0.3 }} /><p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>No drivers</p></div>
                                : drivers.map(d => {
                                    const hasLoc = d.currentLocation?.lat && d.currentLocation?.lng;
                                    return (
                                        <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem', borderRadius: 11, background: '#f8fafc', border: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                                                {d.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontWeight: 700, color: T.primary, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fullName}</p>
                                                <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8' }}>
                                                    {hasLoc ? `${d.currentLocation.lat.toFixed(4)}, ${d.currentLocation.lng.toFixed(4)}` : 'Location unavailable'}
                                                </p>
                                            </div>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: hasLoc ? T.success : '#cbd5e1', flexShrink: 0 }} />
                                        </div>
                                    );
                                })}
                        </div>
                        <div style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem' }}>
                            <Link to="/drivers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: T.primary, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                                View All Drivers <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── 3. Performance Insights ── */}
                <div className="dash-insights" style={{ marginBottom: '1.5rem' }}>

                    {/* Completion Rate */}
                    <div style={{ ...card, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Completion Rate</p>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.primary, margin: '0.1rem 0 0' }}>{stats.completion}%</h2>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.success}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.success }}>
                                <Target size={20} />
                            </div>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 7, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${stats.completion}%`, background: `linear-gradient(90deg, ${T.teal}, ${T.success})`, borderRadius: 999 }} />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>
                            {orders.filter(o => ['delivered', 'confirmed'].includes(o.status)).length} of {orders.length} completed
                        </p>
                    </div>

                    {/* Cancelled Rate */}
                    <div style={{ ...card, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Cancelled Rate</p>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.primary, margin: '0.1rem 0 0' }}>
                                    {orders.length ? Math.round((stats.cancelled / orders.length) * 100) : 0}%
                                </h2>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.danger}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.danger }}>
                                <XCircle size={20} />
                            </div>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 7, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${orders.length ? Math.round((stats.cancelled / orders.length) * 100) : 0}%`, background: `linear-gradient(90deg, ${T.danger}, #f87171)`, borderRadius: 999 }} />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>{stats.cancelled} orders cancelled total</p>
                    </div>

                    {/* Total Drivers */}
                    <div style={{ ...card, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Total Drivers</p>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: T.primary, margin: '0.1rem 0 0' }}>{drivers.length}</h2>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.purple }}>
                                <Star size={20} />
                            </div>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: 999, height: 7, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${drivers.length ? Math.min(100, (drivers.filter(d => d.currentLocation?.lat).length / drivers.length) * 100) : 0}%`, background: `linear-gradient(90deg, ${T.purple}, #a78bfa)`, borderRadius: 999 }} />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '0.4rem 0 0' }}>
                            {drivers.filter(d => d.currentLocation?.lat).length} sharing location
                        </p>
                    </div>

                    {/* Orders Per Day Chart */}
                    <div style={{ ...card, padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Orders Per Day</p>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: T.primary, margin: '0.1rem 0 0' }}>Last 7 Days</h2>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                                <TrendingUp size={20} />
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={90}>
                            <BarChart data={ordersPerDay} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 9, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.78rem' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="count" fill={T.primary} radius={[5, 5, 0, 0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── 4. Top Customers ── */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h5 style={{ fontWeight: 800, color: T.primary, margin: 0, fontSize: '1rem' }}>Top Customers</h5>
                            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0.15rem 0 0' }}>Ranked by total number of orders</p>
                        </div>
                        <Link to="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: T.primary, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                            View All <ArrowRight size={13} />
                        </Link>
                    </div>

                    <div className="top-customers">
                        {topCustomers.length === 0 ? (
                            <div style={{ ...card, padding: '2rem', textAlign: 'center', color: '#94a3b8', gridColumn: 'span 3' }}>
                                <User size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ margin: 0, fontSize: '0.85rem' }}>No customer data yet</p>
                            </div>
                        ) : topCustomers.map((c, i) => (
                            <div key={c.id} style={{
                                ...card,
                                padding: '1.4rem',
                                borderTop: `3px solid ${i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309'}`,
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {/* Background rank number */}
                                <div style={{ position: 'absolute', right: '1rem', top: '0.5rem', fontSize: '4rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, userSelect: 'none', zIndex: 0 }}>
                                    {i + 1}
                                </div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#fef2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: i === 0 ? '#92400e' : i === 1 ? '#475569' : '#92400e', flexShrink: 0 }}>
                                            {c.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ margin: 0, fontWeight: 800, color: T.primary, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || 'No email'}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders</p>
                                            <p style={{ margin: 0, fontWeight: 800, color: T.primary, fontSize: '1.2rem' }}>{c.orders}</p>
                                        </div>
                                        <div style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
                                            <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Spent</p>
                                            <p style={{ margin: 0, fontWeight: 800, color: T.success, fontSize: '1rem' }}>₦{c.spent.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <RankIcon rank={i} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? '#92400e' : i === 1 ? '#475569' : '#b45309' }}>
                                            {i === 0 ? 'Top Customer' : i === 1 ? '2nd Place' : '3rd Place'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;