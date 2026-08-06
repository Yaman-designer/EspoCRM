/**
 * investigate-403.mjs
 *
 * Diagnoses why DELETE /api/v1/RealEstateProperty/:id returns 403.
 *
 * ── Credentials — never on the command line ────────────────────────────────
 * Priority order:
 *   1. ESPO_USERNAME / ESPO_PASSWORD environment variables
 *   2. Interactive masked prompt (only if stdin is a TTY)
 *
 * Usage:
 *   ESPO_USERNAME=devtest ESPO_PASSWORD=*** node scripts/investigate-403.mjs [recordId]
 *   node scripts/investigate-403.mjs [recordId]        # prompts interactively
 *
 * recordId is NOT sensitive — safe as a plain CLI arg. If omitted, the
 * script reads the most recently created RealEstateProperty (a read-only
 * GET) so the ACL check still has something to evaluate ownership against.
 *
 * ── Read-only by default ────────────────────────────────────────────────────
 * Everything above the "DELETE PROBE" section only issues GET requests. The
 * verdict (Missing ACL / delete=no / own-mismatch / team-mismatch / likely
 * Formula-Workflow) is inferred from the user's ACL and the record's
 * ownership fields — it never calls DELETE.
 *
 * ── Optional destructive probe ──────────────────────────────────────────────
 * Pass --confirm-delete together with an explicit recordId to additionally
 * fire the real DELETE and capture its exact status/headers/body (including
 * X-Status-Reason, where EspoCRM puts the human-readable ACL denial reason
 * on a 403 with an empty body). This WILL PERMANENTLY DELETE that record if
 * EspoCRM does not block it — only do this against a record you are certain
 * is safe to lose. It is never run implicitly.
 *
 *   ESPO_USERNAME=devtest ESPO_PASSWORD=*** node scripts/investigate-403.mjs <recordId> --confirm-delete
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join }  from 'node:path'
import readline from 'node:readline'

// ── 1. Read ESPO_API_URL from .env.local ──────────────────────────────────────

const root    = join(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = readFileSync(join(root, '.env.local'), 'utf8')
const envVars = Object.fromEntries(
  envFile
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => l.split('=').map(p => p.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
)
const BASE = envVars['ESPO_API_URL']
if (!BASE) {
  console.error('ERROR: ESPO_API_URL not found in .env.local')
  process.exit(1)
}

// ── 2. Parse CLI args — recordId + flags only, never credentials ──────────────

const cliArgs      = process.argv.slice(2)
const flags        = new Set(cliArgs.filter(a => a.startsWith('--')))
const positional    = cliArgs.filter(a => !a.startsWith('--'))
const recordIdArg   = positional[0]
const confirmDelete = flags.has('--confirm-delete')

if (confirmDelete && !recordIdArg) {
  console.error('ERROR: --confirm-delete requires an explicit recordId — refusing to guess which record to delete.')
  process.exit(1)
}

// ── 3. Resolve credentials: env vars, else masked interactive prompt ──────────

function maskedPrompt(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const onData = (char) => {
      char = char.toString()
      if (char === '\n' || char === '\r' || char === '') return
      readline.moveCursor(process.stdout, -1, 0)
      process.stdout.write(' ')
      readline.moveCursor(process.stdout, -1, 0)
      process.stdout.write('*')
    }
    process.stdout.write(question)
    process.stdin.on('data', onData)
    rl.question('', (answer) => {
      process.stdin.removeListener('data', onData)
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

async function resolveCredentials() {
  let username = process.env.ESPO_USERNAME
  let password = process.env.ESPO_PASSWORD

  if (username && password) {
    console.log('🔐  Using ESPO_USERNAME / ESPO_PASSWORD from the environment.\n')
    return { username, password }
  }

  if (!process.stdin.isTTY) {
    console.error(
      'ERROR: No ESPO_USERNAME/ESPO_PASSWORD in the environment, and stdin is not a TTY ' +
      '(can\'t prompt interactively). Set the env vars for this one invocation, e.g.:\n' +
      '  ESPO_USERNAME=devtest ESPO_PASSWORD=*** node scripts/investigate-403.mjs [recordId]',
    )
    process.exit(1)
  }

  if (!username) username = await maskedPrompt('EspoCRM username: ')
  if (!password) password = await maskedPrompt('EspoCRM password: ')
  console.log()
  return { username, password }
}

const { username, password } = await resolveCredentials()

// ── 4. Auth helpers ───────────────────────────────────────────────────────────

function b64(str) {
  return Buffer.from(str).toString('base64')
}

async function espoGet(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Espo-Authorization': token,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null }
}

// ── 5. Authenticate (mirrors authService.ts exactly) ──────────────────────────

console.log(`🔑  Authenticating as "${username}" against ${BASE}\n`)

const basicToken = b64(`${username}:${password}`)
const authRes = await fetch(`${BASE}/App/user`, {
  headers: {
    'Espo-Authorization': basicToken,
    'Content-Type': 'application/json',
  },
})

if (!authRes.ok) {
  const body = await authRes.text()
  console.error(`❌  Authentication failed — HTTP ${authRes.status}`)
  console.error(body)
  process.exit(1)
}

const sessionToken = authRes.headers.get('espo-auth-token')
const token = sessionToken ? b64(`${username}:${sessionToken}`) : basicToken
const userData = await authRes.json()

console.log('✅  Authenticated\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  CURRENT USER')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const userId   = userData.id        ?? userData.user?.id        ?? '(unknown)'
const userName = userData.userName  ?? userData.user?.userName  ?? '(unknown)'
const userType = userData.type      ?? userData.user?.type      ?? '(unknown)'
const isAdmin  = userData.isAdmin   ?? userData.user?.isAdmin   ?? false

console.log(`  id          : ${userId}`)
console.log(`  userName    : ${userName}`)
console.log(`  type        : ${userType}`)
console.log(`  isAdmin     : ${isAdmin}`)

// ── 6. Fetch full User record for roles + teams ────────────────────────────────

const userFull = await espoGet(
  `/User/${userId}?select=id,userName,name,isAdmin,type,rolesIds,rolesNames,teamsIds,teamsNames`,
  token,
)

if (userFull.status === 200 && userFull.body) {
  const u = userFull.body
  console.log(`  rolesIds    : ${JSON.stringify(u.rolesIds ?? [])}`)
  console.log(`  rolesNames  : ${JSON.stringify(u.rolesNames ?? [])}`)
  console.log(`  teamsIds    : ${JSON.stringify(u.teamsIds ?? [])}`)
  console.log(`  teamsNames  : ${JSON.stringify(u.teamsNames ?? [])}`)
} else {
  console.log(`  (could not fetch full user record — HTTP ${userFull.status})`)
}

// ── 7. Fetch ACL for RealEstateProperty ────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  ACL  →  RealEstateProperty')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// /App/user returns { acl: { data: { EntityName: { read, edit, delete, create } } } }
const acl = (userData.acl?.data ?? userData.user?.acl?.data ?? {})['RealEstateProperty']

if (acl) {
  console.log(`  read        : ${acl.read   ?? '(not set)'}`)
  console.log(`  create      : ${acl.create ?? '(not set)'}`)
  console.log(`  edit        : ${acl.edit   ?? '(not set)'}`)
  console.log(`  delete      : ${acl.delete ?? '(not set)'}`)
  console.log(`  stream      : ${acl.stream ?? '(not set)'}`)
} else {
  console.log('  (no ACL entry found — entity may not be in user role)')
  console.log('  Full acl.data keys:', Object.keys(userData.acl?.data ?? {}).join(', ') || '(empty)')
}

// ── 8. Resolve the target record — explicit id, else most recent (read-only) ──

let recordId = recordIdArg

if (!recordId) {
  console.log('\n(no recordId given — fetching the most recently created RealEstateProperty, read-only)')
  const listRes = await espoGet(
    `/RealEstateProperty?maxSize=1&offset=0&orderBy=createdAt&order=desc&select=id`,
    token,
  )
  recordId = listRes.body?.list?.[0]?.id
  if (!recordId) {
    console.log('  Could not find any RealEstateProperty record to inspect. Exiting.')
    process.exit(0)
  }
  console.log(`  Using record: ${recordId}`)
}

// ── 9. Inspect the target record ───────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  RECORD  →  RealEstateProperty  ${recordId}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const rec = await espoGet(
  `/RealEstateProperty/${recordId}?select=id,name,assignedUserId,assignedUserName,createdById,createdByName,teamsIds,teamsNames`,
  token,
)

let verdict = null // set below — reused by the optional DELETE probe section

if (rec.status === 200 && rec.body) {
  const r = rec.body
  console.log(`  assignedUserId   : ${r.assignedUserId   ?? '(null)'}`)
  console.log(`  assignedUserName : ${r.assignedUserName ?? '(null)'}`)
  console.log(`  createdById      : ${r.createdById      ?? '(null)'}`)
  console.log(`  createdByName    : ${r.createdByName    ?? '(null)'}`)
  console.log(`  teamsIds         : ${JSON.stringify(r.teamsIds   ?? [])}`)
  console.log(`  teamsNames       : ${JSON.stringify(r.teamsNames ?? [])}`)

  // ── 10. Verdict ────────────────────────────────────────────────────────────

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  403 VERDICT')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!acl) {
    verdict = 'missing-acl'
    console.log('  CAUSE : RealEstateProperty has NO ACL entry in the user\'s role.')
    console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
  } else if (acl.delete === 'no' || acl.delete === false) {
    verdict = 'delete-no'
    console.log('  CAUSE : delete = "no" — the role explicitly blocks all deletes.')
    console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
  } else if (acl.delete === 'own') {
    const ownerMatch = r.assignedUserId === userId
    if (ownerMatch) {
      verdict = 'own-match-suspect-hook'
      console.log('  CAUSE : delete = "own" and assignedUserId MATCHES current user.')
      console.log('          → ACL should allow this delete. Suspect a Formula or beforeDelete hook.')
      console.log('  CHECK : Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
      console.log('          Admin → Workflows → Entity Type: RealEstateProperty → Trigger: Before Delete')
    } else {
      verdict = 'own-mismatch'
      console.log(`  CAUSE : delete = "own" but assignedUserId = "${r.assignedUserId}"`)
      console.log(`          current user id = "${userId}"  — OWNERSHIP MISMATCH`)
      console.log('  FIX   : Either reassign the record to this user, OR')
      console.log('          Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
    }
  } else if (acl.delete === 'team') {
    const userTeams = userFull.body?.teamsIds ?? []
    const recTeams  = r.teamsIds ?? []
    const shared    = userTeams.filter(t => recTeams.includes(t))
    if (shared.length > 0) {
      verdict = 'team-match-suspect-hook'
      console.log(`  CAUSE : delete = "team" and teams overlap (${shared.join(', ')}).`)
      console.log('          → ACL should allow this. Suspect a Formula or beforeDelete hook.')
      console.log('  CHECK : Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
    } else {
      verdict = 'team-mismatch'
      console.log(`  CAUSE : delete = "team" but no team overlap.`)
      console.log(`          User teams  : ${JSON.stringify(userTeams)}`)
      console.log(`          Record teams: ${JSON.stringify(recTeams)}`)
      console.log('  FIX   : Add this user to a team that owns the record, OR')
      console.log('          Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
    }
  } else if (acl.delete === 'all' || acl.delete === true) {
    verdict = 'acl-all-suspect-hook'
    console.log('  CAUSE : ACL delete = "all" — role permits full delete.')
    console.log('          → 403 is NOT caused by role ACL. Look for:')
    console.log('          1. Formula: Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
    console.log('          2. Workflow: Admin → Workflows → Entity: RealEstateProperty → Trigger: Before Delete')
    console.log('          3. BPM: Admin → BPM → check for active processes on this entity')
  } else {
    verdict = 'unrecognized'
    console.log(`  CAUSE : delete = "${acl.delete}" — unrecognised value. Treating as restricted.`)
    console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
  }
} else if (rec.status === 403) {
  verdict = 'no-read-access'
  console.log(`  ❌  Cannot read the record — HTTP 403.`)
  console.log('      The current user also lacks READ access to this record.')
  console.log('      Check: Admin → Roles → [role] → Scope → RealEstateProperty → Read = All')
} else if (rec.status === 404) {
  verdict = 'not-found'
  console.log(`  ❌  Record not found (HTTP 404). It may already be deleted or the ID is wrong.`)
} else {
  verdict = 'unexpected'
  console.log(`  ❌  Unexpected HTTP ${rec.status}`)
  console.log(JSON.stringify(rec.body, null, 2))
}

// ── 11. Optional destructive probe — real DELETE, inspects the raw response ───

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  DELETE PROBE')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

if (!confirmDelete) {
  console.log('  Skipped (read-only run). The verdict above is inferred from ACL + ownership data,')
  console.log('  not from an actual DELETE call.')
  console.log()
  console.log('  To also capture the real DELETE response (status, headers — including')
  console.log('  X-Status-Reason, which carries the exact denial reason EspoCRM puts on a 403')
  console.log('  with an empty body — and body), re-run with --confirm-delete:')
  console.log()
  console.log(`    ESPO_USERNAME=*** ESPO_PASSWORD=*** node scripts/investigate-403.mjs ${recordId} --confirm-delete`)
  console.log()
  console.log('  ⚠ WARNING: that WILL PERMANENTLY DELETE this record if EspoCRM does not block it.')
  console.log('  Only do this against a record you are certain is safe to lose.')
} else {
  console.log(`  ⚠  Issuing a REAL DELETE against RealEstateProperty/${recordId} — this is irreversible if it succeeds.\n`)

  const delRes = await fetch(`${BASE}/RealEstateProperty/${recordId}`, {
    method: 'DELETE',
    headers: {
      'Espo-Authorization': token,
      'Content-Type': 'application/json',
    },
  })
  const delText = await delRes.text()

  console.log(`  HTTP status        : ${delRes.status}`)
  console.log(`  X-Status-Reason    : ${delRes.headers.get('x-status-reason') ?? '(not sent)'}`)
  console.log(`  Content-Type       : ${delRes.headers.get('content-type') ?? '(not sent)'}`)
  console.log(`  Content-Length     : ${delRes.headers.get('content-length') ?? '(not sent)'}`)
  console.log(`  Body               : ${delText ? delText.slice(0, 1000) : '(empty)'}`)

  console.log()
  if (delRes.ok) {
    console.log('  ✅  DELETE succeeded — the record is now gone. ACL/hook did NOT block it here.')
    console.log('      If the app still shows a 403 for other records/users, the block is specific')
    console.log('      to those (ownership/team) or intermittent (conditional Formula/Workflow).')
  } else if (delRes.status === 403) {
    const reason = delRes.headers.get('x-status-reason')
    console.log('  ❌  Confirmed 403 on the real DELETE call.')
    if (reason) {
      console.log(`      EspoCRM's stated reason: "${reason}"`)
    } else if (!delText.trim()) {
      console.log('      Body and X-Status-Reason are both empty — this pattern points to a')
      console.log('      Formula beforeDeleteScript or Workflow "Before Delete" trigger throwing')
      console.log('      a bare access-denied, rather than a plain role-ACL rejection (which')
      console.log(`      the verdict above already ruled ${verdict === 'acl-all-suspect-hook' || verdict?.includes('suspect-hook') ? 'in' : 'out'} via the read-only checks).`)
    }
  } else {
    console.log(`  ❌  Unexpected status ${delRes.status} on DELETE — see body above.`)
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
