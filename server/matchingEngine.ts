import { WorkerProfile, Profession } from '../src/types.ts';

export interface MatchAnalysis {
  matchScore: number; // 0 - 100
  matchedSkills: string[];
  exactMatchFound: boolean;
  specialistMatchFound: boolean;
}

export function computeSkillMatch(
  worker: WorkerProfile,
  requestedProfession?: Profession | string,
  requestedService?: string,
  requestedSkills: string[] = []
): MatchAnalysis {
  // If no specific service or skill was specified, base match on profession match
  if (!requestedService && (!requestedSkills || requestedSkills.length === 0)) {
    if (requestedProfession && worker.profession.toLowerCase() === requestedProfession.toLowerCase()) {
      return {
        matchScore: 85,
        matchedSkills: worker.skills.slice(0, 2),
        exactMatchFound: false,
        specialistMatchFound: false,
      };
    }
    return {
      matchScore: 50,
      matchedSkills: [],
      exactMatchFound: false,
      specialistMatchFound: false,
    };
  }

  const workerSkillsLower = worker.skills.map(s => s.toLowerCase());
  const matchedSkills: string[] = [];
  let score = 0;
  let exactMatchFound = false;
  let specialistMatchFound = false;

  const reqSkillsLower = (requestedSkills || []).map(s => s.toLowerCase());
  const serviceLower = (requestedService || '').toLowerCase();

  // Check for exact skill matches
  for (const skill of worker.skills) {
    const sLower = skill.toLowerCase();

    // Check if worker skill matches any requested skill
    for (const req of reqSkillsLower) {
      if (sLower === req) {
        matchedSkills.push(skill);
        score += 50;
        exactMatchFound = true;
      } else if (sLower.includes(req) || req.includes(sLower)) {
        matchedSkills.push(skill);
        score += 35;
      }
    }

    // Check against requested service string (e.g. "AC repair" or "split ac installation")
    if (serviceLower) {
      if (sLower === serviceLower) {
        matchedSkills.push(skill);
        score += 60;
        exactMatchFound = true;
        specialistMatchFound = true;
      } else if (serviceLower.includes(sLower) || sLower.includes(serviceLower)) {
        matchedSkills.push(skill);
        score += 40;
      }
    }
  }

  // Deduplicate matched skills
  const uniqueMatched = Array.from(new Set(matchedSkills));

  // If worker is in the right profession, give base points
  if (requestedProfession && worker.profession.toLowerCase() === requestedProfession.toLowerCase()) {
    score += 25;
  }

  // Bonus for multiple relevant skills in the same cluster (e.g. AC Installation AND AC Repair)
  if (uniqueMatched.length >= 2) {
    score += 15;
    specialistMatchFound = true;
  }

  // If no specific skills matched at all, but profession matches, score is low
  if (uniqueMatched.length === 0 && requestedProfession && worker.profession.toLowerCase() === requestedProfession.toLowerCase()) {
    score = 30; // Worker C in the prompt: Electrician with no AC skills
  }

  // Cap between 10 and 100
  const finalScore = Math.min(100, Math.max(10, score));

  return {
    matchScore: finalScore,
    matchedSkills: uniqueMatched,
    exactMatchFound,
    specialistMatchFound,
  };
}
