import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { apiGet, type Book, type CategoryRef } from '../lib/api';
import { demoBooks, demoCategories } from '../lib/demo';

interface SearchPayload { data: Book[]; meta: { total: number; page: number; totalPages: number; demoMode?: boolean }; relatedBooks?: Book[] }
function demoSearch(params: URLSearchParams): SearchPayload {
  const q = (params.get('q') || '').trim().toLowerCase();
  const category = params.get('category') || '';
  const author = params.get('author') || '';
  const format = params.get('format') || '';
  const expanded = q === 'ai' ? 'artificial intelligence' : q;
  const matches = demoBooks.filter((book) => {
    const searchable = [book.title, book.subtitle, book.description,
      ...book.authors.map((a) => a.name), ...book.categories.map((c) => c.name)].join(' ').toLowerCase();
    return (!q || searchable.includes(q) || searchable.includes(expanded)) &&
      (!category || book.categories.some((c) => c.slug === category)) &&
      (!author || book.authors.some((a) => a.slug === author)) &&
      (!format || book.formats?.some((f) => f.format === format));
  });
  return { data: matches, meta: { total: matches.length, page: 1, totalPages: 1 },
    relatedBooks: q && !matches.length ? demoBooks.slice(0, 4) : undefined };
}
export default function BooksPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [data, setData] = useState<SearchPayload>(demoSearch(params));
  const [categories, setCategories] = useState<CategoryRef[]>(demoCategories);
  const [loading, setLoading] = useState(false);
  const query = params.toString();
  useEffect(() => { setQ(params.get('q') || ''); }, [query]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    fetch('/api/v1/public/books?' + query).then(async (res) => {
      if (!res.ok) throw new Error('No API');
      return res.json() as Promise<SearchPayload>;
    }).then((response) => {
      if (!current) return;
      setData(response.meta.demoMode && !query
        ? { ...response, data: demoBooks, meta: { page: 1, total: demoBooks.length, totalPages: 1 } }
        : response);
    }).catch(() => { if (current) setData(demoSearch(params)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [query]);
  useEffect(() => {
    apiGet<CategoryRef[]>('/categories').then((items) => {
      if (items.length) setCategories(items);
    }).catch(() => undefined);
  }, []);
  const authorName = useMemo(() => data.data.flatMap((b) => b.authors)
    .find((a) => a.slug === params.get('author'))?.name || params.get('author')?.replaceAll('-', ' '), [data, query]);
  const modify = (key: string, value: string) => {
    const copy = new URLSearchParams(params);
    if (value) copy.set(key, value); else copy.delete(key);
    if (key !== 'page') copy.delete('page');
    setParams(copy);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); modify('q', q.trim()); };
  return (
    <div className="container-content py-12 md:py-16">
      <p className="text-xs uppercase tracking-[.25em] text-accent mb-3">Browse HowAcademics</p>
      <h1 className="text-4xl md:text-6xl font-bold mb-8">Find your next book.</h1>
      <form role="search" onSubmit={submit} className="flex border-b border-stone-500 mb-8 max-w-4xl">
        <input aria-label="Search books, titles, authors and ISBN" placeholder="Search titles, authors, subjects or ISBNs..."
          value={q} onChange={(e) => setQ(e.target.value)}
          className="bg-transparent flex-1 py-4 text-lg md:text-2xl placeholder:text-stone-500 outline-none min-w-0" />
        <button type="submit" className="px-4 text-2xl" aria-label="Search">⌕</button>
      </form>
      <div className="flex flex-wrap gap-3 mb-8">
        <select aria-label="Filter by category" value={params.get('category') || ''}
          onChange={(e) => modify('category', e.target.value)} className="catalogue-select">
          <option value="">All subjects</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select aria-label="Filter by format" value={params.get('format') || ''}
          onChange={(e) => modify('format', e.target.value)} className="catalogue-select">
          <option value="">All formats</option>
          <option value="paperback">Paperback</option>
          <option value="hardcover">Hardcover</option>
        </select>
        <select aria-label="Sort books" value={params.get('sort') || 'relevance'}
          onChange={(e) => modify('sort', e.target.value)} className="catalogue-select">
          <option value="relevance">Relevance / Newest</option>
          <option value="newest">Newest</option>
          <option value="title_asc">Title A–Z</option>
          <option value="title_desc">Title Z–A</option>
        </select>
        {params.get('author') && <button type="button" onClick={() => modify('author', '')}
          className="px-4 border border-accent rounded-full text-sm">Author: {authorName} ×</button>}
        {query && <button type="button" onClick={() => setParams({})} className="text-sm underline underline-offset-4">Clear filters</button>}
      </div>
      <div className="flex justify-between text-sm text-stone-400 mb-6" role="status">
        <span>{loading ? 'Searching books…' : `${data.meta.total} ${data.meta.total === 1 ? 'book' : 'books'} found`}</span>
        <span>Prices are for information only</span>
      </div>
      {data.data.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12">
          {data.data.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      ) : <div className="py-14 text-center bg-panel-dark rounded-sm">
        <h2 className="text-2xl font-semibold">No matching books found</h2>
        <p className="text-stone-400 mt-2">Try a different keyword or clear the current filters.</p>
      </div>}
      {!data.data.length && !!data.relatedBooks?.length && <section className="pt-12">
        <h2 className="text-2xl font-bold mb-6">You may also like</h2>
        <p className="text-stone-400 mb-5">These are suggestions, not exact matches to your search.</p>
        <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
          {data.relatedBooks.map((book) => (
            <div
              key={book.id}
              className="flex-none w-fit"
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </section>}
      {data.meta.totalPages > 1 && <nav aria-label="Pages" className="mt-12 flex gap-3">
        {Array.from({ length: Math.min(10, data.meta.totalPages) }, (_, i) => i + 1).map((page) =>
          <button type="button" className="shelf-arrow" key={page} aria-current={page === data.meta.page}
            onClick={() => modify('page', String(page))}>{page}</button>)}
      </nav>}
      <div className="mt-12 text-sm text-stone-500">Looking for a particular author? Click an author's name on a book details page to see all their titles.</div>
      <Link className="sr-only" to="/">Home</Link>
    </div>
  );
}
