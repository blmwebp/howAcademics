
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { can } from '../lib/api';

const links = [
  { to: '/', label: 'Dashboard', permission: 'book.read' },
  { to: '/books', label: 'Books', permission: 'book.read' },
  { to: '/authors', label: 'Authors', permission: 'author.read' },
  { to: '/categories', label: 'Categories', permission: 'category.read' },
  { to: '/homepage', label: 'Homepage sections', permission: 'home.manage' },
  { to: '/banners', label: 'Banners', permission: 'banner.manage' },
  { to: '/media', label: 'Media library', permission: 'media.read' },
  { to: '/synonyms', label: 'Search synonyms', permission: 'search.manage' },
  { to: '/settings', label: 'Site settings', permission: 'settings.update' },
  { to: '/staff', label: 'Staff & roles', permission: 'user.manage' },
  { to: '/audit', label: 'Audit log', permission: 'audit.view' },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-10">
        Checking administration session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const visibleLinks = links.filter((link) =>
    can(user, link.permission)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* FIXED DESKTOP SIDEBAR */}
      <aside
        className="
          hidden md:flex
          fixed top-0 left-0 bottom-0
          z-40 w-64
          flex-col
          bg-slate-900 text-white
        "
      >

        {/* LOGO - ALWAYS VISIBLE */}
        <div className="shrink-0 p-6 border-b border-slate-700">
          <h1 className="font-bold text-xl">
            HowAcademics
            <span className="text-blue-300">.</span>
          </h1>

          <p className="text-xs font-normal text-slate-400 mt-2">
            Admin portal
          </p>
        </div>

        {/* SCROLLABLE NAVIGATION */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide p-3 space-y-1"
          aria-label="Admin navigation"
        >
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              end={link.to === '/'}
              to={link.to}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* FIXED BOTTOM USER SECTION */}
        <div
          className="
            shrink-0
            border-t border-slate-700
            bg-slate-900
            p-4 text-sm
          "
        >
          <p className="font-medium truncate">
            {user.name}
          </p>

          <p className="text-slate-400 text-xs mt-1 break-all">
            {user.email}
          </p>

          <button
            className="
              underline mt-3
              hover:text-blue-300
              transition-colors
            "
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="min-w-0 min-h-screen md:ml-64 flex flex-col">

        {/* HEADER */}
        <header className="p-4 md:px-8 border-b bg-white flex justify-between gap-3 items-center">
          <span className="font-semibold text-lg">
            Catalogue management
          </span>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 text-sm underline"
          >
            View website ↗
          </a>
        </header>

        {/* MOBILE NAVIGATION */}
        <div className="md:hidden overflow-x-auto flex gap-3 p-3 bg-slate-900 text-white text-xs">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="shrink-0"
            >
              {link.label}
            </NavLink>
          ))}

          <button
            className="shrink-0"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>

        {/* PAGE CONTENT */}
        <main className="p-5 md:p-8 flex-1 min-w-0">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
