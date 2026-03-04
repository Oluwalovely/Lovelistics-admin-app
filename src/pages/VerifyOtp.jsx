import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP, forgotPassword } from '../services/api';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import logo from '../assets/logo.png';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef([]);

    // Redirect if no email in state
    useEffect(() => {
        if (!email) navigate('/forgot-password');
    }, [email]);

    // Countdown timer
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
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setResending(false);
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
                    <ShieldCheck size={26} color="#0d1f4f" />
                </div>
                <h6 className="auth-title">Enter verification code</h6>
                <p className="auth-subtitle">
                    We sent a 6-digit OTP to <strong style={{ color: '#0d1f4f' }}>{email}</strong>. Enter it below to continue.
                </p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form onSubmit={handleSubmit}>
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

                    <button type="submit" className="auth-btn" disabled={loading || otp.join('').length < 6}>
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="resend-wrap">
                    {canResend ? (
                        <button className="resend-btn" onClick={handleResend} disabled={resending}>
                            {resending ? <span className="auth-spinner dark" /> : <RefreshCw size={13} />}
                            {resending ? 'Resending...' : 'Resend OTP'}
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
                .otp-row { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.25rem; }
                .otp-input { width: 48px; height: 56px; text-align: center; font-size: 1.4rem; font-weight: 700; color: #0d1f4f; border: 2px solid #dde2ef; border-radius: 10px; outline: none; transition: border-color 0.2s, background 0.2s; background: #f8faff; }
                .otp-input:focus { border-color: #0d1f4f; background: #fff; }
                .otp-input.filled { border-color: #e8610a; background: #fff4ee; }
                .auth-btn { width: 100%; background: #0d1f4f; color: #fff; border: none; border-radius: 10px; padding: 0.75rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
                .auth-btn:hover { background: #162660; }
                .auth-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .auth-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: authSpin 0.7s linear infinite; flex-shrink: 0; }
                .auth-spinner.dark { border-color: rgba(13,31,79,0.2); border-top-color: #0d1f4f; }
                @keyframes authSpin { to { transform: rotate(360deg); } }
                .resend-wrap { text-align: center; margin: 1rem 0 0.5rem; }
                .resend-timer { font-size: 0.83rem; color: #6b7a99; margin: 0; }
                .resend-btn { background: none; border: none; color: #e8610a; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; padding: 0; }
                .resend-btn:hover { text-decoration: underline; }
                .resend-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .auth-switch { text-align: center; font-size: 0.85rem; color: #6b7a99; margin-top: 0.5rem; margin-bottom: 0; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; }
                .auth-switch a:hover { text-decoration: underline; }
            `}</style>
        </div>
    );
};

export default VerifyOTP;