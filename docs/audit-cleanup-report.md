# HowAcademics Source Audit and Update — 31 October 2026

## Input archive

The uploaded ZIP was a Phase 0 monorepo scaffold with:

- Public placeholder pages for journals, articles, authors, news, events and catalogues.
- A demonstration-only homepage, empty books pages and a placeholder Express API.
- A login form which navigated without checking credentials.
- A PostgreSQL schema close to the book-only requirements but with a broken index (`storageKey`).
- Several nested npm lockfiles, obsolete documentation and a local `.env` in the input archive.
- Large `node_modules` directories that are not necessary in a source ZIP.

## Applied changes

- Removed 10 obsolete public page files and their navigation/route links.
- Implemented public book catalogue/detail pages, author/category/format filters, responsive quick view and related suggestions.
- Added 3 original demo banners with a 3-second CSS book-page-turn animation and demo book fallback.
- Added live API-backed homepage banner/category configuration and comprehensive staff-only admin CRUD.
- Implemented PostgreSQL search ranking (exact, partial, full-text, synonyms, trigram).
- Added on-demand A4 PDF flyer generation without permanent PDF storage.
- Repaired Prisma relations/indexes, generated a fresh initial migration and added `pg_trgm` indexes.
- Implemented database staff sessions, password verification, permission enforcement and audit records.
- Consolidated npm workspace dependency lockfiles into the single root `package-lock.json`.
- Updated Tailwind colors and content settings so public/admin builds compile.
- Added first-admin bootstrap, optional demo-book seed, sample requirements tests and current setup documentation.
- Explicitly excluded supplied `.env`, all `node_modules`, build outputs and dependency caches from the new source distribution.

## Verification performed

- Prisma schema validation passed.
- API, web and admin TypeScript typechecks passed.
- Four format/demo requirements tests passed.
- All three production builds passed.
- Database migration and real API workflows could **not** be executed against a live PostgreSQL instance in this session.

## Remaining production tasks

- Configure a real PostgreSQL database and deploy the migration.
- Bootstrap the initial administrator, test editing/publishing in a browser and upload actual book covers/banners.
- Add SSR/prerendering for public book SEO and perform accessibility/security/E2E testing.
- Replace demo books and banners with genuine publication data.
- Configure VPS HTTPS, persistent image directory, logging and DB/media backups.
