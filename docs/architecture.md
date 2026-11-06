# HowAcademics v2.0 Architecture

## Overview

HowAcademics is an informational academic book catalogue platform. It helps offline customers find accurate information about the publisher's books before visiting physical retailers or contacting the publisher. The platform does not sell books online; prices are informational only.

## System Goals

- **Book Discovery**: Browse published books, view available formats (paperback/hardcover) and prices, filter by category or author
- **Hybrid Search**: PostgreSQL-based lexical search with full-text ranking, synonyms, and typo tolerance
- **Admin Management**: Role-protected admin panel for managing books, formats, authors, categories, covers, homepage layout, banners, and settings
- **Product Flyers**: On-demand A4 PDF generation with book details and pricing information
- **Responsive UX**: Desktop quick-view overlay for book details, mobile direct navigation to full details

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Public Website                            │
│                    (React + Vite + TypeScript)                   │
│  Homepage | Catalogue | Book Detail | Author/Category Filter    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP (JSON)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Server                               │
│                     (Node + Express + TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Public Routes │  │ Admin Routes │  │ PDF Generator│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Search       │  │ Auth/Middleware│  │ Media Service│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Prisma ORM
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                        │
│  Books | Formats | Authors | Categories | Media | Search Docs   │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Disk Storage
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Media Directory                              │
│              (book covers, banners, brand images)                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Admin Panel                               │
│                    (React + Vite + TypeScript)                   │
│  Dashboard | Books | Authors | Categories | Homepage | Media     │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP (JSON) + Auth
                                   ▼
                         (Same API Server)
```

## Technology Stack

### Frontend
- **Public Website**: React 19, Vite, TypeScript, React Router, Tailwind CSS
- **Admin Panel**: React 19, Vite, TypeScript, React Router, TanStack Query, Zod validation
- **Shared**: `@howacademics/contracts` (DTOs, enums, validation), `@howacademics/ui` (design tokens, utilities)

### Backend
- **API Server**: Node.js 18+, Express, TypeScript, Prisma ORM
- **Authentication**: Cookie-based sessions, Argon2id password hashing, CSRF protection
- **PDF Generation**: PDFKit (on-demand A4 flyers)
- **Validation**: Zod schemas

### Database
- **PostgreSQL 16+**: All textual content, relations, and search
- **Extensions**: pg_trgm (trigram search for typo tolerance)
- **ORM**: Prisma for migrations and type-safe queries

### Storage
- **Disk-based**: Persistent media directory outside deploy bundle
- **Image Types**: book_cover, banner, brand_image
- **No S3/MinIO**: Simple file system storage for v1

### Development
- **Package Manager**: npm workspaces
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest/Vitest (unit), Playwright (E2E)

## Directory Structure

```
howacademics/
├── apps/
│   ├── web/              # Public React/Vite website
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Route pages (homepage, books, book detail)
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── services/      # API client calls
│   │   │   └── styles/        # Global styles, Tailwind config
│   │   └── package.json
│   ├── admin/            # Admin React/Vite SPA
│   │   ├── src/
│   │   │   ├── components/    # Admin-specific components
│   │   │   ├── pages/         # Admin pages (dashboard, books, settings)
│   │   │   ├── hooks/         # Admin hooks (useAuth, usePermissions)
│   │   │   └── services/      # API client calls
│   │   └── package.json
│   └── api/              # Node/Express API
│       ├── src/
│       │   ├── routes/        # Express route definitions
│       │   ├── controllers/   # Request handlers
│       │   ├── services/      # Business logic
│       │   ├── middleware/    # Auth, validation, error handling
│       │   └── lib/           # Prisma client, PDF generator
│       └── package.json
├── packages/
│   ├── shared/           # Shared TypeScript code (if needed)
│   ├── contracts/        # DTOs, enums, Zod schemas
│   │   ├── dto/           # Data transfer objects
│   │   ├── enums/         # Enum definitions
│   │   └── schemas/       # Zod validation schemas
│   ├── ui/               # Design tokens, utilities
│   │   ├── tokens/        # CSS custom properties
│   │   └── utils/         # Helper functions
│   └── config/           # ESLint, Prettier, TypeScript config
├── database/
│   ├── migrations/      # Prisma migration files
│   └── seeds/            # Demo data fixtures
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/             # Backup/restore, deployment scripts
├── docs/                # Architecture, database, deployment docs
├── .env.example         # Environment variables template
├── package.json         # Root workspace config
└── README.md            # Project overview
```

## Data Model ERD

### Core Entities

```
Book (1) ─── (N) BookFormat
  │                    │
  │                    ├─ format: paperback | hardcover
  │                    ├─ priceMinor: integer
  │                    ├─ currency: string
  │                    └─ isbn: string (optional)
  │
  ├─ (N) BookAuthor ─── (1) Author
  │                    ├─ name: string
  │                    ├─ slug: string
  │                    └─ sortName: string
  │
  ├─ (N) BookCategory ── (1) Category
  │                    ├─ name: string
  │                    ├─ slug: string
  │                    └─ parentId: optional (hierarchy)
  │
  ├─ (N) BookKeyword ─── (1) Keyword
  │                    └─ label: string
  │
  ├─ (1) MediaAsset (cover)
  │
  └─ (N) BookRelated ── (N) Book
```

### Homepage Configuration

```
HomepageCategorySection (1) ─── (N) HomepageSectionBook ─── (1) Book
  │
  ├─ category: Category
  ├─ titleOverride: optional
  ├─ isEnabled: boolean
  ├─ sortOrder: integer
  ├─ maxBooks: integer
  └─ sortMode: newest | title_asc | title_desc | manual

Banner (1) ─── (1) MediaAsset (image)
  ├─ headline: string
  ├─ caption: string
  ├─ targetType: book | category | url
  ├─ targetIdOrUrl: string
  └─ isEnabled: boolean
```

### Search

```
BookSearchDocument (1) ─── (1) Book
  └─ searchVector: PostgreSQL tsvector

SearchSynonym
  ├─ canonicalTerm: string
  └─ alternativeTerm: string
```

### Identity and Access

```
AdminUser (1) ─── (N) Role
  │
  ├─ (N) Session
  ├─ (N) AuditLog
  └─ (N) PasswordResetToken

Role (1) ─── (N) Permission
  ├─ resource: string
  └─ action: string
```

### Media

```
MediaAsset
  ├─ kind: book_cover | banner | brand_image
  ├─ storagePath: string (disk path)
  ├─ originalFilename: string
  ├─ mimeType: string
  ├─ sizeBytes: bigint
  ├─ width: integer
  ├─ height: integer
  └─ altText: string
```

### CMS (Basic)

```
SiteSetting
  ├─ key: string
  └─ valueJson: JSON

NavigationMenu (1) ─── (N) NavigationItem
  ├─ label: string
  ├─ targetType: internal | external
  └─ targetUrl: string

SlugRedirect
  ├─ oldSlug: string
  └─ newSlug: string
```

## Key Design Decisions

### 1. Book Formats as Separate Table
- Each book has 0, 1, or 2 format rows in `book_formats`
- Paperback and/or hardcover are the only allowed formats
- No placeholder rows for unavailable formats
- UI renders only existing rows (0 rows = no format section)

### 2. Authors as Names Only
- No biographies, photos, affiliations, ORCID, or social profiles
- Author names link to filtered book listing, not profile pages
- Simplified `authors` table with just name, slug, sort_name

### 3. Categories with Optional Hierarchy
- Flat or hierarchical categories supported
- Books can belong to multiple categories
- Homepage category sections query by category_id

### 4. PostgreSQL Hybrid Search (No Elasticsearch in v1)
- Full-text search via PostgreSQL `to_tsvector` and `ts_rank`
- Trigram search via `pg_trgm` for typo tolerance
- Synonym expansion via `search_synonyms` table
- Precomputed search document in `book_search_documents`
- Provider-agnostic interface for future Elasticsearch migration

### 5. On-Demand PDF Flyers
- Generated server-side using PDFKit
- No permanent PDF storage
- Includes cover, title, authors, selected formats/prices/ISBNs, description, table of contents
- No purchase links, QR codes, or buy CTAs

### 6. Desktop Quick-View vs Mobile Direct Navigation
- Desktop (>=768px): Quick-view overlay on homepage book click
- Mobile (<768px): Direct navigation to full book detail
- Responsive breakpoint at 768px

### 7. No Docker in v1
- Local development: Node + locally installed PostgreSQL
- Production: VPS with Node, PostgreSQL, Nginx, PM2/systemd
- Persistent media directory outside deploy bundle

### 8. No Ecommerce
- No cart, checkout, orders, payments, inventory
- Prices are informational only
- No customer accounts
- No digital book downloads

## Security Considerations

- Staff-only authentication (no public user accounts)
- Cookie-based sessions with HttpOnly, Secure, SameSite
- Argon2id password hashing
- CSRF protection for authenticated mutations
- Rate limiting on sensitive endpoints
- Role-based access control enforced server-side
- Parameterized queries via Prisma
- Image upload validation (MIME type, size, dimensions)
- Safe URL allowlists for links
- Content sanitization for rich text

## Performance Considerations

- Paginated catalogue and search results
- Efficient database queries with proper indexes
- Lazy loading images below fold
- Responsive image sizes
- Code splitting in React apps
- Search debouncing
- Safe caching with invalidation on edits
- Precomputed search documents

## Accessibility (WCAG 2.2 AA)

- Semantic HTML
- Skip links
- Focus management (especially in quick-view dialog)
- ARIA attributes where appropriate
- Keyboard navigation
- Color contrast ratios
- Alt text for images
- Error announcements
- Reduced motion support
- Touch target sizes

## SEO

- Server-side rendering or pre-rendering for indexable pages
- Meaningful HTML on initial response
- Per-book meta title, description, canonical URL
- Open Graph tags with cover images
- Book JSON-LD structured data
- Sitemap for published books and categories
- Slug redirects for changed URLs
- Robots directives

## API Contract

### Public Endpoints
- `GET /api/v1/public/home` - Homepage data (banners, category shelves)
- `GET /api/v1/public/books` - Searchable, filterable catalogue
- `GET /api/v1/public/books/:slug` - Full book detail
- `GET /api/v1/public/books/:slug/quick-view` - Quick-view DTO
- `GET /api/v1/public/books/:slug/flyer` - PDF download
- `GET /api/v1/public/categories` - All categories
- `GET /api/v1/public/authors` - All authors
- `GET /api/v1/public/search/suggestions?q=` - Search suggestions
- `GET /api/v1/public/site-settings` - Public site settings
- `GET /api/v1/health` - Health check

### Admin Endpoints (Role-Protected)
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/me`
- `GET /api/v1/admin/dashboard`
- CRUD for books, authors, categories, banners, homepage sections, media, search synonyms, settings, staff
- `POST /api/v1/admin/books/:id/publish`
- `POST /api/v1/admin/books/:id/unpublish`
- `GET /api/v1/admin/books/:id/flyer-preview`

## Deployment Architecture

### Local Development
- Node.js 18+ for API and React apps
- PostgreSQL 16+ (local installation or development server)
- npm workspaces for dependency management
- Media files in local directory

### Production (Hostinger VPS example)
- **OS**: Ubuntu LTS
- **Web Server**: Nginx (reverse proxy, SSL, static assets)
- **Application**: Node.js services (API, SSR if used) via PM2 or systemd
- **Database**: PostgreSQL 16+ (on same VPS or managed)
- **Media**: Persistent directory outside app deployment
- **SSL**: Let's Encrypt via Certbot
- **Backups**: PostgreSQL dumps + media directory backups
- **Monitoring**: Simple uptime checks and error logging

### Deployment Process
1. Build React apps (`npm run build`)
2. Build API (`npm run build`)
3. Run database migrations (`npm run prisma:migrate:deploy`)
4. Deploy to VPS (git pull or CI/CD)
5. Restart Node services via PM2/systemd
6. Verify health endpoint
7. Back up database and media

## Future Extensions (Out of Scope for v1)

- Elasticsearch migration (provider-agnostic interface ready)
- Digital book access with entitlements
- Customer accounts and reading lists
- Advanced analytics
- Internationalization (i18n)
- Multi-imprint support
- Series management
