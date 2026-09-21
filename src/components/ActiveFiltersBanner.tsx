import React from 'react';
import { Sparkles, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SearchFilters, SearchQueryAnalysis } from '../types.ts';

interface ActiveFiltersBannerProps {
  nlpAnalysis?: SearchQueryAnalysis;
  activeFilters: SearchFilters;
  onRemoveFilter: (key: keyof SearchFilters) => void;
  onResetAllFilters: () => void;
  onOpenFilterDrawer: () => void;
  matchedCount: number;
  totalCandidates: number;
}

export const ActiveFiltersBanner: React.FC<ActiveFiltersBannerProps> = ({
  nlpAnalysis,
  activeFilters,
  onRemoveFilter,
  onResetAllFilters,
  onOpenFilterDrawer,
  matchedCount,
  totalCandidates,
}) => {
  const autoFilters = nlpAnalysis?.autoFiltersApplied || {};
  const hasAutoFilters = Object.keys(autoFilters).length > 0;

  // Collect active filter tags to show
  const activeChips: { key: keyof SearchFilters; label: string; isAuto: boolean }[] = [];

  if (activeFilters.profession) {
    activeChips.push({
      key: 'profession',
      label: `Profession: ${activeFilters.profession}`,
      isAuto: !!autoFilters.profession,
    });
  }

  if (activeFilters.availability && activeFilters.availability !== 'all') {
    let label = 'Available Now';
    if (activeFilters.availability === 'available_today') label = 'Available Today';
    if (activeFilters.availability === 'available_tomorrow') label = 'Available Tomorrow';
    activeChips.push({
      key: 'availability',
      label,
      isAuto: !!autoFilters.availability,
    });
  }

  if (activeFilters.maxDistanceKm) {
    activeChips.push({
      key: 'maxDistanceKm',
      label: `Within ${activeFilters.maxDistanceKm} km`,
      isAuto: !!autoFilters.maxDistanceKm,
    });
  }

  if (activeFilters.minRating) {
    activeChips.push({
      key: 'minRating',
      label: `${activeFilters.minRating}+ Stars`,
      isAuto: !!autoFilters.minRating,
    });
  }

  if (activeFilters.priceTier && activeFilters.priceTier !== 'all') {
    activeChips.push({
      key: 'priceTier',
      label: `Price: ${activeFilters.priceTier.toUpperCase()}`,
      isAuto: !!autoFilters.priceTier,
    });
  }

  if (activeFilters.emergencyOnly) {
    activeChips.push({
      key: 'emergencyOnly',
      label: 'Emergency Service Only',
      isAuto: !!autoFilters.emergencyService,
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 mb-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500 text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-950">Active Smart Filters</span>
            {hasAutoFilters && (
              <span className="ml-1.5 text-[11px] text-amber-700/90 font-medium hidden sm:inline">
                (Automatically extracted from your request. Click any to remove)
              </span>
            )}
          </div>
        </div>

        {/* Counter and Filter drawer toggle button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <strong className="text-slate-900">{matchedCount}</strong> of {totalCandidates} workers matched
          </span>

          <button
            onClick={onOpenFilterDrawer}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Filters</span>
          </button>

          <button
            onClick={onResetAllFilters}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-medium ml-1"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {activeChips.map(chip => (
          <button
            key={chip.key}
            onClick={() => onRemoveFilter(chip.key)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all group ${
              chip.isAuto
                ? 'bg-amber-100/90 text-amber-900 border border-amber-300/80 hover:bg-amber-200'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>{chip.label}</span>
            {chip.isAuto && (
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                [Auto]
              </span>
            )}
            <X className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
          </button>
        ))}
      </div>
    </div>
  );
};
