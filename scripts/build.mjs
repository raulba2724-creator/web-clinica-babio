import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const contentDirectory = path.join(root, "content");
const postsDirectory = path.join(contentDirectory, "posts");
const baseUrl = "https://clinicababio.es";

if (path.dirname(output) !== root || path.basename(output) !== "dist") {
  throw new Error("La carpeta de publicación no es segura.");
}

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const cleanAssetPath = (value = "") => escapeHtml(String(value).replace(/^\//, ""));
const imageDimensions = (item) => item.image_width && item.image_height
  ? ` width="${escapeHtml(item.image_width)}" height="${escapeHtml(item.image_height)}"`
  : "";
const categoryLabels = { clinica: "Clínica", consejos: "Consejos", avisos: "Avisos" };
const categoryLabel = (value) => categoryLabels[value] || "Noticias";
const formatDate = (value) => new Intl.DateTimeFormat("es-ES", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid",
}).format(new Date(`${String(value).slice(0, 10)}T12:00:00+02:00`));

const replaceMarker = (html, name, rendered) => {
  const expression = new RegExp(`(\\s*<!-- CMS:${name}_START -->)[\\s\\S]*?(<!-- CMS:${name}_END -->)`);
  if (!expression.test(html)) throw new Error(`No se encuentra el bloque CMS:${name}.`);
  return html.replace(expression, `$1\n${rendered}\n          $2`);
};

const renderHomeCard = (item) => {
  const isPost = Boolean(item.slug);
  const href = isPost ? `/noticias/${escapeHtml(item.slug)}/` : `/noticias.html#${escapeHtml(item.category)}`;
  return `          <article class="news-card">
            <img src="${cleanAssetPath(item.image)}" alt="${escapeHtml(item.image_alt)}" />
            <div class="news-card-copy">
              <p class="news-meta">${escapeHtml(isPost ? categoryLabel(item.category) : item.label)}</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.excerpt)}</p>
              <a class="news-placeholder-link" href="${href}">${isPost ? "Leer noticia" : "Ver publicaciones"}</a>
            </div>
          </article>`;
};

const renderBoardCard = (item, placeholder = false) => `            <article class="news-card news-board-item" data-news-category="${escapeHtml(item.category)}">
              <img src="${cleanAssetPath(item.image)}" alt="${escapeHtml(item.image_alt)}"${imageDimensions(item)} loading="lazy" decoding="async" />
              <div class="news-card-copy">
                <p class="news-meta">${escapeHtml(categoryLabel(item.category))}</p>${placeholder ? "" : `<time class="news-date" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>`}
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.excerpt)}</p>
                ${placeholder ? '<span class="news-placeholder-link">Próximamente</span>' : `<a class="news-placeholder-link" href="/noticias/${escapeHtml(item.slug)}/">Leer noticia</a>`}
              </div>
            </article>`;

const renderSectorCase = (item) => `              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="detail-case-inline">
                <figure class="detail-case-figure">
                  <img src="${cleanAssetPath(item.before_image)}" alt="${escapeHtml(item.before_alt)}" />
                  <figcaption>${escapeHtml(item.before_caption)}</figcaption>
                </figure>
                <figure class="detail-case-figure">
                  <img src="${cleanAssetPath(item.after_image)}" alt="${escapeHtml(item.after_alt)}" />
                  <figcaption>${escapeHtml(item.after_caption)}</figcaption>
                </figure>
              </div>${item.video ? `
              <figure class="detail-case-video">
                <video controls playsinline preload="metadata" aria-label="Vídeo del caso de ${escapeHtml(item.title)}">
                  <source src="${cleanAssetPath(item.video)}" type="video/mp4" />
                  Tu navegador no puede reproducir este vídeo.
                </video>
                ${item.video_caption ? `<figcaption>${escapeHtml(item.video_caption)}</figcaption>` : ""}
              </figure>` : ""}`;

const inlineMarkdown = (value) => escapeHtml(value)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
  .replace(/\[([^\]]+)\]\((tel:[^\s)]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>");

const renderMarkdown = (markdown = "") => {
  const lines = String(markdown).replaceAll("\r", "").split("\n");
  const result = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) result.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) result.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+\.\s+(.+)$/);
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (heading) { flushParagraph(); flushList(); const level = heading[1].length; result.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); continue; }
    if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list && list.type !== type) flushList();
      list ||= { type, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    flushList(); paragraph.push(line.trim());
  }
  flushParagraph(); flushList();
  return result.join("\n              ");
};

const articlePage = (post) => {
  const canonical = `${baseUrl}/noticias/${post.slug}/`;
  const imageUrl = `${baseUrl}/${String(post.image).replace(/^\//, "")}`;
  const seoTitle = post.seo_title || `${post.title} | Clínica Dental Doctor Babío`;
  const metaDescription = post.meta_description || post.excerpt;
  const dateModified = post.date_modified || post.date;
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
    description: metaDescription, datePublished: post.date, dateModified, image: imageUrl,
    mainEntityOfPage: canonical,
    publisher: { "@type": "Dentist", name: "Clínica Dental Doctor Babío", url: `${baseUrl}/` },
  }).replaceAll("<", "\\u003c");
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(seoTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}" />
    <meta name="theme-color" content="#0f4572" />
    <meta property="og:title" content="${escapeHtml(post.title)}" />
    <meta property="og:description" content="${escapeHtml(metaDescription)}" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="es_ES" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(post.title)}" />
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" type="image/png" href="/assets/images/logo-unificado.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
    <script type="application/ld+json">${schema}</script>
  </head>
  <body>
    <div class="site-background" aria-hidden="true"></div>
    <div class="page-shell">
      <header class="site-header">
        <a class="brand" href="/" aria-label="Volver a Clínica Dental Doctor Babío">
          <img class="brand-logo" src="/assets/images/logo-unificado.png" alt="Logo de Clínica Dental Doctor Babío" />
          <span class="brand-copy"><strong>Clínica Dental Doctor Babío</strong><span>Clínica dental en Sevilla</span></span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menú</button>
        <nav class="site-nav" id="site-nav"><a href="/noticias.html">Noticias</a><a href="/#conocenos">Conócenos</a><a href="/#instalaciones">Instalaciones</a><a href="/#tratamientos">Tratamientos</a><a href="/#contacto">Contacto</a></nav>
      </header>
      <main class="article-page">
        <article>
          <a class="article-back" href="/noticias.html">← Volver a Noticias</a>
          <p class="news-meta">${escapeHtml(categoryLabel(post.category))}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <time class="article-date" datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
          <p class="article-lead">${escapeHtml(post.excerpt)}</p>
          <img class="article-image" src="/${cleanAssetPath(post.image)}" alt="${escapeHtml(post.image_alt)}"${imageDimensions(post)} decoding="async" fetchpriority="high" />
          <div class="article-body">${renderMarkdown(post.body)}</div>
        </article>
      </main>
      <footer class="site-footer"><p>Clínica Dental Doctor Babío · C. Canal, 2, 1ºL · 41006 Sevilla</p><div class="footer-links"><a href="/">Inicio</a><a href="/#contacto">Contacto</a><a href="/aviso-legal.html">Aviso legal</a><a href="/privacidad.html">Privacidad</a></div></footer>
    </div>
    <script src="/script.js"></script>
  </body>
</html>`;
};

const readPosts = async () => {
  await mkdir(postsDirectory, { recursive: true });
  const entries = await readdir(postsDirectory, { withFileTypes: true });
  const posts = [];
  for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".json"))) {
    const post = JSON.parse(await readFile(path.join(postsDirectory, entry.name), "utf8"));
    if (!post.published) continue;
    for (const field of ["title", "excerpt", "date", "category", "image", "image_alt", "body"]) {
      if (!post[field]) throw new Error(`Falta "${field}" en ${entry.name}.`);
    }
    posts.push({ ...post, slug: path.basename(entry.name, ".json") });
  }
  return posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

const copySourceSite = async () => {
  const excluded = new Set([".git", ".gitignore", "dist", "content", "scripts", "node_modules", "netlify.toml"]);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const source = path.join(root, entry.name);
    const destination = path.join(output, entry.name);
    if (entry.isDirectory()) await cp(source, destination, { recursive: true });
    else if (entry.isFile()) await cp(source, destination);
  }
};

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copySourceSite();

const site = JSON.parse(await readFile(path.join(contentDirectory, "site.json"), "utf8"));
const posts = await readPosts();
const featured = posts.filter((post) => post.featured).slice(0, 3);
const homeItems = featured.length ? featured : site.news_placeholders;

let home = await readFile(path.join(root, "index.html"), "utf8");
home = replaceMarker(home, "HOME_NEWS", `          <div class="news-grid">\n${homeItems.map(renderHomeCard).join("\n\n")}\n          </div>`);
home = replaceMarker(home, "SECTOR_CASE", renderSectorCase(site.sector_case));
await writeFile(path.join(output, "index.html"), home);

let news = await readFile(path.join(root, "noticias.html"), "utf8");
const boardCards = posts.length
  ? posts.map((post) => renderBoardCard(post)).join("\n\n")
  : site.news_placeholders.map((item) => renderBoardCard(item, true)).join("\n\n");
news = replaceMarker(news, "NEWS_BOARD", `          <div class="news-board-grid">\n${boardCards}\n          </div>`);
await writeFile(path.join(output, "noticias.html"), news);

for (const post of posts) {
  const destination = path.join(output, "noticias", post.slug);
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, "index.html"), articlePage(post));
}

const sitemapSource = await readFile(path.join(root, "sitemap.xml"), "utf8");
const closingTag = "</urlset>";
const postUrls = posts.map((post) => `  <url>\n    <loc>${baseUrl}/noticias/${escapeHtml(post.slug)}/</loc>\n    <lastmod>${escapeHtml(String(post.date).slice(0, 10))}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join("\n");
await writeFile(path.join(output, "sitemap.xml"), sitemapSource.replace(closingTag, `${postUrls ? `${postUrls}\n` : ""}${closingTag}`));

const publishedFiles = await readdir(output);
console.log(`Web generada: ${publishedFiles.length} elementos principales y ${posts.length} noticias publicadas.`);
