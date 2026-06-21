/**
 * Notifications Module — E2E Tests
 *
 * Tests:
 *  1. Empty notifications list → 200
 *  2. Unread count (0 initially) → 200
 *  3. Create notifications via DB insert
 *  4. Get notifications → 200 with items
 *  5. Unread count after creation → correct
 *  6. Mark single notification as read → 200
 *  7. Unread count decreases
 *  8. Mark all as read → 200
 *  9. Unread count = 0 after mark all
 * 10. Unread only filter → only unread
 * 11. Mark non-existent notification → 404
 * 12. Mark other user's notification → 404
 * 13. Get preferences (defaults) → 200
 * 14. Update preferences → 200
 * 15. Preferences persist after update → 200
 * 16. Subscribe push token → 200
 * 17. Pagination (cursor) → works
 * 18. Unauthenticated → 401
 * 19. Notification data contains expected fields
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

/** Insert notification directly into DB (simulating internal create) */
async function insertNotification(userId, type, title, body, data) {
  const { execFileSync } = await import('child_process');
  const dataJson = JSON.stringify(data || {});
  const bodyVal = body ? `'${body.replace(/'/g, "''")}'` : 'NULL';
  const sql = `INSERT INTO notifications (id, user_id, type, title, body, data, created_at) VALUES (gen_random_uuid(), '${userId}', '${type}', '${title.replace(/'/g, "''")}', ${bodyVal}, '${dataJson}'::jsonb, now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString().trim();
  return result;
}

async function main() {
  console.log('\n🧪 Notifications Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const ts = Date.now().toString();
  const user1 = await createUser(`+2010${ts.slice(-8)}`);
  assert(!!user1.token, 'User 1 created');

  const user2 = await createUser(`+2011${ts.slice(-8)}`);
  assert(!!user2.token, 'User 2 created');

  // ─── 1. Empty notifications list → 200 ────────────
  console.log('\n📋 1. Empty notifications list');
  const r1 = await api('GET', '/notifications', user1.token);
  assert(r1.status === 200, `Status 200 (got ${r1.status})`);
  assert(r1.data?.success === true, 'success: true');
  assert(Array.isArray(r1.data?.data), 'data is array');
  assert(r1.data?.meta?.hasMore === false, 'hasMore = false');

  // ─── 2. Unread count (0 initially) → 200 ──────────
  console.log('\n📋 2. Unread count (0)');
  const r2 = await api('GET', '/notifications/unread-count', user1.token);
  assert(r2.status === 200, `Status 200 (got ${r2.status})`);
  assert(r2.data?.data?.total === 0, `total = 0 (got ${r2.data?.data?.total})`);

  // ─── 3. Create notifications via DB ────────────────
  console.log('\n📋 3. Create notifications via DB');
  const notif1Id = await insertNotification(user1.userId, 'like', 'أحمد عمل لايك لبوستك', 'on your post about القاهرة', { postId: 'a0000000-b000-4000-8000-c00000000001' });
  assert(!!notif1Id, 'Notification 1 created');
  const notif2Id = await insertNotification(user1.userId, 'comment', 'سارة علقت على بوستك', null, { postId: 'a0000000-b000-4000-8000-c00000000001' });
  assert(!!notif2Id, 'Notification 2 created');
  const notif3Id = await insertNotification(user1.userId, 'follow', 'محمد بدأ يتابعك', null, { userId: 'a0000000-b000-4000-8000-c00000000002' });
  assert(!!notif3Id, 'Notification 3 created');

  // Also create one for user2 (to test isolation)
  await insertNotification(user2.userId, 'system', 'مرحباً بك في بيتكو', 'Welcome!', {});

  // ─── 4. Get notifications → 200 with items ────────
  console.log('\n📋 4. Get notifications');
  const r4 = await api('GET', '/notifications', user1.token);
  assert(r4.status === 200, `Status 200 (got ${r4.status})`);
  assert(r4.data?.data?.length === 3, `3 notifications (got ${r4.data?.data?.length})`);
  // Newest first
  assert(r4.data?.data?.[0]?.type === 'follow', 'newest first (follow)');

  // ─── 5. Unread count after creation → 3 ───────────
  console.log('\n📋 5. Unread count after creation');
  const r5 = await api('GET', '/notifications/unread-count', user1.token);
  assert(r5.data?.data?.total === 3, `total = 3 (got ${r5.data?.data?.total})`);

  // ─── 6. Mark single notification as read → 200 ────
  console.log('\n📋 6. Mark single as read');
  const firstNotifId = r4.data?.data?.[0]?.id;
  const r6 = await api('PATCH', `/notifications/${firstNotifId}/read`, user1.token);
  assert(r6.status === 200, `Status 200 (got ${r6.status})`);
  assert(r6.data?.data?.readAt !== null, 'readAt is set');

  // ─── 7. Unread count decreases → 2 ────────────────
  console.log('\n📋 7. Unread count decreases');
  const r7 = await api('GET', '/notifications/unread-count', user1.token);
  assert(r7.data?.data?.total === 2, `total = 2 (got ${r7.data?.data?.total})`);

  // ─── 8. Mark all as read → 200 ────────────────────
  console.log('\n📋 8. Mark all as read');
  const r8 = await api('PATCH', '/notifications/read-all', user1.token);
  assert(r8.status === 200, `Status 200 (got ${r8.status})`);
  assert(r8.data?.data?.updated === 2, `updated = 2 (got ${r8.data?.data?.updated})`);

  // ─── 9. Unread count = 0 after mark all ───────────
  console.log('\n📋 9. Unread count = 0');
  const r9 = await api('GET', '/notifications/unread-count', user1.token);
  assert(r9.data?.data?.total === 0, `total = 0 (got ${r9.data?.data?.total})`);

  // ─── 10. Unread only filter ───────────────────────
  console.log('\n📋 10. Unread only filter');
  // Add one more unread notification
  await insertNotification(user1.userId, 'mention', 'ذُكرت في تعليق', null, {});
  const r10 = await api('GET', '/notifications?unreadOnly=true', user1.token);
  assert(r10.status === 200, `Status 200 (got ${r10.status})`);
  assert(r10.data?.data?.length === 1, `1 unread (got ${r10.data?.data?.length})`);
  assert(r10.data?.data?.[0]?.type === 'mention', 'only unread returned');

  // ─── 11. Mark non-existent notification → 404 ─────
  console.log('\n📋 11. Mark non-existent');
  const fakeId = 'a0000000-b000-4000-8000-c00000000099';
  const r11 = await api('PATCH', `/notifications/${fakeId}/read`, user1.token);
  assert(r11.status === 404, `Status 404 (got ${r11.status})`);

  // ─── 12. Mark other user's notification → 404 ─────
  console.log('\n📋 12. Mark other user\'s notification');
  // Get user2's notification
  const r12setup = await api('GET', '/notifications', user2.token);
  const user2NotifId = r12setup.data?.data?.[0]?.id;
  assert(!!user2NotifId, 'User2 has a notification');
  const r12 = await api('PATCH', `/notifications/${user2NotifId}/read`, user1.token);
  assert(r12.status === 404, `Status 404 (got ${r12.status})`);

  // ─── 13. Get preferences (defaults) → 200 ─────────
  console.log('\n📋 13. Get preferences (defaults)');
  const r13 = await api('GET', '/notifications/preferences', user1.token);
  assert(r13.status === 200, `Status 200 (got ${r13.status})`);
  assert(r13.data?.data?.likes === true, 'likes default = true');
  assert(r13.data?.data?.comments === true, 'comments default = true');
  assert(r13.data?.data?.follows === true, 'follows default = true');
  assert(r13.data?.data?.pushEnabled === true, 'pushEnabled default = true');

  // ─── 14. Update preferences → 200 ─────────────────
  console.log('\n📋 14. Update preferences');
  const r14 = await api('PATCH', '/notifications/preferences', user1.token, {
    likes: false,
    pushEnabled: false,
  });
  assert(r14.status === 200, `Status 200 (got ${r14.status})`);
  assert(r14.data?.data?.likes === false, 'likes = false after update');
  assert(r14.data?.data?.pushEnabled === false, 'pushEnabled = false after update');
  assert(r14.data?.data?.comments === true, 'comments unchanged = true');

  // ─── 15. Preferences persist → 200 ────────────────
  console.log('\n📋 15. Preferences persist');
  const r15 = await api('GET', '/notifications/preferences', user1.token);
  assert(r15.data?.data?.likes === false, 'likes persisted = false');
  assert(r15.data?.data?.pushEnabled === false, 'pushEnabled persisted = false');

  // ─── 16. Subscribe push token → 200 ───────────────
  console.log('\n📋 16. Subscribe push token');
  const r16 = await api('POST', '/notifications/subscribe', user1.token, {
    fcmToken: 'fake-fcm-token-abc123',
    platform: 'ios',
  });
  assert(r16.status === 200, `Status 200 (got ${r16.status})`);
  assert(r16.data?.data?.subscribed === true, 'subscribed = true');

  // ─── 17. Pagination (cursor) ──────────────────────
  console.log('\n📋 17. Pagination');
  const r17a = await api('GET', '/notifications?limit=2', user1.token);
  assert(r17a.status === 200, `Status 200 (got ${r17a.status})`);
  assert(r17a.data?.data?.length === 2, `first page = 2 items (got ${r17a.data?.data?.length})`);
  assert(r17a.data?.meta?.hasMore === true, 'hasMore = true');

  const cursor = r17a.data?.meta?.cursor;
  const r17b = await api('GET', `/notifications?limit=2&cursor=${cursor}`, user1.token);
  assert(r17b.status === 200, `Status 200 page 2 (got ${r17b.status})`);
  assert(r17b.data?.data?.length >= 1, `page 2 has items (got ${r17b.data?.data?.length})`);

  // ─── 18. Unauthenticated → 401 ────────────────────
  console.log('\n📋 18. Unauthenticated');
  const r18 = await api('GET', '/notifications', null);
  assert(r18.status === 401, `Status 401 (got ${r18.status})`);

  // ─── 19. Notification fields ──────────────────────
  console.log('\n📋 19. Notification data fields');
  const r19 = await api('GET', '/notifications?limit=1', user1.token);
  const notif = r19.data?.data?.[0];
  assert(!!notif?.id, 'id present');
  assert(!!notif?.type, 'type present');
  assert(!!notif?.title, 'title present');
  assert(notif?.createdAt !== undefined, 'createdAt present');
  assert(notif?.data !== undefined, 'data object present');

  // ─── Summary ───────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total:    ${passed + failed}`);
  console.log(`${'═'.repeat(50)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
