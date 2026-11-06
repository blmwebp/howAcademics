// Common data structures used across the application

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface AuditMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface SeoFields {
  title?: string;
  description?: string;
}

export interface ImageMedia {
  id: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  credit?: string;
}

export interface AuthorReference {
  id: string;
  name: string;
  slug: string;
  sortName?: string;
}

export interface CategoryReference {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface BookFormatPrice {
  format: 'paperback' | 'hardcover';
  priceMinor: number;
  currency: string;
  isbn?: string;
}

export interface Price {
  amount: number; // in minor units (e.g., 2999 for $29.99)
  currency: string; // ISO 4217 code
  display: string; // formatted string
}
