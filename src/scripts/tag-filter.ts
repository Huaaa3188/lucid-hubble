let cleanup: (() => void) | null = null;

export function cleanupTagFilter() {
  cleanup?.();
  cleanup = null;
}

export function initTagFilter() {
  cleanupTagFilter();

  const blogSection = document.getElementById('blog');
  if (!blogSection) return;

  const filterBar = document.getElementById('filter-bar');
  const activeTagElement = document.getElementById('active-tag');
  const clearFilterButton = document.getElementById('clear-filter');
  const postCards = Array.from(blogSection.querySelectorAll<HTMLElement>('.post-card'));
  const tagButtons = Array.from(blogSection.querySelectorAll<HTMLButtonElement>('.tag-btn'));

  const setActiveTagButton = (activeTag: string) => {
    tagButtons.forEach((button) => {
      const isActive = button.dataset.tag === activeTag && activeTag !== '';
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const filterTag = (tag: string) => {
    if (!tag) {
      filterBar?.classList.add('hidden');
      if (activeTagElement) activeTagElement.textContent = '';
      setActiveTagButton('');
      postCards.forEach((card) => card.classList.remove('is-filtered-out'));
      return;
    }

    filterBar?.classList.remove('hidden');
    if (activeTagElement) activeTagElement.textContent = `[#${tag}]`;
    setActiveTagButton(tag);

    postCards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(',');
      card.classList.toggle('is-filtered-out', !tags.includes(tag));
    });
  };

  const handleBlogClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const tagButton = target.closest<HTMLButtonElement>('.tag-btn');
    if (!tagButton) return;

    const tag = tagButton.dataset.tag || '';
    filterTag(tagButton.classList.contains('is-active') ? '' : tag);
  };

  const handleClearFilter = () => filterTag('');

  blogSection.addEventListener('click', handleBlogClick);
  clearFilterButton?.addEventListener('click', handleClearFilter);

  cleanup = () => {
    blogSection.removeEventListener('click', handleBlogClick);
    clearFilterButton?.removeEventListener('click', handleClearFilter);
  };
}
