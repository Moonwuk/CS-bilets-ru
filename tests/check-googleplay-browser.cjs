'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const assets = path.resolve('android/build/work-googleplay/assets/site');
  const out = path.resolve('android/build/googleplay-screenshots');
  fs.mkdirSync(out, {recursive:true});
  const mime = {'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css'};
  const server = http.createServer((req,res) => {
    const name = new URL(req.url,'http://localhost').pathname.slice(1);
    if (!name || path.basename(name) !== name) { res.writeHead(404);res.end();return; }
    const file = path.join(assets,name);
    if (!fs.existsSync(file)) { res.writeHead(404);res.end();return; }
    res.writeHead(200,{
      'Content-Type':(mime[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'",
      'X-Content-Type-Options':'nosniff'
    });
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({headless:true, executablePath:process.env.GOOGLE_CHROME_BIN || '/usr/bin/google-chrome',args:['--no-sandbox']});
    const context = await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror', e => errors.push(String(e)));
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base+'/index.html');
    await page.locator('[data-action="random"]').waitFor();
    if (await page.locator('.mode-menu').getAttribute('open') !== null) throw Error('Android mobile menu must be collapsed');
    if (await page.locator('[href="./support.html"]').count()) throw Error('Play build contains payment menu');
    await page.screenshot({path:path.join(out,'01-random-ticket.png')});
    await page.locator('[data-size="20"]').click();
    await page.locator('[data-action="random"]').click();
    await page.locator('[data-option]').first().waitFor();
    await page.screenshot({path:path.join(out,'02-question.png')});
    // The middle of an option can be a glossary button; tap its plain edge.
    await page.locator('[data-option]').first().click({position:{x:16,y:16}});
    await page.locator('[data-action="check"]').click();
    await page.locator('[aria-label="Разбор ответа"]').waitFor();
    const progress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cs-bilets-ru.progress.v1')));
    const saved=await progress();
    assert.equal(saved.session.ids.length,20);
    assert.equal(saved.session.recorded.length,1);
    assert.equal(saved.total,1);
    await page.reload();
    await page.locator('[data-option]').first().waitFor();
    // Restoring a session can reorder JSON properties without changing data.
    assert.deepEqual(await progress(),saved,'Progress changed after reload');
    await page.locator('[aria-label="Разбор ответа"]').waitFor();
    await page.goto(base+'/topic-wheel.html');
    await page.locator('[data-wheel-disc]').waitFor();
    await page.screenshot({path:path.join(out,'03-topic-wheel.png')});
    await page.goto(base+'/ai-security.html');
    await page.locator('[data-start="mixed"]').waitFor();
    await page.screenshot({path:path.join(out,'04-ai-scenarios.png')});
    for (const name of ['senior.html','scenarios.html','all-questions.html']) {
      await page.goto(base+'/'+name);
      await page.locator('[data-start]').first().waitFor();
      if ((await page.locator('#main').innerText()).includes('Не удалось')) throw Error('Failed page '+name);
    }
    if(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth)) throw Error('Horizontal overflow');
    if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(path.join(out,'browser-review.txt'),'PASS: six packaged screens load under Android CSP; collapsed mobile menu; no Play payment menu; 20-question attempt checks and resumes; no JS errors or horizontal overflow. Screenshots are Chromium renders of packaged WebView assets, not native Android installation tests.\n');
    console.log(fs.readFileSync(path.join(out,'browser-review.txt'),'utf8'));
  } finally {
    if (browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exitCode=1;});

