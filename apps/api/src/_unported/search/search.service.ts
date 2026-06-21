import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto, SearchType } from './dto/search-query.dto';

/** Meilisearch types — loaded dynamically because SDK is ESM-only */
interface MeiliIndex {
  search(q: string, opts?: Record<string, unknown>): Promise<{ hits: unknown[]; estimatedTotalHits?: number }>;
  addDocuments(docs: Record<string, unknown>[]): Promise<unknown>;
  deleteDocument(id: string): Promise<unknown>;
  deleteAllDocuments(): Promise<unknown>;
  updateSearchableAttributes(attrs: string[]): Promise<unknown>;
  updateFilterableAttributes(attrs: string[]): Promise<unknown>;
  updateSortableAttributes(attrs: string[]): Promise<unknown>;
}

interface MeiliClient {
  health(): Promise<{ status: string }>;
  createIndex(uid: string, opts?: Record<string, unknown>): Promise<unknown>;
  index(uid: string): MeiliIndex;
}

// ── Index names ──────────────────────────────────────
const IDX_POSTS = 'posts';
const IDX_USERS = 'users';
const IDX_GROUPS = 'groups';
const IDX_LISTINGS = 'listings';
const IDX_HASHTAGS = 'hashtags';

// ── Searchable / filterable attributes per index ─────
const INDEX_CONFIG: Record<
  string,
  { searchableAttributes: string[]; filterableAttributes: string[]; sortableAttributes: string[] }
> = {
  [IDX_POSTS]: {
    searchableAttributes: ['contentText', 'contentAr', 'hashtags', 'authorName'],
    filterableAttributes: ['status', 'postType', 'groupId', 'authorId'],
    sortableAttributes: ['createdAt', 'likeCount', 'commentCount'],
  },
  [IDX_USERS]: {
    searchableAttributes: ['nameAr', 'nameEn', 'username', 'bio'],
    filterableAttributes: ['permissionTier', 'role'],
    sortableAttributes: ['followerCount', 'createdAt'],
  },
  [IDX_GROUPS]: {
    searchableAttributes: ['nameAr', 'nameEn', 'descriptionAr', 'descriptionEn', 'city'],
    filterableAttributes: ['groupType', 'privacy', 'city'],
    sortableAttributes: ['memberCount', 'createdAt'],
  },
  [IDX_LISTINGS]: {
    searchableAttributes: ['titleAr', 'titleEn', 'descriptionAr', 'descriptionEn', 'city', 'district', 'compound', 'address'],
    filterableAttributes: ['listingType', 'propertyType', 'city', 'district', 'status', 'price', 'area', 'bedrooms'],
    sortableAttributes: ['price', 'area', 'createdAt', 'viewCount'],
  },
  [IDX_HASHTAGS]: {
    searchableAttributes: ['tag'],
    filterableAttributes: [],
    sortableAttributes: ['postCount', 'trendingScore'],
  },
};

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliClient | null = null;
  private indexes: Map<string, MeiliIndex> = new Map();
  private readonly host: string;
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.host = this.config.get<string>('MEILISEARCH_URL') || 'http://localhost:7700';
    this.apiKey = this.config.get<string>('MEILISEARCH_KEY') || '';
  }

  async onModuleInit() {
    try {
      // Dynamic import — meilisearch SDK is ESM-only
      const meiliModule = await (Function('return import("meilisearch")')() as Promise<{ Meilisearch: new (opts: { host: string; apiKey: string }) => MeiliClient }>);
      this.client = new meiliModule.Meilisearch({ host: this.host, apiKey: this.apiKey });
      await this.client.health();
      this.logger.log('Meilisearch connected');
      await this.ensureIndexes();
      await this.seedAllIndexes();
    } catch (err) {
      this.logger.error('Meilisearch connection failed — search disabled', err);
    }
  }

  // ────────────────────────────────────────────────────
  // INDEX SETUP
  // ────────────────────────────────────────────────────

  private async ensureIndexes() {
    if (!this.client) return;
    for (const [name, cfg] of Object.entries(INDEX_CONFIG)) {
      try {
        await this.client.createIndex(name, { primaryKey: 'id' });
      } catch {
        // Index already exists — fine
      }
      const idx = this.client.index(name);
      await idx.updateSearchableAttributes(cfg.searchableAttributes);
      await idx.updateFilterableAttributes(cfg.filterableAttributes);
      await idx.updateSortableAttributes(cfg.sortableAttributes);
      this.indexes.set(name, idx);
    }
    this.logger.log('All search indexes configured');
  }

  // ────────────────────────────────────────────────────
  // SEED ALL (initial data sync)
  // ────────────────────────────────────────────────────

  private async seedAllIndexes() {
    await Promise.all([
      this.seedPosts(),
      this.seedUsers(),
      this.seedGroups(),
      this.seedListings(),
      this.seedHashtags(),
    ]);
    this.logger.log('All indexes seeded');
  }

  private async seedPosts() {
    const posts = await this.prisma.post.findMany({
      where: { deletedAt: null, status: 'published' },
      select: {
        id: true, contentText: true, contentAr: true, postType: true,
        hashtags: true, status: true, likeCount: true, commentCount: true,
        shareCount: true, groupId: true, authorId: true, createdAt: true,
        author: { select: { nameAr: true, nameEn: true } },
      },
    });
    const docs = posts.map((p) => ({
      id: p.id,
      contentText: p.contentText || '',
      contentAr: p.contentAr || '',
      postType: p.postType,
      hashtags: p.hashtags.join(' '),
      status: p.status,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      shareCount: p.shareCount,
      groupId: p.groupId,
      authorId: p.authorId,
      authorName: `${p.author.nameAr} ${p.author.nameEn || ''}`,
      createdAt: p.createdAt.getTime(),
    }));
    if (docs.length) await this.getIndex(IDX_POSTS).addDocuments(docs);
  }

  private async seedUsers() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, nameAr: true, nameEn: true, username: true,
        bio: true, avatarUrl: true, permissionTier: true, role: true,
        followerCount: true, createdAt: true,
      },
    });
    const docs = users.map((u) => ({
      id: u.id,
      nameAr: u.nameAr,
      nameEn: u.nameEn || '',
      username: u.username || '',
      bio: u.bio || '',
      avatarUrl: u.avatarUrl,
      permissionTier: u.permissionTier,
      role: u.role,
      followerCount: u.followerCount,
      createdAt: u.createdAt.getTime(),
    }));
    if (docs.length) await this.getIndex(IDX_USERS).addDocuments(docs);
  }

  private async seedGroups() {
    const groups = await this.prisma.group.findMany({
      where: { deletedAt: null },
      select: {
        id: true, nameAr: true, nameEn: true, descriptionAr: true,
        descriptionEn: true, groupType: true, privacy: true, city: true,
        memberCount: true, createdAt: true,
      },
    });
    const docs = groups.map((g) => ({
      id: g.id,
      nameAr: g.nameAr,
      nameEn: g.nameEn || '',
      descriptionAr: g.descriptionAr || '',
      descriptionEn: g.descriptionEn || '',
      groupType: g.groupType,
      privacy: g.privacy,
      city: g.city || '',
      memberCount: g.memberCount,
      createdAt: g.createdAt.getTime(),
    }));
    if (docs.length) await this.getIndex(IDX_GROUPS).addDocuments(docs);
  }

  private async seedListings() {
    const listings = await this.prisma.listing.findMany({
      where: { deletedAt: null, status: 'active' },
      select: {
        id: true, titleAr: true, titleEn: true, descriptionAr: true,
        descriptionEn: true, listingType: true, propertyType: true,
        price: true, area: true, bedrooms: true, city: true, district: true,
        compound: true, address: true, status: true, viewCount: true,
        createdAt: true,
      },
    });
    const docs = listings.map((l) => ({
      id: l.id,
      titleAr: l.titleAr,
      titleEn: l.titleEn || '',
      descriptionAr: l.descriptionAr || '',
      descriptionEn: l.descriptionEn || '',
      listingType: l.listingType,
      propertyType: l.propertyType,
      price: Number(l.price),
      area: l.area,
      bedrooms: l.bedrooms,
      city: l.city || '',
      district: l.district || '',
      compound: l.compound || '',
      address: l.address || '',
      status: l.status,
      viewCount: l.viewCount,
      createdAt: l.createdAt.getTime(),
    }));
    if (docs.length) await this.getIndex(IDX_LISTINGS).addDocuments(docs);
  }

  private async seedHashtags() {
    const tags = await this.prisma.hashtag.findMany({
      select: { id: true, tag: true, postCount: true, trendingScore: true },
    });
    if (tags.length) {
      await this.getIndex(IDX_HASHTAGS).addDocuments(
        tags.map((t) => ({ id: t.id, tag: t.tag, postCount: t.postCount, trendingScore: t.trendingScore })),
      );
    }
  }

  // ────────────────────────────────────────────────────
  // UNIFIED SEARCH
  // ────────────────────────────────────────────────────

  async search(dto: SearchQueryDto) {
    const { q, type = SearchType.ALL, offset = 0, limit = 20 } = dto;

    if (type !== SearchType.ALL) {
      return this.searchSingleIndex(q, type, offset, limit);
    }

    // Multi-index search
    const [posts, users, groups, listings, hashtags] = await Promise.all([
      this.searchIndex(IDX_POSTS, q, 0, 5),
      this.searchIndex(IDX_USERS, q, 0, 5),
      this.searchIndex(IDX_GROUPS, q, 0, 5),
      this.searchIndex(IDX_LISTINGS, q, 0, 5),
      this.searchIndex(IDX_HASHTAGS, q, 0, 5),
    ]);

    return {
      posts: posts.hits,
      users: users.hits,
      groups: groups.hits,
      listings: listings.hits,
      hashtags: hashtags.hits,
    };
  }

  private async searchSingleIndex(q: string, type: SearchType, offset: number, limit: number) {
    const indexName = type as string; // type enum matches index names
    const result = await this.searchIndex(indexName, q, offset, limit);

    return {
      [type]: result.hits,
      meta: {
        total: result.estimatedTotalHits,
        offset,
        limit,
      },
    };
  }

  private async searchIndex(
    indexName: string,
    q: string,
    offset: number,
    limit: number,
  ) {
    try {
      const idx = this.getIndex(indexName);
      return await idx.search(q, { offset, limit });
    } catch {
      return { hits: [], estimatedTotalHits: 0 };
    }
  }

  // ────────────────────────────────────────────────────
  // SUGGESTIONS (autocomplete)
  // ────────────────────────────────────────────────────

  async suggest(q: string): Promise<string[]> {
    const suggestions: Set<string> = new Set();

    // Search across multiple indexes, grab top results
    const [postHits, userHits, hashtagHits, listingHits] = await Promise.all([
      this.searchIndex(IDX_POSTS, q, 0, 3),
      this.searchIndex(IDX_USERS, q, 0, 3),
      this.searchIndex(IDX_HASHTAGS, q, 0, 5),
      this.searchIndex(IDX_LISTINGS, q, 0, 3),
    ]);

    // Extract meaningful text from hits
    for (const h of hashtagHits.hits) {
      if ((h as Record<string, unknown>).tag) suggestions.add(String((h as Record<string, unknown>).tag));
    }
    for (const h of listingHits.hits) {
      const rec = h as Record<string, unknown>;
      if (rec.titleAr) suggestions.add(String(rec.titleAr));
    }
    for (const h of userHits.hits) {
      const rec = h as Record<string, unknown>;
      if (rec.nameAr) suggestions.add(String(rec.nameAr));
      if (rec.username) suggestions.add(String(rec.username));
    }
    for (const h of postHits.hits) {
      const rec = h as Record<string, unknown>;
      const text = String(rec.contentText || rec.contentAr || '');
      if (text.length > 0) {
        // Take first 50 chars as a suggestion
        suggestions.add(text.slice(0, 50).trim());
      }
    }

    return Array.from(suggestions).slice(0, 10);
  }

  // ────────────────────────────────────────────────────
  // TRENDING
  // ────────────────────────────────────────────────────

  async getTrending() {
    // Get trending hashtags from DB (already have trendingScore)
    const hashtags = await this.prisma.hashtag.findMany({
      orderBy: { trendingScore: 'desc' },
      take: 20,
      select: { tag: true, postCount: true },
    });

    return hashtags;
  }

  // ────────────────────────────────────────────────────
  // SYNC HELPERS (call from other services on CRUD)
  // ────────────────────────────────────────────────────

  async indexPost(post: {
    id: string;
    contentText: string | null;
    contentAr: string | null;
    postType: string;
    hashtags: string[];
    status: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    groupId: string | null;
    authorId: string;
    authorName: string;
    createdAt: Date;
  }) {
    try {
      await this.getIndex(IDX_POSTS).addDocuments([{
        id: post.id,
        contentText: post.contentText || '',
        contentAr: post.contentAr || '',
        postType: post.postType,
        hashtags: post.hashtags.join(' '),
        status: post.status,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        groupId: post.groupId,
        authorId: post.authorId,
        authorName: post.authorName,
        createdAt: post.createdAt.getTime(),
      }]);
    } catch (err) {
      this.logger.warn(`Failed to index post ${post.id}`, err);
    }
  }

  async removePost(id: string) {
    try {
      await this.getIndex(IDX_POSTS).deleteDocument(id);
    } catch (err) {
      this.logger.warn(`Failed to remove post ${id} from index`, err);
    }
  }

  async indexUser(user: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    permissionTier: string;
    role: string;
    followerCount: number;
    createdAt: Date;
  }) {
    try {
      await this.getIndex(IDX_USERS).addDocuments([{
        id: user.id,
        nameAr: user.nameAr,
        nameEn: user.nameEn || '',
        username: user.username || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl,
        permissionTier: user.permissionTier,
        role: user.role,
        followerCount: user.followerCount,
        createdAt: user.createdAt.getTime(),
      }]);
    } catch (err) {
      this.logger.warn(`Failed to index user ${user.id}`, err);
    }
  }

  async indexListing(listing: {
    id: string;
    titleAr: string;
    titleEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    listingType: string;
    propertyType: string;
    price: number;
    area: number;
    bedrooms: number | null;
    city: string | null;
    district: string | null;
    compound: string | null;
    address: string | null;
    status: string;
    viewCount: number;
    createdAt: Date;
  }) {
    try {
      await this.getIndex(IDX_LISTINGS).addDocuments([{
        id: listing.id,
        titleAr: listing.titleAr,
        titleEn: listing.titleEn || '',
        descriptionAr: listing.descriptionAr || '',
        descriptionEn: listing.descriptionEn || '',
        listingType: listing.listingType,
        propertyType: listing.propertyType,
        price: listing.price,
        area: listing.area,
        bedrooms: listing.bedrooms,
        city: listing.city || '',
        district: listing.district || '',
        compound: listing.compound || '',
        address: listing.address || '',
        status: listing.status,
        viewCount: listing.viewCount,
        createdAt: listing.createdAt.getTime(),
      }]);
    } catch (err) {
      this.logger.warn(`Failed to index listing ${listing.id}`, err);
    }
  }

  async removeListing(id: string) {
    try {
      await this.getIndex(IDX_LISTINGS).deleteDocument(id);
    } catch (err) {
      this.logger.warn(`Failed to remove listing ${id} from index`, err);
    }
  }

  async indexGroup(group: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    groupType: string;
    privacy: string;
    city: string | null;
    memberCount: number;
    createdAt: Date;
  }) {
    try {
      await this.getIndex(IDX_GROUPS).addDocuments([{
        id: group.id,
        nameAr: group.nameAr,
        nameEn: group.nameEn || '',
        descriptionAr: group.descriptionAr || '',
        descriptionEn: group.descriptionEn || '',
        groupType: group.groupType,
        privacy: group.privacy,
        city: group.city || '',
        memberCount: group.memberCount,
        createdAt: group.createdAt.getTime(),
      }]);
    } catch (err) {
      this.logger.warn(`Failed to index group ${group.id}`, err);
    }
  }

  async indexHashtag(hashtag: { id: string; tag: string; postCount: number; trendingScore: number }) {
    try {
      await this.getIndex(IDX_HASHTAGS).addDocuments([hashtag]);
    } catch (err) {
      this.logger.warn(`Failed to index hashtag ${hashtag.tag}`, err);
    }
  }

  // ────────────────────────────────────────────────────
  // ADMIN: Re-index all
  // ────────────────────────────────────────────────────

  async reindexAll() {
    // Clear all indexes
    for (const name of Object.keys(INDEX_CONFIG)) {
      try {
        await this.getIndex(name).deleteAllDocuments();
      } catch {
        // ignore
      }
    }
    await this.seedAllIndexes();
    return { message: 'All indexes re-indexed' };
  }

  // ────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────

  private getIndex(name: string): MeiliIndex {
    const idx = this.indexes.get(name);
    if (!idx) {
      // Fallback: get from client directly
      if (this.client) return this.client.index(name);
      throw new Error(`Search index "${name}" not available`);
    }
    return idx;
  }
}
