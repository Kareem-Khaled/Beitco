module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  // Coverage focuses on the LOGIC worth gating (services, serializers, engines,
  // mappers). Boilerplate covered by the e2e suite or trivially typed  - 
  // controllers, DTOs, modules, the gateway, bootstrap, type shims  -  is excluded
  // so the floor reflects real branch coverage, not framework wiring.
  collectCoverageFrom: [
    '**/*.service.ts',
    '**/*.serializer.ts',
    '**/*.engine.ts',
    '**/*.mapper.ts',
    '**/config/*.ts',
    '!**/*.module.ts',
    '!main.ts',
    '!instrument.ts',
    '!**/prisma.service.ts',
  ],
  coverageDirectory: '../coverage',
  // A ratchet, not a target: the floor sits just below current (~57% stmts /
  // 45% branches on the logic files) so it can only go up  -  it blocks
  // regressions without breaking the build. Bump it as coverage rises.
  coverageThreshold: {
    global: { statements: 55, branches: 42, functions: 50, lines: 55 },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // meilisearch ships pure ESM that ts-jest can't transform; mock it (tests
    // use the DB search fallback).
    '^meilisearch$': '<rootDir>/../test/mocks/meilisearch.ts',
  },
};
