import type { ILead } from '../models';

/**
 * Calculates weighted lead score between 0 and 100.
 */
export const calculateLeadScore = (lead: ILead): number => {
  let score = 0;

  if (lead.budget.max >= 5000000) score += 30;
  else if (lead.budget.max >= 2000000) score += 25;
  else if (lead.budget.max >= 1000000) score += 20;
  else if (lead.budget.max >= 500000) score += 15;
  else score += 10;

  if (lead.timeline === 'immediate') score += 20;
  else if (lead.timeline === '1-3months') score += 15;
  else if (lead.timeline === '3-6months') score += 10;
  else score += 5;

  if (lead.purpose === 'buy') score += 15;
  else if (lead.purpose === 'invest') score += 12;
  else score += 8;

  const sourceScores: Record<string, number> = {
    landing_page: 15,
    referral: 12,
    bayut: 10,
    propertyfinder: 10,
    facebook: 8,
    dubizzle: 7,
  };
  score += sourceScores[lead.source] ?? 5;

  let fieldsCompleted = 0;
  if (lead.firstName) fieldsCompleted++;
  if (lead.email) fieldsCompleted++;
  if (lead.phone) fieldsCompleted++;
  if (lead.occupation) fieldsCompleted++;
  if (lead.income) fieldsCompleted++;
  if (lead.locations?.length) fieldsCompleted++;
  if (lead.propertyType?.length) fieldsCompleted++;
  score += (fieldsCompleted / 7) * 10;

  score += lead.responseRate * 10;

  return Math.min(Math.round(score), 100);
};

/**
 * Classifies quality from score.
 */
export const classifyQuality = (score: number): 'hot' | 'warm' | 'cold' | 'junk' => {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'cold';
  return 'junk';
};

/**
 * Classifies lead intent from timeline and budget.
 */
export const classifyIntent = (lead: ILead): 'high' | 'medium' | 'low' => {
  if (lead.timeline === 'immediate' && lead.budget.max >= 1000000) {
    return 'high';
  }
  if (lead.timeline === '1-3months' || lead.budget.max >= 500000) {
    return 'medium';
  }
  return 'low';
};

/**
 * Derives urgency score between 1 and 10.
 */
export const calculateUrgency = (timeline: ILead['timeline']): number => {
  switch (timeline) {
    case 'immediate':
      return 10;
    case '1-3months':
      return 8;
    case '3-6months':
      return 6;
    case '6-12months':
      return 4;
    default:
      return 3;
  }
};

/**
 * Derives conversion probability from score.
 */
export const calculateProbability = (score: number): number => {
  return Number(Math.min(Math.max(score / 100, 0), 1).toFixed(2));
};
