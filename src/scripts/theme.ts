export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';

export function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function syncThemeAria() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const isDark = getCurrentTheme() === 'dark';
  themeToggle.setAttribute('aria-label', isDark ? '切换至亮色模式' : '切换至暗色模式');
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  syncThemeAria();
}

export function toggleTheme() {
  const nextTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  return nextTheme;
}
