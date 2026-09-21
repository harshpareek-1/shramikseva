import { WorkerProfile, SearchFilters, SearchQueryAnalysis } from '../src/types.ts';

// Haversine distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export interface HardFilterOptions {
  requiredProfession?: string;
  requiredSkills?: string[];
  customerCoords: { lat: number; lng: number };
  availabilityConstraint?: string;
  maxDistanceKm?: number;
  emergencyOnly?: boolean;
}

export function performHardFiltering(
  workers: WorkerProfile[],
  options: HardFilterOptions
): WorkerProfile[] {
  return workers.filter(worker => {
    // 1. Hard Filter: Profession
    if (options.requiredProfession && options.requiredProfession !== 'All') {
      if (worker.profession.toLowerCase() !== options.requiredProfession.toLowerCase()) {
        return false;
      }
    }

    // 2. Hard Filter: Required Skills (if customer explicitly specified mandatory skill)
    if (options.requiredSkills && options.requiredSkills.length > 0) {
      const hasAnyRequiredSkill = options.requiredSkills.some(reqSkill =>
        worker.skills.some(ws => ws.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(ws.toLowerCase()))
      );
      // If customer searched for specific skill like "AC Repair" and worker has no AC skills, exclude
      if (!hasAnyRequiredSkill) {
        return false;
      }
    }

    // 3. Hard Filter: Distance vs Worker's Service Radius
    const distance = calculateDistanceKm(
      options.customerCoords.lat,
      options.customerCoords.lng,
      worker.location.lat,
      worker.location.lng
    );

    // Worker must be within their own stated service radius
    if (distance > worker.serviceRadiusKm) {
      return false;
    }

    // Also obey customer's max distance constraint if specified
    if (options.maxDistanceKm && options.maxDistanceKm > 0) {
      if (distance > options.maxDistanceKm) {
        return false;
      }
    }

    // 4. Hard Filter: Availability Constraint
    if (options.availabilityConstraint && options.availabilityConstraint !== 'all' && options.availabilityConstraint !== 'any') {
      if (options.availabilityConstraint === 'available_now') {
        if (worker.currentAvailability !== 'available_now') {
          return false;
        }
      } else if (options.availabilityConstraint === 'available_today') {
        if (worker.currentAvailability !== 'available_now' && worker.currentAvailability !== 'available_today') {
          return false;
        }
      } else if (options.availabilityConstraint === 'available_tomorrow') {
        if (
          worker.currentAvailability !== 'available_now' &&
          worker.currentAvailability !== 'available_today' &&
          worker.currentAvailability !== 'available_tomorrow'
        ) {
          return false;
        }
      }
    }

    // 5. Hard Filter: Emergency service only
    if (options.emergencyOnly && !worker.emergencyService) {
      return false;
    }

    // Passed all hard filters
    return true;
  });
}

export function performManualFiltering(
  workers: WorkerProfile[],
  filters: SearchFilters,
  customerCoords: { lat: number; lng: number }
): WorkerProfile[] {
  return workers.filter(worker => {
    // 1. Profession filter
    if (filters.profession && filters.profession !== ('All' as any)) {
      if (worker.profession.toLowerCase() !== filters.profession.toLowerCase()) {
        return false;
      }
    }

    // 2. Minimum Rating
    if (filters.minRating && filters.minRating > 0) {
      if (worker.statistics.rating < filters.minRating) {
        return false;
      }
    }

    // 3. Minimum Experience
    if (filters.minExperienceYears && filters.minExperienceYears > 0) {
      if (worker.yearsOfExperience < filters.minExperienceYears) {
        return false;
      }
    }

    // 4. Price Tier
    if (filters.priceTier && filters.priceTier !== 'all') {
      if (worker.priceTier !== filters.priceTier) {
        return false;
      }
    }

    // 5. Max Distance
    if (filters.maxDistanceKm && filters.maxDistanceKm > 0) {
      const dist = calculateDistanceKm(
        customerCoords.lat,
        customerCoords.lng,
        worker.location.lat,
        worker.location.lng
      );
      if (dist > filters.maxDistanceKm) {
        return false;
      }
    }

    // 6. Availability
    if (filters.availability && filters.availability !== 'all') {
      if (filters.availability === 'available_now' && worker.currentAvailability !== 'available_now') {
        return false;
      }
      if (
        filters.availability === 'available_today' &&
        worker.currentAvailability !== 'available_now' &&
        worker.currentAvailability !== 'available_today'
      ) {
        return false;
      }
      if (
        filters.availability === 'available_tomorrow' &&
        worker.currentAvailability === 'busy' ||
        worker.currentAvailability === 'offline'
      ) {
        return false;
      }
    }

    // 7. Emergency only
    if (filters.emergencyOnly && !worker.emergencyService) {
      return false;
    }

    return true;
  });
}
