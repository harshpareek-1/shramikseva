import React, { useState, useEffect } from 'react';
import { WorkerProfile, Booking, AvailabilityStatus } from '../types.ts';
import {
  Wrench,
  CheckCircle,
  Clock,
  Star,
  MapPin,
  TrendingUp,
  Phone,
  Calendar,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface WorkerDashboardProps {
  worker: WorkerProfile;
  bookings: Booking[];
  onUpdateStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  onUpdateAvailability: (workerId: string, availability: AvailabilityStatus) => Promise<void>;
  onUpdateSkills: (workerId: string, skills: string[]) => Promise<void>;
  onOpenLocationModal?: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  worker,
  bookings,
  onUpdateStatus,
  onUpdateAvailability,
  onUpdateSkills,
  onOpenLocationModal,
}) => {
  const stats = worker.statistics;
  const [newSkill, setNewSkill] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const onTimeRate = stats.completedJobs > 0 ? Math.round((stats.onTimeJobs / stats.completedJobs) * 100) : 95;
  const completionRate = stats.acceptedJobs > 0 ? Math.round((stats.completedJobs / stats.acceptedJobs) * 100) : 100;

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (worker.skills.includes(newSkill.trim())) return;
    const updated = [...worker.skills, newSkill.trim()];
    setIsUpdating(true);
    await onUpdateSkills(worker.id, updated);
    setNewSkill('');
    setIsUpdating(false);
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    const updated = worker.skills.filter(s => s !== skillToRemove);
    setIsUpdating(true);
    await onUpdateSkills(worker.id, updated);
    setIsUpdating(false);
  };

  // Filter bookings for this worker
  const myBookings = bookings.filter(b => b.workerId === worker.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Worker Identity & Live Availability Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={worker.profilePhoto}
              alt={worker.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                worker.currentAvailability === 'available_now'
                  ? 'bg-emerald-500'
                  : worker.currentAvailability === 'available_today'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {worker.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {worker.profession}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs sm:text-sm text-slate-500">
                📍 {worker.location.name} · {worker.yearsOfExperience} yrs exp · ₹{worker.hourlyRate}/hr
              </p>
              {onOpenLocationModal && (
                <button
                  type="button"
                  onClick={onOpenLocationModal}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                  title="Update your base address using Google Maps auto-detect or search"
                >
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Update Location (Google Maps)</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1 text-amber-600">
                <Star className="w-4 h-4 fill-amber-500" />
                <strong>{stats.rating.toFixed(1)}</strong> ({stats.reviewCount} reviews)
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{completionRate}% Completion</span>
            </div>
          </div>
        </div>

        {/* Real-time Availability Radio Switcher */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full md:w-auto">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Your Real-Time Availability
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
            {[
              { id: 'available_now', label: '🟢 Available Now', desc: 'Can take jobs immediately' },
              { id: 'available_today', label: '📅 Today', desc: 'Available later today' },
              { id: 'busy', label: '🟡 Busy on Job', desc: 'Working on active task' },
              { id: 'offline', label: '⚪ Offline', desc: 'Not taking bookings' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateAvailability(worker.id, opt.id as AvailabilityStatus)}
                className={`px-3 py-2 rounded-xl text-center border transition-all ${
                  worker.currentAvailability === opt.id
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Work Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Total Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.completedJobs}</p>
          <span className="text-[11px] text-slate-500">{stats.totalJobs} requested</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">On-Time Arrival</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{onTimeRate}%</p>
          <span className="text-[11px] text-slate-500">{stats.onTimeJobs} on time</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Avg Reply Speed</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{stats.avgResponseMinutes} min</p>
          <span className="text-[11px] text-slate-500">⚡ Fast Reply tag eligible</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Customer Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.rating.toFixed(1)}</p>
          <span className="text-[11px] text-slate-500">From {stats.reviewCount} reviews</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Repeat Clients</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700">{stats.repeatCustomers}</p>
          <span className="text-[11px] text-slate-500">{stats.recentJobs30d} jobs in 30 days</span>
        </div>
      </div>

      {/* Main Grid: Live Job Requests (Left) & Skills Manager + Ranking Tips (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incoming Job Requests & Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <span>Job Requests & Dispatches</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {myBookings.length}
              </span>
            </h2>
          </div>

          {myBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
              <p className="text-slate-500 text-sm font-medium">No current jobs assigned.</p>
              <p className="text-xs text-slate-400">
                Keep your status set to <strong>"🟢 Available Now"</strong> to appear at the top of customer searches!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Job #{b.id}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {b.serviceTitle}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Client: <strong className="text-slate-900">{b.customerName}</strong> ·{' '}
                        <a href={`tel:${b.customerPhone}`} className="text-amber-700 hover:underline">
                          {b.customerPhone}
                        </a>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                        b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'accepted'
                          ? 'bg-sky-100 text-sky-800'
                          : b.status === 'en_route'
                          ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                          : b.status === 'in_progress'
                          ? 'bg-purple-100 text-purple-800'
                          : b.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong>Issue Note:</strong> {b.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span>
                      <span className="font-medium text-slate-800">{b.address}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled</span>
                      <span className="font-medium text-slate-800">{b.scheduledTime}</span>
                    </div>
                  </div>

                  {/* Worker Action Stepper */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {b.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(b.id, 'accepted')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Accept Job
                        </button>
                        <button
                          onClick={() => onUpdateStatus(b.id, 'cancelled')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {b.status === 'accepted' && (
                      <button
                        onClick={() => onUpdateStatus(b.id, 'en_route')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        I am On The Way (En Route)
                      </button>
                    )}

                    {b.status === 'en_route' && (
                      <button
                        onClick={() => onUpdateStatus(b.id, 'in_progress')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Arrived & Start Work
                      </button>
                    )}

                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => onUpdateStatus(b.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Mark Completed & Request Payment
                      </button>
                    )}

                    {b.status === 'completed' && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Completed successfully. Payment verified.</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Skills Manager & How You Rank */}
        <div className="space-y-6">
          {/* Skills Management */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Your Skills & Specialities</span>
            </h3>
            <p className="text-xs text-slate-500">
              The ranking system prioritizes workers with specific skills matching customer requests.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {worker.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 group"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600"
                    title="Remove skill"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add skill input */}
            <form onSubmit={handleAddSkill} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="e.g. Copper Pipe Brazing"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-amber-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isUpdating}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Ranking Algorithm Insights for Workers */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>How To Rank Higher</span>
            </h3>
            <ul className="space-y-2 text-xs text-amber-900">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">1.</span>
                <span>
                  <strong>Keep reply speed under 5 mins:</strong> Automatically unlocks the "⚡ Fast Reply" tag and boosts your score by 5%.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">2.</span>
                <span>
                  <strong>Reliability score (20% weight):</strong> Never cancel after accepting. An on-time arrival rate above 92% boosts you to the top.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">3.</span>
                <span>
                  <strong>Bayesian Rating Confidence:</strong> High volume of real reviews beats a 5.0 with only 2 reviews.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600">4.</span>
                <span>
                  <strong>Toggle "Available Now":</strong> Urgent jobs heavily weight immediate availability over distance.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
