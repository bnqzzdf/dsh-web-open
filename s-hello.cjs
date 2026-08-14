const { spawn } = require('child_process');
const c = spawn('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:/CodeSpace/dsh-web-open/hello.ps1'], { stdio: 'ignore', detached: true, windowsHide: true });
c.on('error', e => console.error('ERR:', e.message));
c.on('exit', (code) => console.log('hello exit:', code));
c.unref();