import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Meilisearch, type Index } from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';

// PROD-3: Meilisearch integration. Indexes published listings into a lean,
// typo-tolerant, Arabic-friendly index and answers the `q` free-text query.
// Config-gated: when MEILISEARCH_URL is unset (or the host is unreachable), the
// service reports `enabled=false` and the listings service falls back to the DB
// `contains` filter  -  so dev/CI/mock need zero setup.

const INDEX = 'properties';

export interface SearchDoc {
  id: string;
  title: string;
  area: string;
  address: string;
  type: string; // Arabic
  listingType: string;
  price: number;
  trust: number;
  verified: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: Meilisearch | null = null;
  private index: Index<SearchDoc> | null = null;
  private ready = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const host = this.config.get<string>('MEILISEARCH_URL');
    if (host) {
      this.client = new Meilisearch({
        host,
        apiKey: this.config.get<string>('MEILISEARCH_API_KEY'),
      });
    }
  }

  // Configure the index settings + do an initial sync. Best-effort: a Meili
  // outage must never block API startup.
  async onModuleInit() {
    if (!this.client) {
      this.logger.log('Meilisearch not configured; search falls back to the DB filter.');
      return;
    }
    try {
      await this.client.health();
      await this.client.createIndex(INDEX, { primaryKey: 'id' }).catch(() => undefined);
      const index = this.client.index<SearchDoc>(INDEX);
      this.index = index;
      await index.updateSettings({
        searchableAttributes: ['title', 'area', 'address', 'type'],
        filterableAttributes: ['listingType', 'type', 'verified', 'price'],
        sortableAttributes: ['price', 'trust'],
      });
      this.ready = true;
      await this.reindexAll();
      this.logger.log('Meilisearch ready (index: properties).');
    } catch (err) {
      this.logger.warn(`Meilisearch unavailable; using the DB fallback. (${String(err)})`);
    }
  }

  get enabled(): boolean {
    return this.ready && this.index !== null;
  }

  // Search published listings by free text. Returns matching ids in relevance
  // order (the listings service hydrates them from the DB). `limit` is generous
  // so downstream filters/pagination still have material to work with.
  async searchIds(query: string, limit = 100): Promise<string[]> {
    if (!this.enabled || !query.trim()) return [];
    try {
      const res = await this.index!.search(query, { limit, attributesToRetrieve: ['id'] });
      return res.hits.map((h) => h.id);
    } catch (err) {
      this.logger.warn(`Meili search failed; ignoring query. (${String(err)})`);
      return [];
    }
  }

  // Upsert one listing's search doc (called after a write). No-op when disabled.
  async indexOne(doc: SearchDoc): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.index!.addDocuments([doc]);
    } catch (err) {
      this.logger.warn(`Meili index failed for ${doc.id}. (${String(err)})`);
    }
  }

  async removeOne(id: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.index!.deleteDocument(id);
    } catch {
      /* best-effort */
    }
  }

  // Full reindex from the DB (published, not-deleted). Runs on boot + can be
  // triggered manually.
  async reindexAll(): Promise<{ indexed: number }> {
    if (!this.enabled) return { indexed: 0 };
    const rows = await this.prisma.property.findMany({
      where: { status: 'published', deletedAt: null },
      select: {
        id: true,
        title: true,
        area: true,
        address: true,
        type: true,
        listingType: true,
        price: true,
        trust: true,
        verified: true,
      },
    });
    const docs: SearchDoc[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      area: r.area,
      address: r.address,
      type: this.typeToArabic(r.type),
      listingType: r.listingType,
      price: r.price,
      trust: r.trust,
      verified: r.verified,
    }));
    if (docs.length) await this.index!.addDocuments(docs);
    return { indexed: docs.length };
  }

  // Build a SearchDoc from a fresh DB row (used by the write paths).
  async indexById(propertyId: string): Promise<void> {
    if (!this.enabled) return;
    const r = await this.prisma.property.findFirst({
      where: { id: propertyId, status: 'published', deletedAt: null },
      select: {
        id: true,
        title: true,
        area: true,
        address: true,
        type: true,
        listingType: true,
        price: true,
        trust: true,
        verified: true,
      },
    });
    // Not published (or gone) -> ensure it's out of the index.
    if (!r) return this.removeOne(propertyId);
    await this.indexOne({
      id: r.id,
      title: r.title,
      area: r.area,
      address: r.address,
      type: this.typeToArabic(r.type),
      listingType: r.listingType,
      price: r.price,
      trust: r.trust,
      verified: r.verified,
    });
  }

  private typeToArabic(t: string): string {
    return t === 'apartment' ? 'شقة' : t === 'room' ? 'أوضة' : t === 'bed' ? 'سرير' : t;
  }
}
