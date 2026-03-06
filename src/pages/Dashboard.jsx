import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, getAllDrivers, getMyNotifications } from '../services/api';
import { useAuth } from '../AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    Package, Clock, Zap, CheckCircle, XCircle, TrendingUp,
    AlertTriangle, MapPin, Flag, Search, ChevronUp, ChevronDown,
    ChevronsUpDown, ArrowRight, CircleDollarSign, Target,
    Star, Trophy, Medal, Bell, User, RefreshCw, Car, Bike, Truck
} from 'lucide-react';

// ── Design Tokens ─────────────────────────────────────────────
const C = {
    navy:    '#0d1f4f',
    navyL:   '#162660',
    orange:  '#e8610a',
    teal:    '#0d9488',
    amber:   '#d97706',
    red:     '#dc2626',
    green:   '#16a34a',
    purple:  '#7c3aed',
    blue:    '#2563eb',
    bg:      '#f1f4f9',
    white:   '#ffffff',
    border:  '#e8edf7',
    muted:   '#64748b',
    faint:   '#94a3b8',
};

const shadow = { boxShadow: '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)' };

const statusCfg = {
    'pending':    { bg: '#fef9ec', text: '#92400e', border: '#fde68a', dot: C.amber,  label: 'Pending'    },
    'assigned':   { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', dot: C.blue,   label: 'Assigned'   },
    'picked-up':  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', dot: C.green,  label: 'Picked Up'  },
    'in-transit': { bg: '#faf5ff', text: '#6d28d9', border: '#ddd6fe', dot: C.purple, label: 'In Transit' },
    'delivered':  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: C.green,  label: 'Delivered'  },
    'confirmed':  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: C.green,  label: 'Confirmed'  },
    'cancelled':  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: C.red,    label: 'Cancelled'  },
};

// ── Helpers ───────────────────────────────────────────────────
const isDelayed  = o => o.status === 'pending' && (Date.now() - new Date(o.createdAt)) / 36e5 > 2;
const isActive   = o => ['assigned', 'picked-up', 'in-transit'].includes(o.status);
const isDone     = o => ['delivered', 'confirmed'].includes(o.status);
const todayRev   = orders => { const d = new Date().toDateString(); return orders.filter(o => ['delivered', 'confirmed'].includes(o.status) && new Date(o.deliveredAt || o.confirmedAt).toDateString() === d).reduce((s, o) => s + (o.price || 0), 0); };
const doneToday  = orders => { const d = new Date().toDateString(); return orders.filter(o => isDone(o) && new Date(o.updatedAt || o.createdAt).toDateString() === d).length; };

const ordersPerDay = orders => {
    const m = {};
    orders.forEach(o => { const k = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .slice(-7)
        .map(([date, count]) => ({ date, count }));
};

const topCustomers = (orders, n = 3) => {
    const m = {};
    orders.forEach(o => {
        if (!o.customer?._id) return;
        const id = o.customer._id;
        if (!m[id]) m[id] = { id, name: o.customer.fullName, email: o.customer.email, orders: 0, spent: 0 };
        m[id].orders++; m[id].spent += o.price || 0;
    });
    return Object.values(m).sort((a, b) => b.orders - a.orders).slice(0, n);
};

// ── Micro Components ──────────────────────────────────────────
const Badge = ({ status }) => {
    const s = statusCfg[status] || { bg: '#f8fafc', text: C.muted, border: C.border, dot: C.faint, label: status };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.text, border: `1px solid ${s.border}`, padding: '3px 9px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0, animation: ['assigned','in-transit','picked-up'].includes(status) ? 'pulse 2s infinite' : 'none' }} />
            {s.label}
        </span>
    );
};

const KPICard = ({ title, value, icon, color, sub, prefix = '', trend }) => (
    <div style={{ background: C.white, borderRadius: 14, padding: '1.4rem', ...shadow, border: `1px solid ${C.border}`, cursor: 'default', transition: 'transform 0.18s, box-shadow 0.18s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,31,79,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)'; }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
            {trend !== undefined && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700, color: trend >= 0 ? C.green : C.red, background: trend >= 0 ? '#dcfce7' : '#fee2e2', padding: '3px 7px', borderRadius: 999 }}>
                    {trend >= 0 ? <TrendingUp size={11} /> : <ChevronDown size={11} />}{Math.abs(trend)}%
                </span>
            )}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</p>
        <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.9rem', fontWeight: 800, color: C.navy, lineHeight: 1 }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</h2>
        {sub && <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: C.faint }}>{sub}</p>}
    </div>
);

const SortTh = ({ label, field, sort, onSort }) => (
    <th onClick={() => onSort(field)} style={{ padding: '0.8rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.7px', background: '#f8fafc', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            {label}
            {sort.field === field ? sort.dir === 'asc' ? <ChevronUp size={12} color={C.navy} /> : <ChevronDown size={12} color={C.navy} /> : <ChevronsUpDown size={12} color="#cbd5e1" />}
        </span>
    </th>
);

const PlainTh = ({ label }) => (
    <th style={{ padding: '0.8rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.7px', background: '#f8fafc', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{label}</th>
);

const rowHighlight = o => {
    if (isDelayed(o))             return { bg: '#fffbeb', left: `3px solid ${C.amber}` };
    if (o.status === 'cancelled') return { bg: '#fff5f5', left: `3px solid ${C.red}` };
    if (isActive(o))              return { bg: '#f0fdfa', left: `3px solid ${C.teal}` };
    return { bg: C.white, left: '3px solid transparent' };
};

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
    const { user } = useAuth();
    const [orders,  setOrders]  = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [unread,  setUnread]  = useState(0);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const [search,       setSearch]       = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sort,  setSort]  = useState({ field: 'createdAt', dir: 'desc' });
    const [page,  setPage]  = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const PAGE_SIZE = 8;

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [oR, dR, nR] = await Promise.all([getAllOrders(), getAllDrivers(), getMyNotifications()]);
            setOrders(oR.data.data);
            setDrivers(dR.data.data);
            setUnread(nR.data.unreadCount);
        } catch { setError('Failed to load data.'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => {
        fetchData();
        // Poll drivers every 15 seconds
        const poll = setInterval(async () => {
            try {
                const dR = await getAllDrivers();
                setDrivers(dR.data.data);
            } catch {}
        }, 15000);
        return () => clearInterval(poll);
    }, []);

    const stats = useMemo(() => ({
        total:     orders.length,
        active:    orders.filter(isActive).length,
        pending:   orders.filter(o => o.status === 'pending').length,
        done:      orders.filter(isDone).length,
        doneToday: doneToday(orders),
        delayed:   orders.filter(isDelayed).length,
        revenue:   todayRev(orders),
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        completion: orders.length ? Math.round((orders.filter(isDone).length / orders.length) * 100) : 0,
    }), [orders]);

    const chartData    = useMemo(() => ordersPerDay(orders),    [orders]);
    const topCust      = useMemo(() => topCustomers(orders, 3), [orders]);

    const handleSort = f => { setSort(s => ({ field: f, dir: s.field === f && s.dir === 'asc' ? 'desc' : 'asc' })); setPage(1); };

    const filtered = useMemo(() => {
        let list = [...orders];
        if (statusFilter === 'active')      list = list.filter(isActive);
        else if (statusFilter === 'delayed')    list = list.filter(isDelayed);
        else if (statusFilter === 'delivered')  list = list.filter(isDone);
        else if (statusFilter !== 'all')        list = list.filter(o => o.status === statusFilter);

        const q = (search || globalSearch).toLowerCase();
        if (q) list = list.filter(o =>
            o.trackingNumber?.toLowerCase().includes(q) ||
            o.customer?.fullName?.toLowerCase().includes(q) ||
            o.driver?.fullName?.toLowerCase().includes(q)
        );

        list.sort((a, b) => {
            let va = a[sort.field] ?? '', vb = b[sort.field] ?? '';
            if (sort.field === 'customer') { va = a.customer?.fullName || ''; vb = b.customer?.fullName || ''; }
            if (sort.field === 'driver')   { va = a.driver?.fullName   || ''; vb = b.driver?.fullName   || ''; }
            if (sort.field === 'price')    { va = a.price || 0;               vb = b.price || 0; }
            if (va < vb) return sort.dir === 'asc' ? -1 : 1;
            if (va > vb) return sort.dir === 'asc' ?  1 : -1;
            return 0;
        });
        return list;
    }, [orders, statusFilter, search, globalSearch, sort]);

    const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner-border" style={{ color: C.navy, width: 40, height: 40 }} />
                <p style={{ color: C.faint, marginTop: '1rem', fontWeight: 500 }}>Loading dashboard...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

                .dash-wrap       { max-width:1500px; margin:0 auto; padding:0 1.5rem 2.5rem; animation: fadeIn 0.4s ease; overflow-x:hidden; }
                .topbar          { position:sticky; top:0; z-index:50; background:rgba(241,244,249,0.92); backdrop-filter:blur(12px); border-bottom:1px solid ${C.border}; padding:0.85rem 1.5rem; display:grid; grid-template-columns:1fr auto auto; align-items:center; gap:0.75rem; }
                .topbar-search   { grid-column:1/-1; order:3; }
                @media(min-width:769px) { .topbar { grid-template-columns:1fr auto auto; } .topbar-search { grid-column:auto; order:0; } .topbar-date { display:block !important; } }
                .kpi-grid        { display:grid; grid-template-columns:repeat(6,1fr); gap:1rem; margin-bottom:1.75rem; }
                .ops-grid        { display:grid; grid-template-columns:1fr 300px; gap:1.5rem; margin-bottom:1.75rem; align-items:start; }
                .insights-grid   { display:grid; grid-template-columns:1fr 1fr 1fr 2fr; gap:1rem; margin-bottom:1.75rem; }
                .topcust-grid    { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
                .driver-panel    { position:sticky; top:72px; }
                .table-wrap      { display:block; overflow-x:auto; }
                .card-list       { display:none; padding:0.75rem; }
                .filter-bar      { display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:2px; }
                .filter-bar::-webkit-scrollbar { height:0; }
                .tr-hover:hover td { background:#f1f5f9 !important; transition:background 0.12s; }

                @media(max-width:1280px) { .kpi-grid { grid-template-columns:repeat(3,1fr); } .insights-grid { grid-template-columns:1fr 1fr; } }
                @media(max-width:1024px) { .ops-grid { grid-template-columns:1fr; } .driver-panel { position:static; } }
                @media(max-width:768px)  {
                    .kpi-grid { grid-template-columns:repeat(2,1fr); }
                    .ops-grid { grid-template-columns:1fr; }
                    .insights-grid { grid-template-columns:1fr 1fr; }
                    .topcust-grid { grid-template-columns:1fr; }
                    .driver-panel { position:static; }
                    .table-wrap { display:none; }
                    .card-list  { display:block; }
                    .topbar     { padding:0.65rem 1rem; }
                    .dash-wrap  { padding:0 0.75rem 2rem; }
                }
                @media(max-width:480px) { .kpi-grid { grid-template-columns:1fr 1fr; } .insights-grid { grid-template-columns:1fr; } }
                @media(max-width:320px) { .kpi-grid { grid-template-columns:1fr; }
            `}</style>

            {/* ── Topbar ── */}
            <div className="topbar">
                {/* Title */}
                <div>
                    <h1 style={{ fontWeight: 800, color: C.navy, fontSize: '1.1rem', margin: 0, lineHeight: 1 }}>Operations Dashboard</h1>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: C.faint, display: 'none' }} className="topbar-date">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => fetchData(true)} title="Refresh"
                        style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, flexShrink: 0 }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                    </button>
                    <Link to="/notifications" style={{ position: 'relative', width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', flexShrink: 0 }}>
                        <Bell size={15} />
                        {unread > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: '50%', background: C.orange, color: '#fff', fontSize: '0.52rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem 0.3rem 0.3rem', borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, flexShrink: 0 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.72rem' }}>
                            {user?.fullName?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: C.navy }}>{user?.fullName?.split(' ')[0]}</span>
                    </div>
                </div>

                {/* Search — full width on mobile, inline on desktop */}
                <div className="topbar-search" style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
                    <input
                        value={globalSearch}
                        onChange={e => { setGlobalSearch(e.target.value); setPage(1); }}
                        placeholder="Search orders, drivers, customers..."
                        style={{ width: '100%', padding: '0.48rem 0.75rem 0.48rem 2rem', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: '0.8rem', color: C.navy, outline: 'none', background: C.white, boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            <div className="dash-wrap" style={{ paddingTop: '1.5rem' }}>
                {error && <div className="alert alert-danger mb-3 py-2 px-3" style={{ fontSize: '0.82rem', borderRadius: 10 }}>{error}</div>}

                {/* ── KPI Cards ── */}
                <div className="kpi-grid">
                    <KPICard title="Total Orders"        value={stats.total}     icon={<Package size={20}/>}          color={C.navy}   sub="All time" />
                    <KPICard title="Active Deliveries"   value={stats.active}    icon={<Zap size={20}/>}              color={C.teal}   sub="In progress" />
                    <KPICard title="Pending Assignment"  value={stats.pending}   icon={<Clock size={20}/>}            color={C.amber}  sub="Awaiting driver" />
                    <KPICard title="Completed Today"     value={stats.doneToday} icon={<CheckCircle size={20}/>}      color={C.green}  sub="Delivered today" />
                    <KPICard title="Delayed Deliveries"  value={stats.delayed}   icon={<AlertTriangle size={20}/>}    color={C.red}    sub="Pending 2+ hrs" />
                    <KPICard title="Revenue Today"       value={stats.revenue}   icon={<CircleDollarSign size={20}/>} color={C.orange} sub="Orders today" prefix="₦" />
                </div>

                {/* ── Operations Section ── */}
                <div className="ops-grid">

                    {/* Orders Panel */}
                    <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', ...shadow }}>

                        {/* Panel Header */}
                        <div style={{ padding: '1.1rem 1.25rem', borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                    <h6 style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: '0.95rem' }}>Orders Management</h6>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: C.faint }}>{filtered.length} orders found</p>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
                                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                        placeholder="Search tracking ID, customer, driver..."
                                        style={{ padding: '0.45rem 0.75rem 0.45rem 1.9rem', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: '0.8rem', color: C.navy, outline: 'none', background: '#f8fafc', width: 260, boxSizing: 'border-box' }} />
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="filter-bar">
                                {['all','pending','active','in-transit','delivered','delayed','cancelled'].map(f => (
                                    <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                                        style={{ padding: '0.35rem 0.85rem', borderRadius: 8, fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', flexShrink: 0, transition: 'all 0.15s', border: statusFilter === f ? 'none' : `1px solid ${C.border}`, background: statusFilter === f ? C.navy : C.white, color: statusFilter === f ? '#fff' : C.muted }}>
                                        {f === 'all' ? 'All' : f === 'in-transit' ? 'In Transit' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="table-wrap">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <SortTh label="Tracking ID" field="trackingNumber" sort={sort} onSort={handleSort} />
                                        <SortTh label="Customer"    field="customer"       sort={sort} onSort={handleSort} />
                                        <PlainTh label="Pickup" />
                                        <PlainTh label="Destination" />
                                        <SortTh label="Driver"      field="driver"         sort={sort} onSort={handleSort} />
                                        <SortTh label="Status"      field="status"         sort={sort} onSort={handleSort} />
                                        <SortTh label="Price"       field="price"          sort={sort} onSort={handleSort} />
                                        <PlainTh label="Action" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: C.faint }}>
                                            <Package size={32} style={{ opacity: 0.25, display: 'block', margin: '0 auto 0.5rem' }} />
                                            No orders found
                                        </td></tr>
                                    ) : paginated.map(order => {
                                        const hl = rowHighlight(order);
                                        return (
                                            <tr key={order._id} className="tr-hover" style={{ borderLeft: hl.left }}>
                                                {[
                                                    <td key="id" style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        #{order.trackingNumber}
                                                        {isDelayed(order) && <span style={{ marginLeft: 5, fontSize: '0.6rem', background: '#fef3c7', color: C.amber, padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>LATE</span>}
                                                    </td>,
                                                    <td key="cust" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.navy, flexShrink: 0 }}>{order.customer?.fullName?.charAt(0) || '?'}</div>
                                                            {order.customer?.fullName || 'N/A'}
                                                        </div>
                                                    </td>,
                                                    <td key="pickup" style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: C.muted, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} color={C.orange} style={{ flexShrink: 0 }} />{order.pickupAddress?.city || '—'}</div>
                                                    </td>,
                                                    <td key="dest" style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: C.muted, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Flag size={10} color={C.green} style={{ flexShrink: 0 }} />{order.deliveryAddress?.city || '—'}</div>
                                                    </td>,
                                                    <td key="driver" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: order.driver ? '#334155' : C.amber, fontWeight: order.driver ? 500 : 700, whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        {order.driver?.fullName || 'Unassigned'}
                                                    </td>,
                                                    <td key="status" style={{ padding: '0.85rem 1rem', borderBottom: `1px solid #f8fafc`, background: hl.bg }}><Badge status={order.status} /></td>,
                                                    <td key="price" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: C.navy, whiteSpace: 'nowrap', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>₦{order.price?.toLocaleString() || '—'}</td>,
                                                    <td key="action" style={{ padding: '0.85rem 1rem', borderBottom: `1px solid #f8fafc`, background: hl.bg }}>
                                                        <Link to={`/orders/${order._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: C.navy, color: '#fff', padding: '5px 11px', borderRadius: 7, fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = C.navyL}
                                                            onMouseLeave={e => e.currentTarget.style.background = C.navy}>
                                                            Manage <ArrowRight size={11} />
                                                        </Link>
                                                    </td>
                                                ]}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="card-list">
                            {paginated.length === 0
                                ? <div style={{ textAlign: 'center', padding: '2rem', color: C.faint }}><Package size={28} style={{ opacity: 0.25 }} /><p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>No orders found</p></div>
                                : paginated.map(order => {
                                    const hl = rowHighlight(order);
                                    return (
                                        <div key={order._id} style={{ background: hl.bg, borderLeft: hl.left, borderRadius: 12, padding: '1rem', marginBottom: '0.6rem', border: `1px solid ${C.border}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '0.82rem' }}>#{order.trackingNumber}{isDelayed(order) && <span style={{ marginLeft: 5, fontSize: '0.6rem', background: '#fef3c7', color: C.amber, padding: '1px 5px', borderRadius: 999, fontWeight: 700 }}>LATE</span>}</p>
                                                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: C.muted }}>{order.customer?.fullName || 'N/A'}</p>
                                                </div>
                                                <Badge status={order.status} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.74rem', color: C.muted, marginBottom: '0.6rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} color={C.orange} />{order.pickupAddress?.city || '—'}</span>
                                                <span style={{ color: '#cbd5e1' }}>→</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Flag size={10} color={C.green} />{order.deliveryAddress?.city || '—'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.68rem', color: C.faint }}>Driver</p>
                                                    <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: order.driver ? C.navy : C.amber }}>{order.driver?.fullName || 'Unassigned'}</p>
                                                </div>
                                                <p style={{ margin: 0, fontWeight: 800, color: C.navy }}>₦{order.price?.toLocaleString() || '—'}</p>
                                                <Link to={`/orders/${order._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: C.navy, color: '#fff', padding: '5px 12px', borderRadius: 7, fontSize: '0.74rem', fontWeight: 600, textDecoration: 'none' }}>
                                                    Manage <ArrowRight size={11} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ padding: '0.85rem 1.25rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: C.faint }}>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</p>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                                        <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 30, borderRadius: 7, border: p===page ? 'none' : `1px solid ${C.border}`, background: p===page ? C.navy : C.white, color: p===page ? '#fff' : C.muted, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legend */}
                        <div style={{ padding: '0.6rem 1.25rem', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                            {[{ color: C.amber, label: 'Delayed' },{ color: C.teal, label: 'Active' },{ color: C.red, label: 'Cancelled' }].map(({ color, label }) => (
                                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: C.faint, fontWeight: 500 }}>
                                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Driver Activity Panel */}
                    <div className="driver-panel" style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: '1.25rem', ...shadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <h6 style={{ fontWeight: 700, color: C.navy, margin: 0, fontSize: '0.9rem' }}>Driver Activity</h6>
                                <p style={{ color: C.faint, fontSize: '0.72rem', margin: '0.1rem 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />
                                    Live · refreshes every 15s
                                </p>
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.teal }}>
                                <MapPin size={17} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 9, marginBottom: '0.85rem' }}>
                            {[{ color: C.green, label: 'Active' },{ color: '#cbd5e1', label: 'Offline' }].map(({ color, label }) => (
                                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: C.muted, fontWeight: 600 }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />{label}
                                </span>
                            ))}
                        </div>

                        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 2 }}>
                            {drivers.length === 0
                                ? <div style={{ textAlign: 'center', padding: '2rem', color: C.faint }}><User size={28} style={{ opacity: 0.25 }} /><p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>No drivers found</p></div>
                                : drivers.map(d => {
                                    const hasLoc = d.currentLocation?.lat && d.currentLocation?.lng;
                                    const getVehicleIcon = type => {
                                        if (type === 'bike' || type === 'motorcycle') return <Bike size={12} color={C.muted} />;
                                        if (type === 'van'  || type === 'truck')      return <Truck size={12} color={C.muted} />;
                                        if (type === 'car')                           return <Car size={12} color={C.muted} />;
                                        return null;
                                    };
                                    return (
                                        <div key={d._id} style={{ padding: '0.75rem', borderRadius: 12, background: '#f8fafc', border: `1px solid ${C.border}`, marginBottom: '0.5rem', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                                            {/* Top row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                                                    {d.fullName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <p style={{ margin: 0, fontWeight: 700, color: C.navy, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fullName}</p>
                                                        {/* Approval dot */}
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.isApproved ? C.green : C.amber, flexShrink: 0 }} title={d.isApproved ? 'Approved' : 'Pending approval'} />
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.68rem', color: C.faint }}>
                                                        {hasLoc ? `${d.currentLocation.lat.toFixed(4)}° N, ${d.currentLocation.lng.toFixed(4)}° E` : 'Location unavailable'}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasLoc ? C.green : '#cbd5e1' }} />
                                                    <span style={{ fontSize: '0.58rem', color: hasLoc ? C.green : C.faint, fontWeight: 600 }}>{hasLoc ? 'Active' : 'Offline'}</span>
                                                </div>
                                            </div>
                                            {/* Bottom row — vehicle + deliveries */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: `1px solid ${C.border}`, gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: C.muted, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {d.vehicleType
                                                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                                            {getVehicleIcon(d.vehicleType)}
                                                            <span style={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{d.vehicleType}</span>
                                                            {d.vehiclePlate ? <span style={{ whiteSpace: 'nowrap' }}>· {d.vehiclePlate}</span> : ''}
                                                          </span>
                                                        : <span style={{ color: C.faint }}>No vehicle info</span>}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.navy, background: '#e2e8f0', padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    {d.totalDeliveries} {d.totalDeliveries === 1 ? 'delivery' : 'deliveries'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div style={{ marginTop: '0.85rem', borderTop: `1px solid ${C.border}`, paddingTop: '0.85rem' }}>
                            <Link to="/drivers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: C.navy, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', padding: '0.5rem', borderRadius: 8, background: '#f8fafc', border: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                                View All Drivers <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Performance Insights ── */}
                <div className="insights-grid">
                    {[
                        { title: 'Completion Rate', value: `${stats.completion}%`, icon: <Target size={20}/>, color: C.green, bar: stats.completion, barColor: `linear-gradient(90deg,${C.teal},${C.green})`, sub: `${orders.filter(isDone).length} of ${orders.length} completed` },
                        { title: 'Cancelled Rate',  value: `${orders.length ? Math.round((stats.cancelled/orders.length)*100) : 0}%`, icon: <XCircle size={20}/>, color: C.red, bar: orders.length ? Math.round((stats.cancelled/orders.length)*100) : 0, barColor: `linear-gradient(90deg,${C.red},#f87171)`, sub: `${stats.cancelled} cancelled total` },
                        { title: 'Total Drivers',   value: drivers.length, icon: <Star size={20}/>, color: C.purple, bar: drivers.length ? Math.min(100,(drivers.filter(d=>d.currentLocation?.lat).length/drivers.length)*100) : 0, barColor: `linear-gradient(90deg,${C.purple},#a78bfa)`, sub: `${drivers.filter(d=>d.currentLocation?.lat).length} sharing location` },
                    ].map(({ title, value, icon, color, bar, barColor, sub }) => (
                        <div key={title} style={{ background: C.white, borderRadius: 14, padding: '1.25rem', border: `1px solid ${C.border}`, ...shadow }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{title}</p>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.navy, margin: '0.1rem 0 0' }}>{value}</h2>
                                </div>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                            </div>
                            <div style={{ background: '#f1f5f9', borderRadius: 999, height: 7, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${bar}%`, background: barColor, borderRadius: 999 }} />
                            </div>
                            <p style={{ fontSize: '0.7rem', color: C.faint, margin: '0.4rem 0 0' }}>{sub}</p>
                        </div>
                    ))}

                    {/* Orders Per Day */}
                    <div style={{ background: C.white, borderRadius: 14, padding: '1.25rem', border: `1px solid ${C.border}`, ...shadow }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <div>
                                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Orders Per Day</p>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.navy, margin: '0.1rem 0 0' }}>Last 7 Days</h2>
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.navy}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.navy }}><TrendingUp size={20}/></div>
                        </div>
                        <ResponsiveContainer width="100%" height={90}>
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 9, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.78rem' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="count" fill={C.navy} radius={[5,5,0,0]} name="Orders" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ── Top Customers ── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h5 style={{ fontWeight: 800, color: C.navy, margin: 0, fontSize: '1rem' }}>Top Customers</h5>
                            <p style={{ color: C.faint, fontSize: '0.75rem', margin: '0.15rem 0 0' }}>Ranked by total number of orders</p>
                        </div>
                        <Link to="/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: C.navy, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>View All <ArrowRight size={13}/></Link>
                    </div>

                    <div className="topcust-grid">
                        {topCust.length === 0
                            ? <div style={{ background: C.white, borderRadius: 14, padding: '2rem', textAlign: 'center', color: C.faint, gridColumn: 'span 3', border: `1px solid ${C.border}` }}><User size={32} style={{ opacity: 0.25 }} /><p style={{ margin: '0.5rem 0 0' }}>No customer data yet</p></div>
                            : topCust.map((c, i) => {
                                const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309';
                                return (
                                    <div key={c.id} style={{ background: C.white, borderRadius: 14, padding: '1.4rem', border: `1px solid ${C.border}`, borderTop: `3px solid ${rankColor}`, ...shadow, position: 'relative', overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,31,79,0.12)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)'; }}>
                                        <div style={{ position: 'absolute', right: '0.75rem', top: '0.5rem', fontSize: '3.5rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, userSelect: 'none' }}>{i+1}</div>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ width: 46, height: 46, borderRadius: '50%', background: i===0?'#fef3c7':i===1?'#f1f5f9':'#fef2e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: i===0?'#92400e':i===1?'#475569':'#92400e', flexShrink: 0 }}>
                                                    {c.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email || '—'}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                                {[{ label: 'Orders', val: c.orders, color: C.navy },{ label: 'Spent', val: `₦${c.spent.toLocaleString()}`, color: C.green }].map(({ label, val, color }) => (
                                                    <div key={label} style={{ flex: 1, background: '#f8fafc', borderRadius: 9, padding: '0.55rem 0.7rem' }}>
                                                        <p style={{ margin: 0, fontSize: '0.65rem', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                                                        <p style={{ margin: 0, fontWeight: 800, color, fontSize: '1rem' }}>{val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                {i===0?<Trophy size={15} color="#f59e0b"/>:i===1?<Medal size={15} color="#94a3b8"/>:<Medal size={15} color="#b45309"/>}
                                                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: rankColor }}>{i===0?'Top Customer':i===1?'2nd Place':'3rd Place'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;