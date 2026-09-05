import type { APIRoute } from 'astro';
import { escapeXml, getPostUrl, getPosts, getSiteUrl, siteConfig } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = await getPosts({ includeDrafts: false });
  const latestPostDate = posts[0]?.data.date ?? new Date();

  const items = posts
    .map((post) => {
      const url = getPostUrl(post.id);
      const categories = post.data.tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('');

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      ${categories}
    </item>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${escapeXml(getSiteUrl())}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${latestPostDate.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(getSiteUrl('rss.xml'))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`,
    {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    }
  );
};
