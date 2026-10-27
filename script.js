/*
 * Landing page behaviour: theme toggle, interactive switcher demo,
 * install tabs, click-to-copy, scroll reveal.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  const THEME_KEY = 'yts-landing-theme';
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function readStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable: theme just won't persist */
    }
  }

  function applyTheme(theme) {
    if (theme) root.dataset.theme = theme;
    const resolved = theme || (darkQuery.matches ? 'dark' : 'light');
    root.dataset.resolvedTheme = resolved;
  }

  function initTheme() {
    applyTheme(readStoredTheme());
    darkQuery.addEventListener('change', () => applyTheme(root.dataset.theme || null));
    document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
      const next = root.dataset.resolvedTheme === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      applyTheme(next);
    });
  }

  // ---------------------------------------------------------------------------
  // Interactive demo — mirrors the extension's hover dropdown
  // ---------------------------------------------------------------------------

  const SHOW_DELAY_MS = 150;
  const HIDE_DELAY_MS = 250;

  const demoAccounts = [
    { id: 'personal', name: 'Alex Rivera', byline: '@alexrivera', group: 'alex.rivera@example.com', color: '#8e5cf7' },
    { id: 'brand', name: 'Cooking with Alex', byline: '@cookingwithalex · Brand account', group: 'alex.rivera@example.com', color: '#f2994a' },
    { id: 'work', name: 'Northwind Studio', byline: '@northwind-studio', group: 'alex@northwind.example', color: '#27ae60' },
  ];

  const demo = {
    avatar: document.querySelector('[data-demo-avatar]'),
    letter: document.querySelector('[data-demo-avatar-letter]'),
    dropdown: document.querySelector('[data-demo-dropdown]'),
    body: document.querySelector('[data-demo-body]'),
    toast: document.querySelector('[data-demo-toast]'),
    selectedId: 'personal',
    showTimer: 0,
    hideTimer: 0,
    switching: false,
  };

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function checkIcon() {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'demo-check');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');
    svg.appendChild(path);
    return svg;
  }

  function renderDemoDropdown() {
    const children = [];
    let lastGroup = null;
    for (const account of demoAccounts) {
      if (account.group !== lastGroup) {
        children.push(make('div', 'demo-group', account.group));
        lastGroup = account.group;
      }
      const selected = account.id === demo.selectedId;
      const row = make('button', 'demo-row' + (selected ? ' selected' : ''));
      row.type = 'button';
      row.setAttribute('role', 'menuitemradio');
      row.setAttribute('aria-checked', String(selected));

      const avatar = make('span', 'demo-row-avatar', account.name[0]);
      avatar.style.background = account.color;
      const text = make('span', 'demo-row-text');
      text.append(make('span', 'demo-row-name', account.name), make('span', 'demo-row-byline', account.byline));
      row.append(avatar, text);
      if (selected) row.appendChild(checkIcon());

      row.addEventListener('click', () => switchDemoAccount(account, row));
      children.push(row);
    }
    demo.dropdown.replaceChildren(...children);
  }

  function showDemo() {
    if (!demo.dropdown.hidden) return;
    renderDemoDropdown();
    demo.dropdown.hidden = false;
    demo.avatar.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => demo.dropdown.classList.add('open'));
  }

  function hideDemo() {
    if (demo.switching) return;
    demo.dropdown.classList.remove('open');
    demo.dropdown.hidden = true;
    demo.avatar.setAttribute('aria-expanded', 'false');
  }

  function scheduleShow() {
    clearTimeout(demo.hideTimer);
    clearTimeout(demo.showTimer);
    demo.showTimer = setTimeout(showDemo, SHOW_DELAY_MS);
  }

  function scheduleHide() {
    clearTimeout(demo.showTimer);
    clearTimeout(demo.hideTimer);
    demo.hideTimer = setTimeout(hideDemo, HIDE_DELAY_MS);
  }

  function showToast(message) {
    demo.toast.textContent = message;
    demo.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { demo.toast.hidden = true; }, 2200);
  }

  function switchDemoAccount(account, row) {
    if (account.id === demo.selectedId || demo.switching) return;
    demo.switching = true;

    row.classList.add('switching');
    const byline = row.querySelector('.demo-row-byline');
    byline.replaceChildren(make('span', 'demo-spinner'), document.createTextNode('Switching…'));
    demo.dropdown.querySelectorAll('.demo-row').forEach((r) => { if (r !== row) r.disabled = true; });

    setTimeout(() => {
      // Simulated page reload, landing on the same video and timestamp.
      demo.switching = false;
      hideDemo();
      demo.body.classList.add('reloading');
      setTimeout(() => {
        demo.selectedId = account.id;
        demo.letter.textContent = account.name[0];
        demo.avatar.style.background = account.color;
        demo.body.classList.remove('reloading');
        showToast(`Now watching as ${account.name}, still at 1:21`);
      }, 450);
    }, 900);
  }

  function initDemo() {
    const { avatar, dropdown } = demo;
    avatar.addEventListener('mouseenter', scheduleShow);
    avatar.addEventListener('mouseleave', scheduleHide);
    dropdown.addEventListener('mouseenter', () => clearTimeout(demo.hideTimer));
    dropdown.addEventListener('mouseleave', scheduleHide);

    // Tap / keyboard: toggle immediately.
    avatar.addEventListener('click', () => {
      clearTimeout(demo.showTimer);
      if (dropdown.hidden) {
        showDemo();
        const first = dropdown.querySelector('.demo-row:not(.selected)');
        if (first && avatar.matches(':focus-visible')) first.focus();
      } else {
        hideDemo();
      }
    });

    document.addEventListener('pointerdown', (event) => {
      if (dropdown.hidden) return;
      if (dropdown.contains(event.target) || avatar.contains(event.target)) return;
      hideDemo();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !dropdown.hidden) {
        hideDemo();
        avatar.focus();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Install tabs (ARIA tabs pattern with arrow-key support)
  // ---------------------------------------------------------------------------

  function initTabs() {
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const panels = [...document.querySelectorAll('[data-panel]')];

    function select(tab) {
      for (const t of tabs) {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      }
      for (const panel of panels) panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const next = tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });

    // Default to Firefox for Firefox visitors.
    if (/firefox/i.test(navigator.userAgent)) {
      const firefoxTab = tabs.find((t) => t.dataset.tab === 'firefox');
      if (firefoxTab) select(firefoxTab);
    }
  }

  // ---------------------------------------------------------------------------
  // Click-to-copy for browser URLs (they can't be linked to directly)
  // ---------------------------------------------------------------------------

  function initCopy() {
    const note = document.querySelector('[data-copy-note]');
    for (const code of document.querySelectorAll('.copyable')) {
      code.title = 'Click to copy';
      code.tabIndex = 0;
      const copy = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent);
          note.textContent = `Copied ${code.textContent} — paste it into your address bar.`;
        } catch {
          note.textContent = 'Copy failed — select the text and copy it manually.';
        }
      };
      code.addEventListener('click', copy);
      code.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          copy();
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Scroll reveal
  // ---------------------------------------------------------------------------

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -60px 0px' });
    items.forEach((el) => observer.observe(el));
  }

  // ---------------------------------------------------------------------------

  document.querySelector('[data-year]').textContent = String(new Date().getFullYear());
  initTheme();
  initDemo();
  initTabs();
  initCopy();
  initReveal();
})();
