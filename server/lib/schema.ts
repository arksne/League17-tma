/**
 * Drizzle ORM schema — mirrors current SQLite database structure.
 * Used as source of truth for drizzle-kit migrations.
 */
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ── Users ────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull().unique(),
  username: text('username').default(''),
  firstName: text('first_name').default(''),
  nickname: text('nickname').default(''),
  avatar: text('avatar').default('👤'),
  starterPokemon: text('starter_pokemon').default(''),
  registered: integer('registered').default(0),
  createdAt: text('created_at').default("datetime('now')"),
  registeredAt: text('registered_at').default(''),
});

// ── Game Saves ────────────────────────────────────────
export const gameSaves = sqliteTable('game_saves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  saveData: text('save_data').notNull(),
  updatedAt: text('updated_at').default("datetime('now')"),
});

// ── Leaderboard ───────────────────────────────────────
export const leaderboard = sqliteTable('leaderboard', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  badgesCount: integer('badges_count').default(0),
  teamLevelSum: integer('team_level_sum').default(0),
  money: integer('money').default(0),
  pokemonCount: integer('pokemon_count').default(0),
  legendaryCount: integer('legendary_count').default(0),
  updatedAt: text('updated_at').default("datetime('now')"),
});

// ── User Locations ────────────────────────────────────
export const userLocations = sqliteTable('user_locations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  locationId: text('location_id').notNull(),
  updatedAt: text('updated_at').default("datetime('now')"),
});

// ── Action Log ─────────────────────────────────────────
export const actionLog = sqliteTable('action_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  details: text('details').default(''),
  createdAt: text('created_at').default("datetime('now')"),
});

// ── Chat Messages ──────────────────────────────────────
export const chatMessages = sqliteTable('chat_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  username: text('username').default(''),
  firstName: text('first_name').default(''),
  text: text('text').notNull(),
  createdAt: text('created_at').default("datetime('now')"),
});

// ── PokeAPI Cache ──────────────────────────────────────
export const pokeApiCache = sqliteTable('pokeapi_cache', {
  url: text('url').primaryKey(),
  data: text('data').notNull(),
  cachedAt: text('cached_at').default("datetime('now')"),
});

// ── PvP Ratings ────────────────────────────────────────
export const pvpRatings = sqliteTable('pvp_ratings', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  rating: integer('rating').default(1000),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
});

// ── Player Quests ──────────────────────────────────────
export const playerQuests = sqliteTable('player_quests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  questId: text('quest_id').notNull(),
  progress: integer('progress').default(0),
  completed: integer('completed').default(0),
  claimed: integer('claimed').default(0),
  createdAt: text('created_at').default("datetime('now')"),
}, (table) => ({
  userQuestUnique: uniqueIndex('uq_player_quests').on(table.userId, table.questId),
}));

// ── Achievements ───────────────────────────────────────
export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: text('unlocked_at').default("datetime('now')"),
}, (table) => ({
  userAchievementUnique: uniqueIndex('uq_achievements').on(table.userId, table.achievementId),
}));

// ── Player Inventory (normalized) ───────────────────────
export const playerInventory = sqliteTable('player_inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').default(0),
}, (table) => ({
  userItemUnique: uniqueIndex('uq_player_inventory').on(table.userId, table.itemId),
}));

// ── Player Badges (normalized) ─────────────────────────
export const playerBadges = sqliteTable('player_badges', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  badgeId: text('badge_id').notNull(),
  unlockedAt: text('unlocked_at').default("datetime('now')"),
}, (table) => ({
  userBadgeUnique: uniqueIndex('uq_player_badges').on(table.userId, table.badgeId),
}));

// ── Refresh Tokens ─────────────────────────────────────
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default("datetime('now')"),
});

// ── Save Backups ───────────────────────────────────────
export const saveBackups = sqliteTable('save_backups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  saveData: text('save_data').notNull(),
  savedAt: text('saved_at').default("datetime('now')"),
});
