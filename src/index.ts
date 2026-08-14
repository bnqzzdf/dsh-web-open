/** Resolve the tray helper log path under the user's local app data. */
function trayHelperLogPath(): string {
  const base = process.env.LOCALAPPDATA ?? (process.env.USERPROFILE ? `${process.env.USERPROFILE}\\AppData\\Local` : '')
  return base ? `${base}\\dsh-web-open\\tray-helper.log` : ''
}

/**
 * @module dsh-web-open — automatically open the default browser once
 * `dsh web` starts serving, and (on Windows) integrate with the desktop:
 * a whale system-tray icon with a right-click menu, a desktop shortcut, and
 * hiding the host console window.
 *
 * A zero-runtime-dependency Cordis function plugin for the DeepSeek Harness
 * web profile. It injects the webserver service (so it runs only after the
 * HTTP server is actually listening), waits a short beat for sibling rows
 * (frontend-static, /api routes) to settle, then hands the canonical
 * loopback URL to the OS default browser.
 *
 * Environment switches:
 * - DSH_WEB_OPEN=0 disables the whole plugin;
 * - DSH_WEB_TRAY=0 disables the Windows tray helper;
 * - DSH_WEB_SHORTCUT=0 skips creating the desktop shortcut;
 * - DSH_WEB_HIDE_CONSOLE=0 keeps the host console window visible.
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name. */
export const name = 'web-open'

/** Activate after the HTTP carrier service is listening. */
export const inject = ['webServer']

/** How long to wait for sibling rows (frontend-static, /api routes) to settle. */
const SETTLE_MS = 1200

/** Windows tray-helper script name inside the package assets. */
const TRAY_HELPER = 'dsh-tray-helper.ps1'

/** Windows tray icon name inside the package assets. */
const TRAY_ICON = 'dsh.ico'

/** Resolve a packaged asset path from the built lib/ entry. */
function assetPath(name: string): string {
  return fileURLToPath(new URL(`../assets/${name}`, import.meta.url))
}

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
 * Launch the Windows tray helper: whale tray icon, right-click menu,
 * optional desktop shortcut and host-console hiding. The helper watches the
 * host process and exits on its own when the host is gone.
 * @param url - the served URL shown by the tray menu.
 */
function startWindowsTray(url: string): void {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', assetPath(TRAY_HELPER),
    '-HostPid', String(process.pid),
    '-Url', url,
    '-IconPath', assetPath(TRAY_ICON),
    '-LogFile', trayHelperLogPath(),
  ]
  if (process.env.DSH_WEB_HIDE_CONSOLE !== '0') args.push('-HideConsole')
  if (process.env.DSH_WEB_SHORTCUT !== '0') args.push('-CreateShortcut')
  const child = spawn('powershell.exe', args, { stdio: 'ignore', windowsHide: true })
  child.on('error', (error) => console.error('web-open: failed to start tray helper:', error))
  child.unref()
}

/**
 * Plugin entry: schedule the browser open (and the Windows tray helper) once
 * the server is listening.
 * @param ctx - the Cordis plugin context.
 */
export function apply(ctx: Context): void {
  if (process.env.DSH_WEB_OPEN === '0') {
    console.log('web-open: disabled via DSH_WEB_OPEN=0')
    return
  }
  const port = (ctx.get('webServer') as { port: number }).port
  const url = `http://127.0.0.1:${String(port)}`
  const timer = setTimeout(() => {
    openBrowser(url)
    if (process.platform === 'win32' && process.env.DSH_WEB_TRAY !== '0') {
      startWindowsTray(url)
    }
  }, SETTLE_MS)
  ctx.effect(() => () => clearTimeout(timer), 'web-open.settle')
  console.log(`web-open: ${url}`)
}