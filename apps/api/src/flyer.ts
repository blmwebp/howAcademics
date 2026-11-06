import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import type { FullBook } from './core';

/* =========================================================
   CONFIGURATION
========================================================= */

const COLORS = {
  primary: '#35243D',
  accent: '#B99567',
  ink: '#29242B',
  muted: '#6F6871',
  border: '#DDD7DC',
  soft: '#F5F2F0',
  white: '#FFFFFF',
};

const PAGE = {
  width: 595.28,
  height: 841.89,

  margin: 45,
  top: 45,
  bottom: 755,

  contentWidth: 505.28,
};

const FONT_DIR = path.resolve(
  __dirname,
  '../assets/fonts'
);

const FONT_REGULAR = path.join(
  FONT_DIR,
  'NotoSans-Regular.ttf'
);

const FONT_BOLD = path.join(
  FONT_DIR,
  'NotoSans-Bold.ttf'
);

/* =========================================================
   UTILITIES
========================================================= */

export function formatPrice(
  minor: bigint,
  currency: string
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(minor) / 100);
}

function cleanText(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatName(value: string): string {
  const names: Record<string, string> = {
    paperback: 'Paperback',
    hardcover: 'Hardcover',
  };

  return (
    names[value.toLowerCase()] ||
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}

function formatPublicationDate(date: Date | null): string {
  if (!date) return '';

  return new Date(date).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/* =========================================================
   FILE RESOLUTION
========================================================= */

function resolveMediaFile(
  storagePath: string | null | undefined
): string | null {

  if (!storagePath) {
    console.warn(
      '[Flyer] No cover image storage path provided.'
    );

    return null;
  }

  // apps/api directory
  const apiDirectory = path.resolve(
    __dirname,
    '..'
  );

  // Resolve media directory relative to apps/api,
  // regardless of where Node.js was started.
  const mediaDirectory = process.env.MEDIA_DIR
    ? path.resolve(
        apiDirectory,
        process.env.MEDIA_DIR
      )
    : path.join(
        apiDirectory,
        'media'
      );

  console.log(
    '[Flyer] Media directory:',
    mediaDirectory
  );

  console.log(
    '[Flyer] Stored image path:',
    storagePath
  );

  if (!fs.existsSync(mediaDirectory)) {
    console.error(
      '[Flyer] Media directory does not exist:',
      mediaDirectory
    );

    return null;
  }

  const actualMediaDirectory = fs.realpathSync(
    mediaDirectory
  );

  const requestedPath = path.resolve(
    actualMediaDirectory,
    storagePath
  );

  // Security: prevent access outside media storage.
  const relativePath = path.relative(
    actualMediaDirectory,
    requestedPath
  );

  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    console.error(
      '[Flyer] Invalid image path:',
      storagePath
    );

    return null;
  }

  if (!fs.existsSync(requestedPath)) {
    console.error(
      '[Flyer] Image file does not exist:',
      requestedPath
    );

    return null;
  }

  const actualImagePath = fs.realpathSync(
    requestedPath
  );

  // Reject symlinks that escape the media directory.
  const realRelativePath = path.relative(
    actualMediaDirectory,
    actualImagePath
  );

  if (
    realRelativePath === '..' ||
    realRelativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelativePath)
  ) {
    console.error(
      '[Flyer] Image resolves outside media directory:',
      actualImagePath
    );

    return null;
  }

  console.log(
    '[Flyer] Cover image found:',
    actualImagePath
  );

  return actualImagePath;
}

/* =========================================================
   PDF HELPERS
========================================================= */

type FlyerDocument = PDFKit.PDFDocument;

function ensureSpace(
  pdf: FlyerDocument,
  requiredHeight: number
): void {
  if (pdf.y + requiredHeight > PAGE.bottom) {
    pdf.addPage();
    pdf.y = PAGE.top;
  }
}

function drawLine(
  pdf: FlyerDocument,
  y: number
): void {
  pdf
    .strokeColor(COLORS.border)
    .lineWidth(0.7)
    .moveTo(PAGE.margin, y)
    .lineTo(PAGE.width - PAGE.margin, y)
    .stroke();
}

function drawSectionHeading(
  pdf: FlyerDocument,
  title: string
): void {
  ensureSpace(pdf, 50);

  pdf.moveDown(0.5);

  pdf
    .font('NotoSans-Bold')
    .fontSize(14)
    .fillColor(COLORS.primary)
    .text(title, PAGE.margin, pdf.y, {
      width: PAGE.contentWidth,
      characterSpacing: 0,
    });

  pdf.y += 8;

  const lineY = pdf.y;

  drawLine(pdf, lineY);

  pdf.y = lineY + 15;
}

/* =========================================================
   HEADER
========================================================= */

function drawHeader(
  pdf: FlyerDocument,
  logoPath: string | null
): void {
  pdf
    .rect(0, 0, PAGE.width, 108)
    .fill(COLORS.primary);

  let logoRendered = false;

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      pdf.image(logoPath, PAGE.margin, 27, {
        fit: [175, 52],
        valign: 'center',
      });
      logoRendered = true;
    } catch {
      logoRendered = false;
    }
  }

  if (!logoRendered) {
    pdf
      .font('NotoSans-Bold')
      .fontSize(19)
      .fillColor(COLORS.white)
      .text('HOW ACADEMICS', PAGE.margin, 31, {
        characterSpacing: 0,
      });
  }

  pdf
    .font('NotoSans')
    .fontSize(8)
    .fillColor('#DCD2DF')
    .text(
      'ACADEMIC PUBLISHING · BOOK CATALOGUE',
      PAGE.margin,
      82,
      {
        characterSpacing: 0,
      }
    );

  pdf.y = 137;
}

/* =========================================================
   COVER + BOOK TITLE
========================================================= */

async function prepareImageForPdf(
  imagePath: string
): Promise<Buffer> {

  const imageBuffer = await sharp(imagePath)
    .rotate()
    .png()
    .toBuffer();

  return imageBuffer;
}

async function drawBookOverview(
  pdf: FlyerDocument,
  book: FullBook
): Promise<void> {
  const startY = pdf.y;

  const coverX = PAGE.margin;
  const coverWidth = 145;
  const coverHeight = 205;

  const informationX = 215;
  const informationWidth = 335;

  let actualCoverHeight = 0;

  // COVER IMAGE
  const cover = book.coverMedia?.storagePath;

  console.log(
  '[Flyer] Generating flyer for:',
  book.title
);

console.log(
  '[Flyer] Cover media:',
  book.coverMedia
);

console.log(
  '[Flyer] Cover storage path:',
  cover
);

  let coverPath: string | null = null;

  try {
    coverPath = resolveMediaFile(cover);
  } catch {
    coverPath = null;
  }

if (coverPath) {
  try {
    const imageBuffer = await prepareImageForPdf(
      coverPath
    );

    pdf.image(
      imageBuffer,
      coverX,
      startY,
      {
        fit: [coverWidth, coverHeight],
        align: 'center',
        valign: 'center',
      }
    );

    actualCoverHeight = coverHeight;

    console.log(
      '[Flyer] Cover converted and embedded successfully'
    );

  } catch (error) {
    console.error(
      '[Flyer] Failed to process cover:',
      error
    );

    actualCoverHeight = 0;
  }
}

  // If there is no usable cover, show a subtle placeholder.
  if (!actualCoverHeight) {
    pdf
      .fillColor(COLORS.soft)
      .rect(
        coverX,
        startY,
        coverWidth,
        coverHeight
      )
      .fill();

    pdf
      .font('NotoSans')
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(
        'Book cover',
        coverX + 15,
        startY + coverHeight / 2 - 8,
        {
          width: coverWidth - 30,
          align: 'center',
        }
      );

    actualCoverHeight = coverHeight;
  }

  // TITLE
  pdf
    .font('NotoSans-Bold')
    .fontSize(20)
    .fillColor(COLORS.primary)
    .text(book.title, informationX, startY, {
      width: informationWidth,
      lineGap: 4,
      characterSpacing: 0,
    });

  // SUBTITLE
  if (book.subtitle) {
    pdf.y += 9;

    pdf
      .font('NotoSans')
      .fontSize(11)
      .fillColor(COLORS.muted)
      .text(cleanText(book.subtitle), informationX, pdf.y, {
        width: informationWidth,
        lineGap: 3,
        characterSpacing: 0,
      });
  }

  // AUTHORS
  const authors = book.authors
    .map((item) => item.author.name)
    .filter(Boolean);

  if (authors.length) {
    pdf.y += 13;

    pdf
      .font('NotoSans-Bold')
      .fontSize(10)
      .fillColor(COLORS.ink)
      .text(
        authors.join(', '),
        informationX,
        pdf.y,
        {
          width: informationWidth,
          characterSpacing: 0,
        }
      );
  }

  // PUBLICATION DATE
  if (book.publicationDate) {
    pdf.y += 10;

    pdf
      .font('NotoSans')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(
        `Published: ${formatPublicationDate(
          book.publicationDate
        )}`,
        informationX,
        pdf.y,
        {
          width: informationWidth,
          characterSpacing: 0,
        }
      );
  }

  const informationBottom = pdf.y;

  // Continue beneath whichever column is taller.
  pdf.y = Math.max(
    startY + actualCoverHeight,
    informationBottom
  ) + 24;

  ensureSpace(pdf, 30);
}

/* =========================================================
   FORMATS AND PRICES
========================================================= */

function drawFormats(
  pdf: FlyerDocument,
  book: FullBook
): void {
  if (!book.formats.length) return;

  drawSectionHeading(pdf, 'Formats & Prices');

  for (const format of book.formats) {
    ensureSpace(pdf, 47);

    const rowY = pdf.y;

    pdf
      .font('NotoSans-Bold')
      .fontSize(10)
      .fillColor(COLORS.ink)
      .text(
        formatName(format.format),
        PAGE.margin,
        rowY,
        {
          width: 145,
          characterSpacing: 0,
        }
      );

    pdf
      .font('NotoSans-Bold')
      .fontSize(11)
      .fillColor(COLORS.primary)
      .text(
        formatPrice(
          format.priceMinor,
          format.currency
        ),
        PAGE.margin + 160,
        rowY,
        {
          width: 190,
          characterSpacing: 0,
        }
      );

    const rowBottom = pdf.y;

    if (format.isbn) {
      pdf
        .font('NotoSans')
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(
          `ISBN: ${format.isbn}`,
          PAGE.margin,
          rowY + 19,
          {
            width: PAGE.contentWidth,
            characterSpacing: 0,
          }
        );
    }

    pdf.y = Math.max(
      rowBottom,
      format.isbn ? rowY + 34 : rowY + 18
    ) + 9;
  }
}

/* =========================================================
   DESCRIPTION
========================================================= */

function drawDescription(
  pdf: FlyerDocument,
  book: FullBook
): void {
  const description = cleanText(
    book.description || book.shortDescription
  );

  if (!description) return;

  drawSectionHeading(pdf, 'About this book');

  // Preserve separate paragraphs.
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  for (const paragraph of paragraphs) {
    ensureSpace(pdf, 40);

    pdf
      .font('NotoSans')
      .fontSize(9.5)
      .fillColor(COLORS.ink)
      .text(
        paragraph.replace(/\n/g, ' '),
        PAGE.margin,
        pdf.y,
        {
          width: PAGE.contentWidth,
          lineGap: 4,
          characterSpacing: 0,
          align: 'left',
        }
      );

    pdf.y += 12;
  }
}

/* =========================================================
   TABLE OF CONTENTS
========================================================= */

type ContentsSection = {
  title: string;
  items: string[];
};

function parseContents(text: string): ContentsSection[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n');

  const sections: ContentsSection[] = [];

  let current: ContentsSection | null = null;

  for (const rawLine of lines) {
    const line = cleanText(rawLine);

    if (!line) continue;

    // Chapters and the Appendices heading
    if (
      /^Chapter\s+\d+\s*:/i.test(line) ||
      /^Appendices$/i.test(line)
    ) {
      current = {
        title: line,
        items: [],
      };

      sections.push(current);
      continue;
    }

    // Standalone sections
    if (
      /^(Glossary|References|Bibliography|Index)$/i.test(line)
    ) {
      sections.push({
        title: line,
        items: [],
      });

      current = null;
      continue;
    }

    // Appendix entries
    if (/^Appendix\s+[A-Z]\s*:/i.test(line)) {
      let appendices = sections.find(
        (section) => section.title === 'Appendices'
      );

      if (!appendices) {
        appendices = {
          title: 'Appendices',
          items: [],
        };

        sections.push(appendices);
      }

      appendices.items.push(line);
      current = appendices;
      continue;
    }

    // Standard subsection
    if (current) {
      current.items.push(line);
    }
  }

  return sections;
}

function drawTableOfContents(
  pdf: FlyerDocument,
  book: FullBook
): void {
  if (!book.tableOfContents) return;

  const sections = parseContents(
    book.tableOfContents
  );

  if (!sections.length) return;

  // Start TOC on a new page if little space remains.
  if (pdf.y > 600) {
    pdf.addPage();
    pdf.y = PAGE.top;
  }

  drawSectionHeading(pdf, 'Table of Contents');

  for (const section of sections) {
    // Reserve enough space for heading and first item.
    ensureSpace(pdf, section.items.length ? 58 : 32);

    pdf
      .font('NotoSans-Bold')
      .fontSize(10)
      .fillColor(COLORS.primary)
      .text(
        section.title,
        PAGE.margin,
        pdf.y,
        {
          width: PAGE.contentWidth,
          lineGap: 3,
          characterSpacing: 0,
        }
      );

    pdf.y += 8;

    for (const item of section.items) {
      ensureSpace(pdf, 28);

      pdf
        .font('NotoSans')
        .fontSize(9)
        .fillColor(COLORS.ink)
        .text(
          item,
          PAGE.margin + 15,
          pdf.y,
          {
            width: PAGE.contentWidth - 15,
            lineGap: 3,
            characterSpacing: 0,
          }
        );

      pdf.y += 5;
    }

    pdf.y += section.items.length ? 15 : 8;
  }
}

/* =========================================================
   PAGE FOOTERS
========================================================= */

function drawPageFooters(pdf: FlyerDocument): void {
  // All content pages must already be generated.
  const range = pdf.bufferedPageRange();

  const totalPages = range.count;

  for (
    let index = range.start;
    index < range.start + range.count;
    index++
  ) {
    pdf.switchToPage(index);

    const footerY = 795;

    // Temporarily remove the bottom margin so PDFKit
    // can render footer text without creating a new page.
    const previousBottomMargin = pdf.page.margins.bottom;

    pdf.page.margins.bottom = 0;

    try {
      // Separator
      pdf
        .strokeColor(COLORS.border)
        .lineWidth(0.6)
        .moveTo(PAGE.margin, footerY - 13)
        .lineTo(
          PAGE.width - PAGE.margin,
          footerY - 13
        )
        .stroke();

      // Publisher name
      pdf
        .font('NotoSans')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          'HOWACADEMICS · ACADEMIC PUBLISHING',
          PAGE.margin,
          footerY,
          {
            width: 350,
            characterSpacing: 0,
            lineBreak: false,
          }
        );

      // Page number
      pdf
        .font('NotoSans')
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          `${index - range.start + 1} / ${totalPages}`,
          PAGE.width - PAGE.margin - 60,
          footerY,
          {
            width: 60,
            align: 'right',
            characterSpacing: 0,
            lineBreak: false,
          }
        );
    } finally {
      // Restore the original layout settings.
      pdf.page.margins.bottom = previousBottomMargin;
    }
  }
}

/* =========================================================
   MAIN PDF GENERATOR
========================================================= */

export async function sendFlyer(
  res: Response,
  book: FullBook,
  asPreview = false
): Promise<void> {
  // Required for correct Unicode typography and INR symbols.
  if (
    !fs.existsSync(FONT_REGULAR) ||
    !fs.existsSync(FONT_BOLD)
  ) {
    throw new Error(
      'Flyer fonts are missing. Add NotoSans-Regular.ttf ' +
      'and NotoSans-Bold.ttf to apps/api/assets/fonts.'
    );
  }

  const safeSlug =
    book.slug.replace(/[^a-z0-9-]/gi, '') || 'book';

  const fileName =
    `${safeSlug}-product-flyer.pdf`;

  const pdf = new PDFDocument({
    size: 'A4',

    margins: {
      top: PAGE.top,
      bottom: 86,
      left: PAGE.margin,
      right: PAGE.margin,
    },

    bufferPages: true,

    autoFirstPage: true,

    info: {
      Title:
        `${book.title} - HowAcademics Product Flyer`,

      Author: 'HowAcademics',

      Subject:
        'Academic Book Information',

      Creator: 'HowAcademics',
    },
  });

  /* ---------------- FONTS ---------------- */

  pdf.registerFont(
    'NotoSans',
    FONT_REGULAR
  );

  pdf.registerFont(
    'NotoSans-Bold',
    FONT_BOLD
  );

  /* ---------------- HTTP HEADERS ---------------- */

  res.setHeader(
    'Content-Type',
    'application/pdf'
  );

  res.setHeader(
    'Content-Disposition',
    `${
      asPreview ? 'inline' : 'attachment'
    }; filename="${fileName}"`
  );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  /* ---------------- STREAM ---------------- */

  pdf.pipe(res);

  /* ---------------- OPTIONAL LOGO ---------------- */

  // Set FLYER_LOGO_PATH in your API environment to use
  // your real logo. Otherwise, text branding is displayed.
  const logoPath = process.env.FLYER_LOGO_PATH
    ? path.resolve(process.env.FLYER_LOGO_PATH)
    : null;

  /* ---------------- GENERATE CONTENT ---------------- */

  drawHeader(pdf, logoPath);

  await drawBookOverview(pdf, book);

  drawFormats(pdf, book);

  drawDescription(pdf, book);

  drawTableOfContents(pdf, book);

  /* ---------------- PAGE NUMBERS ---------------- */

  drawPageFooters(pdf);

  /* ---------------- FINISH ---------------- */

  pdf.end();
}