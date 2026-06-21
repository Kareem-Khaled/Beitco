/**
 * Likes Module — E2E Tests
 *
 * Tests:
 *  1. Like a post (toggle on) → 200, liked: true
 *  2. Unlike a post (toggle off) → 200, liked: false
 *  3. Re-like a post → liked: true
 *  4. Like updates post.likeCount
 *  5. Like non-existent post → 404
 *  6. Like a comment → 200, liked: true
 *  7. Unlike a comment → 200, liked: false
 *  8. Like updates comment.likeCount
 *  9. Like non-existent comment → 404
 * 10. Multiple users like same post
 * 11. Unauthenticated like → 401
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
  console.log('\n🧪 Likes Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const userA = await createUser('+201000000050');
  assert(!!userA.token, 'User A created');

  const userB = await createUser('+201000000051');
  assert(!!userB.token, 'User B created');

  // Make user A verified so posts auto-publish
  await setTier(userA.userId, 'verified_contributor');
  await setTier(userB.userId, 'trusted_member');

  // Create a post
  const postRes = await api('POST', '/posts', userA.token, {
    postType: 'text',
    contentText: 'منشور للإعجاب',
  });
  const postId = postRes.data?.data?.id;
  assert(!!postId, 'Post created');

  // Create a comment
  const commentRes = await api('POST', `/posts/${postId}/comments`, userB.token, {
    content: 'تعليق للإعجاب',
  });
  const commentId = commentRes.data?.data?.id;
  assert(!!commentId, 'Comment created');

  // ─── 1. Like a post → liked: true ─────────────────
  console.log('\n📋 Post likes');
  const l1 = await api('POST', `/posts/${postId}/like`, userA.token);
  assert(l1.status === 200, `Like post → ${l1.status} (expect 200)`);
  assert(l1.data?.data?.liked === true, 'liked: true');
  assert(l1.data?.data?.likeCount === 1, `likeCount = ${l1.data?.data?.likeCount} (expect 1)`);

  // ─── 2. Unlike a post → liked: false ──────────────
  const l2 = await api('POST', `/posts/${postId}/like`, userA.token);
  assert(l2.status === 200, `Unlike post → ${l2.status} (expect 200)`);
  assert(l2.data?.data?.liked === false, 'liked: false');
  assert(l2.data?.data?.likeCount === 0, `likeCount = ${l2.data?.data?.likeCount} (expect 0)`);

  // ─── 3. Re-like ───────────────────────────────────
  const l3 = await api('POST', `/posts/${postId}/like`, userA.token);
  assert(l3.data?.data?.liked === true, 'Re-like: liked: true');

  // ─── 4. Verify post.likeCount via GET ─────────────
  const postGet = await api('GET', `/posts/${postId}`, null);
  assert(postGet.data?.data?.likeCount === 1, `Post GET likeCount = ${postGet.data?.data?.likeCount} (expect 1)`);

  // ─── 5. Like non-existent post → 404 ──────────────
  const fakeId = 'a0000000-b000-4000-8000-c00000000099';
  const l4 = await api('POST', `/posts/${fakeId}/like`, userA.token);
  assert(l4.status === 404, `Like non-existent post → ${l4.status} (expect 404)`);

  // ─── 6. Like a comment → liked: true ──────────────
  console.log('\n📋 Comment likes');
  const cl1 = await api('POST', `/comments/${commentId}/like`, userA.token);
  assert(cl1.status === 200, `Like comment → ${cl1.status} (expect 200)`);
  assert(cl1.data?.data?.liked === true, 'liked: true');
  assert(cl1.data?.data?.likeCount === 1, `likeCount = ${cl1.data?.data?.likeCount} (expect 1)`);

  // ─── 7. Unlike a comment → liked: false ───────────
  const cl2 = await api('POST', `/comments/${commentId}/like`, userA.token);
  assert(cl2.status === 200, `Unlike comment → ${cl2.status} (expect 200)`);
  assert(cl2.data?.data?.liked === false, 'liked: false');
  assert(cl2.data?.data?.likeCount === 0, `likeCount = ${cl2.data?.data?.likeCount} (expect 0)`);

  // ─── 8. Like updates comment likeCount ─────────────
  // Re-like
  await api('POST', `/comments/${commentId}/like`, userA.token);
  const commentList = await api('GET', `/posts/${postId}/comments`, null);
  // The comment is a top-level, look for it in replies or data
  const topComments = commentList.data?.data || [];
  const targetComment = topComments.find(c => c.id === commentId);
  assert(targetComment?.likeCount === 1, `Comment likeCount via list = ${targetComment?.likeCount} (expect 1)`);

  // ─── 9. Like non-existent comment → 404 ───────────
  const cl3 = await api('POST', `/comments/${fakeId}/like`, userA.token);
  assert(cl3.status === 404, `Like non-existent comment → ${cl3.status} (expect 404)`);

  // ─── 10. Multiple users like same post ─────────────
  console.log('\n📋 Multiple users');
  const l5 = await api('POST', `/posts/${postId}/like`, userB.token);
  assert(l5.data?.data?.liked === true, 'User B liked post');
  assert(l5.data?.data?.likeCount === 2, `likeCount = ${l5.data?.data?.likeCount} (expect 2: A + B)`);

  // ─── 11. Unauthenticated like → 401 ───────────────
  console.log('\n📋 Auth check');
  const l6 = await api('POST', `/posts/${postId}/like`, null);
  assert(l6.status === 401, `Unauthenticated like → ${l6.status} (expect 401)`);

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
