const { spawn } = require('child_process');
const helper = 'C:/Users/Admin/.dsh/profiles/web-test/node_modules/dsh-web-open/assets/dsh-tray-helper.ps1';
const ico = 'C:/Users/Admin/.dsh/profiles/web-test/node_modules/dsh-web-open/assets/dsh.ico';
const args = ['-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',helper,'-HostPid','12345','-Url','http://127.0.0.1:9999','-IconPath',ico,'-LogFile','C:/CodeSpace/dsh-web-open/helper-capture.log'];
const c = spawn('powershell.exe', args, { stdio: ['ignore','pipe','pipe'], windowsHide: true });
let out = '', err = '';
c.stdout.on('data', (d) => out += d);
c.stderr.on('data', (d) => err += d);
c.on('error', (e) => console.log('SPAWN ERR:', e.message));
c.on('exit', (code) => {
  console.log('EXIT code=' + code);
  console.log('STDOUT:', JSON.stringify(out.slice(0, 800)));
  console.log('STDERR:', JSON.stringify(err.slice(0, 800)));
});
console.log('spawned');
