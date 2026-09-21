import React from 'react';
import { X, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';
import { SearchFilters, Profession, PriceTier } from '../types.ts';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onUpdateFilters: (updates: Partial<SearchFilters>) => void;
  onResetFilters: () => void;
  matchedCount: number;
}

const PROFESSIONS: (Profession | 'All')[] = [
  'All',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Cleaner',
];

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  matchedCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Filters & Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* Profession */}
          <div>
            <label className="block font-bold text-slate-900 mb-2.5">Profession / Trade</label>
            <div className="grid grid-cols-2 gap-2">
              {PROFESSIONS.map(prof => {
                const isSelected = prof === 'All' ? !filters.profession : filters.profession === prof;
                return (
                  <button
                    key={prof}
                    type="button"
                    onClick={() => onUpdateFilters({ profession: prof === 'All' ? undefined : (prof as Profession) })}
                    className={`px-3 py-2 rounded-xl text-left font-semibold text-xs border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{prof}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block font-bold text-slate-900 mb-2.5">Availability Timing</label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'Any time' },
                { id: 'available_now', label: '🟢 Available Right Now (Immediate)' },
                { id: 'available_today', label: '📅 Available Today' },
                { id: 'available_tomorrow', label: '🗓️ Available Tomorrow' },
              ].map(opt => (
                <label
                  key={opt.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700"
                >
                  <input
                    type="radio"
                    name="availability"
                    checked={(filters.availability || 'all') === opt.id}
                    onChange={() => onUpdateFilters({ availability: opt.id as any })}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="font-medium text-xs sm:text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Maximum Distance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900">Maximum Distance</label>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {filters.maxDistanceKm ? `Within ${filters.maxDistanceKm} km` : 'Any Distance'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 25].map(km => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onUpdateFilters({ maxDistanceKm: filters.maxDistanceKm === km ? undefined : km })}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    filters.maxDistanceKm === km
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block font-bold text-slate-900 mb-2.5">Customer Rating</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: undefined, label: 'All Ratings' },
                { val: 4.0, label: '⭐ 4.0+' },
                { val: 4.5, label: '⭐ 4.5+' },
              ].map(r => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => onUpdateFilters({ minRating: r.val })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    filters.minRating === r.val || (!filters.minRating && !r.val)
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Experience */}
          <div>
            <label className="block font-bold text-slate-900 mb-2.5">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: undefined, label: 'Any' },
                { val: 5, label: '5+ Years' },
                { val: 8, label: '8+ Years' },
              ].map(exp => (
                <button
                  key={exp.label}
                  type="button"
                  onClick={() => onUpdateFilters({ minExperienceYears: exp.val })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    filters.minExperienceYears === exp.val || (!filters.minExperienceYears && !exp.val)
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block font-bold text-slate-900 mb-2.5">Price Range</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'low', label: '₹ Budget' },
                { id: 'medium', label: '₹₹ Standard' },
                { id: 'high', label: '₹₹₹ Premium' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateFilters({ priceTier: p.id as PriceTier | 'all' })}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    (filters.priceTier || 'all') === p.id
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Service Only */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters.emergencyOnly}
                onChange={e => onUpdateFilters({ emergencyOnly: e.target.checked })}
                className="w-4 h-4 accent-amber-600 rounded-sm"
              />
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                🚨 Emergency Ready Service (24/7 on-demand response)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition-colors text-center"
          >
            Show {matchedCount} Workers
          </button>
        </div>
      </div>
    </div>
  );
};
