import { WorkerProfile, RankingBreakdown, RankingWeights } from '../src/types.ts';
import { MatchAnalysis } from './matchingEngine.ts';

interface ReasonCandidate {
  reason: string;
  impactScore: number;
  category: 'distance' | 'skill' | 'rating' | 'reliability' | 'response' | 'availability' | 'experience';
}

export function generateExplanationReasons(
  worker: WorkerProfile,
  breakdown: RankingBreakdown,
  weights: RankingWeights,
  distanceKm: number,
  travelTimeMins: number,
  matchAnalysis: MatchAnalysis,
  urgency?: string
): string[] {
  const stats = worker.statistics;
  const candidates: ReasonCandidate[] = [];

  // 1. Distance factor
  if (distanceKm <= 3.5) {
    const impact = (weights.distance / 100) * breakdown.distanceScore;
    candidates.push({
      reason: `📍 ${distanceKm} km away (~${travelTimeMins} min travel)`,
      impactScore: impact * (urgency === 'emergency' ? 1.5 : 1.1),
      category: 'distance',
    });
  }

  // 2. Skill match factor
  if (matchAnalysis.matchedSkills.length > 0) {
    const impact = (weights.skillMatch / 100) * breakdown.skillMatchScore;
    const topSkill = matchAnalysis.matchedSkills[0];
    candidates.push({
      reason: `🔧 Specializes in ${topSkill}`,
      impactScore: impact * 1.3,
      category: 'skill',
    });
  }

  // 3. Reliability factor
  const onTimeRate = stats.completedJobs > 0 ? Math.round((stats.onTimeJobs / stats.completedJobs) * 100) : 95;
  if (onTimeRate >= 94 && stats.completedJobs >= 10) {
    const impact = (weights.reliability / 100) * breakdown.reliabilityScore;
    candidates.push({
      reason: `⏰ ${onTimeRate}% on-time completion record`,
      impactScore: impact,
      category: 'reliability',
    });
  }

  // 4. Rating & Reviews factor
  if (stats.rating >= 4.7 && stats.reviewCount >= 15) {
    const impact = (weights.rating / 100) * breakdown.ratingScore;
    candidates.push({
      reason: `⭐ ${stats.rating.toFixed(1)} rating from ${stats.reviewCount} customer reviews`,
      impactScore: impact,
      category: 'rating',
    });
  }

  // 5. Response Speed factor
  if (stats.avgResponseMinutes <= 5) {
    const impact = (weights.response / 100) * breakdown.responseScore;
    candidates.push({
      reason: `⚡ Usually replies within ${stats.avgResponseMinutes} minutes`,
      impactScore: impact * (urgency === 'emergency' ? 1.6 : 0.9),
      category: 'response',
    });
  }

  // 6. Availability factor
  if (worker.currentAvailability === 'available_now') {
    const impact = (weights.availability / 100) * breakdown.availabilityScore;
    candidates.push({
      reason: `🟢 Available right now for immediate dispatch`,
      impactScore: impact * (urgency === 'emergency' ? 1.8 : 1.0),
      category: 'availability',
    });
  }

  // 7. Experience factor
  if (worker.yearsOfExperience >= 5) {
    const impact = (weights.experience / 100) * breakdown.experienceScore;
    candidates.push({
      reason: `🛠️ ${worker.yearsOfExperience} years of hands-on ${worker.profession.toLowerCase()} experience`,
      impactScore: impact * 0.9,
      category: 'experience',
    });
  }

  // If new worker
  if (worker.isNewWorker) {
    candidates.push({
      reason: `🆕 Verified newcomer with 100% completion in trial jobs`,
      impactScore: 75,
      category: 'experience',
    });
  }

  // Sort candidates by impactScore descending
  candidates.sort((a, b) => b.impactScore - a.impactScore);

  // Pick the top 2 from distinct categories so reasons aren't redundant
  const pickedReasons: string[] = [];
  const usedCategories = new Set<string>();

  for (const item of candidates) {
    if (!usedCategories.has(item.category)) {
      pickedReasons.push(item.reason);
      usedCategories.add(item.category);
      if (pickedReasons.length === 2) break;
    }
  }

  // Fallback if none picked
  if (pickedReasons.length === 0) {
    pickedReasons.push(`⭐ Verified local ${worker.profession.toLowerCase()}`);
    pickedReasons.push(`📍 Located in ${worker.location.name}`);
  } else if (pickedReasons.length === 1) {
    if (!usedCategories.has('experience')) {
      pickedReasons.push(`🛠️ ${worker.yearsOfExperience} years local experience`);
    } else {
      pickedReasons.push(`📍 ${distanceKm} km from your requested location`);
    }
  }

  return pickedReasons.slice(0, 2);
}
