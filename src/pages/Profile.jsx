import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { updateProfile, changePassword as changePasswordApi } from '../services/api';
import {
    ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff,
    Camera, CheckCircle, AlertCircle, Shield, Clock, Save
} from 'lucide-react';

const C = {
    navy:'#0d1f4f', navyL:'#162660', orange:'#e8610a', bg:'#f1f4f9',
    white:'#ffffff', border:'#e8edf7', muted:'#64748b', faint:'#94a3b8',
    green:'#16a34a', red:'#dc2626',
};
const shadow = { boxShadow:'0 1px 3px rgba(13,31,79,0.06), 0 4px 20px rgba(13,31,79,0.05)' };

const Field = ({ label, icon, children, hint }) => (
    <div style={{ marginBottom:'1.25rem' }}>
        <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.75rem', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:'0.45rem' }}>
            {icon}{label}
        </label>
        {children}
        {hint && <p style={{ margin:'0.3rem 0 0', fontSize:'0.7rem', color:C.faint }}>{hint}</p>}
    </div>
);

const inputStyle = (focused) => ({
    width:'100%', padding:'0.65rem 0.85rem',
    border:`1.5px solid ${focused ? C.navy : C.border}`,
    borderRadius:10, fontSize:'0.85rem', color:C.navy, outline:'none',
    background:C.white, fontFamily:"'Sora',system-ui,sans-serif",
    transition:'border-color 0.15s', boxSizing:'border-box',
});

const Toast = ({ msg, type }) => (
    <div style={{
        position:'fixed', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', zIndex:999,
        background: type==='success' ? '#f0fdf4' : '#fef2f2',
        border:`1px solid ${type==='success' ? '#bbf7d0' : '#fecaca'}`,
        color: type==='success' ? C.green : C.red,
        borderRadius:12, padding:'0.75rem 1.25rem', fontSize:'0.82rem', fontWeight:600,
        display:'flex', alignItems:'center', gap:8, ...shadow, animation:'slideUp 0.25s ease'
    }}>
        {type==='success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
        {msg}
    </div>
);

const Profile = () => {
    const { user, updateUser } = useAuth();

    const [fullName,       setFullName]       = useState(user?.fullName  || '');
    const [email,          setEmail]          = useState(user?.email     || '');
    const [phone,          setPhone]          = useState(user?.phone     || '');
    const [avatarPreview,  setAvatarPreview]  = useState(user?.avatar    || '');
    const [avatarFile,     setAvatarFile]     = useState(null);

    const [currentPw,  setCurrentPw]  = useState('');
    const [newPw,      setNewPw]      = useState('');
    const [confirmPw,  setConfirmPw]  = useState('');
    const [showCurrent,setShowCurrent]= useState(false);
    const [showNew,    setShowNew]    = useState(false);
    const [showConfirm,setShowConfirm]= useState(false);

    const [saving,   setSaving]   = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [toast,    setToast]    = useState(null);
    const [focused,  setFocused]  = useState('');
    const fileRef = useRef();

    const showToast = (msg, type='success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSaveProfile = async () => {
        if (!fullName.trim()) return showToast('Full name is required.', 'error');
        if (!email.trim())    return showToast('Email is required.', 'error');
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('fullName', fullName.trim());
            formData.append('email',    email.trim());
            formData.append('phone',    phone.trim());
            if (avatarFile) formData.append('avatar', avatarFile);

            const res = await updateProfile(formData);

            const data = res.data?.data || res.data;

            if (data?.fullName) {
                updateUser({
                    fullName: data.fullName,
                    email:    data.email,
                    phone:    data.phone    || null,
                    avatar:   data.avatar   || null,
                });
                if (data.avatar) setAvatarPreview(data.avatar);
            }
            setAvatarFile(null);
            showToast('Profile updated successfully.');
        } catch (err) {
            console.error('updateProfile error:', err.response?.data || err.message);
            showToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPw)         return showToast('Enter your current password.', 'error');
        if (newPw.length < 8)   return showToast('New password must be at least 8 characters.', 'error');
        if (newPw !== confirmPw) return showToast('Passwords do not match.', 'error');
        setPwSaving(true);
        try {
            await changePasswordApi({ currentPassword: currentPw, newPassword: newPw });
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            showToast('Password changed successfully.');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to change password.', 'error');
        } finally {
            setPwSaving(false);
        }
    };

    const pwStrength = pw => {
        if (!pw) return null;
        if (pw.length < 6) return { label:'Weak', color:'#dc2626', w:'30%' };
        if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label:'Fair', color:'#d97706', w:'60%' };
        return { label:'Strong', color:C.green, w:'100%' };
    };
    const strength = pwStrength(newPw);

    const lastLogin   = user?.lastLogin   ? new Date(user.lastLogin) : null;
    const lastLoginIp = user?.lastLoginIp || null;

    return (
        <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Sora',system-ui,sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
                *,*::before,*::after{box-sizing:border-box;}
                @keyframes slideUp  {from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}
                @keyframes fadeInUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
                .profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;}
                .avatar-upload:hover .avatar-overlay{opacity:1!important;}
                @media(max-width:768px){.profile-grid{grid-template-columns:1fr;}}
            `}</style>

            {/* Topbar */}
            <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(241,244,249,0.95)', backdropFilter:'blur(14px)', borderBottom:`1px solid ${C.border}`, padding:'0.85rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
                <Link to="/dashboard" style={{ width:34, height:34, borderRadius:9, border:`1px solid ${C.border}`, background:C.white, display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, textDecoration:'none', flexShrink:0, transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f1f5f9'}
                    onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                    <ArrowLeft size={15}/>
                </Link>
                <div>
                    <h1 style={{ fontWeight:800, color:C.navy, fontSize:'1.1rem', margin:0, letterSpacing:'-0.2px' }}>Admin Profile</h1>
                    <p style={{ margin:0, fontSize:'0.72rem', color:C.faint }}>Manage your account settings</p>
                </div>
            </div>

            <div style={{ maxWidth:900, margin:'0 auto', padding:'2rem 1.5rem' }}>

                {/* Avatar card */}
                <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'2rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1.75rem', flexWrap:'wrap', ...shadow, animation:'fadeInUp 0.4s ease' }}>
                    <div className="avatar-upload" style={{ position:'relative', cursor:'pointer', flexShrink:0 }} onClick={()=>fileRef.current.click()}>
                        {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', border:`3px solid ${C.border}` }}/>
                            : <div style={{ width:88, height:88, borderRadius:'50%', background:C.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'2rem', border:`3px solid ${C.border}` }}>
                                {user?.fullName?.charAt(0).toUpperCase()}
                              </div>
                        }
                        <div className="avatar-overlay" style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(13,31,79,0.55)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.18s' }}>
                            <Camera size={20} color="#fff"/>
                        </div>
                        <div style={{ position:'absolute', bottom:2, right:2, width:24, height:24, borderRadius:'50%', background:C.orange, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' }}>
                            <Camera size={11} color="#fff"/>
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange}/>
                    <div>
                        <h2 style={{ margin:0, fontWeight:800, color:C.navy, fontSize:'1.3rem' }}>{user?.fullName}</h2>
                        <p style={{ margin:'0.2rem 0 0', fontSize:'0.8rem', color:C.faint }}>{user?.email}</p>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:'0.5rem', background:`${C.navy}10`, color:C.navy, padding:'3px 10px', borderRadius:999, fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.3px' }}>
                            <Shield size={11}/> Administrator
                        </span>
                    </div>
                    <div style={{ marginLeft:'auto', textAlign:'right' }}>
                        <p style={{ margin:0, fontSize:'0.68rem', color:C.faint, textTransform:'uppercase', letterSpacing:'0.6px', fontWeight:600 }}>Click avatar to change photo</p>
                        <p style={{ margin:'0.2rem 0 0', fontSize:'0.7rem', color:C.faint }}>JPG, PNG or WEBP · Max 5MB</p>
                        {avatarFile && <p style={{ margin:'0.3rem 0 0', fontSize:'0.7rem', color:C.orange, fontWeight:600 }}>New photo selected — save to upload</p>}
                    </div>
                </div>

                <div className="profile-grid">

                    {/* Personal Info */}
                    <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'1.75rem', ...shadow, animation:'fadeInUp 0.4s ease 0.05s both' }}>
                        <div style={{ marginBottom:'1.5rem' }}>
                            <h3 style={{ margin:0, fontWeight:800, color:C.navy, fontSize:'0.95rem' }}>Personal Information</h3>
                            <p style={{ margin:'0.2rem 0 0', fontSize:'0.73rem', color:C.faint }}>Update your name, email and phone</p>
                        </div>

                        <Field label="Full Name" icon={<User size={12}/>}>
                            <input value={fullName} onChange={e=>setFullName(e.target.value)}
                                placeholder="Your full name"
                                onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')}
                                style={inputStyle(focused==='name')}/>
                        </Field>

                        <Field label="Email Address" icon={<Mail size={12}/>} hint="Used for login and notifications">
                            <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
                                placeholder="admin@example.com"
                                onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}
                                style={inputStyle(focused==='email')}/>
                        </Field>

                        <Field label="Phone Number" icon={<Phone size={12}/>} hint="Optional — for account recovery">
                            <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel"
                                placeholder="+234 000 000 0000"
                                onFocus={()=>setFocused('phone')} onBlur={()=>setFocused('')}
                                style={inputStyle(focused==='phone')}/>
                        </Field>

                        <button onClick={handleSaveProfile} disabled={saving}
                            style={{ width:'100%', padding:'0.7rem', borderRadius:10, border:'none', background:saving?`${C.navy}80`:C.navy, color:'#fff', fontWeight:700, fontSize:'0.85rem', cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit', transition:'background 0.15s' }}
                            onMouseEnter={e=>{ if(!saving) e.currentTarget.style.background=C.navyL; }}
                            onMouseLeave={e=>{ if(!saving) e.currentTarget.style.background=C.navy; }}>
                            <Save size={15}/>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {/* Right column */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                        {/* Password */}
                        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'1.75rem', ...shadow, animation:'fadeInUp 0.4s ease 0.10s both' }}>
                            <div style={{ marginBottom:'1.5rem' }}>
                                <h3 style={{ margin:0, fontWeight:800, color:C.navy, fontSize:'0.95rem' }}>Change Password</h3>
                                <p style={{ margin:'0.2rem 0 0', fontSize:'0.73rem', color:C.faint }}>Use a strong password with 8+ characters</p>
                            </div>

                            {[
                                { label:'Current Password', val:currentPw, set:setCurrentPw, show:showCurrent, toggle:()=>setShowCurrent(v=>!v), fkey:'cpw',  placeholder:'Enter current password' },
                                { label:'New Password',     val:newPw,     set:setNewPw,     show:showNew,     toggle:()=>setShowNew(v=>!v),     fkey:'npw',  placeholder:'At least 8 characters' },
                                { label:'Confirm Password', val:confirmPw, set:setConfirmPw, show:showConfirm, toggle:()=>setShowConfirm(v=>!v), fkey:'cfpw', placeholder:'Repeat new password' },
                            ].map(({label,val,set,show,toggle,fkey,placeholder})=>(
                                <Field key={fkey} label={label} icon={<Lock size={12}/>}>
                                    <div style={{ position:'relative' }}>
                                        <input value={val} onChange={e=>set(e.target.value)}
                                            type={show?'text':'password'} placeholder={placeholder}
                                            autoComplete="new-password"
                                            onFocus={()=>setFocused(fkey)} onBlur={()=>setFocused('')}
                                            style={{ ...inputStyle(focused===fkey), paddingRight:'2.5rem' }}/>
                                        <button onClick={toggle} tabIndex={-1} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.faint, padding:0, display:'flex' }}>
                                            {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                                        </button>
                                    </div>
                                </Field>
                            ))}

                            {strength && (
                                <div style={{ marginBottom:'1rem', marginTop:'-0.5rem' }}>
                                    <div style={{ background:'#f1f5f9', borderRadius:999, height:5, overflow:'hidden', marginBottom:'0.25rem' }}>
                                        <div style={{ height:'100%', width:strength.w, background:strength.color, borderRadius:999, transition:'width 0.3s' }}/>
                                    </div>
                                    <p style={{ margin:0, fontSize:'0.7rem', color:strength.color, fontWeight:600 }}>Password strength: {strength.label}</p>
                                </div>
                            )}

                            {confirmPw && (
                                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:'1rem', marginTop:'-0.5rem', fontSize:'0.72rem', fontWeight:600, color:newPw===confirmPw?C.green:C.red }}>
                                    {newPw===confirmPw ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
                                    {newPw===confirmPw ? 'Passwords match' : 'Passwords do not match'}
                                </div>
                            )}

                            <button onClick={handleChangePassword} disabled={pwSaving}
                                style={{ width:'100%', padding:'0.7rem', borderRadius:10, border:`1.5px solid ${C.navy}`, background:'transparent', color:C.navy, fontWeight:700, fontSize:'0.85rem', cursor:pwSaving?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontFamily:'inherit', transition:'all 0.15s' }}
                                onMouseEnter={e=>{ if(!pwSaving){ e.currentTarget.style.background=C.navy; e.currentTarget.style.color='#fff'; } }}
                                onMouseLeave={e=>{ if(!pwSaving){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.navy; } }}>
                                <Lock size={14}/>
                                {pwSaving ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>

                        {/* Last Login / Security */}
                        <div style={{ background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'1.5rem', ...shadow, animation:'fadeInUp 0.4s ease 0.15s both' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'1rem' }}>
                                <div style={{ width:34, height:34, borderRadius:9, background:`${C.navy}10`, display:'flex', alignItems:'center', justifyContent:'center', color:C.navy, flexShrink:0 }}>
                                    <Shield size={16}/>
                                </div>
                                <div>
                                    <h3 style={{ margin:0, fontWeight:800, color:C.navy, fontSize:'0.9rem' }}>Security Info</h3>
                                    <p style={{ margin:0, fontSize:'0.7rem', color:C.faint }}>Read-only audit trail</p>
                                </div>
                            </div>

                            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                                <div style={{ background:'#f8fafc', borderRadius:10, padding:'0.85rem 1rem', border:`1px solid ${C.border}` }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.3rem' }}>
                                        <Clock size={12} color={C.faint}/>
                                        <p style={{ margin:0, fontSize:'0.68rem', fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.6px' }}>Last Login</p>
                                    </div>
                                    <p style={{ margin:0, fontSize:'0.85rem', fontWeight:700, color:C.navy }}>
                                        {lastLogin
                                            ? lastLogin.toLocaleString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
                                            : <span style={{ color:C.faint, fontWeight:500 }}>Not available</span>
                                        }
                                    </p>
                                </div>

                                <div style={{ background:'#f8fafc', borderRadius:10, padding:'0.85rem 1rem', border:`1px solid ${C.border}` }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'0.3rem' }}>
                                        <Shield size={12} color={C.faint}/>
                                        <p style={{ margin:0, fontSize:'0.68rem', fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.6px' }}>IP Address</p>
                                    </div>
                                    <p style={{ margin:0, fontSize:'0.85rem', fontWeight:700, color:C.navy, fontFamily:'monospace' }}>
                                        {lastLoginIp || <span style={{ color:C.faint, fontWeight:500, fontFamily:'inherit' }}>Not available</span>}
                                    </p>
                                </div>
                            </div>

                            <p style={{ margin:'0.75rem 0 0', fontSize:'0.68rem', color:C.faint, display:'flex', alignItems:'center', gap:4 }}>
                                <AlertCircle size={11}/> If you don't recognise this activity, change your password immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type}/>}
        </div>
    );
};

export default Profile;