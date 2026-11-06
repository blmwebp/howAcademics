# ADR-001: Monorepo Structure and Tech Stack Selection

## Status

Accepted

## Context

HowAcademics requires three distinct applications:
1. A public React/Vite client-rendered book catalogue
2. An admin dashboard SPA
3. A REST API backend

We need to manage shared code (types, validation schemas, UI primitives) across these applications while maintaining clear separation of concerns.

## Decision

### Monorepo with npm Workspaces

We chose npm workspaces over pnpm or yarn for the following reasons:
- npm is pre-installed in the target environment
- No additional tool installation required
- Sufficient for our dependency management needs
- Wide compatibility with CI/CD systems

### Tech Stack Rationale

**Frontend Frameworks**
- React 19: Latest stable version with improved performance
- Vite: Fast build tool with excellent DX
- TypeScript: Type safety across the stack
- Tailwind CSS: Utility-first CSS matching the reference design's needs
- React Router: Vite-compatible routing solution (not Next.js to avoid framework switch)

**Backend**
- Node.js + Express: Proven, well-documented, lightweight
- TypeScript: Shared type safety with frontend
- Prisma ORM: Type-safe database access with excellent migration support
- PostgreSQL: Robust relational database for complex academic metadata

**Design System**
- Shared UI package with Tailwind configuration
- Design tokens in CSS variables for easy theming
- Manrope (or Inter) for headings, Georgia for editorial text
- Color palette inspired by UNSW Press but with original branding

### Package Structure

```
packages/
  ui/          - Design tokens, utilities, shared components
  contracts/   - API schemas, DTOs, enums, Zod validation
  config/      - ESLint, Prettier, TypeScript shared config
```

## Consequences

### Positive
- Single source of truth for types and validation
- Consistent code style across applications
- Easy to share design tokens
- Atomic commits can span packages

### Negative
- Slightly more complex initial setup
- Need to manage inter-package dependencies
- Build times may increase as packages grow

### Mitigations
- Clear separation of concerns in package design
- Minimal coupling between packages
- Type-safe imports across workspace boundaries

## Alternatives Considered

1. **Separate Repositories**: Would make sharing code difficult
2. **Nx/Turborepo**: Overkill for current scope, added complexity
3. **Next.js**: Not necessary for the present client-rendered Vite catalogue; SSR/prerendering remains a future SEO enhancement
4. **pnpm/yarn**: Additional tooling not available in target environment

## References

- [Vite SSR Guide](https://vite.dev/guide/ssr)
- [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Prisma documentation](https://www.prisma.io/docs/orm)
