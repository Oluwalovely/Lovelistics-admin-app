import { useState, useEffect } from "react";
import { getAllDrivers } from "../services/api";


const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const res = await getAllDrivers();
                setDrivers(res.data.data);
            } catch (err) {
                setError("Failed to load drivers");
            } finally {
                setLoading(false);
            }
        };
        fetchDrivers();
    }, []);

    const filtered = drivers.filter((d) =>
        search === ""
            ? true
            : d.fullName.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase()) ||
            d.phone.includes(search),
    );

    return (
        <>
            {/* <div style={{backgroundColor: "#0d1f4f", height: 64}}></div> */}
            <div className="container-fluid py-4" style={{ maxWidth: 1400 }}>
                <div className="mb-4">
                    <h5 className="fw-bold mb-0" style={{ color: "#0d1f4f" }}>
                        Drivers
                    </h5>
                    <p className="text-muted mb-0 small">
                        {drivers.length} registered drivers
                    </p>
                </div>

                {/* Search */}
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            border: "1px solid #dde2ef",
                            borderRadius: 8,
                            padding: "0.4rem 0.85rem",
                            fontSize: "0.85rem",
                            outline: "none",
                            minWidth: 280,
                            color: "#0d1f4f",
                        }}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" style={{ color: "#0d1f4f" }} />
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5">
                        <p className="text-muted">No drivers found.</p>
                    </div>
                ) : (
                    <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
                        <div className="table-responsive">
                            <table
                                className="table table-hover mb-0"
                                style={{ fontSize: "0.875rem" }}
                            >
                                <thead style={{ background: "#f4f6fb" }}>
                                    <tr>
                                        <th
                                            className="py-3 px-4"
                                            style={{
                                                color: "#6b7a99",
                                                fontWeight: 600,
                                                border: "none",
                                            }}
                                        >
                                            Name
                                        </th>
                                        <th
                                            className="py-3 px-4"
                                            style={{
                                                color: "#6b7a99",
                                                fontWeight: 600,
                                                border: "none",
                                            }}
                                        >
                                            Email
                                        </th>
                                        <th
                                            className="py-3 px-4"
                                            style={{
                                                color: "#6b7a99",
                                                fontWeight: 600,
                                                border: "none",
                                            }}
                                        >
                                            Phone
                                        </th>
                                        <th
                                            className="py-3 px-4"
                                            style={{
                                                color: "#6b7a99",
                                                fontWeight: 600,
                                                border: "none",
                                            }}
                                        >
                                            Joined
                                        </th>
                                        <th
                                            className="py-3 px-4"
                                            style={{
                                                color: "#6b7a99",
                                                fontWeight: 600,
                                                border: "none",
                                            }}
                                        >
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((driver) => (
                                        <tr key={driver._id}>
                                            <td className="py-3 px-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: "50%",
                                                            background: "#0d1f4f",
                                                            color: "#fff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontWeight: 700,
                                                            fontSize: "0.85rem",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {driver.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="fw-semibold">{driver.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted">{driver.email}</td>
                                            <td className="py-3 px-4 text-muted">{driver.phone}</td>
                                            <td className="py-3 px-4 text-muted">
                                                {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="badge" style={{
                                                    background: driver.isAvailable ? '#d1e7dd' : '#fff3cd',
                                                    color: driver.isAvailable ? '#0a3622' : '#856404',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {driver.isAvailable ? 'Available' : 'On Delivery'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Drivers;
