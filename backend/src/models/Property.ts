import { model, Schema, type Document } from 'mongoose';
import { tenantScopePlugin } from './plugins/tenant-scope';

interface IPriceHistory {
  price: number;
  date: Date;
  changePercent: number;
}

export interface IProperty extends Document {
  source: 'bayut' | 'propertyfinder' | 'dubizzle' | 'manual';
  sourceId: string;
  url: string;
  title: string;
  description: string;
  type: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'commercial' | 'land';
  purpose: 'sale' | 'rent';
  category?: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  price: number;
  pricePerSqft: number;
  currency: 'AED' | 'USD';
  location: {
    area: string;
    subArea?: string;
    building?: string;
    street?: string;
    city: string;
    country: string;
    coordinates: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  amenities: string[];
  furnishing: 'furnished' | 'unfurnished' | 'semi-furnished';
  parking: number;
  view?: string;
  floor?: number;
  totalFloors?: number;
  unitNumber?: string;
  developer?: string;
  completionStatus?: 'ready' | 'off_plan';
  handoverDate?: Date;
  images: string[];
  videos: string[];
  virtualTour?: string;
  floorPlan?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agency?: string;
  isOwner: boolean;
  permitNumber?: string;
  views: number;
  inquiries: number;
  favorites: number;
  listedDate: Date;
  lastUpdated: Date;
  refreshedAt?: Date;
  priceHistory: IPriceHistory[];
  marketTrend: 'increasing' | 'stable' | 'decreasing';
  daysOnMarket: number;
  competitorCount?: number;
  avgAreaPrice?: number;
  priceComparison?: number;
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  isPremium: boolean;
  scrapedAt: Date;
  lastScrapedAt: Date;
  scrapingErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    source: {
      type: String,
      enum: ['bayut', 'propertyfinder', 'dubizzle', 'manual'],
      required: true,
    },
    sourceId: { type: String, required: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['apartment', 'villa', 'townhouse', 'penthouse', 'commercial', 'land'],
      required: true,
    },
    purpose: { type: String, enum: ['sale', 'rent'], required: true },
    category: { type: String },
    bedrooms: { type: Number, min: 0, required: true },
    bathrooms: { type: Number, min: 0, required: true },
    size: { type: Number, min: 1, required: true },
    price: { type: Number, min: 0, required: true },
    pricePerSqft: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ['AED', 'USD'], default: 'AED' },
    location: {
      area: { type: String, required: true },
      subArea: { type: String },
      building: { type: String },
      street: { type: String },
      city: { type: String, required: true, default: 'Dubai' },
      country: { type: String, required: true, default: 'UAE' },
      coordinates: {
        type: { type: String, enum: ['Point'], required: true, default: 'Point' },
        coordinates: { type: [Number], required: true },
      },
    },
    amenities: { type: [String], default: [] },
    furnishing: {
      type: String,
      enum: ['furnished', 'unfurnished', 'semi-furnished'],
      required: true,
    },
    parking: { type: Number, default: 0, min: 0 },
    view: { type: String },
    floor: { type: Number, min: 0 },
    totalFloors: { type: Number, min: 0 },
    unitNumber: { type: String },
    developer: { type: String },
    completionStatus: { type: String, enum: ['ready', 'off_plan'] },
    handoverDate: { type: Date },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    virtualTour: { type: String },
    floorPlan: { type: String },
    agentName: { type: String },
    agentPhone: { type: String },
    agentEmail: { type: String },
    agency: { type: String },
    isOwner: { type: Boolean, default: false },
    permitNumber: { type: String },
    views: { type: Number, default: 0, min: 0 },
    inquiries: { type: Number, default: 0, min: 0 },
    favorites: { type: Number, default: 0, min: 0 },
    listedDate: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
    refreshedAt: { type: Date },
    priceHistory: [
      {
        price: { type: Number, required: true },
        date: { type: Date, required: true },
        changePercent: { type: Number, required: true },
      },
    ],
    marketTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
    daysOnMarket: { type: Number, default: 0, min: 0 },
    competitorCount: { type: Number, min: 0 },
    avgAreaPrice: { type: Number, min: 0 },
    priceComparison: { type: Number },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    scrapedAt: { type: Date, default: Date.now },
    lastScrapedAt: { type: Date, default: Date.now },
    scrapingErrors: { type: [String] },
  },
  { timestamps: true },
);

PropertySchema.index({ sourceId: 1, source: 1 }, { unique: true });
PropertySchema.index({ type: 1, purpose: 1, price: 1 });
PropertySchema.index({ 'location.area': 1, purpose: 1 });
PropertySchema.index({ 'location.coordinates': '2dsphere' });
PropertySchema.index({ isActive: 1, scrapedAt: -1 });
PropertySchema.index({ price: 1, bedrooms: 1 });
tenantScopePlugin(PropertySchema);

export const Property = model<IProperty>('Property', PropertySchema);
