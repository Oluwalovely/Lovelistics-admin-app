import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');

    const formik = useFormik({
        initialValues: { email: '' },
        validationSchema: Yup.object({
            email: Yup.string()
                .email('Please enter a valid email address')
                .required('Email address is required'),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            setSuccess('');
            try {
                await forgotPassword({ email: values.email });
                setSuccess('OTP sent! Check your email inbox.');
                setTimeout(() => navigate('/verify-otp', { state: { email: values.email } }), 1500);
            } catch (err) {
                setError(err.response?.data?.message || 'Something went wrong. Try again.');
            } finally {
                setLoading(false);
            }
        },
    });

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
                    <Mail size={24} color="#0d1f4f" strokeWidth={2} />
                </div>
                <h2 className="auth-title">Forgot your password?</h2>
                <p className="auth-subtitle">
                    Enter the email address linked to your account. We'll send you a 6-digit OTP to reset your password.
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

                {/* Form */}
                <form onSubmit={formik.handleSubmit} noValidate>
                    <div className="auth-field">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            autoComplete="email"
                            className={formik.touched.email && formik.errors.email ? 'input-error' : ''}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <span className="auth-field-error">{formik.errors.email}</span>
                        )}
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Sending OTP...</> : 'Send OTP'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Back to Login</Link>
                </p>
                <p className="auth-back">
                    <Link to="/"><ArrowLeft size={13} /> Back to Home</Link>
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

                .auth-title { font-size: 1rem; font-weight: 700; color: #0d1f4f; margin: 0 0 0.5rem; }
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

                .auth-field { margin-bottom: 1.1rem; }
                .auth-field label {
                    display: block; font-size: 0.79rem; font-weight: 600;
                    color: #374151; margin-bottom: 0.45rem;
                }
                .auth-field input {
                    width: 100%; padding: 0.72rem 1rem;
                    border: 1.5px solid #e2e8f0; border-radius: 10px;
                    font-size: 0.9rem; font-family: 'Inter', system-ui, sans-serif;
                    color: #0d1f4f; background: #f8fafc; outline: none;
                    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
                }
                .auth-field input:focus {
                    border-color: #0d1f4f; background: #fff;
                    box-shadow: 0 0 0 3px rgba(13,31,79,0.07);
                }
                .auth-field input.input-error { border-color: #fc8181; background: #fff5f5; }
                .auth-field input.input-error:focus { box-shadow: 0 0 0 3px rgba(252,129,129,0.15); }
                .auth-field input::placeholder { color: #b0bcd4; }
                .auth-field-error {
                    display: block; font-size: 0.74rem; color: #c53030;
                    margin-top: 0.35rem; font-weight: 500;
                }

                .auth-btn {
                    width: 100%; background: #0d1f4f; color: #fff;
                    border: none; border-radius: 11px; padding: 0.82rem;
                    font-size: 0.93rem; font-weight: 700;
                    font-family: 'Inter', system-ui, sans-serif;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 0.5rem; margin-top: 0.5rem;
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
                @keyframes authSpin { to { transform: rotate(360deg); } }

                .auth-switch { text-align: center; font-size: 0.82rem; color: #94a3b8; margin: 1.5rem 0 0.6rem; }
                .auth-switch a { color: #e8610a; font-weight: 600; text-decoration: none; transition: opacity 0.15s; }
                .auth-switch a:hover { opacity: 0.7; }

                .auth-back { text-align: center; margin: 0; }
                .auth-back a {
                    font-size: 0.79rem; color: #94a3b8; text-decoration: none;
                    display: inline-flex; align-items: center; gap: 0.3rem; transition: color 0.15s;
                }
                .auth-back a:hover { color: #0d1f4f; }

                @media (max-width: 480px) {
                    .auth-card { padding: 2.25rem 1.5rem; border-radius: 16px; }
                    .auth-brand-name { font-size: 1.05rem; }
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;