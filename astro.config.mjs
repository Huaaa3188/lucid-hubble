import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://huaaa3188.github.io',
  base: '/lucid-hubble',
  
  output: 'static',
  trailingSlash: 'always',
  
  // Astro 7 智能链接预加载体系
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  
  // Astro 7 实验性性能增强：Speculation Rules 极速预渲染
  experimental: {
    clientPrerender: true,
  },

  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: true
    }
  }
});
