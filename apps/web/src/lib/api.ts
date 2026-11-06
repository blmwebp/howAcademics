export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch('/api/v1/public' + url);
  if (!response.ok) throw new Error('The catalogue is currently unavailable.');
  const payload = await response.json() as { data: T };
  return payload.data;
}
export interface AuthorRef { id: string; name: string; slug: string }
export interface CategoryRef { id: string; name: string; slug: string }
export interface BookFormat { format: 'paperback' | 'hardcover'; priceMinor: number; currency: string; isbn?: string | null }
export interface Book {
  id: string; slug: string; title: string; subtitle?: string | null;
  shortDescription?: string | null; description?: string | null;
  publicationDate?: string | null; publishedAt?: string | null;
  coverImage?: { url?: string; altText?: string };
  authors: AuthorRef[]; categories: CategoryRef[];
  formats?: BookFormat[]; pageCount?: number | null; language?: string; publisherName?: string | null;
  tableOfContents?: string | null; relatedBooks?: Book[]; isDemo?: boolean;
}
export interface Banner {
  id: string;

  // Desktop banner
  image?: {
    url?: string;
    altText?: string;
  } | null;

  // Mobile banner
  mobileImage?: {
    url?: string;
    altText?: string;
  } | null;

  headline?: string | null;
  caption?: string | null;

  targetType?: string | null;
  targetIdOrUrl?: string | null;

  isDemo?: boolean;
}
export interface Section { id: string; category: CategoryRef; titleOverride?: string | null; books: Book[] }
export interface HomeData { banners: Banner[]; categorySections: Section[];
  configuredBanners?: boolean; configuredSections?: boolean; hasPublishedBooks?: boolean }
export const money = (minor: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(minor / 100);
export const shortDate = (date?: string | null) => date
  ? new Date(date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';
