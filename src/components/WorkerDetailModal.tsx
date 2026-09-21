import React from 'react';
import { RankedWorker } from '../types.ts';
import { X, Star, MapPin, Clock, Award, ShieldCheck, Check, Phone, ArrowRight, Zap } from 'lucide-react';

interface WorkerDetailModalProps {
  item: RankedWorker | null;
  onClose: () => void;
  onBook: (worker: RankedWorker) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  item,
  onClose,
  onBook,
}) => {
  if (!item) return null;

  const { worker, overallScore, scoreBreakdown, appliedWeights, tags, reasons, estimatedDistanceKm, estimatedTravelTimeMins } = item;
  const stats = worker.statistics;

  const onTimeRate = stats.completedJobs > 0 ? Math.round((stats.onTimeJobs / stats.completedJobs) * 100) : 95;
  const completionRate = stats.acceptedJobs > 0 ? Math.round((stats.completedJobs / stats.acceptedJobs) * 100) : 100;

  const SCORE_METRICS = [
    { label: 'Skill / Job Match', score: scoreBreakdown.skillMatchScore, weight: appliedWeights.skillMatch, desc: 'Relevance of specific skills to your requested service' },
    { label: 'Reliability Record', score: scoreBreakdown.reliabilityScore, weight: appliedWeights.reliability, desc: `${completionRate}% job completion & ${onTimeRate}% on-time arrival` },
    { label: 'Bayesian Rating', score: scoreBreakdown.ratingScore, weight: appliedWeights.rating, desc: `${stats.rating.toFixed(1)} raw rating confidence-adjusted with ${stats.reviewCount} reviews` },
    { label: 'Relevant Experience', score: scoreBreakdown.experienceScore, weight: appliedWeights.experience, desc: `${worker.yearsOfExperience} years hands-on field experience` },
    { label: 'Distance & Travel Time', score: scoreBreakdown.distanceScore, weight: appliedWeights.distance, desc: `${estimatedDistanceKm} km (~${estimatedTravelTimeMins} mins travel)` },
    { label: 'Availability Match', score: scoreBreakdown.availabilityScore, weight: appliedWeights.availability, desc: worker.currentAvailability.replace('_', ' ').toUpperCase() },
    { label: 'Response Speed', score: scoreBreakdown.responseScore, weight: appliedWeights.response, desc: `Replies within ${stats.avgResponseMinutes} minutes` },
    { label: 'Recent Marketplace Activity', score: scoreBreakdown.recentActivityScore, weight: appliedWeights.recentActivity, desc: `${stats.recentJobs30d} jobs completed in the last 30 days` },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img
              src={worker.profilePhoto}
              alt={worker.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{worker.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                  {worker.profession}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                📍 {worker.location.name} · {worker.serviceRadiusKm} km service radius
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1 text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <strong>{stats.rating.toFixed(1)}</strong> ({stats.reviewCount} reviews)
                </span>
                <span>•</span>
                <span>₹{worker.hourlyRate}/hour</span>
                <span>•</span>
                <span className="capitalize text-emerald-700 font-bold">
                  {worker.currentAvailability.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Bio & Intro */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              About the Worker
            </h4>
            <p className="text-slate-700 leading-relaxed">{worker.bio}</p>
          </div>

          {/* Skills Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Verified Skills & Specialities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {worker.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="text-center p-2">
              <p className="text-[11px] font-medium text-slate-500">Completed Jobs</p>
              <p className="text-lg font-extrabold text-slate-900">{stats.completedJobs}</p>
            </div>
            <div className="text-center p-2">
              <p className="text-[11px] font-medium text-slate-500">On-Time Rate</p>
              <p className="text-lg font-extrabold text-emerald-700">{onTimeRate}%</p>
            </div>
            <div className="text-center p-2">
              <p className="text-[11px] font-medium text-slate-500">Avg Reply Time</p>
              <p className="text-lg font-extrabold text-amber-700">{stats.avgResponseMinutes}m</p>
            </div>
            <div className="text-center p-2">
              <p className="text-[11px] font-medium text-slate-500">Repeat Clients</p>
              <p className="text-lg font-extrabold text-indigo-700">{stats.repeatCustomers}</p>
            </div>
          </div>

          {/* Transparent 8-Factor Score Breakdown */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Transparent Ranking Match: {Math.round(overallScore)}%</span>
                </h4>
                <p className="text-xs text-amber-800/80">
                  Calculated dynamically based on your specific job needs, not a static global leaderboard.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {SCORE_METRICS.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {metric.label}{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({metric.weight}% weight)
                      </span>
                    </span>
                    <span className="font-extrabold text-slate-900">{Math.round(metric.score)} / 100</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, metric.score))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 italic">{metric.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${worker.phone}`}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>Call ({worker.phone})</span>
            </a>
          </div>

          <button
            onClick={() => {
              onClose();
              onBook(item);
            }}
            className="flex-1 max-w-xs py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-extrabold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Book {worker.name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
