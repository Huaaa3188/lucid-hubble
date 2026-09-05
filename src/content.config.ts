import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 使用 Astro 最新一代 Content Layer 架构与 glob 内容加载器
const blogCollection = defineCollection({
  // 加载 src/content/blog/ 目录下的所有非下划线开头的 Markdown 文件
  loader: glob({
    pattern: '**/[^_]*.md',
    base: './src/content/blog',
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
