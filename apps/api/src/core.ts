import { PrismaClient, Prisma } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

export const db = new PrismaClient();

export const bookRelations = {
  authors: { include: { author: true }, orderBy: { displayOrder: 'asc' as const } },
  categories: { include: { category: true } },
  formats: { orderBy: { format: 'desc' as const } },
  coverMedia: true,
  keywords: { include: { keyword: true } },
} satisfies Prisma.BookInclude;

export type FullBook = Prisma.BookGetPayload<{ include: typeof bookRelations }>;

export const wrap = (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res)).catch(next);

export function slugify(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}

export function mediaDto(media: FullBook['coverMedia'] | null) {
  if (!media) return undefined;
  return {
    id: media.id, url: '/media/' + encodeURIComponent(media.storagePath),
    kind: media.kind,
    storagePath: media.storagePath, originalFilename: media.originalFilename,
    mimeType: media.mimeType, sizeBytes: Number(media.sizeBytes),
    altText: media.altText || undefined,
  };
}

export function bookDto(book: FullBook, detail = false) {
  const summary = {
    id: book.id, slug: book.slug, title: book.title, subtitle: book.subtitle,
    shortDescription: book.shortDescription, publicationDate: book.publicationDate?.toISOString() || null,
    status: book.status, publishedAt: book.publishedAt?.toISOString() || null,
    coverImage: mediaDto(book.coverMedia),
    authors: book.authors.map(({ author }) => ({ id: author.id, name: author.name, slug: author.slug })),
    categories: book.categories.map(({ category }) => ({
      id: category.id, name: category.name, slug: category.slug,
    })),
  };
  if (!detail) return summary;
  return {
    ...summary, description: book.description, editionLabel: book.editionLabel,
    publisherName: book.publisherName, language: book.language, pageCount: book.pageCount,
    tableOfContents: book.tableOfContents,
    formats: book.formats.map((item) => ({
      id: item.id, format: item.format, priceMinor: Number(item.priceMinor),
      currency: item.currency, isbn: item.isbn,
    })),
    keywords: book.keywords.map(({ keyword }) => keyword.label),
    seo: { title: book.seoTitle, description: book.seoDescription },
  };
}

export async function rebuildBookSearch(bookId: string) {
  const book = await db.book.findUnique({ where: { id: bookId }, include: bookRelations });
  if (!book) return;
  const text = [
    book.title, book.subtitle, book.shortDescription, book.description,
    book.tableOfContents, book.publisherName,
    ...book.authors.map((x) => x.author.name),
    ...book.categories.map((x) => x.category.name),
    ...book.formats.map((x) => x.isbn || ''),
    ...book.keywords.map((x) => x.keyword.label),
  ].filter(Boolean).join(' ');
  await db.bookSearchDocument.upsert({
    where: { bookId }, create: { bookId, searchText: text },
    update: { searchText: text },
  });
}

export async function audit(actorId: string | undefined, action: string, entityType: string, entityId?: string) {
  await db.auditLog.create({ data: { actorId, action, entityType, entityId } });
}

export function pageParams(query: Request['query']) {
  const page = Math.max(1, Math.min(10000, Number(query.page) || 1));
  const pageSize = Math.max(1, Math.min(60, Number(query.pageSize) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
