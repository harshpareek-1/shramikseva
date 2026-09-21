import { Profession, PriceTier, AvailabilityStatus, SearchQueryAnalysis } from '../src/types.ts';

interface ProfessionSynonyms {
  profession: Profession;
  terms: string[];
  skills: string[];
  services: string[];
}

export const PROFESSION_DEFINITIONS: ProfessionSynonyms[] = [
  {
    profession: 'Electrician',
    terms: ['electrician', 'bijli', 'electric', 'electrical', 'wire', 'wiring', 'fuse', 'switch', 'light', 'short circuit'],
    skills: ['AC Installation', 'AC Repair', 'House Wiring', 'Fan Repair', 'Inverter Installation', 'Motor Repair', 'Switchboard Repair', 'Earthing Installation'],
    services: ['ac repair', 'ac installation', 'fan installation', 'fan repair', 'switchboard repair', 'inverter repair', 'house wiring', 'short circuit fix', 'motor rewinding'],
  },
  {
    profession: 'Plumber',
    terms: ['plumber', 'plumbing', 'pipe', 'leak', 'drain', 'tap', 'faucet', 'nal', 'tank', 'geyser', 'sewer', 'blockage'],
    skills: ['Pipe Leakage', 'Water Heater Repair', 'Drain Cleaning', 'Tap Fitting', 'Bathroom Fitting', 'Water Tank Cleaning'],
    services: ['pipe leakage', 'tap repair', 'drain unclogging', 'geyser repair', 'toilet repair', 'water tank cleaning', 'bathroom pipe fitting'],
  },
  {
    profession: 'Carpenter',
    terms: ['carpenter', 'carpentry', 'wood', 'furniture', 'door', 'window', 'lock', 'table', 'chair', 'bed', 'almirah', 'khati', 'saw'],
    skills: ['Furniture Assembly', 'Door/Window Fitting', 'Lock Repair', 'Wood Polishing', 'Modular Kitchen Repair'],
    services: ['furniture assembly', 'door lock repair', 'bed repair', 'cupboard fitting', 'wood polishing', 'door fixing', 'ikea assembly'],
  },
  {
    profession: 'Painter',
    terms: ['painter', 'paint', 'painting', 'putty', 'colour', 'whitewash', 'texture', 'damp', 'waterproofing'],
    skills: ['Wall Painting', 'Waterproofing', 'Texture Painting', 'Putty & Sanding', 'Wood Polishing'],
    services: ['wall painting', 'house painting', 'waterproofing', 'texture painting', 'room whitewash', 'damp wall treatment'],
  },
  {
    profession: 'Cleaner',
    terms: ['cleaner', 'cleaning', 'maid', 'domestic helper', 'housekeeping', 'safai', 'mop', 'sweep', 'dusting', 'sanitization'],
    skills: ['Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning', 'Floor Mopping', 'Housekeeping', 'Disinfection'],
    services: ['home deep cleaning', 'kitchen cleaning', 'bathroom cleaning', 'sofa cleaning', 'floor mopping', 'full house sanitization'],
  },
];

export const KNOWN_LOCATIONS = [
  { name: 'Vaishali Nagar', lat: 26.9124, lng: 75.7433 },
  { name: 'Mansarovar', lat: 26.8584, lng: 75.7663 },
  { name: 'Chitrakoot', lat: 26.9020, lng: 75.7350 },
  { name: 'Nirman Nagar', lat: 26.8950, lng: 75.7480 },
  { name: 'Civil Lines', lat: 26.9050, lng: 75.7890 },
  { name: 'Sodala', lat: 26.9010, lng: 75.7720 },
];

export function parseNaturalLanguageQuery(query: string, customerLocation?: { name: string; lat: number; lng: number }): SearchQueryAnalysis {
  const normalized = (query || '').toLowerCase().trim();

  let extractedProfession: Profession | undefined;
  let extractedService: string | undefined;
  const extractedSkills: string[] = [];
  let extractedLocation: string | undefined;
  let urgency: 'emergency' | 'today' | 'tomorrow' | 'scheduled' | undefined;
  let pricePreference: PriceTier | undefined;
  let ratingPreference: number | undefined;

  // 1. Detect Urgency
  if (
    normalized.includes('emergency') ||
    normalized.includes('urgent') ||
    normalized.includes('immediately') ||
    normalized.includes('asap') ||
    normalized.includes('burst') ||
    normalized.includes('spark')
  ) {
    urgency = 'emergency';
  } else if (normalized.includes('tonight') || normalized.includes('today') || normalized.includes('now')) {
    urgency = 'today';
  } else if (normalized.includes('tomorrow')) {
    urgency = 'tomorrow';
  }

  // 2. Detect Price preference
  if (normalized.includes('cheap') || normalized.includes('affordable') || normalized.includes('budget') || normalized.includes('low cost')) {
    pricePreference = 'low';
  } else if (normalized.includes('premium') || normalized.includes('top quality') || normalized.includes('luxury')) {
    pricePreference = 'high';
  }

  // 3. Detect Rating preference
  if (normalized.includes('top rated') || normalized.includes('best') || normalized.includes('highly rated') || normalized.includes('5 star')) {
    ratingPreference = 4.5;
  }

  // 4. Detect Profession & Specific Skills
  for (const def of PROFESSION_DEFINITIONS) {
    // Check profession terms
    for (const term of def.terms) {
      if (normalized.includes(term)) {
        extractedProfession = def.profession;
        break;
      }
    }

    // Check specific skills
    for (const skill of def.skills) {
      if (normalized.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
        extractedProfession = def.profession; // skill strongly implies profession
      }
    }

    // Check services
    for (const srv of def.services) {
      if (normalized.includes(srv)) {
        extractedService = srv;
        extractedProfession = def.profession;
        // Map service to related skill if not already present
        for (const skill of def.skills) {
          if (srv.includes(skill.toLowerCase()) || skill.toLowerCase().includes(srv.split(' ')[0])) {
            if (!extractedSkills.includes(skill)) extractedSkills.push(skill);
          }
        }
      }
    }
  }

  // 5. Detect Location
  for (const loc of KNOWN_LOCATIONS) {
    if (normalized.includes(loc.name.toLowerCase())) {
      extractedLocation = loc.name;
      break;
    }
  }
  if (normalized.includes('near me') || normalized.includes('nearby')) {
    extractedLocation = customerLocation?.name || 'Nearby';
  }

  // Build Automatic Filters to suggest to the user
  const autoFiltersApplied: SearchQueryAnalysis['autoFiltersApplied'] = {};
  if (extractedProfession) {
    autoFiltersApplied.profession = extractedProfession;
  }
  if (urgency === 'emergency') {
    autoFiltersApplied.availability = 'available_now';
    autoFiltersApplied.emergencyService = true;
    autoFiltersApplied.maxDistanceKm = 8;
  } else if (urgency === 'today') {
    autoFiltersApplied.availability = 'available_today';
  } else if (urgency === 'tomorrow') {
    autoFiltersApplied.availability = 'available_tomorrow';
  }

  if (normalized.includes('within 5 km') || normalized.includes('5km')) {
    autoFiltersApplied.maxDistanceKm = 5;
  } else if (normalized.includes('within 10 km') || normalized.includes('10km')) {
    autoFiltersApplied.maxDistanceKm = 10;
  }

  if (ratingPreference) {
    autoFiltersApplied.minRating = ratingPreference;
  }
  if (pricePreference) {
    autoFiltersApplied.priceTier = pricePreference;
  }

  return {
    rawQuery: query,
    extractedProfession,
    extractedService,
    extractedSkills,
    extractedLocation,
    urgency,
    pricePreference,
    ratingPreference,
    autoFiltersApplied,
  };
}

export function generateSearchSuggestions(prefix: string): string[] {
  const p = (prefix || '').toLowerCase().trim();
  if (!p) {
    return [
      'AC repair near me',
      'Emergency plumber available now',
      'Electrician for switchboard repair',
      'Carpenter for furniture assembly',
      'Deep home cleaning today',
    ];
  }

  const suggestions: Set<string> = new Set();

  for (const def of PROFESSION_DEFINITIONS) {
    if (def.profession.toLowerCase().startsWith(p)) {
      suggestions.add(def.profession);
      suggestions.add(`${def.profession} near me`);
      suggestions.add(`Emergency ${def.profession.toLowerCase()}`);
      suggestions.add(`Top rated ${def.profession.toLowerCase()}`);
    }

    for (const term of def.terms) {
      if (term.startsWith(p) || term.includes(p)) {
        suggestions.add(`${def.profession} - ${term}`);
      }
    }

    for (const service of def.services) {
      if (service.includes(p) || p.includes(service.split(' ')[0])) {
        suggestions.add(service.charAt(0).toUpperCase() + service.slice(1));
      }
    }

    for (const skill of def.skills) {
      if (skill.toLowerCase().includes(p)) {
        suggestions.add(skill);
      }
    }
  }

  // Location suggestions
  for (const loc of KNOWN_LOCATIONS) {
    if (loc.name.toLowerCase().includes(p)) {
      suggestions.add(`Electrician in ${loc.name}`);
      suggestions.add(`Plumber in ${loc.name}`);
    }
  }

  return Array.from(suggestions).slice(0, 6);
}
