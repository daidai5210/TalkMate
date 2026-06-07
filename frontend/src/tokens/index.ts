/**
 * TalkMate Scheme C — token constants for TS consumers.
 * Visual values live in variables.css; import that file once in index.css.
 */

export const appLayout = {
  maxWidth: 'var(--app-max-width)',
  bottomNavHeight: 'var(--app-bottom-nav-height)',
  safeTop: 'var(--app-safe-top)',
  safeBottom: 'var(--app-safe-bottom)',
} as const;

export const radius = {
  sm: 'var(--primitive-radius-sm)',
  md: 'var(--primitive-radius-md)',
  lg: 'var(--primitive-radius-lg)',
  xl: 'var(--primitive-radius-xl)',
} as const;

export const semantic = {
  bgPrimary: 'var(--bg-primary)',
  bgSecondary: 'var(--bg-secondary)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  colorPrimary: 'var(--color-primary)',
  borderDefault: 'var(--border-default)',
} as const;

export const immersive = {
  bgBase: 'var(--immersive-bg-base)',
  textPrimary: 'var(--immersive-text-primary)',
  textSecondary: 'var(--immersive-text-secondary)',
  surfaceGlass: 'var(--immersive-surface-glass)',
  borderGlass: 'var(--immersive-border-glass)',
} as const;

export const component = {
  btnPrimaryBg: 'var(--btn-primary-bg)',
  cardBg: 'var(--card-bg)',
  cardRadius: 'var(--card-radius)',
  sheetBg: 'var(--sheet-bg)',
} as const;
