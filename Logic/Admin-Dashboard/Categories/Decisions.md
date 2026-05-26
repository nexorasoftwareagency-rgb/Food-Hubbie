## Decisions.md

- Categories stored at outlet level (not shared across outlets) — each outlet has independent category set
- `addons:null` explicitly stored — ensures field exists even if no addons defined
- No edit modal — delete-and-recreate pattern for simplicity
- Display order stored as Number — enables manual sorting
