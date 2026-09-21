import React, { useState } from 'react';
import { AdminMarketplaceConfig, RankingWeights } from '../types.ts';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  MapPin,
  Star,
  ShieldAlert,
} from 'lucide-react';

interface AdminPanelProps {
  config: AdminMarketplaceConfig;
  onSaveConfig: (newConfig: AdminMarketplaceConfig) => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  onSaveConfig,
  onResetDefaults,
}) => {
  const [currentWeights, setCurrentWeights] = useState<RankingWeights>({
    ...config.rankingWeights,
  });

  const [tagThresholds, setTagThresholds] = useState({
    ...config.tagThresholds,
  });

  const [bayesianPrior, setBayesianPrior] = useState({
    ...config.bayesianPrior,
  });

  const [explorationPercentage, setExplorationPercentage] = useState(
    config.explorationPercentage
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate sum of weights
  const weightSum =
    Number(currentWeights.skillMatch || 0) +
    Number(currentWeights.reliability || 0) +
    Number(currentWeights.rating || 0) +
    Number(currentWeights.experience || 0) +
    Number(currentWeights.distance || 0) +
    Number(currentWeights.availability || 0) +
    Number(currentWeights.response || 0) +
    Number(currentWeights.recentActivity || 0);

  const isValidSum = Math.round(weightSum) === 100;

  const handleWeightChange = (field: keyof RankingWeights, value: number) => {
    setCurrentWeights(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(100, value)),
    }));
    setMessage(null);
  };

  const applyPreset = (presetName: 'default' | 'emergency' | 'scheduled' | 'general_labour') => {
    if (presetName === 'default') {
      setCurrentWeights({
        skillMatch: 25,
        reliability: 20,
        rating: 15,
        experience: 10,
        distance: 10,
        availability: 10,
        response: 5,
        recentActivity: 5,
      });
    } else if (presetName === 'emergency') {
      setCurrentWeights({ ...config.jobTypeSpecificWeights.emergency });
    } else if (presetName === 'scheduled') {
      setCurrentWeights({ ...config.jobTypeSpecificWeights.scheduled });
    } else if (presetName === 'general_labour') {
      setCurrentWeights({ ...config.jobTypeSpecificWeights.general_labour });
    }
    setMessage({ type: 'success', text: `Loaded preset: ${presetName.toUpperCase()}` });
  };

  const handleSave = async () => {
    if (!isValidSum) {
      setMessage({
        type: 'error',
        text: `Ranking weights must sum to exactly 100%. Current sum is ${weightSum}%.`,
      });
      return;
    }

    setSaving(true);
    try {
      const updatedConfig: AdminMarketplaceConfig = {
        ...config,
        rankingWeights: currentWeights,
        tagThresholds,
        bayesianPrior,
        explorationPercentage,
      };
      await onSaveConfig(updatedConfig);
      setMessage({ type: 'success', text: 'Marketplace ranking parameters saved and active!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Marketplace Ranking Engine Controls
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold">
              Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure multi-factor ranking weights, Bayesian rating confidence, data-driven tag thresholds, and fairness exploration.
          </p>
        </div>

        <button
          onClick={onResetDefaults}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Factory Defaults</span>
        </button>
      </div>

      {/* Message alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* 1. Ranking Weights Matrix */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600" />
              <span>Multi-Factor Ranking Weights</span>
            </h2>
            <p className="text-xs text-slate-500">
              Weights represent the relative importance of each dimension in the final 0–100 score.
            </p>
          </div>

          {/* Sum Validation Badge */}
          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto ${
              isValidSum
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
            }`}
          >
            <span>Total Weight: {weightSum}%</span>
            {isValidSum ? '✓ (Valid 100%)' : '⚠️ Must equal exactly 100%'}
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            Quick Presets:
          </span>
          <button
            onClick={() => applyPreset('default')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
          >
            Default Balanced (25/20/15/10/10/10/5/5)
          </button>
          <button
            onClick={() => applyPreset('emergency')}
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 font-semibold text-amber-900"
          >
            Emergency Mode (Availability 30%, Distance 20%)
          </button>
          <button
            onClick={() => applyPreset('scheduled')}
            className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 font-semibold text-sky-900"
          >
            Scheduled Precision (Skill 30%, Exp 20%)
          </button>
          <button
            onClick={() => applyPreset('general_labour')}
            className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 font-semibold text-purple-900"
          >
            General Labour (Availability 25%, Distance 20%)
          </button>
        </div>

        {/* 8 Configurable Sliders & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            { key: 'skillMatch' as const, label: 'Skill / Job Match', desc: 'Prioritizes specific relevant skills over general profession', icon: '🔧' },
            { key: 'reliability' as const, label: 'Reliability Score', desc: 'Job completion rate, on-time arrival rate, zero no-shows', icon: '⏰' },
            { key: 'rating' as const, label: 'Customer Rating (Bayesian)', desc: 'Weighted average adjusted by review volume confidence', icon: '⭐' },
            { key: 'experience' as const, label: 'Relevant Experience', desc: 'Years in trade and service-specific completed projects', icon: '🛠️' },
            { key: 'distance' as const, label: 'Distance / Travel Time', desc: 'Estimated travel time within worker service radius', icon: '📍' },
            { key: 'availability' as const, label: 'Availability Timing', desc: 'Matches requested time slot (now / today / tomorrow)', icon: '🟢' },
            { key: 'response' as const, label: 'Response Speed', desc: 'Avg response time (<5m gives Fast Reply bonus)', icon: '⚡' },
            { key: 'recentActivity' as const, label: 'Recent Marketplace Activity', desc: 'Active in the past 30 days without permanent punishment', icon: '🔄' },
          ].map(field => (
            <div
              key={field.key}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{field.icon}</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">{field.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentWeights[field.key]}
                    onChange={e => handleWeightChange(field.key, Number(e.target.value))}
                    className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="50"
                value={currentWeights[field.key]}
                onChange={e => handleWeightChange(field.key, Number(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 leading-tight">{field.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Bayesian Rating Confidence & New Worker Fairness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bayesian Rating Parameters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 text-sm">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Bayesian Rating Confidence</span>
          </h3>
          <p className="text-xs text-slate-500">
            Prevents a worker with 5.0 stars and only 2 reviews from automatically outranking a veteran with 4.85 stars and 300 reviews.
          </p>

          <div className="space-y-2.5 pt-1 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Global Prior Rating (C)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={bayesianPrior.globalAverageRating}
                onChange={e =>
                  setBayesianPrior(prev => ({
                    ...prev,
                    globalAverageRating: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
              <span className="text-[10px] text-slate-400">Baseline marketplace rating mean (default: 4.2)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Minimum Confidence Reviews (m)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={bayesianPrior.minimumConfidenceReviews}
                onChange={e =>
                  setBayesianPrior(prev => ({
                    ...prev,
                    minimumConfidenceReviews: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
              <span className="text-[10px] text-slate-400">
                Number of reviews needed before worker's raw rating strongly dominates prior
              </span>
            </div>
          </div>
        </div>

        {/* New Worker Controlled Exploration (Fairness) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 text-sm">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>New Worker Fairness & Exploration</span>
          </h3>
          <p className="text-xs text-slate-500">
            Gives qualified newly registered workers controlled visibility slots in top search results, preventing veteran monopoly.
          </p>

          <div className="pt-2 space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Exploration Allocation</span>
                <span className="text-amber-700">{explorationPercentage}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={explorationPercentage}
                onChange={e => setExplorationPercentage(Number(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Allocates up to {explorationPercentage}% of top candidate slots to qualified new workers who match skills & location.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tag Generation Thresholds */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 text-sm">
        <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Automated Worker Tag Thresholds</span>
        </h3>
        <p className="text-xs text-slate-500">
          Tags are strictly data-driven based on actual worker metrics and these configurable thresholds.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">⚡ Fast Reply Tag</span>
            <span className="text-slate-500 text-[11px] block">Avg response under:</span>
            <input
              type="number"
              value={tagThresholds.fastReplyMaxMinutes}
              onChange={e =>
                setTagThresholds(prev => ({
                  ...prev,
                  fastReplyMaxMinutes: Number(e.target.value),
                }))
              }
              className="mt-1 w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <span className="text-[10px] text-slate-400">minutes</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">⏰ Usually On Time</span>
            <span className="text-slate-500 text-[11px] block">On-time rate above:</span>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="1.0"
              value={tagThresholds.usuallyOnTimeMinRate}
              onChange={e =>
                setTagThresholds(prev => ({
                  ...prev,
                  usuallyOnTimeMinRate: Number(e.target.value),
                }))
              }
              className="mt-1 w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <span className="text-[10px] text-slate-400">e.g. 0.90 for 90%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">📍 Nearby Tag</span>
            <span className="text-slate-500 text-[11px] block">Max travel distance:</span>
            <input
              type="number"
              value={tagThresholds.nearbyMaxKm}
              onChange={e =>
                setTagThresholds(prev => ({
                  ...prev,
                  nearbyMaxKm: Number(e.target.value),
                }))
              }
              className="mt-1 w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <span className="text-[10px] text-slate-400">kilometers</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block mb-1">🛠️ Experienced Tag</span>
            <span className="text-slate-500 text-[11px] block">Min experience:</span>
            <input
              type="number"
              value={tagThresholds.experiencedMinYears}
              onChange={e =>
                setTagThresholds(prev => ({
                  ...prev,
                  experiencedMinYears: Number(e.target.value),
                }))
              }
              className="mt-1 w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold"
            />
            <span className="text-[10px] text-slate-400">years</span>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !isValidSum}
          className={`px-6 py-3 rounded-2xl font-extrabold text-sm shadow-md transition-all ${
            isValidSum
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {saving ? 'Deploying Ranking Parameters...' : 'Save & Apply Ranking Configuration'}
        </button>
      </div>
    </div>
  );
};
