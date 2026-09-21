import React from 'react';
import { RankedWorker } from '../types.ts';
import { Star, MapPin, CheckCircle, Info, Calendar, ArrowRight } from 'lucide-react';

interface WorkerCardProps {
  item: RankedWorker;
  onBook: (worker: RankedWorker) => void;
  onViewDetails: (worker: RankedWorker) => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  item,
  onBook,
  onViewDetails,
}) => {
  const { worker, overallScore, tags, reasons, estimatedDistanceKm, estimatedTravelTimeMins, isExplorationSlot } = item;
  const stats = worker.statistics;

  const priceSymbol = worker.priceTier === 'low' ? '₹ (Budget)' : worker.priceTier === 'high' ? '₹₹₹ (Premium)' : '₹₹ (Standard)';

  return (
    <div className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between group">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Profile Photo */}
            <div className="relative shrink-0">
              <img
                src={worker.profilePhoto}
                alt={worker.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
              {/* Availability Indicator dot */}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  worker.currentAvailability === 'available_now'
                    ? 'bg-emerald-500'
                    : worker.currentAvailability === 'available_today'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={`Status: ${worker.currentAvailability.replace('_', ' ')}`}
              />
            </div>

            {/* Name & Profession */}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                  {worker.name}
                </h3>
                {stats.completedJobs >= 10 && stats.rating >= 4.7 && (
                  <CheckCircle className="w-4 h-4 text-sky-600 fill-sky-100 shrink-0" title="Verified Top Performer" />
                )}
                {isExplorationSlot && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                    New Talent
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-0.5">
                {worker.profession}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                {worker.location.name}
              </p>
            </div>
          </div>

          {/* Match Score Pill */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              onClick={() => onViewDetails(item)}
              className="cursor-pointer px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/15 border border-amber-300 text-amber-950 text-xs font-extrabold flex items-center gap-1"
              title="Click to see transparent score calculation"
            >
              <span>{Math.round(overallScore)}%</span>
              <span className="text-[10px] font-bold text-amber-700">Match</span>
              <Info className="w-3 h-3 text-amber-600 opacity-75" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">
              ₹{worker.hourlyRate}/hr · {priceSymbol}
            </span>
          </div>
        </div>

        {/* Rating, Distance & Experience metrics */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 py-1.5 border-y border-slate-100">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-extrabold text-slate-900">{stats.rating.toFixed(1)}</span>
            <span className="text-slate-500 font-medium">({stats.reviewCount} reviews)</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-900">{estimatedDistanceKm} km away</span>
            <span className="text-slate-500 text-[11px]"> (~{estimatedTravelTimeMins} min)</span>
          </div>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-medium">{worker.yearsOfExperience} yrs exp</span>
        </div>

        {/* Data-Driven Worker Tags */}
        <div className="flex flex-wrap gap-1.5 my-2.5">
          {tags.map(tag => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${tag.color}`}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </span>
          ))}
        </div>

        {/* Transparent "Why Recommended?" Section (Requirement #15) */}
        <div className="my-2.5 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80">
          <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
            <span>Why recommended for you?</span>
          </p>
          <ul className="space-y-1 text-xs font-semibold text-slate-800">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="text-amber-600">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors text-center"
        >
          View Profile & Score
        </button>

        <button
          type="button"
          onClick={() => onBook(item)}
          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Book Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
