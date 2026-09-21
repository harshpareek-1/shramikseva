export type UserRole = 'customer' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  workerProfile?: WorkerProfile;
}

export type Profession = 'Electrician' | 'Plumber' | 'Carpenter' | 'Painter' | 'Cleaner';

export type AvailabilityStatus = 'available_now' | 'available_today' | 'available_tomorrow' | 'busy' | 'offline';

export type PriceTier = 'low' | 'medium' | 'high';

export interface WorkerSkill {
  id: string;
  name: string;
  category: Profession;
  isSpecialized?: boolean;
}

export interface WorkStatistics {
  totalJobs: number;
  acceptedJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  noShowJobs: number;
  onTimeJobs: number;
  avgResponseMinutes: number;
  rating: number; // Raw average 1.0 - 5.0
  reviewCount: number;
  repeatCustomers: number;
  recentJobs30d: number;
  recentCompleted30d: number;
  recentCancelled30d: number;
  lastActiveAt: string; // ISO date
}

export interface WorkerProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  profilePhoto: string;
  profession: Profession;
  skills: string[];
  bio: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  serviceRadiusKm: number;
  languages: string[];
  yearsOfExperience: number;
  priceTier: PriceTier;
  hourlyRate: number; // in local currency (e.g. ₹)
  currentAvailability: AvailabilityStatus;
  availableDays: string[]; // ['Monday', 'Tuesday', ...]
  workingHours: { start: string; end: string };
  emergencyService: boolean;
  joinedDate: string;
  isNewWorker: boolean;
  statistics: WorkStatistics;
}

export interface WorkerTag {
  id: string;
  label: string;
  icon: string; // emoji or lucide icon name
  type: 'speed' | 'quality' | 'location' | 'experience' | 'badge' | 'specialist';
  color: string;
}

export interface RankingBreakdown {
  skillMatchScore: number;
  reliabilityScore: number;
  ratingScore: number;
  experienceScore: number;
  distanceScore: number;
  availabilityScore: number;
  responseScore: number;
  recentActivityScore: number;
}

export interface RankingWeights {
  skillMatch: number;
  reliability: number;
  rating: number;
  experience: number;
  distance: number;
  availability: number;
  response: number;
  recentActivity: number;
}

export interface RankedWorker {
  worker: WorkerProfile;
  overallScore: number; // 0 - 100
  scoreBreakdown: RankingBreakdown;
  appliedWeights: RankingWeights;
  tags: WorkerTag[];
  reasons: string[]; // 1-2 concise reasons
  estimatedDistanceKm: number;
  estimatedTravelTimeMins: number;
  isExplorationSlot?: boolean;
}

export interface SearchQueryAnalysis {
  rawQuery: string;
  extractedProfession?: Profession;
  extractedService?: string;
  extractedSkills: string[];
  extractedLocation?: string;
  urgency?: 'emergency' | 'today' | 'tomorrow' | 'scheduled';
  pricePreference?: PriceTier;
  ratingPreference?: number;
  autoFiltersApplied: {
    profession?: Profession;
    availability?: AvailabilityStatus | 'available_today' | 'available_now' | 'available_tomorrow';
    maxDistanceKm?: number;
    emergencyService?: boolean;
    minRating?: number;
    priceTier?: PriceTier;
  };
}

export interface SearchFilters {
  profession?: Profession;
  skills?: string[];
  availability?: 'all' | 'available_now' | 'available_today' | 'available_tomorrow';
  maxDistanceKm?: number;
  minRating?: number;
  minExperienceYears?: number;
  priceTier?: 'all' | 'low' | 'medium' | 'high';
  tags?: string[];
  emergencyOnly?: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  profession: Profession;
  serviceTitle: string;
  description: string;
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  estimatedPrice: number;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface AdminMarketplaceConfig {
  rankingWeights: RankingWeights;
  jobTypeSpecificWeights: {
    emergency: RankingWeights;
    scheduled: RankingWeights;
    general_labour: RankingWeights;
  };
  tagThresholds: {
    fastReplyMaxMinutes: number; // e.g. 5 min
    usuallyOnTimeMinRate: number; // e.g. 0.90 (90%)
    highlyRatedMinAdjusted: number; // e.g. 4.4
    highlyRatedMinReviews: number; // e.g. 10
    nearbyMaxKm: number; // e.g. 4.0 km
    experiencedMinYears: number; // e.g. 6 yrs
    topRatedMinRating: number; // e.g. 4.8
    topRatedMinReviews: number; // e.g. 25
  };
  bayesianPrior: {
    globalAverageRating: number; // e.g. 4.2
    minimumConfidenceReviews: number; // e.g. 8 (m in bayesian formula)
  };
  explorationPercentage: number; // e.g. 10%
  antiGaming: {
    minCompletedJobsForVerifiedStats: number;
    repeatCustomerReviewDiscount: number; // 0.8
    recencyHalfLifeDays: number;
  };
}
