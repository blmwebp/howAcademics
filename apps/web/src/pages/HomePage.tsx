import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';
import BookQuickView from '../components/BookQuickView';
import BannerCarousel from '../components/BannerCarousel';
import { apiGet, type Book, type HomeData } from '../lib/api';
import { demoHome } from '../lib/demo';

export default function HomePage() {
  type SelectedBook = {
  book: Book;
  coverElement: HTMLDivElement;
};

  const [selected, setSelected] = useState<SelectedBook | null>(null);
  const [data, setData] = useState<HomeData>(demoHome);
  const shelfScroll = useRef<Record<string, HTMLDivElement | null>>({});
  const close = useCallback(() => setSelected(null), []);
  useEffect(() => {
    let live = true;
    apiGet<HomeData>('/home').then((value) => {
      if (!live) return;
      setData({
        banners: value.configuredBanners ? value.banners : demoHome.banners,
        categorySections: value.configuredSections || value.hasPublishedBooks
          ? value.categorySections : demoHome.categorySections,
      });
    }).catch(() => undefined);
    return () => { live = false; };
  }, []);
  return (
    <>
      <BannerCarousel banners={data.banners} />
      <div className="container-content pt-14 pb-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            <p className="uppercase text-xs text-accent tracking-[.25em] mb-2">The collection</p>
            <h2 className="text-3xl md:text-4xl font-bold">Explore our books</h2>
          </div>
          <Link to="/books" className="text-sm font-semibold border-b border-accent pb-1">View all books ↗</Link>
        </div>
        <p className="text-stone-400">Discover books by subject, or find a title by author and keyword.</p>
      </div>
      {data.categorySections.map((section) => (
        <section key={section.id} className="container-content py-10" aria-label={section.titleOverride || section.category.name}>
          <div className="flex justify-between items-center mb-6">
            <Link to={`/books?category=${encodeURIComponent(section.category.slug)}`}
              className="text-2xl font-semibold hover:text-accent">{section.titleOverride || section.category.name} <span className="text-accent">›</span></Link>
            <div className="hidden sm:flex gap-3">
              <button type="button" aria-label={`Scroll ${section.category.name} left`} onClick={() =>
                shelfScroll.current[section.id]?.scrollBy({ left: -520, behavior: 'smooth' })}
                className="shelf-arrow">←</button>
              <button type="button" aria-label={`Scroll ${section.category.name} right`} onClick={() =>
                shelfScroll.current[section.id]?.scrollBy({ left: 520, behavior: 'smooth' })}
                className="shelf-arrow">→</button>
            </div>
          </div>
          <div ref={(node) => { shelfScroll.current[section.id] = node; }}
            className="shelf-scroll flex gap-5 lg:gap-7 overflow-x-auto pb-5 snap-x snap-mandatory">
            {section.books.map((book) => 
              <div
                key={book.id}
                className="flex-none w-fit snap-start"
              >
                <BookCard
                  book={book}
                  isSelected={selected?.book.id === book.id}
                  onSelect={(selectedBook, coverElement) => {
                    setSelected({
                      book: selectedBook,
                      coverElement,
                    });
                  }}
                />
              </div>
            )}
          </div>
        </section>
      ))}
      {selected && (
        <BookQuickView
          book={selected.book}
          coverElement={selected.coverElement}
          onClose={close}
        />
      )}
    </>
  );
}
