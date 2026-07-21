import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from './search.service';

// TEST-1: SearchService disabled-path. With no MEILISEARCH_URL the service must
// stay disabled and degrade gracefully  -  `enabled=false`, `searchIds` returns
// [], and index/remove are no-ops  -  so dev/CI/mock need zero Meili setup.
// (The live indexing path is covered by the running API + PROD-3's manual smoke.)

function makeService(): SearchService {
  const config = { get: () => undefined } as unknown as ConfigService;
  const prisma = {
    property: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;
  return new SearchService(config, prisma);
}

describe('SearchService (disabled / DB-fallback)', () => {
  let service: SearchService;

  beforeEach(() => {
    service = makeService();
  });

  it('is disabled without MEILISEARCH_URL', async () => {
    await service.onModuleInit();
    expect(service.enabled).toBe(false);
  });

  it('searchIds returns [] when disabled (callers use the DB contains fallback)', async () => {
    await expect(service.searchIds('معادي')).resolves.toEqual([]);
  });

  it('indexById / removeOne are no-ops when disabled (never throw)', async () => {
    await expect(service.indexById('p1')).resolves.toBeUndefined();
    await expect(service.removeOne('p1')).resolves.toBeUndefined();
  });

  it('reindexAll reports zero indexed when disabled', async () => {
    await expect(service.reindexAll()).resolves.toEqual({ indexed: 0 });
  });
});
