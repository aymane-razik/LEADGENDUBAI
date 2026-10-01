module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/services/scoring.service.ts',
    'src/services/deduplication.service.ts',
    'src/utils/crypto.ts',
    'src/utils/validator.ts',
    'src/domain/lead/scoring.ts',
    'src/domain/lead/dedup.ts',
    'src/domain/lead/status-machine.ts',
    'src/domain/lead/assignment.ts',
    'src/domain/property/analytics.ts',
    'src/domain/campaign/execution.ts',
    'src/domain/user/metrics.ts',
    'src/webhooks/dispatcher.ts',
    'src/analytics/materialized.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
