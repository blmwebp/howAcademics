import { Prisma } from '@prisma/client';
import { db, bookRelations, bookDto, pageParams } from './core';
import type { Request } from 'express';

export async function searchBooks(query: Request['query']) {
  const { page, pageSize, skip } = pageParams(query);
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 150) : '';
  const category = typeof query.category === 'string' ? query.category : '';
  const author = typeof query.author === 'string' ? query.author : '';
  const format = query.format === 'paperback' || query.format === 'hardcover' ? query.format : '';
  const year = Number(query.year) || 0;
  const sort = typeof query.sort === 'string' ? query.sort : 'relevance';
  const where: Prisma.BookWhereInput = {
    status: 'published',
    ...(category && { categories: { some: { category: { slug: category, isActive: true } } } }),
    ...(author && { authors: { some: { author: { slug: author } } } }),
    ...(format && { formats: { some: { format } } }),
    ...(year >= 1900 && year <= 2100 && {
      publicationDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    }),
  };
  let ranked: string[] | undefined;
  if (q) {
    const synonyms = await db.searchSynonym.findMany({ where: {
      isActive: true,
      OR: [{ canonicalTerm: { equals: q, mode: 'insensitive' } }, { alternativeTerm: { equals: q, mode: 'insensitive' } }],
    } });
    const terms = [...new Set([q, ...synonyms.flatMap((s) => [s.canonicalTerm, s.alternativeTerm])])].slice(0, 8);
    const scores = new Map<string, number>();
    for (const [index, term] of terms.entries()) {
      const contains = '%' + term.replace(/[%_]/g, '') + '%';
      if (contains.length < 3) continue;
      let results: Array<{ id: string; score: number }>;
      try {
        results = await db.$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`
          SELECT b.id,
            (CASE WHEN lower(b.title) = lower(${term}) THEN 100 ELSE 0 END
             + CASE WHEN lower(b.title) LIKE lower(${term + '%'}) THEN 65 ELSE 0 END
             + CASE WHEN lower(b.title) LIKE lower(${contains}) THEN 35 ELSE 0 END
             + CASE WHEN EXISTS (SELECT 1 FROM book_formats f WHERE f."bookId" = b.id AND f.isbn = ${term}) THEN 110 ELSE 0 END
             + ts_rank(to_tsvector('english', s."searchText"), websearch_to_tsquery('english', ${term})) * 30
             + similarity(lower(b.title), lower(${term})) * 20)::float8 AS score
          FROM books b
          JOIN book_search_documents s ON s."bookId" = b.id
          WHERE b.status = 'published'
            AND (b.title ILIKE ${contains}
              OR s."searchText" ILIKE ${contains}
              OR to_tsvector('english', s."searchText") @@ websearch_to_tsquery('english', ${term})
              OR similarity(lower(b.title), lower(${term})) > 0.25)
          ORDER BY score DESC LIMIT 500
        `);
      } catch (error) {
        // Before pg_trgm is enabled, safe full-text/partial matching still works.
        results = await db.$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`
          SELECT b.id, (CASE WHEN lower(b.title) = lower(${term}) THEN 100 ELSE 0 END
            + ts_rank(to_tsvector('english', s."searchText"),
              websearch_to_tsquery('english', ${term})) * 30)::float8 AS score
          FROM books b JOIN book_search_documents s ON s."bookId" = b.id
          WHERE b.status = 'published' AND (s."searchText" ILIKE ${contains}
             OR to_tsvector('english', s."searchText") @@ websearch_to_tsquery('english', ${term}))
          ORDER BY score DESC LIMIT 500
        `);
      }
      for (const item of results) scores.set(item.id, (scores.get(item.id) || 0) + item.score * (index ? 0.5 : 1));
    }
    ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    where.id = { in: ranked };
  }
  const total = await db.book.count({ where });
  const all = await db.book.findMany({
    where, include: bookRelations,
    ...(q && ranked && sort === 'relevance' ? {} : {
      orderBy: sort === 'title_asc' ? [{ title: 'asc' }, { id: 'asc' }] :
        sort === 'title_desc' ? [{ title: 'desc' }, { id: 'asc' }] :
          [{ publicationDate: 'desc' }, { id: 'asc' }],
      skip, take: pageSize,
    }),
  });
  const books = q && ranked && sort === 'relevance'
    ? all.sort((a, b) => ranked!.indexOf(a.id) - ranked!.indexOf(b.id)).slice(skip, skip + pageSize)
    : all;
  const relatedBooks = q && !total
    ? (await db.book.findMany({ where: { status: 'published' }, include: bookRelations,
      orderBy: { publishedAt: 'desc' }, take: 6 })).map((b) => bookDto(b))
    : undefined;
  return {
    data: books.map((b) => bookDto(b)),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    ...(relatedBooks && { relatedBooks }),
  };
}
