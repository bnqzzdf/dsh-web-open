const { spawn } = require('child_process');
const helper = 'C:\Users\Admin\.dsh\profiles\web-test\node_modules\dsh-web-open\assets\dsh-tray-helper.ps1'.replace(/\\/g, '/');
const ico = 'C:\Users\Admin\.dsh\profiles\web-test\node_modules\dsh-web-open\assets\dsh.ico'.replace(/\\/g, '/');
const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','8316','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile','C:/CodeSpace/dsh-web-open/helper-debug2.log'], { stdio: 'ignore', detached: true, windowsHide: true });
c.on('error', (e) => console.error('SPAWN ERROR:', e.message));
c.unref();
console.log('spawned pid:', c.pid);