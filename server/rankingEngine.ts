import {
  WorkerProfile,
  RankingWeights,
  RankingBreakdown,
  RankedWorker,
  AdminMarketplaceConfig,
} from '../src/types.ts';
import { calculateDistanceKm } from './filterEngine.ts';
import { computeSkillMatch } from './matchingEngine.ts';
import { generateWorkerTags } from './tagGenerator.ts';
import { generateExplanationReasons } from './explanationGenerator.ts';

// 1. Bayesian Rating Confidence Calculation
export function calculateBayesianRatingScore(
  rawRating: number,
  reviewCount: number,
  priorRating: number = 4.2,
  minConfidenceReviews: number = 8
): { score: number; adjustedRating: number } {
  // Formula: (v / (v + m)) * R + (m / (v + m)) * C
  const v = Math.max(0, reviewCount);
  const m = Math.max(1, minConfidenceReviews);
  const R = rawRating > 0 ? rawRating : priorRating;
  const C = priorRating;

  const adjustedRating = (v * R + m * C) / (v + m);

  // Normalize adjusted rating (range approx 3.0 to 5.0) into a 0 - 100 score
  // 5.0 -> 100, 4.0 -> 70, 3.0 -> 40, <2.5 -> 20
  const normalizedScore = Math.min(100, Math.max(0, ((adjustedRating - 2.5) / 2.5) * 100));

  return {
    score: Number(normalizedScore.toFixed(1)),
    adjustedRating: Number(adjustedRating.toFixed(2)),
  };
}

// 2. Reliability Score Calculation
export function calculateReliabilityScore(worker: WorkerProfile): number {
  const stats = worker.statistics;
  const accepted = Math.max(1, stats.acceptedJobs);
  const completed = Math.max(0, stats.completedJobs);
  const onTime = Math.max(0, stats.onTimeJobs);
  const cancelled = Math.max(0, stats.cancelledJobs);
  const noShow = Math.max(0, stats.noShowJobs);

  // Lifetime rates
  const lifetimeCompletionRate = completed / accepted;
  const lifetimeCancellationRate = cancelled / accepted;
  const lifetimeOnTimeRate = completed > 0 ? onTime / completed : 0.9;
  const noShowPenalty = (noShow * 15);

  // Time-weighted (Recent 30-day performance) to prevent permanent punishment
  let recentFactor = 1.0;
  if (stats.recentJobs30d > 0) {
    const recentCompletedRate = stats.recentCompleted30d / Math.max(1, stats.recentJobs30d);
    // 60% recent performance + 40% lifetime performance
    const weightedCompletion = 0.6 * recentCompletedRate + 0.4 * lifetimeCompletionRate;
    const score = (weightedCompletion * 50) + (lifetimeOnTimeRate * 50) - noShowPenalty - (lifetimeCancellationRate * 40);
    return Math.min(100, Math.max(10, Number(score.toFixed(1))));
  }

  const baseScore = (lifetimeCompletionRate * 50) + (lifetimeOnTimeRate * 50) - noShowPenalty - (lifetimeCancellationRate * 40);
  return Math.min(100, Math.max(10, Number(baseScore.toFixed(1))));
}

// 3. Experience Score (Specific relevant experience weighted more than generic)
export function calculateExperienceScore(
  worker: WorkerProfile,
  isSpecialistMatch: boolean
): number {
  const years = worker.yearsOfExperience;
  const completed = worker.statistics.completedJobs;

  // Diminishing returns after 10 years
  const yearPoints = Math.min(60, years * 6);
  // Volume points
  const volumePoints = Math.min(25, Math.sqrt(completed) * 2);
  // Specific specialist bonus
  const specialistBonus = isSpecialistMatch ? 15 : 5;

  return Math.min(100, Math.max(10, yearPoints + volumePoints + specialistBonus));
}

// 4. Distance & Travel Time Score
export function calculateDistanceScore(
  distanceKm: number,
  serviceRadiusKm: number
): { score: number; travelTimeMins: number } {
  // Estimated urban travel time: ~2.5 mins per km + 4 mins base setup
  const travelTimeMins = Math.round(distanceKm * 2.5 + 4);

  if (distanceKm > serviceRadiusKm) {
    return { score: 10, travelTimeMins };
  }

  // Smooth decay: <2km -> 100, 3km -> 90, 5km -> 75, 8km -> 60, 12km -> 40
  let score = 100 - (distanceKm * 5);
  if (distanceKm <= 2) score = 100;
  else if (distanceKm <= 4) score = 92;
  else if (distanceKm <= 7) score = 78;
  else if (distanceKm <= 10) score = 65;
  else score = Math.max(20, 100 - (distanceKm * 6));

  return {
    score: Number(score.toFixed(1)),
    travelTimeMins,
  };
}

// 5. Availability Score
export function calculateAvailabilityScore(
  worker: WorkerProfile,
  requestedUrgency?: 'emergency' | 'today' | 'tomorrow' | 'scheduled'
): number {
  const current = worker.currentAvailability;

  if (requestedUrgency === 'emergency') {
    if (current === 'available_now') return 100;
    if (current === 'available_today') return 45;
    return 10;
  }

  if (requestedUrgency === 'today') {
    if (current === 'available_now') return 100;
    if (current === 'available_today') return 95;
    if (current === 'available_tomorrow') return 40;
    return 20;
  }

  if (requestedUrgency === 'tomorrow') {
    if (current === 'available_now' || current === 'available_today' || current === 'available_tomorrow') return 95;
    return 40;
  }

  // Scheduled / General
  if (current === 'available_now') return 100;
  if (current === 'available_today') return 90;
  if (current === 'available_tomorrow') return 80;
  if (current === 'busy') return 50;
  return 30;
}

// 6. Response Speed Score
export function calculateResponseScore(avgMinutes: number): number {
  if (avgMinutes <= 2) return 100;
  if (avgMinutes <= 5) return 92;
  if (avgMinutes <= 10) return 80;
  if (avgMinutes <= 20) return 65;
  if (avgMinutes <= 45) return 45;
  return 25;
}

// 7. Recent Activity Score
export function calculateRecentActivityScore(lastActiveAt: string): number {
  const diffHours = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60);
  if (diffHours <= 1) return 100;
  if (diffHours <= 6) return 95;
  if (diffHours <= 24) return 85;
  if (diffHours <= 72) return 70;
  if (diffHours <= 168) return 50; // 1 week
  return 30;
}

// 8. Main Ranking Orchestrator
export function rankWorkers(
  filteredWorkers: WorkerProfile[],
  customerCoords: { lat: number; lng: number },
  searchContext: {
    profession?: string;
    service?: string;
    skills?: string[];
    urgency?: 'emergency' | 'today' | 'tomorrow' | 'scheduled';
    rawQuery?: string;
  },
  config: AdminMarketplaceConfig
): RankedWorker[] {
  // Determine dynamic weights based on job urgency/type
  let weights: RankingWeights = { ...config.rankingWeights };
  if (searchContext.urgency === 'emergency') {
    weights = { ...config.jobTypeSpecificWeights.emergency };
  } else if (searchContext.urgency === 'scheduled') {
    weights = { ...config.jobTypeSpecificWeights.scheduled };
  }

  // Calculate scores for each eligible worker
  const evaluatedWorkers: RankedWorker[] = filteredWorkers.map(worker => {
    // 1. Skill match
    const matchAnalysis = computeSkillMatch(
      worker,
      searchContext.profession,
      searchContext.service,
      searchContext.skills
    );
    const skillMatchScore = matchAnalysis.matchScore;

    // 2. Reliability
    const reliabilityScore = calculateReliabilityScore(worker);

    // 3. Rating with Bayesian confidence
    const { score: ratingScore, adjustedRating } = calculateBayesianRatingScore(
      worker.statistics.rating,
      worker.statistics.reviewCount,
      config.bayesianPrior.globalAverageRating,
      config.bayesianPrior.minimumConfidenceReviews
    );

    // 4. Experience (specific vs general)
    const experienceScore = calculateExperienceScore(worker, matchAnalysis.specialistMatchFound);

    // 5. Distance & Travel time
    const distanceKm = calculateDistanceKm(
      customerCoords.lat,
      customerCoords.lng,
      worker.location.lat,
      worker.location.lng
    );
    const { score: distanceScore, travelTimeMins } = calculateDistanceScore(
      distanceKm,
      worker.serviceRadiusKm
    );

    // 6. Availability
    const availabilityScore = calculateAvailabilityScore(worker, searchContext.urgency);

    // 7. Response speed
    const responseScore = calculateResponseScore(worker.statistics.avgResponseMinutes);

    // 8. Recent activity
    const recentActivityScore = calculateRecentActivityScore(worker.statistics.lastActiveAt);

    const breakdown: RankingBreakdown = {
      skillMatchScore,
      reliabilityScore,
      ratingScore,
      experienceScore,
      distanceScore,
      availabilityScore,
      responseScore,
      recentActivityScore,
    };

    // Calculate final weighted sum (0 - 100)
    const totalWeight =
      weights.skillMatch +
      weights.reliability +
      weights.rating +
      weights.experience +
      weights.distance +
      weights.availability +
      weights.response +
      weights.recentActivity;

    const weightedScore =
      (skillMatchScore * weights.skillMatch +
        reliabilityScore * weights.reliability +
        ratingScore * weights.rating +
        experienceScore * weights.experience +
        distanceScore * weights.distance +
        availabilityScore * weights.availability +
        responseScore * weights.response +
        recentActivityScore * weights.recentActivity) /
      (totalWeight > 0 ? totalWeight : 100);

    // Generate tags based on actual stats and thresholds
    const tags = generateWorkerTags(worker, distanceKm, adjustedRating, config.tagThresholds, matchAnalysis);

    // Generate 1-2 personalized recommendation reasons
    const reasons = generateExplanationReasons(
      worker,
      breakdown,
      weights,
      distanceKm,
      travelTimeMins,
      matchAnalysis,
      searchContext.urgency
    );

    return {
      worker,
      overallScore: Number(weightedScore.toFixed(1)),
      scoreBreakdown: breakdown,
      appliedWeights: weights,
      tags,
      reasons,
      estimatedDistanceKm: distanceKm,
      estimatedTravelTimeMins: travelTimeMins,
      isExplorationSlot: false,
    };
  });

  // Sort primarily by overallScore descending
  evaluatedWorkers.sort((a, b) => b.overallScore - a.overallScore);

  // Apply Controlled New-Worker Exploration (Section 24)
  // Give qualified new workers (with isNewWorker true, right skill and within range)
  // controlled exposure in the top positions without permanently distorting standard ranks
  const explorationSlotsCount = Math.max(1, Math.round((config.explorationPercentage / 100) * evaluatedWorkers.length));
  const newWorkerCandidate = evaluatedWorkers.find(
    (item, index) => item.worker.isNewWorker && index >= 2 && item.scoreBreakdown.skillMatchScore >= 70
  );

  if (newWorkerCandidate && evaluatedWorkers.length > 2) {
    // Inject qualified new worker into position 2 (slot index 1)
    const oldIndex = evaluatedWorkers.indexOf(newWorkerCandidate);
    if (oldIndex > 1) {
      newWorkerCandidate.isExplorationSlot = true;
      // Tag reason as verified new entrant
      if (!newWorkerCandidate.reasons.some(r => r.includes('New qualified'))) {
        newWorkerCandidate.reasons[0] = '🆕 Promising new talent in your area';
      }
      evaluatedWorkers.splice(oldIndex, 1);
      evaluatedWorkers.splice(1, 0, newWorkerCandidate);
    }
  }

  return evaluatedWorkers;
}
