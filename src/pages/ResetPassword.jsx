import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const otp = location.state?.otp || '';

    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!email || !otp) navigate('/forgot-password');
    }, [email, otp]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (formData.newPassword !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        setError('');
        try {
            await resetPassword({ email, otp, newPassword: formData.newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div className="auth-brand">
                        <img src={logo} alt="LOVELISTICS" className="auth-logo" />
                        <span className="auth-brand-name">LOVELISTICS</span>
                    </div>
                    <div className="auth-divider" />
                    <div className="success-circle">
                        <CheckCircle size={36} color="#198754" />
                    </div>
                    <h6 className="auth-title" style={{ textAlign: 'center', marginTop: '1rem' }}>Password Reset Successful</h6>
                    <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                        Your password has been updated. Redirecting you to login...
                    </p>
                    <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', justifyContent: 'center' }}>
                        Go to Login
                    </Link>
                    <style>{`
                        .auth-page { min-height: 100vh; background: #f4f6fb; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
                        .auth-card { background: #fff; border-radius: 16px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 4px 24px rgba(13,31,79,0.08); }
                        .auth-brand { text-align: center; margin-bottom: 1rem; }
                        .auth-logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 0.5rem; }
                        .auth-brand-name { display: block; font-weight: 900; font-size: 1.15rem; color: #0d1f4f; letter-spacing: 1.5px; }
                        .auth-divider { height: 1px; background: #e8edf7; margin: 1.25rem 0; }
                        .success-circle { width: 72px; height: 72px; background: #d1e7dd; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
                        .auth-title { font-weight: 700; color: #0d1f4f; margin-bottom: 0.5rem; font-size: 1rem; }
                        .auth-subtitle { font-size: 0.83rem; color: #6b7a99; margin-bottom: 1.25rem; line-height: 1.6; }
                        .auth-btn { width: 100%; background: #0d1f4f; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; margin-top: 0.5rem; box-sizing: border-box; }
                        .auth-btn:hover { background: #162660; }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <img src={logo} alt="LOVELISTICS" className="auth-logo" />
                    <span className="auth-brand-name">LOVELISTICS</span>
                    <p className="auth-tagline">Delivering trust on time, always.</p>
                </div>

                <div className="auth-divider" />

                <div className="icon-wrap">
                    <KeyRound size={26} color="#0d1f4f" />
                </div>
                <h6 className="auth-title">Set new password</h6>
                <p className="auth-subtitle">
                    Choose a strong password for your account. Must be at least 6 characters.
                </p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label>New Password</label>
                        <div className="pass-wrap">
                            <input
                                type={showNew ? 'text' : 'password'}
                                name="newPassword"
                                placeholder="Min. 6 characters"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" className="pass-toggle" onClick={() => setShowNew(v => !v)}>
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label>Confirm Password</label>
                        <div className="pass-wrap">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Repeat your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            <button type="button" className="pass-toggle" onClick={() => setShowConfirm(v => !v)}>
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Back to Login</Link>
                </p>
            </div>

            <style>{`
                .auth-page { min-height: 100vh; background: #f4f6fb; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
                .auth-card { background: #fff; border-radius: 16px; padding: 2rem; width: 100%; max-width: 420px; box-shadow: 0 4px 24px rgba(13,31,79,0.08); }
                .auth-brand { text-align: center; margin-bottom: 1rem; }
                .auth-logo { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto 0.5rem; }
                .auth-brand-name { display: block; font-weight: 900; font-size: 1.15rem; color: #0d1f4f; letter-spacing: 1.5px; }
                .auth-tagline { font-size: 0.78rem; color: #6b7a99; margin: 0.25rem 0 0; }
                .auth-divider { height: 1px; background: #e8edf7; margin: 1.25rem 0; }
                .icon-wrap { width: 56px; height: 56px; background: rgba(13,31,79,0.07); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
                .auth-title { font-weight: 700; color: #0d1f4f; margin-bottom: 0.5rem; font-size: 1rem; }
                .auth-subtitle { font-size: 0.83rem; color: #6b7a99; margin-bottom: 1.25rem; line-height: 1.6; }
                .auth-error { background: #fff0f0; border: 1px solid #ffc5c5; color: #c0392b; padding: 0.6rem 0.9rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
                .auth-field { margin-bottom: 1rem; }
                .auth-field label { display: block; font-size: 0.82rem; font-weight: 600; color: #0d1f4f; margin-bottom: 0.4rem; }
                .pass-wrap { position: relative; }
                .pass-wrap input { width: 100%; padding: 0.65rem 2.5rem 0.65rem 0.9rem; border: 1px solid #dde2ef; border-radius: 10px; font-size: 0.9rem; color: #0d1f4f; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
                .pass-wrap input:focus { border-color: #0d1f4f; }
                .pass-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #6b7a99; padding: 0; display: flex; align-items: center; }
                .pass-toggle:hover { color: #0d1f4f; }
                .auth-btn { width: 100%; background: #0d1f4f; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
                .auth-btn:hover { background: #162660; }
                .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .auth-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: authSpin 0.7s linear infinite; flex-shrink: 0; }
                @keyframes authSpin { to { transform: rotate(360deg); } }
                .auth-switch { text-align: center; font-size: 0.85rem; color: #6b7a99; margin-top: 1rem; margin-bottom: 0; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; }
                .auth-switch a:hover { text-decoration: underline; }
            `}</style>
        </div>
    );
};

export default ResetPassword;