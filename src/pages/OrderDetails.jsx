import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Package, Camera, User, Phone, Car, XCircle, Navigation, Trash2 } from 'lucide-react';
import { getOrderById, assignDriver, cancelOrder, getAllDrivers, getLatestLocation, deleteOrder } from '../services/api';
import SidebarLayout from '../components/Sidebarlayout';

const statusColor = {
    'pending':    '#f5a623',
    'assigned':   '#0d6efd',
    'picked-up':  '#0d6efd',
    'in-transit': '#e8610a',
    'delivered':  '#198754',
    'confirmed':  '#198754',
    'cancelled':  '#dc3545',
};

const AddressBlock = ({ label, address, nameKey, phoneKey }) => (
    <div className="flex-fill p-3 rounded" style={{ background: '#f4f6fb' }}>
        <small className="text-muted d-block mb-2" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</small>
        <p className="mb-0 fw-semibold small">{address?.street}</p>
        <small className="text-muted">{address?.city}</small>
        {(address?.[nameKey] || address?.[phoneKey]) && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #e0e5f0' }}>
                {address?.[nameKey] && (
                    <div className="d-flex align-items-center gap-1 mb-1">
                        <User size={11} color="#94a3b8" />
                        <small style={{ fontSize: '0.72rem', color: '#0d1f4f', fontWeight: 600 }}>{address[nameKey]}</small>
                    </div>
                )}
                {address?.[phoneKey] && (
                    <div className="d-flex align-items-center gap-1">
                        <Phone size={11} color="#94a3b8" />
                        <a href={`tel:${address[phoneKey]}`} style={{ fontSize: '0.72rem', color: '#e8610a', fontWeight: 600, textDecoration: 'none' }}>
                            {address[phoneKey]}
                        </a>
                    </div>
                )}
            </div>
        )}
    </div>
);

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [lightboxImg, setLightboxImg] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const locationInterval = useRef(null);

    const fetchOrder = async () => {
        try {
            const res = await getOrderById(orderId);
            setOrder(res.data.data);
        } catch (err) {
            setError('Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await getAllDrivers();
            setDrivers(res.data.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => { fetchOrder(); fetchDrivers(); }, [orderId]);

    useEffect(() => {
        if (!order) return;
        const isActive = ['picked-up', 'in-transit'].includes(order.status);
        if (isActive) {
            const poll = async () => {
                try { const res = await getLatestLocation(order._id); setDriverLocation(res.data.data); } catch (err) { console.log(err); }
            };
            poll();
            locationInterval.current = setInterval(poll, 5000);
        }
        return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
    }, [order?.status]);

    const handleAssign = async () => {
        if (!selectedDriver) return;
        setAssigning(true);
        setError('');
        try {
            await assignDriver(orderId, selectedDriver);
            setMessage('Driver assigned successfully!');
            await fetchOrder();
            await fetchDrivers();
        } catch (err) {
            setError(err.response?.data?.message || 'Error assigning driver');
        } finally {
            setAssigning(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        setError('');
        try {
            await cancelOrder(orderId);
            setMessage('Order cancelled successfully.');
            fetchOrder();
        } catch (err) {
            setError(err.response?.data?.message || 'Error cancelling order');
        } finally {
            setCancelling(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteOrder(orderId);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error deleting order');
            setDeleting(false);
        }
    };

    if (loading) return (
        <SidebarLayout>
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <div className="spinner-border" style={{ color: '#0d1f4f' }} />
            </div>
        </SidebarLayout>
    );

    if (!order) return (
        <SidebarLayout>
            <div className="container py-4">
                <div className="alert alert-danger">{error || 'Order not found'}</div>
            </div>
        </SidebarLayout>
    );

    const availableDrivers = drivers.filter(d => d.isAvailable);
    const unavailableDrivers = drivers.filter(d => !d.isAvailable);

    return (
        <SidebarLayout>
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">

                        <button className="btn btn-link p-0 mb-3 text-muted" onClick={() => navigate('/dashboard')}>← Back to Orders</button>

                        {message && <div className="alert alert-success py-2 small">{message}</div>}
                        {error && <div className="alert alert-danger py-2 small">{error}</div>}

                        
                        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-0" style={{ color: '#0d1f4f' }}>#{order.trackingNumber}</h5>
                                    <small className="text-muted">Placed {new Date(order.createdAt).toLocaleDateString('en-GB')}</small>
                                </div>
                                <span className="badge fs-6" style={{ background: statusColor[order.status], color: '#fff' }}>{order.status.toUpperCase()}</span>
                            </div>
                        </div>

                        
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><User size={16} /> Customer</h6>
                                        <p className="mb-1 small"><strong>Name:</strong> {order.customer?.fullName}</p>
                                        <p className="mb-1 small"><strong>Email:</strong> {order.customer?.email}</p>
                                        <p className="mb-0 small"><strong>Phone:</strong> {order.customer?.phone}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 14 }}>
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><Car size={16} /> Driver</h6>
                                        {order.driver ? (
                                            <>
                                                <p className="mb-1 small"><strong>Name:</strong> {order.driver.fullName}</p>
                                                <p className="mb-1 small"><strong>Email:</strong> {order.driver.email}</p>
                                                <p className="mb-0 small"><strong>Phone:</strong> {order.driver.phone}</p>
                                            </>
                                        ) : (
                                            <p className="text-muted small">No driver assigned yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
                            <div className="card-body">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><MapPin size={16} /> Delivery Route</h6>
                                <div className="d-flex gap-3">
                                    <AddressBlock label="Pickup" address={order.pickupAddress} nameKey="senderName" phoneKey="senderPhone" />
                                    <div className="d-flex align-items-center text-muted">→</div>
                                    <AddressBlock label="Delivery" address={order.deliveryAddress} nameKey="receiverName" phoneKey="receiverPhone" />
                                </div>
                            </div>
                        </div>

                        {/* Package */}
                        <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
                            <div className="card-body">
                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><Package size={16} /> Package Details</h6>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <p className="mb-1 text-muted small">Description</p>
                                        <p className="mb-0 small">{order.packageDescription || 'N/A'}</p>
                                    </div>
                                    <div className="col-3">
                                        <p className="mb-1 text-muted small">Weight</p>
                                        <p className="mb-0 small">{order.weight} kg</p>
                                    </div>
                                    <div className="col-3">
                                        <p className="mb-1 text-muted small">Price</p>
                                        <p className="mb-0 fw-bold small" style={{ color: '#e8610a' }}>₦{order.price?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        {order.images?.length > 0 && (
                            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
                                <div className="card-body">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><Camera size={16} /> Package Photos</h6>
                                    <div className="d-flex gap-3 flex-wrap">
                                        {order.images.map((img, i) => (
                                            <img key={i} src={img.url} alt={`Package ${i + 1}`} onClick={() => setLightboxImg(img.url)}
                                                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, border: '2px solid #e8edf7', cursor: 'pointer' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        
                        {['picked-up', 'in-transit'].includes(order.status) && (
                            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14, borderLeft: '4px solid #198754' }}>
                                <div className="card-body">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><Navigation size={16} /> Driver Live Location</h6>
                                    {driverLocation ? (
                                        <>
                                            <div className="row g-2 mb-2">
                                                <div className="col-6"><p className="mb-1 text-muted small">Latitude</p><p className="mb-0 fw-semibold small">{driverLocation.location.lat.toFixed(6)}</p></div>
                                                <div className="col-6"><p className="mb-1 text-muted small">Longitude</p><p className="mb-0 fw-semibold small">{driverLocation.location.lng.toFixed(6)}</p></div>
                                                {driverLocation.speed && <div className="col-6"><p className="mb-1 text-muted small">Speed</p><p className="mb-0 fw-semibold small">{driverLocation.speed} m/s</p></div>}
                                                <div className="col-6"><p className="mb-1 text-muted small">Last Updated</p><p className="mb-0 fw-semibold small">{new Date(driverLocation.recordedAt).toLocaleTimeString()}</p></div>
                                            </div>
                                            <a href={`https://www.google.com/maps?q=${driverLocation.location.lat},${driverLocation.location.lng}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                                                style={{ background: '#0d1f4f', color: '#fff', borderRadius: 8, width: 'fit-content' }}>
                                                <MapPin size={14} /> View on Google Maps
                                            </a>
                                        </>
                                    ) : (
                                        <p className="text-muted small mb-0">Waiting for driver to share location...</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Assign Driver */}
                        {!['delivered', 'confirmed', 'cancelled'].includes(order.status) && (
                            <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}>
                                <div className="card-body">
                                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0d1f4f' }}><Car size={16} /> {order.driver ? 'Reassign Driver' : 'Assign Driver'}</h6>
                                    <div className="d-flex gap-2">
                                        <select className="form-select" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}
                                            style={{ borderRadius: 10, fontSize: '0.9rem', color: '#0d1f4f' }}>
                                            <option value="">Select a driver...</option>
                                            {availableDrivers.map(d => <option key={d._id} value={d._id}>{d.fullName} — {d.phone}</option>)}
                                            {unavailableDrivers.length > 0 && <option disabled>── Unavailable ──</option>}
                                            {unavailableDrivers.map(d => <option key={d._id} value={d._id} disabled>{d.fullName} — {d.phone} (on delivery)</option>)}
                                        </select>
                                        <button className="btn fw-bold" onClick={handleAssign} disabled={assigning || !selectedDriver}
                                            style={{ background: '#0d1f4f', color: '#fff', borderRadius: 10, whiteSpace: 'nowrap' }}>
                                            {assigning && <span className="spinner-border spinner-border-sm me-2" />}
                                            {assigning ? 'Assigning...' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!['delivered', 'confirmed', 'cancelled'].includes(order.status) && (
                            <button className="btn btn-outline-danger w-100 mb-2" style={{ borderRadius: 10 }}
                                data-bs-toggle="modal" data-bs-target="#cancelModal">Cancel Order</button>
                        )}

                        {['cancelled', 'confirmed'].includes(order.status) && (
                            <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                                style={{ borderRadius: 10 }} data-bs-toggle="modal" data-bs-target="#deleteModal">
                                <Trash2 size={16} /> Delete Order
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            <div className="modal fade" id="cancelModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0" style={{ borderRadius: 16 }}>
                        <div className="modal-body text-center p-4">
                            <div style={{ width: 60, height: 60, background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <XCircle size={30} color="#dc3545" />
                            </div>
                            <h5 className="fw-bold mb-2" style={{ color: '#0d1f4f' }}>Cancel Order?</h5>
                            <p className="text-muted small mb-4">This action cannot be undone. The order will be permanently cancelled.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }} data-bs-dismiss="modal">Go Back</button>
                                <button className="btn btn-danger px-4 fw-bold" style={{ borderRadius: 10 }} data-bs-dismiss="modal" onClick={handleCancel} disabled={cancelling}>
                                    {cancelling && <span className="spinner-border spinner-border-sm me-2" />}
                                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <div className="modal fade" id="deleteModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0" style={{ borderRadius: 16 }}>
                        <div className="modal-body text-center p-4">
                            <div style={{ width: 60, height: 60, background: '#fff0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Trash2 size={30} color="#dc3545" />
                            </div>
                            <h5 className="fw-bold mb-2" style={{ color: '#0d1f4f' }}>Delete Order?</h5>
                            <p className="text-muted small mb-4">This will permanently remove the order from the system. This cannot be undone.</p>
                            <div className="d-flex gap-2 justify-content-center">
                                <button className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }} data-bs-dismiss="modal">Go Back</button>
                                <button className="btn btn-danger px-4 fw-bold" style={{ borderRadius: 10 }} data-bs-dismiss="modal" onClick={handleDelete} disabled={deleting}>
                                    {deleting && <span className="spinner-border spinner-border-sm me-2" />}
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImg && (
                <div onClick={() => setLightboxImg(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}>
                    <img src={lightboxImg} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
                </div>
            )}
        </SidebarLayout>
    );
};

export default OrderDetails;