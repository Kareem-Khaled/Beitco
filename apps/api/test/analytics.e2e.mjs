/**
 * Analytics Module — E2E Tests
 *
 * Tests:
 *  1. POST /analytics/events → 201 track event (authenticated)
 *  2. Track event with full metadata → 201
 *  3. Track event validation (bad eventType) → 400
 *  4. Unauthenticated cannot track → 401
 *  5. GET /analytics/events/:type → 200 admin can query event counts
 *  6. Non-admin cannot query event counts → 403
 *  7. GET /analytics/posts/:id → 200 author gets post analytics
 *  8. Post analytics has correct shape (views, likes, engagementRate, etc.)
 *  9. Non-author cannot get post analytics → 404
 * 10. GET /analytics/users/me → 200 user analytics
 * 11. User analytics has correct shape (followers, content, listings)
 * 12. GET /analytics/listings/:id → 200 agent gets listing analytics
 * 13. Listing analytics has correct shape (views, saves, conversionRate)
 * 14. Non-agent cannot get listing analytics → 404
 * 15. GET /analytics/platform → 200 public (no auth)
 * 16. Platform stats has correct shape (totalUsers, totalPosts, etc.)
 * 17. Multiple event tracking increments correctly
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
  console.log('\n🧪 Analytics Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const ts = Date.now().toString();
  const admin = await createUser(`+2010${ts.slice(-8)}`);
  assert(!!admin.token, 'Admin user created');
  await setTier(admin.userId, 'admin');

  const ts2 = (Date.now() + 1).toString();
  const author = await createUser(`+2010${ts2.slice(-8)}`);
  assert(!!author.token, 'Author (Tier 2) created');
  await setTier(author.userId, 'verified_contributor');

  const ts3 = (Date.now() + 2).toString();
  const viewer = await createUser(`+2010${ts3.slice(-8)}`);
  assert(!!viewer.token, 'Viewer (Tier 3) created');
  await setTier(viewer.userId, 'trusted_member');

  // Create a post for analytics testing (author = Tier 2 → auto-published)
  const postRes = await api('POST', '/posts', author.token, {
    postType: 'text',
    contentText: 'تحليلات منشور اختبار #analytics',
  });
  assert(postRes.status === 200 || postRes.status === 201, `Post created → ${postRes.status}`);
  const postId = postRes.data?.data?.id;
  assert(!!postId, 'Post ID returned');

  // Create a listing for analytics testing (author = Tier 2)
  const listRes = await api('POST', '/listings', author.token, {
    titleAr: 'شقة للتحليلات',
    titleEn: 'Analytics Test Apt',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 1500000,
    area: 120,
    bedrooms: 2,
    bathrooms: 1,
    city: 'القاهرة',
  });
  assert(listRes.status === 201, `Listing created → ${listRes.status}`);
  const listingId = listRes.data?.data?.id;
  assert(!!listingId, 'Listing ID returned');

  // ─── 1. Track event (authenticated) → 201 ─────────
  console.log('\n📋 Event Tracking');
  const e1 = await api('POST', '/analytics/events', author.token, {
    eventType: 'post_view',
    targetId: postId,
    targetType: 'post',
  });
  assert(e1.status === 201, `Track event → ${e1.status} (expect 201)`);
  assert(e1.data?.success === true, 'success: true');
  assert(e1.data?.data?.tracked === true, 'tracked: true');

  // ─── 2. Track event with full metadata → 201 ──────
  const e2 = await api('POST', '/analytics/events', author.token, {
    eventType: 'listing_view',
    targetId: listingId,
    targetType: 'listing',
    metadata: '{"source": "search", "position": 3}',
  });
  assert(e2.status === 201, `Track with metadata → ${e2.status} (expect 201)`);
  assert(e2.data?.data?.tracked === true, 'tracked: true with metadata');

  // ─── 3. Bad event type → 400 ──────────────────────
  const e3 = await api('POST', '/analytics/events', author.token, {
    eventType: 'invalid_type',
  });
  assert(e3.status === 400, `Bad event type → ${e3.status} (expect 400)`);

  // ─── 4. Unauthenticated → 401 ─────────────────────
  const e4 = await api('POST', '/analytics/events', null, {
    eventType: 'app_open',
  });
  assert(e4.status === 401, `Unauth track → ${e4.status} (expect 401)`);

  // ─── 5. Admin gets event counts → 200 ─────────────
  console.log('\n📋 Event Counts (Admin)');
  const ec1 = await api('GET', '/analytics/events/post_view?period=day', admin.token);
  assert(ec1.status === 200, `Admin event counts → ${ec1.status} (expect 200)`);
  assert(ec1.data?.success === true, 'success: true');
  assert(ec1.data?.data?.eventType === 'post_view', 'eventType = post_view');
  assert(typeof ec1.data?.data?.total === 'number', 'total is number');
  assert(ec1.data?.data?.total >= 1, `total >= 1 (got ${ec1.data?.data?.total})`);

  // ─── 6. Non-admin cannot query event counts → 403 ─
  const ec2 = await api('GET', '/analytics/events/post_view?period=day', author.token);
  assert(ec2.status === 403, `Non-admin event counts → ${ec2.status} (expect 403)`);

  // ─── 7. Post analytics (author) → 200 ─────────────
  console.log('\n📋 Post Analytics');
  const pa1 = await api('GET', `/analytics/posts/${postId}`, author.token);
  assert(pa1.status === 200, `Post analytics → ${pa1.status} (expect 200)`);
  assert(pa1.data?.success === true, 'success: true');

  // ─── 8. Post analytics shape ──────────────────────
  const paData = pa1.data?.data;
  assert(paData?.postId === postId, `postId matches`);
  assert(typeof paData?.views === 'number', 'views is number');
  assert(typeof paData?.likes === 'number', 'likes is number');
  assert(typeof paData?.comments === 'number', 'comments is number');
  assert(typeof paData?.shares === 'number', 'shares is number');
  assert(typeof paData?.engagementRate === 'number', 'engagementRate is number');
  assert(typeof paData?.viewsPerDay === 'number', 'viewsPerDay is number');
  assert(!!paData?.createdAt, 'createdAt present');
  assert(paData?.postType === 'text', 'postType = text');

  // ─── 9. Non-author cannot see post analytics → 404 ─
  const pa2 = await api('GET', `/analytics/posts/${postId}`, viewer.token);
  assert(pa2.status === 404, `Non-author post analytics → ${pa2.status} (expect 404)`);

  // ─── 10. User analytics → 200 ─────────────────────
  console.log('\n📋 User Analytics');
  const ua1 = await api('GET', '/analytics/users/me', author.token);
  assert(ua1.status === 200, `User analytics → ${ua1.status} (expect 200)`);
  assert(ua1.data?.success === true, 'success: true');

  // ─── 11. User analytics shape ─────────────────────
  const uaData = ua1.data?.data;
  assert(uaData?.userId === author.userId, 'userId matches');
  assert(typeof uaData?.followers === 'number', 'followers is number');
  assert(typeof uaData?.following === 'number', 'following is number');
  assert(typeof uaData?.totalPosts === 'number', 'totalPosts is number');
  assert(typeof uaData?.content?.totalViews === 'number', 'content.totalViews is number');
  assert(typeof uaData?.content?.totalLikes === 'number', 'content.totalLikes is number');
  assert(typeof uaData?.content?.totalComments === 'number', 'content.totalComments is number');
  assert(typeof uaData?.content?.totalShares === 'number', 'content.totalShares is number');
  assert(typeof uaData?.content?.engagementRate === 'number', 'content.engagementRate is number');
  assert(Array.isArray(uaData?.topPosts), 'topPosts is array');
  assert(typeof uaData?.listings?.count === 'number', 'listings.count is number');
  assert(typeof uaData?.listings?.totalViews === 'number', 'listings.totalViews is number');
  assert(typeof uaData?.listings?.totalSaves === 'number', 'listings.totalSaves is number');
  assert(typeof uaData?.listings?.totalInquiries === 'number', 'listings.totalInquiries is number');
  assert(!!uaData?.memberSince, 'memberSince present');

  // ─── 12. Listing analytics (agent) → 200 ──────────
  console.log('\n📋 Listing Analytics');
  const la1 = await api('GET', `/analytics/listings/${listingId}`, author.token);
  assert(la1.status === 200, `Listing analytics → ${la1.status} (expect 200)`);
  assert(la1.data?.success === true, 'success: true');

  // ─── 13. Listing analytics shape ──────────────────
  const laData = la1.data?.data;
  assert(laData?.listingId === listingId, 'listingId matches');
  assert(typeof laData?.views === 'number', 'views is number');
  assert(typeof laData?.saves === 'number', 'saves is number');
  assert(typeof laData?.inquiries === 'number', 'inquiries is number');
  assert(typeof laData?.viewsPerDay === 'number', 'viewsPerDay is number');
  assert(typeof laData?.conversionRate === 'number', 'conversionRate is number');
  assert(!!laData?.title, 'title present');
  assert(!!laData?.listingType, 'listingType present');
  assert(!!laData?.propertyType, 'propertyType present');
  assert(!!laData?.createdAt, 'createdAt present');

  // ─── 14. Non-agent cannot see listing analytics → 404 ─
  const la2 = await api('GET', `/analytics/listings/${listingId}`, viewer.token);
  assert(la2.status === 404, `Non-agent listing analytics → ${la2.status} (expect 404)`);

  // ─── 15. Platform stats (public, no auth) → 200 ───
  console.log('\n📋 Platform Stats');
  const ps1 = await api('GET', '/analytics/platform', null);
  assert(ps1.status === 200, `Platform stats → ${ps1.status} (expect 200)`);
  assert(ps1.data?.success === true, 'success: true');

  // ─── 16. Platform stats shape ─────────────────────
  const psData = ps1.data?.data;
  assert(typeof psData?.totalUsers === 'number', 'totalUsers is number');
  assert(typeof psData?.totalPosts === 'number', 'totalPosts is number');
  assert(typeof psData?.totalListings === 'number', 'totalListings is number');
  assert(typeof psData?.totalGroups === 'number', 'totalGroups is number');
  assert(psData?.totalUsers >= 3, `totalUsers >= 3 (got ${psData?.totalUsers})`);

  // ─── 17. Multiple event tracking increments ────────
  console.log('\n📋 Multiple Events');
  // Track 3 more post_view events
  await api('POST', '/analytics/events', author.token, { eventType: 'post_view', targetId: postId, targetType: 'post' });
  await api('POST', '/analytics/events', author.token, { eventType: 'post_view', targetId: postId, targetType: 'post' });
  await api('POST', '/analytics/events', viewer.token, { eventType: 'post_view', targetId: postId, targetType: 'post' });

  const ec3 = await api('GET', '/analytics/events/post_view?period=day', admin.token);
  assert(ec3.status === 200, 'Admin event counts after multiple → 200');
  assert(ec3.data?.data?.total >= 4, `total >= 4 after 3 more events (got ${ec3.data?.data?.total})`);

  // ─── SUMMARY ───────────────────────────────────────
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Analytics E2E: ${passed} passed, ${failed} failed`);
  console.log(`${'═'.repeat(50)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
