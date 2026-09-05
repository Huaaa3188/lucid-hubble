import { getCollection, type CollectionEntry } from 'astro:content';

export const siteBasePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const siteConfig = {
  name: 'Lucid Hubble',
  description: '服务端工程、开发工具、读书与日常随笔。',
  author: 'Lucid',
  githubUrl: 'https://github.com/huaaa3188',
} as const;

export function getSitePath(path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/';
  return `${siteBasePath}${normalizedPath}`;
}

export function getSiteUrl(path = '') {
  return new URL(getSitePath(path), import.meta.env.SITE).toString();
}

export function getPostPath(postId: string) {
  return getSitePath(`post/${postId}/`);
}

export function getPostUrl(postId: string) {
  return getSiteUrl(`post/${postId}/`);
}

export function serializeJson(value: unknown) {
  return (JSON.stringify(value) ?? 'null')
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
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

type BlogPost = CollectionEntry<'blog'>;

interface GetPostsOptions {
  includeDrafts?: boolean;
}

export async function getPosts({ includeDrafts = import.meta.env.DEV }: GetPostsOptions = {}) {
  const posts = await getCollection('blog', ({ data }) => includeDrafts || data.draft !== true);
  return [...posts].sort((a: BlogPost, b: BlogPost) => b.data.date.getTime() - a.data.date.getTime());
}
