/**
 * Comments Module — E2E Tests
 *
 * Tests:
 *  1. Create comment on a post → 201
 *  2. Create reply to a comment → 201
 *  3. List comments (threaded, includes replies) → 200
 *  4. Edit comment (within 15 min) → 200
 *  5. Edit by non-author → 403
 *  6. Delete comment (author) → 204
 *  7. Delete decrements post commentCount
 *  8. Post author can delete others' comments → 204
 *  9. Pin comment (post author) → 200
 * 10. Pin by non-post-author → 403
 * 11. Comment on non-existent post → 404
 * 12. Reply to non-existent parent → 404
 * 13. Tier 4 user cannot comment → 403
 * 14. Cursor pagination works
 * 15. Deleted comment not listed
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
  console.log('\n🧪 Comments Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const postAuthor = await createUser('+201000000040');
  assert(!!postAuthor.token, 'Post author created');

  const commenter = await createUser('+201000000041');
  assert(!!commenter.token, 'Commenter created');

  const newUser = await createUser('+201000000042');
  assert(!!newUser.token, 'New user created (for tier test)');

  // Give post author and commenter tier 3 (trusted_member)
  await setTier(postAuthor.userId, 'trusted_member');
  await setTier(commenter.userId, 'trusted_member');

  // Make post author tier 2 so post auto-publishes
  await setTier(postAuthor.userId, 'verified_contributor');

  // Create a post
  const postRes = await api('POST', '/posts', postAuthor.token, {
    postType: 'text',
    contentText: 'منشور للتعليقات',
  });
  assert(postRes.status === 201, `Post created → ${postRes.status}`);
  const postId = postRes.data?.data?.id;
  assert(!!postId, 'Post ID exists');

  // ─── 1. Create comment → 201 ──────────────────────
  console.log('\n📋 Create comment');
  const c1 = await api('POST', `/posts/${postId}/comments`, commenter.token, {
    content: 'تعليق أول رائع!',
  });
  assert(c1.status === 201, `Create comment → ${c1.status} (expect 201)`);
  assert(c1.data?.success === true, 'success: true');
  const comment1Id = c1.data?.data?.id;
  assert(!!comment1Id, 'Comment ID returned');
  assert(c1.data?.data?.content === 'تعليق أول رائع!', 'Content matches');
  assert(c1.data?.data?.postId === postId, 'postId matches');
  assert(c1.data?.data?.parentCommentId === null, 'parentCommentId is null (top-level)');

  // ─── 2. Create reply → 201 ────────────────────────
  console.log('\n📋 Create reply');
  const c2 = await api('POST', `/posts/${postId}/comments`, commenter.token, {
    content: 'رد على التعليق',
    parentCommentId: comment1Id,
  });
  assert(c2.status === 201, `Create reply → ${c2.status} (expect 201)`);
  const replyId = c2.data?.data?.id;
  assert(c2.data?.data?.parentCommentId === comment1Id, 'parentCommentId matches');

  // Verify post commentCount
  const postCheck = await api('GET', `/posts/${postId}`, postAuthor.token);
  assert(postCheck.data?.data?.commentCount === 2, `Post commentCount = ${postCheck.data?.data?.commentCount} (expect 2)`);

  // ─── 3. List comments (threaded) → 200 ────────────
  console.log('\n📋 List comments');
  const list1 = await api('GET', `/posts/${postId}/comments`, null);
  assert(list1.status === 200, `List comments → ${list1.status} (expect 200)`);
  assert(list1.data?.success === true, 'success: true');
  const topLevel = list1.data?.data;
  assert(Array.isArray(topLevel), 'data is array');
  assert(topLevel.length === 1, `Top-level comments = ${topLevel.length} (expect 1)`);
  assert(topLevel[0]?.replies?.length === 1, `Replies count = ${topLevel[0]?.replies?.length} (expect 1)`);

  // ─── 4. Edit comment (within 15 min) → 200 ────────
  console.log('\n📋 Edit comment');
  const e1 = await api('PATCH', `/comments/${comment1Id}`, commenter.token, {
    content: 'تعليق معدّل',
  });
  assert(e1.status === 200, `Edit comment → ${e1.status} (expect 200)`);
  assert(e1.data?.data?.content === 'تعليق معدّل', 'Content updated');

  // ─── 5. Edit by non-author → 403 ──────────────────
  const e2 = await api('PATCH', `/comments/${comment1Id}`, postAuthor.token, {
    content: 'hijack',
  });
  assert(e2.status === 403, `Edit by non-author → ${e2.status} (expect 403)`);

  // ─── 6. Delete comment (author) → 204 ─────────────
  console.log('\n📋 Delete comment');
  // Create a new comment to delete
  const c3 = await api('POST', `/posts/${postId}/comments`, commenter.token, {
    content: 'تعليق سيتم حذفه',
  });
  const deleteTargetId = c3.data?.data?.id;

  const d1 = await api('DELETE', `/comments/${deleteTargetId}`, commenter.token);
  assert(d1.status === 204, `Delete own comment → ${d1.status} (expect 204)`);

  // ─── 7. Delete decrements commentCount ─────────────
  const postCheck2 = await api('GET', `/posts/${postId}`, postAuthor.token);
  assert(postCheck2.data?.data?.commentCount === 2, `Post commentCount after delete = ${postCheck2.data?.data?.commentCount} (expect 2)`);

  // ─── 8. Post author deletes another's comment ─────
  // Create comment by commenter
  const c4 = await api('POST', `/posts/${postId}/comments`, commenter.token, {
    content: 'تعليق سيحذفه صاحب المنشور',
  });
  const c4Id = c4.data?.data?.id;

  const d2 = await api('DELETE', `/comments/${c4Id}`, postAuthor.token);
  assert(d2.status === 204, `Post author deletes other comment → ${d2.status} (expect 204)`);

  // ─── 9. Pin comment (post author) → 200 ───────────
  console.log('\n📋 Pin comment');
  const p1 = await api('POST', `/comments/${comment1Id}/pin`, postAuthor.token);
  assert(p1.status === 200, `Pin comment → ${p1.status} (expect 200)`);
  assert(p1.data?.data?.pinned === true, 'pinned: true');

  // Toggle unpin
  const p2 = await api('POST', `/comments/${comment1Id}/pin`, postAuthor.token);
  assert(p2.status === 200, `Toggle unpin → ${p2.status} (expect 200)`);
  assert(p2.data?.data?.pinned === false, 'pinned: false (toggled)');

  // ─── 10. Pin by non-post-author → 403 ─────────────
  const p3 = await api('POST', `/comments/${comment1Id}/pin`, commenter.token);
  assert(p3.status === 403, `Pin by non-post-author → ${p3.status} (expect 403)`);

  // ─── 11. Comment on non-existent post → 404 ───────
  console.log('\n📋 Edge cases');
  const fakeId = 'a0000000-b000-4000-8000-c00000000099';
  const c5 = await api('POST', `/posts/${fakeId}/comments`, commenter.token, {
    content: 'test',
  });
  assert(c5.status === 404, `Comment on non-existent post → ${c5.status} (expect 404)`);

  // ─── 12. Reply to non-existent parent → 404 ───────
  const c6 = await api('POST', `/posts/${postId}/comments`, commenter.token, {
    content: 'reply to nothing',
    parentCommentId: 'a0000000-b000-4000-8000-c00000000099',
  });
  assert(c6.status === 404, `Reply to non-existent parent → ${c6.status} (expect 404)`);

  // ─── 13. Tier 4 cannot comment → 403 ──────────────
  // newUser is tier 4 by default (new_user)
  const c7 = await api('POST', `/posts/${postId}/comments`, newUser.token, {
    content: 'should fail',
  });
  assert(c7.status === 403, `Tier 4 user comment → ${c7.status} (expect 403)`);

  // ─── 14. Pagination ───────────────────────────────
  console.log('\n📋 Pagination');
  // Create multiple top-level comments
  for (let i = 0; i < 3; i++) {
    await api('POST', `/posts/${postId}/comments`, commenter.token, {
      content: `تعليق للترقيم ${i}`,
    });
  }

  const page1 = await api('GET', `/posts/${postId}/comments?limit=2`, null);
  assert(page1.status === 200, 'Page 1 → 200');
  assert(page1.data?.data?.length === 2, `Page 1 has ${page1.data?.data?.length} items (expect 2)`);
  assert(page1.data?.meta?.hasMore === true, 'hasMore: true');

  const cursor = page1.data?.meta?.cursor;
  const page2 = await api('GET', `/posts/${postId}/comments?limit=2&cursor=${cursor}`, null);
  assert(page2.status === 200, 'Page 2 → 200');
  assert(page2.data?.data?.length >= 1, `Page 2 has ${page2.data?.data?.length} items (expect ≥1)`);

  // ─── 15. Deleted comment not in listing ────────────
  console.log('\n📋 Deleted not listed');
  const allComments = await api('GET', `/posts/${postId}/comments?limit=50`, null);
  const allIds = (allComments.data?.data || []).map(c => c.id);
  assert(!allIds.includes(deleteTargetId), 'Deleted comment not in listing');

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
