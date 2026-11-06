import type { Book, HomeData, Banner } from './api';
const authors = [
  { id: 'd-a1', name: 'Ananya Mehta', slug: 'ananya-mehta' },
  { id: 'd-a2', name: 'Rohan Kapoor', slug: 'rohan-kapoor' },
  { id: 'd-a3', name: 'Leena Sharma', slug: 'leena-sharma' },
  { id: 'd-a4', name: 'Arjun Sen', slug: 'arjun-sen' },
  { id: 'd-a5', name: 'Nisha Verma', slug: 'nisha-verma' },
];
export const demoCategories = [
  { id: 'd-c1', slug: 'computer-science', name: 'Computer Science' },
  { id: 'd-c2', slug: 'business-management', name: 'Business & Management' },
  { id: 'd-c3', slug: 'research-methods', name: 'Research Methods' },
];
const make = (slug: string, title: string, subtitle: string, authorIndices: number[],
  category: number, price: number, accent: string, formats?: Book['formats']): Book => ({
  id: 'demo-' + slug, slug, title, subtitle,
  shortDescription: `An accessible introduction to ${title.toLowerCase()} for curious learners and professionals.`,
  description: `This demonstration title introduces fundamental ideas, practical approaches and contemporary perspectives in ${title.toLowerCase()}. Replace this sample with genuine publication data through your administration panel.`,
  publicationDate: '2026-09-15', authors: authorIndices.map((i) => authors[i]),
  categories: [demoCategories[category]], pageCount: 280, language: 'en',
  publisherName: 'HowAcademics — demonstration entry',
  formats: formats ?? [{ format: 'paperback', currency: 'INR', priceMinor: price }],
  isDemo: true, coverImage: { altText: `Illustrative cover of ${title}`, url: accent },
});
export const demoBooks: Book[] = [
  make('foundations-of-data-science', 'Foundations of Data Science', 'Concepts, Methods and Applications', [0], 0, 129900, '#315d79',
    [{ format: 'paperback', currency: 'INR', priceMinor: 129900 }, { format: 'hardcover', currency: 'INR', priceMinor: 189900 }]),
  make('machine-learning-essentials', 'Machine Learning Essentials', 'Models and Real-World Practice', [1, 2], 0, 109500, '#8c4c41'),
  make('artificial-intelligence-today', 'Artificial Intelligence Today', 'A Practical Foundation', [3], 0, 139900, '#5e4b8b'),
  make('modern-business-analytics', 'Modern Business Analytics', 'Decisions through Data', [2], 1, 115000, '#62764b'),
  make('leadership-in-a-changing-world', 'Leadership in a Changing World', 'Ideas for Tomorrow', [4], 1, 95000, '#805845'),
  make('economics-of-innovation', 'Economics of Innovation', 'Patterns and Perspectives', [1], 1, 125000, '#7a6378',
    [{ format: 'hardcover', currency: 'INR', priceMinor: 165000 }]),
  make('research-design-handbook', 'The Research Design Handbook', 'From Question to Discovery', [0, 4], 2, 87500, '#476b69'),
  make('academic-writing-made-clear', 'Academic Writing Made Clear', 'Crafting Strong Arguments', [3], 2, 79000, '#9a6b3b'),
  make('essays-on-academic-learning', 'Essays on Academic Learning', 'A Collection of Ideas', [4], 2, 0, '#5a566d', []),
];
export const demoBanners: Banner[] = [
  { id: 'demo-banner-1', headline: 'Ideas that advance knowledge.',
    caption: 'Discover books that open new perspectives, spark curiosity, and make research accessible.', targetIdOrUrl: '/books', isDemo: true },
  { id: 'demo-banner-2', headline: 'Every chapter begins a journey.',
    caption: 'Explore thoughtfully curated titles across technology, business and research.', targetIdOrUrl: '/books?category=computer-science', isDemo: true },
  { id: 'demo-banner-3', headline: 'Knowledge worth turning to.',
    caption: 'Find your next essential academic read in the HowAcademics catalogue.', targetIdOrUrl: '/books?category=research-methods', isDemo: true },
];
export const demoHome: HomeData = {
  banners: demoBanners,
  categorySections: demoCategories.map((category) => ({
    id: 'demo-section-' + category.slug, category,
    books: demoBooks.filter((book) => book.categories.some((c) => c.id === category.id)),
  })),
};
