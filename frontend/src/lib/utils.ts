import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Browser traffic stays same-origin; Next.js rewrites /api to the private API origin.
export const apiBaseUrl = '';
export const apiPrefix = '/api/v1';
