const { spawn, execFile } = require('child_process');
const fs = require('fs');
const flag = 'C:/CodeSpace/dsh-web-open/args-out.txt';
const psArgs = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:/CodeSpace/dsh-web-open/echo-args.ps1','-HostPid','12345','-Url','http://127.0.0.1:62175'];
const read = () => fs.existsSync(flag) ? JSON.stringify(fs.readFileSync(flag, 'utf8')) : 'MISSING';
const check = (label, done) => {
  setTimeout(() => { console.log(label + ' args=' + read()); done(); }, 800);
};
(async () => {
  // 1) spawn verbatim
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
  const c1 = spawn('powershell.exe', psArgs, { stdio: 'ignore', windowsVerbatimArguments: true });
  c1.on('error', (e) => console.log('1 verbatim ERR:', e.message));
  await new Promise((res) => { c1.on('exit', () => check('1 spawn verbatim', res)); });
  // 2) spawn with shell: true
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
  const c2 = spawn('powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File C:/CodeSpace/dsh-web-open/echo-args.ps1 -HostPid 12345 -Url http://127.0.0.1:62175', [], { stdio: 'ignore', shell: true });
  c2.on('error', (e) => console.log('2 shell ERR:', e.message));
  await new Promise((res) => { c2.on('exit', () => check('2 spawn shell', res)); });
  // 3) execFile
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
  execFile('powershell.exe', psArgs, { windowsVerbatimArguments: true }, (e) => {
    if (e) console.log('3 execFile ERR:', e.message);
    check('3 execFile verbatim', () => {});
  });
  await new Promise((res) => setTimeout(res, 1200));
})();
