import React, { useState } from 'react';
import { User, UserRole } from '../types.ts';
import {
  Wrench,
  MapPin,
  User as UserIcon,
  ShieldAlert,
  Calendar,
  LogIn,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onSwitchUser: (user: User) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeView: 'customer' | 'worker' | 'admin';
  setActiveView: (view: 'customer' | 'worker' | 'admin') => void;
  activeBookingsCount: number;
  onOpenBookings: () => void;
  demoUsers: User[];
  onOpenLocationModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  onOpenAuth,
  onLogout,
  activeView,
  setActiveView,
  activeBookingsCount,
  onOpenBookings,
  demoUsers,
  onOpenLocationModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('customer')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Karyo</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Marketplace
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Trusted Local Home Gig Workers</p>
            </div>
          </button>
        </div>

        {/* Location selector indicator */}
        <button
          id="header-location-selector"
          type="button"
          onClick={onOpenLocationModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 transition-all shadow-2xs group cursor-pointer"
          title="Click to change location or auto-detect with Google Maps"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-amber-100/90 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <div className="text-left">
            <span className="block truncate max-w-[110px] sm:max-w-[160px] md:max-w-[200px] text-slate-800 font-bold text-xs leading-tight">
              {currentUser?.location?.name || 'Jaipur, Rajasthan'}
            </span>
            <span className="text-[10px] text-amber-700 group-hover:text-amber-800 font-semibold leading-none">
              Change Location ▾
            </span>
          </div>
        </button>

        {/* Navigation / Role Spaces */}
        <div className="flex items-center gap-2">
          {/* Active View Switcher */}
          <div className="hidden lg:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('customer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hire Workers
            </button>
            <button
              onClick={() => setActiveView('worker')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeView === 'worker'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Worker Space
            </button>
            <button
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeView === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              Admin Ranking
            </button>
          </div>

          {/* Customer Bookings Shortcut */}
          {activeView === 'customer' && (
            <button
              onClick={onOpenBookings}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">My Jobs</span>
              {activeBookingsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                  {activeBookingsCount}
                </span>
              )}
            </button>
          )}

          {/* User Account / Demo Switcher dropdown */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all shadow-xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-700 capitalize leading-none">
                    {currentUser.role}
                  </p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Register</span>
              </button>
            )}

            {/* User switch menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed in as</p>
                  <p className="font-bold text-slate-900 text-sm truncate">{currentUser?.name}</p>
                  <p className="text-slate-500 truncate">{currentUser?.email}</p>
                </div>

                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                    Quick Switch Account (Testing)
                  </p>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                    {demoUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${
                          u.id === currentUser?.id ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-md object-cover shrink-0" />
                        <div className="truncate flex-1">
                          <p className="truncate leading-tight font-medium text-slate-800">{u.name}</p>
                          <span className="text-[10px] capitalize text-slate-500 font-semibold">
                            {u.workerProfile?.profession ? `${u.workerProfile.profession} (Worker)` : u.role}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      onOpenLocationModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-50 text-amber-900 font-semibold text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Location: {currentUser?.location.name || 'Jaipur'} (Change)</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView(currentUser?.role === 'worker' ? 'worker' : 'customer');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Switch to {currentUser?.role === 'worker' ? 'Worker Dashboard' : 'Customer View'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('admin');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                    <span>Admin Ranking System</span>
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
