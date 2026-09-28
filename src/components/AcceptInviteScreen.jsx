import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useDMS } from '../context/DMSContext';

export const AcceptInviteScreen = () => {
  const {
    inviteToken,
    setInviteToken,
    getInvitationByToken,
    acceptInvitation
  } = useDMS();

  const inviteData = getInvitationByToken(inviteToken);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!mobile.trim() || mobile.trim().length < 10) {
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

    setIsSubmitting(true);
    try {
      const res = await acceptInvitation({
        token: inviteToken,
        name: name.trim(),
        email: email,
        password,
        mobile: mobile.trim(),
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
            Complete Your Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You've been invited by the Administrator to access documents on KasperTech DMS.
          </p>
        </div>




        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-4">


          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email (Verified)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed font-medium"
              />
              <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
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
                required
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={15}
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
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0284C7] hover:from-[#0284C7] hover:to-[#0A2540] text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span>Setting up your account...</span>
            ) : (
              <>
                <span>Complete Registration & Enter Workspace</span>
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

      </div>
    </div>
  );
};
