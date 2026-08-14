import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { spawn } from 'node:child_process'
import { apply, inject, name } from '../src/index.ts'

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}))

const spawnMock = vi.mocked(spawn)

interface MockCtx {
  get: ReturnType<typeof vi.fn>
  effect: ReturnType<typeof vi.fn>
}

function makeCtx(port: number): MockCtx {
  return {
    get: vi.fn(() => ({ port })),
    effect: vi.fn(),
  }
}

describe('dsh-web-open plugin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    spawnMock.mockClear()
    delete process.env.DSH_WEB_OPEN
    delete process.env.DSH_WEB_TRAY
    delete process.env.DSH_WEB_SHORTCUT
    delete process.env.DSH_WEB_HIDE_CONSOLE
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exports the plugin contract', () => {
    expect(name).toBe('web-open')
    expect(inject).toContain('webServer')
    expect(typeof apply).toBe('function')
  })

  it('registers a settle effect and logs the URL', () => {
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    expect(ctx.get).toHaveBeenCalledWith('webServer')
    expect(ctx.effect).toHaveBeenCalledTimes(1)
    expect(ctx.effect.mock.calls[0]?.[1]).toBe('web-open.settle')
    expect(logSpy).toHaveBeenCalledWith('web-open: http://127.0.0.1:3080')
    expect(spawnMock).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('opens the browser and starts the Windows tray helper after the settle delay', () => {
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    vi.advanceTimersByTime(1200)
    expect(spawnMock).toHaveBeenCalledTimes(2)
    const cmds = spawnMock.mock.calls.map((c) => c[0])
    expect(cmds).toContain('cmd')
    expect(cmds).toContain('powershell.exe')
    const trayArgs = spawnMock.mock.calls.find((c) => c[0] === 'powershell.exe')?.[1] as string[]
    expect(trayArgs.join(' ')).toContain('dsh-tray-helper.ps1')
    expect(trayArgs.join(' ')).toContain('-HideConsole')
    expect(trayArgs.join(' ')).toContain('-CreateShortcut')
    logSpy.mockRestore()
  })

  it('skips the tray helper when DSH_WEB_TRAY=0', () => {
    process.env.DSH_WEB_TRAY = '0'
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    vi.advanceTimersByTime(1200)
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[0]).toBe('cmd')
    logSpy.mockRestore()
  })

  it('skips scheduling when DSH_WEB_OPEN=0', () => {
    process.env.DSH_WEB_OPEN = '0'
    const ctx = makeCtx(9999)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    expect(ctx.get).not.toHaveBeenCalled()
    expect(ctx.effect).not.toHaveBeenCalled()
    expect(spawnMock).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('on linux only opens the browser with xdg-open and never spawns the tray helper', () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    vi.advanceTimersByTime(1200)
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[0]).toBe('xdg-open')
    const allArgs = spawnMock.mock.calls.map((c) => c[1] as string[]).flat().join(' ')
    expect(allArgs).not.toContain('powershell')
    logSpy.mockRestore()
  })

  it('on darwin only opens the browser with open and never spawns the tray helper', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    vi.advanceTimersByTime(1200)
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[0]).toBe('open')
    const allArgs = spawnMock.mock.calls.map((c) => c[1] as string[]).flat().join(' ')
    expect(allArgs).not.toContain('powershell')
    logSpy.mockRestore()
  })

  it('disposer clears the pending timer', () => {
    const ctx = makeCtx(8080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    const disposer = ctx.effect.mock.calls[0]?.[0]?.() as (() => void) | undefined
    expect(disposer).toBeTypeOf('function')
    expect(() => disposer?.()).not.toThrow()
    logSpy.mockRestore()
  })
})