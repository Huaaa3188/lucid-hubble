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
