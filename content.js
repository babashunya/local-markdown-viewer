(function () {
  const url = location.href;
  if (!url.match(/\.(md|markdown|mkd)(\?[^#]*)?(#.*)?$/i)) return;

  const preElement = document.querySelector("pre");
  if (!preElement) return;

  const rawMarkdown = preElement.textContent;

  mermaid.initialize({ startOnLoad: false, theme: "default" });

  function renderMath(tex, displayMode) {
    // throwOnError を切るのは、入力途中の不完全な数式でもプレビュー全体を壊さないため
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  }

  // 数式を marked のトークンとして先に切り出す。
  // 本文として処理されると _ や \\ が強調・エスケープとして解釈され、数式が壊れるため。
  const mathExtensions = [
    {
      name: "mathBlock",
      level: "block",
      start(src) {
        const index = src.indexOf("$$");
        return index < 0 ? undefined : index;
      },
      tokenizer(src) {
        const match = src.match(/^\$\$[ \t]*\n?([\s\S]+?)\n?[ \t]*\$\$[ \t]*(?:\n|$)/);
        if (match) return { type: "mathBlock", raw: match[0], text: match[1].trim() };
      },
      renderer: (token) => `<div class="math-block">${renderMath(token.text, true)}</div>\n`,
    },
    {
      name: "mathInline",
      level: "inline",
      start(src) {
        const index = src.indexOf("$");
        return index < 0 ? undefined : index;
      },
      tokenizer(src) {
        // $$...$$ のインライン記述はディスプレイ数式として扱う
        const display = src.match(/^\$\$([^\n]+?)\$\$/);
        if (display) return { type: "mathInline", raw: display[0], text: display[1].trim(), display: true };
        // 「$5 and $10」のような金額表記を数式と誤認しないよう、$ の内側が空白始まり/終わりのものと直後の数字は除外する
        const inline = src.match(/^\$(?!\s)((?:\\.|[^$\n\\])+?)(?<!\s)\$(?!\d)/);
        if (inline) return { type: "mathInline", raw: inline[0], text: inline[1], display: false };
      },
      renderer: (token) => renderMath(token.text, token.display),
    },
  ];

  marked.use({ extensions: mathExtensions });

  marked.use({
    gfm: true,
    breaks: true,
    renderer: {
      code({ text, lang }) {
        if (lang === "math") {
          return `<div class="math-block">${renderMath(text, true)}</div>`;
        }
        if (lang === "mermaid") {
          return `<div class="mermaid">${text}</div>`;
        }
        const language = lang && hljs.getLanguage(lang) ? lang : null;
        const highlighted = language
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value;
        const langClass = language ? ` language-${language}` : "";
        return `<pre><code class="hljs${langClass}">${highlighted}</code></pre>`;
      },
    },
  });

  const ALERT_ICONS = {
    NOTE: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
    TIP: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.32-.183.215-.365.427-.542.68-.207.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>',
    IMPORTANT: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    WARNING: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    CAUTION: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  };

  const ALERT_LABELS = { NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Warning', CAUTION: 'Caution' };

  function processAlerts(html) {
    const types = 'NOTE|TIP|IMPORTANT|WARNING|CAUTION';
    const re = new RegExp(
      `<blockquote>\\n<p>\\[!(${types})\\](?:<br>)?\\n?([\\s\\S]*?)</blockquote>`,
      'gi'
    );

    return html.replace(re, (_, type, content) => {
      const t = type.toUpperCase();
      const title = `<p class="markdown-alert-title">${ALERT_ICONS[t]} ${ALERT_LABELS[t]}</p>`;
      let body;
      if (content.startsWith('</p>')) {
        // [!TYPE] was on its own line; content follows as separate paragraphs
        body = content.slice(4).trimStart();
      } else {
        // content was inline with [!TYPE] in the same paragraph
        body = `<p>${content}`;
      }
      return `<div class="markdown-alert markdown-alert-${t.toLowerCase()}">${title}${body}</div>`;
    });
  }

  function extractTitle(md) {
    const match = md.match(/^#\s+(.+)$/m);
    if (match) return match[1];
    return decodeURIComponent(url.split("/").pop());
  }

  function buildToc(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const headings = tmp.querySelectorAll("h1, h2, h3, h4");
    let tocHtml = "";
    headings.forEach((h, i) => {
      const level = parseInt(h.tagName[1]);
      const id = `heading-${i}`;
      h.id = id;
      const indent = (level - 1) * 16;
      tocHtml += `<a href="#${id}" class="toc-item toc-h${level}" style="padding-left:${indent}px">${h.textContent}</a>`;
    });
    return { tocHtml, contentHtml: tmp.innerHTML };
  }

  function injectCustomCss() {
    if (document.getElementById("mdv-custom-css")) return;
    const link = document.createElement("link");
    link.id = "mdv-custom-css";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles/markdown.css");
    document.head.appendChild(link);
  }

  function render(markdown) {
    const scrollY = window.scrollY;
    const html = processAlerts(marked.parse(markdown));
    const { tocHtml, contentHtml } = buildToc(html);

    document.title = extractTitle(markdown);
    injectCustomCss();

    document.body.innerHTML = `
      <nav class="toc-sidebar">${tocHtml}</nav>
      <div class="markdown-body">${contentHtml}</div>`;

    window.scrollTo(0, scrollY);
    setupTocHighlight();
    mermaid.run({ nodes: document.querySelectorAll(".mermaid") });
  }

  function setupTocHighlight() {
    const tocLinks = document.querySelectorAll(".toc-item");
    if (tocLinks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((link) => link.classList.remove("active"));
            const activeLink = document.querySelector(
              `.toc-item[href="#${entry.target.id}"]`
            );
            if (activeLink) activeLink.classList.add("active");
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    document.querySelectorAll("h1[id], h2[id], h3[id], h4[id]").forEach((h) => {
      observer.observe(h);
    });
  }

  render(rawMarkdown);

  let lastContent = rawMarkdown;

  function loadFileViaXhr(fileUrl, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", fileUrl, true);
    xhr.onload = function () {
      if (xhr.status === 0 || xhr.status === 200) {
        callback(xhr.responseText);
      }
    };
    xhr.send();
  }

  setInterval(() => {
    loadFileViaXhr(url, (text) => {
      if (text !== lastContent) {
        lastContent = text;
        render(text);
      }
    });
  }, 1000);
})();
