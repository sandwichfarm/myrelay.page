import { writable } from 'svelte/store';

const initialTheme = 'default';

export const theme = writable(initialTheme);

const ROOT = import.meta.env.VITE_PUBLIC_BASE_PATH? `${import.meta.env.VITE_PUBLIC_BASE_PATH}/` : '/';

export const THEMES_PATH = `${ROOT}themes`;

export const loadTheme = (themeName?: string) => {
  if(!themeName) themeName = 'default'
  theme.set(themeName);
  const themeLink = document.getElementById('theme') as HTMLLinkElement | null;
  if (themeLink) {
    themeLink.href = `${THEMES_PATH}/${themeName}.css`;
  } else {
    const link = document.createElement('link');
    link.id = 'theme';
    link.rel = 'preload';
    link.href = `${THEMES_PATH}/${themeName}.css`;
    document.head.appendChild(link);
  }
};