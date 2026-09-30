import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests shell out to the bundled FFmpeg; give them room.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: 'forks',
  },
})
