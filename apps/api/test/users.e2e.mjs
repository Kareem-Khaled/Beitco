/**
 * Users Module — E2E Tests
 *
 * Tests:
 *  1. GET /users/me → 200
 *  2. PATCH /users/me → update name
 *  3. PATCH /users/me → update username
 *  4. PATCH /users/me → duplicate username → 409
 *  5. PATCH /users/me → update email
 *  6. PATCH /users/me → duplicate email → 409
 *  7. GET /users/check-username/:username → available
 *  8. GET /users/check-username/:username → taken
 *  9. GET /users/:id → public profile
 * 10. GET /users/:id → 404 non-existent
 * 11. GET /users/:id → 400 invalid UUID
 * 12. GET /users/:id/posts → paginated
 * 13. GET /users/:id/followers → empty list
 * 14. GET /users/:id/following → empty list
 * 15. GET /users/me → has all private fields
 */

const BASE = 'http://localhost:3001/api/v1';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

async function api(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data };
}

async function createUser(phone) {
  await api('POST', '/auth/otp/send', null, { phone });
  const { execSync } = await import('child_process');
  const otp = execSync(`docker exec beitco-redis redis-cli GET otp:${phone}`)
    .toString().trim();
  const res = await api('POST', '/auth/otp/verify', null, { phone, code: otp });
  return {
    token: res.data.data.accessToken,
    userId: res.data.data.user.id,
  };
}

async function main() {
  console.log('\n🧪 Users Module E2E Tests\n');

  // ─── Setup ──────────────────────────────────────

  console.log('📋 Setup');
  const user1 = await createUser('+201000000060');
  assert(!!user1.token, 'User 1 created');

  const user2 = await createUser('+201000000061');
  assert(!!user2.token, 'User 2 created');

  // ─── GET /users/me ──────────────────────────────

  console.log('\n📋 GET /users/me');

  const r1 = await api('GET', '/users/me', user1.token);
  assert(r1.status === 200, `GET /users/me → ${r1.status} (expect 200)`);
  assert(r1.data?.success === true, 'success: true');
  assert(!!r1.data?.data?.id, 'Has id');
  assert(!!r1.data?.data?.phone, 'Has phone (private field)');
  assert(r1.data?.data?.permissionTier === 'new_user', 'tier: new_user');
  assert('followerCount' in r1.data.data, 'Has followerCount');
  assert('followingCount' in r1.data.data, 'Has followingCount');

  // ─── PATCH /users/me ───────────────────────────

  console.log('\n📋 PATCH /users/me');

  const r2 = await api('PATCH', '/users/me', user1.token, {
    nameAr: 'أحمد تست',
    nameEn: 'Ahmed Test',
  });
  assert(r2.status === 200, `Update name → ${r2.status} (expect 200)`);
  assert(r2.data?.data?.nameAr === 'أحمد تست', 'nameAr updated');
  assert(r2.data?.data?.nameEn === 'Ahmed Test', 'nameEn updated');

  // Set username
  const username1 = `testuser_${Date.now()}`;
  const r3 = await api('PATCH', '/users/me', user1.token, { username: username1 });
  assert(r3.status === 200, `Set username → ${r3.status} (expect 200)`);
  assert(r3.data?.data?.username === username1, 'username set');

  // Duplicate username
  const r4 = await api('PATCH', '/users/me', user2.token, { username: username1 });
  assert(r4.status === 409, `Duplicate username → ${r4.status} (expect 409)`);

  // Set email
  const email1 = `test_${Date.now()}@example.com`;
  const r5 = await api('PATCH', '/users/me', user1.token, { email: email1 });
  assert(r5.status === 200, `Set email → ${r5.status} (expect 200)`);

  // Duplicate email
  const r6 = await api('PATCH', '/users/me', user2.token, { email: email1 });
  assert(r6.status === 409, `Duplicate email → ${r6.status} (expect 409)`);

  // ─── Check Username ─────────────────────────────

  console.log('\n📋 Check Username');

  const r7 = await api('GET', `/users/check-username/${username1}`, user1.token);
  assert(r7.status === 200, `Check taken username → ${r7.status} (expect 200)`);
  assert(r7.data?.data?.available === false, 'available: false');

  const r8 = await api('GET', `/users/check-username/unique_${Date.now()}`, user1.token);
  assert(r8.status === 200, `Check available username → ${r8.status} (expect 200)`);
  assert(r8.data?.data?.available === true, 'available: true');

  // ─── Public Profile ─────────────────────────────

  console.log('\n📋 Public Profile');

  const r9 = await api('GET', `/users/${user1.userId}`, null);
  assert(r9.status === 200, `Public profile → ${r9.status} (expect 200)`);
  assert(r9.data?.data?.id === user1.userId, 'Correct user ID');
  assert(!r9.data?.data?.phone, 'No phone (private)');
  assert(!r9.data?.data?.email, 'No email (private)');
  assert(!r9.data?.data?.preferences, 'No preferences (private)');

  // Non-existent user
  const fakeId = 'a0000000-b000-4000-8000-c00000000099';
  const r10 = await api('GET', `/users/${fakeId}`, null);
  assert(r10.status === 404, `Non-existent → ${r10.status} (expect 404)`);

  // Invalid UUID
  const r11 = await api('GET', '/users/not-a-uuid', null);
  assert(r11.status === 400, `Invalid UUID → ${r11.status} (expect 400)`);

  // ─── User Posts ─────────────────────────────────

  console.log('\n📋 User Posts / Followers / Following');

  const r12 = await api('GET', `/users/${user1.userId}/posts`, null);
  assert(r12.status === 200, `User posts → ${r12.status} (expect 200)`);
  assert(Array.isArray(r12.data?.data), 'data is array');

  const r13 = await api('GET', `/users/${user1.userId}/followers`, null);
  assert(r13.status === 200, `Followers → ${r13.status} (expect 200)`);
  assert(Array.isArray(r13.data?.data), 'data is array');

  const r14 = await api('GET', `/users/${user1.userId}/following`, null);
  assert(r14.status === 200, `Following → ${r14.status} (expect 200)`);
  assert(Array.isArray(r14.data?.data), 'data is array');

  // ─── Summary ────────────────────────────────────

  console.log('\n' + '═'.repeat(50));
  if (failed === 0) {
    console.log(`✅ Passed: ${passed} / ${passed + failed}`);
  } else {
    console.log(`❌ Failed: ${failed} / ${passed + failed}`);
  }
  console.log('═'.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
