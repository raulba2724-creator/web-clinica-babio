import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isVisible, effectiveDate, publicationTime } from './publication-schedule.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const contentDirectory = path.join(root, "content");
const postsDirectory = path.join(contentDirectory, "posts");
const baseUrl = "https://clinicababio.es";
const imageVariants = JSON.parse(await readFile(path.join(contentDirectory, 'image-variants.json'), 'utf8'));

// Use pre-optimised derivatives; preserve the source photographs and artwork.
const optimiseImages = (html) => {
  let firstContentImage = true;
  html = html.replace(/<img\b[^>]*>/g, tag => {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src) return tag;
    const item = imageVariants[src.replace(/^\//,'')];
    const logo = /brand-logo|cover-brand/.test(tag);
    const lead = !logo && firstContentImage;
    if (!logo) firstContentImage = false;
    if (item) {
      if (item.src) tag = tag.replace(`src="${src}"`, `src="/${item.src}"`);
      tag = tag.replace(/\s(?:width|height)="[^"]*"/g,'');
      tag = tag.replace(/\s*\/?>(?=$)/, ` width="${item.width}" height="${item.height}" />`);
    }
    if (!/\bloading=/.test(tag) && !logo && !lead) tag = tag.replace(' />',' loading="lazy" />');
    if (!/\bdecoding=/.test(tag)) tag = tag.replace(' />',' decoding="async" />');
    if (lead && !/\bfetchpriority=/.test(tag)) tag = tag.replace(' />',' fetchpriority="high" />');
    return tag;
  });
  // Secondary carousel images are requested only when that slide is shown.
  html = html.replace(/(<figure class="(?:hero|facilities)-slide">)([\s\S]*?)(<\/figure>)/g,
    (_,start,body,end) => start+body.replace(/\bsrc="([^"]+)"/,'data-src="$1"')+end);
  return html.replace(/class="((?:hero|facilities)-slide-dots)" aria-hidden="true"/g,'class="$1"')
    .replaceAll('preload="metadata"','preload="none"');
};

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
const cardImageClass = (item) => item.image_fit === "contain" ? ' class="news-card-image-contain"' : "";
const categoryLabels = { clinica: "Noticias", consejos: "Consejos", avisos: "Avisos" };
const categoryLabel = (value) => categoryLabels[value] || "Noticias";
const formatDate = (value) => new Intl.DateTimeFormat("es-ES", {
  day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid",
}).format(new Date(`${String(value).slice(0, 10)}T12:00:00+02:00`));

const replaceMarker = (html, name, rendered) => {
  const expression = new RegExp(`(\\s*<!-- CMS:${name}_START -->)[\\s\\S]*?(<!-- CMS:${name}_END -->)`);
  if (!expression.test(html)) throw new Error(`No se encuentra el bloque CMS:${name}.`);
  return html.replace(expression, `$1\n${rendered}\n          $2`);
};

const coverBrand = (item) => item.web_cover ? `<img class="cover-brand" src="/assets/images/logo-unificado.png" alt="Clínica Dental Doctor Babío" />` : "";

const renderHomeCard = (item) => {
  const isPost = Boolean(item.slug);
  const href = isPost ? `/noticias/${escapeHtml(item.slug)}/` : escapeHtml(item.href || `/noticias.html#${item.category}`);
  return `          <article class="news-card">
            <div class="publication-cover"><img${cardImageClass(item)} src="${cleanAssetPath(item.image)}" alt="${escapeHtml(item.image_alt)}"${imageDimensions(item)} loading="lazy" decoding="async" />${coverBrand(item)}</div>
            <div class="news-card-copy">
              <p class="news-meta">${escapeHtml(isPost ? categoryLabel(item.category) : item.label)}</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.excerpt)}</p>
              <a class="news-placeholder-link" href="${href}">${isPost ? `Leer: ${escapeHtml(item.title)}` : "Ver publicaciones"}</a>
            </div>
          </article>`;
};

const renderBoardCard = (item, placeholder = false) => `            <article class="news-card news-board-item" data-news-category="${escapeHtml(item.category)}">
              <div class="publication-cover"><img${cardImageClass(item)} src="${cleanAssetPath(item.image)}" alt="${escapeHtml(item.image_alt)}"${imageDimensions(item)} loading="lazy" decoding="async" />${coverBrand(item)}</div>
              <div class="news-card-copy">
                <p class="news-meta">${escapeHtml(categoryLabel(item.category))}</p>${placeholder ? "" : `<time class="news-date" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>`}
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.excerpt)}</p>
                ${placeholder ? `<a class="news-placeholder-link" href="${escapeHtml(item.href || "/noticias.html")}">Ver publicaciones</a>` : `<a class="news-placeholder-link" href="/noticias/${escapeHtml(item.slug)}/">Leer: ${escapeHtml(item.title)}</a>`}
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

const renderComparison = (table) => {
  if (!table) return "";
  return `<div class="article-comparison" role="region" aria-label="${escapeHtml(table.caption)}" tabindex="0"><table><caption>${escapeHtml(table.caption)}</caption><thead><tr>${table.headers.map(h => `<th scope="col">${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
};

const articlePage = (post) => {
  const canonical = `${baseUrl}/noticias/${post.slug}/`;
  const imageUrl = `${baseUrl}/${String(post.image).replace(/^\//, "")}`;
  const seoTitle = post.seo_title || `${post.title} | Clínica Dental Doctor Babío`;
  const metaDescription = post.meta_description || post.excerpt;
  const datePublished = post.publish_at ? new Date(publicationTime(post.publish_at)).toISOString() : post.date;
  const dateModified = !post.date_modified || post.date_modified === post.date ? datePublished : post.date_modified;
  const schemaData = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
    description: metaDescription, datePublished, dateModified, image: imageUrl,
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Dentist", "@id": `${baseUrl}/#clinica`, name: "Clínica Dental Doctor Babío", url: `${baseUrl}/`,
      image: `${baseUrl}/assets/images/equipo-clinica.jpg`, telephone: "+34 954 65 95 54",
      address: { "@type": "PostalAddress", streetAddress: "C. Canal, 2, 1ºL", addressLocality: "Sevilla", postalCode: "41006", addressCountry: "ES" },
    },
  };
  if (post.author?.name) {
    schemaData.author = {
      "@type": "Person",
      name: post.author.name,
      ...(post.author.name === "Dr. Raúl Babío Arjona" ? { "@id": `${baseUrl}/dr-raul-babio-arjona.html#persona`, url: `${baseUrl}/dr-raul-babio-arjona.html` } : {}),
      ...(post.author.jobTitle ? { jobTitle: post.author.jobTitle } : {}),
      ...(post.author.identifier ? { identifier: post.author.identifier } : {}),
    };
  }
  const schema = JSON.stringify(schemaData).replaceAll("<", "\\u003c");
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
          <div class="publication-cover"><img class="article-image${post.image_fit === "contain" ? " article-image-contain" : ""}" src="/${cleanAssetPath(post.image)}" alt="${escapeHtml(post.image_alt)}"${imageDimensions(post)} decoding="async" fetchpriority="high" />${coverBrand(post)}</div>
          ${post.image_caption ? `<p class="article-image-caption">${escapeHtml(post.image_caption)}</p>` : ""}
          <div class="article-body">${renderMarkdown(post.body).replace("<p>[[COMPARISON_TABLE]]</p>", renderComparison(post.comparison)).replaceAll("Dr. Raúl Babío Arjona · Odontólogo", '<a href="/dr-raul-babio-arjona.html">Dr. Raúl Babío Arjona</a> · Odontólogo')}</div>
        </article>
      </main>
      <footer class="site-footer"><p>Clínica Dental Doctor Babío · C. Canal, 2, 1ºL · 41006 Sevilla</p><div class="footer-links"><a href="/">Inicio</a><a href="/#contacto">Contacto</a><a href="/aviso-legal.html">Aviso legal</a><a href="/privacidad.html">Privacidad</a></div></footer>
    </div>
    <script src="/analytics.js?v=20260904a"></script>
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
    if (!isVisible(post)) continue;
    for (const field of ["title", "excerpt", "date", "category", "image", "image_alt", "body"]) {
      if (!post[field]) throw new Error(`Falta "${field}" en ${entry.name}.`);
    }
    posts.push({ ...post, date: effectiveDate(post), slug: path.basename(entry.name, ".json") });
  }
  return posts.sort((a, b) => (publicationTime(b.publish_at) ?? Date.parse(b.date)) - (publicationTime(a.publish_at) ?? Date.parse(a.date)));
};

const copySourceSite = async () => {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!['assets', 'admin', '_redirects', 'robots.txt', 'sitemap.xml'].includes(entry.name) && !/\.(html|css|js)$/.test(entry.name)) continue;
    const source = path.join(root, entry.name);
    const destination = path.join(output, entry.name);
    if (entry.isDirectory()) await cp(source, destination, { recursive: true });
    else if (entry.isFile()) {
      if (entry.name.endsWith('.html')) await writeFile(destination, optimiseImages(await readFile(source,'utf8')));
      else await cp(source, destination);
    }
  }
};

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copySourceSite();

const site = JSON.parse(await readFile(path.join(contentDirectory, "site.json"), "utf8"));
const posts = await readPosts();
// Both views use the same visibility filter and publication-time order.
const homeItems = posts.slice(0, 3);

let home = await readFile(path.join(root, "index.html"), "utf8");
home = replaceMarker(home, "HOME_NEWS", `          <div class="news-grid">\n${homeItems.map(renderHomeCard).join("\n\n")}\n          </div>`);
home = replaceMarker(home, "SECTOR_CASE", renderSectorCase(site.sector_case));
await writeFile(path.join(output, "index.html"), optimiseImages(home));

let news = await readFile(path.join(root, "noticias.html"), "utf8");
const boardCards = posts.length
  ? posts.map((post) => renderBoardCard(post)).join("\n\n")
  : site.news_placeholders.map((item) => renderBoardCard(item, true)).join("\n\n");
news = replaceMarker(news, "NEWS_BOARD", `          <div class="news-board-grid">\n${boardCards}\n          </div>`);
await writeFile(path.join(output, "noticias.html"), optimiseImages(news));

for (const post of posts) {
  const destination = path.join(output, "noticias", post.slug);
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, "index.html"), optimiseImages(articlePage(post)));
}

let sitemapSource = await readFile(path.join(root, "sitemap.xml"), "utf8");
const latestContentDate = posts.map(p => String(p.date_modified || p.date).slice(0,10)).sort().at(-1);
if (latestContentDate) {
  sitemapSource = sitemapSource.replace(/(<loc>https:\/\/clinicababio\.es\/(?:noticias\.html)?<\/loc>\s*<lastmod>)([^<]+)(<\/lastmod>)/g,
    (_, start, date, end) => start + (latestContentDate > date ? latestContentDate : date) + end);
}
const closingTag = "</urlset>";
const postUrls = posts.map((post) => `  <url>\n    <loc>${baseUrl}/noticias/${escapeHtml(post.slug)}/</loc>\n    <lastmod>${escapeHtml(String(post.date_modified || post.date).slice(0, 10))}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join("\n");
await writeFile(path.join(output, "sitemap.xml"), sitemapSource.replace(closingTag, `${postUrls ? `${postUrls}\n` : ""}${closingTag}`));

const publishedFiles = await readdir(output);
console.log(`Web generada: ${publishedFiles.length} elementos principales y ${posts.length} noticias publicadas.`);
