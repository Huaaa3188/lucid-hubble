import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const contentDir = path.join(rootDir, 'src/content/blog');
function getSiteConfig() {
  const configPath = path.join(rootDir, 'astro.config.mjs');
  const configText = readFileSync(configPath, 'utf8');
  const siteMatch = configText.match(/site:\s*['"]([^'"]+)['"]/);
  const baseMatch = configText.match(/base:\s*['"]([^'"]+)['"]/);
  const site = siteMatch ? siteMatch[1].replace(/\/$/, '') : 'https://huaaa3188.github.io';
  const baseRaw = baseMatch ? baseMatch[1].trim() : '';
  const base = (baseRaw === '' || baseRaw === '/') ? '' : `/${baseRaw.replace(/^\/+|\/+$/g, '')}`;
  const siteBaseUrl = `${site}${base}`;
  const localPostPrefix = `${base}/post/`;
  return { site, base, siteBaseUrl, localPostPrefix };
}

const { siteBaseUrl, localPostPrefix } = getSiteConfig();
const rssUrl = `${siteBaseUrl}/rss.xml`;
const sitemapUrl = `${siteBaseUrl}/sitemap.xml`;

const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMarkdownFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectMarkdownFiles(entryPath, base);
    }

    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name.startsWith('_')) {
      return [];
    }

    return [entryPath];
  });
}

function parseFrontmatter(markdown, sourceLabel) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  const data = {};

  if (!match) return data;

  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else if (key === 'draft') {
      // draft 解析失败会让草稿泄漏检查静默失效，必须直接报错
      throw new Error(`${sourceLabel}: draft 字段无法解析为 true/false（实际值: ${value || '空'}），请使用单行语法 draft: true`);
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return data;
}

function getContentEntries() {
  return collectMarkdownFiles(contentDir).map((filePath) => {
    const relativePath = path.relative(contentDir, filePath);
    const id = relativePath.replace(/\.md$/, '').split(path.sep).join('/');
    const frontmatter = parseFrontmatter(readText(filePath), relativePath);

    return {
      id,
      frontmatter,
      isDraft: frontmatter.draft === true,
      sourcePath: filePath,
      url: `${siteBaseUrl}/post/${id}/`,
    };
  });
}

function assertFileExists(relativePath) {
  const filePath = path.join(distDir, relativePath);
  assert(existsSync(filePath), `缺少构建产物: dist/${relativePath}`);
  return filePath;
}

function assertContains(haystack, needle, context) {
  assert(haystack.includes(needle), `${context} 缺少: ${needle}`);
}

function assertNotContains(haystack, needle, context) {
  assert(!haystack.includes(needle), `${context} 不应包含: ${needle}`);
}

function assertNoBareAmpersands(xml, context) {
  const bareAmpersand = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/;
  assert(!bareAmpersand.test(xml), `${context} 存在未转义的 &`);
}

function extractHrefs(html, className) {
  const aTagPattern = /<a\b([^>]*)>/gi;
  const hrefs = [];

  for (const match of html.matchAll(aTagPattern)) {
    const attrs = match[1];
    const classMatch = attrs.match(/class=["']([^"']+)["']/i);
    if (classMatch) {
      const classes = classMatch[1].split(/\s+/);
      if (classes.includes(className)) {
        const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          hrefs.push(hrefMatch[1]);
        }
      }
    }
  }
  return hrefs;
}

const entries = getContentEntries();
const publishedEntries = entries.filter((entry) => !entry.isDraft);
const draftEntries = entries.filter((entry) => entry.isDraft);

const indexPath = assertFileExists('index.html');
const aboutPath = assertFileExists('about/index.html');
const sitemapPath = assertFileExists('sitemap.xml');
const rssPath = assertFileExists('rss.xml');
const robotsPath = assertFileExists('robots.txt');
const ogImagePath = assertFileExists('og-default.png');

if (existsSync(indexPath) && existsSync(aboutPath) && existsSync(sitemapPath) && existsSync(rssPath) && existsSync(robotsPath) && existsSync(ogImagePath)) {
  const indexHtml = readText(indexPath);
  const aboutHtml = readText(aboutPath);
  const sitemapXml = readText(sitemapPath);
  const rssXml = readText(rssPath);
  const robotsTxt = readText(robotsPath);

  assert(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml 缺少 XML 声明');
  assertContains(sitemapXml, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', 'sitemap.xml');
  assertContains(sitemapXml, '</urlset>', 'sitemap.xml');
  assertContains(sitemapXml, `<loc>${siteBaseUrl}/</loc>`, 'sitemap.xml 首页');
  assertContains(sitemapXml, `<loc>${siteBaseUrl}/about/</loc>`, 'sitemap.xml 关于页');
  assertNoBareAmpersands(sitemapXml, 'sitemap.xml');

  assert(rssXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'rss.xml 缺少 XML 声明');
  assertContains(rssXml, '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', 'rss.xml');
  assertContains(rssXml, '</rss>', 'rss.xml');
  assertNoBareAmpersands(rssXml, 'rss.xml');

  assertContains(robotsTxt, `Sitemap: ${sitemapUrl}`, 'robots.txt');
  assertContains(indexHtml, `href="${rssUrl}"`, '首页 RSS 自动发现链接');
  assertContains(aboutHtml, `<link rel="canonical" href="${siteBaseUrl}/about/">`, '关于页 canonical');

  const postLinks = extractHrefs(indexHtml, 'post-card-link');
  assert(
    postLinks.length === publishedEntries.length,
    `首页找到的文章链接数 (${postLinks.length}) 必须等于已发布的文章数 (${publishedEntries.length})`
  );
  assert(
    postLinks.every((href) => href.startsWith(localPostPrefix) && href.endsWith('/')),
    `首页文章链接必须使用 ${localPostPrefix}<slug>/ 格式`
  );

  for (const entry of publishedEntries) {
    const postPagePath = assertFileExists(`post/${entry.id}/index.html`);
    if (!existsSync(postPagePath)) continue;

    const postHtml = readText(postPagePath);
    const localHref = `${localPostPrefix}${entry.id}/`;

    assertContains(indexHtml, `href="${localHref}"`, `首页文章列表 ${entry.id}`);
    assertContains(sitemapXml, `<loc>${entry.url}</loc>`, `sitemap.xml ${entry.id}`);
    assertContains(rssXml, `<link>${entry.url}</link>`, `rss.xml ${entry.id}`);
    assertContains(postHtml, `<link rel="canonical" href="${entry.url}">`, `文章页 ${entry.id}`);
    assertContains(postHtml, '<meta property="og:type" content="article">', `文章页 ${entry.id}`);
    assertContains(postHtml, `<meta property="og:image" content="${siteBaseUrl}/og-default.png">`, `文章页 ${entry.id} og:image`);
    assertContains(postHtml, '<meta property="article:published_time"', `文章页 ${entry.id}`);
    assertContains(postHtml, `href="${rssUrl}"`, `文章页 ${entry.id} RSS 自动发现链接`);
    assertContains(postHtml, '<script type="application/ld+json">', `文章页 ${entry.id}`);
    assertContains(postHtml, '"@type":"BlogPosting"', `文章页 ${entry.id} JSON-LD`);
    assertContains(postHtml, `"url":"${entry.url}"`, `文章页 ${entry.id} JSON-LD URL`);
  }

  for (const entry of draftEntries) {
    const localHref = `${localPostPrefix}${entry.id}/`;

    assertNotContains(indexHtml, localHref, `草稿 ${entry.id} 泄漏到首页`);
    assertNotContains(sitemapXml, entry.url, `草稿 ${entry.id} 泄漏到 sitemap.xml`);
    assertNotContains(rssXml, entry.url, `草稿 ${entry.id} 泄漏到 rss.xml`);
    assert(!existsSync(path.join(distDir, 'post', entry.id, 'index.html')), `草稿 ${entry.id} 生成了文章页`);
  }
}

if (errors.length > 0) {
  console.error(`check-dist failed: ${errors.length} issue(s)`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`check-dist passed: ${publishedEntries.length} published post(s), ${draftEntries.length} draft(s) checked.`);
