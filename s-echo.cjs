const { spawn } = require('child_process');
const fs = require('fs');
const flag = 'C:/CodeSpace/dsh-web-open/args-out.txt';
const args = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:/CodeSpace/dsh-web-open/echo-args.ps1','-HostPid','12345','-Url','http://127.0.0.1:62175'];
const read = () => fs.existsSync(flag) ? JSON.stringify(fs.readFileSync(flag, 'utf8')) : 'MISSING';
const run = (label, opts) => new Promise((res) => {
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
  const c = spawn('powershell.exe', args, opts);
  c.on('error', (e) => console.log(label + ' ERR:', e.message));
  c.on('exit', (code) => { console.log(label + ' exit=' + code + ' args=' + read()); res(); });
});
(async () => {
  await run('A: detached+windowsHide', { stdio: 'ignore', detached: true, windowsHide: true });
  await run('B: windowsHide only', { stdio: 'ignore', windowsHide: true });
  await run('C: plain', { stdio: 'ignore' });
})();
