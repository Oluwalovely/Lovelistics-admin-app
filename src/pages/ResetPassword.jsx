import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const ResetPassword = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const email     = location.state?.email || '';
    const otp       = location.state?.otp   || '';

    const [formData, setFormData]     = useState({ newPassword: '', confirmPassword: '' });
    const [showNew, setShowNew]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState(false);

    useEffect(() => { if (!email || !otp) navigate('/forgot-password'); }, [email, otp]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword.length < 6)                        { setError('Password must be at least 6 characters.'); return; }
        if (formData.newPassword !== formData.confirmPassword)      { setError('Passwords do not match.'); return; }
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

    const SHARED_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .auth-page {
            min-height: 100vh; background: #eef0f5;
            background-image:
                radial-gradient(ellipse at 65% 0%, rgba(13,31,79,0.07) 0%, transparent 65%),
                radial-gradient(ellipse at 0% 100%, rgba(232,97,10,0.05) 0%, transparent 60%);
            display: flex; align-items: center; justify-content: center;
            padding: 2rem 1.25rem; font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-card {
            background: #ffffff; border-radius: 20px;
            padding: 3rem 2.75rem; width: 100%; max-width: 440px;
            box-shadow:
                0 0 0 1px rgba(13,31,79,0.055),
                0 4px 8px rgba(13,31,79,0.04),
                0 20px 56px rgba(13,31,79,0.10);
        }
        .auth-brand { text-align: center; margin-bottom: 1.75rem; }
        .auth-logo {
            width: 62px; height: 62px; object-fit: contain;
            display: block; margin: 0 auto 1rem; border-radius: 14px;
            box-shadow: 0 2px 12px rgba(13,31,79,0.12);
        }
        .auth-brand-name {
            display: block; font-weight: 900; font-size: 1.2rem;
            color: #0d1f4f; letter-spacing: 3px; line-height: 1; margin-bottom: 0.55rem;
        }
        .auth-tagline { font-size: 0.78rem; font-weight: 400; color: #94a3b8; margin: 0; }
        .auth-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0 25%, #e2e8f0 75%, transparent);
            margin-bottom: 1.75rem;
        }
        .auth-btn {
            width: 100%; background: #0d1f4f; color: #fff;
            border: none; border-radius: 11px; padding: 0.82rem;
            font-size: 0.93rem; font-weight: 700;
            font-family: 'Inter', system-ui, sans-serif;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; gap: 0.5rem; margin-top: 0.5rem;
            text-decoration: none;
            transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
            box-shadow: 0 2px 8px rgba(13,31,79,0.18);
        }
        .auth-btn:hover:not(:disabled) {
            background: #162660; transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(13,31,79,0.24);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        @media (max-width: 480px) {
            .auth-card { padding: 2.25rem 1.5rem; border-radius: 16px; }
            .auth-brand-name { font-size: 1.05rem; }
        }
    `;

    /* ── Success screen ── */
    if (success) return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div className="auth-brand">
                    <img src={logo} alt="LOVELISTICS" className="auth-logo" />
                    <span className="auth-brand-name">LOVELISTICS</span>
                    <p className="auth-tagline">Delivering Trust, On Time. Every Time.</p>
                </div>
                <div className="auth-divider" />

                <div style={{ width: 72, height: 72, background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                    <CheckCircle size={34} color="#16a34a" strokeWidth={2} />
                </div>
                <h2 style={{ fontWeight: 700, color: '#0d1f4f', fontSize: '1rem', margin: '0 0 0.5rem' }}>Password Reset Successful</h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.75rem', lineHeight: 1.65 }}>
                    Your password has been updated. Redirecting you to login...
                </p>
                <Link to="/login" className="auth-btn">Go to Login</Link>
            </div>
            <style>{SHARED_STYLES}</style>
        </div>
    );

    /* ── Form screen ── */
    return (
        <div className="auth-page">
            <div className="auth-card">

                {/* Brand */}
                <div className="auth-brand">
                    <img src={logo} alt="LOVELISTICS" className="auth-logo" />
                    <span className="auth-brand-name">LOVELISTICS</span>
                    <p className="auth-tagline">Delivering Trust, On Time. Every Time.</p>
                </div>

                <div className="auth-divider" />

                {/* Icon + Title */}
                <div className="auth-icon-wrap">
                    <KeyRound size={24} color="#0d1f4f" strokeWidth={2} />
                </div>
                <h2 className="auth-title">Set new password</h2>
                <p className="auth-subtitle">
                    Choose a strong password for your account. Must be at least 6 characters.
                </p>

                {/* Error */}
                {error && (
                    <div className="auth-error">
                        <span className="auth-error-dot" />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="auth-field">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="auth-pw-wrap">
                            <input
                                id="newPassword"
                                type={showNew ? 'text' : 'password'}
                                name="newPassword"
                                placeholder="Min. 6 characters"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="auth-pw-wrap">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Repeat your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                            />
                            <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {/* Match indicator */}
                        {formData.confirmPassword.length > 0 && (
                            <span className={`auth-match ${formData.newPassword === formData.confirmPassword ? 'match' : 'no-match'}`}>
                                {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </span>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Resetting...</> : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Back to Login</Link>
                </p>
            </div>

            <style>{`
                ${SHARED_STYLES}
                .auth-icon-wrap {
                    width: 52px; height: 52px; background: rgba(13,31,79,0.07);
                    border-radius: 14px; display: flex; align-items: center;
                    justify-content: center; margin-bottom: 1.1rem;
                }
                .auth-title { font-size: 1rem; font-weight: 700; color: #0d1f4f; margin: 0 0 0.5rem; letter-spacing: -0.15px; }
                .auth-subtitle { font-size: 0.82rem; color: #64748b; margin: 0 0 1.5rem; line-height: 1.65; }
                .auth-error {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: #fff5f5; border: 1px solid #fed7d7;
                    color: #c53030; padding: 0.7rem 1rem; border-radius: 10px;
                    font-size: 0.82rem; font-weight: 500; margin-bottom: 1.25rem;
                }
                .auth-error-dot { width: 7px; height: 7px; border-radius: 50%; background: #fc8181; flex-shrink: 0; }
                .auth-field { margin-bottom: 1.1rem; }
                .auth-field label {
                    display: block; font-size: 0.79rem; font-weight: 600;
                    color: #374151; margin-bottom: 0.45rem;
                }
                .auth-pw-wrap { position: relative; }
                .auth-pw-wrap input {
                    width: 100%; padding: 0.72rem 2.75rem 0.72rem 1rem;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    font-size: 0.9rem; font-family: 'Inter', system-ui, sans-serif;
                    color: #0d1f4f; background: #f8fafc; outline: none;
                    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
                }
                .auth-pw-wrap input:focus {
                    border-color: #0d1f4f; background: #fff;
                    box-shadow: 0 0 0 3px rgba(13,31,79,0.07);
                }
                .auth-pw-wrap input::placeholder { color: #b0bcd4; }
                .auth-pw-toggle {
                    position: absolute; right: 0.85rem; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: #94a3b8; display: flex; align-items: center;
                    padding: 0; transition: color 0.15s;
                }
                .auth-pw-toggle:hover { color: #0d1f4f; }
                .auth-match {
                    display: block; font-size: 0.74rem; font-weight: 500;
                    margin-top: 0.35rem; transition: color 0.15s;
                }
                .auth-match.match   { color: #16a34a; }
                .auth-match.no-match { color: #c53030; }
                .auth-spinner {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff; border-radius: 50%;
                    animation: authSpin 0.65s linear infinite; flex-shrink: 0;
                }
                @keyframes authSpin { to { transform: rotate(360deg); } }
                .auth-switch { text-align: center; font-size: 0.82rem; color: #94a3b8; margin: 1.5rem 0 0; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; transition: opacity 0.15s; }
                .auth-switch a:hover { opacity: 0.7; }
            `}</style>
        </div>
    );
};

export default ResetPassword;