import { useState, useEffect } from "react";
import {
    Search, Car, Bike, Truck, CheckCircle, XCircle, MapPin,
    Package, Phone, Mail, ShieldCheck, ShieldOff, Filter
} from "lucide-react";
import { getAllDrivers, approveDriver } from "../services/api";

const VehicleIcon = ({ type, color, size = 14 }) => {
    const props = { size, color };
    if (type === 'bike' || type === 'motorcycle') return <Bike {...props} />;
    if (type === 'van' || type === 'truck')       return <Truck {...props} />;
    return <Car {...props} />;
};

const C = {
    navy:   '#0d1f4f',
    orange: '#e8610a',
    teal:   '#0d9488',
    green:  '#16a34a',
    red:    '#dc2626',
    amber:  '#d97706',
    purple: '#7c3aed',
    bg:     '#f1f4f9',
    border: '#e8edf7',
    muted:  '#64748b',
    faint:  '#94a3b8',
    white:  '#ffffff',
};

const shadow = { boxShadow: '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)' };

const vehicleColor = type => {
    const colors = {
        bike:       { bg: '#f0fdf4', text: C.green,  border: '#bbf7d0' },
        motorcycle: { bg: '#faf5ff', text: C.purple, border: '#ddd6fe' },
        car:        { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
        van:        { bg: '#fff7ed', text: C.amber,  border: '#fed7aa' },
        truck:      { bg: '#fef2f2', text: C.red,    border: '#fecaca' },
    };
    return colors[type] || { bg: '#f8fafc', text: C.muted, border: C.border };
};

const DriverCard = ({ driver, onApprove }) => {
    const [approving, setApproving] = useState(false);
    const [lightbox, setLightbox] = useState(false);
    const vc = vehicleColor(driver.vehicleType);
    const hasLocation = driver.currentLocation?.lat && driver.currentLocation?.lng;

    const handleApprove = async (e) => {
        e.stopPropagation();
        setApproving(true);
        try {
            await approveDriver(driver._id);
            onApprove(driver._id);
        } catch (error) {
            alert('Failed to approve driver. Please try again.');
        } finally {
            setApproving(false);
        }
    };

    return (
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, ...shadow, overflow: 'hidden', transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(13,31,79,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)'; }}>

            {/* Card Header */}
            <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #162660 100%)`, padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                {/* Background number */}
                <div style={{ position: 'absolute', right: '1rem', top: '-0.5rem', fontSize: '5rem', fontWeight: 900, color: 'rgba(255,255,255,0.04)', lineHeight: 1, userSelect: 'none' }}>
                    {driver.totalDeliveries}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Avatar — photo if available, else initial */}
                        <div
                            onClick={driver.avatar ? (e) => { e.stopPropagation(); setLightbox(true); } : undefined}
                            style={{ width: 48, height: 48, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#fff', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', cursor: driver.avatar ? 'zoom-in' : 'default' }}>
                            {driver.avatar
                                ? <img src={driver.avatar} alt={driver.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : driver.fullName?.charAt(0).toUpperCase()
                            }
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{driver.fullName}</p>
                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                                {driver.createdAt ? `Joined ${new Date(driver.createdAt).toLocaleDateString('en-GB')}` : 'Driver'}
                            </p>
                        </div>
                    </div>
                    {/* Approval badge / Approve button */}
                    {driver.isApproved
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(22,163,74,0.2)', color: '#86efac', border: '1px solid rgba(22,163,74,0.3)' }}>
                            <ShieldCheck size={11} /> Approved
                          </span>
                        : <button onClick={handleApprove} disabled={approving}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, background: approving ? 'rgba(232,97,10,0.1)' : 'rgba(232,97,10,0.2)', color: '#fdba74', border: '1px solid rgba(232,97,10,0.3)', cursor: approving ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (!approving) e.currentTarget.style.background = 'rgba(232,97,10,0.4)'; }}
                            onMouseLeave={e => { if (!approving) e.currentTarget.style.background = 'rgba(232,97,10,0.2)'; }}>
                            <ShieldOff size={11} /> {approving ? 'Approving...' : 'Approve'}
                          </button>
                    }
                </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '1.1rem' }}>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deliveries</p>
                        <p style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '1.2rem' }}>{driver.totalDeliveries}</p>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: C.faint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Availability</p>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: driver.isAvailable ? C.green : C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {driver.isAvailable
                                ? <><CheckCircle size={13} /> Available</>
                                : <><XCircle size={13} /> On Delivery</>}
                        </p>
                    </div>
                </div>

                {/* Vehicle Info */}
                {driver.vehicleType && (
                    <div style={{ marginBottom: '0.85rem', padding: '0.7rem', borderRadius: 10, background: vc.bg, border: `1px solid ${vc.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <VehicleIcon type={driver.vehicleType} color={vc.text} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: vc.text, textTransform: 'capitalize' }}>{driver.vehicleType}{driver.vehicleModel ? ` · ${driver.vehicleModel}` : ''}</p>
                                    {driver.vehicleColor && <p style={{ margin: 0, fontSize: '0.68rem', color: C.faint }}>{driver.vehicleColor}</p>}
                                </div>
                            </div>
                            {driver.vehiclePlate && (
                                <span style={{ fontWeight: 800, fontSize: '0.75rem', color: vc.text, background: C.white, padding: '3px 8px', borderRadius: 6, border: `1px solid ${vc.border}`, letterSpacing: '1px' }}>
                                    {driver.vehiclePlate}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: C.muted }}>
                        <Mail size={12} color={C.faint} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: C.muted }}>
                        <Phone size={12} color={C.faint} style={{ flexShrink: 0 }} />
                        {driver.phone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: C.muted }}>
                        <MapPin size={12} color={C.faint} style={{ flexShrink: 0 }} />
                        {hasLocation
                            ? `${driver.currentLocation.lat.toFixed(4)}° N, ${driver.currentLocation.lng.toFixed(4)}° E`
                            : 'Location unavailable'}
                    </div>
                </div>

                {/* License */}
                {driver.licenseNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.7rem', background: '#f8fafc', borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <Car size={12} color={C.faint} />
                        <span style={{ fontSize: '0.72rem', color: C.muted, fontWeight: 500 }}>License:</span>
                        <span style={{ fontSize: '0.72rem', color: C.navy, fontWeight: 700 }}>{driver.licenseNumber}</span>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && driver.avatar && (
                <div
                    onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}
                >
                    <img src={driver.avatar} alt={driver.fullName} style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{driver.fullName}</p>
                </div>
            )}
        </div>
    );
};

const Drivers = () => {
    const [drivers,  setDrivers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [search,   setSearch]   = useState('');
    const [filter,   setFilter]   = useState('all');

    useEffect(() => {
        getAllDrivers()
            .then(r => setDrivers(r.data.data))
            .catch(() => setError('Failed to load drivers'))
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = (driverId) => {
        setDrivers(prev => prev.map(d =>
            d._id === driverId ? { ...d, isApproved: true } : d
        ));
    };

    const filtered = drivers.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !search ||
            d.fullName?.toLowerCase().includes(q) ||
            d.email?.toLowerCase().includes(q) ||
            d.phone?.includes(q) ||
            d.vehiclePlate?.toLowerCase().includes(q);

        const matchFilter =
            filter === 'all'         ? true :
            filter === 'approved'    ? d.isApproved :
            filter === 'pending'     ? !d.isApproved :
            filter === 'available'   ? d.isAvailable :
            filter === 'on-delivery' ? !d.isAvailable : true;

        return matchSearch && matchFilter;
    });

    const stats = {
        total:      drivers.length,
        approved:   drivers.filter(d => d.isApproved).length,
        available:  drivers.filter(d => d.isAvailable).length,
        deliveries: drivers.reduce((s, d) => s + (d.totalDeliveries || 0), 0),
    };

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .drivers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
                .drivers-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
                @media(max-width: 1200px) { .drivers-grid { grid-template-columns: repeat(2, 1fr); } }
                @media(max-width: 900px)  { .drivers-stats { grid-template-columns: repeat(2, 1fr); } }
                @media(max-width: 768px)  { .drivers-grid { grid-template-columns: 1fr; } .drivers-stats { grid-template-columns: repeat(2, 1fr); } }
                @media(max-width: 320px)  { .drivers-stats { grid-template-columns: 1fr; } }
            `}</style>

            <div style={{ maxWidth: 1500, margin: '0 auto', padding: '1.5rem 1rem 2.5rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontWeight: 800, color: C.navy, fontSize: '1.4rem', margin: 0 }}>Drivers</h1>
                    <p style={{ color: C.faint, margin: '0.2rem 0 0', fontSize: '0.82rem' }}>{drivers.length} registered drivers on the platform</p>
                </div>

                {/* Stats */}
                <div className="drivers-stats">
                    {[
                        { label: 'Total Drivers',    value: stats.total,      color: C.navy,   icon: <Car size={20}/> },
                        { label: 'Approved',         value: stats.approved,   color: C.green,  icon: <ShieldCheck size={20}/> },
                        { label: 'Available Now',    value: stats.available,  color: C.teal,   icon: <CheckCircle size={20}/> },
                        { label: 'Total Deliveries', value: stats.deliveries, color: C.orange, icon: <Package size={20}/> },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} style={{ background: C.white, borderRadius: 14, padding: '1.1rem 1.25rem', border: `1px solid ${C.border}`, ...shadow, display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.7px' }}>{label}</p>
                                <h3 style={{ margin: 0, fontWeight: 800, color: C.navy, fontSize: '1.5rem', lineHeight: 1.1 }}>{value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search + Filters */}
                <div style={{ background: C.white, borderRadius: 14, padding: '1rem 1.25rem', border: `1px solid ${C.border}`, ...shadow, marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, phone or plate..."
                            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: '0.82rem', color: C.navy, outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Filter size={14} color={C.faint} />
                        {['all','approved','pending','available','on-delivery'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                style={{ padding: '0.35rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', border: filter === f ? 'none' : `1px solid ${C.border}`, background: filter === f ? C.navy : C.white, color: filter === f ? '#fff' : C.muted, transition: 'all 0.15s' }}>
                                {f === 'on-delivery' ? 'On Delivery' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="spinner-border" style={{ color: C.navy, width: 40, height: 40 }} />
                        <p style={{ color: C.faint, marginTop: '1rem' }}>Loading drivers...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger" style={{ borderRadius: 12 }}>{error}</div>
                ) : filtered.length === 0 ? (
                    <div style={{ background: C.white, borderRadius: 16, padding: '3rem', textAlign: 'center', border: `1px solid ${C.border}` }}>
                        <Car size={40} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                        <h6 style={{ color: C.navy, fontWeight: 700 }}>No drivers found</h6>
                        <p style={{ color: C.faint, fontSize: '0.85rem', margin: 0 }}>Try adjusting your search or filter.</p>
                    </div>
                ) : (
                    <div className="drivers-grid">
                        {filtered.map(d => <DriverCard key={d._id} driver={d} onApprove={handleApprove} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Drivers;