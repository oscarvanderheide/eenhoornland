// Tiny Chrome DevTools driver for interaction tests: node cdp.mjs <script.mjs> (or use t.mjs). Renders on the GPU (Metal):
// ten times faster than the software renderer; GL=soft falls back to SwiftShader.
import { spawn } from 'node:child_process';
const port = +process.env.PORT || 9333;   // t.mjs gives every test its own port and profile so they can run side by side
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, ...(process.env.GL === 'soft' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']), '--window-size=1200,750', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required', '--mute-audio', `--user-data-dir=/tmp/eh-cdp-profile-${port}`, 'about:blank'], { stdio: 'ignore' });
// never leave a headless Chrome running the game behind (it slows the real browser down): close it however this script ends
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch {} });
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => process.exit(1));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find(t => t.type === 'page')) break; } catch { } await sleep(200); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map(a => a.value ?? a.description).join(' ')); if (m.method === 'Network.loadingFailed' && !m.params.canceled) logs.push('NETFAIL ' + m.params.errorText + ' ' + m.params.requestId); if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') logs.push('LOG ' + m.params.entry.text + ' ' + (m.params.entry.url || '')); if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });   // the profile is reused: never test yesterday's modules
const api = {
  sleep, logs, send,
  // nothing is cached, so wait for the world itself; the little python server sometimes resets a connection on a first load, so try again if it never comes
  async go(url) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const t0 = Date.now(); await send('Page.navigate', { url }); await sleep(1500); if (!/debug/.test(url)) break;
      let up = false; for (let i = 0; i < 30 && !up; i++) { up = await this.ev(`!!window.__w && performance.timeOrigin > ${t0 - 50}`); if (!up) await sleep(500); }
      if (up) break; logs.push('RETRY load ' + url);
    }
    await sleep(1500);
  },
  async ev(expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return 'ERR ' + JSON.stringify(r.result.exceptionDetails.exception?.description); return r.result.result.value; },
  async click(x, y) { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, pointerType: 'mouse' }); },
  async key(k, ms = 500) { const code = { ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39 }[k]; await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, windowsVirtualKeyCode: code }); await sleep(ms); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, windowsVirtualKeyCode: code }); },
  async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(file, Buffer.from(r.result.data, 'base64')); },
};
try { const mod = await import(process.cwd() + '/' + process.argv[2]); await mod.default(api); }
catch (e) { console.log('TEST ERROR', e); }
finally { console.log('--- page logs ---\n' + logs.slice(-15).join('\n')); ws.close(); chrome.kill(); process.exit(0); }
