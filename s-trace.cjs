const { spawn } = require('child_process');
const fs = require('fs');
const helper = 'C:/CodeSpace/dsh-web-open/assets/dsh-tray-helper.ps1';
const ico = 'C:/CodeSpace/dsh-web-open/assets/dsh.ico';
const trace = 'C:/CodeSpace/dsh-web-open/helper-trace.txt';
if (fs.existsSync(trace)) fs.unlinkSync(trace);
const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','12345','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile','C:/CodeSpace/dsh-web-open/helper-capture2.log'], { stdio: 'ignore', windowsHide: true });
c.on('error', (e) => console.log('ERR:', e.message));
c.on('exit', (code) => {
  console.log('EXIT code=' + code);
  console.log('TRACE exists: ' + fs.existsSync(trace));
  if (fs.existsSync(trace)) console.log('TRACE: ' + fs.readFileSync(trace, 'utf8'));
  console.log('HELPER LOG exists: ' + fs.existsSync('C:/CodeSpace/dsh-web-open/helper-capture2.log'));
});
