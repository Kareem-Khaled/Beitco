/**
 * Feed Module — E2E Tests
 *
 * Tests:
 *  1. GET /feed (For You) → 200, returns published posts
 *  2. For You excludes own posts
 *  3. For You excludes blocked users' posts
 *  4. GET /feed/following → 200, only posts from followed users
 *  5. Following feed empty when not following anyone
 *  6. GET /feed/videos → 200, only video posts
 *  7. GET /feed/trending → 200 (public), has hashtags + posts
 *  8. Pagination works on For You feed
 *  9. Unauthenticated feed → 401
 * 10. Trending is public (no auth needed)
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
  console.log('\n🧪 Feed Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const viewer = await createUser('+201000000060');
  assert(!!viewer.token, 'Viewer created');

  const poster1 = await createUser('+201000000061');
  assert(!!poster1.token, 'Poster 1 created');

  const poster2 = await createUser('+201000000062');
  assert(!!poster2.token, 'Poster 2 created');

  const blockedPoster = await createUser('+201000000063');
  assert(!!blockedPoster.token, 'Blocked poster created');

  // Make all posters verified so posts auto-publish
  await setTier(poster1.userId, 'verified_contributor');
  await setTier(poster2.userId, 'verified_contributor');
  await setTier(blockedPoster.userId, 'verified_contributor');

  // Create posts
  const p1 = await api('POST', '/posts', poster1.token, {
    postType: 'text',
    contentText: 'منشور من المستخدم الأول #عقارات',
    hashtags: ['عقارات'],
  });
  assert(p1.status === 201, 'Post 1 created');

  const p2 = await api('POST', '/posts', poster2.token, {
    postType: 'text',
    contentText: 'منشور من المستخدم الثاني #مصر',
    hashtags: ['مصر'],
  });
  assert(p2.status === 201, 'Post 2 created');

  const p3 = await api('POST', '/posts', blockedPoster.token, {
    postType: 'text',
    contentText: 'منشور من المحظور',
  });
  assert(p3.status === 201, 'Post 3 (blocked user) created');

  // Viewer follows poster1
  await api('POST', `/follows/${poster1.userId}`, viewer.token);

  // Viewer blocks blockedPoster
  await api('POST', `/blocks/${blockedPoster.userId}`, viewer.token);

  // ─── 1. GET /feed → 200, returns posts ────────────
  console.log('\n📋 For You feed');
  const fy1 = await api('GET', '/feed', viewer.token);
  assert(fy1.status === 200, `For You → ${fy1.status} (expect 200)`);
  assert(fy1.data?.success === true, 'success: true');
  assert(Array.isArray(fy1.data?.data), 'data is array');
  assert(fy1.data?.meta !== undefined, 'meta present');

  // ─── 2. For You excludes own posts ────────────────
  // Viewer has no posts, so check all returned posts are by others
  const fyAuthorIds = (fy1.data?.data || []).map(p => p.author?.id);
  assert(!fyAuthorIds.includes(viewer.userId), 'For You excludes own posts');

  // ─── 3. For You excludes blocked users ─────────────
  assert(!fyAuthorIds.includes(blockedPoster.userId), 'For You excludes blocked user posts');

  // ─── 4. GET /feed/following → only followed users' posts
  console.log('\n📋 Following feed');
  const ff1 = await api('GET', '/feed/following', viewer.token);
  assert(ff1.status === 200, `Following → ${ff1.status} (expect 200)`);
  const ffData = ff1.data?.data || [];
  assert(ffData.length >= 1, `Following feed has ${ffData.length} posts (expect ≥1)`);
  const ffAuthorIds = ffData.map(p => p.author?.id);
  const allFromFollowed = ffAuthorIds.every(id => id === poster1.userId);
  assert(allFromFollowed, 'All following feed posts from followed users');
  assert(ffData[0]?.feedSource === 'following', 'feedSource = following');

  // ─── 5. Following empty when not following anyone ──
  const ff2 = await api('GET', '/feed/following', poster2.token);
  assert(ff2.data?.data?.length === 0, `Empty following feed = ${ff2.data?.data?.length} (expect 0)`);

  // ─── 6. GET /feed/videos → only video posts ───────
  console.log('\n📋 Videos feed');
  // Create a video post
  await api('POST', '/posts', poster1.token, {
    postType: 'video',
    contentText: 'فيديو اختبار',
  });

  const vf1 = await api('GET', '/feed/videos', viewer.token);
  assert(vf1.status === 200, `Videos → ${vf1.status} (expect 200)`);
  const vfData = vf1.data?.data || [];
  const allVideo = vfData.every(p => p.postType === 'video');
  assert(allVideo, `All video feed posts are video type (${vfData.length} posts)`);
  if (vfData.length > 0) {
    assert(vfData[0]?.feedSource === 'videos', 'feedSource = videos');
  }

  // ─── 7. GET /feed/trending → 200 ──────────────────
  console.log('\n📋 Trending');
  const tr1 = await api('GET', '/feed/trending', null);
  assert(tr1.status === 200, `Trending → ${tr1.status} (expect 200)`);
  assert(tr1.data?.success === true, 'success: true');
  assert(tr1.data?.data?.hashtags !== undefined, 'hashtags present');
  assert(Array.isArray(tr1.data?.data?.posts), 'posts is array');

  // ─── 8. Pagination ────────────────────────────────
  console.log('\n📋 Pagination');
  // Create more posts for pagination
  for (let i = 0; i < 3; i++) {
    await api('POST', '/posts', poster2.token, {
      postType: 'text',
      contentText: `منشور للترقيم ${i}`,
    });
  }

  const page1 = await api('GET', '/feed?limit=2', viewer.token);
  assert(page1.status === 200, 'Page 1 → 200');
  assert(page1.data?.data?.length === 2, `Page 1 has ${page1.data?.data?.length} items (expect 2)`);
  assert(page1.data?.meta?.hasMore === true, 'hasMore: true');

  const cursor = page1.data?.meta?.cursor;
  const page2 = await api('GET', `/feed?limit=2&cursor=${cursor}`, viewer.token);
  assert(page2.status === 200, 'Page 2 → 200');
  assert(page2.data?.data?.length >= 1, `Page 2 has ${page2.data?.data?.length} items (expect ≥1)`);

  // ─── 9. Unauthenticated feed → 401 ────────────────
  console.log('\n📋 Auth check');
  const noAuth = await api('GET', '/feed', null);
  assert(noAuth.status === 401, `Unauthenticated feed → ${noAuth.status} (expect 401)`);

  // ─── 10. Trending is public ────────────────────────
  // Already tested above (tr1) with no token
  assert(tr1.status === 200, 'Trending is publicly accessible');

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
