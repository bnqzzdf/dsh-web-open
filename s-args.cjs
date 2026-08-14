const { spawn } = require('child_process');
const fs = require('fs');
const flag = 'C:/CodeSpace/dsh-web-open/hello-out.txt';
const run = (label, args, opts) => new Promise((res) => {
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
  const c = spawn('powershell.exe', args, opts || { stdio: 'ignore' });
  c.on('error', (e) => console.log(label + ' ERR:', e.message));
  c.on('exit', (code) => { console.log(label + ' exit=' + code + ' flag=' + fs.existsSync(flag)); res(); });
});
(async () => {
  const base = ['-NoProfile','-ExecutionPolicy','Bypass','-File','C:/CodeSpace/dsh-web-open/hello.ps1'];
  await run('1 no args', base);
  await run('2 + -Name test', base.concat(['-Name','test']));
  await run('3 + -Url http', base.concat(['-Url','http://127.0.0.1:62175']));
  await run('4 + -HostPid 123', base.concat(['-HostPid','123']));
  await run('5 + positional hello', base.concat(['hello']));
})();
