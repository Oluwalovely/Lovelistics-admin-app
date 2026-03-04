import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { Mail, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await forgotPassword({ email });
            setSuccess('OTP sent! Check your email inbox.');
            setTimeout(() => navigate('/verify-otp', { state: { email } }), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <Mail size={26} color="#0d1f4f" />
                </div>
                <h6 className="auth-title">Forgot your password?</h6>
                <p className="auth-subtitle">
                    Enter the email address linked to your account. We'll send you a 6-digit OTP to reset your password.
                </p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(''); }}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Back to Login</Link>
                </p>
                <p className="auth-back">
                    <Link to="/"><ArrowLeft size={13} style={{ marginRight: 4 }} />Back to Home</Link>
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
                .auth-success { background: #f0fff4; border: 1px solid #b7ebc8; color: #1a7f3c; padding: 0.6rem 0.9rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
                .auth-field { margin-bottom: 1rem; }
                .auth-field label { display: block; font-size: 0.82rem; font-weight: 600; color: #0d1f4f; margin-bottom: 0.4rem; }
                .auth-field input { width: 100%; padding: 0.65rem 0.9rem; border: 1px solid #dde2ef; border-radius: 10px; font-size: 0.9rem; color: #0d1f4f; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
                .auth-field input:focus { border-color: #0d1f4f; }
                .auth-btn { width: 100%; background: #0d1f4f; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
                .auth-btn:hover { background: #162660; }
                .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .auth-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: authSpin 0.7s linear infinite; flex-shrink: 0; }
                @keyframes authSpin { to { transform: rotate(360deg); } }
                .auth-switch { text-align: center; font-size: 0.85rem; color: #6b7a99; margin-top: 1rem; margin-bottom: 0.5rem; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; }
                .auth-switch a:hover { text-decoration: underline; }
                .auth-back { text-align: center; margin: 0; }
                .auth-back a { font-size: 0.82rem; color: #6b7a99; text-decoration: none; display: inline-flex; align-items: center; }
                .auth-back a:hover { color: #0d1f4f; }
            `}</style>
        </div>
    );
};

export default ForgotPassword;