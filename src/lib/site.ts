import { getCollection } from 'astro:content';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function getSiteUrl(path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/';
  return new URL(`${basePath}${normalizedPath}`, import.meta.env.SITE).toString();
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatSitemapDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatPostDate(date: Date) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  };
  return date.toLocaleDateString('en-US', options);
}

export function formatLogDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function calculateReadingStats(rawContent = '') {
  const content = rawContent.replace(/^---[\s\S]*?---/, '');
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (content.match(/[a-zA-Z0-9_\-]+/g) || []).length;
  const totalWords = chineseChars + englishWords;
  const minutes = Math.max(1, Math.ceil(totalWords / 300));
  return {
    words: totalWords,
    minutes,
    timeText: `${minutes} MIN READ`,
    wordsText: totalWords > 1000 ? `${(totalWords / 1000).toFixed(1)}k 字` : `${totalWords} 字`,
  };
}

export async function getRenderablePosts() {
  const posts = await getCollection('blog', ({ data }) => {
    return import.meta.env.DEV ? true : data.draft !== true;
  });
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

