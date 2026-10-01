import type { ILead } from '../../models';
import type { LeadBudget } from './types';

export interface DedupConfig {
  readonly emailExact: boolean;
  readonly phoneExact: boolean;
  readonly whatsappExact: boolean;
  readonly nameFuzzyMinScore: number;
  readonly budgetOverlapRequired: boolean;
  readonly minSimilarityToFlag: number;
  readonly mergePolicy: MergePolicy;
}

export interface MergePolicy {
  readonly keepHigherScore: boolean;
  readonly mergeEnrichment: boolean;
  readonly unionTags: boolean;
  readonly sumTouchpoints: boolean;
  readonly concatenateNotes: boolean;
  readonly preservePrimaryCreatedAt: boolean;
  readonly trackSourceOfTruth: boolean;
}

export const DEFAULT_DEDUP_CONFIG: DedupConfig = {
  emailExact: true,
  phoneExact: true,
  whatsappExact: true,
  nameFuzzyMinScore: 0.75,
  budgetOverlapRequired: false,
  minSimilarityToFlag: 0.6,
  mergePolicy: {
    keepHigherScore: true,
    mergeEnrichment: true,
    unionTags: true,
    sumTouchpoints: true,
    concatenateNotes: true,
    preservePrimaryCreatedAt: true,
    trackSourceOfTruth: true,
  },
};

export interface SimilarityFactors {
  readonly email: boolean;
  readonly phone: boolean;
  readonly whatsapp: boolean;
  readonly nameSimilarity: number;
  readonly budgetOverlap: boolean;
  readonly propertyTypeOverlap: boolean;
  readonly locationOverlap: boolean;
}

export interface SimilarityResult {
  readonly score: number;
  readonly factors: SimilarityFactors;
  readonly matchedFields: string[];
  readonly explanation: string;
}

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('971')) return `+${digits}`;
  if (digits.startsWith('0')) return `+971${digits.slice(1)}`;
  return `+971${digits}`;
};

export const normalizePhoneForMatch = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return normalizePhone(value);
};

export const emailsMatch = (a: string | undefined, b: string | undefined): boolean => {
  if (!a || !b) return false;
  return normalizeEmail(a) === normalizeEmail(b);
};

export const phonesMatch = (a: string | undefined, b: string | undefined): boolean => {
  const na = normalizePhoneForMatch(a);
  const nb = normalizePhoneForMatch(b);
  if (!na || !nb) return false;
  return na === nb;
};

export const levenshteinSimilarity = (a: string, b: string): number => {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

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
  const raw = 1 - distance / maxLen;

  // Jaro-Winkler style boost for shared prefix
  const prefixLen = Math.min(4, s1.length, s2.length);
  let prefix = 0;
  for (let i = 0; i < prefixLen; i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  const jaroWinklerBoost = (prefix / 10) * (1 - raw);

  return Math.min(1, raw + jaroWinklerBoost);
};

export const nameSimilarity = (
  firstNameA: string | undefined,
  lastNameA: string | undefined,
  firstNameB: string | undefined,
  lastNameB: string | undefined,
): number => {
  const prepare = (first: string | undefined, last: string | undefined) => {
    const parts = [first, last].filter(Boolean);
    return parts.join(' ').toLowerCase().trim();
  };
  const nameA = prepare(firstNameA, lastNameA);
  const nameB = prepare(firstNameB, lastNameB);
  if (!nameA || !nameB) return 0;
  return levenshteinSimilarity(nameA, nameB);
};

export const budgetsOverlap = (a: LeadBudget, b: LeadBudget): boolean =>
  a.min <= b.max && b.min <= a.max;

export const propertyTypesOverlap = (a: string[] | undefined, b: string[] | undefined): boolean => {
  if (!a || !b || a.length === 0 || b.length === 0) return false;
  return a.some((t) => b.includes(t));
};

export const locationsOverlap = (a: string[] | undefined, b: string[] | undefined): boolean => {
  if (!a || !b || a.length === 0 || b.length === 0) return false;
  const setA = new Set(a.map((v) => v.toLowerCase()));
  return b.some((v) => setA.has(v.toLowerCase()));
};

export const computeSimilarity = (a: ILead, b: ILead): SimilarityResult => {
  const matchedFields: string[] = [];
  const factors: Record<string, unknown> = {};

  let score = 0;
  let weightSum = 0;

  const addFactor = (name: string, value: number, weight: number = 1) => {
    factors[name] = value;
    score += value * weight;
    weightSum += weight;
    if (value >= 0.5) matchedFields.push(name);
  };

  const emailMatch = emailsMatch(a.email, b.email);
  addFactor('email', emailMatch ? 1 : 0, 2);

  const phoneMatch = phonesMatch(a.phone, b.phone);
  addFactor('phone', phoneMatch ? 1 : 0, 2);

  const whatsappMatch = phonesMatch(a.whatsapp, b.whatsapp);
  if (whatsappMatch) {
    addFactor('whatsapp', 1, 2);
  } else {
    factors['whatsapp'] = false;
    weightSum += 2;
  }

  const nameSim = nameSimilarity(
    a.firstName,
    a.lastName,
    b.firstName,
    b.lastName,
  );
  addFactor('name', nameSim);

  const budgetOverlap = budgetsOverlap(a.budget, b.budget);
  addFactor('budget', budgetOverlap ? 1 : 0);

  const propertyOverlap = propertyTypesOverlap(a.propertyType, b.propertyType);
  addFactor('propertyType', propertyOverlap ? 1 : 0);

  const locationOverlap = locationsOverlap(a.locations, b.locations);
  addFactor('location', locationOverlap ? 1 : 0);

  const finalScore = weightSum > 0 ? score / weightSum : 0;

  const explanation = matchedFields.length > 0
    ? `Matched on: ${matchedFields.join(', ')}. Score ${finalScore.toFixed(2)}.`
    : 'No meaningful match found.';

  return {
    score: finalScore,
    factors: {
      email: emailMatch,
      phone: phoneMatch,
      whatsapp: whatsappMatch,
      nameSimilarity: nameSim,
      budgetOverlap,
      propertyTypeOverlap: propertyOverlap,
      locationOverlap,
    },
    matchedFields: [...matchedFields],
    explanation,
  };
};

export interface DedupCandidate extends ILead {
  readonly similarity: number;
  readonly factors: SimilarityFactors;
  readonly matchedFields: string[];
}

export const isDuplicateCandidate = (similarity: number, config: DedupConfig): boolean =>
  similarity >= config.minSimilarityToFlag;

export interface MergeResult {
  readonly primary: ILead;
  readonly secondary: ILead;
  readonly mergedFields: string[];
  readonly auditReason: string;
  readonly similarity: number;
}

export const prepareMerge = (
  primary: ILead,
  secondary: ILead,
  config: DedupConfig,
  similarity: number,
): MergeResult => {
  const policy = config.mergePolicy;
  const mergedFields: string[] = [];

  if (policy.mergeEnrichment && secondary.enrichmentData) {
    primary.enrichmentData = {
      ...(primary.enrichmentData ?? {}),
      ...(secondary.enrichmentData ?? {}),
    };
    mergedFields.push('enrichmentData');
  }

  if (policy.unionTags && secondary.tags?.length) {
    const merged = Array.from(new Set([...(primary.tags ?? []), ...secondary.tags]));
    if (JSON.stringify(merged) !== JSON.stringify(primary.tags)) {
      primary.tags = merged;
      mergedFields.push('tags');
    }
  }

  if (policy.sumTouchpoints) {
    primary.touchpoints += secondary.touchpoints;
    mergedFields.push('touchpoints');
  }

  if (policy.concatenateNotes && secondary.notes) {
    const combined = [primary.notes, secondary.notes].filter(Boolean).join('\n');
    if (combined !== primary.notes) {
      primary.notes = combined;
      mergedFields.push('notes');
    }
  }

  const auditReason = [
    `Merged duplicate (${similarity.toFixed(2)} similarity).`,
    `Secondary: ${secondary.email} / ${secondary.phone}`,
    `Matched: ${config.minSimilarityToFlag} threshold.`,
  ].join(' ');

  return {
    primary,
    secondary,
    mergedFields,
    auditReason,
    similarity,
  };
};
