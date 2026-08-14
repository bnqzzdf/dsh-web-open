const { spawn } = require('child_process');
const fs = require('fs');
const helper = 'C:/CodeSpace/dsh-web-open/assets/dsh-tray-helper.ps1';
const ico = 'C:/CodeSpace/dsh-web-open/assets/dsh.ico';
const log = 'C:/CodeSpace/dsh-web-open/helper-hide.log';
if (fs.existsSync(log)) fs.unlinkSync(log);
// 与插件完全相同的参数 (含 -HideConsole 和 -CreateShortcut)
const args = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','12345','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile',log,'-HideConsole','-CreateShortcut'];
const c = spawn('powershell.exe', args, { stdio: 'ignore', detached: true, windowsHide: true });
c.on('error', (e) => console.log('ERR:', e.message));
c.on('exit', (code) => {
  console.log('EXIT code=' + code);
  console.log('LOG: ' + (fs.existsSync(log) ? JSON.stringify(fs.readFileSync(log, 'utf8')) : 'MISSING'));
});
