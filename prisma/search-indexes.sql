-- Run AFTER the Prisma schema has been applied to PostgreSQL.
-- These indexes accelerate PostgreSQL full-text and typo-tolerant search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS book_search_text_fts_idx ON book_search_documents
  USING GIN (to_tsvector('english', "searchText"));
CREATE INDEX IF NOT EXISTS books_title_trgm_idx ON books
  USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS book_search_text_trgm_idx ON book_search_documents
  USING GIN ("searchText" gin_trgm_ops);
