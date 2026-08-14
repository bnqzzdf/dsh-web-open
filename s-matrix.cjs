const { spawn, execFile, exec } = require('child_process');
const fs = require('fs');
const flag = 'C:/CodeSpace/dsh-web-open/hello-out.txt';
const test = (label, fn) => new Promise((res) => { fn(() => { console.log(label + ' -> flag exists: ' + fs.existsSync(flag)); res(); }); });
(async () => {
  // 1) spawn no detached
  await test('spawn(ignore, no detached)', (done) => {
    const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', windowsHide: true });
    c.on('error', (e) => console.log('  ERR:', e.message));
    c.on('exit', () => setTimeout(done, 300));
  });
  // 2) spawn with detached
  await test('spawn(ignore, detached)', (done) => {
    const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', detached: true, windowsHide: true });
    c.on('error', (e) => console.log('  ERR:', e.message));
    c.on('exit', () => setTimeout(done, 300));
  });
  // 3) execFile
  await test('execFile', (done) => {
    execFile('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], (e) => { if (e) console.log('  ERR:', e.message); setTimeout(done, 300); });
  });
  // 4) cmd /c via spawn
  await test('spawn cmd /c', (done) => {
    const c = spawn('cmd.exe', ['/c', 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', windowsHide: true });
    c.on('error', (e) => console.log('  ERR:', e.message));
    c.on('exit', () => setTimeout(done, 300));
  });
  // 5) spawn node -e (baseline: does ANY child work?)
  await test('spawn node -e baseline', (done) => {
    const c = spawn(process.execPath, ['-e', "require('fs').writeFileSync('C:/CodeSpace/dsh-web-open/hello-out.txt','NODE OK')"], { stdio: 'ignore' });
    c.on('error', (e) => console.log('  ERR:', e.message));
    c.on('exit', () => setTimeout(done, 300));
  });
})();