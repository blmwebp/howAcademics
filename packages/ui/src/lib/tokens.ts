// Design tokens - CSS variables and constants

export const designTokens = {
  colors: {
    page: '#221e20',
    header: '#1c191a',
    inkInverse: '#cdc5bd',
    paper: '#efeeec',
    ink: '#242022',
    panelDark: '#100f10',
    borderDark: '#393337',
    accent: '#c9b9aa',
  },
  fonts: {
    sans: 'Manrope, Inter, system-ui, sans-serif',
    serif: 'Georgia, serif',
  },
  spacing: {
    contentMax: '1440px',
    sideGutter: 'clamp(20px, 5.8vw, 90px)',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
};

export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export function getBreakpoint(width: number): keyof typeof breakpoints {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}
