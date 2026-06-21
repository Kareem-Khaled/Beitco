/**
 * Listings Module — E2E Tests
 *
 * Tests:
 *  1. Create listing (Tier 2) → 201
 *  2. Tier 3 cannot create → 403
 *  3. Get listing detail → 200
 *  4. List/search listings → 200 (public)
 *  5. Filter by type + city
 *  6. Filter by price range
 *  7. Update listing (owner) → 200
 *  8. Update by non-owner → 403
 *  9. Toggle save → 200 (saved: true)
 * 10. Toggle unsave → 200 (saved: false)
 * 11. Get saved listings → 200
 * 12. Get similar → 200
 * 13. Delete listing → 204
 * 14. Deleted listing → 404
 * 15. Pagination works
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
  console.log('\n🧪 Listings Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const agent = await createUser('+201000000080');
  assert(!!agent.token, 'Agent created');
  await setTier(agent.userId, 'verified_contributor');

  const viewer = await createUser('+201000000081');
  assert(!!viewer.token, 'Viewer created');
  await setTier(viewer.userId, 'trusted_member');

  // ─── 1. Create listing → 201 ──────────────────────
  console.log('\n📋 Create listing');
  const l1 = await api('POST', '/listings', agent.token, {
    titleAr: 'شقة ٣ غرف في التجمع',
    titleEn: '3BR Apartment New Cairo',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 2500000,
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    floor: 5,
    finishing: 'fully_finished',
    amenities: ['parking', 'gym', 'pool'],
    city: 'القاهرة',
    district: 'التجمع الخامس',
    images: ['https://example.com/img1.jpg'],
  });
  assert(l1.status === 201, `Create listing → ${l1.status} (expect 201)`);
  assert(l1.data?.success === true, 'success: true');
  const listingId = l1.data?.data?.id;
  assert(!!listingId, 'Listing ID returned');
  assert(l1.data?.data?.price === '2500000' || l1.data?.data?.price === 2500000 || l1.data?.data?.price === '2500000.00', `Price = ${l1.data?.data?.price}`);
  assert(l1.data?.data?.bedrooms === 3, 'bedrooms = 3');

  // ─── 2. Tier 3 cannot create → 403 ────────────────
  const l2 = await api('POST', '/listings', viewer.token, {
    titleAr: 'test',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 100000,
    area: 100,
  });
  assert(l2.status === 403, `Tier 3 create → ${l2.status} (expect 403)`);

  // ─── 3. Get listing detail → 200 ──────────────────
  console.log('\n📋 Detail');
  const ld = await api('GET', `/listings/${listingId}`, null);
  assert(ld.status === 200, `Get detail → ${ld.status} (expect 200)`);
  assert(ld.data?.data?.agent?.id === agent.userId, 'Agent matches');

  // ─── 4. List listings → 200 ───────────────────────
  console.log('\n📋 List / Search');
  const ll = await api('GET', '/listings', null);
  assert(ll.status === 200, `List → ${ll.status} (expect 200)`);
  assert(Array.isArray(ll.data?.data), 'data is array');

  // ─── 5. Filter by type + city ─────────────────────
  const lf1 = await api('GET', '/listings?type=sale&city=القاهرة', null);
  assert(lf1.status === 200, 'Filter by type+city → 200');
  const filtered = lf1.data?.data || [];
  const allSale = filtered.every(l => l.listingType === 'sale');
  assert(allSale, 'All filtered listings are sale type');

  // ─── 6. Filter by price range ─────────────────────
  const lf2 = await api('GET', '/listings?minPrice=2000000&maxPrice=3000000', null);
  assert(lf2.status === 200, 'Filter by price range → 200');
  const foundInRange = (lf2.data?.data || []).some(l => l.id === listingId);
  assert(foundInRange, 'Listing found in price range');

  // ─── 7. Update listing → 200 ──────────────────────
  console.log('\n📋 Update');
  const u1 = await api('PATCH', `/listings/${listingId}`, agent.token, {
    price: 2400000,
    titleEn: 'Updated 3BR',
  });
  assert(u1.status === 200, `Update → ${u1.status} (expect 200)`);
  assert(u1.data?.data?.titleEn === 'Updated 3BR', 'Title updated');

  // ─── 8. Update by non-owner → 403 ────────────────
  const u2 = await api('PATCH', `/listings/${listingId}`, viewer.token, {
    price: 1,
  });
  assert(u2.status === 403, `Non-owner update → ${u2.status} (expect 403)`);

  // ─── 9. Toggle save → saved: true ────────────────
  console.log('\n📋 Save');
  const s1 = await api('POST', `/listings/${listingId}/save`, viewer.token);
  assert(s1.status === 200, `Save → ${s1.status} (expect 200)`);
  assert(s1.data?.data?.saved === true, 'saved: true');

  // ─── 10. Toggle unsave → saved: false ─────────────
  const s2 = await api('POST', `/listings/${listingId}/save`, viewer.token);
  assert(s2.status === 200, `Unsave → ${s2.status} (expect 200)`);
  assert(s2.data?.data?.saved === false, 'saved: false');

  // ─── 11. Get saved listings ───────────────────────
  // Re-save
  await api('POST', `/listings/${listingId}/save`, viewer.token);
  const sv = await api('GET', '/listings/saved', viewer.token);
  assert(sv.status === 200, `Saved listings → ${sv.status} (expect 200)`);
  assert(sv.data?.data?.length >= 1, `Saved count = ${sv.data?.data?.length} (expect ≥1)`);

  // ─── 12. Get similar → 200 ────────────────────────
  console.log('\n📋 Similar');
  // Create a similar listing
  await api('POST', '/listings', agent.token, {
    titleAr: 'شقة مشابهة',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 2600000,
    area: 190,
    city: 'القاهرة',
  });

  const sim = await api('GET', `/listings/${listingId}/similar`, null);
  assert(sim.status === 200, `Similar → ${sim.status} (expect 200)`);
  assert(Array.isArray(sim.data?.data), 'Similar data is array');

  // ─── 13. Delete listing → 204 ─────────────────────
  console.log('\n📋 Delete');
  // Create a listing to delete
  const l3 = await api('POST', '/listings', agent.token, {
    titleAr: 'للحذف',
    listingType: 'rent',
    propertyType: 'studio',
    price: 5000,
    area: 50,
  });
  const deleteId = l3.data?.data?.id;

  const d1 = await api('DELETE', `/listings/${deleteId}`, agent.token);
  assert(d1.status === 204, `Delete → ${d1.status} (expect 204)`);

  // ─── 14. Deleted listing → 404 ────────────────────
  const d2 = await api('GET', `/listings/${deleteId}`, null);
  assert(d2.status === 404, `Get deleted → ${d2.status} (expect 404)`);

  // ─── 15. Pagination ───────────────────────────────
  console.log('\n📋 Pagination');
  for (let i = 0; i < 3; i++) {
    await api('POST', '/listings', agent.token, {
      titleAr: `عقار ${i}`,
      listingType: 'sale',
      propertyType: 'villa',
      price: 5000000 + i * 100000,
      area: 300 + i * 10,
    });
  }

  const p1 = await api('GET', '/listings?limit=2', null);
  assert(p1.status === 200, 'Page 1 → 200');
  assert(p1.data?.data?.length === 2, `Page 1 has ${p1.data?.data?.length} items (expect 2)`);
  assert(p1.data?.meta?.hasMore === true, 'hasMore: true');

  const cursor = p1.data?.meta?.cursor;
  const p2 = await api('GET', `/listings?limit=2&cursor=${cursor}`, null);
  assert(p2.status === 200, 'Page 2 → 200');
  assert(p2.data?.data?.length >= 1, `Page 2 has ${p2.data?.data?.length} items`);

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
