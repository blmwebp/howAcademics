import test from 'node:test';
import assert from 'node:assert/strict';
import { bookDto, slugify, type FullBook } from '../apps/api/src/core';
import { demoBanners, demoBooks } from '../apps/web/src/lib/demo';
import { money } from '../apps/web/src/lib/api';

const fixture = (formats: Array<{ format: string; priceMinor: bigint; currency: string; isbn: string | null }>) =>
  ({
    id: 'fixture', slug: 'fixture', title: 'Fixture Book', status: 'published',
    authors: [], categories: [], keywords: [], formats, coverMedia: null,
  } as unknown as FullBook);

test('no selected format returns no public price rows', () => {
  const output = bookDto(fixture([]), true) as { formats: unknown[] };
  assert.equal(output.formats.length, 0);
  assert.equal(JSON.stringify(output).includes('Not available'), false);
});
test('paperback only returns paperback and its own price', () => {
  const output = bookDto(fixture([
    { format: 'paperback', priceMinor: 95000n, currency: 'INR', isbn: null },
  ]), true) as { formats: Array<{ format: string; priceMinor: number }> };
  assert.deepEqual(output.formats.map((f) => f.format), ['paperback']);
  assert.equal(output.formats[0].priceMinor, 95000);
});
test('hardcover only and both formats remain independent', () => {
  const hardcover = { format: 'hardcover', priceMinor: 145000n, currency: 'INR', isbn: null };
  const paperback = { format: 'paperback', priceMinor: 95000n, currency: 'INR', isbn: null };
  const one = bookDto(fixture([hardcover]), true) as { formats: Array<{ format: string }> };
  const both = bookDto(fixture([paperback, hardcover]), true) as { formats: Array<{ priceMinor: number }> };
  assert.deepEqual(one.formats.map((f) => f.format), ['hardcover']);
  assert.deepEqual(both.formats.map((f) => f.priceMinor), [95000, 145000]);
});
test('demo includes 3 banners, books and no-format example', () => {
  assert.equal(demoBanners.length, 3);
  assert.ok(demoBooks.length >= 8);
  assert.ok(demoBooks.some((book) => book.formats?.length === 0));
  assert.equal(money(95000, 'INR').includes('950'), true);
  assert.equal(slugify('Artificial Intelligence Today'), 'artificial-intelligence-today');
});
