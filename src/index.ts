/**
 * @module dsh-web-open — automatically open the default browser once
 * `dsh web` starts serving.
 *
 * A zero-runtime-dependency Cordis function plugin for the DeepSeek Harness
 * web profile. It injects the webserver service (so it runs only after the
 * HTTP server is actually listening), waits a short beat for sibling rows
 * (frontend-static, /api routes) to settle, then hands the canonical
 * loopback URL to the OS default browser.
 *
 * Disable with the environment variable DSH_WEB_OPEN=0.
 */
import { spawn } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name. */
export const name = 'web-open'

/** Activate after the HTTP carrier service is listening. */
export const inject = ['webServer']

/** How long to wait for sibling rows (frontend-static, /api routes) to settle. */
const SETTLE_MS = 1200

/**
 * Open the canonical loopback URL in the platform default browser.
 * @param url - the URL to open.
 */
function openBrowser(url: string): void {
  let cmd: string
  let args: string[]
  if (process.platform === 'win32') {
    cmd = 'cmd'
    args = ['/c', 'start', '', url]
  } else if (process.platform === 'darwin') {
    cmd = 'open'
    args = [url]
  } else {
    cmd = 'xdg-open'
    args = [url]
  }
  const child = spawn(cmd, args, { stdio: 'ignore', detached: true, windowsHide: true })
  child.on('error', (error) => console.error('web-open: failed to open browser:', error))
  child.unref()
}

/**
 * Plugin entry: schedule the browser open once the server is listening.
 * @param ctx - the Cordis plugin context.
 */
export function apply(ctx: Context): void {
  if (process.env.DSH_WEB_OPEN === '0') {
    console.log('web-open: disabled via DSH_WEB_OPEN=0')
    return
  }
  const port = (ctx.get('webServer') as { port: number }).port
  const url = `http://127.0.0.1:${String(port)}`
  const timer = setTimeout(() => openBrowser(url), SETTLE_MS)
  ctx.effect(() => () => clearTimeout(timer), 'web-open.settle')
  console.log(`web-open: ${url}`)
}
