/**
 * Social / Follow Module — E2E Tests
 *
 * Tests:
 *  1. Follow a user → 201
 *  2. Duplicate follow → 409
 *  3. Self-follow → 400
 *  4. Verify follower/following counts
 *  5. Get follow suggestions (target user not in list)
 *  6. Unfollow → 204
 *  7. Unfollow non-followed user → 404
 *  8. Block a user → 201
 *  9. Duplicate block → 409
 * 10. Block removes follow in both directions
 * 11. Blocked user cannot follow blocker → 400
 * 12. Unblock → 204
 * 13. Unblock non-blocked user → 404
 * 14. Self-block → 400
 * 15. Follow non-existent user → 404
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

/** Create a user via OTP flow, return { token, userId } */
async function createUser(phone) {
  // Send OTP
  await api('POST', '/auth/otp/send', null, { phone });

  // Read OTP from Redis
  const { execSync } = await import('child_process');
  const otp = execSync(`docker exec beitco-redis redis-cli GET otp:${phone}`)
    .toString().trim();

  // Verify OTP
  const res = await api('POST', '/auth/otp/verify', null, { phone, code: otp });
  return {
    token: res.data.data.accessToken,
    refreshToken: res.data.data.refreshToken,
    userId: res.data.data.user.id,
  };
}

async function main() {
  console.log('\n🧪 Social / Follow Module E2E Tests\n');

  // ─── Setup: create two users ───────────────────────
  console.log('📋 Setup');
  const userA = await createUser('+201000000030');
  assert(!!userA.token, 'User A created');

  const userB = await createUser('+201000000031');
  assert(!!userB.token, 'User B created');

  const userC = await createUser('+201000000032');
  assert(!!userC.token, 'User C created (for suggestions)');

  // ─── 1. Follow a user → 201 ───────────────────────
  console.log('\n📋 Follow');
  const f1 = await api('POST', `/follows/${userB.userId}`, userA.token);
  assert(f1.status === 201, `Follow user B → ${f1.status} (expect 201)`);
  assert(f1.data?.success === true, 'Response has success: true');
  assert(f1.data?.data?.followerId === userA.userId, 'followerId matches user A');
  assert(f1.data?.data?.followingId === userB.userId, 'followingId matches user B');

  // ─── 2. Duplicate follow → 409 ────────────────────
  const f2 = await api('POST', `/follows/${userB.userId}`, userA.token);
  assert(f2.status === 409, `Duplicate follow → ${f2.status} (expect 409)`);

  // ─── 3. Self-follow → 400 ─────────────────────────
  const f3 = await api('POST', `/follows/${userA.userId}`, userA.token);
  assert(f3.status === 400, `Self-follow → ${f3.status} (expect 400)`);

  // ─── 4. Verify follower/following counts ───────────
  console.log('\n📋 Counters');
  const meA = await api('GET', '/users/me', userA.token);
  assert(meA.data?.data?.followingCount === 1, `User A followingCount = ${meA.data?.data?.followingCount} (expect 1)`);

  const meB = await api('GET', '/users/me', userB.token);
  assert(meB.data?.data?.followerCount === 1, `User B followerCount = ${meB.data?.data?.followerCount} (expect 1)`);

  // ─── 5. Suggestions (should not include followed user) ──
  console.log('\n📋 Suggestions');
  const sug = await api('GET', '/follows/suggestions', userA.token);
  assert(sug.status === 200, `Get suggestions → ${sug.status} (expect 200)`);
  assert(sug.data?.success === true, 'Suggestions success: true');
  const sugIds = (sug.data?.data || []).map(s => s.user.id);
  assert(!sugIds.includes(userB.userId), 'Suggestions exclude already-followed user B');
  assert(!sugIds.includes(userA.userId), 'Suggestions exclude self');

  // ─── 6. Unfollow → 204 ────────────────────────────
  console.log('\n📋 Unfollow');
  const uf1 = await api('DELETE', `/follows/${userB.userId}`, userA.token);
  assert(uf1.status === 204, `Unfollow → ${uf1.status} (expect 204)`);

  // Verify counters reset
  const meA2 = await api('GET', '/users/me', userA.token);
  assert(meA2.data?.data?.followingCount === 0, `User A followingCount = ${meA2.data?.data?.followingCount} (expect 0)`);

  const meB2 = await api('GET', '/users/me', userB.token);
  assert(meB2.data?.data?.followerCount === 0, `User B followerCount = ${meB2.data?.data?.followerCount} (expect 0)`);

  // ─── 7. Unfollow non-followed → 404 ───────────────
  const uf2 = await api('DELETE', `/follows/${userB.userId}`, userA.token);
  assert(uf2.status === 404, `Unfollow non-followed → ${uf2.status} (expect 404)`);

  // ─── 8. Block a user → 201 ────────────────────────
  console.log('\n📋 Block');

  // First, re-follow so we can test block removes follow
  await api('POST', `/follows/${userB.userId}`, userA.token);
  // Also have B follow A
  await api('POST', `/follows/${userA.userId}`, userB.token);

  const b1 = await api('POST', `/blocks/${userB.userId}`, userA.token);
  assert(b1.status === 201, `Block user B → ${b1.status} (expect 201)`);

  // ─── 9. Duplicate block → 409 ─────────────────────
  const b2 = await api('POST', `/blocks/${userB.userId}`, userA.token);
  assert(b2.status === 409, `Duplicate block → ${b2.status} (expect 409)`);

  // ─── 10. Block removes follows in both directions ──
  console.log('\n📋 Block clears follows');
  const meA3 = await api('GET', '/users/me', userA.token);
  assert(meA3.data?.data?.followingCount === 0, `User A followingCount after block = ${meA3.data?.data?.followingCount} (expect 0)`);
  assert(meA3.data?.data?.followerCount === 0, `User A followerCount after block = ${meA3.data?.data?.followerCount} (expect 0)`);

  const meB3 = await api('GET', '/users/me', userB.token);
  assert(meB3.data?.data?.followerCount === 0, `User B followerCount after block = ${meB3.data?.data?.followerCount} (expect 0)`);
  assert(meB3.data?.data?.followingCount === 0, `User B followingCount after block = ${meB3.data?.data?.followingCount} (expect 0)`);

  // ─── 11. Blocked user cannot follow blocker → 400 ──
  const f4 = await api('POST', `/follows/${userA.userId}`, userB.token);
  assert(f4.status === 400, `Blocked user tries follow → ${f4.status} (expect 400)`);

  // ─── 12. Unblock → 204 ────────────────────────────
  console.log('\n📋 Unblock');
  const ub1 = await api('DELETE', `/blocks/${userB.userId}`, userA.token);
  assert(ub1.status === 204, `Unblock → ${ub1.status} (expect 204)`);

  // ─── 13. Unblock non-blocked → 404 ────────────────
  const ub2 = await api('DELETE', `/blocks/${userB.userId}`, userA.token);
  assert(ub2.status === 404, `Unblock non-blocked → ${ub2.status} (expect 404)`);

  // ─── 14. Self-block → 400 ─────────────────────────
  const b3 = await api('POST', `/blocks/${userA.userId}`, userA.token);
  assert(b3.status === 400, `Self-block → ${b3.status} (expect 400)`);

  // ─── 15. Follow non-existent user → 404 ───────────
  const fakeId = '00000000-0000-0000-0000-000000000099';
  const f5 = await api('POST', `/follows/${fakeId}`, userA.token);
  assert(f5.status === 404, `Follow non-existent user → ${f5.status} (expect 404)`);

  // ─── Summary ──────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Passed: ${passed} / ${passed + failed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'═'.repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('💥 Test crashed:', err);
  process.exit(1);
});
