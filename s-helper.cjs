const { spawn } = require('child_process');
const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:/CodeSpace/dsh-web-open/helper-test.ps1','-HostPid','8316','-Url','http://127.0.0.1:9999','-IconPath','C:\Users\Admin\.dsh\profiles\web-test\node_modules\dsh-web-open\assets\dsh.ico'.replace(/\\/g,'/'),'-LogFile','C:/CodeSpace/dsh-web-open/helper-debug4.log'], { stdio: 'ignore', detached: true, windowsHide: true });
c.on('error', e => console.error('ERR:', e.message));
c.on('exit', (code) => console.log('helper exit:', code));
c.unref();
console.log('helper spawned');