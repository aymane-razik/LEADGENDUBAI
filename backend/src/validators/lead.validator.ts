import Joi from 'joi';
import { isValidBudget } from '../utils';

const budgetSchema = Joi.object({
  min: Joi.number().min(0).required(),
  max: Joi.number().min(0).required(),
  currency: Joi.string().valid('AED', 'USD').required(),
}).custom((value, helpers) => {
  if (!isValidBudget(value.min, value.max)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'budget validator');

export const createLeadSchema = Joi.object({
  source: Joi.string()
    .valid(
      'bayut',
      'propertyfinder',
      'dubizzle',
      'facebook',
      'instagram',
      'landing_page',
      'referral',
      'manual',
    )
    .required(),
  sourceId: Joi.string().optional(),
  firstName: Joi.string().required(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+971[1-9]\d{7,8}$/)
    .required(),
  propertyType: Joi.array()
    .items(Joi.string().valid('apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land'))
    .min(1)
    .required(),
  purpose: Joi.string().valid('buy', 'rent', 'invest', 'sell').required(),
  budget: budgetSchema.required(),
  locations: Joi.array().items(Joi.string()).min(1).required(),
  timeline: Joi.string()
    .valid('immediate', '1-3months', '3-6months', '6-12months', 'flexible')
    .required(),
  responseRate: Joi.number().min(0).max(1).default(0),
});

const createLeadKeys = [
  'source',
  'sourceId',
  'firstName',
  'lastName',
  'email',
  'phone',
  'propertyType',
  'purpose',
  'budget',
  'locations',
  'timeline',
  'responseRate',
] as const;

export const updateLeadSchema = createLeadSchema.fork([...createLeadKeys], (schema) =>
  schema.optional(),
);

export const updateLeadStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'new',
      'contacted',
      'qualified',
      'meeting_scheduled',
      'viewing_done',
      'negotiating',
      'deal_closed',
      'lost',
      'nurturing',
    )
    .required(),
});

export const assignLeadSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

export const deduplicationSchema = Joi.object({
  primaryId: Joi.string().hex().length(24).required(),
  duplicateId: Joi.string().hex().length(24).required(),
});
