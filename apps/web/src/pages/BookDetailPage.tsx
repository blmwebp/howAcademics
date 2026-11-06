import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import BookCard, { BookCover } from '../components/BookCard';

import {
  apiGet,
  money,
  shortDate,
  type Book,
} from '../lib/api';

import { demoBooks } from '../lib/demo';

/* =========================================================
   TYPES
========================================================= */

type TocSection = {
  title: string;
  items: string[];
  expandable: boolean;
};
/* =========================================================
   HELPERS
========================================================= */

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
  };

  return languages[code.toLowerCase()] || code;
}

function getFormatName(format: string): string {
  const names: Record<string, string> = {
    paperback: 'Paperback',
    hardcover: 'Hardcover',
  };

  return (
    names[format.toLowerCase()] ||
    format.charAt(0).toUpperCase() + format.slice(1)
  );
}

/* =========================================================
   PARSE TABLE OF CONTENTS

   Supports text such as:

   **Chapter 1: Introduction**
   1.1 Meaning of Research
   1.2 Objectives

   **Chapter 2: Methodology**
   2.1 Research Design
========================================================= */

function parseTableOfContents(text: string): TocSection[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  const sections: TocSection[] = [];

  let currentSection: TocSection | null = null;

  for (const line of lines) {
    const cleaned = line
      .trim()
      .replace(/^#{1,6}\s*/, '')
      .replace(/^\*{1,2}/, '')
      .replace(/\*{1,2}$/, '')
      .trim();

    if (!cleaned) continue;

    // Chapter heading
    if (/^Chapter\s+\d+\s*:/i.test(cleaned)) {
      currentSection = {
        title: cleaned,
        items: [],
        expandable: true,
      };

      sections.push(currentSection);
      continue;
    }

    // Appendices heading
    if (/^Appendices$/i.test(cleaned)) {
      currentSection = {
        title: 'Appendices',
        items: [],
        expandable: true,
      };

      sections.push(currentSection);
      continue;
    }

    // Appendix items belong to the Appendices section
    if (/^Appendix\s+[A-Z]\s*:/i.test(cleaned)) {
      let appendices = sections.find(
        (section) => section.title === 'Appendices'
      );

      if (!appendices) {
        appendices = {
          title: 'Appendices',
          items: [],
          expandable: true,
        };

        sections.push(appendices);
      }

      appendices.items.push(cleaned);
      currentSection = appendices;
      continue;
    }

    // Standalone entries
    if (/^(Glossary|References|Bibliography|Index)$/i.test(cleaned)) {
      sections.push({
        title: cleaned,
        items: [],
        expandable: false,
      });

      currentSection = null;
      continue;
    }

    // Regular chapter subsections
    if (currentSection) {
      currentSection.items.push(cleaned);
    }
  }

  return sections;
}

/* =========================================================
   MARKDOWN CONTENT RENDERER
========================================================= */

function BookMarkdown({ content }: { content: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-2xl font-bold mt-8 mb-4 text-stone-100">
              {children}
            </h3>
          ),

          h2: ({ children }) => (
            <h3 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-stone-100">
              {children}
            </h3>
          ),

          h3: ({ children }) => (
            <h4 className="text-lg md:text-xl font-semibold mt-6 mb-3 text-stone-100">
              {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="mb-6 font-serif text-base md:text-lg leading-[1.85] text-stone-300">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-bold text-stone-100">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="italic text-stone-200">
              {children}
            </em>
          ),

          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-6 space-y-2 text-stone-300">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-stone-300">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#b99567] pl-5 my-6 italic text-stone-300">
              {children}
            </blockquote>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              className="!text-[#d8b88c] underline underline-offset-4 hover:!text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* =========================================================
   BOOK COVER
========================================================= */

function DetailBookCover({ book }: { book: Book }) {
  const imageUrl = book.coverImage?.url;

  return (
    <div className="flex flex-col items-center lg:items-start">
      <div
        className="
          inline-flex
          items-start
          justify-center
          w-fit
          max-w-full
        "
      >
        {imageUrl && !book.isDemo ? (
          <img
            src={imageUrl}
            alt={
              book.coverImage?.altText ||
              `Cover of ${book.title}`
            }
            loading="eager"
            className="
              block
              w-auto
              h-auto
              max-w-full
              max-h-[450px]
              object-contain
              shadow-2xl
            "
          />
        ) : (
          <div className="w-[215px] max-w-full">
            <BookCover book={book} />
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   BOOK FORMATS
========================================================= */

function BookFormats({ book }: { book: Book }) {
  const formats = book.formats || [];

  // Do not display anything when no format is configured.
  if (formats.length === 0) return null;

  return (
    <section
      className="mt-7 pt-6 border-t border-[#d4cec8]"
      aria-label="Available book formats and prices"
    >
      <h2 className="text-lg md:text-xl font-bold mb-4">
        Formats & prices
      </h2>

      <div className="grid sm:grid-cols-2 gap-3">
        {formats.map((format) => (
          <div
            key={format.format}
            className="
              border
              border-[#d0c8c2]
              bg-white/40
              rounded-sm
              p-4
              transition-colors
              hover:bg-white/70
            "
          >
            <p className="text-sm font-semibold text-[#574b46]">
              {getFormatName(format.format)}
            </p>

            <p className="text-xl md:text-2xl font-bold text-[#272325] mt-2">
              {money(format.priceMinor, format.currency)}
            </p>

            {format.isbn && (
              <p className="text-xs text-[#756d68] mt-2 break-words">
                ISBN: {format.isbn}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-[#786f69] mt-4">
        Prices are provided for reference only.
        Online purchasing is not available.
      </p>
    </section>
  );
}

/* =========================================================
   TABLE OF CONTENTS
========================================================= */

function BookTableOfContents({
  content,
}: {
  content: string;
}) {
  const sections = useMemo(
    () => parseTableOfContents(content),
    [content]
  );

  if (!sections.length) return null;

  return (
    <section className="mt-14">

      {/* SECTION HEADING */}

      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#b99567] mb-3">
          Inside the book
        </p>

        <h2 className="text-2xl md:text-3xl font-bold">
          Table of contents
        </h2>
      </div>

      {/* CONTENTS */}

      <div className="border-t border-white/15">

        {sections.map((section, index) => {

          // Standalone entries without subsections
          if (!section.expandable) {
            return (
              <div
                key={`${section.title}-${index}`}
                className="
                  py-5
                  border-b
                  border-white/15
                "
              >
                <h3 className="text-base md:text-lg font-semibold text-stone-200">
                  {section.title}
                </h3>
              </div>
            );
          }

          // Expandable chapters and appendices
          return (
            <details
              key={`${section.title}-${index}`}
              className="
                group
                border-b
                border-white/15
              "
            >
              <summary
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  py-5
                  cursor-pointer
                  list-none
                  [&::-webkit-details-marker]:hidden
                "
              >
                <span
                  className="
                    text-base
                    md:text-lg
                    font-semibold
                    text-stone-200
                    group-hover:text-white
                    transition-colors
                  "
                >
                  {section.title}
                </span>

                {/* PLUS / MINUS ICON */}

                <span
                  className="
                    text-xl
                    font-light
                    text-[#b99567]
                    shrink-0
                    transition-transform
                  "
                  aria-hidden="true"
                >
                  <span className="group-open:hidden">
                    +
                  </span>

                  <span className="hidden group-open:inline">
                    −
                  </span>
                </span>
              </summary>

              {/* CHAPTER CONTENT */}

              {section.items.length > 0 && (
                <div className="pb-6 pt-1">

                  <ul className="space-y-3">

                    {section.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="
                          border-l-2
                          border-[#b99567]/30
                          pl-4
                          py-1
                          text-sm
                          md:text-base
                          leading-relaxed
                          text-stone-400
                        "
                      >
                        {item}
                      </li>
                    ))}

                  </ul>

                </div>
              )}

            </details>
          );
        })}

      </div>
    </section>
  );
}

/* =========================================================
   BOOK INFORMATION SIDEBAR
========================================================= */

function BookInformation({ book }: { book: Book }) {
  const hasPages = book.pageCount != null;
  const hasLanguage = Boolean(book.language);
  const hasCategories = book.categories.length > 0;

  if (!hasPages && !hasLanguage && !hasCategories) {
    return null;
  }

  return (
    <aside className="w-full self-start">
      <div className="border border-white/15 rounded-sm p-6">
        <h3 className="text-xl font-semibold mb-6">
          Book information
        </h3>

        <dl className="space-y-5">
          {hasPages && (
            <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
              <dt className="text-sm text-stone-400">
                Pages
              </dt>

              <dd className="text-sm font-medium text-stone-200">
                {book.pageCount}
              </dd>
            </div>
          )}

          {hasLanguage && (
            <div className="flex justify-between gap-4 border-b border-white/10 pb-4">
              <dt className="text-sm text-stone-400">
                Language
              </dt>

              <dd className="text-sm font-medium text-stone-200">
                {getLanguageName(book.language!)}
              </dd>
            </div>
          )}
        </dl>

        {hasCategories && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-4 text-stone-200">
              Subjects
            </h4>

            <div className="flex flex-wrap gap-2">
              {book.categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/books?category=${encodeURIComponent(
                    category.slug
                  )}`}
                  className="
                    !text-stone-200
                    text-sm
                    bg-white/10
                    px-3
                    py-2
                    capitalize
                    rounded-sm
                    transition-colors
                    hover:!text-white
                    hover:bg-white/20
                  "
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* =========================================================
   MAIN BOOK DETAIL PAGE
========================================================= */

export default function BookDetailPage() {
  const { slug = '' } = useParams();

  const [book, setBook] = useState<Book | null>(
    demoBooks.find((item) => item.slug === slug) || null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;

    const demoBook =
      demoBooks.find((item) => item.slug === slug) || null;

    setBook(demoBook);
    setLoading(true);

    apiGet<Book>(
      '/books/' + encodeURIComponent(slug)
    )
      .then((data) => {
        if (live) {
          setBook(data);
        }
      })
      .catch(() => {
        // Retain demo data when applicable.
      })
      .finally(() => {
        if (live) {
          setLoading(false);
        }
      });

    return () => {
      live = false;
    };
  }, [slug]);

  /* ---------------- LOADING ---------------- */

  if (loading && !book) {
    return (
      <div
        className="container-content py-20"
        role="status"
      >
        Loading book details…
      </div>
    );
  }

  /* ---------------- NOT FOUND ---------------- */

  if (!book) {
    return (
      <div className="container-content py-20">
        <h1 className="text-3xl font-bold">
          Book not found
        </h1>

        <Link
          to="/books"
          className="underline mt-5 inline-block"
        >
          Browse all books
        </Link>
      </div>
    );
  }

  const description =
    book.description || book.shortDescription || '';

  return (
    <div className="container-content pt-8 md:pt-10 pb-20">

      {/* =====================================
          BREADCRUMB
      ===================================== */}

      <nav
        className="
          flex
          flex-wrap
          items-center
          gap-2
          text-sm
          text-stone-400
          mb-8 md:mb-12
        "
        aria-label="Breadcrumb"
      >
        <Link
          to="/"
          className="!text-stone-300 hover:!text-white"
        >
          Home
        </Link>

        <span>/</span>

        <Link
          to="/books"
          className="!text-stone-300 hover:!text-white"
        >
          Books
        </Link>

        <span>/</span>

        <span className="text-stone-500 break-words">
          {book.title}
        </span>
      </nav>

      {/* =====================================
          MAIN BOOK HERO
      ===================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]
          gap-8
          lg:gap-12
          items-start
        "
      >

        {/* BOOK COVER */}

        <div className="flex justify-center lg:justify-start">
          <DetailBookCover book={book} />
        </div>

        {/* BOOK DETAILS PANEL */}

        <article
          className="
            bg-[#eeebe7]
            text-[#272325]
            rounded-sm
            p-6
            sm:p-8
            lg:p-10
            min-w-0
          "
        >

          {/* EYEBROW */}

          <p
            className="
              uppercase
              tracking-[0.2em]
              text-[11px]
              font-semibold
              text-[#82736a]
              mb-4
            "
          >
            HowAcademics · Book details
          </p>

          {/* TITLE */}

          <h1
            className="
              text-3xl
              md:text-4xl
              xl:text-5xl
              font-bold
              leading-[1.15]
              tracking-tight
              break-words
            "
          >
            {book.title}
          </h1>

          {/* SUBTITLE */}

          {book.subtitle && (
            <p className="text-lg md:text-xl text-[#74675f] mt-3 leading-relaxed">
              {book.subtitle}
            </p>
          )}

          {/* AUTHORS */}

          {book.authors.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-[#82736a] mb-2">
                {book.authors.length === 1
                  ? 'Author'
                  : 'Authors'}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {book.authors.map((author) => (
                  <Link
                    key={author.id}
                    to={`/books?author=${encodeURIComponent(
                      author.slug
                    )}`}
                    className="
                      !text-[#35243d]
                      font-semibold
                      underline
                      underline-offset-4
                      decoration-[#9c8e93]
                      transition-colors
                      hover:!text-[#a0784d]
                    "
                  >
                    {author.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* PUBLICATION INFORMATION */}

          {(book.publicationDate || book.publisherName) && (
            <p className="text-sm text-[#756c67] mt-5">
              {book.publicationDate
                ? shortDate(book.publicationDate)
                : ''}

              {book.publicationDate && book.publisherName
                ? ' · '
                : ''}

              {book.publisherName || ''}
            </p>
          )}

          {/* SHORT DESCRIPTION */}

          {book.shortDescription && (
            <div className="mt-7 pt-6 border-t border-[#d4cec8]">
              <p className="font-serif text-base md:text-lg leading-[1.75] text-[#423a36]">
                {book.shortDescription}
              </p>
            </div>
          )}

          {/* FORMATS */}

          <BookFormats book={book} />

          {/* FLYER */}

          <div className="mt-8">
            {!book.isDemo ? (
              <a
                href={`/api/v1/public/books/${encodeURIComponent(
                  book.slug
                )}/flyer`}
                download
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-3
                  bg-[#35243d]
                  !text-white
                  px-6
                  py-3.5
                  text-sm
                  font-semibold
                  rounded-sm
                  transition-colors
                  hover:bg-[#51395a]
                  hover:!text-white
                  text-center
                "
              >
                <span>Download product flyer (PDF)</span>

                <span aria-hidden="true">↓</span>
              </a>
            ) : (
              <div
                className="
                  text-sm
                  text-[#6f625b]
                  border
                  border-[#d4cec8]
                  rounded-sm
                  px-4
                  py-3
                "
              >
                The downloadable product flyer will be
                available once this book is added to the
                database.
              </div>
            )}
          </div>

          {/* DEMO NOTICE */}

          {book.isDemo && (
            <p className="text-xs text-[#82736a] mt-4">
              This is illustrative content, not a published
              HowAcademics title.
            </p>
          )}
        </article>
      </div>

      {/* =====================================
          DESCRIPTION + INFORMATION
      ===================================== */}

      <div
        className="
          mt-16 md:mt-20
          grid
          grid-cols-1
          lg:grid-cols-[minmax(0,1fr)_290px]
          gap-10
          lg:gap-16
          items-start
        "
      >

        {/* DESCRIPTION AND TOC */}

        <div className="min-w-0">

          {/* ABOUT BOOK */}

          {description && (
            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-[#b99567] mb-3">
                Discover the title
              </p>

              <h2 className="text-2xl md:text-3xl font-bold mb-7">
                About this book
              </h2>

              <BookMarkdown content={description} />
            </section>
          )}

          {/* TABLE OF CONTENTS */}

          {book.tableOfContents && (
            <BookTableOfContents
              content={book.tableOfContents}
            />
          )}
        </div>

        {/* METADATA SIDEBAR */}

        <BookInformation book={book} />
      </div>

      {/* =====================================
          RELATED BOOKS
      ===================================== */}

      {!!book.relatedBooks?.length && (
        <section className="mt-16 md:mt-20">

          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#b99567] mb-3">
                Continue exploring
              </p>

              <h2 className="text-2xl md:text-3xl font-bold">
                Related books
              </h2>
            </div>

            <Link
              to="/books"
              className="text-sm font-semibold !text-stone-200 hover:!text-white"
            >
              View all books →
            </Link>
          </div>

          <div
            className="
              flex
              flex-wrap
              items-start
              gap-x-6
              gap-y-9
            "
          >
            {book.relatedBooks.map((related) => (
              <div
                key={related.id}
                className="
                  w-[calc(50%-12px)]
                  sm:w-[calc(33.333%-16px)]
                  lg:w-[calc(25%-18px)]
                  xl:w-[calc(20%-20px)]
                "
              >
                <BookCard book={related} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}