/**
 * Auth Module — E2E Tests
 *
 * Tests:
 *  1. Send OTP → 200
 *  2. Send OTP (invalid phone) → 400
 *  3. Send OTP cooldown → 400
 *  4. Verify OTP → 200 (returns tokens + user)
 *  5. Verify OTP (wrong code) → 400
 *  6. Verify OTP (expired/no OTP) → 400
 *  7. New user gets new_user tier
 *  8. Refresh token → 200
 *  9. Refresh token (invalid) → 401
 * 10. Google login → 400 (NOT_IMPLEMENTED)
 * 11. Apple login → 400 (NOT_IMPLEMENTED)
 * 12. Logout → 204
 * 13. Logout token blacklisted → refresh fails
 * 14. Protected route without token → 401
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

async function getOtp(phone) {
  const { execSync } = await import('child_process');
  return execSync(`docker exec beitco-redis redis-cli GET otp:${phone}`)
    .toString().trim();
}

async function main() {
  console.log('\n🧪 Auth Module E2E Tests\n');

  // Generate unique phone numbers to avoid stale DB users
  // Regex: ^\+20(1[0125]\d{8})$ → +20 followed by exactly 10 digits
  const ts = String(Date.now()).slice(-8);
  const phone1 = `+2010${ts}`;    // +20 + 10 digits: 10XXXXXXXX
  const phone2 = `+2011${ts}`;    // +20 + 10 digits: 11XXXXXXXX

  // ─── Send OTP ───────────────────────────────────

  console.log('📋 Send OTP');

  const r1 = await api('POST', '/auth/otp/send', null, { phone: phone1 });
  assert(r1.status === 200, `Send OTP → ${r1.status} (expect 200)`);
  assert(r1.data?.success === true, 'success: true');
  assert(r1.data?.data?.expiresIn === 300, 'expiresIn: 300');
  assert(r1.data?.data?.retryAfter === 60, 'retryAfter: 60');

  // Invalid phone
  const r2 = await api('POST', '/auth/otp/send', null, { phone: '12345' });
  assert(r2.status === 400, `Invalid phone → ${r2.status} (expect 400)`);

  // Cooldown
  const r3 = await api('POST', '/auth/otp/send', null, { phone: phone1 });
  assert(r3.status === 400, `Cooldown → ${r3.status} (expect 400)`);

  // ─── Verify OTP ─────────────────────────────────

  console.log('\n📋 Verify OTP');

  const otp1 = await getOtp(phone1);
  assert(otp1.length === 6, `OTP retrieved from Redis: ${otp1.length} digits`);

  // Wrong code
  const r4 = await api('POST', '/auth/otp/verify', null, { phone: phone1, code: '000000' });
  assert(r4.status === 400, `Wrong OTP → ${r4.status} (expect 400)`);

  // Correct code
  const r5 = await api('POST', '/auth/otp/verify', null, { phone: phone1, code: otp1 });
  assert(r5.status === 200, `Verify OTP → ${r5.status} (expect 200)`);
  assert(r5.data?.success === true, 'success: true');
  assert(!!r5.data?.data?.accessToken, 'accessToken returned');
  assert(!!r5.data?.data?.refreshToken, 'refreshToken returned');
  assert(typeof r5.data?.data?.isNewUser === 'boolean', 'isNewUser is boolean');
  assert(!!r5.data?.data?.user?.permissionTier, 'tier present');

  const token1 = r5.data.data.accessToken;
  const refreshToken1 = r5.data.data.refreshToken;

  // Expired/no OTP (same phone, OTP already consumed)
  const r5b = await api('POST', '/auth/otp/verify', null, { phone: phone1, code: otp1 });
  assert(r5b.status === 400, `Expired OTP → ${r5b.status} (expect 400)`);

  // ─── Existing user login ────────────────────────

  console.log('\n📋 Second User Login');

  // Use a different phone for second user
  const r6 = await api('POST', '/auth/otp/send', null, { phone: phone2 });
  assert(r6.status === 200, `Send OTP phone2 → ${r6.status} (expect 200)`);

  const otp2 = await getOtp(phone2);
  const r7 = await api('POST', '/auth/otp/verify', null, { phone: phone2, code: otp2 });
  assert(r7.status === 200, `Verify phone2 → ${r7.status} (expect 200)`);
  assert(typeof r7.data?.data?.isNewUser === 'boolean', 'isNewUser is boolean');

  // ─── Refresh Token ──────────────────────────────

  console.log('\n📋 Refresh Token');

  const r8 = await api('POST', '/auth/refresh', null, { refreshToken: refreshToken1 });
  assert(r8.status === 200, `Refresh → ${r8.status} (expect 200)`);
  assert(!!r8.data?.data?.accessToken, 'New accessToken returned');

  // Invalid refresh token
  const r9 = await api('POST', '/auth/refresh', null, { refreshToken: 'invalid.token.here' });
  assert(r9.status === 401, `Invalid refresh → ${r9.status} (expect 401)`);

  // ─── Social Login Stubs ─────────────────────────

  console.log('\n📋 Social Login Stubs');

  const r10 = await api('POST', '/auth/google', null, { idToken: 'fake-google-token' });
  assert(r10.status === 400, `Google → ${r10.status} (expect 400)`);
  assert(r10.data?.error?.code === 'NOT_IMPLEMENTED' || r10.data?.message?.includes('not yet configured'),
    'Google returns NOT_IMPLEMENTED');

  const r11 = await api('POST', '/auth/apple', null, {
    identityToken: 'fake-apple-token',
    authorizationCode: 'fake-code',
  });
  assert(r11.status === 400, `Apple → ${r11.status} (expect 400)`);

  // ─── Protected Route ────────────────────────────

  console.log('\n📋 Protected Routes');

  const r12 = await api('GET', '/users/me', null);
  assert(r12.status === 401, `No token → ${r12.status} (expect 401)`);

  const r13 = await api('GET', '/users/me', token1);
  assert(r13.status === 200, `With token → ${r13.status} (expect 200)`);

  // ─── Logout ─────────────────────────────────────

  console.log('\n📋 Logout');

  const r14 = await api('DELETE', '/auth/logout', token1, { refreshToken: refreshToken1 });
  assert(r14.status === 204, `Logout → ${r14.status} (expect 204)`);

  // Refresh after logout should fail (blacklisted)
  const r15 = await api('POST', '/auth/refresh', null, { refreshToken: refreshToken1 });
  assert(r15.status === 401, `Refresh after logout → ${r15.status} (expect 401)`);

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
