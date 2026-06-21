/**
 * Moderation Module — E2E Tests
 *
 * Tests:
 *  1. POST /moderation/check → 200 clean text passes
 *  2. POST /moderation/check → 200 blocked word flagged (English)
 *  3. POST /moderation/check → 200 blocked word flagged (Arabic)
 *  4. POST /moderation/check → 200 spam pattern flagged (repeated chars)
 *  5. POST /moderation/check → 200 suspicious URL flagged
 *  6. POST /moderation/check → 200 multiple flags accumulate score
 *  7. POST /moderation/check → 200 auto_reject for high score
 *  8. POST /moderation/check → 200 empty text passes
 *  9. POST /moderation/posts/:id/moderate → 200 moderate a clean post
 * 10. POST /moderation/posts/:id/moderate → updates aiModerationFlags
 * 11. POST /moderation/posts/:id/moderate → flagged post with blocked word
 * 12. POST /moderation/posts/:id/moderate → auto-rejects severely violating post
 * 13. POST /moderation/comments/:id/moderate → 200 moderate a comment
 * 14. POST /moderation/comments/:id/moderate → flags bad comment
 * 15. GET /moderation/queue → 200 returns flagged posts
 * 16. GET /moderation/queue → pagination works
 * 17. GET /moderation/posts/:id → 200 moderation details
 * 18. PATCH /moderation/posts/:id/approve → 200 approve post
 * 19. PATCH /moderation/posts/:id/approve → already approved → 400
 * 20. PATCH /moderation/posts/:id/reject → 200 reject post
 * 21. PATCH /moderation/posts/:id/reject → already rejected → 400
 * 22. PATCH /moderation/posts/:id/reject → validation (empty reason) → 400
 * 23. GET /moderation/stats → 200 returns stats
 * 24. Non-admin cannot access moderation endpoints → 403
 * 25. Unauthenticated → 401
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

function extractUuid(output) {
  const match = output.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : null;
}

async function main() {
  console.log('\n🧪 Moderation Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const ts = Date.now().toString();
  const admin = await createUser(`+2010${ts.slice(-8)}`);
  assert(admin.token, 'Admin user created');
  await setTier(admin.userId, 'admin');

  const ts2 = (Date.now() + 1).toString();
  const author = await createUser(`+2010${ts2.slice(-8)}`);
  assert(author.token, 'Author (Tier 3) created');
  await setTier(author.userId, 'trusted_member');

  const ts3 = (Date.now() + 2).toString();
  const viewer = await createUser(`+2010${ts3.slice(-8)}`);
  assert(viewer.token, 'Viewer (Tier 4) created');

  // Create a clean post (as tier 2 to auto-publish)
  await setTier(author.userId, 'verified_contributor');
  const p1 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'شقة ٣ غرف في التجمع الخامس. موقع ممتاز وتشطيب فاخر',
  });
  assert(p1.status === 200 || p1.status === 201, `Clean post created → ${p1.status}`);
  const cleanPostId = p1.data?.data?.id;
  assert(!!cleanPostId, 'Clean post ID returned');

  // Create a post with blocked word
  const p2 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'هذا العرض ليس scam ولا fraud وهو حقيقي',
  });
  const blockedPostId = p2.data?.data?.id;
  assert(!!blockedPostId, 'Blocked-word post ID returned');

  // Create post with Arabic blocked word
  const p3 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'احذروا من عمليات نصب في المنطقة',
  });
  const arabicBlockedPostId = p3.data?.data?.id;
  assert(!!arabicBlockedPostId, 'Arabic blocked-word post ID returned');

  // Create a post with severe violations (for auto-reject test)
  const p4 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'This is a scam fraud illegal bomb terrorism operation',
  });
  const severePostId = p4.data?.data?.id;
  assert(!!severePostId, 'Severe violation post ID returned');

  // Create a comment
  const c1 = await api('POST', `/posts/${cleanPostId}/comments`, author.token, {
    content: 'تعليق عادي على المنشور',
  });
  assert(c1.status === 200 || c1.status === 201, `Clean comment created → ${c1.status}`);
  const cleanCommentId = c1.data?.data?.id;
  assert(!!cleanCommentId, 'Clean comment ID returned');

  // Create a comment with blocked word
  const c2 = await api('POST', `/posts/${cleanPostId}/comments`, author.token, {
    content: 'هذا احتيال واضح وعملية نصب',
  });
  const badCommentId = c2.data?.data?.id;
  assert(!!badCommentId, 'Bad comment ID returned');

  // ─── 1-8: Content Check Endpoint ──────────────────
  console.log('\n📋 Content Check (Direct)');

  // 1. Clean text passes
  const r1 = await api('POST', '/moderation/check', admin.token, {
    text: 'شقة للبيع في القاهرة الجديدة، ٣ غرف نوم',
  });
  assert(r1.status === 200 || r1.status === 201, `Clean text check → ${r1.status}`);
  assert(r1.data?.success === true, 'success: true');
  assert(r1.data?.data?.passed === true, 'Clean text passed');
  assert(r1.data?.data?.flags?.length === 0, 'No flags for clean text');
  assert(r1.data?.data?.totalScore === 0, 'Score = 0');
  assert(r1.data?.data?.autoAction === 'none', 'autoAction = none');

  // 2. Blocked word (English)
  const r2 = await api('POST', '/moderation/check', admin.token, {
    text: 'This is a total scam, do not trust this listing',
  });
  assert(r2.status === 200 || r2.status === 201, `Blocked word (EN) check → ${r2.status}`);
  assert(r2.data?.data?.passed === false, 'Blocked word flagged');
  assert(r2.data?.data?.flags?.length >= 1, 'At least 1 flag');
  assert(r2.data?.data?.flags?.some(f => f.type === 'blocked_word'), 'Flag type = blocked_word');
  assert(r2.data?.data?.totalScore > 0, `Score > 0 (got ${r2.data?.data?.totalScore})`);

  // 3. Blocked word (Arabic)
  const r3 = await api('POST', '/moderation/check', admin.token, {
    text: 'عمليات نصب واحتيال في المنطقة',
  });
  assert(r3.status === 200 || r3.status === 201, `Blocked word (AR) check → ${r3.status}`);
  assert(r3.data?.data?.passed === false, 'Arabic blocked word flagged');
  assert(r3.data?.data?.flags?.some(f => f.details?.includes('Arabic')), 'Arabic flag detail');

  // 4. Spam pattern (repeated chars)
  const r4 = await api('POST', '/moderation/check', admin.token, {
    text: 'عرض حصريييييييي جداً',
  });
  assert(r4.status === 200 || r4.status === 201, `Spam pattern check → ${r4.status}`);
  assert(r4.data?.data?.passed === false, 'Spam pattern flagged');
  assert(r4.data?.data?.flags?.some(f => f.type === 'spam_pattern'), 'Flag type = spam_pattern');

  // 5. Suspicious URL
  const r5 = await api('POST', '/moderation/check', admin.token, {
    text: 'شوفوا العرض هنا https://bit.ly/fake-listing',
  });
  assert(r5.status === 200 || r5.status === 201, `Suspicious URL check → ${r5.status}`);
  assert(r5.data?.data?.passed === false, 'Suspicious URL flagged');
  assert(r5.data?.data?.flags?.some(f => f.type === 'suspicious_url'), 'Flag type = suspicious_url');

  // 6. Multiple flags accumulate
  const r6 = await api('POST', '/moderation/check', admin.token, {
    text: 'This is a scam at https://bit.ly/fake with aaaaaaa spam',
  });
  assert(r6.status === 200 || r6.status === 201, `Multiple flags check → ${r6.status}`);
  assert(r6.data?.data?.flags?.length >= 2, `Multiple flags (got ${r6.data?.data?.flags?.length})`);
  assert(r6.data?.data?.totalScore > 25, `Accumulated score > 25 (got ${r6.data?.data?.totalScore})`);

  // 7. Auto-reject for high score
  const r7 = await api('POST', '/moderation/check', admin.token, {
    text: 'scam fraud illegal drugs weapon bomb',
  });
  assert(r7.status === 200 || r7.status === 201, `Auto-reject check → ${r7.status}`);
  assert(r7.data?.data?.autoAction === 'auto_reject', `autoAction = auto_reject (got ${r7.data?.data?.autoAction})`);
  assert(r7.data?.data?.totalScore >= 50, `Score >= 50 (got ${r7.data?.data?.totalScore})`);

  // 8. Empty text passes
  const r8 = await api('POST', '/moderation/check', admin.token, {
    text: '',
  });
  assert(r8.status === 200 || r8.status === 201, `Empty text check → ${r8.status}`);
  assert(r8.data?.data?.passed === true, 'Empty text passed');

  // ─── 9-12: Post Moderation ────────────────────────
  console.log('\n📋 Post Moderation');

  // 9. Moderate clean post
  const r9 = await api('POST', `/moderation/posts/${cleanPostId}/moderate`, admin.token);
  assert(r9.status === 200 || r9.status === 201, `Moderate clean post → ${r9.status}`);
  assert(r9.data?.success === true, 'success: true');
  assert(r9.data?.data?.passed === true, 'Clean post passes moderation');
  assert(r9.data?.data?.totalScore === 0, 'Score = 0 for clean post');
  assert(r9.data?.data?.stages?.rules?.passed === true, 'Rules stage passed');
  assert(r9.data?.data?.stages?.textAi?.passed === true, 'Text AI stage passed');
  assert(r9.data?.data?.stages?.mediaAi?.passed === true, 'Media AI stage passed');

  // 10. Moderation updates aiModerationFlags
  const r10 = await api('POST', `/moderation/posts/${blockedPostId}/moderate`, admin.token);
  assert(r10.status === 200 || r10.status === 201, `Moderate flagged post → ${r10.status}`);
  assert(r10.data?.data?.passed === false, 'Flagged post fails moderation');
  assert(r10.data?.data?.flags?.length >= 1, 'Flags populated');

  // 11. Verify flags were saved to DB
  const r11 = await api('GET', `/moderation/posts/${blockedPostId}`, admin.token);
  assert(r11.status === 200, `Get post moderation details → ${r11.status}`);
  assert(Array.isArray(r11.data?.data?.aiModerationFlags), 'aiModerationFlags is array');
  assert(r11.data?.data?.aiModerationFlags?.length >= 1, 'Flags saved to post');
  assert(typeof r11.data?.data?.aiQualityScore === 'number', 'aiQualityScore is number');

  // 12. Severe violation auto-rejects
  const r12 = await api('POST', `/moderation/posts/${severePostId}/moderate`, admin.token);
  assert(r12.status === 200 || r12.status === 201, `Moderate severe post → ${r12.status}`);
  assert(r12.data?.data?.autoAction === 'auto_reject', 'Severe post auto-rejected');

  // Verify post status changed
  const r12b = await api('GET', `/moderation/posts/${severePostId}`, admin.token);
  assert(r12b.data?.data?.approvalStatus === 'rejected', 'Post approval status = rejected');
  assert(r12b.data?.data?.status === 'rejected', 'Post status = rejected');
  assert(r12b.data?.data?.rejectionReason?.includes('Auto-rejected'), 'Rejection reason present');

  // ─── 13-14: Comment Moderation ────────────────────
  console.log('\n📋 Comment Moderation');

  // 13. Moderate clean comment
  const r13 = await api('POST', `/moderation/comments/${cleanCommentId}/moderate`, admin.token);
  assert(r13.status === 200 || r13.status === 201, `Moderate clean comment → ${r13.status}`);
  assert(r13.data?.data?.passed === true, 'Clean comment passes moderation');

  // 14. Moderate bad comment
  const r14 = await api('POST', `/moderation/comments/${badCommentId}/moderate`, admin.token);
  assert(r14.status === 200 || r14.status === 201, `Moderate bad comment → ${r14.status}`);
  assert(r14.data?.data?.passed === false, 'Bad comment fails moderation');
  assert(r14.data?.data?.flags?.length >= 1, 'Flags on bad comment');

  // ─── 15-16: Moderation Queue ──────────────────────
  console.log('\n📋 Moderation Queue');

  // 15. Get queue (should have flagged posts)
  const r15 = await api('GET', '/moderation/queue', admin.token);
  assert(r15.status === 200, `Get queue → ${r15.status}`);
  assert(r15.data?.success === true, 'success: true');
  assert(Array.isArray(r15.data?.data), 'Queue is array');
  // Note: queue only shows pending posts with flags; auto-rejected are excluded
  assert(r15.data?.meta?.hasMore !== undefined, 'meta.hasMore present');

  // 16. Queue pagination
  const r16 = await api('GET', '/moderation/queue?limit=1', admin.token);
  assert(r16.status === 200, `Queue pagination → ${r16.status}`);
  assert(r16.data?.meta?.cursor !== undefined, 'Pagination cursor present');

  // ─── 17: Post Details ─────────────────────────────
  console.log('\n📋 Post Moderation Details');

  const r17 = await api('GET', `/moderation/posts/${cleanPostId}`, admin.token);
  assert(r17.status === 200, `Post details → ${r17.status}`);
  assert(r17.data?.success === true, 'success: true');
  assert(r17.data?.data?.id === cleanPostId, 'Correct post ID');
  assert(r17.data?.data?.author?.id === author.userId, 'Author matches');
  assert(typeof r17.data?.data?.aiQualityScore === 'number', 'aiQualityScore present');

  // ─── 18-19: Approve ───────────────────────────────
  console.log('\n📋 Approve / Reject');

  // Need a pending post to approve. Set author back to tier 3 for pending status.
  await setTier(author.userId, 'trusted_member');
  const pApprove = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'منشور جيد ينتظر الموافقة',
  });
  const pendingPostId = pApprove.data?.data?.id;
  assert(!!pendingPostId, 'Pending post created');

  // 18. Approve post
  const r18 = await api('PATCH', `/moderation/posts/${pendingPostId}/approve`, admin.token);
  assert(r18.status === 200, `Approve post → ${r18.status}`);
  assert(r18.data?.success === true, 'success: true');
  assert(r18.data?.data?.status === 'published', 'Status = published');
  assert(r18.data?.data?.approvalStatus === 'approved', 'Approval = approved');

  // 19. Already approved → 400
  const r19 = await api('PATCH', `/moderation/posts/${pendingPostId}/approve`, admin.token);
  assert(r19.status === 400, `Already approved → ${r19.status} (expect 400)`);

  // Create another pending post to reject
  const pReject = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'منشور سيتم رفضه',
  });
  const rejectPostId = pReject.data?.data?.id;
  assert(!!rejectPostId, 'Reject target post created');

  // 20. Reject post
  const r20 = await api('PATCH', `/moderation/posts/${rejectPostId}/reject`, admin.token, {
    reason: 'Does not meet community guidelines',
  });
  assert(r20.status === 200, `Reject post → ${r20.status}`);
  assert(r20.data?.success === true, 'success: true');
  assert(r20.data?.data?.status === 'rejected', 'Status = rejected');
  assert(r20.data?.data?.approvalStatus === 'rejected', 'Approval = rejected');
  assert(r20.data?.data?.rejectionReason === 'Does not meet community guidelines', 'Rejection reason matches');

  // 21. Already rejected → 400
  const r21 = await api('PATCH', `/moderation/posts/${rejectPostId}/reject`, admin.token, {
    reason: 'Try again',
  });
  assert(r21.status === 400, `Already rejected → ${r21.status} (expect 400)`);

  // 22. Reject with empty reason → 400
  const pReject2 = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'منشور آخر',
  });
  const rejectPostId2 = pReject2.data?.data?.id;
  const r22 = await api('PATCH', `/moderation/posts/${rejectPostId2}/reject`, admin.token, {
    reason: '',
  });
  assert(r22.status === 400, `Empty reason → ${r22.status} (expect 400)`);

  // ─── 23: Stats ────────────────────────────────────
  console.log('\n📋 Moderation Stats');

  const r23 = await api('GET', '/moderation/stats', admin.token);
  assert(r23.status === 200, `Stats → ${r23.status}`);
  assert(r23.data?.success === true, 'success: true');
  assert(typeof r23.data?.data?.pendingPosts === 'number', 'pendingPosts is number');
  assert(typeof r23.data?.data?.flaggedPosts === 'number', 'flaggedPosts is number');
  assert(typeof r23.data?.data?.approvedToday === 'number', 'approvedToday is number');
  assert(typeof r23.data?.data?.rejectedToday === 'number', 'rejectedToday is number');
  assert(typeof r23.data?.data?.totalReviewed === 'number', 'totalReviewed is number');

  // ─── 24: Non-admin → 403 ─────────────────────────
  console.log('\n📋 Authorization');

  const r24a = await api('POST', '/moderation/check', author.token, { text: 'test' });
  assert(r24a.status === 403, `Non-admin check → ${r24a.status} (expect 403)`);

  const r24b = await api('GET', '/moderation/queue', author.token);
  assert(r24b.status === 403, `Non-admin queue → ${r24b.status} (expect 403)`);

  const r24c = await api('GET', '/moderation/stats', author.token);
  assert(r24c.status === 403, `Non-admin stats → ${r24c.status} (expect 403)`);

  const r24d = await api('PATCH', `/moderation/posts/${cleanPostId}/approve`, author.token);
  assert(r24d.status === 403, `Non-admin approve → ${r24d.status} (expect 403)`);

  const r24e = await api('POST', `/moderation/posts/${cleanPostId}/moderate`, viewer.token);
  assert(r24e.status === 403, `Tier 4 moderate → ${r24e.status} (expect 403)`);

  // ─── 25: Unauthenticated → 401 ───────────────────
  const r25a = await api('POST', '/moderation/check', null, { text: 'test' });
  assert(r25a.status === 401, `Unauth check → ${r25a.status} (expect 401)`);

  const r25b = await api('GET', '/moderation/queue', null);
  assert(r25b.status === 401, `Unauth queue → ${r25b.status} (expect 401)`);

  const r25c = await api('GET', '/moderation/stats', null);
  assert(r25c.status === 401, `Unauth stats → ${r25c.status} (expect 401)`);

  // ─── Results ──────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log(`  Moderation E2E: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
