# `bot-reference-dummy/` — Archived Reference Bot Project

This directory holds a **duplicate of the WhatsApp bot project** that was
sitting at the repo root under the name
`Dummy Bot Data to Study the Logic/`. It has been moved here for
hygiene; it is **not** a runtime artifact and is **not** used by the
live bot or by any seeder.

---

## What is in here

```
bot-reference-dummy/
├── ecosystem.config.js
├── firebase.js
├── index.js
├── package.json
├── package-lock.json
├── bot/
│   ├── ecosystem.config.js
│   ├── firebase.js
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
└── session_data/   (empty)
```

- `index.js` is a ~90 KB Baileys-based bot entry — useful only as a
  study reference for WhatsApp message routing logic.
- `firebase.js` is a duplicate of an older Firebase Admin bootstrap.
- `ecosystem.config.js` is a duplicate PM2 config.
- `session_data/` is empty and exists only because WhatsApp auth
  creds would normally live there.

> The folder is a **reference clone** (likely a tutorial or older
> revision of the real `bot/` app). The canonical, multi-tenant bot
> lives at `bot/` in the repo root.

---

## Dead `extracted_pizza_data.json` reference

The deprecation wrapper `ingest-pizza-data.js` historically defaulted
its fixture path to a hardcoded Windows path that **never existed on
disk**:

```
d:\Foodhubbie\extracted_pizza_data.json
```

There is no extracted menu fixture anywhere in the repo. The
canonical, parameterized seeder is `scripts/seed-business.js`
(see `docs/data-sync.md` for the onboarding runbook).

---

## Why this was archived

1. The folder name `Dummy Bot Data to Study the Logic/` sat at the
   repo root and confused the project layout — it looks like data, but
   is a duplicate source project.
2. It contained a `node_modules/` with hundreds of nested packages
   (~hundreds of MB) which would have polluted the repo if it were
   ever moved into a path that Git tracked.
3. The referenced data file (`extracted_pizza_data.json`) does not
   exist, so nothing here is referenced at runtime.

## What was excluded from the move

- The nested `node_modules/` directory (377 subdirs) was deliberately
  not copied. The existing top-level `.gitignore` rule `node_modules/`
  already excludes it from version control.
- `session_data/` was carried over even though it is empty, to keep
  the archive's structure faithful to the original.

## Do not use files from here in production

If you need the bot's behavior, read the source from `bot/` (the
canonical location). Files in this directory are kept only as a
historical reference and may be out of date, may have hardcoded
secrets, or may use deprecated Firebase Admin SDK calls.
