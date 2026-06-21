/**
 * Videos Module — E2E Tests
 *
 * Tests:
 *  1. Create upload URL (Tier 2 — reel) → 201
 *  2. Create upload URL (Tier 2 — tour, longer duration) → 201
 *  3. Tier 3 cannot create upload URL → 403
 *  4. Unauthenticated cannot create upload URL → 401
 *  5. Duration exceeds max for reel (>180s) → 400
 *  6. Duration exceeds max for tour (>600s) → 400
 *  7. Invalid type → 400
 *  8. Missing required fields → 400
 *  9. Get video status (public) → 200 (uploading)
 * 10. Dev simulate ready → 200
 * 11. Get video status after ready → 200 (ready with URLs)
 * 12. Get video detail → 200 (includes uploader)
 * 13. Non-existent video status → 404
 * 14. Non-existent video detail → 404
 * 15. Record watch on ready video → 204
 * 16. Watch increments counters
 * 17. Record watch on non-ready video → 400
 * 18. Record watch unauthenticated → 401
 * 19. Mux webhook — asset_created → processing
 * 20. Mux webhook — asset.ready → ready with URLs
 * 21. Mux webhook — asset.errored → error
 * 22. Invalid webhook payload → 200 (graceful)
 * 23. Upload URL with listing attachment → 201
 * 24. Upload URL with non-existent listing → 404
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
  console.log('\n🧪 Videos Module E2E Tests\n');

  // ─── Setup ─────────────────────────────────────────
  console.log('📋 Setup');
  const ts = Date.now().toString();
  const creator = await createUser(`+2010${ts.slice(-8)}`);
  assert(!!creator.token, 'Creator created');
  await setTier(creator.userId, 'verified_contributor');

  const viewer = await createUser(`+2011${ts.slice(-8)}`);
  assert(!!viewer.token, 'Viewer created');
  await setTier(viewer.userId, 'trusted_member');

  // ─── 1. Create upload URL (reel) → 201 ────────────
  console.log('\n📋 1. Create upload URL — reel');
  const r1 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 45,
    type: 'reel',
  });
  assert(r1.status === 201, `Status 201 (got ${r1.status})`);
  assert(r1.data?.success === true, 'success: true');
  assert(!!r1.data?.data?.videoId, 'videoId returned');
  assert(!!r1.data?.data?.uploadUrl, 'uploadUrl returned');
  assert(r1.data?.data?.maxDuration === 180, 'maxDuration = 180 for reel');
  const videoId1 = r1.data?.data?.videoId;

  // ─── 2. Create upload URL (tour) → 201 ────────────
  console.log('\n📋 2. Create upload URL — tour');
  const r2 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 300,
    type: 'tour',
  });
  assert(r2.status === 201, `Status 201 (got ${r2.status})`);
  assert(r2.data?.data?.maxDuration === 600, 'maxDuration = 600 for tour');
  const videoId2 = r2.data?.data?.videoId;

  // ─── 3. Tier 3 cannot create upload URL → 403 ─────
  console.log('\n📋 3. Tier 3 cannot create upload URL');
  const r3 = await api('POST', '/videos/upload-url', viewer.token, {
    duration: 30,
    type: 'reel',
  });
  assert(r3.status === 403, `Status 403 (got ${r3.status})`);

  // ─── 4. Unauthenticated → 401 ─────────────────────
  console.log('\n📋 4. Unauthenticated cannot create');
  const r4 = await api('POST', '/videos/upload-url', null, {
    duration: 30,
    type: 'reel',
  });
  assert(r4.status === 401, `Status 401 (got ${r4.status})`);

  // ─── 5. Duration exceeds max for reel → 400 ───────
  console.log('\n📋 5. Duration exceeds max for reel');
  const r5 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 200,
    type: 'reel',
  });
  assert(r5.status === 400, `Status 400 (got ${r5.status})`);

  // ─── 6. Duration exceeds max for tour → 400 ───────
  console.log('\n📋 6. Duration exceeds max for tour');
  const r6 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 700,
    type: 'tour',
  });
  assert(r6.status === 400, `Status 400 (got ${r6.status})`);

  // ─── 7. Invalid type → 400 ────────────────────────
  console.log('\n📋 7. Invalid video type');
  const r7 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 30,
    type: 'invalid_type',
  });
  assert(r7.status === 400, `Status 400 (got ${r7.status})`);

  // ─── 8. Missing required fields → 400 ─────────────
  console.log('\n📋 8. Missing required fields');
  const r8 = await api('POST', '/videos/upload-url', creator.token, {});
  assert(r8.status === 400, `Status 400 (got ${r8.status})`);

  // ─── 9. Get video status → uploading ──────────────
  console.log('\n📋 9. Get video status (uploading)');
  const r9 = await api('GET', `/videos/${videoId1}/status`, null);
  assert(r9.status === 200, `Status 200 (got ${r9.status})`);
  assert(r9.data?.data?.status === 'uploading', 'status = uploading');
  assert(r9.data?.data?.id === videoId1, 'correct videoId');

  // ─── 10. Dev simulate ready ───────────────────────
  console.log('\n📋 10. Dev simulate ready');
  const r10 = await api('POST', `/videos/${videoId1}/dev-ready`, null);
  assert(r10.status === 200, `Status 200 (got ${r10.status})`);
  assert(r10.data?.data?.status === 'ready', 'status = ready');
  assert(!!r10.data?.data?.playbackUrl, 'playbackUrl generated');
  assert(!!r10.data?.data?.thumbnailUrl, 'thumbnailUrl generated');

  // ─── 11. Status after ready ───────────────────────
  console.log('\n📋 11. Status after ready');
  const r11 = await api('GET', `/videos/${videoId1}/status`, null);
  assert(r11.data?.data?.status === 'ready', 'status = ready');
  assert(!!r11.data?.data?.playbackUrl, 'playbackUrl present');
  assert(!!r11.data?.data?.thumbnailUrl, 'thumbnailUrl present');
  assert(r11.data?.data?.aspectRatio === '9:16', 'aspectRatio = 9:16');

  // ─── 12. Get video detail ─────────────────────────
  console.log('\n📋 12. Video detail');
  const r12 = await api('GET', `/videos/${videoId1}`, null);
  assert(r12.status === 200, `Status 200 (got ${r12.status})`);
  assert(r12.data?.data?.id === videoId1, 'correct videoId');
  assert(!!r12.data?.data?.uploader, 'uploader included');
  assert(r12.data?.data?.uploader?.id === creator.userId, 'correct uploader');

  // ─── 13. Non-existent video status → 404 ──────────
  console.log('\n📋 13. Non-existent video status');
  const fakeId = 'a0000000-b000-4000-8000-c00000000099';
  const r13 = await api('GET', `/videos/${fakeId}/status`, null);
  assert(r13.status === 404, `Status 404 (got ${r13.status})`);

  // ─── 14. Non-existent video detail → 404 ──────────
  console.log('\n📋 14. Non-existent video detail');
  const r14 = await api('GET', `/videos/${fakeId}`, null);
  assert(r14.status === 404, `Status 404 (got ${r14.status})`);

  // ─── 15. Record watch → 204 ───────────────────────
  console.log('\n📋 15. Record watch');
  const r15 = await api('POST', `/videos/${videoId1}/watch`, creator.token, {
    watchedSeconds: 30,
    totalSeconds: 45,
    completed: false,
  });
  assert(r15.status === 204, `Status 204 (got ${r15.status})`);

  // ─── 16. Watch increments counters ────────────────
  console.log('\n📋 16. Watch increments counters');
  // Record another watch
  await api('POST', `/videos/${videoId1}/watch`, creator.token, {
    watchedSeconds: 45,
    totalSeconds: 45,
    completed: true,
  });
  const r16 = await api('GET', `/videos/${videoId1}`, null);
  assert(r16.data?.data?.watchCount >= 2, `watchCount >= 2 (got ${r16.data?.data?.watchCount})`);
  assert(r16.data?.data?.totalWatchTime >= 75, `totalWatchTime >= 75 (got ${r16.data?.data?.totalWatchTime})`);

  // ─── 17. Watch on non-ready video → 400 ───────────
  console.log('\n📋 17. Watch on non-ready video');
  const r17 = await api('POST', `/videos/${videoId2}/watch`, creator.token, {
    watchedSeconds: 10,
    totalSeconds: 300,
    completed: false,
  });
  assert(r17.status === 400, `Status 400 (got ${r17.status})`);

  // ─── 18. Watch unauthenticated → 401 ──────────────
  console.log('\n📋 18. Watch unauthenticated');
  const r18 = await api('POST', `/videos/${videoId1}/watch`, null, {
    watchedSeconds: 10,
    totalSeconds: 45,
    completed: false,
  });
  assert(r18.status === 401, `Status 401 (got ${r18.status})`);

  // ─── 19. Webhook: asset_created → processing ──────
  console.log('\n📋 19. Webhook: upload.asset_created');
  // Get the muxUploadId for videoId2
  const v2Detail = await api('GET', `/videos/${videoId2}`, null);
  const muxUploadId = v2Detail.data?.data?.muxUploadId;
  assert(!!muxUploadId, 'muxUploadId exists');

  const r19 = await api('POST', '/videos/webhooks/mux', null, {
    type: 'video.upload.asset_created',
    data: {
      id: muxUploadId,
      asset_id: 'test-asset-001',
    },
  });
  assert(r19.status === 200, `Status 200 (got ${r19.status})`);

  // Verify status updated
  const v2After = await api('GET', `/videos/${videoId2}/status`, null);
  assert(v2After.data?.data?.status === 'processing', `status = processing (got ${v2After.data?.data?.status})`);

  // ─── 20. Webhook: asset.ready ─────────────────────
  console.log('\n📋 20. Webhook: video.asset.ready');
  const r20 = await api('POST', '/videos/webhooks/mux', null, {
    type: 'video.asset.ready',
    data: {
      id: 'test-asset-001',
      playback_ids: [{ id: 'test-playback-001', policy: 'public' }],
      tracks: [{ type: 'video', max_width: 1080, max_height: 1920 }],
      duration: 295.5,
    },
  });
  assert(r20.status === 200, `Status 200 (got ${r20.status})`);

  const v2Ready = await api('GET', `/videos/${videoId2}/status`, null);
  assert(v2Ready.data?.data?.status === 'ready', 'status = ready');
  assert(v2Ready.data?.data?.playbackUrl === 'https://stream.mux.com/test-playback-001.m3u8', 'playbackUrl correct');
  assert(v2Ready.data?.data?.thumbnailUrl === 'https://image.mux.com/test-playback-001/thumbnail.jpg', 'thumbnailUrl correct');
  assert(v2Ready.data?.data?.duration === 296, 'duration rounded');
  assert(v2Ready.data?.data?.aspectRatio === '1080:1920', 'aspectRatio from tracks');

  // ─── 21. Webhook: asset.errored ───────────────────
  console.log('\n📋 21. Webhook: video.asset.errored');
  // Create a third video to test error
  const r21setup = await api('POST', '/videos/upload-url', creator.token, {
    duration: 60,
    type: 'tip',
  });
  const videoId3 = r21setup.data?.data?.videoId;
  const v3Detail = await api('GET', `/videos/${videoId3}`, null);
  const v3UploadId = v3Detail.data?.data?.muxUploadId;

  // Simulate asset creation first
  await api('POST', '/videos/webhooks/mux', null, {
    type: 'video.upload.asset_created',
    data: { id: v3UploadId, asset_id: 'test-asset-err' },
  });

  // Then error
  const r21 = await api('POST', '/videos/webhooks/mux', null, {
    type: 'video.asset.errored',
    data: { id: 'test-asset-err' },
  });
  assert(r21.status === 200, `Status 200 (got ${r21.status})`);

  const v3Status = await api('GET', `/videos/${videoId3}/status`, null);
  assert(v3Status.data?.data?.status === 'error', `status = error (got ${v3Status.data?.data?.status})`);

  // ─── 22. Invalid webhook payload → 200 ────────────
  console.log('\n📋 22. Invalid webhook payload (graceful)');
  const r22 = await api('POST', '/videos/webhooks/mux', null, {
    random: 'garbage',
  });
  assert(r22.status === 200, `Status 200 (got ${r22.status})`);

  // ─── 23. Upload URL with listing → 201 ────────────
  console.log('\n📋 23. Upload URL with listing attachment');
  // Create a listing first
  const listing = await api('POST', '/listings', creator.token, {
    titleAr: 'شقة فيديو تست',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 500000,
    area: 120,
    city: 'القاهرة',
  });
  const listingId = listing.data?.data?.id;
  assert(!!listingId, 'Listing created for video attachment');

  const r23 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 120,
    type: 'tour',
    listingId,
  });
  assert(r23.status === 201, `Status 201 (got ${r23.status})`);

  // Verify listing attached
  const v4Detail = await api('GET', `/videos/${r23.data?.data?.videoId}`, null);
  assert(v4Detail.data?.data?.listingId === listingId, 'listingId attached');

  // ─── 24. Upload URL with non-existent listing → 404
  console.log('\n📋 24. Upload URL with non-existent listing');
  const r24 = await api('POST', '/videos/upload-url', creator.token, {
    duration: 60,
    type: 'tour',
    listingId: 'a0000000-b000-4000-8000-c00000000099',
  });
  assert(r24.status === 404, `Status 404 (got ${r24.status})`);

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
