import { syncThemeAria, toggleTheme } from './theme';

let tocObserver: IntersectionObserver | null = null;
let themeToggleCleanup: (() => void) | null = null;

function initThemeToggle() {
  themeToggleCleanup?.();
  themeToggleCleanup = null;

  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const handleToggle = () => toggleTheme();
  themeToggle.addEventListener('click', handleToggle);
  syncThemeAria();
  themeToggleCleanup = () => themeToggle.removeEventListener('click', handleToggle);
}

function updateProgress() {
  const progressBar = document.getElementById('read-progress');
  if (!progressBar) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
  progressBar.style.width = `${scrollPercent}%`;
}

function initProgressBar() {
  const progressBar = document.getElementById('read-progress');
  if (!progressBar) return;

  window.removeEventListener('scroll', updateProgress);

  const isArticlePage = document.querySelector('article.post-detail-article');
  if (!isArticlePage) {
    progressBar.style.width = '0%';
    return;
  }

  window.addEventListener('scroll', updateProgress);
  updateProgress();
}

function initCodeBlocks() {
  const codeBlocks = document.querySelectorAll<HTMLPreElement>('.post-content pre');

  codeBlocks.forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';

    const header = document.createElement('div');
    header.className = 'code-header';

    const dots = document.createElement('div');
    dots.className = 'console-dots';
    dots.innerHTML = '<span class="console-dot dot-red"></span><span class="console-dot dot-yellow"></span><span class="console-dot dot-green"></span>';

    const language = pre.getAttribute('data-language') || 'code';
    const languageElement = document.createElement('span');
    languageElement.className = 'code-lang';
    languageElement.textContent = `[${language.toUpperCase()}]`;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-btn';
    copyButton.type = 'button';
    copyButton.textContent = 'COPY';
    copyButton.setAttribute('aria-label', '复制代码');

    copyButton.addEventListener('click', async () => {
      const codeText = pre.querySelector('code')?.innerText || pre.innerText;

      try {
        await navigator.clipboard.writeText(codeText);
        copyButton.textContent = 'COPIED ✓';
        copyButton.classList.add('copied');
        window.setTimeout(() => {
          copyButton.textContent = 'COPY';
          copyButton.classList.remove('copied');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    });

    header.append(dots, languageElement, copyButton);
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.append(header, pre);
  });
}

function initTocScrollSpy() {
  tocObserver?.disconnect();
  tocObserver = null;

  const headings = document.querySelectorAll<HTMLElement>('.post-content h2, .post-content h3');
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>('.toc-link');
  if (!headings.length || !tocLinks.length) return;

  tocObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const id = entry.target.getAttribute('id');
        tocLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  headings.forEach((heading) => tocObserver?.observe(heading));
}

function initSiteInteractions() {
  initThemeToggle();
  initProgressBar();
  initCodeBlocks();
  initTocScrollSpy();
}

function cleanupSiteInteractions() {
  themeToggleCleanup?.();
  themeToggleCleanup = null;
  window.removeEventListener('scroll', updateProgress);
  tocObserver?.disconnect();
  tocObserver = null;
}

document.addEventListener('astro:page-load', initSiteInteractions);
document.addEventListener('astro:before-swap', cleanupSiteInteractions);
