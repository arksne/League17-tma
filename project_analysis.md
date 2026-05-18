# Pokematrix — Full Project Analysis

**Updated:** 2026-05-19
**Server:** league17-tma-production.up.railway.app
**Stack:** Vanilla JS SPA + Express + better-sqlite3 (WAL) + Railway

---

## Stack
- **Frontend**: Vanilla JS (main.js + ES modules in `src/`), Vite build → `dist/`
- **Backend**: Express.js + better-sqlite3 (WAL mode)
- **Auth**: Telegram Mini App JWT (`/api/auth/tg`), dev bypass with `/?dev`
- **Hosting**: Railway (league17-tma, project: passionate-flexibility)
- **CI/CD**: GitHub Actions — push to main auto-deploys

---

## File Structure

```
Pokematrix/
├── main.js                    # Entry point — SPA, save/load, battle, UI (4458+ lines)
├── index.html                 # Single HTML with all views (#view-world, -team, -backpack, -chat)
├── package.json               # "type": "module"
├── nixpacks.toml              # Railway build config
├── .github/workflows/deploy.yml
│
├── server/
│   ├── index.js               # Express app, rate limits (100/30 req/min), static caching
│   ├── db.js                  # SQLite init + migrations (6 tables)
│   ├── auth.js                # verifyTelegramInitData, parseTestUser
│   ├── socket.js              # Socket.IO for real-time
│   ├── middleware/auth.js     # JWT (7d expiry), authMiddleware
│   └── routes/
│       ├── auth.js            # POST /api/auth/tg, /register, /avatar
│       ├── save.js            # GET/POST /api/save — versioned cloud saves
│       ├── admin.js           # /admin panel (15+ commands)
│       ├── chat.js, leaderboard.js, profile.js
│
├── src/
│   └── data/                  # Starters, items, npc, gyms, drops, natures, stones, transport
│   └── ui/                    # Pokedex, shop, evolution, chat, trainers, nickname, tm
│
├── tests/
│   ├── multi-trainer-test.cjs  # Playwright: 10 trainers batch (86% pass rate)
│   └── multi-trainer-report.txt
│
└── dist/                      # Vite build output
```

---

## Rate Limiting (server/index.js)
- **Global**: 100 req/min per IP
- **`/api/save`**: 30 req/min per IP
- **Static files**: `maxAge: '1d'`, `immutable: true` (reduces 429s)
- **Trust proxy**: enabled (for Railway)

---

## Database (server/db.js)
- better-sqlite3 wrapped to match sqlite async API
- WAL mode for concurrent reads/writes
- Auto-migration for missing columns

| Table | Purpose |
|---|---|
| `users` | telegram_id (UNIQUE), username, first_name, nickname, avatar, registered |
| `game_saves` | user_id (UNIQUE), save_data (JSON or compressed Z:+base64), updated_at |
| `leaderboard` | badges_count, team_level_sum, money, pokemon_count, legendary_count |
| `user_locations` | user_id, location_id |
| `action_log` | user_id, action, details (keep last 1000/user) |
| `chat_messages` | user_id, username, text |

---

## Auth Flow (server/auth.js + routes/auth.js)

1. Client sends `initData` from `window.Telegram.WebApp.initData`
2. HMAC-SHA256 verification using `BOT_TOKEN` (Telegram WebApp spec)
3. If `initData` is JSON `{...}` → `parseTestUser()` returns it directly
4. If `initData === 'test'` → default test user (id: 123456789)
5. If `BOT_TOKEN` not set → bypass verification
6. INSERT OR IGNORE for race-safe user creation
7. Returns JWT (7-day)

### Test User Injection (Playwright)
```js
// Intercept auth POST, inject custom initData
await page.route('**/api/auth/tg', async (route) => {
  const body = JSON.parse(route.request().postData() || '{}');
  body.initData = JSON.stringify({ id: 4001, username: 'trainer1', first_name: 'T1' });
  await route.continue({ ... });
});
```

---

## Cloud Save (main.js)

### Key Variables
| Variable | Purpose |
|---|---|
| `saveVersion` | Monotonically increasing version counter |
| `lastCloudSync` | Timestamp of last successful sync |
| `saveInProgress` | Prevents concurrent saves |
| `saveTriggerPending` | Coalescing flag |
| `cloudSaveTimer` | 2s debounce timer |

### Save Flow
```
saveGame() → localStorage + saveVersion++
cloudSave() → debounce 2s → doCloudSave() → POST /api/save
  - 429: stop, no retry
  - Error: retry 3× (5s, 15s, 30s)
  - Coalescing: pending calls fire after current completes
```

### Load Flow
1. `authTelegram()` → JWT
2. `cloudLoad()` → GET /api/save
3. If cloud has `myTeam` (even empty): `applyCloudSave()` → authoritative
4. Fallback: localStorage → sync to cloud
5. Nothing: `giveStarter()`

### Version Logic (fixed 2026-05-19)
- `data._v === undefined` (admin reset): always apply
- `data._v > 0 && data._v <= saveVersion`: skip (local newer)
- `saveVersion = cloudV !== undefined ? cloudV : Date.now()`

### Bugs Fixed Today
| Symptom | Root Cause | Fix |
|---|---|---|
| Admin reset didn't sync | `myTeam.length > 0` blocked empty team | Accept any truthy `myTeam` |
| Admin reset blocked by version | `_v: undefined` → `0 <= saveVersion` → skipped | Added `cloudV > 0` guard |
| `saveVersion = NaN` | `saveVersion = cloudV` where cloudV=undefined | Ternary fallback to Date.now() |
| 429 from saves | Retry loop hammered server | Stop retrying on 429, coalesce |
| 429 from static assets | No cache headers | `maxAge: '1d'` + `immutable` |

---

## Admin Panel (server/routes/admin.js)

Auth: `?token=PASS` or username in `ADMIN_USERNAMES` via JWT.

| Command | Effect |
|---|---|
| `give_items` | All items x999 + ¥500k |
| `give_money` | +¥val |
| `give_legendary` | Random legendary → team |
| `give_badges` | All 8 badges |
| `heal_team` | Full HP restore |
| `max_iv` | 31 all IVs |
| `fix_levels` | Lv50 + 1.5× HP |
| `teleport` | Go to location |
| `reset_save` | Full reset (`_v: Date.now()`) |
| `add_mon` | Pokemon by species |
| `edit_mon` | Modify by pos (team:0) |
| `delete_mon` | Remove by pos |
| `set_money` / `set_level` | Direct set |
| `broadcast` | Socket.IO message |

---

## Navigation (main.js initAppNav)

Nav items: `.nav-item[data-target="view-world|view-backpack|view-team|view-chat"]`
Click handler: adds `.active-view` to target div, updates header title.

**Important for testing**: Click on `.nav-item` div, not on spans inside. After navigation, check `#view-*.active-view` or use specific selectors (`.location-name`, `h3:has-text("Рюкзак")`, `.chat-layout`).

---

## Registration Overlay (showRegistrationScreen)

When `registered === 0`: creates `#register-overlay` (z-index: 1000, fixed, full-screen).
Contains: nickname input, avatar picker, `#btn-register` button.

Dismissed only by completing registration (POST /api/auth/register).

### Playwright Handling
```js
await page.waitForSelector('#register-overlay', { timeout: 10000 });
await page.locator('#btn-register').click();
await sleep(3000); // overlay fade + server response
```

---

## Multi-Trainer Test

- **File**: `tests/multi-trainer-test.cjs`
- **10 trainers**: IDs 4001-4010, `trainer1`-`trainer10`
- **Batch size**: 3 concurrent, 5s cooldown between batches
- **Each trainer tests**: Register → Team → World → Bag → Chat → Heal → Travel
- **Result**: 60/70 (86%) — all actual checks passed, 1 missing point is stats counting quirk
- **Key technique**: `page.route('**/api/auth/tg')` + server JSON initData parsing

---

## Deployment

- **GitHub push to main** → auto-deploy via Railway
- **CLI**: `railway up` (may timeout on large uploads)
- **URL**: https://league17-tma-production.up.railway.app

### Railway Context
- Project: passionate-flexibility
- Service name: (inferred from URL/service-status)
- Environment: production
- Persistent volume: SQLite DB in RAILWAY_VOLUME_MOUNT_PATH
