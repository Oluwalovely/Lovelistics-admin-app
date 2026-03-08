import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, forgotPassword } from '../services/api';
import { ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const VerifyOTP = () => {
    const navigate  = useNavigate();
    const location  = useLocation();
    const email     = location.state?.email || '';

    const [otp, setOtp]           = useState(Array(6).fill(''));
    const [loading, setLoading]   = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => { if (!email) navigate('/forgot-password'); }, [email]);

    useEffect(() => {
        if (countdown <= 0) { setCanResend(true); return; }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = Array(6).fill('');
        pasted.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) { setError('Please enter all 6 digits.'); return; }
        setLoading(true);
        setError('');
        try {
            await verifyOTP({ email, otp: otpString });
            setSuccess('OTP verified successfully!');
            setTimeout(() => navigate('/reset-password', { state: { email, otp: otpString } }), 1000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            setOtp(Array(6).fill(''));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        setSuccess('');
        try {
            await forgotPassword({ email });
            setSuccess('A new OTP has been sent to your email.');
            setOtp(Array(6).fill(''));
            setCountdown(60);
            setCanResend(false);
            inputRefs.current[0]?.focus();
        } catch {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const filled = otp.filter(Boolean).length;
    const progress = (filled / 6) * 100;

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
                    <ShieldCheck size={24} color="#0d1f4f" strokeWidth={2} />
                </div>
                <h2 className="auth-title">Enter verification code</h2>
                <p className="auth-subtitle">
                    We sent a 6-digit OTP to{' '}
                    <strong style={{ color: '#0d1f4f', fontWeight: 700 }}>{email}</strong>.
                    {' '}Enter it below to continue.
                </p>

                {/* Feedback */}
                {error && (
                    <div className="auth-error">
                        <span className="auth-error-dot" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="auth-success">
                        <CheckCircle size={15} style={{ flexShrink: 0 }} />
                        {success}
                    </div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="otp-row" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputRefs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                className={`otp-input ${digit ? 'filled' : ''}`}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {/* Progress bar */}
                    <div className="otp-progress-wrap">
                        <div className="otp-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="otp-progress-label">{filled} of 6 digits entered</p>

                    <button type="submit" className="auth-btn" disabled={loading || filled < 6}>
                        {loading ? <><span className="auth-spinner" /> Verifying...</> : 'Verify OTP'}
                    </button>
                </form>

                {/* Resend */}
                <div className="resend-wrap">
                    {canResend ? (
                        <button className="resend-btn" onClick={handleResend} disabled={resending}>
                            {resending
                                ? <><span className="auth-spinner dark" /> Resending...</>
                                : <><RefreshCw size={13} /> Resend OTP</>}
                        </button>
                    ) : (
                        <p className="resend-timer">
                            Resend OTP in <strong style={{ color: '#0d1f4f' }}>{countdown}s</strong>
                        </p>
                    )}
                </div>

                <p className="auth-switch">
                    Wrong email? <Link to="/forgot-password">Go back</Link>
                </p>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                *, *::before, *::after { box-sizing: border-box; }

                .auth-page {
                    min-height: 100vh;
                    background: #eef0f5;
                    background-image:
                        radial-gradient(ellipse at 65% 0%, rgba(13,31,79,0.07) 0%, transparent 65%),
                        radial-gradient(ellipse at 0% 100%, rgba(232,97,10,0.05) 0%, transparent 60%);
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem 1.25rem;
                    font-family: 'Inter', system-ui, sans-serif;
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
                .auth-success {
                    display: flex; align-items: center; gap: 0.5rem;
                    background: #f0fdf4; border: 1px solid #bbf7d0;
                    color: #16a34a; padding: 0.7rem 1rem; border-radius: 10px;
                    font-size: 0.82rem; font-weight: 500; margin-bottom: 1.25rem;
                }

                /* OTP inputs */
                .otp-row {
                    display: flex; gap: 0.5rem;
                    justify-content: center; margin-bottom: 1rem;
                }
                .otp-input {
                    width: 48px; height: 56px;
                    text-align: center; font-size: 1.4rem; font-weight: 800;
                    color: #0d1f4f; background: #f8fafc;
                    border: 1.5px solid #e2e8f0; border-radius: 12px;
                    outline: none; font-family: 'Inter', system-ui, sans-serif;
                    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s, transform 0.12s;
                    caret-color: #e8610a;
                }
                .otp-input:focus {
                    border-color: #0d1f4f; background: #fff;
                    box-shadow: 0 0 0 3px rgba(13,31,79,0.07);
                    transform: translateY(-1px);
                }
                .otp-input.filled {
                    border-color: #e8610a; background: #fff8f4;
                    box-shadow: 0 0 0 3px rgba(232,97,10,0.08);
                }

                /* Progress */
                .otp-progress-wrap {
                    height: 3px; background: #e2e8f0; border-radius: 999px;
                    margin-bottom: 0.4rem; overflow: hidden;
                }
                .otp-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #0d1f4f, #e8610a);
                    border-radius: 999px;
                    transition: width 0.2s ease;
                }
                .otp-progress-label {
                    text-align: center; font-size: 0.72rem; color: #94a3b8;
                    margin: 0 0 1.25rem; font-weight: 500;
                }

                .auth-btn {
                    width: 100%; background: #0d1f4f; color: #fff;
                    border: none; border-radius: 11px; padding: 0.82rem;
                    font-size: 0.93rem; font-weight: 700;
                    font-family: 'Inter', system-ui, sans-serif;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 0.5rem;
                    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
                    box-shadow: 0 2px 8px rgba(13,31,79,0.18);
                }
                .auth-btn:hover:not(:disabled) {
                    background: #162660; transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(13,31,79,0.24);
                }
                .auth-btn:active:not(:disabled) { transform: translateY(0); }
                .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }

                .auth-spinner {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff; border-radius: 50%;
                    animation: authSpin 0.65s linear infinite; flex-shrink: 0;
                }
                .auth-spinner.dark { border-color: rgba(13,31,79,0.2); border-top-color: #0d1f4f; }
                @keyframes authSpin { to { transform: rotate(360deg); } }

                .resend-wrap { text-align: center; margin: 1.25rem 0 0.5rem; }
                .resend-timer { font-size: 0.82rem; color: #94a3b8; margin: 0; }
                .resend-btn {
                    background: none; border: none; color: #e8610a;
                    font-size: 0.83rem; font-weight: 600; cursor: pointer;
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0; transition: opacity 0.15s;
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .resend-btn:hover:not(:disabled) { opacity: 0.7; }
                .resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .auth-switch { text-align: center; font-size: 0.82rem; color: #94a3b8; margin: 0.5rem 0 0; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; transition: opacity 0.15s; }
                .auth-switch a:hover { opacity: 0.7; }

                @media (max-width: 480px) {
                    .auth-card { padding: 2.25rem 1.5rem; border-radius: 16px; }
                    .auth-brand-name { font-size: 1.05rem; }
                    .otp-input { width: 42px; height: 50px; font-size: 1.2rem; }
                }
            `}</style>
        </div>
    );
};

export default VerifyOTP;