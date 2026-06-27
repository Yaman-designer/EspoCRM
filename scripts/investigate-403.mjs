/**
 * investigate-403.mjs
 *
 * Diagnoses why DELETE /api/v1/RealEstateProperty/:id returns 403.
 *
 * Usage:
 *   node scripts/investigate-403.mjs <username> <password> [recordId]
 *
 * The auth flow is identical to src/api/espocrm/authService.ts:
 *   1. GET /App/user with Espo-Authorization: btoa(username:password)
 *   2. Capture Espo-Auth-Token from the response header
 *   3. All subsequent calls use btoa(username:Espo-Auth-Token)
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join }  from 'node:path'

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

// ── 2. Parse CLI args ─────────────────────────────────────────────────────────

const [,, username, password, recordId] = process.argv

if (!username || !password) {
  console.error('Usage: node scripts/investigate-403.mjs <username> <password> [recordId]')
  process.exit(1)
}

// ── 3. Auth helpers ───────────────────────────────────────────────────────────

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

// ── 4. Authenticate (mirrors authService.ts exactly) ─────────────────────────

console.log(`\n🔑  Authenticating as "${username}" against ${BASE}\n`)

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

// ── 5. Fetch full User record for roles + teams ───────────────────────────────

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

// ── 6. Fetch ACL for RealEstateProperty ──────────────────────────────────────

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

// ── 7. Inspect the target record ─────────────────────────────────────────────

if (recordId) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  RECORD  →  RealEstateProperty  ${recordId}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const rec = await espoGet(
    `/RealEstateProperty/${recordId}?select=id,name,assignedUserId,assignedUserName,createdById,createdByName,teamsIds,teamsNames`,
    token,
  )

  if (rec.status === 200 && rec.body) {
    const r = rec.body
    console.log(`  assignedUserId   : ${r.assignedUserId   ?? '(null)'}`)
    console.log(`  assignedUserName : ${r.assignedUserName ?? '(null)'}`)
    console.log(`  createdById      : ${r.createdById      ?? '(null)'}`)
    console.log(`  createdByName    : ${r.createdByName    ?? '(null)'}`)
    console.log(`  teamsIds         : ${JSON.stringify(r.teamsIds   ?? [])}`)
    console.log(`  teamsNames       : ${JSON.stringify(r.teamsNames ?? [])}`)

    // ── 8. Verdict ────────────────────────────────────────────────────────────

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  403 VERDICT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (!acl) {
      console.log('  CAUSE : RealEstateProperty has NO ACL entry in the user\'s role.')
      console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
    } else if (acl.delete === 'no' || acl.delete === false) {
      console.log('  CAUSE : delete = "no" — the role explicitly blocks all deletes.')
      console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
    } else if (acl.delete === 'own') {
      const ownerMatch = r.assignedUserId === userId
      if (ownerMatch) {
        console.log('  CAUSE : delete = "own" and assignedUserId MATCHES current user.')
        console.log('          → ACL should allow this delete. Suspect a Formula or beforeDelete hook.')
        console.log('  CHECK : Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
        console.log('          Admin → Workflows → Entity Type: RealEstateProperty → Trigger: Before Delete')
      } else {
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
        console.log(`  CAUSE : delete = "team" and teams overlap (${shared.join(', ')}).`)
        console.log('          → ACL should allow this. Suspect a Formula or beforeDelete hook.')
        console.log('  CHECK : Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
      } else {
        console.log(`  CAUSE : delete = "team" but no team overlap.`)
        console.log(`          User teams  : ${JSON.stringify(userTeams)}`)
        console.log(`          Record teams: ${JSON.stringify(recTeams)}`)
        console.log('  FIX   : Add this user to a team that owns the record, OR')
        console.log('          Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
      }
    } else if (acl.delete === 'all' || acl.delete === true) {
      console.log('  CAUSE : ACL delete = "all" — role permits full delete.')
      console.log('          → 403 is NOT caused by role ACL. Look for:')
      console.log('          1. Formula: Admin → Entity Manager → RealEstateProperty → Formula → beforeDeleteScript')
      console.log('          2. Workflow: Admin → Workflows → Entity: RealEstateProperty → Trigger: Before Delete')
      console.log('          3. BPM: Admin → BPM → check for active processes on this entity')
    } else {
      console.log(`  CAUSE : delete = "${acl.delete}" — unrecognised value. Treating as restricted.`)
      console.log('  FIX   : Admin → Roles → [role] → Scope → RealEstateProperty → Delete = All')
    }
  } else if (rec.status === 403) {
    console.log(`  ❌  Cannot read the record — HTTP 403.`)
    console.log('      The current user also lacks READ access to this record.')
    console.log('      Check: Admin → Roles → [role] → Scope → RealEstateProperty → Read = All')
  } else if (rec.status === 404) {
    console.log(`  ❌  Record not found (HTTP 404). It may already be deleted or the ID is wrong.`)
  } else {
    console.log(`  ❌  Unexpected HTTP ${rec.status}`)
    console.log(JSON.stringify(rec.body, null, 2))
  }
} else {
  console.log('\n  (no record ID supplied — skipping record + verdict sections)')
  console.log('  Re-run: node scripts/investigate-403.mjs <user> <pass> <recordId>')
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
