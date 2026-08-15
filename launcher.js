#!/usr/bin/env node
// dsh-web: a robust wrapper around `dsh web`.
// If 127.0.0.1:3080 is already in use, starts the server on an
// OS-assigned port (--port 0) instead of failing with EADDRINUSE.
// The plugin reads the actual port from the webServer service, so the
// browser, tray and shortcut all point at the right URL automatically.
//
// Usage:
//   dsh-web                 start dsh web (auto port fallback)
//   dsh-web --port 8080     explicit port (no probing)
//   dsh-web --profile x     any other dsh web args pass through
import { spawn } from 'node:child_process'
import net from 'node:net'

const PROBE_PORT = 3080
const PROBE_HOST = '127.0.0.1'

const args = process.argv.slice(2)
const hasExplicitPort = args.some((a) => a === '--port' || a === '-p')

// Resolve whether the default dsh web port is already taken.
const probe = () =>
  new Promise((resolve) => {
    const s = net.connect({ port: PROBE_PORT, host: PROBE_HOST })
    const done = (v) => { s.destroy(); resolve(v) }
    s.once('connect', () => done(true))
    s.once('error', () => done(false))
    s.setTimeout(800, () => done(false))
  })

const main = async () => {
  const busy = !hasExplicitPort && (await probe())
  const final = busy ? ['web', '--port', '0', ...args] : ['web', ...args]
  if (busy) {
    console.log(`[dsh-web] ${PROBE_HOST}:${PROBE_PORT} is in use; starting on an OS-assigned port instead.`)
  }
  const child = process.platform === 'win32'
    ? spawn(`dsh ${final.map((x) => `"${x}"`).join(' ')}`, { stdio: 'inherit', shell: true })
    : spawn('dsh', final, { stdio: 'inherit' })
  child.on('exit', (code) => process.exit(code ?? 0))
}

void main()