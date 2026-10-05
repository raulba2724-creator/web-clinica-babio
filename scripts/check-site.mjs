import {readFile, readdir, access} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = new URL('../dist/', import.meta.url);
const files = [];
async function walk(folder) {
  for (const f of await readdir(new URL(folder,root),{withFileTypes:true})) {
    const name = folder + f.name;
    if (f.isDirectory() && name !== 'admin') await walk(name+'/');
    else if (f.isFile() && name.endsWith('.html')) files.push(name);
  }
}
await walk('');
const errors = [];
let schemas = 0;
for (const f of files) {
  const html = await readFile(new URL(f,root),'utf8');
  const pageUrl = new URL(f === 'index.html' ? '/' : '/'+f.replace(/index.html$/,''),'https://clinicababio.es');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) errors.push(f+': missing canonical');
  if ((html.match(/<h1[ >]/g)||[]).length !== 1) errors.push(f+': H1 count');
  if (/<meta[^>]+noindex/i.test(html)) errors.push(f+': noindex');
  for (const s of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(s[1]); schemas++; } catch { errors.push(f+': invalid JSON-LD'); }
  }
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = new URL(m[1].replaceAll('&amp;','&'),pageUrl);
    if(u.origin !== pageUrl.origin) continue;
    const local = decodeURIComponent(u.pathname).replace(/^\//,'') || 'index.html';
    const dest = new URL(local.endsWith('/') ? local+'index.html' : local,root);
    try { await access(dest); } catch { errors.push(f+': missing '+u.pathname); }
  }
}
const profile = await readFile(new URL('dr-raul-babio-arjona.html',root),'utf8');
for(const privateValue of ['Virgen de la Cinta','630 184 557','raulba2724@gmail.com','.pdf']) assert.ok(!profile.includes(privateValue));
const home = await readFile(new URL('index.html',root),'utf8');
const news = await readFile(new URL('noticias.html',root),'utf8');
const block = home.split('<!-- CMS:HOME_NEWS_START -->')[1].split('<!-- CMS:HOME_NEWS_END -->')[0];
const homeLinks = [...block.matchAll(/href="(\/noticias\/[^"]+)"/g)].map(m=>m[1]);
const newsLinks = [...news.matchAll(/href="(\/noticias\/[^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(homeLinks,newsLinks.slice(0,3));
assert.equal(homeLinks.length,3);
const sitemap = await readFile(new URL('sitemap.xml',root),'utf8');
for(const [,url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const local = new URL(url).pathname.replace(/^\//,'') || 'index.html';
  await access(new URL(local.endsWith('/') ? local+'index.html' : local,root));
}
if(errors.length) { console.error([...new Set(errors)].join('\n')); process.exitCode=1; }
else console.log('PASS: '+files.length+' public pages, '+schemas+' JSON-LD blocks; internal links/assets, H1, canonicals, privacy, sitemap and latest-three order.');
