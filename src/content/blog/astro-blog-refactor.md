---
title: "页面还在正常运行，我为什么还是重构了它"
date: "2026-09-06"
description: "博客改成终端风之后，页面一直正常运行，但下一次修改变得越来越难找入口。这次我保留 Astro 的静态方案，重新整理了页面、数据和客户端交互之间的关系。"
tags: ["重构", "Astro", "前端", "折腾"]
draft: false
---

把博客改成终端风的几天后，我准备再改一个首页交互。

要改的内容很简单，但我打开 `index.astro` 后，先花了一些时间确认这段逻辑到底属于哪里：全局布局里有一部分，首页里有一部分，文章数据又从 `window` 传进脚本。

每段代码都能找到，但没有一个地方能让我放心地说：改这里就够了。

页面没有出现功能故障，修改成本却开始变高。这就是我决定重构的原因。

## 先确定这次重构不做什么

这次没有引入 React、Vue 或其他客户端框架，也没有准备重写现有交互。

我给自己设了三个限制：

- 保留 Astro 的纯静态构建方式；
- 不增加新的运行时依赖；
- 不改变用户已经在使用的功能。

重构目标只有一个：

> 下一次修改时，能直接找到负责这件事的地方。

因此，拆分依据不是文件大小，而是代码的变化范围。

全站交互放到 `src/scripts/site.ts`，首页负责协调首页模块，终端模拟器、标签筛选和主题状态各自管理。页面文件重新负责结构和构建期数据。

## 先看数据是怎么交接的

原来的首页会把文章数据写入全局变量：

```astro
<script define:vars={{ terminalPostsData, basePath }}>
  window.__POSTS_DATA__ = terminalPostsData;
  window.__BASE_PATH__ = basePath;
</script>
```

这种写法很直接，但数据来源比较隐蔽。客户端脚本依赖哪些字段，要回到页面里寻找；全局变量也会让依赖范围不断扩大。

现在首页输出一个明确的 JSON 数据节点，再由首页脚本读取：

```astro
<script
  id="terminal-data"
  type="application/json"
  set:html={serializeJson({ posts: terminalPostsData, basePath: siteBasePath })}
></script>
<script src="../scripts/home.ts"></script>
```

文章数据的流向也变得清楚：

```text
Markdown
   ↓
Astro Content Layer
   ↓
首页 JSON 数据
   ↓
home.ts
   ├── terminal.ts
   └── tag-filter.ts
```

首页只把终端需要的标题、摘要、日期、标签和链接传给浏览器，文章正文继续由文章详情页负责渲染。

## 再处理页面和站点逻辑

首页的终端模拟器、标签筛选和页面模式切换都属于首页交互。主题切换、阅读进度、代码复制和 TOC 高亮则属于全站交互。

拆开之后，`home.ts` 只负责启动和清理首页模块，具体行为分别位于 `terminal.ts`、`tag-filter.ts` 和 `theme.ts`。

站点 URL 也做了同样的整理。首页、文章页、RSS 和 sitemap 都通过 `src/lib/site.ts` 生成路径和完整 URL，基础路径、文章路径、尾斜杠和 XML 转义集中在同一处处理。

这样，页面不需要自行拼接 `/lucid-hubble/post/<slug>/`，修改站点路径时也有明确入口。

## 页面切换之后，旧状态需要清理

这个博客使用了 Astro 的页面过渡。页面切换时，HTML 会被更新，但浏览器中已经注册的监听器、观察器和定时器需要主动清理。

因此，交互模块都补上了对应的生命周期：

```ts
document.addEventListener('astro:page-load', initSiteInteractions);
document.addEventListener('astro:before-swap', cleanupSiteInteractions);
```

页面离开前：

- 滚动监听会被移除；
- TOC 使用的 `IntersectionObserver` 会断开；
- 终端矩阵动画的 `setInterval` 会被清理；
- 首页模块注册的事件监听器会解除。

只打开一次页面时，这些问题不容易察觉。连续在首页、文章页和 About 页面之间切换，就能看出清理是否完整。

## 终端暂时保留在一个模块里

现在 `terminal.ts` 仍然是客户端代码中最大的一块，命令处理也还集中在一个 `switch` 中。

我暂时保留了这种结构。

当前命令数量还没有多到需要命令注册表、独立处理器和单独的输出渲染器。现在继续拆分，文件数量会增加，理解成本却未必会下降。

等终端命令开始频繁增加，或者不同命令需要单独测试时，再进行下一次拆分会更合适。

代码结构应该跟随真实的变化，提前设计所有可能的扩展，反而会让当前问题变得复杂。

## 验证这次调整

完成重构后运行：

```bash
npm run verify
```

构建结果为：

```text
4 page(s) built
check-dist passed: 2 published post(s), 0 draft(s) checked.
```

随后手动验证了终端命令、主题切换、终端与经典模式切换、标签筛选、文章跳转，以及页面切换后的交互状态。

这次验证覆盖了静态构建、URL、SEO、草稿过滤和主要交互，没有测量页面加载性能，因此文章只记录这些已经实际检查过的结果。

## 修改终于有了入口

回到最开始那个首页交互。

现在要改标签筛选，可以直接进入 `tag-filter.ts`；要改阅读进度，可以查看 `site.ts`；要增加终端命令，可以从 `terminal.ts` 开始。

页面仍然是一个小型静态博客，代码也没有因此变成复杂框架。变化在于，每段逻辑逐渐回到了自己应该负责的位置。

重构的结果不只是代码被拆到了更多文件里。更重要的是，下一次修改时，我可以先找到入口，再开始理解细节。
