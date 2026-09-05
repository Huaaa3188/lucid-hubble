import { toggleTheme } from './theme';
import type { HomePageData, TerminalPost } from './types';

const AUTOCOMPLETE_COMMANDS = [
  'help',
  'ls',
  'll',
  'cat',
  'open',
  'tree',
  'tags',
  'whoami',
  'about',
  'theme',
  'clear',
  'gui',
];

const GEEK_QUOTES = [
  'Talk is cheap. Show me the code. — Linus Torvalds',
  'There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton',
  "There is no cloud, it's just someone else's computer.",
  'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
  'First, solve the problem. Then, write the code. — John Johnson',
  'Make it work, make it right, make it fast. — Kent Beck',
];

let cleanup: (() => void) | null = null;

export function cleanupTerminal() {
  cleanup?.();
  cleanup = null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function findPost(posts: TerminalPost[], target: string) {
  const normalizedId = target.replace(/\.md$/, '').toLowerCase();
  const normalizedFilename = target.toLowerCase();

  return posts.find(
    (post) => post.id.toLowerCase() === normalizedId || post.filename.toLowerCase() === normalizedFilename
  );
}

function scrollToBottom(screen: HTMLElement) {
  screen.scrollTop = screen.scrollHeight;
}

export function initTerminalEmulator({ posts, basePath }: HomePageData) {
  cleanupTerminal();

  const input = document.getElementById('term-input');
  const historyContainer = document.getElementById('terminal-history');
  const screen = document.getElementById('terminal-screen');
  const terminalButton = document.getElementById('btn-mode-term');
  const guiButton = document.getElementById('btn-mode-gui');

  if (!(input instanceof HTMLInputElement) || !historyContainer || !screen) return;

  let commandHistory: string[] = [];
  let historyIndex = -1;
  const matrixIntervals = new Set<number>();

  const setMode = (mode: 'term' | 'gui', save = true) => {
    const isGui = mode === 'gui';
    document.documentElement.classList.toggle('mode-gui', isGui);
    terminalButton?.classList.toggle('is-active', !isGui);
    terminalButton?.setAttribute('aria-pressed', String(!isGui));
    guiButton?.classList.toggle('is-active', isGui);
    guiButton?.setAttribute('aria-pressed', String(isGui));

    if (!isGui) input.focus();
    if (save) localStorage.setItem('terminal_view_mode', mode);
  };

  const isCurrentGui = document.documentElement.classList.contains('mode-gui');
  setMode(isCurrentGui ? 'gui' : 'term', false);

  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    const [command = '', ...args] = trimmed.split(/\s+/);
    const cmd = command.toLowerCase();
    const targetArg = args.join(' ');

    const entry = document.createElement('div');
    entry.className = 'term-entry';

    const commandLine = document.createElement('div');
    commandLine.className = 'term-entry-cmd';
    commandLine.innerHTML = `<span class="term-prompt"><span class="prompt-user">lucid</span>@<span class="prompt-host">hubble</span>:<span class="prompt-path">~/writings</span><span class="prompt-sym">$</span></span> <span>${escapeHtml(trimmed)}</span>`;
    entry.appendChild(commandLine);

    const output = document.createElement('div');
    output.className = 'term-output';

    switch (cmd) {
      case 'help':
        output.innerHTML = `
<table class="term-table">
  <tr><th>COMMAND</th><th>DESCRIPTION</th></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="ls">ls</span> / <span class="term-cmd-inline" data-cmd="ll">ll</span></td><td>List all posts as filesystem entries</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="cat ${escapeHtml(posts[0]?.filename || '')}">cat &lt;file&gt;</span></td><td>Preview post summary, then open the full page</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="open ${escapeHtml(posts[0]?.filename || '')}">open &lt;file&gt;</span></td><td>Navigate directly to post full page</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="neofetch">neofetch</span></td><td>Display system architecture & specs</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="fortune">fortune</span></td><td>Print a random geek quote</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="matrix">matrix</span></td><td>Run retro matrix digital rain animation</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="tags">tags</span></td><td>List all tags and associated articles</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="whoami">whoami / about</span></td><td>Print author info and system spec</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="tree">tree</span></td><td>Print directory tree of digital garden</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="theme">theme</span></td><td>Toggle dark / light theme</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="history">history</span> / <span class="term-cmd-inline" data-cmd="history -c">history -c</span></td><td>View or clear command history</td></tr>
  <tr><td><span class="term-cmd-inline" data-cmd="clear">clear</span> / <span class="term-cmd-inline" data-cmd="reset">reset</span></td><td>Clear screen (Ctrl+L) or reset terminal</td></tr>
</table>`;
        break;

      case 'ls':
      case 'll':
      case 'dir':
        if (posts.length === 0) {
          output.textContent = 'total 0';
        } else {
          let html = `<div class="term-list-count">total ${posts.length}</div>`;
          posts.forEach((post) => {
            html += `
<div class="term-file-row">
  <span class="term-file-permissions">-rw-r--r--</span>
  <span class="term-file-owner">1 lucid staff</span>
  <span class="term-file-size">${escapeHtml(post.wordsText)}</span>
  <span class="term-file-date">${escapeHtml(post.date)}</span>
  <span class="term-file-name" data-filename="${escapeHtml(post.filename)}">${escapeHtml(post.filename)}</span>
  <span class="term-file-comment">// ${escapeHtml(post.title)}</span>
</div>`;
          });
          output.innerHTML = html;
        }
        break;

      case 'cat':
      case 'curl':
        if (!targetArg) {
          output.innerHTML = `<span class="term-error">usage: ${cmd} &lt;filename&gt; (e.g. ${cmd} ${escapeHtml(posts[0]?.filename || 'hello-world.md')})</span>`;
          break;
        }

        {
          const found = findPost(posts, targetArg);
          if (!found) {
            output.innerHTML = `<span class="term-error">${cmd}: ${escapeHtml(targetArg)}: No such file or directory. Try 'ls' to see files.</span>`;
            break;
          }

          output.className = 'term-output term-output-rich';
          const headerInfo = cmd === 'curl' ? '<div class="term-http-status">HTTP/2 200 OK<br/>content-type: text/markdown; charset=utf-8</div>' : '';
          const tags = found.tags.map((tag) => escapeHtml(tag)).join(', ');
          const filename = escapeHtml(found.filename);
          output.innerHTML = `
<div class="term-article-box">
  ${headerInfo}
  <h3>${escapeHtml(found.title)}</h3>
  <div class="term-article-meta">
    <span>DATE: ${escapeHtml(found.date)}</span> ·
    <span>READ_TIME: ${escapeHtml(found.readingTime)}</span> ·
    <span>TAGS: [${tags}]</span>
  </div>
  <div class="term-article-body">${escapeHtml(found.description)}</div>
  <div class="term-article-actions">
    <a href="${escapeHtml(found.url)}" class="term-article-link">[OPEN FULL PAGE -&gt;]</a>
    <span class="term-cmd-inline" data-cmd="open ${filename}">open ${filename}</span>
  </div>
</div>`;
        }
        break;

      case 'neofetch':
      case 'fastfetch':
        output.innerHTML = `
<pre class="term-neofetch">
       __                  _     __
      / /   __  __________(_)___/ /
     / /   / / / / ___/ / / __  /
    / /___/ /_/ / /__/ / / /_/ /
   /_____/\\__,_/\\___/_/_/\\__,_/

   <span class="term-accent">lucid@hubble</span>
   ------------
   <span class="term-amber">OS</span>: Astro 7.1.3 (Static Node/Vite)
   <span class="term-amber">Host</span>: GitHub Pages Edge CDN
   <span class="term-amber">Kernel</span>: Content Layer 7.0 + Zod
   <span class="term-amber">Uptime</span>: 100% (Decentralized Static)
   <span class="term-amber">Shell</span>: Web Zsh Emulator (TS/Vanilla)
   <span class="term-amber">Terminal</span>: Lucid Terminal Theme (GitHub Dark Blue)
   <span class="term-amber">Memory</span>: 0 KB Server State (Pure Client Cache)
</pre>`;
        break;

      case 'fortune':
      case 'quote': {
        const randomQuote = GEEK_QUOTES[Math.floor(Math.random() * GEEK_QUOTES.length)];
        output.innerHTML = `<div class="term-quote">“ ${escapeHtml(randomQuote)} ”</div>`;
        break;
      }

      case 'matrix': {
        let matrixLines = 0;
        const matrixInterval = window.setInterval(() => {
          const line = Array.from({ length: 48 }, () => String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96))).join('');
          output.insertAdjacentHTML('beforeend', `<div class="term-matrix-line">${line}</div>`);
          scrollToBottom(screen);
          matrixLines += 1;

          if (matrixLines > 15) {
            window.clearInterval(matrixInterval);
            matrixIntervals.delete(matrixInterval);
            output.insertAdjacentHTML('beforeend', '<div class="term-matrix-end">[MATRIX STREAM TERMINATED]</div>');
            scrollToBottom(screen);
          }
        }, 80);
        matrixIntervals.add(matrixInterval);
        break;
      }

      case 'open':
      case 'cd':
        if (!targetArg) {
          output.innerHTML = '<span class="term-error">usage: open &lt;filename&gt;</span>';
          break;
        }

        {
          const found = findPost(posts, targetArg);
          if (found) {
            output.innerHTML = `<span class="term-success">Opening ${escapeHtml(found.title)}...</span>`;
            window.location.href = found.url;
          } else {
            output.innerHTML = `<span class="term-error">open: ${escapeHtml(targetArg)}: No such file.</span>`;
          }
        }
        break;

      case 'tree':
        output.innerHTML = `
<pre class="term-tree">
.
├── src/content/blog/
${posts.map((post, index) => `${index === posts.length - 1 ? '└──' : '├──'} ${escapeHtml(post.filename)}`).join('\n')}
├── pages/
│   ├── index.astro
│   ├── about.astro
│   └── post/[slug].astro
└── site.config.ts
</pre>`;
        break;

      case 'tags': {
        const tagMap: Record<string, string[]> = {};
        posts.forEach((post) => {
          post.tags.forEach((tag) => {
            tagMap[tag] ??= [];
            tagMap[tag].push(post.filename);
          });
        });

        let tagHtml = '<div class="term-tag-list">';
        for (const [tag, files] of Object.entries(tagMap)) {
          const fileLinks = files
            .map((file) => `<span class="term-file-name" data-filename="${escapeHtml(file)}">${escapeHtml(file)}</span>`)
            .join(', ');
          tagHtml += `<div><span class="term-accent">[#${escapeHtml(tag)}]</span> -&gt; ${fileLinks}</div>`;
        }
        tagHtml += '</div>';
        output.innerHTML = tagHtml;
        break;
      }

      case 'whoami':
      case 'about':
      case 'man':
        output.innerHTML = `
<div class="term-about">
  <div><strong class="term-accent">Lucid</strong> — Server-side Engineer &amp; Infrastructure Enthusiast.</div>
  <div class="term-about-description">Building minimal, durable, and decentralized digital artifacts.</div>
  <div class="term-about-link-wrap"><a href="${escapeHtml(basePath)}/about/" class="term-about-link">[View Full Profile: ~/about -&gt;]</a></div>
</div>`;
        break;

      case 'theme': {
        const newTheme = toggleTheme();
        output.innerHTML = `<span class="term-success">Theme changed to: ${newTheme}</span>`;
        break;
      }

      case 'clear':
      case 'cls':
        if (targetArg === '-a' || targetArg === '--all') {
          commandHistory = [];
          historyIndex = -1;
        }
        historyContainer.replaceChildren();
        return;

      case 'reset':
        commandHistory = [];
        historyIndex = -1;
        historyContainer.replaceChildren();
        return;

      case 'history':
        if (targetArg === '-c' || targetArg === '--clear' || targetArg === 'clear') {
          commandHistory = [];
          historyIndex = -1;
          output.innerHTML = '<span class="term-success">Command history cleared.</span>';
          break;
        }

        if (commandHistory.length === 0) {
          output.innerHTML = '<span class="term-empty">No command history recorded.</span>';
        } else {
          output.innerHTML = commandHistory.map((commandEntry, index) => `<div>${index + 1}  ${escapeHtml(commandEntry)}</div>`).join('');
        }
        break;

      case 'gui':
      case 'classic':
        setMode('gui');
        output.innerHTML = '<span class="term-success">Switched to classic grid view. (Press ` to toggle)</span>';
        break;

      case 'date':
        output.textContent = new Date().toUTCString();
        break;

      case 'echo':
        output.textContent = targetArg;
        break;

      default:
        output.innerHTML = `<span class="term-error">zsh: command not found: ${escapeHtml(cmd)}. Type <span class="term-cmd-inline" data-cmd="help">help</span> for available commands.</span>`;
        break;
    }

    entry.appendChild(output);
    historyContainer.appendChild(entry);
    scrollToBottom(screen);
  };

  const handleInputKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      const value = input.value;
      input.value = '';
      executeCommand(value);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex -= 1;
        input.value = commandHistory[historyIndex] || '';
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex += 1;
        input.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const current = input.value.trim();
      const filenames = posts.map((post) => post.filename);

      if (current.startsWith('cat ') || current.startsWith('open ')) {
        const [command, prefix = ''] = current.split(' ');
        const match = filenames.find((filename) => filename.startsWith(prefix));
        if (match) input.value = `${command} ${match}`;
      } else {
        const match = AUTOCOMPLETE_COMMANDS.find((command) => command.startsWith(current));
        if (match) input.value = match;
      }
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      historyContainer.replaceChildren();
    }
  };

  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key !== '`' && event.code !== 'Backquote' && event.key !== '·') return;
    if (document.activeElement === input) return;

    event.preventDefault();
    const currentMode = document.documentElement.classList.contains('mode-gui') ? 'gui' : 'term';
    setMode(currentMode === 'term' ? 'gui' : 'term');
  };

  const handleScreenClick = (event: MouseEvent) => {
    input.focus();

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const fileElement = target.closest('.term-file-name') as HTMLElement | null;
    if (fileElement) {
      const filename = fileElement.dataset.filename || '';
      input.value = `cat ${filename}`;
      executeCommand(input.value);
      input.value = '';
      return;
    }

    const commandElement = target.closest('.term-cmd-inline') as HTMLElement | null;
    if (commandElement) {
      const command = commandElement.dataset.cmd || '';
      input.value = command;
      executeCommand(command);
      input.value = '';
    }
  };

  const handleTerminalModeClick = () => setMode('term');
  const handleGuiModeClick = () => setMode('gui');

  terminalButton?.addEventListener('click', handleTerminalModeClick);
  guiButton?.addEventListener('click', handleGuiModeClick);
  input.addEventListener('keydown', handleInputKeydown);
  window.addEventListener('keydown', handleGlobalKeydown);
  screen.addEventListener('click', handleScreenClick);

  cleanup = () => {
    terminalButton?.removeEventListener('click', handleTerminalModeClick);
    guiButton?.removeEventListener('click', handleGuiModeClick);
    input.removeEventListener('keydown', handleInputKeydown);
    window.removeEventListener('keydown', handleGlobalKeydown);
    screen.removeEventListener('click', handleScreenClick);
    matrixIntervals.forEach((interval) => window.clearInterval(interval));
    matrixIntervals.clear();
  };
}
