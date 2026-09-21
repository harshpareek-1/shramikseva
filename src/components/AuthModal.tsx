import React, { useState } from 'react';
import { User, UserRole, Profession } from '../types.ts';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  Wrench,
  UserCheck,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
  Info,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  demoUsers: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  demoUsers,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'credentials'>('login');
  const [role, setRole] = useState<UserRole>('worker');
  const [emailOrPhone, setEmailOrPhone] = useState('rajesh.electric@example.com');
  const [password, setPassword] = useState('worker123');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [demoRoleFilter, setDemoRoleFilter] = useState<'all' | 'worker' | 'customer'>('worker');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState<Profession>('Electrician');
  const [experienceYears, setExperienceYears] = useState(4);
  const [hourlyRate, setHourlyRate] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setDemoRoleFilter(newRole === 'worker' ? 'worker' : 'customer');
    if (newRole === 'worker') {
      setEmailOrPhone('rajesh.electric@example.com');
      setPassword('worker123');
    } else if (newRole === 'customer') {
      setEmailOrPhone('amit@example.com');
      setPassword('customer123');
    } else {
      setEmailOrPhone('admin@karyo.local');
      setPassword('admin123');
    }
  };

  const handleFillCredentials = (u: User) => {
    setRole(u.role);
    setEmailOrPhone(u.email);
    setPassword(u.password || (u.role === 'worker' ? 'worker123' : 'customer123'));
    setTab('login');
    setError(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Login failed. Please verify credentials or use quick-fill.');
      }
    } catch (err) {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          role,
          profession: role === 'worker' ? profession : undefined,
          experienceYears: role === 'worker' ? experienceYears : undefined,
          hourlyRate: role === 'worker' ? hourlyRate : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const workerUsers = demoUsers.filter(u => u.role === 'worker');
  const customerUsers = demoUsers.filter(u => u.role === 'customer');
  const filteredDemoUsers = demoUsers.filter(u => {
    if (demoRoleFilter === 'worker') return u.role === 'worker';
    if (demoRoleFilter === 'customer') return u.role === 'customer';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Karyo Authentication Portal
              </h3>
              <p className="text-xs text-slate-500">Sign in to Customer, Worker & Admin accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 text-xs font-bold bg-slate-50/50">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-amber-600 text-amber-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </span>
          </button>
          <button
            onClick={() => setTab('credentials')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === 'credentials'
                ? 'border-amber-600 text-amber-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              Worker Passwords ({workerUsers.length})
            </span>
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-amber-600 text-amber-950 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {tab === 'login' && (
            <>
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('worker')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      role === 'worker'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-extrabold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    Gig Worker ({workerUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('customer')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                      role === 'customer'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-extrabold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    Customer (Hire)
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Login ID (Email, Mobile, or Worker Name)
                    </label>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Accepts ID, Email, Phone or Name
                    </span>
                  </div>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    placeholder={
                      role === 'worker'
                        ? 'e.g. rajesh.electric@example.com or +91 98280 11223'
                        : 'e.g. amit@example.com or +91 98290 12345'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden font-medium"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-800 font-bold">{role === 'worker' ? 'worker123' : 'customer123'}</code>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? 'Verifying & Signing In...' : `Sign In as ${role === 'worker' ? 'Worker' : 'Customer'}`}
                </button>
              </form>

              {/* Quick Credentials Info Banner */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-950">
                  <Key className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <p className="font-bold">Looking for worker credentials?</p>
                    <p className="text-[11px] text-amber-800">All 9 workers use password <strong className="font-mono text-amber-900">worker123</strong></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('credentials')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors"
                >
                  View All 9
                </button>
              </div>

              {/* One-Click Quick Test Accounts */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    One-Click Demo Sign-In ({filteredDemoUsers.length}):
                  </p>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDemoRoleFilter('worker')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                        demoRoleFilter === 'worker' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Workers ({workerUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoRoleFilter('customer')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                        demoRoleFilter === 'customer' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Customers ({customerUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoRoleFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                        demoRoleFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
                  {filteredDemoUsers.map(u => (
                    <div
                      key={u.id}
                      className="p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-xs">{u.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {u.workerProfile?.profession || u.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          title="Fill credentials into form"
                          onClick={() => handleFillCredentials(u)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          title="Sign in instantly"
                          onClick={() => {
                            onAuthSuccess(u);
                            onClose();
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Enter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CREDENTIALS & PASSWORDS DIRECTORY */}
          {tab === 'credentials' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950">
                <p className="font-extrabold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Worker Credentials Directory
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Every worker profile on the home page has a verified login account.
                  Click <strong>"Fill in Form"</strong> to populate their credentials into the Sign In tab, or <strong>"Instant Login"</strong> to enter their Worker Space immediately.
                </p>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {workerUsers.map((w, idx) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={w.avatar}
                          alt={w.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {w.name}
                            </h4>
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                              {w.workerProfile?.profession || 'Worker'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{w.location.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleFillCredentials(w)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
                        >
                          Fill in Form
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAuthSuccess(w);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span>Sign In</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Credentials details table */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Login ID (Email)</span>
                        <div className="flex items-center justify-between">
                          <code className="text-[11px] font-mono font-medium text-slate-800 truncate">{w.email}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(w.email, `email_${w.id}`)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 ml-1"
                          >
                            {copiedKey === `email_${w.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Mobile Phone</span>
                        <div className="flex items-center justify-between">
                          <code className="text-[11px] font-mono font-medium text-slate-800 truncate">{w.phone}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(w.phone, `phone_${w.id}`)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 ml-1"
                          >
                            {copiedKey === `phone_${w.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Password</span>
                        <div className="flex items-center gap-1">
                          <code className="text-xs font-mono font-extrabold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                            {w.password || 'worker123'}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(w.password || 'worker123', `pwd_${w.id}`)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            {copiedKey === `pwd_${w.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98290 00000"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {role === 'worker' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Profession
                    </label>
                    <select
                      value={profession}
                      onChange={e => setProfession(e.target.value as Profession)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden"
                    >
                      <option value="Electrician">Electrician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="Painter">Painter</option>
                      <option value="Cleaner">Cleaner / Domestic Helper</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={experienceYears}
                        onChange={e => setExperienceYears(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={hourlyRate}
                        onChange={e => setHourlyRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-colors"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
