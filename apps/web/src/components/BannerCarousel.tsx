import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Banner } from '../lib/api';

type BannerCarouselProps = {
  banners: Banner[];
};

const AUTO_PLAY_INTERVAL = 3000;

export default function BannerCarousel({
  banners,
}: BannerCarouselProps) {
  const [active, setActive] = useState(0);

  const [paused, setPaused] = useState(false);

  const [reducedMotion, setReducedMotion] =
    useState(false);

  /* =========================================
     REDUCED MOTION
  ========================================= */

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener(
      'change',
      updatePreference
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updatePreference
      );
    };
  }, []);

  /* =========================================
     KEEP INDEX VALID
  ========================================= */

  useEffect(() => {
    if (active >= banners.length) {
      setActive(0);
    }
  }, [active, banners.length]);

  /* =========================================
     AUTO PLAY
  ========================================= */

  useEffect(() => {
    if (banners.length <= 1 || paused) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;

      setActive((previous) =>
        (previous + 1) % banners.length
      );
    }, AUTO_PLAY_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length, paused]);

  /* =========================================
     MANUAL NAVIGATION
  ========================================= */

  const goToSlide = (index: number) => {
    if (index === active) return;

    setActive(index);
  };

  if (!banners.length) return null;

  return (
    <section
      id="home-banner"
      aria-label="Featured books and topics"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null
          )
        ) {
          setPaused(false);
        }
      }}
      className="
        relative
        w-full
        h-[600px]
        sm:h-[650px]
        lg:h-[720px]
        overflow-hidden
        bg-[#1D1A1C]
      "
    >
      {/* =====================================
          BANNER SLIDES
      ===================================== */}

      {banners.map((banner, index) => {
        const isActive = index === active;

        return (
          <div
            key={banner.id}
            aria-hidden={!isActive}
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${banners.length}`}
            className={`
              banner-slide
              absolute
              inset-0
              w-full
              h-full

              ${
                isActive
                  ? 'banner-slide-active'
                  : 'banner-slide-inactive'
              }
            `}
          >
            {/* =================================
                BACKGROUND IMAGE
            ================================= */}

           {/* =====================================
    RESPONSIVE BANNER IMAGE
===================================== */}

            {banner.image?.url ? (
              <picture
                className={`
                banner-background
                absolute
                inset-0
                block
                w-full
                h-full
                ${isActive
                    ? 'banner-background-active'
                    : ''
                  }
                `}
              >
                {/* MOBILE BANNER */}

                {banner.mobileImage?.url && (
                  <source
                    media="(max-width: 767px)"
                    srcSet={banner.mobileImage.url}
                  />
                )}

                {/* DESKTOP BANNER */}

                <img
                  src={banner.image.url}
                  alt={
                    banner.image.altText ||
                    banner.headline ||
                    'HowAcademics featured banner'
                  }
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  className="
        block
        w-full
        h-full
        object-cover
        object-center
      "
                />
              </picture>
            ) : (
              <div
                className="
                absolute
                inset-0
                bg-gradient-to-br
                from-[#35243D]
                via-[#242027]
                to-[#111013]
    "
              />
            )}

            {/* =================================
                IMAGE OVERLAY
            ================================= */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-black/75
                via-black/45
                to-black/15
              "
            />

            {/* SUBTLE BOTTOM GRADIENT */}

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/35
                via-transparent
                to-black/10
              "
            />

            {/* =================================
                CONTENT
            ================================= */}

            <div
              className="
                container-content
                relative
                z-10
                h-full
                flex
                items-center
                pt-[86px]
              "
            >
              <div
                className={`
                  banner-content
                  max-w-3xl
                  pb-8
                  ${
                    isActive
                      ? 'banner-content-active'
                      : ''
                  }
                `}
              >
                {/* EYEBROW */}

                <p
                  className="
                    uppercase
                    tracking-[0.28em]
                    text-[11px]
                    sm:text-xs
                    mb-5
                    text-[#DED4CC]
                    font-semibold
                  "
                >
                  HOWACADEMICS · BOOKS & IDEAS
                </p>

                {/* HEADING */}

                <h1
                  className="
                    font-bold
                    text-4xl
                    sm:text-5xl
                    lg:text-6xl
                    xl:text-7xl
                    leading-[1.08]
                    tracking-tight
                    !text-white
                    max-w-3xl
                  "
                >
                  {banner.headline}
                </h1>

                {/* CAPTION */}

                {banner.caption && (
                  <p
                    className="
                      mt-6
                      text-base
                      sm:text-lg
                      lg:text-xl
                      text-stone-200
                      leading-relaxed
                      max-w-xl
                    "
                  >
                    {banner.caption}
                  </p>
                )}

                {/* CTA */}

                <Link
                  to={banner.targetIdOrUrl || '/books'}
                  tabIndex={isActive ? 0 : -1}
                  className="
                    inline-flex
                    items-center
                    gap-3
                    mt-8
                    bg-white
                    !text-[#1D1A1C]
                    px-7
                    py-3.5
                    rounded-sm
                    text-sm
                    font-semibold
                    transition-all
                    duration-300
                    hover:bg-[#D5B48A]
                    hover:!text-[#1D1A1C]
                    hover:-translate-y-0.5
                  "
                >
                  Explore books

                  <span aria-hidden="true">
                    ↗
                  </span>
                </Link>

                {/* DEMO INDICATOR */}

                {banner.isDemo && (
                  <span
                    className="
                      block
                      mt-4
                      text-xs
                      text-stone-300/70
                    "
                  >
                    Illustrative banner · Replace in Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* =====================================
          PAGINATION
      ===================================== */}

      {banners.length > 1 && (
        <div
          className="
            absolute
            bottom-8
            left-1/2
            -translate-x-1/2
            z-20
            flex
            items-center
            gap-3
          "
          aria-label="Banner navigation"
        >
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              aria-current={
                active === index ? 'true' : undefined
              }
              onClick={() => goToSlide(index)}
              className="
                group
                flex
                items-center
                justify-center
                h-6
                px-0.5
              "
            >
              <span
                className={`
                  block
                  h-[3px]
                  rounded-full
                  transition-all
                  duration-500
                  ease-in-out

                  ${
                    active === index
                      ? 'w-10 bg-white'
                      : 'w-4 bg-white/40 group-hover:bg-white/75'
                  }
                `}
              />
            </button>
          ))}
        </div>
      )}

      {/* =====================================
          SIDE DECORATION
      ===================================== */}

      <div
        className="
          absolute
          bottom-8
          right-8
          z-20
          hidden
          lg:block
          text-white/60
          text-xs
          tracking-[0.2em]
        "
      >
        {String(active + 1).padStart(2, '0')}
        <span className="mx-2">/</span>
        {String(banners.length).padStart(2, '0')}
      </div>

      {/* ANNOUNCEMENT FOR SCREEN READERS */}

      <span
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {reducedMotion ? '' : ''}
      </span>
    </section>
  );
}