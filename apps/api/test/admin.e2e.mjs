/**
 * Admin Module — E2E Tests
 *
 * Tests:
 *  1. Non-admin (Tier 4) cannot access admin endpoints → 403
 *  2. GET /admin/users → 200 with user list
 *  3. GET /admin/users?tier=admin → filter by tier
 *  4. GET /admin/users?search=... → search by name
 *  5. PATCH /admin/users/:id/tier → change tier → 200
 *  6. PATCH /admin/users/:id/tier non-existent → 404
 *  7. PATCH /admin/users/:id/verify → verify user → 200
 *  8. PATCH /admin/users/:id/verify auto-upgrades new_user to trusted_member
 *  9. POST /admin/users/:id/suspend → suspend user → 200
 * 10. POST /admin/users/:id/suspend non-existent → 404
 * 11. GET /admin/posts/pending → 200 (empty initially)
 * 12. Create pending post, then GET /admin/posts/pending → has post
 * 13. PATCH /admin/posts/:id/approve → 200, post is published
 * 14. PATCH /admin/posts/:id/approve already approved → 400
 * 15. PATCH /admin/posts/:id/reject → 200, post is rejected
 * 16. PATCH /admin/posts/:id/reject requires reason
 * 17. GET /admin/posts/flagged → 200
 * 18. GET /admin/comments/flagged → 200
 * 19. GET /admin/reports → 200 (empty initially)
 * 20. Create report, GET /admin/reports → has report
 * 21. GET /admin/reports?status=pending → filter
 * 22. PATCH /admin/reports/:id → review report → 200
 * 23. PATCH /admin/reports/:id non-existent → 404
 * 24. GET /admin/groups → 200
 * 25. GET /admin/analytics → 200 with stats
 * 26. GET /admin/moderation/stats → 200 with moderation stats
 * 27. User pagination cursor works
 * 28. Unauthenticated → 401
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

/** Set a user's tier directly via DB */
async function setTier(userId, tier) {
  const { execFileSync } = await import('child_process');
  execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c',
    `UPDATE users SET permission_tier='${tier}' WHERE id='${userId}'`]);
}

/** Extract UUID from psql output */
function extractUuid(output) {
  const match = output.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
  return match ? match[1] : output.trim();
}

/** Insert a post directly via DB (as pending approval) */
async function insertPendingPost(authorId) {
  const { execFileSync } = await import('child_process');
  const sql = `INSERT INTO posts (id, author_id, post_type, content_text, status, approval_status, created_at, updated_at) VALUES (gen_random_uuid(), '${authorId}', 'text', 'Test pending post', 'pending_approval', 'pending', now(), now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString();
  return extractUuid(result);
}

/** Insert a post with AI moderation flags */
async function insertFlaggedPost(authorId) {
  const { execFileSync } = await import('child_process');
  const flags = JSON.stringify([{ type: 'spam', score: 0.85 }]);
  const sql = `INSERT INTO posts (id, author_id, post_type, content_text, status, approval_status, ai_moderation_flags, created_at, updated_at) VALUES (gen_random_uuid(), '${authorId}', 'text', 'Flagged post', 'published', 'approved', '${flags}'::jsonb, now(), now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString();
  return extractUuid(result);
}

/** Insert a report directly via DB */
async function insertReport(reporterId, targetPostId) {
  const { execFileSync } = await import('child_process');
  const sql = `INSERT INTO reports (id, reporter_id, target_type, target_post_id, reason, status, created_at) VALUES (gen_random_uuid(), '${reporterId}', 'post', '${targetPostId}', 'spam', 'pending', now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString();
  return extractUuid(result);
}

/** Insert a group directly via DB */
async function insertGroup(creatorId, slug) {
  const { execFileSync } = await import('child_process');
  const sql = `INSERT INTO groups (id, creator_id, name_ar, name_en, slug, group_type, privacy, member_count, post_count, settings, created_at, updated_at) VALUES (gen_random_uuid(), '${creatorId}', 'مجموعة تست', 'Test Group', '${slug}', 'topic', 'public', 1, 0, '{}', now(), now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString();
  return extractUuid(result);
}

/** Insert a comment with AI moderation flags */
async function insertFlaggedComment(authorId, postId) {
  const { execFileSync } = await import('child_process');
  const flags = JSON.stringify([{ type: 'toxicity', score: 0.9 }]);
  const sql = `INSERT INTO comments (id, post_id, author_id, content, status, ai_moderation_flags, created_at, updated_at) VALUES (gen_random_uuid(), '${postId}', '${authorId}', 'Bad comment', 'visible', '${flags}'::jsonb, now(), now()) RETURNING id`;
  const result = execFileSync('docker', ['exec', '-i', 'beitco-postgres', 'psql', '-U', 'beitco', '-d', 'beitco_dev', '-t', '-c', sql]).toString();
  return extractUuid(result);
}

async function main() {
  console.log('\n🧪 Admin Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const ts = Date.now().toString();
  const admin = await createUser(`+2010${ts.slice(-8)}`);
  await setTier(admin.userId, 'admin');
  assert(admin.token, 'Admin user created');

  const ts2 = (Date.now() + 1).toString();
  const regularUser = await createUser(`+2010${ts2.slice(-8)}`);
  assert(regularUser.token, 'Regular user created (Tier 4)');

  const ts3 = (Date.now() + 2).toString();
  const targetUser = await createUser(`+2010${ts3.slice(-8)}`);
  assert(targetUser.token, 'Target user created for admin actions');

  // ─── 1. Non-admin access blocked ────────────────────
  console.log('\n📋 1. Permission Check');
  const r1 = await api('GET', '/admin/users', regularUser.token);
  assert(r1.status === 403, `Non-admin GET /admin/users → 403 (got ${r1.status})`);

  const r1b = await api('GET', '/admin/analytics', regularUser.token);
  assert(r1b.status === 403, `Non-admin GET /admin/analytics → 403 (got ${r1b.status})`);

  const r1c = await api('GET', '/admin/reports', regularUser.token);
  assert(r1c.status === 403, `Non-admin GET /admin/reports → 403 (got ${r1c.status})`);

  // ─── 2. GET /admin/users ────────────────────────────
  console.log('\n📋 2. Get Users');
  const r2 = await api('GET', '/admin/users', admin.token);
  assert(r2.status === 200, `GET /admin/users → 200 (got ${r2.status})`);
  assert(r2.data.success === true, 'Response has success: true');
  assert(Array.isArray(r2.data.data), 'Response has data array');
  assert(r2.data.data.length >= 3, `At least 3 users returned (got ${r2.data.data.length})`);
  assert(r2.data.meta !== undefined, 'Response has meta');

  // ─── 3. Filter by tier ─────────────────────────────
  console.log('\n📋 3. Filter by Tier');
  const r3 = await api('GET', '/admin/users?tier=admin', admin.token);
  assert(r3.status === 200, `GET /admin/users?tier=admin → 200 (got ${r3.status})`);
  assert(r3.data.data.every(u => u.permissionTier === 'admin'), 'All returned users are admin tier');

  // ─── 4. Search users ───────────────────────────────
  console.log('\n📋 4. Search Users');
  // Search by phone substring
  const phoneDigits = ts.slice(-4);
  const r4 = await api('GET', `/admin/users?search=${phoneDigits}`, admin.token);
  assert(r4.status === 200, `GET /admin/users?search=... → 200 (got ${r4.status})`);
  assert(r4.data.data.length >= 1, `Search returned at least 1 user (got ${r4.data.data.length})`);

  // ─── 5. Change tier ────────────────────────────────
  console.log('\n📋 5. Change Tier');
  const r5 = await api('PATCH', `/admin/users/${targetUser.userId}/tier`, admin.token, {
    tier: 'verified_contributor',
    reason: 'Verified agent license',
  });
  assert(r5.status === 200, `PATCH /admin/users/:id/tier → 200 (got ${r5.status})`);
  assert(r5.data.data.permissionTier === 'verified_contributor', 'Tier changed to verified_contributor');

  // ─── 6. Change tier non-existent user ──────────────
  console.log('\n📋 6. Change Tier - Non-existent');
  const fakeUuid = 'a0000000-b000-4000-8000-c00000000099';
  const r6 = await api('PATCH', `/admin/users/${fakeUuid}/tier`, admin.token, {
    tier: 'trusted_member',
  });
  assert(r6.status === 404, `Non-existent user → 404 (got ${r6.status})`);

  // ─── 7. Verify user ───────────────────────────────
  console.log('\n📋 7. Verify User');
  // Reset target user to new_user first
  await setTier(targetUser.userId, 'new_user');
  const r7 = await api('PATCH', `/admin/users/${targetUser.userId}/verify`, admin.token);
  assert(r7.status === 200, `PATCH /admin/users/:id/verify → 200 (got ${r7.status})`);
  assert(r7.data.data.nationalIdVerified === true, 'nationalIdVerified set to true');

  // ─── 8. Verify auto-upgrades new_user ──────────────
  console.log('\n📋 8. Verify Auto-Upgrade');
  assert(r7.data.data.permissionTier === 'trusted_member', `new_user auto-upgraded to trusted_member (got ${r7.data.data.permissionTier})`);

  // ─── 9. Suspend user ──────────────────────────────
  console.log('\n📋 9. Suspend User');
  const r9 = await api('POST', `/admin/users/${targetUser.userId}/suspend`, admin.token, {
    reason: 'Repeated violation of community guidelines',
  });
  assert(r9.status === 201, `POST /admin/users/:id/suspend → 201 (got ${r9.status})`);
  assert(r9.data.data.permissionTier === 'restricted', 'Tier set to restricted');
  assert(r9.data.data.deletedAt !== null, 'deletedAt is set (soft-deleted)');

  // ─── 10. Suspend non-existent user ─────────────────
  console.log('\n📋 10. Suspend Non-existent');
  const r10 = await api('POST', `/admin/users/${fakeUuid}/suspend`, admin.token, {
    reason: 'Some reason for suspension',
  });
  assert(r10.status === 404, `Non-existent user → 404 (got ${r10.status})`);

  // ─── 11. Pending posts (empty initially) ────────────
  console.log('\n📋 11. Pending Posts (Empty)');
  const r11 = await api('GET', '/admin/posts/pending', admin.token);
  assert(r11.status === 200, `GET /admin/posts/pending → 200 (got ${r11.status})`);
  assert(Array.isArray(r11.data.data), 'Response has data array');

  // ─── 12. Create pending post then list ──────────────
  console.log('\n📋 12. Pending Posts (With Data)');
  const pendingPostId = await insertPendingPost(regularUser.userId);
  assert(pendingPostId, `Pending post created: ${pendingPostId}`);
  const r12 = await api('GET', '/admin/posts/pending', admin.token);
  assert(r12.status === 200, `GET /admin/posts/pending → 200 (got ${r12.status})`);
  const foundPending = r12.data.data.some(p => p.id === pendingPostId);
  assert(foundPending, 'Pending post found in queue');

  // ─── 13. Approve post ──────────────────────────────
  console.log('\n📋 13. Approve Post');
  const r13 = await api('PATCH', `/admin/posts/${pendingPostId}/approve`, admin.token);
  assert(r13.status === 200, `PATCH /admin/posts/:id/approve → 200 (got ${r13.status})`);
  assert(r13.data.data.approvalStatus === 'approved', 'Post approval status is approved');
  assert(r13.data.data.status === 'published', 'Post status is published');

  // ─── 14. Approve already approved → 400 ─────────────
  console.log('\n📋 14. Approve Already Approved');
  const r14 = await api('PATCH', `/admin/posts/${pendingPostId}/approve`, admin.token);
  assert(r14.status === 400, `Already approved → 400 (got ${r14.status})`);

  // ─── 15. Reject post ──────────────────────────────
  console.log('\n📋 15. Reject Post');
  const pendingPostId2 = await insertPendingPost(regularUser.userId);
  const r15 = await api('PATCH', `/admin/posts/${pendingPostId2}/reject`, admin.token, {
    reason: 'المحتوى لا يتوافق مع إرشادات المجتمع',
  });
  assert(r15.status === 200, `PATCH /admin/posts/:id/reject → 200 (got ${r15.status})`);
  assert(r15.data.data.approvalStatus === 'rejected', 'Post approval status is rejected');
  assert(r15.data.data.rejectionReason === 'المحتوى لا يتوافق مع إرشادات المجتمع', 'Rejection reason saved (Arabic)');

  // ─── 16. Reject without reason → 400 ───────────────
  console.log('\n📋 16. Reject Without Reason');
  const pendingPostId3 = await insertPendingPost(regularUser.userId);
  const r16 = await api('PATCH', `/admin/posts/${pendingPostId3}/reject`, admin.token, {});
  assert(r16.status === 400, `Reject without reason → 400 (got ${r16.status})`);

  // ─── 17. Flagged posts ─────────────────────────────
  console.log('\n📋 17. Flagged Posts');
  const flaggedPostId = await insertFlaggedPost(regularUser.userId);
  assert(flaggedPostId, `Flagged post created: ${flaggedPostId}`);
  const r17 = await api('GET', '/admin/posts/flagged', admin.token);
  assert(r17.status === 200, `GET /admin/posts/flagged → 200 (got ${r17.status})`);
  const foundFlagged = r17.data.data.some(p => p.id === flaggedPostId);
  assert(foundFlagged, 'Flagged post found in list');

  // ─── 18. Flagged comments ──────────────────────────
  console.log('\n📋 18. Flagged Comments');
  // Use the approved post as a parent for the comment
  await insertFlaggedComment(regularUser.userId, pendingPostId);
  const r18 = await api('GET', '/admin/comments/flagged', admin.token);
  assert(r18.status === 200, `GET /admin/comments/flagged → 200 (got ${r18.status})`);
  assert(Array.isArray(r18.data.data), 'Response has data array');

  // ─── 19. Reports (empty initially) ─────────────────
  console.log('\n📋 19. Reports (Empty)');
  const r19 = await api('GET', '/admin/reports', admin.token);
  assert(r19.status === 200, `GET /admin/reports → 200 (got ${r19.status})`);
  assert(Array.isArray(r19.data.data), 'Response has data array');

  // ─── 20. Create report then list ───────────────────
  console.log('\n📋 20. Reports (With Data)');
  const reportId = await insertReport(regularUser.userId, pendingPostId);
  assert(reportId, `Report created: ${reportId}`);
  const r20 = await api('GET', '/admin/reports', admin.token);
  assert(r20.status === 200, `GET /admin/reports → 200 (got ${r20.status})`);
  const foundReport = r20.data.data.some(r => r.id === reportId);
  assert(foundReport, 'Report found in list');

  // ─── 21. Filter reports by status ──────────────────
  console.log('\n📋 21. Filter Reports');
  const r21 = await api('GET', '/admin/reports?status=pending', admin.token);
  assert(r21.status === 200, `GET /admin/reports?status=pending → 200 (got ${r21.status})`);
  assert(r21.data.data.every(r => r.status === 'pending'), 'All returned reports are pending');

  // ─── 22. Review report ─────────────────────────────
  console.log('\n📋 22. Review Report');
  const r22 = await api('PATCH', `/admin/reports/${reportId}`, admin.token, {
    status: 'resolved',
    actionTaken: 'content_removed',
  });
  assert(r22.status === 200, `PATCH /admin/reports/:id → 200 (got ${r22.status})`);
  assert(r22.data.data.status === 'resolved', 'Report status is resolved');
  assert(r22.data.data.actionTaken === 'content_removed', 'Action taken is content_removed');
  assert(r22.data.data.reviewedBy === admin.userId, 'Reviewed by admin');
  assert(r22.data.data.reviewedAt !== null, 'reviewedAt is set');

  // ─── 23. Review non-existent report ────────────────
  console.log('\n📋 23. Review Non-existent Report');
  const r23 = await api('PATCH', `/admin/reports/${fakeUuid}`, admin.token, {
    status: 'resolved',
    actionTaken: 'none',
  });
  assert(r23.status === 404, `Non-existent report → 404 (got ${r23.status})`);

  // ─── 24. Groups ────────────────────────────────────
  console.log('\n📋 24. Groups');
  const slug = `test-group-${ts.slice(-6)}`;
  await insertGroup(admin.userId, slug);
  const r24 = await api('GET', '/admin/groups', admin.token);
  assert(r24.status === 200, `GET /admin/groups → 200 (got ${r24.status})`);
  assert(Array.isArray(r24.data.data), 'Response has data array');
  assert(r24.data.data.length >= 1, `At least 1 group returned (got ${r24.data.data.length})`);

  // ─── 25. Dashboard analytics ───────────────────────
  console.log('\n📋 25. Dashboard Analytics');
  const r25 = await api('GET', '/admin/analytics', admin.token);
  assert(r25.status === 200, `GET /admin/analytics → 200 (got ${r25.status})`);
  assert(r25.data.data.totalUsers >= 3, `totalUsers >= 3 (got ${r25.data.data.totalUsers})`);
  assert(typeof r25.data.data.activeUsers === 'number', 'activeUsers is number');
  assert(typeof r25.data.data.totalPosts === 'number', 'totalPosts is number');
  assert(typeof r25.data.data.totalComments === 'number', 'totalComments is number');
  assert(typeof r25.data.data.totalListings === 'number', 'totalListings is number');
  assert(typeof r25.data.data.totalGroups === 'number', 'totalGroups is number');
  assert(typeof r25.data.data.pendingPosts === 'number', 'pendingPosts is number');
  assert(typeof r25.data.data.pendingReports === 'number', 'pendingReports is number');
  assert(typeof r25.data.data.usersByTier === 'object', 'usersByTier is object');

  // ─── 26. Moderation stats ──────────────────────────
  console.log('\n📋 26. Moderation Stats');
  const r26 = await api('GET', '/admin/moderation/stats', admin.token);
  assert(r26.status === 200, `GET /admin/moderation/stats → 200 (got ${r26.status})`);
  assert(typeof r26.data.data.pendingPosts === 'number', 'pendingPosts is number');
  assert(typeof r26.data.data.flaggedPosts === 'number', 'flaggedPosts is number');
  assert(typeof r26.data.data.flaggedComments === 'number', 'flaggedComments is number');
  assert(typeof r26.data.data.pendingReports === 'number', 'pendingReports is number');
  assert(typeof r26.data.data.resolvedReports === 'number', 'resolvedReports is number');
  assert(typeof r26.data.data.totalReports === 'number', 'totalReports is number');
  assert(typeof r26.data.data.last24Hours === 'object', 'last24Hours is object');
  assert(typeof r26.data.data.last24Hours.approvedPosts === 'number', 'approvedPosts in last24h');
  assert(typeof r26.data.data.last24Hours.rejectedPosts === 'number', 'rejectedPosts in last24h');

  // ─── 27. Pagination cursor ─────────────────────────
  console.log('\n📋 27. Pagination');
  const r27 = await api('GET', '/admin/users?limit=1', admin.token);
  assert(r27.status === 200, `GET /admin/users?limit=1 → 200 (got ${r27.status})`);
  assert(r27.data.data.length === 1, 'Returned exactly 1 user');
  assert(r27.data.meta.hasMore === true, 'hasMore is true');
  assert(r27.data.meta.cursor, 'Cursor returned');

  const r27b = await api('GET', `/admin/users?limit=1&cursor=${r27.data.meta.cursor}`, admin.token);
  assert(r27b.status === 200, `GET /admin/users?cursor=... → 200 (got ${r27b.status})`);
  assert(r27b.data.data.length === 1, 'Returned 1 user on page 2');
  assert(r27b.data.data[0].id !== r27.data.data[0].id, 'Different user on page 2');

  // ─── 28. Unauthenticated → 401 ─────────────────────
  console.log('\n📋 28. Unauthenticated');
  const r28 = await api('GET', '/admin/users', null);
  assert(r28.status === 401, `Unauthenticated → 401 (got ${r28.status})`);

  const r28b = await api('GET', '/admin/analytics', null);
  assert(r28b.status === 401, `Unauthenticated analytics → 401 (got ${r28b.status})`);

  // ─── Summary ───────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
