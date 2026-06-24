// The `meilisearch` package (0.57) only declares an `exports` map, which the
// API's classic `node` moduleResolution can't read for types. The runtime
// (Node ESM/CJS interop) resolves the bare specifier fine; this shim just points
// TypeScript at the real declarations so `import ... from 'meilisearch'` types.
declare module 'meilisearch' {
  export * from 'meilisearch/dist/index.js';
}
