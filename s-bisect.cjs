const { spawn } = require('child_process');
const fs = require('fs');
const helper = 'C:/CodeSpace/dsh-web-open/assets/dsh-tray-helper.ps1';
const ico = 'C:/CodeSpace/dsh-web-open/assets/dsh.ico';
const run = (label, extra, done) => {
  const log = 'C:/CodeSpace/dsh-web-open/h-' + label + '.log';
  if (fs.existsSync(log)) fs.unlinkSync(log);
  const base = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','12345','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile',log];
  const c = spawn('powershell.exe', base.concat(extra), { stdio: 'ignore', detached: true, windowsHide: true });
  c.on('error', (e) => console.log(label + ' ERR:', e.message));
  c.on('exit', (code) => { console.log(label + ' exit=' + code + ' log=' + (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim() : 'MISSING')); done(); });
};
(async () => {
  await new Promise((res) => run('A-neither', [], res));
  await new Promise((res) => run('B-hide', ['-HideConsole'], res));
  await new Promise((res) => run('C-shortcut', ['-CreateShortcut'], res));
  await new Promise((res) => run('D-both', ['-HideConsole','-CreateShortcut'], res));
})();
