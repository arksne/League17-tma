import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/lib/schema.ts',
  out: './server/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/game.db',
  },
});
