import { Router } from 'express';
import { db, bookRelations, bookDto, mediaDto, wrap, asString } from './core';
import { searchBooks } from './search';
import { sendFlyer } from './flyer';
import { AppError } from './middleware/errorHandler';

export const publicRouter = Router();

publicRouter.get('/home', wrap(async (_req, res) => {
  const now = new Date();
  const [banners, sections, totalBanners, totalSections, totalPublished] = await Promise.all([
    db.banner.findMany({ where: {
      isEnabled: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    }, include: { imageMedia: true, mobileImageMedia: true, }, orderBy: { sortOrder: 'asc' } }),
    db.homepageCategorySection.findMany({
      where: { isEnabled: true, category: { isActive: true } },
      include: { category: true, sectionBooks: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    }),
    db.banner.count(), db.homepageCategorySection.count(),
    db.book.count({ where: { status: 'published' } }),
  ]);
  const categorySections = await Promise.all(sections.map(async (section) => {
    const manualIds = section.sectionBooks.map((item) => item.bookId);
    const books = await db.book.findMany({
      where: { status: 'published', categories: { some: { categoryId: section.categoryId } },
        ...(section.sortMode === 'manual' && { id: { in: manualIds } }) },
      include: bookRelations, take: section.maxBooks,
      orderBy: section.sortMode === 'title_asc' ? { title: 'asc' } :
        section.sortMode === 'title_desc' ? { title: 'desc' } : { publicationDate: 'desc' },
    });
    const sorted = section.sortMode === 'manual'
      ? books.sort((a, b) => {
        const index = (id: string) => {
          const i = section.sectionBooks.findIndex((item) => item.bookId === id);
          return i < 0 ? 10000 : i;
        };
        return index(a.id) - index(b.id);
      }) : books;
    return {
      id: section.id, category: { id: section.category.id, name: section.category.name, slug: section.category.slug },
      titleOverride: section.titleOverride, books: sorted.map((b) => bookDto(b)),
    };
  }));
  res.json({ data: {
    configuredBanners: totalBanners > 0,
    configuredSections: totalSections > 0,
    hasPublishedBooks: totalPublished > 0,
    banners: banners.map((b) => ({
      id: b.id,
      image: mediaDto(b.imageMedia),
      mobileImage: b.mobileImageMedia
        ? mediaDto(b.mobileImageMedia)
        : mediaDto(b.imageMedia),
      headline: b.headline,
      caption: b.caption,
      targetType: b.targetType,
      targetIdOrUrl: b.targetIdOrUrl,
    })),
    categorySections: categorySections.filter((s) => s.books.length > 0),
  } });
}));

publicRouter.get('/categories', wrap(async (_req, res) => {
  res.json({ data: await db.category.findMany({
    where: { isActive: true }, select: { id: true, name: true, slug: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  }) });
}));

publicRouter.get('/authors', wrap(async (_req, res) => {
  res.json({ data: await db.author.findMany({
    select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' },
  }) });
}));

publicRouter.get('/books', wrap(async (req, res) => {
  const result = await searchBooks(req.query);
  const anyRecords = await db.book.count();
  res.json({ ...result, meta: { ...result.meta, demoMode: anyRecords === 0 } });
}));

publicRouter.get('/books/:slug', wrap(async (req, res) => {
  const book = await db.book.findUnique({ where: { slug: req.params.slug }, include: bookRelations });
  if (!book || book.status !== 'published') throw new AppError(404, 'Book not found');
  const categoryIds = book.categories.map((c) => c.categoryId);
  const related = categoryIds.length ? await db.book.findMany({
    where: { status: 'published', id: { not: book.id },
      categories: { some: { categoryId: { in: categoryIds } } } },
    include: bookRelations, take: 6,
  }) : [];
  res.json({ data: { ...bookDto(book, true), relatedBooks: related.map((b) => bookDto(b)) } });
}));

publicRouter.get('/books/:slug/quick-view', wrap(async (req, res) => {
  const book = await db.book.findUnique({ where: { slug: req.params.slug }, include: bookRelations });
  if (!book || book.status !== 'published') throw new AppError(404, 'Book not found');
  res.json({ data: bookDto(book) });
}));

publicRouter.get(
  '/books/:slug/flyer',
  wrap(async (req, res) => {
    const slug = String(req.params.slug);

    const book = await db.book.findUnique({
      where: {
        slug,
      },

      include: bookRelations,
    });

    if (!book || book.status !== 'published') {
      throw new AppError(
        404,
        'Book not found'
      );
    }

    console.log('[Flyer] Book:', book.title);

    console.log('[Flyer] Cover media:', {
      coverMediaId: book.coverMediaId,
      storagePath: book.coverMedia?.storagePath,
      mimeType: book.coverMedia?.mimeType,
    });

    await sendFlyer(res, book);
  })
);

publicRouter.get('/site-settings', wrap(async (_req, res) => {
  const settings = await db.siteSetting.findMany();
  res.json({ data: Object.fromEntries(settings.map((s) => [s.key, s.valueJson])) });
}));

publicRouter.get('/search/suggestions', wrap(async (req, res) => {
  const q = asString(req.query.q).slice(0, 80);
  if (q.length < 2) return res.json({ data: [] });
  const books = await db.book.findMany({ where: { status: 'published', title: { contains: q, mode: 'insensitive' } },
    select: { id: true, slug: true, title: true }, take: 8 });
  res.json({ data: books });
}));
