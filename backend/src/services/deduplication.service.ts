import { Lead, type ILead } from '../models';
import { NotFoundError } from '../utils';

const levenshteinSimilarity = (a: string, b: string): number => {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const matrix: number[][] = Array.from({ length: s2.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const cost = s2[i - 1] === s1[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  const distance = matrix[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length) || 1;
  return 1 - distance / maxLen;
};

const budgetsOverlap = (a: ILead['budget'], b: ILead['budget']): boolean => {
  return a.min <= b.max && b.min <= a.max;
};

/**
 * Finds potential duplicates by contact identity and fuzzy name checks.
 */
export const findDuplicates = async (lead: ILead): Promise<ILead[]> => {
  const idQuery = lead._id ? { _id: { $ne: lead._id } } : {};
  const candidates = await Lead.find({
    ...idQuery,
    $or: [{ email: lead.email }, { phone: lead.phone }, { whatsapp: lead.whatsapp }],
  });

  const nameMatches = await Lead.find({
    ...idQuery,
    firstName: new RegExp(lead.firstName, 'i'),
    lastName: new RegExp(lead.lastName || '', 'i'),
  });

  const all = [...candidates, ...nameMatches];
  const seen = new Set<string>();
  return all.filter((item) => {
    const key = item._id.toString();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * Calculates duplicate similarity score between two leads.
 */
export const calculateSimilarity = (lead1: ILead, lead2: ILead): number => {
  let score = 0;
  let factors = 0;

  if (lead1.email === lead2.email) {
    score += 1;
    factors++;
  }

  if (lead1.phone === lead2.phone) {
    score += 1;
    factors++;
  }

  const nameSimilarity = levenshteinSimilarity(
    `${lead1.firstName}${lead1.lastName ?? ''}`,
    `${lead2.firstName}${lead2.lastName ?? ''}`,
  );
  score += nameSimilarity;
  factors++;

  if (budgetsOverlap(lead1.budget, lead2.budget)) {
    score += 0.5;
    factors++;
  }

  return factors > 0 ? score / factors : 0;
};

/**
 * Merges two duplicate leads and keeps the highest-score record as primary.
 */
export const mergeDuplicates = async (leadId: string, duplicateId: string): Promise<ILead> => {
  const lead = await Lead.findById(leadId);
  const duplicate = await Lead.findById(duplicateId);

  if (!lead || !duplicate) {
    throw new NotFoundError('Lead not found for merge');
  }

  const primary = lead.score >= duplicate.score ? lead : duplicate;
  const secondary = lead.score >= duplicate.score ? duplicate : lead;

  primary.enrichmentData = {
    ...(secondary.enrichmentData ?? {}),
    ...(primary.enrichmentData ?? {}),
  };
  primary.tags = [...new Set([...primary.tags, ...secondary.tags])];
  primary.touchpoints += secondary.touchpoints;
  primary.notes = [primary.notes, secondary.notes].filter(Boolean).join('\n');

  secondary.isDuplicate = true;
  secondary.duplicateOf = primary._id;
  secondary.duplicateScore = calculateSimilarity(primary, secondary);
  secondary.isActive = false;

  await Promise.all([primary.save(), secondary.save()]);

  return primary;
};
