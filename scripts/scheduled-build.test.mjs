import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

test('scheduled article is absent before deadline and present everywhere at deadline', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'babio-schedule-'));
  try {
    await mkdir(path.join(dir,'scripts'));
    await mkdir(path.join(dir,'content/posts'), {recursive:true});
    for (const script of ['build.mjs','publication-schedule.mjs']) await copyFile(fileURLToPath(new URL(script,import.meta.url)),path.join(dir,'scripts',script));
    await writeFile(path.join(dir,'index.html'),'<!-- CMS:HOME_NEWS_START --><!-- CMS:HOME_NEWS_END --><!-- CMS:SECTOR_CASE_START --><!-- CMS:SECTOR_CASE_END -->');
    await writeFile(path.join(dir,'noticias.html'),'<!-- CMS:NEWS_BOARD_START --><!-- CMS:NEWS_BOARD_END -->');
    await writeFile(path.join(dir,'sitemap.xml'),'<urlset></urlset>');
    await writeFile(path.join(dir,'content/site.json'),JSON.stringify({news_placeholders:[{category:'consejos',title:'Reserva'}],sector_case:{}}));
    await writeFile(path.join(dir,'content/posts/probe.json'),JSON.stringify({title:'Prueba',excerpt:'Resumen',date:'2026-09-21',category:'consejos',image:'/probe.png',image_alt:'Prueba',body:'Contenido',published:true,publish_at:'2026-09-21T09:30'}));
    // Test clock is isolated to this temporary fixture, never used in production.
    const run = async (instant) => {
      await writeFile(path.join(dir,'clock.mjs'),`Date.now = () => ${Date.parse(instant)};`);
      execFileSync(process.execPath,['--import',pathToFileURL(path.join(dir,'clock.mjs')).href,path.join(dir,'scripts/build.mjs')],{cwd:dir});
    };
    await run('2026-09-21T07:29:59Z');
    for (const file of ['index.html','noticias.html','sitemap.xml']) assert.equal((await readFile(path.join(dir,'dist',file),'utf8')).includes('/noticias/probe/'),false);
    await assert.rejects(access(path.join(dir,'dist/noticias/probe/index.html')));
    await run('2026-09-21T07:30:00Z');
    for (const file of ['index.html','noticias.html','sitemap.xml']) assert.equal((await readFile(path.join(dir,'dist',file),'utf8')).includes('/noticias/probe/'),true);
    assert.match(await readFile(path.join(dir,'dist/noticias/probe/index.html'),'utf8'),/<h1>Prueba<\/h1>/);
  } finally {
    // dir is an OS-created dedicated test directory, never a user workspace.
    await rm(dir,{recursive:true,force:true});
  }
});
