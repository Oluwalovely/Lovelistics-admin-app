import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from 'lucide-react';
import {
  getMyNotifications,
  markAllAsRead,
  markOneAsRead,
} from "../services/api";

const notifAccent = {
  ORDER_PLACED: "#0d1f4f",
  DRIVER_ASSIGNED: "#e8610a",
  ORDER_PICKED_UP: "#0d6efd",
  ORDER_IN_TRANSIT: "#e8610a",
  ORDER_DELIVERED: "#198754",
  ORDER_CONFIRMED: "#198754",
  ORDER_CANCELLED: "#dc3545",
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications();
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const handleClick = async (notif) => {
    try {
      if (!notif.isRead) await markOneAsRead(notif._id);
      if (notif.order?._id) navigate(`/orders/${notif.order._id}`);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-7">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0" style={{ color: "#0d1f4f" }}>
                  Notifications
                </h5>
                {unreadCount > 0 && (
                  <small className="text-muted">{unreadCount} unread</small>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm fw-semibold"
                  onClick={handleMarkAllRead}
                  style={{
                    border: "1px solid #0d1f4f",
                    color: "#0d1f4f",
                    borderRadius: 8,
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: "#0d1f4f" }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5">
                <Bell size={48} color="#dde2ef" className="mx-auto mb-3" />
                <p className="text-muted">No notifications yet</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {notifications.map((notif) => {
                  const accent = notifAccent[notif.type] || "#0d1f4f";
                  return (
                    <div
                      key={notif._id}
                      className="card border-0 shadow-sm"
                      onClick={() => handleClick(notif)}
                      style={{
                        borderRadius: 14,
                        cursor: "pointer",
                        borderLeft: `4px solid ${notif.isRead ? "#e8edf7" : accent}`,
                        background: notif.isRead ? "#fff" : "#fafbff",
                        transition: "box-shadow 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 4px 16px rgba(13,31,79,0.1)")
                      }
                      onMouseOut={(e) => (e.currentTarget.style.boxShadow = "")}
                    >
                      <div className="card-body py-3">
                        <div className="d-flex align-items-start gap-3">
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              background: "#f4f6fb",
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              color: accent,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {notif.type?.split("_")[1]?.charAt(0) || "N"}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <p
                                className="mb-0 small"
                                style={{
                                  fontWeight: notif.isRead ? 500 : 700,
                                  color: "#0d1f4f",
                                }}
                              >
                                {notif.title}
                              </p>
                              <small
                                className="text-muted flex-shrink-0"
                                style={{ fontSize: "0.72rem" }}
                              >
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            <p
                              className="mb-0 text-muted"
                              style={{ fontSize: "0.8rem", marginTop: 2 }}
                            >
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: accent,
                                flexShrink: 0,
                                marginTop: 6,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
