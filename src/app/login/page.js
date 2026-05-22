'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useApp } from '@/lib/AppContext';
import toast from 'react-hot-toast';
import StoreLayout from '@/components/layout/StoreLayout';
import { FiMail, FiPhone, FiLock, FiUser, FiArrowRight, FiRefreshCw } from 'react-icons/fi';

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // login | register | forgot
  const [loginMethod, setLoginMethod] = useState('email'); // email | phone | otp
  const [step, setStep] = useState(1); // 1=input, 2=otp
  const [loading, setLoading] = useState(false);

  // Login form
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '' });
  // Phone OTP login
  const [otpLogin, setOtpLogin] = useState({ type: 'email', value: '', name: '', otp: '' }); // email only
  // Register form
  const [reg, setReg] = useState({ name: '', email: '', password: '', phone: '' });
  // Forgot password
  const [forgot, setForgot] = useState({ email: '', otp: '', newPassword: '', step: 1 });

  const { login } = useApp();
  const router = useRouter();

  // --- Normal email/password login ---
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', emailLogin);
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}! 🎉`);
        router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/');
      } else toast.error(data.message || 'Login failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Login failed'); }
    setLoading(false);
  };


  // --- OTP login: send OTP ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!otpLogin.value) { toast.error('Please enter your email or phone'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/send-otp', { type: otpLogin.type, value: otpLogin.value });
      if (data.success) {
        toast.success(data.message || '✅ OTP sent!', { duration: 6000 });
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  // --- OTP login: verify OTP ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpLogin.otp || otpLogin.otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { ...otpLogin, purpose: 'login' });
      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome, ${data.user.name}! 🎉`);
        router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/');
      } else toast.error(data.message);
    } catch { toast.error('Verification failed'); }
    setLoading(false);
  };

  // --- Register ---
  const [regStep, setRegStep] = useState(1); // 1=form, 2=otp verify
  const [regOtp, setRegOtp] = useState('');
  const [regOtpDisplay, setRegOtpDisplay] = useState('');

  const handleRegisterSendOTP = async (e) => {
    e.preventDefault();
    if (!reg.name || !reg.email || !reg.password) { toast.error('Please fill all required fields'); return; }
    if (reg.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      // Send OTP to phone if provided, else to email
      const otpType = 'email';
      const otpValue = reg.email;
      const { data } = await axios.post('/api/auth/send-otp', { type: otpType, value: otpValue });
      if (data.success) {
        toast.success(data.message || '✅ OTP sent!', { duration: 6000 });
        setRegStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    setLoading(false);
  };

  const handleRegisterVerifyOTP = async (e) => {
    e.preventDefault();
    if (!regOtp || regOtp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      // Verify OTP
      const otpType = 'email';
      const otpValue = reg.email;
      const verifyRes = await axios.post('/api/auth/verify-otp', { type: otpType, value: otpValue, otp: regOtp, purpose: 'register' });
      if (!verifyRes.data.success) { toast.error(verifyRes.data.message || 'Invalid OTP'); setLoading(false); return; }
      // OTP verified — now register
      const { data } = await axios.post('/api/auth/register', reg);
      if (data.success) {
        login(data.user, data.token);
        toast.success('Account created! Welcome to L MART 🎉');
        router.push('/');
      } else toast.error(data.message || 'Registration failed');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    setLoading(false);
  };

  const handleRegister = handleRegisterSendOTP;

  // --- Forgot Password ---
  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    if (!forgot.email) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const check = await axios.post('/api/auth/forgot-password', { email: forgot.email });
      if (!check.data.success) { toast.error(check.data.message); setLoading(false); return; }
      const { data } = await axios.post('/api/auth/send-otp', { type: 'email', value: forgot.email });
      if (data.success) {
        toast.success(data.message || '✅ OTP sent to your email!', { duration: 6000 });
        setForgot(f => ({ ...f, step: 2 }));
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send OTP'); }
    setLoading(false);
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!forgot.otp || !forgot.newPassword) { toast.error('Fill all fields'); return; }
    if (forgot.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email: forgot.email, otp: forgot.otp, newPassword: forgot.newPassword });
      if (data.success) { toast.success('Password reset! Please login.'); setTab('login'); setForgot({ email: '', otp: '', newPassword: '', step: 1 }); }
      else toast.error(data.message);
    } catch { toast.error('Reset failed'); }
    setLoading(false);
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 mt-1 text-sm focus:outline-none focus:border-lm-green transition-colors";
  const labelClass = "text-sm font-medium text-gray-700";

  return (
    <StoreLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #f0f7f1 100%)' }}>
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #1a5c2a, #2d7a40)' }}>
            <h1 className="text-2xl font-extrabold text-white">🛒 L MART</h1>
            <p className="text-green-200 text-sm mt-1">Global Growth, Local Fresh</p>
          </div>

          <div className="p-6">
            {/* Tabs */}
            {tab !== 'forgot' && (
              <div className="flex rounded-lg p-1 mb-6" style={{ background: '#e8f5e9' }}>
                {['login', 'register'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setStep(1); }}
                    className="flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-all"
                    style={tab === t ? { background: '#1a5c2a', color: 'white' } : { color: '#555' }}>
                    {t === 'login' ? '🔑 Login' : '✨ Register'}
                  </button>
                ))}
              </div>
            )}

            {/* ======= LOGIN ======= */}
            {tab === 'login' && (
              <div>
                {/* Login method selector */}
                <div className="flex gap-2 mb-5">
                  {[['email', '📧 Email'], ['otp', '📱 OTP Login']].map(([m, label]) => (
                    <button key={m} onClick={() => { setLoginMethod(m); setStep(1); }}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all"
                      style={loginMethod === m ? { borderColor: '#1a5c2a', color: '#1a5c2a', background: '#e8f5e9' } : { borderColor: '#e0e0e0', color: '#888' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {loginMethod === 'email' ? (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                        <input type="email" value={emailLogin.email} onChange={e => setEmailLogin(f => ({ ...f, email: e.target.value }))}
                          required className={inputClass + " pl-9"} placeholder="your@email.com" />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                        <input type="password" value={emailLogin.password} onChange={e => setEmailLogin(f => ({ ...f, password: e.target.value }))}
                          required className={inputClass + " pl-9"} placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="text-right">
                      <button type="button" onClick={() => setTab('forgot')} className="text-xs font-medium hover:underline" style={{ color: '#1a5c2a' }}>
                        Forgot Password?
                      </button>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                      style={{ background: '#1a5c2a' }}>
                      {loading ? 'Logging in...' : <><FiArrowRight size={16} /> Login to L MART</>}
                    </button>
                  </form>
                ) : (
                  /* OTP Login */
                  <div>
                    {step === 1 ? (
                      <form onSubmit={handleSendOTP} className="space-y-4">
                        <div className="flex gap-2 mb-3">
                          {[['email', '📧 Email'], ['phone', '📱 WhatsApp / SMS OTP']].map(([t, label]) => (
                            <button key={t} type="button" onClick={() => setOtpLogin(f => ({ ...f, type: t, value: '' }))}
                              className="flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all"
                              style={otpLogin.type === t ? { borderColor: '#1a5c2a', color: '#1a5c2a', background: '#e8f5e9' } : { borderColor: '#e0e0e0', color: '#888' }}>
                              {label}
                            </button>
                          ))}
                        </div>
                        <div>
                          <label className={labelClass}>{'Email Address'}</label>
                          <div className="relative">
                            {otpLogin.type === 'email' ? <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} /> : <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />}
                            <input type='email' value={otpLogin.value}
                              onChange={e => setOtpLogin(f => ({ ...f, value: e.target.value }))}
                              required className={inputClass + " pl-9"}
                              placeholder={'your@email.com'} />
                          </div>
                        </div>
                        <button type="submit" disabled={loading}
                          className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                          style={{ background: '#1a5c2a' }}>
                          {loading ? 'Sending OTP...' : '📩 Send OTP'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-4">
                        {otpLogin.otp ? (
                          <div className="text-center p-4 rounded-xl mb-2 border-2 border-blue-400" style={{ background: '#e3f2fd' }}>
                            <p className="text-xs text-gray-500 mb-1">Your OTP Code</p>
                            <p className="text-4xl font-bold tracking-widest text-em-blue">{otpLogin.otp}</p>
                            <p className="text-xs text-gray-400 mt-1">Already filled below — just click Verify</p>
                          </div>
                        ) : (
                          <div className="text-center p-3 rounded-lg mb-2" style={{ background: '#e8f5e9' }}>
                            <p className="text-sm font-medium" style={{ color: '#1a5c2a' }}>OTP sent to {otpLogin.value}</p>
                            <p className="text-xs text-gray-500">{otpLogin.type === 'phone' ? '✅ OTP sent via WhatsApp & SMS' : 'Valid for 10 minutes'}</p>
                          </div>
                        )}
                        <div>
                          <label className={labelClass}>Enter 6-digit OTP</label>
                          <input type="number" value={otpLogin.otp} onChange={e => setOtpLogin(f => ({ ...f, otp: e.target.value.slice(0, 6) }))}
                            required maxLength={6} className={inputClass + " text-center text-xl tracking-widest font-bold"} placeholder="• • • • • •" />
                        </div>
                        <button type="submit" disabled={loading}
                          className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50"
                          style={{ background: '#1a5c2a' }}>
                          {loading ? 'Verifying...' : '✅ Verify & Login'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-sm flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700">
                          <FiRefreshCw size={13} /> Resend OTP
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ======= REGISTER ======= */}
            {tab === 'register' && (
              <div>
              {regStep === 1 ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                    <input value={reg.name} onChange={e => setReg(f => ({ ...f, name: e.target.value }))}
                      required className={inputClass + " pl-9"} placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                    <input type="email" value={reg.email} onChange={e => setReg(f => ({ ...f, email: e.target.value }))}
                      required className={inputClass + " pl-9"} placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Phone <span className="text-gray-400 font-normal text-xs">(OTP will be sent here if filled)</span></label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                    <input type="tel" value={reg.phone} onChange={e => setReg(f => ({ ...f, phone: e.target.value }))}
                      className={inputClass + " pl-9"} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {reg.phone && reg.phone.replace(/\D/g,'').length === 10 ? '📱 OTP will be sent to this mobile number' : '📧 OTP will be sent to your email'}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                    <input type="password" value={reg.password} onChange={e => setReg(f => ({ ...f, password: e.target.value }))}
                      required minLength={6} className={inputClass + " pl-9"} placeholder="Min 6 characters" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: '#1a5c2a' }}>
                  {loading ? 'Sending OTP...' : '📩 Send OTP & Verify'}
                </button>
              </form>
              ) : (
              <form onSubmit={handleRegisterVerifyOTP} className="space-y-4">
                {/* Show OTP prominently if returned on screen */}
                {false ? (<div/>) : (
                  <div className="text-center p-3 rounded-lg" style={{ background: '#e8f5e9' }}>
                    <p className="text-sm font-semibold" style={{ color: '#1a5c2a' }}>
                      {reg.phone && reg.phone.replace(/\D/g,'').length === 10
                        ? `💬 OTP sent via WhatsApp to ${reg.phone}`
                        : `📧 OTP sent to ${reg.email}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Check your {reg.phone && reg.phone.replace(/\D/g,'').length === 10 ? 'mobile' : 'email inbox'}</p>
                  </div>
                )}
                <div>
                  <label className={labelClass}>Enter 6-digit OTP</label>
                  <input type="number" value={regOtp} onChange={e => setRegOtp(e.target.value.slice(0,6))}
                    required maxLength={6} className={inputClass + " text-center text-xl tracking-widest font-bold"}
                    placeholder="• • • • • •" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50"
                  style={{ background: '#1a5c2a' }}>
                  {loading ? 'Creating Account...' : '✅ Verify & Create Account'}
                </button>
                <button type="button" onClick={() => { setRegStep(1); setRegOtpDisplay(''); setRegOtp(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                  <FiRefreshCw size={13} /> Go Back
                </button>
              </form>
              )}
              </div>
            )}

            {/* ======= FORGOT PASSWORD ======= */}
            {tab === 'forgot' && (
              <div>
                <button onClick={() => setTab('login')} className="text-sm mb-4 flex items-center gap-1" style={{ color: '#1a5c2a' }}>
                  ← Back to Login
                </button>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Reset Password</h2>
                <p className="text-sm text-gray-500 mb-5">Enter your email — we'll send you an OTP to reset your password.</p>

                {forgot.step === 1 ? (
                  <form onSubmit={handleForgotSendOTP} className="space-y-4">
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                        <input type="email" value={forgot.email} onChange={e => setForgot(f => ({ ...f, email: e.target.value }))}
                          required className={inputClass + " pl-9"} placeholder="your@email.com" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50"
                      style={{ background: '#1a5c2a' }}>
                      {loading ? 'Sending OTP...' : '📩 Send OTP to Email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotReset} className="space-y-4">
                    {forgot.otp ? (
                      <div className="text-center p-4 rounded-xl border-2 border-blue-400" style={{ background: '#e3f2fd' }}>
                        <p className="text-xs text-gray-500 mb-1">Your OTP Code</p>
                        <p className="text-4xl font-bold tracking-widest text-em-blue">{forgot.otp}</p>
                        <p className="text-xs text-gray-400 mt-1">Already filled below — just enter new password</p>
                      </div>
                    ) : (
                      <div className="text-center p-3 rounded-lg" style={{ background: '#e8f5e9' }}>
                        <p className="text-sm font-medium" style={{ color: '#1a5c2a' }}>OTP sent to {forgot.email}</p>
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Enter OTP</label>
                      <input type="number" value={forgot.otp} onChange={e => setForgot(f => ({ ...f, otp: e.target.value.slice(0, 6) }))}
                        required className={inputClass + " text-center text-xl tracking-widest font-bold"} placeholder="• • • • • •" />
                    </div>
                    <div>
                      <label className={labelClass}>New Password</label>
                      <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" size={15} />
                        <input type="password" value={forgot.newPassword} onChange={e => setForgot(f => ({ ...f, newPassword: e.target.value }))}
                          required minLength={6} className={inputClass + " pl-9"} placeholder="New password (min 6 chars)" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full text-white py-3 rounded-lg font-bold disabled:opacity-50"
                      style={{ background: '#1a5c2a' }}>
                      {loading ? 'Resetting...' : '🔒 Reset Password'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
