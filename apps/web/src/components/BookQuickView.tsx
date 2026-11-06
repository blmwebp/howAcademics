
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import type { Book } from '../lib/api';
import { shortDate } from '../lib/api';

/* ---------------------------------------
   TYPES
--------------------------------------- */

type QuickViewProps = {
  book: Book;
  coverElement: HTMLElement;
  onClose: () => void;
};

type PopupLayout = {
  top: number;
  left: number;
  width: number;
  height: number;
  contentLeft: number;
  contentWidth: number;
};

/* ---------------------------------------
   CONFIGURATION
--------------------------------------- */

const POPUP_WIDTH = 800;
const POPUP_HEIGHT = 440;

const VIEWPORT_GUTTER = 16;
const COVER_PADDING = 40;
const CONTENT_GAP = 40;

/* ---------------------------------------
   HELPERS
--------------------------------------- */

function clamp(
  value: number,
  minimum: number,
  maximum: number
) {
  return Math.max(
    minimum,
    Math.min(value, maximum)
  );
}

/* ---------------------------------------
   CALCULATE POPUP POSITION
--------------------------------------- */

function getPopupLayout(
  coverElement: HTMLElement
): PopupLayout {
  const rect = coverElement.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const width = Math.min(
    POPUP_WIDTH,
    viewportWidth - VIEWPORT_GUTTER * 2
  );

  const height = Math.min(
    POPUP_HEIGHT,
    viewportHeight - VIEWPORT_GUTTER * 2
  );

  // Determine whether selected cover is on
  // the left or right half of the screen.
  const coverCenterX = rect.left + rect.width / 2;

  const coverOnLeft =
    coverCenterX < viewportWidth / 2;

  /* ---------------------------------------
     POSITION THE UNIFIED BLACK FRAME
  --------------------------------------- */

  let left: number;

  if (coverOnLeft) {
    // Frame extends to the right of the cover
    left = rect.left - COVER_PADDING;
  } else {
    // Frame extends to the left of the cover
    left = rect.right + COVER_PADDING - width;
  }

  left = clamp(
    left,
    VIEWPORT_GUTTER,
    viewportWidth - width - VIEWPORT_GUTTER
  );

  // Align frame vertically with existing cover
  let top =
    rect.top + rect.height / 2 - height / 2;

  top = clamp(
    top,
    VIEWPORT_GUTTER,
    viewportHeight - height - VIEWPORT_GUTTER
  );

  /* ---------------------------------------
     INFORMATION COLUMN POSITION
  --------------------------------------- */

  let contentLeft: number;
  let contentWidth: number;

  if (coverOnLeft) {
    // Cover on left, details on right
    contentLeft =
      rect.right + CONTENT_GAP - left;

    const contentRight = width - 32;

    contentWidth = Math.max(
      0,
      contentRight - contentLeft
    );
  } else {
    // Cover on right, details on left
    contentLeft = 32;

    const contentRight =
      rect.left - CONTENT_GAP - left;

    contentWidth = Math.max(
      0,
      contentRight - contentLeft
    );
  }

  return {
    top,
    left,
    width,
    height,
    contentLeft,
    contentWidth,
  };
}

/* ---------------------------------------
   COMPONENT
--------------------------------------- */

export default function BookQuickView({
  book,
  coverElement,
  onClose,
}: QuickViewProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] =
    useState<PopupLayout | null>(null);

  /* ---------------------------------------
     POSITION AND RESIZE HANDLING
  --------------------------------------- */

  
useLayoutEffect(() => {
  if (window.innerWidth < 1024) {
    onClose();
    return;
  }

  // Record the original cover position
  let originalCoverRect =
    coverElement.getBoundingClientRect();

  // Calculate the initial popup position
  let originalLayout =
    getPopupLayout(coverElement);

  setLayout(originalLayout);

  let animationFrame = 0;

  // Make popup follow the original cover
  const followCover = () => {
    cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(() => {
      const currentRect =
        coverElement.getBoundingClientRect();

      const movementX =
        currentRect.left - originalCoverRect.left;

      const movementY =
        currentRect.top - originalCoverRect.top;

      setLayout({
        ...originalLayout,
        left: originalLayout.left + movementX,
        top: originalLayout.top + movementY,
      });
    });
  };

  // Recalculate positioning on viewport resize
  const handleResize = () => {
    if (window.innerWidth < 1024) {
      onClose();
      return;
    }

    cancelAnimationFrame(animationFrame);

    originalCoverRect =
      coverElement.getBoundingClientRect();

    originalLayout =
      getPopupLayout(coverElement);

    setLayout(originalLayout);
  };

  // Capture scroll events from both the page
  // and horizontally scrolling book shelves
  window.addEventListener(
    'scroll',
    followCover,
    true
  );

  window.addEventListener(
    'resize',
    handleResize
  );

  return () => {
    window.removeEventListener(
      'scroll',
      followCover,
      true
    );

    window.removeEventListener(
      'resize',
      handleResize
    );

    cancelAnimationFrame(animationFrame);
  };
}, [coverElement, onClose]);


  /* ---------------------------------------
     KEYBOARD AND SCROLL HANDLING
  --------------------------------------- */

  useEffect(() => {
  const previouslyFocused =
    document.activeElement as HTMLElement | null;

  closeRef.current?.focus({ preventScroll: true });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const handleOutsideClick = (event: PointerEvent) => {
    const target = event.target as HTMLElement;

    if (
      dialogRef.current?.contains(target) ||
      coverElement.contains(target)
    ) {
      return;
    }

    // Allow shelf interaction while popup is open
    if (
      target.closest('.shelf-scroll') ||
      target.closest('.shelf-arrow')
    ) {
      return;
    }

    onClose();
  };

  document.addEventListener(
    'keydown',
    handleKeyDown
  );

  document.addEventListener(
    'pointerdown',
    handleOutsideClick
  );

  return () => {
    document.removeEventListener(
      'keydown',
      handleKeyDown
    );

    document.removeEventListener(
      'pointerdown',
      handleOutsideClick
    );

    previouslyFocused?.focus({
      preventScroll: true,
    });
  };
}, [coverElement, onClose]);

  /* ---------------------------------------
     PORTAL
  --------------------------------------- */

  return createPortal(
    <>
      {/* BACKGROUND OVERLAY */}
      <div
        className="
        fixed inset-0
        z-[50]
        bg-black/55
        pointer-events-none"
        aria-hidden="true"
      />

      {/* ---------------------------------------
          BLACK BACKGROUND FRAME

          This frame extends behind both the
          ORIGINAL cover and the information.

          No image is rendered here.
      --------------------------------------- */}

      {layout && (
        <div
          aria-hidden="true"
          className="
            fixed
            z-[60]
            bg-[#050505]
            shadow-2xl
            pointer-events-none
          "
          style={{
            top: layout.top,
            left: layout.left,
            width: layout.width,
            height: layout.height,
          }}
        />
      )}

      {/* ---------------------------------------
          POPUP CONTENT
      --------------------------------------- */}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Quick view: ${book.title}`}
        className={`
          fixed
          z-[90]
          pointer-events-none
          text-[#e5ded8]

          ${layout ? 'visible' : 'invisible'}
        `}
        style={
          layout
            ? {
                top: layout.top,
                left: layout.left,
                width: layout.width,
                height: layout.height,
              }
            : undefined
        }
      >

        {/* CLOSE BUTTON */}
        <button
          ref={closeRef}
          type="button"
          aria-label="Close quick view"
          onClick={onClose}
          className="
            absolute
            top-4 right-5
            z-10
            pointer-events-auto

            text-2xl
            leading-none
            text-stone-300

            hover:text-white
            transition-colors
          "
        >
          ×
        </button>

        {/* ---------------------------------------
            INFORMATION COLUMN
        --------------------------------------- */}

        {layout && (
          <div
            className="
              absolute
              flex flex-col
              pointer-events-auto
              overflow-hidden
            "
            style={{
              left: layout.contentLeft,
              width: layout.contentWidth,
              top: 40,
              bottom: 40,
            }}
          >

            {/* BOOK INFORMATION */}
            <div className="flex-1 min-h-0 overflow-hidden">

              {/* TITLE */}
              <h2
                className="
                  text-xl lg:text-2xl
                  font-semibold
                  leading-tight
                  mb-4
                  text-[#e5ded8]
                "
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {book.title}
              </h2>

              {/* AUTHORS */}
              <div
                className="
                  flex flex-wrap
                  gap-x-3 gap-y-1
                  mb-7
                  max-h-12
                  overflow-hidden
                "
              >
                {book.authors.map((author) => (
                  <Link
                    key={author.id}
                    to={`/books?author=${encodeURIComponent(
                      author.slug
                    )}`}
                    onClick={onClose}
                    className="
                      underline
                      underline-offset-4
                      text-[#e5ded8]
                      hover:text-accent
                      transition-colors
                    "
                  >
                    {author.name}
                  </Link>
                ))}
              </div>

              {/* PUBLICATION DATE */}
              <p className="
                font-semibold
                text-sm
                mb-3
                text-[#e5ded8]
              ">
                {shortDate(book.publicationDate)}
              </p>

              {/* SHORT DESCRIPTION */}
              <p
                className="
                  font-serif
                  text-base lg:text-lg
                  text-stone-300
                  leading-relaxed
                "
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {book.shortDescription ||
                  'Discover the complete details of this academic title.'}
              </p>

            </div>

            {/* ---------------------------------------
                LEARN MORE
            --------------------------------------- */}

            <div className="
              mt-auto
              pt-6
              flex justify-end
              shrink-0
            ">
              <Link
                to={`/books/${book.slug}`}
                onClick={onClose}
                className="
                  font-semibold
                  text-[#e5ded8]
                  hover:text-white
                  transition-colors
                "
              >
                Learn more
                <span aria-hidden="true"> →</span>
              </Link>
            </div>

          </div>
        )}

      </div>
    </>,
    document.body
  );
}
