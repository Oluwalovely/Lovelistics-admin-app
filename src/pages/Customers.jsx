import { useState, useEffect } from "react";
import { getAllCustomers } from "../services/api";


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await getAllCustomers();
        setCustomers(res.data.data);
      } catch (err) {
        setError("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    search === ""
      ? true
      : c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search),
  );

  return (
    <>
      
      <div className="container-fluid py-4" style={{ maxWidth: 1400 }}>
        <div className="mb-4">
          <h5 className="fw-bold mb-0" style={{ color: "#0d1f4f" }}>
            Customers
          </h5>
          <p className="text-muted mb-0 small">
            {customers.length} registered customers
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
            <p className="text-muted">No customers found.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr key={customer._id}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#e8610a",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {customer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-semibold">
                            {customer.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted">{customer.email}</td>
                      <td className="py-3 px-4 text-muted">{customer.phone}</td>
                      <td className="py-3 px-4 text-muted">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
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

export default Customers;
