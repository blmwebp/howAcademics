import 'dotenv/config';
import { db, rebuildBookSearch, slugify } from './core';

// Explicit, idempotent DEMONSTRATION seed. Never run on a live production catalogue.
const examples = [
  { title: 'Foundations of Data Science', category: 'Computer Science', authors: ['Ananya Mehta'],
    formats: [{ format: 'paperback', priceMinor: 129900 }, { format: 'hardcover', priceMinor: 189900 }] },
  { title: 'Machine Learning Essentials', category: 'Computer Science', authors: ['Rohan Kapoor', 'Leena Sharma'],
    formats: [{ format: 'paperback', priceMinor: 109500 }] },
  { title: 'Artificial Intelligence Today', category: 'Computer Science', authors: ['Arjun Sen'],
    formats: [{ format: 'paperback', priceMinor: 139900 }] },
  { title: 'Modern Business Analytics', category: 'Business & Management', authors: ['Leena Sharma'],
    formats: [{ format: 'paperback', priceMinor: 115000 }] },
  { title: 'Leadership in a Changing World', category: 'Business & Management', authors: ['Nisha Verma'],
    formats: [{ format: 'paperback', priceMinor: 95000 }] },
  { title: 'Economics of Innovation', category: 'Business & Management', authors: ['Rohan Kapoor'],
    formats: [{ format: 'hardcover', priceMinor: 165000 }] },
  { title: 'The Research Design Handbook', category: 'Research Methods', authors: ['Ananya Mehta', 'Nisha Verma'],
    formats: [{ format: 'paperback', priceMinor: 87500 }] },
  { title: 'Academic Writing Made Clear', category: 'Research Methods', authors: ['Arjun Sen'],
    formats: [{ format: 'paperback', priceMinor: 79000 }] },
  { title: 'Essays on Academic Learning', category: 'Research Methods', authors: ['Nisha Verma'],
    formats: [] },
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');
  const categories = [...new Set(examples.map((item) => item.category))];
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i], slug = slugify(name);
    const category = await db.category.upsert({
      where: { slug }, create: { name, slug, sortOrder: i }, update: {},
    });
    const section = await db.homepageCategorySection.findFirst({ where: { categoryId: category.id } });
    if (!section) await db.homepageCategorySection.create({ data: {
      categoryId: category.id, isEnabled: true, sortOrder: i, maxBooks: 8, sortMode: 'newest',
    } });
  }
  for (const item of examples) {
    const slug = slugify(item.title);
    if (await db.book.findUnique({ where: { slug } })) continue; // never overwrite an admin's edits
    const authors = await Promise.all(item.authors.map(async (name) =>
      db.author.upsert({ where: { slug: slugify(name) },
        create: { name, slug: slugify(name) }, update: {} })));
    const category = await db.category.findUniqueOrThrow({ where: { slug: slugify(item.category) } });
    const book = await db.book.create({ data: {
      title: item.title, slug, status: 'published', publishedAt: new Date(),
      publicationDate: new Date('2026-09-15'), language: 'en', pageCount: 280,
      publisherName: 'Demonstration entry — replace in Admin',
      shortDescription: `A demonstration catalogue entry for ${item.title}. This is not a real publication.`,
      description: `Sample HowAcademics book data used to preview the public catalogue. Replace this information with actual book records in the admin panel.`,
      formats: { create: item.formats.map((f) => ({ ...f, priceMinor: BigInt(f.priceMinor), currency: 'INR' })) },
      authors: { create: authors.map((author, displayOrder) => ({ authorId: author.id, displayOrder })) },
      categories: { create: [{ categoryId: category.id }] },
    } });
    await rebuildBookSearch(book.id);
  }
  console.log('Demo book records seeded. Remove/replace these entries before launch.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
