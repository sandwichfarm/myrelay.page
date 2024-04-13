import { writable } from 'svelte/store';

const initialTheme = 'classic';

export const theme = writable(initialTheme);

const ROOT = import.meta.env.VITE_PUBLIC_BASE_PATH? `${import.meta.env.VITE_PUBLIC_BASE_PATH}/` : '/';

export const THEMES_PATH = `${ROOT}themes`;

export const loadTheme = async (themeName = 'classic') => {
  return new Promise((resolve, reject) => {
    const themeLink = document.getElementById('theme') as HTMLLinkElement | null;
    const newThemeURL = `${THEMES_PATH}/${themeName}.css`;

    const setTheme = (linkElement: HTMLLinkElement) => {
      if (linkElement.href === newThemeURL) {
        resolve(undefined);
        return;
      }
      linkElement.onload = () => resolve(undefined);
      linkElement.onerror = () => reject(new Error('Theme failed to load.'));
      linkElement.href = `${newThemeURL}?v=${Date.now()}`; 
    };

    if (themeLink) {
      setTheme(themeLink);
    } else {
      const link = document.createElement('link');
      link.id = 'theme';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      setTheme(link);
    }
  });
};
