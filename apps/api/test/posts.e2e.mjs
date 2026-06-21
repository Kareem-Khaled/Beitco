/**
 * Posts Module — E2E Tests
 *
 * Tests:
 *  1. Tier 2 creates post → auto-published (201)
 *  2. Tier 3 creates post → pending_approval
 *  3. Tier 4 (new_user) blocked → 403
 *  4. GET /posts → list published
 *  5. GET /posts/:id → detail
 *  6. GET /posts/me/pending → user's pending posts
 *  7. PATCH /posts/:id → update within 24h
 *  8. PATCH /posts/:id → non-author → 403
 *  9. DELETE /posts/:id → soft delete → 204
 * 10. GET deleted post → 404
 * 11. POST /posts/:id/approve → publish pending
 * 12. POST /posts/:id/reject → reject pending
 * 13. Hashtag extraction (Arabic + English)
 * 14. Post types validation
 * 15. Filter by postType
 * 16. Filter by hashtag
 * 17. Pagination
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

async function setTier(userId, tier) {
  const { execSync } = await import('child_process');
  execSync(
    `docker exec beitco-postgres psql -U beitco -d beitco_dev -c "UPDATE users SET permission_tier='${tier}' WHERE id='${userId}'"`,
  );
}

async function main() {
  console.log('\n🧪 Posts Module E2E Tests\n');

  // ─── Setup ──────────────────────────────────────

  console.log('📋 Setup');
  const author = await createUser('+201000000070');
  assert(!!author.token, 'Author created');

  const viewer = await createUser('+201000000071');
  assert(!!viewer.token, 'Viewer created');

  // Promote author to verified_contributor (tier 2)
  await setTier(author.userId, 'verified_contributor');
  // Re-login to get updated token with new tier
  await api('POST', '/auth/otp/send', null, { phone: '+201000000070' });
  const { execSync } = await import('child_process');
  const otp = execSync('docker exec beitco-redis redis-cli GET otp:+201000000070').toString().trim();
  const loginRes = await api('POST', '/auth/otp/verify', null, { phone: '+201000000070', code: otp });
  author.token = loginRes.data.data.accessToken;
  assert(loginRes.data.data.user.permissionTier === 'verified_contributor', 'Author promoted to tier 2');

  // ─── Create Post (Tier 2 → auto-publish) ───────

  console.log('\n📋 Create Post');

  const r1 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'أفضل أحياء القاهرة الجديدة #عقارات #realestate',
  });
  assert(r1.status === 200 || r1.status === 201, `Tier 2 create → ${r1.status}`);
  assert(r1.data?.success === true, 'success: true');
  const postId = r1.data?.data?.id;
  assert(!!postId, 'Post ID returned');
  assert(r1.data?.data?.status === 'published', 'Auto-published (tier 2)');

  // Hashtag extraction
  const hashtags = r1.data?.data?.hashtags;
  assert(Array.isArray(hashtags), 'hashtags is array');
  assert(hashtags?.includes('عقارات'), 'Arabic hashtag extracted');
  assert(hashtags?.includes('realestate'), 'English hashtag extracted');

  // ─── Tier 3 → pending ──────────────────────────

  console.log('\n📋 Tier 3 → Pending');

  await setTier(viewer.userId, 'trusted_member');
  await api('POST', '/auth/otp/send', null, { phone: '+201000000071' });
  const otp2 = execSync('docker exec beitco-redis redis-cli GET otp:+201000000071').toString().trim();
  const login2 = await api('POST', '/auth/otp/verify', null, { phone: '+201000000071', code: otp2 });
  viewer.token = login2.data.data.accessToken;

  const r2 = await api('POST', '/posts', viewer.token, {
    postType: 'text',
    contentText: 'Post from tier 3 user',
  });
  assert(r2.status === 200 || r2.status === 201, `Tier 3 create → ${r2.status}`);
  const pendingPostId = r2.data?.data?.id;
  assert(r2.data?.data?.status === 'pending_approval', 'Status: pending_approval');

  // ─── Tier 4 (new_user) → blocked ───────────────

  console.log('\n📋 Tier 4 → Blocked');

  const newbie = await createUser('+201000000072');
  // new_user is default tier (4), which is < 3, so TierGuard should block
  const r3 = await api('POST', '/posts', newbie.token, {
    postType: 'text',
    contentText: 'Should be blocked',
  });
  assert(r3.status === 403, `Tier 4 blocked → ${r3.status} (expect 403)`);

  // ─── List Posts ─────────────────────────────────

  console.log('\n📋 List / Get Posts');

  const r4 = await api('GET', '/posts', null);
  assert(r4.status === 200, `List → ${r4.status} (expect 200)`);
  assert(Array.isArray(r4.data?.data), 'data is array');
  assert(r4.data?.data?.length >= 1, 'At least 1 published post');

  // Detail
  const r5 = await api('GET', `/posts/${postId}`, null);
  assert(r5.status === 200, `Detail → ${r5.status} (expect 200)`);
  assert(r5.data?.data?.id === postId, 'Correct post ID');
  assert(!!r5.data?.data?.author?.id, 'Author included');

  // My pending
  const r6 = await api('GET', '/posts/me/pending', viewer.token);
  assert(r6.status === 200, `My pending → ${r6.status} (expect 200)`);
  assert(r6.data?.data?.length >= 1, 'Has pending posts');

  // ─── Update ─────────────────────────────────────

  console.log('\n📋 Update Post');

  const r7 = await api('PATCH', `/posts/${postId}`, author.token, {
    contentText: 'Updated content #عقارات',
  });
  assert(r7.status === 200, `Update → ${r7.status} (expect 200)`);
  assert(r7.data?.data?.contentText === 'Updated content #عقارات', 'Content updated');

  // Non-author update
  const r8 = await api('PATCH', `/posts/${postId}`, viewer.token, {
    contentText: 'Hacked',
  });
  assert(r8.status === 403, `Non-author update → ${r8.status} (expect 403)`);

  // ─── Approve / Reject ──────────────────────────

  console.log('\n📋 Approve / Reject');

  // Approve pending post (author is tier 2)
  const r9 = await api('POST', `/posts/${pendingPostId}/approve`, author.token);
  assert(r9.status === 200, `Approve → ${r9.status} (expect 200)`);
  assert(r9.data?.data?.status === 'published', 'Status changed to published');

  // Create another pending post to reject
  const r10 = await api('POST', '/posts', viewer.token, {
    postType: 'text',
    contentText: 'This will be rejected',
  });
  const rejectPostId = r10.data?.data?.id;

  const r11 = await api('POST', `/posts/${rejectPostId}/reject`, author.token, { reason: 'Spam content' });
  assert(r11.status === 200, `Reject → ${r11.status} (expect 200)`);
  assert(r11.data?.data?.status === 'rejected', 'Status changed to rejected');

  // ─── Delete ─────────────────────────────────────

  console.log('\n📋 Delete');

  // Create a post to delete
  const r12 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'Delete me',
  });
  const deletePostId = r12.data?.data?.id;

  const r13 = await api('DELETE', `/posts/${deletePostId}`, author.token);
  assert(r13.status === 204, `Delete → ${r13.status} (expect 204)`);

  const r14 = await api('GET', `/posts/${deletePostId}`, null);
  assert(r14.status === 404, `Deleted → ${r14.status} (expect 404)`);

  // ─── Filters ────────────────────────────────────

  console.log('\n📋 Filters');

  const r15 = await api('GET', '/posts?postType=text', null);
  assert(r15.status === 200, `Filter by type → ${r15.status} (expect 200)`);

  const r16 = await api('GET', '/posts?hashtag=عقارات', null);
  assert(r16.status === 200, `Filter by hashtag → ${r16.status} (expect 200)`);

  // ─── Pagination ─────────────────────────────────

  console.log('\n📋 Pagination');

  const r17 = await api('GET', '/posts?limit=1', null);
  assert(r17.status === 200, `Page 1 → ${r17.status} (expect 200)`);
  assert(r17.data?.meta !== undefined, 'meta present');

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
