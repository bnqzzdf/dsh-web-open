import { describe, expect, it, vi, beforeEach } from 'vitest'
import { apply, inject, name } from '../src/index.ts'

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
    delete process.env.DSH_WEB_OPEN
  })

  it('exports the plugin contract', () => {
    expect(name).toBe('web-open')
    expect(inject).toContain('webServer')
    expect(typeof apply).toBe('function')
  })

  it('registers a settle effect and schedules the browser open', () => {
    const ctx = makeCtx(3080)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    expect(ctx.get).toHaveBeenCalledWith('webServer')
    expect(ctx.effect).toHaveBeenCalledTimes(1)
    expect(ctx.effect.mock.calls[0]?.[1]).toBe('web-open.settle')
    expect(logSpy).toHaveBeenCalledWith('web-open: http://127.0.0.1:3080')
    logSpy.mockRestore()
  })

  it('skips scheduling when DSH_WEB_OPEN=0', () => {
    process.env.DSH_WEB_OPEN = '0'
    const ctx = makeCtx(9999)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    apply(ctx as never)
    expect(ctx.get).not.toHaveBeenCalled()
    expect(ctx.effect).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('web-open: disabled via DSH_WEB_OPEN=0')
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
