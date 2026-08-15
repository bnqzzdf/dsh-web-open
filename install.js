#!/usr/bin/env node
// dsh-web-open installer: one-shot setup / update / reinstall for the
// dsh-web-open plugin in a dsh web profile.
//
//   dsh-web-open             install or repair (idempotent; also fixes a
//                             missing cordis.patch.yml registration)
//   dsh-web-open update       upgrade the plugin to the latest version
//   dsh-web-open reinstall    force a clean reinstall
//   --profile <name>          target profile (default: web)
//
// Every mode ensures the plugin is registered in cordis.patch.yml, so you
// never have to edit profile files by hand.
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
const sub = args[0] && !args[0].startsWith('--') ? args[0] : 'install'

const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const profileDir = join(dshHome, 'profiles', profileName)
const patchPath = join(profileDir, 'cordis.patch.yml')
const pkgPath = join(profileDir, 'package.json')

console.log(`[dsh-web-open-install] mode: ${sub}`)
console.log(`[dsh-web-open-install] profile: ${profileDir}`)

if (!existsSync(pkgPath)) {
  console.error('[dsh-web-open-install] profile not found at ' + profileDir)
  console.error('Run `dsh web` once to initialize the profile, then retry.')
  process.exit(1)
}

let needInstall = false
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.dependencies = pkg.dependencies ?? {}

// 1) dependency entry
const current = pkg.dependencies['dsh-web-open']
const desired = `^${myPkg.version}`
if (sub === 'update') {
  if (current !== desired) {
    pkg.dependencies['dsh-web-open'] = desired
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log(`[dsh-web-open-install] dependency updated ${current ?? 'none'} -> ${desired}`)
    needInstall = true
  } else {
    console.log(`[dsh-web-open-install] dependency already at ${desired}`)
  }
} else if (!current) {
  pkg.dependencies['dsh-web-open'] = desired
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`[dsh-web-open-install] added dependency dsh-web-open@${desired}`)
  needInstall = true
} else {
  console.log(`[dsh-web-open-install] dependency present (${current})`)
  if (sub === 'reinstall') {
    if (current !== desired) {
      pkg.dependencies['dsh-web-open'] = desired
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      console.log(`[dsh-web-open-install] dependency aligned to ${desired}`)
    }
    needInstall = true
  }
}

// 2) cordis.patch.yml registration (always ensured)
const INSERT = '- insert:\n    - id: web-open\n      name: dsh-web-open\n'
if (existsSync(patchPath)) {
  const raw = readFileSync(patchPath, 'utf8')
  if (raw.includes('web-open')) {
    console.log('[dsh-web-open-install] patch already registers web-open')
  } else {
    const trimmed = raw.trim()
    let next
    if (trimmed === '[]' || trimmed === '') {
      const comment = raw.replace(/\[\]\s*$/, '').trimEnd()
      next = comment ? comment + '\n\n' + INSERT : INSERT
    } else {
      next = raw.trimEnd() + '\n' + INSERT
    }
    writeFileSync(patchPath, next)
    console.log('[dsh-web-open-install] patch fixed (web-open registered)')
    needInstall = true
  }
} else {
  writeFileSync(patchPath, INSERT)
  console.log('[dsh-web-open-install] created cordis.patch.yml with web-open')
  needInstall = true
}

// 3) install / update / reinstall
const run = (cmd, a) => {
  if (process.platform === 'win32') {
    const line = `${cmd} ${a.map((x) => `"${x}"`).join(' ')}`
    return spawnSync(line, { cwd: profileDir, stdio: 'inherit', shell: true })
  }
  return spawnSync(cmd, a, { cwd: profileDir, stdio: 'inherit' })
}
const runPnpm = (a) => {
  let s = run('pnpm', a).status
  if (s !== 0) s = run('corepack', ['pnpm', ...a]).status
  return s
}

if (sub === 'reinstall') {
  console.log('[dsh-web-open-install] reinstalling (--force)...')
  const s = runPnpm(['install', '--force'])
  console.log(s === 0 ? '[dsh-web-open-install] reinstall done' : '[dsh-web-open-install] reinstall failed; run pnpm install manually in ' + profileDir)
} else if (sub === 'update') {
  if (needInstall) {
    console.log('[dsh-web-open-install] updating...')
    const s = runPnpm(['update', 'dsh-web-open'])
    console.log(s === 0 ? '[dsh-web-open-install] update done' : '[dsh-web-open-install] update failed; run pnpm update manually in ' + profileDir)
  } else {
    console.log('[dsh-web-open-install] nothing to update')
  }
} else if (needInstall) {
  console.log('[dsh-web-open-install] installing...')
  const s = runPnpm(['install'])
  console.log(s === 0 ? '[dsh-web-open-install] install done' : '[dsh-web-open-install] install failed; run pnpm install manually in ' + profileDir)
} else {
  console.log('[dsh-web-open-install] everything already in place')
}

console.log('')
console.log('[dsh-web-open-install] done. Restart dsh web for changes to take effect:')
console.log('    dsh web')
