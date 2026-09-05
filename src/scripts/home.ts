import { cleanupTagFilter, initTagFilter } from './tag-filter';
import { cleanupTerminal, initTerminalEmulator } from './terminal';
import type { HomePageData } from './types';

function readHomePageData() {
  const dataElement = document.getElementById('terminal-data');
  if (!dataElement) return null;

  try {
    const data = JSON.parse(dataElement.textContent || 'null') as HomePageData;
    if (!data || !Array.isArray(data.posts) || typeof data.basePath !== 'string') return null;
    return data;
  } catch (error) {
    console.error('Failed to read terminal data:', error);
    return null;
  }
}

function initHomePage() {
  const data = readHomePageData();
  if (!data) {
    cleanupTerminal();
    cleanupTagFilter();
    return;
  }

  initTerminalEmulator(data);
  initTagFilter();
}

function cleanupHomePage() {
  cleanupTerminal();
  cleanupTagFilter();
}

document.addEventListener('astro:page-load', initHomePage);
document.addEventListener('astro:before-swap', cleanupHomePage);
