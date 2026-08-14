const { spawn } = require('child_process');
const fs = require('fs');
const flag = 'C:/CodeSpace/dsh-web-open/hello-out.txt';
const run = (label, args, opts) => new Promise((res) => {
  const c = spawn('powershell.exe', args, opts);
  c.on('error', (e) => console.log(label + ' ERR:', e.message));
  c.on('exit', (code) => { console.log(label + ' exit=' + code + ' flag=' + fs.existsSync(flag)); res(); });
});
(async () => {
  await run('A: WITH -WindowStyle Hidden', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', windowsHide: true });
  fs.existsSync(flag) && fs.unlinkSync(flag);
  await run('B: without -WindowStyle Hidden', ['-NoProfile','-ExecutionPolicy','Bypass','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', windowsHide: true });
  fs.existsSync(flag) && fs.unlinkSync(flag);
  await run('C: -WindowStyle Minimized', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Minimized','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', windowsHide: true });
})();