import { Lead } from '../../../src/models';
import {
  calculateSimilarity,
  findDuplicates,
  mergeDuplicates,
} from '../../../src/services/deduplication.service';
import { NotFoundError } from '../../../src/utils';

describe('deduplication.service', () => {
  it('returns high similarity for same identity leads', () => {
    const leadA = {
      email: 'same@example.com',
      phone: '+971501234567',
      firstName: 'Fatima',
      lastName: 'Noor',
      budget: { min: 1000000, max: 1500000 },
    };
    const leadB = {
      email: 'same@example.com',
      phone: '+971501234567',
      firstName: 'Fatema',
      lastName: 'Noor',
      budget: { min: 1200000, max: 1800000 },
    };

    expect(calculateSimilarity(leadA as never, leadB as never)).toBeGreaterThan(0.7);
  });

  it('finds duplicates from identity and fuzzy search', async () => {
    const lead = {
      _id: '65f3b0a4d6b2f33d6d47f123',
      email: 'same@example.com',
      phone: '+971501234567',
      whatsapp: '+971501234567',
      firstName: 'Fatima',
      lastName: 'Noor',
    };

    const findSpy = jest
      .spyOn(Lead, 'find')
      .mockResolvedValueOnce([{ _id: { toString: () => 'a' } }] as never)
      .mockResolvedValueOnce([
        { _id: { toString: () => 'a' } },
        { _id: { toString: () => 'b' } },
      ] as never);

    const result = await findDuplicates(lead as never);
    expect(result).toHaveLength(2);
    findSpy.mockRestore();
  });

  it('finds duplicates when source lead has no _id', async () => {
    const lead = {
      email: 'same@example.com',
      phone: '+971501234567',
      whatsapp: '+971501234567',
      firstName: 'Fatima',
      lastName: 'Noor',
    };

    const findSpy = jest
      .spyOn(Lead, 'find')
      .mockResolvedValueOnce([{ _id: { toString: () => 'a' } }] as never)
      .mockResolvedValueOnce([{ _id: { toString: () => 'b' } }] as never);

    const result = await findDuplicates(lead as never);
    expect(result).toHaveLength(2);
    findSpy.mockRestore();
  });

  it('throws when merge target not found', async () => {
    const findByIdSpy = jest
      .spyOn(Lead, 'findById')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await expect(mergeDuplicates('1', '2')).rejects.toBeInstanceOf(NotFoundError);
    findByIdSpy.mockRestore();
  });

  it('merges and marks secondary duplicate', async () => {
    const primary = {
      _id: { toString: () => 'p' },
      score: 80,
      enrichmentData: { linkedinProfile: 'one' },
      tags: ['a'],
      touchpoints: 1,
      notes: 'primary',
      isDuplicate: false,
      isActive: true,
      save: jest.fn().mockResolvedValue(undefined),
      email: 'a@a.com',
      phone: '+971501234567',
      firstName: 'A',
      lastName: 'B',
      budget: { min: 1, max: 2 },
    };
    const secondary = {
      _id: { toString: () => 's' },
      score: 50,
      enrichmentData: { companyInfo: { c: 1 } },
      tags: ['b'],
      touchpoints: 2,
      notes: 'secondary',
      isDuplicate: false,
      isActive: true,
      duplicateOf: undefined,
      duplicateScore: undefined,
      save: jest.fn().mockResolvedValue(undefined),
      email: 'a@a.com',
      phone: '+971501234567',
      firstName: 'A',
      lastName: 'B',
      budget: { min: 1, max: 2 },
    };

    const findByIdSpy = jest
      .spyOn(Lead, 'findById')
      .mockResolvedValueOnce(primary as never)
      .mockResolvedValueOnce(secondary as never);

    const result = await mergeDuplicates('1', '2');
    expect(result).toBe(primary);
    expect(secondary.isDuplicate).toBe(true);
    expect(secondary.isActive).toBe(false);
    expect(primary.touchpoints).toBe(3);
    findByIdSpy.mockRestore();
  });

  it('keeps higher score as primary when second record is stronger', async () => {
    const weak = {
      _id: { toString: () => 'w' },
      score: 10,
      enrichmentData: {},
      tags: [],
      touchpoints: 0,
      notes: '',
      isDuplicate: false,
      isActive: true,
      duplicateOf: undefined,
      duplicateScore: undefined,
      save: jest.fn().mockResolvedValue(undefined),
      email: 'a@a.com',
      phone: '+971501234567',
      firstName: 'A',
      lastName: 'B',
      budget: { min: 1, max: 2 },
    };
    const strong = {
      _id: { toString: () => 's' },
      score: 90,
      enrichmentData: {},
      tags: [],
      touchpoints: 2,
      notes: 'strong',
      isDuplicate: false,
      isActive: true,
      duplicateOf: undefined,
      duplicateScore: undefined,
      save: jest.fn().mockResolvedValue(undefined),
      email: 'a@a.com',
      phone: '+971501234567',
      firstName: 'A',
      lastName: 'B',
      budget: { min: 1, max: 2 },
    };

    const findByIdSpy = jest
      .spyOn(Lead, 'findById')
      .mockResolvedValueOnce(weak as never)
      .mockResolvedValueOnce(strong as never);

    const result = await mergeDuplicates('1', '2');
    expect(result).toBe(strong);
    expect(weak.isDuplicate).toBe(true);
    findByIdSpy.mockRestore();
  });
});
