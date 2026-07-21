// Jest mock for the meilisearch ESM package (ts-jest can't transform its pure
// ESM build). Tests don't exercise real search  -  the e2e uses the DB fallback
// (SearchService stays disabled because health()/init rejects against this mock),
// and the unit tests never touch it. This just satisfies the import + types.
export class Meilisearch {
  health(): Promise<never> {
    return Promise.reject(new Error('meili mocked (disabled in tests)'));
  }
  createIndex(): Promise<unknown> {
    return Promise.resolve({});
  }
  index(): unknown {
    return {};
  }
}

export class Index {}
export type MeilisearchApiError = Error;
