# Database Schema Documentation

## Overview

The HowAcademics database is a normalized PostgreSQL schema designed for an informational book catalogue. It uses UUID primary keys, proper foreign keys, indexes, and cascading rules to ensure data integrity.

## Schema Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Book        │       │   BookFormat    │
├─────────────────┤       ├─────────────────┤
│ id (UUID) PK    │───────│ id (UUID) PK    │
│ slug (unique)   │       │ bookId FK       │
│ title           │       │ format (enum)   │
│ description     │       │ priceMinor      │
│ status          │       │ currency        │
│ coverMediaId FK │       │ isbn (unique)   │
│ publishedAt     │       └─────────────────┘
└─────────────────┘
        │
        ├──┬──────────────┬──────────────┐
        │  │              │              │
        ▼  ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ BookAuthor  │  │BookCategory │  │BookKeyword  │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ bookId FK   │  │ bookId FK   │  │ bookId FK   │
│ authorId FK │  │ categoryId FK│ │ keywordId FK│
│ displayOrder│  │ isPrimary   │  └─────────────┘
└─────────────┘  └─────────────┘
        │                  │
        ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   Author    │    │  Category   │
├─────────────┤    ├─────────────┤
│ id (UUID) PK│    │ id (UUID) PK│
│ name        │    │ name        │
│ slug (unique)│   │ slug (unique)│
│ sortName    │    │ parentId FK │
└─────────────┘    │ sortOrder   │
                  │ isActive    │
                  └─────────────┘
```

## Tables

### Identity and Audit

#### AdminUser
Staff accounts for admin panel access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| name | String | NOT NULL | Display name |
| email | String | UNIQUE, NOT NULL | Email address |
| passwordHash | String | NOT NULL | Argon2id hash |
| status | String | default "active" | active, inactive, suspended |
| lastLoginAt | DateTime | nullable | Last login timestamp |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- email (unique)

**Relations:**
- roles (many-to-many via Role)
- sessions (one-to-many)
- auditLogs (one-to-many as actor)
- passwordResetTokens (one-to-many)

#### Role
Role definitions for RBAC.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| key | String | UNIQUE, NOT NULL | Role key (e.g., "super_admin") |
| name | String | NOT NULL | Display name |
| description | String | nullable | Description |
| protected | Boolean | default false | Cannot delete if true |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Relations:**
- users (many-to-many via AdminUser)
- permissions (many-to-many via Permission)

#### Permission
Granular permissions for RBAC.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| key | String | UNIQUE, NOT NULL | Permission key (e.g., "book.publish") |
| resource | String | NOT NULL | Resource (e.g., "book") |
| action | String | NOT NULL | Action (e.g., "publish") |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Relations:**
- roles (many-to-many via Role)

#### Session
Active staff sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| userId | UUID | FK, NOT NULL | AdminUser reference |
| tokenHash | String | UNIQUE, NOT NULL | Session token hash |
| expiresAt | DateTime | NOT NULL | Expiration timestamp |
| revokedAt | DateTime | nullable | Revocation timestamp |
| deviceInfo | String | nullable | User agent/device info |
| ipAddress | String | nullable | IP address |
| createdAt | DateTime | default now() | Creation timestamp |

**Indexes:**
- tokenHash (unique)

**Relations:**
- user (many-to-one AdminUser, cascade delete)

#### PasswordResetToken
Password reset tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| userId | UUID | FK, NOT NULL | AdminUser reference |
| tokenHash | String | UNIQUE, NOT NULL | Token hash |
| expiresAt | DateTime | NOT NULL | Expiration timestamp |
| usedAt | DateTime | nullable | When used |
| createdAt | DateTime | default now() | Creation timestamp |

**Relations:**
- user (many-to-one AdminUser, cascade delete)

#### AuditLog
Audit trail for material changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| actorId | UUID | FK, nullable | AdminUser who acted |
| action | String | NOT NULL | Action performed |
| entityType | String | NOT NULL | Entity type (e.g., "book") |
| entityId | String | nullable | Entity ID |
| requestId | String | nullable | Request ID for correlation |
| beforeJson | JSON | nullable | State before change |
| afterJson | JSON | nullable | State after change |
| ipAddress | String | nullable | IP address |
| userAgent | String | nullable | User agent |
| createdAt | DateTime | default now() | Creation timestamp |

**Indexes:**
- (entityType, entityId)
- createdAt

**Relations:**
- actor (many-to-one AdminUser)

### Books and Formats

#### Book
Core book entity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| slug | String | UNIQUE, NOT NULL | URL slug |
| title | String | NOT NULL | Book title |
| subtitle | String | nullable | Subtitle |
| shortDescription | String | nullable | Short summary |
| description | String | nullable | Full description |
| publicationDate | DateTime | nullable | Publication date |
| editionLabel | String | nullable | Edition (e.g., "2nd Edition") |
| publisherName | String | nullable | Publisher name |
| language | String | default "en" | Language code |
| pageCount | Int | nullable | Page count |
| tableOfContents | String | nullable | Table of contents |
| coverMediaId | UUID | FK, nullable | Cover image |
| status | String | default "draft" | draft, published, archived |
| publishedAt | DateTime | nullable | When published |
| seoTitle | String | nullable | SEO title |
| seoDescription | String | nullable | SEO description |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |
| createdBy | String | nullable | AdminUser ID |
| updatedBy | String | nullable | AdminUser ID |

**Indexes:**
- slug (unique)
- status
- publishedAt

**Relations:**
- coverMedia (many-to-one MediaAsset)
- authors (one-to-many via BookAuthor)
- categories (one-to-many via BookCategory)
- keywords (one-to-many via BookKeyword)
- formats (one-to-many via BookFormat)
- relatedFrom (one-to-many via BookRelated)
- relatedTo (one-to-many via BookRelated)

**Status Lifecycle:**
- draft → published (becomes visible publicly)
- published → archived (no longer visible, data preserved)
- archived → published (can be republished)

#### BookFormat
Physical format and pricing (paperback/hardcover only).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| bookId | UUID | FK, NOT NULL | Book reference |
| format | String | NOT NULL | "paperback" or "hardcover" |
| priceMinor | BigInt | NOT NULL | Price in minor units (e.g., 2999 for $29.99) |
| currency | String | default "INR" | ISO 4217 currency code |
| isbn | String | UNIQUE, nullable | ISBN-13 |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Constraints:**
- UNIQUE(bookId, format) - One row per format per book
- priceMinor must be positive
- isbn must be valid format if provided

**Indexes:**
- bookId
- isbn (unique)

**Relations:**
- book (many-to-one Book, cascade delete)

**Format Rules:**
- 0 rows: No format/price section rendered
- 1 row (paperback): Show only paperback + price
- 1 row (hardcover): Show only hardcover + price
- 2 rows: Show both formats with distinct prices

#### BookAuthor
Many-to-many relationship between books and authors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| bookId | UUID | FK, NOT NULL | Book reference |
| authorId | UUID | FK, NOT NULL | Author reference |
| displayOrder | Int | default 0 | Display order |
| creditRole | String | nullable | author, editor, translator |
| createdAt | DateTime | default now() | Creation timestamp |

**Constraints:**
- UNIQUE(bookId, authorId) - Same author once per book

**Relations:**
- book (many-to-one Book, cascade delete)
- author (many-to-one Author, cascade delete)

#### BookCategory
Many-to-many relationship between books and categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| bookId | UUID | FK, NOT NULL | Book reference |
| categoryId | UUID | FK, NOT NULL | Category reference |
| isPrimary | Boolean | default false | Primary category flag |
| createdAt | DateTime | default now() | Creation timestamp |

**Constraints:**
- UNIQUE(bookId, categoryId) - Same category once per book

**Relations:**
- book (many-to-one Book, cascade delete)
- category (many-to-one Category, cascade delete)

#### BookKeyword
Many-to-many relationship between books and keywords.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| bookId | UUID | FK, NOT NULL | Book reference |
| keywordId | UUID | FK, NOT NULL | Keyword reference |
| createdAt | DateTime | default now() | Creation timestamp |

**Constraints:**
- UNIQUE(bookId, keywordId) - Same keyword once per book

**Relations:**
- book (many-to-one Book, cascade delete)
- keyword (many-to-one Keyword, cascade delete)

#### BookRelated
Manual related book relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| bookFromId | UUID | FK, NOT NULL | Source book |
| bookToId | UUID | FK, NOT NULL | Target book |
| relationType | String | NOT NULL | Relationship type (e.g., "manual") |
| sortOrder | Int | default 0 | Display order |
| createdAt | DateTime | default now() | Creation timestamp |

**Constraints:**
- PRIMARY KEY(bookFromId, bookToId)
- No self-links (bookFromId != bookToId)

**Relations:**
- bookFrom (many-to-one Book, cascade delete)
- bookTo (many-to-one Book, cascade delete)

### Authors

#### Author
Simplified author entity (names only, no profiles).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| name | String | NOT NULL | Display name |
| slug | String | UNIQUE, NOT NULL | URL slug |
| sortName | String | nullable | Sortable name (e.g., "Smith, John") |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- slug (unique)
- name

**Relations:**
- books (one-to-many via BookAuthor)

**Note:** No biography, photo, affiliation, ORCID, or social profiles. Author names link to filtered book listing, not profile pages.

### Categories

#### Category
Hierarchical categories for book classification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| name | String | NOT NULL | Display name |
| slug | String | UNIQUE, NOT NULL | URL slug |
| description | String | nullable | Description |
| parentId | UUID | FK, nullable | Parent category |
| sortOrder | Int | default 0 | Display order |
| isActive | Boolean | default true | Active flag |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- slug (unique)
- isActive

**Relations:**
- parent (many-to-one Category, self-referential)
- children (one-to-many Category, self-referential)
- books (one-to-many via BookCategory)
- homepageSections (one-to-many via HomepageCategorySection)

**Hierarchy Rules:**
- No cycles allowed (enforced in application logic)
- Parent must exist if parentId is set
- Only active categories shown publicly

### Keywords

#### Keyword
Controlled keywords for metadata and search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| label | String | UNIQUE, NOT NULL | Display label |
| slug | String | UNIQUE, NOT NULL | URL slug |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- slug (unique)

**Relations:**
- books (one-to-many via BookKeyword)

### Media Assets

#### MediaAsset
Image storage metadata (covers, banners, brand images).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| kind | String | NOT NULL | book_cover, banner, brand_image |
| storagePath | String | UNIQUE, NOT NULL | Disk file path |
| originalFilename | String | NOT NULL | Original upload filename |
| mimeType | String | NOT NULL | MIME type (e.g., "image/jpeg") |
| sizeBytes | BigInt | NOT NULL | File size in bytes |
| width | Int | nullable | Image width in pixels |
| height | Int | nullable | Image height in pixels |
| checksum | String | nullable | File checksum |
| altText | String | nullable | Alt text for accessibility |
| caption | String | nullable | Caption |
| credit | String | nullable | Credit/attribution |
| uploadedBy | String | nullable | AdminUser ID |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- storagePath (unique)
- kind

**Relations:**
- books (one-to-many via Book.coverMediaId)

**Storage:**
- Disk-based, not in database
- Persistent directory outside deploy bundle
- Path stored in storagePath column

**Kinds:**
- book_cover: Primary book cover image
- banner: Homepage banner image
- brand_image: Site logo/brand assets

### Homepage Configuration

#### Banner
Homepage banner images and CTAs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| imageMediaId | UUID | FK, NOT NULL | Banner image |
| headline | String | nullable | Headline text |
| caption | String | nullable | Caption text |
| targetType | String | NOT NULL | book, category, url |
| targetIdOrUrl | String | NOT NULL | Target book ID, category slug, or URL |
| isEnabled | Boolean | default false | Visibility flag |
| sortOrder | Int | default 0 | Display order |
| startsAt | DateTime | nullable | Scheduled start |
| endsAt | DateTime | nullable | Scheduled end |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- isEnabled
- sortOrder

**Relations:**
- imageMedia (many-to-one MediaAsset)

#### HomepageCategorySection
Admin-configured category shelves on homepage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| categoryId | UUID | FK, NOT NULL | Category to display |
| titleOverride | String | nullable | Custom section title |
| isEnabled | Boolean | default false | Visibility flag |
| sortOrder | Int | default 0 | Display order |
| maxBooks | Int | default 10 | Max books to show |
| sortMode | String | default "newest" | newest, title_asc, title_desc, manual |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Indexes:**
- isEnabled
- sortOrder

**Relations:**
- category (many-to-one Category)
- sectionBooks (one-to-many via HomepageSectionBook)

**Sort Modes:**
- newest: Sort by publication date descending
- title_asc: Sort by title A-Z
- title_desc: Sort by title Z-A
- manual: Use HomepageSectionBook sortOrder

#### HomepageSectionBook
Manual book ordering for homepage sections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| sectionId | UUID | FK, NOT NULL | Homepage section |
| bookId | UUID | FK, NOT NULL | Book to display |
| sortOrder | Int | default 0 | Display order |
| createdAt | DateTime | default now() | Creation timestamp |

**Constraints:**
- UNIQUE(sectionId, bookId) - Same book once per section

**Relations:**
- section (many-to-one HomepageCategorySection, cascade delete)
- book (many-to-one Book, cascade delete)

### Search

#### SearchSynonym
Synonym mappings for query expansion.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| canonicalTerm | String | NOT NULL | Canonical term |
| alternativeTerm | String | NOT NULL | Alternative term |
| isActive | Boolean | default true | Active flag |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Constraints:**
- UNIQUE(canonicalTerm, alternativeTerm)

**Indexes:**
- isActive

**Example:**
- canonicalTerm: "Artificial Intelligence", alternativeTerm: "AI"
- canonicalTerm: "AI", alternativeTerm: "Artificial Intelligence" (bidirectional)

#### BookSearchDocument
Precomputed search document for PostgreSQL FTS.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| bookId | UUID | UNIQUE, NOT NULL | Book reference |
| searchVector | String | nullable | PostgreSQL tsvector |
| updatedAt | DateTime | default now() | Last update |

**Indexes:**
- bookId (unique)

**Purpose:**
- Stores combined searchable text as tsvector
- Updated when book metadata changes
- Enables fast full-text search with ranking

### Basic CMS

#### SiteSetting
Global site configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| key | String | UNIQUE, NOT NULL | Setting key |
| valueJson | JSON | NOT NULL | Setting value |
| scope | String | default "global" | Setting scope |
| updatedBy | String | nullable | AdminUser ID |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Example Keys:**
- site.name
- site.description
- site.default_currency
- seo.default_title
- seo.default_description

#### NavigationMenu
Navigation menu containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| key | String | UNIQUE, NOT NULL | Menu key (e.g., "header", "footer") |
| label | String | NOT NULL | Display label |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Relations:**
- items (one-to-many via NavigationItem)

#### NavigationItem
Navigation menu items (header/footer links).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| menuId | UUID | FK, NOT NULL | Parent menu |
| parentId | UUID | FK, nullable | Parent item (for nesting) |
| label | String | NOT NULL | Display label |
| targetType | String | NOT NULL | internal, external |
| targetUrl | String | NOT NULL | Target URL |
| sortOrder | Int | default 0 | Display order |
| visible | Boolean | default true | Visibility flag |
| createdAt | DateTime | default now() | Creation timestamp |
| updatedAt | DateTime | auto-update | Update timestamp |

**Relations:**
- menu (many-to-one NavigationMenu, cascade delete)
- parent (many-to-one NavigationItem, self-referential)
- children (one-to-many NavigationItem, self-referential)

#### SlugRedirect
URL redirects for slug changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid() | Primary key |
| oldSlug | String | UNIQUE, NOT NULL | Old book slug |
| newSlug | String | NOT NULL | New book slug |
| createdAt | DateTime | default now() | Creation timestamp |

**Indexes:**
- oldSlug (unique)

**Purpose:**
- Preserve SEO and bookmarks when book slugs change
- 301 redirect from old to new
- Prevent redirect loops (enforced in application logic)

## PostgreSQL Extensions

### pg_trgm
Required for trigram similarity search (typo tolerance).

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Used for:
- Fuzzy matching of misspelled queries
- Similarity search on titles and author names
- Word similarity with word_similarity()

## Database Migrations

Migrations are managed via Prisma. Common operations:

```bash
# Create migration
npx prisma migrate dev --name add_book_formats

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Seed Data

Seed scripts populate the database with:
- Initial admin user (super admin role)
- Sample categories
- Sample authors
- Sample books with formats
- Sample homepage configuration
- Sample banners

Run seed:
```bash
npm run prisma:seed
```

## Index Strategy

### Performance-Critical Indexes
- books.slug (unique) - Book detail lookups
- books.status - Filtering published books
- books.publishedAt - Sorting by newest
- book_formats.bookId - Format lookups
- authors.slug - Author filter lookups
- categories.slug - Category filter lookups
- categories.isActive - Active category filtering
- homepage_category_sections.isEnabled - Homepage section filtering
- search_synonyms.isActive - Active synonym filtering

### Composite Indexes
- audit_logs (entityType, entityId) - Audit log queries
- book_formats (bookId, format) - Unique constraint index

## Cascading Rules

### Cascade Delete
- Session → AdminUser (delete user removes sessions)
- PasswordResetToken → AdminUser
- BookAuthor → Book, Author (delete book removes author associations)
- BookCategory → Book, Category
- BookKeyword → Book, Keyword
- BookFormat → Book
- BookRelated → Book (both directions)
- HomepageSectionBook → Book, HomepageCategorySection
- NavigationItem → NavigationMenu

### No Cascade (Soft Delete via Status)
- Books with published/archived status are not deleted
- Categories with isActive=false are not deleted
- Authors are not deleted if they have published books

## Data Integrity Constraints

### Check Constraints (Application-Level)
- BookFormat.priceMinor > 0
- BookFormat.format ∈ {paperback, hardcover}
- Book.status ∈ {draft, published, archived}
- Category.parentId != Category.id (no self-parent)
- BookRelated.bookFromId != BookRelated.bookToId (no self-relations)

### Unique Constraints
- Book.slug
- Author.slug
- Category.slug
- Keyword.slug
- BookFormat.isbn (if not null)
- BookFormat (bookId, format)
- BookAuthor (bookId, authorId)
- BookCategory (bookId, categoryId)
- BookKeyword (bookId, keywordId)
- BookRelated (bookFromId, bookToId)
- HomepageSectionBook (sectionId, bookId)
- SearchSynonym (canonicalTerm, alternativeTerm)
- SlugRedirect.oldSlug
- AdminUser.email
- Role.key
- Permission.key
- Session.tokenHash
- PasswordResetToken.tokenHash
- SiteSetting.key
- NavigationMenu.key
- MediaAsset.storagePath

## Search Implementation

### Full-Text Search (PostgreSQL)
Uses tsvector and ts_rank for relevance ranking:

```sql
-- Create search vector column
ALTER TABLE book_search_documents ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX book_search_vector_idx ON book_search_documents USING GIN(search_vector);

-- Update search vector
UPDATE book_search_documents
SET search_vector = to_tsvector('english', combined_text);
```

### Trigram Search
Uses pg_trgm for fuzzy matching:

```sql
-- Create trigram index
CREATE INDEX books_title_trgm_idx ON books USING GIN(title gin_trgm_ops);
CREATE INDEX authors_name_trgm_idx ON authors USING GIN(name gin_trgm_ops);
```

### Synonym Expansion
Search query expansion via search_synonyms table:

```sql
-- Find synonyms for "AI"
SELECT alternative_term FROM search_synonyms
WHERE canonical_term = 'AI' AND is_active = true;
```

## Backup and Restore

### Backup
```bash
pg_dump -U postgres -d howacademics > backup.sql
```

### Restore
```bash
psql -U postgres -d howacademics < backup.sql
```

### Media Backup
```bash
# Backup media directory
tar -czf media-backup.tar.gz /path/to/media
```
