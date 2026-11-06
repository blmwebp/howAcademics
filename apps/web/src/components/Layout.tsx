import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Outlet, useNavigate, useLocation  } from 'react-router-dom';
import { apiGet } from '../lib/api';

const defaultLinks = [
  { label: 'Books', url: '/books' }, { label: 'About', url: '/about' }, { label: 'Contact', url: '/contact' },
];
interface Settings {
  siteName?: string; footerText?: string; contactEmail?: string;
  headerLinks?: Array<{ label: string; url: string }>;
}




export default function Layout() {
  const [settings, setSettings] = useState<Settings>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [menuHovered, setMenuHovered] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMenuExpanded = menuOpen || menuHovered;
  const [isOverBanner, setIsOverBanner] = useState(false);
  const shouldShowLogo =isOverBanner || isMenuExpanded;
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const closeMenu = () => {
  setMenuOpen(false);
  setMenuHovered(false);
};

useEffect(() => {
  let animationFrame = 0;

  const checkBannerPosition = () => {
    if (!isHomePage) {
      setIsOverBanner(false);
      return;
    }

    const banner = document.getElementById('home-banner');

    if (!banner) {
      setIsOverBanner(false);
      return;
    }

    const rect = banner.getBoundingClientRect();

    // Approximate height of the collapsed header.
    const headerHeight = 86;

    // The banner is underneath the header while its
    // bottom edge extends below the header area.
    const isBannerBehindHeader =
      rect.top < headerHeight &&
      rect.bottom > headerHeight;

    setIsOverBanner(isBannerBehindHeader);
  };

  const scheduleCheck = () => {
    cancelAnimationFrame(animationFrame);

    animationFrame = requestAnimationFrame(
      checkBannerPosition
    );
  };

  checkBannerPosition();

  window.addEventListener('scroll', scheduleCheck, {
    passive: true,
  });

  window.addEventListener('resize', scheduleCheck);

  return () => {
    cancelAnimationFrame(animationFrame);

    window.removeEventListener(
      'scroll',
      scheduleCheck
    );

    window.removeEventListener(
      'resize',
      scheduleCheck
    );
  };
}, [isHomePage]);
useEffect(() => {
  lastScrollY.current = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = Math.max(window.scrollY, 0);

    // Always display header near the top
    if (currentScrollY <= 80) {
      setIsHeaderVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    // Keep header visible when mobile menu is open
    if (menuOpen) {
      setIsHeaderVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    const scrollDifference = currentScrollY - lastScrollY.current;

    // Ignore small movements to prevent flickering
    if (Math.abs(scrollDifference) < 8) {
      return;
    }

    if (scrollDifference > 0) {
      // Scrolling down: hide header
      setIsHeaderVisible(false);
    } else {
      // Scrolling up: show header
      setIsHeaderVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  window.addEventListener('scroll', handleScroll, {
    passive: true,
  });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [menuOpen]);
  useEffect(() => {
    apiGet<Settings>('/site-settings').then(setSettings).catch(() => undefined);
  }, []);
  const submitSearch = (event: FormEvent) => {
    event.preventDefault(); navigate('/books?q=' + encodeURIComponent(search.trim())); setMenuOpen(false);
  };
  const links = (settings.headerLinks || defaultLinks).filter((item) =>
    item.label && item.url && item.url.startsWith('/') && !item.url.startsWith('//'));
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[90] focus:bg-white focus:p-3">Skip to content</a>
      
      
      <header
        className={`
                fixed
                top-0
                left-0
                right-0
                z-50
                w-full
                transition-[transform,background-color,box-shadow,border-color,backdrop-filter]
                duration-500
                ease-in-out
                will-change-transform
                motion-reduce:transition-none
                ${isMenuExpanded
                        ? `
                      bg-[#1D1A1C]/95
                      backdrop-blur-xl
                      border-b border-white/10
                      shadow-[0_8px_30px_rgba(0,0,0,0.25)]
                    `
                        : `
                      bg-transparent
                      backdrop-blur-none
                      border-b border-transparent
                      shadow-none
                    `
                      }
                ${isHeaderVisible || isMenuExpanded
                        ? 'translate-y-0'
                        : '-translate-y-full'
                      }
              `}
                  >
  {/* =========================================
      HEADER MAIN CONTAINER
  ========================================= */}

  <div
    className="
      container-content
      min-h-[86px]
      flex
      flex-nowrap
      items-center
      justify-between
      gap-4
    "
  >
   

          <Link
            to="/"
            onClick={closeMenu}
            aria-label="HowAcademics Home"
            tabIndex={shouldShowLogo ? 0 : -1}
            aria-hidden={!shouldShowLogo}
            className={`
    flex
    items-center
    shrink-0

    transition-all
    duration-500
    ease-in-out

    ${shouldShowLogo
                ? `
          opacity-100
          visible
          translate-x-0
          pointer-events-auto
        `
                : `
          opacity-0
          invisible
          -translate-x-5
          pointer-events-none
        `
              }
  `}
          >
            <img
              src="/logo_white.png"
              alt={settings.siteName || 'HowAcademics'}
              className="
      h-11
      lg:h-14
      w-auto
      max-w-[145px]
      lg:max-w-[185px]
      object-contain
    "
            />
          </Link>

    {/* =========================================
        RIGHT SIDE - NAVIGATION + MENU BUTTON
    ========================================= */}

    <div
      className="
        flex
        items-center
        justify-end
        flex-nowrap
        min-w-0
        ml-auto
      "
      onMouseEnter={() => {
        if (window.innerWidth >= 1024) {
          setMenuHovered(true);
        }
      }}
      onMouseLeave={() => {
        setMenuHovered(false);
      }}
    >
      {/* =========================================
          EXPANDABLE DESKTOP NAVIGATION
      ========================================= */}

      <div
        id="desktop-header-navigation"
        aria-hidden={!isMenuExpanded}
        className={`
          hidden
          lg:flex
          items-center
          justify-end
          flex-nowrap
          whitespace-nowrap
          overflow-hidden
          transition-all
          duration-500
          ease-in-out
          ${
            isMenuExpanded
              ? 'max-w-[1000px] opacity-100 mr-4 xl:mr-7'
              : 'max-w-0 opacity-0 mr-0 pointer-events-none'
          }
        `}
      >
        {/* NAVIGATION LINKS */}

        <nav
          aria-label="Main navigation"
          className="
            flex
            flex-nowrap
            items-center
            gap-4
            xl:gap-7
            shrink-0
          "
        >
          {links.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              onClick={closeMenu}
              tabIndex={isMenuExpanded ? 0 : -1}
              className="
                !text-white
                text-sm
                font-semibold
                whitespace-nowrap
                transition-colors
                duration-300
                hover:!text-[#D5B48A]
              "
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* SPACE BETWEEN LINKS AND SEARCH */}

        <div className="w-5 xl:w-8 shrink-0" />

        {/* =========================================
            DESKTOP SEARCH BOX
        ========================================= */}

        <form
          role="search"
          onSubmit={(event) => {
            submitSearch(event);
            closeMenu();
          }}
          className="
            flex
            flex-nowrap
            items-center
            shrink-0
            w-[175px]
            xl:w-[240px]
            h-11
            p-1
            gap-1
            rounded-full
            bg-white/10
            border
            border-white/20
            transition-all
            duration-300
            focus-within:border-white/50
            focus-within:ring-2
            focus-within:ring-white/10
          "
        >
          <input
            type="search"
            aria-label="Search books"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search books..."
            tabIndex={isMenuExpanded ? 0 : -1}
            className="
              flex-1
              min-w-0
              h-full
              px-3
              bg-transparent
              !text-white
              placeholder:!text-stone-400
              text-sm
              outline-none
              border-none
              focus:outline-none
            "
          />

          {/* SEARCH BUTTON */}

          <button
            type="submit"
            aria-label="Submit search"
            tabIndex={isMenuExpanded ? 0 : -1}
            className="
              flex
              items-center
              justify-center
              shrink-0
              h-9
              w-9
              p-0
              rounded-full
              bg-white
              !text-[#1D1A1C]
              hover:bg-[#D5B48A]
              transition-colors
              duration-300
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />

              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>
      </div>

      {/* =========================================
          MENU BUTTON - ALWAYS VISIBLE
      ========================================= */}

      <button
        type="button"
        aria-label={
          isMenuExpanded
            ? 'Close navigation menu'
            : 'Open navigation menu'
        }
        aria-expanded={isMenuExpanded}
        aria-controls="mobile-header-navigation"
        onClick={() => {
          setMenuOpen((previous) => !previous);
          setMenuHovered(false);
        }}
        className={`
          flex
          flex-nowrap
          items-center
          justify-center
          gap-3
          shrink-0
          h-11
          px-4
          lg:px-5
          rounded-full
          border
          font-semibold
          transition-all
          duration-300
          ${
            isMenuExpanded
              ? 'bg-[#D5B48A] border-[#D5B48A] !text-[#1D1A1C]'
              : 'bg-white border-white !text-[#1D1A1C]'
          }
          hover:bg-[#D5B48A]
          hover:!text-[#1D1A1C]
          hover:border-[#D5B48A]
        `}
      >
        <span className="text-sm tracking-wide">
          {isMenuExpanded ? 'Close' : 'Menu'}
        </span>

        {/* MENU ICON */}

        <span
          className="
            relative
            flex
            flex-col
            justify-center
            w-5
            h-5
            gap-[5px]
          "
        >
          <span
            className={`
              block
              w-full
              h-[2px]
              bg-current
              transition-transform
              duration-300
              ${
                isMenuExpanded
                  ? 'translate-y-[7px] rotate-45'
                  : ''
              }
            `}
          />

          <span
            className={`
              block
              w-full
              h-[2px]
              bg-current
              transition-opacity
              duration-300
              ${
                isMenuExpanded
                  ? 'opacity-0'
                  : 'opacity-100'
              }
            `}
          />

          <span
            className={`
              block
              w-full
              h-[2px]
              bg-current
              transition-transform
              duration-300
              ${
                isMenuExpanded
                  ? '-translate-y-[7px] -rotate-45'
                  : ''
              }
            `}
          />
        </span>
      </button>
    </div>
  </div>

  {/* =========================================
      MOBILE AND TABLET NAVIGATION
  ========================================= */}

  <div
    id="mobile-header-navigation"
    className={`
      lg:hidden
      overflow-hidden
      transition-all
      duration-300
      ease-in-out
      ${
        isMenuExpanded
          ? 'max-h-[75vh] opacity-100'
          : 'max-h-0 opacity-0 pointer-events-none'
      }
    `}
  >
    <nav
      aria-label="Mobile navigation"
      className="
        flex
        flex-col
        gap-1
        bg-[#1D1A1C]
        border-t
        border-white/10
        px-5
        py-5
        max-h-[75vh]
        overflow-y-auto
      "
    >
      {/* MOBILE NAVIGATION LINKS */}

      {links.map((item) => (
        <Link
          key={item.url}
          to={item.url}
          onClick={closeMenu}
          tabIndex={isMenuExpanded ? 0 : -1}
          className="
            block
            py-3
            border-b
            border-white/10
            !text-white
            font-semibold
            text-sm
            transition-colors
            hover:!text-[#D5B48A]
          "
        >
          {item.label}
        </Link>
      ))}

      {/* =========================================
          MOBILE SEARCH BOX
      ========================================= */}

      <form
        role="search"
        onSubmit={(event) => {
          submitSearch(event);
          closeMenu();
        }}
        className="
          flex
          items-center
          gap-2
          mt-5
          p-1
          rounded-full
          border
          border-white/20
          bg-white/10
        "
      >
        <input
          type="search"
          aria-label="Search books"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search books..."
          tabIndex={isMenuExpanded ? 0 : -1}
          className="
            flex-1
            min-w-0
            px-4
            py-2
            bg-transparent
            !text-white
            placeholder:!text-stone-400
            text-sm
            outline-none
          "
        />

        <button
          type="submit"
          tabIndex={isMenuExpanded ? 0 : -1}
          className="
            shrink-0
            h-10
            px-5
            rounded-full
            bg-white
            !text-[#1D1A1C]
            font-semibold
            text-sm
            transition-colors
            hover:bg-[#D5B48A]
          "
        >
          Search
        </button>
      </form>
    </nav>
  </div>
</header>

      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="bg-[#141215] border-t border-border-dark mt-20">
        <div className="container-content py-14 grid grid-cols-1 md:grid-cols-3 gap-9">
          <div><h2 className="font-bold text-2xl mb-3">HowAcademics<span className="text-accent">.</span></h2>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs">{settings.footerText || 'Books that make ideas accessible. Explore our academic catalogue.'}</p></div>
          <div><h3 className="font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-stone-400 text-sm">
              {links.map((item) => <li key={item.url}><Link to={item.url} className="hover:text-white">{item.label}</Link></li>)}
            </ul></div>
          <div><h3 className="font-semibold mb-4">Get in touch</h3>
            {settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`} className="text-sm text-stone-400">{settings.contactEmail}</a>
              : <p className="text-sm text-stone-400">Contact information can be configured in Admin.</p>}</div>
        </div>
        <div className="container-content py-5 border-t border-border-dark text-xs text-stone-500">
          © {new Date().getFullYear()} HowAcademics. Informational book catalogue.
        </div>
      </footer>
    </div>
  );
}
