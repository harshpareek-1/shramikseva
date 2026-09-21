import { WorkerProfile, WorkerTag, AdminMarketplaceConfig } from '../src/types.ts';
import { MatchAnalysis } from './matchingEngine.ts';

export function generateWorkerTags(
  worker: WorkerProfile,
  distanceKm: number,
  adjustedRating: number,
  thresholds: AdminMarketplaceConfig['tagThresholds'],
  matchAnalysis: MatchAnalysis
): WorkerTag[] {
  const tags: WorkerTag[] = [];
  const stats = worker.statistics;

  // 1. Available Now
  if (worker.currentAvailability === 'available_now') {
    tags.push({
      id: 'tag_avail_now',
      label: 'Available Now',
      icon: '🟢',
      type: 'badge',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    });
  }

  // 2. Fast Reply
  if (stats.avgResponseMinutes <= thresholds.fastReplyMaxMinutes) {
    tags.push({
      id: 'tag_fast_reply',
      label: `Fast Reply (${stats.avgResponseMinutes}m)`,
      icon: '⚡',
      type: 'speed',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    });
  }

  // 3. Nearby
  if (distanceKm <= thresholds.nearbyMaxKm) {
    tags.push({
      id: 'tag_nearby',
      label: `Nearby (${distanceKm} km)`,
      icon: '📍',
      type: 'location',
      color: 'bg-sky-50 text-sky-800 border-sky-200',
    });
  }

  // 4. Specialist Tag (if strong match)
  if (matchAnalysis.specialistMatchFound && matchAnalysis.matchedSkills.length > 0) {
    const mainSkill = matchAnalysis.matchedSkills[0];
    tags.push({
      id: 'tag_specialist',
      label: `${mainSkill} Specialist`,
      icon: '🔧',
      type: 'specialist',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    });
  }

  // 5. Usually On Time
  const onTimeRate = stats.completedJobs > 0 ? stats.onTimeJobs / stats.completedJobs : 0.9;
  if (onTimeRate >= thresholds.usuallyOnTimeMinRate && stats.completedJobs >= 5) {
    tags.push({
      id: 'tag_on_time',
      label: `${Math.round(onTimeRate * 100)}% On-Time`,
      icon: '⏰',
      type: 'speed',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
    });
  }

  // 6. Top Rated vs Highly Rated
  if (stats.rating >= thresholds.topRatedMinRating && stats.reviewCount >= thresholds.topRatedMinReviews) {
    tags.push({
      id: 'tag_top_rated',
      label: 'Top Rated',
      icon: '🏆',
      type: 'quality',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    });
  } else if (adjustedRating >= thresholds.highlyRatedMinAdjusted && stats.reviewCount >= thresholds.highlyRatedMinReviews) {
    tags.push({
      id: 'tag_highly_rated',
      label: 'Highly Rated',
      icon: '⭐',
      type: 'quality',
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    });
  }

  // 7. Experienced
  if (worker.yearsOfExperience >= thresholds.experiencedMinYears) {
    tags.push({
      id: 'tag_experienced',
      label: `${worker.yearsOfExperience}y Exp`,
      icon: '🛠️',
      type: 'experience',
      color: 'bg-slate-50 text-slate-700 border-slate-200',
    });
  }

  // 8. Frequently Booked
  if (stats.repeatCustomers >= 20 || stats.recentJobs30d >= 15) {
    tags.push({
      id: 'tag_frequently_booked',
      label: 'Frequently Booked',
      icon: '🔄',
      type: 'badge',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    });
  }

  // 9. New Worker
  if (worker.isNewWorker) {
    tags.push({
      id: 'tag_new_worker',
      label: 'New Talent',
      icon: '🆕',
      type: 'badge',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
    });
  }

  return tags.slice(0, 4); // Limit to top 4 most pertinent tags to keep UI clean and scannable
}
