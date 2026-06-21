/**
 * Groups Module — E2E Tests
 *
 * Tests:
 *  1. Create group (Tier 2) → 201
 *  2. Tier 3 cannot create → 403
 *  3. Get group detail → 200 (includes isMember, myRole)
 *  4. List groups → 200 (public)
 *  5. Search groups by name → filters
 *  6. Join public group → 200 (status: active)
 *  7. Duplicate join → 409
 *  8. Leave group → 204
 *  9. Creator cannot leave → 400
 * 10. Update group (admin) → 200
 * 11. Update by non-admin → 403
 * 12. Get members → 200
 * 13. Get group posts → 200
 * 14. Manage member (promote to moderator) → 200
 * 15. Delete group (creator) → 204
 * 16. Deleted group → 404
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
  console.log('\n🧪 Groups Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const creator = await createUser('+201000000070');
  assert(!!creator.token, 'Creator created');
  await setTier(creator.userId, 'verified_contributor');

  const member = await createUser('+201000000071');
  assert(!!member.token, 'Member created');
  await setTier(member.userId, 'trusted_member');

  const lowTier = await createUser('+201000000072');
  assert(!!lowTier.token, 'Low tier user created');
  // stays at new_user (tier 4)

  // ─── 1. Create group → 201 ────────────────────────
  console.log('\n📋 Create group');
  const g1 = await api('POST', '/groups', creator.token, {
    nameAr: 'القاهرة الجديدة',
    nameEn: 'New Cairo',
    descriptionAr: 'مجموعة لسكان القاهرة الجديدة',
    groupType: 'neighborhood',
    privacy: 'public',
    city: 'القاهرة',
    district: 'التجمع الخامس',
  });
  assert(g1.status === 201, `Create group → ${g1.status} (expect 201)`);
  assert(g1.data?.success === true, 'success: true');
  const groupId = g1.data?.data?.id;
  assert(!!groupId, 'Group ID returned');
  assert(g1.data?.data?.nameAr === 'القاهرة الجديدة', 'nameAr matches');
  assert(g1.data?.data?.memberCount === 1, `memberCount = ${g1.data?.data?.memberCount} (expect 1, creator auto-joins)`);
  assert(!!g1.data?.data?.slug, 'slug generated');

  // ─── 2. Tier 3 cannot create → 403 ────────────────
  const g2 = await api('POST', '/groups', member.token, {
    nameAr: 'مجموعة اختبار',
    groupType: 'topic',
  });
  assert(g2.status === 403, `Tier 3 create → ${g2.status} (expect 403)`);

  // ─── 3. Get group detail → 200 ────────────────────
  console.log('\n📋 Group detail');
  const gd = await api('GET', `/groups/${groupId}`, creator.token);
  assert(gd.status === 200, `Get detail → ${gd.status} (expect 200)`);
  assert(gd.data?.data?.isMember === true, 'Creator isMember: true');
  assert(gd.data?.data?.myRole === 'admin', 'Creator myRole: admin');

  // Non-member sees isMember: false
  const gd2 = await api('GET', `/groups/${groupId}`, member.token);
  assert(gd2.data?.data?.isMember === false, 'Non-member isMember: false');

  // ─── 4. List groups → 200 (public) ────────────────
  console.log('\n📋 List groups');
  const gl = await api('GET', '/groups', null);
  assert(gl.status === 200, `List groups → ${gl.status} (expect 200)`);
  assert(Array.isArray(gl.data?.data), 'data is array');
  const found = gl.data.data.some(g => g.id === groupId);
  assert(found, 'Created group appears in list');

  // ─── 5. Search groups ─────────────────────────────
  const gs = await api('GET', '/groups?search=القاهرة', null);
  assert(gs.status === 200, 'Search → 200');
  const searchFound = gs.data?.data?.some(g => g.id === groupId);
  assert(searchFound, 'Group found via Arabic search');

  // ─── 6. Join public group → 200 ───────────────────
  console.log('\n📋 Join / Leave');
  const j1 = await api('POST', `/groups/${groupId}/join`, member.token);
  assert(j1.status === 200, `Join → ${j1.status} (expect 200)`);
  assert(j1.data?.data?.status === 'active', 'status: active (public group)');

  // Verify member count
  const gd3 = await api('GET', `/groups/${groupId}`, null);
  assert(gd3.data?.data?.memberCount === 2, `memberCount = ${gd3.data?.data?.memberCount} (expect 2)`);

  // ─── 7. Duplicate join → 409 ──────────────────────
  const j2 = await api('POST', `/groups/${groupId}/join`, member.token);
  assert(j2.status === 409, `Duplicate join → ${j2.status} (expect 409)`);

  // ─── 8. Leave group → 204 ─────────────────────────
  const lv1 = await api('DELETE', `/groups/${groupId}/leave`, member.token);
  assert(lv1.status === 204, `Leave → ${lv1.status} (expect 204)`);

  const gd4 = await api('GET', `/groups/${groupId}`, null);
  assert(gd4.data?.data?.memberCount === 1, `memberCount after leave = ${gd4.data?.data?.memberCount} (expect 1)`);

  // ─── 9. Creator cannot leave → 400 ────────────────
  const lv2 = await api('DELETE', `/groups/${groupId}/leave`, creator.token);
  assert(lv2.status === 400, `Creator leave → ${lv2.status} (expect 400)`);

  // ─── 10. Update group → 200 ───────────────────────
  console.log('\n📋 Update group');
  const u1 = await api('PATCH', `/groups/${groupId}`, creator.token, {
    descriptionEn: 'Updated description',
  });
  assert(u1.status === 200, `Update → ${u1.status} (expect 200)`);
  assert(u1.data?.data?.descriptionEn === 'Updated description', 'Description updated');

  // ─── 11. Non-admin update → 403 ───────────────────
  // Re-join member
  await api('POST', `/groups/${groupId}/join`, member.token);
  const u2 = await api('PATCH', `/groups/${groupId}`, member.token, {
    descriptionEn: 'hijack',
  });
  assert(u2.status === 403, `Non-admin update → ${u2.status} (expect 403)`);

  // ─── 12. Get members → 200 ────────────────────────
  console.log('\n📋 Members');
  const m1 = await api('GET', `/groups/${groupId}/members`, null);
  assert(m1.status === 200, `Get members → ${m1.status} (expect 200)`);
  assert(m1.data?.data?.length === 2, `Member count = ${m1.data?.data?.length} (expect 2)`);

  // ─── 13. Get group posts → 200 ────────────────────
  console.log('\n📋 Group posts');
  // Create a post in the group
  const gp1 = await api('POST', '/posts', creator.token, {
    postType: 'text',
    contentText: 'منشور في المجموعة',
    groupId,
  });
  assert(gp1.status === 201, 'Group post created');

  const gpList = await api('GET', `/groups/${groupId}/posts`, null);
  assert(gpList.status === 200, `Group posts → ${gpList.status} (expect 200)`);
  assert(gpList.data?.data?.length >= 1, `Group has ${gpList.data?.data?.length} posts (expect ≥1)`);

  // ─── 14. Manage member → 200 ──────────────────────
  console.log('\n📋 Manage members');
  const mm1 = await api('PATCH', `/groups/${groupId}/members/${member.userId}`, creator.token, {
    role: 'moderator',
  });
  assert(mm1.status === 200, `Promote to moderator → ${mm1.status} (expect 200)`);
  assert(mm1.data?.data?.role === 'moderator', 'Role updated to moderator');

  // ─── 15. Delete group → 204 ───────────────────────
  console.log('\n📋 Delete group');
  // Create a second group to delete
  const g3 = await api('POST', '/groups', creator.token, {
    nameAr: 'مجموعة للحذف',
    groupType: 'topic',
  });
  const deleteGroupId = g3.data?.data?.id;

  const d1 = await api('DELETE', `/groups/${deleteGroupId}`, creator.token);
  assert(d1.status === 204, `Delete group → ${d1.status} (expect 204)`);

  // ─── 16. Deleted group → 404 ──────────────────────
  const d2 = await api('GET', `/groups/${deleteGroupId}`, null);
  assert(d2.status === 404, `Get deleted group → ${d2.status} (expect 404)`);

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
