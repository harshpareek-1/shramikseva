import { WorkerProfile, User, Booking, AdminMarketplaceConfig, Profession } from '../src/types.ts';

// Default configuration with configurable starting values per requirements
export const defaultMarketplaceConfig: AdminMarketplaceConfig = {
  rankingWeights: {
    skillMatch: 25,
    reliability: 20,
    rating: 15,
    experience: 10,
    distance: 10,
    availability: 10,
    response: 5,
    recentActivity: 5,
  },
  jobTypeSpecificWeights: {
    emergency: {
      availability: 30,
      distance: 20,
      reliability: 20,
      skillMatch: 15,
      response: 10,
      rating: 5,
      experience: 0,
      recentActivity: 0,
    },
    scheduled: {
      skillMatch: 30,
      experience: 20,
      reliability: 20,
      rating: 15,
      availability: 10,
      distance: 5,
      response: 0,
      recentActivity: 0,
    },
    general_labour: {
      availability: 25,
      distance: 20,
      reliability: 20,
      experience: 15,
      rating: 10,
      skillMatch: 5,
      response: 5,
      recentActivity: 0,
    },
  },
  tagThresholds: {
    fastReplyMaxMinutes: 5,
    usuallyOnTimeMinRate: 0.90,
    highlyRatedMinAdjusted: 4.4,
    highlyRatedMinReviews: 10,
    nearbyMaxKm: 4.0,
    experiencedMinYears: 6,
    topRatedMinRating: 4.8,
    topRatedMinReviews: 25,
  },
  bayesianPrior: {
    globalAverageRating: 4.2,
    minimumConfidenceReviews: 8,
  },
  explorationPercentage: 15, // 15% exploration slot for promising new qualified workers
  antiGaming: {
    minCompletedJobsForVerifiedStats: 3,
    repeatCustomerReviewDiscount: 0.75,
    recencyHalfLifeDays: 45,
  },
};

// Seed Users
export const initialUsers: User[] = [
  {
    id: 'user_cust_1',
    name: 'Amit Sharma',
    phone: '+91 98290 12345',
    email: 'amit@example.com',
    password: 'customer123',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Vaishali Nagar, Sector 4',
      lat: 26.9124,
      lng: 75.7433,
    },
  },
  {
    id: 'user_cust_2',
    name: 'Priya Verma',
    phone: '+91 98290 54321',
    email: 'priya@example.com',
    password: 'customer123',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Mansarovar, Jaipur',
      lat: 26.8584,
      lng: 75.7663,
    },
  },
  {
    id: 'user_worker_1',
    name: 'Rajesh Kumar',
    phone: '+91 98280 11223',
    email: 'rajesh.electric@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Vaishali Nagar Main Market',
      lat: 26.9160,
      lng: 75.7480,
    },
  },
  {
    id: 'user_worker_w2',
    name: 'Suresh Choudhary',
    phone: '+91 98280 22334',
    email: 'suresh.electric@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Chitrakoot, Jaipur',
      lat: 26.9020,
      lng: 75.7350,
    },
  },
  {
    id: 'user_worker_w3',
    name: 'Vikram Meena',
    phone: '+91 98280 33445',
    email: 'vikram.electric@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Mansarovar Sector 3',
      lat: 26.8620,
      lng: 75.7680,
    },
  },
  {
    id: 'user_worker_w4',
    name: 'Mohammad Imran',
    phone: '+91 98280 44556',
    email: 'mohammad.plumber@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Nirman Nagar, Jaipur',
      lat: 26.8950,
      lng: 75.7480,
    },
  },
  {
    id: 'user_worker_w5',
    name: 'Rameshwar Lal',
    phone: '+91 98280 55667',
    email: 'rameshwar.plumber@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Mansarovar Colony',
      lat: 26.8500,
      lng: 75.7720,
    },
  },
  {
    id: 'user_worker_w6',
    name: 'Gurpreet Singh',
    phone: '+91 98280 66778',
    email: 'gurpreet.carpenter@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Vaishali Nagar, Queens Road',
      lat: 26.9150,
      lng: 75.7520,
    },
  },
  {
    id: 'user_worker_w7',
    name: 'Deepak Jangid',
    phone: '+91 98280 77889',
    email: 'deepak.painter@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Sodala, Jaipur',
      lat: 26.9010,
      lng: 75.7720,
    },
  },
  {
    id: 'user_worker_w8',
    name: 'Sunita Devi',
    phone: '+91 98280 88990',
    email: 'sunita.cleaner@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Vaishali Nagar, Hanuman Nagar',
      lat: 26.9140,
      lng: 75.7420,
    },
  },
  {
    id: 'user_worker_w9',
    name: 'Kavita Kumari',
    phone: '+91 98280 99001',
    email: 'kavita.cleaner@example.com',
    password: 'worker123',
    role: 'worker',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Civil Lines, Jaipur',
      lat: 26.9050,
      lng: 75.7890,
    },
  },
  {
    id: 'user_admin_1',
    name: 'Admin Supervisor',
    phone: '+91 99999 00000',
    email: 'admin@karyo.local',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    location: {
      name: 'Jaipur HQ',
      lat: 26.9124,
      lng: 75.7873,
    },
  },
];

// Rich, diverse seed workers with realistic variance (specialists, veterans, new workers, fast responders, etc.)
export const initialWorkers: WorkerProfile[] = [
  {
    id: 'w_elec_1',
    userId: 'user_worker_1',
    name: 'Rajesh Kumar',
    phone: '+91 98280 11223',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    skills: ['AC Installation', 'AC Repair', 'House Wiring', 'Fan Repair', 'Inverter Installation', 'Switchboard Repair'],
    bio: 'Certified master electrician with 8+ years specializing in AC installations, PCB fault diagnosis, and residential electrical wiring.',
    location: {
      name: 'Vaishali Nagar, Block B',
      lat: 26.9180,
      lng: 75.7490,
    },
    serviceRadiusKm: 12,
    languages: ['Hindi', 'English', 'Rajasthani'],
    yearsOfExperience: 8,
    priceTier: 'medium',
    hourlyRate: 350,
    currentAvailability: 'available_now',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '08:00', end: '20:00' },
    emergencyService: true,
    joinedDate: '2023-01-15',
    isNewWorker: false,
    statistics: {
      totalJobs: 195,
      acceptedJobs: 190,
      completedJobs: 182,
      cancelledJobs: 4,
      noShowJobs: 0,
      onTimeJobs: 175, // 96% on time
      avgResponseMinutes: 3, // Fast reply
      rating: 4.88,
      reviewCount: 142,
      repeatCustomers: 45,
      recentJobs30d: 22,
      recentCompleted30d: 21,
      recentCancelled30d: 0,
      lastActiveAt: new Date().toISOString(),
    },
  },
  {
    id: 'w_elec_2',
    userId: 'user_worker_w2',
    name: 'Suresh Choudhary',
    phone: '+91 98280 22334',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    skills: ['House Wiring', 'Fan Repair', 'Motor Repair', 'Switchboard Repair', 'Earthing Installation'],
    bio: 'Fast and reliable electrician for domestic repairs, fan fitting, water pump motors, and complete home rewiring.',
    location: {
      name: 'Chitrakoot, Jaipur',
      lat: 26.9020,
      lng: 75.7350,
    },
    serviceRadiusKm: 10,
    languages: ['Hindi', 'Marwari'],
    yearsOfExperience: 5,
    priceTier: 'low',
    hourlyRate: 250,
    currentAvailability: 'available_today',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '09:00', end: '19:00' },
    emergencyService: false,
    joinedDate: '2023-08-10',
    isNewWorker: false,
    statistics: {
      totalJobs: 98,
      acceptedJobs: 95,
      completedJobs: 90,
      cancelledJobs: 3,
      noShowJobs: 1,
      onTimeJobs: 82,
      avgResponseMinutes: 12,
      rating: 4.65,
      reviewCount: 68,
      repeatCustomers: 18,
      recentJobs30d: 14,
      recentCompleted30d: 13,
      recentCancelled30d: 1,
      lastActiveAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  },
  {
    id: 'w_elec_3',
    userId: 'user_worker_w3',
    name: 'Vikram Meena',
    phone: '+91 98280 33445',
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    skills: ['AC Installation', 'AC Repair', 'Inverter Installation'],
    bio: 'Newly registered HVAC & AC certified technician with vocational diploma and 2 years hands-on field experience.',
    location: {
      name: 'Mansarovar Sector 3',
      lat: 26.8620,
      lng: 75.7680,
    },
    serviceRadiusKm: 15,
    languages: ['Hindi', 'English'],
    yearsOfExperience: 2,
    priceTier: 'low',
    hourlyRate: 280,
    currentAvailability: 'available_now',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '08:00', end: '21:00' },
    emergencyService: true,
    joinedDate: new Date(Date.now() - 86400000 * 12).toISOString(),
    isNewWorker: true, // New qualified worker
    statistics: {
      totalJobs: 4,
      acceptedJobs: 4,
      completedJobs: 4,
      cancelledJobs: 0,
      noShowJobs: 0,
      onTimeJobs: 4,
      avgResponseMinutes: 2,
      rating: 5.0,
      reviewCount: 4, // 5.0 but only 4 reviews -> Bayesian test case!
      repeatCustomers: 1,
      recentJobs30d: 4,
      recentCompleted30d: 4,
      recentCancelled30d: 0,
      lastActiveAt: new Date().toISOString(),
    },
  },
  {
    id: 'w_plumb_1',
    userId: 'user_worker_w4',
    name: 'Mohammad Imran',
    phone: '+91 98280 44556',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    profession: 'Plumber',
    skills: ['Pipe Leakage', 'Water Heater Repair', 'Drain Cleaning', 'Tap Fitting', 'Bathroom Fitting', 'Water Tank Cleaning'],
    bio: 'Emergency plumbing specialist with 11 years experience. Immediate response for burst pipes, geysers, and clogged sewer lines.',
    location: {
      name: 'Nirman Nagar, Jaipur',
      lat: 26.8950,
      lng: 75.7480,
    },
    serviceRadiusKm: 12,
    languages: ['Hindi', 'Urdu', 'English'],
    yearsOfExperience: 11,
    priceTier: 'medium',
    hourlyRate: 300,
    currentAvailability: 'available_now',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '07:00', end: '23:00' },
    emergencyService: true,
    joinedDate: '2022-05-10',
    isNewWorker: false,
    statistics: {
      totalJobs: 340,
      acceptedJobs: 335,
      completedJobs: 326,
      cancelledJobs: 5,
      noShowJobs: 0,
      onTimeJobs: 318, // 97% on time
      avgResponseMinutes: 4, // Fast reply
      rating: 4.92,
      reviewCount: 265,
      repeatCustomers: 88,
      recentJobs30d: 31,
      recentCompleted30d: 30,
      recentCancelled30d: 0,
      lastActiveAt: new Date().toISOString(),
    },
  },
  {
    id: 'w_plumb_2',
    userId: 'user_worker_w5',
    name: 'Rameshwar Lal',
    phone: '+91 98280 55667',
    profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    profession: 'Plumber',
    skills: ['Tap Fitting', 'Pipe Leakage', 'Water Tank Cleaning'],
    bio: 'Affordable local plumber for general maintenance, water tap replacements, and minor leakages.',
    location: {
      name: 'Mansarovar Colony',
      lat: 26.8500,
      lng: 75.7720,
    },
    serviceRadiusKm: 8,
    languages: ['Hindi'],
    yearsOfExperience: 4,
    priceTier: 'low',
    hourlyRate: 200,
    currentAvailability: 'available_today',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workingHours: { start: '09:00', end: '18:00' },
    emergencyService: false,
    joinedDate: '2023-11-01',
    isNewWorker: false,
    statistics: {
      totalJobs: 55,
      acceptedJobs: 52,
      completedJobs: 48,
      cancelledJobs: 4,
      noShowJobs: 1,
      onTimeJobs: 40,
      avgResponseMinutes: 18,
      rating: 4.4,
      reviewCount: 38,
      repeatCustomers: 7,
      recentJobs30d: 9,
      recentCompleted30d: 8,
      recentCancelled30d: 1,
      lastActiveAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  },
  {
    id: 'w_carp_1',
    userId: 'user_worker_w6',
    name: 'Gurpreet Singh',
    phone: '+91 98280 66778',
    profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    profession: 'Carpenter',
    skills: ['Furniture Assembly', 'Door/Window Fitting', 'Lock Repair', 'Wood Polishing', 'Modular Kitchen Repair'],
    bio: 'Specialist carpenter with 12 years of fine woodworking experience. Expert in IKEA/UrbanLadder furniture assembly and custom repairs.',
    location: {
      name: 'Vaishali Nagar, Queens Road',
      lat: 26.9150,
      lng: 75.7520,
    },
    serviceRadiusKm: 14,
    languages: ['Punjabi', 'Hindi', 'English'],
    yearsOfExperience: 12,
    priceTier: 'medium',
    hourlyRate: 350,
    currentAvailability: 'available_now',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '08:30', end: '19:30' },
    emergencyService: true,
    joinedDate: '2022-03-12',
    isNewWorker: false,
    statistics: {
      totalJobs: 240,
      acceptedJobs: 236,
      completedJobs: 230,
      cancelledJobs: 3,
      noShowJobs: 0,
      onTimeJobs: 220,
      avgResponseMinutes: 4,
      rating: 4.87,
      reviewCount: 185,
      repeatCustomers: 52,
      recentJobs30d: 20,
      recentCompleted30d: 20,
      recentCancelled30d: 0,
      lastActiveAt: new Date().toISOString(),
    },
  },
  {
    id: 'w_paint_1',
    userId: 'user_worker_w7',
    name: 'Deepak Jangid',
    phone: '+91 98280 77889',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    profession: 'Painter',
    skills: ['Wall Painting', 'Waterproofing', 'Texture Painting', 'Putty & Sanding', 'Wood Polishing'],
    bio: 'Professional house painter with Asian Paints certification. Clean work, damp proofing, and aesthetic wall textures.',
    location: {
      name: 'Sodala, Jaipur',
      lat: 26.9010,
      lng: 75.7720,
    },
    serviceRadiusKm: 15,
    languages: ['Hindi', 'English'],
    yearsOfExperience: 9,
    priceTier: 'medium',
    hourlyRate: 320,
    currentAvailability: 'available_today',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '08:00', end: '19:00' },
    emergencyService: false,
    joinedDate: '2022-09-20',
    isNewWorker: false,
    statistics: {
      totalJobs: 170,
      acceptedJobs: 165,
      completedJobs: 160,
      cancelledJobs: 4,
      noShowJobs: 0,
      onTimeJobs: 150,
      avgResponseMinutes: 8,
      rating: 4.81,
      reviewCount: 120,
      repeatCustomers: 34,
      recentJobs30d: 15,
      recentCompleted30d: 14,
      recentCancelled30d: 0,
      lastActiveAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  },
  {
    id: 'w_clean_1',
    userId: 'user_worker_w8',
    name: 'Sunita Devi',
    phone: '+91 98280 88990',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    profession: 'Cleaner',
    skills: ['Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Floor Mopping', 'Housekeeping', 'Disinfection'],
    bio: 'Dedicated domestic helper and deep cleaning expert with 7 years experience. Thorough, trustworthy, and punctual.',
    location: {
      name: 'Vaishali Nagar, Hanuman Nagar',
      lat: 26.9140,
      lng: 75.7420,
    },
    serviceRadiusKm: 8,
    languages: ['Hindi', 'Rajasthani'],
    yearsOfExperience: 7,
    priceTier: 'low',
    hourlyRate: 200,
    currentAvailability: 'available_now',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    workingHours: { start: '07:30', end: '18:00' },
    emergencyService: true,
    joinedDate: '2022-06-01',
    isNewWorker: false,
    statistics: {
      totalJobs: 310,
      acceptedJobs: 308,
      completedJobs: 302,
      cancelledJobs: 2,
      noShowJobs: 0,
      onTimeJobs: 295, // 97% on time
      avgResponseMinutes: 2, // 2 mins
      rating: 4.95,
      reviewCount: 240,
      repeatCustomers: 110,
      recentJobs30d: 32,
      recentCompleted30d: 32,
      recentCancelled30d: 0,
      lastActiveAt: new Date().toISOString(),
    },
  },
  {
    id: 'w_clean_2',
    userId: 'user_worker_w9',
    name: 'Kavita Kumari',
    phone: '+91 98280 99001',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    profession: 'Cleaner',
    skills: ['Kitchen Cleaning', 'Bathroom Cleaning', 'Floor Mopping'],
    bio: 'Polite and detail-oriented cleaner available for daily housekeeping, kitchen degreasing, and sanitation.',
    location: {
      name: 'Civil Lines, Jaipur',
      lat: 26.9050,
      lng: 75.7890,
    },
    serviceRadiusKm: 10,
    languages: ['Hindi'],
    yearsOfExperience: 3,
    priceTier: 'low',
    hourlyRate: 180,
    currentAvailability: 'available_today',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: { start: '08:00', end: '17:00' },
    emergencyService: false,
    joinedDate: '2024-01-10',
    isNewWorker: false,
    statistics: {
      totalJobs: 62,
      acceptedJobs: 60,
      completedJobs: 56,
      cancelledJobs: 3,
      noShowJobs: 1,
      onTimeJobs: 50,
      avgResponseMinutes: 15,
      rating: 4.58,
      reviewCount: 42,
      repeatCustomers: 12,
      recentJobs30d: 11,
      recentCompleted30d: 10,
      recentCancelled30d: 1,
      lastActiveAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  },
];

// Seed Bookings
export const initialBookings: Booking[] = [
  {
    id: 'b_1001',
    customerId: 'user_cust_1',
    customerName: 'Amit Sharma',
    customerPhone: '+91 98290 12345',
    workerId: 'w_elec_1',
    workerName: 'Rajesh Kumar',
    profession: 'Electrician',
    serviceTitle: 'Split AC Installation & Copper Piping',
    description: 'Install new 1.5 ton split AC in master bedroom with outdoor bracket.',
    scheduledTime: 'Today, 2:00 PM',
    status: 'in_progress',
    address: 'Flat 302, Royal Palms, Vaishali Nagar, Jaipur',
    estimatedPrice: 799,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'b_1002',
    customerId: 'user_cust_1',
    customerName: 'Amit Sharma',
    customerPhone: '+91 98290 12345',
    workerId: 'w_plumb_1',
    workerName: 'Mohammad Imran',
    profession: 'Plumber',
    serviceTitle: 'Emergency Kitchen Sink Drain Unclogging',
    description: 'Heavy water backlog and leaking joint under the sink.',
    scheduledTime: 'Yesterday, 11:30 AM',
    status: 'completed',
    address: 'Flat 302, Royal Palms, Vaishali Nagar, Jaipur',
    estimatedPrice: 450,
    rating: 5,
    review: 'Arrived in 20 minutes and resolved the clogged pipe completely. Extremely polite and clean.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1 + 7200000).toISOString(),
  },
];

// In-Memory state holder that powers the backend
class MarketplaceDatabase {
  users: User[] = [...initialUsers];
  workers: WorkerProfile[] = [...initialWorkers];
  bookings: Booking[] = [...initialBookings];
  config: AdminMarketplaceConfig = JSON.parse(JSON.stringify(defaultMarketplaceConfig));

  getWorkers(): WorkerProfile[] {
    return this.workers;
  }

  getWorkerById(id: string): WorkerProfile | undefined {
    return this.workers.find(w => w.id === id);
  }

  getWorkerByUserId(userId: string): WorkerProfile | undefined {
    return this.workers.find(w => w.userId === userId);
  }

  updateWorker(id: string, updates: Partial<WorkerProfile>): WorkerProfile | null {
    const idx = this.workers.findIndex(w => w.id === id);
    if (idx === -1) return null;
    this.workers[idx] = { ...this.workers[idx], ...updates };
    return this.workers[idx];
  }

  addWorker(worker: WorkerProfile): WorkerProfile {
    this.workers.push(worker);
    return worker;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUsersWithProfiles(): User[] {
    return this.users.map(u => {
      if (u.role === 'worker') {
        const workerProfile = this.workers.find(
          w => w.userId === u.id || w.name.toLowerCase() === u.name.toLowerCase()
        );
        return { ...u, workerProfile };
      }
      return u;
    });
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.users.push(user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates };
    
    // If updating location and this user is a worker, also update linked worker profile
    if (updates.location && this.users[idx].role === 'worker') {
      const workerIdx = this.workers.findIndex(
        w => w.userId === id || w.name.toLowerCase() === this.users[idx].name.toLowerCase()
      );
      if (workerIdx !== -1) {
        this.workers[workerIdx].location = { ...updates.location };
      }
    }
    return this.users[idx];
  }

  getBookings(): Booking[] {
    return this.bookings;
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  createBooking(booking: Booking): Booking {
    this.bookings.unshift(booking);
    return booking;
  }

  updateBookingStatus(id: string, status: Booking['status'], extra?: Partial<Booking>): Booking | null {
    const idx = this.bookings.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.bookings[idx] = {
      ...this.bookings[idx],
      status,
      ...extra,
      updatedAt: new Date().toISOString(),
    };

    // If completed and rated, update worker statistics
    if (status === 'completed') {
      const worker = this.getWorkerById(this.bookings[idx].workerId);
      if (worker) {
        worker.statistics.completedJobs += 1;
        worker.statistics.totalJobs += 1;
        if (extra?.rating) {
          const prevTotal = worker.statistics.rating * worker.statistics.reviewCount;
          worker.statistics.reviewCount += 1;
          worker.statistics.rating = Number(((prevTotal + extra.rating) / worker.statistics.reviewCount).toFixed(2));
        }
      }
    }

    return this.bookings[idx];
  }

  getConfig(): AdminMarketplaceConfig {
    return this.config;
  }

  resetConfig(): AdminMarketplaceConfig {
    this.config = JSON.parse(JSON.stringify(defaultMarketplaceConfig));
    return this.config;
  }

  updateConfig(newConfig: Partial<AdminMarketplaceConfig>): AdminMarketplaceConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      rankingWeights: newConfig.rankingWeights ? { ...this.config.rankingWeights, ...newConfig.rankingWeights } : this.config.rankingWeights,
      tagThresholds: newConfig.tagThresholds ? { ...this.config.tagThresholds, ...newConfig.tagThresholds } : this.config.tagThresholds,
      bayesianPrior: newConfig.bayesianPrior ? { ...this.config.bayesianPrior, ...newConfig.bayesianPrior } : this.config.bayesianPrior,
    };
    return this.config;
  }
}

export const db = new MarketplaceDatabase();
