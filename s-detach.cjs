const { spawn } = require('child_process');
const fs = require('fs');
const helper = 'C:/CodeSpace/dsh-web-open/assets/dsh-tray-helper.ps1';
const ico = 'C:/CodeSpace/dsh-web-open/assets/dsh.ico';
const run = (label, opts, done) => {
  const log = 'C:/CodeSpace/dsh-web-open/h-' + label + '.log';
  if (fs.existsSync(log)) fs.unlinkSync(log);
  const args = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','12345','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile',log];
  const c = spawn('powershell.exe', args, opts);
  c.on('error', (e) => console.log(label + ' ERR:', e.message));
  c.on('exit', (code) => { console.log(label + ' exit=' + code + ' log=' + (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim() : 'MISSING')); done(); });
};
(async () => {
  await new Promise((res) => run('1-ignore-noDetach', { stdio: 'ignore', windowsHide: true }, res));
  await new Promise((res) => run('2-ignore-detach', { stdio: 'ignore', detached: true, windowsHide: true }, res));
  await new Promise((res) => run('3-pipe-noDetach', { stdio: ['ignore','pipe','pipe'], windowsHide: true }, res));
  await new Promise((res) => run('4-inherit', { stdio: 'inherit' }, res));
})();
