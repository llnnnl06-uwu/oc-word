# OC Word

OC (Original Character) worldbuilding journal for writers/artists/animators.
Node.js + Express + MongoDB backend, vanilla JS frontend.

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB running at `mongodb://127.0.0.1:27017`

### Install & Run
```bash
npm install
npm start        # node server/server.js
# or
npm run dev      # nodemon (auto-reload)
```
Open http://localhost:3000

Database: `artquest_db`

## API Endpoints

Base URL: `http://localhost:3000/api`

### Health
- `GET /api/health` → `{ ok: true }`

### Characters
- `GET /api/characters` → list all OCs
- `POST /api/characters` → create OC (body: character fields)
- `PATCH /api/characters/:id` → update OC
- `DELETE /api/characters/:id` → delete OC

### Gallery (OC album)
- `GET /api/gallery/:charId` → list images for an OC
- `POST /api/gallery` → add image `{ charId, imageUrl, caption }`
- `DELETE /api/gallery/:id` → delete image

### Items
- `GET /api/items` → list items
- `POST /api/items` → create item
- `PATCH /api/items/:id` → update item
- `DELETE /api/items/:id` → delete item

### Scenes (Lore)
- `GET /api/scenes` → list lore
- `POST /api/scenes` → create lore
- `PATCH /api/scenes/:id` → update lore
- `DELETE /api/scenes/:id` → delete lore

### Songs (Playlist)
- `GET /api/songs` → list songs
- `POST /api/songs` → create song
- `PATCH /api/songs/:id` → update song
- `DELETE /api/songs/:id` → delete song

### Relations
- `GET /api/relations` → list relations
- `POST /api/relations` → create relation
- `DELETE /api/relations/:id` → delete relation

### Profile
- `GET /api/profile` → get profile
- `PUT /api/profile` → update profile

## Frontend
Static files served from `public/`. Main entry: `public/index.html`, logic in `public/script.js`, styles in `public/style.css`.

## Documentation
- `docs/DATABASE.md` — MongoDB schema & ERD
- `docs/LESSONS_LEARNED.md` — lessons learned & future improvements

Frontend currently persists data in `localStorage` for offline use. Server/MongoDB endpoints are available for future sync.
