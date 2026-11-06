// Enums for HowAcademics v2.0

// Book status lifecycle
export enum BookStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Book formats (only paperback and hardcover allowed)
export enum BookFormat {
  PAPERBACK = 'paperback',
  HARDCOVER = 'hardcover',
}

// Author credit roles
export enum AuthorCreditRole {
  AUTHOR = 'author',
  EDITOR = 'editor',
  TRANSLATOR = 'translator',
}

// Homepage section sort modes
export enum HomepageSortMode {
  NEWEST = 'newest',
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
  MANUAL = 'manual',
}

// Banner target types
export enum BannerTargetType {
  BOOK = 'book',
  CATEGORY = 'category',
  URL = 'url',
}

// Media asset kinds
export enum MediaKind {
  BOOK_COVER = 'book_cover',
  BANNER = 'banner',
  BRAND_IMAGE = 'brand_image',
}

// Navigation item target types
export enum NavigationTargetType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

// Admin user status
export enum AdminUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Staff roles
export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  CATALOGUE_EDITOR = 'catalogue_editor',
  CONTENT_MANAGER = 'content_manager',
  VIEWER = 'viewer',
}

// Permissions (granular capabilities)
export enum Permission {
  // Books
  BOOK_READ = 'book.read',
  BOOK_WRITE = 'book.write',
  BOOK_PUBLISH = 'book.publish',
  BOOK_DELETE = 'book.delete',

  // Authors
  AUTHOR_READ = 'author.read',
  AUTHOR_WRITE = 'author.write',
  AUTHOR_DELETE = 'author.delete',

  // Categories
  CATEGORY_READ = 'category.read',
  CATEGORY_WRITE = 'category.write',
  CATEGORY_DELETE = 'category.delete',

  // Homepage
  HOME_MANAGE = 'home.manage',

  // Banners
  BANNER_MANAGE = 'banner.manage',

  // Media
  MEDIA_READ = 'media.read',
  MEDIA_WRITE = 'media.write',
  MEDIA_DELETE = 'media.delete',

  // Search
  SEARCH_MANAGE = 'search.manage',

  // Settings
  SETTINGS_UPDATE = 'settings.update',

  // Staff
  USER_MANAGE = 'user.manage',
  ROLE_MANAGE = 'role.manage',

  // Audit
  AUDIT_VIEW = 'audit.view',
}

// Sort options for catalogue
export enum SortOption {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
}
