(function () {
  const url = location.href;
  if (!url.match(/\.(md|markdown|mkd)(\?[^#]*)?(#.*)?$/i)) return;

  const preElement = document.querySelector("pre");
  if (!preElement) return;

  const rawMarkdown = preElement.textContent;

  marked.use({
    gfm: true,
    breaks: true,
    renderer: {
      code({ text, lang }) {
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

  function render(markdown) {
    const scrollY = window.scrollY;
    const html = marked.parse(markdown);
    const { tocHtml, contentHtml } = buildToc(html);

    document.title = extractTitle(markdown);
    injectCustomCss();

    document.body.innerHTML = `
      <nav class="toc-sidebar">${tocHtml}</nav>
      <div class="markdown-body">${contentHtml}</div>`;

    window.scrollTo(0, scrollY);
    setupTocHighlight();
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
