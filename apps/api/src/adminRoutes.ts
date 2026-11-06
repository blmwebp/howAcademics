import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import argon2 from 'argon2';
import { db, bookRelations, bookDto, mediaDto, rebuildBookSearch, audit, wrap, slugify } from './core';
import { requireStaff, permit } from './auth';
import { sendFlyer } from './flyer';
import { AppError } from './middleware/errorHandler';

export const adminRouter = Router();
adminRouter.use(requireStaff);

const id = z.string().uuid();
const text = z.string().trim().max(10000);
const optionalText = text.nullish();
const formatInput = z.object({
  format: z.enum(['paperback', 'hardcover']),
  priceMinor: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.string().length(3).default('INR'),
  isbn: z.string().trim().max(20).nullish(),
});
const bookInput = z.object({
  title: z.string().trim().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  subtitle: optionalText, shortDescription: optionalText, description: optionalText,
  publicationDate: z.string().nullish(), editionLabel: optionalText,
  publisherName: optionalText, language: z.string().max(5).default('en'),
  pageCount: z.coerce.number().int().positive().nullish(),
  tableOfContents: optionalText, coverMediaId: id.nullish(),
  seoTitle: optionalText, seoDescription: optionalText,
  authorIds: z.array(id).default([]), categoryIds: z.array(id).default([]),
  keywords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  formats: z.array(formatInput).max(2).default([]),
}).superRefine((data, ctx) => {
  if (new Set(data.formats.map((x) => x.format)).size !== data.formats.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate book formats are not allowed' });
  }
});

function scalarBook(data: z.infer<typeof bookInput>) {
  return {
    title: data.title, slug: data.slug || slugify(data.title),
    subtitle: data.subtitle || null, shortDescription: data.shortDescription || null,
    description: data.description || null,
    publicationDate: data.publicationDate ? new Date(data.publicationDate) : null,
    editionLabel: data.editionLabel || null, publisherName: data.publisherName || null,
    language: data.language, pageCount: data.pageCount || null,
    tableOfContents: data.tableOfContents || null,
    coverMediaId: data.coverMediaId || null,
    seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null,
  };
}

async function saveBook(raw: unknown, actorId: string, bookId?: string) {
  const data = bookInput.parse(raw);
  const parsedFormats = data.formats.map((f) => ({
    format: f.format, priceMinor: BigInt(f.priceMinor), currency: f.currency.toUpperCase(),
    isbn: f.isbn || null,
  }));
  const bookIdSaved = await db.$transaction(async (tx) => {
    let savedId: string;
    if (bookId) {
      const existing = await tx.book.findUnique({ where: { id: bookId } });
      if (!existing) throw new AppError(404, 'Book not found');
      if (existing.slug !== (data.slug || slugify(data.title))) {
        await tx.slugRedirect.upsert({ where: { oldSlug: existing.slug },
          create: { oldSlug: existing.slug, newSlug: data.slug || slugify(data.title) },
          update: { newSlug: data.slug || slugify(data.title) } });
      }
      await tx.book.update({ where: { id: bookId }, data: { ...scalarBook(data), updatedBy: actorId } });
      savedId = bookId;
    } else {
      const book = await tx.book.create({ data: { ...scalarBook(data), createdBy: actorId, updatedBy: actorId } });
      savedId = book.id;
    }
    await tx.bookFormat.deleteMany({ where: { bookId: savedId } });
    if (parsedFormats.length) await tx.bookFormat.createMany({ data: parsedFormats.map((f) => ({ ...f, bookId: savedId })) });
    await tx.bookAuthor.deleteMany({ where: { bookId: savedId } });
    if (data.authorIds.length) await tx.bookAuthor.createMany({
      data: [...new Set(data.authorIds)].map((authorId, displayOrder) => ({ bookId: savedId, authorId, displayOrder })),
    });
    await tx.bookCategory.deleteMany({ where: { bookId: savedId } });
    if (data.categoryIds.length) await tx.bookCategory.createMany({
      data: [...new Set(data.categoryIds)].map((categoryId) => ({ bookId: savedId, categoryId })),
    });
    await tx.bookKeyword.deleteMany({ where: { bookId: savedId } });
    for (const label of [...new Set(data.keywords)]) {
      const keyword = await tx.keyword.upsert({
        where: { slug: slugify(label) }, create: { slug: slugify(label), label }, update: { label },
      });
      await tx.bookKeyword.create({ data: { bookId: savedId, keywordId: keyword.id } });
    }
    return savedId;
  });
  await rebuildBookSearch(bookIdSaved);
  await audit(actorId, bookId ? 'update' : 'create', 'book', bookIdSaved);
  return db.book.findUniqueOrThrow({ where: { id: bookIdSaved }, include: bookRelations });
}

adminRouter.get('/dashboard', permit('book.read'), wrap(async (_req, res) => {
  const [totalBooks, publishedBooks, draftBooks, totalAuthors, totalCategories,
    activeHomepageSections, activeBanners, recentActivity] = await Promise.all([
    db.book.count(), db.book.count({ where: { status: 'published' } }),
    db.book.count({ where: { status: 'draft' } }), db.author.count(),
    db.category.count(), db.homepageCategorySection.count({ where: { isEnabled: true } }),
    db.banner.count({ where: { isEnabled: true } }),
    db.auditLog.findMany({ take: 12, orderBy: { createdAt: 'desc' },
      include: { actor: { select: { name: true } } } }),
  ]);
  res.json({ data: { totalBooks, publishedBooks, draftBooks, totalAuthors, totalCategories,
    activeHomepageSections, activeBanners, recentActivity: recentActivity.map((item) => ({
      ...item, actorName: item.actor?.name || 'System',
    })) } });
}));

adminRouter.get('/books', permit('book.read'), wrap(async (_req, res) => {
  const books = await db.book.findMany({ include: bookRelations, orderBy: { updatedAt: 'desc' }, take: 500 });
  res.json({ data: books.map((book) => ({ ...bookDto(book, true), status: book.status })) });
}));
adminRouter.get('/books/:id', permit('book.read'), wrap(async (req, res) => {
  const book = await db.book.findUnique({ where: { id: req.params.id }, include: bookRelations });
  if (!book) throw new AppError(404, 'Book not found');
  res.json({ data: { ...bookDto(book, true), authorIds: book.authors.map((x) => x.authorId),
    categoryIds: book.categories.map((x) => x.categoryId), coverMediaId: book.coverMediaId } });
}));
adminRouter.post('/books', permit('book.write'), wrap(async (req, res) => {
  const saved = await saveBook(req.body, req.staff!.id);
  res.status(201).json({ data: bookDto(saved, true) });
}));
adminRouter.put('/books/:id', permit('book.write'), wrap(async (req, res) => {
  const saved = await saveBook(req.body, req.staff!.id, req.params.id);
  res.json({ data: bookDto(saved, true) });
}));
adminRouter.post('/books/:id/publish', permit('book.publish'), wrap(async (req, res) => {
  const book = await db.book.update({ where: { id: req.params.id },
    data: { status: 'published', publishedAt: new Date(), updatedBy: req.staff!.id } });
  await audit(req.staff!.id, 'publish', 'book', book.id);
  res.json({ data: { id: book.id, status: book.status } });
}));
adminRouter.post('/books/:id/unpublish', permit('book.publish'), wrap(async (req, res) => {
  const book = await db.book.update({ where: { id: req.params.id },
    data: { status: 'draft', updatedBy: req.staff!.id } });
  await audit(req.staff!.id, 'unpublish', 'book', book.id);
  res.json({ data: { id: book.id, status: book.status } });
}));
adminRouter.delete('/books/:id', permit('book.delete'), wrap(async (req, res) => {
  const book = await db.book.findUniqueOrThrow({ where: { id: req.params.id } });
  if (book.status !== 'draft') throw new AppError(409, 'Unpublish before deleting a book');
  await db.book.delete({ where: { id: book.id } });
  await audit(req.staff!.id, 'delete', 'book', book.id);
  res.json({ data: { success: true } });
}));
adminRouter.get('/books/:id/flyer-preview', permit('book.read'), wrap(async (req, res) => {
  const book = await db.book.findUnique({ where: { id: req.params.id }, include: bookRelations });
  if (!book) throw new AppError(404, 'Book not found');
  sendFlyer(res, book, true);
}));

const authorInput = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});
adminRouter.get('/authors', permit('author.read'), wrap(async (_req, res) => {
  res.json({ data: await db.author.findMany({ orderBy: { name: 'asc' } }) });
}));
adminRouter.post('/authors', permit('author.write'), wrap(async (req, res) => {
  const x = authorInput.parse(req.body);
  const data = await db.author.create({ data: { name: x.name, slug: x.slug || slugify(x.name) } });
  await audit(req.staff!.id, 'create', 'author', data.id);
  res.status(201).json({ data });
}));
adminRouter.put('/authors/:id', permit('author.write'), wrap(async (req, res) => {
  const x = authorInput.parse(req.body);
  const data = await db.author.update({ where: { id: req.params.id },
    data: { name: x.name, slug: x.slug || slugify(x.name) }, include: { books: true } });
  await Promise.all(data.books.map((b) => rebuildBookSearch(b.bookId)));
  await audit(req.staff!.id, 'update', 'author', data.id);
  res.json({ data });
}));
adminRouter.delete('/authors/:id', permit('author.write'), wrap(async (req, res) => {
  if (await db.bookAuthor.count({ where: { authorId: req.params.id } }))
    throw new AppError(409, 'Remove this author from books first');
  await db.author.delete({ where: { id: req.params.id } });
  res.json({ data: { success: true } });
}));

const categoryInput = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: optionalText, isActive: z.boolean().default(true), sortOrder: z.number().int().default(0),
});
adminRouter.get('/categories', permit('category.read'), wrap(async (_req, res) => {
  res.json({ data: await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }) });
}));
adminRouter.post('/categories', permit('category.write'), wrap(async (req, res) => {
  const x = categoryInput.parse(req.body);
  const data = await db.category.create({ data: { ...x, slug: x.slug || slugify(x.name) } });
  await audit(req.staff!.id, 'create', 'category', data.id);
  res.status(201).json({ data });
}));
adminRouter.put('/categories/:id', permit('category.write'), wrap(async (req, res) => {
  const x = categoryInput.parse(req.body);
  const data = await db.category.update({ where: { id: req.params.id },
    data: { ...x, slug: x.slug || slugify(x.name) }, include: { books: true } });
  await Promise.all(data.books.map((b) => rebuildBookSearch(b.bookId)));
  await audit(req.staff!.id, 'update', 'category', data.id);
  res.json({ data });
}));
adminRouter.delete('/categories/:id', permit('category.write'), wrap(async (req, res) => {
  if (await db.bookCategory.count({ where: { categoryId: req.params.id } }))
    throw new AppError(409, 'Remove this category from books first');
  await db.category.delete({ where: { id: req.params.id } });
  res.json({ data: { success: true } });
}));

const sectionInput = z.object({
  categoryId: id, titleOverride: optionalText,
  maxBooks: z.coerce.number().int().min(1).max(40).default(10),
  sortOrder: z.coerce.number().int().default(0),
  sortMode: z.enum(['newest', 'title_asc', 'title_desc', 'manual']).default('newest'),
  isEnabled: z.boolean().default(true),
  bookIds: z.array(id).default([]),
});
adminRouter.get('/homepage-sections', permit('home.manage'), wrap(async (_req, res) => {
  res.json({ data: await db.homepageCategorySection.findMany({
    include: { category: true, sectionBooks: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  }) });
}));
async function saveSection(raw: unknown, existingId?: string) {
  const { bookIds, ...x } = sectionInput.parse(raw);
  return db.$transaction(async (tx) => {
    const section = existingId
      ? await tx.homepageCategorySection.update({ where: { id: existingId }, data: x })
      : await tx.homepageCategorySection.create({ data: x });
    await tx.homepageSectionBook.deleteMany({ where: { sectionId: section.id } });
    if (bookIds.length) {
      const allowed = await tx.bookCategory.findMany({
        where: { categoryId: x.categoryId, bookId: { in: bookIds } }, select: { bookId: true },
      });
      if (allowed.length !== new Set(bookIds).size) throw new AppError(400, 'Manual books must belong to this category');
      await tx.homepageSectionBook.createMany({ data: [...new Set(bookIds)].map((bookId, sortOrder) => ({
        sectionId: section.id, bookId, sortOrder,
      })) });
    }
    return section;
  });
}
adminRouter.post('/homepage-sections', permit('home.manage'), wrap(async (req, res) => {
  res.status(201).json({ data: await saveSection(req.body) });
}));
adminRouter.put('/homepage-sections/:id', permit('home.manage'), wrap(async (req, res) => {
  res.json({ data: await saveSection(req.body, req.params.id) });
}));
adminRouter.delete('/homepage-sections/:id', permit('home.manage'), wrap(async (req, res) => {
  await db.homepageCategorySection.delete({ where: { id: req.params.id } });
  res.json({ data: { success: true } });
}));

const bannerInput = z.object({
  // Desktop banner image - required
  imageMediaId: id,

  // Mobile banner image - optional for existing banners
  mobileImageMediaId: id.nullable().optional(),

  // Banner content
  headline: optionalText,
  caption: optionalText,

  // Banner destination
  targetType: z
    .enum(['book', 'category', 'url'])
    .default('url'),

  targetIdOrUrl: z
    .string()
    .trim()
    .max(500)
    .default('/books'),

  // Visibility
  isEnabled: z
    .boolean()
    .default(true),

  // Display order
  sortOrder: z
    .coerce
    .number()
    .int()
    .default(0),
});
function safeBannerTarget(target: string) {
  if (target.startsWith('/') && !target.startsWith('//')) return true;
  try { return ['http:', 'https:'].includes(new URL(target).protocol); } catch { return false; }
}
adminRouter.get(
  '/banners',
  permit('banner.manage'),
  wrap(async (_req, res) => {
    const banners = await db.banner.findMany({
      include: {
        imageMedia: true,
        mobileImageMedia: true,
      },

      orderBy: {
        sortOrder: 'asc',
      },
    });

    const formattedBanners = banners.map((banner) => {
      const {
        imageMedia,
        mobileImageMedia,
        ...bannerData
      } = banner;

      return {
        ...bannerData,

        image: mediaDto(imageMedia),

        mobileImage: mobileImageMedia
          ? mediaDto(mobileImageMedia)
          : null,
      };
    });

    res.json({
      data: formattedBanners,
    });
  })
);
async function saveBanner(
  raw: unknown,
  existingId?: string
) {
  const x = bannerInput.parse(raw);

  // Validate destination
  if (!safeBannerTarget(x.targetIdOrUrl)) {
    throw new AppError(
      400,
      'Use an internal path or a safe HTTPS/HTTP URL'
    );
  }

  // Require mobile image when creating a new banner.
  // Existing banners may be updated without one.
  if (!existingId && !x.mobileImageMediaId) {
    throw new AppError(
      400,
      'Please upload a mobile banner image'
    );
  }

  // Update existing banner
  if (existingId) {
    return db.banner.update({
      where: {
        id: existingId,
      },

      data: x,
    });
  }

  // Create new banner
  return db.banner.create({
    data: {
      ...x,
      mobileImageMediaId: x.mobileImageMediaId!,
    },
  });
}
adminRouter.post('/banners', permit('banner.manage'), wrap(async (req, res) => {
  res.status(201).json({ data: await saveBanner(req.body) });
}));
adminRouter.put('/banners/:id', permit('banner.manage'), wrap(async (req, res) => {
  res.json({ data: await saveBanner(req.body, req.params.id) });
}));
adminRouter.delete('/banners/:id', permit('banner.manage'), wrap(async (req, res) => {
  await db.banner.delete({ where: { id: req.params.id } });
  res.json({ data: { success: true } });
}));

adminRouter.get('/synonyms', permit('search.manage'), wrap(async (_req, res) => {
  res.json({ data: await db.searchSynonym.findMany({ orderBy: { canonicalTerm: 'asc' } }) });
}));
const synonymInput = z.object({ canonicalTerm: z.string().trim().min(1),
  alternativeTerm: z.string().trim().min(1), isActive: z.boolean().default(true) });
adminRouter.post('/synonyms', permit('search.manage'), wrap(async (req, res) => {
  res.status(201).json({ data: await db.searchSynonym.create({ data: synonymInput.parse(req.body) }) });
}));
adminRouter.put('/synonyms/:id', permit('search.manage'), wrap(async (req, res) => {
  res.json({ data: await db.searchSynonym.update({ where: { id: req.params.id },
    data: synonymInput.parse(req.body) }) });
}));
adminRouter.delete('/synonyms/:id', permit('search.manage'), wrap(async (req, res) => {
  await db.searchSynonym.delete({ where: { id: req.params.id } });
  res.json({ data: { success: true } });
}));

adminRouter.get('/settings', permit('settings.update'), wrap(async (_req, res) => {
  res.json({ data: Object.fromEntries((await db.siteSetting.findMany()).map((x) => [x.key, x.valueJson])) });
}));
adminRouter.put('/settings', permit('settings.update'), wrap(async (req, res) => {
  const values = z.record(z.union([z.string().max(3000), z.number(), z.boolean(), z.array(z.any())])).parse(req.body);
  for (const [key, value] of Object.entries(values)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,60}$/.test(key)) throw new AppError(400, 'Invalid setting key');
    await db.siteSetting.upsert({ where: { key }, create: { key, valueJson: value as Prisma.InputJsonValue },
      update: { valueJson: value as Prisma.InputJsonValue, updatedBy: req.staff!.id } });
  }
  await audit(req.staff!.id, 'update', 'site_settings');
  res.json({ data: { success: true } });
}));

const uploadInput = z.object({
  kind: z.enum(['book_cover', 'banner', 'brand_image']),
  filename: z.string().min(1).max(255),
  dataBase64: z.string().min(10).max(10_000_000),
  altText: z.string().max(500).optional(),
});
adminRouter.get('/media', permit('media.read'), wrap(async (_req, res) => {
  const items = await db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ data: items.map((m) => mediaDto(m)) });
}));
adminRouter.post('/media', permit('media.write'), wrap(async (req, res) => {
  const x = uploadInput.parse(req.body);
  const bytes = Buffer.from(x.dataBase64, 'base64');
  if (bytes.length > 5_000_000) throw new AppError(413, 'Image exceeds 5 MB');
  let extension = '';
  let mime = '';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    extension = 'png'; mime = 'image/png';
  } else if (bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    extension = 'jpg'; mime = 'image/jpeg';
  } else if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') {
    extension = 'webp'; mime = 'image/webp';
  } else throw new AppError(415, 'Upload PNG, JPEG or WebP images only');
  const file = crypto.randomUUID() + '.' + extension;
  const folder = path.resolve(process.env.MEDIA_DIR || './media');
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, file), bytes, { flag: 'wx' });
  const item = await db.mediaAsset.create({ data: {
    kind: x.kind, originalFilename: path.basename(x.filename), storagePath: file,
    mimeType: mime, sizeBytes: BigInt(bytes.length), altText: x.altText || null,
    checksum: crypto.createHash('sha256').update(bytes).digest('hex'),
    uploadedBy: req.staff!.id,
  } });
  res.status(201).json({ data: mediaDto(item) });
}));

adminRouter.get('/staff', permit('user.manage'), wrap(async (_req, res) => {
  res.json({ data: await db.adminUser.findMany({ select: {
    id: true, name: true, email: true, status: true, createdAt: true, roles: { select: { key: true } },
  } }) });
}));
adminRouter.get('/roles', permit('user.manage'), wrap(async (_req, res) => {
  res.json({ data: await db.role.findMany({ include: { permissions: true } }) });
}));
adminRouter.post('/staff', permit('user.manage'), wrap(async (req, res) => {
  const x = z.object({ name: z.string().min(1), email: z.string().email(),
    password: z.string().min(12), roleIds: z.array(id).min(1) }).parse(req.body);
  const data = await db.adminUser.create({ data: {
    name: x.name, email: x.email.toLowerCase(), passwordHash: await argon2.hash(x.password),
    roles: { connect: x.roleIds.map((id) => ({ id })) },
  }, select: { id: true, name: true, email: true } });
  await audit(req.staff!.id, 'create', 'admin_user', data.id);
  res.status(201).json({ data });
}));
adminRouter.put('/staff/:id', permit('user.manage'), wrap(async (req, res) => {
  const input = z.object({ status: z.enum(['active', 'inactive', 'suspended']),
    roleIds: z.array(id).min(1) }).parse(req.body);
  if (req.staff!.id === req.params.id && input.status !== 'active')
    throw new AppError(409, 'You cannot disable your own account');
  const saved = await db.adminUser.update({ where: { id: req.params.id },
    data: { status: input.status, roles: { set: input.roleIds.map((roleId) => ({ id: roleId })) } },
    select: { id: true, email: true, status: true } });
  await db.session.updateMany({ where: { userId: saved.id }, data: { revokedAt: new Date() } });
  await audit(req.staff!.id, 'update', 'admin_user', saved.id);
  res.json({ data: saved });
}));
adminRouter.get('/audit', permit('audit.view'), wrap(async (_req, res) => {
  res.json({ data: await db.auditLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }) });
}));
