// API request/response contracts for HowAcademics v2.0

import { PaginationParams, PaginatedResponse, SeoFields, AuthorReference, CategoryReference, BookFormatPrice, ImageMedia } from './common';
import { BookStatus, BookFormat, HomepageSortMode, BannerTargetType, MediaKind, NavigationTargetType, AdminUserStatus, StaffRole, SortOption } from './enums';

// ============================================
// Book Contracts
// ============================================

export interface BookSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  coverImage?: ImageMedia;
  authors: AuthorReference[];
  categories: CategoryReference[];
  publicationDate?: string;
  status: BookStatus;
  publishedAt?: string;
  seo?: SeoFields;
}

export interface BookQuickView {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  coverImage?: ImageMedia;
  authors: AuthorReference[];
  publicationDate?: string;
  formats?: BookFormatPrice[]; // Optional format summary
}

export interface BookDetail extends BookSummary {
  description?: string;
  editionLabel?: string;
  publisherName?: string;
  language: string;
  pageCount?: number;
  tableOfContents?: string;
  formats: BookFormatPrice[]; // Exactly selected formats (0, 1, or 2)
  keywords: string[];
  relatedBooks?: BookSummary[];
}

// ============================================
// Author Contracts
// ============================================

export interface AuthorSummary {
  id: string;
  name: string;
  slug: string;
  sortName?: string;
  bookCount?: number;
}

// ============================================
// Category Contracts
// ============================================

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  bookCount?: number;
}

export interface CategoryDetail extends CategorySummary {
  description?: string;
  parent?: CategorySummary;
  children?: CategorySummary[];
  books?: BookSummary[];
}

// ============================================
// Homepage Contracts
// ============================================

export interface Banner {
  id: string;
  image: ImageMedia;
  headline?: string;
  caption?: string;
  targetType: BannerTargetType;
  targetIdOrUrl: string;
  isEnabled: boolean;
  sortOrder: number;
  startsAt?: string;
  endsAt?: string;
}

export interface HomepageCategorySection {
  id: string;
  category: CategoryReference;
  titleOverride?: string;
  isEnabled: boolean;
  sortOrder: number;
  maxBooks: number;
  sortMode: HomepageSortMode;
  books: BookSummary[];
}

export interface HomeData {
  banners: Banner[];
  categorySections: HomepageCategorySection[];
}

// ============================================
// Search Contracts
// ============================================

export interface SearchParams extends PaginationParams {
  q?: string;
  category?: string;
  author?: string;
  format?: BookFormat;
  year?: number;
  sort?: SortOption;
}

export interface SearchResult {
  type: 'book';
  id: string;
  title: string;
  slug: string;
  authors: AuthorReference[];
  categories: CategoryReference[];
  shortDescription?: string;
  coverImage?: ImageMedia;
  publicationDate?: string;
  relevanceScore?: number;
  matchSource?: 'exact' | 'prefix' | 'fts' | 'synonym' | 'trigram' | 'related';
}

export interface SearchResponse extends PaginatedResponse<SearchResult> {
  facets?: {
    categories: Array<{ id: string; name: string; count: number }>;
    authors: Array<{ id: string; name: string; count: number }>;
    formats: Array<{ format: BookFormat; count: number }>;
    years: Array<{ year: number; count: number }>;
  };
  relatedBooks?: BookSummary[]; // Separately labeled recommendations
}

export interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  type: 'book';
}

// ============================================
// Media Contracts
// ============================================

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  checksum?: string;
  altText?: string;
  caption?: string;
  credit?: string;
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResponse {
  media: MediaAsset;
  url: string;
}

// ============================================
// Admin Contracts
// ============================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: AdminUserStatus;
  lastLoginAt?: string;
  roles: StaffRole[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  totalAuthors: number;
  totalCategories: number;
  activeHomepageSections: number;
  activeBanners: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityName: string;
    actorName: string;
    createdAt: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AdminUser;
  permissions: string[];
}

export interface SiteSettings {
  siteName: string;
  siteDescription?: string;
  defaultCurrency: string;
  headerLogo?: ImageMedia;
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  seoDefaultTitle?: string;
  seoDefaultDescription?: string;
}

// ============================================
// Navigation Contracts
// ============================================

export interface NavigationMenu {
  id: string;
  key: string;
  label: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  id: string;
  label: string;
  targetType: NavigationTargetType;
  targetUrl: string;
  parentId?: string;
  sortOrder: number;
  visible: boolean;
  children?: NavigationItem[];
}

// ============================================
// Search Synonym Contracts
// ============================================

export interface SearchSynonym {
  id: string;
  canonicalTerm: string;
  alternativeTerm: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Health Check
// ============================================

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  database: 'connected' | 'disconnected';
}
