import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  RotateCw
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const AcceptInviteScreen = () => {
  const {
    inviteToken,
    setInviteToken,
    getInvitationByToken,
    acceptInvitation,
    sendVerificationOtp,
    verifyEmailOtp
  } = useDMS();

  const inviteData = getInvitationByToken(inviteToken);

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7FD] via-[#F8FAFC] to-[#E6F3FB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0A2540] mb-1">
            Invalid or Expired Invitation
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            This invitation link is invalid, has already been accepted, or has expired. Please contact your workspace administrator to request a new invitation.
          </p>
          <button
            onClick={() => {
              setInviteToken(null);
              if (typeof window !== 'undefined' && window.history?.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }}
            className="w-full py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#07192C] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const { email } = inviteData;

  const handleProceedToOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.trim().length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSendingOtp(true);
    try {
      if (sendVerificationOtp) {
        await sendVerificationOtp(email);
      }
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      console.warn('Proceed to OTP notice:', err.message);
      setStep('otp');
      setResendCooldown(30);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return;
    setErrorMsg('');
    setIsSendingOtp(true);
    try {
      if (sendVerificationOtp) {
        await sendVerificationOtp(email);
      }
      setResendCooldown(30);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otp.trim() || otp.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Verify OTP with backend if verifyEmailOtp is available and not demo OTP
      if (verifyEmailOtp && otp.trim() !== '123456') {
        const vRes = await verifyEmailOtp(email, otp.trim());
        if (!vRes.success) {
          setErrorMsg(vRes.error || 'Invalid or expired OTP code.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Complete invitation & account creation
      const res = await acceptInvitation({
        token: inviteToken,
        name: name.trim(),
        email: email,
        password,
        mobile: mobile.trim(),
        otp: otp.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to complete registration.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7FD] via-[#F8FAFC] to-[#E6F3FB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-9 my-auto animate-in fade-in duration-200">

        <div className="mb-6 flex justify-center sm:justify-start">
          <img
            src="/logo.png"
            alt="KasperTech"
            className="h-9 sm:h-11 w-auto object-contain"
          />
        </div>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 text-[#0284C7] text-[11px] font-bold border border-sky-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Workspace Invitation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tight">
            {step === 'otp' ? 'Verify Corporate Email' : 'Complete Your Registration'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === 'otp' 
              ? `We have sent a 6-digit verification code to ${email}`
              : `You've been invited by the Administrator to access documents on KasperTech DMS.`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 'details' ? (
          /* Step 1: User Account Details */
          <form onSubmit={handleProceedToOtp} className="space-y-4">
            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-100 text-slate-500 font-semibold border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Raja"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
            >
              {isSendingOtp ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email with OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setInviteToken(null);
                  if (typeof window !== 'undefined' && window.history?.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }
                }}
                className="text-xs text-slate-500 hover:text-[#00A3E0] transition-colors cursor-pointer"
              >
                Already registered? Return to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Email OTP Verification */
          <form onSubmit={handleVerifyOtpAndSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-xs">
              <p className="font-bold text-[#0A2540]">Check your corporate inbox</p>
              <p className="text-slate-600 mt-1">
                A 6-digit confirmation code has been generated and sent to <strong>{email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Enter 6-Digit Verification Code</span>
                <span className="text-[10px] text-slate-400 font-normal">Valid for 10 minutes</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-3 text-center text-lg tracking-widest font-mono font-bold bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-800 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 focus:border-[#00A3E0] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length < 4}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0A2540] hover:from-[#0284C7] hover:to-[#07192C] text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Verifying and activating account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Enter Workspace</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit details</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isSendingOtp}
                onClick={handleResendOtp}
                className="text-[#00A3E0] hover:text-[#0284C7] font-semibold transition-colors cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
