# ADR-002: Book-only PostgreSQL data model

**Status:** Accepted, revised 31 October 2026.

The previous design for journals, articles, author biography pages and ecommerce is obsolete.
HowAcademics now models books, independent `book_formats`, author-name relationships,
categories, keywords, manual related books, banners, homepage category sections,
image media, search synonyms, site settings, administrative accounts/roles and audit logs.

One book may have zero, one or two format rows. Each selected format has an independent
integer minor-unit price, currency and optional ISBN. Absence of a row means the
format is omitted from the public UI and generated flyer; the system must never
show an unavailable-format placeholder.

Authors have a name, slug and book relationships only. Clicking an author
navigates to a filtered book list; author profile pages do not exist.

Images are stored on a persistent filesystem volume. PDFs are generated in memory
from live book data and streamed to the requester without permanent storage.

PostgreSQL full-text search uses `book_search_documents`, a GIN expression index
and `pg_trgm` indexes. Search documents are rebuilt whenever books or their
author/category metadata changes.

The authoritative schema is `prisma/schema.prisma`, and initial migration SQL
is included in `prisma/migrations/20261031000000_initial_books/migration.sql`.
