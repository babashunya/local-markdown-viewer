(function () {
  const url = location.href;
  if (!url.match(/\.(md|markdown|mkd)(\?[^#]*)?(#.*)?$/i)) return;

  const preElement = document.querySelector("pre");
  if (!preElement) return;

  const rawMarkdown = preElement.textContent;

  mermaid.initialize({ startOnLoad: false, theme: "default" });

  marked.use({
    gfm: true,
    breaks: true,
    renderer: {
      code({ text, lang }) {
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

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // YAML front matter を縦向き（キー | 値）のテーブルとして表示する
  function renderFrontMatter(markdown) {
    const match = markdown.match(/^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!match) return { frontMatterHtml: "", body: markdown };

    const entries = [];
    match[1].split(/\r?\n/).forEach((line) => {
      const kv = line.match(/^([^\s#:][^:]*):\s*(.*)$/);
      if (kv) {
        entries.push([kv[1].trim(), kv[2].trim()]);
      } else if (entries.length && line.trim() && !line.trim().startsWith("#")) {
        // 複数行の値（リスト等）は直前のキーに連結
        const last = entries[entries.length - 1];
        last[1] = (last[1] ? last[1] + " " : "") + line.trim().replace(/^-\s+/, "");
      }
    });
    if (!entries.length) return { frontMatterHtml: "", body: markdown };

    const unquote = (v) => v.replace(/^(["'])(.*)\1$/, "$2");
    const rows = entries
      .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(unquote(v))}</td></tr>`)
      .join("");
    return {
      frontMatterHtml: `<table class="front-matter"><tbody>${rows}</tbody></table>`,
      body: markdown.slice(match[0].length),
    };
  }

  function render(markdown) {
    const scrollY = window.scrollY;
    const { frontMatterHtml, body } = renderFrontMatter(markdown);
    const html = frontMatterHtml + marked.parse(body);
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
