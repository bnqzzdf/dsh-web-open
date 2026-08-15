#!/usr/bin/env node
// dsh-web-open-install: one-shot installer for the dsh-web-open plugin.
// Adds the npm dependency and the cordis.patch.yml insert to the dsh web
// profile, then runs pnpm install. Idempotent: safe to run repeatedly.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const myPkg = require('./package.json')

const args = process.argv.slice(2)
const flagIdx = args.indexOf('--profile')
const profileName = flagIdx >= 0 && args[flagIdx + 1] ? args[flagIdx + 1] : 'web'

const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', profileName)
const patchPath = join(profileDir, 'cordis.patch.yml')
const pkgPath = join(profileDir, 'package.json')

console.log(`[dsh-web-open-install] profile: ${profileDir}`)

if (!existsSync(pkgPath)) {
  console.error('[dsh-web-open-install] profile not found at ' + profileDir)
  console.error('Run `dsh web` once to initialize the profile, then retry.')
  process.exit(1)
}

let changed = false

// 1) npm dependency
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.dependencies = pkg.dependencies ?? {}
if (!pkg.dependencies['dsh-web-open']) {
  pkg.dependencies['dsh-web-open'] = `^${myPkg.version}`
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`[dsh-web-open-install] added dependency dsh-web-open@^${myPkg.version}`)
  changed = true
} else {
  console.log('[dsh-web-open-install] dependency already present')
}

// 2) cordis.patch.yml insert
const INSERT = '- insert:\n    - id: web-open\n      name: dsh-web-open\n'
if (existsSync(patchPath)) {
  const raw = readFileSync(patchPath, 'utf8')
  if (raw.includes('web-open')) {
    console.log('[dsh-web-open-install] patch already registers web-open')
  } else {
    const trimmed = raw.trim()
    let next
    if (trimmed === '[]' || trimmed === '') {
      // fresh profile: keep leading comments, drop the [] flow marker
      const comment = raw.replace(/\[\]\s*$/, '').trimEnd()
      next = comment ? comment + '\n\n' + INSERT : INSERT
    } else {
      // existing block list: append a new element
      next = raw.trimEnd() + '\n' + INSERT
    }
    writeFileSync(patchPath, next)
    console.log('[dsh-web-open-install] patch updated (web-open inserted)')
    changed = true
  }
} else {
  writeFileSync(patchPath, INSERT)
  console.log('[dsh-web-open-install] created cordis.patch.yml with web-open')
  changed = true
}

// 3) install dependencies (pnpm, then corepack fallback)
const run = (cmd, a) => {
  if (process.platform === 'win32') {
    const line = `${cmd} ${a.map((x) => `"${x}"`).join(' ')}`
    return spawnSync(line, { cwd: profileDir, stdio: 'inherit', shell: true })
  }
  return spawnSync(cmd, a, { cwd: profileDir, stdio: 'inherit' })
}
if (changed) {
  console.log('[dsh-web-open-install] installing dependencies...')
  let status = run('pnpm', ['install']).status
  if (status !== 0) status = run('corepack', ['pnpm', 'install']).status
  if (status !== 0) {
    console.log('[dsh-web-open-install] automatic install failed; run it manually:')
    console.log(`    cd ${profileDir} && pnpm install`)
  } else {
    console.log('[dsh-web-open-install] dependencies installed')
  }
}

console.log('')
console.log('[dsh-web-open-install] done. Restart dsh web for the plugin to take effect:')
console.log('    dsh web')