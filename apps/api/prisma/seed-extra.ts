/**
 * Dev-only bulk listing generator — adds a batch of varied published listings so
 * pagination / infinite-scroll is visible with realistic volume. Idempotent:
 * every listing it makes has a `bulk-` id prefix, and it deletes those first, so
 * you can re-run it freely. It does NOT touch the canonical seed data.
 *
 * Run:  pnpm --filter @beitco/api exec ts-node --transpile-only \
 *         --compiler-options '{"module":"CommonJS"}' prisma/seed-extra.ts
 *   or:  pnpm db:seed:extra   (see package.json)
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const HOW_MANY = 40; // 40 extra + the 10 canonical = 50 (>2 pages at size 24)

const OWNERS = ['u-mostafa', 'u-coliving', 'u-zayed', 'u-fam', 'u-students', 'u-alex'];

const AREAS: { area: string; address: string; lat: number; lng: number }[] = [
  { area: 'القاهرة الجديدة · التجمع الخامس', address: 'محور التسعين الجنوبي، التجمع الخامس', lat: 30.0074, lng: 31.4913 },
  { area: 'المعادي · دجلة', address: 'شارع 9، المعادي', lat: 29.9603, lng: 31.2578 },
  { area: 'مدينة نصر · الحي السابع', address: 'شارع مصطفى النحاس، مدينة نصر', lat: 30.0566, lng: 31.3486 },
  { area: 'الشيخ زايد · الحي الأول', address: 'محور 26 يوليو، الشيخ زايد', lat: 30.0771, lng: 30.9762 },
  { area: '6 أكتوبر · الحي المتميز', address: 'المحور المركزي، 6 أكتوبر', lat: 29.9668, lng: 30.9333 },
  { area: 'الإسكندرية · سموحة', address: 'شارع فوزي معاذ، سموحة', lat: 31.2156, lng: 29.9553 },
  { area: 'الإسكندرية · سيدي جابر', address: 'محطة الرمل، سيدي جابر', lat: 31.2237, lng: 29.9511 },
  { area: 'الجيزة · المهندسين', address: 'شارع جامعة الدول العربية، المهندسين', lat: 30.0561, lng: 31.2001 },
  { area: 'الجيزة · الدقي', address: 'شارع التحرير، الدقي', lat: 30.0388, lng: 31.2118 },
  { area: 'المنصورة · وسط البلد', address: 'شارع الجمهورية، المنصورة', lat: 31.0409, lng: 31.3785 },
];

const APT_TITLES = [
  'شقة مشمسة قريبة من كل الخدمات',
  'شقة تشطيب سوبر لوكس بفيو مفتوح',
  'شقة عائلية هادية في كمبوند',
  'شقة حديثة قريبة من المترو',
  'دوبلكس واسع بروف خاص',
  'استوديو مفروش شيك للعرسان',
];
const BED_TITLES = [
  'سرير في أوضة مشتركة قريبة من الجامعة',
  'سكن طلبة منظم وآمن',
  'سرير في شقة مفروشة بالكامل',
  'مكان مشترك مريح وقريب من المواصلات',
];
const ROOM_TITLES = [
  'أوضة خاصة بحمام في شقة مشتركة',
  'أوضة مفروشة في شقة هادية',
  'أوضة واسعة بتكييف وبلكونة',
];

const AMENITIES_POOL = ['نت', 'تكييف', 'غسالة', 'ثلاجة', 'بوتاجاز', 'أمن', 'أسانسير', 'جراج', 'قريب من المترو', 'مفروشة'];
const ROOM_FEATURES_POOL = ['تكييف', 'حمام خاص', 'بلكونة', 'مكتب', 'دولاب كبير'];
const NEARBY_POOL: { type: 'metro' | 'university' | 'transit' | 'mall' | 'hospital' | 'supermarket'; name: string; minutes: number }[] = [
  { type: 'metro', name: 'محطة المترو', minutes: 7 },
  { type: 'university', name: 'الجامعة', minutes: 12 },
  { type: 'mall', name: 'المول', minutes: 9 },
  { type: 'supermarket', name: 'سوبر ماركت', minutes: 4 },
  { type: 'hospital', name: 'مستشفى', minutes: 10 },
  { type: 'transit', name: 'موقف مواصلات', minutes: 3 },
];

// A stable pseudo-random so re-runs produce the same set (nicer for testing).
let seedN = 12345;
const rand = () => ((seedN = (seedN * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (lo: number, hi: number) => Math.round(lo + rand() * (hi - lo));
const sample = <T,>(arr: T[], n: number): T[] => [...arr].sort(() => rand() - 0.5).slice(0, n);

const quality = () => ({
  internet: between(6, 10),
  safety: between(6, 10),
  noise: between(5, 9),
  maintenance: between(6, 10),
  cleanliness: between(6, 10),
});

type Kind = 'apt_rent' | 'apt_sale' | 'bed' | 'room';
const KINDS: Kind[] = ['apt_rent', 'apt_sale', 'bed', 'room'];

async function main() {
  // Idempotent: drop any previously generated bulk listings (cascades to
  // rooms/beds/occupants/nearby/reviews via onDelete: Cascade).
  const deleted = await prisma.property.deleteMany({ where: { id: { startsWith: 'bulk-' } } });
  console.log(`removed ${deleted.count} previous bulk listings`);

  let rooms = 0;
  let beds = 0;

  for (let i = 0; i < HOW_MANY; i++) {
    const id = `bulk-${String(i + 1).padStart(3, '0')}`;
    const kind = KINDS[i % KINDS.length]!;
    const loc = pick(AREAS);
    const owner = pick(OWNERS);
    const verified = rand() > 0.35;
    const trust = Math.round((6 + rand() * 4) * 10) / 10;
    const bedrooms = between(2, 4);
    const createdAt = new Date(Date.now() - between(1, 120) * 86400000);
    const jitter = (v: number) => v + (rand() - 0.5) * 0.02;

    const base = {
      id,
      ownerId: owner,
      area: loc.area,
      address: loc.address,
      lat: jitter(loc.lat),
      lng: jitter(loc.lng),
      floor: between(1, 12),
      sizeM2: between(70, 220),
      furnished: rand() > 0.4,
      bedrooms,
      bathrooms: between(1, 3),
      unitType: 'apartment' as const,
      images: ['/og.svg'],
      amenities: sample(AMENITIES_POOL, between(4, 7)),
      costs: [
        { label: 'تأمين', amount: between(2000, 8000) },
        { label: 'عمولة', amount: between(500, 3000) },
      ] as unknown as Prisma.InputJsonValue,
      trust,
      verified,
      quality: quality() as unknown as Prisma.InputJsonValue,
      reviewsCount: between(0, 40),
      residents: between(0, 10),
      createdAt,
    };

    if (kind === 'apt_sale') {
      const salePrice = between(1_200_000, 6_500_000);
      await prisma.property.create({
        data: {
          ...base,
          title: `${pick(APT_TITLES)} — للبيع`,
          description: 'شقة تمليك جاهزة للمعاينة، بموقع متميز وقريبة من كل الخدمات.',
          type: 'apartment',
          status: 'published',
          listingType: 'sale',
          rentalMode: null,
          price: salePrice,
          priceFrom: salePrice,
          salePrice,
          saleStatus: rand() > 0.85 ? 'sold' : 'available',
          negotiable: rand() > 0.5,
          nearby: { create: sample(NEARBY_POOL, between(2, 4)) },
        },
      });
    } else if (kind === 'apt_rent') {
      const wholePrice = between(6000, 28000);
      await prisma.property.create({
        data: {
          ...base,
          title: pick(APT_TITLES),
          description: 'شقة للإيجار بالكامل، تشطيب كويس ومساحة مريحة للعيلة.',
          type: 'apartment',
          status: 'published',
          listingType: 'rent',
          rentalMode: 'whole',
          price: wholePrice,
          priceFrom: wholePrice,
          wholePrice,
          wholeStatus: rand() > 0.8 ? 'occupied' : 'available',
          negotiable: rand() > 0.6,
          nightlyPrice: rand() > 0.7 ? between(400, 1500) : null,
          nearby: { create: sample(NEARBY_POOL, between(2, 4)) },
        },
      });
    } else {
      // bed or room — build rooms (+ beds for by_bed)
      const isBed = kind === 'bed';
      const roomCount = between(2, 4);
      const bedPrice = between(1800, 5000);
      const roomPrice = between(4000, 12000);
      const priceFrom = isBed ? bedPrice : roomPrice;
      const created = await prisma.property.create({
        data: {
          ...base,
          title: isBed ? pick(BED_TITLES) : pick(ROOM_TITLES),
          description: isBed
            ? 'سكن مشترك منظم، كل سرير بسعره، مكان نضيف وقريب من المواصلات.'
            : 'أوض خاصة للإيجار في شقة مشتركة مريحة.',
          type: isBed ? 'bed' : 'room',
          status: 'published',
          listingType: 'rent',
          rentalMode: isBed ? 'by_bed' : 'by_room',
          price: priceFrom,
          priceFrom,
          rentToGender: rand() > 0.5 ? 'male_only' : 'female_only',
          negotiable: false,
          nearby: { create: sample(NEARBY_POOL, between(2, 4)) },
        },
      });
      for (let r = 0; r < roomCount; r++) {
        const room = await prisma.room.create({
          data: {
            propertyId: created.id,
            name: `أوضة ${r + 1}`,
            features: sample(ROOM_FEATURES_POOL, between(1, 3)),
            sizeM2: between(12, 30),
            price: isBed ? null : roomPrice + between(-1000, 1500),
            status: isBed ? null : rand() > 0.6 ? 'occupied' : 'available',
          },
        });
        rooms++;
        if (isBed) {
          const perRoom = between(2, 4);
          for (let b = 0; b < perRoom; b++) {
            await prisma.bed.create({
              data: {
                roomId: room.id,
                label: `سرير ${b + 1}`,
                status: rand() > 0.55 ? 'occupied' : 'available',
                price: bedPrice + between(-400, 600),
                features: rand() > 0.6 ? sample(['جنب الشباك', 'دولاب خاص'], 1) : [],
              },
            });
            beds++;
          }
        }
      }
    }
  }

  const total = await prisma.property.count({ where: { status: 'published', deletedAt: null } });
  console.log(`created ${HOW_MANY} bulk listings (rooms: ${rooms}, beds: ${beds})`);
  console.log(`total published listings now: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
