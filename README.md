# HowAcademics — Book Catalogue

An informational academic-books website and role-protected admin dashboard, built with React + Vite, Node.js/Express, Prisma and PostgreSQL. **There is no online purchasing, customer checkout, author biography portal, or full-book download.**

## What is implemented

| Area | Included functionality |
| --- | --- |
| Homepage | Responsive header/footer, category-based bookshelves, demo banners with **book-page turn animation every 3 seconds**, and desktop book quick view |
| Public catalogue | Book search and pagination, categories, author-name links to filtered results, format filters, book detail pages |
| Book formats | Independent Paperback/Hardcover records and prices; render **only selected** formats, including zero selection |
| PDF flyer | A4 product flyer generated on request from published data; format-specific prices and ISBN; no purchase links or QR codes |
| Search | PostgreSQL full-text matching, partial/ISBN matching, configured synonyms, `pg_trgm` typo tolerance and separately labeled related suggestions |
| Admin | Cookie-based login, server-checked roles, books, authors, categories, homepage rows, banners, image uploads, synonyms, site settings, staff, audit |
| Demo | Three CSS-drawn animated banners and illustrative books (including paperback only, hardcover only, both, and no format). Optional database seed |

Demo titles and banners are clearly illustrative. Once a real category layout is configured in PostgreSQL, published database content replaces the demo book rows. Active admin banners replace demo banners. To avoid accidental publicity, remove all demo records before launch.

## Prerequisites

- Node.js 20+ and npm, with access to npm dependencies on the first install.
- PostgreSQL server available locally or remotely. No Docker, Redis, Elasticsearch or object storage service is required.
- The PostgreSQL role must be able to create tables and the `pg_trgm` extension during initial migration.

## Installation (Windows PowerShell)

From the project root:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL`, `SITE_URL`, `ADMIN_URL`, `MEDIA_DIR`, and environment-specific values. **Never commit `.env`**. The ZIP does not contain credentials.

### Database

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy
```

The bundled first migration creates the complete PostgreSQL schema and full-text/trigram search indexes. For an existing database, back it up and review the migration before deploying.

### First administrator

Set these in your local `.env` temporarily:

```dotenv
BOOTSTRAP_ADMIN_EMAIL="you@example.com"
BOOTSTRAP_ADMIN_PASSWORD="REPLACE_WITH_A_UNIQUE_LONG_PASSWORD"
BOOTSTRAP_ADMIN_NAME="HowAcademics Administrator"
```

Then execute `npm run bootstrap:admin`. This creates the initial super-admin and the catalogue-editor, content-manager and viewer roles. **Remove the bootstrap password from `.env` immediately afterward**. No default login credentials are distributed.

### Optional demo book data

```powershell
npm run seed:demo
```

This is idempotent and disabled when `NODE_ENV=production`. It adds 9 explicitly marked **demonstration** books, categories, name-only authors, format prices and homepage rows. No images or PDFs need to be uploaded for this preview; illustrative covers are generated with CSS.

### Development

```powershell
npm run dev
```

- Public website: http://localhost:5173
- Admin panel: http://localhost:5174
- API: http://localhost:3000/api/v1
- API health: http://localhost:3000/health

The two Vite development servers proxy `/api` and `/media` to Express. The backend requires PostgreSQL for real catalogue operations, but the public frontend provides clearly labeled demo content if the initial database is empty or not configured yet.

## How to manage the website

1. Log into the admin panel after bootstrapping the first account.
2. Create **Authors** (names only) and **Categories**.
3. Upload book covers under **Media**, then create and save books. For each book select Paperback, Hardcover, both, or neither; prices are saved only for selected formats.
4. Publish a book. It appears in the searchable catalogue and in any enabled homepage category shelf.
5. Open **Homepage sections** to choose category rows, labels, sorting, visible count and order.
6. Open **Banners** to upload images, enter headings/captions/links and choose visibility/order. The public carousel automatically turns pages every three seconds. Demo banners are used only until banner records exist.
7. Use **Search synonyms**, **Site settings** and **Staff & roles** as appropriate.

Book cover clicks on the **desktop homepage** show a quick-view dialog; the Learn more button opens the full detail. At widths below 768px, the card directly navigates to full detail. Author names link to `/books?author=slug`, never to profiles.

## API highlights

Public:

- `GET /api/v1/public/home`
- `GET /api/v1/public/books?q=&category=&author=&format=&year=&page=`
- `GET /api/v1/public/books/:slug`
- `GET /api/v1/public/books/:slug/quick-view`
- `GET /api/v1/public/books/:slug/flyer` (generated PDF)

Admin (requires a valid staff session):

- `POST /api/v1/admin/auth/login`, `GET /api/v1/admin/auth/me`, `POST /api/v1/admin/auth/logout`
- `/api/v1/admin/books`, `/authors`, `/categories`, `/homepage-sections`, `/banners`, `/media`, `/synonyms`, `/settings`, `/staff`, `/roles`, `/audit`

Admin forms call real API routes; they do not assume a successful login or publication.

## Tests and production builds

```powershell
npm test
npm run build
```

`npm test` runs TypeScript checks and format/demo requirements tests. The build compiles the Express API and Vite frontends. Prisma schema validation can be run with `npx prisma validate` after configuring `DATABASE_URL`.

## Hosting without Docker

Deploy the Node API and React build outputs with conventional Nginx + a Node process supervisor (such as systemd/PM2) on a VPS that supports PostgreSQL. Use HTTPS, DB backups, a persistent `MEDIA_DIR` outside the release directory, safe media permissions, and a non-root app user.

**Deployment note:** The current public site is a client-rendered React/Vite app. For strong SEO indexing of dynamically created book pages, add server-side rendering or content-specific prerendering before a production launch. A live PostgreSQL database and end-to-end browser testing are required before declaring the project production-ready.

## Intentional exclusions

No Docker, checkout, payments, orders, stock, external retailer links, journals, articles, news, events, academic submissions, author profile pages, newsletter infrastructure, Redis, Elasticsearch service, or downloadable full books. Uploaded content is restricted to book/banner/brand images. Product flyers are generated on demand and are not permanently stored.
