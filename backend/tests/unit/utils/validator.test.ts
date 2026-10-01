import {
  isValidBudget,
  isValidDubaiArea,
  isValidEmail,
  isValidPropertyType,
  isValidUAEPhone,
  normalizeEmail,
  normalizePhone,
  sanitizeInput,
} from '../../../src/utils';

describe('validator utils', () => {
  it('validates UAE phone', () => {
    expect(isValidUAEPhone('+971501234567')).toBe(true);
    expect(isValidUAEPhone('0501234567')).toBe(false);
  });

  it('validates Dubai area', () => {
    expect(isValidDubaiArea('Dubai Marina')).toBe(true);
  });

  it('validates property type', () => {
    expect(isValidPropertyType('villa')).toBe(true);
    expect(isValidPropertyType('castle')).toBe(false);
  });

  it('validates budget range', () => {
    expect(isValidBudget(100, 200)).toBe(true);
    expect(isValidBudget(500, 200)).toBe(false);
  });

  it('normalizes email and phone', () => {
    expect(normalizeEmail('  USER@EXAMPLE.COM ')).toBe('user@example.com');
    expect(normalizePhone('0501234567')).toBe('+971501234567');
    expect(normalizePhone('971501234567')).toBe('+971501234567');
    expect(normalizePhone('501234567')).toBe('+971501234567');
  });

  it('validates and sanitizes raw input', () => {
    expect(isValidEmail('valid@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });
});
