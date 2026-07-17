/**
 * Auth Flow E2E Test Script
 * Run: node apps/api/test-auth-flow.mjs
 *
 * Tests:
 * 1. Health endpoint (public) — should work without auth
 * 2. Send OTP to a test phone
 * 3. Verify OTP and get tokens
 * 4. Access protected endpoint with JWT
 * 5. Refresh access token
 * 6. Unauthenticated access is blocked
 */

const BASE = 'http://localhost:3001/api/v1';

async function request(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

function log(label, result) {
  const icon = result.status < 400 ? '✅' : '❌';
  console.log(`\n${icon} ${label} [HTTP ${result.status}]`);
  console.log(JSON.stringify(result.data, null, 2));
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Beitoon Auth Flow — E2E Test');
  console.log('═══════════════════════════════════════');

  // 1. Health (public)
  const health = await request('GET', '/health');
  log('1. Health (public)', health);

  // 2. Unauthenticated request to a protected route should be 401
  const unauth = await request('DELETE', '/auth/logout');
  log('2. Unauthenticated → DELETE /auth/logout (expect 401)', unauth);

  // 3. Send OTP
  const phone = '+201234567890';
  const sendOtp = await request('POST', '/auth/otp/send', { phone });
  log('3. Send OTP', sendOtp);

  if (sendOtp.status !== 200) {
    console.log('\n⚠️  OTP send failed — cannot continue flow');
    return;
  }

  // 4. We need to get the OTP from Redis. In dev mode it's logged to console.
  //    Let's read it from Redis directly.
  const { default: Redis } = await import('ioredis');
  const redis = new Redis('redis://localhost:6379');
  const otp = await redis.get(`otp:${phone}`);
  console.log(`\n🔑 OTP from Redis: ${otp}`);

  if (!otp) {
    console.log('\n⚠️  Could not read OTP from Redis');
    await redis.quit();
    return;
  }

  // 5. Verify OTP → get tokens
  const verify = await request('POST', '/auth/otp/verify', { phone, code: otp });
  log('5. Verify OTP → tokens', verify);

  if (verify.status !== 200) {
    console.log('\n⚠️  OTP verify failed — cannot continue flow');
    await redis.quit();
    return;
  }

  const { accessToken, refreshToken, isNewUser } = verify.data.data;
  console.log(`\n👤 New user: ${isNewUser}`);
  console.log(`🎫 Access token: ${accessToken?.substring(0, 40)}...`);
  console.log(`🔄 Refresh token: ${refreshToken?.substring(0, 40)}...`);

  // 6. Authenticated request — logout endpoint requires auth
  const authed = await request('DELETE', '/auth/logout', { refreshToken }, {
    Authorization: `Bearer ${accessToken}`,
  });
  log('6. Authenticated → DELETE /auth/logout (expect 204)', authed);

  // 7. Invalid OTP should fail
  const badOtp = await request('POST', '/auth/otp/verify', { phone, code: '000000' });
  log('7. Invalid OTP (expect 400)', badOtp);

  // 8. Refresh token
  const refresh = await request('POST', '/auth/refresh', { refreshToken });
  log('8. Refresh token → new access token', refresh);

  // 9. Fake JWT should be 401
  const fakeJwt = await request('DELETE', '/auth/logout', { refreshToken: 'x' }, {
    Authorization: 'Bearer fake.jwt.token',
  });
  log('9. Fake JWT (expect 401)', fakeJwt);

  // 10. OTP cooldown — sending again immediately should fail
  const cooldown = await request('POST', '/auth/otp/send', { phone });
  log('10. OTP cooldown (expect 400)', cooldown);

  await redis.quit();

  console.log('\n═══════════════════════════════════════');
  console.log('  Tests Complete!');
  console.log('═══════════════════════════════════════');
}

main().catch(console.error);
