
import { Link } from 'react-router-dom';
import { useRef, type MouseEvent } from 'react';
import type { Book } from '../lib/api';

const MAX_COVER_WIDTH = 215;
const MAX_COVER_HEIGHT = 320;

export function BookCover({
  book,
  className = '',
}: {
  book: Book;
  className?: string;
}) {
  const image = book.coverImage?.url;

  if (image && !book.isDemo) {
    return (
      <img
        src={image}
        alt={book.coverImage?.altText || `Cover of ${book.title}`}
        loading="lazy"
        decoding="async"
        className={`
          block
          w-auto
          h-auto
          max-w-[215px]
          max-h-[320px]
          object-contain
          ${className}
        `}
      />
    );
  }

  // Demo books retain a standard portrait cover.
  return (
    <div
      className={`demo-cover ${className}`}
      style={{
        width: MAX_COVER_WIDTH,
        height: MAX_COVER_HEIGHT,
        background: `linear-gradient(155deg, ${
          image || '#3d4e65'
        }, #19191e 96%)`,
      }}
    >
      <span className="demo-cover-imprint">
        HOWACADEMICS
      </span>

      <span
        className="demo-cover-symbol"
        aria-hidden="true"
      >
        ✦
      </span>

      <strong>{book.title}</strong>

      <span className="demo-cover-author">
        {book.authors.map((a) => a.name).join(' · ')}
      </span>
    </div>
  );
}


export default function BookCard({
  book,
  onSelect,
  isSelected = false,
}: {
  book: Book;
  onSelect?: (
    book: Book,
    coverElement: HTMLDivElement
  ) => void;
  isSelected?: boolean;
}) {
  const coverRef = useRef<HTMLDivElement>(null);

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      onSelect &&
      coverRef.current &&
      window.matchMedia('(min-width: 1024px)').matches &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();

      onSelect(book, coverRef.current);
    }
  };

  return (
    <article
      className={`
        group
        inline-flex flex-col items-start
        min-w-0 max-w-[215px]
        ${isSelected ? 'relative z-[80]' : ''}
      `}
    >
      <Link
        to={`/books/${book.slug}`}
        onClick={open}
        className="
          inline-flex flex-col items-start
          max-w-[215px]
          rounded-sm
          focus-visible:outline-2
          focus-visible:outline-accent
        "
      >
        {/* ORIGINAL BOOK COVER */}
        <div
          ref={coverRef}
          className="
            inline-block
            w-fit h-fit
            max-w-[215px]
            max-h-[320px]
            overflow-hidden
          "
        >
          <BookCover book={book} />
        </div>

        {/* BOOK TITLE */}
        <h3
          className={`
            w-full
            font-semibold text-sm md:text-base
            mt-3 leading-snug break-words
            group-hover:text-accent
            transition-colors
            ${isSelected ? 'opacity-0' : ''}
          `}
        >
          {book.title}
        </h3>
      </Link>

      {/* AUTHORS */}
      <div
        className={`
          text-xs text-stone-400 mt-1
          break-words
          ${isSelected ? 'opacity-0' : ''}
        `}
      >
        {book.authors.map((a) => a.name).join(', ')}
      </div>

      {book.isDemo && (
        <span
          className={`
            text-[10px]
            tracking-widest
            text-stone-500 uppercase
            ${isSelected ? 'opacity-0' : ''}
          `}
        >
          Demo book
        </span>
      )}
    </article>
  );
}

