import Joi from 'joi';

export const createPropertySchema = Joi.object({
  source: Joi.string().valid('bayut', 'propertyfinder', 'dubizzle', 'manual').required(),
  sourceId: Joi.string().required(),
  url: Joi.string().uri().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  type: Joi.string()
    .valid('apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land')
    .required(),
  purpose: Joi.string().valid('sale', 'rent').required(),
  bedrooms: Joi.number().min(0).required(),
  bathrooms: Joi.number().min(0).required(),
  size: Joi.number().positive().required(),
  price: Joi.number().positive().required(),
  pricePerSqft: Joi.number().positive().required(),
  currency: Joi.string().valid('AED', 'USD').required(),
  location: Joi.object({
    area: Joi.string().required(),
    city: Joi.string().default('Dubai'),
    country: Joi.string().default('UAE'),
    coordinates: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }).required(),
  }).required(),
  furnishing: Joi.string().valid('furnished', 'unfurnished', 'semi-furnished').required(),
  parking: Joi.number().min(0).default(0),
  isOwner: Joi.boolean().default(false),
  listedDate: Joi.date().default(() => new Date()),
  lastUpdated: Joi.date().default(() => new Date()),
  scrapedAt: Joi.date().default(() => new Date()),
  lastScrapedAt: Joi.date().default(() => new Date()),
});

const createPropertyKeys = [
  'source',
  'sourceId',
  'url',
  'title',
  'description',
  'type',
  'purpose',
  'bedrooms',
  'bathrooms',
  'size',
  'price',
  'pricePerSqft',
  'currency',
  'location',
  'furnishing',
  'parking',
  'isOwner',
  'listedDate',
  'lastUpdated',
  'scrapedAt',
  'lastScrapedAt',
] as const;

export const updatePropertySchema = createPropertySchema.fork([...createPropertyKeys], (schema) =>
  schema.optional(),
);
