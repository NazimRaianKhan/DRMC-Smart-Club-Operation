const workspaceConfig = [
  {
    extends: 'vitest.config.ts',
    test: {
      name: 'unit',
      include: ['tests/unit/**/*.test.ts'],
    },
  },
  {
    extends: 'vitest.config.ts',
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.test.ts'],
    },
  },
];

export default workspaceConfig;
