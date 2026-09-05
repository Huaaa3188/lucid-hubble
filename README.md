# Lucid Hubble

一个基于 Astro 7 的静态个人博客。内容由 Markdown 管理，构建产物通过 GitHub Actions 发布到 GitHub Pages：
[https://huaaa3188.github.io/lucid-hubble/](https://huaaa3188.github.io/lucid-hubble/)

当前正式 canonical 仍指向 GitHub Pages 子路径。如果以后迁到自定义域名，需要同步更新 `astro.config.mjs` 和 `scripts/check-dist.mjs`。

## 功能概览

- Astro Content Layer 管理 `src/content/blog/*.md`。
- `draft: true` 本地开发可见，生产构建自动过滤。
- 首页文章列表支持标签筛选。
- 文章页包含 canonical、OG、JSON-LD、版权尾注与阅读进度条。
- 站点自动生成 `sitemap.xml`、`rss.xml`、`robots.txt`。
- `npm run verify` 会构建并检查静态产物契约。
- `npm run new:post` 可生成新文章草稿模板。

## 目录结构

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages 部署流水线
├── astro.config.mjs               # Astro 配置；当前 site/base 面向 GitHub Pages
├── package.json                   # npm scripts 与依赖
├── scripts/
│   ├── check-dist.mjs             # dist 构建产物契约检查
│   └── new-post.mjs               # 文章草稿生成脚本
└── src/
    ├── content.config.ts          # Content Layer schema
    ├── content/blog/              # Markdown 文章源
    ├── layouts/Layout.astro       # 全站布局、head、导航与页脚
    ├── lib/site.ts                # 站点/文章 URL、内容查询、XML 转义
    ├── scripts/
    │   ├── site.ts                # 主题、阅读进度、代码复制与 TOC
    │   ├── home.ts                # 首页交互初始化与页面切换清理
    │   ├── terminal.ts            # 终端模拟器与命令处理
    │   ├── tag-filter.ts          # 经典文章标签筛选
    │   ├── theme.ts               # 主题状态与无障碍标签同步
    │   └── types.ts               # 客户端交互数据类型
    ├── pages/
    │   ├── index.astro            # 首页与文章列表标记
    │   ├── about.astro            # About 页面
    │   ├── post/[slug].astro      # 文章详情页
    │   ├── robots.txt.ts          # robots.txt
    │   ├── rss.xml.ts             # RSS feed
    │   └── sitemap.xml.ts         # sitemap
    └── styles/global.css          # 全局样式与排版系统
```

不要手改 `.astro/`、`dist/`、`node_modules/`。

## 本地开发

要求 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

开发服务默认端口是 `8000`。因为项目配置了 GitHub Pages 子路径，访问地址是：

```text
http://localhost:8000/lucid-hubble/
```

## 常用命令

```bash
# 本地开发
npm run dev

# 静态构建
npm run build

# 预览构建产物
npm run preview

# 检查已有 dist 产物
npm run check:dist

# 构建并检查 dist 契约
npm run verify
```

`npm run verify` 会检查：

- 首页、RSS、sitemap、robots 是否生成。
- sitemap / RSS 的基础 XML 结构。
- 首页文章链接是否使用 `/lucid-hubble/post/<slug>/`。
- 已发布文章是否进入首页、RSS、sitemap，并生成文章页。
- 草稿是否没有泄漏到生产产物。
- 文章页是否包含 canonical、`og:type=article`、发布时间、RSS 自动发现和 `BlogPosting` JSON-LD。

## 写作流程

推荐用脚本创建草稿：

```bash
npm run new:post
```

也可以传参创建或 dry-run：

```bash
npm run new:post -- \
  --title "A Maintainable Writing Workflow" \
  --slug maintainable-writing-workflow \
  --description "Testing the post generator without writing a file." \
  --tags "writing,workflow" \
  --dry-run
```

生成的 Markdown Frontmatter 结构：

```markdown
---
title: "我的文章标题"
date: "2026-06-09"
description: "这是一句文章摘要。"
tags: ["随笔", "技术"]
draft: true
---
```

发布文章前把 `draft` 改为 `false`，然后运行：

```bash
npm run verify
```

## 部署

仓库通过 GitHub Actions 部署到 GitHub Pages。推送到 `main` 分支后，`.github/workflows/deploy.yml` 会安装依赖、运行 `npm run verify`，然后把 `dist/` 上传为 Pages artifact 并发布。

当前 `astro.config.mjs`：

```js
site: 'https://huaaa3188.github.io',
base: '/lucid-hubble',
```

如果以后切到 Cloudflare Pages 或自定义域名，通常需要删除 `base`，并把 `site` 与 `scripts/check-dist.mjs` 中的 `siteBaseUrl` 一起改成新正式域名。

## 维护注意事项

- 改 Frontmatter schema 时，同步检查 `src/content/blog/` 和 `scripts/new-post.mjs`。
- 改首页或全站交互时，优先检查 `src/scripts/` 中对应模块，并验证 Astro 页面切换后的重新初始化。
- 改 URL、canonical、RSS、sitemap、robots 时，必须跑 `npm run verify`。
- 不要提前把 canonical 切到尚未正式承载的域名。
- 生产环境不应包含 `draft: true` 文章；`scripts/check-dist.mjs` 会检查这一点。
