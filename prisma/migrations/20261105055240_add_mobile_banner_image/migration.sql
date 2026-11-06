-- DropIndex
DROP INDEX "book_search_text_trgm_idx";

-- DropIndex
DROP INDEX "books_title_trgm_idx";

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "mobileImageMediaId" TEXT;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_mobileImageMediaId_fkey" FOREIGN KEY ("mobileImageMediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
