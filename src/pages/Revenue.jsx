import { useState, useEffect } from 'react';
import { getAllOrders } from '../services/api';
import {
    TrendingUp, DollarSign, Package, Calendar,
    Award, AlertCircle,
} from 'lucide-react';

const C = {
    navy: '#0d1f4f', navyL: '#162660', orange: '#e8610a',
    bg: '#f1f4f9', white: '#ffffff', border: '#e8edf7',
    muted: '#64748b', faint: '#94a3b8', green: '#16a34a',
    red: '#dc2626', purple: '#7c3aed', blue: '#2563eb',
};
const shadow = { boxShadow: '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)' };
const fmt   = n => '₦' + (n || 0).toLocaleString('en-NG');
const fmtSh = n => n >= 1_000_000 ? '₦' + (n / 1_000_000).toFixed(1) + 'M'
                 : n >= 1_000     ? '₦' + (n / 1_000).toFixed(1) + 'K'
                 : '₦' + (n || 0).toLocaleString();

/* ── KPI Card ── */
const KPI = ({ label, value, sub, icon, color, delay = 0 }) => (
    <div style={{ background: C.white, borderRadius: 16, padding: '1.5rem', border: `1px solid ${C.border}`, ...shadow, animation: `fadeInUp 0.4s ease ${delay}s both` }}>
        <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                {icon}
            </div>
        </div>
        <p style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: C.navy, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</p>
        <p style={{ margin: '0.3rem 0 0.2rem', fontSize: '0.72rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: C.faint }}>{sub}</p>
    </div>
);

/* ── Bar Chart ── */
const BarChart = ({ data }) => {
    if (!data.length) return (
        <p style={{ textAlign: 'center', color: C.faint, fontSize: '0.8rem', padding: '2rem 0' }}>No data yet</p>
    );
    const max = Math.max(...data.map(d => d.total), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '0 0.25rem' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 0 }}
                    title={`${d._id}: ${fmt(d.total)}`}>
                    <div style={{ width: '100%', background: `${C.navy}12`, borderRadius: '4px 4px 0 0', position: 'relative', height: 100 }}>
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: `linear-gradient(180deg, ${C.orange} 0%, ${C.navy} 100%)`,
                            borderRadius: '4px 4px 0 0',
                            height: `${Math.max((d.total / max) * 100, 2)}%`,
                            transition: 'height 0.6s ease',
                        }} />
                    </div>
                    <span style={{ fontSize: '0.55rem', color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {d._id?.slice(5)}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ── Revenue Page ── */
const Revenue = () => {
    const [orders,     setOrders]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [period,     setPeriod]     = useState('month');
    const [driverSort, setDriverSort] = useState('total');

    useEffect(() => {
        getAllOrders()
            .then(r => setOrders(r.data.data || []))
            .catch(() => setError('Failed to load revenue data'))
            .finally(() => setLoading(false));
    }, []);

    const revenueStatuses = ['delivered', 'confirmed'];
    const paid = orders.filter(o => revenueStatuses.includes(o.status));

    const now        = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek  = new Date(now); startWeek.setDate(now.getDate() - now.getDay()); startWeek.setHours(0,0,0,0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sum = arr => arr.reduce((a, o) => a + (o.price || 0), 0);

    const stats = {
        allTime: { total: sum(paid),                                                  count: paid.length },
        today:   { total: sum(paid.filter(o => new Date(o.createdAt) >= startToday)), count: paid.filter(o => new Date(o.createdAt) >= startToday).length },
        week:    { total: sum(paid.filter(o => new Date(o.createdAt) >= startWeek)),  count: paid.filter(o => new Date(o.createdAt) >= startWeek).length },
        month:   { total: sum(paid.filter(o => new Date(o.createdAt) >= startMonth)), count: paid.filter(o => new Date(o.createdAt) >= startMonth).length },
    };

    // Last 30 days daily breakdown
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const dailyMap = {};
    paid.filter(o => new Date(o.createdAt) >= last30).forEach(o => {
        const day = new Date(o.createdAt).toISOString().slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { _id: day, total: 0, count: 0 };
        dailyMap[day].total += o.price || 0;
        dailyMap[day].count += 1;
    });
    const daily = Object.values(dailyMap).sort((a, b) => a._id.localeCompare(b._id));

    // Per driver
    const driverMap = {};
    paid.filter(o => o.driver).forEach(o => {
        const id   = o.driver._id || o.driver;
        const name = o.driver?.fullName || 'Unknown';
        if (!driverMap[id]) driverMap[id] = { id, name, total: 0, count: 0 };
        driverMap[id].total += o.price || 0;
        driverMap[id].count += 1;
    });
    const byDriver = Object.values(driverMap).sort((a, b) => b[driverSort] - a[driverSort]);

    const tabs = [
        { key: 'today',   label: 'Today' },
        { key: 'week',    label: 'Week' },
        { key: 'month',   label: 'Month' },
        { key: 'allTime', label: 'All Time' },
    ];
    const periodLabels = { today: 'Today', week: 'This Week', month: 'This Month', allTime: 'All Time' };
    const current = stats[period];

    return (
        <div style={{ fontFamily: "'Sora', system-ui, sans-serif", padding: '0 0 3rem' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; }
                @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                .kpi-grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; }
                .rev-grid  { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }
                @media(max-width:1024px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
                @media(max-width:768px)  { .kpi-grid { grid-template-columns:1fr 1fr; } .rev-grid { grid-template-columns:1fr; } }
                @media(max-width:480px)  { .kpi-grid { grid-template-columns:1fr; } }
                .period-tab  { border:none; cursor:pointer; border-radius:9px; padding:0.45rem 1rem; font-size:0.8rem; font-weight:600; font-family:inherit; transition:all 0.15s; }
                .driver-row:hover { background:#f8fafc !important; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.35s ease both' }}>
                <h1 style={{ margin: 0, fontWeight: 900, color: C.navy, fontSize: '1.4rem', letterSpacing: '-0.3px' }}>Revenue</h1>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: C.faint }}>Track earnings from delivered and confirmed orders</p>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center', color: C.faint }}>Loading revenue data...</div>
            ) : error ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.red, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem 1.25rem' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="kpi-grid" style={{ marginBottom: '1.75rem' }}>
                        <KPI label="All-Time Revenue" value={fmtSh(stats.allTime.total)} sub={`${stats.allTime.count} orders`} icon={<TrendingUp size={20}/>} color={C.navy}   delay={0}    />
                        <KPI label="This Month"       value={fmtSh(stats.month.total)}   sub={`${stats.month.count} orders`}   icon={<Calendar size={20}/>}   color={C.blue}   delay={0.05} />
                        <KPI label="This Week"        value={fmtSh(stats.week.total)}    sub={`${stats.week.count} orders`}    icon={<DollarSign size={20}/>}  color={C.purple} delay={0.10} />
                        <KPI label="Today"            value={fmtSh(stats.today.total)}   sub={`${stats.today.count} orders`}   icon={<Package size={20}/>}     color={C.orange} delay={0.15} />
                    </div>

                    {/* Period breakdown + chart */}
                    <div className="rev-grid" style={{ marginBottom: '1.5rem' }}>

                        {/* Period selector card */}
                        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: '1.5rem', ...shadow, animation: 'fadeInUp 0.4s ease 0.2s both' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '0.95rem' }}>Revenue Breakdown</h3>
                                <div style={{ display: 'flex', gap: 4, background: '#f1f4f9', borderRadius: 11, padding: 4 }}>
                                    {tabs.map(t => (
                                        <button key={t.key} className="period-tab"
                                            onClick={() => setPeriod(t.key)}
                                            style={{ background: period === t.key ? C.navy : 'transparent', color: period === t.key ? '#fff' : C.muted }}>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                <p style={{ margin: 0, fontSize: '3rem', fontWeight: 900, color: C.navy, letterSpacing: '-1px', lineHeight: 1 }}>
                                    {fmt(current.total)}
                                </p>
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: C.faint, fontWeight: 500 }}>
                                    {periodLabels[period]} · {current.count} {current.count === 1 ? 'order' : 'orders'}
                                </p>
                            </div>

                            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {tabs.map(t => (
                                    <div key={t.key} onClick={() => setPeriod(t.key)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', borderRadius: 10, background: period === t.key ? `${C.navy}08` : 'transparent', border: `1px solid ${period === t.key ? `${C.navy}20` : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: period === t.key ? C.navy : C.muted }}>{t.label}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: C.navy }}>{fmtSh(stats[t.key].total)}</span>
                                            <span style={{ fontSize: '0.7rem', color: C.faint, marginLeft: 6 }}>{stats[t.key].count} orders</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar chart */}
                        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: '1.5rem', ...shadow, animation: 'fadeInUp 0.4s ease 0.25s both' }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <h3 style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '0.95rem' }}>Daily Revenue</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.73rem', color: C.faint }}>Last 30 days · delivered & confirmed orders</p>
                            </div>
                            <BarChart data={daily} />
                            {daily.length > 0 && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.68rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak Day</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: C.navy, fontSize: '0.9rem' }}>
                                            {fmtSh(Math.max(...daily.map(d => d.total)))}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '0.68rem', color: C.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg / Day</p>
                                        <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: C.navy, fontSize: '0.9rem' }}>
                                            {fmtSh(daily.reduce((a, d) => a + d.total, 0) / daily.length)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Revenue per driver */}
                    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', ...shadow, animation: 'fadeInUp 0.4s ease 0.3s both' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '0.95rem' }}>Revenue by Driver</h3>
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.73rem', color: C.faint }}>All-time earnings per driver</p>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[{ key: 'total', label: 'By Revenue' }, { key: 'count', label: 'By Orders' }].map(s => (
                                    <button key={s.key} onClick={() => setDriverSort(s.key)}
                                        style={{ padding: '0.35rem 0.85rem', borderRadius: 8, border: `1px solid ${driverSort === s.key ? C.navy : C.border}`, background: driverSort === s.key ? C.navy : 'transparent', color: driverSort === s.key ? '#fff' : C.muted, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {byDriver.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: C.faint, fontSize: '0.85rem' }}>
                                No driver revenue data yet
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 120px 80px 160px', gap: '0.75rem', padding: '0.65rem 1.5rem', background: '#f8fafc', borderBottom: `1px solid ${C.border}` }}>
                                    {['#', 'Driver', 'Revenue', 'Orders', 'Share'].map(h => (
                                        <span key={h} style={{ fontSize: '0.67rem', fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
                                    ))}
                                </div>
                                {byDriver.map((d, i) => {
                                    const share = stats.allTime.total ? (d.total / stats.allTime.total) * 100 : 0;
                                    return (
                                        <div key={d.id} className="driver-row"
                                            style={{ display: 'grid', gridTemplateColumns: '2rem 1fr 120px 80px 160px', gap: '0.75rem', padding: '0.9rem 1.5rem', borderBottom: `1px solid ${C.border}`, alignItems: 'center', background: C.white, transition: 'background 0.12s' }}>
                                            <div style={{ width: 26, height: 26, borderRadius: 8, background: i < 3 ? `${[C.orange, C.blue, C.purple][i]}15` : '#f1f4f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {i < 3
                                                    ? <Award size={13} color={[C.orange, C.blue, C.purple][i]} />
                                                    : <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.faint }}>{i + 1}</span>
                                                }
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {d.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: C.navy, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                            </div>
                                            <span style={{ fontWeight: 800, color: C.navy, fontSize: '0.88rem' }}>{fmtSh(d.total)}</span>
                                            <span style={{ fontWeight: 600, color: C.muted, fontSize: '0.82rem' }}>{d.count}</span>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: 6, background: '#f1f4f9', borderRadius: 999, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${share}%`, background: `linear-gradient(90deg, ${C.orange}, ${C.navy})`, borderRadius: 999, transition: 'width 0.5s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.muted, minWidth: 30, textAlign: 'right' }}>{share.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Revenue;