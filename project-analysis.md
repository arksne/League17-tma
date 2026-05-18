# Project Analysis — PokeMatrix (League17-tma)

## Overview

Pokemon-themed Telegram Mini App (TMA). Single-page application (SPA) built with vanilla JS + Vite 8 + Express 5 + better-sqlite3. Deployed on Railway with persistent volume for SQLite data.

- **Frontend**: Vanilla JS SPA, Vite 8 build, ESM modules
- **Backend**: Express 5, better-sqlite3 (WAL mode), Socket.IO
- **Deploy**: Railway, auto-deploy from git push to main, volume at `/app/data`
- **Auth**: Telegram → JWT → `req.userId` for all API calls

---

## Architecture

### Frontend (`main.js` + `src/`)

`main.js` is the central hub — defines all core game state, UI rendering, and re-exports functions used by `src/` modules. This creates a **state bridge pattern**: `src/` modules import from `main.js` to access shared state.

**Module structure:**

| Path | Purpose |
|------|---------|
| `main.js` | Core game logic, state, UI rendering, profile, PC, team, breeding, save/load |
| `src/battle/core.js` | Battle engine — wild, gym, elite, champion battles; moves, weather, status effects |
| `src/battle/state.js` | Shared mutable battle state object |
| `src/data/items.js` | Item definitions (balls, healing items, evolution stones, etc.) |
| `src/data/natures.js` | 25 natures with `{ name, buff, nerf }` |
| `src/data/regions.js` | Region/location data with encounter tables |
| `src/data/gyms.js` | Gym leader data |
| `src/data/starters.js` | Starter pokemon by generation |
| `src/data/training.js` | Training stages |
| `src/data/drops.js` | Monster drop tables |
| `src/data/stones.js` | Evolution stone mappings |
| `src/data/transport.js` | Transport hubs between regions |
| `src/data/npc.js` | NPC data |
| `src/ui/inventory.js` | Inventory display, items, egg hatching |
| `src/ui/chat.js` | In-game chat |
| `src/ui/evolution.js` | Evolution logic and UI |
| `src/ui/map.js` | Game map |
| `src/ui/nickname.js` | Pokemon nickname editing |
| `src/ui/pokedex.js` | Pokedex |
| `src/ui/shop.js` | Shop system |
| `src/ui/tm.js` | TM/move system |
| `src/ui/trainers.js` | Trainer profiles |
| `src/ui/levelup_moves.js` | Level-up move checking |

### Backend (`server/`)

| Path | Purpose |
|------|---------|
| `server/index.js` | Express app setup, static serving, SPA fallback, WAL checkpointing, graceful shutdown |
| `server/db.js` | better-sqlite3 with WAL mode, async wrapper, table schemas, migrations |
| `server/auth.js` | Telegram init data verification (HMAC-SHA256) |
| `server/routes/auth.js` | Telegram auth → create user → JWT |
| `server/routes/save.js` | Load/save game data (GET/POST) |
| `server/routes/admin.js` | Admin panel API (reset, give mon, edit mon, etc.) |
| `server/routes/admin.html` | Admin panel UI |
| `server/routes/chat.js` | Chat bot (Claude AI integration) |
| `server/routes/leaderboard.js` | Leaderboard |
| `server/routes/profile.js` | User profiles |
| `server/socket.js` | Socket.IO setup |

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | SPA shell with all UI sections (profile, team, PC, battle, shop, etc.) |
| `style.css` | All styles, Telegram theme variables, TM/HM grid, move-type colors, genecode display |
| `vite.config.js` | Vite config with API/WebSocket proxy for dev |
| `railway.json` | Railway build/deploy config (Nixpacks, `node server/index.js`) |

---

## Data Flow

### Authentication
1. Telegram opens TMA → `tg.initDataUnsafe` → sent to `/api/auth/telegram`
2. Server verifies HMAC-SHA256 signature → looks up or creates `users` row
3. Returns JWT with `user.id` (DB auto-increment ID)
4. Frontend stores JWT in `localStorage` (`league17_tg_token`), sends as `Authorization: Bearer` header

### Save System
- **Save**: `POST /api/save` — sends entire game state as JSON
- **Load**: `GET /api/save` — returns compressed or full save data
- **Storage**: `game_saves` table, `user_id` foreign key, `save_data` TEXT column
- **Trainer ID**: `users.id` (DB auto-increment) used for all data ownership
- **Persistence**: Railway volume `league17-tma-volume` at `/app/data` survives deploys
- **Save versioning**: `_v` field tracks save version, cloud sync checks before overwrite

### Cloud Save Sync
- On init: `cloudLoad()` → `applyCloudSave(cloudData)` → `saveGame()` (line 952-983)
- `applyCloudSave()` (line 3666-3720): if `cloudV > saveVersion && cloudV > 0`, applies server data
- Version check: `if (cloudV !== undefined && cloudV > 0 && cloudV <= saveVersion) return;`
- **Known limitation** (fixed 2026-05-18): `eggs = data.eggs || eggs` overwrote local eggs with empty array `[]` from server. Fixed to `data.eggs && data.eggs.length > 0 ? data.eggs : eggs` at line 3704.

### State Bridge
- `main.js` holds all global state: `myTeam[]`, `pcBoxes[][]`, `eggs[]`, `inventory`, `money`, etc.
- `src/` modules import `{ getTeamState, getInvState, ... }` from `main.js`
- `getTeamState()` returns `{ myTeam, currentPokemonIndex, ... }`
- `getInvState()` returns `{ money, eggs, ITEMS, trainingStages, expShareActive }`

### Pokemon Data Model
```js
{
  uid: String,           // unique ID (timestamp-based + random)
  originalTrainer: String, // getTrainerId() at creation time
  apiData: Object,       // PokeAPI response (name, sprites, types, stats, moves, abilities)
  ivs: { hp, atk, def, spa, spd, spe },
  evs: { hp, atk, def, spa, spd, spe },
  baseLevel: Number,
  candiesEaten: Number,
  vitaminsEaten: Number,
  natureIdx: Number,     // index into natures[]
  breedLetter: String,   // 'A'|'B'|'C'|'D'|'S'
  gender: 'male'|'female'|null,
  happiness: Number,
  trainingStage: Number,
  trainingStat: String,
  heldItem: String|null,
  status: String|null,
  isShiny: Boolean,
  isEgg: Boolean,
  hasBred: Boolean,
  movesPP: Array,
  learnableMoves: Array,
  berries: Object
}
```

---

## Key Features

### Battles
- Wild encounters with weighted spawn tables per location
- Gym battles (multi-pokemon), Elite 4, Champion
- Weather system, status effects, stat stages
- Move categories: physical (red), special (blue), status (green) — colored in UI
- Auto-hunt mode, fishing with rods

### Breeding & Egg System
- PC boxes with breeding pairs (same egg group, opposite gender)
- Egg timer 3-8 days (random), faster if same nature (same natureIdx)
- Permanent breed mark (`hasBred`) — once paired, never again
- Eggs stored in `eggs[]` array with `{ uid, species, types, ivs, readyTime, boxIdx, parent1Uid, parent2Uid, inTeam }`
- Egg display in inventory: genecode, type-colored background, egg sprite, hatch timer
- **IV Inheritance** (added 2026-05-18):
  - Each IV stat = average of both parents' IVs for that stat
  - Random ±2 modifier per stat (clamped 0-31)
  - Replaces previous fully-random 0-31 assignment

### Natures
- 25 natures total, each buffs one stat (+10%) and nerfs another (-10%)
- Displayed in profile with green ↑ / red ↓ indicators
- Nature index 0 = Hardy (neutral — no buff/nerf)

### Items
- Pokeballs, healing items, evolution stones, training items, TMs
- Item sprites from Pokemon Showdown sprite repository
- Crafting system

### Admin Panel (`/admin`)
- Reset user save, give pokemon, edit pokemon by UID
- Full mon editor: species, level, shiny, gender, nature, HP, held item, IVs, EVs, candies, vitamins, happiness, training, status, breed letter, sterile flag
- Raw JSON editor for direct save data manipulation
- Chat bot with Claude AI

---

## Save Data (localStorage key pattern)
- `league17_save_<trainerId>` — full game state as JSON
- `league17_tg_token` — JWT for Telegram auth
- `league17_trainer_id` — fallback trainer ID for non-Telegram mode
- Dev mode via `?dev` query parameter

---

## Deployment
- **Host**: Railway (railway.app)
- **URL**: `https://league17-tma-production-34d4.up.railway.app`
- **Build**: Vite builds to `dist/`, committed to git
- **Deploy**: git push to main → Railway auto-deploy
- **Data**: Volume `league17-tma-volume` at `/app/data` (SQLite WAL mode)
- **Server**: Express serves `dist/` statically, proxies API routes

---

## Style System
- CSS variables from Telegram theme (`var(--tma-bg-color)`, `var(--tma-primary)`, etc.)
- Type-based coloring for pokemon cards (gradient backgrounds)
- Move type colors: physical `#ff6b4a`, special `#4a9eff`, status `#4ade80`
- Egg type coloring via `getTypeColor()` with radial gradient overlays
- Responsive grid layout for PC boxes, team, inventory

---

## External APIs
- **PokeAPI** (`https://pokeapi.co/api/v2/`) — pokemon species data, moves, abilities, sprites
- **Pokemon Showdown** sprites — pokemon icons, item icons, egg sprite
- **Telegram** — TMA init data, user info

---

## AI Bot Integration
- Claude AI bot (user ID 0, username `Claude_AI`)
- Responds in chat with pokemon-related help
- Can give pokemon via admin commands in chat
- Mention triggers: `@Claude_AI` or reply to bot messages
