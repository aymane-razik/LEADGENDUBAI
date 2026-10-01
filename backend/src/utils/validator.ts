import { DUBAI_AREAS, PROPERTY_TYPES } from './constants';

const uaePhoneRegex = /^\+971[1-9]\d{7,8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidUAEPhone = (phone: string): boolean => uaePhoneRegex.test(phone);

export const isValidDubaiArea = (area: string): boolean =>
  DUBAI_AREAS.map((item) => item.toLowerCase()).includes(area.trim().toLowerCase());

export const isValidPropertyType = (type: string): boolean =>
  PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number]);

export const isValidBudget = (min: number, max: number): boolean =>
  Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min;

export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('971')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+971${digits.slice(1)}`;
  }
  return `+971${digits}`;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

export const isValidEmail = (email: string): boolean => emailRegex.test(normalizeEmail(email));
