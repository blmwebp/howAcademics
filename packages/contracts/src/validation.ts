// Zod validation schemas for API requests/responses

import { z } from 'zod';
import { BookStatus, BookFormat, HomepageSortMode, BannerTargetType, MediaKind, NavigationTargetType, AdminUserStatus, StaffRole, Permission, SortOption } from './enums';

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const seoSchema = z.object({
  title: z.string().max(60).optional(),
  description: z.string().max(160).optional(),
});

// Book validation
export const bookSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  publicationDate: z.coerce.date().optional(),
  editionLabel: z.string().max(100).optional(),
  publisherName: z.string().max(255).optional(),
  language: z.string().length(2).default('en'),
  pageCount: z.coerce.number().int().positive().optional(),
  tableOfContents: z.string().optional(),
  coverMediaId: z.string().uuid().optional(),
  status: z.nativeEnum(BookStatus).default(BookStatus.DRAFT),
  seo: seoSchema.optional(),
});

export const bookFormatSchema = z.object({
  format: z.nativeEnum(BookFormat),
  priceMinor: z.coerce.number().int().positive(),
  currency: z.string().length(3).default('INR'),
  isbn: z.string().regex(/^(?:\d{13}|\d{10})?$/).optional(),
});

export const bookFormatsSchema = z.object({
  formats: z.array(bookFormatSchema).max(2), // Max 2 formats (paperback + hardcover)
});

// Author validation
export const authorSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  sortName: z.string().max(255).optional(),
});

// Category validation
export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

// Keyword validation
export const keywordSchema = z.object({
  label: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

// Homepage section validation
export const homepageCategorySectionSchema = z.object({
  categoryId: z.string().uuid(),
  titleOverride: z.string().max(255).optional(),
  isEnabled: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  maxBooks: z.coerce.number().int().min(1).max(50).default(10),
  sortMode: z.nativeEnum(HomepageSortMode).default(HomepageSortMode.NEWEST),
});

export const homepageSectionBookSchema = z.object({
  sectionId: z.string().uuid(),
  bookId: z.string().uuid(),
  sortOrder: z.coerce.number().int().default(0),
});

// Banner validation
export const bannerSchema = z.object({
  imageMediaId: z.string().uuid(),
  headline: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  targetType: z.nativeEnum(BannerTargetType),
  targetIdOrUrl: z.string().min(1).max(500),
  isEnabled: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

// Media validation
export const mediaUploadSchema = z.object({
  kind: z.nativeEnum(MediaKind),
  altText: z.string().max(500).optional(),
  caption: z.string().max(500).optional(),
  credit: z.string().max(255).optional(),
});

// Search validation
export const searchParamsSchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  format: z.nativeEnum(BookFormat).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  sort: z.nativeEnum(SortOption).optional(),
});

// Search synonym validation
export const searchSynonymSchema = z.object({
  canonicalTerm: z.string().min(1).max(100),
  alternativeTerm: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

// Navigation validation
export const navigationMenuSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  label: z.string().min(1).max(100),
});

export const navigationItemSchema = z.object({
  menuId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  label: z.string().min(1).max(100),
  targetType: z.nativeEnum(NavigationTargetType),
  targetUrl: z.string().min(1).max(500),
  sortOrder: z.coerce.number().int().default(0),
  visible: z.boolean().default(true),
});

// Site settings validation
export const siteSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(500).optional(),
  defaultCurrency: z.string().length(3).default('INR'),
  headerLogoMediaId: z.string().uuid().optional(),
  footerText: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  contactAddress: z.string().max(500).optional(),
  socialLinks: z.record(z.string().url()).optional(),
  seoDefaultTitle: z.string().max(60).optional(),
  seoDefaultDescription: z.string().max(160).optional(),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  roles: z.array(z.nativeEnum(StaffRole)).default([StaffRole.VIEWER]),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  status: z.nativeEnum(AdminUserStatus).optional(),
  roles: z.array(z.nativeEnum(StaffRole)).optional(),
});

// Role validation
export const roleSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
});

// Related books validation
export const bookRelatedSchema = z.object({
  bookToId: z.string().uuid(),
  relationType: z.string().default('manual'),
  sortOrder: z.coerce.number().int().default(0),
});
